// Small animation helpers for interval stepping and progression movement
(function () {
  // Interval stepping: click .interval-row to animate stepping from R to target
  document.querySelectorAll('.interval-row').forEach(row => {
    const cells = Array.from(row.querySelectorAll('.il-cell'));
    const target = row.querySelector('.il-cell.target');
    if (!cells.length || !target) return;
    row.addEventListener('click', () => {
      cells.forEach(c => c.style.background = '');
      const targetIdx = cells.indexOf(target);
      cells.forEach((c, i) => {
        if (i <= targetIdx) {
          setTimeout(() => {
            const old = c.style.background;
            c.style.transition = 'background .25s';
            c.style.background = 'var(--accent)';
            c.style.color = 'white';
            setTimeout(() => { if (!c.classList.contains('tonic') && !c.classList.contains('target')) { c.style.background = ''; c.style.color = ''; } }, 800);
          }, i * 140);
        }
      });
    });
  });

  // Progression movement: click step or play button advances through chords
  document.querySelectorAll('[data-prog-play]').forEach(btn => {
    btn.addEventListener('click', () => {
      const map = document.getElementById(btn.dataset.progPlay);
      if (!map) return;
      const steps = Array.from(map.querySelectorAll('.prog-step'));
      steps.forEach(s => s.classList.remove('is-current'));
      steps.forEach((s, i) => setTimeout(() => {
        steps.forEach(x => x.classList.remove('is-current'));
        s.classList.add('is-current');
        if (i === steps.length - 1) setTimeout(() => s.classList.remove('is-current'), 700);
      }, i * 720));
    });
  });

  // Solo phrase builder: highlight a sequence of notes on a fretboard
  document.querySelectorAll('[data-phrase-play]').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrap = document.getElementById(btn.dataset.phrasePlay);
      if (!wrap) return;
      const seq = (btn.dataset.phraseSeq || '').split(',').map(s => s.trim()).filter(Boolean);
      // Each item is "string:fret" e.g. "3:5" (string index 0=low E ... 5=high E)
      const svg = wrap.querySelector('.fb-svg');
      if (!svg) return;
      seq.forEach((it, i) => {
        const [s, f] = it.split(':');
        setTimeout(() => {
          const n = svg.querySelector(`.note[data-string="${s}"][data-fret="${f}"]`);
          if (n) { n.classList.remove('pulse'); void n.getBoundingClientRect(); n.classList.add('pulse'); }
        }, i * 360);
      });
    });
  });
})();
