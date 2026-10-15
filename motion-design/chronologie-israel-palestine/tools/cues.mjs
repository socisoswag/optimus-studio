// Exporte les repères de la bande-son (mêmes temps que l'image) en JSON.
//   node tools/cues.mjs > cues.json
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('../timeline.js');
const TL = globalThis.TL;
const SEG = TL.segments;

const impacts = [];
const flights = [];
SEG.forEach((s, i) => {
  if (s.type === 'figure' || s.type === 'pair') impacts.push({ t: s.impact, k: 1, kind: 'hit' });
  if (s.type === 'split') impacts.push({ t: s.impact + 0.05, k: 0.85, kind: 'hit' }, { t: s.impact + 0.5, k: 0.6, kind: 'hit' });
  if (s.type === 'event') impacts.push({ t: s.impact, k: 1.3, kind: 'event' });
  if (s.type === 'intro') impacts.push({ t: 1.05, k: 0.75, kind: 'hit' });
  if (s.type === 'outro') [0, 0.55, 1.1].forEach((d, j) => impacts.push({ t: s.impact - 0.2 + d, k: 0.6 + j * 0.25, kind: 'hit' }));
  if (i > 0) {
    const prev = SEG[i - 1];
    const dir = Math.sign((s.lon ?? s.cam.lon) - (prev.lon ?? prev.cam.lon ?? 0)) || 1;
    flights.push({ t0: s.start, dur: s.fly, dir, big: s.fly > 1.5 });
  }
});
const ev = SEG.find((s) => s.id === 'rabin-1995');
const out = SEG[SEG.length - 1];
console.log(JSON.stringify({
  total: TL.total,
  impacts, flights,
  flashes: TL.flashes,
  silence: { t0: ev.impact - 0.55, t1: ev.impact },
  event: { t: ev.impact, end: ev.end },
  outro: { t: out.impact, end: out.end },
}, null, 1));
