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
    const { businessId, topic } = body;
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

    const { data: strategy } = await supabase
      .from('brand_strategies')
      .select('brand_voice, brand_tone, usp')
      .eq('business_id', businessId)
      .maybeSingle();

    const brandContext = strategy
      ? `Brand voice: ${(strategy as any).brand_voice || 'professional'}. Tone: ${(strategy as any).brand_tone || 'confident'}. USP: ${(strategy as any).usp || 'not set'}.`
      : 'No brand strategy on file — use a professional, confident default voice.';

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1_500,
      system:
        'You write marketing emails for OGMJ BRANDS businesses. Return ONLY valid JSON (no markdown fences): {"subject": "string", "body": "string"}. The body should be plain text with line breaks, ready to send.',
      messages: [{ role: 'user', content: `Topic: ${topic}\n${brandContext}` }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    let parsed: { subject?: string; body?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { subject: topic, body: text };
    }

    return NextResponse.json({ success: true, data: parsed }, { status: 200 });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
    }
    console.error('Error generating email content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
