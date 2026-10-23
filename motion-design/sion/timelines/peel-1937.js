/*
 * Séquence « Le plan Peel » (chapitre 8, le mandat britannique), ≈ 27 s. Remplace la fiche Peel de documents-2.js.
 * Modèles : timelines/partage-1947.js (couleurs des deux États), timelines/terres-1945.js (relief).
 *
 * Faits retenus (rapport de la commission royale pour la Palestine, Cmd. 5479, 7 juillet 1937) :
 *   - premier plan de partage : un État juif (Galilée, vallée de Jezréel, plaine côtière), un État arabe uni à la
 *     Transjordanie, une zone sous mandat britannique (Jérusalem, Bethléem et un couloir jusqu'à la mer ; Nazareth) ;
 *   - un « transfert » de population : jusqu'à 225 000 Arabes hors de l'État juif, 1 250 Juifs dans l'autre sens ;
 *   - les dirigeants arabes refusent ; le 20e congrès sioniste (Zurich, août 1937) accepte le principe du partage mais
 *     rejette ce tracé ; en novembre 1938, après la commission Woodhead, Londres abandonne le plan.
 * Tracés : data/peel-1937.js (tools/prep_peel.py, d'après la carte « Peel map pd.png », Wikimedia Commons, domaine
 * public), simplifiés ; les trajets du transfert sont schématiques.
 */
(function (root) {
  const cam = (lon, lat, w, pitch, bearing) => ({ lon, lat, w, pitch, bearing });
  const segments = [
    {
      id: 'plan', type: 'cap', dur: 9.5, fly: 1.6, anchor: [330, -60], textW: 880,
      kicker: 'Commission royale Peel · 7 juillet 1937 · tracé simplifié', title: 'Couper le pays',
      text: 'Pour la première fois, Londres propose un partage : un État juif au nord et sur la côte, [[un État arabe uni à la Transjordanie,]] Jérusalem sous mandat britannique.',
      cam: cam(35.05, 32.05, 0.088, 34, -8), camEnd: cam(35.05, 32.08, 0.082, 38, 0),
    },
    {
      id: 'transfert', type: 'stat', dur: 9.0, fly: 1.6, layout: 'L', anchor: [480, 20],
      ghost: '1937', kicker: 'Le même rapport', pre: 'Jusqu’à', value: 225000,
      label: 'Arabes à déplacer hors de l’État juif',
      text: 'Contre 1 250 Juifs dans l’autre sens. [[Le rapport parle d’un « transfert » de population.]]',
      textAt: 1.6, hlAt: 5.2, source: 'Rapport de la commission royale pour la Palestine, Cmd. 5479, 1937', sourceAt: 4.2,
      countAt: 0.3, countDur: 3.0,
      cam: cam(35.1, 32.45, 0.05, 44, -14), camEnd: cam(35.12, 32.45, 0.046, 48, -6),
    },
    {
      id: 'refus', type: 'cap', dur: 8.5, fly: 1.6, anchor: [330, -60], textW: 880,
      kicker: 'Été 1937', title: 'Deux refus',
      text: 'Les dirigeants arabes rejettent le plan. Le congrès sioniste accepte le principe du partage, [[mais pas ce tracé.]] En 1938, Londres l’abandonne.',
      cam: cam(35.05, 32.0, 0.084, 32, 4), camEnd: cam(35.05, 32.0, 0.09, 30, 8),
    },
  ];
  const zones = [
    { seg: 'plan', at: 1.2, dur: 1.6, name: 'peel-arabe', from: [35.2, 31.4], tone: 'life' },
    { seg: 'plan', at: 2.4, dur: 1.6, name: 'peel-juif', from: [35.2, 32.8], tone: 'cold' },
    { seg: 'plan', at: 3.6, dur: 1.4, name: 'peel-mandat', from: [35.21, 31.77], tone: 'stone' },
  ];
  // le transfert, schématique : des villages arabes de Galilée et de la côte vers les collines de l'État arabe
  const flows = [
    { seg: 'transfert', at: 1.2, dur: 4.0, n: 120, from: [[35.3, 32.95], [35.42, 32.9], [35.2, 32.82], [35.35, 32.62]], to: [35.27, 32.3], travel: [2.4, 3.4], bend: 0.18, spread: 0.06, spreadTo: 0.08, R: 180, originHeat: 0.6 },
    { seg: 'transfert', at: 1.6, dur: 3.6, n: 70, from: [[34.92, 32.45], [34.9, 32.25], [34.85, 32.15]], to: [35.15, 32.2], travel: [2.0, 3.0], bend: -0.16, spread: 0.04, spreadTo: 0.06, R: 160, originHeat: 0.6 },
  ];
  const markers = [
    { seg: 'plan', at: 2.8, label: 'État juif', lon: 35.3, lat: 32.85, dir: [1, -1], endAt: 9.5 },
    { seg: 'plan', at: 1.8, label: 'État arabe', lon: 35.1, lat: 31.25, dir: [1, 1], endAt: 9.5 },
    { seg: 'plan', at: 4.0, label: 'Sous mandat britannique', lon: 35.0, lat: 31.88, dir: [-1, 1], off: 50, endAt: 9.5 },
  ];
  const clock = [{ seg: 'plan', at: 0.2, text: '7 juillet 1937' }, { seg: 'transfert', at: 0.2, text: '7 juillet 1937' }, { seg: 'refus', at: 0.2, text: '1937 · 1938' }];

  root.TL = root.buildTL({
    name: 'peel-1937',
    relief: true,
    seed: 1937,
    segments,
    zones,
    flows,
    markers,
    clock,
    cities: [],
    hud: { label: ['Sion', 'Chapitre 8 · Le plan Peel'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
