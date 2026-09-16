import { defineCollection } from 'astro:content';
import { wikiLoader } from '@/lib/wiki/loader';
import { wikiPageSchema } from '@/lib/wiki/schema';

export const collections = {
  wiki: defineCollection({ loader: wikiLoader(), schema: wikiPageSchema }),
};
