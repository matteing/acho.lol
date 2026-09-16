import { defaultLanguage, locales } from '@/i18n/locales';
import { initContents } from '@/components/article/table-of-contents';
import { initDiagrams } from './diagrams';
import { initNavigation } from '@/components/layout/navigation';
import { initPreviews } from '@/components/preview/preview';
import { initSearch } from '@/components/search/search';
import { initTheme } from './theme';

const lang = locales.find((locale) => locale === document.documentElement.lang) ?? defaultLanguage;
const mobileQuery = matchMedia('(max-width: 800px)');

initTheme();
const navigation = initNavigation(lang, mobileQuery);
const search = initSearch({
  lang,
  beforeOpen: (trigger) => {
    if (!navigation?.isOpen()) return trigger;
    navigation.close(false);
    return (
      document.querySelector<HTMLElement>('.mobile-header [data-open-search]') ?? navigation.trigger
    );
  },
});
const previews = initPreviews({
  lang,
  mobileQuery,
  canOpen: () => !search?.isOpen(),
});

// Capture Escape before native search inputs can consume it. Close only the
// topmost surface; each controller restores its own initiating element.
document.addEventListener(
  'keydown',
  (event) => {
    if (event.key !== 'Escape') return;
    const active = [search, navigation, previews].find((surface) => surface?.isOpen());
    if (!active) return;
    event.preventDefault();
    event.stopPropagation();
    active.close();
  },
  { capture: true },
);

initDiagrams(lang);
initContents();
