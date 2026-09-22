/* =========================================================
   Berthier Énergies — moteur de scroll
   121 frames dessinées dans un canvas, pilotées par ScrollTrigger.
   La télémétrie affiche des degrés, des bars et des kilowatts,
   interpolés entre les valeurs déclarées sur chaque section.
   ========================================================= */

(function () {
  'use strict';

  var FRAME_COUNT = 121;
  var PRELOAD     = 12;     // premières frames chargées avant d'afficher
  var SCALE       = 0.88;   // part de la fenêtre occupée par l'image

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var loader   = document.getElementById('loader');
  var bar      = document.getElementById('loader-bar');
  var pct      = document.getElementById('loader-pct');
  var wrap     = document.getElementById('canvas-wrap');
  var canvas   = document.getElementById('canvas');
  var veil     = document.getElementById('veil');
  var hud      = document.getElementById('hud');
  var hudFill  = document.getElementById('hud-fill');
  var hudTemp  = document.getElementById('hud-temp');
  var hudPress = document.getElementById('hud-pressure');
  var hudPower = document.getElementById('hud-power');
  var scroller = document.getElementById('scroll');
  var sections = Array.prototype.slice.call(document.querySelectorAll('.sec'));

  /* Sans animation : on montre tout, on ne charge aucune frame. */
  if (reduced) {
    if (loader) loader.style.display = 'none';
    sections.forEach(function (s) {
      s.querySelectorAll('.sec__no, h2, p, .sec__cta').forEach(function (el) {
        el.style.opacity = '1';
      });
    });
    return;
  }

  /* Filet de sécurité : GSAP et Lenis viennent d'un CDN. S'ils ne
     répondent pas, on n'anime rien mais le site reste lisible — plutôt
     qu'un écran de chargement figé à vie. */
  function degrader() {
    if (loader) loader.style.display = 'none';
    if (wrap) wrap.style.display = 'none';
    if (hud) hud.style.display = 'none';
    scroller.style.height = 'auto';
    scroller.style.padding = '6rem 0';
    sections.forEach(function (s) {
      s.style.position = 'static';
      s.style.transform = 'none';
      s.style.minHeight = '0';
      s.querySelectorAll('.sec__no, h2, p, .sec__cta, .manifesto').forEach(function (el) {
        el.style.opacity = '1';
      });
    });
  }

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    degrader();
    return;
  }

  var ctx = canvas.getContext('2d');
  var frames = new Array(FRAME_COUNT);
  var loaded = 0;
  var current = -1;

  function url(i) {
    return 'frames/frame_' + String(i + 1).padStart(4, '0') + '.webp';
  }

  function loadFrame(i) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        frames[i] = img;
        loaded++;
        var p = Math.round(loaded / FRAME_COUNT * 100);
        bar.style.width = p + '%';
        pct.textContent = p + '%';
        resolve();
      };
      img.onerror = resolve;   // une frame manquante ne bloque pas le site
      img.src = url(i);
    });
  }

  /* ─── Dessin ─── */
  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    draw(current < 0 ? 0 : current, true);
  }

  function draw(i, force) {
    if (i === current && !force) return;
    var img = frames[i];
    if (!img) return;
    current = i;

    var cw = canvas.width, ch = canvas.height;
    ctx.fillStyle = '#0B0A09';
    ctx.fillRect(0, 0, cw, ch);

    var r = Math.min(cw / img.naturalWidth, ch / img.naturalHeight) * SCALE;
    var w = img.naturalWidth * r, h = img.naturalHeight * r;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  /* ─── Télémétrie ─── */
  function lerp(a, b, t) { return a + (b - a) * t; }

  function telemetry(p) {
    hudFill.style.width = (p * 100).toFixed(1) + '%';

    // Valeurs cibles déclarées sur chaque section, interpolées entre elles
    var temp = 18, kw = 0;
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      var a = parseFloat(s.dataset.enter) / 100;
      var b = parseFloat(s.dataset.leave) / 100;
      if (p >= a) {
        var t = Math.min((p - a) / Math.max(b - a, .001), 1);
        var prevT = i === 0 ? 18 : parseFloat(sections[i - 1].dataset.temp);
        var prevK = i === 0 ? 0  : parseFloat(sections[i - 1].dataset.kw);
        temp = lerp(prevT, parseFloat(s.dataset.temp), t);
        kw   = lerp(prevK, parseFloat(s.dataset.kw),   t);
      }
    }

    hudTemp.textContent  = temp.toFixed(1) + ' °C';
    hudPower.textContent = Math.round(kw) + ' kW';
    hudPress.textContent = (1.2 + p * 0.6).toFixed(1) + ' bar';
  }

  /* ─── Animations de scroll ─── */
  function init() {
    gsap.registerPlugin(ScrollTrigger);

    var lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);

    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);

    /* Ouverture du canvas en iris, puis défilement des frames */
    gsap.to(wrap, {
      clipPath: 'circle(75% at 50% 50%)',
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: scroller, start: 'top top', end: '8% top', scrub: 1
      }
    });

    ScrollTrigger.create({
      trigger: scroller,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: function (self) {
        var p = self.progress;
        draw(Math.min(FRAME_COUNT - 1, Math.round(p * (FRAME_COUNT - 1))));
        telemetry(p);
        hud.classList.toggle('on', p > 0.02);
      }
    });

    /* Voile de fin : on rend la main au contenu classique */
    gsap.to(veil, {
      opacity: 0.55, ease: 'none',
      scrollTrigger: { trigger: scroller, start: '86% top', end: 'bottom bottom', scrub: true }
    });

    /* Chaque section entre et sort sur sa propre plage */
    sections.forEach(function (sec) {
      var el = sec.querySelectorAll('.sec__no, h2, p, .sec__cta, .manifesto');
      var anim = sec.dataset.anim;
      var from = { opacity: 0 };
      if (anim === 'rise')  { from.y = 46; }
      if (anim === 'slide') { from.x = sec.classList.contains('sec--right') ? 60 : -60; }
      if (anim === 'zoom')  { from.scale = 0.92; }

      gsap.set(sec, { top: (parseFloat(sec.dataset.enter) + 6) + '%' });
      gsap.set(el, from);

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: scroller,
          start: parseFloat(sec.dataset.enter) + '% top',
          end: parseFloat(sec.dataset.leave) + '% top',
          scrub: 1
        }
      });
      tl.to(el, { opacity: 1, x: 0, y: 0, scale: 1, stagger: .08, ease: 'power2.out', duration: 1 });
      if (sec.dataset.persist !== 'true') {
        tl.to(el, { opacity: 0, duration: .6, ease: 'power1.in' }, '+=1.4');
      }
    });

    ScrollTrigger.refresh();
  }

  /* ─── Chargement ─── */
  (function start() {
    var head = [];
    for (var i = 0; i < PRELOAD; i++) head.push(loadFrame(i));

    Promise.all(head).then(function () {
      if (frames[0]) draw(0, true);

      var rest = [];
      for (var j = PRELOAD; j < FRAME_COUNT; j++) rest.push(loadFrame(j));

      Promise.all(rest).then(function () {
        gsap.to(loader, {
          opacity: 0, duration: .55,
          onComplete: function () { loader.style.display = 'none'; }
        });
        init();
      });
    });
  })();
})();
