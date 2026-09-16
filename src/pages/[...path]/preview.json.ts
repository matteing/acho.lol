import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { getPages } from '@/lib/wiki/queries';
import { routeParam } from '@/lib/wiki/urls';
import type { PreviewPayload } from '@/lib/preview';

export const getStaticPaths = (async () =>
  (await getPages()).map((page) => ({
    params: { path: routeParam(page.url) },
    props: { page },
  }))) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = ({ props: { page } }) => {
  const preview: PreviewPayload = {
    title: page.title,
    excerpt: page.excerpt,
    lang: page.lang,
    url: page.url,
  };
  return Response.json(preview);
};
