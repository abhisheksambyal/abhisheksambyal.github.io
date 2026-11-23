// Bottom-sheet drawer for publication abstracts and BibTeX entries.
//
// Content is not duplicated here: each paper's <p class="abstract_text"> and
// <pre class="bibtex_text"> stay in the markup inside their
// <div class="paperlinks" id="..."> and are hidden by CSS. The drawer reads
// their text on open, so the HTML remains the single source of truth.

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
  var bodyEl = drawer.querySelector('.drawer__body');
  var absBody = absPanel.querySelector('p');
  var bibBody = bibPanel.querySelector('pre');
  var tabs = {
    abstract: document.getElementById('tab-abstract'),
    bibtex: document.getElementById('tab-bibtex')
  };

  var supportsDialog = typeof drawer.showModal === 'function';
  var copyResetTimer = null;

  // ---- tabs ---------------------------------------------------------------

  function selectTab(name, animate) {
    var isAbstract = name !== 'bibtex';
    var incoming = isAbstract ? absPanel : bibPanel;
    var outgoing = isAbstract ? bibPanel : absPanel;

    tabs.abstract.setAttribute('aria-selected', String(isAbstract));
    tabs.bibtex.setAttribute('aria-selected', String(!isAbstract));
    // Roving tabindex: one stop for the whole tablist, arrows move within it.
    tabs.abstract.tabIndex = isAbstract ? 0 : -1;
    tabs.bibtex.tabIndex = isAbstract ? -1 : 0;
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

    bodyEl.scrollTop = 0;
  }

  // ---- height ---------------------------------------------------------------

  // An abstract and a BibTeX entry are rarely the same length, so switching
  // tabs used to resize the sheet under the pointer. Hold the body at the
  // taller of the two for as long as this paper is open: the sheet is then
  // stable across tab switches, still sized to its own content rather than to
  // a fixed guess, and still clamped by the sheet's max-height on long
  // abstracts (where .drawer__body's own overflow-y takes over).
  function measurePanel(panel, other) {
    var wasHidden = panel.hidden;
    var otherWasHidden = other.hidden;
    panel.hidden = false;
    other.hidden = true;
    var height = bodyEl.scrollHeight;
    panel.hidden = wasHidden;
    other.hidden = otherWasHidden;
    return height;
  }

  function syncBodyHeight() {
    // Measure against natural height, not against the height set last time.
    bodyEl.style.height = '';

    var tallest = 0;
    if (!tabs.abstract.hidden) tallest = Math.max(tallest, measurePanel(absPanel, bibPanel));
    if (!tabs.bibtex.hidden) tallest = Math.max(tallest, measurePanel(bibPanel, absPanel));

    if (tallest > 0) bodyEl.style.height = tallest + 'px';
  }

  // The year is markup-wise a sibling of the venue, not part of it: the row
  // reads "<em>…(MICCAI)</em>, 2024". Pick up that trailing text so the sheet
  // doesn't drop the year.
  function venueWithYear(venue) {
    var text = venue.textContent.replace(/\s+/g, ' ').trim();
    var next = venue.nextSibling;
    if (next && next.nodeType === 3) {
      var tail = next.textContent.replace(/\s+/g, ' ').trim();
      var year = tail.match(/^,\s*(\d{4})/);
      if (year) text += ', ' + year[1];
    }
    return text;
  }

  window.addEventListener('resize', function () {
    if (drawer.open) syncBodyHeight();
  });

  // ---- closing with an exit animation -------------------------------------

  // Exit transitions need discrete `display` and `overlay` transitions. Where
  // they're missing (Firefox, Safari), [data-closing] runs the exit transition
  // while the dialog is still in the top layer, then it closes. Firefox
  // parses allow-discrete without honouring it, so probe the real behaviour.
  var displayTransition;
  function canTransitionDisplay() {
    if (displayTransition !== undefined) return displayTransition;
    if (!window.CSS || !CSS.supports || !CSS.supports('transition-behavior', 'allow-discrete')) {
      return (displayTransition = false);
    }
    var probe = document.createElement('div');
    probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
    document.body.appendChild(probe);
    getComputedStyle(probe).display;
    probe.style.display = 'none';
    displayTransition = getComputedStyle(probe).display === 'block';
    probe.remove();
    return displayTransition;
  }

  function supportsTopLayerExit() {
    return !!(window.CSS && CSS.supports && CSS.supports('overlay', 'auto')) && canTransitionDisplay();
  }

  function close() {
    if (!drawer.open || drawer.hasAttribute('data-closing')) return;
    if (supportsTopLayerExit()) {
      drawer.close();
      return;
    }
    drawer.setAttribute('data-closing', '');
    var animations = drawer.getAnimations({ subtree: true });
    var settled = animations.length
      ? Promise.race([
          Promise.allSettled(animations.map(function (a) { return a.finished; })),
          new Promise(function (r) { setTimeout(r, 1000); })
        ])
      : Promise.resolve();
    settled.then(function () {
      if (!drawer.hasAttribute('data-closing')) return;
      drawer.removeAttribute('data-closing');
      drawer.close();
    });
  }

  // ---- open / close -------------------------------------------------------

  function open(pubId, startTab) {
    var root = document.getElementById(pubId);
    if (!root) return;

    var cell = root.closest('.pub__body') || root.parentNode;
    var paperTitle = cell.querySelector('.papertitle');
    var venue = cell.querySelector('em');
    var abstract = root.querySelector('.abstract_text');
    var bibtex = root.querySelector('.bibtex_text');

    titleEl.textContent = paperTitle ? paperTitle.textContent.trim() : '';
    venueEl.textContent = venue ? venueWithYear(venue) : '';
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
    drawer.removeAttribute('data-closing');
    drawer.showModal();
    // After showModal: the dialog is display:none until then, so nothing
    // inside it can be measured before this point.
    syncBodyHeight();
    // Focus the sheet, not the close button: the dialog is announced without
    // painting a focus ring on a control the user didn't reach for.
    sheet.focus();
  }

  // Esc and closedby="any" light dismiss arrive as `cancel`: route them
  // through close() so they animate too.
  drawer.addEventListener('cancel', function (event) {
    event.preventDefault();
    close();
  });

  // Light-dismiss fallback where <dialog closedby> is unsupported (Safari):
  // a click whose target is the dialog itself and that falls outside its box
  // was on the backdrop.
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    drawer.addEventListener('click', function (event) {
      if (event.target !== drawer) return;
      var r = drawer.getBoundingClientRect();
      var inside = r.top <= event.clientY && event.clientY <= r.bottom &&
        r.left <= event.clientX && event.clientX <= r.right;
      if (!inside) close();
    });
  }

  closeBtn.addEventListener('click', close);

  tabs.abstract.addEventListener('click', function () {
    selectTab('abstract', true);
  });
  tabs.bibtex.addEventListener('click', function () {
    selectTab('bibtex', true);
  });

  // Arrow-key navigation across the tablist, per the ARIA tabs pattern.
  // Skips a tab that is hidden because the paper has no content for it.
  drawer.querySelector('.drawer__tabs').addEventListener('keydown', function (event) {
    var order = ['abstract', 'bibtex'].filter(function (name) {
      return !tabs[name].hidden;
    });
    if (order.length < 2) return;

    var current = tabs.abstract.getAttribute('aria-selected') === 'true' ? 'abstract' : 'bibtex';
    var i = order.indexOf(current);
    var next;

    switch (event.key) {
      case 'ArrowRight': next = order[(i + 1) % order.length]; break;
      case 'ArrowLeft': next = order[(i - 1 + order.length) % order.length]; break;
      case 'Home': next = order[0]; break;
      case 'End': next = order[order.length - 1]; break;
      default: return;
    }

    event.preventDefault();
    selectTab(next, true);
    tabs[next].focus();
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
