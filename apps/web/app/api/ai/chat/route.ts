import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import {
  AI_MODEL,
  buildSystemPrompt,
  getAnthropicClient,
  isAIConfigured,
} from '@/lib/ai/anthropic';
import { enforceAIUsageLimit, resolveUserBusinessId } from '@/lib/ai/usage-limits';
import { WEBSITE_EDIT_TOOLS, executeWebsiteEditTool } from '@/lib/ai/tools/websiteEditTool';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Hard cap on how many times one chat turn can round-trip through a tool
 * call before giving up and telling the user, rather than looping
 * indefinitely (and paying for a model call) if the model keeps invoking
 * tools without ever reaching a final answer.
 */
const MAX_TOOL_TURNS = 4;

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(32_000),
      })
    )
    .min(1)
    .max(40),
  agent: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        {
          error: 'AI is not configured',
          hint: 'Add ANTHROPIC_API_KEY to .env.local and restart the dev server.',
        },
        { status: 503 }
      );
    }

    const parsed = chatSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { messages, agent } = parsed.data;
    // Usage is metered per business so one account can't run unlimited paid AI calls.
    const usageBusinessId = await resolveUserBusinessId(supabase);
    if (!usageBusinessId) {
      return NextResponse.json({ error: 'Create a business before using OGMJ AI' }, { status: 403 });
    }
    const usageLimited = await enforceAIUsageLimit(usageBusinessId, 'ai:chat');
    if (usageLimited) return usageLimited;

    const client = getAnthropicClient();
    // Mutable turn-by-turn conversation: grows with the model's own
    // assistant turns (which may be tool_use blocks, not just text) and
    // this route's tool_result replies, in addition to the client's
    // original messages.
    const conversation: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const encoder = new TextEncoder();
    let activeStream: ReturnType<typeof client.messages.stream> | null = null;

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
            const stream = client.messages.stream({
              model: AI_MODEL,
              max_tokens: 16_000,
              thinking: { type: 'adaptive' },
              system: buildSystemPrompt(agent),
              messages: conversation,
              tools: WEBSITE_EDIT_TOOLS,
            });
            activeStream = stream;

            for await (const event of stream) {
              if (
                event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta'
              ) {
                controller.enqueue(encoder.encode(event.delta.text));
              }
            }

            const final = await stream.finalMessage();
            conversation.push({ role: 'assistant', content: final.content });

            if (final.stop_reason !== 'tool_use') {
              controller.close();
              return;
            }

            // Every tool this route exposes is scoped to the chat's own
            // authenticated business (usageBusinessId) — the model never
            // supplies or can widen that scope itself.
            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const block of final.content) {
              if (block.type !== 'tool_use') continue;
              const resultText = await executeWebsiteEditTool(
                supabase,
                usageBusinessId,
                block.name,
                block.input
              );
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: resultText });
            }
            conversation.push({ role: 'user', content: toolResults });
          }

          // Exhausted MAX_TOOL_TURNS without a final (non-tool_use) answer --
          // tell the user plainly rather than just going silent.
          controller.enqueue(
            encoder.encode('\n\n[Stopped after several tool calls without a final answer — try rephrasing your request.]')
          );
          controller.close();
        } catch (error) {
          console.error('AI stream interrupted:', error);
          controller.enqueue(
            encoder.encode('\n\n[The response was interrupted — please try again.]')
          );
          controller.close();
        }
      },
      cancel() {
        activeStream?.abort();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: 'Invalid ANTHROPIC_API_KEY', hint: 'Check the key in .env.local.' },
        { status: 503 }
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: 'AI rate limit reached — try again shortly.' },
        { status: 429 }
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `AI request failed (${error.status})` },
        { status: 502 }
      );
    }
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


