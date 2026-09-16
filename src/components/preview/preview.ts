import { t } from '@/i18n/translate';
import type { Language } from '@/i18n/locales';
import type { PreviewPayload } from '@/lib/preview';
import { isPreviewPayload } from '@/lib/preview';
import type { SurfaceController } from '@/lib/ui';

interface PreviewOptions {
  lang: Language;
  mobileQuery: MediaQueryList;
  canOpen: () => boolean;
}

export function initPreviews({
  lang,
  mobileQuery,
  canOpen,
}: PreviewOptions): SurfaceController | undefined {
  const panel = document.querySelector<HTMLElement>('.page-preview');
  if (!panel) return;
  const title = panel.querySelector<HTMLAnchorElement>('.preview-title-link');
  const excerpt = panel.querySelector<HTMLElement>('.preview-excerpt');
  if (!title || !excerpt) return;
  const preview = panel;
  const previewTitle = title;
  const previewExcerpt = excerpt;
  const previewCache = new Map<string, Promise<PreviewPayload>>();
  document.querySelectorAll<HTMLAnchorElement>('a[data-preview]').forEach((anchor) => {
    const updatePreviewSemantics = () => {
      if (mobileQuery.matches) {
        anchor.removeAttribute('aria-haspopup');
        anchor.removeAttribute('aria-controls');
      } else {
        anchor.setAttribute('aria-haspopup', 'dialog');
        anchor.setAttribute('aria-controls', 'page-preview');
      }
    };
    updatePreviewSemantics();
    mobileQuery.addEventListener('change', updatePreviewSemantics);
    anchor.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' && !preview.hidden && previewAnchor === anchor) {
        event.preventDefault();
        previewTitle.focus();
      }
    });
  });
  let previewAnchor: HTMLAnchorElement | null = null;
  let previewSequence = 0;
  let previewTimer: ReturnType<typeof setTimeout>;
  let hideTimer: ReturnType<typeof setTimeout>;
  function hidePreview() {
    clearTimeout(previewTimer);
    clearTimeout(hideTimer);
    ++previewSequence;
    preview.hidden = true;
    previewAnchor?.removeAttribute('aria-expanded');
    previewAnchor = null;
  }
  function deferHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (
        !preview.matches(':hover') &&
        !preview.contains(document.activeElement) &&
        !previewAnchor?.matches(':hover') &&
        document.activeElement !== previewAnchor
      )
        hidePreview();
    }, 180);
  }
  function positionPreview(anchor: HTMLAnchorElement) {
    const rect = anchor.getBoundingClientRect();
    const card = preview.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) {
      hidePreview();
      return;
    }
    const left = Math.max(16, Math.min(rect.left, innerWidth - card.width - 16));
    const top =
      rect.bottom + card.height + 16 <= innerHeight
        ? rect.bottom + 9
        : Math.max(16, rect.top - card.height - 9);
    preview.style.left = `${left}px`;
    preview.style.top = `${Math.max(16, Math.min(top, innerHeight - card.height - 16))}px`;
  }
  async function showPreview(anchor: HTMLAnchorElement) {
    if (mobileQuery.matches || !canOpen()) return;
    let url: URL;
    try {
      url = new URL(anchor.dataset.preview ?? anchor.href, location.origin);
    } catch {
      return;
    }
    if (url.origin !== location.origin) return;
    const current = ++previewSequence;
    previewAnchor?.removeAttribute('aria-expanded');
    previewAnchor = anchor;
    const endpoint = `${url.pathname.replace(/\/?$/, '/')}preview.json`;
    if (!previewCache.has(endpoint))
      previewCache.set(
        endpoint,
        fetch(endpoint)
          .then(async (response) => {
            if (!response.ok) throw new Error('Preview unavailable');
            const payload: unknown = await response.json();
            if (!isPreviewPayload(payload)) throw new Error('Invalid preview data');
            return payload;
          })
          .catch((error) => {
            previewCache.delete(endpoint);
            throw error;
          }),
      );
    try {
      const data = await previewCache.get(endpoint);
      if (!data) return;
      if (current !== previewSequence) return;
      previewTitle.textContent = data.title;
      previewExcerpt.textContent = data.excerpt || t(lang, 'previewError');
      previewTitle.href = url.pathname + url.hash;
      preview.lang = data.lang || lang;
      preview.hidden = false;
      positionPreview(anchor);
      anchor.setAttribute('aria-expanded', 'true');
    } catch {
      if (current === previewSequence) hidePreview();
    }
  }
  function queuePreview(anchor: HTMLAnchorElement, delay: number) {
    clearTimeout(hideTimer);
    clearTimeout(previewTimer);
    if (anchor === previewAnchor && !preview.hidden) return;
    ++previewSequence;
    previewTimer = setTimeout(() => void showPreview(anchor), delay);
  }
  document.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'touch' || !(event.target instanceof Element)) return;
    const anchor = event.target.closest<HTMLAnchorElement>('a[data-preview]');
    if (
      anchor &&
      !anchor.contains(event.relatedTarget instanceof Node ? event.relatedTarget : null)
    )
      queuePreview(anchor, 240);
  });
  document.addEventListener('pointerout', (event) => {
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest('a[data-preview]');
    if (
      anchor &&
      !anchor.contains(event.relatedTarget instanceof Node ? event.relatedTarget : null)
    ) {
      clearTimeout(previewTimer);
      deferHide();
    }
  });
  document.addEventListener('focusin', (event) => {
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest<HTMLAnchorElement>('a[data-preview]');
    if (anchor) queuePreview(anchor, 150);
  });
  document.addEventListener('focusout', (event) => {
    if (
      event.target instanceof Element &&
      (event.target.closest('a[data-preview]') || preview.contains(event.target))
    ) {
      clearTimeout(previewTimer);
      deferHide();
    }
  });
  preview.addEventListener('pointerenter', () => clearTimeout(hideTimer));
  preview.addEventListener('pointerleave', deferHide);
  window.addEventListener('resize', hidePreview);
  window.addEventListener(
    'scroll',
    () => {
      if (!preview.hidden && previewAnchor) positionPreview(previewAnchor);
    },
    { passive: true, capture: true },
  );
  document.addEventListener('click', (event) => {
    if (event.target instanceof Element && !preview.contains(event.target)) hidePreview();
  });

  return {
    isOpen: () => !preview.hidden,
    close: () => {
      const anchor = previewAnchor;
      const hadFocus = preview.contains(document.activeElement);
      hidePreview();
      if (hadFocus) {
        anchor?.focus();
        clearTimeout(previewTimer);
      }
    },
  };
}
