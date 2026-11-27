/**
 * OGMJ BRANDS — Empire AI chat tools: CRM connection.
 *
 * Every tool here is scoped to the businessId the chat route already
 * resolved from the authenticated session (resolveUserBusinessId) -- the
 * model never supplies or can widen that scope. Unlike the website-builder
 * tools (propose-only), these write directly, matching how the rest of
 * this codebase's CRM already works (/api/contacts, /api/deals have no
 * "draft" or review-step concept either). The human-in-the-loop check for
 * a write is conversational instead: the system prompt (lib/ai/anthropic.ts)
 * requires the model to state what it's about to create/change and get an
 * explicit go-ahead from the user before calling create_crm_contact,
 * create_crm_deal, or update_deal_stage.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { safeErrorSummary } from '@/lib/ai/errorSummary';

export const CRM_TOOLS: Anthropic.Tool[] = [
  {
    name: 'list_crm_contacts',
    description: 'List the business\'s CRM contacts, optionally filtered by a name/email search term. Use this to find a contactId before create_crm_deal.',
    input_schema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional text to match against first name, last name, or email.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'create_crm_contact',
    description:
      'Create a new CRM contact. This writes immediately -- always tell the user exactly what you are about to create and get an explicit yes before calling this.',
    input_schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        companyName: { type: 'string' },
        jobTitle: { type: 'string' },
      },
      required: ['firstName', 'email'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_crm_deals',
    description: "List the business's CRM deals, optionally filtered by stage.",
    input_schema: {
      type: 'object',
      properties: {
        stage: { type: 'string', description: 'Optional exact stage name to filter by (e.g. "prospecting", "negotiation").' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'create_crm_deal',
    description:
      'Create a new CRM deal attached to an existing contact (use list_crm_contacts first to get a contactId). This writes immediately -- always tell the user exactly what you are about to create and get an explicit yes before calling this.',
    input_schema: {
      type: 'object',
      properties: {
        contactId: { type: 'string' },
        title: { type: 'string' },
        value: { type: 'number', description: 'Deal value as a plain number, e.g. 5000.' },
        currency: { type: 'string', description: 'Defaults to USD.' },
        expectedCloseDate: { type: 'string', description: 'ISO date, optional.' },
        description: { type: 'string' },
      },
      required: ['contactId', 'title', 'value'],
      additionalProperties: false,
    },
  },
  {
    name: 'update_deal_stage',
    description:
      'Move an existing deal to a different pipeline stage (use list_crm_deals first to get a dealId). This writes immediately -- always tell the user exactly what you are about to change and get an explicit yes before calling this.',
    input_schema: {
      type: 'object',
      properties: {
        dealId: { type: 'string' },
        stage: { type: 'string' },
      },
      required: ['dealId', 'stage'],
      additionalProperties: false,
    },
  },
];

interface ContactRow {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  status: string;
}

interface DealRow {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: string;
  status: string;
  contact_id: string;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function strOrNull(value: unknown): string | null {
  const s = str(value);
  return s || null;
}

/**
 * Executes one Anthropic tool call for the Empire AI chat's CRM tools.
 * Always resolves to a JSON string suitable as a `tool_result` block's
 * content -- never throws, so one failed tool call degrades to the model
 * seeing `{"error": "..."}` rather than aborting the whole chat turn.
 */
export async function executeCrmTool(
  supabase: any, // eslint-disable-line @typescript-eslint/no-explicit-any -- real client's chained query builder isn't practically typeable narrower here; businessId scoping below is what actually enforces safety.
  businessId: string,
  userId: string,
  toolName: string,
  toolInput: unknown
): Promise<string> {
  try {
    const input = (toolInput ?? {}) as Record<string, unknown>;

    if (toolName === 'list_crm_contacts') {
      const search = str(input.search);
      let query = supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone, company_name, status')
        .eq('business_id', businessId);
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
      if (error) return JSON.stringify({ error: 'Failed to load contacts.' });
      return JSON.stringify({ contacts: (data ?? []) as ContactRow[] });
    }

    if (toolName === 'create_crm_contact') {
      const firstName = str(input.firstName);
      const email = str(input.email);
      if (!firstName || !email) {
        return JSON.stringify({ error: 'firstName and email are both required.' });
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          business_id: businessId,
          first_name: firstName,
          last_name: strOrNull(input.lastName),
          email,
          phone: strOrNull(input.phone),
          company_name: strOrNull(input.companyName),
          job_title: strOrNull(input.jobTitle),
          source: 'ai_chat',
          status: 'lead',
          lead_score: 0,
          owner_id: userId,
          created_by: userId,
        })
        .select('id, first_name, last_name, email')
        .single();

      if (error) return JSON.stringify({ error: 'Failed to create the contact.' });
      return JSON.stringify({ contact: data, message: 'Contact created in CRM.' });
    }

    if (toolName === 'list_crm_deals') {
      const stage = str(input.stage);
      let query = supabase
        .from('deals')
        .select('id, title, value, currency, stage, status, contact_id')
        .eq('business_id', businessId);
      if (stage) query = query.eq('stage', stage);
      const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
      if (error) return JSON.stringify({ error: 'Failed to load deals.' });
      return JSON.stringify({ deals: (data ?? []) as DealRow[] });
    }

    if (toolName === 'create_crm_deal') {
      const contactId = str(input.contactId);
      const title = str(input.title);
      const value = typeof input.value === 'number' ? input.value : Number.NaN;
      if (!contactId || !title || Number.isNaN(value)) {
        return JSON.stringify({ error: 'contactId, title and a numeric value are all required.' });
      }

      // Same "not found" message whether the contact doesn't exist or
      // belongs to a different business -- consistent with the
      // website-edit tool's access check.
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('id, business_id')
        .eq('id', contactId)
        .single();
      if (contactError || !contact || contact.business_id !== businessId) {
        return JSON.stringify({ error: 'Contact not found.' });
      }

      const { data: pipeline } = await supabase
        .from('pipelines')
        .select('id')
        .eq('business_id', businessId)
        .order('is_default', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!pipeline) {
        return JSON.stringify({ error: 'No pipeline exists for this business yet — create one in CRM settings first.' });
      }

      const { data: firstStage } = await supabase
        .from('pipeline_stages')
        .select('id')
        .eq('pipeline_id', pipeline.id)
        .order('position', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!firstStage) {
        return JSON.stringify({ error: 'The pipeline has no stages.' });
      }

      const { data, error } = await supabase
        .from('deals')
        .insert({
          business_id: businessId,
          contact_id: contactId,
          title,
          value,
          currency: str(input.currency) || 'USD',
          stage: 'prospecting',
          pipeline_id: pipeline.id,
          stage_id: firstStage.id,
          status: 'open',
          probability: 25,
          expected_close_date: strOrNull(input.expectedCloseDate),
          description: strOrNull(input.description),
          created_by: userId,
        })
        .select('id, title, value, stage')
        .single();

      if (error) return JSON.stringify({ error: 'Failed to create the deal.' });
      return JSON.stringify({ deal: data, message: 'Deal created in CRM.' });
    }

    if (toolName === 'update_deal_stage') {
      const dealId = str(input.dealId);
      const stage = str(input.stage);
      if (!dealId || !stage) {
        return JSON.stringify({ error: 'dealId and stage are both required.' });
      }

      const { data: existing, error: existingError } = await supabase
        .from('deals')
        .select('id, business_id')
        .eq('id', dealId)
        .single();
      if (existingError || !existing || existing.business_id !== businessId) {
        return JSON.stringify({ error: 'Deal not found.' });
      }

      const { data, error } = await supabase
        .from('deals')
        .update({ stage, updated_by: userId, updated_at: new Date().toISOString() })
        .eq('id', dealId)
        .select('id, title, stage')
        .single();

      if (error) return JSON.stringify({ error: 'Failed to update the deal.' });
      return JSON.stringify({ deal: data, message: 'Deal stage updated.' });
    }

    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  } catch (error) {
    console.error('[crm-tool] unexpected error:', safeErrorSummary(error));
    return JSON.stringify({ error: 'Something went wrong with that CRM action.' });
  }
}
