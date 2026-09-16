function headingId(hash: string): string {
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return hash.slice(1);
  }
}

export function initContents(): void {
  const contents = document.querySelector<HTMLElement>('.table-of-contents');
  const article = document.querySelector<HTMLElement>('.article-main');
  if (!contents || !article) return;

  const entries = [...contents.querySelectorAll<HTMLAnchorElement>('.toc-link')].flatMap((link) => {
    const heading = document.getElementById(headingId(link.hash));
    return heading ? [{ link, heading }] : [];
  });
  const first = entries[0];
  const last = entries.at(-1);
  if (!first || !last) return;

  const rail = contents.closest<HTMLElement>('.article-sidebar');
  let currentLink: HTMLAnchorElement | undefined;
  let navigation: { entry: (typeof entries)[number]; settledAt?: number } | undefined;
  let scheduled = false;

  const revealLink = (link: HTMLAnchorElement) => {
    // Scroll only the rail, and leave a reader's keyboard focus in place.
    if (!rail?.clientHeight || rail.querySelector(':focus-visible')) return;
    const bounds = rail.getBoundingClientRect();
    const item = link.getBoundingClientRect();
    const inset = 8;
    if (item.top < bounds.top + inset) {
      rail.scrollTop += item.top - bounds.top - inset;
    } else if (item.bottom > bounds.bottom - inset) {
      rail.scrollTop += item.bottom - bounds.bottom + inset;
    }
  };

  const updateCurrentHeading = () => {
    scheduled = false;
    // Use the same offset as native anchor navigation. A larger fixed band
    // can select a following heading while a smooth anchor scroll finishes.
    const root = document.documentElement;
    const anchorOffset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const readingLine = anchorOffset + 1;
    let current = first;
    for (const entry of entries) {
      if (entry.heading.getBoundingClientRect().top <= readingLine) current = entry;
      else break;
    }

    // Short final sections cannot always reach the reading line above them.
    const maximumScroll = Math.max(0, root.scrollHeight - root.clientHeight);
    if (window.scrollY > 0 && maximumScroll - window.scrollY <= 1) current = last;

    if (navigation) {
      // Several nearby headings can share the same clamped scroll position
      // near the footer. Keep an explicit link destination until the reader
      // scrolls again or a layout change moves it away from that position.
      const targetTop = navigation.entry.heading.getBoundingClientRect().top;
      const destination = Math.min(
        maximumScroll,
        Math.max(0, window.scrollY + targetTop - anchorOffset),
      );
      const atDestination = Math.abs(window.scrollY - destination) <= 1;
      if (navigation.settledAt === undefined) {
        current = navigation.entry;
        if (atDestination) navigation.settledAt = window.scrollY;
      } else if (atDestination && Math.abs(window.scrollY - navigation.settledAt) <= 1) {
        current = navigation.entry;
      } else {
        navigation = undefined;
      }
    }

    if (current.link !== currentLink) {
      currentLink?.removeAttribute('aria-current');
      current.link.setAttribute('aria-current', 'location');
      currentLink = current.link;
    }
    revealLink(current.link);
  };

  const queueHeadingUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateCurrentHeading);
  };

  const rememberAnchor = (hash: string) => {
    const entry = entries.find(({ heading }) => heading.id === headingId(hash));
    navigation = entry ? { entry } : undefined;
    queueHeadingUpdate();
  };

  const resumeTracking = () => {
    if (!navigation) return;
    navigation = undefined;
    queueHeadingUpdate();
  };

  const handleScrollIntent = (event: Event) => {
    if (event.defaultPrevented) return;
    // Inputs and independently scrollable UI do not move the reader through
    // the article. Real document movement still updates via the scroll event.
    if (
      event.target instanceof Element &&
      event.target.closest(
        '.site-sidebar, .article-sidebar, dialog, [role="dialog"], input, textarea, select, button, [contenteditable]',
      )
    ) {
      return;
    }
    resumeTracking();
  };

  contents.addEventListener('click', (event) => {
    if (event.button || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const link =
      event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('.toc-link') : null;
    if (link) rememberAnchor(link.hash);
  });

  rememberAnchor(window.location.hash);
  window.addEventListener('scroll', queueHeadingUpdate, { passive: true });
  window.addEventListener('scrollend', () => {
    updateCurrentHeading();
    // A smooth scroll may have been interrupted before its target.
    if (navigation?.settledAt === undefined) resumeTracking();
  });
  window.addEventListener('resize', queueHeadingUpdate);
  window.addEventListener('hashchange', () => rememberAnchor(window.location.hash));
  window.addEventListener('pageshow', queueHeadingUpdate);
  window.addEventListener('load', queueHeadingUpdate);
  window.addEventListener('wheel', handleScrollIntent, { passive: true });
  window.addEventListener('touchmove', handleScrollIntent, { passive: true });
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
      handleScrollIntent(event);
    }
  });

  // Lazy media, diagrams, disclosure blocks, and fonts can move headings
  // after page load without causing a window scroll or resize event.
  new ResizeObserver(queueHeadingUpdate).observe(article);
  article.addEventListener('load', queueHeadingUpdate, true);
  void document.fonts.ready.then(queueHeadingUpdate);
  document.fonts.addEventListener('loadingdone', queueHeadingUpdate);
}
