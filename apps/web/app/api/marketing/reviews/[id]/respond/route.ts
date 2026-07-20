import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { AI_MODEL, getAnthropicClient, isAIConfigured } from '@/lib/ai/anthropic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const supabase = await createServerClient();

    const { data: review, error: reviewError } = await supabase.from('reviews').select('*').eq('id', id).single();
    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', (review as any).business_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: strategy } = await supabase
      .from('brand_strategies')
      .select('brand_voice, brand_tone')
      .eq('business_id', (review as any).business_id)
      .maybeSingle();

    const brandContext = strategy
      ? `Brand voice: ${(strategy as any).brand_voice || 'professional'}. Tone: ${(strategy as any).brand_tone || 'warm'}.`
      : 'No brand strategy on file — use a professional, warm default voice.';

    const rating = (review as any).rating as number;
    const sentimentGuidance =
      rating >= 4
        ? 'This is a positive review — thank them warmly and specifically, invite them back.'
        : rating === 3
          ? 'This is a mixed review — acknowledge the good and the gap honestly, offer to make it right.'
          : 'This is a negative review — do not be defensive. Apologize sincerely, acknowledge the specific issue, and offer a concrete next step (contact info, resolution) without over-promising.';

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 400,
      system: `You write public review responses for OGMJ BRANDS businesses on ${(review as any).platform}. ${sentimentGuidance} Keep it under 600 characters, genuine, never templated-sounding. Return ONLY valid JSON (no markdown fences): {"response": "string"}.`,
      messages: [
        {
          role: 'user',
          content: `Reviewer: ${(review as any).reviewer_name || 'Customer'}\nRating: ${rating}/5\nReview: ${(review as any).review_text}\n${brandContext}`,
        },
      ],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    let parsed: { response?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { response: text };
    }

    return NextResponse.json({ success: true, data: parsed }, { status: 200 });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
    }
    console.error('Error generating review response:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
