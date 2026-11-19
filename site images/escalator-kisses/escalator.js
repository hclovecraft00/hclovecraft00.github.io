/* Escalator kisses: Harper's hand-drawn couples on two escalators, looping.
   The same code as the Motion film, run here with a tiny player. Drawings live next to this file. */
(function () {
  var root = document.getElementById('escalator-kisses');
  if (!root) return;
  var BASE = root.getAttribute('data-base') || '';   // folder holding the drawings, relative to the page
  var DUR = 22.8;
  var def = null;
  var kit = {
    stage: root,
    scene: function (id, d) { def = d; },
    h: function (html) { var t = document.createElement('template'); t.innerHTML = html; return t.content.firstElementChild; },
    assets: {
      url: function (n) { return BASE + n; },
      image: function (n) { return new Promise(function (ok) { var i = new Image(); i.onload = i.onerror = function () { ok(i); }; i.src = BASE + n; }); },
    },
  };

// ---- shared drawing set-up (from the film) ----
// Two escalators side by side, side shot, drawn as rough black marker line work.
// Near one goes up, far one goes down. Everything is laid out in stage pixels (1920 x 1080).
window.W = (() => {
  const STEP_X = 80, STEP_Y = 46.2, STEP = Math.hypot(STEP_X, STEP_Y), N = 10;
  const ux = STEP_X / STEP, uy = -STEP_Y / STEP;          // unit vector up the slope
  const W = {
    STEP, N, LEN: N * STEP, ux, uy,
    VE: 2 * STEP,                 // escalator: two steps a second
    VW: 330,                      // walking speed
    D: 0.8,                       // drawing scale (uploaded drawings to stage)
    // The far escalator sits high enough that the near handrail never crosses its riders.
    E: {
      near: { id: 'ride-up', B: [540, 1030], T: [1340, 568], dir: 1, w: 6 },
      far:  { id: 'ride-dn', B: [580, 830], T: [1380, 368], dir: -1, w: 5 },
    },
    START_X: -170, END_X: 2090,
  };
  W.TIN = (W.E.near.B[0] - W.START_X) / W.VW;   // walk from off-frame to the comb
  W.TOUT = (W.END_X - W.E.near.T[0]) / W.VW;    // walk from the top comb to off-frame
  W.RIDE = W.LEN / W.VE;
  // Each wave is one couple per escalator, starting together. Boardings land on whole steps.
  // The shot is cropped to the slopes alone (VIEW), so couples appear as they step on.
  // When each wave's front pair steps on: the next wave 2.5 s later, then a fresh pair of waves once the first has gone.
  W.VIEW = [640, 120, 640, 800];   // tighter shot, set low for white space on top (v3: [640, 240, 640, 800]; v2: [544, -25, 854, 1067.5])
  W.ART = [544, -25, 854, 1067.5]; // where Harper's escalator drawings sit: the frame they were drawn on, whatever the shot
  W.TB = [1.3, 3.8, 7.8, 10.3, 14.3, 16.8];
  // Pacing: everything runs this many times slower than the times above (1 = the bookmarked v2 speed).
  W.SLOW = 1;
  W.STARTS = W.TB.map((t) => t - W.TIN);
  W.TB1 = W.TB[0];
  W.rng = (s) => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  W.n = (v) => (Math.round(v * 10) / 10).toString();
  W.mod = (a, b) => ((a % b) + b) % b;
  // A wobbly marker line through the points: small sideways jitter, a little overshoot at the ends.
  W.rough = (pts, seed, amp, seg) => {
    const R = W.rng(seed), a = amp == null ? 2.2 : amp, sg = seg || 55, out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, n = Math.max(1, Math.round(L / sg));
      for (let k = i === 0 ? 0 : 1; k <= n; k++) {
        const f = k / n, j = (R() - 0.5) * 2 * a;
        out.push([x0 + dx * f - dy / L * j, y0 + dy * f + dx / L * j]);
      }
    }
    if (out.length > 1) {
      const o = 2 + R() * 3, [ax, ay] = out[0], [bx, by] = out[1], l0 = Math.hypot(bx - ax, by - ay) || 1;
      out[0] = [ax - (bx - ax) / l0 * o, ay - (by - ay) / l0 * o];
      const m = out.length, [cx, cy] = out[m - 2], [ex, ey] = out[m - 1], l1 = Math.hypot(ex - cx, ey - cy) || 1;
      out[m - 1] = [ex + (ex - cx) / l1 * o, ey + (ey - cy) / l1 * o];
    }
    // straight strokes between the wobbled points, so corners stay corners
    return out.map((p, i) => (i ? 'L' : 'M') + W.n(p[0]) + ' ' + W.n(p[1])).join(' ');
  };
  W.stroke = (d, w, extra) => '<path d="' + d + '" style="fill:none;stroke:var(--ink);stroke-width:' + w + ';stroke-linecap:round;stroke-linejoin:round' + (extra || '') + '"/>';
  W.at = (e, u, off) => [e.B[0] + ux * u, e.B[1] + uy * u + (off || 0)];   // point on the slope, u from the bottom comb
  W.ring = (cx, cy, r, n) => Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos(i / n * 6.2832), cy + r * Math.sin(i / n * 6.2832)]);
  // The handrail: rounded newels at both ends, parallel to the steps between.
  W.railPts = (e, h) => {
    const [bx, by] = e.B, [tx, ty] = e.T, q = (p0, c, p1) => [0.25, 0.5, 0.75, 1].map((s) => [(1 - s) * (1 - s) * p0[0] + 2 * (1 - s) * s * c[0] + s * s * p1[0], (1 - s) * (1 - s) * p0[1] + 2 * (1 - s) * s * c[1] + s * s * p1[1]]);
    return [[bx - 48, by - 2], [bx - 48, by - h + 42], ...q([bx - 48, by - h + 42], [bx - 48, by - h], [bx, by - h]), [tx, ty - h],
      ...q([tx, ty - h], [tx + 48, ty - h], [tx + 48, ty - h + 42]), [tx + 48, ty - 2]];
  };
  // Static line work in three slightly different hand-drawn versions (they boil).
  W.frame = (e, v) => {
    const s = (e.dir > 0 ? 100 : 500) + v * 37, w = e.w, [bx, by] = e.B, [tx, ty] = e.T, cot = STEP_X / STEP_Y;
    let g = '';
    // floors and the upper slab, with hatching
    g += W.stroke(W.rough([[-30, by], [bx - 70, by]], s + 1), w);
    g += W.stroke(W.rough([[tx + 70, ty], [1950, ty]], s + 2), w);
    g += W.stroke(W.rough([[tx + 70, ty + 44], [1950, ty + 44]], s + 3), w - 1);
    let hat = '';
    for (let x = tx + 96; x < 1940; x += 34) hat += W.rough([[x, ty + 40], [x + 22, ty + 6]], s + x, 1.2, 80) + ' ';
    g += W.stroke(hat, w - 2.5);
    // truss: white side panel so whatever is behind it is hidden
    const tr = [[bx - 70, by], [bx + 14 * cot, by], [tx + 14 * cot, ty], [tx + 70, ty], [tx + 70, ty + 62], [tx, ty + 110], [bx + 110 * cot, by], [bx - 70, by]];
    g += '<path d="' + tr.map((p, i) => (i ? 'L' : 'M') + W.n(p[0]) + ' ' + W.n(p[1])).join(' ') + 'Z" style="fill:var(--ground)"/>';
    g += W.stroke(W.rough(tr, s + 4, 2.4), w);
    // lattice bracing inside the truss
    const lat = [];
    for (let u = 230, k = 0; u < W.LEN - 40; u += 72, k++) lat.push(W.at(e, u, k % 2 ? 34 : 94));
    g += W.stroke(W.rough(lat, s + 5, 1.8), w - 3);
    // glass panel joints and a couple of glints
    let gl = '';
    [190, 470, 750].forEach((u, i) => { const p = W.at(e, u); gl += W.rough([[p[0], p[1] - 10], [p[0], p[1] - 116]], s + 10 + i, 1.4, 60) + ' '; });
    [330, 610].forEach((u, i) => { const p = W.at(e, u); gl += W.rough([[p[0] - 10, p[1] - 30], [p[0] + 22, p[1] - 92]], s + 20 + i, 1.2, 60) + ' '; });
    g += W.stroke(gl, w - 2.5);
    return g;
  };
  // The moving steps: a long sawtooth, slid along the slope and clipped to the incline.
  W.steps = (e) => {
    const pts = [];
    for (let k = -2; k <= N + 2; k++) {
      const [cx, cy] = W.at(e, k * STEP);
      if (k === -2) pts.push([cx - STEP_X / 2, cy]);
      pts.push([cx + STEP_X / 2, cy], [cx + STEP_X / 2, cy - STEP_Y]);
    }
    return W.rough(pts, e.dir > 0 ? 7 : 8, 1.2, 40);
  };
  W.gear = (cx, cy, r, seed) => {
    let sp = '';
    for (let i = 0; i < 4; i++) { const a = i * 0.785; sp += W.rough([[-Math.cos(a) * r * 0.8, -Math.sin(a) * r * 0.8], [Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8]], seed + i, 1, 60) + ' '; }
    return '<g class="ride-gear" data-c="' + cx + ' ' + cy + '" data-r="' + r + '">' + W.stroke(W.rough(W.ring(0, 0, r, 14), seed, 1.6, 30), 4.5) + W.stroke(sp, 3) + '</g>';
  };
  return W;
})();
var W = window.W;

// ---- the scene (from the film) ----
// Harper's own drawings: where each one's feet are (in the uploaded drawing's pixels).
const RIDE_ANCH = {"W7":[54.5,359.5],"W8":[50.5,352],"S1":[51.5,353],"S2":[61,356.5],"S3":[60.5,346.5],"R":[57.5,346],"O1":[55.5,354],"O2":[61.5,356],"O3":[55.5,347],"T1":[57,358],"T2":[60,354.5],"T3":[77.5,343.5],"T4":[87,339.5],"T5":[90.5,348],"K0":[56.5,406],"K1":[60,417],"K2":[54,386],"K3":[57.5,371],"K4":[48,361],"K5":[56.5,379.5],"K6":[48,383]};
const RIDE_SIZE = {"W7":[141,377],"W8":[143,370],"S1":[135,371],"S2":[144,374],"S3":[140,364],"R":[141,364],"O1":[132,372],"O2":[157,374],"O3":[137,365],"T1":[135,376],"T2":[148,372],"T3":[171,361],"T4":[155,357],"T5":[157,366],"K0":[217,424],"K1":[222,435],"K2":[224,404],"K3":[232,389],"K4":[219,379],"K5":[215,397],"K6":[212,401]};
// The front person's drawings while riding, by seconds after they step on (12 drawings a second).
const RIDE_A = [[10, 'T1'], [12, 'T2'], [13, 'T3'], [14, 'T4'], [15, 'T5'], [18, 'PAIR'], [52, 'T5'], [53, 'T4'], [54, 'T3'], [55, 'T2'], [56, 'T1'], [58, 'R']].map(([f, c]) => [f / 12, c]);
const RIDE_K = [[18, 'K0'], [21, 'K1'], [23, 'K2'], [25, 'K3'], [27, 'K4'], [29, 'K5'], [31, 'K6'], [46, 'K5'], [47, 'K4'], [48, 'K2'], [49, 'K1'], [50, 'K0']].map(([f, c]) => [f / 12, c]);

kit.scene('ride', {
  async init(kit) {
    const codes = Object.keys(RIDE_ANCH).concat(['far-body', 'far-front', 'near-body', 'near-front', 'steps', 'gear']);
    await Promise.all(codes.map((c) => kit.assets.image(c + '.png')));
    this.url = {};
    codes.forEach((c) => { this.url[c] = kit.assets.url(c + '.png'); });
    const E = W.E;
    const escMarkup = (e) => {
      const clip = e.id + '-clip', [bx, by] = e.B, [tx, ty] = e.T;
      // Harper's own escalator drawings, one layer each: steps (slid), white behind the side panel, the panel, gears, then the handrail in front of the riders.
      const far = e.dir < 0, dx = far ? 40 : 0, dy = far ? -200 : 0, cot = 80 / 46.2, V = W.ART;
      const img = (name, x, y, w, h) => '<image href="' + this.url[name] + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" preserveAspectRatio="none"></image>';
      const g1 = W.at(e, 160, 56), g2 = W.at(e, W.LEN - 80, 56);
      const gear = (p) => '<g class="ride-gear" data-c="' + W.n(p[0]) + ' ' + W.n(p[1]) + '" data-r="22">' + img('gear', -25.5, -25.5, 51, 51) + '</g>';
      const panel = [[bx - 70, by], [bx + 14 * cot, by], [tx + 14 * cot, ty], [tx + 70, ty], [tx + 70, ty + 62], [tx, ty + 110], [bx + 110 * cot, by]];
      const under = '<defs><clipPath id="' + clip + '"><path d="M' + bx + ' ' + (by - 90) + ' L' + tx + ' ' + (ty - 90) + ' L' + tx + ' ' + (ty + 40) + ' L' + bx + ' ' + (by + 40) + ' Z"/></clipPath></defs>' +
        '<g clip-path="url(#' + clip + ')"><g class="' + e.id + '-steps">' + img('steps', 250 + dx, 330 + dy, 1480, 880) + '</g></g>' +
        '<path d="' + panel.map((p, i) => (i ? 'L' : 'M') + W.n(p[0]) + ' ' + W.n(p[1])).join(' ') + 'Z" style="fill:var(--ground)"/>' +
        img(far ? 'far-body' : 'near-body', V[0], V[1], V[2], V[3]) + gear(g1) + gear(g2);
      const front = img(far ? 'far-front' : 'near-front', V[0], V[1], V[2], V[3]);
      return { under, front };
    };
    const far = escMarkup(E.far), near = escMarkup(E.near);
    // Every couple: the back person, the front person, and the two drawn together for the kiss.
    let farP = '', nearP = '';
    this.couples = [];
    W.STARTS.forEach((s0, i) => {
      [['far', E.far], ['near', E.near]].forEach(([k, e]) => {
        const id = 'ride-c' + i + k;
        const m = ['b', 'a', 'k'].map((p) => '<g class="' + id + p + '"><image></image></g>').join('');
        if (k === 'far') farP += m; else nearP += m;
        this.couples.push({ id, e, s0 });
      });
    });
    kit.stage.append(kit.h('<div class="ground"><svg class="art ride-art" viewBox="' + W.VIEW.join(' ') + '">' +
      far.under + '<g class="ride-dn-people">' + farP + '</g>' + far.front +
      near.under + '<g class="ride-up-people">' + nearP + '</g>' + near.front +
      // every drawing kept decoded off-frame, so swapping a person to their next drawing never shows a blank frame
      '<g class="ride-warm" style="opacity:0.001">' + Object.keys(RIDE_SIZE).map((c) => '<image href="' + this.url[c] + '" x="' + (W.VIEW[0] + 1) + '" y="' + (W.VIEW[1] + 1) + '" width="2" height="2"></image>').join('') + '</g>' +
      '</svg></div>'));
    const q = (s) => kit.stage.querySelector(s);
    this.esc = [E.near, E.far].map((e) => ({ e, steps: q('.' + e.id + '-steps') }));
    this.gears = Array.from(kit.stage.querySelectorAll('.ride-gear')).map((g) => ({ g, c: g.dataset.c, r: +g.dataset.r }));
    this.gears.forEach((x, i) => { x.dir = i < 2 ? -1 : 1; });
    const sprite = (sel) => { const g = q(sel); return { g, img: g.querySelector('image'), code: '' }; };
    this.couples.forEach((c) => { c.A = sprite('.' + c.id + 'a'); c.B = sprite('.' + c.id + 'b'); c.K = sprite('.' + c.id + 'k'); });
  },
  // Where one person is, and which drawing shows, tr seconds after they start walking in.
  where(e, tr) {
    const up = e.dir > 0;
    if (tr < W.TIN) {
      const left = W.TIN - tr, code = left <= 1.01 / 12 ? 'S3' : left <= 2.01 / 12 ? 'S2' : left <= 3.01 / 12 ? 'S1' : (Math.floor(tr * 6) % 2 ? 'W8' : 'W7');
      return up ? [W.START_X + W.VW * tr, e.B[1], code, -1] : [W.END_X - W.VW * tr, e.T[1], code, -1];
    }
    if (tr < W.TIN + W.RIDE) {
      const u = W.VE * (tr - W.TIN), p = up ? W.at(e, u) : W.at(e, W.LEN - u);
      return [p[0], p[1], 'R', tr - W.TIN];
    }
    const o = tr - W.TIN - W.RIDE, code = o < 1 / 12 ? 'O1' : o < 2 / 12 ? 'O2' : o < 3 / 12 ? 'O3' : (Math.floor(o * 6) % 2 ? 'W8' : 'W7');
    return up ? [e.T[0] + W.VW * o, e.T[1], code, -1] : [e.B[0] - W.VW * o, e.B[1], code, -1];
  },
  show(s, x, y, code, flip) {
    if (!code || x < -280 || x > 2200) { s.g.style.display = 'none'; return; }
    s.g.style.display = '';
    if (s.code !== code) {
      s.code = code;
      const [w, h] = RIDE_SIZE[code], [ax, ay] = RIDE_ANCH[code];
      s.img.setAttribute('href', this.url[code]);
      s.img.setAttribute('width', w); s.img.setAttribute('height', h);
      s.img.setAttribute('x', -ax); s.img.setAttribute('y', -ay);
    }
    s.g.setAttribute('transform', 'translate(' + W.n(x) + ' ' + W.n(y) + ') scale(' + (flip ? -W.D : W.D) + ' ' + W.D + ')');
  },
  pick(list, t, base) {
    let c = base;
    for (const [at, code] of list) if (t >= at - 1e-6) c = code;
    return c;
  },
  render(t) {
    const tq = Math.floor(t * 12 + 1e-6) / 12 / (W.SLOW || 1);     // everything moves in 12 drawings a second, like hand animation
    // Harper's steps repeat every three steps, so the strip slides three steps and jumps back unseen.
    const ph = W.mod(W.VE * (tq - W.TB1), 3 * W.STEP);
    for (const s of this.esc) {
      const off = s.e.dir > 0 ? ph : W.mod(-ph, 3 * W.STEP);
      s.steps.setAttribute('transform', 'translate(' + (W.ux * off).toFixed(2) + ' ' + (W.uy * off).toFixed(2) + ')');
    }
    for (const g of this.gears) g.g.setAttribute('transform', 'translate(' + g.c + ') rotate(' + (g.dir * W.VE * tq / g.r * 57.3 % 360).toFixed(1) + ')');
    for (const c of this.couples) {
      const up = c.e.dir > 0, flip = !up;
      const a = this.where(c.e, tq - c.s0), b = this.where(c.e, tq - c.s0 - 0.5);
      let codeA = a[2];
      if (a[3] >= 0) codeA = this.pick(RIDE_A, a[3], 'R');
      if (codeA === 'PAIR') {
        // The kiss: both drawn together, placed at the lower person's feet.
        const low = up ? b : a;
        this.show(c.K, low[0], low[1], this.pick(RIDE_K, a[3], 'K0'), false);
        this.show(c.A, 0, 0, null); this.show(c.B, 0, 0, null);
      } else {
        this.show(c.K, 0, 0, null);
        this.show(c.B, b[0], b[1], b[2], flip);
        this.show(c.A, a[0], a[1], codeA, flip);
      }
    }
  },
});

  // ---- player: loop the scene, pause when it's off screen, hold still for reduced motion ----
  def.init.call(def, kit).then(function () {
    var svg = root.querySelector('svg');
    if (svg) svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { def.render.call(def, 4.6, kit); return; }
    var start = null, raf = 0, shown = true;
    function frame(now) {
      if (start === null) start = now;
      def.render.call(def, ((now - start) / 1000) % DUR, kit);
      raf = requestAnimationFrame(frame);
    }
    def.render.call(def, 0, kit);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && !shown) { shown = true; raf = requestAnimationFrame(frame); }
          else if (!e.isIntersecting && shown) { shown = false; cancelAnimationFrame(raf); }
        });
      }).observe(root);
    }
    raf = requestAnimationFrame(frame);
  });
})();
