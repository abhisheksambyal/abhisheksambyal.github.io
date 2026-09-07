// Bottom-sheet drawer for publication abstracts and BibTeX entries.
//
// Content is not duplicated here: each paper's <p class="abstract_text"> and
// <pre class="bibtex_text"> stay in the markup inside their
// <div class="paperlinks" id="..."> and are hidden by CSS. The drawer reads
// their text on open, so the HTML remains the single source of truth.
//
// js/hidebib.js is untouched and still drives the news "---- more ----"
// expander; only the publication triggers are handled here.

(function () {
  'use strict';

  var drawer = document.getElementById('pub-drawer');
  if (!drawer) return;

  var sheet = drawer.querySelector('.drawer__sheet');
  var titleEl = drawer.querySelector('.drawer__title');
  var venueEl = drawer.querySelector('.drawer__venue');
  var closeBtn = drawer.querySelector('.drawer__close');
  var indicator = drawer.querySelector('.drawer__tab-indicator');
  var copyBtn = drawer.querySelector('.drawer__copy');
  var absPanel = document.getElementById('panel-abstract');
  var bibPanel = document.getElementById('panel-bibtex');
  var absBody = absPanel.querySelector('p');
  var bibBody = bibPanel.querySelector('pre');
  var tabs = {
    abstract: document.getElementById('tab-abstract'),
    bibtex: document.getElementById('tab-bibtex')
  };

  var supportsDialog = typeof drawer.showModal === 'function';
  var copyResetTimer = null;
  var scrollbarPad = '';

  // ---- tabs ---------------------------------------------------------------

  function selectTab(name, animate) {
    var isAbstract = name !== 'bibtex';
    var incoming = isAbstract ? absPanel : bibPanel;
    var outgoing = isAbstract ? bibPanel : absPanel;

    tabs.abstract.setAttribute('aria-selected', String(isAbstract));
    tabs.bibtex.setAttribute('aria-selected', String(!isAbstract));
    indicator.style.transform = isAbstract ? 'translateX(0)' : 'translateX(100%)';

    outgoing.hidden = true;
    incoming.hidden = false;

    if (animate) {
      // Paint the transparent state first, then release it, so the incoming
      // panel actually fades instead of appearing at full opacity.
      incoming.classList.add('is-swapping');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          incoming.classList.remove('is-swapping');
        });
      });
    } else {
      incoming.classList.remove('is-swapping');
    }

    drawer.querySelector('.drawer__body').scrollTop = 0;
  }

  // ---- width ---------------------------------------------------------------

  // documentElement.clientWidth is the width actually on screen. The page
  // overflows horizontally on narrow viewports, which makes the containing
  // block of a fixed element wider than that, so measure rather than use 100%.
  function syncWidth() {
    drawer.style.setProperty('--drawer-vw', document.documentElement.clientWidth + 'px');
  }

  syncWidth();
  window.addEventListener('resize', syncWidth);
  window.addEventListener('orientationchange', syncWidth);

  // ---- scroll lock --------------------------------------------------------

  function lockScroll() {
    var gap = window.innerWidth - document.documentElement.clientWidth;
    scrollbarPad = document.body.style.paddingRight;
    if (gap > 0) {
      document.body.style.paddingRight = gap + 'px';
    }
    document.body.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.body.style.overflow = '';
    document.body.style.paddingRight = scrollbarPad;
  }

  // ---- open / close -------------------------------------------------------

  function open(pubId, startTab) {
    var root = document.getElementById(pubId);
    if (!root) return;

    var cell = root.closest('td') || root.parentNode;
    var paperTitle = cell.querySelector('papertitle');
    var venue = cell.querySelector('em');
    var abstract = root.querySelector('.abstract_text');
    var bibtex = root.querySelector('.bibtex_text');

    titleEl.textContent = paperTitle ? paperTitle.textContent.trim() : '';
    venueEl.textContent = venue ? venue.textContent.trim() : '';
    absBody.textContent = abstract ? abstract.textContent.trim() : '';
    bibBody.textContent = bibtex ? bibtex.textContent.trim() : '';

    // A paper with no abstract shouldn't offer an empty tab.
    var hasAbstract = absBody.textContent.length > 0;
    var hasBibtex = bibBody.textContent.length > 0;
    tabs.abstract.hidden = !hasAbstract;
    tabs.bibtex.hidden = !hasBibtex;
    indicator.hidden = !(hasAbstract && hasBibtex);

    if (startTab === 'bibtex' && !hasBibtex) startTab = 'abstract';
    if (startTab === 'abstract' && !hasAbstract) startTab = 'bibtex';
    selectTab(startTab, false);

    resetCopyButton();
    syncWidth();
    lockScroll();
    drawer.showModal();
    // Focus the sheet, not the close button: the dialog is announced without
    // painting a focus ring on a control the user didn't reach for.
    sheet.focus();
  }

  function close() {
    // display/overlay are in the CSS transition with allow-discrete, so the
    // sheet animates out on its own; no transitionend bookkeeping needed.
    drawer.close();
  }

  drawer.addEventListener('close', unlockScroll);

  // Clicking the backdrop lands on the dialog element itself.
  drawer.addEventListener('click', function (event) {
    if (event.target === drawer) close();
  });

  closeBtn.addEventListener('click', close);

  tabs.abstract.addEventListener('click', function () {
    selectTab('abstract', true);
  });
  tabs.bibtex.addEventListener('click', function () {
    selectTab('bibtex', true);
  });

  // ---- copy ---------------------------------------------------------------

  function resetCopyButton() {
    window.clearTimeout(copyResetTimer);
    copyBtn.classList.remove('is-copied');
    copyBtn.textContent = 'Copy';
  }

  copyBtn.addEventListener('click', function () {
    var text = bibBody.textContent;

    function done(ok) {
      window.clearTimeout(copyResetTimer);
      copyBtn.classList.toggle('is-copied', ok);
      copyBtn.textContent = ok ? 'Copied' : 'Press ⌘C';
      copyResetTimer = window.setTimeout(resetCopyButton, 1600);
    }

    // Unavailable on file:// and other insecure origins.
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        done(true);
      }, function () {
        selectBibtex();
        done(false);
      });
    } else {
      selectBibtex();
      done(false);
    }
  });

  function selectBibtex() {
    var range = document.createRange();
    range.selectNodeContents(bibBody);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // ---- triggers -----------------------------------------------------------

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-pub]');
    if (!trigger) return;

    event.preventDefault();

    if (!supportsDialog) {
      // Last-resort fallback: reveal the source block in place.
      var root = document.getElementById(trigger.getAttribute('data-pub'));
      if (!root) return;
      var block = root.querySelector(
        trigger.getAttribute('data-tab') === 'bibtex' ? '.bibtex_text' : '.abstract_text'
      );
      if (block) {
        block.style.display = block.style.display === 'block' ? 'none' : 'block';
      }
      return;
    }

    open(trigger.getAttribute('data-pub'), trigger.getAttribute('data-tab'));
  });
})();
