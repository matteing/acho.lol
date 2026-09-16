import { t } from '@/i18n/translate';
import type { Language } from '@/i18n/locales';
import { isDark } from './theme';

export function initDiagrams(lang: Language): void {
  const diagrams = [...document.querySelectorAll<HTMLElement>('pre.mermaid')];
  if (diagrams.length) {
    const originals = new Map(diagrams.map((node) => [node, node.textContent || '']));
    import('mermaid')
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: isDark() ? 'dark' : 'base',
          fontFamily: 'Instrument Sans, sans-serif',
          themeVariables: {
            primaryColor: isDark() ? '#24212a' : '#fdf9f4',
            primaryTextColor: isDark() ? '#dfdae0' : '#2f2c32',
            primaryBorderColor: '#a8294d',
            lineColor: isDark() ? '#b0a8b3' : '#6b646a',
          },
        });
        for (const node of diagrams) {
          try {
            await mermaid.run({ nodes: [node], suppressErrors: true });
          } catch {
            node.textContent = `${t(lang, 'diagramError')}\n\n${originals.get(node)}`;
            node.classList.add('mermaid-error');
          }
        }
      })
      .catch(() =>
        diagrams.forEach((node) => {
          node.textContent = `${t(lang, 'diagramError')}\n\n${originals.get(node)}`;
          node.classList.add('mermaid-error');
        }),
      );
  }
}
