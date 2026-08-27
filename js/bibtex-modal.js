// BibTeX floating-card modal: reads a paper's hidden <pre class="bibtex_text">,
// renders it with light token coloring, and offers a copy-to-clipboard button.

function highlightBibtex(text) {
  var esc = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return esc.split('\n').map(function (line, i) {
    if (i === 0) {
      return line.replace(/^(@[A-Za-z]+)(\{)([^,]*)(,?)/, function (m, type, brace, key, comma) {
        return '<span class="bx-type">' + type + '</span>' + brace + '<span class="bx-key">' + key + '</span>' + comma;
      });
    }
    var trimmed = line.trim();
    if (trimmed === '}' || trimmed === '' || trimmed.indexOf('=') === -1) {
      return line;
    }
    var eqIndex = line.indexOf('=');
    var field = line.slice(0, eqIndex);
    var rest = line.slice(eqIndex);
    return '<span class="bx-field">' + field + '</span>' + '<span class="bx-value">' + rest + '</span>';
  }).join('\n');
}

function openBibtexModal(paperId) {
  var source = document.querySelector('#' + paperId + ' pre.bibtex_text');
  if (!source) return;

  var raw = source.textContent.trim();
  var contentEl = document.getElementById('bibtex-modal-content');
  contentEl.innerHTML = highlightBibtex(raw);
  contentEl.setAttribute('data-raw', raw);

  document.getElementById('bibtex-modal-overlay').classList.add('open');
  document.body.classList.add('modal-open');
}

function closeBibtexModal() {
  document.getElementById('bibtex-modal-overlay').classList.remove('open');
  document.body.classList.remove('modal-open');
}

function copyBibtex() {
  var contentEl = document.getElementById('bibtex-modal-content');
  var text = contentEl.getAttribute('data-raw') || '';
  var btn = document.getElementById('bibtex-copy-btn');

  function showCopied() {
    var original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
    btn.classList.add('copied');
    setTimeout(function () {
      btn.innerHTML = original;
      btn.classList.remove('copied');
    }, 1500);
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(showCopied);
  } else {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showCopied();
  }
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeBibtexModal();
});
