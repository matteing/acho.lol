import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { WikiPage } from '../wiki/types';

const socialImageSchema = z.object({
  url: z.string().startsWith('/_social/'),
  width: z.number().positive(),
  height: z.number().positive(),
  alt: z.string().min(1),
});
const socialManifestSchema = z.record(z.string(), socialImageSchema);

export type SocialImage = z.infer<typeof socialImageSchema>;
export type SocialManifest = z.infer<typeof socialManifestSchema>;

let socialImages: SocialManifest | undefined;

/** Read and validate the manifest once per build, after cards are generated. */
export function socialImage(page: WikiPage): SocialImage {
  socialImages ??= socialManifestSchema.parse(
    JSON.parse(readFileSync(resolve('public/social-manifest.json'), 'utf8')),
  );
  const image = socialImages[page.id] ?? (!page.sourcePath ? socialImages['es/index'] : undefined);
  if (!image) {
    throw new Error(`Missing social image for ${page.id}. Run pnpm build to generate share cards.`);
  }
  return image;
}
