import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { AI_MODEL, getAnthropicClient, isAIConfigured } from '@/lib/ai/anthropic';

const META_SYSTEM = `You are an SEO specialist. Return ONLY valid JSON (no markdown fences): {"metaTitle": "string (under 60 chars)", "metaDescription": "string (under 160 chars)", "keywords": ["string", ...] (8-12 keywords/phrases, primary keyword first), "headingSuggestions": ["string", ...] (3-5 H2 suggestions)}.`;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'AI is not configured', hint: 'ANTHROPIC_API_KEY is not set on this deployment.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { businessId, topic, content } = body;
    if (!businessId || !topic) {
      return NextResponse.json({ error: 'Business ID and topic are required' }, { status: 400 });
    }

    const supabase = await createServerClient();

    const { data: membership } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1_200,
      system: META_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Page/content topic: ${topic}${content ? `\n\nContent excerpt:\n${String(content).slice(0, 2000)}` : ''}`,
        },
      ],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }

    return NextResponse.json({ success: true, data: parsed }, { status: 200 });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
    }
    console.error('Error generating SEO meta:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
