import { describe, it, expect, vi, beforeEach } from 'vitest';

let proposeResult: unknown = { explanation: 'Added a heading.', operations: [{ op: 'insertNode' }], rejected: [] };
let proposeShouldThrow: Error | null = null;

vi.mock('@/lib/ai/websiteAssist', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai/websiteAssist')>('@/lib/ai/websiteAssist');
  return {
    ...actual,
    proposeWebsiteOperations: async () => {
      if (proposeShouldThrow) throw proposeShouldThrow;
      return proposeResult;
    },
  };
});

const { executeWebsiteEditTool } = await import('@/lib/ai/tools/websiteEditTool');
const { WebsiteAssistError } = await import('@/lib/ai/websiteAssist');

function makeSupabase(overrides: {
  websites?: Array<{ id: string; name: string; status: string }>;
  pagesByWebsite?: Record<string, Array<{ id: string; title: string; slug: string }>>;
  page?: { id: string; website_id: string; business_id: string; title: string | null; content: unknown } | null;
}) {
  return {
    from(table: string) {
      if (table === 'websites') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: overrides.websites ?? [], error: null }),
          }),
        };
      }
      if (table === 'web_pages') {
        return {
          select: () => ({
            eq: (col: string, value: string) => {
              if (col === 'website_id') {
                return {
                  eq: () => Promise.resolve({ data: overrides.pagesByWebsite?.[value] ?? [], error: null }),
                };
              }
              // pageId lookup path for propose_website_edit
              return {
                single: () => Promise.resolve({ data: overrides.page ?? null, error: overrides.page ? null : { message: 'not found' } }),
              };
            },
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

describe('executeWebsiteEditTool', () => {
  beforeEach(() => {
    proposeResult = { explanation: 'Added a heading.', operations: [{ op: 'insertNode' }], rejected: [] };
    proposeShouldThrow = null;
  });

  it('list_websites returns the business websites with their pages', async () => {
    const supabase = makeSupabase({
      websites: [{ id: 'site-1', name: 'My Site', status: 'draft' }],
      pagesByWebsite: { 'site-1': [{ id: 'page-1', title: 'Home', slug: 'home' }] },
    });

    const result = JSON.parse(await executeWebsiteEditTool(supabase, 'biz-1', 'list_websites', {}));
    expect(result.websites).toEqual([
      { id: 'site-1', name: 'My Site', status: 'draft', pages: [{ id: 'page-1', title: 'Home', slug: 'home' }] },
    ]);
  });

  it('propose_website_edit returns an explanation, operation counts, and a builder review link', async () => {
    const supabase = makeSupabase({
      page: { id: 'page-1', website_id: 'site-1', business_id: 'biz-1', title: 'Home', content: { sections: [] } },
    });

    const result = JSON.parse(
      await executeWebsiteEditTool(supabase, 'biz-1', 'propose_website_edit', { pageId: 'page-1', instruction: 'add a hero' })
    );

    expect(result.explanation).toBe('Added a heading.');
    expect(result.operationsProposed).toBe(1);
    expect(result.operationsRejected).toBe(0);
    expect(result.reviewUrl).toBe('/dashboard/builder/site-1/page-1');
  });

  it('refuses a pageId that belongs to a different business, without revealing why', async () => {
    const supabase = makeSupabase({
      page: { id: 'page-1', website_id: 'site-1', business_id: 'OTHER-BUSINESS', title: 'Home', content: { sections: [] } },
    });

    const result = JSON.parse(
      await executeWebsiteEditTool(supabase, 'biz-1', 'propose_website_edit', { pageId: 'page-1', instruction: 'add a hero' })
    );
    expect(result.error).toBe('Page not found.');
  });

  it('refuses a nonexistent pageId with the same message as a cross-business one', async () => {
    const supabase = makeSupabase({ page: null });
    const result = JSON.parse(
      await executeWebsiteEditTool(supabase, 'biz-1', 'propose_website_edit', { pageId: 'nope', instruction: 'add a hero' })
    );
    expect(result.error).toBe('Page not found.');
  });

  it('requires both pageId and instruction', async () => {
    const supabase = makeSupabase({});
    const result = JSON.parse(await executeWebsiteEditTool(supabase, 'biz-1', 'propose_website_edit', { pageId: 'page-1' }));
    expect(result.error).toMatch(/required/i);
  });

  it('surfaces a WebsiteAssistError as a plain {error} tool result instead of throwing', async () => {
    proposeShouldThrow = new WebsiteAssistError('AI is not configured on this deployment (ANTHROPIC_API_KEY is not set).');
    const supabase = makeSupabase({
      page: { id: 'page-1', website_id: 'site-1', business_id: 'biz-1', title: 'Home', content: { sections: [] } },
    });

    const result = JSON.parse(
      await executeWebsiteEditTool(supabase, 'biz-1', 'propose_website_edit', { pageId: 'page-1', instruction: 'add a hero' })
    );
    expect(result.error).toContain('ANTHROPIC_API_KEY');
  });

  it('an unexpected error never throws out of the tool, it returns a generic {error}', async () => {
    proposeShouldThrow = new Error('boom');
    const supabase = makeSupabase({
      page: { id: 'page-1', website_id: 'site-1', business_id: 'biz-1', title: 'Home', content: { sections: [] } },
    });

    const result = JSON.parse(
      await executeWebsiteEditTool(supabase, 'biz-1', 'propose_website_edit', { pageId: 'page-1', instruction: 'add a hero' })
    );
    expect(result.error).toBe('Something went wrong proposing this edit.');
  });

  it('reports an unknown tool name as an error rather than throwing', async () => {
    const supabase = makeSupabase({});
    const result = JSON.parse(await executeWebsiteEditTool(supabase, 'biz-1', 'delete_everything', {}));
    expect(result.error).toMatch(/unknown tool/i);
  });
});
