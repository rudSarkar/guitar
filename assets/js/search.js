// Lightweight client-side search over /assets/search-index.json
(function () {
  const input = document.getElementById('search-input');
  const panel = document.getElementById('search-results');
  if (!input || !panel) return;

  let index = null;
  let activeIdx = -1;
  let currentResults = [];

  function loadIndex() {
    if (index !== null) return Promise.resolve(index);
    const base = (document.querySelector('base') && document.querySelector('base').href) || '';
    // Resolve relative to site root
    const siteRoot = (document.querySelector('base') && document.querySelector('base').href) || window.location.href;
    const url = new URL('assets/search-index.json', siteRoot).href;
    return fetch(url).then(r => r.json()).then(j => { index = j; return j; }).catch(() => { index = []; return []; });
  }

  function tokenize(q) {
    return q.toLowerCase().split(/\s+/).filter(Boolean);
  }

  function score(item, tokens) {
    let s = 0;
    const titleLc = item.title.toLowerCase();
    const chapLc = (item.chapter_title || '').toLowerCase();
    const bodyLc = (item.body || '').toLowerCase();
    for (const t of tokens) {
      if (!t) continue;
      if (titleLc === t) s += 40;
      if (titleLc.startsWith(t)) s += 18;
      if (titleLc.includes(t)) s += 12;
      if (chapLc.includes(t)) s += 5;
      const occ = bodyLc.split(t).length - 1;
      s += Math.min(occ, 8) * 2;
      if (item.keywords && item.keywords.some(k => k.toLowerCase().includes(t))) s += 6;
    }
    return s;
  }

  function snippet(body, tokens) {
    if (!body) return '';
    const lc = body.toLowerCase();
    let pos = -1;
    for (const t of tokens) { const i = lc.indexOf(t); if (i >= 0 && (pos < 0 || i < pos)) pos = i; }
    if (pos < 0) pos = 0;
    const start = Math.max(0, pos - 40);
    const end = Math.min(body.length, pos + 120);
    let s = (start > 0 ? '…' : '') + body.slice(start, end) + (end < body.length ? '…' : '');
    // Highlight
    for (const t of tokens) {
      const re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      s = s.replace(re, '<mark>$1</mark>');
    }
    return s;
  }

  function highlight(text, tokens) {
    let s = text;
    for (const t of tokens) {
      const re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      s = s.replace(re, '<mark>$1</mark>');
    }
    return s;
  }

  function render(results, tokens) {
    if (!results.length) {
      panel.innerHTML = '<div class="sr-empty">No results. Try simpler keywords like “scale”, “chord”, “modes”.</div>';
      panel.classList.add('show');
      return;
    }
    const html = ['<div class="group-label">Top results</div>'];
    results.slice(0, 10).forEach((r, i) => {
      html.push(
        `<a href="${r.url}" role="option" data-idx="${i}" class="${i === activeIdx ? 'is-active' : ''}">
          <span class="sr-title">${highlight(r.title, tokens)}</span>
          <span class="sr-meta">${r.chapter_title || 'Reference'}</span>
          ${r.body ? `<span class="sr-meta">${snippet(r.body, tokens)}</span>` : ''}
        </a>`
      );
    });
    panel.innerHTML = html.join('');
    panel.classList.add('show');
  }

  function search(q) {
    const tokens = tokenize(q);
    if (!tokens.length) { panel.classList.remove('show'); return; }
    loadIndex().then(data => {
      const scored = data.map(item => ({ item, s: score(item, tokens) })).filter(r => r.s > 0).sort((a, b) => b.s - a.s).map(r => r.item);
      currentResults = scored;
      activeIdx = scored.length ? 0 : -1;
      render(scored, tokens);
    });
  }

  let timer;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(() => search(input.value.trim()), 80);
  });
  input.addEventListener('focus', function () {
    if (input.value.trim()) search(input.value.trim());
  });
  document.addEventListener('click', function (e) {
    if (!panel.contains(e.target) && e.target !== input) panel.classList.remove('show');
  });
  input.addEventListener('keydown', function (e) {
    if (!panel.classList.contains('show')) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(currentResults.length - 1, activeIdx + 1); update(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(0, activeIdx - 1); update(); }
    else if (e.key === 'Enter') {
      const a = panel.querySelector(`a[data-idx="${activeIdx}"]`);
      if (a) { e.preventDefault(); window.location.href = a.getAttribute('href'); }
    }
  });

  function update() {
    panel.querySelectorAll('a').forEach((a, i) => a.classList.toggle('is-active', i === activeIdx));
    const a = panel.querySelector(`a[data-idx="${activeIdx}"]`);
    if (a) a.scrollIntoView({ block: 'nearest' });
  }
})();
