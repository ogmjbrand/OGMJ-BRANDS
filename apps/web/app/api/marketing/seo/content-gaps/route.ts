import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { AI_MODEL, getAnthropicClient, isAIConfigured } from '@/lib/ai/anthropic';

const GAP_SYSTEM = `You are an SEO/content strategist reviewing what a business has already published against its stated content pillars. Return ONLY valid JSON (no markdown fences): {"summary": "string (2-3 sentences)", "wellCovered": ["string", ...], "gaps": [{"pillar": "string", "suggestion": "string"}, ...] (3-6 items), "quickWins": ["string", ...] (2-4 specific, immediately actionable content ideas)}.`;

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
    const { businessId } = body;
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
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

    const [{ data: strategy }, { data: content }] = await Promise.all([
      supabase.from('brand_strategies').select('generated').eq('business_id', businessId).maybeSingle(),
      supabase.from('content_items').select('type, topic, title, status').eq('business_id', businessId).order('created_at', { ascending: false }).limit(100),
    ]);

    const contentPillars = (strategy as any)?.generated?.contentPillars || [];
    const items = (content as any[]) ?? [];

    if (contentPillars.length === 0 && items.length === 0) {
      return NextResponse.json(
        { error: 'Generate a brand strategy and some content first — there is nothing to analyze yet.' },
        { status: 400 }
      );
    }

    const context = {
      contentPillars,
      publishedContent: items.map((i) => ({ type: i.type, topic: i.topic, title: i.title, status: i.status })),
    };

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1_500,
      system: GAP_SYSTEM,
      messages: [{ role: 'user', content: JSON.stringify(context, null, 2) }],
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
    console.error('Error analyzing content gaps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
