// Light/dark toggle, after the Modern Web Guidance "dark-mode-toggle" model.
//
// <meta name="color-scheme"> is the source of truth: "light dark" follows the
// OS, "light" or "dark" pins a scheme. The inline snippet after that <meta>
// in each page's <head> applies a stored override before first paint; CSS
// maps the <meta> to the color-scheme property and shows the right button
// option, so nothing here is needed for the page to render correctly.
//
// Two states: the system default (nothing stored) and the opposite of it.
// A click targets the opposite of what is rendered now; if that equals the
// OS preference, the override is removed instead of stored.

(function () {
  'use strict';

  var KEY = 'color-scheme';
  var root = document.documentElement;
  var meta = document.querySelector('meta[name="color-scheme"]');
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  if (!meta) return;

  // One-time move from the earlier key.
  try {
    var legacy = localStorage.getItem('theme');
    if (legacy) {
      localStorage.removeItem('theme');
      if (!localStorage.getItem(KEY) && (legacy === 'light' || legacy === 'dark')) {
        localStorage.setItem(KEY, legacy);
        meta.content = legacy;
      }
    }
  } catch (e) { /* storage blocked */ }

  function systemScheme() {
    return media.matches ? 'dark' : 'light';
  }

  function renderedScheme() {
    return meta.content === 'light' || meta.content === 'dark' ? meta.content : systemScheme();
  }

  function syncThemeColor() {
    var color = getComputedStyle(document.body).backgroundColor;
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute('content', color);
    });
  }

  function apply(value) {
    // Switch every colour in one step instead of fading per element.
    root.classList.add('theme-switching');
    meta.content = value || 'light dark';
    void root.offsetHeight;
    root.classList.remove('theme-switching');
    syncThemeColor();
  }

  function toggle() {
    var target = renderedScheme() === 'dark' ? 'light' : 'dark';
    var stored = target === systemScheme() ? null : target;
    try {
      if (stored) localStorage.setItem(KEY, stored);
      else localStorage.removeItem(KEY);
    } catch (e) { /* still apply for this page view */ }
    apply(stored);
  }

  // Keep tabs in sync.
  window.addEventListener('storage', function (event) {
    if (event.key === KEY || event.key === null) apply(event.newValue);
  });

  // The theme-color hint follows OS changes while no override is stored.
  media.addEventListener('change', syncThemeColor);

  document.addEventListener('DOMContentLoaded', function () {
    if (meta.content !== 'light dark') syncThemeColor();
    var btn = document.querySelector('.theme-toggle');
    if (btn) btn.addEventListener('click', toggle);
  });
})();
