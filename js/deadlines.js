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
    last_updated: "Aug 07, 2026",
    conferences: [
      { name: "WACV", year: 2027, link: "https://wacv.thecvf.com/", deadline: "2026-08-29T11:59:59Z", deadline_quoted: "Aug 28, 2026, 11:59 PM AoE", deadline_label: "Round 2 Paper Submissions", registration_deadline: "2026-08-22T11:59:59Z", registration_deadline_quoted: "Aug 21, 2026, 11:59 PM AoE", registration_label: "Round 2 New Paper Registration", place: "Buena Vista, FL", date: "January 4 - January 8, 2027" },
      { name: "ICLR", year: 2027, link: "https://iclr.cc/Conferences/2027", deadline: "2026-09-19T11:59:59Z", deadline_quoted: "Sep 19, 2026, 11:59 AM UTC", deadline_label: "Abstract Submission (confirmed via iclr.cc)", place: "TBA", date: "2027 (confirmed via iclr.cc)" },
      { name: "AISTATS", year: 2027, link: "https://aistats.org/", deadline: "2026-09-26", place: "TBA", date: "Apr-May 2027 (est.)", estimated: true },
      { name: "CVPR", year: 2027, link: "https://cvpr.thecvf.com/", deadline: "2026-11-08", place: "TBA", date: "Jun 2027 (est.)", estimated: true },
      { name: "ISBI", year: 2027, link: "https://biomedicalimaging.org/", deadline: "2026-11-14", place: "TBA", date: "Apr 2027 (est.)", estimated: true },
      { name: "MIDL", year: 2027, link: "https://midl.io/", deadline: "2026-12-10", place: "TBA", date: "Jul 2027 (est.)", estimated: true },
      { name: "IPMI", year: 2027, link: "https://ipmi-conference.org/", deadline: "2026-12-13", place: "TBA", date: "Jun 2027 (est.)", estimated: true },
      { name: "ICML", year: 2027, link: "https://icml.cc/", deadline: "2027-01-24", place: "TBA", date: "Jul 2027 (est.)", estimated: true },
      { name: "MICCAI", year: 2027, link: "https://miccai.org/", deadline: "2027-02-13", place: "TBA", date: "Sep–Oct 2027 (est.)", estimated: true },
      { name: "UAI", year: 2027, link: "https://auai.org/", deadline: "2027-02-25", place: "TBA", date: "Jul 2027 (est.)", estimated: true },
      { name: "ICCV", year: 2027, link: "https://thecvf.com/", deadline: "2027-03-04", place: "TBA", date: "Oct 2027 (est.)", estimated: true },
      { name: "NeurIPS", year: 2027, link: "https://neurips.cc/", deadline: "2027-05-05", place: "TBA", date: "Dec 2027 (est.)", estimated: true },
      { name: "BMVC", year: 2027, link: "https://bmva.org/", deadline: "2027-05-10", place: "TBA", date: "Nov 2027 (est.)", estimated: true },
      { name: "AAAI", year: 2028, link: "https://aaai.org/", deadline: "2027-07-26", place: "TBA", date: "Feb 2028 (est.)", estimated: true },
      { name: "ECCV", year: 2028, link: "https://ecva.net/", deadline: "2028-03-05", place: "TBA", date: "Sep 2028 (est.)", estimated: true }
    ]
  };

  var ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESCAPE_MAP[c]; });
  }

  // --- .ics calendar export -------------------------------------------------
  function icsEscape(s) {
    return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }

  function icsDateUTC(d) {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  function icsDateOnly(s) {
    return s.replace(/-/g, '');
  }

  function buildICS(confs) {
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//abhisheksambyal.github.io//Conference Deadlines//EN', 'CALSCALE:GREGORIAN'];
    var stamp = icsDateUTC(new Date());

    function addEvent(uid, summary, dateStr, description, url) {
      var d = toDate(dateStr);
      if (!d) return;
      var hasTime = /T\d{2}:\d{2}/.test(dateStr);
      lines.push('BEGIN:VEVENT');
      lines.push('UID:' + uid + '@abhisheksambyal.github.io');
      lines.push('DTSTAMP:' + stamp);
      // Real deadlines carry an exact instant; pattern-estimated ones are only
      // a best-guess day, so they're added as an all-day event rather than
      // implying a false-precision time.
      lines.push(hasTime ? 'DTSTART:' + icsDateUTC(d) : 'DTSTART;VALUE=DATE:' + icsDateOnly(dateStr));
      lines.push('SUMMARY:' + icsEscape(summary));
      if (description) lines.push('DESCRIPTION:' + icsEscape(description));
      if (url) lines.push('URL:' + icsEscape(url));
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push('DESCRIPTION:' + icsEscape(summary));
      lines.push('TRIGGER:-P1D');
      lines.push('END:VALARM');
      lines.push('END:VEVENT');
    }

    confs.forEach(function (c) {
      if (toDate(c.registration_deadline)) {
        addEvent(
          'reg-' + c.name + '-' + c.year,
          c.name + ' ' + c.year + ' \u2014 Registration deadline',
          c.registration_deadline,
          (c.registration_label || 'Registration deadline') + (c.registration_deadline_quoted ? ' (' + c.registration_deadline_quoted + ')' : ''),
          c.link
        );
      }
      addEvent(
        'sub-' + c.name + '-' + c.year,
        c.name + ' ' + c.year + ' \u2014 Submission deadline' + (c.estimated ? ' (estimated)' : ''),
        c.deadline,
        (c.deadline_label || 'Submission deadline') + (c.deadline_quoted ? ' (' + c.deadline_quoted + ')' : ''),
        c.link
      );
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  function downloadICS(confs) {
    var blob = new Blob([buildICS(confs)], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'conference-deadlines.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function todayMidnight() {
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  // Real scraped deadlines are a confirmed absolute instant, e.g.
  // '2026-08-29T11:59:59Z' (already converted from whatever timezone — often
  // AoE, not UTC — the conference actually quoted it in). Pattern-estimated
  // deadlines have no known time/zone, just a 'YYYY-MM-DD' best guess, which
  // we treat as 23:59:59 in the viewer's own local time. Returns null if
  // unparsable.
  function toDate(s) {
    if (!s) return null;
    var hasTime = /T\d{2}:\d{2}/.test(s);
    var d = new Date(hasTime ? s : s + 'T23:59:59');
    return isNaN(d.getTime()) ? null : d;
  }

  function fmtDate(s) {
    var d = toDate(s);
    return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA';
  }

  function daysLeft(s) {
    var d = toDate(s);
    if (!d) return null;
    return Math.ceil((d - todayMidnight()) / 864e5);
  }

  function status(s) {
    var n = daysLeft(s);
    if (n === null) return { text: 'Unknown', cls: 'status-passed' };
    if (n < 0)   return { text: 'Passed',    cls: 'status-passed' };
    if (n <= 7)  return { text: n + 'd left', cls: 'status-urgent' };
    if (n <= 30) return { text: n + 'd left', cls: 'status-soon' };
    return { text: n + 'd left', cls: 'status-upcoming' };
  }

  // Some conferences (WACV, ECCV, ...) require registering a paper before you can
  // submit it — that registration deadline is earlier than, and gates, the
  // submission deadline, so it's the one that actually needs to drive the
  // countdown/sort/section-placement whenever it's present.
  function primaryDeadline(c) {
    return toDate(c.registration_deadline) ? c.registration_deadline : c.deadline;
  }

  // Pull a short "R1"/"R2" tag out of a deadline label like "Round 2 Paper
  // Submissions" so the UI can show which round a date belongs to.
  function roundTag(label) {
    var m = /round\s*(\d+)/i.exec(label || '');
    return m ? 'R' + m[1] : '';
  }

  // How many days data/deadlines.json can go un-refreshed before we warn on-page
  // that the update-deadlines.yml automation may be broken. Cron runs every 12h,
  // so this leaves a wide safety margin before flagging anything.
  var STALE_AFTER_DAYS = 20;

  // Call out the single most urgent tracked deadline above the table, so it's
  // visible without having to scan every row — this is the one most likely to
  // actually get missed.
  function renderNextBanner(upcoming) {
    var el = document.getElementById('deadline-next-banner');
    if (!el) return;
    if (!upcoming.length) {
      el.style.display = 'none';
      el.innerHTML = '';
      return;
    }
    var c = upcoming[0];
    var usingReg = !!toDate(c.registration_deadline);
    var dateStr = usingReg ? c.registration_deadline : c.deadline;
    var roundPart = roundTag(usingReg ? c.registration_label : c.deadline_label);
    var kindLabel = (usingReg ? 'Registration' : 'Submission') + (roundPart ? ' ' + roundPart : '');
    var s = status(dateStr);
    el.style.display = '';
    el.innerHTML =
      '<span class="deadline-next-icon">⏰</span> Next up: ' +
      '<a href="' + escapeHtml(c.link) + '" target="_blank">' + escapeHtml(c.name) + ' ' + escapeHtml(c.year) + '</a>' +
      ' — ' + escapeHtml(kindLabel) + ' ' +
      '<span class="deadline-status ' + s.cls + '">' + escapeHtml(s.text) + '</span>' +
      ' <span class="deadline-next-date">(' + escapeHtml(fmtDate(dateStr)) + ')</span>';
  }

  function render(data) {
    var confs = Array.isArray(data && data.conferences) ? data.conferences : [];
    var updatedDate = (data && data.last_updated) || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    var today = todayMidnight();
    var upcoming = [], passed = [], unknown = [];
    confs.forEach(function (c) {
      var d = toDate(primaryDeadline(c));
      if (!d) unknown.push(c);
      else if (d >= today) upcoming.push(c);
      else passed.push(c);
    });
    upcoming.sort(function (a, b) { return toDate(primaryDeadline(a)) - toDate(primaryDeadline(b)); });
    passed.sort(function (a, b) { return toDate(primaryDeadline(b)) - toDate(primaryDeadline(a)); });

    renderNextBanner(upcoming);

    var tbody = document.getElementById('deadline-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    function row(c) {
      var t = TAGS[c.name] || { area: '?', cls: '' };
      var s = status(primaryDeadline(c));
      var est = c.estimated ? ' <span class="deadline-est">est.</span>' : '';

      // "As quoted" original wording (e.g. "Aug 28, 2026, 11:59 PM AoE") lets
      // someone cross-check against the conference's own advertised date —
      // useful since the displayed date is converted to the viewer's local
      // time and so can legitimately land on a different calendar day.
      function withQuoted(label, quoted) {
        var base = label || '';
        return quoted ? (base ? base + ' — ' : '') + quoted : base;
      }

      var deadlineCell;
      if (toDate(c.registration_deadline)) {
        var regTag = roundTag(c.registration_label);
        var subTag = roundTag(c.deadline_label);
        deadlineCell =
          '<div class="deadline-stack">' +
            '<div class="deadline-substack" title="' + escapeHtml(withQuoted(c.registration_label || 'Registration deadline', c.registration_deadline_quoted)) + '">' +
              '<span class="deadline-subtype">Reg' + (regTag ? ' ' + escapeHtml(regTag) : '') + ':</span> ' + escapeHtml(fmtDate(c.registration_deadline)) +
            '</div>' +
            '<div class="deadline-substack" title="' + escapeHtml(withQuoted(c.deadline_label || 'Submission deadline', c.deadline_quoted)) + '">' +
              '<span class="deadline-subtype">Sub' + (subTag ? ' ' + escapeHtml(subTag) : '') + ':</span> ' + escapeHtml(fmtDate(c.deadline)) + est +
            '</div>' +
          '</div>';
      } else if (c.deadline_quoted || c.deadline_label) {
        deadlineCell = '<span title="' + escapeHtml(withQuoted(c.deadline_label, c.deadline_quoted)) + '">' + escapeHtml(fmtDate(c.deadline)) + '</span>' + est;
      } else {
        deadlineCell = escapeHtml(fmtDate(c.deadline)) + est;
      }

      // Rows backed by a real, officially released deadline (not a pattern
      // guess) get a shaded background + a small dot next to the name, so
      // it's obvious at a glance which dates are confirmed vs. estimated.
      var tr = document.createElement('tr');
      if (!c.estimated) tr.className = 'deadline-row-confirmed';
      var confirmedBadge = !c.estimated
        ? ' <span class="deadline-confirmed-badge" title="Deadline officially confirmed">●</span>'
        : '';
      tr.innerHTML =
        '<td class="deadline-conf-name"><a href="' + escapeHtml(c.link) + '" target="_blank">' + escapeHtml(c.name) + ' ' + escapeHtml(c.year) + '</a>' + confirmedBadge + '</td>' +
        '<td><span class="deadline-tag ' + t.cls + '">' + escapeHtml(t.area) + '</span></td>' +
        '<td class="deadline-date">' + deadlineCell + '</td>' +
        '<td class="deadline-date">' + escapeHtml(c.date || 'TBA') + '</td>' +
        '<td class="deadline-location">' + escapeHtml(c.place || 'TBA') + '</td>' +
        '<td><span class="deadline-status ' + s.cls + '">' + escapeHtml(s.text) + '</span></td>';
      tbody.appendChild(tr);
    }

    function label(text) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="6" class="deadline-section-label">' + escapeHtml(text) + '</td>';
      tbody.appendChild(tr);
    }

    if (upcoming.length) { label('Upcoming Deadlines'); upcoming.forEach(row); }
    if (passed.length)   { label('Recently Passed');    passed.forEach(row); }
    if (unknown.length)  { label('Unknown Date');       unknown.forEach(row); }

    var el = document.getElementById('deadline-updated');
    if (el) {
      el.textContent = 'Updated ' + updatedDate;
      var updatedAsDate = new Date(updatedDate);
      var isStale = !isNaN(updatedAsDate.getTime()) &&
        Math.ceil((today - updatedAsDate) / 864e5) > STALE_AFTER_DAYS;
      el.classList.toggle('deadline-stale', isStale);
      if (isStale) el.textContent += ' (may be outdated — please verify on official sites)';
    }

    var icsBtn = document.getElementById('deadline-ics-btn');
    if (icsBtn) {
      // Pattern-estimated dates are guesses, not real deadlines — exporting
      // them to a calendar risks a confidently-wrong reminder, so only
      // conferences with an officially released deadline are included.
      var released = upcoming.filter(function (c) { return !c.estimated; });
      icsBtn.disabled = released.length === 0;
      icsBtn.title = released.length === 0
        ? 'No conferences with a confirmed (non-estimated) deadline yet'
        : 'Adds ' + released.length + ' conference' + (released.length === 1 ? '' : 's') + ' with confirmed deadlines';
      icsBtn.onclick = function () { downloadICS(released); };
    }
  }

  function init() {
    fetch('data/deadlines.json')
      .then(function (r) {
        if (!r.ok) throw new Error('deadlines.json fetch failed: ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.conferences)) throw new Error('deadlines.json has unexpected shape');
        render(data);
      })
      .catch(function () { render(FALLBACK); });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
