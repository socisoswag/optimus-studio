// Survol aérien en 3D (intro du film) : relief SRTM, images Sentinel-2, lumière et brume calculées.
//
//   drone.html?tl=intro-aerienne            une timeline de timelines/ qui définit window.INTRO
//   node render.mjs --page drone.html --timeline intro-aerienne --stills 4,20 --out stills
//
// Repère : x vers l'est, y vers le nord, z altitude (mètres), centré sur l'origine de data/drone/meta.json.
// La caméra reste à l'origine du rendu : le terrain est dessiné relativement à elle (précision).
import * as THREE from './vendor/three.module.min.js';

const Q = new URLSearchParams(location.search);
const TLN = (Q.get('tl') || 'intro-aerienne').replace(/[^a-z0-9-]/gi, '');
if (Q.get('notext')) document.body.classList.add('notext');
await import(`./timelines/${TLN}.js`);
const I = window.INTRO;
const META = await (await fetch('data/drone/meta.json')).json();
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
const hRaw = new Int16Array(await (await fetch('data/drone/height.bin')).arrayBuffer());
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
const aTex = await image('data/drone/albedo.jpg');
const dTex = {}, lTex = {};
for (const s of I.shots) {
  if (s.detail && !dTex[s.detail]) dTex[s.detail] = await image(`data/drone/detail-${s.detail}.jpg`);
  if (!lTex[s.light]) lTex[s.light] = await image(`data/drone/light-${s.light}.png`, false);
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
vec3 skyColor(vec3 rd) {
  float h = max(rd.z, 0.0);
  vec3 c = mix(horCol, zenCol, pow(h, 0.42));
  float mu = dot(rd, sunDir);
  c += glowCol * (0.55 * pow(max(mu, 0.0), 5.0) + 1.6 * pow(max(mu, 0.0), 64.0));
  c += sunCol * 26.0 * smoothstep(0.99996, 0.999985, mu);
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
uniform float logFC, detailK, waveK, dbg, albK, satK;
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
    vec3 refl = fog(skyColor(Rf), Rf * 60000.0, 60000.0, 0.0);
    float mu = max(dot(Rf, sunDir), 0.0);
    vec3 spec = sunCol * (pow(mu, 900.0) * 90.0 + pow(mu, 90.0) * 2.4) * L.r;
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
in vec2 vNdc;
out vec4 outColor;
void main() {
  vec4 q = invPV * vec4(vNdc, 1.0, 1.0);
  vec3 d3 = normalize(q.xyz / q.w);
  vec3 rd = vec3(d3.x, -d3.z, d3.y);
  vec3 c = skyColor(rd);
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
  albK: { value: 0.5 }, satK: { value: 1.15 },
  dbg: { value: parseFloat(Q.get('dbg') || '0') }, // vues de contrôle : 1 couleur, 2 lumière, 3 normales, 4 sans brume
});
skyMat.uniforms.invPV = { value: new THREE.Matrix4() };

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
  o = vec4(s * max(l - thr, 0.0) / max(l, 1e-4), 1.0);
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
uniform float exposure, fade, dip, time, sunVis, grain, flareK;
uniform vec3 dipCol, sunCol;
uniform vec2 sunPos;
in vec2 vUv; out vec4 o;
float hash(vec2 p) { p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
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
  col += vec3(-0.012, 0.004, 0.016) * (1.0 - l) * (1.0 - l);
  col *= mix(vec3(1.0), vec3(1.035, 1.0, 0.95), smoothstep(0.35, 0.9, l));
  col = pow(col, vec3(1.0 / 2.2));
  col *= 1.0 - smoothstep(0.18, 0.62, r2) * 0.42;
  col = mix(col, dipCol, dip);
  col *= fade;
  col += (hash(vUv * vec2(1920.0, 1080.0) + fract(time * 7.13) * 91.7) - 0.5) * grain;
  o = vec4(col, 1.0);
}`, {
  hdr: { value: rtHDR.texture }, bloomA: { value: rtB[0].texture }, bloomB: { value: rtC[0].texture },
  exposure: { value: 1 }, fade: { value: 1 }, dip: { value: 0 }, time: { value: 0 }, sunVis: { value: 0 }, grain: { value: 0.03 }, flareK: { value: 1 },
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
  K: s.keys.map((k) => { const [x, y] = toXY(k.lon, k.lat); return { roll: 0, ...k, x, y }; }),
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
function updateText(t) {
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
        const k0 = t0 + k * 0.11, e = smooth(k0, k0 + 1.1, t);
        c.style.opacity = e.toFixed(3);
        c.style.filter = `blur(${((1 - e) * 22).toFixed(2)}px)`;
        c.style.transform = `translateY(${((1 - e) * 26).toFixed(1)}px) scale(${(1.06 - 0.06 * e).toFixed(4)})`;
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
function renderFrame(t) {
  const s = shotAt(t), tl = t - s.t0;
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
  terrainMat.uniforms.satK.value = E.sat ?? 1.15;
  skyMat.uniforms.invPV.value.copy(camera.projectionMatrixInverse).premultiply(camera.matrixWorld);

  renderer.setRenderTarget(rtHDR);
  renderer.clear();
  renderer.render(sceneSky, camera);
  renderer.render(scene, camera);
  // halo : seuil puis deux niveaux de flou
  brightMat.uniforms.src.value = rtHDR.texture; brightMat.uniforms.thr.value = E.bloomThr ?? 1.1; pass(brightMat, rtB[0]);
  blurMat.uniforms.src.value = rtB[0].texture; blurMat.uniforms.dir.value.set(4 / W, 0); pass(blurMat, rtB[1]);
  blurMat.uniforms.src.value = rtB[1].texture; blurMat.uniforms.dir.value.set(0, 4 / H); pass(blurMat, rtB[0]);
  downMat.uniforms.src.value = rtB[0].texture; pass(downMat, rtC[0]);
  blurMat.uniforms.src.value = rtC[0].texture; blurMat.uniforms.dir.value.set(16 / W, 0); pass(blurMat, rtC[1]);
  blurMat.uniforms.src.value = rtC[1].texture; blurMat.uniforms.dir.value.set(0, 16 / H); pass(blurMat, rtC[0]);

  // soleil à l'écran
  const sv = new THREE.Vector3(sd[0], sd[2], -sd[1]).multiplyScalar(1e5).project(camera);
  const inView = sv.z < 1 && Math.abs(sv.x) < 1.3 && Math.abs(sv.y) < 1.3;
  const F = finalMat.uniforms;
  F.sunVis.value = inView ? sunVisible(c, sd) * smooth(1.3, 0.9, Math.max(Math.abs(sv.x), Math.abs(sv.y))) : 0;
  F.sunPos.value.set(sv.x * 0.5 + 0.5, sv.y * 0.5 + 0.5);
  V3(F.sunCol, E.sun);
  F.exposure.value = E.exposure ?? 1;
  F.flareK.value = E.flare ?? 1;
  F.time.value = t;
  // fondus : noir au début et à la fin, passages dans la brume entre les plans
  let fade = smooth(0, I.fadeIn ?? 2, t) * (1 - smooth(I.total - (I.fadeOut ?? 1.5), I.total, t));
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
