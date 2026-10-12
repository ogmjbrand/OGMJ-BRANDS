import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';

async function verifyProjectAccess(supabase: any, userId: string, projectId: string) {
  const { data: project, error } = await supabase
    .from('ai_video_projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error || !project) {
    return { project: null, error: NextResponse.json({ error: 'Project not found' }, { status: 404 }) };
  }

  const { data: membership } = await supabase
    .from('business_users')
    .select('role')
    .eq('business_id', project.business_id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!membership) {
    return { project: null, error: NextResponse.json({ error: 'Access denied' }, { status: 403 }) };
  }

  return { project, error: null };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createServerClient();
  const { project, error } = await verifyProjectAccess(supabase, user.id, id);
  if (error) return error;

  return NextResponse.json({ success: true, data: project }, { status: 200 });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createServerClient();
  const { error: accessError } = await verifyProjectAccess(supabase, user.id, id);
  if (accessError) return accessError;

  const body = await request.json();
  const { title, script } = body;

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title !== undefined) updateData.title = title;
  if (script !== undefined) updateData.script = script;

  const { data, error } = await (supabase as any)
    .from('ai_video_projects')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data }, { status: 200 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createServerClient();
  const { error: accessError } = await verifyProjectAccess(supabase, user.id, id);
  if (accessError) return accessError;

  const { error } = await supabase.from('ai_video_projects').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
