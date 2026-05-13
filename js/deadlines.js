// Conference Deadlines — fetches data/deadlines.json and renders the table.
// Data is auto-updated monthly by the GitHub Action.
(function () {
  var TAGS = {
    CVPR: { area: 'CV', cls: 'tag-cv' },   ECCV: { area: 'CV', cls: 'tag-cv' },   ICCV: { area: 'CV', cls: 'tag-cv' },
    WACV: { area: 'CV', cls: 'tag-cv' },   BMVC: { area: 'CV', cls: 'tag-cv' },
    ICML: { area: 'ML', cls: 'tag-ml' },   NeurIPS: { area: 'ML', cls: 'tag-ml' }, ICLR: { area: 'ML', cls: 'tag-ml' },
    AISTATS: { area: 'ML', cls: 'tag-ml' }, UAI: { area: 'ML', cls: 'tag-ml' },    AAAI: { area: 'ML', cls: 'tag-ml' },
    MICCAI: { area: 'Med', cls: 'tag-med' }, MIDL: { area: 'Med', cls: 'tag-med' }, ISBI: { area: 'Med', cls: 'tag-med' },
    IPMI: { area: 'Med', cls: 'tag-med' }
  };

  // Inline fallback when fetch fails (e.g. local file:// testing).
  // Keep in sync with data/deadlines.json
  var FALLBACK = {
    last_updated: "May 13, 2026",
    conferences: [
      { name: "WACV", year: 2027, link: "https://wacv.thecvf.com/", deadline: "2026-06-18", place: "Buena Vista, FL", date: "January 5 - January 9, 2027" },
      { name: "AAAI", year: 2027, link: "https://aaai.org/", deadline: "2026-07-25", place: "TBA", date: "Feb 2027 (est.)", estimated: true },
      { name: "ICLR", year: 2027, link: "https://iclr.cc/", deadline: "2026-09-19", place: "TBA", date: "Apr 2027 (est.)", estimated: true },
      { name: "AISTATS", year: 2027, link: "https://aistats.org/", deadline: "2026-09-25", place: "TBA", date: "Apr-May 2027 (est.)", estimated: true },
      { name: "CVPR", year: 2027, link: "https://cvpr.thecvf.com/", deadline: "2026-11-07", place: "TBA", date: "Jun 2027 (est.)", estimated: true },
      { name: "ISBI", year: 2027, link: "https://biomedicalimaging.org/", deadline: "2026-11-14", place: "TBA", date: "Apr 2027 (est.)", estimated: true },
      { name: "MIDL", year: 2027, link: "https://midl.io/", deadline: "2026-12-10", place: "TBA", date: "Jul 2027 (est.)", estimated: true },
      { name: "IPMI", year: 2027, link: "https://ipmi-conference.org/", deadline: "2026-12-13", place: "TBA", date: "Jun 2027 (est.)", estimated: true },
      { name: "ICML", year: 2027, link: "https://icml.cc/", deadline: "2027-01-23", place: "TBA", date: "Jul 2027 (est.)", estimated: true },
      { name: "MICCAI", year: 2027, link: "https://miccai.org/", deadline: "2027-02-12", place: "TBA", date: "Sep–Oct 2027 (est.)", estimated: true },
      { name: "UAI", year: 2027, link: "https://auai.org/", deadline: "2027-02-25", place: "TBA", date: "Jul 2027 (est.)", estimated: true },
      { name: "ECCV", year: 2027, link: "https://ecva.net/", deadline: "2027-02-26", place: "TBA", date: "Sep 2027 (est.)", estimated: true },
      { name: "ICCV", year: 2027, link: "https://thecvf.com/", deadline: "2027-03-04", place: "TBA", date: "Oct 2027 (est.)", estimated: true },
      { name: "NeurIPS", year: 2027, link: "https://neurips.cc/", deadline: "2027-05-04", place: "TBA", date: "Dec 2027 (est.)", estimated: true },
      { name: "BMVC", year: 2027, link: "https://bmva.org/", deadline: "2027-05-10", place: "TBA", date: "Nov 2027 (est.)", estimated: true }
    ]
  };

  function toDate(s) { return s ? new Date(s + 'T23:59:59') : null; }

  function fmtDate(s) {
    var d = toDate(s);
    return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  }

  function daysLeft(s) {
    var d = toDate(s);
    if (!d) return -Infinity;
    var now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.ceil((d - now) / 864e5);
  }

  function status(s) {
    var n = daysLeft(s);
    if (n < 0)   return { text: 'Passed',    cls: 'status-passed' };
    if (n <= 7)  return { text: n + 'd left', cls: 'status-urgent' };
    if (n <= 30) return { text: n + 'd left', cls: 'status-soon' };
    return { text: n + 'd left', cls: 'status-upcoming' };
  }

  function render(data) {
    var confs = data.conferences || [];
    var updatedDate = data.last_updated || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    var upcoming = [], passed = [], now = new Date();
    confs.forEach(function (c) {
      (toDate(c.deadline) >= now ? upcoming : passed).push(c);
    });
    upcoming.sort(function (a, b) { return toDate(a.deadline) - toDate(b.deadline); });
    passed.sort(function (a, b) { return toDate(b.deadline) - toDate(a.deadline); });

    var tbody = document.getElementById('deadline-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    function row(c) {
      var t = TAGS[c.name] || { area: '?', cls: '' };
      var s = status(c.deadline);
      var est = c.estimated ? ' <span class="deadline-est">est.</span>' : '';
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="deadline-conf-name"><a href="' + c.link + '" target="_blank">' + c.name + ' ' + c.year + '</a></td>' +
        '<td><span class="deadline-tag ' + t.cls + '">' + t.area + '</span></td>' +
        '<td class="deadline-date">' + fmtDate(c.deadline) + est + '</td>' +
        '<td class="deadline-date">' + c.date + '</td>' +
        '<td class="deadline-location">' + c.place + '</td>' +
        '<td><span class="deadline-status ' + s.cls + '">' + s.text + '</span></td>';
      tbody.appendChild(tr);
    }

    function label(text) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="6" class="deadline-section-label">' + text + '</td>';
      tbody.appendChild(tr);
    }

    if (upcoming.length) { label('Upcoming Deadlines'); upcoming.forEach(row); }
    if (passed.length)   { label('Recently Passed');    passed.forEach(row); }

    var el = document.getElementById('deadline-updated');
    if (el) el.textContent = 'Updated ' + updatedDate;
  }

  function init() {
    fetch('data/deadlines.json')
      .then(function (r) { return r.json(); })
      .then(render)
      .catch(function () { render(FALLBACK); });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
