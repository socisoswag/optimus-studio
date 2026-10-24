/*
 * Séquence « La guerre numérique » (chapitre 27), ≈ 1 min.
 *
 * Sources :
 *   The New York Times, 5 juin 2024 (S. Frenkel), repris par Haaretz : le ministère israélien de la
 *     Diaspora alloue environ 2 millions de dollars à Stoic, agence de marketing politique de Tel-Aviv.
 *     À partir d'octobre 2023, des centaines de faux comptes se présentant comme des Américains, sur X,
 *     Facebook et Instagram, visent des élus du Congrès, surtout démocrates ; messages écrits avec
 *     ChatGPT ; trois faux sites d'information en anglais. Le ministère dément.
 *   Meta, rapport sur les menaces du 1er trimestre 2024, 29 mai 2024 : 510 comptes Facebook, 11 pages,
 *     1 groupe et 32 comptes Instagram supprimés, liés à Stoic ; audience quasi nulle hors du réseau.
 *   OpenAI, 30 mai 2024, opération « Zero Zeno » : comptes de Stoic bannis.
 * Aucun message de la campagne n'est reproduit : les profils sont figurés, pas recopiés.
 */
(function (root) {
  const D = { faux: 6.4, reseau: 12.6, ia: 10.0, meta: 12.0, paie: 12.4, fin: 6.8 };
  const META_FLY = 1.2;

  const segments = [
    {
      id: 'faux', type: 'beat', dur: D.faux, hitAt: 0.9, rgb: 16,
      kicker: 'Octobre 2023 · Tel-Aviv', word: 'Faux profils',
      sub: 'Des Américains qui n’existent pas.', subAt: 1.8,
      cam: { lon: 34.78, lat: 32.08, w: 0.05, pitch: 46, bearing: -10 },
      camEnd: { lon: 34.78, lat: 32.08, w: 0.036, pitch: 52, bearing: 2 },
    },
    {
      id: 'reseau', type: 'cap', dur: D.reseau, fly: 2.8, anchor: [330, -60], textW: 860,
      kicker: 'D’octobre 2023 à juin 2024 · Washington', title: 'Des centaines de faux comptes',
      text: 'Sur X, Facebook et Instagram, ils se font passer pour des Américains et interpellent [[des élus du Congrès, surtout démocrates.]]',
      cam: { lon: -77.0, lat: 38.75, w: 0.16, pitch: 40, bearing: -6 },
      camEnd: { lon: -77.0, lat: 38.75, w: 0.135, pitch: 44, bearing: 3 },
    },
    {
      id: 'ia', type: 'cap', dur: D.ia, fly: 1.0, anchor: [330, -60], textW: 860,
      kicker: 'Écrits par une intelligence artificielle', title: 'ChatGPT',
      text: 'Les messages sont rédigés avec ChatGPT. [[Trois faux sites d’information]] en anglais relaient la campagne.',
      cam: { lon: -77.04, lat: 38.85, w: 0.075, pitch: 50, bearing: 8 },
      camEnd: { lon: -77.04, lat: 38.85, w: 0.062, pitch: 54, bearing: -2 },
    },
    {
      id: 'meta', type: 'stat', dur: D.meta, fly: META_FLY, layout: 'L', anchor: [470, 30],
      ghost: '2024', kicker: 'Meta · 29 mai 2024', value: 510, step: 3, label: 'comptes Facebook supprimés',
      text: 'Avec 11 pages, un groupe et 32 comptes Instagram. OpenAI bloque aussi l’agence. [[Le réseau n’avait presque aucune audience réelle.]]',
      textAt: 1.6, hlAt: 6.2, source: 'Meta, rapport du 1er trimestre 2024 · OpenAI, 30 mai 2024', sourceAt: 5.0, countAt: 0.3, countDur: 3.2,
      cam: { lon: -77.1, lat: 38.8, w: 0.12, pitch: 40, bearing: 4 },
      camEnd: { lon: -77.1, lat: 38.8, w: 0.105, pitch: 44, bearing: -3 },
    },
    {
      id: 'paie', type: 'stat', dur: D.paie, fly: 2.8, layout: 'L', anchor: [470, 30],
      ghost: '2024', kicker: 'Qui paie ? · The New York Times, 5 juin 2024', pre: 'Environ', value: 2000000, label: 'dollars d’argent public',
      text: 'Alloués par le ministère israélien de la Diaspora à Stoic, une agence de marketing politique de Tel-Aviv. [[Le ministère dément.]]',
      textAt: 1.6, hlAt: 6.6, source: 'The New York Times · Haaretz', sourceAt: 5.2, countAt: 0.3, countDur: 3.4,
      lon: 35.21, lat: 31.78,
      cam: { lon: 35.0, lat: 31.95, w: 0.07, pitch: 44, bearing: -6 },
      camEnd: { lon: 35.0, lat: 31.95, w: 0.058, pitch: 50, bearing: 3 },
    },
    {
      id: 'fin', type: 'outro', dur: D.fin,
      eyebrow: 'De 2023 à 2024',
      lines: ['Des comptes', 'inventés, payés', 'par un ministère', 'qui dément.'],
      cam: { lon: 35.0, lat: 31.9, w: 0.3, pitch: 28, bearing: 0 },
    },
  ];

  // Le réseau : des profils s'allument autour du Capitole, Meta les supprime pendant le décompte.
  const offAt = D.reseau + D.ia + META_FLY + 0.4; // relatif au début de « reseau »
  const nets = [{ seg: 'reseau', at: 2.9, hub: [-77.01, 38.89], n: 120, spread: 1.6, grow: 5.5, off: offAt, offDur: 3.4, until: D.reseau + D.ia + D.meta + 0.5 }];
  // l'argent part de Tel-Aviv : la traversée accompagne le vol de caméra vers Washington
  const flows = [{ seg: 'reseau', at: 0.1, from: [34.78, 32.08], to: [-77.01, 38.89], n: 80, dur: 2.4, travel: [2.4, 3.2], spread: 0.08, spreadTo: 1.2, bend: 0.1, cold: true, endAt: 7.0 }];
  const markers = [
    { seg: 'reseau', at: 3.2, label: 'Capitole', lon: -77.01, lat: 38.89, dir: [1, -1], off: 46, endAt: D.reseau + D.ia + D.meta - 0.2 },
  ];

  root.TL = root.buildTL({
    name: 'guerre-numerique',
    seed: 2024,
    segments,
    relief: true,
    nets,
    flows,
    markers,
    hud: { label: ['Sion', 'Chapitre 27 · La guerre numérique'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: [0.6, 58.0] },
  });

  // bruitages : scintillement quand les comptes s'allument, déclics quand Meta les supprime
  const R = TL.segments.find((s) => s.id === 'reseau').start;
  const F = [{ t: +(R + 2.9).toFixed(3), kind: 'shimmer', dur: 5.5, gain: 0.8 }];
  for (let k = 0; k < 22; k++) F.push({ t: +(R + offAt + 3.4 * Math.pow(k / 22, 1.25)).toFixed(3), kind: 'tick', gain: 0.5 + 0.3 * ((k * 7) % 3) / 2 });
  TL.sound = { ...TL.sound, foley: F };
})(typeof window !== 'undefined' ? window : globalThis);
