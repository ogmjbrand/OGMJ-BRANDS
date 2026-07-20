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

export const runtime = 'nodejs';
export const maxDuration = 300;

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
    const client = getAnthropicClient();

    const stream = client.messages.stream({
      model: AI_MODEL,
      max_tokens: 64_000,
      thinking: { type: 'adaptive' },
      system: buildSystemPrompt(agent),
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (error) {
          console.error('AI stream interrupted:', error);
          controller.enqueue(
            encoder.encode('\n\n[The response was interrupted — please try again.]')
          );
        } finally {
          controller.close();
        }
      },
      cancel() {
        stream.abort();
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


