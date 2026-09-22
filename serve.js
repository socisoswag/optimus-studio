/* Serveur local de développement.
   node serve.js  →  http://localhost:3000
   Sert le dossier courant, résout /devis/ vers /devis/index.html comme
   le ferait Netlify, et renvoie une 404 lisible. */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const root = __dirname;
const port = process.env.PORT || 3000;

const mime = {
  html: 'text/html; charset=utf-8',
  css:  'text/css; charset=utf-8',
  js:   'application/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  xml:  'application/xml; charset=utf-8',
  txt:  'text/plain; charset=utf-8',
  svg:  'image/svg+xml',
  webp: 'image/webp',
  png:  'image/png',
  jpg:  'image/jpeg',
  mp4:  'video/mp4'
};

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);

  // Un chemin qui se termine par / vise l'index du dossier.
  if (url.endsWith('/')) url += 'index.html';

  const fichier = path.join(root, path.normalize(url));

  // On ne sort jamais de la racine.
  if (!fichier.startsWith(root)) {
    res.writeHead(403); return res.end('403');
  }

  fs.stat(fichier, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': mime.html });
      return res.end('<h1>404</h1><p>' + url + '</p>');
    }
    const ext = path.extname(fichier).slice(1).toLowerCase();
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(fichier).pipe(res);
  });
}).listen(port, () => console.log('http://localhost:' + port));
