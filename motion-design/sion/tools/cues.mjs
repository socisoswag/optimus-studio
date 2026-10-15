// Exporte les repères de la bande-son (mêmes temps que l'image) en JSON.
//   node tools/cues.mjs generique > cues.json      (par défaut : chronologie)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const name = (process.argv[2] || 'chronologie').replace(/[^a-z0-9-]/gi, '');
require('../core.js');
require(`../timelines/${name}.js`);
const TL = globalThis.TL;
const ev = TL.segments.find((s) => s.type === 'event');
console.log(JSON.stringify({
  name: TL.name,
  total: TL.total,
  impacts: TL.impacts,
  flights: TL.flights,
  flashes: TL.flashes,
  silences: TL.silences,
  event: ev ? { t: ev.impact, end: ev.end } : null,
  sound: TL.sound,
}, null, 1));
