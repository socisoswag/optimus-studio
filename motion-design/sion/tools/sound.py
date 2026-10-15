"""Bande-son du motion design, synthétisée et calée sur l'image.

    node tools/cues.mjs > cues.json
    python3 tools/sound.py cues.json output/bande-son.wav

Drone grave en accords lents, vent et crépitements de feu, tic-tac discret,
souffles pendant les vols de caméra, impacts sur chaque nom, artillerie
lointaine synchronisée sur les éclairs, silence puis battement de cœur en 1995.
Uniquement numpy (aucun sample externe, donc aucun droit à gérer).
"""
import json
import sys
import wave

import numpy as np

SR = 48000
cues = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
TOTAL = cues["total"]
N = int((TOTAL + 0.5) * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(1948)
L = np.zeros(N)
R = np.zeros(N)


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
master *= np.clip((TOTAL + 0.3 - t) / (TOTAL + 0.3 - fade0), 0, 1)

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

bedmix = (0.55 * drone + 0.30 * pad + 0.42 * wind) * bed * duck
add(bedmix, 0, 0.62, 0.0)
crl = crack * bed * 0.09
add((crl, np.roll(crl, int(0.021 * SR))), 0, 1.0)

# ------------------------------------------------------------------ tic-tac (le temps qui passe)
tick_start, tick_end = SND.get("ticks") or (0.0, -1.0)
tk = 0
tt = tick_start
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


for fl in cues["flights"]:
    if fl["dur"] <= 0:
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

# ------------------------------------------------------------------ flux humains : rumeur de foule, pas, poussière
for fl in cues.get("flows", []):
    dur = fl["dur"]
    n = int((dur + 1.0) * SR)
    tt = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(tt / (dur + 1.0), 0, 1)) ** 1.6
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

# ------------------------------------------------------------------ impacts
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
    if kind == "event":
        continue
    if kind == "tick":
        l, r = verb(click(), IR_HALL, wet=0.25)
        add((l, r), im["t"], 0.16)
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

# ------------------------------------------------------------------ artillerie lointaine (son en retard sur l'éclair)
for f in cues["flashes"]:
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

# ------------------------------------------------------------------ séquence « événement » (1995) : impact, cœur, acouphène
def heartbeat():
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * (48 + 20 * np.exp(-tt / 0.03)) * tt) * env_exp(n, 0.09, 0.004)
    return lp(s, 140)


if EV:
    ev_t = EV["t"]
    l, r = verb(hit(1.0), IR_FAR, wet=0.7)
    add((l, r), ev_t, 0.42)
    for d in (0.95, 1.27, 2.15, 2.47, 3.35, 3.67):
        add(heartbeat(), ev_t + d, 0.55 if int(d * 100) % 2 else 0.4)
    n = int(3.4 * SR)
    tin = np.sin(2 * np.pi * 7150 * np.arange(n) / SR) * np.clip(np.arange(n) / SR / 0.08, 0, 1) * np.exp(-np.arange(n) / SR / 1.1)
    add(tin, ev_t + 0.02, 0.022)

# ------------------------------------------------------------------ mixage final
mix_l, mix_r = L * master, R * master
mix_l, mix_r = hp(mix_l, 22), hp(mix_r, 22)
peak = max(np.abs(mix_l).max(), np.abs(mix_r).max())
mix_l, mix_r = mix_l / peak * 1.25, mix_r / peak * 1.25
mix_l, mix_r = np.tanh(mix_l) / np.tanh(1.25), np.tanh(mix_r) / np.tanh(1.25)
# niveau homogène entre les pièces : RMS visé -18 dBFS, crêtes adoucies sous -1 dBFS
rms0 = np.sqrt(np.mean((mix_l ** 2 + mix_r ** 2) / 2))
g = 10 ** (-18.0 / 20) / rms0
mix_l, mix_r = mix_l * g, mix_r * g
ceil = 10 ** (-1.0 / 20)
mix_l, mix_r = ceil * np.tanh(mix_l / ceil), ceil * np.tanh(mix_r / ceil)

pcm = np.clip(np.stack([mix_l, mix_r], 1) * (2 ** 23 - 1), -(2 ** 23), 2 ** 23 - 1).astype("<i4")
raw = pcm.reshape(-1).view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
with wave.open(OUT, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(3)
    w.setframerate(SR)
    w.writeframes(raw)
rms = np.sqrt(np.mean(mix_l ** 2))
print(OUT, f"{TOTAL:.1f} s", f"RMS {20 * np.log10(rms):.1f} dBFS")
