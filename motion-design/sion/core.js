/*
 * Socle commun à toutes les pièces du kit SION : villes de contexte et calcul
 * du minutage (débuts, impacts, éclairs, vols de caméra). Utilisé à l'identique
 * par le rendu image (navigateur) et par la bande-son (Node).
 */
(function (root) {
  // Villes de contexte (affichées selon le niveau de zoom) : [nom, lon, lat, rang]
  const CITIES = [
    ['Jérusalem', 35.22, 31.78, 3], ['Tel-Aviv', 34.78, 32.08, 2], ['Jaffa', 34.75, 32.05, 1],
    ['Haïfa', 34.99, 32.79, 2], ['Gaza', 34.46, 31.50, 2], ['Naplouse', 35.26, 32.22, 1],
    ['Jéricho', 35.44, 31.86, 1], ['Hébron', 35.10, 31.53, 1], ['Ramallah', 35.20, 31.90, 1],
    ['Beersheba', 34.79, 31.25, 1], ['Jénine', 35.30, 32.46, 1], ['Nazareth', 35.30, 32.70, 1],
    ['Tibériade', 35.53, 32.79, 1], ['Acre', 35.08, 32.92, 1], ['Eilat', 34.95, 29.56, 1],
    ['Beyrouth', 35.50, 33.89, 2], ['Damas', 36.29, 33.51, 2], ['Amman', 35.93, 31.95, 2],
    ['Le Caire', 31.24, 30.04, 3], ['Alexandrie', 29.92, 31.20, 2], ['Port-Saïd', 32.30, 31.26, 1],
    ['Suez', 32.55, 29.97, 1], ['Bagdad', 44.37, 33.31, 2], ['Koweït', 47.98, 29.37, 2],
    ['Riyad', 46.72, 24.69, 2], ['Nicosie', 33.38, 35.17, 1], ['Istanbul', 28.98, 41.01, 2],
    ['Ankara', 32.86, 39.93, 1], ['Athènes', 23.73, 37.98, 2], ['Rome', 12.50, 41.90, 2],
    ['Vienne', 16.37, 48.21, 3], ['Bâle', 7.59, 47.56, 2], ['Paris', 2.35, 48.86, 3],
    ['Londres', -0.13, 51.51, 3], ['Berlin', 13.40, 52.52, 2], ['Varsovie', 21.01, 52.23, 2],
    ['Odessa', 30.73, 46.48, 2], ['Moscou', 37.62, 55.75, 2], ['Oslo', 10.75, 59.91, 2],
    ['Genève', 6.14, 46.20, 1], ['Zurich', 8.54, 47.37, 1], ['Bruxelles', 4.35, 50.85, 1],
    ['Washington', -77.04, 38.91, 3], ['Baltimore', -76.61, 39.29, 1], ['Camp David', -77.465, 39.648, 1],
    ['New York', -74.0, 40.71, 2], ['Philadelphie', -75.16, 39.95, 1], ['Tunis', 10.18, 36.80, 2],
    ['Le Golan', 35.75, 33.0, 1], ['Sinaï', 33.8, 29.5, 2], ['Kichinev', 28.86, 47.01, 1],
    ['Rishon LeZion', 34.80, 31.96, 1],
  ];

  // Personnes montrées à l'écran : photo détourée portraits/<clé>.png (voir portraits/LISEZMOI.md)
  const PEOPLE = {
    dreyfus: ['Alfred Dreyfus', '1859-1935'], herzl: ['Theodor Herzl', '1860-1904'],
    balfour: ['Arthur Balfour', '1848-1930'], rothschild: ['Walter Rothschild', '1868-1937'],
    mcmahon: ['Henry McMahon', '1862-1949'], 'hussein-ben-ali': ['Hussein ben Ali', 'v. 1854-1931'],
    sykes: ['Mark Sykes', '1879-1919'], picot: ['François Georges-Picot', '1870-1951'],
    koestler: ['Arthur Koestler', '1905-1983'], arlozoroff: ['Haïm Arlozoroff', '1899-1933'],
    'ben-gourion': ['David Ben Gourion', '1886-1973'], meir: ['Golda Meir', '1898-1978'],
    arafat: ['Yasser Arafat', '1929-2004'], netanyahou: ['Benyamin Netanyahou', 'né en 1949'],
    lieberman: ['Avigdor Lieberman', 'né en 1958'], bhl: ['Bernard-Henri Lévy', 'né en 1948'],
    finkielkraut: ['Alain Finkielkraut', 'né en 1949'], rabin: ['Yitzhak Rabin', '1922-1995'],
    sharon: ['Ariel Sharon', '1928-2014'], darwich: ['Mahmoud Darwich', '1941-2008'],
  };
  root.CITIES = CITIES;
  root.face = (key, opts = {}) => ({ photo: `portraits/${key}.png`, name: (PEOPLE[key] || [key])[0], dates: (PEOPLE[key] || [])[1] || '', ...opts });

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let r = Math.imul(a ^ (a >>> 15), 1 | a);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  const HUD_DEFAULT = { label: null, index: false, coords: true, ruler: false, odo: false, from: 0.6 };

  root.buildTL = function (def) {
    const segments = def.segments;
    let t = 0;
    segments.forEach((s, i) => {
      s.start = t;
      s.end = t + s.dur;
      if (i === 0) s.fly = 0;
      else if (s.fly === undefined) s.fly = s.type === 'outro' ? 2.4 : 1.25;
      // la cible de caméra hérite du lieu de la fiche
      if (s.cam && s.lon !== undefined && s.cam.lon === undefined) { s.cam.lon = s.lon; s.cam.lat = s.lat; }
      if (s.camEnd && s.camEnd.lon === undefined && s.cam) { s.camEnd.lon = s.cam.lon; s.camEnd.lat = s.cam.lat; }
      s.impact = s.start + s.fly + (s.hitAt || 0);
      t = s.end;
    });
    const total = t;
    const byId = Object.fromEntries(segments.filter((s) => s.id).map((s) => [s.id, s]));

    // Impacts (flash, secousse, son) : mêmes instants pour l'image et le son.
    const impacts = [];
    segments.forEach((s, i) => {
      const add = (tt, k, kind = 'hit', visual = true) => impacts.push({ t: tt, k, kind, seg: i, visual });
      if (s.type === 'figure' || s.type === 'pair') add(s.impact, 1);
      if (s.type === 'split') { add(s.impact + 0.05, 0.85); add(s.impact + 0.5, 0.6); }
      if (s.type === 'event') add(s.impact, 1.3, 'event');
      if (s.type === 'intro') add(1.05, 0.75);
      if (s.type === 'outro') [0, 0.55, 1.1].forEach((d, j) => add(s.impact - 0.2 + d, 0.6 + j * 0.25));
      if (s.type === 'beat' || s.type === 'part') add(s.impact, s.k || 1, s.hitKind || 'hit');
      if (s.type === 'title') add(s.impact, s.k || 1.3, 'title');
      if (s.type === 'credit') add(s.impact, s.k || 0.45, 'soft');
      if (s.type === 'chapter') add(s.impact, s.reveal === 'focus' ? 0.5 : 0.9, s.reveal === 'focus' ? 'soft' : 'hit');
      if (s.type === 'doc') add(s.impact, s.k || 0.85, s.hitKind || 'hit');
      if (s.type === 'quote') add(s.impact, s.k || 0.45, 'soft');
      if (s.type === 'stat') {
        add(s.impact, s.k || 0.9, s.hitKind || 'hit');
        // le compteur tourne : déclics de plus en plus espacés, puis impact à l'arrivée
        const c0 = s.impact + (s.countAt || 0), cd = s.countDur || 2.6;
        for (let j = 1; j <= 14; j++) add(c0 + cd * (1 - Math.pow(1 - j / 15, 0.6)), 0.3, 'tick', false);
        add(c0 + cd, 0.55, 'soft', false);
      }
      (s.extraHits || []).forEach(([d, k]) => add(s.impact + d, k));
    });
    // repères numérotés sur la carte (ouvertures de partie)
    const markers = (def.markers || []).map((m) => ({ ...m, t: byId[m.seg].start + m.at, hideT: m.hideAt !== undefined ? byId[m.seg].start + m.hideAt : undefined, endT: m.endAt !== undefined ? byId[m.seg].start + m.endAt : undefined }));
    markers.forEach((m) => impacts.push({ t: m.t, k: 0.3, kind: 'tick', seg: segments.indexOf(byId[m.seg]), visual: false }));
    impacts.sort((a, b) => a.t - b.t);

    // Vols de caméra (souffles dans la bande-son)
    const flights = [];
    segments.forEach((s, i) => {
      if (s.type === 'chapter') { flights.push({ t0: s.start, dur: 1.1, dir: i % 2 ? -1 : 1, big: false }); return; }
      if (i === 0 || s.fly <= 0 || s.noWhoosh) return;
      const prev = segments[i - 1];
      const lon = (x) => (x.lon !== undefined ? x.lon : x.cam ? x.cam.lon : 0);
      flights.push({ t0: s.start, dur: s.fly, dir: Math.sign(lon(s) - lon(prev)) || 1, big: s.fly > 1.5 });
    });

    // Éclairs lointains (artillerie) : aléatoires mais figés.
    const rnd = mulberry32(def.seed || 1948);
    const flashes = [];
    const segAt = (x) => segments.find((s) => x >= s.start && x < s.end) || segments[segments.length - 1];
    let ft = def.flashStart !== undefined ? def.flashStart : 0.8;
    while (ft < total - 1.0) {
      const inQuiet = segments.some((s) => s.quiet && ft > s.start - 0.2 && ft < s.end + 0.3);
      if (!inQuiet) {
        const near = segAt(ft).flashNear || 0;
        flashes.push({
          t: ft,
          x: 0.08 + rnd() * 0.84,
          y: 0.70 - near * 0.35 + rnd() * (0.32 + near * 0.3),
          size: 0.18 + rnd() * 0.35,
          power: 0.35 + rnd() * 0.65,
        });
      }
      ft += (0.9 + rnd() * 2.6) / (segAt(ft).flashRate || 1);
    }

    // Flux humains (particules sur la carte) : temps absolus
    const flows = (def.flows || []).map((f) => {
      const s = byId[f.seg];
      return { ...f, t: s.start + f.at, tEnd: f.endAt !== undefined ? s.start + f.endAt : s.end + 0.35 };
    });

    // Guerre : unités (chars, avions, navires, bulldozers), flèches d'offensive, frappes,
    // territoires qui se hachurent, horloge. Temps relatifs à leur séquence → absolus.
    const abs = (list) => (list || []).map((x) => ({ ...x, t: byId[x.seg].start + x.at }));
    const units = abs(def.units);
    const arrows = abs(def.arrows);
    const zones = abs(def.zones);
    const clock = abs(def.clock).sort((a, b) => a.t - b.t);
    const strikes = abs(def.strikes);
    // les chars qui tirent : chaque tir provoque un impact sur la cible
    units.forEach((u) => (u.fire || []).forEach((f) => strikes.push({ t: byId[u.seg].start + f.at + 0.22, lon: f.to[0], lat: f.to[1], power: f.power || 0.7, smoke: f.smoke !== false, fromFire: true })));
    strikes.forEach((st) => impacts.push({ t: st.t, k: Math.min(1.2, st.power || 1), kind: 'boom', seg: segments.indexOf(segAt(st.t)), visual: false }));
    // plans au sol (remparts, esplanades) et maisons en relief qui s'effondrent à `fall`
    const plans = abs(def.plans);
    // fusées éclairantes : départ du coup (sourd, lointain)
    const flares = abs(def.flares);
    const lights = abs(def.lights).map((l) => ({ ...l, offT: l.off !== undefined ? byId[l.seg].start + l.off : undefined, tEnd: l.until !== undefined ? byId[l.seg].start + l.until : total + 1 }));
    flares.forEach((f) => impacts.push({ t: f.t - 0.15, k: 0.2, kind: 'soft', seg: segments.indexOf(segAt(f.t)), visual: false }));
    const blocks = abs(def.blocks).map((b) => ({ ...b, tf: b.fall !== undefined ? byId[b.seg].start + b.fall : undefined }));
    // réseaux de faux comptes : apparition à `at`, suppression à partir de `off`, effacement à `until`
    // noms remplacés sur la carte : l'ancien nom s'écrit, est barré, le nouveau s'écrit par-dessus
    const renames = abs(def.renames).map((r) => ({ ...r, tEnd: r.until !== undefined ? byId[r.seg].start + r.until : total + 1 }));
    const nets = abs(def.nets).map((n) => ({ ...n, offT: n.off !== undefined ? byId[n.seg].start + n.off : undefined, tEnd: n.until !== undefined ? byId[n.seg].start + n.until : total + 1 }));
    blocks.forEach((b, i) => { if (b.fall !== undefined && i % 3 === 0) impacts.push({ t: b.tf, k: 0.5 + 0.5 * ((i * 7) % 5) / 4, kind: 'crumble', seg: segments.indexOf(segAt(b.tf)), visual: false }); });
    impacts.sort((a, b) => a.t - b.t);

    // Silences (coupure sonore avant un impact)
    const silences = segments.filter((s) => s.silenceBefore).map((s) => ({ t0: s.impact - s.silenceBefore, t1: s.impact }));

    return {
      name: def.name || 'piece',
      segments, total, impacts, flights, flashes, markers, silences, flows, units, arrows, zones, clock, strikes, plans, blocks, flares, lights, nets, renames,
      events: def.events || [],
      cities: def.cities || CITIES,
      hud: Object.assign({}, HUD_DEFAULT, def.hud || {}),
      sound: def.sound || {},
      leaks: def.leaks,
      cine: def.cine,
      route: def.route !== false,
      fadeIn: def.fadeIn !== undefined ? def.fadeIn : 1.0,
      fadeOut: def.fadeOut !== undefined ? def.fadeOut : 1.25,
      fps: 25, width: 1920, height: 1080,
      // relief : le relief éclairé de la carte du partage (SRTM, NASA) sous toute la pièce, effacé de près
      partage: def.relief ? { center: [35.0, 31.6], land: { seg: segments[0].id, at: 0, dur: 0.05 }, fadeBelow: (def.relief.fadeBelow || [0.004, 0.008]) } : undefined,
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
