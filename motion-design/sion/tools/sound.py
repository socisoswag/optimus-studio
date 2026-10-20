"""Bande-son du motion design, synthétisée et calée sur l'image.

    node tools/cues.mjs > cues.json
    python3 tools/sound.py cues.json output/bande-son.wav

Bruitages seuls par défaut (les pièces sont intégrées au montage, sous la musique
du film) : vent et crépitements de feu, tic-tac discret, souffles pendant les vols
de caméra, impacts sur chaque titre, artillerie lointaine synchronisée sur les
éclairs, rumeur des flux, silence puis battement de cœur en 1995.
MUSIC=1 ajoute le lit musical (drone grave et accords lents).
Bruitages réels (prises de terrain CC0 de la banque, tools/bruitages.py, ici BR) dès que la banque est téléchargée
(python3 tools/banque_sons.py prendre) ; sinon, ou avec SYNTH=1, les anciens sons de synthèse.
"""
import json
import os
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bruitages as BR  # noqa: E402
import pistes as PI  # noqa: E402

SR = 48000
REEL = os.environ.get("SYNTH", "0") != "1"


def reel(*roles):
    return REEL and BR.ok(*roles)


cues = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
TOTAL = cues["total"]
N = int((TOTAL + 0.5) * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(1948)
L = np.zeros(N)
R = np.zeros(N)
PST = PI.Pistes(N)  # une piste par famille de sons, pour le montage son (Premiere, AAF)


# ------------------------------------------------------------------ outils
def spec(x, gain):
    """Filtrage à phase nulle dans le domaine fréquentiel. gain(f) -> 0..1"""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * gain(f), len(x))


def lp(x, fc, order=2):
    return spec(x, lambda f: 1 / np.sqrt(1 + (f / fc) ** (2 * order)))


def hp(x, fc, order=2):
    return spec(x, lambda f: 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** (2 * order)))


def bp(x, f1, f2, order=2):
    return hp(lp(x, f2, order), f1, order)


def conv(x, h):
    n = len(x) + len(h) - 1
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(h, nfft), nfft)[:n]


def noise(n):
    return rng.standard_normal(n)


def env_exp(n, tau, attack=0.003):
    tt = np.arange(n) / SR
    a = np.clip(tt / attack, 0, 1)
    return a * np.exp(-tt / tau)


def pan_gains(p):
    a = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


def add(sig, start, gain=1.0, pan=0.0):
    """Ajoute un signal mono (pan fixe ou tableau) ou stéréo (tuple) au mix."""
    i0 = int(round(start * SR))
    if isinstance(sig, tuple):
        l, r = sig
    else:
        gl, gr = pan_gains(pan)
        l, r = sig * gl, sig * gr
    if i0 < 0:
        l, r = l[-i0:], r[-i0:]
        i0 = 0
    n = min(len(l), N - i0)
    if n <= 0:
        return
    L[i0:i0 + n] += gain * l[:n]
    R[i0:i0 + n] += gain * r[:n]
    PST.ajoute(i0, gain * l[:n], gain * r[:n])


# réverbération : réponse impulsionnelle synthétique, décorrélée gauche/droite
def make_ir(dur, tau, fc):
    n = int(dur * SR)
    e = np.exp(-np.arange(n) / SR / tau)
    e[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    irl = lp(noise(n), fc) * e
    irr = lp(noise(n), fc) * e
    s = np.sqrt(np.sum(irl ** 2))
    return irl / s, irr / s


IR_HALL = make_ir(3.2, 0.75, 5000)
IR_FAR = make_ir(4.0, 1.1, 1800)


def verb(x, ir, wet=0.35, dry=1.0):
    l = conv(x, ir[0]) * wet
    r = conv(x, ir[1]) * wet
    l[: len(x)] += x * dry
    r[: len(x)] += x * dry
    return l, r


# ------------------------------------------------------------------ enveloppe générale
SND = cues.get("sound") or {}
EV = cues.get("event")
silences = cues.get("silences") or []
master = np.ones(N)
master *= np.clip(t / float(SND.get("fadeIn", 2.2)), 0, 1) ** 1.5
fade0 = TOTAL - 1.6
master *= np.clip((TOTAL - 0.02 - t) / (TOTAL - 0.02 - fade0), 0, 1)  # silence sur la dernière image : pas de clic à la coupe

# atténuation du « lit » sonore : coupure avant chaque silence, puis retour
bed = np.ones(N)
for si in silences:
    s0, s1 = si["t0"], si["t1"]
    cut = 1 - np.clip((t - (s0 - 0.12)) / 0.12, 0, 1)
    if EV and abs(EV["t"] - s1) < 1e-3:
        rise = np.clip((t - s1) / (EV["end"] + 1.5 - s1), 0, 1)
        back = 0.25 + 0.75 * rise ** 1.6
    else:
        back = 0.4 + 0.6 * np.clip((t - s1) / 1.0, 0, 1) ** 1.2
    bed *= np.where(t < s1, cut, back)


def in_silence(x, before=0.1, after=0.2):
    if any(si["t0"] - before < x < si["t1"] + after for si in silences):
        return True
    return bool(EV) and EV["t"] <= x < EV["end"] + after


# respiration sous les impacts (effet de compression)
duck = np.ones(N)
for im in cues["impacts"]:
    d = t - im["t"]
    m = d >= 0
    duck[m] *= 1 - 0.45 * min(1, im["k"]) * np.exp(-d[m] / 0.35)

# ------------------------------------------------------------------ drone et accords
drone = (0.42 * np.sin(2 * np.pi * 36.71 * t + 0.4 * np.sin(2 * np.pi * 0.05 * t))
         + 0.22 * np.sin(2 * np.pi * 55.0 * t + 0.3 * np.sin(2 * np.pi * 0.031 * t))
         + 0.10 * np.sin(2 * np.pi * 73.42 * t))
drone *= 0.8 + 0.2 * np.sin(2 * np.pi * 0.07 * t)

CHORDS = {
    "Dm": [73.42, 110.0, 146.83, 174.61],
    "Bb": [58.27, 87.31, 116.54, 146.83],
    "Gm": [49.0, 73.42, 98.0, 116.54],
    "A": [55.0, 82.41, 110.0, 138.59],
    "Dm9": [73.42, 110.0, 164.81, 174.61],
}
# progression calée sur les grandes périodes du récit (fournie par la timeline)
prog = [tuple(c) for c in (SND.get("chords") or [[0.0, "Dm"]])]
pad = np.zeros(N)
for k, (t0, name) in enumerate(prog):
    t1 = prog[k + 1][0] if k + 1 < len(prog) else TOTAL + 0.5
    w = np.clip((t - t0 + 1.5) / 1.5, 0, 1) * np.clip((t1 + 1.5 - t) / 1.5, 0, 1)
    sl = w > 0
    tt = t[sl]
    acc = np.zeros(sl.sum())
    for f in CHORDS[name]:
        for det in (-0.0024, 0.0, 0.0027):
            ph = rng.random()
            acc += 2 * ((f * (1 + det) * tt + ph) % 1.0) - 1
    pad[sl] += acc * w[sl] / 12
pad = lp(pad, 520, 2) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.09 * t + 1.0))

# vent / grondement + crépitements de feu
brown = np.cumsum(noise(N))
brown = hp(brown - brown.mean(), 18)
brown /= np.abs(brown).max()
wind = lp(brown, 220) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.043 * t + 2))
wind /= np.abs(wind).max()
crack = np.zeros(N)
n_cr = int(TOTAL * 26)
pos = rng.integers(0, N - 2000, n_cr)
amp = rng.random(n_cr) ** 3
for p, a in zip(pos, amp):
    ln = int(SR * (0.002 + 0.006 * rng.random()))
    crack[p:p + ln] += a * noise(ln) * np.exp(-np.arange(ln) / (ln / 4))
crack = bp(crack, 900, 5200)
crack /= np.abs(crack).max() + 1e-9

# musique (drone + accords) seulement sur demande : par défaut, bruitages seuls
MUSIC = os.environ.get("MUSIC", "0") == "1"
# bedFrom : le vent et le feu n'arrivent qu'à partir de cet instant (ex. une salle de l'ONU avant la guerre)
bed_in = np.clip((t - float(SND.get("bedFrom", 0.0))) / 2.0, 0, 1) ** 1.5 if SND.get("bedFrom") else 1.0
if reel("vent_doux", "feu"):
    # vrai vent léger (sans le souffle sur le micro) et vraies braises au loin, crêtes arrondies
    vl_, vr_ = BR.fond("vent_doux", N / SR, rng, -25)
    vl_, vr_ = BR.passe_haut(vl_, 90, 3), BR.passe_haut(vr_, 90, 3)
    # les rafales de la prise passent en souffle blanc : aigus adoucis, le fond ne brille jamais plus que la voix
    vl_, vr_ = BR.moins_aigu((vl_, vr_), -7.0, 3000.0)
    fl_, fr_ = BR.adoucit(BR.fond("feu", N / SR, rng, -30), 3.5)
    fl_, fr_ = BR.passe_bas(fl_, 6000), BR.passe_bas(fr_, 6000)
    env_ = bed * bed_in * duck
    mus_ = (0.55 * drone + 0.30 * pad) * MUSIC
    add(((vl_ + mus_) * env_, (vr_ + mus_) * env_), 0, 0.62)
    add((fl_ * bed * bed_in, fr_ * bed * bed_in), 0, 0.5)
else:
    bedmix = ((0.55 * drone + 0.30 * pad) * MUSIC + 0.42 * wind * bed_in) * bed * duck
    add(bedmix, 0, 0.62, 0.0)
    crl = crack * bed * bed_in * 0.09
    add((crl, np.roll(crl, int(0.021 * SR))), 0, 1.0)

PST("bruitages")
# ------------------------------------------------------------------ tic-tac (le temps qui passe)
tick_start, tick_end = SND.get("ticks") or (0.0, -1.0)
tk = 0
tt = tick_start
if tick_end > tick_start and reel("tic"):  # vrai réveil mécanique, coupé avec le reste pendant les silences
    i0_ = int(tick_start * SR)
    n_ = int((tick_end - tick_start) * SR)
    tl_, tr_ = BR.fond("tic", n_ / SR, rng, -30)
    e_ = bed[i0_:i0_ + n_][:len(tl_)]
    k_ = min(len(e_) // 2, int(0.3 * SR))
    e_ = e_ * np.concatenate((np.linspace(0, 1, k_), np.ones(len(e_) - 2 * k_), np.linspace(1, 0, k_)))
    add((tl_[:len(e_)] * e_, tr_[:len(e_)] * e_), tick_start, 1.0)
    tt = tick_end
while tt < tick_end:
    if not in_silence(tt):
        n = int(0.03 * SR)
        hi = tk % 2 == 0
        s = bp(noise(n), 2400 if hi else 1300, 6500 if hi else 3200) * env_exp(n, 0.0035 if hi else 0.006, 0.0005)
        add(s, tt, 0.10 if hi else 0.07, -0.25 if hi else 0.25)
    tt += 0.5
    tk += 1

# ------------------------------------------------------------------ souffles des vols de caméra
def whoosh(dur, big=False):
    n = int((dur + 0.5) * SR)
    x = noise(n)
    hop, win = 256, 1024
    w = np.hanning(win)
    out = np.zeros(n + win)
    freqs = np.fft.rfftfreq(win, 1 / SR)
    lf = np.log(np.maximum(freqs, 20))
    for i in range(0, n - win, hop):
        p = np.clip((i / SR) / dur, 0, 1)
        e = np.sin(np.pi * p) ** 1.5
        fc = (180 if big else 260) * (1 + (11 if big else 14) * e)
        bw = 0.9 + 0.4 * e
        mask = np.exp(-0.5 * ((lf - np.log(fc)) / bw) ** 2)
        seg = np.fft.irfft(np.fft.rfft(x[i:i + win] * w) * mask, win)
        out[i:i + win] += seg * e
    out = out[:n]
    tail = np.clip((n / SR - np.arange(n) / SR) / 0.25, 0, 1)
    return out * tail / (np.abs(out).max() + 1e-9)


PST("souffles")
for fl in cues["flights"]:
    if fl["dur"] <= 0:
        continue
    if reel("souffle"):  # vrai souffle, le plus fort au milieu du mouvement de caméra
        s_, pk_ = BR.souffle(rng, fl["dur"] + 0.5, gros=fl["big"], sens=fl["dir"])
        add(s_, fl["t0"] + fl["dur"] / 2 - pk_ / SR, 0.5 if fl["big"] else 0.36)
        continue
    s = whoosh(fl["dur"], fl["big"])
    n = len(s)
    p = np.clip(np.arange(n) / SR / fl["dur"], 0, 1)
    pan = fl["dir"] * (-0.85 + 1.7 * p)
    gl, gr = pan_gains(pan)
    sub = lp(noise(n), 90) * np.sin(np.pi * p) ** 2
    sub /= np.abs(sub).max() + 1e-9
    g = 0.5 if fl["big"] else 0.36
    add((s * gl + 0.5 * sub, s * gr + 0.5 * sub), fl["t0"], g)

PST("bruitages")
# ------------------------------------------------------------------ flux humains : rumeur de foule, pas, poussière
for fl in cues.get("flows", []):
    dur = fl["dur"]
    n = int((dur + 1.0) * SR)
    tt = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(tt / (dur + 1.0), 0, 1)) ** 1.6
    if reel("pas"):  # vraie foule qui marche sur le gravier, au loin, dans le sens du flux
        pl_, pr_ = BR.fond("pas", n / SR, rng, -20)
        gl_, gr_ = pan_gains(np.clip((fl["to"][0] - fl["from"][0]) / 12.0, -0.7, 0.7))
        add(BR.reverb((pl_ * env * gl_ * 1.4, pr_ * env * gr_ * 1.4), "ir_grand", wet=0.3, couleur=4000), fl["t0"], 0.4)
        continue
    body = bp(noise(n), 140, 700)
    body /= np.abs(body).max() + 1e-9
    body *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.7 * tt + 1.3)
    steps = np.zeros(n)
    for p in rng.integers(0, n - 4000, int(dur * 70)):
        ln = int(SR * (0.01 + 0.02 * rng.random()))
        steps[p:p + ln] += (0.3 + rng.random()) * noise(ln) * np.exp(-np.arange(ln) / (ln / 5))
    steps = bp(steps, 300, 2600)
    steps /= np.abs(steps).max() + 1e-9
    x = (0.8 * body + 0.35 * steps) * env
    pan = np.clip((fl["to"][0] - fl["from"][0]) / 12.0, -0.7, 0.7)
    l, r = verb(x, IR_FAR, wet=0.5)
    gl, gr = pan_gains(pan)
    add((l * gl, r * gr), fl["t0"], 0.16)

PST("guerre")
# ------------------------------------------------------------------ guerre : avions (passage), chars (grondement, chenilles)
for j in cues.get("jets", []):
    dur = min(j["dur"], 6.0) + 1.0
    if reel("avion"):  # vrai passage d'avion de chasse, au sommet à 45 % de la durée
        (al_, ar_), pk_ = BR.passage("avion", rng, dur)
        if j.get("pan", 1) < 0:
            al_, ar_ = ar_, al_
        add(BR.reverb((al_, ar_), "ir_grand", wet=0.2, couleur=3000), j["t0"] + 0.45 * dur - pk_ / SR,
            0.3 * min(1.6, 0.8 + 0.2 * j.get("n", 1)))
        continue
    n = int(dur * SR)
    tt = np.arange(n) / SR
    p = np.clip(tt / dur, 0, 1)
    env = np.exp(-((p - 0.45) / 0.22) ** 2)  # passage : monte, culmine, s'éloigne
    roar = lp(noise(n), 900) * 0.8 + bp(noise(n), 1500, 5000) * env * 0.5
    roar *= env
    roar /= np.abs(roar).max() + 1e-9
    pan = np.clip(j.get("pan", 1) * (-0.8 + 1.6 * p), -0.9, 0.9)
    gl, gr = pan_gains(pan)
    l, r = verb(roar, IR_FAR, wet=0.35, dry=0.0)
    l[:n] += roar * gl
    r[:n] += roar * gr
    add((l, r), j["t0"], 0.22 * min(1.6, 0.8 + 0.2 * j.get("n", 1)))
for rb in cues.get("rumbles", []):
    dur = rb["dur"] + 0.8
    n = int(dur * SR)
    tt = np.arange(n) / SR
    env = np.clip(tt / 0.6, 0, 1) * np.clip((dur - tt) / 0.8, 0, 1)
    if reel("char"):  # vrai char : moteur et chenilles
        cl_, cr_ = BR.fond("char", n / SR, rng, -18)
        add((cl_ * env, cr_ * env), rb["t0"], 0.3 * min(1.5, 0.7 + 0.15 * rb.get("n", 1)))
        continue
    eng = lp(noise(n), 120) * (0.8 + 0.2 * np.sin(2 * np.pi * 23 * tt))
    eng /= np.abs(eng).max() + 1e-9
    clank = np.zeros(n)
    step = int(SR / 7.5)
    for i0 in range(0, n - 800, step):
        clank[i0:i0 + 600] += noise(600) * np.exp(-np.arange(600) / 90)
    clank = bp(clank, 600, 3000)
    clank /= np.abs(clank).max() + 1e-9
    x = (0.9 * eng + 0.18 * clank) * env
    add(x, rb["t0"], 0.12 * min(1.5, 0.7 + 0.15 * rb.get("n", 1)), 0.0)

# ------------------------------------------------------------------ impacts
# creux avant chaque gros coup (comme au mixage cinéma) : tout ce qui joue déjà baisse sur les 120 ms qui précèdent,
# puis revient en 300 ms ; le coup, ajouté ensuite, tombe sur du silence relatif et claque
if REEL:
    _hits = sorted(u["t"] for u in cues["impacts"] if u["kind"] in ("hit", "title", "boom") and u["k"] >= 0.5)
    _dip = np.ones(N)
    for u in cues["impacts"]:
        if u["kind"] not in ("hit", "title", "boom") or u["k"] < 0.5:
            continue
        if any(0 < u["t"] - v < 0.6 for v in _hits):  # coup en rafale : seul le premier a son creux
            continue
        d_ = 1 - 0.6 * min(1.0, u["k"])
        i0_, i1_, i2_ = (max(0, min(N, int(x * SR))) for x in (u["t"] - 0.12, u["t"], u["t"] + 0.3))
        _dip[i0_:i1_] = np.minimum(_dip[i0_:i1_], np.linspace(1, d_, i1_ - i0_))
        _dip[i1_:i2_] = np.minimum(_dip[i1_:i2_], np.linspace(d_, 1, i2_ - i1_))
    L *= _dip
    R *= _dip
    PST.multiplie(_dip)


def hit(k=1.0, metal=True):
    n = int(2.2 * SR)
    tt = np.arange(n) / SR
    f = 30 + 44 * np.exp(-tt / 0.09)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.55, 0.002)
    thud = lp(noise(n), 150) * env_exp(n, 0.11, 0.001)
    thud /= np.abs(thud).max()
    crk = hp(noise(n), 2200) * env_exp(n, 0.018, 0.0005)
    crk /= np.abs(crk).max()
    x = 1.0 * sub + 0.8 * thud + 0.22 * crk
    if metal:
        for fr, a, tau in ((182, 0.10, 1.4), (271.5, 0.07, 1.1), (409, 0.05, 0.8), (611, 0.03, 0.6)):
            x += a * np.sin(2 * np.pi * fr * tt) * env_exp(n, tau, 0.004)
    return x * k


def riser(dur=0.9):
    n = int(dur * SR)
    x = lp(noise(n), 3500) * np.exp(-np.arange(n) / SR / (dur / 4))
    x = x[::-1]
    return x / (np.abs(x).max() + 1e-9)


def click():
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    x = bp(noise(n), 1500, 6500) * env_exp(n, 0.004, 0.0003)
    x = x / (np.abs(x).max() + 1e-9) + 0.5 * np.sin(2 * np.pi * 1180 * tt) * env_exp(n, 0.02, 0.001)
    return x


for im in cues["impacts"]:
    k = im["k"]
    kind = im["kind"]
    PST("bruitages" if kind == "tick" else "guerre" if kind in ("boom", "crumble") else "impacts")
    if kind == "event":
        continue
    if reel("impact", "impact_objet", "montee", "tic", "explosion", "ecroulement"):
        t_ = im["t"]
        HITS = [u["t"] for u in cues["impacts"] if u["kind"] not in ("tick", "event")]
        if kind == "tick":  # vrai tic de réveil
            add(BR.reverb(BR.coup("tic", rng, 0.08), "ir_salle", wet=0.2), t_ - 0.003, 0.14)
        elif kind == "boom":  # vraie explosion au loin
            s_ = BR.coup("explosion", rng, 3.0, 10)
            add(BR.reverb(s_, "ir_grand", wet=0.45, couleur=3500), t_ - 0.003, 0.42 * min(k, 1.2))
        elif kind == "crumble":
            s_, a_ = BR.prise("ecroulement", rng)
            add(BR.reverb(s_, "ir_grand", wet=0.4, couleur=5000), t_ - a_ / SR, 0.3 * k)
        elif kind == "soft":
            (sl_, sr_), a_ = BR.impact(rng, 0.6 * k, lourd=False)
            add(BR.reverb((BR.passe_bas(sl_, 2500), BR.passe_bas(sr_, 2500)), "ir_grand", wet=0.5), t_ - a_ / SR, 0.35 * k / 0.45)
        elif kind == "title":
            PST("souffles")
            m_ = BR.montee(rng, 1.44)
            add(BR.reverb(m_, "ir_grand", wet=0.4, couleur=9000), t_ - 0.06 - len(m_[0]) / SR, 0.12)
            PST("impacts")
            s_, a_ = BR.impact(rng, 1.3)
            add(BR.reverb(s_, "ir_grand", wet=0.6), t_ - a_ / SR, 0.5)
        else:  # coup sur un titre, une date, un chiffre : montée courte puis impact en couches réelles
            serre = any(0 < abs(u - t_) < 0.6 for u in HITS)  # coups en rafale : courts et nets, sans montée
            if not serre:  # montée discrète qui s'arrête 80 ms avant : l'attaque du coup reste nette
                PST("souffles")
                m_ = BR.montee(rng, 0.72)
                add(BR.reverb(m_, "ir_grand", wet=0.3, couleur=9000), t_ - 0.08 - len(m_[0]) / SR, 0.06 * k)
            PST("impacts")
            s_, a_ = BR.impact(rng, k, court=serre)
            add(BR.reverb(s_, "ir_salle", wet=0.2 if serre else 0.32), t_ - a_ / SR, 0.55 * min(k, 1.2))
        continue
    if kind == "tick":
        l, r = verb(click(), IR_HALL, wet=0.25)
        add((l, r), im["t"], 0.16)
        continue
    if kind == "boom":
        # explosion au sol : coup sourd sans résonance métallique, débris
        x = hit(1.0, metal=False)
        deb = bp(noise(int(1.2 * SR)), 1200, 6000) * env_exp(int(1.2 * SR), 0.25, 0.002)
        x[: len(deb)] += 0.25 * deb / (np.abs(deb).max() + 1e-9)
        l, r = verb(x, IR_FAR, wet=0.55)
        add((l, r), im["t"], 0.42 * min(k, 1.2))
        continue
    if kind == "crumble":
        # maison qui s'effondre : craquement, chute sourde, gravats qui roulent
        n = int(1.6 * SR)
        x = 0.7 * lp(hit(1.0, metal=False), 500)[:n]
        grains = (rng.random(n) < 0.006) * rng.standard_normal(n)
        rub = bp(grains + 0.15 * noise(n), 350, 4200) * env_exp(n, 0.45, 0.02)
        x += 0.5 * rub / (np.abs(rub).max() + 1e-9)
        crk = hp(noise(n), 1800) * env_exp(n, 0.03, 0.001)
        x += 0.18 * crk / (np.abs(crk).max() + 1e-9)
        l, r = verb(x, IR_FAR, wet=0.45)
        add((l, r), im["t"], 0.3 * k)
        continue
    if kind == "soft":
        l, r = verb(lp(hit(1.0, metal=False), 900), IR_FAR, wet=0.5)
        add((l, r), im["t"], 0.35 * k / 0.45)
        continue
    if kind == "title":
        l, r = verb(hit(1.0), IR_FAR, wet=0.62)
        add((l, r), im["t"], 0.5)
        rs = riser(1.5)
        add(rs, im["t"] - 0.6 - len(rs) / SR, 0.05)
        continue
    l, r = verb(hit(1.0), IR_HALL, wet=0.32)
    add((l, r), im["t"], 0.55 * min(k, 1.2))
    rs = riser(0.8)
    add(rs, im["t"] - len(rs) / SR, 0.06 * k)

PST("guerre")
# ------------------------------------------------------------------ artillerie lointaine (son en retard sur l'éclair)
for f in cues["flashes"]:
    if reel("explosion"):  # vraies détonations lointaines, une différente à chaque éclair
        t0 = f["t"] + 0.16 + 0.35 * (1 - f["size"])
        if in_silence(t0, before=0.2, after=0.5):
            continue
        bl_, br_ = BR.coup("explosion", rng, 2.5, 10)
        gl, gr = pan_gains((f["x"] - 0.5) * 1.4)
        add(BR.reverb((bl_ * gl * 1.4, br_ * gr * 1.4), "ir_grand", wet=0.5, couleur=3000), t0 - 0.003, 0.22 * f["power"])
        continue
    n = int(1.6 * SR)
    b = lp(noise(n), 110) * env_exp(n, 0.45, 0.012)
    b /= np.abs(b).max() + 1e-9
    b += 0.6 * np.sin(2 * np.pi * 38 * np.arange(n) / SR) * env_exp(n, 0.5, 0.01)
    l, r = verb(b, IR_FAR, wet=0.6, dry=0.6)
    pan = (f["x"] - 0.5) * 1.4
    gl, gr = pan_gains(pan)
    delay = 0.16 + 0.35 * (1 - f["size"])
    t0 = f["t"] + delay
    if in_silence(t0, before=0.2, after=0.5):
        continue
    add((l * gl * 1.4, r * gr * 1.4), t0, 0.16 * f["power"])

PST("impacts")
# ------------------------------------------------------------------ séquence « événement » (1995) : impact, cœur, acouphène
def heartbeat():
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * (48 + 20 * np.exp(-tt / 0.03)) * tt) * env_exp(n, 0.09, 0.004)
    return lp(s, 140)


if EV:
    ev_t = EV["t"]
    if reel("impact", "impact_objet", "coeur"):  # impact réel, puis vrais battements de cœur
        s_, a_ = BR.impact(rng, 1.2)
        add(BR.reverb(s_, "ir_grand", wet=0.7), ev_t - a_ / SR, 0.42)
        for d in (0.95, 1.27, 2.15, 2.47, 3.35, 3.67):
            add(BR.coup("coeur", rng, 0.3, 10), ev_t + d - 0.003, 0.5 if int(d * 100) % 2 else 0.36)
    else:
        l, r = verb(hit(1.0), IR_FAR, wet=0.7)
        add((l, r), ev_t, 0.42)
        for d in (0.95, 1.27, 2.15, 2.47, 3.35, 3.67):
            add(heartbeat(), ev_t + d, 0.55 if int(d * 100) % 2 else 0.4)
    n = int(3.4 * SR)
    tin = np.sin(2 * np.pi * 7150 * np.arange(n) / SR) * np.clip(np.arange(n) / SR / 0.08, 0, 1) * np.exp(-np.arange(n) / SR / 1.1)
    add(tin, ev_t + 0.02, 0.022)

# ------------------------------------------------------------------ bruitages calés image par image (TL.sound.foley)
# machine à écrire, sonnette du chariot, marteau de séance, scalpel sur papier, dalles qui se
# déplacent, radio, coups de feu lointains, scintillement des villages qui s'allument
def key_click(v=0):
    n = int(0.09 * SR)
    tt = np.arange(n) / SR
    tr = bp(noise(n), 1800, 8000) * env_exp(n, 0.0028 + 0.0006 * (v % 3), 0.0002)
    body = bp(noise(n), 180, 900) * env_exp(n, 0.012, 0.0008)
    ring = np.sin(2 * np.pi * (2300 + 140 * v) * tt) * env_exp(n, 0.014, 0.0005)
    x = tr / (np.abs(tr).max() + 1e-9) + 0.55 * body / (np.abs(body).max() + 1e-9) + 0.12 * ring
    return x


def bell():
    n = int(1.6 * SR)
    tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 2380 * tt) + 0.5 * np.sin(2 * np.pi * 3610 * tt) + 0.25 * np.sin(2 * np.pi * 5230 * tt)) * env_exp(n, 0.55, 0.001)
    rat = np.zeros(n)
    for k in range(9):
        i0 = int((0.22 + 0.028 * k) * SR)
        m = int(0.02 * SR)
        rat[i0:i0 + m] += bp(noise(m), 900, 5000) * np.exp(-np.arange(m) / (m / 6))
    thunk = lp(noise(n), 400) * env_exp(n, 0.04, 0.002)
    thunk = np.roll(thunk, int(0.5 * SR))
    return 0.35 * x + 0.5 * rat / (np.abs(rat).max() + 1e-9) + 0.5 * thunk / (np.abs(thunk).max() + 1e-9)


def knock():
    n = int(0.8 * SR)
    tt = np.arange(n) / SR
    th = lp(noise(n), 700) * env_exp(n, 0.025, 0.0005)
    res = np.sin(2 * np.pi * 182 * tt) * env_exp(n, 0.09, 0.001) + 0.6 * np.sin(2 * np.pi * 437 * tt) * env_exp(n, 0.05, 0.001)
    return th / (np.abs(th).max() + 1e-9) + 0.5 * res


def scalpel(dur):
    n = int((dur + 0.15) * SR)
    tt = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(tt / (dur + 0.15), 0, 1)) ** 0.6
    grains = (rng.random(n) < 140 / SR) * rng.standard_normal(n)
    grains = conv(grains, np.exp(-np.arange(int(0.004 * SR)) / (0.0008 * SR)))[:n]
    hiss = bp(noise(n), 1600, 7500)
    hiss /= np.abs(hiss).max() + 1e-9
    gr = bp(grains, 900, 6000)
    gr /= np.abs(gr).max() + 1e-9
    scrape = bp(noise(n), 280, 1100) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * tt))
    scrape /= np.abs(scrape).max() + 1e-9
    return (0.55 * hiss + 0.6 * gr + 0.25 * scrape) * env


def slab():
    n = int(2.0 * SR)
    tt = np.arange(n) / SR
    x = 0.9 * hit(1.0, metal=False)[:n]
    grind = bp(noise(n), 70, 650) * (0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 13 * tt + 3 * np.sin(2 * np.pi * 2.1 * tt))))
    grind *= np.clip(tt / 0.05, 0, 1) * np.exp(-tt / 0.5)
    x += 0.7 * grind / (np.abs(grind).max() + 1e-9)
    dust = bp(noise(n), 2000, 7000) * np.exp(-tt / 0.35) * (rng.random(n) < 0.02)
    x += 0.12 * dust / (np.abs(dust).max() + 1e-9)
    return x


def radio(dur):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    syl = np.zeros(n)
    k = 0
    while k < n:
        ln = int(SR * (0.12 + 0.18 * rng.random()))
        gap = int(SR * (0.02 + (0.35 if rng.random() < 0.12 else 0.06) * rng.random()))
        m = min(ln, n - k)
        syl[k:k + m] = np.sin(np.pi * np.arange(m) / max(m, 1)) ** 1.5 * (0.5 + 0.5 * rng.random())
        k += ln + gap
    voice = np.zeros(n)
    for f0, bw in ((520, 300), (1250, 500), (2400, 700)):
        voice += bp(noise(n), f0 - bw / 2, f0 + bw / 2)
    voice = voice / (np.abs(voice).max() + 1e-9) * syl
    crackle = (rng.random(n) < 30 / SR) * rng.standard_normal(n)
    crackle = bp(conv(crackle, np.exp(-np.arange(200) / 30.0))[:n], 800, 6000)
    hiss = bp(noise(n), 1500, 4500) * 0.18
    hum = 0.08 * np.sin(2 * np.pi * 100 * tt)
    x = bp(voice + 0.25 * crackle / (np.abs(crackle).max() + 1e-9) + hiss, 280, 3400) + hum
    env = np.clip(tt / 1.2, 0, 1) * np.clip((dur - tt) / 1.6, 0, 1)
    return x * env


def shot():
    n = int(1.8 * SR)
    tt = np.arange(n) / SR
    crack = hp(noise(n), 1500) * env_exp(n, 0.007, 0.0002)
    boom = lp(noise(n), 380) * env_exp(n, 0.13, 0.002)
    return crack / (np.abs(crack).max() + 1e-9) + 0.8 * boom / (np.abs(boom).max() + 1e-9)


def shimmer(dur):
    n = int((dur + 0.6) * SR)
    x = np.zeros(n)
    count = int(dur * 55)
    for _ in range(count):
        q = rng.random() ** 0.8
        i0 = int(q * dur * SR)
        m = int(0.025 * SR)
        f = 2600 + 3800 * rng.random()
        seg = np.sin(2 * np.pi * f * np.arange(m) / SR) * np.exp(-np.arange(m) / (0.004 * SR))
        x[i0:i0 + m] += seg * (0.4 + 0.6 * rng.random())
    return x


KNOCK = knock()
FOLEY_REEL = reel("machine", "machine_cloche", "tic", "marteau", "salle", "feu", "papier_coupe", "pierre", "radio", "tir")
for fo in (SND.get("foley") or []):
    k, t0, g = fo["kind"], fo["t"], fo.get("gain", 1.0)
    PST("ambiances" if k in ("room", "shimmer") else "guerre" if k == "shot" else "bruitages")
    if FOLEY_REEL:
        if k == "key":  # vraies frappes de machine à écrire
            add(BR.reverb(BR.coup("machine", rng, 0.09), "ir_salle", wet=0.1), t0 - 0.003, 0.16 * g)
        elif k == "bell":  # vraie sonnette et retour du chariot
            s_, a_ = BR.prise("machine_cloche", rng)
            add(BR.reverb(s_, "ir_salle", wet=0.15), t0 - a_ / SR, 0.14 * g)
        elif k == "tick":
            add(BR.reverb(BR.coup("tic", rng, 0.08), "ir_salle", wet=0.2), t0 - 0.003, 0.12 * g)
        elif k == "gavel":  # vrai marteau de séance, deux coups
            for d, a in ((0.0, 1.0), (0.34, 0.8)):
                add(BR.reverb(BR.coup("marteau", rng, 0.5, 10), "ir_salle", wet=0.45), t0 + d - 0.003, 0.42 * a * g)
        elif k == "room":  # vraie grande salle : rumeur, toux, chaises
            n = int(fo["dur"] * SR)
            tt = np.arange(n) / SR
            e_ = np.clip(tt / 1.5, 0, 1) * np.clip((fo["dur"] - tt) / 1.5, 0, 1)
            rl_, rr_ = BR.moins_aigu(BR.fond("salle", fo["dur"], rng, -24))
            add((rl_[:n] * e_, rr_[:n] * e_), t0, 0.25 * g)
        elif k == "shimmer":  # les villages s'allument : braises qui crépitent, très doux
            n = int((fo["dur"] + 0.6) * SR)
            tt = np.arange(n) / SR
            e_ = np.clip(tt / 0.8, 0, 1) * np.clip((fo["dur"] + 0.6 - tt) / 0.8, 0, 1)
            sl_, sr_ = BR.adoucit(BR.fond("feu", n / SR, rng, -26), 3.5)
            add(BR.reverb((BR.passe_haut(sl_, 1500) * e_, BR.passe_haut(sr_, 1500) * e_), "ir_grand", wet=0.4), t0, 0.3 * g)
        elif k == "cut":  # vraie lame dans le papier
            n = int((fo["dur"] + 0.15) * SR)
            tt = np.arange(n) / SR
            e_ = np.sin(np.pi * np.clip(tt / (fo["dur"] + 0.15), 0, 1)) ** 0.6
            cl_, cr_ = BR.fond("papier_coupe", n / SR, rng, -16)
            add(BR.reverb((cl_ * e_, cr_ * e_), "ir_salle", wet=0.15), t0, 0.4 * g)
        elif k == "slab":  # vraie pierre qu'on traîne, posée lourdement
            s_, a_ = BR.prise("pierre", rng)
            add(BR.reverb(s_, "ir_grand", wet=0.4), t0, 0.4 * g)
            i_, ai_ = BR.impact(rng, 0.8, lourd=False)
            add(BR.reverb(i_, "ir_grand", wet=0.5), t0 + len(s_[0]) / SR * 0.8 - ai_ / SR, 0.3 * g)
        elif k == "radio":  # vraie radio, filtrée comme un vieux poste
            n = int(fo["dur"] * SR)
            tt = np.arange(n) / SR
            e_ = np.clip(tt / 0.3, 0, 1) * np.clip((fo["dur"] - tt) / 0.3, 0, 1)
            ql_, qr_ = BR.fond("radio", fo["dur"], rng, -20)
            ql_, qr_ = BR.passe_bas(BR.passe_haut(ql_, 300), 3200), BR.passe_bas(BR.passe_haut(qr_, 300), 3200)
            gl_, gr_ = pan_gains(-0.3)
            add(BR.reverb((ql_[:n] * e_ * gl_, qr_[:n] * e_ * gr_), "ir_salle", wet=0.15), t0, 0.35 * g)
        elif k == "shot":  # vrai coup de feu lointain
            s_, a_ = BR.prise("tir", rng)
            gl_, gr_ = pan_gains(0.4)
            add(BR.reverb((s_[0] * gl_, s_[1] * gr_), "ir_grand", wet=0.6, couleur=4000), t0 - a_ / SR, 0.3 * g)
        continue
    if k == "key":
        l, r = verb(key_click(fo.get("v", 0)), IR_HALL, wet=0.12)
        add((l, r), t0, 0.16 * g, 0.0)
    elif k == "bell":
        l, r = verb(bell(), IR_HALL, wet=0.2)
        add((l, r), t0, 0.12 * g)
    elif k == "tick":
        l, r = verb(click(), IR_HALL, wet=0.25)
        add((l, r), t0, 0.12 * g)
    elif k == "gavel":
        for d, a in ((0.0, 1.0), (0.34, 0.8)):
            l, r = verb(KNOCK, IR_HALL, wet=0.45)
            add((l, r), t0 + d, 0.42 * a * g)
    elif k == "room":
        n = int(fo["dur"] * SR)
        tt = np.arange(n) / SR
        x = bp(noise(n), 150, 800) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.23 * tt))
        x = x / (np.abs(x).max() + 1e-9) * np.clip(tt / 1.5, 0, 1) * np.clip((fo["dur"] - tt) / 1.5, 0, 1)
        l, r = verb(x, IR_HALL, wet=0.6, dry=0.4)
        add((l, r), t0, 0.05 * g)
    elif k == "shimmer":
        l, r = verb(shimmer(fo["dur"]), IR_FAR, wet=0.5)
        add((l, r), t0, 0.05 * g)
    elif k == "cut":
        x = scalpel(fo["dur"])
        l, r = verb(x, IR_HALL, wet=0.18)
        add((l, r), t0, 0.15 * g, 0.0)
    elif k == "slab":
        l, r = verb(slab(), IR_FAR, wet=0.5)
        add((l, r), t0, 0.5 * g)
    elif k == "radio":
        x = radio(fo["dur"])
        l, r = verb(x, IR_HALL, wet=0.15)
        add((l, r), t0, 0.07 * g, -0.3)
    elif k == "shot":
        l, r = verb(shot(), IR_FAR, wet=0.85, dry=0.35)
        add((l, r), t0, 0.2 * g, 0.4)

# ------------------------------------------------------------------ mixage final
mix_l, mix_r = L * master, R * master
mix_l, mix_r = hp(mix_l, 22), hp(mix_r, 22)
peak = max(np.abs(mix_l).max(), np.abs(mix_r).max())
mix_l, mix_r = mix_l / peak * 1.25, mix_r / peak * 1.25
mix_l, mix_r = np.tanh(mix_l) / np.tanh(1.25), np.tanh(mix_r) / np.tanh(1.25)
# niveau homogène entre les pièces : RMS visé -18 dBFS avec musique, -21 dBFS en bruitages
# seuls (sans écraser les impacts : gain plafonné), crêtes adoucies sous -1 dBFS
ceil = 10 ** (-1.0 / 20)
rms0 = np.sqrt(np.mean((mix_l ** 2 + mix_r ** 2) / 2))
g = 10 ** ((-18.0 if MUSIC else -21.0) / 20) / rms0
g = min(g, 4.0 * ceil / max(np.abs(mix_l).max(), np.abs(mix_r).max()))
mix_l, mix_r = mix_l * g, mix_r * g
mix_l, mix_r = BR.limite(mix_l, mix_r, ceil)  # quelques coups très secs passent au limiteur, pas tout le mixage
mix_l, mix_r = ceil * np.tanh(mix_l / ceil), ceil * np.tanh(mix_r / ceil)
# crête vraie (entre les échantillons, ce que voit l'encodeur) sous -1 dBTP
from scipy.signal import resample_poly  # noqa: E402
tp = max(np.abs(resample_poly(mix_l, 4, 1)).max(), np.abs(resample_poly(mix_r, 4, 1)).max())
if tp > ceil:
    mix_l, mix_r = mix_l * ceil / tp, mix_r * ceil / tp

pcm = np.clip(np.stack([mix_l, mix_r], 1) * (2 ** 23 - 1), -(2 ** 23), 2 ** 23 - 1).astype("<i4")
raw = pcm.reshape(-1).view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
with wave.open(OUT, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(3)
    w.setframerate(SR)
    w.writeframes(raw)
rms = np.sqrt(np.mean(mix_l ** 2))
print(OUT, f"{TOTAL:.1f} s", f"RMS {20 * np.log10(rms):.1f} dBFS")

# pistes séparées pour l'ingé son : mêmes niveaux que le mixage, sans limiteur ni saturation (PISTES=0 : rien)
if os.environ.get("PISTES", "1") == "1":
    k_ = 1.25 / peak / np.tanh(1.25) * g * (ceil / tp if tp > ceil else 1.0)
    try:
        PI.ecrire(PST, cues["name"], lambda l, r: (hp(l * master, 22) * k_, hp(r * master, 22) * k_), (mix_l, mix_r))
    except Exception as e:  # le mixage est déjà écrit : les pistes ne le font jamais échouer
        print(f"pistes non écrites ({e.__class__.__name__}: {e})")
