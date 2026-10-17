/*
 * Palette du film : toutes les couleurs d'accent au même endroit.
 *   ember     accent principal (force, feu, offensives, territoires occupés, bilans)
 *   hot       accent vif (sur-titres, chiffres, cœur des lueurs)
 *   life      vie palestinienne (villages, villes la nuit, réfugiés) ; null = comme l'accent
 *   lifeHot   version vive de life
 *   halation  teinte du halo autour des hautes lumières (finition pellicule, tools/build.sh)
 */
window.PALETTE = {
  ember: [255, 91, 31],
  hot: [255, 174, 90],
  life: null,
  lifeHot: null,
  halation: [1, 0.48, 0.22],
};
