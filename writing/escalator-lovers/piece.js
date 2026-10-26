// escalator lovers: lay the lines out as steps (static, no animation).
(function () {
  // step for each line, in order (read off Harper's typeset image; 0 = furthest left)
  const STEPS = [5, 6, 6, 5, 4, 3, 2,                 // Honey … the construction that never ends…
                 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10,   // …I'd linger … as young lovers / do
                 6, 5, 4, 3, 2, 0];                   // i've arrived here once … i'll take the last train
  const body = document.querySelector('.piece .body');
  if (!body) return;

  const lines = [];
  [...body.querySelectorAll(':scope > p')].forEach(p => {
    if (p.classList.contains('link-card')) return;
    const text = p.textContent.replace(/ /g, ' ').trim();
    if (!text) { p.classList.add('landing'); return; }
    // the steps replace Harper's typed indents
    p.innerHTML = p.innerHTML.replace(/^(\s|&nbsp;| )+/, '');
    p.classList.add('line');
    if (/^canoo|^-ooo/.test(text)) p.classList.add('stretch');
    lines.push(p);
  });
  lines.forEach((p, i) => p.style.setProperty('--s', STEPS[i] ?? 0));
})();
