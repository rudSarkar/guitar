/* =====================================================
   Fretwise — Interactive fretboard renderer
   Renders 6-string standard-tuning fretboards with
   highlighted notes, scales, intervals, and chords.
   Each fretboard is a `.fretboard-wrap` with data-* attrs.
   ===================================================== */
(function () {
  const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const FLAT_EQUIV = { 'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb' };
  const STANDARD_TUNING = ['E','A','D','G','B','E']; // low to high
  const STRING_LABELS = ['6 (low E)','5 (A)','4 (D)','3 (G)','2 (B)','1 (high E)'];

  // Scales defined as semitone intervals from the root
  const SCALES = {
    'major':         [0,2,4,5,7,9,11],
    'natural-minor': [0,2,3,5,7,8,10],
    'harmonic-minor':[0,2,3,5,7,8,11],
    'melodic-minor': [0,2,3,5,7,9,11],
    'major-pent':    [0,2,4,7,9],
    'minor-pent':    [0,3,5,7,10],
    'blues':         [0,3,5,6,7,10],
    'ionian':        [0,2,4,5,7,9,11],
    'dorian':        [0,2,3,5,7,9,10],
    'phrygian':      [0,1,3,5,7,8,10],
    'lydian':        [0,2,4,6,7,9,11],
    'mixolydian':    [0,2,4,5,7,9,10],
    'aeolian':       [0,2,3,5,7,8,10],
    'locrian':       [0,1,3,5,6,8,10],
    'chromatic':     [0,1,2,3,4,5,6,7,8,9,10,11]
  };

  // Chord intervals
  const CHORDS = {
    'maj':  [0,4,7],
    'min':  [0,3,7],
    'dim':  [0,3,6],
    'aug':  [0,4,8],
    'maj7': [0,4,7,11],
    'min7': [0,3,7,10],
    'dom7': [0,4,7,10],
    'min7b5': [0,3,6,10],
    'sus2': [0,2,7],
    'sus4': [0,5,7]
  };

  function noteIndex(n) {
    n = n.replace(/♯/g, '#').replace(/♭/g, 'b').trim();
    const map = { 'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#' };
    if (map[n]) n = map[n];
    return NOTES.indexOf(n);
  }

  function noteAt(stringNote, fret) {
    return (noteIndex(stringNote) + fret) % 12;
  }

  function buildFretboard(wrap) {
    const root = (wrap.dataset.root || 'A').trim();
    const scaleKey = wrap.dataset.scale || '';
    const chordKey = wrap.dataset.chord || '';
    const customNotesAttr = wrap.dataset.notes || '';
    const showAllAttr = wrap.dataset.showAll === 'true';
    const fretCount = parseInt(wrap.dataset.frets || '15', 10);
    const startFret = parseInt(wrap.dataset.startFret || '0', 10);
    const labelMode = wrap.dataset.labels || 'notes'; // 'notes' | 'degrees' | 'intervals'

    const rootIdx = noteIndex(root);
    let activeSet = null; // {pcIndex -> degreeNumber}
    let chordTones = null;

    if (scaleKey && SCALES[scaleKey]) {
      activeSet = {};
      SCALES[scaleKey].forEach((semi, i) => { activeSet[(rootIdx + semi) % 12] = i + 1; });
    } else if (chordKey && CHORDS[chordKey]) {
      activeSet = {};
      chordTones = CHORDS[chordKey];
      chordTones.forEach((semi, i) => { activeSet[(rootIdx + semi) % 12] = i + 1; });
    } else if (customNotesAttr) {
      activeSet = {};
      customNotesAttr.split(',').map(s => s.trim()).filter(Boolean).forEach((nm, i) => {
        const idx = noteIndex(nm);
        if (idx >= 0) activeSet[idx] = i + 1;
      });
    }

    // SVG layout
    const fretW = 56;
    const stringGap = 28;
    const padL = 56, padR = 24, padT = 22, padB = 32;
    const W = padL + padR + (fretCount + 1) * fretW;
    const H = padT + padB + 5 * stringGap;

    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('class', 'fb-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Fretboard diagram, root ${root}${scaleKey ? ', scale ' + scaleKey : ''}${chordKey ? ', chord ' + chordKey : ''}`);

    // Fretboard background
    const bg = document.createElementNS('http://www.w3.org/2000/svg','rect');
    bg.setAttribute('x', padL); bg.setAttribute('y', padT);
    bg.setAttribute('width', (fretCount + 1) * fretW); bg.setAttribute('height', 5 * stringGap);
    bg.setAttribute('fill', 'transparent');
    svg.appendChild(bg);

    // Position dots (5,7,9,12,15,17)
    const dotFrets = [3,5,7,9,12,15,17,19,21];
    dotFrets.forEach(f => {
      const localF = f - startFret;
      if (localF >= 1 && localF <= fretCount) {
        const cx = padL + (localF - 0.5) * fretW;
        const isDouble = f % 12 === 0;
        if (isDouble) {
          const d1 = document.createElementNS('http://www.w3.org/2000/svg','circle');
          d1.setAttribute('class','fret-dot');
          d1.setAttribute('cx', cx);
          d1.setAttribute('cy', padT + 1.5 * stringGap);
          d1.setAttribute('r', 6); svg.appendChild(d1);
          const d2 = document.createElementNS('http://www.w3.org/2000/svg','circle');
          d2.setAttribute('class','fret-dot');
          d2.setAttribute('cx', cx);
          d2.setAttribute('cy', padT + 3.5 * stringGap);
          d2.setAttribute('r', 6); svg.appendChild(d2);
        } else {
          const d = document.createElementNS('http://www.w3.org/2000/svg','circle');
          d.setAttribute('class','fret-dot');
          d.setAttribute('cx', cx);
          d.setAttribute('cy', padT + 2.5 * stringGap);
          d.setAttribute('r', 6); svg.appendChild(d);
        }
      }
    });

    // Fret lines
    for (let f = 0; f <= fretCount; f++) {
      const x = padL + f * fretW;
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1', x); line.setAttribute('x2', x);
      line.setAttribute('y1', padT); line.setAttribute('y2', padT + 5 * stringGap);
      line.setAttribute('class', 'fret-line' + ((f === 0 && startFret === 0) ? ' nut' : ''));
      svg.appendChild(line);
    }

    // Fret numbers (under)
    for (let f = 1; f <= fretCount; f++) {
      const absF = f + startFret;
      const t = document.createElementNS('http://www.w3.org/2000/svg','text');
      t.setAttribute('class','fret-marker-text');
      t.setAttribute('x', padL + (f - 0.5) * fretW);
      t.setAttribute('y', padT + 5 * stringGap + 16);
      t.textContent = absF;
      svg.appendChild(t);
    }

    // Strings (drawn from high E top to low E bottom for visual familiarity)
    // We'll iterate i=0 (top, high E) downwards. Tuning index for top is 5.
    for (let i = 0; i < 6; i++) {
      const tuningIdx = 5 - i; // 5=high E -> 0=low E
      const y = padT + i * stringGap;
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1', padL); line.setAttribute('x2', padL + (fretCount + 1) * fretW);
      line.setAttribute('y1', y); line.setAttribute('y2', y);
      line.setAttribute('class', 'string-line' + (tuningIdx < 3 ? ' thick' : ''));
      svg.appendChild(line);

      // String label (left)
      const lbl = document.createElementNS('http://www.w3.org/2000/svg','text');
      lbl.setAttribute('class','fret-marker-text');
      lbl.setAttribute('x', padL - 12);
      lbl.setAttribute('y', y + 3);
      lbl.setAttribute('text-anchor','end');
      lbl.textContent = STANDARD_TUNING[tuningIdx];
      svg.appendChild(lbl);

      // Notes
      for (let f = 0; f <= fretCount; f++) {
        const absF = f + startFret;
        // Skip drawing position 0 marker if we're starting mid-board
        if (startFret > 0 && f === 0) continue;
        const pc = noteAt(STANDARD_TUNING[tuningIdx], absF);
        const isActive = activeSet && activeSet[pc] !== undefined;
        if (!isActive && !showAllAttr) continue;

        const cx = (f === 0) ? padL - 16 : padL + (f - 0.5) * fretW;
        const cy = y;
        const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
        c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', 11);
        c.setAttribute('class', 'note' + (isActive ? ' is-active' : '') + (pc === rootIdx ? ' is-root' : ''));
        c.setAttribute('data-pc', pc);
        c.setAttribute('data-fret', absF);
        c.setAttribute('data-string', tuningIdx);

        // Label
        let label = NOTES[pc];
        if (labelMode === 'degrees' && activeSet && activeSet[pc] !== undefined) label = String(activeSet[pc]);
        else if (labelMode === 'intervals' && activeSet) {
          const semi = (pc - rootIdx + 12) % 12;
          label = ['R','♭2','2','♭3','3','4','♭5','5','♭6','6','♭7','7'][semi];
        }
        const t = document.createElementNS('http://www.w3.org/2000/svg','text');
        t.setAttribute('class','note-text');
        t.setAttribute('x', cx); t.setAttribute('y', cy + 0.5);
        t.textContent = label;

        // Click — pulse animation
        c.addEventListener('click', () => {
          c.classList.remove('pulse'); void c.getBoundingClientRect(); c.classList.add('pulse');
          c.dispatchEvent(new Event('animationend'));
        });

        svg.appendChild(c);
        svg.appendChild(t);
      }
    }

    // Inject control toolbar if there are degree-aware controls requested
    const controlsHost = wrap.querySelector('.fb-controls');
    if (controlsHost && activeSet) {
      controlsHost.querySelectorAll('button[data-fb-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.fbAction;
          if (action === 'play') {
            // sequence active notes by degree
            const notes = Array.from(svg.querySelectorAll('.note.is-active'));
            notes.sort((a, b) => (+a.dataset.pc) - (+b.dataset.pc));
            const uniq = [];
            const seen = new Set();
            notes.forEach(n => { const k = n.dataset.pc; if (!seen.has(k)) { seen.add(k); uniq.push(n); } });
            uniq.forEach((n, i) => setTimeout(() => { n.classList.remove('pulse'); void n.getBoundingClientRect(); n.classList.add('pulse'); }, i * 320));
          } else if (action === 'toggle-labels') {
            const cur = wrap.dataset.labels || 'notes';
            wrap.dataset.labels = cur === 'notes' ? 'degrees' : cur === 'degrees' ? 'intervals' : 'notes';
            wrap.querySelector('.fb-svg').remove();
            buildFretboard(wrap);
          }
        });
      });
    }

    // Replace any existing svg
    const old = wrap.querySelector('.fb-svg');
    if (old) old.remove();
    wrap.appendChild(svg);
  }

  function init() {
    document.querySelectorAll('.fretboard-wrap').forEach(buildFretboard);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
