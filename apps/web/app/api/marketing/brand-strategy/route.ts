import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { AI_MODEL, getAnthropicClient, isAIConfigured } from '@/lib/ai/anthropic';

const STRATEGY_SYSTEM = `You are the AI Brand Strategist inside OGMJ BRANDS. You turn a founder's raw business inputs into a complete, usable brand + marketing strategy.

Return ONLY valid JSON (no markdown fences, no commentary) matching this exact shape:
{
  "positioning": "string",
  "messaging": "string",
  "personas": [{ "name": "string", "summary": "string" }],
  "buyerJourney": [{ "stage": "string", "description": "string" }],
  "swot": { "strengths": ["string"], "weaknesses": ["string"], "opportunities": ["string"], "threats": ["string"] },
  "competitiveAnalysis": "string",
  "offerStrategy": "string",
  "pricingStrategy": "string",
  "contentPillars": ["string"],
  "seoStrategy": "string",
  "roadmap": [{ "month": "string", "focus": "string" }],
  "kpis": ["string"]
}

Ground everything in the founder's actual inputs — never invent facts about their business. Be specific and decisive, not generic.`;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessId = request.nextUrl.searchParams.get('businessId');
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

    const { data } = await supabase
      .from('brand_strategies')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    return NextResponse.json({ success: true, data: data ?? null }, { status: 200 });
  } catch (error) {
    console.error('Error fetching brand strategy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    const {
      businessId,
      industry,
      productsServices,
      budget,
      targetAudience,
      competitors,
      usp,
      brandStory,
      mission,
      vision,
      coreValues,
      brandVoice,
      brandTone,
      goals,
      market,
    } = body;

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

    const inputs = {
      industry,
      productsServices,
      budget,
      targetAudience,
      competitors,
      usp,
      brandStory,
      mission,
      vision,
      coreValues,
      brandVoice,
      brandTone,
      goals,
      market,
    };

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 4_000,
      system: STRATEGY_SYSTEM,
      messages: [{ role: 'user', content: `Founder inputs:\n${JSON.stringify(inputs, null, 2)}` }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    let generated: Record<string, unknown> = {};
    try {
      generated = JSON.parse(text);
    } catch {
      generated = { raw: text };
    }

    const { data, error } = await (supabase as any)
      .from('brand_strategies')
      .upsert(
        {
          business_id: businessId,
          industry,
          products_services: productsServices,
          budget,
          target_audience: targetAudience,
          competitors,
          usp,
          brand_story: brandStory,
          mission,
          vision,
          core_values: coreValues,
          brand_voice: brandVoice,
          brand_tone: brandTone,
          goals,
          market,
          generated,
          generated_at: new Date().toISOString(),
          created_by: user.id,
        },
        { onConflict: 'business_id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
    }
    console.error('Error generating brand strategy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
