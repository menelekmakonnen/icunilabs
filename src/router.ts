/**
 * Lightweight SPA router utilities.
 * Replaces hash-based navigation with clean URL paths using History API.
 *
 * Usage:
 *   - navigateTo('/portfolio')           — pushes /portfolio and triggers re-render
 *   - getPath()                          — returns current pathname, e.g. '/portfolio'
 *   - <a href="/portfolio" onClick={handleLinkClick}>  — prevents full reload
 */

/** Navigate to a new path without full page reload */
export function navigateTo(path: string) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

/** Get current clean path (e.g. '/portfolio', '/project/orbit') */
export function getPath(): string {
    return window.location.pathname;
}

/**
 * Click handler for SPA links. Attach to <a> elements to prevent full reload.
 * Ignores: external links, new-tab clicks, modified clicks (ctrl/meta/shift).
 *
 * Usage:  <a href="/contact" onClick={handleLinkClick}>Contact</a>
 */
export function handleLinkClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Let browser handle: new tab, external links, modified clicks
    if (
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
        e.button !== 0
    ) return;

    const href = e.currentTarget.getAttribute('href');
    if (!href) return;

    // External links — let browser handle
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    // In-page anchor on homepage (e.g. scroll to #contact section)
    if (href.startsWith('/#')) {
        e.preventDefault();
        const sectionId = href.replace('/#', '');
        // If already on homepage, just scroll
        if (window.location.pathname === '/') {
            const el = document.getElementById(sectionId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
                return;
            }
        }
        // Otherwise navigate home first, then scroll
        navigateTo('/');
        requestAnimationFrame(() => {
            setTimeout(() => {
                const el = document.getElementById(sectionId);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });
        return;
    }

    e.preventDefault();
    navigateTo(href);
    window.scrollTo(0, 0);
}
