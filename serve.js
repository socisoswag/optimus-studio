const h = require('http'), fs = require('fs'), path = require('path');
const root = 'e:/siteessai2';
const mime = { html:'text/html', css:'text/css', js:'application/javascript', webp:'image/webp', mp4:'video/mp4' };
h.createServer((req, res) => {
  let u = req.url.split('?')[0];
  if (u === '/') u = '/index.html';
  const f = path.join(root, u);
  fs.stat(f, (e, s) => {
    if (e || !s.isFile()) { res.writeHead(404); return res.end('404'); }
    const ext = path.extname(f).slice(1);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
}).listen(3000, () => console.log('ready'));
