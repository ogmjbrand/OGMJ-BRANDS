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
export const maxDuration = 120;

const TASK_PROMPTS: Record<string, string> = {
  'email-draft':
    'Write a ready-to-send business email. Return a subject line on the first line ("Subject: ..."), then the body. Keep it under 180 words unless the context demands more.',
  'deal-followup':
    'Write a follow-up message for this sales deal that moves it to the next stage. Reference the deal context precisely and end with one specific call to action.',
  'invoice-reminder':
    'Write a polite but firm payment reminder for this invoice. Include the amount and due date from the context. Professional tone, under 120 words.',
  'social-post':
    'Write a platform-ready social media post from the context. Include a scroll-stopping hook in the first line, and 3-5 relevant hashtags at the end.',
  'content-ideas':
    'Generate 10 specific content ideas from the context. For each: a working title, the format (reel / carousel / post / video), and the one-line angle.',
  'campaign-plan':
    'Design a launch campaign from the context: audience, offer, 3 channels with the message per channel, a 7-day timeline, and the success metric.',
  summarize:
    'Summarize the context into the 3-5 points a busy founder must know, then one recommended next action.',
};

const assistSchema = z.object({
  task: z.string().min(1),
  context: z.union([z.string(), z.record(z.unknown())]),
  instructions: z.string().max(4_000).optional(),
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

    const parsed = assistSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { task, context, instructions, agent } = parsed.data;
    const taskPrompt = TASK_PROMPTS[task] ?? task;
    const contextText =
      typeof context === 'string' ? context : JSON.stringify(context, null, 2);

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 16_000,
      thinking: { type: 'adaptive' },
      system: buildSystemPrompt(agent),
      messages: [
        {
          role: 'user',
          content: `${taskPrompt}\n\nContext:\n${contextText}${
            instructions ? `\n\nAdditional instructions:\n${instructions}` : ''
          }`,
        },
      ],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return NextResponse.json({
      success: true,
      data: { text, task, model: AI_MODEL },
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
    console.error('AI assist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


