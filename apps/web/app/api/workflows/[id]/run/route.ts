import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { runWorkflow } from '@/lib/workflows/runWorkflow';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workflowId } = await params;
    const body = await request.json().catch(() => ({}));
    const contactId: string | undefined = body?.contactId || undefined;

    const supabase = await createServerClient();
    const result = await runWorkflow(supabase, user.id, workflowId, contactId);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(
      { success: true, data: { executionId: result.executionId, status: result.status, steps: result.steps } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error running workflow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
