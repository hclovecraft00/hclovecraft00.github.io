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

  // escalator kisses animation (drawings + player in this folder):
  // beside the poem on wide screens, under it (above the picture) on narrow ones
  const box = document.createElement('div');
  box.className = 'esc-anim';
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', 'Animation: hand-drawn couples kissing on an up and a down escalator');
  box.innerHTML = '<div id="escalator-kisses" data-base=""></div>';
  body.insertBefore(box, body.querySelector('figure'));
  const wide = window.matchMedia('(min-width:1100px)');
  const place = () => {
    if (!wide.matches || !lines.length) { box.style.top = ''; return; }
    const b = body.getBoundingClientRect(), a = lines[0].getBoundingClientRect(), z = lines[lines.length - 1].getBoundingClientRect();
    box.style.top = Math.round((a.top + z.bottom) / 2 - b.top - box.offsetHeight / 2) + 'px';   // centred on the poem's lines
  };
  place();
  addEventListener('resize', place);
  if (document.fonts) document.fonts.ready.then(place);
  const s = document.createElement('script');
  s.src = 'escalator.js';
  document.body.appendChild(s);
})();
