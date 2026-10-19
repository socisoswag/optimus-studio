"""Bruitages réels prêts à mixer, tirés de la banque (data/bruitages.json, tools/banque_sons.py), pour tools/sound.py
et tools/sound_intro.py.

Chaque fonction rend un son stéréo (l, r) en 48 kHz et, quand il y en a un, l'instant utile en échantillons, à caler sur
l'image : l'attaque d'un impact, le sommet d'un souffle, la fin d'une montée.
    sig, a = R.impact(rng, k)        add(sig, t - a / SR, gain)       l'attaque tombe pile sur t
Les variations (prise tirée au hasard, jamais deux fois la même d'affilée, vitesse de lecture ±6 %) évitent d'entendre
deux fois exactement le même son. Si la banque n'est pas téléchargée, ok() répond False et les scripts gardent leurs
sons de synthèse.
"""
import os
import sys

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
    """Instant du vrai coup : le front le plus raide (montée sur 3 ms) dans les 80 ms qui précèdent la crête.
    Une amorce avant le coup (souffle, petit choc) ne décale donc plus le calage sur l'image."""
    m = np.abs(_st(x)).max(1)
    n = len(m) // 48
    e = 20 * np.log10(m[:n * 48].reshape(n, 48).max(1) + 1e-9)
    P = int(e.argmax())
    e = np.maximum(e, e[P] - 40)  # le silence et le souffle de fond ne comptent pas comme un front
    a = max(3, P - 80)
    if P <= a:
        return P * 48
    rise = e[a:P + 1] - e[a - 3:P - 2]
    return int((a + int(rise.argmax()) - 3) * 48)


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
        L = int(longueur * SR)
        ons = []
        for j in range(10, nb - 2):
            if e[j] > top - 38 and e[j] - e[j - 10:j - 1].min() > seuil and (not ons or j * h - ons[-1] > 0.6 * L):
                ons.append(j * h)
        allj = [j * h for j in range(10, nb - 2) if e[j] > top - 38 and e[j] - e[j - 10:j - 1].min() > seuil]  # toutes les attaques
        for o in ons:
            nxt = [q for q in allj if q > o + 2400]  # coup suivant dans la prise : le morceau s'arrête avant
            Lk = min(L, (nxt[0] - o - 480) if nxt else L)
            if Lk < int(0.08 * SR):
                continue
            a = max(0, o - 144)
            seg = x[a:a + Lk + 144].copy()
            seg[:144] *= np.linspace(0, 1, 144)[:, None]
            k = int(0.3 * len(seg))
            seg[-k:] *= np.linspace(1, 0, k)[:, None] ** 2
            out.append(_crete1(seg))
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
def impact(rng, k=1.0, lourd=True, court=False):
    """Coup de cinéma fait de vraies prises superposées, calées sur la même attaque : un impact grave (corps et traîne),
    un vrai coup d'objet (porte métallique, fer contre bois) pour le claquement dans le médium, qui reste audible sur un
    téléphone, et un gros tom pour l'assise. court=True (coups qui se suivent à moins d'une demi-seconde) : sans
    l'impact grave et sa longue traîne, pour que chaque coup reste net. Rend (l, r), attaque."""
    def couche(role, ampl, gain, hp=None):
        v = _vitesse(rng, ampl)
        x = _st(B.prise(role, rng, vitesse=v))
        s = B.prises(role)[B._derniere[role]]
        # instant du coup relevé à l'oreille dans le catalogue (« coup », en secondes) ; sinon, repéré dans le son
        att = int(s["coup"] * SR / v) if "coup" in s else attaque(x)
        return (passe_haut(x, hp) if hp else x), gain, att

    b = couche("impact_objet", 0.06, 1.0 if court else 0.42 + 0.18 * min(k, 1.5), hp=180)
    if court:
        lay = [b]
        if ok("timbale"):
            lay.append(couche("timbale", 0.03, 0.6))
    else:
        lay = [couche("impact", 0.06, 1.0), b]
        if lourd and ok("timbale"):
            lay.append(couche("timbale", 0.03, 0.38))
    A = max(att for _, _, att in lay)
    if os.environ.get("SONS_TRACE"):
        print(f"impact k={k} court={court} : prises {dict(B._derniere)} coups {[att // 48 for _, _, att in lay]} ms",
              file=sys.stderr)
    n = max(A - att + len(x) for x, _, att in lay)
    out = np.zeros((n, 2))
    for x, g, att in lay:
        o = A - att
        out[o:o + len(x)] += g * x
    if court:  # traîne raccourcie (150 ms) : le coup suivant arrive sur du propre
        tt = np.arange(len(out)) / SR
        out *= np.where(tt < A / SR, 1.0, np.exp(-np.maximum(0, tt - A / SR - 0.03) / 0.15))[:, None]
    out = _crete1(out)
    return (out[:, 0], out[:, 1]), A


def impact_sourd(rng):
    v = _vitesse(rng)
    x = _st(B.prise("impact_sourd", rng, vitesse=v))
    s = B.prises("impact_sourd")[B._derniere["impact_sourd"]]
    return (x[:, 0], x[:, 1]), (int(s["coup"] * SR / v) if "coup" in s else attaque(x))


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


def passage(role, rng, dur, au=0.45):
    """Le moment le plus fort d'une prise (un avion qui passe, une rafale) avec dur secondes autour : le sommet tombe
    à la fraction au de la durée. Fondus de 20 % aux deux bouts. Rend (l, r), sommet."""
    ps = B.prises(role)
    x = B.charge(ps[int(rng.integers(len(ps)))])
    pk, n = sommet(x), int(dur * SR)
    a = int(np.clip(pk - au * n, 0, max(0, len(x) - n)))
    seg = x[a:a + n].copy()
    k = max(1, int(0.2 * len(seg)))
    seg[:k] *= np.linspace(0, 1, k)[:, None]
    seg[-k:] *= np.linspace(1, 0, k)[:, None]
    seg = _crete1(seg)
    return (seg[:, 0], seg[:, 1]), pk - a


def limite(l, r, plafond):
    """Limiteur à anticipation (comme en studio) : le gain baisse 2 ms avant une crête qui dépasserait le plafond et
    remonte en 80 ms. Une pièce calme peut ainsi atteindre son niveau sans qu'un seul coup très sec (marteau, coup de
    feu) n'oblige à baisser tout le reste."""
    from scipy.ndimage import minimum_filter1d
    B_ = 48
    pk = np.maximum(np.abs(l), np.abs(r))
    nb = -(-len(pk) // B_)
    pkb = np.pad(pk, (0, nb * B_ - len(pk))).reshape(nb, B_).max(1)
    need = minimum_filter1d(np.minimum(1.0, plafond / np.maximum(pkb, 1e-12)), 5)
    a = np.exp(-1 / 80)
    g = np.empty(nb)
    cur = 1.0
    for i in range(nb):
        cur = need[i] if need[i] < cur else need[i] - (need[i] - cur) * a
        g[i] = cur
    gs = np.interp(np.arange(len(pk)), np.arange(nb) * B_ + B_ / 2, g)
    return l * gs, r * gs


def prise(role, rng, vitesse=None, **kw):
    x = _st(B.prise(role, rng, vitesse=vitesse or _vitesse(rng), **kw))
    return (x[:, 0], x[:, 1]), attaque(x)
