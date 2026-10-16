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
  jets: TL.units.filter((u) => u.kind === 'plane').map((u) => ({ t0: u.t, dur: u.dur, n: u.n || 1, pan: Math.sign(u.path[u.path.length - 1][0] - u.path[0][0]) })),
  rumbles: TL.units.filter((u) => u.kind === 'tank' || u.kind === 'dozer' || u.kind === 'truck').map((u) => ({ t0: u.t, dur: u.dur, n: u.n || 1 })),
  flows: TL.flows.map((f) => ({ t0: f.t, dur: (f.dur || 3) + (f.travel ? f.travel[1] : 3.4), to: f.to, from: Array.isArray(f.from[0]) ? f.from[0] : f.from })),
  event: ev ? { t: ev.impact, end: ev.end } : null,
  sound: TL.sound,
}, null, 1));
