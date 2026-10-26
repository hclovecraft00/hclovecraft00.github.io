(function () {
  const STEPS = [5, 6, 6, 5, 4, 3, 2,
                 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10,
                 6, 5, 4, 3, 2, 0];
  const body = document.querySelector('.piece .body');
  if (!body) return;

  const lines = [];
  [...body.querySelectorAll(':scope > p')].forEach(p => {
    if (p.classList.contains('link-card')) return;
    const text = p.textContent.replace(/ /g, ' ').trim();
    if (!text) { p.classList.add('landing'); return; }
    p.innerHTML = p.innerHTML.replace(/^(\s|&nbsp;| )+/, '');
    p.classList.add('line');
    if (/^canoo|^-ooo/.test(text)) p.classList.add('stretch');
    lines.push(p);
  });
  lines.forEach((p, i) => p.style.setProperty('--s', STEPS[i] ?? 0));
})();
