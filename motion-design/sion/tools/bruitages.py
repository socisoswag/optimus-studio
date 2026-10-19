"""Bruitages réels prêts à mixer, tirés de la banque (data/bruitages.json, tools/banque_sons.py), pour tools/sound.py
et tools/sound_intro.py.

Chaque fonction rend un son stéréo (l, r) en 48 kHz et, quand il y en a un, l'instant utile en échantillons, à caler sur
l'image : l'attaque d'un impact, le sommet d'un souffle, la fin d'une montée.
    sig, a = R.impact(rng, k)        add(sig, t - a / SR, gain)       l'attaque tombe pile sur t
Les variations (prise tirée au hasard, jamais deux fois la même d'affilée, vitesse de lecture ±6 %) évitent d'entendre
deux fois exactement le même son. Si la banque n'est pas téléchargée, ok() répond False et les scripts gardent leurs
sons de synthèse.
"""
import numpy as np
from scipy.signal import fftconvolve

import banque_sons as B

SR = 48000


def ok(*roles):
    return all(B.dispo(r) for r in roles)


def _filtre(x, gain):
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = gain(f)
    return np.fft.irfft(X * (g[:, None] if X.ndim == 2 else g), len(x), axis=0)


def passe_haut(x, fc, ordre=2):
    return _filtre(x, lambda f: 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** (2 * ordre)))


def passe_bas(x, fc, ordre=2):
    return _filtre(x, lambda f: 1 / np.sqrt(1 + (f / fc) ** (2 * ordre)))


def _st(sig):
    """Stéréo (n, 2) à partir d'un couple (l, r), d'un tableau déjà stéréo ou d'un son mono."""
    if isinstance(sig, tuple):
        return np.stack(sig, 1)
    return sig if sig.ndim == 2 else np.stack([sig, sig], 1)


def _crete1(x):
    return x / (np.abs(x).max() + 1e-9)


def attaque(x):
    """Premier instant où le son atteint 30 % de sa crête (enveloppe à la milliseconde)."""
    m = np.abs(_st(x)).max(1)
    n = len(m) // 48
    e = m[:n * 48].reshape(n, 48).max(1)
    return int(np.argmax(e >= 0.3 * e.max()) * 48)


def sommet(x):
    """Instant le plus fort (énergie sur 50 ms)."""
    m = (_st(x) ** 2).mean(1)
    k = int(0.05 * SR)
    c = np.convolve(m, np.ones(k) / k, "same")
    return int(c.argmax())


def _vitesse(rng, ampl=0.06):
    return 1 + ampl * (2 * rng.random() - 1)


def _panoramique(x, p):
    """x mono, p : position de -1 (gauche) à 1 (droite), fixe ou par échantillon (loi à puissance constante)."""
    a = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return x * np.cos(a), x * np.sin(a)


# ------------------------------------------------------------------ vraie réverbération (réponse impulsionnelle enregistrée)
_irs = {}


def _ir(role):
    if role not in _irs:
        x = B.charge(B.prises(role)[0]).copy()
        a = attaque(x)
        x = x[max(0, a - 48):]
        fin = int(0.08 * SR)
        x[-fin:] *= np.linspace(1, 0, fin)[:, None]
        x /= np.sqrt((x ** 2).sum(0).mean())
        _irs[role] = x
    return _irs[role]


def reverb(sig, role="ir_grand", wet=0.3, dry=1.0, couleur=None):
    """Place un son dans un vrai lieu (église, salle de concert). couleur : coupe-haut de la traîne (lointain)."""
    x = _st(sig)
    h = _ir(role)
    if couleur:
        h = passe_bas(h, couleur)
    out = np.zeros((len(x) + len(h) - 1, 2))
    for c in range(2):
        out[:, c] = fftconvolve(x[:, c], h[:, c]) * wet
    out[:len(x)] += x * dry
    return out[:, 0], out[:, 1]


# ------------------------------------------------------------------ fonds
def fond(role, dur, rng, rms_db=-20.0):
    return B.fond(role, int(round(dur * SR)), rng, rms_db)


def moins_aigu(sig, db=-5.0, fc=3500.0):
    """Atténue doucement les aigus d'un fond (au-dessus de fc, jusqu'à db) : un fond sous une voix off ne doit pas
    briller plus qu'elle (feuillages, grillons, souffle de projecteur)."""
    g = 10 ** (db / 20)
    gain = lambda f: g + (1 - g) / np.sqrt(1 + (f / fc) ** 2)
    return tuple(_filtre(c, gain) for c in sig)


def adoucit(sig, k=4.0):
    """Arrondit les crêtes d'un fond au-delà de k fois son niveau moyen (braises qui éclatent, chocs sur le micro) :
    sans ça, un fond calme remonté au mixage enverrait ses éclats dans le limiteur, en clics."""
    out = []
    for c in sig:
        lim = k * np.sqrt((c ** 2).mean() + 1e-20)
        out.append(lim * np.tanh(c / lim))
    return tuple(out)


# ------------------------------------------------------------------ coups découpés dans les prises
_coups = {}


def coups(role, longueur=0.15, seuil=12.0):
    """Coups isolés découpés dans les prises d'un rôle (frappes de machine à écrire, tic de réveil, battements de cœur,
    coups de marteau, explosions lointaines) : chaque attaque nette devient un son court, crête à 0 dBFS."""
    key = (role, longueur, seuil)
    if key in _coups:
        return _coups[key]
    out = []
    for s in B.prises(role):
        x = B.charge(s)
        m = (x ** 2).mean(1)
        h = 240  # 5 ms
        nb = len(m) // h
        e = 10 * np.log10(m[:nb * h].reshape(nb, h).mean(1) + 1e-12)
        top = e.max()
        last = -10 ** 9
        L = int(longueur * SR)
        for j in range(10, nb - 2):
            if e[j] > top - 38 and e[j] - e[j - 10:j - 1].min() > seuil and j * h - last > 0.6 * L:
                a = max(0, j * h - 144)
                seg = x[a:a + L + 144].copy()
                if len(seg) < L // 2:
                    continue
                seg[:144] *= np.linspace(0, 1, 144)[:, None]
                k = int(0.3 * len(seg))
                seg[-k:] *= np.linspace(1, 0, k)[:, None] ** 2
                out.append(_crete1(seg))
                last = j * h
    _coups[key] = out
    return out


_dernier = {}


def coup(role, rng, longueur=0.15, seuil=12.0, vitesse=None):
    cs = coups(role, longueur, seuil)
    k = int(rng.integers(len(cs)))
    if len(cs) > 1 and _dernier.get(role) == k:
        k = (k + 1) % len(cs)
    _dernier[role] = k
    x = cs[k]
    v = vitesse or _vitesse(rng, 0.04)
    if abs(v - 1) > 1e-3:
        src = np.arange(0, len(x) - 1, v)
        x = np.stack([np.interp(src, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
    return x[:, 0].copy(), x[:, 1].copy()


# ------------------------------------------------------------------ impacts, souffles, montées
def impact(rng, k=1.0, lourd=True):
    """Coup de cinéma fait de vraies prises superposées, calées sur la même attaque : un impact grave (corps et traîne),
    un vrai coup d'objet (porte métallique, fer contre bois) pour le claquement dans le médium, qui reste audible sur un
    téléphone, et une timbale pour l'assise. Rend (l, r), attaque."""
    a = _st(B.prise("impact", rng, vitesse=_vitesse(rng)))
    b = passe_haut(_st(B.prise("impact_objet", rng, vitesse=_vitesse(rng))), 180)
    lay = [(a, 1.0), (b, 0.42 + 0.18 * min(k, 1.5))]
    if lourd and ok("timbale"):
        lay.append((_st(B.prise("timbale", rng, vitesse=_vitesse(rng, 0.03))), 0.38))
    A = max(attaque(x) for x, _ in lay)
    n = max(A - attaque(x) + len(x) for x, _ in lay)
    out = np.zeros((n, 2))
    for x, g in lay:
        o = A - attaque(x)
        out[o:o + len(x)] += g * x
    out = _crete1(out)
    return (out[:, 0], out[:, 1]), A


def impact_sourd(rng):
    x = _st(B.prise("impact_sourd", rng, vitesse=_vitesse(rng)))
    return (x[:, 0], x[:, 1]), attaque(x)


def souffle(rng, dur=None, gros=False, sens=1.0):
    """Vrai souffle (bâton fendant l'air, passage d'air) amené à la durée voulue (lecture ralentie ou accélérée,
    ±35 % au plus), qui traverse l'image de gauche à droite (sens=1) ou l'inverse. Rend (l, r), sommet."""
    ps = B.prises("souffle")
    longs = [i for i, s in enumerate(ps) if s.get("duree", 0) >= 1.2]
    pool = longs if (gros or (dur and dur > 1.0)) and longs else list(range(len(ps)))
    idx = pool[int(rng.integers(len(pool)))]
    v = 1.0
    if dur:
        v = float(np.clip(ps[idx].get("duree", dur) / dur, 0.65, 1.35))
    x = _st(B.prise("souffle", rng, vitesse=v * _vitesse(rng, 0.03), idx=idx))
    m = x.mean(1)
    p = np.linspace(-0.8, 0.8, len(m)) * sens
    l, r = _panoramique(m, p)
    l, r = 0.6 * l + 0.4 * x[:, 0], 0.6 * r + 0.4 * x[:, 1]  # garde un peu de l'espace de la prise
    if gros and ok("grondement"):
        g = _st(fond("grondement", len(m) / SR, rng, -16))
        w = np.sin(np.pi * np.linspace(0, 1, len(m))) ** 2
        l, r = l + 0.5 * g[:, 0] * w, r + 0.5 * g[:, 1] * w
    o = _crete1(np.stack([l, r], 1))
    return (o[:, 0], o[:, 1]), sommet(o)


def montee(rng, dur):
    """Vraie montée (cymbale frottée en crescendo, cymbale jouée à l'envers) qui culmine exactement à la fin :
    la placer avec add(sig, t_impact - len/SR). Rend (l, r)."""
    x = _st(B.prise("montee", rng))
    s = sommet(x)
    x = x[:s + int(0.02 * SR)]
    want = int(dur * SR)
    if len(x) < want:  # trop courte : un peu plus lente, sans dépasser -30 %
        v = max(len(x) / want, 0.7)
        src = np.arange(0, len(x) - 1, v)
        x = np.stack([np.interp(src, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
    x = x[-want:].copy()
    k = int(0.3 * len(x))
    x[:k] *= np.linspace(0, 1, k)[:, None] ** 2
    x[-48:] *= np.linspace(1, 0, 48)[:, None]
    x = _crete1(x)
    return x[:, 0], x[:, 1]


def prise(role, rng, vitesse=None, **kw):
    x = _st(B.prise(role, rng, vitesse=vitesse or _vitesse(rng), **kw))
    return (x[:, 0], x[:, 1]), attaque(x)
