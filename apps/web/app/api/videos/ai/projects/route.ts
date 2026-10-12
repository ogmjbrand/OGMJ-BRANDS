import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { AI_MODEL, getAnthropicClient, isAIConfigured } from '@/lib/ai/anthropic';

type Workspace = 'generator' | 'marketing' | 'script_to_video';

const SCRIPT_JSON_SHAPE = `{
  "title": "string",
  "hook": "string",
  "scenes": [
    {
      "sceneNumber": 1,
      "description": "string — what happens in this scene",
      "visualPrompt": "string — a detailed prompt a text-to-video model could render",
      "narration": "string — the voiceover line for this scene",
      "durationSeconds": 5,
      "onScreenText": "string or null"
    }
  ],
  "captions": ["string"],
  "thumbnailConcepts": ["string"],
  "socialCaption": "string",
  "hashtags": ["string"]
}`;

const WORKSPACE_SYSTEM: Record<Workspace, string> = {
  generator: `You are the AI Video Generator inside OGMJ BRANDS. A founder describes a video they want; you turn it into a scene-by-scene script and storyboard ready for a text-to-video renderer.

Return ONLY valid JSON (no markdown fences, no commentary) matching this exact shape:
${SCRIPT_JSON_SHAPE}

Match the requested video type, style, aspect ratio and target duration. Split the target duration across scenes sensibly (typically 3-8 second scenes). Visual prompts must be concrete and renderable — describe subject, action, setting, camera angle and mood, not abstractions.`,

  marketing: `You are the AI Marketing Video Studio inside OGMJ BRANDS. You turn a founder's product/campaign brief — grounded in their real brand strategy when provided — into a scene-by-scene marketing video script ready for a text-to-video renderer.

Return ONLY valid JSON (no markdown fences, no commentary) matching this exact shape:
${SCRIPT_JSON_SHAPE}

Ground every scene in the founder's actual product, brand voice and target audience — never invent product facts. The hook must earn attention in the first 2 seconds. socialCaption and hashtags should be ready to publish as-is.`,

  script_to_video: `You are the Script-to-Video workspace inside OGMJ BRANDS. A founder provides an existing script or brief; you break it into a scene-by-scene storyboard ready for a text-to-video renderer, without rewriting their message.

Return ONLY valid JSON (no markdown fences, no commentary) matching this exact shape:
${SCRIPT_JSON_SHAPE}

Preserve the founder's actual words in "narration" wherever possible — your job is to break their script into scenes and add visual direction, not to replace their copy.`,
};

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessId = request.nextUrl.searchParams.get('businessId');
    const workspace = request.nextUrl.searchParams.get('workspace');
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

    let query = supabase
      .from('ai_video_projects')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (workspace) {
      query = query.eq('workspace', workspace);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error('Error listing AI video projects:', error);
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
    const {
      businessId,
      workspace,
      title,
      prompt,
      videoType,
      style,
      aspectRatio,
      targetDurationSeconds,
    } = body as {
      businessId?: string;
      workspace?: Workspace;
      title?: string;
      prompt?: string;
      videoType?: string;
      style?: string;
      aspectRatio?: '16:9' | '9:16' | '1:1';
      targetDurationSeconds?: number;
    };

    if (!businessId || !workspace || !prompt?.trim()) {
      return NextResponse.json({ error: 'businessId, workspace and prompt are required' }, { status: 400 });
    }

    if (!['generator', 'marketing', 'script_to_video'].includes(workspace)) {
      return NextResponse.json({ error: 'Invalid workspace' }, { status: 400 });
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

    // Marketing workspace grounds generation in the business's real brand
    // strategy when one exists, rather than inventing brand facts.
    let brandContext = '';
    if (workspace === 'marketing') {
      const { data: brandStrategy } = await supabase
        .from('brand_strategies')
        .select('brand_voice, brand_tone, target_audience, usp, products_services, brand_story')
        .eq('business_id', businessId)
        .maybeSingle();

      if (brandStrategy) {
        brandContext = `\n\nBrand context (use this, do not invent different facts):\n${JSON.stringify(brandStrategy, null, 2)}`;
      }
    }

    const userMessage = `Brief: ${prompt.trim()}
Video type: ${videoType || 'not specified'}
Style: ${style || 'not specified'}
Aspect ratio: ${aspectRatio || '16:9'}
Target duration: ${targetDurationSeconds ? `${targetDurationSeconds} seconds` : 'not specified'}${brandContext}`;

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 4_000,
      system: WORKSPACE_SYSTEM[workspace],
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    let script: Record<string, unknown>;
    try {
      script = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'AI returned an unparseable script — try again' }, { status: 502 });
    }

    const { data: project, error } = await (supabase as any)
      .from('ai_video_projects')
      .insert({
        business_id: businessId,
        created_by: user.id,
        workspace,
        title: title?.trim() || (script.title as string) || prompt.trim().slice(0, 80),
        inputs: { prompt, videoType, style },
        video_type: videoType || null,
        style: style || null,
        aspect_ratio: aspectRatio || '16:9',
        target_duration_seconds: targetDurationSeconds || null,
        script,
        status: 'script_ready',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
    }
    console.error('Error generating video script:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
