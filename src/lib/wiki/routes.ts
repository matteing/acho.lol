import type { WikiPage } from './types';
import { routeParam } from './urls';

interface PageRoute {
  params: { path: string | undefined };
  props: { page: WikiPage; view: 'entry' | 'redirect' };
}

/** Validate all generated routes together, so aliases cannot shadow entries. */
export function pageRoutes(pages: WikiPage[]): PageRoute[] {
  const routes: PageRoute[] = pages.map((page) => ({
    params: { path: routeParam(page.url) },
    props: { page, view: 'entry' },
  }));
  for (const page of pages) {
    for (const redirect of page.redirects) {
      if (!redirect.startsWith('/') || redirect.startsWith('//') || /[?#]/.test(redirect)) {
        throw new Error(
          `${page.sourcePath}: redirects must be local absolute paths without a query or fragment`,
        );
      }
      routes.push({ params: { path: routeParam(redirect) }, props: { page, view: 'redirect' } });
    }
  }
  const seen = new Set<string | undefined>();
  for (const route of routes) {
    if (seen.has(route.params.path))
      throw new Error(`Duplicate public route: ${route.params.path ?? '/'}`);
    seen.add(route.params.path);
  }
  return routes;
}
