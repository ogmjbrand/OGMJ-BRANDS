/**
 * Minimal, real local HTTP server standing in for Supabase's auth/REST API
 * for this fix's browser regression suite (see e2e/overlay-portal.spec.ts).
 *
 * Why a real server instead of Playwright's page.route: NEXT_PUBLIC_SUPABASE_URL
 * is read both by the browser (BusinessContext's client-side Supabase calls)
 * AND by middleware.ts running inside the Next.js dev/production server
 * process itself (its own server-side getUser() call gating /dashboard).
 * Playwright's route interception only sees requests the BROWSER makes --
 * it cannot see or intercept the server's own outbound fetches. Pointing
 * NEXT_PUBLIC_SUPABASE_URL at a real local server means both the browser
 * and the server land on the same loopback mock, with no mismatch.
 *
 * Plain CommonJS/node:http on purpose -- runs directly via
 * `node e2e/support/supabase-mock-server.cjs` from Playwright's webServer
 * config, no build step, no new runtime dependency.
 */
const http = require('node:http');

const PORT = Number(process.env.SUPABASE_MOCK_PORT || 4200);
const TEST_USER_ID = 'e2e-overlay-user-0001';
const TEST_BUSINESS_ID = 'e2e-overlay-business-0001';

function userRecord() {
  const now = new Date().toISOString();
  return {
    id: TEST_USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'e2e-overlay@ogmjbrands.test',
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

function businessRecord() {
  const now = new Date().toISOString();
  return {
    id: TEST_BUSINESS_ID,
    name: 'E2E Overlay Test Business',
    slug: 'e2e-overlay-business',
    brand_color: '#C8FF00',
    currency: 'NGN',
    timezone: 'UTC',
    country: 'NG',
    industry: 'Retail',
    team_size: 5,
    metadata: {},
    created_at: now,
    updated_at: now,
    created_by: TEST_USER_ID,
  };
}

function sessionRecord() {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    access_token: 'e2e-overlay-fake-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: nowSeconds + 3600,
    refresh_token: 'e2e-overlay-fake-refresh-token',
    user: userRecord(),
  };
}

function send(req, res, status, body) {
  // PostgREST's `.single()`/`.maybeSingle()` sends
  // `Accept: application/vnd.pgrst.object+json` and returns the one row as
  // a bare object (406 if the row count isn't exactly one) rather than an
  // array. supabase-js's postgrest-js client trusts that header instead of
  // unwrapping arrays itself, so a mock that always answers with an array
  // silently breaks every `.single()` call's `data` shape (e.g. workflows
  // page's `business_users` lookup spun on its loading state forever,
  // since `data.business_id` read off an array is always undefined).
  const wantsSingleObject = typeof req.headers.accept === 'string' && req.headers.accept.includes('vnd.pgrst.object');
  if (wantsSingleObject && Array.isArray(body)) {
    if (body.length === 1) {
      body = body[0];
    } else if (status === 200) {
      status = body.length === 0 ? 406 : 500;
      body = { message: `JSON object requested, ${body.length} rows returned` };
    }
  }
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    // Echo back whatever headers this exact request's preflight asked
    // for, rather than hardcoding a list: the supabase-js client adds new
    // custom headers (x-supabase-api-version, accept-profile, ...) across
    // versions, and a fixed allowlist falls out of date whenever it does.
    'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  });
  res.end(payload);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || 'authorization, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    });
    res.end();
    return;
  }

  if (url.pathname === '/auth/v1/user') {
    send(req, res, 200, userRecord());
    return;
  }

  if (url.pathname === '/auth/v1/token') {
    send(req, res, 200, sessionRecord());
    return;
  }

  if (url.pathname === '/rest/v1/business_users') {
    send(req, res, 200, [{ business_id: TEST_BUSINESS_ID, role: 'owner', businesses: businessRecord() }]);
    return;
  }

  // middleware.ts's onboarding gate: `.from('my_businesses').select('id').limit(1)`.
  if (url.pathname === '/rest/v1/my_businesses') {
    send(req, res, 200, [{ id: TEST_BUSINESS_ID }]);
    return;
  }

  // Every other PostgREST table this suite's pages happen to query
  // (contacts, deals, pipeline_stages, workflows, revenue views, activity
  // logs, ...) -- an empty-but-valid list response is enough for each
  // page to reach its normal "nothing here yet" empty state, which is all
  // this suite needs: it only exercises overlay positioning, not CRUD data.
  if (url.pathname.startsWith('/rest/v1/')) {
    send(req, res, 200, []);
    return;
  }

  send(req, res, 404, { message: 'not found in supabase mock server' });
});

server.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`[supabase-mock-server] listening on http://127.0.0.1:${PORT}`);
});
