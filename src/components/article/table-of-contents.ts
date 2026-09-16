export function initContents(): void {
  const headingLinks = [...document.querySelectorAll<HTMLAnchorElement>('.table-of-contents a')];
  const headings = [
    ...new Set(
      headingLinks
        .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
        .filter((heading): heading is HTMLElement => !!heading),
    ),
  ];
  const firstHeading = headings[0];
  if (firstHeading) {
    let scheduled = false;
    const updateCurrentHeading = () => {
      scheduled = false;
      // Select the last heading above the reading line. An intersection band
      // can jump ahead to the next section while an anchor scroll is finishing.
      const readingLine = 110;
      let current = firstHeading;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= readingLine) current = heading;
        else break;
      }
      headingLinks.forEach((link) => {
        if (decodeURIComponent(link.hash.slice(1)) === current.id)
          link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };
    const queueHeadingUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(updateCurrentHeading);
    };
    updateCurrentHeading();
    window.addEventListener('scroll', queueHeadingUpdate, { passive: true });
    window.addEventListener('resize', queueHeadingUpdate);
    window.addEventListener('load', queueHeadingUpdate);
  }
}
