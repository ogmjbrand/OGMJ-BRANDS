/**
 * OGMJ BRANDS — Empire AI chat tools: website builder connection.
 *
 * Gives the dashboard-level Empire AI chat (/api/ai/chat) a bounded way to
 * actually act on the user's website, instead of only describing what it
 * would do. It reuses the exact same propose-only flow the in-builder
 * AIAssistPanel already uses (proposeWebsiteOperations): every edit is
 * validated and returned as a proposal with a review link, never written to
 * the live page from here. Applying a proposal still requires the user to
 * open it in the builder — this module performs no database writes to
 * `web_pages.content`.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { migrateLegacyContent } from '@/lib/document-model/migrate';
import { proposeWebsiteOperations, WebsiteAssistError } from '@/lib/ai/websiteAssist';
import { safeErrorSummary } from '@/lib/ai/errorSummary';

export const WEBSITE_EDIT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'list_websites',
    description:
      "List the user's business websites and each one's pages (id, title, slug). Call this first if you don't already know a pageId from earlier in the conversation — propose_website_edit needs one.",
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'propose_website_edit',
    description:
      "Propose a bounded set of edits to one page of the user's website from a plain-language instruction (e.g. \"make the hero headline bigger\" or \"add a pricing section\"). This only PROPOSES changes against the page's current content — it never publishes or applies them. Tell the user to open the returned reviewUrl in the website builder to see and accept the proposal.",
    input_schema: {
      type: 'object',
      properties: {
        pageId: { type: 'string', description: 'A page id from list_websites.' },
        instruction: { type: 'string', description: 'Plain-language description of the change to propose.' },
      },
      required: ['pageId', 'instruction'],
      additionalProperties: false,
    },
  },
];

interface WebsiteRow {
  id: string;
  name: string;
  status: string;
}

interface PageSummaryRow {
  id: string;
  title: string;
  slug: string;
}

interface PageRow {
  id: string;
  website_id: string;
  business_id: string;
  title: string | null;
  content: unknown;
}

/**
 * Executes one Anthropic tool call for the Empire AI chat's website-edit
 * tools. Always resolves to a JSON string suitable as a `tool_result`
 * block's content — never throws, so one failed tool call degrades to the
 * model seeing `{"error": "..."}` and explaining it to the user rather than
 * aborting the whole chat turn.
 */
export async function executeWebsiteEditTool(
  supabase: any, // eslint-disable-line @typescript-eslint/no-explicit-any -- real client's chained query builder isn't practically typeable narrower here; businessId scoping below is what actually enforces safety.
  businessId: string,
  toolName: string,
  toolInput: unknown
): Promise<string> {
  try {
    if (toolName === 'list_websites') {
      const { data: websites, error } = await supabase
        .from('websites')
        .select('id, name, status')
        .eq('business_id', businessId);
      if (error) return JSON.stringify({ error: 'Failed to load websites.' });

      const websiteList: Array<WebsiteRow & { pages: PageSummaryRow[] }> = [];
      for (const site of (websites ?? []) as WebsiteRow[]) {
        const { data: pages } = await supabase
          .from('web_pages')
          .select('id, title, slug')
          .eq('website_id', site.id)
          .eq('business_id', businessId);
        websiteList.push({ ...site, pages: (pages ?? []) as PageSummaryRow[] });
      }
      return JSON.stringify({ websites: websiteList });
    }

    if (toolName === 'propose_website_edit') {
      const input = (toolInput ?? {}) as { pageId?: unknown; instruction?: unknown };
      const pageId = typeof input.pageId === 'string' ? input.pageId : '';
      const instruction = typeof input.instruction === 'string' ? input.instruction : '';
      if (!pageId || !instruction.trim()) {
        return JSON.stringify({ error: 'pageId and instruction are both required.' });
      }

      const { data: page, error } = await supabase
        .from('web_pages')
        .select('id, website_id, business_id, title, content')
        .eq('id', pageId)
        .single();

      const pageRow = page as PageRow | null;
      // Same "not found" message whether the page doesn't exist or belongs
      // to a different business — never reveal which, consistent with every
      // other access check in this codebase (e.g. app/api/builder/pages/[id]).
      if (error || !pageRow || pageRow.business_id !== businessId) {
        return JSON.stringify({ error: 'Page not found.' });
      }

      // Handles both a legacy `{sections:[...]}` shape and an
      // already-versioned document (migrateLegacyContent short-circuits to
      // migrateVersionedDocument when schemaVersion is already present).
      const versioned = migrateLegacyContent(pageRow.content, pageRow.title ?? 'Untitled page');
      const result = await proposeWebsiteOperations(instruction, versioned.document);

      return JSON.stringify({
        explanation: result.explanation,
        operationsProposed: result.operations.length,
        operationsRejected: result.rejected.length,
        reviewUrl: `/dashboard/builder/${pageRow.website_id}/${pageRow.id}`,
        note: 'These changes are proposed only, nothing on the live site changed. Tell the user to open reviewUrl in the website builder to see and apply them.',
      });
    }

    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  } catch (error) {
    if (error instanceof WebsiteAssistError) {
      return JSON.stringify({ error: error.message });
    }
    console.error('[website-edit-tool] unexpected error:', safeErrorSummary(error));
    return JSON.stringify({ error: 'Something went wrong proposing this edit.' });
  }
}
