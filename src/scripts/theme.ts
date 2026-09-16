const store = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Storage is optional. */
  }
};
export const isDark = () =>
  document.documentElement.dataset.theme === 'dark' ||
  (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
export function initTheme(): void {
  const updateThemeButtons = () =>
    document
      .querySelectorAll('[data-toggle-theme]')
      .forEach((button) => button.setAttribute('aria-pressed', String(isDark())));
  updateThemeButtons();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeButtons);

  document.querySelectorAll<HTMLButtonElement>('[data-toggle-theme]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      store('acho-theme', next);
      updateThemeButtons();
    });
  });
}
