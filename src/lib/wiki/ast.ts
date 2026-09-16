import type { Blockquote, Link, Literal, Parent, RootContent, Text } from 'mdast';
import type {} from 'remark-directive';

export interface WikiLink extends Literal {
  type: 'wikiLink';
  value: string;
}

export interface UnresolvedLink extends Parent {
  type: 'unresolvedLink';
  children: Link['children'];
}

export interface Callout extends Parent {
  type: 'callout';
  children: Blockquote['children'];
}

export type Directive = Extract<
  RootContent,
  {
    type: 'leafDirective' | 'containerDirective' | 'textDirective';
  }
>;

declare module 'mdast' {
  interface PhrasingContentMap {
    wikiLink: WikiLink;
    unresolvedLink: UnresolvedLink;
  }
  interface BlockContentMap {
    callout: Callout;
  }
  interface RootContentMap {
    wikiLink: WikiLink;
    unresolvedLink: UnresolvedLink;
    callout: Callout;
  }
}

declare module 'micromark-util-types' {
  interface TokenTypeMap {
    wikiLink: 'wikiLink';
  }
}

export function text(value: string): Text {
  return { type: 'text', value };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
