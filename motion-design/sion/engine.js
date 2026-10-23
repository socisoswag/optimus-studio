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

  const PAL = window.PALETTE || {};
  const COL = {
    stone: [233, 220, 192], ash: [154, 143, 126], ember: PAL.ember || [255, 91, 31],
    hot: PAL.hot || [255, 174, 90], map: [127, 152, 154], smoke: [42, 38, 32],
  };
  COL.life = PAL.life || COL.ember;
  COL.cold = PAL.cold || [124, 156, 188];      // encre froide (État juif prévu en 1947, puis Israël)
  COL.coldHot = PAL.coldHot || [190, 212, 234];
  COL.lifeHot = PAL.lifeHot || PAL.life || COL.hot;
  const EMB = COL.ember.join(','), HOTM = COL.ember.map((c, k) => Math.round(c * 0.6 + COL.hot[k] * 0.4)).join(',');
  if (typeof document !== 'undefined') {
    const RS = document.documentElement.style;
    RS.setProperty('--ember', `rgb(${EMB})`); RS.setProperty('--hot', `rgb(${COL.hot.join(',')})`);
    RS.setProperty('--ember-rgb', EMB); RS.setProperty('--hot-rgb', COL.hot.join(','));
  }
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
  // ressort amorti, en secondes depuis le départ : durée perçue vd, rebond b (0 = aucun dépassement)
  const spring = (t, vd = 0.5, b = 0.25) => {
    if (t <= 0) return 0;
    const w = (2 * PI) / vd, z = Math.max(0.05, 1 - b);
    if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
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
  // flux humains : particules qui vont d'un ou plusieurs lieux vers une destination
  const FLOWS = (TL.flows || []).map((f, fi) => {
    const r = mulberry32(4801 + fi * 131);
    const froms = Array.isArray(f.from[0]) ? f.from : [f.from];
    const n = f.n || 90, [tr0, tr1] = f.travel || [2.0, 3.4];
    const bez = (lon0, lat0, lon1, lat1, b) => {
      const X0 = MX(lon0), Y0 = MY(lat0), X1 = MX(lon1), Y1 = MY(lat1);
      const dx = X1 - X0, dy = Y1 - Y0;
      return { X0, Y0, X1, Y1, CX: (X0 + X1) / 2 - dy * b, CY: (Y0 + Y1) / 2 + dx * b };
    };
    const P = [];
    for (let i = 0; i < n; i++) {
      const o = froms[Math.floor(r() * froms.length)];
      const a1 = r() * 6.283, r1 = Math.sqrt(r()) * (f.spread || 0.1), a2 = r() * 6.283, r2 = Math.sqrt(r()) * (f.spreadTo || 0.14);
      const b = (f.bend !== undefined ? f.bend : 0.18) * (0.7 + 0.6 * r());
      P.push({
        ...bez(o[0] + Math.cos(a1) * r1, o[1] + Math.sin(a1) * r1 * 0.85, f.to[0] + Math.cos(a2) * r2, f.to[1] + Math.sin(a2) * r2 * 0.85, b),
        t0: f.t + Math.pow(r(), f.burst || 1.25) * (f.dur || 3), tt: tr0 + r() * (tr1 - tr0), sz: 0.6 + r() * 0.8,
      });
    }
    // trajet guide : du centre des départs à la destination
    const c = froms.reduce((a, o) => [a[0] + o[0] / froms.length, a[1] + o[1] / froms.length], [0, 0]);
    return { ...f, P, guide: bez(c[0], c[1], f.to[0], f.to[1], f.bend !== undefined ? f.bend : 0.18), O: froms.map((o) => [MX(o[0]), MY(o[1])]), TX: MX(f.to[0]), TY: MY(f.to[1]) };
  });
  // réseaux de faux comptes (guerre numérique) : des profils s'allument autour d'une cible, chacun relié
  // au compte déjà en place le plus proche ; des messages circulent le long des liens ; à `off`, les
  // comptes sont supprimés un à un (éclair, puis une croix grise à leur place)
  const NETS = (TL.nets || []).map((nt, ni) => {
    const r = mulberry32(6100 + ni * 97), n = nt.n || 120, sp = nt.spread || 1.5, N = [];
    for (let i = 0; i < n; i++) {
      const a = r() * 6.283, d = (0.12 + 0.88 * Math.pow(r(), 0.75)) * sp;
      const X = MX(nt.hub[0] + Math.cos(a) * d * (nt.ax || 1.3)), Y = MY(nt.hub[1] + Math.sin(a) * d * 0.75);
      let par = -1, best = Math.hypot(X - MX(nt.hub[0]), Y - MY(nt.hub[1])) * 1.6;
      for (let j = 0; j < i; j++) { const dd = Math.hypot(X - N[j].X, Y - N[j].Y); if (dd < best) { best = dd; par = j; } }
      N.push({ X, Y, par, t0: nt.t + Math.pow(i / n, 0.85) * (nt.grow || 4) + r() * 0.15, off: nt.offT !== undefined ? nt.offT + Math.pow(r(), 0.8) * (nt.offDur || 3) : 1e9, ph: r(), sz: 0.85 + 0.3 * r() });
    }
    return { ...nt, N, HX: MX(nt.hub[0]), HY: MY(nt.hub[1]) };
  });
  // noms remplacés (effacement) : l'ancien nom s'écrit en olive, un trait de braise le barre, le nouveau
  // nom s'écrit au-dessus en pierre ; `strike` et `gap` règlent le rythme (secondes)
  const RENAMES = (TL.renames || []).map((r) => ({ ...r, X: MX(r.lon), Y: MY(r.lat) }));
  // ------------------------------------------------------------ guerre : unités, flèches, frappes, territoires
  const smoothPath = (pts) => {
    // lissage de Chaikin (deux passes) pour des trajectoires sans angles
    let P = pts;
    for (let it = 0; it < 2; it++) {
      if (P.length < 3) break;
      const Q = [P[0]];
      for (let i = 0; i < P.length - 1; i++) {
        const [a, b] = [P[i], P[i + 1]];
        Q.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
      }
      Q.push(P[P.length - 1]);
      P = Q;
    }
    return P;
  };
  const mkPath = (lonlat) => {
    const P = smoothPath(lonlat.map(([lo, la]) => [MX(lo), MY(la)]));
    const L = [0];
    for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    return { P, L, len: L[L.length - 1] };
  };
  const along = (pa, d) => {
    const { P, L } = pa;
    d = clamp(d, 0, pa.len);
    let i = 1;
    while (i < L.length - 1 && L[i] < d) i++;
    const q = clamp((d - L[i - 1]) / ((L[i] - L[i - 1]) || 1e-9));
    return [lerp(P[i - 1][0], P[i][0], q), lerp(P[i - 1][1], P[i][1], q), P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]];
  };
  const segEnd = (id) => { const sg = SEG.find((x) => x.id === id); return sg ? sg.end : TL.total; };
  const UNITS = (TL.units || []).map((u) => ({ ...u, pa: mkPath(u.path), n: u.n || 1, tEnd: u.until !== undefined ? u.t - u.at + u.until : segEnd(u.seg) + 0.3, fires: (u.fire || []).map((f) => ({ t: u.t - u.at + f.at, X: MX(f.to[0]), Y: MY(f.to[1]) })) }));
  const ARROWS = (TL.arrows || []).map((a) => ({ ...a, pa: mkPath(a.path), tEnd: a.until !== undefined ? a.t - a.at + a.until : segEnd(a.seg) + 0.4 }));
  const STRIKES = (TL.strikes || []).map((st) => ({ ...st, X: MX(st.lon), Y: MY(st.lat), pow: st.power || 1, burn: st.burn || 4 }));
  const TER = window.TERRITOIRES || {};
  const WZONES = (TL.zones || []).map((z) => ({
    ...z, rings: (Array.isArray(z.name) ? z.name : [z.name]).flatMap((nm) => (TER[nm] || []).map((r) => r.map(([lo, la]) => [MX(lo), MY(la)]))),
    O: z.from ? [MX(z.from[0]), MY(z.from[1])] : null, tEnd: z.until !== undefined ? z.t - z.at + z.until : TL.total + 1,
  }));
  // plans au sol (remparts, esplanades, mur) et maisons en relief : mètres → unités Mercator
  const M2U = (lat) => 1 / (6371000 * Math.cos(lat * D2R));
  const PLANS = (TL.plans || []).map((p) => ({ ...p, P: (p.path || []).map(([lo, la]) => [MX(lo), MY(la)]), L: p.label ? [MX(p.labelAt[0]), MY(p.labelAt[1])] : null, tEnd: p.until !== undefined ? p.t - p.at + p.until : TL.total + 1 }));
  const BLOCKS = (TL.blocks || []).map((b, i) => {
    const u = M2U(b.lat), X = MX(b.lon), Y = MY(b.lat), c = Math.cos(b.rot || 0), sn = Math.sin(b.rot || 0);
    const hw = (b.w / 2) * u, hd = (b.d / 2) * u, r = mulberry32(i * 31 + 7);
    const C = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, y]) => [X + x * c - y * sn, Y + x * sn + y * c]);
    const deb = Array.from({ length: 7 }, () => [X + (r() - 0.5) * 2.4 * hw, Y + (r() - 0.5) * 2.4 * hd, 0.4 + r() * 0.8]);
    return { ...b, X, Y, C, hU: b.h * u, wU: b.w * u, deb, tilt: (r() - 0.5) * 0.5 };
  });
  const FLARES = (TL.flares || []).map((f) => ({ ...f, X: MX(f.lon), Y: MY(f.lat) }));
  // lumières d'une ville la nuit : points tirés dans un polygone, qui s'éteignent à `off`
  const LIGHTS = (TL.lights || []).map((l, i) => {
    const r = mulberry32(977 + i * 13), P = l.poly, pts = [];
    const lo0 = Math.min(...P.map((p) => p[0])), lo1 = Math.max(...P.map((p) => p[0])), la0 = Math.min(...P.map((p) => p[1])), la1 = Math.max(...P.map((p) => p[1]));
    const inP = (x, y) => { let c = false; for (let a = 0, b = P.length - 1; a < P.length; b = a++) if ((P[a][1] > y) !== (P[b][1] > y) && x < ((P[b][0] - P[a][0]) * (y - P[a][1])) / (P[b][1] - P[a][1]) + P[a][0]) c = !c; return c; };
    while (pts.length < (l.n || 600)) { const x = lo0 + r() * (lo1 - lo0), y = la0 + r() * (la1 - la0); if (inP(x, y)) pts.push([MX(x), MY(y), r(), r()]); }
    return { ...l, pts };
  });
  const HAS_WAR = UNITS.length || ARROWS.length || STRIKES.length || WZONES.length || PLANS.length || BLOCKS.length || FLARES.length || LIGHTS.length;

  const bezAt = (b, q) => { const m = 1 - q; return [m * m * b.X0 + 2 * m * q * b.CX + q * q * b.X1, m * m * b.Y0 + 2 * m * q * b.CY + q * q * b.Y1]; };
  const flowA = (f, t) => tw(t, f.t - 0.2, f.t + 0.4) * (1 - tw(t, f.tEnd - 0.7, f.tEnd));

  // Visages : personnages détourés (PNG transparent) incrustés sur n'importe quel écran.
  // Fiches et paires de la chronologie : automatique dès qu'elles ont une photo .png.
  const FACE_POS = { R: [1500, 940], L: [420, 940], C: [960, 860], pairA: [735, 800], pairB: [1185, 800] };
  SEG.forEach((s) => {
    const list = [];
    const png = (ph) => ph && /\.png$/i.test(ph);
    if (s.type === 'figure' && png(s.photo)) list.push({ photo: s.photo, name: s.name.join(' '), dates: s.life, side: s.layout === 'R' ? 'L' : 'R', at: s.fly - 0.35, link: { lon: s.lon, lat: s.lat }, tag: false });
    if (s.type === 'pair') s.people.forEach((pp, k) => { if (png(pp.photo)) list.push({ photo: pp.photo, name: pp.name.join(' '), dates: pp.life, side: k ? 'pairB' : 'pairA', at: s.fly - 0.3 + 0.2 * k, dim: 0.8, tag: false, norm: pp.norm || 250, headTop: pp.headTop || 300 }); });
    (s.faces || []).forEach((f) => list.push({ ...f }));
    s.faceList = list.map((f) => {
      const [x0, h0] = FACE_POS[f.side || 'R'];
      const h = f.h || h0, x = f.x !== undefined ? f.x : x0;
      return {
        ...f, x, h, w: Math.round(h * (f.ratio || 0.86)), dir: x > W / 2 ? 1 : -1,
        at: f.at !== undefined ? f.at : (s.fly || 0) + 0.2,
        until: f.until !== undefined ? f.until : (s.span || s.dur),
        dim: f.dim || 1, tag: f.tag !== false, ok: false,
        link: f.link ? { X: MX(f.link.lon), Y: MY(f.link.lat) } : null,
      };
    });
  });

  const HAS_FACES = SEG.some((s) => s.faceList.length);
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
    const mix = (c1, c2, q) => c1.map((v, k) => Math.round(v * (1 - q) + c2[k] * q)).join(',');
    gr.addColorStop(0, 'rgba(255,244,220,1)');
    gr.addColorStop(0.18, `rgba(${mix(COL.hot, [255, 244, 220], 0.25)},.95)`);
    gr.addColorStop(0.42, `rgba(${mix(COL.ember, COL.hot, 0.1)},.35)`);
    gr.addColorStop(1, `rgba(${COL.ember.join(',')},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    return c;
  })();
  // braise « vie » (villages, villes, réfugiés) : même dessin, couleur de la vie
  SPR.life = !PAL.life ? SPR.spark : (() => {
    const s = 64, c = canvas(s, s), g = c.getContext('2d');
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    const mix = (c1, c2, q) => c1.map((v, k) => Math.round(v * (1 - q) + c2[k] * q)).join(',');
    gr.addColorStop(0, `rgba(${mix(COL.lifeHot, [255, 250, 235], 0.6)},1)`);
    gr.addColorStop(0.18, `rgba(${COL.lifeHot.join(',')},.95)`);
    gr.addColorStop(0.42, `rgba(${COL.life.join(',')},.35)`);
    gr.addColorStop(1, `rgba(${COL.life.join(',')},0)`);
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

  // grain argentique : fin et doux (grains de 1 à 2 pixels, adoucis), comme une pellicule, pas un bruit d'écran ;
  // un grain dur pixel par pixel devient de la bouillie une fois compressé par YouTube
  const GRAIN = (() => {
    const s = 512, c = canvas(s, s), g = c.getContext('2d'), img = g.createImageData(s, s), r = mulberry32(77);
    const n = new Float32Array(s * s);
    for (let i = 0; i < s * s; i++) n[i] = (r() + r() + r() + r() - 2) * 0.5; // ~ gaussien
    // léger flou (noyau 3 x 3, bords bouclés) : le grain s'arrondit
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      let a = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) a += n[((y + dy + s) % s) * s + ((x + dx + s) % s)] * (dx || dy ? (dx && dy ? 0.05 : 0.1) : 0.4);
      const k = 128 + a * 210;
      const i = (y * s + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = k; img.data[i + 3] = 255;
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

  // Trames fines limitées à une zone (Levant) : elles se fondent dans la trame plus large
  // par un liseré progressif, pour qu'aucun rectangle ne se voie à l'écran.
  const ZONES = {
    0.05: { b: [MX(33.6), MY(29.2), MX(36.9), MY(33.8)], feather: 0.45 * D2R },
    0.025: { b: [MX(34.1), MY(30.9), MX(35.9), MY(33.2)], feather: 0.3 * D2R },
  };
  const zoneF = (z, X, Y) => {
    const b = z.b, d = Math.min(X - b[0], b[2] - X, Y - b[1], b[3] - Y);
    if (d <= 0) return 0;
    const u = d / z.feather;
    return u >= 1 ? 1 : u * u * (3 - 2 * u);
  };
  function gridWeight(step, sp) {
    // une seule trame domine à chaque zoom : la trame régionale s'efface tôt, les trames fines arrivent tard
    const fine = step <= 0.1, regional = step > 0.1 && step < 0.5;
    // Levant (0,05°) : apparaît au même zoom que la trame 0,08° ; Levant fin (0,025°) : seulement de très près
    const spIn = step === 0.05 ? sp * 1.6 : step === 0.025 ? sp * 0.45 : sp;
    return (fine ? inv(5.5, 9.6, spIn) : inv(2.6, 6, sp)) * (1 - (regional ? inv(18, 30, sp) : inv(30, 52, sp)));
  }
  function drawDots(g, sources, t, mot) {
    const pxPerDeg = D2R * Ps;
    // sous le relief, la grille de points se fait discrète (elle ne garde que ses lueurs autour des événements)
    const dotDim = PART && PART.C.terres ? 1 - 0.7 * landAlpha(t) * reliefZoom(camAt(t)) : 1;
    const heat = [];
    const NS = sources.length;
    const wLev = gridWeight(0.05, 0.05 * pxPerDeg), wLev2 = gridWeight(0.025, 0.025 * pxPerDeg);
    for (const grid of G.dots) {
      const sp = grid.step * pxPerDeg;
      const a = gridWeight(grid.step, sp) * mot;
      if (a < 0.02) continue;
      const r0 = clamp(sp * 0.085, 0.55, 2.4);
      const A = grid.a;
      // fondu spatial avec les zones fines
      const isLocal = grid.step === 0.08, isLev = grid.step === 0.05, isLev2 = grid.step === 0.025;
      const blend = (isLocal && wLev > 0.01) || isLev || isLev2;
      g.fillStyle = rgba(COL.map, 0.5 * a * dotDim);
      g.beginPath();
      for (let i = 0; i < A.length; i += 2) {
        const X = A[i], Y = A[i + 1];
        if (X < VIEW.x0 || X > VIEW.x1 || Y < VIEW.y0 || Y > VIEW.y1) continue;
        const p = proj(X, Y);
        if (p.k < KMIN || p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) continue;
        let r = r0 * p.k;
        if (blend) {
          if (isLocal) r *= 1 - wLev * zoneF(ZONES[0.05], X, Y);
          else if (isLev) r *= zoneF(ZONES[0.05], X, Y) * (1 - wLev2 * zoneF(ZONES[0.025], X, Y));
          else r *= zoneF(ZONES[0.025], X, Y);
          if (r < 0.25) continue;
        }
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
    if (!TL.route) return; // pièces faites de cartons indépendants : pas d'itinéraire
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

  let CITY_DIM = 1; // carte du partage : les villes du fond s'effacent quand la maquette est éclairée
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
      const fa = a * clamp((p.k - KMIN) * 2.2) * CITY_DIM;
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
      const a = tw(h, -0.05, 0.25, E.outCubic) * (1 - tw(t, TL.total - TL.fadeOut - 0.4, TL.total - 0.2)) * (m.endT !== undefined ? 1 - tw(t, m.endT - 0.8, m.endT) : 1);
      if (a <= 0.01) continue;
      const P = proj(m.X, m.Y);
      const { x, y, k } = P;
      if (m.erase) {
        sources.push({ gx: P.gx, gy: P.gy, R: m.R || 900, erase: 0.92 * tw(h, 0, m.eraseDur || 3.0, E.inOutSine), waves: [] });
        if (m.ghost) {
          // village : un petit carré de pierre s'embrase, s'éteint et ne laisse que son empreinte
          const sz = 10 * k, q = tw(h, 0.25, 0.8, E.inCubic);
          g.save();
          g.globalAlpha = a;
          if (q < 1) { g.fillStyle = rgba(PAL.life ? COL.lifeHot : COL.stone, 0.9 * (1 - q)); g.fillRect(x - sz / 2, y - (sz / 2) * Pcp, sz, sz * Pcp); }
          g.globalCompositeOperation = 'lighter';
          if (h > 0.2 && h < 1.4) sprite(g, SPR.hot, x, y, 60 * k, 0.8 * Math.exp(-(h - 0.25) / 0.3) * a);
          g.globalCompositeOperation = 'source-over';
          g.setLineDash([2, 2]); g.strokeStyle = rgba(COL.ember, 0.85 * tw(h, 0.6, 1.2) * a); g.lineWidth = 1;
          g.strokeRect(x - sz / 2, y - (sz / 2) * Pcp, sz, sz * Pcp); g.setLineDash([]);
          g.restore();
        }
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
      // trait de rappel et nom de lieu cernés de sombre : lisibles sur le relief clair comme sur le fond nuit
      g.lineCap = 'round';
      g.strokeStyle = 'rgba(10,9,8,.55)';
      g.lineWidth = 3;
      g.beginPath(); g.moveTo(x + dx * 8, y + dy * 8); g.lineTo(lx, ly); g.stroke();
      g.strokeStyle = rgba(COL.stone, 0.75);
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(x + dx * 8, y + dy * 8); g.lineTo(lx, ly); g.stroke();
      g.font = '500 15px "DM Mono"';
      g.letterSpacing = '1.5px';
      g.textBaseline = 'middle';
      const num = m.num, nw = num ? 34 : 0;
      const bx = dx > 0 ? lx : lx - nw;
      if (num) {
        g.fillStyle = rgba(COL.ember, 0.95);
        g.fillRect(bx, ly - 12, nw, 24);
        g.fillStyle = '#120f0c';
        g.textAlign = 'center';
        g.fillText(num, bx + nw / 2 + 1, ly + 1);
      }
      g.font = '500 15px "DM Mono"';
      g.letterSpacing = '2.5px';
      g.textAlign = dx > 0 ? 'left' : 'right';
      const tx = dx > 0 ? bx + nw + (num ? 10 : 4) : bx - (num ? 10 : 4);
      g.lineJoin = 'round'; g.lineWidth = 5; g.strokeStyle = 'rgba(10,9,8,.82)';
      g.strokeText(m.label.toUpperCase(), tx, ly + 1);
      g.fillStyle = rgba(COL.stone, 1);
      g.fillText(m.label.toUpperCase(), tx, ly + 1);
      g.globalAlpha = 1;
      g.restore();
    }
  }

  // repère local posé au sol : x = vers l'avant (sens de la marche), y = vers la gauche ; 1 = sizePx
  function groundAffine(X, Y, hx, hy, sizePx) {
    const n = Math.hypot(hx, hy) || 1, fx = hx / n, fy = hy / n, eps = 2e-4;
    const p0 = proj(X, Y), x0 = p0.x, y0 = p0.y, k = p0.k;
    const p1 = proj(X + fx * eps, Y + fy * eps), x1 = p1.x, y1 = p1.y;
    const p2 = proj(X - fy * eps, Y + fx * eps), x2 = p2.x, y2 = p2.y;
    const S = sizePx / Ps / eps;
    return { a: (x1 - x0) * S, b: (y1 - y0) * S, c: (x2 - x0) * S, d: (y2 - y0) * S, e: x0, f: y0, k };
  }
  const apply = (A, lx, ly) => [A.a * lx + A.c * ly + A.e, A.b * lx + A.d * ly + A.f];
  function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  const METAL = { dark: 'rgba(38,34,29,.95)', body: 'rgba(132,123,108,.98)', light: 'rgba(196,184,160,.98)' };
  function iconTank(g, tur) {
    g.fillStyle = METAL.dark; rrect(g, -0.5, -0.33, 1.0, 0.66, 0.07); g.fill();
    g.fillStyle = METAL.body; rrect(g, -0.42, -0.22, 0.86, 0.44, 0.06); g.fill();
    g.save(); g.translate(-0.06, 0); g.rotate(tur);
    g.fillStyle = METAL.light; g.fillRect(0.1, -0.035, 0.66, 0.07);
    g.beginPath(); g.ellipse(0, 0, 0.21, 0.17, 0, 0, 7); g.fill();
    g.restore();
  }
  function iconPlane(g) {
    g.fillStyle = METAL.light;
    g.beginPath(); g.moveTo(0.58, 0); g.lineTo(0.12, 0.07); g.lineTo(-0.32, 0.46); g.lineTo(-0.4, 0.46); g.lineTo(-0.3, 0.08);
    g.lineTo(-0.48, 0.06); g.lineTo(-0.5, 0); g.lineTo(-0.48, -0.06); g.lineTo(-0.3, -0.08); g.lineTo(-0.4, -0.46); g.lineTo(-0.32, -0.46); g.lineTo(0.12, -0.07); g.closePath(); g.fill();
  }
  function iconShip(g) {
    g.fillStyle = METAL.body;
    g.beginPath(); g.moveTo(0.55, 0); g.lineTo(0.3, 0.13); g.lineTo(-0.5, 0.13); g.lineTo(-0.5, -0.13); g.lineTo(0.3, -0.13); g.closePath(); g.fill();
    g.fillStyle = METAL.light; g.fillRect(-0.25, -0.07, 0.32, 0.14);
  }
  function iconDozer(g) {
    g.fillStyle = METAL.dark; rrect(g, -0.45, -0.3, 0.8, 0.6, 0.06); g.fill();
    g.fillStyle = METAL.body; rrect(g, -0.32, -0.2, 0.5, 0.4, 0.05); g.fill();
    g.fillStyle = METAL.light; g.fillRect(0.4, -0.42, 0.1, 0.84);
  }
  function iconTruck(g) {
    // automitrailleuse / camion blindé (1948)
    g.fillStyle = METAL.dark; rrect(g, -0.5, -0.27, 1.0, 0.54, 0.06); g.fill();
    g.fillStyle = METAL.body; rrect(g, -0.45, -0.21, 0.58, 0.42, 0.04); g.fill();
    g.fillStyle = METAL.light; rrect(g, 0.17, -0.2, 0.3, 0.4, 0.05); g.fill();
  }
  const ICON = { tank: iconTank, plane: iconPlane, ship: iconShip, dozer: iconDozer, truck: iconTruck };

  function drawZones(g, t, Z = 1) {
    for (const z of WZONES) {
      const A = Z * tw(t, z.t - 0.1, z.t + 0.4) * (1 - tw(t, z.tEnd - 0.6, z.tEnd));
      if (A <= 0.01 || !z.rings.length) continue;
      const p = tw(t, z.t, z.t + (z.dur || 2), E.inOutCubic);
      g.save();
      g.beginPath();
      let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      for (const r of z.rings) r.forEach(([X, Y], i) => { const P = proj(X, Y); if (!i) g.moveTo(P.x, P.y); else g.lineTo(P.x, P.y); bx0 = Math.min(bx0, P.x); by0 = Math.min(by0, P.y); bx1 = Math.max(bx1, P.x); by1 = Math.max(by1, P.y); });
      g.closePath();
      const outline = new Path2D();
      for (const r of z.rings) r.forEach(([X, Y], i) => { const P = proj(X, Y); if (!i) outline.moveTo(P.x, P.y); else outline.lineTo(P.x, P.y); });
      g.clip('evenodd');
      if (p < 1) {
        const O = z.O ? proj(z.O[0], z.O[1]) : { x: (bx0 + bx1) / 2, y: (by0 + by1) / 2 };
        const ox = O.x, oy = O.y;
        const R = Math.max(Math.hypot(bx0 - ox, by0 - oy), Math.hypot(bx1 - ox, by0 - oy), Math.hypot(bx0 - ox, by1 - oy), Math.hypot(bx1 - ox, by1 - oy));
        g.beginPath(); g.arc(ox, oy, Math.max(0.1, R * p), 0, 7); g.clip();
      }
      g.globalCompositeOperation = 'lighter';
      // tone : vermillon (par défaut), 'stone' (l'autre camp), 'life' (terres palestiniennes, en olive),
      // 'cold' (encre froide : territoire attribué à l'État juif en 1947, puis Israël)
      const zc = z.tone === 'stone' ? COL.stone : z.tone === 'life' ? COL.life : z.tone === 'cold' ? COL.cold : COL.ember, zk = z.tone === 'stone' ? 0.45 : z.tone === 'life' ? 0.8 : z.tone === 'cold' ? 0.9 : 1;
      g.fillStyle = rgba(zc, 0.11 * A * zk); g.fillRect(bx0 - 2, by0 - 2, bx1 - bx0 + 4, by1 - by0 + 4);
      g.strokeStyle = rgba(zc, 0.5 * A * zk); g.lineWidth = 1.3;
      g.beginPath();
      const sp = 9, off = (t * 6) % sp;
      for (let x = bx0 - (by1 - by0) - sp + off; x < bx1 + sp; x += sp) { g.moveTo(x, by1); g.lineTo(x + (by1 - by0), by0); }
      g.stroke();
      g.restore();
      g.save();
      g.globalCompositeOperation = 'lighter';
      if (z.outline !== false) {
        g.strokeStyle = rgba(z.tone === 'stone' ? COL.stone : z.tone === 'life' ? COL.lifeHot : z.tone === 'cold' ? COL.coldHot : COL.hot, (z.tone === 'stone' ? 0.6 : 0.85) * A * p); g.lineWidth = 1.7; g.stroke(outline);
        g.strokeStyle = rgba(zc, 0.25 * A * p * zk); g.lineWidth = 6; g.stroke(outline);
      }
      g.restore();
    }
  }

  // plans : tracé progressif (rempart, esplanade, mur mis en évidence, carroyage métrique)
  function drawPlans(g, t, Z) {
    for (const p of PLANS) {
      const A = (p.any ? 1 : Z) * tw(t, p.t - 0.1, p.t + 0.4) * (1 - tw(t, p.tEnd - 0.6, p.tEnd));
      if (A <= 0.01) continue;
      const q = tw(t, p.t, p.t + (p.dur || 1.6), E.inOutCubic);
      g.save();
      if (p.style === 'grid') {
        const [lo0, la0, lo1, la1] = p.bbox, u = M2U((la0 + la1) / 2) * p.step;
        const X0 = MX(lo0), X1 = MX(lo1), Y0 = MY(la0), Y1 = MY(la1);
        g.strokeStyle = rgba(COL.stone, 0.07 * A * q); g.lineWidth = 1; g.beginPath();
        for (let X = X0; X <= X1; X += u) { const a = proj(X, Y0), b = proj(X, Y1); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); }
        for (let Y = Y0; Y <= Y1; Y += u) { const a = proj(X0, Y), b = proj(X1, Y); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); }
        g.stroke(); g.restore(); continue;
      }
      const pts = p.P.map(([X, Y]) => { const P = proj(X, Y); return [P.x, P.y]; });
      if (p.closed) pts.push(pts[0]);
      let len = 0;
      for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      const path = new Path2D();
      pts.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
      if (p.fill && q > 0.98) { g.fillStyle = rgba(p.style === 'sacred' ? COL.ember : COL.stone, p.fill * A * tw(t, p.t + (p.dur || 1.6) - 0.1, p.t + (p.dur || 1.6) + 0.8)); g.fill(path); }
      g.setLineDash([len * q, len + 10]);
      g.lineJoin = 'round';
      if (p.style === 'dash') {
        g.setLineDash([]);
        const cut = new Path2D(); let acc = 0;
        pts.forEach(([x, y], i) => { if (!i) { cut.moveTo(x, y); return; } const [px, py] = pts[i - 1], L = Math.hypot(x - px, y - py); if (acc + L <= len * q) cut.lineTo(x, y); else if (acc < len * q) { const f = (len * q - acc) / L; cut.lineTo(px + (x - px) * f, py + (y - py) * f); } acc += L; });
        g.setLineDash([10, 8]); g.lineDashOffset = -t * 20;
        g.strokeStyle = rgba(COL.ember, 0.75 * A); g.lineWidth = 1.6; g.stroke(cut);
      } else if (p.style === 'focus') {
        g.globalCompositeOperation = 'lighter';
        g.strokeStyle = rgba(COL.ember, 0.35 * A); g.lineWidth = 12; g.stroke(path);
        g.strokeStyle = rgba(COL.hot, 0.95 * A); g.lineWidth = 3.2; g.stroke(path);
      } else if (p.style === 'sacred') {
        g.strokeStyle = rgba(COL.ember, 0.7 * A); g.lineWidth = 1.6; g.stroke(path);
      } else {
        g.strokeStyle = rgba(COL.stone, 0.16 * A); g.lineWidth = 7; g.stroke(path);
        g.strokeStyle = rgba(COL.stone, 0.75 * A); g.lineWidth = 1.8; g.stroke(path);
      }
      g.setLineDash([]);
      if (p.L && p.label) {
        const P = proj(p.L[0], p.L[1]), la = A * tw(t, p.t + (p.labelAt2 || 0.6), p.t + (p.labelAt2 || 0.6) + 0.5, E.outCubic);
        g.globalCompositeOperation = 'source-over';
        g.globalAlpha = la;
        g.font = `${p.big ? 500 : 400} ${p.big ? 15 : 13}px "DM Mono"`; g.letterSpacing = p.big ? '3px' : '2.5px';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 4; g.strokeStyle = 'rgba(10,9,8,.8)'; g.strokeText(p.label.toUpperCase(), P.x, P.y);
        g.fillStyle = p.style === 'focus' ? rgba(COL.hot, 1) : rgba(COL.stone, p.style === 'sacred' ? 0.95 : 0.85);
        g.fillText(p.label.toUpperCase(), P.x, P.y);
      }
      g.restore();
    }
  }

  // colonnes de lumière posées sur la carte (TL.columns, cartes de données) : hauteur en mètres, montée animée,
  // valeur au sommet ; dessinées par-dessus le relief, à toutes les échelles
  const COLUMNS = (TL.columns || []).map((c) => {
    const s0 = SEG.find((x) => x.id === c.seg).start;
    return { ...c, X: MX(c.lon), Y: MY(c.lat), hU: c.h * M2U(c.lat), t: s0 + (c.at || 0), tEnd: c.until !== undefined ? s0 + c.until : TL.total + 1 };
  });
  function drawColumns(g, t) {
    if (!COLUMNS.length) return;
    const fade = 1 - tw(t, TL.total - TL.fadeOut - 0.4, TL.total - 0.2);
    const L = COLUMNS.map((c) => { const Q = proj(c.X, c.Y); return { c, P: { x: Q.x, y: Q.y, k: Q.k } }; }).sort((a, b) => a.P.y - b.P.y); // proj rend toujours le même objet
    g.save();
    for (const { c, P } of L) {
      const A = tw(t, c.t, c.t + 0.35) * (1 - tw(t, c.tEnd - 0.6, c.tEnd)) * fade;
      if (A <= 0.01) continue;
      const grow = E.outCubic(tw(t, c.t, c.t + 1.2));
      const hp = Math.max(2, c.hU * Ps * P.k * Psp * grow), w = (c.w || 10) * P.k, x = P.x, y0 = P.y, y1 = P.y - hp;
      const hot = c.cold ? COL.stone : COL.hot;
      // empreinte au sol, puis le fût : sombre en bas, brûlant en haut
      g.globalAlpha = A;
      g.fillStyle = 'rgba(0,0,0,.5)';
      g.beginPath(); g.ellipse(x + 2, y0 + 1, w * 0.9, w * 0.9 * Pcp, 0, 0, 6.2832); g.fill();
      const gr = g.createLinearGradient(0, y0, 0, y1);
      gr.addColorStop(0, rgba(COL.ember, c.cold ? 0.25 : 0.35));
      gr.addColorStop(1, rgba(hot, 0.95));
      g.fillStyle = gr;
      g.fillRect(x - w / 2, y1, w, hp);
      g.fillStyle = rgba(hot, 0.9);
      g.beginPath(); g.ellipse(x, y1, w / 2, (w / 2) * Pcp, 0, 0, 6.2832); g.fill();
      g.globalCompositeOperation = 'lighter';
      if (!c.cold) {
        sprite(g, SPR.hot, x, y1, w * 7, 0.55 * A);
        sprite(g, SPR.ember, x, y0, w * 9, 0.35 * A, w * 9 * Pcp);
      }
      g.globalCompositeOperation = 'source-over';
      // la valeur, au-dessus du sommet
      if (c.value) {
        const la = A * tw(t, c.t + 0.8, c.t + 1.3);
        g.globalAlpha = la;
        g.font = c.cold ? '760 18px "Archivo"' : '760 24px "Archivo"';
        g.letterSpacing = '0.5px';
        g.textAlign = 'center';
        g.textBaseline = 'alphabetic';
        g.fillStyle = rgba(c.cold ? COL.stone : COL.hot, 1);
        g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = 10;
        g.fillText(c.value, x + (c.vx || 0), y1 - 12 + (c.vy || 0));
        g.shadowBlur = 0;
      }
      g.globalAlpha = 1;
    }
    g.restore();
  }

  // maisons : prismes en relief (pierre) ; à `tf` elles s'écroulent : poussière, gravats, empreinte
  const roofCol = [126, 116, 100], wallLit = [86, 78, 66], wallDark = [36, 32, 28];
  function drawBlocks(g, t, Z) {
    if (!BLOCKS.length || Z <= 0.01) return;
    const L = [];
    for (const b of BLOCKS) {
      const A = Z * tw(t, b.t, b.t + 0.5) * (1 - tw(t, TL.total - TL.fadeOut - 0.4, TL.total - 0.2));
      if (A <= 0.01) continue;
      const P0 = proj(b.X, b.Y);
      L.push({ b, A, y: P0.y, x: P0.x, k: P0.k, base: b.C.map(([X, Y]) => { const P = proj(X, Y); return [P.x, P.y]; }) });
    }
    L.sort((p, q) => p.y - q.y);
    g.save();
    for (const { b, A, base, x, y, k } of L) {
      const d = b.tf !== undefined ? t - b.tf : -1;
      const grow = E.outCubic(tw(t, b.t, b.t + 0.7));
      const fall = d > 0 ? E.inCubic(clamp(d / 0.5)) : 0;
      const sz = b.wU * Ps * k;
      const hp = b.hU * Ps * k * Psp * grow * (1 - fall);
      const sh = d > 0 && d < 0.5 ? Math.sin(d * 70) * 1.2 * (1 - d / 0.5) : 0;
      const roof = base.map(([bx, by]) => [bx + sh + b.tilt * (1 - fall) * 0, by - hp]);
      g.globalAlpha = A;
      // empreinte au sol (ombre, puis gravats)
      g.beginPath(); base.forEach(([bx, by], i) => (i ? g.lineTo(bx + 3, by + 3) : g.moveTo(bx + 3, by + 3))); g.closePath();
      g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
      if (fall < 1) {
        // murs : de l'arrière vers l'avant, éclairés selon leur orientation
        const faces = [0, 1, 2, 3].map((i) => { const j = (i + 1) % 4; return { i, j, my: (base[i][1] + base[j][1]) / 2 }; }).sort((p, q) => p.my - q.my);
        for (const { i, j } of faces) {
          const ex = base[j][0] - base[i][0], ey = base[j][1] - base[i][1];
          const lit = clamp(0.5 + 0.5 * Math.cos(Math.atan2(ey, ex) - 0.6));
          g.fillStyle = `rgb(${wallDark.map((c, n) => Math.round(lerp(c, wallLit[n], lit))).join(',')})`;
          g.beginPath(); g.moveTo(base[i][0], base[i][1]); g.lineTo(base[j][0], base[j][1]); g.lineTo(roof[j][0], roof[j][1]); g.lineTo(roof[i][0], roof[i][1]); g.closePath(); g.fill();
        }
        g.beginPath(); roof.forEach(([rx, ry], i) => (i ? g.lineTo(rx, ry) : g.moveTo(rx, ry))); g.closePath();
        g.fillStyle = `rgb(${roofCol.join(',')})`; g.fill();
        g.strokeStyle = rgba(COL.stone, 0.55); g.lineWidth = 0.8; g.stroke();
        // fenêtre allumée (nuit)
        if (b.lit && d < 0) {
          g.globalCompositeOperation = 'lighter';
          sprite(g, SPR.hot, (roof[0][0] + roof[2][0]) / 2, (roof[0][1] + roof[2][1]) / 2 + hp * 0.45, sz * 1.1, 0.35 * A * (0.8 + 0.2 * noise1(t * 3 + b.X * 1e4)));
          g.globalCompositeOperation = 'source-over';
        }
      }
      if (d > 0) {
        // gravats
        const rb = tw(d, 0.15, 0.6);
        g.fillStyle = `rgba(70,63,54,${0.95 * rb})`;
        for (const [DX, DY, s2] of b.deb) { const P = proj(DX, DY); const r = s2 * sz * 0.22; g.fillRect(P.x - r, P.y - r * Pcp, r * 2, r * 2 * Pcp); }
        // empreinte : la maison disparue, en pointillés de braise
        const ga = tw(d, 0.9, 2.0) * A;
        if (ga > 0.01) {
          g.globalCompositeOperation = 'lighter';
          g.setLineDash([3, 3]); g.strokeStyle = rgba(COL.ember, 0.75 * ga); g.lineWidth = 1.1;
          g.beginPath(); base.forEach(([bx, by], i) => (i ? g.lineTo(bx, by) : g.moveTo(bx, by))); g.closePath(); g.stroke();
          g.setLineDash([]);
          g.globalCompositeOperation = 'source-over';
        }
        // éclat et poussière qui monte
        g.globalCompositeOperation = 'lighter';
        if (d < 0.5) sprite(g, SPR.hot, x, y, sz * 4, 0.45 * Math.exp(-d / 0.12));
        g.globalCompositeOperation = 'source-over';
        for (let j = 0; j < 4; j++) {
          const age = d - j * 0.12;
          if (age <= 0 || age > 4) continue;
          const s3 = sz * (1.4 + age * 1.6), rise = age * sz * 0.9;
          g.globalAlpha = 0.34 * A * Math.exp(-age / 1.3);
          g.drawImage(SMOKE[(j + Math.floor(b.X * 1e5)) & 3], x - s3 / 2 + age * sz * 0.4, y - rise - s3 / 2, s3, s3);
        }
      }
      g.globalAlpha = 1;
    }
    g.restore();
  }

  function drawLights(g, t, Z = 1) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (const l of LIGHTS) {
      const A = Z * tw(t, l.t - 0.1, l.t + 1.2) * (1 - tw(t, l.tEnd - 0.6, l.tEnd));
      if (A <= 0.01) continue;
      for (const [X, Y, a, b] of l.pts) {
        // extinction en cascade sur ~1,5 s, quelques lumières résistent (groupes électrogènes)
        const off = l.offT !== undefined ? (b < (l.keep || 0.06) ? 0 : 1 - tw(t, l.offT + a * 1.5, l.offT + a * 1.5 + 0.15)) : 1;
        const fl = b < (l.keep || 0.06) && l.offT !== undefined && t > l.offT ? 0.6 + 0.4 * noise1(t * 6 + a * 50) : 1;
        const v = A * (0.35 + 0.65 * b) * (off || (b < (l.keep || 0.06) ? fl : 0));
        if (v <= 0.02) continue;
        const P = proj(X, Y);
        if (P.k < KMIN + 0.05) continue;
        sprite(g, a < 0.88 ? SPR.life : SPR.stone, P.x, P.y, (a < 0.88 ? 8 : 16) * P.k + 2, 0.78 * v);
      }
    }
    g.restore();
  }

  // fusées éclairantes : un point incandescent descend lentement sous son parachute et éclaire le sol
  function drawFlares(g, t) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (const f of FLARES) {
      const d = t - f.t, D = f.dur || 5;
      if (d < 0 || d > D + 0.4) continue;
      const P = proj(f.X, f.Y), k = P.k;
      const life = tw(d, 0, 0.3) * (1 - tw(d, D - 0.8, D + 0.3));
      const fl = 0.82 + 0.18 * noise1(t * 13 + f.X * 1e5);
      const alt = (f.alt || 300) * (1 - 0.75 * d / D) * k;
      const sway = Math.sin(d * 1.1 + f.X * 1e4) * 14 * k;
      const x = P.x + sway, y = P.y - alt;
      sprite(g, SPR.stone, P.x + sway * 0.4, P.y, 700 * k, 0.085 * life * fl, 700 * k * Pcp);
      sprite(g, SPR.white, P.x + sway * 0.4, P.y, 260 * k, 0.05 * life * fl, 260 * k * Pcp);
      g.strokeStyle = rgba(COL.stone, 0.18 * life); g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - sway * 0.6, y - 50 * k, x - sway * 0.2, y - 110 * k); g.stroke();
      sprite(g, SPR.hot, x, y, 110 * k, 0.55 * life * fl);
      sprite(g, SPR.white, x, y, 34 * k + 8, life * fl);
    }
    g.restore();
  }

  function drawArrows(g, t, Z = 1) {
    for (const a of ARROWS) {
      const A = Z * tw(t, a.t - 0.1, a.t + 0.3) * (1 - tw(t, a.tEnd - 0.6, a.tEnd));
      if (A <= 0.01) continue;
      const p = E.inOutSine(clamp((t - a.t) / (a.dur || 2)));
      if (p <= 0.01) continue;
      const N = 40, L = a.pa.len * p, w0 = (a.w || 14);
      const left = [], right = [];
      let last = null;
      for (let j = 0; j <= N; j++) {
        const [X, Y, hx, hy] = along(a.pa, (j / N) * L * 0.94);
        const P = proj(X, Y), x = P.x, y = P.y, k = P.k;
        const Q = proj(X + hx * 1e-3, Y + hy * 1e-3);
        let dx = Q.x - x, dy = Q.y - y; const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
        const w = w0 * k * (0.45 + 0.55 * (j / N));
        left.push([x - dy * w, y + dx * w]); right.push([x + dy * w, y - dx * w]);
        last = { x, y, dx, dy, w };
      }
      const [TX, TY] = along(a.pa, L);
      const T = proj(TX, TY), tx = T.x, ty = T.y;
      const hw = last.w * 2.1;
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.beginPath();
      left.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.lineTo(last.x - last.dy * hw, last.y + last.dx * hw);
      g.lineTo(tx, ty);
      g.lineTo(last.x + last.dy * hw, last.y - last.dx * hw);
      for (let i = right.length - 1; i >= 0; i--) g.lineTo(right[i][0], right[i][1]);
      g.closePath();
      const st = a.tone === 'stone', c1 = st ? COL.stone : COL.ember, c2 = st ? COL.stone : COL.hot, ak = st ? 0.7 : 1;
      const grd = g.createLinearGradient(left[0][0], left[0][1], tx, ty);
      grd.addColorStop(0, rgba(c1, 0.05 * A * ak)); grd.addColorStop(0.6, rgba(c1, 0.4 * A * ak)); grd.addColorStop(1, rgba(c2, 0.65 * A * ak));
      g.fillStyle = grd; g.fill();
      g.strokeStyle = rgba(c2, 0.7 * A * ak); g.lineWidth = 1.4; g.stroke();
      sprite(g, st ? SPR.stone : SPR.hot, tx, ty, 120, 0.6 * A * ak);
      g.restore();
      if (a.label && p > 0.35) {
        const [LX, LY] = along(a.pa, L * 0.5);
        const P = proj(LX, LY), lx = P.x, ly = P.y;
        g.save();
        g.globalAlpha = A * tw(p, 0.35, 0.6);
        g.font = '500 14px "DM Mono"'; g.letterSpacing = '2.5px'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 4; g.strokeStyle = 'rgba(10,9,8,.85)'; g.strokeText(a.label.toUpperCase(), lx, ly - 22);
        g.fillStyle = rgba(COL.stone, 1); g.fillText(a.label.toUpperCase(), lx, ly - 22);
        g.restore();
      }
    }
  }

  function drawUnits(g, t) {
    for (const u of UNITS) {
      const A = tw(t, u.t - 0.2, u.t + 0.3) * (1 - tw(t, u.tEnd - 0.5, u.tEnd));
      if (A <= 0.01) continue;
      const lin = u.kind === 'plane' || u.kind === 'ship';
      const p = lin ? clamp((t - u.t) / u.dur) : E.inOutSine(clamp((t - u.t) / u.dur));
      const size = u.size || (u.kind === 'plane' ? 30 : u.kind === 'ship' ? 34 : 22);
      const space = (u.spacing || 1.7) * size / Ps;
      for (let k = 0; k < u.n; k++) {
        const row = Math.floor(k / 3), col = (k % 3) - 1;
        const d = p * u.pa.len - row * space * (u.kind === 'plane' ? 1.4 : 1) - Math.abs(col) * space * 0.5;
        if (d < -space * 0.5 && p < 1) continue;
        let [X, Y, hx, hy] = along(u.pa, d);
        const nn = Math.hypot(hx, hy) || 1;
        X += (-hy / nn) * col * space * 0.75; Y += (hx / nn) * col * space * 0.75;
        const Aff = groundAffine(X, Y, hx, hy, size);
        if (Aff.k < KMIN + 0.05) continue;
        const moving = p > 0 && p < 1;
        // tir : tourelle vers la cible, éclair à la bouche, traçante
        let tur = 0.06 * Math.sin(t * 1.3 + k), fireA = 0, tgt = null;
        for (const f of u.fires) {
          const dt = t - (f.t + k * 0.12);
          if (dt > -0.6 && dt < 0.5) {
            const fx = f.X - X, fy = f.Y - Y, h = Math.atan2(hy, hx);
            tur = Math.atan2(fy, fx) - h;
            if (dt >= 0) { fireA = Math.exp(-dt / 0.08); tgt = proj(f.X, f.Y); tgt = { x: tgt.x, y: tgt.y, dt }; }
          }
        }
        g.save();
        // ombre au sol
        g.setTransform(Aff.a, Aff.b, Aff.c, Aff.d, Aff.e + 3, Aff.f + 4);
        g.globalAlpha = 0.45 * A;
        g.fillStyle = '#000';
        if (u.kind === 'plane') { g.setTransform(Aff.a * 0.9, Aff.b * 0.9, Aff.c * 0.9, Aff.d * 0.9, Aff.e, Aff.f); g.globalAlpha = 0.3 * A; iconPlane(g); }
        else { rrect(g, -0.52, -0.36, 1.04, 0.72, 0.08); g.fill(); }
        // poussière (chars, bulldozers) ou sillage (navires)
        g.setTransform(1, 0, 0, 1, 0, 0);
        if (moving && (u.kind === 'tank' || u.kind === 'dozer' || u.kind === 'truck')) {
          g.globalCompositeOperation = 'lighter';
          for (let j = 1; j <= 4; j++) { const [bx, by] = apply(Aff, -0.6 - j * 0.45, Math.sin(t * 9 + j + k) * 0.12); sprite(g, SPR.stone, bx, by, (14 + j * 9) * Aff.k, 0.09 * A * (1 - j / 5)); }
          g.globalCompositeOperation = 'source-over';
        }
        if (u.kind === 'ship' && moving) {
          g.strokeStyle = rgba(COL.stone, 0.35 * A); g.lineWidth = 1.2; g.beginPath();
          const [sx, sy] = apply(Aff, 0.5, 0), [l1x, l1y] = apply(Aff, -2.6, 0.9), [l2x, l2y] = apply(Aff, -2.6, -0.9);
          g.moveTo(l1x, l1y); g.lineTo(sx, sy); g.lineTo(l2x, l2y); g.stroke();
        }
        // l'engin
        const lift = u.kind === 'plane' ? (u.alt || 70) * Aff.k : 0;
        g.globalAlpha = A;
        if (u.kind === 'plane') {
          // traînées
          g.strokeStyle = rgba(COL.stone, 0.22 * A); g.lineWidth = 1.2; g.beginPath();
          for (const s2 of [-0.42, 0.42]) { const [a1, b1] = apply(Aff, -0.4, s2), [a2, b2] = apply(Aff, -7, s2); g.moveTo(a1, b1 - lift); g.lineTo(a2, b2 - lift); }
          g.stroke();
        }
        g.setTransform(Aff.a, Aff.b, Aff.c, Aff.d, Aff.e, Aff.f - lift);
        (ICON[u.kind] || iconTank)(g, tur);
        g.setTransform(1, 0, 0, 1, 0, 0);
        if (fireA > 0.02 && tgt) {
          g.globalCompositeOperation = 'lighter';
          const ca = Math.cos(tur), sa = Math.sin(tur);
          const [mx, my] = apply(Aff, -0.06 + 0.8 * ca, 0.8 * sa);
          sprite(g, SPR.white, mx, my, 70 * Aff.k, fireA);
          sprite(g, SPR.hot, mx, my, 160 * Aff.k, 0.8 * fireA);
          if (tgt.dt < 0.22) {
            const q = tgt.dt / 0.22, x1 = lerp(mx, tgt.x, q), y1 = lerp(my, tgt.y, q), x0 = lerp(mx, tgt.x, Math.max(0, q - 0.35)), y0 = lerp(my, tgt.y, Math.max(0, q - 0.35));
            g.strokeStyle = rgba(COL.hot, 0.95); g.lineWidth = 2.2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
          }
        }
        g.restore();
      }
    }
  }

  // frappes : éclair, onde de choc au sol, feu, colonne de fumée qui monte
  function strikeSources(t, sources) {
    for (const st of STRIKES) {
      const d = t - st.t;
      if (d < 0 || d > st.burn + 1) continue;
      const P = proj(st.X, st.Y);
      sources.push({ gx: P.gx, gy: P.gy, amt: (0.9 * Math.exp(-d / 1.2) + 0.35 * (1 - d / (st.burn + 1))) * st.pow, R: 110 * st.pow, waves: [] });
    }
  }
  function drawStrikes(g, t) {
    for (const st of STRIKES) {
      const d = t - st.t;
      if (d < -0.05 || d > st.burn + 3) continue;
      const P = proj(st.X, st.Y), x = P.x, y = P.y, k = P.k, pw = st.pow;
      if (k < KMIN + 0.05) continue;
      g.save();
      if (st.smoke !== false && d > 0) {
        g.globalCompositeOperation = 'source-over';
        for (let j = 0; j < 7; j++) {
          const age = d - j * 0.28;
          if (age <= 0) continue;
          const fade = Math.exp(-age / 3) * (1 - clamp((d - st.burn) / 3));
          const sz = (26 + age * 20) * k * pw, rise = age * 30 * k * pw;
          g.globalAlpha = 0.32 * fade;
          g.drawImage(SMOKE[j % 4], x + Math.sin(j * 1.7) * 8 * k + age * 7 * k - sz / 2, y - rise - sz / 2, sz, sz);
        }
      }
      g.globalCompositeOperation = 'lighter';
      if (d >= 0 && d < st.burn) sprite(g, SPR.ember, x, y, 90 * k * pw, (0.5 + 0.2 * noise1(t * 9 + st.X * 100)) * (1 - d / st.burn), 60 * k * pw);
      if (d >= -0.05 && d < 0.4) {
        const e = d < 0 ? 0.4 : 1 - d / 0.4;
        sprite(g, SPR.white, x, y, 140 * k * pw, e);
        sprite(g, SPR.hot, x, y, 360 * k * pw, 0.8 * e, 240 * k * pw);
      }
      if (d >= 0 && d < 0.9) {
        const r = (8 + d * 200) * k * pw;
        g.strokeStyle = rgba(COL.hot, (1 - d / 0.9) * 0.9); g.lineWidth = 2;
        g.beginPath(); g.ellipse(x, y, r, r * Pcp, 0, 0, 7); g.stroke();
      }
      g.restore();
    }
  }

  function drawFlows(g, t) {
    g.save();
    g.lineCap = 'round';
    for (const f of FLOWS) {
      const A = flowA(f, t);
      if (A <= 0.01) continue;
      // trajet guide en pointillés, tracé progressivement, avec une pointe de flèche
      const gp = tw(t, f.t, f.t + 1.4, E.outCubic);
      if (gp > 0.005) {
        g.beginPath();
        const N = 40;
        for (let j = 0; j <= N; j++) {
          const [X, Y] = bezAt(f.guide, (j / N) * gp);
          const P = proj(X, Y);
          if (j === 0) g.moveTo(P.x, P.y); else g.lineTo(P.x, P.y);
        }
        g.setLineDash([3, 9]);
        g.lineDashOffset = -t * 26;
        g.strokeStyle = rgba(COL.stone, 0.4 * A);
        g.lineWidth = 1.5;
        g.stroke();
        g.setLineDash([]);
        const [Xa, Ya] = bezAt(f.guide, gp), [Xb, Yb] = bezAt(f.guide, Math.max(0, gp - 0.04));
        const pa = { ...proj(Xa, Ya) }, pb = proj(Xb, Yb);
        const an = Math.atan2(pa.y - pb.y, pa.x - pb.x), L = 13 * pa.k;
        g.strokeStyle = rgba(COL.stone, 0.75 * A);
        g.lineWidth = 1.8;
        g.beginPath();
        g.moveTo(pa.x - Math.cos(an - 0.5) * L, pa.y - Math.sin(an - 0.5) * L); g.lineTo(pa.x, pa.y);
        g.lineTo(pa.x - Math.cos(an + 0.5) * L, pa.y - Math.sin(an + 0.5) * L);
        g.stroke();
      }
      // traînées
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = rgba(f.cold ? COL.stone : COL.life, 0.42 * A);
      g.lineWidth = 1.5;
      g.beginPath();
      const heads = [];
      for (const p of f.P) {
        const u = (t - p.t0) / p.tt;
        if (u <= 0 || u >= 1) continue;
        const [X, Y] = bezAt(p, E.inOutSine(u));
        const [X2, Y2] = bezAt(p, E.inOutSine(Math.max(0, u - 0.1)));
        const a = proj(X, Y), x = a.x, y = a.y, k = a.k;
        const b = proj(X2, Y2);
        g.moveTo(b.x, b.y); g.lineTo(x, y);
        heads.push(x, y, k * p.sz, Math.min(1, u * 6) * Math.min(1, (1 - u) * 5 + 0.35));
      }
      g.stroke();
      for (let i = 0; i < heads.length; i += 4) sprite(g, f.cold ? SPR.stone : SPR.life, heads[i], heads[i + 1], 15 * heads[i + 2] + 4, A * heads[i + 3]);
      // arrivés : ils restent, petits points chauds tassés à destination
      g.fillStyle = rgba(f.cold ? COL.stone : COL.lifeHot, 0.6 * A);
      g.beginPath();
      for (const p of f.P) {
        if (t < p.t0 + p.tt) continue;
        const P = proj(p.X1, p.Y1), r = 1.5 * P.k;
        g.rect(P.x - r, P.y - r, r * 2, r * 2);
      }
      g.fill();
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
    }
    g.restore();
  }

  function drawRenames(g, t) {
    g.save();
    g.textBaseline = 'middle';
    for (const r of RENAMES) {
      const A = tw(t, r.t - 0.1, r.t + 0.3) * (1 - tw(t, r.tEnd - 0.6, r.tEnd));
      if (A <= 0.01) continue;
      const p = { ...proj(r.X, r.Y) };
      if (p.k < KMIN + 0.05) continue;
      const dir = r.dir || 1, ts = r.t + (r.strike || 1.3), tn = ts + (r.gap || 0.45);
      const old = r.from.toUpperCase(), neu = r.to.toUpperCase();
      // le lieu
      const dead = tw(t, ts, ts + 0.35);
      g.fillStyle = rgba(dead > 0.5 ? COL.stone : COL.life, 0.9 * A);
      g.fillRect(p.x - 3, p.y - 3, 6, 6);
      if (dead < 0.5) sprite(g, SPR.stone, p.x, p.y, 22, 0.25 * A);
      // l'ancien nom, tapé lettre à lettre, puis barré
      g.font = '500 20px "DM Mono"'; g.letterSpacing = '3px';
      g.textAlign = dir > 0 ? 'left' : 'right';
      const x0 = p.x + dir * 14, n = Math.floor(old.length * clamp((t - r.t) / 0.45));
      const shown = old.slice(0, n), w = g.measureText(old).width;
      g.fillStyle = rgba(COL.life, (1 - 0.35 * dead) * A);
      g.fillText(shown, x0, p.y + 1);
      if (t > ts) {
        const q = E.outCubic(clamp((t - ts) / 0.35)), xa = dir > 0 ? x0 - 4 : x0 + 4, xb = dir > 0 ? x0 + (w + 4) * q : x0 - (w + 4) * q;
        g.strokeStyle = rgba(COL.ember, 0.95 * A); g.lineWidth = 2.4;
        g.beginPath(); g.moveTo(xa, p.y + 1); g.lineTo(xb, p.y + 1); g.stroke();
        if (q < 1) sprite(g, SPR.hot, xb, p.y + 1, 26, 0.8 * A);
      }
      // le nouveau nom, au-dessus
      if (t > tn) {
        g.font = '600 23px "DM Mono"'; g.letterSpacing = '3.5px';
        const m = Math.floor(neu.length * clamp((t - tn) / 0.45));
        g.fillStyle = rgba(COL.stone, 0.95 * A);
        g.fillText(neu.slice(0, m), x0, p.y - 30);
      }
    }
    g.restore();
  }

  function drawNets(g, t) {
    for (const nt of NETS) {
      const A = tw(t, nt.t - 0.2, nt.t + 0.6) * (1 - tw(t, nt.tEnd - 0.8, nt.tEnd));
      if (A <= 0.01) continue;
      g.save();
      g.lineCap = 'round';
      // proj() renvoie toujours le même objet : on copie chaque position
      const H = { ...proj(nt.HX, nt.HY) }, P = nt.N.map((n) => ({ ...proj(n.X, n.Y) }));
      const at = (i) => (i < 0 ? H : P[i]);
      // cible : anneaux qui pulsent
      for (let j = 0; j < 3; j++) {
        const q = (t * 0.55 + j / 3) % 1, rr = (26 + q * 110) * H.k;
        g.strokeStyle = rgba(COL.ember, 0.55 * (1 - q) * A); g.lineWidth = 1.6;
        g.beginPath(); g.arc(H.x, H.y, rr, 0, 6.283); g.stroke();
      }
      sprite(g, SPR.ember, H.x, H.y, 60 * H.k, 0.5 * A);
      // liens, puis messages qui remontent vers la cible
      g.lineWidth = 1.4;
      nt.N.forEach((n, i) => {
        if (t < n.t0) return;
        const p = P[i], q = at(n.par), grow = tw(t, n.t0, n.t0 + 0.35, E.outCubic);
        const live = t < n.off ? 1 : 1 - tw(t, n.off, n.off + 0.5);
        if (live <= 0.01) return;
        g.strokeStyle = rgba(COL.ember, 0.42 * A * live);
        g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(q.x + (p.x - q.x) * grow, q.y + (p.y - q.y) * grow); g.stroke();
        if (grow >= 1 && t < n.off) {
          const m = (t * 0.7 + n.ph) % 1;
          sprite(g, SPR.hot, p.x + (q.x - p.x) * m, p.y + (q.y - p.y) * m, 14 * p.k + 3, 0.7 * A * Math.sin(Math.PI * m));
        }
      });
      // profils : rond sombre cerclé de braise, silhouette au centre ; supprimés : éclair puis croix
      nt.N.forEach((n, i) => {
        if (t < n.t0) return;
        const p = P[i], s = (nt.size || 12) * n.sz * p.k + 2;
        if (t < n.off) {
          const ap = E.outBack(clamp((t - n.t0) / 0.3)), R = s * ap;
          if (R <= 0.3) return;
          g.fillStyle = 'rgba(13,12,10,.9)'; g.strokeStyle = rgba(COL.ember, 0.95 * A); g.lineWidth = 1.4;
          g.beginPath(); g.arc(p.x, p.y, R, 0, 6.283); g.fill(); g.stroke();
          g.fillStyle = rgba(COL.hot, 0.9 * A);
          g.beginPath(); g.arc(p.x, p.y - R * 0.22, R * 0.3, 0, 6.283); g.fill();
          g.beginPath(); g.arc(p.x, p.y + R * 0.62, R * 0.52, Math.PI, 2 * Math.PI); g.fill();
        } else {
          const d = t - n.off;
          if (d < 0.5) sprite(g, SPR.white, p.x, p.y, 46 * p.k + 6, (1 - d / 0.5) * A);
          const ga = 0.35 * A * tw(d, 0.08, 0.4) * (1 - tw(t, nt.tEnd - 0.8, nt.tEnd));
          if (ga > 0.01) {
            g.strokeStyle = rgba(COL.ash, ga); g.lineWidth = 1.3;
            const c = s * 0.6;
            g.beginPath(); g.moveTo(p.x - c, p.y - c); g.lineTo(p.x + c, p.y + c); g.moveTo(p.x + c, p.y - c); g.lineTo(p.x - c, p.y + c); g.stroke();
          }
        }
      });
      g.restore();
    }
  }

  // mot : 1 au repos, baisse quand la caméra file (les détails fins deviennent un voile)
  // ------------------------------------------------------------ carte du partage (1947)
  // Relief éclairé comme une maquette, découpé en morceaux (data/partage.js) ; une lame trace les
  // frontières, chaque morceau prend la couleur de son État, puis les morceaux se décollent.
  // Tous les temps viennent de la timeline (TL.partage), pour que le son et l'image restent calés.
  const PTD = TL.partage && window.PARTAGE ? window.PARTAGE : null;
  const PART = PTD ? (() => {
    const C = TL.partage;
    const at = (o) => (o ? SEG.find((x) => x.id === o.seg).start + (o.at || 0) : 1e9);
    const stateOf = (k) => (k.startsWith('arabe') || k === 'jaffa' ? 'arabe' : k.startsWith('juif') ? 'juif' : 'jer');
    const inRings = (rings, X, Y) => {
      let c = false;
      for (const P of rings) for (let a = 0, b = P.length - 1; a < P.length; b = a++) if ((P[a][1] > Y) !== (P[b][1] > Y) && X < ((P[b][0] - P[a][0]) * (Y - P[a][1])) / (P[b][1] - P[a][1]) + P[a][0]) c = !c;
      return c;
    };
    const pieces = Object.entries(PTD.sections).map(([k, polys]) => {
      const rings = polys.flatMap((p) => p.map((r) => r.map(([lo, la]) => [MX(lo), MY(la)])));
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, sx = 0, sy = 0, n = 0;
      for (const [X, Y] of polys[0][0].map(([lo, la]) => [MX(lo), MY(la)])) { sx += X; sy += Y; n++; }
      for (const r of rings) for (const [X, Y] of r) { x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y); }
      const tint = (C.tint || {})[k];
      return { k, state: stateOf(k), rings, b: [x0, y0, x1, y1], cX: sx / n, cY: sy / n, tintT: tint ? at(tint) : 1e9, tintDur: (tint && tint.dur) || 0.9 };
    });
    const pieceAt = (X, Y) => pieces.findIndex((p) => X >= p.b[0] && X <= p.b[2] && Y >= p.b[1] && Y <= p.b[3] && inRings(p.rings, X, Y));
    const lines = PTD.lines.map((l, i) => {
      const sch = (C.blade || [])[i];
      const P = (sch && sch.rev ? [...l].reverse() : l).map(([lo, la]) => [MX(lo), MY(la)]), L = [0];
      for (let j = 1; j < P.length; j++) L.push(L[j - 1] + Math.hypot(P[j][0] - P[j - 1][0], P[j][1] - P[j - 1][1]));
      return { P, L, len: L[L.length - 1], t0: sch ? at(sch) : 1e9, t1: sch ? at(sch) + sch.dur : 1e9 };
    });
    const r = mulberry32(1947);
    const locs = [];
    const addLoc = (list, kind, o) => list.forEach(([lo, la]) => {
      const X = MX(lo), Y = MY(la);
      // balayage du nord au sud, avec un peu de désordre
      const q = clamp((33.35 - la) / 3.9 + (r() - 0.5) * 0.18);
      locs.push({ X, Y, kind, p: pieceAt(X, Y), t: at(o) + q * (o ? o.dur || 3 : 0), a: 0.75 + 0.5 * r(), ph: r() * 6.28 });
    });
    addLoc(PTD.localites.arabe, 'arabe', C.dotsArabe);
    addLoc(PTD.localites.juif, 'juif', C.dotsJuif);
    // villes : un halo par communauté, proportionnel à la population
    const towns = [];
    for (const [n, lo, la, ar, ju] of PTD.villes) {
      const X = MX(lo), Y = MY(la), p = pieceAt(X, Y);
      const q = clamp((33.35 - la) / 3.9);
      if (ar) towns.push({ X: X - (ju ? 0.00018 : 0), Y, kind: 'arabe', pop: ar, p, t: at(C.dotsArabe) + q * ((C.dotsArabe && C.dotsArabe.dur) || 3) });
      if (ju) towns.push({ X: X + (ar ? 0.00018 : 0), Y, kind: 'juif', pop: ju, p, t: at(C.dotsJuif) + q * ((C.dotsJuif && C.dotsJuif.dur) || 3) });
    }
    // mentions tapées à la machine, posées sur la carte
    const labels = (C.labels || []).map((l) => { const X = MX(l.lon), Y = MY(l.lat); return { ...l, X, Y, p: l.free ? -1 : pieceAt(X, Y), t: at(l), tEnd: l.until ? at({ seg: l.seg, at: l.until }) : 1e9 }; });
    // vote : chaque groupe s'allume polygone par polygone, mêlé aux autres groupes
    const vote = C.vote ? (() => {
      const t0 = at(C.vote), d = C.vote.dur || 5;
      // instants calés sur les déclics de la bande-son (TL.partage.vote.ticks, relatifs au début du vote)
      const ticks = (C.vote.ticks || []).map((x) => t0 + x);
      const snap = (x) => (ticks.length ? ticks.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a)) : x);
      const groups = ['pour', 'contre', 'abstention', 'absent'].map((g) => ({ g, polys: (PTD.vote[g] || []).map((ring) => ({ P: ring.map(([lo, la]) => [MX(lo), MY(la)]), t: snap(t0 + Math.pow(r(), 0.85) * d) })) }));
      const others = (PTD.vote.autres || []).map((ring) => ring.map(([lo, la]) => [MX(lo), MY(la)]));
      return { t0, d, groups, others, tEnd: at({ seg: C.vote.seg, at: C.vote.until || 99 }) };
    })() : null;
    const marks = (C.marks || []).map((m) => ({ ...m, X: MX(m.lon), Y: MY(m.lat), t: at(m), tEnd: at({ seg: m.seg, at: m.until }) }));
    return { C, at, pieces, lines, locs, towns, labels, vote, marks, T: (k) => at(C[k]) };
  })() : null;

  // ---- textures de relief : niveaux de gris (ombrage calculé hors ligne), en coordonnées Mercator
  const RLF = {};
  async function loadRelief() {
    if (!PTD) return;
    // relief de la Palestine (data/partage.js) et, au-delà, de la région et du monde (data/relief-plus.js)
    await Promise.all(Object.entries({ ...PTD.relief, ...(window.RELIEF_PLUS || {}) }).map(([k, m]) => new Promise((done) => {
      const img = new Image();
      img.onload = () => {
        const c = canvas(img.naturalWidth, img.naturalHeight), g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data, a = new Uint8Array(c.width * c.height);
        for (let i = 0; i < a.length; i++) a[i] = d[i * 4];
        const [X0, Y0, X1, Y1] = m.bbox;
        RLF[k] = { a, w: c.width, h: c.height, X0, Y0, X1, Y1, su: c.width / (X1 - X0), sv: c.height / (Y1 - Y0) };
        if (!(TL.partage.light || TL.partage.haze)) { done(); return; }
        // lumière rasante (rouge) et creux des vallées (vert) : tools/prep_relief_lumiere.py
        const ix = new Image();
        ix.onload = () => {
          const cx = canvas(ix.naturalWidth, ix.naturalHeight), gx = cx.getContext('2d');
          gx.drawImage(ix, 0, 0);
          const dx = gx.getImageData(0, 0, cx.width, cx.height).data, L = new Uint8Array(a.length), V = new Uint8Array(a.length);
          if (cx.width === c.width && cx.height === c.height) for (let i = 0; i < a.length; i++) { L[i] = dx[i * 4]; V[i] = dx[i * 4 + 1]; }
          RLF[k].L = L; RLF[k].V = V;
          done();
        };
        ix.onerror = () => done();
        ix.src = m.src.replace(/\.png$/, '-x.png');
      };
      img.onerror = () => done();
      img.src = m.src;
    })));
  }
  const RC = PTD ? canvas(W, H) : null, rcx = RC ? RC.getContext('2d') : null;
  const RID = rcx ? rcx.createImageData(W, H) : null;
  const TCV = {};
  function tintCanvas(key) { if (!TCV[key]) TCV[key] = canvas(W, H).getContext('2d'); return TCV[key]; }
  // rendu point par point : chaque pixel de l'écran retrouve son point du sol (projection inverse)
  // couches du relief, de la plus large à la plus fine : le monde, la région, le Sinaï, le Liban, puis la base
  // (Palestine) ; une couche s'efface quand elle devient trop floue (de 4 à 7 pixels d'écran par pixel de texture)
  const RL_ORDER = ['monde', 'region', 'sinai', 'liban', 'est', 'base'];
  function rlWeight(T, k) {
    if (k === 'base') return 1;
    const mag = Ps / T.su;
    return clamp((7 - mag) / 3);
  }
  // étalonnage du relief sur toutes les terres : ombres froides et profondes, pentes éclairées chaudes (lumière de fin
  // de journée), brume bleutée au loin ; table de 256 teintes par interpolation de quelques repères
  const GRADE = (() => {
    const K = [[0, [6, 9, 14]], [70, [30, 36, 45]], [118, [76, 71, 62]], [150, [128, 109, 84]], [190, [184, 151, 108]], [255, [248, 208, 152]]];
    const L = new Uint8ClampedArray(256 * 3);
    for (let v = 0; v < 256; v++) {
      let j = 0;
      while (j < K.length - 2 && v > K[j + 1][0]) j++;
      const [v0, c0] = K[j], [v1, c1] = K[j + 1], f = clamp((v - v0) / (v1 - v0));
      for (let c = 0; c < 3; c++) L[v * 3 + c] = c0[c] + (c1[c] - c0[c]) * f;
    }
    return L;
  })();
  const HAZE_C = [150, 158, 166], AIR_C = [92, 104, 118];
  // rendu point par point : chaque pixel de l'écran retrouve son point du sol (projection inverse)
  function renderRelief(cam, box, RT = 0, graded = false) {
    const base = RLF.base;
    if (!base) return false;
    const layers = [];
    for (const k of RL_ORDER) {
      const T = RLF[k];
      if (!T || T.X1 < VIEW.x0 || T.X0 > VIEW.x1 || T.Y1 < VIEW.y0 || T.Y0 > VIEW.y1) continue;
      const lw = rlWeight(T, k);
      if (lw > 0.002) layers.push([T, lw, k === 'monde' || k === 'region' ? 50 : 170]);
    }
    if (!layers.length) return false;
    // détail : texture fine de la zone filmée en gros plan
    let det = null, dw = 0;
    if (cam.w < 0.04) for (const k of ['nord', 'sud', 'jaffa', 'jer']) {
      const T = RLF[k];
      if (!T) continue;
      const m = Math.min(cam.x - T.X0, T.X1 - cam.x, cam.y - T.Y0, T.Y1 - cam.y);
      if (m > 0) { det = T; dw = inv(0.034, 0.018, cam.w); break; }
    }
    const d = RID.data;
    const [x0, y0, x1, y1] = box;
    // lumière qui glisse : de la lumière du nord-ouest vers la lumière rasante de l'est, lentement (TL.partage.light)
    const C = PART.C, tt = RT;
    const mix = C.light && base.L ? 0.6 * (0.5 - 0.5 * Math.cos((tt / (C.lightPeriod || 36)) * 6.2832)) : 0;
    const hz = C.haze && base.V ? C.haze * (0.85 + 0.15 * Math.sin(tt * 0.35)) : 0;
    const nl = layers.length;
    for (let sy = y0; sy < y1; sy++) {
      const v = sy - Poy, den = Pcp * FOCAL + v * Psp;
      let i = (sy * W + x0) * 4;
      if (den <= 1e-6) { for (let sx = x0; sx < x1; sx++, i += 4) d[i + 3] = 0; continue; }
      const ry = (v * FOCAL) / den, k = FOCAL / (FOCAL - ry * Psp);
      const rx0 = (x0 - Pox) / k, drx = 1 / k;
      let X = Pcx + (Pcb * rx0 + Psb * ry) / Ps, Y = Pcy - (-Psb * rx0 + Pcb * ry) / Ps;
      const dX = (Pcb * drx) / Ps, dY = (Psb * drx) / Ps;
      // perspective aérienne : le lointain bleuit et se voile (seulement caméra inclinée)
      const air = graded ? 0.34 * Math.pow(clamp(1 - sy / H), 1.7) * clamp(Psp / 0.7) : 0;
      for (let sx = x0; sx < x1; sx++, i += 4, X += dX, Y += dY) {
        let val = 0, mist = 0, cov = 0;
        for (let q = 0; q < nl; q++) {
          const L = layers[q], T = L[0];
          const u = (X - T.X0) * T.su - 0.5, w = (T.Y1 - Y) * T.sv - 0.5;
          if (u < 0 || w < 0 || u >= T.w - 1 || w >= T.h - 1) continue;
          // fondu vers le bord de la texture (sauf la plus large)
          const e = Math.min(u, w, T.w - 1 - u, T.h - 1 - w), lw = L[1] * (e > L[2] ? 1 : e / L[2]);
          if (lw <= 0.002) continue;
          const iu = u | 0, iw = w | 0, fu = u - iu, fw = w - iw, o = iw * T.w + iu, A = T.a, tw_ = T.w;
          let lv = (A[o] * (1 - fu) + A[o + 1] * fu) * (1 - fw) + (A[o + tw_] * (1 - fu) + A[o + tw_ + 1] * fu) * fw;
          let lm = 0;
          if (mix > 0.002 && T.L) { const B = T.L; lv += (((B[o] * (1 - fu) + B[o + 1] * fu) * (1 - fw) + (B[o + tw_] * (1 - fu) + B[o + tw_ + 1] * fu) * fw) - lv) * mix; }
          if (hz > 0.002 && T.V) { const B = T.V; lm = ((B[o] * (1 - fu) + B[o + 1] * fu) * (1 - fw) + (B[o + tw_] * (1 - fu) + B[o + tw_ + 1] * fu) * fw) / 255; }
          if (cov === 0) { val = lv; mist = lm; cov = lw; } else { val += (lv - val) * lw; mist += (lm - mist) * lw; cov += (1 - cov) * lw; }
        }
        if (cov <= 0.002) { d[i + 3] = 0; continue; }
        if (det) {
          const u = (X - det.X0) * det.su - 0.5, w = (det.Y1 - Y) * det.sv - 0.5;
          if (u >= 0 && w >= 0 && u < det.w - 1 && w < det.h - 1) {
            const iu = u | 0, iw = w | 0, fu = u - iu, fw = w - iw, o = iw * det.w + iu, A = det.a;
            // fondu vers le bord de la texture fine
            const e = Math.min(u, w, det.w - 1 - u, det.h - 1 - w), f = dw * (e > 40 ? 1 : e / 40);
            let dv = (A[o] * (1 - fu) + A[o + 1] * fu) * (1 - fw) + (A[o + det.w] * (1 - fu) + A[o + det.w + 1] * fu) * fw;
            if (mix > 0.002 && det.L) dv += (((det.L[o] * (1 - fu) + det.L[o + 1] * fu) * (1 - fw) + (det.L[o + det.w] * (1 - fu) + det.L[o + det.w + 1] * fu) * fw) - dv) * mix;
            val += (dv - val) * f;
          }
        }
        // brume : les creux s'éclaircissent et se voilent, plus fort au loin (haut de l'image)
        const m2 = mist > 0.01 ? Math.min(1, mist * mist * mist * 2.2) * hz * (0.5 + 0.5 * (1 - sy / H)) : 0;
        if (graded) {
          const q = (val < 0 ? 0 : val > 255 ? 255 : val | 0) * 3;
          let r = GRADE[q], gg = GRADE[q + 1], b = GRADE[q + 2];
          if (m2 > 0) { r += (HAZE_C[0] - r) * m2; gg += (HAZE_C[1] - gg) * m2; b += (HAZE_C[2] - b) * m2; }
          if (air > 0.002) { r += (AIR_C[0] - r) * air; gg += (AIR_C[1] - gg) * air; b += (AIR_C[2] - b) * air; }
          d[i] = r; d[i + 1] = gg; d[i + 2] = b;
        } else {
          if (m2 > 0) val += (226 - val) * m2;
          d[i] = d[i + 1] = d[i + 2] = val;
        }
        d[i + 3] = cov >= 0.998 ? 255 : cov * 255;
      }
    }
    rcx.clearRect(0, 0, W, H);
    rcx.putImageData(RID, 0, 0, x0, y0, x1 - x0, y1 - y0);
    if (C.dof) {
      if (!RCB) { RCB = canvas(W, H); rcb = RCB.getContext('2d'); }
      rcb.globalCompositeOperation = 'source-over';
      rcb.clearRect(0, 0, W, H);
      rcb.filter = `blur(${(C.dof === true ? 1.7 : C.dof) * Math.max(0.4, Math.sin(cam.pitch))}px)`;
      rcb.drawImage(RC, 0, 0);
      rcb.filter = 'none';
      rcb.globalCompositeOperation = 'destination-in';
      const gr = rcb.createLinearGradient(0, 0, 0, H * 0.38);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      rcb.fillStyle = gr; rcb.fillRect(0, 0, W, H);
      rcx.drawImage(RCB, 0, 0);
    }
    return true;
  }
  let RCB = null, rcb = null;
  const PSTATE = {
    neutre: () => COL.stone.map((c) => c * 0.66),
    arabe: () => COL.life,
    juif: () => COL.cold,
    jer: () => COL.stone,
  };
  function piecePath(g, p) {
    g.beginPath();
    for (const r of p.rings) { r.forEach(([X, Y], i) => { const P = proj(X, Y); if (!i) g.moveTo(P.x, P.y); else g.lineTo(P.x, P.y); }); g.closePath(); }
  }
  // décalage à l'écran d'un morceau quand la terre se fend : il s'écarte du centre et se soulève
  function pieceOffsets(t) {
    const C = PART.C;
    const s = C.split ? tw(t, PART.T('split'), PART.T('split') + (C.split.dur || 1.2), E.outBack) : 0;
    const back = C.settle ? tw(t, PART.T('settle'), PART.T('settle') + (C.settle.dur || 2), E.inOutCubic) : 0;
    const k = s * (1 - back * (1 - (C.settle && C.settle.keep !== undefined ? C.settle.keep : 0.25)));
    const O = proj(MX(C.center[0]), MY(C.center[1])), ox = O.x, oy = O.y;
    const sep = (C.split && C.split.sep) || 16, lift = (C.split && C.split.lift) || 12;
    return PART.pieces.map((p) => {
      const P = proj(p.cX, p.cY);
      let dx = P.x - ox, dy = P.y - oy; const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
      const pk = (C.split && C.split.k && C.split.k[p.k]) || 1;
      return [dx * sep * k * pk, dy * sep * k * pk - lift * k * pk, lift * k * pk];
    });
  }
  // de très près, la texture du relief n'est plus assez fine : elle s'efface (TL.partage.fadeBelow = [w0, w1])
  function reliefZoom(cam) {
    const f = PART.C.fadeBelow;
    return f ? clamp((cam.w - f[0]) / (f[1] - f[0])) : 1;
  }
  // sous les grands titres plein écran (beat, outro, chapitre, partie), le relief s'assombrit : le texte reste lisible
  const TITLE_T = new Set(['beat', 'outro', 'chapter', 'part', 'title']);
  function titleDim(t) {
    const k = PART.C.titleDim !== undefined ? PART.C.titleDim : 0.42;
    let i = SEG.findIndex((s) => t < s.start + s.dur);
    if (i < 0) i = SEG.length - 1;
    const f = (s) => (s && TITLE_T.has(s.type) ? k : 1), s = SEG[i];
    return f(SEG[i - 1]) + (f(s) - f(SEG[i - 1])) * tw(t, s.start, s.start + 0.8);
  }
  function landAlpha(t) {
    const C = PART.C;
    return tw(t, PART.T('land'), PART.T('land') + ((C.land && C.land.dur) || 2.5), E.inOutCubic) * (1 - (C.drain ? tw(t, PART.T('drain'), PART.T('drain') + (C.drain.dur || 3), E.inOutCubic) : 0));
  }
  // ---- carte ancienne posée sur le terrain (TL.carte = { src, bbox, in: { seg, at, dur }, out: { seg, at, dur, keep } }) :
  // un document d'époque redressé en Mercator (par ex. tools/prep_sykes_picot.py), qui épouse le relief
  const CARTE = TL.carte || null;
  let CTX = null, CCV = null, ccx = null, CID = null;
  async function loadCarte() {
    if (!CARTE) return;
    await new Promise((done) => {
      const img = new Image();
      img.onload = () => {
        const c = canvas(img.naturalWidth, img.naturalHeight), g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        const [X0, Y0, X1, Y1] = CARTE.bbox;
        CTX = { a: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height, X0, Y0, X1, Y1, su: c.width / (X1 - X0), sv: c.height / (Y1 - Y0) };
        done();
      };
      img.onerror = () => done();
      img.src = CARTE.src;
    });
  }
  const carteAt = (o) => (o ? SEG.find((x) => x.id === o.seg).start + (o.at || 0) : 1e9);
  function carteAlpha(t) {
    if (!CTX) return 0;
    const a = CARTE.in, b = CARTE.out, t0 = carteAt(a), t1 = carteAt(b);
    const keep = b && b.keep !== undefined ? b.keep : 0;
    return tw(t, t0, t0 + ((a && a.dur) || 2), E.inOutCubic) * (1 - (b ? tw(t, t1, t1 + (b.dur || 2), E.inOutCubic) * (1 - keep) : 0));
  }
  function drawCarte(g, t) {
    const A = carteAlpha(t);
    if (A <= 0.004) return;
    if (!CCV) { CCV = canvas(W, H); ccx = CCV.getContext('2d'); CID = ccx.createImageData(W, H); }
    const T = CTX, d = CID.data, R = RID ? RID.data : null, S = T.a, tw4 = T.w * 4;
    for (let sy = 0; sy < H; sy++) {
      const v = sy - Poy, den = Pcp * FOCAL + v * Psp;
      let i = sy * W * 4;
      if (den <= 1e-6) { for (let sx = 0; sx < W; sx++, i += 4) d[i + 3] = 0; continue; }
      const ry = (v * FOCAL) / den, k = FOCAL / (FOCAL - ry * Psp);
      const rx0 = -Pox / k, drx = 1 / k;
      let X = Pcx + (Pcb * rx0 + Psb * ry) / Ps, Y = Pcy - (-Psb * rx0 + Pcb * ry) / Ps;
      const dX = (Pcb * drx) / Ps, dY = (Psb * drx) / Ps;
      for (let sx = 0; sx < W; sx++, i += 4, X += dX, Y += dY) {
        const u = (X - T.X0) * T.su - 0.5, w = (T.Y1 - Y) * T.sv - 0.5;
        if (u < 0 || w < 0 || u >= T.w - 1 || w >= T.h - 1) { d[i + 3] = 0; continue; }
        const iu = u | 0, iw = w | 0, fu = u - iu, fw = w - iw, o = (iw * T.w + iu) * 4, o2 = o + tw4;
        const a00 = (1 - fu) * (1 - fw), a10 = fu * (1 - fw), a01 = (1 - fu) * fw, a11 = fu * fw;
        let r = S[o] * a00 + S[o + 4] * a10 + S[o2] * a01 + S[o2 + 4] * a11;
        let gg = S[o + 1] * a00 + S[o + 5] * a10 + S[o2 + 1] * a01 + S[o2 + 5] * a11;
        let b = S[o + 2] * a00 + S[o + 6] * a10 + S[o2 + 2] * a01 + S[o2 + 6] * a11;
        // hors du cadre de la carte (noir) : transparent
        const lum = r + gg + b, al = lum >= 240 ? 1 : lum / 240;
        if (al < 1 && al > 0) { r /= al; gg /= al; b /= al; }
        // le papier épouse le relief : l'ombrage du terrain passe à travers la carte
        if (R && R[i + 3] > 0) { const sh = 0.92 + 0.75 * (R[i] / 255 - 0.46); r *= sh; gg *= sh; b *= sh; }
        d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = al * 255;
      }
    }
    ccx.putImageData(CID, 0, 0);
    g.save();
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = A * (CARTE.alpha || 0.94);
    g.drawImage(CCV, 0, 0);
    g.restore();
  }
  let LMC = null;
  function landMask(cam) {
    if (!LMC) LMC = canvas(W, H).getContext('2d');
    const m = LMC;
    m.globalCompositeOperation = 'source-over';
    m.clearRect(0, 0, W, H);
    m.fillStyle = '#fff';
    if (cam.w < 2.2) { pathPolys(m, G.landHi); m.fill('evenodd'); }
    pathPolys(m, G.landLo); m.fill('evenodd');
    m.globalCompositeOperation = 'destination-out';
    pathPolys(m, G.lakes); m.fill('evenodd');
    m.globalCompositeOperation = 'source-over';
    return m.canvas;
  }
  function drawPartage(g, t, cam) {
    if (!PART) return;
    const A = landAlpha(t) * reliefZoom(cam) * titleDim(t);
    const OFF = pieceOffsets(t);
    if (A > 0.004 && PART.C.terres) {
      // relief sur toutes les terres de l'image (Palestine, pays voisins, Europe), pas seulement sur la Palestine mandataire
      const graded = PART.C.grade !== false;
      if (renderRelief(cam, [0, 0, W, H], t, graded)) {
        const tc = tintCanvas('neutre'), col = PSTATE.neutre(), shade = PART.C.shade || 1.0;
        tc.globalCompositeOperation = 'copy'; tc.globalAlpha = 1;
        tc.drawImage(RC, 0, 0);
        if (!graded) {
          tc.globalCompositeOperation = 'multiply';
          tc.fillStyle = `rgb(${Math.round(col[0] * shade)},${Math.round(col[1] * shade)},${Math.round(col[2] * shade)})`;
          tc.fillRect(0, 0, W, H);
          tc.globalCompositeOperation = 'destination-in';
          tc.drawImage(RC, 0, 0);
        }
        tc.globalCompositeOperation = 'destination-in';
        // seulement sur la terre : côtes et lacs de la carte
        const lm = landMask(cam);
        tc.drawImage(lm, 0, 0);
        tc.globalCompositeOperation = 'source-over';
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = A;
        g.drawImage(tc.canvas, 0, 0);
        g.restore();
      }
    } else if (A > 0.004) {
      // emprise écran des morceaux (plus la marge du décalage)
      let x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (const p of PART.pieces) for (const [X, Y] of [[p.b[0], p.b[1]], [p.b[2], p.b[1]], [p.b[0], p.b[3]], [p.b[2], p.b[3]], [p.cX, p.b[1]], [p.cX, p.b[3]], [p.b[0], p.cY], [p.b[2], p.cY]]) {
        const P = proj(X, Y); x0 = Math.min(x0, P.x); y0 = Math.min(y0, P.y); x1 = Math.max(x1, P.x); y1 = Math.max(y1, P.y);
      }
      const m = 40;
      const box = [Math.max(0, Math.floor(x0 - m)), Math.max(0, Math.floor(y0 - m)), Math.min(W, Math.ceil(x1 + m)), Math.min(H, Math.ceil(y1 + m))];
      if (box[2] > box[0] && box[3] > box[1] && renderRelief(cam, box, t)) {
        const [bx, by, bw, bh] = [box[0], box[1], box[2] - box[0], box[3] - box[1]];
        // une couche teintée par couleur utilisée
        const used = new Set(['neutre']);
        for (const p of PART.pieces) if (t > p.tintT) used.add(p.state);
        const shade = PART.C.shade || 1.0;
        for (const key of used) {
          const tc = tintCanvas(key), col = PSTATE[key]();
          tc.globalCompositeOperation = 'copy'; tc.globalAlpha = 1;
          tc.drawImage(RC, bx, by, bw, bh, bx, by, bw, bh);
          tc.globalCompositeOperation = 'multiply';
          tc.fillStyle = `rgb(${Math.round(col[0] * shade)},${Math.round(col[1] * shade)},${Math.round(col[2] * shade)})`;
          tc.fillRect(bx, by, bw, bh);
        }
        g.save();
        g.globalCompositeOperation = 'lighter';
        // les morceaux les plus soulevés passent devant
        const order = PART.pieces.map((p, i) => i).sort((a, b) => OFF[a][2] - OFF[b][2]);
        for (const i of order) {
          const p = PART.pieces[i], [ox, oy, lf] = OFF[i];
          const tp = tw(t, p.tintT, p.tintT + p.tintDur, E.inOutCubic);
          // épaisseur de la tranche (le morceau est soulevé)
          if (lf > 0.6) {
            const n = Math.min(8, Math.ceil(lf / 2));
            const ec = tp > 0.5 ? PSTATE[p.state]() : PSTATE.neutre();
            for (let j = 0; j < n; j++) {
              const q = j / n;
              g.save(); g.translate(ox * q, oy * q + lf * (1 - q) * 0); piecePath(g, p);
              g.fillStyle = rgba(ec, 0.035 * A); g.fill('evenodd'); g.restore();
            }
          }
          g.save();
          g.translate(ox, oy);
          piecePath(g, p);
          g.clip('evenodd');
          g.globalAlpha = A * (1 - tp);
          if (g.globalAlpha > 0.003) g.drawImage(TCV.neutre.canvas, bx, by, bw, bh, bx, by, bw, bh);
          g.globalAlpha = A * tp;
          if (tp > 0.003) g.drawImage(TCV[p.state].canvas, bx, by, bw, bh, bx, by, bw, bh);
          // Jérusalem : hachures de pierre (régime international)
          if (p.state === 'jer' && tp > 0.01) {
            g.globalAlpha = 1;
            g.strokeStyle = rgba(COL.stone, 0.32 * A * tp); g.lineWidth = 1.2;
            g.beginPath();
            const sp = 7, off = (t * 5) % sp;
            for (let x = bx - bh - sp + off; x < bx + bw + sp; x += sp) { g.moveTo(x, by + bh); g.lineTo(x + bh, by); }
            g.stroke();
          }
          g.restore();
          // contour du morceau
          g.save(); g.translate(ox, oy); piecePath(g, p);
          const oc = tp > 0.5 ? (p.state === 'arabe' ? COL.lifeHot : p.state === 'juif' ? COL.coldHot : COL.stone) : COL.stone;
          g.strokeStyle = rgba(oc, (0.16 + 0.34 * clamp(lf / 6)) * A); g.lineWidth = 1.1; g.stroke();
          g.restore();
        }
        g.restore();
      }
    }
    drawBlade(g, t, OFF, A);
    drawLocs(g, t, OFF);
    drawPLabels(g, t, OFF);
  }

  // lame : le trait avance, incandescent à la pointe, puis refroidit en pierre
  function partialPath(g, l, dist) {
    g.beginPath();
    let last = null;
    for (let j = 0; j < l.P.length; j++) {
      if (l.L[j] > dist) {
        const a = l.P[j - 1], b = l.P[j], q = (dist - l.L[j - 1]) / ((l.L[j] - l.L[j - 1]) || 1e-12);
        const P = proj(lerp(a[0], b[0], q), lerp(a[1], b[1], q)); g.lineTo(P.x, P.y); last = [P.x, P.y]; break;
      }
      const P = proj(l.P[j][0], l.P[j][1]);
      if (!j) g.moveTo(P.x, P.y); else g.lineTo(P.x, P.y);
      last = [P.x, P.y];
    }
    return last;
  }
  function drawBlade(g, t, OFF, A) {
    const C = PART.C;
    // une fois la terre fendue, le trait se résorbe : la frontière devient la fente entre les morceaux
    const split = C.split ? tw(t, PART.T('split') - 0.1, PART.T('split') + 0.6) : 0;
    const scar = C.settle ? tw(t, PART.T('settle') + 0.6, PART.T('settle') + 2.2) : 0;
    const drain = C.drain ? tw(t, PART.T('drain'), PART.T('drain') + (C.drain.dur || 3)) : 0;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.lineJoin = 'round'; g.lineCap = 'round';
    for (const l of PART.lines) {
      if (t < l.t0) continue;
      const p = E.inOutSine(clamp((t - l.t0) / (l.t1 - l.t0))), dist = p * l.len;
      const cool = clamp((t - l.t1) / 0.8);
      const lineA = (1 - split * (1 - 0.55 * scar)) * (1 - 0.6 * drain);
      if (lineA > 0.01) {
        partialPath(g, l, dist);
        g.strokeStyle = rgba(COL.ember, 0.20 * lineA * (1 - cool * 0.6)); g.lineWidth = 7; g.stroke();
        g.strokeStyle = rgba(cool < 1 ? COL.hot : COL.stone, (0.85 - 0.25 * cool) * lineA); g.lineWidth = 1.6; g.stroke();
      }
      // pointe de la lame
      if (p < 1) {
        const tip = partialPath(g, l, dist);
        if (tip) {
          const fl = 0.85 + 0.15 * noise1(t * 40 + l.len * 1e4);
          sprite(g, SPR.hot, tip[0], tip[1], 90, 0.55 * fl);
          sprite(g, SPR.spark, tip[0], tip[1], 26, 1);
          sprite(g, SPR.white, tip[0], tip[1], 12, 0.9);
        }
      }
    }
    g.restore();
  }

  // localités : olive pour les localités arabes, encre froide pour les localités juives
  SPR.cold = (() => {
    const s = 64, c = canvas(s, s), g = c.getContext('2d');
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(236,244,252,1)');
    gr.addColorStop(0.18, `rgba(${COL.coldHot.join(',')},.95)`);
    gr.addColorStop(0.42, `rgba(${COL.cold.join(',')},.35)`);
    gr.addColorStop(1, `rgba(${COL.cold.join(',')},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    return c;
  })();
  SPR.lifeGlow = glowSprite(COL.life, 128);
  SPR.coldGlow = glowSprite(COL.cold, 128);
  function drawLocs(g, t, OFF) {
    const C = PART.C;
    const out = C.dotsOut ? tw(t, PART.T('dotsOut'), PART.T('dotsOut') + (C.dotsOut.dur || 2.5), E.inOutCubic) : 0;
    const A = 1 - out;
    if (A <= 0.01) return;
    // Arabes dans l'État juif prévu : ils battent un instant
    const pulse = C.pulse ? tw(t, PART.T('pulse'), PART.T('pulse') + 0.6) * (1 - tw(t, PART.T('pulse') + (C.pulse.dur || 4), PART.T('pulse') + (C.pulse.dur || 4) + 1.2)) : 0;
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (const c of PART.towns) {
      const e = tw(t, c.t - 0.1, c.t + 0.9, E.outCubic);
      if (e <= 0.01) continue;
      const o = c.p >= 0 ? OFF[c.p] : [0, 0];
      const P = proj(c.X, c.Y);
      const sz = (14 + Math.sqrt(c.pop) * 0.2) * clamp(P.k, 0.5, 1.4) * clamp(0.075 / (W / Ps) * 1, 0.7, 2.2);
      sprite(g, c.kind === 'arabe' ? SPR.lifeGlow : SPR.coldGlow, P.x + o[0], P.y + o[1], sz, 0.3 * e * A);
    }
    for (const d of PART.locs) {
      if (t < d.t - 0.05) continue;
      const age = t - d.t, e = clamp(age / 0.25), flash = age < 0.6 ? Math.exp(-age / 0.18) : 0;
      const o = d.p >= 0 ? OFF[d.p] : [0, 0];
      const P = proj(d.X, d.Y);
      if (P.x < -20 || P.x > W + 20 || P.y < -20 || P.y > H + 20) continue;
      const inJ = d.kind === 'arabe' && d.p >= 0 && PART.pieces[d.p].state === 'juif';
      const pu = inJ ? pulse * (0.75 + 0.25 * Math.sin(t * 5 + d.ph)) : 0;
      const k = clamp(P.k, 0.55, 1.5);
      const sz = (7.5 + 4 * flash + 5 * pu) * k * d.a;
      const alpha = (0.62 + 0.38 * flash + 0.35 * pu) * e * A * (pulse && !inJ ? 1 - 0.45 * pulse : 1);
      sprite(g, d.kind === 'arabe' ? SPR.life : SPR.cold, P.x + o[0], P.y + o[1], sz, alpha);
      if (pu > 0.05) sprite(g, SPR.lifeGlow, P.x + o[0], P.y + o[1], 26 * k, 0.22 * pu * A);
    }
    g.restore();
  }

  // mentions à la machine à écrire, comme sur le document de l'ONU
  function drawPLabels(g, t, OFF) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (const m of PART.marks) {
      const a = tw(t, m.t, m.t + 0.5, E.outCubic) * (1 - tw(t, m.tEnd - 0.4, m.tEnd));
      if (a <= 0.01) continue;
      const P = proj(m.X, m.Y), R = lerp(90, 46, E.outExpo(clamp((t - m.t) / 0.9))), pu = 0.5 + 0.5 * Math.sin((t - m.t) * 4.2);
      g.strokeStyle = rgba(COL.ember, 0.25 * a); g.lineWidth = 7;
      g.beginPath(); g.arc(P.x, P.y, R, 0, 7); g.stroke();
      g.strokeStyle = rgba(COL.hot, (0.65 + 0.3 * pu) * a); g.lineWidth = 2.2;
      g.beginPath(); g.arc(P.x, P.y, R, 0, 7); g.stroke();
      g.strokeStyle = rgba(COL.stone, 0.9 * a); g.lineWidth = 1.8;
      g.beginPath();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { g.moveTo(P.x + dx * (R + 8), P.y + dy * (R + 8)); g.lineTo(P.x + dx * (R + 26), P.y + dy * (R + 26)); }
      g.stroke();
      sprite(g, SPR.hot, P.x, P.y, 46, 0.45 * a);
      sprite(g, SPR.white, P.x, P.y, 8, 0.9 * a);
    }
    g.restore();
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.textBaseline = 'middle';
    for (const l of PART.labels) {
      if (t < l.t) continue;
      const out = tw(t, l.tEnd - 0.4, l.tEnd);
      if (out >= 1) continue;
      const n = Math.min(l.text.length, Math.floor((t - l.t) * (l.cps || 16)));
      if (n <= 0) continue;
      const o = l.p >= 0 ? OFF[l.p] : [0, 0];
      const P = proj(l.X, l.Y);
      const size = l.size || 22;
      g.font = `700 ${size}px "Courier Prime"`;
      g.letterSpacing = `${Math.round(size * 0.18)}px`;
      const col = l.tone === 'life' ? COL.lifeHot : l.tone === 'cold' ? COL.coldHot : COL.stone;
      const str = l.text.slice(0, n), full = g.measureText(l.text).width;
      let x = P.x + o[0] - (l.align === 'left' ? 0 : full / 2), y = P.y + o[1];
      // encrage inégal des caractères, comme une frappe réelle
      for (let j = 0; j < str.length; j++) {
        const ch = str[j], ink = 0.72 + 0.28 * hash(j * 13.1 + l.text.length);
        const fresh = j === n - 1 && n < l.text.length ? 1 : 0;
        g.fillStyle = rgba(fresh ? COL.hot : col, (l.alpha || 0.9) * ink * (1 - out));
        g.fillText(ch, x, y + (hash(j * 7.7) - 0.5) * 1.2);
        x += g.measureText(ch).width + size * 0.18;
      }
    }
    g.restore();
  }

  // vote du 29 novembre 1947 : la carte du monde s'allume, pays par pays
  function voteCounts(t) {
    const out = { pour: 0, contre: 0, abstention: 0, absent: 0 };
    if (!PART || !PART.vote) return out;
    const n = { pour: 33, contre: 13, abstention: 10, absent: 1 };
    for (const G0 of PART.vote.groups) {
      const done = G0.polys.filter((p) => t >= p.t).length;
      out[G0.g] = Math.round(n[G0.g] * (G0.polys.length ? done / G0.polys.length : 0));
    }
    return out;
  }
  function drawVote(g, t) {
    if (!PART || !PART.vote) return;
    const V = PART.vote, A = tw(t, V.t0 - 1.0, V.t0) * (1 - tw(t, V.tEnd - 1.2, V.tEnd));
    if (A <= 0.01) return;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.lineJoin = 'round';
    const tone = { pour: COL.cold, contre: COL.life, abstention: COL.stone, absent: COL.stone };
    const path = (P) => { g.beginPath(); P.forEach(([X, Y], i) => { const Q = proj(X, Y); if (!i) g.moveTo(Q.x, Q.y); else g.lineTo(Q.x, Q.y); }); g.closePath(); };
    for (const P of V.others) { path(P); g.fillStyle = rgba(COL.ash, 0.035 * A); g.fill(); }
    for (const G0 of V.groups) {
      const c = tone[G0.g];
      for (const p of G0.polys) {
        const e = tw(t, p.t, p.t + 0.35, E.outCubic), fl = t > p.t ? Math.exp(-(t - p.t) / 0.25) : 0;
        if (e <= 0.01) continue;
        path(p.P);
        const fa = G0.g === 'abstention' ? 0.09 : G0.g === 'absent' ? 0.0 : G0.g === 'pour' ? 0.4 : 0.26;
        g.fillStyle = rgba(c, (fa + 0.25 * fl) * e * A); g.fill();
        if (G0.g === 'abstention') {
          g.save(); g.clip(); g.strokeStyle = rgba(c, 0.32 * e * A); g.lineWidth = 1;
          g.beginPath(); for (let x = -H; x < W; x += 7) { g.moveTo(x, H); g.lineTo(x + H, 0); } g.stroke(); g.restore();
          path(p.P);
        }
        if (G0.g === 'absent') g.setLineDash([4, 4]);
        g.strokeStyle = rgba(c, (0.55 + 0.4 * fl) * e * A); g.lineWidth = 1.1; g.stroke();
        g.setLineDash([]);
      }
    }
    g.restore();
  }

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
    for (const f of FLOWS) {
      const A = flowA(f, t);
      if (A <= 0.01) continue;
      if (f.originHeat) {
        const em = tw(t, f.t - 0.3, f.t + 0.5) * (1 - tw(t, f.t + (f.dur || 3) + 0.5, f.t + (f.dur || 3) + 2.5));
        for (const [X, Y] of f.O) { const P = proj(X, Y); if (em > 0.01) sources.push({ gx: P.gx, gy: P.gy, amt: 0.75 * em * A * f.originHeat, R: f.originR || 260, waves: [], flicker: true }); }
      }
      let arrived = 0;
      for (const p of f.P) if (t >= p.t0 + p.tt) arrived++;
      const fa = arrived / f.P.length;
      if (fa > 0.01) { const P = proj(f.TX, f.TY); sources.push({ gx: P.gx, gy: P.gy, amt: (f.heat || 0.85) * Math.sqrt(fa) * A, R: (f.R || 520) * (0.6 + 0.4 * fa), waves: [] }); }
    }
    if (HAS_WAR) strikeSources(t, sources);
    drawDots(g, sources, t, mot);
    // échelle régionale (territoires, offensives) ou échelle de la rue (plans, maisons)
    const ZR = inv(0.0025, 0.007, cam.w), ZS = inv(0.008, 0.003, cam.w);
    if (HAS_WAR) { if (!CARTE) drawZones(g, t, ZR); drawArrows(g, t, ZR); drawPlans(g, t, ZS); if (LIGHTS.length) drawLights(g, t, Math.pow(clamp(0.011 / cam.w), 0.9)); drawBlocks(g, t, ZS); }
    if (PART) { drawVote(g, t); drawPartage(g, t, cam); CITY_DIM = 1 - 0.7 * landAlpha(t) * reliefZoom(cam); }
    if (CARTE) { drawCarte(g, t); if (HAS_WAR) drawZones(g, t, ZR); }
    if (COLUMNS.length) drawColumns(g, t);
    if (FLOWS.length) drawFlows(g, t);
    if (NETS.length) drawNets(g, t);
    if (RENAMES.length) drawRenames(g, t);
    if (HAS_WAR) { drawUnits(g, t); drawStrikes(g, t); if (FLARES.length) drawFlares(g, t); }
    const busy = [];
    if (pin && pin.showPin) busy.push(pin.s);
    for (const m of MARKERS) if (t >= m.t - 0.05) busy.push(m);
    drawCities(g, cam, busy);
    drawRoute(g, t);
    if (pin && pin.showPin) drawPin(g, pin, t);
    if (MARKERS.length) { g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.drawImage(mk.canvas, 0, 0); }
    if (HAS_FACES) drawFaceLinks(g, t);

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
  // espaces insécables : guillemets et ponctuation double, groupes de chiffres (15 136), nombre et unité (95 %, 82,4 L, 464 km)
  const fr = (str) => str.replace(/« /g, '«\u00a0').replace(/ »/g, '\u00a0»').replace(/ ([:;!?])/g, '\u00a0$1')
    .replace(/(\d) (?=\d{3}(?!\d))/g, '$1\u00a0').replace(/(\d) (%|‰|km²|km|m²|ha|L|kg|°C|°)(?=$|[\s.,;:!?)\]»])/g, '$1\u00a0$2');
  // [[ ... ]] : passage surligné (soulignement de braise qui s'allume)
  const words = (str) => {
    let on = false;
    return fr(str).split(' ').map((w, i, a) => {
      const open = w.includes('[['), close = w.includes(']]');
      const hl = on || open;
      if (open) on = true;
      if (close) on = false;
      const clean = w.replace(/\[\[|\]\]/g, '');
      return `<span class="w${hl ? ' hl' : ''}">${esc(clean)}${i < a.length - 1 ? ' ' : ''}</span>`;
    }).join('');
  };
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
      el.className = `seg ${s.type} ${s.layout || ''} ${['intro', 'event', 'outro', 'beat', 'title', 'credit', 'quote'].includes(s.type) ? 'center' : ''} ${s.type === 'chapter' ? 'c-' + s.layout : ''} ${s.pos ? 'pos-' + s.pos : ''} ${s.faces && s.faces.length ? 'has-face' : ''} ${s.type === 'pair' && s.faceList.length ? 'pf' : ''}`;
      let html = '';
      if (s.type === 'figure') {
        html = `<div class="scrim"></div><div class="ghost">${yearStr(s.year)}</div>
          ${!s.photo || /\.png$/i.test(s.photo) ? '' /* détouré : voir les visages */
            : `<div class="portrait"><div class="ph" style="background-image:url('${esc(s.photo)}')"></div><div class="dots"></div><div class="tint"></div><div class="frame"></div><div class="cap">Archives · ${esc(s.name.join(' '))}</div></div>`}
          <div class="block">${eyebrowHTML()}${nameHTML(s.name)}${nativeHTML(s.native, s.lang)}<div class="rule"></div>
          <p class="text">${words(s.text)}</p><div class="meta"><span>${esc(s.life)}</span><i class="dot"></i><span>${esc(s.place)}</span></div></div>`;
      } else if (s.type === 'pair') {
        // p.text : une phrase propre à chaque personne, sous son nom (sinon tout passe par la phrase commune du bas)
        const side = (p, c) => `<div class="side ${c}">${nameHTML(p.name)}${nativeHTML(p.native, p.lang)}<div class="meta"><span>${esc(p.life)}</span></div>${p.text ? `<p class="ptx">${words(p.text)}</p>` : ''}</div>`;
        const bgp = (p, c) => (p.photo && !/\.png$/i.test(p.photo) ? `<div class="pairbg ${c}"><div class="ph" style="background-image:url('${esc(p.photo)}')"></div></div>` : '');
        html = `${bgp(s.people[0], 'a')}${bgp(s.people[1], 'b')}<div class="scrim"></div><div class="ghost">${yearStr(s.year)}</div>
          <div class="top">${eyebrowHTML()}</div>${side(s.people[0], 'a')}<div class="amp">&amp;</div>${side(s.people[1], 'b')}
          <div class="bottom"><p class="text">${s.text ? words(s.text) : ''}</p></div>`;
      } else if (s.type === 'split') {
        const half = (h, c) => `<div class="half ${c}"><div class="kicker"><span class="tw"></span></div><div class="word">${chars(h.word)}</div>${h.native ? nativeHTML(h.native, h.lang) : ''}<p class="text">${words(h.text)}</p></div>`;
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
      } else if (s.type === 'roll') {
        // générique déroulant : rubriques et lignes qui montent sur la carte ; une ligne [texte, précision]
        // affiche la précision en plus discret ; big : grand titre de fin
        const line = (l) => (Array.isArray(l) ? `<p class="rl">${esc(fr(l[0]))}<span>${esc(fr(l[1]))}</span></p>` : `<p class="rl">${esc(fr(l))}</p>`);
        // grid : noms sur plusieurs colonnes, chacun [nom en arabe, transcription]
        const cell = (l) => `<p class="rn"><b lang="ar" dir="rtl">${esc(l[0])}</b><span>${esc(l[1])}</span></p>`;
        html = `<div class="scrim"></div><div class="rollbox"><div class="rin">${(s.sections || []).map((sec) => `<div class="rs${sec.big ? ' rbig' : ''}${sec.grid ? ' rgrid' : ''}">${sec.h ? `<div class="rh">${esc(sec.h)}</div>` : ''}${sec.big ? `<div class="rt">${esc(sec.big)}</div>` : ''}${sec.grid ? `<div class="rlist" style="--cols:${sec.grid}">${(sec.names || []).map(cell).join('')}</div>` : ''}${(sec.lines || []).map(line).join('')}</div>`).join('')}</div></div>`;
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
      } else if (s.type === 'doc') {
        // document cité : titre, vote ou auteurs, extrait mot pour mot, passages surlignés
        const quote = s.quote ? (Array.isArray(s.quote) ? s.quote : [s.quote]) : [];
        html = `<div class="scrim"></div>${s.ghost ? `<div class="ghost">${esc(s.ghost)}</div>` : ''}
          <div class="block">${eyebrowHTML()}<div class="name"><div class="ln l1">${chars(s.title[0])}</div><div class="ln l2">${chars(s.title[1])}</div></div>
          ${s.meta ? `<div class="meta"><i class="dot"></i><span>${esc(fr(s.meta))}</span></div>` : ''}<div class="rule"></div>
          ${quote.length ? `<div class="dq"><i class="qm">“</i>${quote.map((q) => `<p class="text">${words(q)}</p>`).join('')}</div>` : ''}
          ${s.rows ? `<div class="drows">${s.rows.map(([l, x]) => `<div class="drow"><span class="dl">${esc(l)}</span><span class="dt">${esc(fr(x))}</span></div>`).join('')}</div>` : ''}
          ${s.ref ? `<div class="dref">${esc(fr(s.ref))}</div>` : ''}
          ${s.note ? `<p class="text dnote">${words(s.note)}</p>` : ''}</div>`;
      } else if (s.type === 'stat') {
        // chiffre-choc : le compteur monte pendant que les flux traversent la carte
        html = `<div class="scrim"></div>${s.ghost ? `<div class="ghost">${esc(s.ghost)}</div>` : ''}
          <div class="block">${eyebrowHTML()}<div class="name"><div class="ln l1">${chars(s.pre || '')}</div><div class="ln l2 stn"></div></div>
          <div class="stlab">${esc(fr(s.label))}</div>${s.layout === 'B' ? '' : '<div class="rule"></div>'}
          ${s.text ? `<p class="text">${words(s.text)}</p>` : ''}
          ${s.grid ? `<div class="sgrid"><div class="cells">${Array.from({ length: 100 }, () => '<i></i>').join('')}</div><div class="gl">${s.grid.lines.map(([b, l], k) => `<div class="${k ? 'given' : 'own'}"><b>${esc(fr(b))}</b>${esc(fr(l))}</div>`).join('')}</div></div>` : ''}
          ${s.source ? `<div class="meta"><i class="dot"></i><span>${esc(fr(s.source))}</span></div>` : ''}</div>`;
      } else if (s.type === 'cap') {
        const leg = s.legend ? `<div class="legend">${s.legend.map(([c, l]) => `<span><i class="${c}"></i>${esc(fr(l))}</span>`).join('')}</div>` : '';
        html = `<div class="scrim"></div><div class="block">${eyebrowHTML()}<div class="captitle ln">${chars(s.title.toUpperCase())}</div>${s.text ? `<p class="text"${s.textW ? ` style="max-width:${s.textW}px"` : ''}>${words(s.text)}</p>` : ''}${leg}</div>`;
      } else if (s.type === 'ballot') {
        // vote de l'Assemblée générale : en-tête tapé à la machine, décompte des voix sous la carte du monde
        const col = (c, l) => `<div class="tc ${c}"><div class="top"><i class="sw"></i><span>${esc(l)}</span></div><b class="num">0</b></div>`;
        html = `<div class="scrim"></div><div class="block">${eyebrowHTML()}<div class="bdoc"><div class="b1 typ"></div><div class="b2 typ"></div></div></div>
          <div class="tally">${col('pour', 'Pour')}${col('contre', 'Contre')}${col('abst', 'Abstentions')}${col('abs', 'Absent')}</div><div class="bres"><span class="typ"></span></div>`;
      } else if (s.type === 'quote') {
        // native : le texte dans sa langue d'origine sous la traduction ; context : une ligne sous l'auteur
        html = `<div class="scrim"></div><div class="wrap"><i class="qm">“</i><p class="text qt">${words(s.text)}</p>
          ${s.native ? `<p class="qn" dir="rtl" lang="${s.lang || 'ar'}">${esc(s.native)}</p>` : ''}
          <div class="eyebrow qa"><i class="tick"></i><span class="tw"></span><i class="tick"></i></div>${s.context ? `<p class="qc">${esc(fr(s.context))}</p>` : ''}</div>`;
      }
      el.innerHTML = html;
      if (s.faceList.length) {
        const box = document.createElement('div');
        box.className = 'faces';
        box.innerHTML = s.faceList.map((f) => {
          const u = `url('${esc(f.photo)}')`, m = `-webkit-mask-image:${u};mask-image:${u}`;
          return `<div class="fwrap" style="transform-origin:${f.x}px 1080px">
            <div class="face" style="left:${f.x - f.w / 2}px;width:${f.w}px;height:${f.h}px">
              <div class="fimg" style="background-image:${u}"></div><div class="fdots" style="${m}"></div><div class="fscan" style="${m}"></div></div>
            <div class="freti"><i></i><i></i><i></i><i></i></div>
            ${f.tag ? `<div class="ftag ${f.tagPos === 'above' ? 'ta' : f.dir > 0 ? 'tl' : 'tr'}"><i class="ftick"></i><b></b><span>${esc(f.dates || '')}</span></div>` : ''}</div>`;
        }).join('');
        const scrim = el.querySelector('.scrim, .scrimL');
        if (scrim) scrim.after(box); else el.prepend(box);
      }
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
      if (s.type === 'doc' || s.type === 'stat') {
        // le titre tient dans le bloc
        el.style.display = 'block';
        const nm = el.querySelector('.name'), maxW = s.titleMax || 980;
        if (s.type === 'stat') nm.querySelector('.stn').innerHTML = fmtNum(s.value) + (s.unit ? `<i class="gs"></i>${esc(s.unit)}` : '');
        const widest = Math.max(...[...nm.querySelectorAll('.ln')].map((l) => l.scrollWidth));
        if (widest > maxW) nm.style.fontSize = `${Math.floor(parseFloat(getComputedStyle(nm).fontSize) * maxW / widest)}px`;
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
      css(R, cut.firstElementChild, 'filter', `grayscale(1) contrast(1.22) brightness(.84) sepia(.3) drop-shadow(0 0 1.6px rgba(255,196,128,${f3(0.95 * glow)})) drop-shadow(0 0 ${f3(18 + 22 * glow)}px rgba(${EMB},${f3(0.55 * glow)}))`);
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
      const ptx = sd.querySelector('.ptx');
      if (ptx) wordsIn(R, (R.ptx = R.ptx || {})[k] || (R.ptx[k] = [...ptx.querySelectorAll('.w')]), d0 + 1.1, 0.03, 0.55);
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
      const nat = hf.querySelector('.native');
      if (nat) {
        css(R, nat, 'clipPath', `inset(-30% 0 -30% ${f3((1 - np) * 100)}%)`);
        css(R, nat, 'opacity', String(f3(clamp(np * 3))));
      }
      wordsIn(R, R.texts[k], d0 + 0.55, 0.03, 0.55);
      highlight(R, R.texts[k], d0 + (s.hlAt || 1.6));
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
    // fin (hitAt : laisse la carte parler avant le texte)
    const F = I + (s.hitAt || 0);
    typewriter(R, R.tws[0], s.eyebrow, u, F - 0.6, 26);
    css(R, R.q('.tick'), 'transform', `scaleX(${f3(tw(u, F - 0.7, F - 0.1))})`);
    R.lines.forEach((ln, k) => {
      const d0 = F - 0.25 + k * 0.55;
      letters(R, ln, d0, 0.03, 0.6, k % 2 ? -145 : 145);
      rgbSplit(R, ln.ln, u, d0 + 0.1);
    });
    css(R, wrapEl, 'transform', `scale(${f3(1.0 + 0.05 * inv(F, D, u))})`);
    css(R, R.scrim, 'opacity', String(f3(tw(u, F - 1.0, F))));
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

  // générique déroulant : vitesse constante, du bas de l'écran jusqu'à ce que la dernière rubrique
  // s'arrête au centre (hold : temps passé immobile à la fin)
  function upRoll(s, u) {
    const R = s.R; R.u = u;
    const I = s.fly + (s.hitAt || 0), D = s.dur;
    const rin = R.q('.rin');
    if (!R.rollH) R.rollH = rin.offsetHeight;
    const last = rin.lastElementChild, lastH = last ? last.offsetHeight : 0;
    const y = lerp(H, H / 2 - R.rollH + lastH / 2, inv(I, D - (s.hold || 0), u));
    css(R, rin, 'transform', `translate3d(0,${f3(y)}px,0)`);
    css(R, R.scrim, 'opacity', String(f3(tw(u, -0.2, 0.8))));
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

  // passages surlignés : un soulignement de braise court sous les mots, l'un après l'autre
  function highlight(R, list, t0) {
    if (!list) return;
    let j = 0;
    for (const w of list) {
      if (!w.classList.contains('hl')) continue;
      const p = tw(R.u, t0 + j * 0.07, t0 + j * 0.07 + 0.35, E.outCubic);
      css(R, w, 'backgroundSize', `${f3(p * 100)}% .09em`);
      css(R, w, 'color', p <= 0 ? '' : `rgba(${Math.round(lerp(233, 255, p))},${Math.round(lerp(220, 196, p))},${Math.round(lerp(192, 140, p))},1)`);
      j++;
    }
  }
  // 700000 -> « 700 000 » (espace fine entre les milliers)
  function fmtNum(v) {
    return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '<i class="gs"></i>');
  }

  function upDoc(s, u) {
    const R = s.R; R.u = u;
    const I = s.fly + (s.hitAt || 0), D = s.dur, dir = s.layout === 'R' ? -1 : 1;
    const ex = E.inCubic(inv(D - 0.08, D + 0.45, u));
    css(R, R.scrim, 'opacity', String(f3(tw(u, I - 0.7, I + 0.2, E.outCubic) * (1 - ex))));
    if (R.ghost) {
      const gp = tw(u, I - 0.4, I + 0.75, E.outExpo);
      css(R, R.ghost, 'opacity', String(f3(gp * (1 - ex))));
      css(R, R.ghost, 'transform', `translate3d(${f3(dir * lerp(80, -60, inv(I - 0.4, D + 0.45, u)))}px,0,0) scale(${f3(lerp(1.4, 1, gp) * (1 + 0.35 * ex))})`);
      css(R, R.ghost, 'filter', blur((1 - gp) * 16 + ex * 10));
    }
    const block = R.q('.block');
    const hit = u > I ? 0.04 * Math.exp(-(u - I) / 0.16) : 0;
    css(R, block, 'transform', `translate3d(${f3(-dir * 120 * ex - dir * 10 * inv(I, D, u))}px,${f3(-20 * ex)}px,0) scale(${f3(1 + 0.022 * inv(I, D, u) + hit + 0.5 * ex)})`);
    css(R, block, 'opacity', String(f3(1 - ex)));
    css(R, block, 'filter', blur(ex * 16));
    css(R, R.q('.tick'), 'transform', `scaleX(${f3(tw(u, I - 0.3, I + 0.3))})`);
    typewriter(R, R.tws[0], s.eyebrow, u, I - 0.15, 44);
    letters(R, R.lines[0], I - 0.12, 0.022, 0.55);
    letters(R, R.lines[1], I - 0.04, 0.03, 0.6);
    rgbSplit(R, R.names[0], u, I);
    if (R.metas[0]) {
      const mp = tw(u, I + 0.45, I + 1.0, E.outCubic);
      css(R, R.metas[0], 'opacity', String(f3(mp)));
      css(R, R.metas[0], 'transform', `translate3d(0,${f3((1 - mp) * 14)}px,0)`);
    }
    css(R, R.rules[0], 'transform', `scaleX(${f3(tw(u, I + 0.3, I + 1.0))})`);
    // extrait : les paragraphes s'écrivent l'un après l'autre, au rythme de lecture
    const nq = R.qa('.dq .text').length, step = s.wordStep || 0.05;
    let t0 = I + (s.quoteAt || 1.1);
    const qm = R.q('.qm');
    if (qm) {
      const qp = tw(u, t0 - 0.25, t0 + 0.35, E.outBack);
      css(R, qm, 'opacity', String(f3(clamp(qp))));
      css(R, qm, 'transform', `scale(${f3(lerp(0.4, 1, qp))})`);
    }
    for (let k = 0; k < nq; k++) {
      wordsIn(R, R.texts[k], t0, step, 0.5);
      t0 += R.texts[k].length * step;
      // chaque passage surligné s'allume une fois son paragraphe écrit (ou à hlAt)
      const hl = s.hlAt !== undefined ? I + (Array.isArray(s.hlAt) ? s.hlAt[k] : s.hlAt + k * 0.45) : t0 + 0.35;
      highlight(R, R.texts[k], hl);
      t0 += 0.35;
    }
    (R.qa('.drow')).forEach((row, k) => {
      const at = I + (s.rowAt ? s.rowAt[k] : 1.2 + k * 0.6);
      const p = tw(u, at - 0.05, at + 0.45, E.outCubic);
      css(R, row, 'opacity', String(f3(p)));
      css(R, row, 'transform', p >= 1 ? 'none' : `translate3d(${f3((1 - p) * -30 * dir)}px,0,0)`);
      const lab = row.firstElementChild;
      const h = tw(u, at, at + 0.15) * (1 - tw(u, at + 1.0, at + 2.0));
      css(R, lab, 'boxShadow', h > 0.01 ? `0 0 ${f3(24 * h)}px rgba(${EMB},${f3(0.9 * h)})` : 'none');
    });
    const ref = R.q('.dref');
    if (ref) {
      const rp = tw(u, (s.refAt !== undefined ? I + s.refAt : t0), (s.refAt !== undefined ? I + s.refAt : t0) + 0.6, E.outCubic);
      css(R, ref, 'opacity', String(f3(rp)));
    }
    if (s.note) wordsIn(R, R.texts[nq], I + (s.noteAt || 3.5), 0.04, 0.55);
  }

  function upStat(s, u) {
    const R = s.R; R.u = u;
    const I = s.fly + (s.hitAt || 0), D = s.dur, dir = s.layout === 'R' ? -1 : 1;
    const ex = E.inCubic(inv(D - 0.08, D + 0.45, u));
    css(R, R.scrim, 'opacity', String(f3(tw(u, I - 0.7, I + 0.2, E.outCubic) * (1 - ex))));
    if (R.ghost) {
      const gp = tw(u, I - 0.4, I + 0.75, E.outExpo);
      css(R, R.ghost, 'opacity', String(f3(gp * (1 - ex))));
      css(R, R.ghost, 'transform', `translate3d(${f3(dir * lerp(80, -60, inv(I - 0.4, D + 0.45, u)))}px,0,0) scale(${f3(lerp(1.4, 1, gp) * (1 + 0.35 * ex))})`);
      css(R, R.ghost, 'filter', blur((1 - gp) * 16 + ex * 10));
    }
    const block = R.q('.block');
    const hit = u > I ? 0.045 * Math.exp(-(u - I) / 0.16) : 0;
    css(R, block, 'transform', `translate3d(${f3(-dir * 110 * ex)}px,0,0) scale(${f3(1 + 0.025 * inv(I, D, u) + hit + 0.5 * ex)})`);
    css(R, block, 'opacity', String(f3(1 - ex)));
    css(R, block, 'filter', blur(ex * 16));
    css(R, R.q('.tick'), 'transform', `scaleX(${f3(tw(u, I - 0.4, I + 0.2))})`);
    typewriter(R, R.tws[0], s.kicker, u, I - 0.3, 40);
    letters(R, R.lines[0], I - 0.1, 0.03, 0.55);
    // compteur : il monte vite puis ralentit, et se fige sur le chiffre exact
    const c0 = I + (s.countAt || 0), cd = s.countDur || 2.6;
    const cp = E.outQuart(inv(c0, c0 + cd, u));
    const stn = R.lines[1].ln;
    // le compteur avance par pas de `step` (de 1 en 1 sous 1 000, sinon 137) et ne dépasse jamais la valeur finale
    const st = s.step || (s.value < 1000 ? 1 : 137), key = Math.round(s.value * cp / (cp < 1 ? st : 1));
    if (R.numKey !== key) { R.numKey = key; stn.innerHTML = fmtNum(cp >= 1 ? s.value : Math.min(s.value, key * st)) + (s.unit ? `<i class="gs"></i>${esc(s.unit)}` : ''); }
    const sp = tw(u, c0 - 0.15, c0 + 0.35, E.outExpo);
    const land = u > c0 + cd ? Math.exp(-(u - c0 - cd) / 0.25) : 0;
    if (TL.cine) {
      // le chiffre monte avec du poids (ressort, à peine de dépassement) et s'écrase quand il se fige
      const rise = spring(u - c0 + 0.15, 0.55, 0.3), thud = u > c0 + cd ? 0.07 * (1 - spring(u - c0 - cd, 0.42, 0.45)) : 0;
      css(R, stn, 'transformOrigin', dir > 0 ? '0% 70%' : '100% 70%');
      css(R, stn, 'transform', `translate3d(0,${f3((1 - rise) * 60)}%,0) scale(${f3(1 + thud)})`);
    } else css(R, stn, 'transform', `translate3d(0,${f3((1 - sp) * 60)}%,0)`);
    css(R, stn, 'opacity', String(f3(sp)));
    css(R, stn, 'textShadow', land > 0.02 ? `0 0 ${f3(40 * land)}px rgba(${HOTM},${f3(0.8 * land)})` : 'none');
    css(R, stn, 'color', cp < 1 ? 'var(--hot)' : land > 0.02 ? `rgba(${Math.round(lerp(233, 255, land))},${Math.round(lerp(220, 174, land))},${Math.round(lerp(192, 90, land))},1)` : '');
    const lab = R.q('.stlab');
    const lp = tw(u, I + 0.35, I + 0.95, E.outCubic);
    css(R, lab, 'opacity', String(f3(lp)));
    css(R, lab, 'clipPath', `inset(-20% ${f3((1 - lp) * 100)}% -20% 0)`);
    if (R.rules[0]) css(R, R.rules[0], 'transform', `scaleX(${f3(tw(u, I + 0.6, I + 1.3))})`);
    if (s.text) { wordsIn(R, R.texts[0], I + (s.textAt || 1.4), 0.045, 0.55); highlight(R, R.texts[0], I + (s.hlAt || 4.0)); }
    if (s.grid) {
      // une case = 1 % : d'abord les terres possédées, puis le territoire attribué
      const G0 = s.grid, cells = R.cells || (R.cells = R.qa('.sgrid .cells i'));
      const g0 = I + (G0.at || 2.0), g1 = g0 + (G0.gap || 1.6);
      css(R, R.q('.sgrid'), 'opacity', String(f3(tw(u, g0 - 0.5, g0))));
      R.ck = R.ck || [];
      cells.forEach((c, j) => {
        const cls = j < G0.own && u >= g0 + j * 0.08 ? 'own' : j < G0.given && u >= g1 + (j - G0.own) * 0.03 ? 'given' : '';
        if (R.ck[j] !== cls) { R.ck[j] = cls; c.className = cls; }
      });
      const gl = R.qa('.sgrid .gl > div');
      css(R, gl[0], 'opacity', String(f3(tw(u, g0 + 0.3, g0 + 0.9))));
      css(R, gl[1], 'opacity', String(f3(tw(u, g1 + 0.6, g1 + 1.2))));
    }
    if (R.metas[0]) {
      const mp = tw(u, I + (s.sourceAt || 3.0), I + (s.sourceAt || 3.0) + 0.6, E.outCubic);
      css(R, R.metas[0], 'opacity', String(f3(mp)));
    }
  }

  function upBallot(s, u) {
    const R = s.R; R.u = u;
    const I = s.fly + (s.hitAt || 0), D = s.dur;
    const ex = E.inCubic(inv(D - 0.5, D + 0.2, u));
    css(R, R.scrim, 'opacity', String(f3(tw(u, I - 0.6, I + 0.4) * (1 - ex))));
    css(R, R.q('.tick'), 'transform', `scaleX(${f3(tw(u, I - 0.2, I + 0.4))})`);
    typewriter(R, R.tws[0], s.kicker, u, I, 40);
    const ty = R.qa('.typ');
    typewriter(R, ty[0], s.title, u, I + (s.titleAt || 0.8), s.cps || 11);
    typewriter(R, ty[1], s.sub, u, I + (s.subAt || 2.6), 30);
    typewriter(R, ty[2], s.result, u, I + (s.resultAt || 8), 22);
    const block = R.q('.block'), tally = R.q('.tally');
    css(R, block, 'opacity', String(f3(1 - ex)));
    css(R, block, 'filter', blur(ex * 12));
    const tp = tw(u, I + (s.tallyAt || 3) - 0.4, I + (s.tallyAt || 3) + 0.3, E.outCubic);
    css(R, tally, 'opacity', String(f3(tp * (1 - ex))));
    css(R, tally, 'transform', `translate3d(0,${f3((1 - tp) * 30)}px,0)`);
    css(R, R.q('.bres'), 'opacity', String(f3(1 - ex)));
    const n = voteCounts(s.start + u), nums = R.qa('.num');
    R.nk = R.nk || [];
    ['pour', 'contre', 'abstention', 'absent'].forEach((k, j) => {
      const key = String(n[k]);
      if (R.nk[j] !== key) { R.nk[j] = key; nums[j].textContent = key; }
    });
  }

  function upCap(s, u) {
    const R = s.R; R.u = u;
    const I = s.fly + (s.capAt || 0.3), D = s.out !== undefined ? s.out : s.dur;
    const block = R.q('.block');
    const ex = E.inCubic(inv(D - 0.25, D + 0.3, u));
    css(R, R.scrim, 'opacity', String(f3(tw(u, I - 0.5, I + 0.3) * (1 - ex))));
    css(R, R.q('.tick'), 'transform', `scaleX(${f3(tw(u, I - 0.2, I + 0.4))})`);
    typewriter(R, R.tws[0], s.kicker, u, I - 0.1, 40);
    letters(R, R.lines[0], I + 0.05, 0.025, 0.55);
    rgbSplit(R, R.lines[0].ln, u, I + 0.15);
    if (R.texts[0]) { wordsIn(R, R.texts[0], I + 0.6, 0.045, 0.55); highlight(R, R.texts[0], I + 0.6 + R.texts[0].length * 0.045 + 0.3); }
    const lg = R.q('.legend');
    if (lg) css(R, lg, 'opacity', String(f3(tw(u, I + (s.legendAt || 2.0), I + (s.legendAt || 2.0) + 0.6, E.outCubic))));
    css(R, block, 'opacity', String(f3(1 - ex)));
    css(R, block, 'transform', `translate3d(${f3(-60 * ex)}px,0,0)`);
    css(R, block, 'filter', blur(ex * 12));
  }

  function upQuote(s, u) {
    const R = s.R; R.u = u;
    const I = s.fly + (s.hitAt || 0), D = s.dur;
    const wrapEl = R.q('.wrap');
    const qp = tw(u, I - 0.2, I + 0.5, E.outBack);
    const qm = R.q('.qm');
    css(R, qm, 'opacity', String(f3(clamp(qp))));
    css(R, qm, 'transform', `scale(${f3(lerp(0.5, 1, qp))})`);
    wordsIn(R, R.texts[0], I + 0.3, s.wordStep || 0.09, 0.8);
    const n = R.texts[0].length * (s.wordStep || 0.09);
    highlight(R, R.texts[0], I + 0.6 + n);
    const at = I + 1.0 + n;
    typewriter(R, R.tws[0], s.author, u, at, 34, false);
    R.qa('.qa .tick').forEach((tk) => css(R, tk, 'transform', `scaleX(${f3(tw(u, at - 0.2, at + 0.4))})`));
    const qn = R.q('.qn'), qc = R.q('.qc');
    if (qn) { const np = tw(u, I + 0.5 + n, I + 1.3 + n, E.outCubic); css(R, qn, 'opacity', String(f3(np))); css(R, qn, 'clipPath', `inset(-30% 0 -30% ${f3((1 - np) * 100)}%)`); }
    if (qc) { const cp = tw(u, at + 0.9, at + 1.6, E.outCubic); css(R, qc, 'opacity', String(f3(cp))); css(R, qc, 'transform', `translate3d(0,${f3((1 - cp) * 14)}px,0)`); }
    const ex = E.inCubic(inv(D - 0.4, D + 0.4, u));
    css(R, wrapEl, 'transform', `scale(${f3(1 + 0.035 * inv(I, D, u) + 0.3 * ex)})`);
    css(R, wrapEl, 'opacity', String(f3(1 - ex)));
    css(R, wrapEl, 'filter', blur(ex * 16));
    css(R, R.scrim, 'opacity', String(f3(tw(u, I - 0.6, I + 0.2) * (1 - ex))));
  }

  // Visages : entrée en mise au point et en profondeur, liseré de braise à l'impact, faisceau qui
  // balaie le visage, réticule qui se verrouille, nom qui s'inscrit, lente dérive.
  function upFaces(s, u) {
    const R = s.R;
    if (!R.faces) R.faces = [...R.el.querySelectorAll('.fwrap')];
    s.faceList.forEach((f, k) => {
      const el = R.faces[k];
      if (!el || !f.ok) return;
      const p = tw(u, f.at, f.at + 1.15, E.outQuart);
      const ex = E.inCubic(inv(f.until - 0.15, f.until + 0.4, u));
      const vis = u >= f.at - 0.05 && u <= f.until + 0.45;
      css(R, el, 'display', vis ? 'block' : 'none');
      if (!vis) return;
      const drift = inv(f.at, f.until, u), d = f.dir;
      css(R, el, 'opacity', String(f3(clamp(p * 1.6) * (1 - ex))));
      css(R, el, 'transform', `perspective(1400px) translate3d(${f3(d * (70 * (1 - p) - 18 * drift) - d * 90 * ex)}px,${f3(80 * (1 - p))}px,0) rotateY(${f3(-d * (16 * (1 - p) + 3 * drift))}deg) scale(${f3(1.08 - 0.08 * p + 0.05 * drift + 0.3 * ex)})`);
      css(R, el, 'filter', blur((1 - p) * 16 + ex * 14));
      const hit = u > f.at + 0.35 ? Math.exp(-(u - f.at - 0.35) / 0.55) : 0;
      const glow = 0.45 + 0.55 * hit;
      css(R, el.querySelector('.fimg'), 'filter', `grayscale(1) contrast(1.24) brightness(${f3(0.86 * f.dim + 0.18 * hit)}) sepia(.32) drop-shadow(0 0 1.6px rgba(255,196,128,${f3(0.95 * glow)})) drop-shadow(0 0 ${f3(16 + 26 * glow)}px rgba(${EMB},${f3(0.55 * glow)}))`);
      // faisceau lumineux qui descend sur le visage
      const sc = inv(f.at + 0.45, f.at + 1.35, u);
      const scan = el.querySelector('.fscan');
      css(R, scan, 'opacity', String(f3(sc > 0 && sc < 1 ? Math.sin(PI * sc) : 0)));
      css(R, scan, 'backgroundPosition', `0 ${f3(-30 + 160 * E.inOutSine(sc))}%`);
      // réticule
      const q = tw(u, f.at + 0.55, f.at + 1.05, E.outExpo);
      const reti = el.querySelector('.freti');
      css(R, reti, 'opacity', String(f3(q * (u < f.at + 2.6 ? 1 : 0.55))));
      css(R, reti, 'transform', `scale(${f3((1.75 - 0.75 * q) * (1 + 0.012 * Math.sin(u * 3.1)))}) rotate(${f3((1 - q) * 14)}deg)`);
      const tag = el.querySelector('.ftag');
      if (tag) {
        typewriter(R, tag.querySelector('b'), f.name.toUpperCase(), u, f.at + 0.8, 32, false);
        const tp = tw(u, f.at + 1.05, f.at + 1.6, E.outCubic);
        css(R, tag.querySelector('span'), 'opacity', String(f3(tp)));
        css(R, tag.querySelector('.ftick'), 'transform', `scaleX(${f3(tw(u, f.at + 0.7, f.at + 1.2))})`);
      }
    });
  }

  // lien de braise du visage vers son lieu sur la carte (dessiné sous le visage, dans la carte)
  function drawFaceLinks(g, t) {
    for (const s of SEG) {
      if (!s.faceList.length) continue;
      const u = t - s.start;
      for (const f of s.faceList) {
        if (!f.ok || !f.link || u < f.at + 0.5 || u > f.until + 0.4) continue;
        const lp = tw(u, f.at + 0.6, f.at + 1.5, E.inOutCubic), out = 1 - tw(u, f.until - 0.3, f.until + 0.2);
        if (lp <= 0.01 || out <= 0.01) continue;
        const P = proj(f.link.X, f.link.Y), x0 = f.hx, y0 = f.hy + f.hr * 0.6, x1 = P.x, y1 = P.y;
        const cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - 120;
        const pt = (q) => [(1 - q) * (1 - q) * x0 + 2 * (1 - q) * q * cx + q * q * x1, (1 - q) * (1 - q) * y0 + 2 * (1 - q) * q * cy + q * q * y1];
        g.save();
        g.lineCap = 'round';
        g.beginPath();
        for (let j = 0; j <= 40; j++) { const [x, y] = pt((j / 40) * lp); if (!j) g.moveTo(x, y); else g.lineTo(x, y); }
        g.globalCompositeOperation = 'lighter';
        g.strokeStyle = rgba(COL.ember, 0.22 * out); g.lineWidth = 7; g.stroke();
        g.setLineDash([2, 8]); g.lineDashOffset = -t * 40;
        g.strokeStyle = rgba(COL.hot, 0.9 * out); g.lineWidth = 2; g.stroke();
        g.setLineDash([]);
        const [hx, hy] = pt(lp);
        sprite(g, SPR.hot, hx, hy, 120, 0.8 * out);
        sprite(g, SPR.spark, hx, hy, 30, out);
        g.restore();
      }
    }
  }

  // flèche lumineuse d'un visage vers un autre (expéditeur → destinataire, duo)
  function drawFaceArrows(t) {
    const g = hud;
    for (const s of SEG) {
      if (!s.faceList.length) continue;
      const u = t - s.start;
      s.faceList.forEach((f) => {
        if (f.arrowTo === undefined) return;
        const o = s.faceList[f.arrowTo];
        if (!f.ok || !o || !o.ok) return;
        const t0 = Math.max(f.at, o.at) + 0.9;
        const lp = tw(u, t0, t0 + 0.8, E.inOutCubic), out = 1 - tw(u, Math.min(f.until, o.until) - 0.3, Math.min(f.until, o.until) + 0.1);
        if (lp <= 0.01 || out <= 0.01) return;
        const x0 = f.hx + Math.sign(o.hx - f.hx) * f.hr * 1.15, y0 = f.hy - f.hr * 0.2;
        const x1 = o.hx - Math.sign(o.hx - f.hx) * o.hr * 1.15, y1 = o.hy - o.hr * 0.2;
        const cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - 140;
        const pt = (q) => [(1 - q) * (1 - q) * x0 + 2 * (1 - q) * q * cx + q * q * x1, (1 - q) * (1 - q) * y0 + 2 * (1 - q) * q * cy + q * q * y1];
        g.save();
        g.globalAlpha = out; g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath();
        for (let j = 0; j <= 40; j++) { const [x, y] = pt((j / 40) * lp); if (!j) g.moveTo(x, y); else g.lineTo(x, y); }
        g.globalCompositeOperation = 'lighter';
        g.strokeStyle = rgba(COL.ember, 0.3); g.lineWidth = 9; g.stroke();
        g.strokeStyle = rgba(COL.hot, 0.95); g.lineWidth = 2.4; g.stroke();
        const [ax, ay] = pt(lp), [bx, by] = pt(Math.max(0, lp - 0.04));
        const an = Math.atan2(ay - by, ax - bx);
        g.beginPath(); g.moveTo(ax - Math.cos(an - 0.45) * 18, ay - Math.sin(an - 0.45) * 18); g.lineTo(ax, ay); g.lineTo(ax - Math.cos(an + 0.45) * 18, ay - Math.sin(an + 0.45) * 18); g.stroke();
        sprite(g, SPR.spark, ax, ay, 34, 1);
        if (f.label && lp > 0.6) {
          const [mx, my] = pt(0.5);
          g.globalCompositeOperation = 'source-over';
          g.globalAlpha = out * tw(lp, 0.6, 1);
          g.font = '500 15px "DM Mono"'; g.letterSpacing = '2.5px'; g.textAlign = 'center'; g.textBaseline = 'bottom';
          g.fillStyle = rgba(COL.hot, 1); g.fillText(f.label.toUpperCase(), mx, my - 10);
        }
        g.restore();
      });
    }
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
      else if (s.type === 'roll') upRoll(s, u);
      else if (s.type === 'part') upPart(s, u);
      else if (s.type === 'chapter') upChapter(s, u);
      else if (s.type === 'doc') upDoc(s, u);
      else if (s.type === 'stat') upStat(s, u);
      else if (s.type === 'quote') upQuote(s, u);
      else if (s.type === 'cap') upCap(s, u);
      else if (s.type === 'ballot') upBallot(s, u);
      else if (s.type === 'camera') { /* plan de caméra sans texte */ }
      else upCenter(s, u);
      if (s.faceList.length) upFaces(s, u);
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
  // fuites de lumière (pellicule voilée) : avec TL.cine, aux grands mouvements de caméra (une toutes les 9 s au plus),
  // ou là où la timeline les place (TL.leaks : [{ t, dur, k }]) ; TL.leaks === false les coupe
  const lk = $('leak').getContext('2d');
  const LEAKS = (() => {
    if (TL.leaks === false || (!TL.cine && !Array.isArray(TL.leaks))) return [];
    if (Array.isArray(TL.leaks)) return TL.leaks.map((l, i) => ({ dur: 1.4, k: 0.24, ...l, seed: 101 + i }));
    const out = [];
    SEG.forEach((s, i) => {
      if (i === 0 || s.fly < 1.0 || s.type === 'outro') return;
      const t0 = s.start + 0.35 * s.fly;
      if (out.length && t0 - out[out.length - 1].t < 9) return;
      out.push({ t: t0, dur: 1.3, k: 0.2, seed: 101 + i });
    });
    return out;
  })();
  function drawLeaks(t) {
    lk.clearRect(0, 0, W, H);
    for (const L of LEAKS) {
      const p = (t - L.t) / L.dur;
      if (p <= 0 || p >= 1) continue;
      const r = mulberry32(L.seed), env = Math.pow(Math.sin(Math.PI * p), 1.6) * L.k, side = r() < 0.5 ? -1 : 1;
      lk.globalCompositeOperation = 'lighter';
      for (let j = 0; j < 4; j++) {
        // taches chaudes qui glissent de travers sur l'image, comme la lumière qui entre dans le magasin de pellicule
        const hue = [[255, 168, 72], [255, 96, 40], [255, 214, 150], [235, 70, 30]][j];
        const y = H * (0.15 + 0.7 * r()), size = W * (0.35 + 0.5 * r()), speed = 0.6 + 0.8 * r();
        const x = W * (0.5 + side * (-0.9 + 1.8 * E.inOutSine(clamp(p * speed + 0.15 * r()))));
        const wob = 0.12 * Math.sin(t * (2 + r() * 3) + j);
        const g = lk.createRadialGradient(x, y, 0, x, y, size * (1 + wob));
        g.addColorStop(0, `rgba(${hue[0]},${hue[1]},${hue[2]},${f3(env * (0.9 - 0.15 * j))})`);
        g.addColorStop(0.45, `rgba(${hue[0]},${hue[1]},${hue[2]},${f3(env * 0.35)})`);
        g.addColorStop(1, `rgba(${hue[0]},${hue[1]},${hue[2]},0)`);
        lk.fillStyle = g;
        lk.fillRect(0, 0, W, H);
      }
      lk.globalCompositeOperation = 'source-over';
    }
  }
  const hudIdx = $('hudIdx'), hudCoord = $('hudCoord');
  const clockEl = $('clock');
  const CLOCK = (TL.clock || []).map((c) => ({ ...c, until: c.until !== undefined ? c.t - c.at + c.until : undefined }));
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
    const dk = TL.cine ? 1 : 0, dfx = 12 * dk * Math.sin(t * 0.11 + 0.7), dfy = 7 * dk * Math.sin(t * 0.083 + 2.1);  // les textes flottent à peine devant la carte
    typeEl.style.transform = `translate3d(${f3(shx + dfx)}px,${f3(shy + dfy)}px,0)`;

    updateType(t);

    // HUD
    const yr = yearAt(t);
    const HUD = TL.hud;
    const hudOut = 1 - tw(t, OUTRO.end - 2.2, OUTRO.end - 1.0, E.inCubic);
    const hudA = tw(t, HUD.from, HUD.from + 1.2, E.outCubic) * hudOut;
    drawHud(t, yr, hudA);
    if (HAS_FACES) drawFaceArrows(t);
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
    if (CLOCK.length) {
      let cur = null;
      for (const c of CLOCK) if (t >= c.t) cur = c;
      const txt = cur && t < (cur.until !== undefined ? cur.until : TL.total) ? cur.text : '';
      if (clockEl.textContent !== txt) clockEl.textContent = txt;
      const ch = cur ? Math.exp(-(t - cur.t) / 0.25) : 0;
      clockEl.style.opacity = String(f3(txt ? 0.85 + 0.15 * ch : 0));
      clockEl.style.textShadow = ch > 0.02 ? `0 0 ${f3(30 * ch)}px rgba(${HOTM},${f3(0.9 * ch)})` : `0 0 14px rgba(${EMB},.45)`;
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
    drawLeaks(t);

    // grain
    gr.globalCompositeOperation = 'source-over';
    gr.globalAlpha = 1;
    const ox = Math.floor(rnd() * 512), oy = Math.floor(rnd() * 512);
    for (let y = -oy; y < H; y += 512) for (let x = -ox; x < W; x += 512) gr.drawImage(GRAIN, x, y);
    // poussières et rayures de pellicule
    const nd = rnd() < 0.35 ? 1 : 0;
    for (let i = 0; i < nd; i++) {
      gr.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.9)' : 'rgba(255,255,255,.8)';
      gr.beginPath(); gr.ellipse(rnd() * W, rnd() * H, 1 + rnd() * 3, 1 + rnd() * 2, rnd() * 3, 0, 7); gr.fill();
    }
    if (rnd() < 0.02) { gr.fillStyle = 'rgba(255,255,255,.4)'; gr.fillRect(rnd() * W, 0, 1.2, H); }
  }

  // Charge chaque photo détourée, repère la tête dans le canal alpha et y place réticule et nom.
  // Une photo absente est simplement ignorée (le reste de la pièce se rend normalement).
  const FACE_IMGS = []; // références gardées : le navigateur ne relâche pas l'image, le CSS la retrouve entière
  async function loadFaces() {
    const jobs = [];
    for (const s of SEG) s.faceList.forEach((f, k) => jobs.push(new Promise((done) => {
      const img = new Image();
      FACE_IMGS.push(img);
      img.onload = () => {
        const el = s.R.el.querySelectorAll('.fwrap')[k];
        const geo = () => {
          const sc = Math.min(f.w / img.naturalWidth, f.h / img.naturalHeight);
          const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc, left = f.x - dw / 2, top = H - dh - (f.lift || 0);
          const cw = Math.max(1, Math.round(dw / 4)), ch = Math.max(1, Math.round(dh / 4));
          const c = canvas(cw, ch), g = c.getContext('2d');
          g.drawImage(img, 0, 0, cw, ch);
          const A = g.getImageData(0, 0, cw, ch).data, opaque = (x, y) => A[(y * cw + x) * 4 + 3] > 128;
          let y0 = 0;
          while (y0 < ch - 1 && ![...Array(cw).keys()].some((x) => opaque(x, y0))) y0++;
          const pH = ch - y0, yMid = Math.min(ch - 1, Math.round(y0 + 0.17 * pH));
          let x0 = cw, x1 = 0;
          for (let x = 0; x < cw; x++) if (opaque(x, yMid)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
          const found = x1 > x0;
          if (!found) { x0 = 0; x1 = cw - 1; }
          return { dh, left, top, x0, x1, y0, pH, yMid, found };
        };
        let G = geo();
        // paire : têtes de même largeur (norm, en px) et alignées en haut (headTop), quel que soit
        // le cadrage de la photo d'origine ; le bas du buste est déjà fondu dans le PNG
        if (f.norm && G.found) {
          const kk = clamp(f.norm / ((G.x1 - G.x0) * 4), 0.6, 1.4);
          f.w = Math.round(f.w * kk); f.h = Math.round(f.h * kk);
          G = geo();
          if (f.headTop !== undefined) { f.lift = Math.round(clamp(G.top + G.y0 * 4 - f.headTop, -260, 360)); G = geo(); }
          Object.assign(el.querySelector('.face').style, { left: `${f.x - f.w / 2}px`, width: `${f.w}px`, height: `${f.h}px`, bottom: `${f.lift || 0}px` });
        }
        const { left, top, x0, x1, pH, yMid } = G;
        f.hx = left + ((x0 + x1) / 2) * 4; f.hy = top + yMid * 4;
        f.hr = Math.max((x1 - x0) * 4 * 0.62, pH * 4 * 0.13);
        const reti = el.querySelector('.freti'), r = f.hr * 1.25;
        Object.assign(reti.style, { left: `${f.hx - r}px`, top: `${f.hy - r * 1.05}px`, width: `${2 * r}px`, height: `${2.2 * r}px` });
        const tag = el.querySelector('.ftag');
        if (tag) {
          // au-dessus de la tête, sauf si elle est si haute que le nom toucherait le bandeau du haut :
          // il passe alors à côté de la tête
          const above = f.hy - r * 1.05 - 92, side = f.tagPos === 'above' && above < 118;
          if (side) tag.classList.replace('ta', f.dir > 0 ? 'tl' : 'tr');
          const ty = side ? Math.max(118, f.hy - r * 1.05) : f.hy - 30;
          if (f.tagPos === 'above' && !side) Object.assign(tag.style, { left: `${f.hx - 320}px`, width: '640px', top: `${above}px` });
          else if (f.dir > 0) Object.assign(tag.style, { right: `${W - (f.hx - r - 26)}px`, top: `${ty}px` });
          else Object.assign(tag.style, { left: `${f.hx + r + 26}px`, top: `${ty}px` });
        }
        f.ok = true;
        img.decode().catch(() => {}).then(done);
      };
      img.onerror = () => { const el = s.R.el.querySelectorAll('.fwrap')[k]; if (el) el.style.display = 'none'; done(); };
      img.src = f.photo;
    })));
    await Promise.all(jobs);
  }

  async function init() {
    await document.fonts.ready;
    const probes = ['760 34px "Archivo"', '400 13px "DM Mono"', '500 13px "DM Mono"', 'italic 400 38px "Newsreader"', '400 30px "Newsreader"', '600 50px "Noto Sans Hebrew"', '600 44px "Noto Kufi Arabic"', '700 30px "Courier Prime"', '400 30px "Courier Prime"'];
    await Promise.all(probes.map((p) => document.fonts.load(p, 'AÉأאz')));
    buildSegments();
    await loadFaces();
    await loadRelief();
    await loadCarte();
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
