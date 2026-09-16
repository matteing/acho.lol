import type {
  Article,
  BreadcrumbList,
  Graph,
  Organization,
  WebPage,
  WebSite,
  Thing,
} from 'schema-dts';
import { sectionLabel } from '../../i18n/translate';
import { absoluteUrl, siteConfig } from '../../site.config';
import type { WikiPage } from '../wiki/types';
import type { PageMetadata } from './metadata';

export function structuredData(
  page: WikiPage,
  metadata: PageMetadata,
  title: string,
  description: string,
): string {
  const { canonical, breadcrumbs, article, published } = metadata;
  const websiteId = absoluteUrl('/#website');
  const publisherId = absoluteUrl('/#publisher');
  const pageId = `${canonical}#webpage`;
  const publisher: Organization = {
    '@type': 'Organization',
    '@id': publisherId,
    name: siteConfig.name,
    url: absoluteUrl('/'),
    logo: { '@type': 'ImageObject', url: absoluteUrl(siteConfig.logo) },
  };
  const website: WebSite = {
    '@type': 'WebSite',
    '@id': websiteId,
    url: absoluteUrl('/'),
    name: siteConfig.name,
    inLanguage: [...siteConfig.languages],
    publisher: { '@id': publisherId },
  };
  const webPage: WebPage = {
    '@type': page.kind === 'section' ? 'CollectionPage' : 'WebPage',
    '@id': pageId,
    url: canonical,
    name: title,
    description,
    inLanguage: page.lang,
    isPartOf: { '@id': websiteId },
    ...(page.lastmod ? { dateModified: page.lastmod } : {}),
    ...(breadcrumbs.length ? { breadcrumb: { '@id': `${canonical}#breadcrumb` } } : {}),
    ...(article ? { mainEntity: { '@id': `${canonical}#article` } } : {}),
  };
  const entities: Thing[] = [publisher, website, webPage];

  if (breadcrumbs.length) {
    const breadcrumbList: BreadcrumbList = {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: absoluteUrl(crumb.url),
      })),
    };
    entities.push(breadcrumbList);
  }

  if (article) {
    // A branded share card is not a photograph of the subject. Article.image
    // therefore uses an actual content image, when the entry contains one.
    const contentImage = /<img\b[^>]*\bsrc="([^"]+)"/
      .exec(page.html)?.[1]
      ?.replaceAll('&amp;', '&');
    const articleData: Article = {
      '@type': 'Article',
      '@id': `${canonical}#article`,
      headline: title,
      description,
      inLanguage: page.lang,
      url: canonical,
      mainEntityOfPage: { '@id': pageId },
      publisher: { '@id': publisherId },
      articleSection: sectionLabel(page.lang, page.section),
      ...(published ? { datePublished: published } : {}),
      ...(page.lastmod ? { dateModified: page.lastmod } : {}),
      ...(contentImage ? { image: [absoluteUrl(contentImage)] } : {}),
    };
    entities.push(articleData);
  }

  // Keep editorial text from terminating the inline JSON script element.
  const graph: Graph = { '@context': 'https://schema.org', '@graph': entities };
  return JSON.stringify(graph).replaceAll('<', '\\u003c');
}
