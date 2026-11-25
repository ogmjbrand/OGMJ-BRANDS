import { defineConfig, devices } from '@playwright/test';

/**
 * Browser-level regression coverage for the AI-powered "New Website" flow
 * (see e2e/ai-website-creation.spec.ts). Every network call this app makes
 * -- Supabase auth/REST and our own /api/builder & /api/ai routes -- is
 * mocked at the page.route level in e2e/support/mockBackend.ts, so this
 * suite needs no live Supabase project or AI provider key: it exercises
 * the real client bundle (real React tree, real sessionStorage, real
 * routing, real Document Model operations) against a real dev server.
 *
 * Uses the sandbox's pre-installed Chromium directly (see CLAUDE
 * environment notes) instead of `playwright install`, since this
 * container has no browser download path.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'off',
    launchOptions: {
      executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
      args: ['--no-sandbox'],
    },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      // devices['iPhone 13'] implies WebKit (its defaultBrowserType) --
      // this sandbox only has Chromium installed (see the module doc
      // above), so browserName is forced back to chromium explicitly
      // while keeping the rest of the device's mobile viewport/UA/touch
      // profile for the responsive checks this suite cares about.
      name: 'mobile',
      use: { ...devices['iPhone 13'], browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      // A real local HTTP server, not a Playwright route mock: both the
      // browser AND the Next.js dev server's own middleware make direct
      // Supabase calls, and only a real server on loopback can answer both
      // (see supabase-mock-server.cjs's module doc for why).
      command: 'node e2e/support/supabase-mock-server.cjs',
      url: 'http://127.0.0.1:4100/auth/v1/user',
      reuseExistingServer: true,
      timeout: 15_000,
    },
    {
      // A production build+start, not `next dev`: React 18 Strict Mode
      // double-invokes effects in dev only, which double-fires every
      // mount effect in this app (including the one-shot sessionStorage
      // generation handoff) and does not reflect what actually ships.
      // Testing against the same build users get is also just the more
      // faithful check.
      command: 'npm run build && npm run start -- -p 3100',
      url: 'http://127.0.0.1:3100',
      reuseExistingServer: true,
      timeout: 180_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:4100',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-test-anon-key',
        NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3100',
      },
    },
  ],
});
