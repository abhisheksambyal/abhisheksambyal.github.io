// Edge-fade fallback for the top bar's horizontal scroller.
//
// The fades are pure CSS where scroll-driven animations exist. The bar hides
// its scrollbar, so the fades are the only cue that it scrolls; where
// `animation-timeline: scroll()` is unsupported, mark which edges have more
// content and let CSS (.js-fade.more-start / .more-end) draw the fades.

(function () {
  'use strict';
  if (window.CSS && CSS.supports && CSS.supports('animation-timeline', 'scroll()')) return;
  if (!('IntersectionObserver' in window)) return;

  document.querySelectorAll('.topbar .nav').forEach(function (scroller) {
    var first = scroller.firstElementChild;
    var last = scroller.lastElementChild;
    if (!first || !last) return;
    scroller.classList.add('js-fade');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        scroller.classList.toggle(entry.target === first ? 'more-start' : 'more-end', entry.intersectionRatio < 1);
      });
    }, { root: scroller, threshold: 1, rootMargin: '1px' });

    observer.observe(first);
    observer.observe(last);
  });
})();
