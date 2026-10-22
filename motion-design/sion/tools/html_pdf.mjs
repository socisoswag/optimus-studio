// Imprime une page HTML en PDF A4 avec Chromium (numéros de page en bas).
//
//   node tools/html_pdf.mjs page.html sortie.pdf "texte du pied de page"
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  ({ chromium } = require(path.join(process.execPath, '../../lib/node_modules/playwright')));
}

const [src, out, pied = ''] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--font-render-hinting=none'] });
const page = await browser.newPage();
await page.goto('file://' + path.resolve(src), { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const footer = `<div style="width:100%;font:8px 'DM Mono',monospace;color:#8a817a;letter-spacing:.08em;
  padding:0 16mm;display:flex;justify-content:space-between"><span>${pied}</span><span class="pageNumber"></span></div>`;
await page.pdf({
  path: out, format: 'A4', printBackground: true, displayHeaderFooter: true,
  headerTemplate: '<span></span>', footerTemplate: footer,
  margin: { top: '16mm', bottom: '18mm', left: '18mm', right: '18mm' },
});
await browser.close();
