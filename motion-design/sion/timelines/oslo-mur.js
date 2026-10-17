/*
 * Séquence « Oslo et le mur » (chapitre 23), ≈ 50 s.
 *
 * Données : OCHA (HDX), zones des accords d'Oslo en Cisjordanie (source Autorité palestinienne,
 * ministère du Plan) et tracé du mur de séparation, janvier 2018 (CC BY) ; voir tools/prep_ocha.py.
 * Faits et chiffres retenus :
 *   - accords d'Oslo II, 28 septembre 1995 : zones A, B et C, en attendant un accord final ;
 *   - zones A et B : environ 40 % de la Cisjordanie (35,7 % + réserves de Wye River dans ces données),
 *     plus de 160 îlots séparés (172 morceaux dans les données de l'OCHA) ;
 *   - zone C : environ 60 % (58,8 % dans ces données), sous contrôle israélien total ; toutes les
 *     colonies s'y trouvent ;
 *   - mur : construction commencée en 2002 ; en janvier 2018, 464 km construits, 51 km en
 *     construction, 198 km prévus (714 km au total) ; environ 85 % du tracé en Cisjordanie (OCHA) ;
 *   - Cour internationale de justice, avis consultatif du 9 juillet 2004 : contraire au droit
 *     international.
 */
(function (root) {
  const CAM = { lon: 34.86, lat: 31.95, w: 0.052, pitch: 40, bearing: -6 };
  const segments = [
    {
      id: 'oslo', type: 'beat', dur: 6.0, hitAt: 1.0, reveal: 'slam', rgb: 14,
      kicker: '28 septembre 1995 · accords d’Oslo II', word: 'Oslo',
      sub: 'La Cisjordanie est découpée en trois zones, en attendant un accord final qui n’est jamais venu.', subAt: 1.4,
      cam: { ...CAM, w: 0.07, pitch: 34 },
      camEnd: { ...CAM, w: 0.062, pitch: 38 },
    },
    {
      id: 'ab', type: 'cap', dur: 11.0, fly: 1.6, anchor: [330, -60], textW: 860,
      kicker: 'Zones A et B · environ 40 %', title: 'Un archipel',
      text: 'Les villes et la plupart des villages passent sous administration palestinienne, la sécurité restant israélienne en zone B. Un archipel de [[plus de 160 îlots]].',
      cam: CAM, camEnd: { ...CAM, w: 0.048, bearing: -2 },
    },
    {
      id: 'c', type: 'cap', dur: 10.0, fly: 1.2, anchor: [330, -60], textW: 860,
      kicker: 'Zone C · environ 60 %', title: 'Tout le reste',
      text: 'Autour des îlots, Israël garde tout le contrôle : terres, routes, eau, permis de construire. [[C’est là que s’étendent les colonies.]]',
      cam: { ...CAM, w: 0.048, bearing: -2 }, camEnd: { ...CAM, w: 0.045, bearing: 2 },
    },
    {
      id: 'mur', type: 'cap', dur: 13.0, fly: 1.2, anchor: [330, -60], textW: 860,
      kicker: '2002 — aujourd’hui', title: 'Le mur',
      text: 'En 2018, 464 km sont construits sur 714 prévus, en grande partie à l’intérieur de la Cisjordanie. En 2004, [[la Cour internationale de justice le déclare contraire au droit international.]]',
      cam: { ...CAM, w: 0.045, bearing: 2 }, camEnd: { ...CAM, lon: 34.9, w: 0.042, pitch: 46, bearing: 6 },
    },
    {
      id: 'fin', type: 'outro', dur: 8.5, fly: 1.6, hitAt: 1.0,
      eyebrow: 'Cisjordanie, aujourd’hui',
      lines: ['Des îlots', 'cernés par la zone C', 'et par un mur.'],
      cam: { ...CAM, w: 0.06, pitch: 36 }, camEnd: { ...CAM, w: 0.064, pitch: 34, bearing: 0 },
    },
  ];

  const zones = [], plans = [], markers = [];
  // les zones s'effacent pendant que le mur se dessine, puis reviennent toutes ensemble à la fin
  zones.push({ seg: 'ab', at: 0.9, dur: 3.2, name: ['oslo-ab', 'oslo-reserve'], from: [35.2, 31.9], tone: 'life', until: 22.0 });
  zones.push({ seg: 'c', at: 0.6, dur: 3.0, name: 'oslo-c', from: [35.45, 31.85], until: 11.0 });
  zones.push({ seg: 'mur', at: 0.2, dur: 1.2, name: 'cisjordanie', from: [35.25, 31.95], tone: 'stone', until: 13.4 });
  zones.push({ seg: 'fin', at: 0.6, dur: 1.4, name: 'oslo-c', from: [35.45, 31.85] });
  zones.push({ seg: 'fin', at: 0.9, dur: 1.4, name: ['oslo-ab', 'oslo-reserve'], from: [35.2, 31.9], tone: 'life' });
  // le mur, construit (trait plein) puis en construction et prévu (pointillés), du nord au sud
  const MUR = root.MUR || {};
  const north = (l) => Math.max(...l.map((p) => p[1]));
  [['construit', 'focus', 0.8], ['en construction', 'dash', 3.6], ['prevu', 'dash', 4.4]].forEach(([k, style, t0]) =>
    (MUR[k] || []).forEach((path) => plans.push({ seg: 'mur', at: t0 + 2.6 * (32.6 - north(path)) / 1.3, dur: 1.6, style, path, any: true })));
  // étiquettes posées sur le tracé réel : milieu du plus long tronçon construit, et du plus long prévu
  const mid = (l) => l[Math.floor(l.length / 2)];
  const longest = (ls) => ls.reduce((a, b) => (b.length > a.length ? b : a), ls[0]);
  if (MUR.construit) { const [lon, lat] = mid(longest(MUR.construit)); markers.push({ seg: 'mur', at: 5.6, label: 'Mur construit', lon, lat, dir: [-1, -1], off: 50, endAt: 13.3 }); }
  if (MUR.prevu) { const [lon, lat] = mid(longest(MUR.prevu)); markers.push({ seg: 'mur', at: 6.4, label: 'Tracé prévu', lon, lat, dir: [1, 1], off: 50, endAt: 13.3 }); }
  // le mur reste visible jusqu'à la fin
  plans.forEach((pl) => { pl.until = 23.0; });

  const clock = [
    { seg: 'oslo', at: 0.2, text: '28 septembre 1995' },
    { seg: 'mur', at: 0.2, text: '2002 — 2018' },
    { seg: 'fin', at: 0.2, text: '' },
  ];

  root.TL = root.buildTL({
    name: 'oslo-mur',
    seed: 1995,
    segments,
    zones,
    plans,
    markers,
    clock,
    hud: { label: ['Sion', 'Chapitre 23 · Oslo et le mur'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
