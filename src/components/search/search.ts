import { t } from '@/i18n/translate';
import type { Language } from '@/i18n/locales';
import type { SurfaceController } from '@/lib/ui';

interface SearchHit {
  url: string;
  meta: { title?: string };
  excerpt: string;
}
interface SearchResults {
  results: { data: () => Promise<SearchHit> }[];
}
interface Pagefind {
  search: (query: string, options?: { filters?: Record<string, string> }) => Promise<SearchResults>;
  filters: () => Promise<Record<string, Record<string, number>>>;
  options?: (options: Record<string, unknown>) => Promise<void>;
}
interface SearchOptions {
  lang: Language;
  beforeOpen?: (trigger?: HTMLElement) => HTMLElement | undefined;
}

/** Pagefind is generated locally; check its public API before initializing it. */
function isPagefind(value: unknown): value is Pagefind {
  return (
    typeof value === 'object' &&
    value !== null &&
    'search' in value &&
    typeof value.search === 'function' &&
    'filters' in value &&
    typeof value.filters === 'function' &&
    (!('options' in value) || value.options === undefined || typeof value.options === 'function')
  );
}

export function initSearch({ lang, beforeOpen }: SearchOptions): SurfaceController | undefined {
  const dialog = document.querySelector<HTMLDialogElement>('#search-dialog');
  if (!dialog) return;
  const input = dialog.querySelector<HTMLInputElement>('#search-input');
  const status = dialog.querySelector<HTMLElement>('.search-status');
  const results = dialog.querySelector<HTMLOListElement>('.search-results');
  const more = dialog.querySelector<HTMLButtonElement>('.search-more');
  const section = dialog.querySelector<HTMLSelectElement>('#search-section');
  if (!input || !status || !results || !more || !section) return;
  const searchDialog = dialog;
  const searchInput = input;
  const searchStatus = status;
  const searchResults = results;
  const searchMore = more;
  const sectionSelect = section;
  const searchFilters = searchDialog.querySelector<HTMLElement>('.search-filters');
  let pagefindPromise: Promise<Pagefind> | undefined;
  let searchSequence = 0;
  let searchTimer: ReturnType<typeof setTimeout>;
  let searchTrigger: HTMLElement | null = null;
  let filtersLoaded = false;
  let activeResults: SearchResults['results'] = [];
  let resultOffset = 0;

  const getPagefind = () => {
    if (!pagefindPromise) {
      const modulePath = '/pagefind/pagefind.js';
      pagefindPromise = import(/* @vite-ignore */ modulePath)
        .then(async (imported: unknown) => {
          if (!isPagefind(imported)) throw new Error('Search API unavailable');
          await imported.options?.({ excerptLength: 28 });
          return imported;
        })
        .catch((error) => {
          pagefindPromise = undefined;
          throw error;
        });
    }
    return pagefindPromise;
  };

  const safeExcerpt = (excerpt: string) => {
    // Pagefind marks matching terms. Only copy text and <mark>; never inject result HTML.
    const source = new DOMParser().parseFromString(excerpt, 'text/html').body;
    const fragment = document.createDocumentFragment();
    const visit = (node: Node, parent: Node) => {
      if (node.nodeType === Node.TEXT_NODE)
        parent.appendChild(document.createTextNode(node.textContent ?? ''));
      else if (node instanceof Element && node.tagName === 'MARK') {
        const mark = document.createElement('mark');
        mark.textContent = node.textContent;
        parent.appendChild(mark);
      } else node.childNodes.forEach((child) => visit(child, parent));
    };
    source.childNodes.forEach((node) => visit(node, fragment));
    return fragment;
  };

  async function appendSearchResults(sequence: number) {
    searchMore.disabled = true;
    const batch = activeResults.slice(resultOffset, resultOffset + 20);
    const hits = await Promise.all(batch.map((hit) => hit.data()));
    if (sequence !== searchSequence) return;
    const fragment = document.createDocumentFragment();
    for (const hit of hits) {
      const url = new URL(hit.url, location.origin);
      if (url.origin !== location.origin) continue;
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = url.pathname + url.hash;
      const heading = document.createElement('h3');
      heading.textContent = hit.meta.title ?? decodeURIComponent(url.pathname);
      const excerpt = document.createElement('p');
      excerpt.append(safeExcerpt(hit.excerpt));
      link.append(heading, excerpt);
      li.append(link);
      fragment.append(li);
    }
    searchResults.append(fragment);
    resultOffset += batch.length;
    searchMore.hidden = resultOffset >= activeResults.length;
    searchMore.disabled = false;
  }

  async function runSearch() {
    const sequence = ++searchSequence;
    const query = searchInput.value.trim();
    searchResults.replaceChildren();
    searchMore.hidden = true;
    activeResults = [];
    resultOffset = 0;
    if (!query) {
      searchStatus.textContent = t(lang, 'searchHint');
      return;
    }
    searchStatus.textContent = t(lang, 'searchLoading');
    try {
      const pagefind = await getPagefind();
      const filters: Record<string, string> = {};
      if (sectionSelect.value) filters.section = sectionSelect.value;
      const result = await pagefind.search(
        query,
        Object.keys(filters).length ? { filters } : undefined,
      );
      if (sequence !== searchSequence) return;
      activeResults = result.results;
      searchStatus.textContent = result.results.length
        ? `${result.results.length} ${t(lang, result.results.length === 1 ? 'result' : 'results')}`
        : t(lang, 'noResults');
      await appendSearchResults(sequence);
      if (sequence !== searchSequence) return;
      if (!filtersLoaded) {
        filtersLoaded = true;
        const filterOptions = await pagefind.filters();
        for (const [section] of Object.entries(filterOptions.section ?? {}).sort((a, b) =>
          a[0].localeCompare(b[0], lang),
        )) {
          const option = document.createElement('option');
          option.value = section;
          option.textContent = section;
          sectionSelect.append(option);
        }
        if (sectionSelect.options.length > 1 && searchFilters) searchFilters.hidden = false;
      }
    } catch {
      if (sequence === searchSequence) searchStatus.textContent = t(lang, 'searchError');
    }
  }
  function openSearch(trigger?: HTMLElement) {
    if (searchDialog.open) return;
    trigger = beforeOpen?.(trigger) ?? trigger;
    searchTrigger =
      trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    searchDialog.showModal();
    searchInput.focus();
    void getPagefind().catch(() => {
      /* Show a useful error only if the visitor searches. */
    });
  }
  document
    .querySelectorAll<HTMLElement>('[data-open-search]')
    .forEach((button) => button.addEventListener('click', () => openSearch(button)));
  searchDialog
    .querySelector('[data-close-search]')
    ?.addEventListener('click', () => searchDialog.close());
  searchDialog.addEventListener('close', () => searchTrigger?.focus());
  searchDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    searchDialog.close();
  });
  searchDialog.addEventListener('click', (event) => {
    if (event.target === searchDialog) {
      const box = searchDialog.getBoundingClientRect();
      if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
        searchDialog.close();
    }
  });
  searchDialog.querySelector('form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    clearTimeout(searchTimer);
    void runSearch();
  });
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => void runSearch(), 160);
  });
  sectionSelect.addEventListener('change', () => void runSearch());
  searchMore.addEventListener(
    'click',
    () =>
      void appendSearchResults(searchSequence).catch(() => {
        searchStatus.textContent = t(lang, 'searchError');
        searchMore.disabled = false;
      }),
  );
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (searchDialog.open) searchDialog.close();
      else openSearch();
    }
  });

  return { isOpen: () => searchDialog.open, close: () => searchDialog.close() };
}
