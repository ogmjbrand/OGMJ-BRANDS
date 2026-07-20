import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { AI_MODEL, getAnthropicClient, isAIConfigured } from '@/lib/ai/anthropic';

const CONTENT_TYPE_PROMPTS: Record<string, string> = {
  blog_article: 'Write a complete, publish-ready blog article (600-900 words) with a compelling title.',
  seo_article: 'Write an SEO-optimized article targeting the topic as the primary keyword — clear H2 structure, natural keyword usage, 700-1000 words.',
  landing_page: 'Write landing page copy: headline, subheadline, 3-4 benefit sections, and a closing CTA section.',
  sales_page: 'Write persuasive long-form sales page copy: hook, problem, solution, proof, offer, and a strong close.',
  email_campaign: 'Write a marketing email. Return a subject line on the first line ("Subject: ..."), then the body.',
  newsletter: 'Write a newsletter issue: a short intro, 2-3 content sections, and a sign-off.',
  product_description: 'Write a product description that sells the benefit, not just the feature. Under 150 words.',
  linkedin_post: 'Write a LinkedIn post: a strong hook line, 3-5 short paragraphs, no more than 2 hashtags.',
  instagram_post: 'Write an Instagram caption: hook first line, short body, 5-8 relevant hashtags at the end.',
  facebook_post: 'Write a Facebook post: conversational tone, a question or CTA to drive comments.',
  tiktok_script: 'Write a 30-45 second TikTok script: on-screen hook (first 2 seconds), beats, and a clear CTA.',
  youtube_script: 'Write a YouTube video script with a hook, 3 main sections, and a subscribe/CTA close.',
  thread_post: 'Write a Threads post: punchy, conversational, under 500 characters.',
  pinterest_post: 'Write a Pinterest pin description: keyword-rich, benefit-led, under 500 characters.',
  x_post: 'Write an X (Twitter) post under 280 characters. Sharp and specific.',
  google_business_post: 'Write a Google Business Profile post: short update or offer, under 1500 characters, with a clear CTA.',
  podcast_script: 'Write a podcast episode outline: intro hook, 3 talking-point segments, and an outro CTA.',
  press_release: 'Write a press release in standard format: headline, dateline, lead paragraph, body, boilerplate, contact line.',
  case_study: 'Write a case study: challenge, approach, results (with specific numbers where given), and a pull-quote.',
  white_paper: 'Write a white paper introduction and outline: problem statement, 3-4 section headers with a one-line summary each.',
  ebook: 'Write an ebook outline: title, 5-7 chapter titles each with a one-line summary.',
  lead_magnet: 'Write lead magnet copy: a compelling title, what the reader gets, and 3-5 bullet points of value.',
  ad_copy: 'Write 3 ad copy variations: each with a headline (under 40 chars) and body (under 125 chars).',
};

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

    const type = request.nextUrl.searchParams.get('type');
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

    let query = supabase
      .from('content_items')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error('Error listing content items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { businessId, type, platform, topic, instructions } = body;

    if (!businessId || !type || !topic) {
      return NextResponse.json({ error: 'Business ID, type, and topic are required' }, { status: 400 });
    }

    const taskPrompt = CONTENT_TYPE_PROMPTS[type];
    if (!taskPrompt) {
      return NextResponse.json({ error: 'Unknown content type' }, { status: 400 });
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
      .select('brand_voice, brand_tone, usp, target_audience')
      .eq('business_id', businessId)
      .maybeSingle();

    const brandContext = strategy
      ? `Brand voice: ${(strategy as any).brand_voice || 'not set'}. Tone: ${(strategy as any).brand_tone || 'not set'}. USP: ${(strategy as any).usp || 'not set'}. Target audience: ${(strategy as any).target_audience || 'not set'}.`
      : 'No brand strategy on file yet — use a professional, confident default voice.';

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 3_000,
      system:
        'You are the AI Content Studio inside OGMJ BRANDS. Produce publish-ready copy, never placeholder filler. Match the requested format exactly.',
      messages: [
        {
          role: 'user',
          content: `${taskPrompt}\n\nTopic: ${topic}\n${brandContext}${
            instructions ? `\n\nAdditional instructions: ${instructions}` : ''
          }`,
        },
      ],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const titleMatch = text.match(/^Subject:\s*(.+)$/m) || text.match(/^#+\s*(.+)$/m);
    const title = titleMatch?.[1]?.trim() || topic;

    const { data, error } = await (supabase as any)
      .from('content_items')
      .insert({
        business_id: businessId,
        type,
        platform: platform || null,
        topic,
        title,
        body: text,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
    }
    console.error('Error generating content item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
