/* ─── CONFIG ─── */
const FRAME_COUNT  = 121;
const FRAME_SPEED  = 2.0;
const IMAGE_SCALE  = 0.86;
const PRELOAD_FIRST = 10;

/* ─── REDUCED MOTION — bail early, show static poster ─── */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reducedMotion) {
  document.getElementById('loader').style.display = 'none';
  document.querySelectorAll('.scroll-section').forEach(s => {
    const animatable = s.querySelectorAll('.section-label, .section-heading, .section-body, .cta-button, .manifesto-line');
    animatable.forEach(el => { el.style.opacity = '1'; });
  });
}

/* ─── ELEMENTS ─── */
const loader       = document.getElementById('loader');
const loaderBar    = document.getElementById('loader-bar');
const loaderPct    = document.getElementById('loader-percent');
const canvasWrap   = document.getElementById('canvas-wrap');
const canvas       = document.getElementById('canvas');
const ctx          = canvas.getContext('2d');
const darkOverlay  = document.getElementById('dark-overlay');
const heroEl       = document.getElementById('hero');
const scrollCont   = document.getElementById('scroll-container');
const hud          = document.getElementById('hud');
const hudTimecode  = document.getElementById('hud-timecode');
const hudLens      = document.getElementById('hud-lens');
const marqueeWrap  = document.getElementById('marquee-wrap');

/* ─── FRAME STORE ─── */
const frames    = new Array(FRAME_COUNT);
let loadedCount = 0;
let currentFrame = 0;
let bgColor = '#0A0C0D';

function frameUrl(i) {
  return 'frames/frame_' + String(i + 1).padStart(4, '0') + '.webp';
}

function loadFrame(i) {
  return new Promise(resolve => {
    const img = new Image();
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
  /* Phase 1 — first N frames for fast first paint */
  await Promise.all(Array.from({ length: PRELOAD_FIRST }, (_, i) => loadFrame(i)));
  if (frames[0]) {
    sampleBgColor(frames[0]);
    drawFrame(0);
  }

  /* Phase 2 — rest in background */
  await Promise.all(Array.from({ length: FRAME_COUNT - PRELOAD_FIRST }, (_, i) => loadFrame(i + PRELOAD_FIRST)));

  gsap.to(loader, {
    opacity: 0, duration: 0.55,
    onComplete: () => { loader.style.display = 'none'; }
  });
  initScrollAnimations();
}

/* ─── CANVAS ─── */
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(window.innerWidth  * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  canvas.style.width  = window.innerWidth  + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(dpr, dpr);
  drawFrame(currentFrame);
}

function sampleBgColor(img) {
  try {
    const oc = document.createElement('canvas');
    oc.width = img.naturalWidth; oc.height = img.naturalHeight;
    const oc2 = oc.getContext('2d');
    oc2.drawImage(img, 0, 0);
    const W = img.naturalWidth, H = img.naturalHeight;
    const pts = [
      oc2.getImageData(2, 2, 1, 1).data,
      oc2.getImageData(W - 3, 2, 1, 1).data,
      oc2.getImageData(2, H - 3, 1, 1).data,
      oc2.getImageData(W - 3, H - 3, 1, 1).data,
    ];
    const avg = pts.reduce((a, d) => ({ r: a.r + d[0]/4, g: a.g + d[1]/4, b: a.b + d[2]/4 }), { r:0, g:0, b:0 });
    bgColor = `rgb(${Math.round(avg.r)},${Math.round(avg.g)},${Math.round(avg.b)})`;
  } catch(_) { bgColor = '#0A0C0D'; }
}

function drawFrame(index) {
  const img = frames[index];
  if (!img || !img.complete) return;
  const cw = window.innerWidth, ch = window.innerHeight;
  const iw = img.naturalWidth,  ih = img.naturalHeight;
  const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
  const dw = iw * scale, dh = ih * scale;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
}

/* ─── LENIS SMOOTH SCROLL ─── */
function initLenis() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ─── POSITION SECTIONS ─── */
function positionSections() {
  document.querySelectorAll('.scroll-section').forEach(section => {
    const enter = parseFloat(section.dataset.enter);
    const leave  = parseFloat(section.dataset.leave);
    section.style.top = ((enter + leave) / 2) + '%';
  });
}

/* ─── HERO WIPE + FRAME SCRUB ─── */
function initCanvasAndHero() {
  /* Circle-wipe as hero scrolls out */
  ScrollTrigger.create({
    trigger: heroEl,
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: self => {
      const p = self.progress;
      heroEl.style.opacity = Math.max(0, 1 - p * 2.5).toString();
      canvasWrap.style.clipPath = `circle(${p * 75}% at 50% 50%)`;
      if (p > 0.7) hud.classList.add('visible');
      else         hud.classList.remove('visible');
    }
  });

  /* Frame scrub driven by scroll container */
  ScrollTrigger.create({
    trigger: scrollCont,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: self => {
      const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
      const index = Math.min(Math.floor(accelerated * (FRAME_COUNT - 1)), FRAME_COUNT - 1);
      if (index !== currentFrame) {
        currentFrame = index;
        if (index % 20 === 0 && frames[index]) sampleBgColor(frames[index]);
        requestAnimationFrame(() => drawFrame(currentFrame));
      }
    }
  });
}

/* ─── DARK OVERLAY (manifesto beat) ─── */
function initDarkOverlay(enter, leave) {
  const fade = 0.04;
  ScrollTrigger.create({
    trigger: scrollCont,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: self => {
      const p = self.progress;
      let op = 0;
      if (p >= enter - fade && p < enter)        op = (p - (enter - fade)) / fade;
      else if (p >= enter && p < leave)           op = 0.88;
      else if (p >= leave && p < leave + fade)    op = 0.88 * (1 - (p - leave) / fade);
      darkOverlay.style.opacity = op.toString();
    }
  });
}

/* ─── MARQUEE (one, subtle) ─── */
function initMarquee() {
  const txt = marqueeWrap.querySelector('.marquee-text');
  gsap.to(txt, {
    xPercent: -18,
    ease: 'none',
    scrollTrigger: {
      trigger: scrollCont,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    }
  });
  ScrollTrigger.create({
    trigger: scrollCont,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: self => {
      const p = self.progress;
      let op = 0;
      if      (p >= 0.36 && p < 0.43) op = (p - 0.36) / 0.07;
      else if (p >= 0.43 && p < 0.70) op = 1;
      else if (p >= 0.70 && p < 0.76) op = 1 - (p - 0.70) / 0.06;
      marqueeWrap.style.opacity = op.toString();
    }
  });
}

/* ─── SECTION ANIMATIONS ─── */
function setupSectionAnimation(section) {
  const type    = section.dataset.animation;
  const persist = section.dataset.persist === 'true';
  const targets = section.querySelectorAll('.section-label, .section-heading, .section-body, .cta-button, .manifesto-line');

  const tl = gsap.timeline({ paused: true });

  switch (type) {
    case 'slide-left':
      gsap.set(targets, { x: -80, opacity: 0 });
      tl.to(targets, { x: 0, opacity: 1, stagger: 0.13, duration: 0.9, ease: 'power3.out' });
      break;
    case 'slide-right':
      gsap.set(targets, { x: 80, opacity: 0 });
      tl.to(targets, { x: 0, opacity: 1, stagger: 0.13, duration: 0.9, ease: 'power3.out' });
      break;
    case 'fade-up':
      gsap.set(targets, { y: 48, opacity: 0 });
      tl.to(targets, { y: 0, opacity: 1, stagger: 0.12, duration: 0.9, ease: 'power3.out' });
      break;
    case 'rotate-in':
      gsap.set(targets, { y: 36, rotation: 2.5, opacity: 0 });
      tl.to(targets, { y: 0, rotation: 0, opacity: 1, stagger: 0.11, duration: 0.9, ease: 'power3.out' });
      break;
    case 'scale-up':
      gsap.set(targets, { scale: 0.88, opacity: 0 });
      tl.to(targets, { scale: 1, opacity: 1, stagger: 0.12, duration: 1.05, ease: 'power2.out' });
      break;
    case 'clip-reveal':
      gsap.set(targets, { clipPath: 'inset(100% 0 0 0)', opacity: 0 });
      tl.to(targets, { clipPath: 'inset(0% 0 0 0)', opacity: 1, stagger: 0.15, duration: 1.2, ease: 'power4.inOut' });
      break;
    default:
      gsap.set(targets, { opacity: 0 });
      tl.to(targets, { opacity: 1, duration: 0.8 });
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top 78%',
    end:   'bottom 22%',
    onEnter:      () => tl.play(),
    onLeave:      () => { if (!persist) tl.reverse(); },
    onEnterBack:  () => tl.play(),
    onLeaveBack:  () => { if (!persist) tl.reverse(); },
  });
}

/* ─── HUD LENS READOUT — changes per active section ─── */
function initHudLens() {
  const sections = document.querySelectorAll('.scroll-section[data-lens]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const lens = entry.target.dataset.lens;
        if (hudLens && hudLens.textContent !== lens) {
          hudLens.style.opacity = '0';
          setTimeout(() => {
            hudLens.textContent = lens;
            hudLens.style.opacity = '1';
          }, 150);
        }
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => observer.observe(s));
}

/* ─── HUD TIMECODE — real-time ─── */
function startTimecode() {
  const t0 = Date.now();
  function tick() {
    if (!hudTimecode) return;
    const ms = Date.now() - t0;
    const totalF = Math.floor(ms / 1000 * 24);
    const ff = totalF % 24;
    const ss = Math.floor(ms / 1000) % 60;
    const mm = Math.floor(ms / 60000) % 60;
    const hh = Math.floor(ms / 3600000);
    hudTimecode.textContent =
      String(hh).padStart(2,'0') + ':' +
      String(mm).padStart(2,'0') + ':' +
      String(ss).padStart(2,'0') + ':' +
      String(ff).padStart(2,'0');
    requestAnimationFrame(tick);
  }
  tick();
}

/* ─── HERO ENTRANCE ─── */
function animateHeroEntrance() {
  const words = document.querySelectorAll('.hero-heading .word');
  gsap.set(words, { y: 90, opacity: 0 });
  gsap.set('.hero-label', { opacity: 0 });
  gsap.set('.hero-tagline', { y: 20, opacity: 0 });
  gsap.set('.scroll-indicator', { opacity: 0 });

  const tl = gsap.timeline({ delay: 0.25 });
  tl.to('.hero-label', { opacity: 1, duration: 0.5, ease: 'power2.out' })
    .to(words, { y: 0, opacity: 1, stagger: 0.08, duration: 0.9, ease: 'power3.out' }, '-=0.2')
    .to('.hero-tagline', { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, '-=0.3')
    .to('.scroll-indicator', { opacity: 1, duration: 0.6 }, '-=0.2');
}

/* ─── HUD — effacé au-dessus du pied de page ───
   Observé sur le footer lui-même, jamais avec un écouteur scroll. */
function initHudFooter() {
  const footer = document.querySelector('.site-footer');
  if (!footer || !('IntersectionObserver' in window)) return;

  new IntersectionObserver(entries => {
    hud.classList.toggle('over-footer', entries[0].isIntersecting);
  }).observe(footer);
}

/* ─── SCROLL ANIMATIONS — initialised after all frames loaded ─── */
function initScrollAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  positionSections();
  initCanvasAndHero();
  initDarkOverlay(0.61, 0.80);
  initMarquee();
  initHudLens();
  initHudFooter();
  startTimecode();

  document.querySelectorAll('.scroll-section').forEach(setupSectionAnimation);
}

/* ─── MODE DÉGRADÉ ───
   GSAP et Lenis viennent d'un CDN. S'ils manquent, tout le pilotage du
   scroll tombe : le loader reste figé à son pourcentage et le visiteur
   ne voit qu'un écran noir. On bascule alors sur une mise en page
   statique, lisible, sans canvas. */
function degrader() {
  document.documentElement.classList.add('degraded');
  if (loader) loader.style.display = 'none';
}

function librairiesPretes() {
  return typeof gsap !== 'undefined' &&
         typeof ScrollTrigger !== 'undefined' &&
         typeof Lenis !== 'undefined';
}

/* ─── BOOT ─── */
window.addEventListener('DOMContentLoaded', () => {
  if (reducedMotion) return;

  if (!librairiesPretes()) { degrader(); return; }

  gsap.registerPlugin(ScrollTrigger);

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  initLenis();
  animateHeroEntrance();
  preloadFrames();
});
