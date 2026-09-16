import { t } from '@/i18n/translate';
import type { Language } from '@/i18n/locales';
import type { NavigationController } from '@/lib/ui';

export function initNavigation(
  lang: Language,
  mobileQuery: MediaQueryList,
): NavigationController | undefined {
  const sidebar = document.querySelector<HTMLElement>('.site-sidebar');
  const backdrop = document.querySelector<HTMLElement>('.drawer-backdrop');
  const menuButton = document.querySelector<HTMLButtonElement>('[data-open-menu]');
  if (!sidebar || !backdrop || !menuButton) return;
  const closeMenu = (restoreFocus = true) => {
    delete sidebar.dataset.open;
    delete document.body.dataset.menuOpen;
    backdrop.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    sidebar.removeAttribute('role');
    sidebar.removeAttribute('aria-modal');
    if (restoreFocus) menuButton.focus();
  };
  menuButton.addEventListener('click', () => {
    sidebar.dataset.open = '';
    document.body.dataset.menuOpen = '';
    backdrop.hidden = false;
    menuButton.setAttribute('aria-expanded', 'true');
    sidebar.setAttribute('role', 'dialog');
    sidebar.setAttribute('aria-modal', 'true');
    sidebar.setAttribute('aria-label', t(lang, 'navigation'));
    requestAnimationFrame(() =>
      sidebar.querySelector<HTMLButtonElement>('[data-close-menu]')?.focus(),
    );
  });
  document.querySelector('[data-close-menu]')?.addEventListener('click', () => closeMenu());
  backdrop.addEventListener('click', () => closeMenu());
  mobileQuery.addEventListener('change', () => closeMenu(false));
  sidebar.addEventListener('keydown', (event) => {
    if (!sidebar.hasAttribute('data-open')) return;
    if (event.key === 'Tab') {
      const items = [...sidebar.querySelectorAll<HTMLElement>('a[href],button,summary')].filter(
        (item) => item.getClientRects().length > 0,
      );
      if (!items.length) return;
      if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault();
        items.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
        event.preventDefault();
        items[0]?.focus();
      }
    }
  });

  return { isOpen: () => sidebar.hasAttribute('data-open'), close: closeMenu, trigger: menuButton };
}
