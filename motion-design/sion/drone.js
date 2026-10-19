// Survol aérien en 3D (intro du film) : relief SRTM, images Sentinel-2, lumière et brume calculées.
//
//   drone.html?tl=intro-aerienne            une timeline de timelines/ qui définit window.INTRO
//   node render.mjs --page drone.html --timeline intro-aerienne --stills 4,20 --out stills
//
// Repère : x vers l'est, y vers le nord, z altitude (mètres), centré sur l'origine de data/<zone>/meta.json
// (zone : INTRO.data, « drone » par défaut ; voir tools/prep_drone.py).
// La caméra reste à l'origine du rendu : le terrain est dessiné relativement à elle (précision).
import * as THREE from './vendor/three.module.min.js';

const Q = new URLSearchParams(location.search);
const TLN = (Q.get('tl') || 'intro-aerienne').replace(/[^a-z0-9-]/gi, '');
if (Q.get('notext')) document.body.classList.add('notext');
await import(`./timelines/${TLN}.js`);
const I = window.INTRO;
const DIR = `data/${I.data || 'drone'}`;
const META = await (await fetch(`${DIR}/meta.json`)).json();
const W = 1920, H = 1080, R_EARTH = 6371000;

// ------------------------------------------------------------------ conversions
const toXY = (lon, lat) => [(lon - META.origin[0]) * META.kx, (lat - META.origin[1]) * META.ky];
const rad = (d) => (d * Math.PI) / 180;
const sunVec = ([az, el]) => [Math.sin(rad(az)) * Math.cos(rad(el)), Math.cos(rad(az)) * Math.cos(rad(el)), Math.sin(rad(el))];
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };

// ------------------------------------------------------------------ données
const HM = META.height;
const hRaw = new Int16Array(await (await fetch(`${DIR}/height.bin`)).arrayBuffer());
const hF = new Float32Array(hRaw.length);
for (let i = 0; i < hRaw.length; i++) hF[i] = hRaw[i] * HM.scale;
function heightAt(x, y) { // bilinéaire, pour la caméra et le soleil derrière les crêtes
  const [x0, y0, x1, y1] = HM.ext;
  const u = ((x - x0) / (x1 - x0)) * HM.w - 0.5, v = ((y1 - y) / (y1 - y0)) * HM.h - 0.5;
  const i = clamp(Math.floor(u), 0, HM.w - 2), j = clamp(Math.floor(v), 0, HM.h - 2);
  const fu = clamp(u - i), fv = clamp(v - j);
  const a = hF[j * HM.w + i], b = hF[j * HM.w + i + 1], c = hF[(j + 1) * HM.w + i], d = hF[(j + 1) * HM.w + i + 1];
  return lerp(lerp(a, b, fu), lerp(c, d, fu), fv);
}

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.autoClear = false;
const gl = renderer.getContext();
const floatLinear = !!gl.getExtension('OES_texture_float_linear');

const hTex = floatLinear
  ? new THREE.DataTexture(hF, HM.w, HM.h, THREE.RedFormat, THREE.FloatType)
  : new THREE.DataTexture(Uint16Array.from(hF, (v) => THREE.DataUtils.toHalfFloat(v)), HM.w, HM.h, THREE.RedFormat, THREE.HalfFloatType);
hTex.magFilter = THREE.LinearFilter; hTex.minFilter = THREE.LinearFilter; hTex.flipY = false; hTex.needsUpdate = true;

const loader = new THREE.TextureLoader();
const aniso = renderer.capabilities.getMaxAnisotropy();
async function image(url, mip = true) {
  const t = await loader.loadAsync(url);
  t.flipY = false; t.colorSpace = THREE.NoColorSpace; t.anisotropy = aniso;
  t.generateMipmaps = mip; t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
  return t;
}
const aTex = await image(`${DIR}/${I.albedo || 'albedo'}.jpg`);
// deuxième date (balayage avant/après), même emprise
const bTex = I.albedoB ? await image(`${DIR}/${I.albedoB}.jpg`) : aTex;
// tracé du mur (tools/prep_mur.py), même grille que la couleur du sol
const wTex = I.shots.some((s) => s.wall) ? await image(`${DIR}/mur.png`, false) : aTex;
// ouverture spatiale : la Terre entière (jour, nuit, nuages), le Levant à 500 m, Sentinel-2 à 60 m
const SPACE = I.shots.some((s) => s.type === 'space');
const G = {};
if (SPACE) {
  for (const k of ['day', 'night', 'clouds']) { G[k] = await image(`data/drone/globe-${k}.jpg`); G[k].wrapS = THREE.RepeatWrapping; }
  G.lv = await image('data/drone/levant.jpg');
  G.lvN = await image('data/drone/levant-night.jpg');
  G.s2 = await image('data/drone/s2wide.jpg');
}
const dTex = {}, lTex = {};
for (const s of I.shots) {
  if (s.detail && !dTex[s.detail]) dTex[s.detail] = await image(`${DIR}/detail-${s.detail}.jpg`);
  if (!lTex[s.light]) lTex[s.light] = await image(`${DIR}/light-${s.light}.png`, false);
}

// ------------------------------------------------------------------ shaders
const COMMON = /* glsl */`
uniform sampler2D hTex, aTex, dTex, lTex;
uniform vec4 hExt, aExt, dExt;
uniform vec2 hSize;
uniform float dOn, hStep, lake;
uniform vec3 camPos, sunDir, sunCol, skyCol, hazeCol, glowCol, zenCol, horCol;
uniform float fogA, fogB, rayK, time, cloudCover;
vec2 uvOf(vec4 e, vec2 p) { return vec2((p.x - e.x) / (e.z - e.x), (e.w - p.y) / (e.w - e.y)); }
float heightAt(vec2 p) { return texture(hTex, uvOf(hExt, p)).r; }
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
// ciel : dégradé zénith-horizon, halo et disque du soleil
vec3 skyColor(vec3 rd, float glowK) {
  float h = max(rd.z, 0.0);
  vec3 c = mix(horCol, zenCol, pow(h, 0.42));
  float mu = dot(rd, sunDir);
  c += glowCol * (0.55 * pow(max(mu, 0.0), 5.0) + 1.6 * pow(max(mu, 0.0), 64.0)) * glowK;
  c += sunCol * 26.0 * smoothstep(0.99996, 0.999985, mu) * glowK;
  return c;
}
// brume en altitude (densité a·exp(-b·z)) et voile bleu de la distance
vec3 fog(vec3 col, vec3 ray, float dist, float far) {
  vec3 rd = ray / dist;
  float dz = ray.z;
  float k = abs(fogB * dz) > 1e-4 ? (1.0 - exp(-fogB * dz)) / (fogB * dz) : 1.0;
  float od = fogA * exp(-fogB * camPos.z) * dist * k;
  float ext = exp(-od);
  float mu = max(dot(rd, sunDir), 0.0);
  vec3 ins = mix(hazeCol, glowCol * 1.15, pow(mu, 7.0));
  col = col * ext + ins * (1.0 - ext);
  float ray2 = (1.0 - exp(-dist * rayK)) * far;
  return mix(col, horCol, ray2 * 0.5);
}
`;

const terrainMat = new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3,
  side: THREE.DoubleSide, // la grille passe de (x, y) à (x, z, -y) : son sens de parcours s'inverse
  uniforms: {},
  vertexShader: COMMON + /* glsl */`
uniform vec2 gridC; uniform float gridR;
out vec3 vW; out float vFD;
void main() {
  vec2 g = position.xy;
  vec2 p = gridC + sign(g) * g * g * gridR;
  float h = heightAt(p);
  vec3 rel = vec3(p - camPos.xy, h - camPos.z);
  rel.z -= dot(rel.xy, rel.xy) / (2.0 * ${R_EARTH}.0 * 1.15); // rotondité (réfraction comprise)
  vW = vec3(p, h);
  gl_Position = projectionMatrix * viewMatrix * vec4(rel.x, rel.z, -rel.y, 1.0);
  vFD = 1.0 + gl_Position.w;
}`,
  fragmentShader: COMMON + /* glsl */`
uniform float logFC, detailK, waveK, dbg, albK, satK, specK;
uniform sampler2D bTex, wTex;
uniform float wallOn, wallProg, wallK, wallPlan;
uniform vec2 wipeO, wipeD;
uniform float wipeOn, wipeT, wipeW, wipeGlow;
in vec3 vW; in float vFD;
out vec4 outColor;
vec3 normalAt(vec2 p) {
  float e = hStep;
  float l = heightAt(p - vec2(e, 0)), r = heightAt(p + vec2(e, 0)), d = heightAt(p - vec2(0, e)), u = heightAt(p + vec2(0, e));
  return normalize(vec3(l - r, d - u, 2.0 * e));
}
float waves(vec2 p) {
  float t = time;
  return vnoise(p * 0.045 + vec2(t * 0.05, t * 0.02)) * 0.6 + vnoise(p * 0.11 - vec2(t * 0.09, -t * 0.04)) * 0.3 + vnoise(p * 0.31 + vec2(t * 0.2, t * 0.13)) * 0.1;
}
void main() {
  vec2 p = vW.xy;
  vec3 ray = vec3(p - camPos.xy, vW.z - camPos.z);
  float dist = length(ray);
  vec3 V = -ray / dist;
  vec3 alb = texture(aTex, uvOf(aExt, p)).rgb;
  float wsd = 1e9;
  if (wipeOn > 0.5) { // derrière le front : la seconde date
    wsd = dot(p - wipeO, wipeD) - wipeT;
    alb = mix(alb, texture(bTex, uvOf(aExt, p)).rgb, smoothstep(wipeW, -wipeW, wsd));
  }
  if (dOn > 0.5) {
    vec2 du = uvOf(dExt, p);
    float m = smoothstep(0.0, 0.04, du.x) * smoothstep(1.0, 0.96, du.x) * smoothstep(0.0, 0.04, du.y) * smoothstep(1.0, 0.96, du.y);
    if (m > 0.0) alb = mix(alb, texture(dTex, du).rgb, m);
  }
  // couleurs vraies du satellite (réflectance d'environ 0,4 au blanc) ramenées à un albédo physique,
  // un peu plus de contraste et de couleur
  alb = pow(alb, vec3(2.2)) * albK;
  float lum = dot(alb, vec3(0.299, 0.587, 0.114));
  alb = max(mix(vec3(lum), alb, satK), 0.0);
  alb = pow(alb / 0.14, vec3(1.1)) * 0.14;
  // calcaire et craie du désert : hautes lumières adoucies
  float la = dot(alb, vec3(0.299, 0.587, 0.114));
  alb *= mix(1.0, (0.24 + (la - 0.24) * 0.45) / max(la, 1e-4), step(0.24, la));
  alb = mix(alb, vec3(dot(alb, vec3(0.299, 0.587, 0.114))), smoothstep(0.16, 0.3, la) * 0.3);
  vec3 L = texture(lTex, uvOf(hExt, p)).rgb; // ombre, ciel, eau
  vec3 col;
  if (L.b > 0.5) {
    float e = 1.5;
    vec2 gw = vec2(waves(p + vec2(e, 0)) - waves(p - vec2(e, 0)), waves(p + vec2(0, e)) - waves(p - vec2(0, e))) / (2.0 * e);
    vec3 N = normalize(vec3(-gw * waveK, 1.0));
    float ndv = max(dot(N, V), 0.0);
    float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
    vec3 Rf = reflect(-V, N);
    Rf.z = abs(Rf.z);
    // le reflet du halo autour du soleil reste discret : le scintillement fait le reste
    vec3 refl = fog(skyColor(Rf, 0.22), Rf * 60000.0, 60000.0, 0.0);
    float mu = max(dot(Rf, sunDir), 0.0);
    vec3 spec = sunCol * (pow(mu, 2400.0) * 80.0 + pow(mu, 160.0) * 0.08) * L.r * specK;
    vec3 body = alb * (sunCol * max(sunDir.z, 0.0) * 0.5 + skyCol * 0.8);
    col = mix(body, refl, fres) + spec;
  } else {
    vec3 N = normalAt(p);
    // grain du sol de près : le satellite voit à 8 m, l'œil plus fin
    float near = 1.0 - smoothstep(600.0, 4000.0, dist);
    if (near > 0.0) alb *= mix(1.0, 0.86 + 0.28 * fbm(p * 0.18), near * detailK);
    float ndl = max(dot(N, sunDir), 0.0);
    float wrap = max(dot(N, sunDir) * 0.5 + 0.5, 0.0);
    vec3 direct = sunCol * ndl * L.r;
    vec3 amb = skyCol * L.g * (0.55 + 0.45 * N.z) + sunCol * 0.06 * wrap * L.g;
    col = alb * (direct + amb);
  }
  // au bord des données, le sol se fond dans la brume (pas de texture étirée au-delà)
  vec4 he = hExt;
  float edge = smoothstep(he.x, he.x + 9000.0, p.x) * smoothstep(he.z, he.z - 9000.0, p.x) * smoothstep(he.y, he.y + 9000.0, p.y) * smoothstep(he.w, he.w - 9000.0, p.y);
  col = mix(hazeCol * 0.9, col, edge);
  // le mur : un trait de braise posé sur le relief, qui court du nord au sud
  if (wallOn > 0.5) {
    vec3 wv = texture(wTex, uvOf(aExt, p)).rgb;
    float rev = 1.0 - smoothstep(wallProg - 0.006, wallProg, wv.b);
    float front = exp(-abs(wv.b - wallProg) / 0.004) * step(0.001, wv.r);
    float near2 = 0.55 + 0.45 * smoothstep(30000.0, 2000.0, dist);
    col += vec3(1.0, 0.33, 0.10) * wallK * near2 * (wv.r * rev * 2.4 + front * wv.r * 6.0 + wv.g * rev * wallPlan * 0.8);
  }
  // le front de braise ne court que sur la terre
  if (wipeOn > 0.5 && L.b < 0.5) col += vec3(1.0, 0.36, 0.12) * wipeGlow * (exp(-abs(wsd) / (wipeW * 1.2)) * 1.4 + exp(-abs(wsd) / (wipeW * 4.0)) * 0.12);
  if (dbg < 0.5) col = fog(col, ray, dist, 1.0);
  if (dbg > 0.5 && dbg < 1.5) col = alb;
  if (dbg > 1.5 && dbg < 2.5) col = L;
  if (dbg > 2.5 && dbg < 3.5) col = normalAt(p) * 0.5 + 0.5;
  outColor = vec4(col, 1.0);
  gl_FragDepth = log2(vFD) * logFC * 0.5;
}`,
});

const skyMat = new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3,
  depthTest: false, depthWrite: false,
  uniforms: {},
  vertexShader: /* glsl */`
out vec2 vNdc;
void main() { vNdc = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: COMMON + /* glsl */`
uniform mat4 invPV;
uniform float starK;
in vec2 vNdc;
out vec4 outColor;
float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
vec3 starsAt(vec3 d) {
  vec3 p = d * 520.0, c = floor(p), f = fract(p) - 0.5;
  float h = h3(c);
  if (h < 0.9965) return vec3(0.0);
  vec3 o = vec3(h3(c + 1.7), h3(c + 3.1), h3(c + 5.3)) - 0.5;
  float b = (h - 0.9965) / 0.0035;
  float tw = 0.75 + 0.25 * sin(time * (2.0 + 5.0 * h3(c + 7.7)) + 40.0 * h);
  return mix(vec3(1.0, 0.86, 0.72), vec3(0.78, 0.86, 1.0), h3(c + 9.2)) * b * b * tw * smoothstep(0.16, 0.0, length(f - o * 0.6));
}
void main() {
  vec4 q = invPV * vec4(vNdc, 1.0, 1.0);
  vec3 d3 = normalize(q.xyz / q.w);
  vec3 rd = vec3(d3.x, -d3.z, d3.y);
  vec3 c = skyColor(rd, 1.0);
  // voiles d'altocumulus, éclairés par le soleil bas
  if (rd.z > 0.0 && cloudCover > 0.0) {
    float tz = (6500.0 - camPos.z) / max(rd.z, 0.02);
    vec2 cp = camPos.xy + rd.xy * tz;
    float n = fbm(cp / 5200.0 + vec2(time * 0.004, 0.0));
    float cov = smoothstep(1.0 - cloudCover, 1.0 - cloudCover + 0.32, n) * smoothstep(0.0, 0.12, rd.z);
    float mu = max(dot(rd, sunDir), 0.0);
    vec3 cc = mix(horCol * 1.05, glowCol * 1.4, pow(mu, 3.0)) + sunCol * 0.25 * pow(mu, 18.0);
    c = mix(c, cc, cov * 0.85);
  }
  if (starK > 0.0 && rd.z > 0.0) c += starsAt(rd) * starK * smoothstep(0.0, 0.25, rd.z);
  c = fog(c, rd * 120000.0, 120000.0, 0.0);
  outColor = vec4(c, 1.0);
}`,
});

for (const m of [terrainMat, skyMat]) {
  Object.assign(m.uniforms, {
    hTex: { value: hTex }, aTex: { value: aTex }, dTex: { value: null }, lTex: { value: null },
    hExt: { value: new THREE.Vector4(...HM.ext) }, aExt: { value: new THREE.Vector4(...META.albedo.ext) }, dExt: { value: new THREE.Vector4() },
    hSize: { value: new THREE.Vector2(HM.w, HM.h) }, dOn: { value: 0 }, hStep: { value: HM.step }, lake: { value: META.lake },
    camPos: { value: new THREE.Vector3() }, sunDir: { value: new THREE.Vector3() },
    sunCol: { value: new THREE.Vector3() }, skyCol: { value: new THREE.Vector3() }, hazeCol: { value: new THREE.Vector3() },
    glowCol: { value: new THREE.Vector3() }, zenCol: { value: new THREE.Vector3() }, horCol: { value: new THREE.Vector3() },
    fogA: { value: 0 }, fogB: { value: 0 }, rayK: { value: 0 }, time: { value: 0 }, cloudCover: { value: 0 },
  });
}
Object.assign(terrainMat.uniforms, {
  gridC: { value: new THREE.Vector2() }, gridR: { value: 120000 }, logFC: { value: 0 }, detailK: { value: 1 }, waveK: { value: 1 },
  albK: { value: 0.5 }, satK: { value: 1.15 }, specK: { value: 1 },
  bTex: { value: bTex }, wTex: { value: wTex }, wallOn: { value: 0 }, wallProg: { value: 0 }, wallK: { value: 1 }, wallPlan: { value: 1 },
  wipeO: { value: new THREE.Vector2() }, wipeD: { value: new THREE.Vector2(1, 0) },
  wipeOn: { value: 0 }, wipeT: { value: 0 }, wipeW: { value: 120 }, wipeGlow: { value: 1 },
  dbg: { value: parseFloat(Q.get('dbg') || '0') }, // vues de contrôle : 1 couleur, 2 lumière, 3 normales, 4 sans brume
});
skyMat.uniforms.invPV = { value: new THREE.Matrix4() };
skyMat.uniforms.starK = { value: 0 };

// ------------------------------------------------------------------ lumières posées sur le relief (villages)
const VILL = I.shots.some((s) => s.lights) ? (await import('./data/villages-depeuples.js'), window.VILLAGES) : [];
const lightsMat = new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3,
  transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
  uniforms: { camPos: { value: new THREE.Vector3() }, time: { value: 0 }, logFC: { value: 0 }, size: { value: 1 }, gain: { value: 1 }, col: { value: new THREE.Vector3(1.0, 0.55, 0.24) } },
  vertexShader: /* glsl */`
uniform vec3 camPos; uniform float time, size;
in float t0; in float seed;
out float vA; out float vFD;
void main() {
  vec3 rel = position - camPos;
  rel.z -= dot(rel.xy, rel.xy) / (2.0 * ${R_EARTH}.0 * 1.15);
  gl_Position = projectionMatrix * viewMatrix * vec4(rel.x, rel.z, -rel.y, 1.0);
  float d = length(rel);
  gl_PointSize = clamp(size * 14000.0 / d, 5.0, 64.0);
  float fl = 0.82 + 0.12 * sin(time * (5.0 + 4.0 * seed) + seed * 40.0) + 0.06 * sin(time * 13.0 + seed * 91.0);
  vA = smoothstep(t0, t0 + 0.9, time) * fl * (1.0 + 2.5 * exp(-max(time - t0, 0.0) * 2.2) * step(t0, time));
  vFD = 1.0 + gl_Position.w;
}`,
  fragmentShader: /* glsl */`
uniform float logFC, gain; uniform vec3 col;
in float vA; in float vFD;
out vec4 o;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float core = exp(-r * r * 18.0) * 6.0, halo = exp(-r * r * 3.0) * 0.6;
  o = vec4(col * (core + halo) * vA * gain, 1.0);
  gl_FragDepth = log2(vFD) * logFC * 0.5;
}`,
});
const lightsGeo = new THREE.BufferGeometry();
const lightsPts = new THREE.Points(lightsGeo, lightsMat); lightsPts.frustumCulled = false;
function setLights(s) { // positions et instants d'allumage, d'ouest en est le long du plan
  if (lightsGeo.userData.shot === s.id) return;
  lightsGeo.userData.shot = s.id;
  const L = s.lights, P = [], T = [], R = [];
  const [x0, y0, x1, y1] = HM.ext;
  for (const v of VILL) {
    const [x, y] = toXY(v[0], v[1]);
    if (x < x0 + 500 || x > x1 - 500 || y < y0 + 500 || y > y1 - 500) continue;
    P.push(x, y, heightAt(x, y) + 18);
    const k = (v[0] - L.lon0) / (L.lon1 - L.lon0);
    const h = Math.sin(v[0] * 1e4 + v[1] * 7e3) * 0.5 + 0.5;
    T.push(L.at[0] + clamp(k) * (L.at[1] - L.at[0]) + (h - 0.5) * 1.2);
    R.push(h);
  }
  lightsGeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  lightsGeo.setAttribute('t0', new THREE.Float32BufferAttribute(T, 1));
  lightsGeo.setAttribute('seed', new THREE.Float32BufferAttribute(R, 1));
}

// ------------------------------------------------------------------ globe : la Terre vue de l'espace
// Repère géocentrique (mètres, axe z vers le pôle Nord). Atmosphère à diffusion simple (Rayleigh et brume),
// transmission vers le soleil par l'approximation de Chapman, ombre de la Terre, lumières des villes la nuit,
// reflet du soleil sur la mer, nuages mondiaux (NASA) et nappe de cumulus au large de Jaffa.
const globeMat = new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3,
  depthTest: false, depthWrite: false,
  uniforms: {},
  vertexShader: /* glsl */`
out vec2 vNdc;
void main() { vNdc = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: COMMON + /* glsl */`
uniform mat4 invPV;
uniform vec3 camE, sunE, e0, n0;
uniform vec2 org, kxy, deckC;
uniform vec4 lvBox, s2Box;
uniform sampler2D gDay, gNight, gCloud, lvTex, lvNight, s2Tex;
uniform float sunI, BM, nightK, cloudK, starK, dayK, albK2, specLo, deckK, deckAlt, deckR, camAlt;
in vec2 vNdc;
out vec4 outColor;
const float RG = 6371000.0, RA = 6471000.0, PI = 3.14159265;
const vec3 BR = vec3(5.8e-6, 13.5e-6, 33.1e-6);
const float HR = 8000.0, HMIE = 1200.0;
vec2 sph(vec3 ro, vec3 rd, float r) {
  float b = dot(ro, rd), lr = length(ro);
  float h = b * b - (lr - r) * (lr + r);
  if (h < 0.0) return vec2(-1.0);
  h = sqrt(h);
  return vec2(-b - h, -b + h);
}
float chap(float X, float h, float c) {
  float q = sqrt(X + h);
  if (c >= 0.0) return q / (q * c + 1.0) * exp(-h);
  float x0 = sqrt(1.0 - c * c) * (X + h);
  return 2.0 * sqrt(x0) * exp(X - x0) - q / (1.0 - q * c) * exp(-h);
}
vec3 sunTrans(vec3 p) {
  float r = length(p), cz = dot(p / r, sunE), h = max(r - RG, 0.0);
  if (cz < 0.0 && sph(p, sunE, RG).x > 0.0) return vec3(0.0);
  float oR = HR * chap(RG / HR, h / HR, cz), oM = HMIE * chap(RG / HMIE, h / HMIE, cz);
  return exp(-(BR * oR + BM * 1.11 * oM));
}
vec3 atmo(vec3 ro, vec3 rd, float tEnd, out vec3 trans, float jit) {
  trans = vec3(1.0);
  vec2 ta = sph(ro, rd, RA);
  if (ta.y <= 0.0) return vec3(0.0);
  float t0 = max(ta.x, 0.0), t1 = min(ta.y, tEnd);
  if (t1 <= t0) return vec3(0.0);
  float mu = dot(rd, sunE);
  float pR = 3.0 / (16.0 * PI) * (1.0 + mu * mu);
  float g = 0.72, g2 = g * g;
  float pM = 3.0 / (8.0 * PI) * ((1.0 - g2) * (1.0 + mu * mu)) / ((2.0 + g2) * pow(1.0 + g2 - 2.0 * g * mu, 1.5));
  const int NS = 20;
  float ds = (t1 - t0) / float(NS);
  vec3 sR = vec3(0.0), sM = vec3(0.0);
  float oR = 0.0, oM = 0.0;
  for (int i = 0; i < NS; i++) {
    vec3 p = ro + rd * (t0 + ds * (float(i) + jit));
    float h = length(p) - RG;
    float dR = exp(-h / HR) * ds, dM = exp(-h / HMIE) * ds;
    vec3 att = exp(-(BR * (oR + dR * 0.5) + BM * 1.11 * (oM + dM * 0.5))) * sunTrans(p);
    oR += dR; oM += dM;
    sR += att * dR; sM += att * dM;
  }
  trans = exp(-(BR * oR + BM * 1.11 * oM));
  return sunI * (sR * BR * pR + sM * BM * pM);
}
float bw(vec2 ll, vec4 b, float f) { return smoothstep(b.x, b.x + f, ll.x) * smoothstep(b.z, b.z - f, ll.x) * smoothstep(b.y, b.y + f, ll.y) * smoothstep(b.w, b.w - f, ll.y); }
vec2 buv(vec2 ll, vec4 b) { return vec2((ll.x - b.x) / (b.z - b.x), (b.w - ll.y) / (b.w - b.y)); }
float bm(vec2 p, vec4 e, float f) { return smoothstep(e.x, e.x + f, p.x) * smoothstep(e.z, e.z - f, p.x) * smoothstep(e.y, e.y + f, p.y) * smoothstep(e.w, e.w - f, p.y); }
vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }
float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
vec3 stars(vec3 d) {
  vec3 p = d * 380.0, c = floor(p), f = fract(p) - 0.5;
  float h = hash3(c);
  if (h < 0.996) return vec3(0.0);
  vec3 o = vec3(hash3(c + 1.7), hash3(c + 3.1), hash3(c + 5.3)) - 0.5;
  float b = (h - 0.996) / 0.004;
  return mix(vec3(1.0, 0.85, 0.7), vec3(0.75, 0.85, 1.0), hash3(c + 9.2)) * b * b * smoothstep(0.16, 0.0, length(f - o * 0.6)) * 2.5;
}
vec2 lonlat(vec3 n) { return vec2(degrees(atan(n.y, n.x)), degrees(asin(clamp(n.z, -1.0, 1.0)))); }
vec2 eqUV(vec2 ll) { return vec2((ll.x + 180.0) / 360.0, (90.0 - ll.y) / 180.0); }
vec3 nAt(vec2 p) {
  float e = hStep;
  float l = heightAt(p - vec2(e, 0)), r = heightAt(p + vec2(e, 0)), d = heightAt(p - vec2(0, e)), u = heightAt(p + vec2(0, e));
  return normalize(vec3((l - r) * 1.5, (d - u) * 1.5, 2.0 * e));
}
float deck(vec2 xy) {
  float m = smoothstep(deckR, deckR * 0.55, length(xy - deckC));
  if (m <= 0.0) return 0.0;
  float n = fbm(xy / 2300.0 + vec2(time * 0.003, 0.0)) * 0.75 + fbm(xy / 700.0) * 0.25;
  return smoothstep(0.50, 0.66, n) * m;
}
vec3 cloudCol(vec3 P, float bright) {
  vec3 n = normalize(P);
  float l = max(dot(n, sunE) * 0.65 + 0.35, 0.0);
  vec3 Ts = sunTrans(P);
  Ts = mix(vec3(dot(Ts, vec3(0.33))), Ts, 0.7); // les sommets des nuages restent blancs
  return vec3(0.95) / PI * (sunI * Ts * l * bright + vec3(0.36, 0.46, 0.66) * 0.09 * sunI * smoothstep(-0.1, 0.3, dot(n, sunE)));
}
void main() {
  vec4 q = invPV * vec4(vNdc, 1.0, 1.0);
  vec3 rd = normalize(q.xyz / q.w);
  vec3 ro = camE;
  float jit = hash(gl_FragCoord.xy + fract(time) * 37.0);
  vec2 tg = sph(ro, rd, RG);
  bool hitG = tg.x > 0.0;
  float tEnd = hitG ? tg.x : 1e13;
  vec3 col = vec3(0.0);
  if (!hitG) {
    col = stars(rd) * starK;
    float mu = dot(rd, sunE);
    col += vec3(1.0, 0.96, 0.9) * sunI * (16.0 * smoothstep(0.999958, 0.999985, mu) + 0.5 * pow(max(mu, 0.0), 9000.0));
  } else {
    vec3 P = ro + rd * tg.x, n = normalize(P);
    vec2 ll = lonlat(n);
    vec3 a = lin(texture(gDay, eqUV(ll)).rgb) * dayK;
    float w = bw(ll, lvBox, 1.2);
    if (w > 0.0) a = mix(a, lin(texture(lvTex, buv(ll, lvBox)).rgb) * dayK, w);
    w = bw(ll, s2Box, 0.18);
    if (w > 0.0) a = mix(a, lin(texture(s2Tex, buv(ll, s2Box)).rgb) * albK2, w);
    vec2 xy = vec2((ll.x - org.x) * kxy.x, (ll.y - org.y) * kxy.y);
    float wa = bm(xy, aExt, 6000.0);
    if (wa > 0.0) a = mix(a, lin(texture(aTex, uvOf(aExt, xy)).rgb) * albK2, wa);
    float water = clamp((a.b - a.r) * 60.0, 0.0, 1.0) * step(a.g, 0.06);
    a = mix(a, vec3(0.005, 0.018, 0.042), water * 0.55); // la mer plus profonde, plus bleue
    vec3 ns = n; float sh = 1.0;
    float wh = bm(xy, hExt, 6000.0);
    if (wh > 0.0) {
      vec3 nl = nAt(xy);
      ns = normalize(mix(n, normalize(nl.x * e0 + nl.y * n0 + nl.z * n), wh));
      vec3 L = texture(lTex, uvOf(hExt, xy)).rgb;
      sh = mix(1.0, L.r, wh); water = mix(water, L.b, wh);
    }
    float cz = dot(n, sunE);
    vec3 Ts = sunTrans(P + n * 3.0);
    vec3 sky = vec3(0.30, 0.45, 0.80) * 0.12 * sunI * smoothstep(-0.12, 0.3, cz);
    col = a / PI * (sunI * Ts * max(dot(ns, sunE), 0.0) * sh + sky);
    if (water > 0.5) {
      vec2 wv = vec2(vnoise(xy * 0.03 + time * 0.08), vnoise(xy * 0.03 - time * 0.07 + 7.0)) - 0.5;
      vec3 nw = normalize(n + (wv.x * e0 + wv.y * n0) * mix(0.06, 0.02, smoothstep(2e3, 2e5, camAlt)));
      vec3 Hh = normalize(-rd + sunE);
      float sp = pow(max(dot(nw, Hh), 0.0), mix(1400.0, specLo, smoothstep(2e3, 6e5, camAlt)));
      float fr = 0.02 + 0.98 * pow(1.0 - max(dot(nw, -rd), 0.0), 5.0);
      col = col * 0.7 + sunI * Ts * sp * mix(0.25, 1.0, fr) * 0.9 * step(0.0, cz);
    }
    float lights = texture(gNight, eqUV(ll)).r;
    float wn = bw(ll, lvBox, 1.2);
    if (wn > 0.0) lights = mix(lights, texture(lvNight, buv(ll, lvBox)).r, wn);
    lights = pow(lights, 2.7);
    col += mix(vec3(1.0, 0.62, 0.30), vec3(1.0, 0.86, 0.62), lights) * lights * nightK * (1.0 - smoothstep(-0.10, 0.03, cz));
    // nuages : couche mondiale à 7 km (tenue à l'écart du Levant), nappe de cumulus à basse altitude
    vec2 tc = sph(ro, rd, RG + 7000.0);
    float tcl = tc.x > 0.0 ? tc.x : tc.y;
    if (tcl > 0.0 && tcl < tEnd && cloudK > 0.0) {
      vec3 Pc = ro + rd * tcl; vec2 lc = lonlat(normalize(Pc));
      float m = smoothstep(5.0, 11.0, length((lc - vec2(34.6, 31.9)) * vec2(0.85, 1.0)));
      float ca = smoothstep(0.18, 0.75, texture(gCloud, eqUV(lc)).r) * cloudK * m;
      col = mix(col, cloudCol(Pc, 1.0), ca);
    }
    if (deckK > 0.0) {
      vec2 td = sph(ro, rd, RG + deckAlt);
      float tdl = td.x > 0.0 ? td.x : td.y;
      if (tdl > 0.0 && tdl < tEnd) {
        vec3 Pd = ro + rd * tdl; vec2 ld = lonlat(normalize(Pd));
        vec2 xd = vec2((ld.x - org.x) * kxy.x, (ld.y - org.y) * kxy.y);
        float da = deck(xd) * deckK;
        // relief des cumulus : côté soleil éclairé, côté opposé dans l'ombre
        vec2 sd2 = normalize(vec2(dot(sunE, e0), dot(sunE, n0)) + 1e-5);
        float relief = clamp(0.55 + (fbm(xd / 900.0) - fbm((xd - sd2 * 450.0) / 900.0)) * 3.0, 0.25, 1.25);
        // ombre des cumulus sur la mer et la côte
        vec3 sl = vec3(dot(sunE, e0), dot(sunE, n0), dot(sunE, n));
        if (sl.z > 0.03) col *= 1.0 - 0.6 * deck(xy + sl.xy / sl.z * deckAlt) * deckK;
        if (da > 0.0) col = mix(col, cloudCol(Pd, relief), da);
      }
    }
  }
  vec3 tr;
  vec3 ins = atmo(ro, rd, tEnd, tr, jit);
  outColor = vec4(col * tr + ins, 1.0);
}`,
});
Object.assign(globeMat.uniforms, {
  hTex: { value: hTex }, aTex: { value: aTex }, lTex: { value: null }, dTex: { value: aTex },
  hExt: { value: new THREE.Vector4(...HM.ext) }, aExt: { value: new THREE.Vector4(...META.albedo.ext) }, dExt: { value: new THREE.Vector4() },
  hSize: { value: new THREE.Vector2(HM.w, HM.h) }, hStep: { value: HM.step }, time: { value: 0 },
  invPV: { value: new THREE.Matrix4() }, camE: { value: new THREE.Vector3() }, sunE: { value: new THREE.Vector3() },
  e0: { value: new THREE.Vector3() }, n0: { value: new THREE.Vector3() },
  org: { value: new THREE.Vector2(META.origin[0], META.origin[1]) }, kxy: { value: new THREE.Vector2(META.kx, META.ky) },
  deckC: { value: new THREE.Vector2() },
  lvBox: { value: new THREE.Vector4(...(META.globe?.levant || [0, 0, 1, 1])) }, s2Box: { value: new THREE.Vector4(...(META.globe?.s2wide || [0, 0, 1, 1])) },
  gDay: { value: G.day || null }, gNight: { value: G.night || null }, gCloud: { value: G.clouds || null }, lvTex: { value: G.lv || null },
  lvNight: { value: G.lvN || null }, s2Tex: { value: G.s2 || null },
  sunI: { value: 20 }, BM: { value: 2.1e-5 }, nightK: { value: 1 }, cloudK: { value: 1 }, starK: { value: 1 }, dayK: { value: 1 }, albK2: { value: 0.5 },
  specLo: { value: 120 }, deckK: { value: 0 }, deckAlt: { value: 3600 }, deckR: { value: 40000 }, camAlt: { value: 0 },
});
const globeMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), globeMat); globeMesh.frustumCulled = false;
const sceneGlobe = new THREE.Scene(); sceneGlobe.add(globeMesh);

// géocentrique : position, base locale (est, nord, haut)
function ecef(lat, lon, alt) { const la = rad(lat), lo = rad(lon), r = R_EARTH + alt; return [r * Math.cos(la) * Math.cos(lo), r * Math.cos(la) * Math.sin(lo), r * Math.sin(la)]; }
function enu(lat, lon) {
  const la = rad(lat), lo = rad(lon);
  return { e: [-Math.sin(lo), Math.cos(lo), 0], n: [-Math.sin(la) * Math.cos(lo), -Math.sin(la) * Math.sin(lo), Math.cos(la)], u: [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)] };
}
const comb = (B, a, b, c) => [0, 1, 2].map((i) => B.e[i] * a + B.n[i] * b + B.u[i] * c);
const B0 = enu(META.origin[1], META.origin[0]);
function sunECEF(sun, lapse) { // lapse : avance du soleil vers l'est (degrés, avant l'heure du plan)
  const [az, el] = sun;
  const v = comb(B0, Math.sin(rad(az)) * Math.cos(rad(el)), Math.cos(rad(az)) * Math.cos(rad(el)), Math.sin(rad(el)));
  const c = Math.cos(rad(lapse)), s = Math.sin(rad(lapse));
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
}
function raySphere(o, d, r) {
  const b = o[0] * d[0] + o[1] * d[1] + o[2] * d[2], c = o[0] ** 2 + o[1] ** 2 + o[2] ** 2 - r * r, h = b * b - c;
  return h < 0 ? null : [-b - Math.sqrt(h), -b + Math.sqrt(h)];
}
const keyAt = (pts, t) => { // [[t, v], ...] interpolé en douceur
  if (!pts) return 0;
  let i = 0; while (i < pts.length - 2 && t > pts[i + 1][0]) i++;
  const [t0, v0] = pts[i], [t1, v1] = pts[Math.min(i + 1, pts.length - 1)];
  return t1 === t0 ? v0 : lerp(v0, v1, smooth(t0, t1, t));
};

// grille centrée sur la caméra, serrée de près (pas ∝ distance)
const N = 1024;
const pos = new Float32Array((N + 1) * (N + 1) * 3);
for (let j = 0, k = 0; j <= N; j++) for (let i = 0; i <= N; i++, k += 3) { pos[k] = (i / N) * 2 - 1; pos[k + 1] = (j / N) * 2 - 1; }
const idx = new Uint32Array(N * N * 6);
for (let j = 0, k = 0; j < N; j++) for (let i = 0; i < N; i++) {
  const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
  idx.set([a, c, b, b, c, d], k); k += 6;
}
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
geo.setIndex(new THREE.BufferAttribute(idx, 1));
const terrain = new THREE.Mesh(geo, terrainMat);
terrain.frustumCulled = false;
const quad = new THREE.PlaneGeometry(2, 2);
const sky = new THREE.Mesh(quad, skyMat);
sky.frustumCulled = false;
const sceneSky = new THREE.Scene(); sceneSky.add(sky);
const scene = new THREE.Scene(); scene.add(terrain);
const camera = new THREE.PerspectiveCamera(I.fov || 38, W / H, 2, 400000);
terrainMat.uniforms.logFC.value = 2.0 / Math.log2(camera.far + 1.0);

// ------------------------------------------------------------------ post-traitement
const rtOpt = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
const rtHDR = new THREE.WebGLRenderTarget(W, H, { ...rtOpt, samples: I.msaa ?? 4 });
const rtB = [0, 1].map(() => new THREE.WebGLRenderTarget(W / 4, H / 4, { ...rtOpt, depthBuffer: false }));
const rtC = [0, 1].map(() => new THREE.WebGLRenderTarget(W / 16, H / 16, { ...rtOpt, depthBuffer: false }));
const PV = /* glsl */`out vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const passMat = (frag, uniforms) => new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, depthTest: false, depthWrite: false, uniforms, vertexShader: PV, fragmentShader: frag });
const brightMat = passMat(/* glsl */`
uniform sampler2D src; uniform vec2 texel; uniform float thr;
in vec2 vUv; out vec4 o;
void main() {
  vec3 s = vec3(0);
  for (int j = -1; j <= 2; j++) for (int i = -1; i <= 2; i++) s += texture(src, vUv + vec2(i, j) * texel).rgb;
  s /= 16.0;
  float l = max(max(s.r, s.g), s.b);
  // plafond : une source minuscule et très vive (le soleil) ne doit pas laisser un carré dans le halo
  o = vec4(s * min(max(l - thr, 0.0), 6.0) / max(l, 1e-4), 1.0);
}`, { src: { value: null }, texel: { value: new THREE.Vector2(1 / W, 1 / H) }, thr: { value: 1.2 } });
const blurMat = passMat(/* glsl */`
uniform sampler2D src; uniform vec2 dir;
in vec2 vUv; out vec4 o;
void main() {
  const float w[4] = float[4](0.2475, 0.2067, 0.1205, 0.049);
  vec3 s = texture(src, vUv).rgb * w[0];
  for (int i = 1; i < 4; i++) { s += texture(src, vUv + dir * (float(i) * 1.5)).rgb * w[i]; s += texture(src, vUv - dir * (float(i) * 1.5)).rgb * w[i]; }
  o = vec4(s, 1.0);
}`, { src: { value: null }, dir: { value: new THREE.Vector2() } });
const downMat = passMat(/* glsl */`
uniform sampler2D src; uniform vec2 texel;
in vec2 vUv; out vec4 o;
void main() { vec3 s = vec3(0); for (int j = -1; j <= 2; j++) for (int i = -1; i <= 2; i++) s += texture(src, vUv + vec2(i, j) * texel).rgb; o = vec4(s / 16.0, 1.0); }`,
{ src: { value: null }, texel: { value: new THREE.Vector2(4 / W, 4 / H) } });
const finalMat = passMat(/* glsl */`
uniform sampler2D hdr, bloomA, bloomB;
uniform float exposure, fade, dip, time, sunVis, grain, flareK, cloud, tintK;
uniform vec3 dipCol, sunCol;
uniform vec2 sunPos;
in vec2 vUv; out vec4 o;
float hash(vec2 p) { p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
float fb(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.07 + 11.3; a *= 0.5; } return s; }
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec2 c = vUv - 0.5;
  float r2 = dot(c, c);
  // aberration chromatique légère vers les bords
  vec2 ca = c * 0.0022 * r2 * 4.0;
  vec3 col = vec3(texture(hdr, vUv + ca).r, texture(hdr, vUv).g, texture(hdr, vUv - ca).b);
  col += texture(bloomA, vUv).rgb * 0.22 + texture(bloomB, vUv).rgb * 0.30;
  // reflets d'objectif quand le soleil est dans le champ
  if (sunVis > 0.001) {
    vec2 sp = sunPos, axis = vec2(0.5) - sp;
    vec2 asp = vec2(16.0 / 9.0, 1.0);
    const float FS[4] = float[4](0.45, 0.85, 1.25, 1.7);
    const float SZ[4] = float[4](0.05, 0.022, 0.09, 0.035);
    const vec3 TI[4] = vec3[4](vec3(1.0, 0.55, 0.25), vec3(0.45, 0.8, 1.0), vec3(1.0, 0.75, 0.4), vec3(0.6, 1.0, 0.7));
    vec3 fl = vec3(0);
    for (int i = 0; i < 4; i++) {
      float f = FS[i], sz = SZ[i];
      vec3 tint = TI[i];
      float d = length((vUv - (sp + axis * f)) * asp);
      fl += tint * smoothstep(sz, sz * 0.25, d) * 0.06;
    }
    float d0 = length((vUv - sp) * asp);
    float streak = exp(-abs((vUv.y - sp.y)) * 160.0) * exp(-abs(vUv.x - sp.x) * 2.2);
    fl += sunCol * (exp(-d0 * 9.0) * 0.35 + streak * 0.28);
    col += fl * sunVis * flareK;
  }
  col *= exposure;
  col = aces(col);
  // étalonnage : ombres légèrement froides, hautes lumières chaudes
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col += vec3(-0.012, 0.004, 0.016) * (1.0 - l) * (1.0 - l) * tintK;
  col *= mix(vec3(1.0), vec3(1.035, 1.0, 0.95), smoothstep(0.35, 0.9, l));
  col = pow(col, vec3(1.0 / 2.2));
  col *= 1.0 - smoothstep(0.18, 0.62, r2) * 0.42;
  col = mix(col, dipCol, dip);
  // traversée d'un nuage : volutes qui s'ouvrent vers les bords, puis blanc, puis la vue revient
  if (cloud > 0.0) {
    vec2 q = (vUv - 0.5) * vec2(16.0 / 9.0, 1.0);
    float r = length(q);
    // volutes qui grossissent : on entre dans le nuage
    vec2 w = q * (2.6 / (0.45 + cloud * 1.6)) + vec2(time * 0.35, -time * 0.18);
    float n = fb(w + fb(w * 0.7 + time * 0.25) * 1.2);
    float m = clamp((cloud * 1.55 - 0.35) + (n - 0.5) * 1.3 - r * 0.25 * (1.0 - cloud), 0.0, 1.0);
    vec3 cc = mix(vec3(0.74, 0.72, 0.70), vec3(1.0, 0.96, 0.9), n);
    col = mix(col, cc, m * m * (3.0 - 2.0 * m));
  }
  col *= fade;
  col += (hash(vUv * vec2(1920.0, 1080.0) + fract(time * 7.13) * 91.7) - 0.5) * grain;
  o = vec4(col, 1.0);
}`, {
  hdr: { value: rtHDR.texture }, bloomA: { value: rtB[0].texture }, bloomB: { value: rtC[0].texture },
  exposure: { value: 1 }, fade: { value: 1 }, dip: { value: 0 }, time: { value: 0 }, sunVis: { value: 0 }, grain: { value: 0.03 }, flareK: { value: 1 }, cloud: { value: 0 }, tintK: { value: 1 },
  dipCol: { value: new THREE.Vector3(1, 0.95, 0.88) }, sunCol: { value: new THREE.Vector3() }, sunPos: { value: new THREE.Vector2() },
});
const post = new THREE.Mesh(quad, finalMat); post.frustumCulled = false;
const scenePost = new THREE.Scene(); scenePost.add(post);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
function pass(mat, target) { post.material = mat; renderer.setRenderTarget(target); renderer.clear(); renderer.render(scenePost, ortho); }

// ------------------------------------------------------------------ caméra : courbe de Catmull-Rom sur les points clés
function catmull(p0, p1, p2, p3, u) {
  const u2 = u * u, u3 = u2 * u;
  return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
}
const shots = I.shots.map((s) => ({
  ...s,
  K: s.keys.map((k) => {
    if (s.type === 'space') return { roll: 0, ...k, x: k.lon, y: k.lat, alt: Math.log(k.alt) };
    const [x, y] = toXY(k.lon, k.lat); return { roll: 0, ...k, x, y };
  }),
}));
function camAt(s, tl) {
  const K = s.K;
  let i = 0;
  while (i < K.length - 2 && tl > K[i + 1].t) i++;
  const a = K[Math.max(0, i - 1)], b = K[i], c = K[i + 1], d = K[Math.min(K.length - 1, i + 2)];
  const u = clamp((tl - b.t) / (c.t - b.t));
  const f = (key) => catmull(a[key], b[key], c[key], d[key], u);
  return { x: f('x'), y: f('y'), z: f('alt'), hdg: f('hdg'), pitch: f('pitch'), roll: f('roll') };
}
// petit flottement de drone (déterministe)
const wob = (t, f, ph) => Math.sin(t * f + ph) * 0.6 + Math.sin(t * f * 2.31 + ph * 1.7) * 0.3 + Math.sin(t * f * 4.07 + ph * 0.3) * 0.1;

// ------------------------------------------------------------------ textes
const labelsEl = document.getElementById('labels');
const titleEl = document.getElementById('title');
const words = (s) => s.split(/(\s+)/).filter(Boolean).map((w) => `<span class="w">${w}</span>`).join('');
for (const s of shots) {
  if (!s.label) continue;
  const el = document.createElement('div');
  el.className = 'lab';
  el.innerHTML = `<div class="eyebrow"><span class="tick"></span><span class="ey"></span></div><div class="place">${words(s.label.place)}</div>${s.label.sub ? `<div class="sub">${words(s.label.sub)}</div>` : ''}`;
  labelsEl.appendChild(el);
  s.labelEl = el;
}
if (I.title) {
  const T = I.title;
  titleEl.innerHTML = `<div class="big">${[...T.word].map((c) => `<span class="ch">${c}</span>`).join('')}</div>`
    + `<div class="scripts"><span class="native" lang="he">${T.scripts[0]}</span><span class="bar"></span><span class="native" lang="ar">${T.scripts[1]}</span></div>`
    + `<div class="text">${words(T.sub)}</div>`;
}
const outroEl = document.getElementById('outro');
if (I.outro && outroEl) {
  outroEl.innerHTML = (I.outro.eyebrow ? `<div class="eyebrow"><span class="tick"></span><span>${I.outro.eyebrow}</span><span class="tick r"></span></div>` : '')
    + I.outro.lines.map((l) => `<div class="ln">${words(l)}</div>`).join('');
}
function updateOutro(t) {
  if (!I.outro || !outroEl) return;
  const O = I.outro;
  const vis = smooth(O.at, O.at + 0.4, t) * (1 - smooth(O.out, O.out + 1.0, t));
  outroEl.style.opacity = vis.toFixed(3);
  if (vis <= 0) return;
  outroEl.querySelectorAll('.ln .w').forEach((w, k) => {
    const k0 = O.at + 0.3 + k * 0.16, e = smooth(k0, k0 + 0.9, t);
    w.style.opacity = e.toFixed(3);
    w.style.filter = `blur(${((1 - e) * 10).toFixed(2)}px)`;
    w.style.transform = `translateY(${((1 - e) * 20).toFixed(1)}px)`;
  });
  outroEl.querySelectorAll('.tick').forEach((k) => { k.style.transform = `scaleX(${smooth(O.at, O.at + 0.8, t).toFixed(3)})`; });
}
function updateText(t) {
  updateOutro(t);
  for (const s of shots) {
    if (!s.labelEl) continue;
    const L = s.label, el = s.labelEl;
    const a0 = s.t0 + L.at, a1 = s.t1 - (L.out ?? 1.2);
    const vis = smooth(a0, a0 + 0.5, t) * (1 - smooth(a1, a1 + 0.7, t));
    el.style.opacity = vis.toFixed(3);
    if (vis <= 0) continue;
    el.querySelector('.tick').style.transform = `scaleX(${smooth(a0, a0 + 0.6, t).toFixed(3)})`;
    const ey = L.eyebrow, n = Math.floor(clamp((t - a0 - 0.2) / 0.9) * ey.length);
    el.querySelector('.ey').textContent = ey.slice(0, n);
    el.querySelectorAll('.place .w, .sub .w').forEach((w, k) => {
      const k0 = a0 + 0.45 + k * 0.08 + (w.closest('.sub') ? 0.35 : 0);
      const e = smooth(k0, k0 + 0.55, t);
      w.style.opacity = e.toFixed(3);
      w.style.transform = `translateY(${((1 - e) * 18).toFixed(2)}px)`;
      w.style.filter = `blur(${((1 - e) * 6).toFixed(2)}px)`;
    });
  }
  if (I.title) {
    const T = I.title, t0 = T.at;
    const vis = smooth(t0, t0 + 0.3, t) * (1 - smooth(T.out, T.out + 1.2, t));
    titleEl.style.opacity = vis.toFixed(3);
    if (vis > 0) {
      titleEl.querySelectorAll('.big .ch').forEach((c, k) => {
        const k0 = t0 + k * 0.09, e = smooth(k0, k0 + 0.9, t);
        const cool = smooth(k0 + 0.25, k0 + 1.6, t); // braise brève, puis pierre
        c.style.opacity = e.toFixed(3);
        c.style.filter = `blur(${((1 - e) * 7).toFixed(2)}px)`;
        c.style.transform = `translateY(${((1 - e) * 18).toFixed(1)}px) scale(${(1.04 - 0.04 * e).toFixed(4)})`;
        const mix3 = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * cool));
        c.style.color = `rgb(${mix3([255, 196, 120], [233, 220, 192]).join(',')})`;
        const g = (1 - cool) * e;
        c.style.textShadow = `0 0 ${(10 + 26 * g).toFixed(0)}px rgba(255,91,31,${(0.5 * g).toFixed(3)}), 0 0 ${(4 + 6 * g).toFixed(0)}px rgba(255,174,90,${(0.45 * g).toFixed(3)}), 0 6px 60px rgba(0,0,0,.35)`;
      });
      const big = titleEl.querySelector('.big');
      big.style.transform = `scale(${(1 + (t - t0) * 0.004).toFixed(4)})`;
      const sc = smooth(t0 + 1.0, t0 + 1.8, t);
      titleEl.querySelector('.scripts').style.opacity = sc.toFixed(3);
      titleEl.querySelector('.bar').style.transform = `scaleX(${smooth(t0 + 1.1, t0 + 2.0, t).toFixed(3)})`;
      titleEl.querySelectorAll('.text .w').forEach((w, k) => {
        const k0 = t0 + 2.0 + k * 0.12, e = smooth(k0, k0 + 0.7, t);
        w.style.opacity = e.toFixed(3);
        w.style.filter = `blur(${((1 - e) * 6).toFixed(2)}px)`;
        w.style.transform = `translateY(${((1 - e) * 14).toFixed(1)}px)`;
      });
    }
  }
}

// ------------------------------------------------------------------ soleil caché par le relief (pour les reflets)
function sunVisible(c, sd) {
  let vis = 1;
  for (let d = 200; d < 90000; d *= 1.08) {
    const x = c.x + sd[0] / Math.hypot(sd[0], sd[1]) * d * Math.cos(Math.asin(sd[2])), y = c.y + sd[1] / Math.hypot(sd[0], sd[1]) * d * Math.cos(Math.asin(sd[2]));
    const z = c.z + Math.tan(Math.asin(sd[2])) * d - (d * d) / (2 * R_EARTH * 1.15);
    const h = heightAt(x, y);
    vis = Math.min(vis, clamp((z - h) / (d * 0.006) + 0.5));
    if (vis <= 0) return 0;
  }
  return vis;
}

// ------------------------------------------------------------------ une image
const V3 = (u, a) => u.value.set(a[0], a[1], a[2]);
function shotAt(t) {
  let s = shots[0];
  for (const x of shots) if (t >= x.t0) s = x;
  return s;
}
// ------------------------------------------------------------------ plan spatial : caméra géocentrique, globe seul
const HUD = document.getElementById('hud');
function fmtAlt(a) {
  const n = a >= 10000 ? Math.round(a / 1000) : Math.round(a / 10) * 10;
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (a >= 10000 ? ' km' : ' m');
}
const fmtDeg = (v, p, m) => `${Math.floor(Math.abs(v))}°${String(Math.floor((Math.abs(v) % 1) * 60)).padStart(2, '0')}′ ${v >= 0 ? p : m}`;
function renderSpace(t, s, tl) {
  const c = camAt(s, tl);
  const lat = c.y, lon = c.x, alt = Math.exp(c.z);
  const wa = s.wobble ?? 0.4;
  const hdg = c.hdg + wob(t, 0.31, 0.7) * 0.25 * wa, pitch = c.pitch + wob(t, 0.27, 1.9) * 0.18 * wa, roll = c.roll;
  const P = ecef(lat, lon, alt), B = enu(lat, lon);
  const f = comb(B, Math.sin(rad(hdg)) * Math.cos(rad(pitch)), Math.cos(rad(hdg)) * Math.cos(rad(pitch)), Math.sin(rad(pitch)));
  camera.position.set(0, 0, 0);
  camera.up.set(...B.u);
  camera.lookAt(new THREE.Vector3(...f));
  camera.rotateZ(rad(roll));
  camera.fov = keyAt(s.fovKeys, tl) || s.fov || I.fov || 38;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  const sE = sunECEF(s.sun, keyAt(s.lapse, tl));
  const E = s.env, u = globeMat.uniforms;
  u.invPV.value.copy(camera.projectionMatrixInverse).premultiply(camera.matrixWorld);
  u.camE.value.set(...P); u.sunE.value.set(...sE);
  u.e0.value.set(...B0.e); u.n0.value.set(...B0.n);
  u.time.value = t; u.camAlt.value = alt;
  u.lTex.value = lTex[s.light];
  u.sunI.value = E.sunI ?? 20; u.BM.value = E.mie ?? 2.1e-5; u.cloudK.value = E.clouds ?? 1;
  u.nightK.value = (E.night ?? 1) * (s.nightKeys ? keyAt(s.nightKeys, tl) : 1);
  u.starK.value = E.stars ?? 1; u.dayK.value = E.day ?? 1; u.albK2.value = E.albedo ?? 0.5; u.specLo.value = E.specLo ?? 120;
  if (s.deck) { const [x, y] = toXY(s.deck.lon, s.deck.lat); u.deckC.value.set(x, y); u.deckAlt.value = s.deck.alt; u.deckR.value = s.deck.r; u.deckK.value = s.deck.k ?? 1; } else u.deckK.value = 0;
  renderer.setRenderTarget(rtHDR);
  renderer.clear();
  renderer.render(sceneGlobe, camera);
  // soleil à l'écran, caché par la Terre
  const sv = new THREE.Vector3(...sE).multiplyScalar(1e5).project(camera);
  const hit = raySphere(P, sE, R_EARTH + 2000);
  let vis = hit && hit[0] > 0 ? 0 : 1;
  if (vis) { // près du bord de la Terre, le soleil traverse l'atmosphère : il pâlit
    const b = P[0] * sE[0] + P[1] * sE[1] + P[2] * sE[2], d = Math.sqrt(Math.max(0, P[0] ** 2 + P[1] ** 2 + P[2] ** 2 - b * b));
    vis = b < 0 ? smooth(R_EARTH + 2000, R_EARTH + 40000, d) : 1;
  }
  // altimètre et position
  if (HUD) {
    const hv = s.hud ? smooth(s.hud[0], s.hud[0] + 0.8, tl) * (1 - smooth(s.hud[1], s.hud[1] + 0.6, tl)) : 0;
    HUD.style.opacity = hv.toFixed(3);
    if (hv > 0) {
      HUD.querySelector('.k').textContent = 'Altitude';
      HUD.querySelector('.v').textContent = fmtAlt(alt);
      HUD.querySelector('.pos').textContent = `${fmtDeg(lat, 'N', 'S')} · ${fmtDeg(lon, 'E', 'O')}`;
    }
  }
  return { E, sun: sE, sv, sunVis: vis, cloud: keyAt(s.cloudPass, tl), exposure: s.expo ? keyAt(s.expo, tl) : null };
}

// altimètre des plans au sol : la hauteur du terrain sous la caméra, qui plonge à la falaise
function gauge(s, tl) {
  const g = s.gauge;
  if (!HUD) return;
  if (s.stamp) { // date de l'image affichée, qui change avec le balayage
    const st = s.stamp;
    const hv = smooth(st.at, st.at + 0.6, tl) * (1 - smooth(st.out, st.out + 0.6, tl));
    HUD.style.opacity = hv.toFixed(3);
    let cur = st.items[0];
    for (const it of st.items) if (tl >= it[0]) cur = it;
    const n = Math.floor(clamp((tl - cur[0]) / 0.7) * cur[1].length);
    HUD.querySelector('.k').textContent = st.k;
    HUD.querySelector('.v').textContent = cur[1].slice(0, Math.max(n, 1));
    HUD.querySelector('.pos').textContent = st.sub || '';
    return;
  }
  const hv = g ? smooth(g.at - 0.5, g.at + 0.2, tl) * (1 - smooth(g.out, g.out + 0.6, tl)) : 0;
  HUD.style.opacity = hv.toFixed(3);
  if (hv <= 0) return;
  const v = Math.round(lerp(g.from, g.to, smooth(g.at, g.at + g.dur, tl)) / 5) * 5;
  HUD.querySelector('.k').textContent = g.k;
  HUD.querySelector('.v').textContent = `${v > 0 ? '+' : v < 0 ? '\u2212' : ''}${Math.abs(v)} m`;
  HUD.querySelector('.pos').textContent = smooth(g.at, g.at + g.dur, tl) > 0.98 ? (g.done || 'Sous le niveau de la mer') : '';
}

// repères accrochés au relief : un point, un trait, un nom ; cachés derrière les crêtes
const PINS = document.getElementById('pins');
for (const s of shots) for (const p of s.pins || []) {
  const el = document.createElement('div');
  el.className = 'pin';
  el.innerHTML = `<span class="nm">${p.name}</span><span class="ln"></span><span class="dot"></span>`;
  PINS.appendChild(el);
  const [x, y] = toXY(p.lon, p.lat);
  Object.assign(p, { el, x, y, z: heightAt(x, y) + (p.h ?? 30) });
}
function pins(s, tl, c) {
  for (const x of shots) for (const p of x.pins || []) if (x !== s) p.el.style.opacity = '0';
  for (const p of s.pins || []) {
    let vis = smooth(p.at, p.at + 0.6, tl) * (1 - smooth(p.out, p.out + 0.5, tl));
    const v = new THREE.Vector3(p.x - c.x, p.z - c.z - Math.hypot(p.x - c.x, p.y - c.y) ** 2 / (2 * R_EARTH * 1.15), -(p.y - c.y)).project(camera);
    if (v.z >= 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) vis = 0;
    if (vis > 0) for (let k = 1; k < 24; k++) { // le relief coupe-t-il la ligne de visée ?
      const f = k / 24, gx = lerp(c.x, p.x, f), gy = lerp(c.y, p.y, f), gz = lerp(c.z, p.z, f);
      if (heightAt(gx, gy) > gz + 5) { vis = 0; break; }
    }
    p.el.style.opacity = vis.toFixed(3);
    if (vis <= 0) continue;
    const sx = (v.x * 0.5 + 0.5) * W, sy = (1 - (v.y * 0.5 + 0.5)) * H;
    p.el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
    p.el.querySelector('.ln').style.height = `${(lerp(0, 64, smooth(p.at, p.at + 0.7, tl))).toFixed(1)}px`;
  }
}

function renderFrame(t) {
  const s = shotAt(t), tl = t - s.t0;
  if (s.type === 'space') { pins(s, tl, { x: 0, y: 0, z: 1e9 }); return finish(t, renderSpace(t, s, tl)); }
  gauge(s, tl);
  const c = camAt(s, tl);
  const wa = (s.wobble ?? 1);
  const hdg = c.hdg + wob(t, 0.37, 1.1) * 0.35 * wa, pitch = c.pitch + wob(t, 0.29, 2.3) * 0.22 * wa, roll = c.roll + wob(t, 0.23, 0.4) * 0.3 * wa;
  const fwd = new THREE.Vector3(Math.sin(rad(hdg)) * Math.cos(rad(pitch)), Math.sin(rad(pitch)), -Math.cos(rad(hdg)) * Math.cos(rad(pitch)));
  camera.position.set(0, 0, 0);
  camera.up.set(0, 1, 0);
  camera.lookAt(fwd);
  camera.rotateZ(rad(roll));
  camera.fov = s.fov || I.fov || 38;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  const E = s.env;
  const sd = sunVec(s.sun);
  for (const m of [terrainMat, skyMat]) {
    const u = m.uniforms;
    u.camPos.value.set(c.x, c.y, c.z);
    u.sunDir.value.set(...sd);
    V3(u.sunCol, E.sun); V3(u.skyCol, E.sky); V3(u.hazeCol, E.haze); V3(u.glowCol, E.glow); V3(u.zenCol, E.zenith); V3(u.horCol, E.horizon);
    u.fogA.value = E.fogA; u.fogB.value = E.fogB; u.rayK.value = E.rayK; u.time.value = t; u.cloudCover.value = E.clouds ?? 0;
    u.lTex.value = lTex[s.light];
    if (s.detail) { u.dTex.value = dTex[s.detail]; u.dOn.value = 1; u.dExt.value.set(...META.details[s.detail].ext); } else { u.dOn.value = 0; u.dTex.value = aTex; }
  }
  terrainMat.uniforms.gridC.value.set(c.x + Math.sin(rad(hdg)) * 20000, c.y + Math.cos(rad(hdg)) * 20000);
  terrainMat.uniforms.waveK.value = E.waves ?? 1;
  terrainMat.uniforms.detailK.value = E.detail ?? 1;
  terrainMat.uniforms.albK.value = E.albedo ?? 0.5;
  const WP = s.wipe, TU = terrainMat.uniforms;
  TU.wallOn.value = s.wall ? 1 : 0;
  if (s.wall) {
    TU.wallProg.value = keyAt(s.wall.prog, tl);
    TU.wallK.value = (s.wall.k ?? 1) * smooth(s.wall.at ?? 0, (s.wall.at ?? 0) + 1.2, tl);
    TU.wallPlan.value = s.wall.planned ?? 1;
  }
  TU.wipeOn.value = WP ? 1 : 0;
  if (WP) {
    const [ox, oy] = toXY(WP.lon, WP.lat);
    TU.wipeO.value.set(ox, oy);
    TU.wipeD.value.set(Math.sin(rad(WP.dir)), Math.cos(rad(WP.dir)));
    TU.wipeT.value = lerp(WP.d0, WP.d1, smooth(WP.t0, WP.t1, tl));
    TU.wipeW.value = WP.w ?? 120;
    TU.wipeGlow.value = (WP.glow ?? 1) * smooth(WP.t0 - 0.3, WP.t0 + 0.4, tl) * (1 - smooth(WP.t1 - 0.6, WP.t1 + 0.4, tl));
  }
  terrainMat.uniforms.satK.value = E.sat ?? 1.15;
  terrainMat.uniforms.specK.value = E.spec ?? 1;
  skyMat.uniforms.invPV.value.copy(camera.projectionMatrixInverse).premultiply(camera.matrixWorld);

  skyMat.uniforms.starK.value = E.stars ?? 0;
  renderer.setRenderTarget(rtHDR);
  renderer.clear();
  renderer.render(sceneSky, camera);
  if (s.lights) {
    setLights(s);
    if (!lightsPts.parent) scene.add(lightsPts);
    const LU = lightsMat.uniforms;
    LU.camPos.value.set(c.x, c.y, c.z); LU.time.value = tl; LU.logFC.value = terrainMat.uniforms.logFC.value;
    LU.size.value = s.lights.size ?? 1; LU.gain.value = s.lights.gain ?? 1;
  } else if (lightsPts.parent) scene.remove(lightsPts);
  renderer.render(scene, camera);
  const sv = new THREE.Vector3(sd[0], sd[2], -sd[1]).multiplyScalar(1e5).project(camera);
  const inView = sv.z < 1 && Math.abs(sv.x) < 1.3 && Math.abs(sv.y) < 1.3;
  pins(s, tl, c);
  return finish(t, { E, sun: sd, sv, sunVis: inView ? sunVisible(c, sd) : 0, cloud: keyAt(s.cloudPass, tl) });
}

// halo, reflets, étalonnage, fondus, textes
function finish(t, o) {
  const { E, sv } = o;
  // halo : seuil puis deux niveaux de flou
  brightMat.uniforms.src.value = rtHDR.texture; brightMat.uniforms.thr.value = E.bloomThr ?? 1.1; pass(brightMat, rtB[0]);
  blurMat.uniforms.src.value = rtB[0].texture; blurMat.uniforms.dir.value.set(4 / W, 0); pass(blurMat, rtB[1]);
  blurMat.uniforms.src.value = rtB[1].texture; blurMat.uniforms.dir.value.set(0, 4 / H); pass(blurMat, rtB[0]);
  downMat.uniforms.src.value = rtB[0].texture; pass(downMat, rtC[0]);
  blurMat.uniforms.src.value = rtC[0].texture; blurMat.uniforms.dir.value.set(16 / W, 0); pass(blurMat, rtC[1]);
  blurMat.uniforms.src.value = rtC[1].texture; blurMat.uniforms.dir.value.set(0, 16 / H); pass(blurMat, rtC[0]);

  const inView = sv.z < 1 && Math.abs(sv.x) < 1.3 && Math.abs(sv.y) < 1.3;
  const F = finalMat.uniforms;
  F.sunVis.value = inView ? o.sunVis * smooth(1.3, 0.9, Math.max(Math.abs(sv.x), Math.abs(sv.y))) : 0;
  F.cloud.value = o.cloud || 0;
  F.sunPos.value.set(sv.x * 0.5 + 0.5, sv.y * 0.5 + 0.5);
  V3(F.sunCol, E.sun);
  F.exposure.value = o.exposure ?? E.exposure ?? 1;
  F.flareK.value = E.flare ?? 1;
  F.tintK.value = E.tint ?? 1;
  F.time.value = t;
  // fondus : noir au début et à la fin, passages dans la brume entre les plans
  const f0 = I.fadeStart ?? 0;
  let fade = smooth(f0, f0 + (I.fadeIn ?? 2), t) * (1 - smooth(I.total - (I.fadeOut ?? 1.5), I.total, t));
  let dip = 0;
  for (const d of I.dips || []) dip = Math.max(dip, 1 - smooth(0, d[1], Math.abs(t - d[0])));
  F.fade.value = fade; F.dip.value = dip * dip * (3 - 2 * dip);
  V3(F.dipCol, I.dipCol || [0.93, 0.88, 0.8]);
  post.material = finalMat;
  renderer.setRenderTarget(null);
  renderer.clear();
  renderer.render(scenePost, ortho);
  gl.finish();
  updateText(t);
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

window.TOTAL = I.total;
window.renderFrame = renderFrame;
window.camHeight = (lon, lat) => heightAt(...toXY(lon, lat));
await document.fonts.ready;
await renderFrame(0.01);
window.READY = true;
