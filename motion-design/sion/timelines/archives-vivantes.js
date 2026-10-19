/*
 * « Les archives qui prennent vie » (photo3d.html), 48,5 s : sept photos de la Palestine d'avant 1948, mises en relief,
 * la caméra glisse dans chacune, la mise au point se déplace, fondus enchaînés.
 *
 * Photos : G. Eric and Edith Matson Photograph Collection (Matson Photo Service, American Colony),
 * Bibliothèque du Congrès, « no known restrictions on publication ». Titres et dates relevés sur loc.gov :
 *   06520  Jaffa (Joppa) and environs. Jaffa from the orange groves, entre 1898 et 1914
 *   04992  Jaffa orange culture. Boxes of oranges on the Jaffa wharf, vers 1900 à 1920
 *   21600  Damascus Gate, sheep market, entre 1940 et 1946
 *   12518  Market Place, Jaffa, entre 1940 et 1946
 *   20377  Arab factories & general improvements in Nablus. The Soap Factory. The liquid soap poured out to harden, 12 juin 1940
 *   17778  Arab Women's Union of Ramallah. Group at work in the Ramallah work rooms, entre 1934 et 1939
 *   15788  Arab demonstrations on Oct. 13 and 27, 1933. Crowd of demonstrators in Jaffa, advancing toward the police force, octobre 1933
 * Profondeur estimée par Depth Anything V2 (tools/prep_archives.py) : relief d'illustration, pas une mesure.
 *
 * Mouvement de chaque photo : from → to, avec cx, cy (centre du cadre dans la photo, 0 à 1 depuis le coin haut gauche),
 * w (largeur du cadre en fraction de la photo), x, y, z (déplacement de la caméra, 1 = distance du plus proche
 * premier plan ; z > 0 avance), focus (profondeur nette, 0 loin, 1 près). far : distance du fond.
 */
(function (root) {
  const step = 6.2, len = 7.2, first = 3.2, end = 48.5;
  const at = (k) => first + k * step;
  root.INTRO = {
    name: 'archives-vivantes',
    page: 'photo3d.html',
    total: end,
    fov: 50,
    xfade: 1.0,
    fadeIn: 1.4,
    fadeOut: 1.8,
    open: { at: 0.4, out: 3.0, eyebrow: 'De 1898 à 1946', lines: ['La Palestine', 'avant 1948'] },
    credit: { at: 3.9, out: end - 2.4, text: 'Photos · Matson Photo Service · Bibliothèque du Congrès' },
    photos: [
      { id: '06520', t0: at(0), t1: at(0) + len, far: 5,
        eyebrow: 'Entre 1898 et 1914', place: 'Jaffa', sub: 'La ville vue depuis les orangeraies',
        from: { cx: 0.52, cy: 0.50, w: 0.94, focus: 0.78 }, to: { cx: 0.57, cy: 0.49, w: 0.86, x: 0.022, z: 0.07, focus: 0.12 } },
      { id: '04992', t0: at(1), t1: at(1) + len, far: 6,
        eyebrow: 'Entre 1900 et 1920', place: 'Le port de Jaffa', sub: 'Caisses d’oranges sur le quai',
        from: { cx: 0.50, cy: 0.42, w: 1.0, focus: 0.35 }, to: { cx: 0.52, cy: 0.62, w: 0.95, y: -0.02, z: 0.08, focus: 0.72 } },
      { id: '21600', t0: at(2), t1: at(2) + len, far: 6,
        eyebrow: 'Entre 1940 et 1946', place: 'Jérusalem', sub: 'Le marché aux moutons, porte de Damas',
        from: { cx: 0.50, cy: 0.46, w: 0.98, focus: 0.3 }, to: { cx: 0.60, cy: 0.56, w: 0.80, x: 0.03, z: 0.12, focus: 0.72 } },
      { id: '12518', t0: at(3), t1: at(3) + len, far: 7,
        eyebrow: 'Entre 1940 et 1946', place: 'Jaffa', sub: 'La place du marché',
        from: { cx: 0.50, cy: 0.30, w: 1.0, focus: 0.1 }, to: { cx: 0.53, cy: 0.56, w: 0.96, y: -0.015, z: 0.06, focus: 0.8 } },
      { id: '20377', t0: at(4), t1: at(4) + len, far: 3,
        eyebrow: '12 juin 1940', place: 'Naplouse', sub: 'À la savonnerie, le savon versé pour durcir',
        from: { cx: 0.50, cy: 0.50, w: 0.96, focus: 0.5 }, to: { cx: 0.45, cy: 0.60, w: 0.80, x: -0.02, z: 0.10, focus: 0.78 } },
      { id: '17778', t0: at(5), t1: at(5) + len, far: 3,
        eyebrow: 'Entre 1934 et 1939', place: 'Ramallah', sub: 'L’atelier de l’Union des femmes arabes',
        from: { cx: 0.40, cy: 0.47, w: 0.82, x: -0.03, focus: 0.55 }, to: { cx: 0.58, cy: 0.52, w: 0.80, x: 0.04, z: 0.05, focus: 0.55 } },
      // dernier plan : la caméra recule pendant que le cadre se resserre, la foule grandit derrière les policiers
      { id: '15788', t0: at(6), t1: end, far: 4,
        eyebrow: 'Octobre 1933', place: 'Jaffa', sub: 'La foule des manifestants face à la police britannique',
        from: { cx: 0.55, cy: 0.55, w: 0.94, focus: 0.62 }, to: { cx: 0.54, cy: 0.50, w: 0.78, z: -0.12, focus: 0.5 } },
    ],
    sound: {
      wind: false, projector: true,
      amb: [[at(0), at(0) + len, 'vent', 1], [at(1), at(1) + len, 'mer', 1], [at(2), at(3) + len, 'foule', 0.7],
        [at(4), at(5) + len, 'atelier', 1], [at(6), end, 'foule', 1.0]],
      hits: [at(6) + 0.2],
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
