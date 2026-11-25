import type { BrowserContext, Page, Route } from '@playwright/test';

/**
 * Network mock for this app's OWN same-origin routes in the AI website
 * creation flow -- /api/builder/* and /api/ai/website-assist. This
 * sandbox has no live AI provider key and the task is explicit that
 * production must not be touched, so these are intercepted here instead.
 *
 * Supabase itself (auth + REST) is deliberately NOT mocked here via
 * page.route: middleware.ts makes its own Supabase call from inside the
 * Next.js dev server process, which Playwright's route interception
 * cannot see at all (it only sees browser-originated requests). Instead,
 * NEXT_PUBLIC_SUPABASE_URL points at a real local HTTP server
 * (supabase-mock-server.cjs) that both the browser and the dev server hit
 * over real loopback -- see that file's module doc and
 * seedFakeSupabaseSession below for the matching session cookie.
 *
 * Everything downstream of the network boundary is real: the actual
 * compiled client bundle, actual React state machines, actual
 * sessionStorage, actual routing, actual Document Model operations applied
 * through the real editor reducer. The specific AI provider call and the
 * Supabase persistence layer are already covered by this feature's unit
 * and route tests (see __tests__/ai/website-assist-route.test.ts); this
 * harness exists to verify everything those tests cannot reach -- the UI
 * itself.
 */

export const TEST_USER_ID = 'e2e-test-user-0001';
export const TEST_BUSINESS_ID = 'e2e-test-business-0001';

function supabaseUserRecord() {
  const now = new Date().toISOString();
  return {
    id: TEST_USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'e2e-test@ogmjbrands.test',
    email_confirmed_at: now,
    phone: '',
    confirmed_at: now,
    last_sign_in_at: now,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    identities: [],
    created_at: now,
    updated_at: now,
  };
}

function supabaseSessionCookieValue(): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const session = {
    access_token: 'e2e-fake-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: nowSeconds + 3600,
    refresh_token: 'e2e-fake-refresh-token',
    user: supabaseUserRecord(),
  };
  // Set as the literal JSON text, not percent-encoded: middleware's custom
  // cookie adapter (`req.cookies.get(name)?.value`, confirmed empirically)
  // hands GoTrueClient the cookie's raw value with no decoding step, so an
  // encoded value here would fail JSON.parse server-side. The browser-side
  // read path (`cookie.parse(document.cookie)`) does decodeURIComponent,
  // but that's a no-op on text with no literal '%' sequences, so one raw
  // value works for both.
  return JSON.stringify(session);
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

export interface WebsiteRow {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  template_id?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  web_pages: Array<{ id: string }>;
}

export interface PageRow {
  id: string;
  website_id: string;
  business_id: string;
  title: string;
  slug: string;
  path?: string;
  content: unknown;
  status: 'draft' | 'published';
  version: number;
  seo?: { title?: string; description?: string };
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

/** One AI-generation response mode for a test to select before triggering generation. */
export type GenerationBehavior =
  | { kind: 'success'; delayMs?: number }
  | { kind: 'failure'; message: string; delayMs?: number };

export interface MockBackendOptions {
  /** How the NEXT call to /api/ai/website-assist should behave. Defaults to a successful generation. Call `setGenerationBehavior` on the returned handle to change it between actions in a test. */
  generation?: GenerationBehavior;
  /** Artificial delay (ms) on website/page creation POSTs, to make loading states observable. */
  createDelayMs?: number;
}

export interface MockBackendHandle {
  websites: Map<string, WebsiteRow>;
  pages: Map<string, PageRow>;
  /** Every request path this harness has seen, in order -- lets a test assert exact call counts/sequencing (e.g. "exactly one POST to /api/builder/sites" for the duplicate-submit-click test). */
  requestLog: string[];
  setGenerationBehavior(behavior: GenerationBehavior): void;
  aiCallCount(): number;
}

function websiteToListShape(row: WebsiteRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    template_id: row.template_id ?? null,
    seo_title: null,
    seo_description: null,
    favicon_url: null,
    published_at: row.published_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    web_pages: row.web_pages,
  };
}

/** Matches the shape createWebsite()/handleCreateWebsiteWithAI() read directly off the POST response (id, name, description, status, created_at/updated_at -- see builder.service.ts's createWebsite, which returns result.data unmapped). */
function websiteToCreateResponseShape(row: WebsiteRow) {
  return {
    id: row.id,
    business_id: row.business_id,
    name: row.name,
    description: row.description,
    status: row.status,
    template_id: row.template_id ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    // createPage() / the dashboard list render off these camelCase names too
    // (see builder.service.ts's Website type and its direct, unmapped use of
    // result.data in createWebsite) -- included alongside the snake_case
    // fields above so the UI renders sensibly regardless of which it reads.
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastModified: row.updated_at,
    pages: row.web_pages.length,
  };
}

function pageToCreateResponseShape(row: PageRow) {
  return {
    id: row.id,
    website_id: row.website_id,
    business_id: row.business_id,
    title: row.title,
    slug: row.slug,
    path: row.path ?? `/${row.slug}`,
    status: row.status,
    version: row.version,
    created_at: row.created_at,
    updated_at: row.updated_at,
    // camelCase duplicates for the same reason as websiteToCreateResponseShape.
    websiteId: row.website_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/** A realistic, validatable set of operations for the mocked AI to "propose" -- an insertNode into the page's root plus a componentInstance referencing one of the just-seeded presets, exercising both plain-node and preset-reference proposal rendering. */
function mockGenerationOperations(instruction: string) {
  const heroId = nextId('ai-heading');
  const navId = nextId('ai-nav-instance');
  return [
    { op: 'insertNode', parentId: 'root', index: 0, node: { id: navId, kind: 'componentInstance', componentId: 'navbar' } },
    {
      op: 'insertNode',
      parentId: 'root',
      index: 1,
      node: { id: heroId, kind: 'heading', level: 1, text: 'AI-generated homepage ready for review' },
    },
  ];
}

export async function installMockBackend(
  target: Page | BrowserContext,
  options: MockBackendOptions = {}
): Promise<MockBackendHandle> {
  const websites = new Map<string, WebsiteRow>();
  const pages = new Map<string, PageRow>();
  const requestLog: string[] = [];
  let generationBehavior: GenerationBehavior = options.generation ?? { kind: 'success' };
  let aiCalls = 0;

  // --- Our own API: templates (not under test here; empty list keeps
  // the dashboard's Templates section rendering its empty state) -----
  await target.route('**/api/builder/templates*', async (route) => {
    requestLog.push(`GET ${route.request().url()}`);
    await json(route, 200, { success: true, data: { templates: [] } });
  });

  // --- Our own API: sites ---------------------------------------------
  // A trailing `*` is required: getWebsites() calls this with `?businessId=...`
  // and a bare, non-wildcarded glob only matches the exact URL with nothing
  // after it, so the GET (list) call would silently fall through to the
  // real (unmocked) route while the POST (create, no query string) matched.
  await target.route('**/api/builder/sites*', async (route) => {
    const req = route.request();
    requestLog.push(`${req.method()} ${req.url()}`);
    if (req.method() === 'GET') {
      await json(route, 200, { success: true, data: { websites: Array.from(websites.values()).map(websiteToListShape) } });
      return;
    }
    if (req.method() === 'POST') {
      if (options.createDelayMs) await new Promise((r) => setTimeout(r, options.createDelayMs));
      const body = req.postDataJSON() as { businessId: string; name: string; description?: string; templateId?: string };
      const now = new Date().toISOString();
      const row: WebsiteRow = {
        id: nextId('website'),
        business_id: body.businessId,
        name: body.name,
        description: body.description,
        status: 'draft',
        template_id: body.templateId ?? null,
        created_at: now,
        updated_at: now,
        web_pages: [],
      };
      websites.set(row.id, row);
      await json(route, 200, { success: true, data: websiteToCreateResponseShape(row) });
      return;
    }
    await route.fallback();
  });

  await target.route(/\/api\/builder\/sites\/[^/?]+$/, async (route) => {
    const req = route.request();
    requestLog.push(`${req.method()} ${req.url()}`);
    const id = req.url().split('?')[0].split('/').pop()!;
    const row = websites.get(id);
    if (!row) {
      await json(route, 404, { success: false, error: 'Website not found' });
      return;
    }
    if (req.method() === 'GET') {
      await json(route, 200, { success: true, data: websiteToCreateResponseShape(row) });
      return;
    }
    if (req.method() === 'PUT') {
      const body = req.postDataJSON() as Partial<WebsiteRow>;
      Object.assign(row, body, { updated_at: new Date().toISOString() });
      await json(route, 200, { success: true, data: websiteToCreateResponseShape(row) });
      return;
    }
    if (req.method() === 'DELETE') {
      websites.delete(id);
      await json(route, 200, { success: true, data: { success: true } });
      return;
    }
    await route.fallback();
  });

  // --- Our own API: pages ----------------------------------------------
  // Same trailing-`*` requirement as sites* above -- getPages() calls this
  // with `?businessId=...&websiteId=...`.
  await target.route('**/api/builder/pages*', async (route) => {
    const req = route.request();
    requestLog.push(`${req.method()} ${req.url()}`);
    if (req.method() === 'GET') {
      const url = new URL(req.url());
      const websiteId = url.searchParams.get('websiteId');
      const list = Array.from(pages.values())
        .filter((p) => !websiteId || p.website_id === websiteId)
        .map(pageToCreateResponseShape);
      await json(route, 200, { success: true, data: { pages: list } });
      return;
    }
    if (req.method() === 'POST') {
      if (options.createDelayMs) await new Promise((r) => setTimeout(r, options.createDelayMs));
      const body = req.postDataJSON() as { businessId: string; websiteId: string; title: string; slug: string };
      const now = new Date().toISOString();
      const row: PageRow = {
        id: nextId('page'),
        website_id: body.websiteId,
        business_id: body.businessId,
        title: body.title,
        slug: body.slug,
        content: { sections: [] },
        status: 'draft',
        version: 0,
        created_at: now,
        updated_at: now,
      };
      pages.set(row.id, row);
      const website = websites.get(body.websiteId);
      if (website) website.web_pages.push({ id: row.id });
      await json(route, 200, { success: true, data: pageToCreateResponseShape(row) });
      return;
    }
    await route.fallback();
  });

  await target.route(/\/api\/builder\/pages\/[^/?]+$/, async (route) => {
    const req = route.request();
    requestLog.push(`${req.method()} ${req.url()}`);
    const id = req.url().split('?')[0].split('/').pop()!;
    const row = pages.get(id);
    if (!row) {
      await json(route, 404, { success: false, error: 'Page not found' });
      return;
    }
    if (req.method() === 'GET') {
      // loadEditablePage() reads page.content / page.seo / page.version directly.
      await json(route, 200, {
        success: true,
        data: { ...pageToCreateResponseShape(row), content: row.content, seo: row.seo ?? {}, version: row.version },
      });
      return;
    }
    if (req.method() === 'PUT') {
      const body = req.postDataJSON() as { content?: unknown; expectedVersion?: number; title?: string; slug?: string; seo?: unknown };
      if (typeof body.expectedVersion === 'number' && body.expectedVersion !== row.version) {
        await json(route, 409, { success: false, error: 'This page was changed elsewhere -- reload before saving again.' });
        return;
      }
      if (body.content !== undefined) row.content = body.content;
      if (body.title !== undefined) row.title = body.title;
      if (body.slug !== undefined) row.slug = body.slug;
      if (body.seo !== undefined) row.seo = body.seo as PageRow['seo'];
      row.version += 1;
      row.updated_at = new Date().toISOString();
      await json(route, 200, { success: true, data: { version: row.version } });
      return;
    }
    if (req.method() === 'DELETE') {
      pages.delete(id);
      await json(route, 200, { success: true, data: { success: true } });
      return;
    }
    await route.fallback();
  });

  // --- Our own API: AI website-assist -----------------------------------
  await target.route('**/api/ai/website-assist', async (route) => {
    const req = route.request();
    requestLog.push(`${req.method()} ${req.url()}`);
    aiCalls += 1;
    const behavior = generationBehavior;
    if (behavior.delayMs) await new Promise((r) => setTimeout(r, behavior.delayMs));
    if (behavior.kind === 'failure') {
      await json(route, 200, { success: false, error: behavior.message });
      return;
    }
    const body = req.postDataJSON() as { instruction: string };
    await json(route, 200, {
      success: true,
      data: {
        explanation: 'Added the navbar preset and a hero heading based on your description.',
        operations: mockGenerationOperations(body.instruction),
        rejected: [],
      },
    });
  });

  return {
    websites,
    pages,
    requestLog,
    setGenerationBehavior(behavior) {
      generationBehavior = behavior;
    },
    aiCallCount() {
      return aiCalls;
    },
  };
}

/**
 * Seeds the fake-but-valid Supabase session cookie this app's browser
 * client (and middleware.ts, server-side) need to consider the user
 * logged in. Call before the first navigation.
 *
 * The cookie name is NOT the GoTrueClient default ('supabase.auth.token')
 * -- @supabase/supabase-js's own createClient() derives a URL-specific
 * storage key (`sb-<ref>-auth-token`) whenever no explicit storageKey is
 * configured, which neither middleware.ts nor lib/supabase/client.ts
 * override. For NEXT_PUBLIC_SUPABASE_URL = http://127.0.0.1:4100 (set in
 * playwright.config.ts's webServer env), that ref is '127' -- confirmed
 * empirically against this exact dev server, not derived from docs.
 */
const SUPABASE_AUTH_COOKIE_NAME = 'sb-127-auth-token';

export async function seedFakeSupabaseSession(context: BrowserContext, baseURL: string) {
  await context.addCookies([
    {
      name: SUPABASE_AUTH_COOKIE_NAME,
      value: supabaseSessionCookieValue(),
      url: baseURL,
    },
  ]);
}
