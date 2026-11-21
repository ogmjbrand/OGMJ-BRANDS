import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { documentRootSchema, type DocumentRoot } from '@/lib/document-model';
import { WebsiteAssistError, proposeWebsiteOperations } from '@/lib/ai/websiteAssist';
import { safeErrorSummary } from '@/lib/ai/errorSummary';

export const runtime = 'nodejs';
export const maxDuration = 60;

const requestSchema = z.object({
  websiteId: z.string().uuid(),
  instruction: z.string().min(1).max(2_000),
  document: documentRootSchema,
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }
    const { websiteId, instruction, document } = parsed.data;

    const supabase = await createServerClient();

    // Same access-verification shape as every other /api/builder route:
    // resolve the website's business_id, then require active membership.
    const { data: website } = await supabase.from('websites').select('business_id').eq('id', websiteId).single();
    if (!website) {
      return NextResponse.json({ success: false, error: 'Website not found' }, { status: 404 });
    }
    const { data: accessCheck } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', (website as { business_id: string }).business_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    if (!accessCheck) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // `documentRootSchema`'s Zod-inferred type widens recursive node fields
    // to `unknown` (documentNodeSchema is `z.ZodType<unknown>` by design --
    // see schema.ts); `document` has already passed that schema, so this
    // cast only narrows the STATIC type back to what the runtime shape
    // actually is, not a trust decision.
    const result = await proposeWebsiteOperations(instruction, document as unknown as DocumentRoot);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof WebsiteAssistError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 422 });
    }
    console.error('AI website assist error:', safeErrorSummary(error));
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
