/*
 * Séquence « Jérusalem » (chapitre 19), ≈ 1 min.
 *
 * Tracés : vieille ville et esplanade (tracés approchés, repris de six-jours.js) ; limite municipale
 * de Jérusalem-Est déclarée par Israël et tracé du mur, OCHA (HDX) ; voir tools/prep_ocha.py.
 * Faits et chiffres retenus :
 *   - la vieille ville : moins d'un kilomètre carré ; esplanade des Mosquées (Haram al-Sharif, Dôme
 *     du Rocher, Al-Aqsa), mur Al-Buraq (mur occidental), Saint-Sépulcre ; le mont Sion, au sud ;
 *   - juin 1967 : Israël occupe Jérusalem-Est et étend la ville à environ 70 km² de Cisjordanie, dont
 *     28 villages (B'Tselem) ; résolution 478 du Conseil de sécurité (20 août 1980) : mesures
 *     « nulles et non avenues » ;
 *   - plus de 229 000 colons dans 14 colonies de Jérusalem-Est (Haut-Commissariat de l'ONU aux droits
 *     de l'homme, 2023) ; plus de 350 000 Palestiniens, avec un statut de résidents permanents ;
 *   - le mur laisse le camp de Shuafat et Kafr Aqab, dans les limites de la ville, de l'autre côté.
 */
(function (root) {
  const OC = [35.2318, 31.7775];
  const segments = [
    {
      id: 'sion', type: 'beat', dur: 6.5, hitAt: 1.0, reveal: 'focus', rgb: 10,
      kicker: 'Jérusalem · Al-Quds', word: 'Sion',
      sub: 'Le nom d’une colline de Jérusalem, devenu celui d’un mouvement politique.', subAt: 1.4,
      cam: { lon: OC[0], lat: OC[1] - 0.004, w: 0.004, pitch: 46, bearing: -10 },
      camEnd: { lon: OC[0], lat: OC[1] - 0.003, w: 0.0026, pitch: 50, bearing: -4 },
    },
    {
      id: 'vieille', type: 'cap', dur: 12.0, fly: 1.6, anchor: [330, -60], textW: 860,
      kicker: 'Jérusalem · la vieille ville', title: 'Trois religions',
      text: 'Moins d’un kilomètre carré entre les remparts : l’esplanade des Mosquées, le mur Al-Buraq, le Saint-Sépulcre. [[Un lieu saint pour les musulmans, les juifs et les chrétiens.]]',
      cam: { lon: OC[0] - 0.0021, lat: OC[1] - 0.0007, w: 0.00078, pitch: 50, bearing: -8 },
      camEnd: { lon: OC[0] - 0.0018, lat: OC[1] - 0.0005, w: 0.00068, pitch: 54, bearing: 0 },
    },
    {
      id: 'annexion', type: 'cap', dur: 12.0, fly: 1.8, anchor: [330, -60], textW: 860,
      kicker: 'De juin 1967 à août 1980', title: 'L’annexion',
      text: 'Israël occupe Jérusalem-Est et l’annexe avec 28 villages alentour. Le Conseil de sécurité de l’ONU juge ces mesures [[« nulles et non avenues ».]]',
      cam: { lon: 35.19, lat: 31.795, w: 0.0135, pitch: 42, bearing: -6 },
      camEnd: { lon: 35.195, lat: 31.795, w: 0.0122, pitch: 46, bearing: 0 },
    },
    {
      id: 'colonies', type: 'cap', dur: 10.5, fly: 1.0, anchor: [330, -60], textW: 860,
      kicker: 'Jérusalem-Est · aujourd’hui', title: 'Colonies',
      text: 'Plus de 229 000 colons vivent dans quatorze colonies de Jérusalem-Est. Plus de 350 000 Palestiniens y vivent aussi, [[avec un simple statut de résidents.]]',
      cam: { lon: 35.195, lat: 31.795, w: 0.0122, pitch: 46, bearing: 0 },
      camEnd: { lon: 35.195, lat: 31.8, w: 0.0115, pitch: 48, bearing: 4 },
    },
    {
      id: 'mur', type: 'cap', dur: 11.5, fly: 1.2, anchor: [330, -60], textW: 860,
      kicker: 'Depuis 2002', title: 'Le mur',
      text: 'Il coupe la ville : le camp de réfugiés de Shuafat et Kafr Aqab, à l’intérieur des limites de Jérusalem, [[se retrouvent de l’autre côté.]]',
      cam: { lon: 35.15, lat: 31.81, w: 0.024, pitch: 44, bearing: 4 },
      camEnd: { lon: 35.155, lat: 31.81, w: 0.022, pitch: 48, bearing: 8 },
    },
    {
      id: 'fin', type: 'outro', dur: 8.5, fly: 1.6, hitAt: 1.0,
      eyebrow: 'Jérusalem-Est, aujourd’hui',
      lines: ['Occupée', 'et annexée', 'depuis 1967.'],
      cam: { lon: 35.2, lat: 31.79, w: 0.03, pitch: 40, bearing: -6 },
      camEnd: { lon: 35.2, lat: 31.79, w: 0.032, pitch: 38, bearing: 0 },
    },
  ];

  // ---- la vieille ville (tracés approchés, comme dans six-jours.js)
  const OLD_CITY = [[35.2276, 31.7766], [35.2268, 31.7788], [35.2271, 31.7800], [35.2302, 31.7816], [35.2331, 31.7820], [35.2362, 31.7820], [35.2368, 31.7809],
    [35.2373, 31.7787], [35.2372, 31.7754], [35.2344, 31.7757], [35.2338, 31.7743], [35.2297, 31.7720], [35.2283, 31.7722]];
  const HARAM = [[35.2344, 31.7757], [35.2338, 31.7801], [35.2370, 31.7799], [35.2372, 31.7754]];
  const DOME = Array.from({ length: 8 }, (_, i) => [35.2354 + 0.000275 * Math.cos(i * Math.PI / 4 + 0.39), 31.7780 + 0.000234 * Math.sin(i * Math.PI / 4 + 0.39)]);
  const AQSA = [[35.23541, 31.77584], [35.23599, 31.77584], [35.23599, 31.77656], [35.23541, 31.77656]];
  const plans = [], markers = [], zones = [];
  plans.push({ seg: 'sion', at: 0.4, dur: 2.4, path: OLD_CITY, closed: true, style: 'wall', until: 20.0 });
  plans.push({ seg: 'vieille', at: 0.4, dur: 1.2, style: 'grid', bbox: [35.2255, 31.7705, 35.2390, 31.7835], step: 25, until: 12.5 });
  plans.push({ seg: 'vieille', at: 1.0, dur: 1.8, path: HARAM, closed: true, style: 'sacred', fill: 0.05, label: 'Haram al-Sharif', labelAt: [35.2360, 31.7792], big: true, until: 12.5 });
  plans.push({ seg: 'vieille', at: 1.5, dur: 1.0, path: DOME, closed: true, style: 'sacred', fill: 0.16, label: 'Dôme du Rocher', labelAt: [35.2356, 31.7787], until: 12.5 });
  plans.push({ seg: 'vieille', at: 1.7, dur: 1.0, path: AQSA, closed: true, style: 'sacred', fill: 0.12, label: 'Al-Aqsa', labelAt: [35.2357, 31.7754], until: 12.5 });
  plans.push({ seg: 'vieille', at: 2.6, dur: 0.8, path: [[35.23446, 31.77612], [35.23438, 31.77706]], style: 'focus', label: 'Mur Al-Buraq', labelAt: [35.23325, 31.77655], labelAt2: 0.4, until: 12.5 });
  markers.push({ seg: 'vieille', at: 3.6, label: 'Saint-Sépulcre', lon: 35.2296, lat: 31.7785, dir: [-1, -1], off: 50, endAt: 12.3 });
  markers.push({ seg: 'vieille', at: 4.4, label: 'Mont Sion', lon: 35.2290, lat: 31.7716, dir: [-1, 1], off: 50, endAt: 12.3 });

  // ---- 1967 : la ville annexée ; elle reste allumée jusqu'à la fin
  zones.push({ seg: 'annexion', at: 0.8, dur: 3.0, name: 'jerusalem-est-annexee', from: [35.234, 31.778] });
  markers.push({ seg: 'annexion', at: 2.4, label: 'Jérusalem-Est', lon: 35.24, lat: 31.79, dir: [1, -1], off: 46, endAt: 22.6 });
  markers.push({ seg: 'annexion', at: 3.2, label: 'Vieille ville', lon: OC[0], lat: OC[1], dir: [-1, 1], off: 40, endAt: 22.6 });

  // ---- le mur autour de Jérusalem (OCHA)
  const MUR = root.MUR || {};
  const near = (l) => l.some(([lo, la]) => lo > 35.1 && lo < 35.36 && la > 31.68 && la < 31.92);
  [['construit', 'focus', 0.6], ['en construction', 'dash', 1.6], ['prevu', 'dash', 2.0]].forEach(([k, style, t0]) =>
    (MUR[k] || []).filter(near).forEach((path) => plans.push({ seg: 'mur', at: t0, dur: 2.4, style, path, any: true })));
  markers.push({ seg: 'mur', at: 3.2, label: 'Camp de Shuafat', lon: 35.244, lat: 31.8128, dir: [1, -1], off: 46, endAt: 11.8 });
  markers.push({ seg: 'mur', at: 3.8, label: 'Kafr Aqab', lon: 35.222, lat: 31.873, dir: [-1, -1], off: 46, endAt: 11.8 });

  const clock = [
    { seg: 'annexion', at: 0.2, text: 'Juin 1967' }, { seg: 'colonies', at: 0.2, text: 'Aujourd’hui' }, { seg: 'fin', at: 0.2, text: '' },
  ];

  root.TL = root.buildTL({
    name: 'jerusalem',
    seed: 1967,
    segments,
    relief: true,
    plans,
    zones,
    markers,
    clock,
    hud: { label: ['Sion', 'Chapitre 19 · Jérusalem'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
