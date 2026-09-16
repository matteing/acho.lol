import type { PhrasingContent, Root } from 'mdast';
import type { Extension as MarkdownExtension } from 'mdast-util-from-markdown';
import type { Code, Extension, State, Tokenizer } from 'micromark-util-types';
import type { Plugin } from 'unified';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { text } from './ast';

const labelParser = unified().use(remarkParse).use(remarkGfm);

/** Labels allow inline formatting without introducing nested links or HTML. */
export function parseWikilinkLabel(label: string): PhrasingContent[] {
  const tree = labelParser.parse(label);
  const paragraph = tree.children[0];
  if (tree.children.length !== 1 || paragraph?.type !== 'paragraph') return [text(label)];

  function inline(node: PhrasingContent): PhrasingContent {
    switch (node.type) {
      case 'text':
      case 'inlineCode':
      case 'break':
        return node;
      case 'emphasis':
      case 'strong':
      case 'delete':
        return { ...node, children: node.children.map(inline) };
      default:
        return text(label.slice(node.position?.start.offset, node.position?.end.offset));
    }
  }

  return paragraph.children.map(inline);
}

/** Micromark keeps wiki syntax out of escaped text, fenced code, and HTML. */
export const remarkWikilinks: Plugin<[], Root> = function () {
  const data = this.data();
  const syntax: Extension = {
    text: { 91: { name: 'wikiLink', tokenize } },
  };
  const compiler: MarkdownExtension = {
    enter: {
      wikiLink(token) {
        this.enter({ type: 'wikiLink', value: '' }, token);
      },
    },
    exit: {
      wikiLink(token) {
        const node = this.stack.at(-1);
        if (node?.type !== 'wikiLink') {
          throw new Error('Expected a wiki link on the Markdown compiler stack.');
        }
        node.value = this.sliceSerialize(token).slice(2, -2);
        this.exit(token);
      },
    },
  };
  (data.micromarkExtensions ??= []).push(syntax);
  (data.fromMarkdownExtensions ??= []).push(compiler);
};

const tokenize: Tokenizer = function (effects, ok, nok) {
  let size = 0;
  return start;

  function start(code: Code): State | undefined {
    effects.enter('wikiLink');
    effects.consume(code);
    return second;
  }

  function second(code: Code): State | undefined {
    if (code !== 91) return nok(code);
    effects.consume(code);
    return inside;
  }

  function inside(code: Code): State | undefined {
    if (code === null || code < 0 || code === 10 || code === 13 || code === 91) {
      return nok(code);
    }
    if (code === 93) {
      if (!size) return nok(code);
      effects.consume(code);
      return close;
    }
    effects.consume(code);
    size++;
    return code === 92 ? escaped : inside;
  }

  function escaped(code: Code): State | undefined {
    if (code === null || code < 0 || code === 10 || code === 13) return nok(code);
    effects.consume(code);
    size++;
    return inside;
  }

  function close(code: Code): State | undefined {
    if (code !== 93) return nok(code);
    effects.consume(code);
    effects.exit('wikiLink');
    return ok;
  }
};

export function splitWikilink(value: string): { target: string; label: string } {
  let separator = -1;
  for (let index = 0; index < value.length; index++) {
    if (value[index] === '\\') {
      index++;
      continue;
    }
    if (value[index] === '|') {
      separator = index;
      break;
    }
  }
  const unescape = (text: string) => text.replace(/\\([\\|[\]])/g, '$1');
  const target = unescape(separator < 0 ? value : value.slice(0, separator)).trim();
  const label =
    separator < 0
      ? (target.split('/').at(-1) ?? target).replace(/\.md$/i, '')
      : unescape(value.slice(separator + 1));
  return { target, label };
}
