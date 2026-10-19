"""Bande-son des pièces 3D et photo (intro aérienne, Gaza, villages, mur, archives…) : bruitages seuls, calés sur la timeline.

    node -e "require('./timelines/intro-aerienne.js'); console.log(JSON.stringify(INTRO))" > intro.json
    python3 tools/sound_intro.py intro.json output/intro-aerienne.wav

Vent d'altitude (grave, souffle, sifflement), ressac lointain au-dessus de la mer, souffles à chaque
passage dans la brume, grondement quand la falaise s'ouvre sur la mer Morte, impact du titre.
Même niveau que les autres pièces (RMS -21 dBFS, crêtes sous -1 dBFS).
Sons réels (prises de terrain CC0 de la banque, tools/bruitages.py, ici BR) dès que la banque est téléchargée
(python3 tools/banque_sons.py prendre) ; sinon, ou avec SYNTH=1, les anciens sons de synthèse.
"""
import json
import os
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bruitages as BR  # noqa: E402

SR = 48000
REEL = os.environ.get("SYNTH", "0") != "1"


def reel(*roles):
    return REEL and BR.ok(*roles)


# ambiances des photos (data/reconstitution-legendes.json, timelines) : nom → rôle de la banque ; « foule+moutons » mélange
AMB = {"vent": "brise", "mer": "mer", "foule": "foule", "atelier": "atelier", "moutons": "moutons", "campagne": "campagne"}
I = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
TOTAL = I["total"]
SND = I.get("sound") or {}
N = int((TOTAL + 0.5) * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(1897)
L = np.zeros(N)
R = np.zeros(N)


def spec(x, gain):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * gain(f), len(x))


def lp(x, fc, order=2):
    return spec(x, lambda f: 1 / np.sqrt(1 + (f / fc) ** (2 * order)))


def hp(x, fc, order=2):
    return spec(x, lambda f: 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** (2 * order)))


def bp(x, f1, f2, order=2):
    return hp(lp(x, f2, order), f1, order)


def noise(n):
    return rng.standard_normal(n)


def norm(x):
    return x / (np.abs(x).max() + 1e-9)


def env_exp(n, tau, attack=0.003):
    tt = np.arange(n) / SR
    return np.clip(tt / attack, 0, 1) * np.exp(-tt / tau)


def pan_gains(p):
    a = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


def add(sig, start, gain=1.0, pan=0.0):
    i0 = int(round(start * SR))
    l, r = sig if isinstance(sig, tuple) else (sig * pan_gains(pan)[0], sig * pan_gains(pan)[1])
    if i0 < 0:
        l, r, i0 = l[-i0:], r[-i0:], 0
    n = min(len(l), N - i0)
    if n > 0:
        L[i0:i0 + n] += gain * l[:n]
        R[i0:i0 + n] += gain * r[:n]


def conv(x, h):
    n = len(x) + len(h) - 1
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(h, nfft), nfft)[:n]


def make_ir(dur, tau, fc):
    n = int(dur * SR)
    e = np.exp(-np.arange(n) / SR / tau)
    e[: int(0.015 * SR)] *= np.linspace(0, 1, int(0.015 * SR))
    a, b = lp(noise(n), fc) * e, lp(noise(n), fc) * e
    s = np.sqrt(np.sum(a ** 2))
    return a / s, b / s


IR = make_ir(5.0, 1.4, 2400)


def verb(x, wet=0.5, dry=1.0):
    l, r = conv(x, IR[0]) * wet, conv(x, IR[1]) * wet
    l[: len(x)] += x * dry
    r[: len(x)] += x * dry
    return l, r


def smooth_noise(n, rate):
    """Modulation lente (rafales) : bruit filtré très bas, entre 0 et 1."""
    m = lp(noise(n), rate, 2)
    m = (m - m.min()) / (m.max() - m.min() + 1e-9)
    return m


# ------------------------------------------------------------------ vent d'altitude, trois couches décorrélées
gust = 0.55 + 0.45 * smooth_noise(N, 0.18)
low = [norm(lp(hp(np.cumsum(noise(N)), 16), 110)) for _ in range(2)]
mid = [norm(bp(noise(N), 260, 1300)) for _ in range(2)]
air = [norm(hp(noise(N), 4200)) for _ in range(2)]
whistle = [norm(bp(noise(N), 900, 1100, 4)) for _ in range(2)]
wl = gust * (0.75 * low[0] + 0.30 * mid[0] * gust + 0.05 * air[0] + 0.05 * whistle[0] * gust ** 3)
wr = gust * (0.75 * low[1] + 0.30 * mid[1] * gust + 0.05 * air[1] + 0.05 * whistle[1] * gust ** 3)
# pas de vent dans l'espace : il arrive avec l'atmosphère
sp = SND.get("space")
bed_in = np.clip((t - (sp[1] - 1.0)) / 4.0, 0, 1) ** 1.5 if sp else 1.0
# silence complet juste avant le titre, puis le vent revient doucement
ti0 = (I.get("title") or {}).get("at")
if ti0 is not None and SND.get("titleSilence"):
    s0 = ti0 - SND["titleSilence"]
    bed_in = bed_in * np.where(t < s0, 1.0, np.clip((t - ti0 - 1.2) / 3.0, 0, 1) * 0.7)
    bed_in = bed_in * np.clip(1 - (t - s0 + 0.15) / 0.15, 0, 1) + bed_in * (t >= ti0)
if SND.get("wind", True):
    if reel("vent"):  # vrai vent (prises de terrain) à la place du bruit filtré
        wl, wr = BR.fond("vent_doux" if SND.get("night") else "vent", N / SR, rng, -25)
        wl, wr = BR.passe_haut(wl, 90, 3), BR.passe_haut(wr, 90, 3)  # sans le souffle du vent sur le micro
    add((wl * bed_in, wr * bed_in), 0, 0.95 * (0.45 if SND.get("night") else 1.0))

# ------------------------------------------------------------------ archives : projecteur et ambiances de chaque photo
if SND.get("projector") and reel("projecteur"):
    # vrai projecteur (16 mm, 8 mm) : obturateur, moteur, ventilateur, dans une petite salle
    pl_, pr_ = BR.fond("projecteur", N / SR, rng, -20)
    add(BR.reverb((BR.passe_bas(pl_, 7000), BR.passe_bas(pr_, 7000)), "ir_salle", wet=0.12), 0, 0.08)
elif SND.get("projector"):
    # cliquetis de l'obturateur (24 par seconde, irrégulier), ronronnement du moteur, souffle du ventilateur
    x = np.zeros(N)
    tc, per = 0.0, 1 / 24
    while tc < TOTAL:
        i0 = int(tc * SR)
        ln = int(0.006 * SR)
        if i0 + ln < N:
            x[i0:i0 + ln] += (0.7 + 0.3 * rng.random()) * noise(ln) * np.exp(-np.arange(ln) / (ln / 5))
        tc += per * (1 + 0.04 * rng.standard_normal())
    clat = norm(bp(x, 900, 5200)) * (0.85 + 0.15 * smooth_noise(N, 0.6))
    hum = 0.5 * np.sin(2 * np.pi * 50 * t) + 0.25 * np.sin(2 * np.pi * 100 * t + 0.4) + 0.12 * np.sin(2 * np.pi * 24 * t)
    fan = norm(bp(noise(N), 180, 900))
    add(verb(0.55 * clat + 0.10 * hum + 0.22 * fan, wet=0.25, dry=1.0), 0, 0.10, -0.25)


def murmur(n, voices, rate):
    """Foule : voix lointaines, chacune un bruit coloré de formants qui parle par syllabes, puis se tait."""
    out_l, out_r = np.zeros(n), np.zeros(n)
    tt = np.arange(n) / SR
    for _ in range(voices):
        f1 = 260 + 500 * rng.random()
        v = bp(noise(n), f1, f1 * (2.6 + 1.6 * rng.random()), 2)
        syl = (0.5 + 0.5 * np.sin(2 * np.pi * (rate * (0.7 + 0.6 * rng.random())) * tt + 6.3 * rng.random())) ** 2
        talk = smooth_noise(n, 0.35 + 0.3 * rng.random()) > 0.42  # phrases et silences
        e = lp(syl * talk, 30, 1)
        gl, gr = pan_gains(-0.9 + 1.8 * rng.random())
        out_l += v * e * gl
        out_r += v * e * gr
    return norm(out_l), norm(out_r)


for a0, a1, kind, gain in SND.get("amb", []):
    n = int((a1 - a0 + 1.0) * SR)
    tt = np.arange(n) / SR
    env = np.clip(tt / 1.0, 0, 1) * np.clip((a1 - a0 + 1.0 - tt) / 1.2, 0, 1)
    roles = [AMB.get(k_, k_) for k_ in kind.split("+")]
    if all(reel(r_) for r_ in roles):  # vraies ambiances : la première prise devant, les autres derrière
        ml_, mr_ = np.zeros(n), np.zeros(n)
        for j_, r_ in enumerate(roles):
            l_, r2_ = BR.fond(r_, n / SR, rng, -16 if j_ == 0 else -22)
            ml_, mr_ = ml_ + l_, mr_ + r2_
        sig = BR.moins_aigu((ml_ * env, mr_ * env))
        add(BR.reverb(sig, "ir_salle", wet=0.15) if "atelier" in roles else sig, a0 - 0.5, 0.16 * gain)
        continue
    if kind == "vent":  # brise dans les arbres
        g = 0.5 + 0.5 * lp(noise(n), 0.4, 1) / 1.0
        g = np.clip((g - g.min()) / (g.max() - g.min() + 1e-9), 0, 1)
        leaves = [norm(bp(noise(n), 1800, 7000)) * (0.3 + 0.7 * g) for _ in range(2)]
        body = [norm(lp(noise(n), 300)) * (0.4 + 0.6 * g) for _ in range(2)]
        sig = (0.6 * leaves[0] + 0.5 * body[0], 0.6 * leaves[1] + 0.5 * body[1])
        k = 0.16
    elif kind == "mer":  # ressac contre le quai, clapotis
        sw = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * tt / 4.2 + 0.7)) ** 3
        wash = norm(lp(noise(n), 900)) * sw
        lap = np.zeros(n)
        for p0 in rng.integers(0, n - 6000, int((a1 - a0) * 3)):
            ln = int(SR * (0.05 + 0.1 * rng.random()))
            lap[p0:p0 + ln] += noise(ln) * np.sin(np.pi * np.arange(ln) / ln) ** 2
        lap = norm(bp(lap, 300, 2500))
        sig = (wash + 0.35 * lap, np.roll(wash, 1200) + 0.35 * np.roll(lap, 500))
        k = 0.15
    elif kind == "foule":  # marché, rassemblement
        sig = murmur(n, 26, 4.2)
        k = 0.10
    else:  # atelier : salle de pierre, quelques coups sourds au loin
        room = norm(lp(noise(n), 220))
        x = np.zeros(n)
        for p0 in rng.integers(0, n - 20000, int((a1 - a0) * 0.6)):
            ln = int(0.25 * SR)
            x[p0:p0 + ln] += np.sin(2 * np.pi * (90 + 60 * rng.random()) * np.arange(ln) / SR) * env_exp(ln, 0.05, 0.002)
        sig = (0.5 * room + norm(x) * 0.6, 0.5 * np.roll(room, 900) + norm(x) * 0.5)
        k = 0.12
    l, r = sig
    add(verb(l * env, wet=0.35, dry=1.0)[0], a0 - 0.5, k * gain, -0.3)
    add(verb(r * env, wet=0.35, dry=1.0)[1], a0 - 0.5, k * gain, 0.3)

# espace : grondement très grave, presque un souffle de la planète
if sp and reel("grondement"):
    n = int((sp[1] - sp[0] + 3) * SR)
    tt = np.arange(n) / SR
    env = np.clip((tt - 1.2) / 3.0, 0, 1) * np.clip((sp[1] - sp[0] + 3 - tt) / 4.0, 0, 1)
    l, r = BR.fond("grondement", n / SR, rng, -16)
    add((BR.passe_bas(l, 160) * env, BR.passe_bas(r, 160) * env), sp[0], 0.09)
elif sp:
    n = int((sp[1] - sp[0] + 3) * SR)
    tt = np.arange(n) / SR
    env = np.clip((tt - 1.2) / 3.0, 0, 1) * np.clip((sp[1] - sp[0] + 3 - tt) / 4.0, 0, 1)
    rum = norm(lp(noise(n), 55)) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.11 * tt))
    tone = np.sin(2 * np.pi * 41.2 * tt + 0.6 * np.sin(2 * np.pi * 0.07 * tt))
    add(verb((0.7 * rum + 0.35 * tone) * env, wet=0.4, dry=1.0), sp[0], 0.075)

# lever du soleil derrière la Terre : scintillement qui monte, puis un coup très doux
sr = SND.get("sunrise")
if sr is not None and reel("montee", "impact_sourd"):  # cymbale frottée qui monte, coup sourd très doux
    m_ = BR.montee(rng, 2.2)
    add(BR.reverb(m_, "ir_grand", wet=0.6, couleur=7000), sr - 2.2, 0.07)
    s_, a_ = BR.impact_sourd(rng)
    add(BR.reverb(s_, "ir_grand", wet=0.7), sr - a_ / SR, 0.12)
elif sr is not None:
    n = int(5.0 * SR)
    tt = np.arange(n) / SR
    sh = norm(bp(noise(n), 2500, 9000)) * np.clip(tt / 2.2, 0, 1) ** 2.5 * np.exp(-np.maximum(tt - 2.2, 0) / 0.9)
    add(verb(sh, wet=0.7, dry=0.6), sr - 2.2, 0.10)
    m = int(4.0 * SR)
    tm = np.arange(m) / SR
    boom = np.sin(2 * np.pi * np.cumsum(32 + 20 * np.exp(-tm / 0.2)) / SR) * env_exp(m, 1.0, 0.01)
    add(verb(boom, wet=0.6, dry=1.0), sr, 0.2)

# rentrée dans l'atmosphère : un souffle qui s'épaissit et s'éclaircit jusqu'aux nuages
def ouvre(x, dur):
    """Passe-bas qui s'ouvre de 120 Hz à 2,7 kHz pendant dur secondes (le son « arrive »)."""
    n = len(x)
    hop, win = 512, 2048
    w = np.hanning(win)
    out = np.zeros(n + win)
    fr = np.fft.rfftfreq(win, 1 / SR)
    for i in range(0, n - win, hop):
        pi = min(1.0, i / SR / dur)
        mask = 1 / np.sqrt(1 + (fr / (120 + 2600 * pi ** 2)) ** 4)
        out[i:i + win] += np.fft.irfft(np.fft.rfft(x[i:i + win] * w) * mask, win)
    return out[:n]


en = SND.get("entry")
if en and reel("vent"):  # vrai vent d'altitude qui s'ouvre
    n = int((en[1] - en[0] + 1.5) * SR)
    tt = np.arange(n) / SR
    p = np.clip(tt / (en[1] - en[0]), 0, 1)
    src_ = BR.fond("vent", n / SR, rng, -14)
    ro_ = [ouvre(c_, en[1] - en[0]) for c_ in src_]
    e_ = p ** 2.2 * np.clip((en[1] - en[0] + 1.5 - tt) / 1.2, 0, 1)
    pk_ = max(np.abs(ro_[0]).max(), np.abs(ro_[1]).max()) + 1e-9
    add((ro_[0] / pk_ * e_, ro_[1] / pk_ * e_), en[0], 0.8)
elif en:
    n = int((en[1] - en[0] + 1.5) * SR)
    tt = np.arange(n) / SR
    p = np.clip(tt / (en[1] - en[0]), 0, 1)
    x = noise(n)
    hop, win = 512, 2048
    w = np.hanning(win)
    out = np.zeros(n + win)
    fr = np.fft.rfftfreq(win, 1 / SR)
    for i in range(0, n - win, hop):
        pi = min(1.0, i / SR / (en[1] - en[0]))
        fc = 120 + 2600 * pi ** 2
        mask = 1 / np.sqrt(1 + (fr / fc) ** 4)
        out[i:i + win] += np.fft.irfft(np.fft.rfft(x[i:i + win] * w) * mask, win)
    roar = norm(out[:n]) * p ** 2.2 * np.clip((en[1] - en[0] + 1.5 - tt) / 1.2, 0, 1)
    add((roar, np.roll(roar, 700)), en[0], 0.8)

# ------------------------------------------------------------------ nuit : grillons au loin, lumières qui s'allument
if SND.get("night") and reel("nuit"):  # vrais grillons
    l, r = BR.moins_aigu(BR.fond("nuit", N / SR, rng, -36), -6)
    add((l, r), 0, 0.6)
elif SND.get("night"):
    for k in range(7):
        f0 = 4100 + 700 * rng.random()
        rate = 0.55 + 0.5 * rng.random()
        pan = -0.9 + 1.8 * rng.random()
        n = N
        x = np.zeros(n)
        tc = rng.random() * rate
        while tc < TOTAL:
            for j in range(3):  # trois impulsions par cri
                i0 = int((tc + j * 0.034) * SR)
                ln = int(0.022 * SR)
                if i0 + ln < n:
                    tt = np.arange(ln) / SR
                    x[i0:i0 + ln] += np.sin(2 * np.pi * f0 * tt) * np.sin(np.pi * tt / 0.022) ** 2
            tc += rate * (0.9 + 0.2 * rng.random())
        add(verb(x, wet=0.6, dry=0.5), 0, 0.012 * (0.6 + 0.8 * rng.random()), pan)
cr = SND.get("crackle")
if cr and reel("feu"):  # vraies braises qui crépitent, au loin
    n = int((cr[1] - cr[0] + 2) * SR)
    tt = np.arange(n) / SR
    env = np.clip(tt / 2, 0, 1) * np.clip((cr[1] - cr[0] + 2 - tt) / 2, 0, 1)
    l, r = BR.adoucit(BR.fond("feu", n / SR, rng, -28), 3.5)
    l, r = BR.passe_bas(l, 6000), BR.passe_bas(r, 6000)  # braises au loin : sans claquements secs
    add(BR.reverb((l * env, r * env), "ir_grand", wet=0.25, couleur=5000), cr[0], 0.3)
elif cr:
    n = int((cr[1] - cr[0] + 2) * SR)
    x = np.zeros(n)
    for p0 in rng.integers(0, n - 4000, int((cr[1] - cr[0]) * 9)):
        ln = int(SR * (0.003 + 0.01 * rng.random()))
        x[p0:p0 + ln] += (0.3 + rng.random()) * noise(ln) * np.exp(-np.arange(ln) / (ln / 4))
    x = norm(bp(x, 700, 4500))
    tt = np.arange(n) / SR
    env = np.clip(tt / 2, 0, 1) * np.clip((cr[1] - cr[0] + 2 - tt) / 2, 0, 1)
    add(verb(x * env, wet=0.5, dry=0.7), cr[0], 0.05)
for th in SND.get("hits", []):
    if reel("impact", "impact_objet"):  # coup discret mais audible au téléphone
        s_, a_ = BR.impact(rng, 0.6, lourd=False)
        add(BR.reverb(s_, "ir_grand", wet=0.6), th - a_ / SR, 0.22)
        continue
    n = int(5 * SR)
    tt = np.arange(n) / SR
    f = 30 + 30 * np.exp(-tt / 0.15)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 1.2, 0.004) + 0.5 * norm(lp(noise(n), 140)) * env_exp(n, 0.2, 0.002)
    add(verb(x, wet=0.65, dry=1.0), th, 0.16)

# ------------------------------------------------------------------ ressac lointain (plan de la mer)
s0, s1 = SND.get("surf", [0, 0])
if s1 > s0 and reel("mer"):  # vraie mer sur les rochers, entendue de haut : adoucie
    n = int((s1 - s0 + 1.5) * SR)
    tt = np.arange(n) / SR
    env = np.clip(tt / 2.0, 0, 1) * np.clip((s1 - s0 + 1.5 - tt) / 1.2, 0, 1)
    l, r = BR.fond("mer", n / SR, rng, -16)
    l, r = BR.passe_bas(l, 2500), BR.passe_bas(r, 2500)
    add(BR.reverb((l * env, r * env), "ir_grand", wet=0.2, couleur=3000), s0, 0.22)
elif s1 > s0:
    n = int((s1 - s0 + 1.5) * SR)
    tt = np.arange(n) / SR
    swell = 0.4 + 0.6 * (0.5 + 0.5 * np.sin(2 * np.pi * tt / 6.5 + 1.0)) ** 2
    wash = norm(lp(noise(n), 700)) * swell
    env = np.clip(tt / 2.0, 0, 1) * np.clip((s1 - s0 + 1.5 - tt) / 1.2, 0, 1)
    add(verb(wash * env, wet=0.6, dry=0.6), s0, 0.12)


# ------------------------------------------------------------------ passages dans la brume : souffle qui enfle et retombe
def whoosh(dur):
    n = int(dur * SR)
    x = noise(n)
    hop, win = 256, 1024
    w = np.hanning(win)
    out = np.zeros(n + win)
    lf = np.log(np.maximum(np.fft.rfftfreq(win, 1 / SR), 20))
    for i in range(0, n - win, hop):
        e = np.sin(np.pi * np.clip(i / SR / dur, 0, 1)) ** 1.6
        mask = np.exp(-0.5 * ((lf - np.log(200 * (1 + 9 * e))) / (0.9 + 0.5 * e)) ** 2)
        out[i:i + win] += np.fft.irfft(np.fft.rfft(x[i:i + win] * w) * mask, win) * e
    return norm(out[:n])


for d0, half in I.get("dips", []):
    dur = 2 * half + 1.6
    if reel("souffle"):
        s_, pk_ = BR.souffle(rng, dur, gros=True)
        add(s_, d0 - pk_ / SR, 0.42)
        continue
    s = whoosh(dur)
    n = len(s)
    p = np.arange(n) / n
    gl, gr = pan_gains(-0.6 + 1.2 * p)
    sub = norm(lp(noise(n), 70)) * np.sin(np.pi * p) ** 3
    add((s * gl + 0.45 * sub, s * gr + 0.45 * sub), d0 - dur / 2, 0.42)

# ------------------------------------------------------------------ souffle long qui suit un balayage de l'image
for s0, dur in SND.get("sweeps", []):
    if reel("souffle"):
        s_, _ = BR.souffle(rng, dur, sens=-1)
        add(s_, s0, 0.34)
        continue
    sw = whoosh(dur)
    n = len(sw)
    gl, gr = pan_gains(0.7 - 1.4 * np.arange(n) / n)
    add((sw * gl, sw * gr), s0, 0.34)

# ------------------------------------------------------------------ la falaise s'ouvre : grondement grave qui monte puis s'étale
rv = SND.get("reveal")
if rv is not None and reel("grondement", "vent"):  # vrai grondement lointain qui enfle, rafale au passage du bord
    n = int(9 * SR)
    tt = np.arange(n) / SR
    env = np.clip(tt / 2.4, 0, 1) ** 2 * np.exp(-np.maximum(tt - 2.4, 0) / 2.2)
    l, r = BR.fond("grondement", 9, rng, -13)
    add(BR.reverb((l * env, r * env), "ir_grand", wet=0.35), rv - 2.4, 0.26)
    m = int(4 * SR)
    w_ = np.sin(np.pi * np.arange(m) / m) ** 2
    gl_, gr_ = BR.fond("vent", 4, rng, -13)
    add((gl_[:m] * w_, gr_[:m] * w_), rv - 1.4, 0.2)
elif rv is not None:
    n = int(9 * SR)
    tt = np.arange(n) / SR
    env = np.clip(tt / 2.4, 0, 1) ** 2 * np.exp(-np.maximum(tt - 2.4, 0) / 2.2)
    f = 34 + 6 * np.clip(tt / 2.4, 0, 1)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.35 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    rumble = norm(lp(noise(n), 90))
    x = (0.8 * tone + 0.6 * rumble) * env
    add(verb(x, wet=0.5, dry=1.0), rv - 2.4, 0.24)
    # rafale plus forte au passage du bord
    g = norm(bp(noise(int(4 * SR)), 300, 2200)) * np.sin(np.pi * np.arange(int(4 * SR)) / (4 * SR)) ** 2
    add((g, np.roll(g, 900)), rv - 1.4, 0.16)

# ------------------------------------------------------------------ effets : filés, montées, impacts, chiffres qui défilent
for tw, d in SND.get("whips", []):  # filé de caméra : souffle rapide qui traverse l'image, petit coup sourd à la coupe
    if reel("souffle", "impact_sourd"):  # le sommet du vrai souffle tombe sur la coupe
        s_, pk_ = BR.souffle(rng, 1.15, sens=d)
        add(s_, tw - pk_ / SR, 0.5)
        t_, a_ = BR.impact_sourd(rng)
        add(BR.reverb(t_, "ir_grand", wet=0.3), tw - a_ / SR, 0.2)
        continue
    sw = whoosh(1.15)
    n = len(sw)
    p = np.arange(n) / n
    gl, gr = pan_gains((-0.8 + 1.6 * p) * d)
    add((sw * gl, sw * gr), tw - 0.62, 0.5)
    m = int(1.2 * SR)
    tm = np.arange(m) / SR
    thump = np.sin(2 * np.pi * np.cumsum(48 + 40 * np.exp(-tm / 0.05)) / SR) * env_exp(m, 0.22, 0.002)
    add(verb(thump, wet=0.3, dry=1.0), tw, 0.22)
for r0, r1 in SND.get("risers", []):  # montée : bruit qui s'éclaircit et enfle jusqu'à l'impact, coupé net
    if reel("montee"):  # vraie cymbale qui culmine sur l'impact
        m_ = BR.montee(rng, r1 - r0 - 0.06)  # s'arrête 60 ms avant l'impact : le coup « tombe »
        add(BR.reverb(m_, "ir_grand", wet=0.35, couleur=9000), r1 - 0.06 - len(m_[0]) / SR, 0.22)
        continue
    n = int((r1 - r0) * SR)
    x = noise(n)
    hop, win = 256, 2048
    w = np.hanning(win)
    out = np.zeros(n + win)
    lf = np.log(np.maximum(np.fft.rfftfreq(win, 1 / SR), 20))
    for i in range(0, n - win, hop):
        k = i / n
        mask = np.exp(-0.5 * ((lf - np.log(180 * 25 ** k)) / 0.7) ** 2)
        out[i:i + win] += np.fft.irfft(np.fft.rfft(x[i:i + win] * w) * mask, win)
    tt = np.arange(n) / SR
    rise = norm(out[:n]) * (tt / (r1 - r0)) ** 2.5
    tone = np.sin(2 * np.pi * np.cumsum(55 * 2 ** (2 * tt / (r1 - r0))) / SR) * (tt / (r1 - r0)) ** 3 * 0.4
    add(verb(rise + tone, wet=0.4, dry=1.0), r0, 0.26)
# creux avant chaque gros coup (comme au mixage cinéma) : tout ce qui joue déjà baisse sur les 120 ms qui précèdent,
# puis revient en 300 ms ; l'impact, ajouté ensuite, tombe sur du silence relatif et claque
if REEL:
    _coups = [(t_, k_) for t_, k_ in SND.get("impacts", [])]
    if (I.get("title") or {}).get("at") is not None and reel("impact", "impact_objet", "montee"):
        _th = I["title"]["at"]
        for c_ in (I.get("fx") or {}).get("cuts", []):
            if c_.get("type") == "flash" and abs(c_["t"] - _th) < 0.3:
                _th = c_["t"]
        _coups.append((_th, 1.0))
    _dip = np.ones(N)
    for t_, k_ in _coups:
        d_ = 1 - 0.6 * min(1.0, k_)
        i0_, i1_, i2_ = (max(0, min(N, int(x_ * SR))) for x_ in (t_ - 0.12, t_, t_ + 0.3))
        _dip[i0_:i1_] = np.minimum(_dip[i0_:i1_], np.linspace(1, d_, i1_ - i0_))
        _dip[i1_:i2_] = np.minimum(_dip[i1_:i2_], np.linspace(d_, 1, i2_ - i1_))
    L *= _dip
    R *= _dip
for ti, k in SND.get("impacts", []):  # impact : chute dans le grave, craquement, longue traîne
    if reel("impact", "impact_objet"):  # vraies prises superposées, attaque pile sur l'image
        s_, a_ = BR.impact(rng, k)
        add(BR.reverb(s_, "ir_grand", wet=0.35), ti - a_ / SR, 0.5 * k)
        continue
    n = int(5 * SR)
    tt = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(26 + 46 * np.exp(-tt / 0.09)) / SR) * env_exp(n, 0.9, 0.002)
    thud = norm(lp(noise(n), 200)) * env_exp(n, 0.14, 0.001)
    crk = norm(hp(noise(n), 2200)) * env_exp(n, 0.025, 0.0005)
    add(verb(sub + 0.8 * thud + 0.25 * crk, wet=0.6, dry=1.0), ti, 0.42 * k)
for c0, cd in SND.get("counts", []):  # chiffres qui défilent : petits clics qui ralentissent
    tc = c0
    while tc < c0 + cd:
        if reel("tic"):  # vrais tics de réveil, qui ralentissent
            add(BR.coup("tic", rng, 0.08), tc - 0.003, 0.1)
        else:
            ln = int(0.004 * SR)
            click = np.sin(2 * np.pi * 2600 * np.arange(ln) / SR) * np.exp(-np.arange(ln) / (ln / 3))
            add(click, tc, 0.05, 0.1)
        u = (tc - c0) / cd
        tc += 0.028 + 0.16 * u ** 2.4

# ------------------------------------------------------------------ titre : impact sourd, éclat, longue traîne
ti = (I.get("title") or {}).get("at")
if ti is not None and reel("impact", "impact_objet", "montee"):
    th_ = ti
    for c_ in (I.get("fx") or {}).get("cuts", []):
        if c_.get("type") == "flash" and abs(c_["t"] - ti) < 0.3:
            th_ = c_["t"]  # l'impact tombe sur le flash du titre
    m_ = BR.montee(rng, 1.54)
    add(BR.reverb(m_, "ir_grand", wet=0.5, couleur=9000), th_ - 0.06 - len(m_[0]) / SR, 0.18)
    s_, a_ = BR.impact(rng, 1.3)
    add(BR.reverb(s_, "ir_grand", wet=0.6), th_ - a_ / SR, 0.62)
elif ti is not None:
    n = int(6 * SR)
    tt = np.arange(n) / SR
    f = 28 + 40 * np.exp(-tt / 0.12)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 1.1, 0.003)
    thud = norm(lp(noise(n), 160)) * env_exp(n, 0.16, 0.002)
    crk = norm(hp(noise(n), 2500)) * env_exp(n, 0.03, 0.0008)
    x = sub + 0.7 * thud + 0.16 * crk
    for fr, a, tau in ((110, 0.10, 2.4), (164.8, 0.07, 2.0), (220, 0.05, 1.6)):
        x += a * np.sin(2 * np.pi * fr * tt) * env_exp(n, tau, 0.01)
    # souffle inversé qui y mène
    pre = norm(lp(noise(int(1.6 * SR)), 2600)) * np.exp(-np.arange(int(1.6 * SR)) / SR / 0.4)
    add(verb(pre[::-1], wet=0.5, dry=0.8), ti - 1.6 + 0.1, 0.20)
    add(verb(x, wet=0.65, dry=1.0), ti + 0.1, 0.55)

# ------------------------------------------------------------------ mixage final
fade_in = float(I.get("fadeIn", 2.4))
master = np.clip(t / fade_in, 0, 1) ** 1.5 * np.clip((TOTAL - 0.02 - t) / 2.2, 0, 1)  # silence sur la dernière image
ml, mr = hp(L * master, 22), hp(R * master, 22)
peak = max(np.abs(ml).max(), np.abs(mr).max())
ml, mr = np.tanh(ml / peak * 1.2) / np.tanh(1.2), np.tanh(mr / peak * 1.2) / np.tanh(1.2)
ceil = 10 ** (-1.0 / 20)
rms0 = np.sqrt(np.mean((ml ** 2 + mr ** 2) / 2))
g = min(10 ** (-21.0 / 20) / rms0, 4.0 * ceil / max(np.abs(ml).max(), np.abs(mr).max()))
ml, mr = BR.limite(ml * g, mr * g, ceil)  # quelques coups très secs passent au limiteur, pas tout le mixage
ml, mr = ceil * np.tanh(ml / ceil), ceil * np.tanh(mr / ceil)
# crête vraie (entre les échantillons, ce que voit l'encodeur) sous -1 dBTP
from scipy.signal import resample_poly  # noqa: E402
tp = max(np.abs(resample_poly(ml, 4, 1)).max(), np.abs(resample_poly(mr, 4, 1)).max())
if tp > ceil:
    ml, mr = ml * ceil / tp, mr * ceil / tp
pcm = np.clip(np.stack([ml, mr], 1) * (2 ** 23 - 1), -(2 ** 23), 2 ** 23 - 1).astype("<i4")
with wave.open(OUT, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(3)
    w.setframerate(SR)
    w.writeframes(pcm.reshape(-1).view(np.uint8).reshape(-1, 4)[:, :3].tobytes())
print(OUT, f"{TOTAL:.1f} s", f"RMS {20 * np.log10(np.sqrt(np.mean(ml ** 2))):.1f} dBFS")
