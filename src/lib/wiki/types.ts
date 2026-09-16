import type { z } from 'zod';
import type { headingSchema, languageSchema, mediaManifestSchema, wikiPageSchema } from './schema';

export type Language = z.infer<typeof languageSchema>;
export type Heading = z.infer<typeof headingSchema>;
export type WikiPage = z.infer<typeof wikiPageSchema>;
export type MediaManifest = z.infer<typeof mediaManifestSchema>;

export interface WikiDiagnostic {
  severity: 'warning' | 'error';
  code: string;
  source: string;
  target?: string;
  message: string;
}

export type ReportDiagnostic = (
  page: WikiPage,
  code: string,
  target: string,
  message: string,
) => void;

export interface WikiIndex {
  pages: WikiPage[];
  diagnostics: WikiDiagnostic[];
}

export interface WikiBuildOptions {
  contentDir?: string;
  publicDir?: string;
  /** Exact historical exceptions; newly broken references still fail. */
  knownIssuesFile?: string;
  includeDrafts?: boolean;
}
