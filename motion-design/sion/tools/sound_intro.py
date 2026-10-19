"""Bande-son de l'intro aérienne : bruitages seuls, synthétisés (numpy), calés sur la timeline.

    node -e "require('./timelines/intro-aerienne.js'); console.log(JSON.stringify(INTRO))" > intro.json
    python3 tools/sound_intro.py intro.json output/intro-aerienne.wav

Vent d'altitude (grave, souffle, sifflement), ressac lointain au-dessus de la mer, souffles à chaque
passage dans la brume, grondement quand la falaise s'ouvre sur la mer Morte, impact du titre.
Même niveau que les autres pièces (RMS -21 dBFS, crêtes sous -1 dBFS).
"""
import json
import sys
import wave

import numpy as np

SR = 48000
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
add((wl * bed_in, wr * bed_in), 0, 0.95)

# espace : grondement très grave, presque un souffle de la planète
if sp:
    n = int((sp[1] - sp[0] + 3) * SR)
    tt = np.arange(n) / SR
    env = np.clip((tt - 1.2) / 3.0, 0, 1) * np.clip((sp[1] - sp[0] + 3 - tt) / 4.0, 0, 1)
    rum = norm(lp(noise(n), 55)) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.11 * tt))
    tone = np.sin(2 * np.pi * 41.2 * tt + 0.6 * np.sin(2 * np.pi * 0.07 * tt))
    add(verb((0.7 * rum + 0.35 * tone) * env, wet=0.4, dry=1.0), sp[0], 0.075)

# lever du soleil derrière la Terre : scintillement qui monte, puis un coup très doux
sr = SND.get("sunrise")
if sr is not None:
    n = int(5.0 * SR)
    tt = np.arange(n) / SR
    sh = norm(bp(noise(n), 2500, 9000)) * np.clip(tt / 2.2, 0, 1) ** 2.5 * np.exp(-np.maximum(tt - 2.2, 0) / 0.9)
    add(verb(sh, wet=0.7, dry=0.6), sr - 2.2, 0.10)
    m = int(4.0 * SR)
    tm = np.arange(m) / SR
    boom = np.sin(2 * np.pi * np.cumsum(32 + 20 * np.exp(-tm / 0.2)) / SR) * env_exp(m, 1.0, 0.01)
    add(verb(boom, wet=0.6, dry=1.0), sr, 0.2)

# rentrée dans l'atmosphère : un souffle qui s'épaissit et s'éclaircit jusqu'aux nuages
en = SND.get("entry")
if en:
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

# ------------------------------------------------------------------ ressac lointain (plan de la mer)
s0, s1 = SND.get("surf", [0, 0])
if s1 > s0:
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
    s = whoosh(dur)
    n = len(s)
    p = np.arange(n) / n
    gl, gr = pan_gains(-0.6 + 1.2 * p)
    sub = norm(lp(noise(n), 70)) * np.sin(np.pi * p) ** 3
    add((s * gl + 0.45 * sub, s * gr + 0.45 * sub), d0 - dur / 2, 0.42)

# ------------------------------------------------------------------ la falaise s'ouvre : grondement grave qui monte puis s'étale
rv = SND.get("reveal")
if rv is not None:
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

# ------------------------------------------------------------------ titre : impact sourd, éclat, longue traîne
ti = (I.get("title") or {}).get("at")
if ti is not None:
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
master = np.clip(t / fade_in, 0, 1) ** 1.5 * np.clip((TOTAL + 0.2 - t) / 2.2, 0, 1)
ml, mr = hp(L * master, 22), hp(R * master, 22)
peak = max(np.abs(ml).max(), np.abs(mr).max())
ml, mr = np.tanh(ml / peak * 1.2) / np.tanh(1.2), np.tanh(mr / peak * 1.2) / np.tanh(1.2)
ceil = 10 ** (-1.0 / 20)
rms0 = np.sqrt(np.mean((ml ** 2 + mr ** 2) / 2))
g = min(10 ** (-21.0 / 20) / rms0, 1.6 * ceil / max(np.abs(ml).max(), np.abs(mr).max()))
ml, mr = ceil * np.tanh(ml * g / ceil), ceil * np.tanh(mr * g / ceil)
pcm = np.clip(np.stack([ml, mr], 1) * (2 ** 23 - 1), -(2 ** 23), 2 ** 23 - 1).astype("<i4")
with wave.open(OUT, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(3)
    w.setframerate(SR)
    w.writeframes(pcm.reshape(-1).view(np.uint8).reshape(-1, 4)[:, :3].tobytes())
print(OUT, f"{TOTAL:.1f} s", f"RMS {20 * np.log10(np.sqrt(np.mean(ml ** 2))):.1f} dBFS")
