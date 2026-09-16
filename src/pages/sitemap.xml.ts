import type { APIRoute } from 'astro';
import { getPages } from '@/lib/wiki/queries';
import { sitemap } from '@/lib/seo/sitemap';

export const GET: APIRoute = async () =>
  new Response(sitemap(await getPages()), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
