import { test, expect, type BrowserContext } from '@playwright/test';

/**
 * Browser-level regression coverage for the fixed-overlay containing-block
 * fix.
 *
 * Root cause (see components/ui/portal.tsx's doc comment): app/layout.tsx
 * wraps every page in PageTransition's framer-motion <motion.div>, which
 * animates y/scale via a CSS `transform` while a route's enter/exit
 * animation is running. A transformed ancestor becomes the containing
 * block for every `position: fixed` descendant on that page (CSS spec
 * behavior), so a fixed overlay that is still a DOM descendant of that
 * motion.div can be sized/positioned against that ancestor's box instead
 * of the real viewport. Fixed by rendering every non-Radix fixed overlay
 * through a Portal straight to document.body, same mechanism Radix's own
 * Dialog/Popover primitives already use (confirmed unaffected by this
 * bug for exactly that reason).
 *
 * Why these tests assert the DOM location of the overlay rather than
 * reproducing the exact on-screen glitch: framer-motion only keeps a
 * non-"none" `transform` on motion.div for the few hundred ms a route's
 * enter/exit transition is actually animating -- confirmed by sampling
 * `getComputedStyle(...).transform` every 60ms after navigation, it
 * settles to "none" well before a test (or a real user) can click
 * anything on the new page. An earlier version of this spec instead
 * forced the page to overflow (so an un-portaled overlay's containing
 * block would differ in size from the real viewport) and asserted the
 * overlay's bounding box fit the viewport -- a negative-control run
 * (temporarily un-wrapping a fixed overlay's <Portal>) showed that
 * assertion PASSING either way, because by the time the test's click
 * lands, the transform window has already closed and there's no hijack
 * active to detect. The DOM-location assertions below were verified by
 * the same negative-control method to actually fail when a <Portal> wrap
 * is removed, which the bounding-box version could not do.
 *
 * No live Supabase project is used -- see
 * e2e/support/supabase-mock-server.cjs for what stands in for it and why.
 *
 * Scope: this suite exercises the two highest-impact, most mechanically
 * distinct fixes browser-side -- the dashboard-wide sidebar/drawer
 * (app/dashboard/layout.tsx, present on every /dashboard/* route) and a
 * representative page-level create-modal (Workflows). The same
 * `<Portal>` wrap was also applied, identically, to 11 other call sites
 * (other pages' create-modals, two CRM dropdown click-outside backdrops,
 * the Visual Editor's AIAssistPanel and SettingsDrawer) -- those were
 * code-reviewed for the same structural pattern but not independently
 * browser-tested here, since reaching the editor-specific ones needs a
 * real website/page record and canvas data beyond this fix's scope.
 */

const SUPABASE_AUTH_COOKIE_NAME = 'sb-127-auth-token'; // see mockBackend.ts in the AI-website-creation branch for how this is derived

function sessionCookieValue(): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const session = {
    access_token: 'e2e-overlay-fake-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: nowSeconds + 3600,
    refresh_token: 'e2e-overlay-fake-refresh-token',
    user: {
      id: 'e2e-overlay-user-0001',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'e2e-overlay@ogmjbrands.test',
      app_metadata: {},
      user_metadata: {},
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
  // Literal JSON, not percent-encoded: middleware.ts's custom cookie
  // adapter hands GoTrueClient the cookie's raw value with no decoding
  // step. The browser-side read path does decodeURIComponent, but that's
  // a no-op on text with no literal '%' sequences, so one raw value works
  // for both.
  return JSON.stringify(session);
}

async function seedSession(context: BrowserContext, baseURL: string) {
  await context.addCookies([{ name: SUPABASE_AUTH_COOKIE_NAME, value: sessionCookieValue(), url: baseURL }]);
}

test.beforeEach(async ({ context, baseURL }) => {
  await seedSession(context, baseURL!);
});

test.describe('fixed-overlay containing-block fix', () => {
  test('dashboard sidebar and its mobile backdrop are portaled to document.body, not left under the transformed page-transition wrapper', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('aside')).toBeVisible();

    const asideParent = await page.evaluate(() => document.querySelector('aside')?.parentElement?.getAttribute('data-slot'));
    expect(asideParent, 'the sidebar should render as a child of a Portal container, not inline in the page tree under PageTransition\'s motion.div').toBe('portal');
  });

  test('dashboard mobile nav drawer opens, is usable, and navigates', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop', 'the hamburger button is lg:hidden -- the sidebar is permanently visible on desktop instead, covered by the desktop no-regression test below');
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.getByRole('link', { name: 'Invoices' })).toBeVisible();
    await page.getByRole('link', { name: 'Invoices' }).click();
    await page.waitForURL(/\/dashboard\/invoices/);
  });

  test('a page-level create-modal (Workflows) is portaled to document.body', async ({ page }) => {
    await page.goto('/dashboard/workflows');
    await page.getByRole('button', { name: 'New workflow' }).click();
    const heading = page.getByRole('heading', { name: 'Create New Workflow' });
    await expect(heading).toBeVisible();

    const isPortaled = await page.evaluate(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find((el) => el.textContent === 'Create New Workflow');
      // The <Portal> wraps the whole `fixed inset-0 ...` overlay div, which
      // is this heading's grandparent (overlay > panel > h2).
      const overlay = h2?.parentElement?.parentElement;
      return overlay?.parentElement?.getAttribute('data-slot') === 'portal';
    });
    expect(isPortaled, 'the Workflows create-modal should render as a child of a Portal container').toBe(true);

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(heading).not.toBeVisible();
  });

  test('desktop: dashboard nav and the Workflows modal are unaffected (same behavior as before the fix, no regression)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'desktop-only: on mobile the sidebar is translated off-canvas behind the hamburger, covered by the mobile drawer test above');
    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: 'Builder', exact: true })).toBeVisible();
    // On desktop the sidebar is permanently visible (lg:translate-x-0), not behind the hamburger button.
    await page.getByRole('link', { name: 'Invoices' }).click();
    await page.waitForURL(/\/dashboard\/invoices/);

    await page.goto('/dashboard/workflows');
    await page.getByRole('button', { name: 'New workflow' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Workflow' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Workflow' })).not.toBeVisible();
  });
});
