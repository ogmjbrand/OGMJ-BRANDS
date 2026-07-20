import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { AI_MODEL, getAnthropicClient, isAIConfigured } from '@/lib/ai/anthropic';

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
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
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

    const [strategy, content, email, social, ads, reviews, whatsapp, influencers, affiliates] = await Promise.all([
      supabase.from('brand_strategies').select('brand_voice, brand_tone, usp, generated').eq('business_id', businessId).maybeSingle(),
      supabase.from('content_items').select('type, status, created_at').eq('business_id', businessId),
      supabase.from('email_campaigns').select('status, recipient_count, sent_at').eq('business_id', businessId),
      supabase.from('social_posts').select('status, platforms, engagement').eq('business_id', businessId),
      supabase.from('ad_campaigns').select('status, platform, metrics, budget_amount').eq('business_id', businessId),
      supabase.from('reviews').select('rating, status').eq('business_id', businessId),
      supabase.from('whatsapp_campaigns').select('status, recipient_count').eq('business_id', businessId),
      supabase.from('influencers').select('status, platform').eq('business_id', businessId),
      supabase.from('affiliate_partners').select('status, total_sales, total_commission').eq('business_id', businessId),
    ]);

    const snapshot = {
      hasBrandStrategy: Boolean(strategy.data),
      contentItems: content.data?.length ?? 0,
      contentByStatus: countBy(content.data, 'status'),
      emailCampaigns: email.data?.length ?? 0,
      emailSent: email.data?.filter((c: any) => c.status === 'sent').length ?? 0,
      socialPosts: social.data?.length ?? 0,
      socialByStatus: countBy(social.data, 'status'),
      adCampaigns: ads.data?.length ?? 0,
      adCampaignsActive: ads.data?.filter((c: any) => c.status === 'active').length ?? 0,
      reviewCount: reviews.data?.length ?? 0,
      avgRating: average(reviews.data?.map((r: any) => r.rating)),
      unrespondedReviews: reviews.data?.filter((r: any) => r.status === 'new').length ?? 0,
      whatsappCampaigns: whatsapp.data?.length ?? 0,
      influencerCount: influencers.data?.length ?? 0,
      influencersActive: influencers.data?.filter((i: any) => i.status === 'active').length ?? 0,
      affiliateCount: affiliates.data?.length ?? 0,
      affiliateSales: sum(affiliates.data?.map((a: any) => Number(a.total_sales) || 0)),
    };

    const brandContext = strategy.data
      ? `Brand voice: ${(strategy.data as any).brand_voice || 'not set'}. USP: ${(strategy.data as any).usp || 'not set'}.`
      : 'No brand strategy on file yet.';

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1500,
      system: `You are the AI CMO for an OGMJ BRANDS business — an experienced, direct marketing executive giving a weekly briefing to the founder. Base your analysis strictly on the data given; do not invent numbers. Return ONLY valid JSON (no markdown fences): {"headline": "string (one sentence, the state of marketing right now)", "wins": ["string", ...], "concerns": ["string", ...], "priorities": ["string (specific, actionable, this week)", ...]}.`,
      messages: [
        {
          role: 'user',
          content: `${brandContext}\n\nMarketing activity snapshot:\n${JSON.stringify(snapshot, null, 2)}`,
        },
      ],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    let parsed: { headline?: string; wins?: string[]; concerns?: string[]; priorities?: string[] } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { headline: text, wins: [], concerns: [], priorities: [] };
    }

    return NextResponse.json({ success: true, data: { ...parsed, snapshot } }, { status: 200 });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
    }
    console.error('Error generating CMO briefing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function countBy(rows: any[] | null | undefined, key: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows || []) {
    const value = row[key] || 'unknown';
    out[value] = (out[value] || 0) + 1;
  }
  return out;
}

function average(values: number[] | undefined): number | null {
  if (!values || values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function sum(values: number[] | undefined): number {
  return (values || []).reduce((a, b) => a + b, 0);
}
