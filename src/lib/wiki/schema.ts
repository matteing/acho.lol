import { z } from 'zod';
import { siteConfig } from '../../site.config';

export const languageSchema = z.enum(siteConfig.languages);
export const headingSchema = z.object({
  depth: z.number(),
  slug: z.string(),
  text: z.string(),
});

/** Shared by the standalone compiler and Astro's content collection. */
export const wikiPageSchema = z.object({
  id: z.string(),
  lang: languageSchema,
  sourcePath: z.string(),
  logicalPath: z.string(),
  url: z.string().startsWith('/'),
  title: z.string().min(1),
  translationKey: z.string().min(1),
  kind: z.enum(['home', 'section', 'article']),
  section: z.string(),
  tags: z.array(z.string()),
  aliases: z.array(z.string()),
  redirects: z.array(z.string()),
  description: z.string(),
  excerpt: z.string(),
  body: z.string(),
  html: z.string(),
  headings: z.array(headingSchema),
  outgoing: z.array(z.string()),
  backlinks: z.array(z.string()),
  translations: z.object({ es: z.string().optional(), en: z.string().optional() }),
  readingMinutes: z.number(),
  date: z.string().optional(),
  dateSource: z.string().optional(),
  lastmod: z.string().optional(),
  hasMermaid: z.boolean(),
  draft: z.boolean(),
});

const stringListSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => (typeof value === 'string' ? [value] : (value ?? [])));
const dateSchema = z
  .union([z.string(), z.date()])
  .optional()
  .transform((value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value));

export const frontmatterSchema = z.looseObject({
  title: z.string().optional(),
  lang: z.string().optional(),
  translationKey: z.string().optional(),
  tags: stringListSchema,
  aliases: stringListSchema,
  redirects: stringListSchema,
  description: z.string().optional(),
  date: dateSchema,
  created: dateSchema,
  lastmod: dateSchema,
  modified: dateSchema,
  dateSource: z.string().optional(),
  draft: z.boolean().default(false),
});

const knownIssueSchema = z.object({
  source: z.string(),
  target: z.string().optional(),
  code: z.string().optional(),
  reason: z.string().optional(),
});
export const knownIssuesSchema = z
  .union([z.array(knownIssueSchema), z.object({ issues: z.array(knownIssueSchema) })])
  .transform((value) => (Array.isArray(value) ? value : value.issues));

export const mediaManifestSchema = z.record(
  z.string(),
  z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    src: z.string().optional(),
    srcset: z.string().optional(),
    original: z.string().optional(),
  }),
);
