/*
 * Moteur du motion design. Tout est une fonction pure du temps t :
 * window.renderFrame(t, frame) dessine l'image exacte de l'instant t,
 * ce qui permet un rendu image par image, en parallèle, sans saccade.
 */
'use strict';
(function () {
  const TL = window.TL;
  const MAP = window.MAP_DATA;
  const W = TL.width, H = TL.height;
  const SEG = TL.segments;
  const PI = Math.PI, D2R = PI / 180;

  const COL = {
    stone: [233, 220, 192], ash: [154, 143, 126], ember: [255, 91, 31],
    hot: [255, 174, 90], map: [127, 152, 154], smoke: [42, 38, 32],
  };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a < 0 ? 0 : a > 1 ? 1 : +a.toFixed(4)})`;

  // ------------------------------------------------------------ outils
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, x) => clamp((x - a) / (b - a));
  const E = {
    lin: (t) => t,
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inCubic: (t) => t * t * t,
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
    inOutSine: (t) => -(Math.cos(PI * t) - 1) / 2,
    outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };
  const tw = (t, t0, t1, e = E.outExpo) => e(inv(t0, t1, t));
  const bump = (h, peak) => (h <= 0 ? 0 : (h / peak) * Math.exp(1 - h / peak));
  function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let r = Math.imul(a ^ (a >>> 15), 1 | a);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const $ = (id) => document.getElementById(id);

  // ------------------------------------------------------------ Mercator
  const MX = (lon) => lon * D2R;
  const MY = (lat) => Math.log(Math.tan(PI / 4 + clamp(lat, -85, 85) * D2R / 2));
  const LAT = (y) => (2 * Math.atan(Math.exp(y)) - PI / 2) / D2R;

  function prepLines(list, k) {
    return list.map((flat) => {
      const n = flat.length / 2, a = new Float32Array(flat.length);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (let i = 0; i < n; i++) {
        const X = MX(flat[2 * i] / k), Y = MY(flat[2 * i + 1] / k);
        a[2 * i] = X; a[2 * i + 1] = Y;
        if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y;
      }
      return { a, b: [x0, y0, x1, y1] };
    });
  }
  function prepPolys(list) {
    return list.map((rings) => {
      const r = prepLines(rings, 1000);
      return { rings: r, b: r[0].b };
    });
  }
  const G = {
    coastHi: prepLines(MAP.coastHi, 1000), coastLo: prepLines(MAP.coastLo, 1000),
    landHi: prepPolys(MAP.landHi), landLo: prepPolys(MAP.landLo),
    rivers: prepLines(MAP.rivers, 1000), lakes: prepPolys(MAP.lakes),
    dots: Object.values(MAP.dots).map((d) => {
      const a = new Float32Array(d.pts.length);
      for (let i = 0; i < d.pts.length; i += 2) { a[i] = MX(d.pts[i] / 1000); a[i + 1] = MY(d.pts[i + 1] / 1000); }
      return { step: d.step, a };
    }),
  };
  const CITIES = TL.cities.map(([n, lon, lat, r]) => ({ n: n.toUpperCase(), X: MX(lon), Y: MY(lat), r }));

  // ------------------------------------------------------------ minutage
  SEG.forEach((s, i) => { s.i = i; });
  // étapes de l'itinéraire (repère + pointillés) : fiches, ou toute séquence avec pin: true
  const isStop = (s) => s.lon !== undefined && (s.pin === true || (s.pin !== false && (s.type === 'figure' || s.type === 'pair' || s.type === 'event')));
  SEG.forEach((s) => { if (s.lon !== undefined) { s.X = MX(s.lon); s.Y = MY(s.lat); } });
  const STOPS = SEG.filter(isStop);
  STOPS.forEach((s, k) => { s.stop = k; });
  // repères numérotés (ouvertures de partie)
  const MARKERS = TL.markers.map((m) => ({ ...m, X: MX(m.lon), Y: MY(m.lat) }));
  let figCount = 0;
  SEG.forEach((s) => { if (s.type === 'figure' || s.type === 'pair') s.num = ++figCount; });
  const FIGS = figCount;

  function segAt(t) {
    let i = 0;
    while (i < SEG.length - 1 && t >= SEG[i + 1].start) i++;
    return SEG[i];
  }

  // temps « ralenti » des particules (ex. 1995 dans la chronologie)
  const SLOW = SEG.find((s) => s.slow) || null;
  const TAU = (() => {
    const n = Math.ceil((TL.total + 2) * 100), a = new Float32Array(n + 1);
    let acc = 0;
    for (let i = 0; i <= n; i++) {
      a[i] = acc;
      const t = i / 100;
      const f = SLOW ? 1 - 0.72 * inv(SLOW.start + SLOW.fly - 0.4, SLOW.start + SLOW.fly + 0.2, t) * (1 - inv(SLOW.end - 0.6, SLOW.end + 0.6, t)) : 1;
      acc += f / 100;
    }
    return a;
  })();
  const tau = (t) => { const x = clamp(t * 100, 0, TAU.length - 2), i = Math.floor(x); return lerp(TAU[i], TAU[i + 1], x - i); };

  // ------------------------------------------------------------ caméra
  const ANCHOR = { L: [380, 40], R: [-380, 40], pair: [0, 92], split: [0, 30], event: [0, 230], intro: [0, 60], outro: [0, 40], beat: [0, 250], title: [0, 60], center: [0, 60] };
  function baseCam(s, c = s.cam) {
    let an = s.anchor || ANCHOR[s.layout || s.type] || [0, 0];
    // avec une photo d'archive, le repère se place entre le texte et le portrait
    if (s.type === 'figure' && s.photo) an = [Math.sign(an[0]) * 170, 70];
    return { x: MX(c.lon), y: MY(c.lat), w: c.w, pitch: c.pitch * D2R, bearing: c.bearing * D2R, ax: an[0], ay: an[1] };
  }
  SEG.forEach((s) => {
    if (s.cam) s.cam0 = baseCam(s);
    if (s.camEnd) s.cam1 = baseCam(s, s.camEnd);
    // coupes franches : la caméra saute d'un cadre à l'autre sur les impacts
    if (s.cuts) s.cutsC = s.cuts.map((c) => ({ at: c.at, cam: baseCam(s, { ...s.cam, ...c }) }));
  });

  function holdCam(s, h) {
    let b = s.cam0;
    const dir = s.i % 2 ? -1 : 1;
    if (s.cutsC) {
      let base = b, h0 = 0;
      for (const c of s.cutsC) if (h >= c.at) { base = c.cam; h0 = c.at; }
      const hh = h - h0, punch = 0.09 * bump(hh, 0.1);
      return { x: base.x, y: base.y, w: base.w * Math.exp(-0.08 * hh) * (1 - punch), pitch: base.pitch + 0.012 * hh, bearing: base.bearing + dir * 0.03 * hh, ax: base.ax, ay: base.ay };
    }
    const punch = s.type === 'outro' || s.type === 'intro' ? 0 : 0.075 * bump(h - (s.hitAt || 0), 0.13);
    if (s.cam1) {
      // trajet programmé (de cam à camEnd pendant la séquence)
      const p = s.camEase === 'arrive'
        ? 0.85 * E.outQuart(clamp(h / 1.6)) + 0.15 * clamp(h / Math.max(0.01, s.dur - s.fly))
        : E.inOutSine(clamp(h / Math.max(0.01, s.dur - s.fly)));
      const e = s.cam1;
      return { x: lerp(b.x, e.x, p), y: lerp(b.y, e.y, p), w: b.w * Math.pow(e.w / b.w, p) * (1 - punch), pitch: lerp(b.pitch, e.pitch, p), bearing: lerp(b.bearing, e.bearing, p), ax: lerp(b.ax, e.ax, p), ay: lerp(b.ay, e.ay, p) };
    }
    let push = -0.065, rot = 0.022;
    if (s.type === 'event') { push = -0.05; rot = 0.012; }
    if (s.type === 'outro') { push = 0.045; rot = 0.01; }
    if (s.type === 'split') { push = -0.03; rot = 0.006; }
    if (s.type === 'beat') { push = -0.07; rot = 0.02; }
    if (s.type === 'title') { push = 0.025; rot = 0.008; }
    if (s.type === 'camera') { push = -0.05; rot = 0.015; }
    if (s.push !== undefined) push = s.push;
    return {
      x: b.x, y: b.y,
      w: b.w * Math.exp(push * h) * (1 - punch),
      pitch: b.pitch + 0.011 * h,
      bearing: b.bearing + dir * rot * h,
      ax: b.ax, ay: b.ay,
    };
  }
  // caméra « au repos » d'une séquence à l'instant absolu t (camFollow : continue la précédente)
  function holdAbs(s, t) {
    if (s.camFollow && s.i > 0) return holdAbs(SEG[s.i - 1], t);
    return holdCam(s, Math.max(0, t - s.start - s.fly));
  }

  // Vol « optimal » zoom arrière / zoom avant (van Wijk & Nuij, comme d3.interpolateZoom)
  function zoomPath(p0, p1) {
    const rho = Math.SQRT2, rho2 = 2, rho4 = 4;
    const [ux0, uy0, w0] = p0, [ux1, uy1, w1] = p1;
    const dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy;
    if (d2 < 1e-12) {
      const S = Math.log(w1 / w0) / rho;
      return (t) => [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(rho * t * S)];
    }
    const d1 = Math.sqrt(d2);
    const b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1);
    const b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
    const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    const S = (r1 - r0) / rho;
    return (t) => {
      const s = t * S, coshr0 = Math.cosh(r0);
      const u = (w0 / (rho2 * d1)) * (coshr0 * Math.tanh(rho * s + r0) - Math.sinh(r0));
      return [ux0 + u * dx, uy0 + u * dy, (w0 * coshr0) / Math.cosh(rho * s + r0)];
    };
  }
  const flyEase = E.inOutQuart;
  SEG.forEach((s, i) => {
    if (i === 0 || s.fly <= 0 || s.camFollow) return;
    const prev = SEG[i - 1];
    s.camA = holdAbs(prev, s.start);
    s.camB = holdCam(s, 0);
    s.path = zoomPath([s.camA.x, s.camA.y, s.camA.w], [s.camB.x, s.camB.y, s.camB.w]);
    s.travel = [Math.sign(s.camB.x - s.camA.x) || 0, Math.sign(s.camB.y - s.camA.y) || 0];
  });

  function camAt(t) {
    const s = segAt(t), u = t - s.start;
    if (!s.path || u >= s.fly) return holdAbs(s, t);
    const p = flyEase(clamp(u / s.fly));
    const A = s.camA, B = s.camB;
    const [x, y, w] = s.path(p);
    let db = B.bearing - A.bearing;
    while (db > PI) db -= 2 * PI; while (db < -PI) db += 2 * PI;
    const flat = 1 - 0.75 * Math.sin(PI * p);
    const ps = E.inOutCubic(p);
    return {
      x, y, w: Math.min(w, 4.2),
      pitch: lerp(A.pitch, B.pitch, ps) * flat,
      bearing: A.bearing + db * ps,
      ax: lerp(A.ax, B.ax, ps), ay: lerp(A.ay, B.ay, ps),
    };
  }

  // déplacement cumulé (parallaxe des fumées pendant les vols)
  function travel(t) {
    let x = 0, y = 0;
    for (const s of SEG) {
      if (!s.travel || t <= s.start) continue;
      const p = flyEase(clamp((t - s.start) / s.fly));
      x += s.travel[0] * p; y += s.travel[1] * p;
    }
    return [x, y];
  }

  function yearAt(t) {
    const s = segAt(t), u = t - s.start;
    if (s.i === 0 || SEG[s.i - 1].year === undefined) return s.year;
    const prev = SEG[s.i - 1];
    if (u < s.fly) return lerp(prev.year, s.year, E.inOutCubic(clamp(u / s.fly)));
    return s.year;
  }

  // ------------------------------------------------------------ projection
  const FOCAL = 1500, KMIN = 0.3;
  let Pcx, Pcy, Ps, Pcb, Psb, Psp, Pcp, Pox, Poy;
  const PR = { x: 0, y: 0, k: 1, gx: 0, gy: 0 };
  const VIEW = { x0: 0, y0: 0, x1: 0, y1: 0 };
  function setCam(c) {
    Pcx = c.x; Pcy = c.y; Ps = W / c.w; Pcb = Math.cos(c.bearing); Psb = Math.sin(c.bearing);
    Psp = Math.sin(c.pitch); Pcp = Math.cos(c.pitch); Pox = W / 2 + c.ax; Poy = H / 2 + c.ay;
    // emprise visible (pour ne dessiner que l'utile)
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const ryFar = Psp > 1e-3 ? (FOCAL * (1 - 1 / KMIN)) / Psp : -1e9;
    const yFar = Psp > 1e-3 ? Poy + ryFar * Pcp * KMIN : -1e9;
    const top = Math.max(-40, yFar + 2);
    for (const [sx, sy] of [[-60, top], [W / 2, top], [W + 60, top], [-60, H / 2], [W + 60, H / 2], [-60, H + 60], [W / 2, H + 60], [W + 60, H + 60]]) {
      const g = unproject(sx, sy);
      if (!g) continue;
      if (g[0] < x0) x0 = g[0]; if (g[0] > x1) x1 = g[0]; if (g[1] < y0) y0 = g[1]; if (g[1] > y1) y1 = g[1];
    }
    const px = (x1 - x0) * 0.04, py = (y1 - y0) * 0.04;
    VIEW.x0 = x0 - px; VIEW.x1 = x1 + px; VIEW.y0 = y0 - py; VIEW.y1 = y1 + py;
  }
  function proj(X, Y) {
    const dx = (X - Pcx) * Ps, dy = -(Y - Pcy) * Ps;
    const rx = dx * Pcb - dy * Psb, ry = dx * Psb + dy * Pcb;
    let z = FOCAL - ry * Psp;
    if (z < FOCAL * 0.15) z = FOCAL * 0.15;
    const k = FOCAL / z;
    PR.x = Pox + rx * k; PR.y = Poy + ry * Pcp * k; PR.k = k; PR.gx = rx; PR.gy = ry;
    return PR;
  }
  function unproject(sx, sy) {
    const v = sy - Poy, den = Pcp * FOCAL + v * Psp;
    if (den <= 1e-6) return null;
    const ry = (v * FOCAL) / den;
    const k = FOCAL / (FOCAL - ry * Psp);
    const rx = (sx - Pox) / k;
    const dx = Pcb * rx + Psb * ry, dy = -Psb * rx + Pcb * ry;
    return [Pcx + dx / Ps, Pcy - dy / Ps];
  }
  const inView = (b) => !(b[2] < VIEW.x0 || b[0] > VIEW.x1 || b[3] < VIEW.y0 || b[1] > VIEW.y1);

  // ------------------------------------------------------------ textures
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function glowSprite(col, size = 256, core = 0.0) {
    const c = canvas(size, size), g = c.getContext('2d');
    const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gr.addColorStop(0, rgba(col, 1));
    if (core) gr.addColorStop(core, rgba(col, 0.6));
    gr.addColorStop(0.35, rgba(col, 0.32));
    gr.addColorStop(0.7, rgba(col, 0.07));
    gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
    return c;
  }
  const SPR = {
    ember: glowSprite(COL.ember, 256),
    hot: glowSprite(COL.hot, 256),
    stone: glowSprite(COL.stone, 256),
    white: glowSprite([255, 240, 214], 128, 0.12),
  };
  // braise : point incandescent
  SPR.spark = (() => {
    const s = 64, c = canvas(s, s), g = c.getContext('2d');
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,244,220,1)');
    gr.addColorStop(0.18, 'rgba(255,190,110,.95)');
    gr.addColorStop(0.42, 'rgba(255,100,35,.35)');
    gr.addColorStop(1, 'rgba(255,80,20,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    return c;
  })();

  // fumée : bruit fractal + déformation de domaine, teinté
  function vnoise(seed) {
    const perm = new Uint8Array(512), r = mulberry32(seed);
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    const val = new Float32Array(256).map(() => r());
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const X = xi & 255, Y = yi & 255;
      const a = val[perm[X + perm[Y]]], b = val[perm[X + 1 + perm[Y]]];
      const c = val[perm[X + perm[Y + 1]]], d = val[perm[X + 1 + perm[Y + 1]]];
      return lerp(lerp(a, b, u), lerp(c, d, u), v);
    };
  }
  function smokeSprite(seed, size, warm) {
    const n = vnoise(seed), c = canvas(size, size), g = c.getContext('2d');
    const img = g.createImageData(size, size), D = img.data;
    const fbm = (x, y) => { let s = 0, a = 0.5, f = 1; for (let o = 0; o < 5; o++) { s += a * n(x * f, y * f); f *= 2.03; a *= 0.5; } return s; };
    const lo = warm ? [84, 50, 32] : [48, 44, 39], hi = warm ? [214, 112, 54] : [150, 140, 124];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size, ny = y / size;
        const dx = nx - 0.5, dy = ny - 0.5, d = Math.sqrt(dx * dx + dy * dy) * 2;
        const fall = clamp(1 - d) ** 1.6;
        if (fall <= 0) continue;
        const q = fbm(nx * 3 + 11.3, ny * 3 + 2.1);
        const w2 = fbm(nx * 3 + q * 2.2, ny * 3 + q * 1.7 + 5.2);
        const a = clamp((w2 - 0.32) * 2.1) * fall;
        const m = clamp(w2 * 1.3 - 0.2) * (warm ? 0.6 + 0.4 * ny : 1);
        const i = (y * size + x) * 4;
        D[i] = lerp(lo[0], hi[0], m); D[i + 1] = lerp(lo[1], hi[1], m); D[i + 2] = lerp(lo[2], hi[2], m);
        D[i + 3] = a * 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }
  const SMOKE = [];
  for (let i = 0; i < 6; i++) SMOKE.push(smokeSprite(101 + i * 17, 320, i >= 4));

  // faisceau de projecteur
  SPR.beam = (() => {
    const w = 360, h = 1500, c = canvas(w, h), g = c.getContext('2d');
    g.filter = 'blur(18px)';
    const gr = g.createLinearGradient(0, h, 0, 0);
    gr.addColorStop(0, 'rgba(233,220,192,.9)');
    gr.addColorStop(0.5, 'rgba(233,220,192,.25)');
    gr.addColorStop(1, 'rgba(233,220,192,0)');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(w / 2 - 6, h - 30); g.lineTo(w / 2 + 6, h - 30); g.lineTo(w - 30, 30); g.lineTo(30, 30); g.closePath(); g.fill();
    return c;
  })();

  // grain argentique
  const GRAIN = (() => {
    const s = 512, c = canvas(s, s), g = c.getContext('2d'), img = g.createImageData(s, s), r = mulberry32(77);
    for (let i = 0; i < s * s; i++) {
      const v = (r() + r() + r() + r() - 2) * 0.5; // ~ gaussien
      const k = 128 + v * 150;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = k; img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  })();

  // ------------------------------------------------------------ calques
  const bg = $('bg').getContext('2d');
  const mp = $('map').getContext('2d');
  const fx = $('fx').getContext('2d');
  const hud = $('hud').getContext('2d');
  const gr = $('grain').getContext('2d');
  const bgGrad = (() => { const g = bg.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#141210'); g.addColorStop(0.55, '#0f0d0b'); g.addColorStop(1, '#0b0a08'); return g; })();

  function sprite(g, img, x, y, size, alpha, sy = size) {
    if (alpha <= 0.002) return;
    g.globalAlpha = Math.min(1, alpha);
    g.drawImage(img, x - size / 2, y - sy / 2, size, sy);
  }

  // particules figées (positions = fonctions du temps)
  const R0 = mulberry32(2024);
  const SMOKE_BACK = Array.from({ length: 16 }, (_, i) => ({
    img: i % 6, x: R0() * 1.4 - 0.2, y: 0.25 + R0() * 0.85, size: 900 + R0() * 900,
    vx: (R0() < 0.5 ? -1 : 1) * (8 + R0() * 22), rot: R0() * 6.28, vr: (R0() - 0.5) * 0.05,
    a: 0.42 + R0() * 0.4, par: 0.25 + R0() * 0.3, ph: R0() * 10,
  }));
  const SMOKE_FRONT = Array.from({ length: 7 }, (_, i) => ({
    img: (i * 2 + 1) % 6, x: R0() * 1.4 - 0.2, y: 0.55 + R0() * 0.55, size: 1500 + R0() * 1100,
    vx: (R0() < 0.5 ? -1 : 1) * (25 + R0() * 40), rot: R0() * 6.28, vr: (R0() - 0.5) * 0.06,
    a: 0.16 + R0() * 0.18, par: 0.9 + R0() * 0.6, ph: R0() * 10,
  }));
  const EMBERS = Array.from({ length: 170 }, () => {
    const z = 0.25 + R0() * 0.75;
    return { x: R0(), y: R0(), v: (35 + R0() * 120) * (0.5 + z), s: (5 + R0() * 9) * (0.4 + z * z * 1.6), amp: 10 + R0() * 60, f: 0.3 + R0() * 1.1, ph: R0() * 6.28, fl: 3 + R0() * 8, z };
  });
  const ASH = Array.from({ length: 60 }, () => ({ x: R0(), y: R0(), v: 12 + R0() * 30, s: 1.5 + R0() * 3.5, amp: 20 + R0() * 50, f: 0.2 + R0() * 0.5, ph: R0() * 6.28, z: 0.4 + R0() * 0.6 }));
  const wrap = (v, m) => ((v % m) + m) % m;

  // impacts (flash, secousse, fuite de lumière)
  const IMPACTS = TL.impacts.filter((im) => im.visual).map((im) => ({ t: im.t, k: im.k, seg: SEG[im.seg] }));
  function impactEnv(t, decay) {
    let v = 0;
    for (const im of IMPACTS) {
      const d = t - im.t;
      if (d < -0.05 || d > decay * 6) continue;
      const e = d < 0 ? (1 + d / 0.05) * 0.4 : Math.exp(-d / decay);
      v = Math.max(v, e * im.k);
    }
    return v;
  }

  // ------------------------------------------------------------ fond : fumée, feu, éclairs
  function drawBg(t, T, par) {
    const g = bg;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.fillStyle = bgGrad; g.fillRect(0, 0, W, H);

    // lueur d'incendie à l'horizon
    g.globalCompositeOperation = 'lighter';
    const fires = [[260, 0.34], [900, 0.22], [1500, 0.36], [1880, 0.2]];
    fires.forEach(([x, a], i) => {
      const fl = 0.75 + 0.25 * noise1(T * 2.1 + i * 7) + 0.12 * noise1(T * 7.3 + i * 3);
      const xx = wrap(x + 80 * noise1(T * 0.13 + i * 11) - par[0] * 60, W + 600) - 300;
      sprite(g, SPR.ember, xx, H + 80, 1700, a * fl, 1000);
      sprite(g, SPR.hot, xx, H + 30, 700, 0.5 * a * fl * fl, 260);
    });
    // voile chaud général (ciel rougi par les incendies)
    sprite(g, SPR.ember, W * 0.5, H * 1.05, W * 2.2, 0.16 + 0.03 * noise1(T * 0.9), H * 1.3);
    // éclairs d'artillerie lointains
    for (const f of TL.flashes) {
      const d = t - f.t;
      if (d < -0.02 || d > 2.5) continue;
      const e = d < 0.05 ? d / 0.05 : Math.exp(-(d - 0.05) / 0.3);
      const x = f.x * W, y = f.y * H;
      sprite(g, SPR.hot, x, y, f.size * W * 1.6, 0.55 * f.power * e, f.size * W * 0.9);
      sprite(g, SPR.white, x, y + 30, f.size * W * 0.4, 0.5 * f.power * e * e, f.size * W * 0.22);
    }
    // fumée arrière
    g.globalCompositeOperation = 'source-over';
    for (const p of SMOKE_BACK) {
      const span = W + p.size * 1.2;
      const x = wrap(p.x * W + p.vx * T - par[0] * 520 * p.par + p.size * 0.6, span) - p.size * 0.6;
      const y = p.y * H + 30 * Math.sin(T * 0.1 + p.ph) + par[1] * 90 * p.par;
      const breathe = 0.85 + 0.15 * Math.sin(T * 0.21 + p.ph);
      g.save();
      g.translate(x, y); g.rotate(p.rot + p.vr * T); g.scale(breathe, breathe * 0.75);
      g.globalAlpha = p.a;
      g.drawImage(SMOKE[p.img], -p.size / 2, -p.size / 2, p.size, p.size);
      g.restore();
    }
    // projecteurs
    g.globalCompositeOperation = 'lighter';
    [[360, -0.32, 0.0], [1560, 0.28, 2.2], [1040, 0.06, 4.1]].forEach(([x0, base, ph], i) => {
      const ang = base + 0.32 * Math.sin(T * 0.23 + ph) + 0.08 * Math.sin(T * 0.61 + ph * 2);
      g.save();
      g.translate(x0 - par[0] * 30, H + 140);
      g.rotate(ang);
      g.globalAlpha = (i === 2 ? 0.035 : 0.06) * (0.8 + 0.2 * noise1(T * 3 + i));
      g.drawImage(SPR.beam, -180 * 1.4, -1500 * 1.15, 360 * 1.4, 1500 * 1.15);
      g.restore();
    });
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  // ------------------------------------------------------------ carte
  function strokeLines(g, lines) {
    g.beginPath();
    for (const ln of lines) {
      if (!inView(ln.b)) continue;
      const a = ln.a;
      for (let i = 0; i < a.length; i += 2) {
        const p = proj(a[i], a[i + 1]);
        if (i === 0) g.moveTo(p.x, p.y); else g.lineTo(p.x, p.y);
      }
    }
  }
  function pathPolys(g, polys) {
    g.beginPath();
    for (const pl of polys) {
      if (!inView(pl.b)) continue;
      for (const r of pl.rings) {
        const a = r.a;
        for (let i = 0; i < a.length; i += 2) {
          const p = proj(a[i], a[i + 1]);
          if (i === 0) g.moveTo(p.x, p.y); else g.lineTo(p.x, p.y);
        }
        g.closePath();
      }
    }
  }

  function drawGraticule(g, cam, mot) {
    const pxPerDeg = D2R * Ps;
    const steps = [30, 10, 5, 2, 1, 0.5, 0.25];
    const lon0 = VIEW.x0 / D2R, lon1 = VIEW.x1 / D2R, lat0 = LAT(VIEW.y0), lat1 = LAT(VIEW.y1);
    for (const st of steps) {
      const sp = st * pxPerDeg;
      const a = inv(60, 150, sp) * (1 - inv(520, 1000, sp)) * mot;
      if (a < 0.02) continue;
      g.strokeStyle = rgba(COL.map, 0.16 * a);
      g.lineWidth = 1;
      g.beginPath();
      const la0 = Math.max(-80, lat0), la1 = Math.min(84, lat1);
      for (let lon = Math.ceil(lon0 / st) * st; lon <= lon1; lon += st) {
        const N = 28;
        for (let j = 0; j <= N; j++) {
          const la = lerp(la0, la1, j / N);
          const p = proj(MX(lon), MY(la));
          if (j === 0) g.moveTo(p.x, p.y); else g.lineTo(p.x, p.y);
        }
      }
      for (let la = Math.ceil(la0 / st) * st; la <= la1; la += st) {
        const N = 28;
        for (let j = 0; j <= N; j++) {
          const lo = lerp(lon0, lon1, j / N);
          const p = proj(MX(lo), MY(la));
          if (j === 0) g.moveTo(p.x, p.y); else g.lineTo(p.x, p.y);
        }
      }
      g.stroke();
    }
  }

  function drawDots(g, sources, t, mot) {
    const pxPerDeg = D2R * Ps;
    const heat = [];
    const NS = sources.length;
    for (const grid of G.dots) {
      const sp = grid.step * pxPerDeg;
      // une seule trame domine à chaque zoom : la trame régionale s'efface tôt, les trames fines arrivent tard
      const fine = grid.step <= 0.1, regional = grid.step > 0.1 && grid.step < 0.5;
      const a = (fine ? inv(5.5, 9.6, sp) : inv(2.6, 6, sp)) * (1 - (regional ? inv(18, 30, sp) : inv(30, 52, sp))) * mot;
      if (a < 0.02) continue;
      const r0 = clamp(sp * 0.085, 0.55, 2.4);
      const A = grid.a;
      g.fillStyle = rgba(COL.map, 0.5 * a);
      g.beginPath();
      for (let i = 0; i < A.length; i += 2) {
        const X = A[i], Y = A[i + 1];
        if (X < VIEW.x0 || X > VIEW.x1 || Y < VIEW.y0 || Y > VIEW.y1) continue;
        const p = proj(X, Y);
        if (p.k < KMIN || p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) continue;
        const r = r0 * p.k;
        if (!NS) { g.rect(p.x - r, p.y - r, r * 2, r * 2); continue; }
        {
          let h = 0, gone = false;
          for (let q = 0; q < NS; q++) {
            const src = sources[q];
            if (src.erase) {
              // chaque point brûle un instant en braise, puis s'éteint pour de bon
              const d = Math.hypot(p.gx - src.gx, p.gy - src.gy);
              if (d < src.R) {
                const v = hash(i * 1.618 + A.length), thr = src.erase * (1 - (d / src.R) ** 3);
                if (v < thr) gone = true;
                else if (v < thr + 0.07 && src.erase > 0.01) h += 1.1 * (1 - (v - thr) / 0.07);
              }
              continue;
            }
            const d = Math.hypot(p.gx - src.gx, p.gy - src.gy);
            if (d < src.R) h += src.amt * (1 - d / src.R) ** 2 * (src.flicker ? 0.35 + 0.65 * hash(i * 0.731 + Math.floor(t * 12) * 13.37) : 1);
            for (const wv of src.waves) h += wv.a * Math.exp(-(((d - wv.r) / wv.w) ** 2));
          }
          if (gone) continue;
          g.rect(p.x - r, p.y - r, r * 2, r * 2);
          if (h > 0.035) heat.push(p.x, p.y, r, Math.min(1.2, h) * a);
        }
      }
      g.fill();
    }
    if (heat.length) {
      g.globalCompositeOperation = 'lighter';
      const B = 6, buckets = Array.from({ length: B }, () => []);
      for (let i = 0; i < heat.length; i += 4) buckets[Math.min(B - 1, Math.floor(clamp(heat[i + 3]) * B))].push(i);
      buckets.forEach((list, bi) => {
        if (!list.length) return;
        const h = (bi + 0.5) / B;
        g.fillStyle = rgba(bi > 3 ? COL.hot : COL.ember, 0.25 + 0.75 * h);
        g.beginPath();
        for (const i of list) { const r = heat[i + 2] * (1 + h * 1.4); g.rect(heat[i] - r, heat[i + 1] - r, r * 2, r * 2); }
        g.fill();
      });
      g.globalCompositeOperation = 'source-over';
    }
  }

  function dms(v, pos, neg) {
    const s = v >= 0 ? pos : neg; v = Math.abs(v);
    const d = Math.floor(v), mf = (v - d) * 60, m = Math.floor(mf), sc = Math.floor((mf - m) * 60);
    return `${d}°${String(m).padStart(2, '0')}′${String(sc).padStart(2, '0')}″${s}`;
  }

  function drawRoute(g, t) {
    // étapes atteintes + vol en cours
    const pts = [];
    let partial = null;
    for (const s of STOPS) {
      if (t >= s.impact) pts.push(s);
      else if (t > s.start) { partial = { s, p: flyEase(clamp((t - s.start) / s.fly)) }; break; }
      else break;
    }
    const segs = [];
    for (let i = 1; i < pts.length; i++) segs.push([pts[i - 1], pts[i], 1]);
    if (partial && pts.length) segs.push([pts[pts.length - 1], partial.s, partial.p]);
    g.save();
    g.lineCap = 'round';
    for (const [a, b, p] of segs) {
      const N = 48, n = Math.max(1, Math.ceil(N * p));
      g.beginPath();
      for (let j = 0; j <= n; j++) {
        const q = Math.min(p, j / N);
        const P = proj(lerp(a.X, b.X, q), lerp(a.Y, b.Y, q));
        if (j === 0) g.moveTo(P.x, P.y); else g.lineTo(P.x, P.y);
      }
      g.setLineDash([2, 9]);
      g.lineDashOffset = -t * 30;
      g.strokeStyle = rgba(COL.ember, 0.85);
      g.lineWidth = 2.2;
      g.stroke();
      g.setLineDash([]);
      g.strokeStyle = rgba(COL.ember, 0.12);
      g.lineWidth = 7;
      g.stroke();
      if (p < 1) {
        const P = proj(lerp(a.X, b.X, p), lerp(a.Y, b.Y, p));
        g.globalCompositeOperation = 'lighter';
        sprite(g, SPR.hot, P.x, P.y, 140, 0.9);
        sprite(g, SPR.spark, P.x, P.y, 34, 1);
        g.globalCompositeOperation = 'source-over';
        g.globalAlpha = 1;
      }
    }
    // anciens points
    for (const s of pts) {
      const P = proj(s.X, s.Y);
      g.globalAlpha = 1;
      g.fillStyle = rgba(COL.hot, 0.95);
      g.beginPath(); g.arc(P.x, P.y, 3.2 * P.k, 0, 7); g.fill();
      g.strokeStyle = rgba(COL.ember, 0.55);
      g.lineWidth = 1.2;
      g.beginPath(); g.ellipse(P.x, P.y, 11 * P.k, 11 * P.k * Pcp, 0, 0, 7); g.stroke();
    }
    g.restore();
  }

  function drawCities(g, cam, active) {
    g.save();
    g.font = '400 13px "DM Mono"';
    g.letterSpacing = '2.5px';
    g.textBaseline = 'middle';
    for (const c of CITIES) {
      const lim = c.r === 3 ? [2.6, 1.6] : c.r === 2 ? [0.55, 0.32] : [0.2, 0.13];
      const a = inv(lim[0], lim[1], cam.w);
      if (a < 0.02) continue;
      if (active.some((o) => Math.abs(o.X - c.X) < 2e-3 && Math.abs(o.Y - c.Y) < 2e-3)) continue;
      if (c.X < VIEW.x0 || c.X > VIEW.x1 || c.Y < VIEW.y0 || c.Y > VIEW.y1) continue;
      const p = proj(c.X, c.Y);
      if (p.k < KMIN + 0.05 || p.x < -100 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;
      const fa = a * clamp((p.k - KMIN) * 2.2);
      g.fillStyle = rgba(COL.stone, 0.75 * fa);
      g.fillRect(p.x - 2, p.y - 2, 4, 4);
      g.fillStyle = rgba(COL.ash, 0.95 * fa);
      g.fillText(c.n, p.x + 10, p.y + 1);
    }
    g.restore();
  }

  function drawPin(g, pin, t) {
    const { x, y, k, a, h, s } = pin;
    if (a <= 0.01) return;
    g.save();
    g.globalCompositeOperation = 'lighter';
    // colonne de lumière
    const hgt = 330 * (0.4 + 0.6 * k) * E.outExpo(clamp((h + 0.05) / 0.5));
    const grd = g.createLinearGradient(x, y, x, y - hgt);
    grd.addColorStop(0, rgba(COL.hot, 0.95 * a)); grd.addColorStop(0.35, rgba(COL.ember, 0.45 * a)); grd.addColorStop(1, rgba(COL.ember, 0));
    g.fillStyle = grd;
    g.fillRect(x - 1.5, y - hgt, 3, hgt);
    g.globalAlpha = 0.18 * a;
    g.fillRect(x - 9, y - hgt, 18, hgt);
    g.globalAlpha = 1;
    sprite(g, SPR.ember, x, y, 420 * k, 0.55 * a, 420 * k * Pcp);
    sprite(g, SPR.spark, x, y, 46, a);
    // anneaux radar (au sol)
    for (let j = 0; j < 3; j++) {
      const ph = wrap(h * 0.62 + j / 3, 1);
      const r = (14 + ph * 150) * k;
      g.strokeStyle = rgba(COL.ember, (1 - ph) * 0.8 * a);
      g.lineWidth = 1.6;
      g.beginPath(); g.ellipse(x, y, r, r * Pcp, 0, 0, 7); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    // réticule
    const rr = 26 * k, rot = h * 0.6;
    g.strokeStyle = rgba(COL.stone, 0.85 * a);
    g.lineWidth = 1.4;
    g.beginPath();
    for (let j = 0; j < 4; j++) {
      const an = rot + (j * PI) / 2;
      g.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr * Pcp);
      g.lineTo(x + Math.cos(an) * (rr + 14 * k), y + Math.sin(an) * (rr + 14 * k) * Pcp);
    }
    g.stroke();
    // étiquette
    const la = a * tw(h, 0.15, 0.7, E.outCubic);
    if (la > 0.01 && s.place && (s.type === 'figure' || s.pinLabel)) {
      const side = s.layout === 'R' ? -1 : 1;
      const lx = x + side * 46, ly = y - 64;
      const lw = 90 * tw(h, 0.15, 0.6, E.outExpo);
      g.strokeStyle = rgba(COL.stone, 0.7 * la);
      g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x + side * 10, y - 10); g.lineTo(lx, ly); g.lineTo(lx + side * lw, ly); g.stroke();
      g.textAlign = side > 0 ? 'left' : 'right';
      g.fillStyle = rgba(COL.stone, la);
      g.font = '760 34px "Archivo"';
      g.fontStretch = 'extra-condensed';
      g.letterSpacing = '1.5px';
      g.textBaseline = 'alphabetic';
      g.fillText(s.place.toUpperCase(), lx + side * 4, ly - 12);
      g.font = '400 13px "DM Mono"';
      g.fontStretch = 'normal';
      g.letterSpacing = '2px';
      g.fillStyle = rgba(COL.ash, la);
      g.fillText(`${dms(s.lat, 'N', 'S')}  ${dms(s.lon, 'E', 'O')}`, lx + side * 4, ly + 22);
    }
    g.restore();
  }

  // foyer actif : repère de la fiche courante (ou de la précédente qui s'efface), ou zone qui brûle (heat)
  const hasFocus = (s) => s && s.X !== undefined && (isStop(s) || s.heat);
  function activePin(t) {
    const cur = segAt(t);
    const cand = [cur, SEG[cur.i - 1]].filter(hasFocus);
    for (const s of cand) {
      const h = t - s.impact;
      const ain = tw(h, -0.12, 0.15, E.outCubic);
      const aout = 1 - tw(t, s.end - 0.05, s.end + 0.35, E.inCubic);
      const a = ain * aout;
      if (a <= 0.005) continue;
      const P = proj(s.X, s.Y);
      const R = (s.heat && s.heat.R) || 460, sc = Math.max(1, R / 460);
      const waves = [];
      for (let n = 0; n < 3; n++) {
        const t0 = s.impact + n * 1.35, d = t - t0;
        if (d < 0 || d > 1.6 * Math.sqrt(sc)) continue;
        waves.push({ r: d * (n === 0 ? 1100 : 700) * sc, w: 46 * Math.sqrt(sc), a: (n === 0 ? 1.1 : 0.5) * Math.exp(-d / (0.55 * Math.sqrt(sc))) * aout });
      }
      return { s, h, a, x: P.x, y: P.y, k: P.k, gx: P.gx, gy: P.gy, waves, R, showPin: isStop(s) };
    }
    return null;
  }

  // repères numérotés : point, onde, numéro et lieu
  function drawMarkers(g, t, sources) {
    for (const m of MARKERS) {
      const h = t - m.t;
      if (h < -0.05) continue;
      const a = tw(h, -0.05, 0.25, E.outCubic) * (1 - tw(t, TL.total - TL.fadeOut - 0.4, TL.total - 0.2));
      if (a <= 0.01) continue;
      const P = proj(m.X, m.Y);
      const { x, y, k } = P;
      if (m.erase) {
        sources.push({ gx: P.gx, gy: P.gy, R: m.R || 900, erase: 0.92 * tw(h, 0, m.eraseDur || 3.0, E.inOutSine), waves: [] });
      } else if (m.area) {
        const amt = 0.85 * tw(h, 0, 1.2, E.outCubic) * a;
        const waves = h >= 0 && h < 2.4 ? [{ r: h * 1400, w: 70, a: 1.0 * Math.exp(-h / 0.8) }] : [];
        sources.push({ gx: P.gx, gy: P.gy, amt, R: m.R || 900, waves });
      }
      g.save();
      g.globalCompositeOperation = 'lighter';
      if (!m.area && !m.erase) {
        sprite(g, SPR.ember, x, y, 220 * k, 0.5 * a, 220 * k * Pcp);
        sprite(g, SPR.spark, x, y, 30, a);
        const ph = clamp(h / 1.1);
        if (ph < 1) {
          const r = (10 + ph * 120) * k;
          g.strokeStyle = rgba(COL.ember, (1 - ph) * 0.9 * a);
          g.lineWidth = 1.6;
          g.beginPath(); g.ellipse(x, y, r, r * Pcp, 0, 0, 7); g.stroke();
        }
        g.strokeStyle = rgba(COL.ember, 0.6 * a);
        g.lineWidth = 1.2;
        g.beginPath(); g.ellipse(x, y, 12 * k, 12 * k * Pcp, 0, 0, 7); g.stroke();
      }
      g.globalCompositeOperation = 'source-over';
      // étiquette : numéro dans un cartouche + lieu
      const [dx, dy] = m.dir || [1, -1];
      if (!m.label) { g.restore(); continue; }
      const off = m.off || 26, lx = x + dx * off, ly = y + dy * off;
      const la = a * tw(h, 0.1, 0.5, E.outCubic) * (m.hideT !== undefined ? 1 - tw(t, m.hideT, m.hideT + 0.5) : 1);
      g.globalAlpha = la;
      g.strokeStyle = rgba(COL.stone, 0.6);
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(x + dx * 8, y + dy * 8); g.lineTo(lx, ly); g.stroke();
      g.font = '500 15px "DM Mono"';
      g.letterSpacing = '1.5px';
      g.textBaseline = 'middle';
      const num = m.num, nw = 34;
      const bx = dx > 0 ? lx : lx - nw;
      g.fillStyle = rgba(COL.ember, 0.95);
      g.fillRect(bx, ly - 12, nw, 24);
      g.fillStyle = '#120f0c';
      g.textAlign = 'center';
      g.fillText(num, bx + nw / 2 + 1, ly + 1);
      g.font = '400 14px "DM Mono"';
      g.letterSpacing = '2.5px';
      g.fillStyle = rgba(COL.stone, 0.92);
      g.textAlign = dx > 0 ? 'left' : 'right';
      g.fillText(m.label.toUpperCase(), dx > 0 ? bx + nw + 10 : bx - 10, ly + 1);
      g.globalAlpha = 1;
      g.restore();
    }
  }

  // mot : 1 au repos, baisse quand la caméra file (les détails fins deviennent un voile)
  function drawMapInto(g, t, cam, mot = 1) {
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.clearRect(0, 0, W, H);
    setCam(cam);
    const pin = activePin(t);

    drawGraticule(g, cam, mot);
    // terres (éclaircissement léger : le calque est en mode « écran »)
    const hi = cam.w < 2.2;
    g.fillStyle = 'rgba(52,45,36,.3)';
    pathPolys(g, hi ? G.landHi : []); g.fill('evenodd');
    pathPolys(g, G.landLo); g.fill('evenodd');
    // lacs : on « troue » les terres
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = '#000';
    pathPolys(g, G.lakes); g.fill('evenodd');
    g.globalCompositeOperation = 'source-over';
    // côtes
    g.lineJoin = 'round';
    const coasts = hi ? [G.coastHi, G.coastLo] : [G.coastLo];
    for (const set of coasts) {
      strokeLines(g, set);
      g.strokeStyle = rgba(COL.stone, 0.10); g.lineWidth = 5; g.stroke();
      g.strokeStyle = rgba(COL.stone, 0.62); g.lineWidth = 1.3; g.stroke();
    }
    pathPolys(g, G.lakes);
    g.strokeStyle = rgba(COL.map, 0.7); g.lineWidth = 1.1; g.stroke();
    strokeLines(g, G.rivers);
    g.strokeStyle = rgba(COL.map, 0.55); g.lineWidth = 1.2; g.stroke();

    const sources = [];
    if (pin) {
      const amt = pin.a * tw(pin.h, -0.05, 0.7, E.outCubic) * (pin.s.type === 'event' ? 0.6 : 1) * ((pin.s.heat && pin.s.heat.amt) || 1);
      sources.push({ gx: pin.gx, gy: pin.gy, amt, R: pin.R, waves: pin.waves, flicker: !!(pin.s.heat && pin.s.heat.flicker) });
    }
    // les repères ajoutent leurs foyers avant le dessin des points
    const mk = MARK_LAYER;
    if (MARKERS.length) {
      mk.clearRect(0, 0, W, H);
      drawMarkers(mk, t, sources);
    }
    drawDots(g, sources, t, mot);
    const busy = [];
    if (pin && pin.showPin) busy.push(pin.s);
    for (const m of MARKERS) if (t >= m.t - 0.05) busy.push(m);
    drawCities(g, cam, busy);
    drawRoute(g, t);
    if (pin && pin.showPin) drawPin(g, pin, t);
    if (MARKERS.length) { g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.drawImage(mk.canvas, 0, 0); }

    // brume de profondeur (le haut de la carte se perd dans la fumée)
    const fog = clamp(Psp / Math.sin(50 * D2R));
    if (fog > 0.01) {
      g.globalCompositeOperation = 'destination-out';
      const fg = g.createLinearGradient(0, 0, 0, H * 0.62);
      fg.addColorStop(0, `rgba(0,0,0,${0.97 * fog})`);
      fg.addColorStop(0.45, `rgba(0,0,0,${0.6 * fog})`);
      fg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = fg; g.fillRect(0, 0, W, H * 0.62);
      g.globalCompositeOperation = 'source-over';
    }
    return pin;
  }

  // Flou de bougé : pendant les vols, on moyenne plusieurs positions de caméra
  // sur la durée d'obturation (180°), comme une vraie caméra.
  const SHUTTER = 0.5 / TL.fps;
  const mapTmp = canvas(W, H).getContext('2d');
  const MARK_LAYER = canvas(W, H).getContext('2d');
  const PROBES = [[160, 160], [W - 160, 160], [W / 2, H / 2], [160, H - 160], [W - 160, H - 160]];
  function motionPx(c0, c1) {
    setCam(c0);
    const pts = PROBES.map(([x, y]) => [x, y, unproject(x, y)]).filter((p) => p[2]);
    setCam(c1);
    let m = 0;
    for (const [x, y, g] of pts) { const p = proj(g[0], g[1]); m = Math.max(m, Math.hypot(p.x - x, p.y - y)); }
    return m;
  }
  function drawMap(t, cam) {
    const mpx = motionPx(cam, camAt(t + SHUTTER));
    const n = mpx > 260 ? 1 : Math.round(clamp(Math.ceil(mpx / 4), 1, 12));
    if (n <= 1) { const pin = drawMapInto(mp, t, cam); return pin; }
    mp.globalCompositeOperation = 'source-over'; mp.globalAlpha = 1;
    mp.clearRect(0, 0, W, H);
    let pin = null;
    for (let k = 0; k < n; k++) {
      const tk = t + (k / (n - 1)) * SHUTTER;
      const pk = drawMapInto(mapTmp, tk, k === 0 ? cam : camAt(tk), clamp(1 - (n - 2) / 7, 0.12, 1));
      if (k === 0) pin = pk;
      mp.globalCompositeOperation = 'lighter';
      mp.globalAlpha = 1 / n;
      mp.drawImage(mapTmp.canvas, 0, 0);
    }
    mp.globalCompositeOperation = 'source-over'; mp.globalAlpha = 1;
    setCam(cam);
    return pin;
  }

  // ------------------------------------------------------------ avant-plan : fumée, braises, cendres, lumière
  function drawFx(t, T, par, pin, slowDim) {
    const g = fx;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.clearRect(0, 0, W, H);
    for (const p of SMOKE_FRONT) {
      const span = W + p.size * 1.2;
      const x = wrap(p.x * W + p.vx * T - par[0] * 900 * p.par + p.size * 0.6, span) - p.size * 0.6;
      const y = p.y * H + 40 * Math.sin(T * 0.13 + p.ph) + par[1] * 160 * p.par;
      g.save();
      g.translate(x, y); g.rotate(p.rot + p.vr * T); g.scale(1, 0.62);
      g.globalAlpha = p.a;
      g.drawImage(SMOKE[p.img], -p.size / 2, -p.size / 2, p.size, p.size);
      g.restore();
    }
    // cendres
    g.globalAlpha = 1;
    for (const p of ASH) {
      const y = wrap(p.y * H + p.v * T, H + 40) - 20;
      const x = wrap(p.x * W + Math.sin(T * p.f + p.ph) * p.amp + 18 * T * p.z - par[0] * 700 * p.z, W + 40) - 20;
      const r = p.s * p.z;
      g.fillStyle = `rgba(150,140,128,${(0.22 + 0.2 * p.z) * slowDim})`;
      g.save(); g.translate(x, y); g.rotate(T * p.f * 2 + p.ph); g.fillRect(-r, -r * 0.45, r * 2, r * 0.9); g.restore();
    }
    // braises
    g.globalCompositeOperation = 'lighter';
    const T2 = tau(t + SHUTTER), par2 = travel(t + SHUTTER);
    const ember = (p, T, par) => [
      wrap(p.x * W + Math.sin(T * p.f + p.ph) * p.amp + 26 * T * p.z - par[0] * 1100 * p.z, W + 60) - 30,
      H + 30 - wrap(p.y * (H + 120) + p.v * T, H + 120),
    ];
    for (const p of EMBERS) {
      const [x, y] = ember(p, T, par);
      const [x2, y2] = ember(p, T2, par2);
      const fl = 0.55 + 0.45 * Math.sin(T * p.fl + p.ph * 3);
      const life = clamp((H + 30 - y) / 120) * clamp(y / 260);
      const a = fl * life * (0.45 + 0.55 * p.z) * slowDim;
      const d = Math.hypot(x2 - x, y2 - y);
      const n = d > 400 ? 1 : Math.max(1, Math.min(10, Math.ceil(d / 3)));
      for (let k = 0; k < n; k++) {
        const q = n === 1 ? 0 : k / (n - 1);
        sprite(g, SPR.spark, lerp(x, x2, q), lerp(y, y2, q), p.s, n === 1 ? a : a * 1.6 / n);
      }
    }
    // fuite de lumière + reflet anamorphique à l'impact
    for (const im of IMPACTS) {
      const d = t - im.t;
      if (d < -0.06 || d > 1.6) continue;
      const e = (d < 0 ? (1 + d / 0.06) * 0.5 : Math.exp(-d / 0.42)) * im.k;
      let x = W / 2, y = H / 2;
      if (pin && pin.s === im.seg) { x = pin.x; y = pin.y; }
      sprite(g, SPR.ember, x, y, 1900, 0.32 * e, 1200);
      sprite(g, SPR.hot, x, y, 2200, 0.55 * e, 10);
      sprite(g, SPR.stone, x, y, 1400, 0.35 * e, 3);
    }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }

  // ------------------------------------------------------------ HUD : frise, repères
  const EVENTS = TL.events.map(([y, label, end], i) => ({ y, label: label.toUpperCase(), end, row: i % 2 }));
  function drawHud(t, yr, alpha) {
    const g = hud;
    g.clearRect(0, 0, W, H);
    if (alpha <= 0.005) return;
    g.save();
    g.globalAlpha = alpha;
    if (TL.hud.ruler) {
    const cx = W / 2, by = 994, ppy = 40, span = W * 0.40;
    const fade = (x) => { const d = Math.abs(x - cx) / span; return d >= 1 ? 0 : 1 - d * d; };
    // ligne de base
    const lg = g.createLinearGradient(cx - span, 0, cx + span, 0);
    lg.addColorStop(0, rgba(COL.stone, 0)); lg.addColorStop(0.5, rgba(COL.stone, 0.5)); lg.addColorStop(1, rgba(COL.stone, 0));
    g.fillStyle = lg; g.fillRect(cx - span, by, span * 2, 1);
    g.font = '400 14px "DM Mono"';
    g.letterSpacing = '2px';
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    for (let y = Math.floor(yr - 24); y <= Math.ceil(yr + 24); y++) {
      const x = cx + (y - yr) * ppy, f = fade(x);
      if (f <= 0) continue;
      const big = y % 10 === 0, mid = y % 5 === 0;
      const h = big ? 20 : mid ? 12 : 6;
      g.fillStyle = rgba(COL.stone, (big ? 0.8 : mid ? 0.5 : 0.3) * f);
      g.fillRect(x - 0.5, by - h, 1, h);
      if (big) { g.fillStyle = rgba(COL.stone, 0.7 * f); g.fillText(String(y), x, by - 28); }
    }
    // repères historiques
    g.font = '400 12px "DM Mono"';
    g.letterSpacing = '1.6px';
    for (const ev of EVENTS) {
      const x = cx + (ev.y - yr) * ppy;
      if (ev.end) {
        const x2 = cx + (ev.end - yr) * ppy;
        if (x2 < cx - span || x > cx + span) continue;
        const fa = Math.max(fade(x), fade(x2), (x < cx && x2 > cx) ? 1 : 0);
        g.fillStyle = rgba(COL.ember, 0.45 * fa);
        g.fillRect(Math.max(x, cx - span), by + 6 + ev.row * 3, Math.min(x2, cx + span) - Math.max(x, cx - span), 2);
      }
      const f = fade(x);
      if (f <= 0) continue;
      const near = 1 - clamp(Math.abs(ev.y - yr) / 0.8);
      g.fillStyle = near > 0 ? rgba(COL.hot, lerp(0.55, 1, near) * f) : rgba(COL.ash, 0.7 * f);
      g.fillRect(x - 1, by + 2, 2, 8 + ev.row * 16);
      g.fillText(ev.label, x, by + 26 + ev.row * 17);
    }
    // aiguille
    g.globalCompositeOperation = 'lighter';
    sprite(g, SPR.ember, cx, by - 6, 120, 0.6 * alpha, 60);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = alpha;
    g.fillStyle = rgba(COL.ember, 1);
    g.fillRect(cx - 1, by - 34, 2, 44);
    g.beginPath(); g.moveTo(cx - 6, by - 40); g.lineTo(cx + 6, by - 40); g.lineTo(cx, by - 32); g.closePath(); g.fill();
    }
    // coins de cadrage
    g.strokeStyle = rgba(COL.stone, 0.42);
    g.lineWidth = 1.5;
    const m = 44, L = 28;
    g.beginPath();
    g.moveTo(m, m + L); g.lineTo(m, m); g.lineTo(m + L, m);
    g.moveTo(W - m - L, m); g.lineTo(W - m, m); g.lineTo(W - m, m + L);
    g.moveTo(m, H - m - L); g.lineTo(m, H - m); g.lineTo(m + L, H - m);
    g.moveTo(W - m - L, H - m); g.lineTo(W - m, H - m); g.lineTo(W - m, H - m - L);
    g.stroke();
    g.restore();
  }

  // ------------------------------------------------------------ typographie (DOM)
  const typeLayer = $('type');
  const chars = (str) => [...str].map((c) => `<span class="ch">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('');
  // typographie française : espaces insécables avant : ; ! ? » et après «
  const fr = (str) => str.replace(/« /g, '«\u00a0').replace(/ »/g, '\u00a0»').replace(/ ([:;!?])/g, '\u00a0$1');
  const words = (str) => fr(str).split(' ').map((w, i, a) => `<span class="w">${esc(w)}${i < a.length - 1 ? ' ' : ''}</span>`).join('');
  const nameHTML = (n) => `<div class="name"><div class="ln l1">${chars(n[0])}</div><div class="ln l2">${chars(n[1])}</div></div>`;
  const nativeHTML = (txt, lang) => `<div class="nativeWrap"><div class="native" lang="${lang}" dir="rtl">${esc(txt)}</div></div>`;
  const eyebrowHTML = () => `<div class="eyebrow"><i class="tick"></i><span class="tw"></span></div>`;
  const yearStr = (y) => String(y);

  function refs(el) {
    const q = (sel) => el.querySelector(sel), qa = (sel) => [...el.querySelectorAll(sel)];
    return { el, q, qa };
  }

  function buildSegments() {
    for (const s of SEG) {
      const el = document.createElement('div');
      el.className = `seg ${s.type} ${s.layout || ''} ${['intro', 'event', 'outro', 'beat', 'title', 'credit'].includes(s.type) ? 'center' : ''} ${s.type === 'chapter' ? 'c-' + s.layout : ''}`;
      let html = '';
      if (s.type === 'figure') {
        html = `<div class="scrim"></div><div class="ghost">${yearStr(s.year)}</div>
          ${!s.photo ? '' : /\.png$/i.test(s.photo)
            // personnage détouré (PNG transparent) : posé sur la carte, liseré de braise, trame sur la silhouette
            ? `<div class="cutout"><div class="cimg" style="background-image:url('${esc(s.photo)}')"></div><div class="cdots" style="-webkit-mask-image:url('${esc(s.photo)}');mask-image:url('${esc(s.photo)}')"></div></div>`
            : `<div class="portrait"><div class="ph" style="background-image:url('${esc(s.photo)}')"></div><div class="dots"></div><div class="tint"></div><div class="frame"></div><div class="cap">Archives · ${esc(s.name.join(' '))}</div></div>`}
          <div class="block">${eyebrowHTML()}${nameHTML(s.name)}${nativeHTML(s.native, s.lang)}<div class="rule"></div>
          <p class="text">${words(s.text)}</p><div class="meta"><span>${esc(s.life)}</span><i class="dot"></i><span>${esc(s.place)}</span></div></div>`;
      } else if (s.type === 'pair') {
        const side = (p, c) => `<div class="side ${c}">${nameHTML(p.name)}${nativeHTML(p.native, p.lang)}<div class="meta"><span>${esc(p.life)}</span></div></div>`;
        const bgp = (p, c) => (p.photo ? `<div class="pairbg ${c} ${/\.png$/i.test(p.photo) ? 'cutp' : ''}"><div class="ph" style="background-image:url('${esc(p.photo)}')"></div></div>` : '');
        html = `${bgp(s.people[0], 'a')}${bgp(s.people[1], 'b')}<div class="scrim"></div><div class="ghost">${yearStr(s.year)}</div>
          <div class="top">${eyebrowHTML()}</div>${side(s.people[0], 'a')}<div class="amp">&amp;</div>${side(s.people[1], 'b')}
          <div class="bottom"><p class="text">${words(s.text)}</p></div>`;
      } else if (s.type === 'split') {
        const half = (h, c) => `<div class="half ${c}"><div class="kicker"><span class="tw"></span></div><div class="word">${chars(h.word)}</div>${nativeHTML(h.native, h.lang)}<p class="text">${words(h.text)}</p></div>`;
        html = `<div class="scrimL"></div><div class="seam"></div>${half(s.left, 'a')}${half(s.right, 'b')}<div class="footer">${eyebrowHTML()}</div>`;
      } else if (s.type === 'intro') {
        // même graisse pour les deux mots : aucun ne domine l'autre
        html = `<div class="scrim"></div><div class="wrap">${eyebrowHTML()}<div class="big l1">${chars(s.title[0])}</div><div class="bar"></div><div class="big l2">${chars(s.title[1])}</div><p class="text" style="margin-top:34px">${words(s.sub)}</p></div>`;
      } else if (s.type === 'event') {
        html = `<div class="scrim"></div><div class="wrap" style="justify-content:flex-start;padding-top:170px">${eyebrowHTML()}<div class="big l1">${chars(s.title)}</div><div class="bar"></div><p class="text">${words(s.text)}</p></div>`;
      } else if (s.type === 'beat') {
        html = `<div class="scrim"></div>${s.year ? `<div class="ghost">${yearStr(s.year)}</div>` : ''}<div class="wrap">${s.kicker ? eyebrowHTML() : ''}<div class="big l1">${chars(s.word.toUpperCase())}</div>${s.sub ? `<p class="text">${words(s.sub)}</p>` : ''}</div>`;
      } else if (s.type === 'title') {
        html = `<div class="scrim"></div><div class="wrap"><div class="big sion">${chars(s.title.toUpperCase())}</div>
          <div class="scripts">${(s.scripts || []).map((sc, k) => `${k ? '<i class="bar"></i>' : ''}<span class="native" lang="${sc.lang}" dir="rtl">${esc(sc.text)}</span>`).join('')}</div>
          <p class="text">${words(s.sub)}</p></div>`;
      } else if (s.type === 'credit') {
        html = `<div class="scrim"></div><div class="wrap"><p class="text by">${words(s.by)}</p>
          <div class="big cred"><span class="f">${chars(s.name[0].toUpperCase())}</span><span class="ch">&nbsp;</span><span class="l">${chars(s.name[1].toUpperCase())}</span></div>
          ${s.role ? `<div class="eyebrow role"><i class="tick"></i><span class="tw"></span></div>` : ''}</div>`;
      } else if (s.type === 'part') {
        const n0 = s.firstChapter || 1;
        html = `<div class="scrim"></div><div class="ghost">${esc(s.numeral)}</div>
          <div class="block">${eyebrowHTML()}<div class="name">${(s.titleLines || [s.title]).map((l, k, a) => `<div class="ln ${a.length > 1 && k === 0 ? 'l1' : 'l2'}">${chars(l.toUpperCase())}</div>`).join('')}</div>
          ${s.sub ? `<p class="psub">${words(s.sub)}</p>` : ''}<div class="rule"></div>
          <ol class="chap">${s.chapters.map((c, k) => `<li><span class="n">${String(n0 + k).padStart(2, '0')}</span><span class="t">${esc(fr(c))}</span></li>`).join('')}</ol></div>`;
      } else if (s.type === 'chapter') {
        const titleWords = (str) => str.split(' ').map((w) => `<span class="wd">${chars(w)}</span>`).join(' ');
        html = `<div class="scrim"></div><div class="ghost">${esc(s.num)}</div>
          <div class="block">${eyebrowHTML()}<div class="ctrow"><div class="ctwrap"><div class="ctitle">${titleWords(fr(s.title).toUpperCase())}</div><i class="wipebar"></i></div></div>
          ${s.sub ? `<p class="text csub">${words(s.sub)}</p>` : ''}</div>`;
      } else if (s.type === 'outro') {
        html = `<div class="scrim"></div><div class="wrap">${eyebrowHTML()}${s.lines.map((l, i) => `<div class="big ${i === 1 ? 'thin' : ''} o${i}">${chars(l)}</div>`).join('')}</div>`;
      }
      el.innerHTML = html;
      typeLayer.appendChild(el);
      if (s.type === 'chapter') {
        el.style.display = 'block';
        const ct = el.querySelector('.ctitle'), maxW = s.layout === 'C' ? 1500 : 1080;
        let fs = parseFloat(getComputedStyle(ct).fontSize);
        for (let k = 0; k < 30; k++) {
          const lh = parseFloat(getComputedStyle(ct).lineHeight) || fs * 0.9;
          const widest = Math.max(...[...ct.querySelectorAll('.wd')].map((w) => w.scrollWidth));
          if (ct.scrollHeight <= lh * 2.25 && widest <= maxW) break;
          fs *= 0.94; ct.style.fontSize = `${Math.floor(fs)}px`;
        }
        s.titleW = ct.offsetWidth;
        el.style.display = '';
      }
      if (s.type === 'part') {
        el.style.display = 'block';
        const nm = el.querySelector('.name'), maxW = s.titleMax || 960;
        const widest = Math.max(...[...nm.querySelectorAll('.ln')].map((l) => l.scrollWidth));
        if (widest > maxW) nm.style.fontSize = `${Math.floor(parseFloat(getComputedStyle(nm).fontSize) * maxW / widest)}px`;
        el.style.display = '';
      }
      const R = refs(el);
      s.R = R;
      R.scrim = R.q('.scrim') || R.q('.scrimL');
      R.ghost = R.q('.ghost');
      R.eyebrows = R.qa('.eyebrow');
      R.tws = R.qa('.tw');
      R.lines = R.qa('.ln, .big, .word').map((ln) => ({ ln, ch: [...ln.querySelectorAll('.ch')] }));
      R.names = R.qa('.name');
      R.natives = R.qa('.native');
      R.rules = R.qa('.rule, .bar');
      R.texts = R.qa('.text, .psub').map((p) => [...p.querySelectorAll('.w')]);
      R.metas = R.qa('.meta');
      R.items = R.qa('.chap li');
      R.cache = new Map();
    }
  }

  // n'écrit le style que s'il change (rendu plus rapide)
  function css(R, el, prop, val) {
    let m = R.cache.get(el);
    if (!m) { m = {}; R.cache.set(el, m); }
    if (m[prop] === val) return;
    m[prop] = val;
    el.style[prop] = val;
  }
  const f3 = (v) => (Math.abs(v) < 1e-4 ? 0 : +v.toFixed(3));

  function typewriter(R, el, text, u, t0, cps, cursor = true) {
    text = fr(text);
    const n = Math.floor(clamp((u - t0) * cps, 0, text.length));
    const showCur = cursor && u >= t0 - 0.2 && (n < text.length || Math.floor(u * 3.2) % 2 === 0) && u < t0 + text.length / cps + 1.0;
    const key = n + (showCur ? 'c' : '');
    if (R.cache.get(el) === key) return;
    R.cache.set(el, key);
    el.innerHTML = esc(text.slice(0, n)) + (showCur ? '<span class="cur"></span>' : '');
  }

  function letters(R, line, t0, stagger, dur, from = 145) {
    line.ch.forEach((c, j) => {
      const p = tw(R.u, t0 + j * stagger, t0 + j * stagger + dur, E.outExpo);
      css(R, c, 'transform', p >= 1 ? 'none' : `translate3d(0,${f3((1 - p) * from)}%,0) rotate(${f3((1 - p) * (from > 0 ? 5 : -5))}deg)`);
    });
  }
  function wordsIn(R, list, t0, step, dur) {
    list.forEach((w, j) => {
      const p = tw(R.u, t0 + j * step, t0 + j * step + dur, E.outCubic);
      css(R, w, 'opacity', String(f3(p)));
      css(R, w, 'transform', p >= 1 ? 'none' : `translate3d(0,${f3((1 - p) * 22)}px,0)`);
    });
  }
  function rgbSplit(R, el, u, I) {
    const a = u > I ? 10 * Math.exp(-(u - I) / 0.11) : 0;
    css(R, el, 'textShadow', a < 0.4 ? 'none' : `${f3(-a)}px 0 rgba(255,40,30,.6), ${f3(a)}px 0 rgba(40,170,255,.5)`);
  }
  function blur(v) { return v < 0.05 ? 'none' : `blur(${f3(v)}px)`; }

  function upFigure(s, u) {
    const R = s.R; R.u = u;
    const I = s.fly, D = s.dur, dir = s.layout === 'L' ? 1 : -1;
    const ex = E.inCubic(inv(D - 0.08, D + 0.45, u));
    css(R, R.scrim, 'opacity', String(f3(tw(u, I - 0.7, I + 0.2, E.outCubic) * (1 - ex))));
    const gp = tw(u, I - 0.4, I + 0.75, E.outExpo);
    const gx = dir * lerp(80, -60, inv(I - 0.4, D + 0.45, u));
    css(R, R.ghost, 'opacity', String(f3(gp * (1 - ex))));
    css(R, R.ghost, 'transform', `translate3d(${f3(gx)}px,0,0) scale(${f3(lerp(1.4, 1, gp) * (1 + 0.35 * ex))})`);
    css(R, R.ghost, 'filter', blur((1 - gp) * 16 + ex * 10));
    const block = R.q('.block');
    const hit = u > I ? 0.045 * Math.exp(-(u - I) / 0.16) : 0;
    const sc = 1 + 0.032 * inv(I, D, u) + hit + 0.6 * ex;
    css(R, block, 'transform', `translate3d(${f3(-dir * 120 * ex - dir * 14 * inv(I, D, u))}px,${f3(-20 * ex)}px,0) scale(${f3(sc)})`);
    css(R, block, 'opacity', String(f3(1 - ex)));
    css(R, block, 'filter', blur(ex * 16));
    // sur-titre
    const tick = R.q('.tick');
    css(R, tick, 'transform', `scaleX(${f3(tw(u, I - 0.1, I + 0.5))})`);
    typewriter(R, R.tws[0], s.eyebrow, u, I + 0.05, 46);
    // nom
    letters(R, R.lines[0], I - 0.12, 0.022, 0.55);
    letters(R, R.lines[1], I - 0.04, 0.026, 0.6);
    rgbSplit(R, R.names[0], u, I);
    // nom d'origine (écriture de droite à gauche)
    const np = tw(u, I + 0.3, I + 1.15, E.outCubic);
    css(R, R.natives[0], 'clipPath', `inset(-30% 0 -30% ${f3((1 - np) * 100)}%)`);
    css(R, R.natives[0], 'opacity', String(f3(clamp(np * 3))));
    css(R, R.rules[0], 'transform', `scaleX(${f3(tw(u, I + 0.25, I + 0.95))})`);
    wordsIn(R, R.texts[0], I + 0.5, 0.028, 0.55);
    const mp = tw(u, I + 0.95, I + 1.5, E.outCubic);
    css(R, R.metas[0], 'opacity', String(f3(mp)));
    css(R, R.metas[0], 'transform', `translate3d(0,${f3((1 - mp) * 14)}px,0)`);
    const cut = R.q('.cutout');
    if (cut) {
      const cp = tw(u, I - 0.35, I + 1.1, E.outQuart);
      const drift = inv(I, D, u);
      css(R, cut, 'opacity', String(f3(clamp(cp * 1.5) * (1 - ex))));
      css(R, cut, 'transform', `translate3d(${f3(dir * (40 * (1 - cp) - 18 * drift))}px,${f3(60 * (1 - cp))}px,0) scale(${f3(1.02 + 0.05 * drift + 0.35 * ex)})`);
      css(R, cut, 'filter', blur((1 - cp) * 14 + ex * 14));
      const glow = u > I ? 0.5 + 0.5 * Math.exp(-(u - I) / 0.5) : 0.5;
      css(R, cut.firstElementChild, 'filter', `grayscale(1) contrast(1.22) brightness(.84) sepia(.3) drop-shadow(0 0 1.6px rgba(255,196,128,${f3(0.95 * glow)})) drop-shadow(0 0 ${f3(18 + 22 * glow)}px rgba(255,91,31,${f3(0.55 * glow)}))`);
    }
    const ph = R.q('.portrait');
    if (ph) {
      const pp = tw(u, I - 0.2, I + 0.9, E.outExpo);
      css(R, ph, 'clipPath', `inset(${f3((1 - pp) * 50)}% 0 ${f3((1 - pp) * 50)}% 0)`);
      css(R, ph, 'opacity', String(f3(1 - ex)));
      css(R, ph, 'transform', `scale(${f3(1 + 0.4 * ex)})`);
      css(R, ph.querySelector('.ph'), 'transform', `scale(${f3(1.12 - 0.1 * inv(I - 0.2, D, u))}) translate3d(${f3(dir * -10 * inv(I, D, u))}px,0,0)`);
    }
  }

  function upPair(s, u) {
    const R = s.R; R.u = u;
    const I = s.fly, D = s.dur;
    const ex = E.inCubic(inv(D - 0.08, D + 0.45, u));
    css(R, R.scrim, 'opacity', String(f3(tw(u, I - 0.7, I + 0.2, E.outCubic) * (1 - ex))));
    const gp = tw(u, I - 0.4, I + 0.8, E.outExpo);
    css(R, R.ghost, 'opacity', String(f3(gp * (1 - ex) * 0.9)));
    css(R, R.ghost, 'transform', `translate3d(-50%,0,0) scale(${f3(lerp(1.45, 1, gp) * (1 + 0.04 * inv(I, D, u)) * (1 + 0.35 * ex))})`);
    css(R, R.ghost, 'filter', blur((1 - gp) * 16 + ex * 10));
    typewriter(R, R.tws[0], s.eyebrow, u, I + 0.0, 40);
    css(R, R.q('.tick'), 'transform', `scaleX(${f3(tw(u, I - 0.1, I + 0.5))})`);
    const sides = R.qa('.side');
    sides.forEach((sd, k) => {
      const d0 = I - 0.12 + k * 0.2;
      const dir = k === 0 ? -1 : 1;
      letters(R, R.lines[k * 2], d0, 0.022, 0.55);
      letters(R, R.lines[k * 2 + 1], d0 + 0.07, 0.024, 0.6);
      rgbSplit(R, R.names[k], u, d0 + 0.1);
      const np = tw(u, d0 + 0.4, d0 + 1.2, E.outCubic);
      css(R, R.natives[k], 'clipPath', `inset(-30% 0 -30% ${f3((1 - np) * 100)}%)`);
      css(R, R.natives[k], 'opacity', String(f3(clamp(np * 3))));
      const mp = tw(u, d0 + 0.9, d0 + 1.4, E.outCubic);
      css(R, R.metas[k], 'opacity', String(f3(mp)));
      const drift = inv(I, D, u);
      css(R, sd, 'transform', `translate3d(${f3(dir * (8 * drift + 160 * ex))}px,0,0) scale(${f3(1 + 0.03 * drift + 0.5 * ex)})`);
      css(R, sd, 'opacity', String(f3(1 - ex)));
      css(R, sd, 'filter', blur(ex * 16));
    });
    R.qa('.pairbg').forEach((bgEl, k) => {
      const pp = tw(u, I - 0.2 + k * 0.2, I + 1.0 + k * 0.2, E.outCubic);
      css(R, bgEl, 'opacity', String(f3(pp * (1 - ex))));
      css(R, bgEl.firstElementChild, 'transform', `scale(${f3(1.14 - 0.1 * inv(I - 0.2, D, u))})`);
    });
    const amp = R.q('.amp');
    const ap = tw(u, I + 0.3, I + 0.9, E.outBack);
    css(R, amp, 'opacity', String(f3(clamp(ap) * (1 - ex))));
    css(R, amp, 'transform', `translate3d(-50%,0,0) scale(${f3(lerp(0.4, 1, ap) * (1 + 0.8 * ex))}) rotate(${f3((1 - clamp(ap)) * -14)}deg)`);
    wordsIn(R, R.texts[0], I + 0.75, 0.026, 0.55);
    const bot = R.q('.bottom');
    css(R, bot, 'opacity', String(f3(1 - ex)));
    css(R, bot, 'transform', `scale(${f3(1 + 0.02 * inv(I, D, u) + 0.4 * ex)})`);
    css(R, bot, 'filter', blur(ex * 14));
  }

  function upSplit(s, u) {
    const R = s.R; R.u = u;
    const I = s.fly, D = s.dur;
    const ex = E.inCubic(inv(D - 0.08, D + 0.45, u));
    css(R, R.scrim, 'opacity', String(f3(tw(u, I - 0.6, I + 0.3, E.outCubic) * (1 - ex))));
    const seam = R.q('.seam');
    css(R, seam, 'transform', `scaleY(${f3(tw(u, I - 0.15, I + 0.55, E.outExpo) * (1 - ex))})`);
    const halves = R.qa('.half');
    const sides = [s.left, s.right];
    halves.forEach((hf, k) => {
      const dir = k === 0 ? -1 : 1;
      const d0 = I + k * 0.45;
      typewriter(R, R.tws[k], sides[k].kicker, u, d0 - 0.05, 32);
      letters(R, R.lines[k], d0, 0.03, 0.6);
      rgbSplit(R, R.lines[k].ln, u, d0 + 0.12);
      const np = tw(u, d0 + 0.35, d0 + 1.1, E.outCubic);
      css(R, R.natives[k], 'clipPath', `inset(-30% 0 -30% ${f3((1 - np) * 100)}%)`);
      css(R, R.natives[k], 'opacity', String(f3(clamp(np * 3))));
      wordsIn(R, R.texts[k], d0 + 0.55, 0.03, 0.55);
      const drift = inv(I, D, u);
      const sp = tw(u, d0 - 0.2, d0 + 0.5, E.outExpo);
      css(R, hf, 'transform', `translate3d(${f3(dir * ((1 - sp) * 90 + 10 * drift + 140 * ex))}px,0,0) scale(${f3(1 + 0.025 * drift + 0.4 * ex)})`);
      css(R, hf, 'opacity', String(f3(clamp(sp * 2) * (1 - ex))));
      css(R, hf, 'filter', blur(ex * 14));
    });
    typewriter(R, R.tws[2], s.footer, u, I + 1.55, 34);
    css(R, R.q('.footer .tick'), 'transform', `scaleX(${f3(tw(u, I + 1.4, I + 2.0))})`);
    css(R, R.q('.footer'), 'opacity', String(f3(1 - ex)));
  }

  function upCenter(s, u) {
    const R = s.R; R.u = u;
    const wrapEl = R.q('.wrap');
    if (s.type === 'intro') {
      typewriter(R, R.tws[0], s.eyebrow, u, 0.55, 30);
      css(R, R.q('.tick'), 'transform', `scaleX(${f3(tw(u, 0.4, 1.0))})`);
      letters(R, R.lines[0], 0.95, 0.04, 0.8);
      letters(R, R.lines[1], 1.35, 0.035, 0.8, -145);
      rgbSplit(R, R.lines[0].ln, u, 1.05);
      css(R, R.rules[0], 'transform', `scaleX(${f3(tw(u, 1.05, 1.9, E.outExpo))})`);
      wordsIn(R, R.texts[0], 2.0, 0.07, 0.7);
      const ex = E.inExpo(inv(s.dur - 0.75, s.dur + 0.35, u));
      css(R, wrapEl, 'transform', `scale(${f3(1 + 0.045 * inv(0.8, s.dur, u) + 2.2 * ex)})`);
      css(R, wrapEl, 'opacity', String(f3(1 - ex)));
      css(R, wrapEl, 'filter', blur(ex * 26));
      css(R, R.scrim, 'opacity', String(f3(1 - ex)));
      return;
    }
    const I = s.fly, D = s.dur;
    if (s.type === 'event') {
      typewriter(R, R.tws[0], s.kicker, u, I + 0.1, 30);
      css(R, R.q('.tick'), 'transform', `scaleX(${f3(tw(u, I, I + 0.6))})`);
      letters(R, R.lines[0], I - 0.05, 0.03, 0.7);
      rgbSplit(R, R.lines[0].ln, u, I);
      css(R, R.rules[0], 'transform', `scaleX(${f3(tw(u, I + 0.35, I + 1.2, E.outExpo))})`);
      wordsIn(R, R.texts[0], I + 0.7, 0.05, 0.7);
      const ex = E.inCubic(inv(D - 0.1, D + 0.5, u));
      css(R, wrapEl, 'transform', `scale(${f3(1 + 0.03 * inv(I, D, u) + 0.6 * ex)})`);
      css(R, wrapEl, 'opacity', String(f3(1 - ex)));
      css(R, wrapEl, 'filter', blur(ex * 16));
      css(R, R.scrim, 'opacity', String(f3(tw(u, I - 0.4, I + 0.3) * (1 - ex))));
      return;
    }
    // fin
    typewriter(R, R.tws[0], s.eyebrow, u, I - 0.6, 26);
    css(R, R.q('.tick'), 'transform', `scaleX(${f3(tw(u, I - 0.7, I - 0.1))})`);
    R.lines.forEach((ln, k) => {
      const d0 = I - 0.25 + k * 0.55;
      letters(R, ln, d0, 0.03, 0.6, k % 2 ? -145 : 145);
      rgbSplit(R, ln.ln, u, d0 + 0.1);
    });
    css(R, wrapEl, 'transform', `scale(${f3(1.0 + 0.05 * inv(I, D, u))})`);
    css(R, R.scrim, 'opacity', String(f3(tw(u, I - 1.0, I))));
  }

  // mot-choc du générique (L'IDÉE, LA TERRE, LE CHOC)
  function upBeat(s, u) {
    const R = s.R; R.u = u;
    const I = s.fly + (s.hitAt || 0), D = s.dur;
    const wrapEl = R.q('.wrap');
    if (s.kicker) {
      typewriter(R, R.tws[0], s.kicker, u, I - 0.55, 28);
      css(R, R.q('.tick'), 'transform', `scaleX(${f3(tw(u, I - 0.7, I - 0.1))})`);
    }
    const line = R.lines[0];
    const mode = s.reveal || 'slam';
    let hit = 0, a = 0;
    if (mode === 'focus') {
      // l'idée apparaît comme une mise au point : flou, lettres écartées, puis net
      const p = tw(u, I - 0.4, I + 1.9, E.outQuart);
      line.ch.forEach((c) => css(R, c, 'transform', 'none'));
      css(R, line.ln, 'letterSpacing', `${f3((1 - p) * 0.42)}em`);
      css(R, line.ln, 'filter', blur((1 - p) * 30));
      css(R, line.ln, 'opacity', String(f3(clamp(p * 1.3))));
    } else if (mode === 'staccato') {
      // une lettre par impact, sans transition : coupe franche
      line.ch.forEach((c, j) => {
        const tj = I + (s.letterHits[j] || 0);
        const on = u >= tj;
        css(R, c, 'opacity', on ? '1' : '0');
        css(R, c, 'transform', on ? `scale(${f3(1 + 0.22 * Math.exp(-(u - tj) / 0.07))})` : 'none');
      });
      const last = I + Math.max(...s.letterHits);
      for (const d of s.letterHits) { const dt = u - (I + d); if (dt >= 0) a = Math.max(a, (s.rgb || 14) * Math.exp(-dt / 0.09)); }
      hit = u > last ? 0.07 * Math.exp(-(u - last) / 0.2) : 0;
    } else {
      letters(R, line, I - 0.1, 0.05, 0.65);
      a = u > I ? (s.rgb || 10) * Math.exp(-(u - I) / 0.13) : 0;
      hit = u > I ? 0.06 * Math.exp(-(u - I) / 0.18) : 0;
    }
    css(R, line.ln, 'textShadow', a < 0.4 ? 'none' : `${f3(-a)}px 0 rgba(255,40,30,.6), ${f3(a)}px 0 rgba(40,170,255,.5)`);
    if (s.sub) wordsIn(R, R.texts[0], I + (s.subAt || 1.2), 0.06, 0.7);
    const ex = E.inExpo(inv(D - 0.4, D + 0.45, u));
    css(R, wrapEl, 'transform', `scale(${f3(1 + 0.07 * inv(I, D, u) + hit + 2.4 * ex)})`);
    css(R, wrapEl, 'opacity', String(f3(1 - ex)));
    css(R, wrapEl, 'filter', blur(ex * 28));
    css(R, R.scrim, 'opacity', String(f3(tw(u, I - 0.8, I) * (1 - ex))));
    if (R.ghost) {
      const gp = tw(u, I - 0.3, I + 0.9, E.outExpo);
      css(R, R.ghost, 'opacity', String(f3(gp * (1 - ex) * 0.85)));
      css(R, R.ghost, 'transform', `translate3d(${f3(-50 + lerp(4, -4, inv(I, D, u)))}%,0,0) scale(${f3(lerp(1.5, 1, gp) * (1 + 0.5 * ex))})`);
      css(R, R.ghost, 'filter', blur((1 - gp) * 16 + ex * 12));
    }
  }

  // titre du film
  function upTitle(s, u) {
    const R = s.R; R.u = u;
    const I = s.fly + (s.hitAt || 0), D = s.dur;
    const wrapEl = R.q('.wrap');
    letters(R, R.lines[0], I - 0.12, 0.075, 0.75, -145);
    const a = u > I ? 16 * Math.exp(-(u - I) / 0.16) : 0;
    css(R, R.lines[0].ln, 'textShadow', a < 0.4 ? 'none' : `${f3(-a)}px 0 rgba(255,40,30,.6), ${f3(a)}px 0 rgba(40,170,255,.5)`);
    const zp = tw(u, I - 0.15, I + 1.0, E.outExpo);
    const ex = E.inCubic(inv(D - 0.35, D + 0.5, u));
    css(R, wrapEl, 'transform', `scale(${f3(lerp(1.3, 1, zp) * (1 + 0.05 * inv(I, D, u)) + 0.45 * ex)})`);
    css(R, wrapEl, 'filter', blur((1 - zp) * 12 + ex * 18));
    css(R, wrapEl, 'opacity', String(f3(clamp(zp * 4) * (1 - ex))));
    css(R, R.scrim, 'opacity', String(f3(tw(u, I - 0.4, I + 0.4) * (1 - ex))));
    R.natives.forEach((n, k) => {
      const np = tw(u, I + 0.55 + k * 0.25, I + 1.35 + k * 0.25, E.outCubic);
      css(R, n, 'clipPath', `inset(-30% 0 -30% ${f3((1 - np) * 100)}%)`);
      css(R, n, 'opacity', String(f3(clamp(np * 3))));
    });
    R.qa('.scripts .bar').forEach((b) => css(R, b, 'transform', `scaleX(${f3(tw(u, I + 0.4, I + 1.1, E.outExpo))})`));
    wordsIn(R, R.texts[0], I + 1.25, 0.09, 0.7);
  }

  // crédit du réalisateur
  function upCredit(s, u) {
    const R = s.R; R.u = u;
    const I = s.fly + (s.hitAt || 0), D = s.dur;
    const wrapEl = R.q('.wrap');
    wordsIn(R, R.texts[0], I - 0.45, 0.08, 0.6);
    letters(R, R.lines[0], I - 0.06, 0.035, 0.7);
    const a = u > I ? 7 * Math.exp(-(u - I) / 0.12) : 0;
    css(R, R.lines[0].ln, 'textShadow', a < 0.4 ? 'none' : `${f3(-a)}px 0 rgba(255,40,30,.55), ${f3(a)}px 0 rgba(40,170,255,.45)`);
    if (s.role) {
      typewriter(R, R.tws[0], s.role, u, I + 0.6, 30);
      css(R, R.q('.role .tick'), 'transform', `scaleX(${f3(tw(u, I + 0.5, I + 1.0))})`);
    }
    css(R, wrapEl, 'transform', `scale(${f3(1 + 0.04 * inv(I - 0.5, D, u))})`);
    css(R, R.scrim, 'opacity', String(f3(tw(u, -0.2, 0.4))));
  }

  // ouverture de partie : titre + sommaire synchronisé avec les repères de la carte
  function upPart(s, u) {
    const R = s.R; R.u = u;
    const I = s.fly + (s.hitAt || 0), D = s.span || s.dur;
    const block = R.q('.block');
    const ex = E.inExpo(inv(D - 0.45, D + 0.4, u));
    css(R, R.scrim, 'opacity', String(f3(tw(u, I - 0.8, I) * (1 - ex))));
    const gp = tw(u, I - 0.3, I + 1.0, E.outExpo);
    css(R, R.ghost, 'opacity', String(f3(gp * (1 - ex))));
    css(R, R.ghost, 'transform', `translate3d(${f3(lerp(60, -40, inv(I, D, u)))}px,0,0) scale(${f3(lerp(1.4, 1, gp) * (1 + 0.4 * ex))})`);
    css(R, R.ghost, 'filter', blur((1 - gp) * 16 + ex * 12));
    typewriter(R, R.tws[0], s.label, u, I - 0.5, 26, false);
    css(R, R.q('.tick'), 'transform', `scaleX(${f3(tw(u, I - 0.6, I))})`);
    R.qa('.name .ln').forEach((_, k) => letters(R, R.lines[k], I - 0.1 + k * 0.09, 0.045, 0.65));
    rgbSplit(R, R.names[0], u, I);
    if (R.texts[0]) wordsIn(R, R.texts[0], I + 0.4, 0.07, 0.6);
    css(R, R.rules[0], 'transform', `scaleX(${f3(tw(u, I + 0.3, I + 1.0))})`);
    R.items.forEach((li, k) => {
      const t0 = s.chapAt[k];
      const p = tw(u, t0 - 0.05, t0 + 0.5, E.outCubic);
      css(R, li, 'opacity', String(f3(p)));
      css(R, li, 'transform', p >= 1 ? 'none' : `translate3d(${f3((1 - p) * -34)}px,0,0)`);
      const hl = tw(u, t0, t0 + 0.15) * (1 - tw(u, t0 + 1.1, t0 + 2.3));
      css(R, li, 'color', `rgba(${Math.round(lerp(233, 255, hl))},${Math.round(lerp(220, 174, hl))},${Math.round(lerp(192, 90, hl))},${f3(lerp(0.92, 1, hl))})`);
    });
    const hit = u > I ? 0.035 * Math.exp(-(u - I) / 0.16) : 0;
    css(R, block, 'transform', `translate3d(${f3(-14 * inv(I, D, u) - 140 * ex)}px,0,0) scale(${f3(1 + 0.03 * inv(I, D, u) + hit + 0.6 * ex)})`);
    css(R, block, 'opacity', String(f3(1 - ex)));
    css(R, block, 'filter', blur(ex * 18));
  }

  // carton de chapitre : trois façons d'apparaître (impact, balayage, mise au point)
  function upChapter(s, u) {
    const R = s.R; R.u = u;
    const I = s.hitAt || 0.8, D = s.dur;
    const block = R.q('.block'), ct = R.q('.ctitle'), bar = R.q('.wipebar');
    typewriter(R, R.tws[0], s.kicker, u, 0.3, 46, false);
    css(R, R.q('.tick'), 'transform', `scaleX(${f3(tw(u, 0.2, 0.7))})`);
    const ex = E.inExpo(inv(D - 0.55, D - 0.02, u));
    const chs = [...ct.querySelectorAll('.ch')];
    let a = 0;
    if (s.reveal === 'wipe') {
      const p = tw(u, I - 0.15, I + 0.75, E.inOutCubic);
      chs.forEach((c) => css(R, c, 'transform', 'none'));
      css(R, ct, 'clipPath', p >= 1 ? 'none' : `inset(-20% ${f3((1 - p) * 100)}% -20% 0)`);
      const vis = p > 0 && p < 1;
      css(R, bar, 'opacity', vis ? '1' : '0');
      css(R, bar, 'transform', `translate3d(${f3(p * (s.titleW || 1000))}px,0,0)`);
      a = u > I + 0.75 ? 7 * Math.exp(-(u - I - 0.75) / 0.12) : 0;
    } else if (s.reveal === 'focus') {
      const p = tw(u, I - 0.35, I + 1.2, E.outQuart);
      chs.forEach((c) => css(R, c, 'transform', 'none'));
      css(R, ct, 'filter', blur((1 - p) * 26));
      css(R, ct, 'opacity', String(f3(clamp(p * 1.4))));
      css(R, ct, 'transform', `scale(${f3(1 + 0.08 * (1 - p))})`);
    } else {
      chs.forEach((c, j) => {
        const p = tw(u, I - 0.1 + j * 0.018, I + 0.45 + j * 0.018, E.outExpo);
        css(R, c, 'transform', p >= 1 ? 'none' : `translate3d(0,${f3((1 - p) * 145)}%,0) rotate(${f3((1 - p) * 5)}deg)`);
      });
      a = u > I ? 11 * Math.exp(-(u - I) / 0.12) : 0;
    }
    css(R, ct, 'textShadow', a < 0.4 ? 'none' : `${f3(-a)}px 0 rgba(255,40,30,.6), ${f3(a)}px 0 rgba(40,170,255,.5)`);
    if (R.texts[0]) wordsIn(R, R.texts[0], I + 0.6, 0.05, 0.6);
    const gp = tw(u, I - 0.4, I + 0.9, E.outExpo);
    css(R, R.ghost, 'opacity', String(f3(gp * (1 - ex))));
    css(R, R.ghost, 'transform', `translate3d(${f3((s.layout === 'R' ? 1 : -1) * 40 * inv(0, D, u))}px,0,0) scale(${f3(lerp(1.35, 1, gp) * (1 + 0.4 * ex))})`);
    css(R, R.ghost, 'filter', blur((1 - gp) * 16 + ex * 12));
    const hit = u > I && s.reveal !== 'focus' ? 0.04 * Math.exp(-(u - I) / 0.16) : 0;
    css(R, block, 'transform', `scale(${f3(1 + 0.04 * inv(0, D, u) + hit + 0.6 * ex)})`);
    css(R, block, 'opacity', String(f3(1 - ex)));
    css(R, block, 'filter', blur(ex * 18));
    css(R, R.scrim, 'opacity', String(f3(tw(u, 0, 0.6) * (1 - ex))));
  }

  function updateType(t) {
    for (const s of SEG) {
      const u = t - s.start;
      const on = u >= -0.05 && u <= (s.span || s.dur) + 0.55;
      css(s.R, s.R.el, 'display', on ? 'block' : 'none');
      if (!on) continue;
      if (s.type === 'figure') upFigure(s, u);
      else if (s.type === 'pair') upPair(s, u);
      else if (s.type === 'split') upSplit(s, u);
      else if (s.type === 'beat') upBeat(s, u);
      else if (s.type === 'title') upTitle(s, u);
      else if (s.type === 'credit') upCredit(s, u);
      else if (s.type === 'part') upPart(s, u);
      else if (s.type === 'chapter') upChapter(s, u);
      else if (s.type === 'camera') { /* plan de caméra sans texte */ }
      else upCenter(s, u);
    }
  }

  // compteur d'années à rouleaux
  const odo = $('odo');
  odo.innerHTML = Array.from({ length: 4 }, () => `<div class="col"><div class="strip">${'01234567890'.split('').map((d) => `<div>${d}</div>`).join('')}</div></div>`).join('');
  const strips = [...odo.querySelectorAll('.strip')];
  function setOdo(v) {
    for (let i = 3, k = 0; i >= 0; i--, k++) {
      const p = Math.pow(10, i), base = Math.floor(v / p);
      const d = base % 10;
      let frac = 0;
      if (i === 0) frac = v - Math.floor(v);
      else frac = clamp(v - base * p - (p - 1));
      strips[k].style.transform = `translate3d(0,${f3(-(d + frac) * 52)}px,0)`;
    }
  }

  // ------------------------------------------------------------ image
  const world = $('world'), typeEl = $('type'), hudDom = $('hudDom'), hudCv = $('hud');
  const flashEl = $('flash'), fadeEl = $('fade'), flickEl = $('flicker');
  const hudIdx = $('hudIdx'), hudCoord = $('hudCoord');
  const OUTRO = SEG[SEG.length - 1];

  function renderFrame(t, frame) {
    const T = tau(t);
    const cam = camAt(t);
    const par = travel(t);
    const s = segAt(t);

    // séquence « ralentie » (1995 dans la chronologie) : désaturation et ralenti
    const dark = SLOW ? tw(t, SLOW.impact - 0.15, SLOW.impact + 0.5, E.outCubic) * (1 - tw(t, SLOW.end - 0.2, SLOW.end + 1.2, E.inOutCubic)) : 0;
    world.style.filter = dark > 0.01 ? `saturate(${f3(1 - 0.85 * dark)}) brightness(${f3(1 - 0.18 * dark)})` : 'none';

    drawBg(t, T, par);
    const pin = drawMap(t, cam);
    drawFx(t, T, par, pin, 1 - 0.55 * dark);

    // secousse caméra
    let sh = 0;
    for (const im of IMPACTS) { const d = t - im.t; if (d >= 0 && d < 1) sh = Math.max(sh, im.k * Math.exp(-d / 0.2)); }
    const shx = 9 * sh * noise1(t * 38), shy = 7 * sh * noise1(t * 41 + 13);
    const shake = `translate3d(${f3(shx)}px,${f3(shy)}px,0)`;
    world.style.transform = shake;
    typeEl.style.transform = shake;

    updateType(t);

    // HUD
    const yr = yearAt(t);
    const HUD = TL.hud;
    const hudOut = 1 - tw(t, OUTRO.end - 2.2, OUTRO.end - 1.0, E.inCubic);
    const hudA = tw(t, HUD.from, HUD.from + 1.2, E.outCubic) * hudOut;
    drawHud(t, yr, hudA);
    if (HUD.odo) setOdo(yr);
    $('hudTl').style.opacity = String(f3(tw(t, 0.6, 1.6, E.outCubic) * hudOut));
    hudDom.style.opacity = '1';
    $('odo').style.opacity = String(f3(HUD.odo ? hudA : 0));
    $('hudTr').style.opacity = String(f3(hudA));
    if (HUD.index) {
      let num = null;
      for (const sg of SEG) if (sg.num && t >= sg.impact - 0.2) num = sg.num;
      const idxTxt = num && s.type !== 'outro' && s.type !== 'event' ? `<em>${String(num).padStart(2, '0')}</em> / ${FIGS}` : '&nbsp;';
      if (hudIdx.innerHTML !== idxTxt) hudIdx.innerHTML = idxTxt;
    }
    if (HUD.coords) hudCoord.textContent = `${dms(LAT(cam.y), 'N', 'S')}  ${dms(cam.x / D2R, 'E', 'O')}`;

    // éclair, scintillement, fondus
    const fl = impactEnv(t, 0.14);
    flashEl.style.opacity = String(f3(0.5 * fl));
    if (pin) { flashEl.style.setProperty('--fx', `${f3((pin.x / W) * 100)}%`); flashEl.style.setProperty('--fy', `${f3((pin.y / H) * 100)}%`); }
    const fi = frame;
    const rnd = mulberry32(fi * 7919 + 13);
    flickEl.style.opacity = String(f3(0.03 + 0.05 * rnd()));
    let fade = TL.fadeIn > 0 ? 1 - tw(t, 0.0, TL.fadeIn, E.outCubic) : 0;
    if (TL.fadeOut > 0) fade = Math.max(fade, tw(t, OUTRO.end - TL.fadeOut - 0.15, OUTRO.end - 0.15, E.inOutCubic));
    if (s.edgeFade) {
      const u0 = t - s.start;
      fade = Math.max(fade, 1 - tw(u0, 0, 0.3, E.outCubic), tw(u0, s.dur - 0.32, s.dur - 0.02, E.inCubic));
    }
    // coupures au noir juste avant un impact (blackBefore)
    for (const sg of SEG) {
      if (!sg.blackBefore) continue;
      const cut = sg.impact, b = sg.blackBefore === true ? 0.5 : sg.blackBefore;
      fade = Math.max(fade, tw(t, cut - b, cut - b + 0.28, E.inCubic) * (1 - tw(t, cut - 0.02, cut + 0.35, E.outCubic)));
    }
    fadeEl.style.opacity = String(f3(fade));

    // grain
    gr.globalCompositeOperation = 'source-over';
    gr.globalAlpha = 1;
    const ox = Math.floor(rnd() * 512), oy = Math.floor(rnd() * 512);
    for (let y = -oy; y < H; y += 512) for (let x = -ox; x < W; x += 512) gr.drawImage(GRAIN, x, y);
    // poussières et rayures de pellicule
    const nd = Math.floor(rnd() * 5);
    for (let i = 0; i < nd; i++) {
      gr.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.9)' : 'rgba(255,255,255,.8)';
      gr.beginPath(); gr.ellipse(rnd() * W, rnd() * H, 1 + rnd() * 3, 1 + rnd() * 2, rnd() * 3, 0, 7); gr.fill();
    }
    if (rnd() < 0.08) { gr.fillStyle = 'rgba(255,255,255,.55)'; gr.fillRect(rnd() * W, 0, 1.2, H); }
  }

  async function init() {
    await document.fonts.ready;
    const probes = ['760 34px "Archivo"', '400 13px "DM Mono"', '500 13px "DM Mono"', 'italic 400 38px "Newsreader"', '400 30px "Newsreader"', '600 50px "Noto Sans Hebrew"', '600 44px "Noto Kufi Arabic"'];
    await Promise.all(probes.map((p) => document.fonts.load(p, 'AÉأאz')));
    buildSegments();
    // en-têtes du HUD propres à la pièce
    const H0 = TL.hud;
    $('hudTl').innerHTML = H0.label ? `<b>${esc(H0.label[0])}</b><br><span>${esc(H0.label[1] || '')}</span>` : '';
    if (!H0.index) hudIdx.innerHTML = '&nbsp;';
    window.renderFrame = renderFrame;
    window.TOTAL = TL.total;
    window.READY = true;
  }
  init();
})();
