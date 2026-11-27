import { describe, it, expect } from 'vitest';
import { executeCrmTool } from '@/lib/ai/tools/crmTool';

interface FakeTable {
  select?: (...args: unknown[]) => any;
  insert?: (...args: unknown[]) => any;
  update?: (...args: unknown[]) => any;
}

/**
 * A tiny chainable query-builder stub. Each call just records what it was
 * asked and, once `.single()`/`.maybeSingle()`/no terminal call is reached
 * (plain select resolves via `.limit()`), returns the canned result for
 * that table.
 */
function makeSupabase(responses: Record<string, { data: unknown; error?: unknown }>) {
  function chain(table: string) {
    const result = responses[table] ?? { data: null, error: { message: `no stub for ${table}` } };
    const builder: any = {
      select: () => builder,
      insert: () => builder,
      update: () => builder,
      eq: () => builder,
      or: () => builder,
      order: () => builder,
      limit: () => builder,
      single: () => Promise.resolve(result),
      maybeSingle: () => Promise.resolve(result),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
    };
    return builder;
  }
  return { from: (table: string) => chain(table) };
}

describe('executeCrmTool', () => {
  it('list_crm_contacts returns contacts scoped by the resolved business', async () => {
    const supabase = makeSupabase({
      contacts: { data: [{ id: 'c1', first_name: 'Jane', last_name: 'Doe', email: 'jane@x.com', phone: null, company_name: null, status: 'lead' }] },
    });
    const result = JSON.parse(await executeCrmTool(supabase, 'biz-1', 'user-1', 'list_crm_contacts', {}));
    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0].email).toBe('jane@x.com');
  });

  it('create_crm_contact requires firstName and email', async () => {
    const supabase = makeSupabase({});
    const result = JSON.parse(await executeCrmTool(supabase, 'biz-1', 'user-1', 'create_crm_contact', { firstName: 'Jane' }));
    expect(result.error).toMatch(/required/i);
  });

  it('create_crm_contact creates a contact owned by the calling user', async () => {
    const supabase = makeSupabase({
      contacts: { data: { id: 'c1', first_name: 'Jane', last_name: null, email: 'jane@x.com' } },
    });
    const result = JSON.parse(
      await executeCrmTool(supabase, 'biz-1', 'user-1', 'create_crm_contact', { firstName: 'Jane', email: 'jane@x.com' })
    );
    expect(result.contact.email).toBe('jane@x.com');
    expect(result.message).toMatch(/created/i);
  });

  it('create_crm_deal requires contactId, title, and a numeric value', async () => {
    const supabase = makeSupabase({});
    const result = JSON.parse(await executeCrmTool(supabase, 'biz-1', 'user-1', 'create_crm_deal', { title: 'Big deal' }));
    expect(result.error).toMatch(/required/i);
  });

  it('create_crm_deal refuses a contact belonging to a different business', async () => {
    const supabase = makeSupabase({
      contacts: { data: { id: 'c1', business_id: 'OTHER-BUSINESS' } },
    });
    const result = JSON.parse(
      await executeCrmTool(supabase, 'biz-1', 'user-1', 'create_crm_deal', { contactId: 'c1', title: 'Big deal', value: 5000 })
    );
    expect(result.error).toBe('Contact not found.');
  });

  it('create_crm_deal creates a deal once the contact, pipeline, and stage all resolve', async () => {
    const supabase = makeSupabase({
      contacts: { data: { id: 'c1', business_id: 'biz-1' } },
      pipelines: { data: { id: 'pipe-1' } },
      pipeline_stages: { data: { id: 'stage-1' } },
      deals: { data: { id: 'd1', title: 'Big deal', value: 5000, stage: 'prospecting' } },
    });
    const result = JSON.parse(
      await executeCrmTool(supabase, 'biz-1', 'user-1', 'create_crm_deal', { contactId: 'c1', title: 'Big deal', value: 5000 })
    );
    expect(result.deal.title).toBe('Big deal');
    expect(result.message).toMatch(/created/i);
  });

  it('create_crm_deal fails cleanly when the business has no pipeline yet', async () => {
    const supabase = makeSupabase({
      contacts: { data: { id: 'c1', business_id: 'biz-1' } },
      pipelines: { data: null },
    });
    const result = JSON.parse(
      await executeCrmTool(supabase, 'biz-1', 'user-1', 'create_crm_deal', { contactId: 'c1', title: 'Big deal', value: 5000 })
    );
    expect(result.error).toMatch(/no pipeline/i);
  });

  it('update_deal_stage refuses a deal belonging to a different business', async () => {
    const supabase = makeSupabase({
      deals: { data: { id: 'd1', business_id: 'OTHER-BUSINESS' } },
    });
    const result = JSON.parse(await executeCrmTool(supabase, 'biz-1', 'user-1', 'update_deal_stage', { dealId: 'd1', stage: 'won' }));
    expect(result.error).toBe('Deal not found.');
  });

  it('reports an unknown tool name as an error rather than throwing', async () => {
    const supabase = makeSupabase({});
    const result = JSON.parse(await executeCrmTool(supabase, 'biz-1', 'user-1', 'delete_everything', {}));
    expect(result.error).toMatch(/unknown tool/i);
  });

  it('an unexpected error never throws out of the tool, it returns a generic {error}', async () => {
    const throwingSupabase = {
      from: () => {
        throw new Error('boom');
      },
    };
    const result = JSON.parse(await executeCrmTool(throwingSupabase, 'biz-1', 'user-1', 'list_crm_contacts', {}));
    expect(result.error).toBe('Something went wrong with that CRM action.');
  });
});
