import { defineConfig, devices } from '@playwright/test';

/**
 * Browser-level regression coverage for the fixed-overlay containing-block
 * fix (see e2e/overlay-portal.spec.ts): PageTransition's framer-motion
 * motion.div animates y/scale via a persistent CSS transform, which
 * becomes the containing block for every position:fixed descendant on
 * that page -- breaking fixed overlays' positioning on any route whose
 * content overflows the viewport. Fixed by portaling every non-Radix
 * fixed overlay to document.body (components/ui/portal.tsx).
 *
 * Uses the sandbox's pre-installed Chromium directly instead of
 * `playwright install`, since this container has no browser download path.
 *
 * A separate config file (not the default playwright.config.ts) because
 * PR #79's AI-website-creation suite already owns that file, its own
 * e2e/support/supabase-mock-server.cjs, and ports 3100/4100 -- this suite
 * uses 3200/4200 and its own overlay-mock-server.cjs so both coexist.
 * Run with `npx playwright test -c playwright.overlay.config.ts`.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'overlay-portal.spec.ts',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3200',
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
      // this sandbox only has Chromium installed, so browserName is
      // forced back to chromium while keeping the rest of the device's
      // mobile viewport/UA/touch profile.
      name: 'mobile',
      use: { ...devices['iPhone 13'], browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'node e2e/support/overlay-mock-server.cjs',
      url: 'http://127.0.0.1:4200/auth/v1/user',
      reuseExistingServer: true,
      timeout: 15_000,
    },
    {
      // A production build+start, not `next dev`: tests the same build
      // users get, and avoids React Strict Mode's dev-only double-effect
      // noise.
      command: 'npm run build && npm run start -- -p 3200',
      url: 'http://127.0.0.1:3200',
      reuseExistingServer: true,
      timeout: 180_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:4200',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-overlay-test-anon-key',
        NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3200',
      },
    },
  ],
});
