/* Aboard the Astra — Mechanics Wiki.
   Plain static JS: client-side search across the wiki sections, and a
   renderer for the generated numbers (live from the backend API,
   snapshot in data/mechanics.snapshot.json as fallback).
   No build step, no dependencies. If mechanics.json fails to load
   (e.g. opened as a bare file), the hand-written pages still stand. */
(function () {
  var input = document.getElementById('search');
  var count = document.getElementById('search-count');
  var sections = Array.prototype.slice.call(document.querySelectorAll('section.page'));

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function clearMarks(root) {
    root.querySelectorAll('mark').forEach(function (m) {
      m.replaceWith(document.createTextNode(m.textContent));
    });
  }

  function markMatches(root, q) {
    var re = new RegExp('(' + escapeRegExp(q) + ')', 'gi');
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !re.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        if (node.parentNode && (node.parentNode.tagName === 'SCRIPT' || node.parentNode.tagName === 'STYLE')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      var last = 0;
      node.nodeValue.replace(re, function (match, _g, offset) {
        frag.appendChild(document.createTextNode(node.nodeValue.slice(last, offset)));
        var m = document.createElement('mark');
        m.textContent = match;
        frag.appendChild(m);
        last = offset + match.length;
      });
      frag.appendChild(document.createTextNode(node.nodeValue.slice(last)));
      node.replaceWith(frag);
    });
  }

  function runSearch() {
    var q = input.value.trim().toLowerCase();
    var shown = 0;
    sections.forEach(function (sec) {
      clearMarks(sec);
      if (!q) { sec.classList.remove('hidden'); shown++; return; }
      var hit = sec.textContent.toLowerCase().indexOf(q) !== -1;
      sec.classList.toggle('hidden', !hit);
      if (hit) { shown++; markMatches(sec, input.value.trim()); }
    });
    count.textContent = q ? (shown + ' of ' + sections.length + ' pages match') : '';
  }

  input.addEventListener('input', runSearch);

  /* ---- Theme: dark is the default, toggle switches to light ---- */
  var themeBtn = document.getElementById('theme-toggle');
  var root = document.documentElement;
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeBtn) themeBtn.textContent = theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode';
    try { localStorage.setItem('astra-wiki-theme', theme); } catch (e) {}
  }
  try {
    var saved = localStorage.getItem('astra-wiki-theme');
    if (saved === 'light' || saved === 'dark') applyTheme(saved);
    else applyTheme('dark');
  } catch (e) { applyTheme('dark'); }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }


  /* ---- Generated numbers: render mechanics.json into #generated-tables ---- */
  function table(title, rows) {
    var html = '<h3>' + title + '</h3><table><thead><tr><th>Name</th><th>Value</th><th>Source</th></tr></thead><tbody>';
    rows.forEach(function (r) {
      html += '<tr><td><code>' + r[0] + '</code></td><td>' + r[1] + '</td><td><code>' + r[2] + '</code></td></tr>';
    });
    return html + '</tbody></table>';
  }

  /* ---- Generated numbers: live from the backend API, snapshot fallback ----
     The backend returns an envelope {live, generated_at, source_sha,
     mechanics}. If it is unreachable, use the bundled snapshot in
     data/mechanics.snapshot.json and say so on the page. */
  var API_BASE = (window.ASTRA_WIKI_API || 'http://localhost:13382').replace(/\/$/, '');
  var statusEl = document.getElementById('data-status');
  function setStatus(text, live) {
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.setAttribute('data-live', live ? 'live' : 'snapshot');
    }
    var foot = document.getElementById('data-status-foot');
    if (foot) foot.textContent = text;
  }
  function loadMechanics() {
    return fetch(API_BASE + '/api/mechanics')
      .then(function (resp) { if (!resp.ok) throw new Error(resp.status); return resp.json(); })
      .then(function (env) {
        var mech = env.mechanics || env;
        var when = env.generated_at ? new Date(env.generated_at).toLocaleString() : 'unknown time';
        var sha = env.source_sha ? env.source_sha.slice(0, 8) : 'unknown';
        setStatus(env.live
          ? 'Live data — regenerated ' + when + ' from main @ ' + sha + '.'
          : 'Snapshot data — backend unreachable, showing the bundled snapshot (2026-11-05).', !!env.live);
        return mech;
      })
      .catch(function () {
        return fetch('data/mechanics.snapshot.json')
          .then(function (resp) { if (!resp.ok) throw new Error(resp.status); return resp.json(); })
          .then(function (data) {
            setStatus('Snapshot data — backend unreachable, showing the bundled snapshot (2026-11-05).', false);
            return data;
          });
      });
  }
  loadMechanics()
    .then(function (data) {
      var el = document.getElementById('generated-tables');
      var html = '';
      if (data.balance) {
        html += table('Balance constants', Object.keys(data.balance).sort().map(function (k) {
          return [k, data.balance[k].value, data.balance[k].source];
        }));
      }
      if (data.warden) {
        html += table('Warden / Forger pressure', Object.keys(data.warden).sort().map(function (k) {
          return [k, data.warden[k].value, data.warden[k].source];
        }));
      }
      if (data.rival && Object.keys(data.rival).length) {
        html += table('Rival hunt', Object.keys(data.rival).sort().map(function (k) {
          return [k, data.rival[k].value, data.rival[k].source];
        }));
      }
      if (data.store && Object.keys(data.store).length) {
        html += table('Store prices (defaults)', Object.keys(data.store).sort().map(function (k) {
          return [k, data.store[k].value, data.store[k].source];
        }));
      }
      if (data.sectors && data.sectors.length) {
        html += '<h3>Sectors</h3><table><thead><tr><th>Sector</th><th>Kind</th><th>Details</th></tr></thead><tbody>';
        data.sectors.forEach(function (s) {
          var bits = [];
          if (s.proximityFloor !== undefined) bits.push('pressure floor ' + s.proximityFloor);
          if (s.jumpsPerLevel !== undefined) bits.push(s.jumpsPerLevel + ' jumps/level');
          if (s.weight !== undefined) bits.push('weight ' + s.weight);
          if (s.decks) bits.push('decks: ' + s.decks.join(', '));
          html += '<tr><td>' + s.name + '</td><td>' + s.kind + '</td><td>' + bits.join(' · ') + '</td></tr>';
        });
        html += '</tbody></table>';
        if (data.store_chance_percent) {
          html += '<p>Store chance per star: <strong>' + data.store_chance_percent.value +
            '%</strong> (<code>' + data.store_chance_percent.source + '</code>).</p>';
        }
      }
      if (data.wip && data.wip.length) {
        html += '<h3>Work in progress / placeholders</h3><table><thead><tr><th>Item</th><th>What</th><th>Commit / source</th></tr></thead><tbody>';
        data.wip.forEach(function (w) {
          html += '<tr><td>' + w.item + '</td><td>' + w.what + '</td><td><code>' + w.commit + '</code></td></tr>';
        });
        html += '</tbody></table><p>Full prose version: the <a href="#wip">WIP page</a> above.</p>';
      }
      if (data.docs && data.docs.length) {
        html += '<h3>Design docs found at repo root</h3><ul>';
        data.docs.forEach(function (d) {
          html += '<li><code>' + d.file + '</code> — ' + d.title +
            (d.status ? ' <em>(' + d.status + ')</em>' : '') + '</li>';
        });
        html += '</ul>';
      }
      el.innerHTML = html;
    })
    .catch(function () {
      document.getElementById('generated-tables').innerHTML =
        '<p>Could not load numbers from the backend or the bundled snapshot. ' +
        'Check <code>config.js</code> points at a running backend, or open ' +
        '<code>data/mechanics.snapshot.json</code> / <code>generated.md</code> directly — ' +
        'the hand-written pages above are unaffected.</p>';
      setStatus('Numbers unavailable — backend unreachable and snapshot could not be loaded.', false);
    });
})();
