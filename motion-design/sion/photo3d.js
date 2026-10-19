// Photos d'archives animées en relief (« 2,5D ») : chaque photo devient une surface creusée selon sa profondeur,
// la caméra glisse dedans, la mise au point se déplace, fondus enchaînés, grain, poussière et papillotement.
//
//   photo3d.html?tl=archives-vivantes        une timeline de timelines/ qui définit window.INTRO (photos: [...])
//   node render.mjs --page photo3d.html --timeline archives-vivantes --stills 5,12 --out stills
//   ?dbg=1 profondeur · 2 étirement (zones qui laissent voir la couche arrière) · 3 couche arrière seule
//
// Données (tools/prep_archives.py) : data/archives/<id>.jpg, <id>-depth.png (proche = clair),
// <id>-fond.jpg et <id>-fond-depth.png (ce qu'il y a derrière les bords des premiers plans).
// Chaque pixel est replacé le long du rayon de l'appareil d'origine, à une distance tirée de la profondeur :
// au repos, l'image est exactement la photo ; quand la caméra avance ou se décale, les plans se séparent.
import * as THREE from './vendor/three.module.min.js';

const Q = new URLSearchParams(location.search);
const TLN = (Q.get('tl') || 'archives-vivantes').replace(/[^a-z0-9-]/gi, '');
const DBG = +(Q.get('dbg') || 0);
if (Q.get('notext')) document.body.classList.add('notext');
await import(`./timelines/${TLN}.js`);
const I = window.INTRO;
const W = 1920, H = 1080, FPS = 25;

const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const rad = (d) => (d * Math.PI) / 180;

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.autoClear = false;
renderer.setClearColor(0x000000, 1);
const gl = renderer.getContext();

const rtOpts = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, samples: 4 };
const rt = [new THREE.WebGLRenderTarget(W, H, rtOpts), new THREE.WebGLRenderTarget(W, H, rtOpts)];

// ------------------------------------------------------------------ surface en relief
const VERT = /* glsl */`
  uniform sampler2D dep;
  uniform vec2 tan2;      // tangentes du demi-champ de l'appareil d'origine (x, y)
  uniform vec2 grid;      // pas de la grille, en coordonnées de photo
  uniform vec2 view;      // taille de l'image rendue (pixels)
  uniform float iNear, iFar, push, over, restPx, camZ;
  out vec2 vUv;
  out float vD, vAl;
  vec3 at(vec2 uo, out float d) {
    d = textureLod(dep, clamp(uo, 0.0, 1.0), 0.0).r;
    float z = push / mix(iFar, iNear, d);  // profondeur relative inverse (disparité) → distance
    return vec3((uo * 2.0 - 1.0) * tan2, -1.0) * z;
  }
  vec2 scr(vec3 p) { vec4 c = projectionMatrix * modelViewMatrix * vec4(p, 1.0); return c.xy / c.w * 0.5 * view; }
  void main() {
    vec2 uo = (uv - 0.5) * over + 0.5;   // un peu au-delà du cadre : bords répétés, jamais de vide
    float d, e;
    vec3 p = at(uo, d);
    vec2 s0 = scr(p);
    // étirement : écart à l'écran avec les voisins de la grille, comparé au pas de départ
    // (et au grossissement normal de cette profondeur quand la caméra avance)
    float L = max(max(length(scr(at(uo + vec2(grid.x, 0.0), e)) - s0), length(scr(at(uo - vec2(grid.x, 0.0), e)) - s0)),
                  max(length(scr(at(uo + vec2(0.0, grid.y), e)) - s0), length(scr(at(uo - vec2(0.0, grid.y), e)) - s0)));
    float z = -p.z, m = z / max(z - camZ, 0.05);
    vAl = 1.0 - smoothstep(1.45, 2.4, L / (restPx * m));
    vUv = clamp(uo, 0.0, 1.0); vD = d;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const FRAG = /* glsl */`
  uniform sampler2D img;
  uniform float focus, cocK, cut, dbg;
  in vec2 vUv;
  in float vD, vAl;
  out vec4 outColor;
  void main() {
    float al = cut > 0.5 ? vAl : 1.0;   // les zones étirées laissent voir la couche arrière
    if (al < 0.01) discard;
    // flou de mise au point : niveau de détail décalé selon l'écart à la profondeur nette
    vec3 c = texture(img, vUv, abs(vD - focus) * cocK).rgb;
    if (dbg > 0.5 && dbg < 1.5) c = vec3(vD);
    if (dbg > 1.5 && dbg < 2.5) c = mix(vec3(1.0, 0.1, 0.0), c, al);
    outColor = vec4(c, al);
  }`;

const loader = new THREE.TextureLoader();
async function tex(url, mip) {
  const t = await loader.loadAsync(url);
  t.colorSpace = THREE.NoColorSpace;
  t.generateMipmaps = mip;
  t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.anisotropy = mip ? renderer.capabilities.getMaxAnisotropy() : 1;
  return t;
}

const photos = I.photos.map((p) => ({ ...p }));
const OVER = 1.06;
const cache = new Map(); // photos chargées (au plus trois à la fois : chaque page ne rend qu'un morceau du film)
// clip vidéo (P.frames : images extraites par tools/build_reconstitution.py) : une image par pas de 1/fps
const frameUrl = (P, k) => `${P.frames.dir}/${String(k + 1).padStart(4, '0')}.jpg`;
async function load(P) {
  if (cache.has(P.id)) { const v = cache.get(P.id); cache.delete(P.id); cache.set(P.id, v); return v; }
  const dir = 'data/archives/';
  const flat = () => { const t = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1); t.needsUpdate = true; return t; };
  const [img, dep, bimg, bdep] = P.frames
    ? [await tex(frameUrl(P, 0), false), flat(), null, null]   // clip : surface plate, le mouvement est dans l'image
    : await Promise.all([
      tex(`${dir}${P.id}.jpg`, true), tex(`${dir}${P.id}-depth.png`, false),
      tex(`${dir}${P.id}-fond.jpg`, true), tex(`${dir}${P.id}-fond-depth.png`, false),
    ]);
  const pw = img.image.width, ph = img.image.height;
  const tx = Math.tan(rad((P.fov ?? I.fov ?? 50) / 2)), ty = tx * ph / pw;
  const mk = (im, dp, n, cut, push, order) => {
    const u = {
      img: { value: im }, dep: { value: dp }, tan2: { value: new THREE.Vector2(tx, ty) },
      iNear: { value: 1 }, iFar: { value: 1 / (P.far ?? 5) }, push: { value: push }, over: { value: OVER },
      grid: { value: new THREE.Vector2(OVER / n, OVER / Math.round(n * ph / pw)) }, view: { value: new THREE.Vector2(W, H) },
      restPx: { value: 1 }, focus: { value: 0.5 }, cocK: { value: 0 }, cut: { value: cut }, dbg: { value: DBG }, camZ: { value: 0 },
    };
    const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, glslVersion: THREE.GLSL3,
      side: THREE.DoubleSide, transparent: !!cut, depthWrite: true, depthTest: true });
    const g = new THREE.PlaneGeometry(1, 1, n, Math.round(n * ph / pw));
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false; mesh.renderOrder = order;
    return mesh;
  };
  const scene = new THREE.Scene();
  const fg = P.frames ? mk(img, dep, 8, 0, 1, 1) : mk(img, dep, pw > ph ? 420 : 300, 1, 1, 1);
  const bg = P.frames ? null : mk(bimg, bdep, pw > ph ? 200 : 140, 0, 1.004, 0);
  if (DBG !== 3) scene.add(fg);
  if (bg) scene.add(bg);
  const cam = new THREE.PerspectiveCamera(2 * Math.atan(ty) * 180 / Math.PI, pw / ph, 0.02, 200);
  const v = { scene, fg, bg, cam, pw, ph, tex: [img, dep, bimg, bdep].filter(Boolean), frame: 0 };
  cache.set(P.id, v);
  while (cache.size > 3) { // la plus ancienne s'en va
    const [k, o] = cache.entries().next().value;
    cache.delete(k);
    o.tex.forEach((t) => t.dispose());
    for (const m of [o.fg, o.bg].filter(Boolean)) { m.geometry.dispose(); m.material.dispose(); }
  }
  return v;
}

// la photo reste figée P.hold secondes (c'est la première image du clip), s'anime, puis se fige sur la dernière
async function setFrame(P, V, tl) {
  const F = P.frames, k = clamp(Math.floor((tl - (P.hold ?? 0)) * (F.fps ?? 25)) + Math.round((F.start ?? 0) * (F.fps ?? 25)), 0, F.n - 1);
  if (V.frame === k) return;
  const t2 = await tex(frameUrl(P, k), false), u = V.fg.material.uniforms.img, old = u.value;
  u.value = t2; V.tex[V.tex.indexOf(old)] = t2; old.dispose(); V.frame = k;
}

// mouvement : un peu plus vite au milieu, sans jamais s'arrêter (le plan continue sous le fondu)
const ease = (k) => lerp(k, k * k * (3 - 2 * k), 0.45);
const KEYS = ['cx', 'cy', 'w', 'x', 'y', 'z', 'focus'];
function camState(P, tl) {
  const k = ease(clamp(tl / (P.t1 - P.t0)));
  const o = {};
  for (const key of KEYS) o[key] = lerp(P.from[key] ?? DEF[key], P.to[key] ?? P.from[key] ?? DEF[key], k);
  return o;
}
const DEF = { cx: 0.5, cy: 0.5, w: 0.9, x: 0, y: 0, z: 0, focus: 0.5 };

function drawPhoto(P, V, tl, target) {
  const c = camState(P, tl);
  const ww = c.w * V.pw, hh = ww * H / W;
  // la fenêtre reste dans la photo
  const x0 = clamp(c.cx * V.pw - ww / 2, 0, V.pw - ww), y0 = clamp(c.cy * V.ph - hh / 2, 0, Math.max(0, V.ph - hh));
  V.cam.position.set(c.x, c.y, -c.z);
  V.cam.setViewOffset(V.pw, V.ph, x0, y0, ww, hh);
  V.cam.updateProjectionMatrix();
  for (const m of [V.fg, V.bg].filter(Boolean)) {
    const u = m.material.uniforms;
    u.restPx.value = u.grid.value.x * V.pw * W / ww; // pas de grille à l'écran, au départ
    u.focus.value = c.focus; u.cocK.value = P.coc ?? I.coc ?? 2.6; u.camZ.value = c.z;
  }
  renderer.setRenderTarget(target);
  renderer.clear();
  renderer.render(V.scene, V.cam);
}

// ------------------------------------------------------------------ tirage : ton papier, grain, poussière, papillotement
const quad = new THREE.PlaneGeometry(2, 2);
const finalMat = new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3,
  uniforms: {
    A: { value: rt[0].texture }, B: { value: rt[1].texture }, mixK: { value: 0 }, fade: { value: 1 }, flick: { value: 1 },
    frame: { value: 0 }, res: { value: new THREE.Vector2(W, H) }, dbg: { value: DBG },
    ink: { value: new THREE.Vector3(...(I.ink || [0.035, 0.03, 0.027])) }, paper: { value: new THREE.Vector3(...(I.paper || [0.965, 0.925, 0.855])) },
    grainK: { value: I.grain ?? 0.07 }, dustK: { value: I.dust ?? 1 },
  },
  vertexShader: 'out vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: /* glsl */`
    uniform sampler2D A, B;
    uniform float mixK, fade, flick, frame, dbg, grainK, dustK;
    uniform vec2 res;
    uniform vec3 ink, paper;
    in vec2 vUv;
    out vec4 outColor;
    float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float h1(float n) { return fract(sin(n * 91.345 + 3.17) * 47453.5453); }
    void main() {
      vec3 c = mix(texture(A, vUv).rgb, texture(B, vUv).rgb, mixK);
      if (dbg > 0.5) { outColor = vec4(c, 1.0); return; }
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      l = mix(l, l * l * (3.0 - 2.0 * l), 0.22) * flick;   // légère courbe de tirage
      vec2 q = vUv - 0.5; q.x *= res.x / res.y;
      l *= 1.0 - 0.5 * smoothstep(0.32, 1.05, length(q));   // vignetage
      vec2 p = vUv * res;
      // poussières : quelques points par image, rarement un cheveu
      float dust = 0.0, lite = 0.0;
      for (int i = 0; i < 7; i++) {
        float s = frame * 7.0 + float(i);
        if (h1(s + 0.5) > 0.32 * dustK) continue;
        vec2 o = vec2(h1(s + 1.1), h1(s + 2.3)) * res;
        float r = 0.7 + 2.6 * pow(h1(s + 3.7), 2.0);
        float m = smoothstep(r + 0.8, r - 0.4, length(p - o + vec2(sin(p.y * 0.21 + s), cos(p.x * 0.17 + s)) * r * 0.3));
        if (h1(s + 4.9) < 0.3) lite = max(lite, m); else dust = max(dust, m);
      }
      if (h1(frame * 3.0 + 0.7) < 0.045 * dustK) {
        vec2 o = vec2(h1(frame + 5.5), h1(frame + 6.6)) * res;
        float R = 50.0 + 150.0 * h1(frame + 7.7), a0 = 6.2832 * h1(frame + 8.8);
        vec2 d = p - o;
        float ang = mod(atan(d.y, d.x) - a0 + 6.2832, 6.2832);
        dust = max(dust, smoothstep(1.3, 0.2, abs(length(d) - R)) * step(ang, 1.3 + h1(frame + 9.9)));
      }
      l = mix(l, l * 0.25, dust * 0.85);
      l = mix(l, 0.95, lite * 0.6);
      // grain argentique : plus présent dans les gris moyens, change à chaque image
      float g = h1(p + frame * 17.13) + h1(p * 1.37 + frame * 3.71) - 1.0;
      l += g * grainK * (0.35 + 1.3 * l * (1.0 - l));
      vec3 col = mix(ink, paper, clamp(l, 0.0, 1.0));
      outColor = vec4(col * fade, 1.0);
    }`,
  depthTest: false, depthWrite: false,
});
const post = new THREE.Mesh(quad, finalMat); post.frustumCulled = false;
const scenePost = new THREE.Scene(); scenePost.add(post);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// ------------------------------------------------------------------ textes
const words = (s) => s.split(/(\s+)/).filter(Boolean).map((w) => `<span class="w">${w}</span>`).join('');
const labelsEl = document.getElementById('labels');
for (const P of photos) {
  if (!P.place) continue;
  const el = document.createElement('div');
  el.className = 'lab';
  el.innerHTML = `<div class="eyebrow"><span class="tick"></span><span class="ey"></span></div><div class="place">${words(P.place)}</div>${P.sub ? `<div class="sub">${words(P.sub)}</div>` : ''}`;
  labelsEl.appendChild(el);
  P.el = el;
}
const openEl = document.getElementById('open');
if (I.open) {
  openEl.innerHTML = (I.open.eyebrow ? `<div class="eyebrow"><span class="tick"></span><span>${I.open.eyebrow}</span><span class="tick"></span></div>` : '')
    + I.open.lines.map((l) => `<div class="ln">${words(l)}</div>`).join('');
}
const creditEl = document.getElementById('credit');
if (I.credit) creditEl.textContent = I.credit.text;

function updateText(t) {
  if (I.open) {
    const O = I.open;
    openEl.style.opacity = (smooth(O.at, O.at + 0.4, t) * (1 - smooth(O.out, O.out + 0.9, t))).toFixed(3);
    openEl.querySelectorAll('.ln .w').forEach((w, k) => {
      const k0 = O.at + 0.3 + k * 0.16, e = smooth(k0, k0 + 0.9, t);
      w.style.opacity = e.toFixed(3);
      w.style.filter = `blur(${((1 - e) * 10).toFixed(2)}px)`;
      w.style.transform = `translateY(${((1 - e) * 20).toFixed(1)}px)`;
    });
    openEl.querySelectorAll('.tick').forEach((k) => { k.style.transform = `scaleX(${smooth(O.at, O.at + 0.8, t).toFixed(3)})`; });
  }
  const cur = photos.find((P) => t >= P.t0 && t < P.t1);
  if (cur && cur.credit) { // mention propre au plan (photo animée par IA, scène reconstituée)
    if (creditEl.textContent !== cur.credit) creditEl.textContent = cur.credit;
    // pendant un fondu, la mention du plan précédent reste jusqu'au bout : la nouvelle arrive après, sans saut
    const c0 = Math.max(cur.t0, ...photos.filter((P) => P !== cur && P.t0 < cur.t0 && P.t1 > cur.t0).map((P) => P.t1 - 0.2));
    creditEl.style.opacity = (0.9 * smooth(c0 + 0.5, c0 + 1.1, t) * (1 - smooth(cur.t1 - 1.0, cur.t1 - 0.4, t))).toFixed(3);
  } else if (I.credit) {
    if (creditEl.textContent !== I.credit.text) creditEl.textContent = I.credit.text;
    creditEl.style.opacity = (0.9 * smooth(I.credit.at, I.credit.at + 1, t) * (1 - smooth(I.credit.out, I.credit.out + 1, t))).toFixed(3);
  } else creditEl.style.opacity = '0';
  for (const P of photos) {
    if (!P.el) continue;
    const el = P.el, a0 = P.t0 + (P.at ?? 0.6), a1 = P.t1 - (P.out ?? 1.4);
    const vis = smooth(a0, a0 + 0.5, t) * (1 - smooth(a1, a1 + 0.7, t));
    el.style.opacity = vis.toFixed(3);
    if (vis <= 0) continue;
    el.querySelector('.tick').style.transform = `scaleX(${smooth(a0, a0 + 0.6, t).toFixed(3)})`;
    const ey = P.eyebrow || '', n = Math.floor(clamp((t - a0 - 0.2) / 0.9) * ey.length);
    el.querySelector('.ey').textContent = ey.slice(0, n);
    el.querySelectorAll('.place .w, .sub .w').forEach((w, k) => {
      const k0 = a0 + 0.4 + k * 0.05 + (w.closest('.sub') ? 0.25 : 0);
      const e = smooth(k0, k0 + 0.55, t);
      w.style.opacity = e.toFixed(3);
      w.style.transform = `translateY(${((1 - e) * 18).toFixed(2)}px)`;
      w.style.filter = `blur(${((1 - e) * 6).toFixed(2)}px)`;
    });
  }
}

// ------------------------------------------------------------------ image
async function renderFrame(t) {
  const on = photos.filter((P) => t >= P.t0 && t < P.t1);
  const U = finalMat.uniforms;
  for (let i = 0; i < 2; i++) {
    const P = on[i];
    if (P) { const V = await load(P); if (P.frames) await setFrame(P, V, t - P.t0); drawPhoto(P, V, t - P.t0, rt[i]); }
    else { renderer.setRenderTarget(rt[i]); renderer.clear(); }
  }
  const xf = I.xfade ?? 1.0;
  U.mixK.value = on.length > 1 ? smooth(on[1].t0, on[1].t0 + xf, t) : 0;
  const first = photos[0].t0;
  U.fade.value = smooth(first, first + (I.fadeIn ?? 1.2), t) * (1 - smooth(I.total - (I.fadeOut ?? 1.6), I.total, t));
  // fondu propre à chaque plan (plans montés séparément)
  for (const P of on) {
    const fi = P.fadeIn ?? P.fade, fo = P.fadeOut ?? P.fade;
    if (fi) U.fade.value *= smooth(P.t0, P.t0 + fi, t);
    if (fo) U.fade.value *= 1 - smooth(P.t1 - fo, P.t1, t);
  }
  const f = Math.round(t * FPS);
  U.frame.value = f % 9973;
  // papillotement de projection : doux, irrégulier
  const n = (k) => Math.sin(f * k * 12.9898) * 43758.5453 % 1;
  U.flick.value = 1 + (I.flicker ?? 0.022) * (Math.abs(n(1)) - 0.5) * 2 + 0.01 * Math.sin(t * 2.3);
  // la photo s'anime : bref souffle de lumière, comme un projecteur qui démarre
  for (const P of on) if (P.frames) { const d = t - P.t0 - (P.hold ?? 0); U.flick.value *= 1 + 0.08 * Math.exp(-(((d - 0.05) / 0.12) ** 2)); }
  renderer.setRenderTarget(null);
  renderer.clear();
  renderer.render(scenePost, ortho);
  gl.finish();
  updateText(t);
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

// contrôle qualité (node render.mjs --qa 0.5, tools/verif_video.py) : textes qui se chevauchent ou sortent de la zone sûre
window.qa = async (t) => {
  await renderFrame(t);
  const seen = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) if (+getComputedStyle(e).opacity < 0.35 || getComputedStyle(e).display === 'none') return false; return true; };
  const boxes = [];
  document.querySelectorAll('.lab').forEach((el) => { if (seen(el)) boxes.push({ group: 'légende', r: el.getBoundingClientRect() }); });
  if (seen(creditEl) && creditEl.textContent) boxes.push({ group: 'mention', r: creditEl.getBoundingClientRect() });
  document.querySelectorAll('#open .ln').forEach((el) => { if (seen(el)) boxes.push({ group: 'ouverture', r: el.getBoundingClientRect() }); });
  const over = [], out = [];
  for (let i = 0; i < boxes.length; i++) {
    const a = boxes[i].r;
    if (a.left < 60 || a.right > W - 60 || a.top < 54 || a.bottom > H - 54) out.push(boxes[i].group);
    for (let j = i + 1; j < boxes.length; j++) {
      if (boxes[i].group === boxes[j].group) continue;
      const b = boxes[j].r, ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ix > 4 && iy > 4) over.push(`${boxes[i].group} / ${boxes[j].group}`);
    }
  }
  return { t, over, out, mag: 0, due: [], shown: [] };
};
window.TOTAL = I.total;
window.renderFrame = renderFrame;
await document.fonts.ready;
await renderFrame(0.01);
window.READY = true;
