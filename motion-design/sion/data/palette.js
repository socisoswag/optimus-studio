/*
 * Palette du film : toutes les couleurs d'accent au même endroit.
 *   ember     accent principal (force, feu, offensives, territoires occupés, bilans)
 *   hot       accent vif (sur-titres, chiffres, cœur des lueurs)
 *   life      vie palestinienne (villages, villes la nuit, réfugiés) ; null = comme l'accent
 *   lifeHot   version vive de life
 *   halation  teinte du halo autour des hautes lumières (finition pellicule, tools/build.sh)
 */
window.PALETTE = {
  ember: [232, 52, 30],     // vermillon : force, violence, occupation, bilans
  hot: [255, 116, 78],      // vermillon vif : sur-titres, chiffres, cœur des lueurs
  life: [170, 182, 110],    // olive pâle : villages, villes, réfugiés (la vie palestinienne)
  lifeHot: [212, 216, 152], // olive clair
  halation: [1, 0.34, 0.2], // halo chaud tirant vers le rouge
};
