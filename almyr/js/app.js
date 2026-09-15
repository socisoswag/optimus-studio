/* ══════════════════════════════════════
   ALMYR — moteur de scroll
   Séquence d'images pilotée au scroll
   ══════════════════════════════════════ */

const FRAME_COUNT   = 121;
const PRELOAD_FIRST = 12;
const MOBILE_BP     = 768;

const isMobile   = window.matchMedia(`(max-width: ${MOBILE_BP}px)`).matches;
const FRAME_DIR  = isMobile ? 'frames-mobile' : 'frames';
const reduced    = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── ÉLÉMENTS ─── */
const loader      = document.getElementById('loader');
const loaderBar   = document.getElementById('loader-bar');
const loaderPct   = document.getElementById('loader-percent');
const canvasWrap  = document.getElementById('canvas-wrap');
const canvas      = document.getElementById('canvas');
const ctx         = canvas.getContext('2d', { alpha: false });
const darkOverlay = document.getElementById('dark-overlay');
const heroEl      = document.getElementById('hero');
const scrollCont  = document.getElementById('scroll-container');
const hud         = document.getElementById('hud');
const hudChapter  = document.getElementById('hud-chapter');
const hudLabel    = document.getElementById('hud-label');
const marqueeWrap = document.getElementById('marquee-wrap');

/* ─── STOCK DE FRAMES ─── */
const frames      = new Array(FRAME_COUNT);
let   loadedCount = 0;
let   currentFrame = 0;
let   bgColor     = '#07070A';

const frameUrl = i => `${FRAME_DIR}/frame_${String(i + 1).padStart(4, '0')}.webp`;

function loadFrame(i) {
  return new Promise(resolve => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      frames[i] = img;
      loadedCount++;
      const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
      loaderBar.style.width = pct + '%';
      loaderPct.textContent = pct + '%';
      resolve();
    };
    img.onerror = resolve;
    img.src = frameUrl(i);
  });
}

async function preloadFrames() {
  /* Phase 1 — les premières frames, pour peindre vite */
  await Promise.all(
    Array.from({ length: PRELOAD_FIRST }, (_, i) => loadFrame(i))
  );
  if (frames[0]) {
    sampleBgColor(frames[0]);
    drawFrame(0);
  }

  /* Phase 2 — le reste en tâche de fond */
  await Promise.all(
    Array.from({ length: FRAME_COUNT - PRELOAD_FIRST }, (_, i) => loadFrame(i + PRELOAD_FIRST))
  );

  hideLoader();
  if (!reduced) initScroll();
}

function hideLoader() {
  if (window.gsap) {
    gsap.to(loader, {
      opacity: 0, duration: 0.7, ease: 'power2.out',
      onComplete: () => { loader.style.display = 'none'; }
    });
  } else {
    loader.style.display = 'none';
  }
}

/* ─── CANVAS ─── */
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width  = Math.round(window.innerWidth  * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  canvas.style.width  = window.innerWidth  + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawFrame(currentFrame);
}

/* Couleur de fond échantillonnée aux 4 coins — évite les bandes visibles */
function sampleBgColor(img) {
  try {
    const oc  = document.createElement('canvas');
    oc.width  = img.naturalWidth;
    oc.height = img.naturalHeight;
    const o = oc.getContext('2d', { willReadFrequently: true });
    o.drawImage(img, 0, 0);
    const W = img.naturalWidth, H = img.naturalHeight;
    const pts = [
      o.getImageData(2, 2, 1, 1).data,
      o.getImageData(W - 3, 2, 1, 1).data,
      o.getImageData(2, H - 3, 1, 1).data,
      o.getImageData(W - 3, H - 3, 1, 1).data,
    ];
    const avg = pts.reduce(
      (a, d) => ({ r: a.r + d[0] / 4, g: a.g + d[1] / 4, b: a.b + d[2] / 4 }),
      { r: 0, g: 0, b: 0 }
    );
    bgColor = `rgb(${Math.round(avg.r)},${Math.round(avg.g)},${Math.round(avg.b)})`;
  } catch (_) {
    bgColor = '#07070A';
  }
}

function drawFrame(index) {
  const img = frames[index];
  if (!img || !img.complete) return;
  const cw = window.innerWidth, ch = window.innerHeight;
  const iw = img.naturalWidth,  ih = img.naturalHeight;
  if (!iw || !ih) return;

  /* cover : jamais de bande noire, le flacon reste centré */
  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale, dh = ih * scale;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
}

/* ─── LENIS ─── */
function initLenis() {
  if (typeof Lenis === 'undefined') return;
  const lenis = new Lenis({
    duration: 1.25,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ─── PLACEMENT DES SECTIONS ─── */
function positionSections() {
  document.querySelectorAll('.scroll-section').forEach(section => {
    const enter = parseFloat(section.dataset.enter);
    const leave = parseFloat(section.dataset.leave);
    section.style.top = ((enter + leave) / 2) + '%';
  });
}

/* ─── OUVERTURE : LE HERO S'EFFACE, LE CANVAS S'OUVRE EN CERCLE ─── */
function initHeroWipe() {
  ScrollTrigger.create({
    trigger: heroEl,
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: self => {
      const p = self.progress;
      heroEl.style.opacity = Math.max(0, 1 - p * 2.4).toString();
      canvasWrap.style.clipPath = `circle(${Math.min(p * 78, 78)}% at 50% 50%)`;
      hud.classList.toggle('visible', p > 0.72);
    },
    onLeave:     () => { canvasWrap.style.clipPath = 'circle(150% at 50% 50%)'; },
    onEnterBack: () => { hud.classList.remove('visible'); }
  });
}

/* ─── SCRUB DES FRAMES ─── */
function initFrameScrub() {
  let pending = false;
  ScrollTrigger.create({
    trigger: scrollCont,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: self => {
      const index = Math.min(
        Math.floor(self.progress * (FRAME_COUNT - 1)),
        FRAME_COUNT - 1
      );
      if (index === currentFrame) return;
      currentFrame = index;
      if (index % 20 === 0 && frames[index]) sampleBgColor(frames[index]);
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => { drawFrame(currentFrame); pending = false; });
      }
    }
  });
}

/* ─── APPARITION DU TEXTE ─── */
function smoothstep(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function initSections() {
  document.querySelectorAll('.scroll-section').forEach(section => {
    const items = section.querySelectorAll(
      '.section-index, .section-eyebrow, .section-heading, .section-body, .cta-button, .contact-meta, .manifesto-line'
    );

    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: self => {
        const p = self.progress;
        /* fondu entrant décalé ligne par ligne, plateau, fondu sortant */
        items.forEach((el, i) => {
          const lag = i * 0.022;
          const o = smoothstep(0.12 + lag, 0.30 + lag, p) * (1 - smoothstep(0.74, 0.93, p));
          el.style.opacity = o.toString();
          el.style.transform = `translateY(${(1 - o) * 22}px)`;
        });
      },
      onEnter: () => {
        hudChapter.textContent = section.dataset.chapter || '';
        hudLabel.textContent   = section.dataset.label   || '';
      },
      onEnterBack: () => {
        hudChapter.textContent = section.dataset.chapter || '';
        hudLabel.textContent   = section.dataset.label   || '';
      }
    });
  });
}

/* ─── VOILE NOIR SUR LE MANIFESTE ─── */
function initDarkOverlay() {
  const manifesto = document.querySelector('.section-manifesto');
  if (!manifesto) return;
  const enter = parseFloat(manifesto.dataset.enter) / 100;
  const leave = parseFloat(manifesto.dataset.leave) / 100;
  const fade  = 0.05;

  ScrollTrigger.create({
    trigger: scrollCont,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: self => {
      const p = self.progress;
      let op = 0;
      if      (p >= enter - fade && p < enter)      op = ((p - (enter - fade)) / fade) * 0.86;
      else if (p >= enter && p < leave)             op = 0.86;
      else if (p >= leave && p < leave + fade)      op = 0.86 * (1 - (p - leave) / fade);
      darkOverlay.style.opacity = op.toString();
    }
  });
}

/* ─── BANDEAU DÉFILANT ─── */
function initMarquee() {
  const txt = marqueeWrap && marqueeWrap.querySelector('.marquee-text');
  if (!txt) return;
  gsap.to(txt, {
    xPercent: -22,
    ease: 'none',
    scrollTrigger: {
      trigger: marqueeWrap,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true
    }
  });
}

/* ─── REPLI STATIQUE : mouvement réduit, ou librairie absente ─── */
function fallbackStatic() {
  canvasWrap.style.clipPath = 'none';
  document.querySelectorAll('.scroll-section').forEach(s => {
    s.style.position = 'relative';
    s.style.top = 'auto';
    s.style.transform = 'none';
    s.style.padding = '18vh clamp(1.5rem, 7vw, 7rem)';
    s.querySelectorAll('.section-index, .section-eyebrow, .section-heading, .section-body, .cta-button, .contact-meta, .manifesto-line')
     .forEach(el => { el.style.opacity = '1'; });
  });
  scrollCont.style.height = 'auto';
}

/* ─── INIT ─── */
function initScroll() {
  /* si GSAP n'a pas pu charger, on sert quand même un site lisible */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    fallbackStatic();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  initLenis();
  positionSections();
  initHeroWipe();
  initFrameScrub();
  initSections();
  initDarkOverlay();
  initMarquee();
  ScrollTrigger.refresh();
}

/* ─── MOUVEMENT RÉDUIT : image fixe, textes visibles ─── */
if (reduced) fallbackStatic();

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();
preloadFrames();
