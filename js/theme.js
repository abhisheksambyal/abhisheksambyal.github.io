// Light/dark toggle. The page follows the OS setting until the visitor
// clicks the button; their choice is then stored and applied on every page
// as <html data-theme="light|dark">. The tiny inline snippet in each page's
// <head> applies a stored choice before first paint, so there is no flash.

(function () {
  'use strict';

  var KEY = 'theme';
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  function current() {
    return root.getAttribute('data-theme') || (media.matches ? 'dark' : 'light');
  }

  function label(btn) {
    var next = current() === 'dark' ? 'light' : 'dark';
    btn.setAttribute('aria-label', 'Switch to ' + next + ' mode');
    btn.title = 'Switch to ' + next + ' mode';
  }

  function syncThemeColor() {
    var color = getComputedStyle(root).getPropertyValue('--paper').trim();
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute('content', color);
    });
  }

  function apply(theme) {
    // Switch every colour in one step: no per-element fades.
    root.classList.add('theme-switching');
    root.setAttribute('data-theme', theme);
    void root.offsetHeight; // commit styles before transitions come back
    root.classList.remove('theme-switching');
    syncThemeColor();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.theme-toggle');
    if (root.getAttribute('data-theme')) syncThemeColor();
    if (!btn) return;
    label(btn);

    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* private mode */ }
      label(btn);
    });

    // Keep the label right if the OS flips while no choice is stored.
    media.addEventListener('change', function () { label(btn); });
  });
})();
