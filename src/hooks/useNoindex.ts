import { useEffect } from 'react';

/**
 * Adds `<meta name="robots" content="noindex, nofollow">` for the lifetime of
 * the component, then removes it on unmount.
 *
 * Used on the Atlas deep *report* routes (2026-07-19): with the email wall off,
 * the full reports are openly viewable for traction — but we don't want the deep
 * layer permanently search-indexed and cached, which would make re-gating a
 * one-way door. The catalog and summary pages are deliberately left indexable so
 * the landscape stays discoverable. robots.txt is NOT used to block these (a
 * Disallow would stop crawlers from ever seeing this noindex); crawl is allowed,
 * indexing is declined.
 */
export function useNoindex(): void {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);
}
