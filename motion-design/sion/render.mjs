// Rendu image par image d'une pièce du kit SION.
//
//   node render.mjs --timeline generique --stills 3,8.5,20 --out stills   images de contrôle (PNG)
//   node render.mjs --timeline generique --out video.mp4                  vidéo complète
//
// --timeline : nom d'un fichier de timelines/ (par défaut : chronologie)
// --alpha : fond transparent (cartons à poser sur des images) ; vidéo en MOV, codec PNG avec couche alpha
// --notext : version sans texte (légendes, titres et chiffres masqués), par exemple sous une voix off
// --page drone.html : survol aérien en 3D (timelines qui définissent window.INTRO)
// Options vidéo : --workers 4  --shutter 2 (sous-images par image, flou de bougé)
//                 --from 0 --to 12 (secondes)  --crf 12
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  ({ chromium } = require(path.join(process.execPath, '../../lib/node_modules/playwright')));
}

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'max-age=86400' });
      fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[page]', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('[console]', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/${PAGE}?tl=${encodeURIComponent(TLNAME)}${ALPHA ? '&alpha=1' : ''}${NOTEXT ? '&notext=1' : ''}${args.dbg ? '&dbg=' + args.dbg : ''}`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  page.cdp = await page.context().newCDPSession(page);
  // fond transparent : la capture garde la couche alpha
  if (ALPHA) await page.cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  return page;
}

// Capture PNG sans perte, encodage rapide (4 à 5 fois plus rapide que page.screenshot)
async function frameAt(page, t, frame) {
  await page.evaluate(([t, f]) => window.renderFrame(t, f), [t, frame]);
  const { data } = await page.cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
  return Buffer.from(data, 'base64');
}

const srv = await serve();
const port = srv.address().port;
const browser = await chromium.launch({ args: ['--disable-checker-imaging', '--disable-gpu', '--force-color-profile=srgb', '--font-render-hinting=none'] });
const FPS = 25;
const TLNAME = String(args.timeline || 'chronologie');
const PAGE = String(args.page || 'index.html'); // drone.html : survol en 3D (WebGL)
const ALPHA = !!args.alpha; // --alpha : fond transparent, vidéo MOV (codec PNG, couche alpha)
const NOTEXT = !!args.notext; // --notext : sans légendes ni chiffres (pour poser une voix off), les mentions sur la carte restent

try {
  if (args.qa) {
    // contrôle qualité : la page dit, image par image, ce qui ne va pas (window.qa, si elle le propose)
    const page = await openPage(browser, port);
    const total = await page.evaluate(() => window.TOTAL);
    const hasQa = await page.evaluate(() => typeof window.qa === 'function');
    const res = [];
    if (hasQa) for (let t = 0.2; t < total; t += parseFloat(args.qa)) res.push(await page.evaluate((x) => window.qa(x), t));
    console.log(JSON.stringify({ total, qa: hasQa, frames: res }));
  } else if (args.stills) {
    const out = args.out || path.join(ROOT, 'stills');
    fs.mkdirSync(out, { recursive: true });
    const page = await openPage(browser, port);
    for (const s of String(args.stills).split(',')) {
      const t = parseFloat(s);
      const t0 = Date.now();
      const png = await frameAt(page, t, Math.round(t * FPS));
      const f = path.join(out, `still_${t.toFixed(2).padStart(6, '0')}.png`);
      fs.writeFileSync(f, png);
      console.log(f, `${Date.now() - t0} ms`);
    }
  } else {
    const probe = await openPage(browser, port);
    const total = await probe.evaluate(() => window.TOTAL);
    await probe.close();
    const from = parseFloat(args.from || 0), to = Math.min(parseFloat(args.to || total), total);
    const n0 = Math.round(from * FPS), n1 = Math.round(to * FPS);
    const workers = parseInt(args.workers || Math.max(1, Math.min(4, os.cpus().length)), 10);
    const shutter = parseInt(args.shutter || 1, 10); // sous-images (obturateur 180°)
    const crf = String(args.crf || 12);
    const out = path.resolve(args.out || path.join(ROOT, 'output', `${TLNAME}.${ALPHA ? 'mov' : 'mp4'}`));
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chrono-'));
    const per = Math.ceil((n1 - n0) / workers);
    const started = Date.now();
    let done = 0;
    const jobs = Array.from({ length: workers }, async (_, w) => {
      const a = n0 + w * per, b = Math.min(n1, a + per);
      if (a >= b) return null;
      const page = await openPage(browser, port);
      const file = path.join(tmp, `part_${String(w).padStart(2, '0')}.${ALPHA ? 'mov' : 'mkv'}`);
      const vf = shutter > 1
        ? `tmix=frames=${shutter},select='eq(mod(n\\,${shutter})\\,${shutter - 1})',setpts=N/${FPS}/TB`
        : 'null';
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(FPS * shutter), '-i', '-',
        '-vf', vf, '-r', String(FPS), ...(ALPHA ? ['-c:v', 'png', '-pix_fmt', 'rgba'] : ['-c:v', 'libx264', '-preset', 'medium', '-crf', crf, '-tune', 'grain', '-pix_fmt', 'yuv420p']), file], { stdio: ['pipe', 'inherit', 'inherit'] });
      const closed = new Promise((r) => ff.on('close', r));
      for (let f = a; f < b; f++) {
        for (let k = 0; k < shutter; k++) {
          const t = f / FPS + (k / shutter) * (0.5 / FPS); // obturateur 180°
          const png = await frameAt(page, t, f);
          if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
        }
        done++;
        if (done % 25 === 0) {
          const el = (Date.now() - started) / 1000;
          console.log(`${done}/${n1 - n0} images · ${el.toFixed(0)} s · reste ~${((el / done) * (n1 - n0 - done)).toFixed(0)} s`);
        }
      }
      ff.stdin.end();
      await closed;
      await page.close();
      return file;
    });
    const parts = (await Promise.all(jobs)).filter(Boolean);
    const list = path.join(tmp, 'list.txt');
    fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const audio = args.audio ? ['-i', path.resolve(args.audio)] : [];
    const map = args.audio ? ['-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '320k', '-shortest'] : [];
    await new Promise((res, rej) => {
      const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, ...audio, '-c:v', 'copy', ...map, ...(ALPHA ? [] : ['-movflags', '+faststart']), out], { stdio: 'inherit' });
      p.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg concat ' + c))));
    });
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log('OK', out, `${((Date.now() - started) / 1000).toFixed(0)} s`);
  }
} finally {
  await browser.close();
  srv.close();
}
