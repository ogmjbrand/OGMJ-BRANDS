import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { AI_MODEL, getAnthropicClient, isAIConfigured } from '@/lib/ai/anthropic';

const PLATFORM_GUIDANCE: Record<string, string> = {
  meta: 'Meta Ads (Facebook/Instagram): punchy primary text (under 125 chars ideal), headline under 40 chars, description under 30 chars.',
  google: 'Google Ads (Search): headlines under 30 chars each (provide 5), descriptions under 90 chars each (provide 2), keyword-relevant.',
  linkedin: 'LinkedIn Ads: professional tone, intro text under 150 chars, headline under 70 chars.',
  tiktok: 'TikTok Ads: casual, native-feeling, hook-first primary text under 100 chars, short punchy headline.',
};

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
    const { businessId, platform, objective, product, audience } = body;
    if (!businessId || !platform || !product) {
      return NextResponse.json({ error: 'Business ID, platform, and product/offer are required' }, { status: 400 });
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

    const { data: strategy } = await supabase
      .from('brand_strategies')
      .select('brand_voice, brand_tone, usp')
      .eq('business_id', businessId)
      .maybeSingle();

    const brandContext = strategy
      ? `Brand voice: ${(strategy as any).brand_voice || 'confident'}. Tone: ${(strategy as any).brand_tone || 'persuasive'}. USP: ${(strategy as any).usp || 'not set'}.`
      : 'No brand strategy on file — use a confident, persuasive default voice.';

    const guidance = PLATFORM_GUIDANCE[platform] || 'Write natural, on-brand ad copy.';

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1000,
      system: `You write ${platform} ad copy for OGMJ BRANDS businesses. ${guidance} Return ONLY valid JSON (no markdown fences): {"primaryText": "string", "headlines": ["string", ...], "descriptions": ["string", ...], "cta": "string (e.g. Shop Now, Learn More, Sign Up)"}.`,
      messages: [
        {
          role: 'user',
          content: `Product/offer: ${product}\nObjective: ${objective || 'traffic'}\nTarget audience: ${audience || 'general'}\n${brandContext}`,
        },
      ],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    let parsed: { primaryText?: string; headlines?: string[]; descriptions?: string[]; cta?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { primaryText: text, headlines: [], descriptions: [] };
    }

    return NextResponse.json({ success: true, data: parsed }, { status: 200 });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
    }
    console.error('Error generating ad copy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
