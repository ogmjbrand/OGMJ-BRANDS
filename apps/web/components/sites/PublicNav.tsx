import { safeHref } from '@/lib/document-model';
import type { PublicPageListEntry } from '@/lib/sites/public-site';
import type { NavLink, SiteNavigation } from '@/lib/services/navigation.service';

/**
 * Renders the site-wide nav Phase 3's navigation manager
 * (`lib/services/navigation.service.ts`, `websites.settings.navigation`)
 * already lets a business author, but which had no public renderer to
 * consume it until now. An internal link stores a `pageId`, never a
 * captured href/slug -- `resolveHref` below re-resolves it against the
 * CURRENT list of this website's published pages on every render, the same
 * guarantee `resolveNavHref` (the authenticated-editor equivalent) gives:
 * renaming a page's slug can never leave a stale or broken nav link.
 *
 * SECURITY: re-validates an external href at render time (never trust that
 * whatever wrote `settings.navigation` already did) -- same allow-list the
 * document model's own links use.
 */

function resolveHref(link: NavLink, pages: PublicPageListEntry[]): string | undefined {
  if (link.target.type === 'external') return safeHref(link.target.href);
  const page = pages.find((p) => p.id === link.target.pageId);
  return page ? `/${page.slug}` : undefined;
}

function NavLinks({ links, pages, className }: { links: NavLink[]; pages: PublicPageListEntry[]; className?: string }) {
  if (links.length === 0) return null;
  return (
    <ul className={className}>
      {links.map((link) => {
        const href = resolveHref(link, pages);
        return (
          <li key={link.id} className="relative">
            {href ? (
              <a href={href} className="text-sm text-white/80 hover:text-white">
                {link.label}
              </a>
            ) : (
              <span className="text-sm text-white/40">{link.label}</span>
            )}
            {link.children && link.children.length > 0 ? (
              <ul className="ml-3 mt-1 space-y-1 border-l border-white/10 pl-3">
                {link.children.map((child) => {
                  const childHref = resolveHref(child, pages);
                  return (
                    <li key={child.id}>
                      {childHref ? (
                        <a href={childHref} className="text-xs text-white/60 hover:text-white">
                          {child.label}
                        </a>
                      ) : (
                        <span className="text-xs text-white/30">{child.label}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function PublicSiteNav({ navigation, pages, position }: { navigation: SiteNavigation; pages: PublicPageListEntry[]; position: 'main' | 'footer' }) {
  const links = position === 'main' ? navigation.main : navigation.footer;
  if (links.length === 0) return null;
  return <NavLinks links={links} pages={pages} className={position === 'main' ? 'flex items-center gap-5' : 'flex flex-wrap gap-4'} />;
}
