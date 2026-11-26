/**
 * Minimal, real local HTTP server standing in for Supabase's auth/REST API
 * for the browser E2E suite (see e2e/ai-website-creation.spec.ts).
 *
 * Why a real server instead of Playwright's page.route: NEXT_PUBLIC_SUPABASE_URL
 * is read both by the browser (BusinessContext's client-side Supabase calls)
 * AND by middleware.ts running inside the Next.js dev server process itself
 * (its own server-side getUser() call to gate /dashboard). Playwright's
 * route interception only sees requests the BROWSER makes -- it cannot see
 * or intercept the Next.js server's own outbound fetches. Pointing
 * NEXT_PUBLIC_SUPABASE_URL at a real local server means both the browser
 * and the dev server land on the same loopback mock, with no mismatch.
 *
 * Plain CommonJS/node:http on purpose -- this runs directly via
 * `node e2e/support/supabase-mock-server.cjs` from Playwright's webServer
 * config, with no build step and no new runtime dependency.
 */
const http = require('node:http');

const PORT = Number(process.env.SUPABASE_MOCK_PORT || 4100);
const TEST_USER_ID = 'e2e-test-user-0001';
const TEST_BUSINESS_ID = 'e2e-test-business-0001';

function userRecord() {
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

function businessRecord() {
  const now = new Date().toISOString();
  return {
    id: TEST_BUSINESS_ID,
    name: 'E2E Test Business',
    slug: 'e2e-test-business',
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
    access_token: 'e2e-fake-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: nowSeconds + 3600,
    refresh_token: 'e2e-fake-refresh-token',
    user: userRecord(),
  };
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  });
  res.end(payload);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    });
    res.end();
    return;
  }

  if (url.pathname === '/auth/v1/user') {
    send(res, 200, userRecord());
    return;
  }

  if (url.pathname === '/auth/v1/token') {
    send(res, 200, sessionRecord());
    return;
  }

  if (url.pathname === '/rest/v1/business_users') {
    send(res, 200, [{ business_id: TEST_BUSINESS_ID, role: 'owner', businesses: businessRecord() }]);
    return;
  }

  // middleware.ts's onboarding gate: `.from('my_businesses').select('id').limit(1)`.
  if (url.pathname === '/rest/v1/my_businesses') {
    send(res, 200, [{ id: TEST_BUSINESS_ID }]);
    return;
  }

  if (url.pathname.startsWith('/rest/v1/')) {
    send(res, 200, []);
    return;
  }

  send(res, 404, { message: 'not found in supabase mock server' });
});

server.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`[supabase-mock-server] listening on http://127.0.0.1:${PORT}`);
});
