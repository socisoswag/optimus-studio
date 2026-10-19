"""Contrôle des bruitages : à lancer sur chaque bande-son (tools/verif_video.py le fait tout seul).

    python3 tools/verif_son.py output/intro-aerienne.mp4 --timeline intro-aerienne
    python3 tools/verif_son.py output/aliyas.wav --timeline aliyas
    python3 tools/verif_son.py output/aliyas.wav --json        (pour verif_video.py)

Mesure ce qui trahit un son « fabriqué » ou bâclé, au lieu de le deviner :
  - niveau : niveau intégré, crête vraie, saturation, décalage continu ;
  - clics : saut isolé d'un échantillon à l'autre, son qui s'arrête net (sans le moindre fondu), début ou fin sans fondu,
    son qui démarre par une marche ;
  - son de synthèse : souffle trop blanc (spectre plat, aigus constants), ton pur qui dure, modulation trop régulière
    (vent qui « respire » toujours à la même cadence), même bruitage répété à l'identique, boucle qui revient ;
  - téléphone : son qui s'annule en mono (phases opposées), impacts presque tout dans le grave (inaudibles sur un
    haut-parleur de téléphone), grave inutile sous 30 Hz ;
  - synchro (avec --timeline) : un son sur chaque impact programmé, un souffle sur chaque coupe en filé, un son sur les flashs.
Fabrique un spectrogramme horodaté output/verif/<nom>-son.png (repères de la timeline en bleu, problèmes en rouge),
à regarder : un son propre se reconnaît aussi à l'œil (pas de bandes horizontales fixes, pas de pavés réguliers).
Code de sortie 1 si un défaut bloquant est trouvé.
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import signal
from scipy.ndimage import median_filter, uniform_filter1d

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
args = sys.argv[1:]
src = args[0]
opt, i = {}, 1
while i < len(args):
    if args[i] == "--json":
        opt["json"], i = True, i + 1
    elif args[i].startswith("--") and i + 1 < len(args):
        opt[args[i][2:]], i = args[i + 1], i + 2
    else:
        i += 1
name = opt.get("nom") or os.path.splitext(os.path.basename(src))[0]
bad, warn, info, marks = [], [], [], []  # marks : (t, texte) des problèmes, pour le spectrogramme


def ts(t):
    return f"{int(t // 60)} min {t % 60:04.1f} s" if t >= 60 else f"{t:.1f} s"


def flag(level, t, text):
    (bad if level == "défaut" else warn).append(text)
    if t is not None:
        marks.append((t, level))


def runs(mask, min_len=1):
    """Intervalles [début, fin) des suites de True d'au moins min_len éléments."""
    d = np.diff(np.concatenate(([0], mask.astype(np.int8), [0])))
    st, en = np.where(d == 1)[0], np.where(d == -1)[0]
    return [(a, b) for a, b in zip(st, en) if b - a >= min_len]


def merge(times, gap):
    out = []
    for t in sorted(times):
        if not out or t - out[-1][-1] > gap:
            out.append([t])
        else:
            out[-1].append(t)
    return out


# ------------------------------------------------------------------ lecture
raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", src, "-vn", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                     capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.float32).reshape(-1, 2)
L, R = x[:, 0], x[:, 1]
m = 0.5 * (L + R)
dur = len(m) / SR

err = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", src, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
grab = lambda pat: (lambda r: float(r[-1]) if r else None)(re.findall(pat, err))
lufs, lra, peak = grab(r"I:\s+(-?[\d.]+) LUFS"), grab(r"LRA:\s+(-?[\d.]+) LU"), grab(r"Peak:\s+(-?[\d.]+) dBFS")

# ------------------------------------------------------------------ niveau, saturation, décalage
if lufs is not None and not -24 <= lufs <= -14:
    flag("défaut", None, f"niveau {lufs} LUFS (attendu entre -24 et -14)")
if peak is not None and peak > -1.0:
    flag("vérifier", None, f"crête {peak} dBTP (garder au moins 1 dB de marge, l'encodage YouTube la fera saturer)")
for ch, c in (("gauche", L), ("droite", R)):
    sat = runs(np.abs(c) >= 0.999, 3)
    if sat:
        flag("défaut", sat[0][0] / SR, f"saturation voie {ch} : {len(sat)} fois, d'abord à {ts(sat[0][0] / SR)}")
dc = float(np.abs(x.mean(0)).max())
if dc > 0.003:
    flag("vérifier", None, f"décalage continu {dc:.4f} (filtrer sous 20 Hz)")
if np.abs(x[:48]).max() > 0.02:
    flag("vérifier", 0.0, "le son démarre sans fondu (clic possible au tout début)")
if np.abs(x[-48:]).max() > 0.02:
    flag("défaut", dur, "le son s'arrête net à la fin (clic)")

# ------------------------------------------------------------------ enveloppe à la milliseconde : coupures sèches, marches
B = 48
nb = len(m) // B
pw = (x[:nb * B].astype(np.float64) ** 2).mean(1).reshape(nb, B).mean(1)
env = 10 * np.log10(pw + 1e-12)
cs = np.concatenate(([0.0], np.cumsum(env)))
if nb > 120:
    i0 = np.arange(nb - 60)
    fut = (cs[i0 + 53] - cs[i0 + 3]) / 50
    cand = np.where((env[:-60] > -36) & (env[2:-58] < env[:-60] - 30) & (fut < env[:-60] - 30))[0]
    for g in merge(cand / 1000.0, 0.1):
        t = g[0]
        lv = env[int(t * 1000)]
        flag("défaut" if lv > -24 else "vérifier", t,
             f"son coupé net à {ts(t)} (chute de plus de 30 dB en 2 ms : ajouter un fondu de 10 à 30 ms)")
    # démarrage par une marche : silence numérique puis saut d'un seul échantillon
    st = np.where((env[:-3] < -70) & (env[3:] > -40))[0]
    steps = []
    for k in merge(st / 1000.0, 0.2):
        s = int(k[0] * SR)
        seg = np.abs(np.diff(x[max(0, s - 96):s + 240], axis=0)).max()
        if seg > 0.1:
            steps.append(k[0])
    if steps:
        flag("vérifier", steps[0], f"{len(steps)} son(s) démarrent par une marche (clic à l'attaque), d'abord à {ts(steps[0])}")

# ------------------------------------------------------------------ clics isolés (saut d'un échantillon sans suite)
clicks = []
for c in (L, R):
    d2 = np.abs(np.diff(c, 2))
    Bc = 240
    nbc = len(d2) // Bc
    if nbc < 50:
        continue
    blk = d2[:nbc * Bc].reshape(nbc, Bc)
    mx = blk.max(1)
    rms = np.sqrt((blk.astype(np.float64) ** 2).mean(1)) + 1e-9
    bg = median_filter(rms, 41)
    for b in np.where((mx > 14 * bg) & (mx > 0.03))[0]:
        s = b * Bc + int(blk[b].argmax()) + 1
        if s < 1000 or s > len(c) - 1500:
            continue
        near = np.concatenate((d2[s - 241:s - 17], d2[s + 15:s + 239])).astype(np.float64)
        if mx[b] < 12 * np.sqrt((near ** 2).mean()):  # le saut ne dépasse pas le grain du son autour : pas un clic
            continue
        w2 = d2[s - 49:s + 48].astype(np.float64) ** 2
        if w2[46:51].sum() < 0.65 * w2.sum():  # énergie étalée sur plusieurs échantillons : éclat naturel (braise, choc), pas une cassure
            continue
        before = np.sqrt((c[s - 960:s - 96].astype(np.float64) ** 2).mean()) + 1e-6
        after = np.sqrt((c[s + 96:s + 1440].astype(np.float64) ** 2).mean())
        if after < 2.5 * before:
            clicks.append((s / SR, float(mx[b])))
clicks.sort()
ct = np.array([t for t, _ in clicks])
iso = [(t, a) for t, a in clicks if np.sum(np.abs(ct - t) < 1.0) <= 2]
grouped = len(clicks) - len(iso)
for g in merge([t for t, _ in iso], 0.05):
    amp = max(a for t, a in iso if g[0] <= t <= g[-1])
    flag("défaut" if amp > 0.15 else "vérifier", g[0], f"clic isolé à {ts(g[0])}")
if grouped:
    info.append(f"crépitements : {grouped} petits clics groupés (texture de feu, de pellicule ou de projecteur : voulus ?)")

# ------------------------------------------------------------------ bandes de tiers d'octave, image toutes les 5,3 ms
N, HOP = 1024, 256
FPS = SR / HOP
f_bin = np.fft.rfftfreq(N, 1 / SR)
thirds = [250 * 2 ** (k / 3) for k in range(19)]  # 250 Hz … 16 kHz
edges = [20, 250 * 2 ** (-1 / 6)] + [fc * 2 ** (1 / 6) for fc in thirds] + [SR / 2]
W = np.zeros((len(f_bin), len(edges) - 1), np.float32)
for k in range(len(edges) - 1):
    sel = (f_bin >= edges[k]) & (f_bin < edges[k + 1])
    if not sel.any():
        sel[np.argmin(np.abs(f_bin - 0.5 * (edges[k] + edges[k + 1])))] = True
    W[sel, k] = 1
# colonnes : 0 = grave (20-223 Hz), 1…19 = tiers d'octave 250 Hz…16 kHz, 20 = au-dessus de 18 kHz
win = np.hanning(N).astype(np.float32)
nfr = 1 + max(0, (len(m) - N) // HOP)
E = np.zeros((nfr, W.shape[1]), np.float32)
for a in range(0, nfr, 2048):
    b = min(nfr, a + 2048)
    idx = np.arange(a, b)[:, None] * HOP + np.arange(N)[None, :]
    E[a:b] = (np.abs(np.fft.rfft(m[idx] * win, axis=1)) ** 2) @ W
LE = 10 * np.log10(E + 1e-12)
tot = 10 * np.log10(E.sum(1) + 1e-12)
t_fr = (np.arange(nfr) * HOP + N / 2) / SR

# attaques (flux spectral)
flux = np.concatenate(([0.0], np.maximum(0, np.diff(LE[:, :20], axis=0)).sum(1)))
med = median_filter(flux, int(FPS) | 1)
mad = median_filter(np.abs(flux - med), int(FPS) | 1)
pk, _ = signal.find_peaks(flux, height=med + 5 * mad + 20, distance=int(0.1 * FPS))
# saut de niveau global : attrape aussi les coups graves, qui bougent peu de bandes
cst = np.concatenate(([0.0], np.cumsum(tot)))
pp = np.arange(13, nfr - 6)
jump = np.full(nfr, -99.0)
jump[pp] = np.maximum.reduce([tot[pp + k] for k in range(4)]) - (cst[pp - 1] - cst[pp - 13]) / 12
pj, _ = signal.find_peaks(jump, height=6, distance=int(0.1 * FPS))
ons = []
for p in sorted(set(pk.tolist()) | set(pj.tolist())):
    pre = tot[max(0, p - 12):max(1, p - 1)].mean()
    post = tot[p:p + 6].max()
    if post - pre > 3:
        if ons and t_fr[p] - ons[-1][0] < 0.08:  # deux attaques collées : on garde la plus nette
            if post - pre > ons[-1][1]:
                ons[-1] = (t_fr[p], post - pre, p)
            continue
        ons.append((t_fr[p], post - pre, p))

# ------------------------------------------------------------------ synchro avec la timeline
exp_ev = []
if opt.get("timeline"):
    nm = opt["timeline"]
    out = subprocess.run(["node", "-e", f"require('./timelines/{nm}.js'); console.log(JSON.stringify(globalThis.INTRO || null))"],
                         cwd=ROOT, capture_output=True, text=True).stdout.strip()
    I = json.loads(out) if out and out != "null" else None
    if I:
        for c in (I.get("fx") or {}).get("cuts", []):
            exp_ev.append((float(c["t"]), "filé" if c.get("type") == "whip" else "flash"))
        for t, _k in (I.get("sound") or {}).get("impacts", []):
            exp_ev.append((float(t), "impact"))
    else:
        cu = subprocess.run(["node", "tools/cues.mjs", nm], cwd=ROOT, capture_output=True, text=True).stdout
        cues = json.loads(cu) if cu.strip().startswith("{") else {}
        for c in cues.get("impacts", []):
            if c.get("kind") == "hit" and c.get("k", 0) >= 0.5:
                exp_ev.append((float(c["t"]), "impact"))
    exp_ev.sort()
    ded = []
    for t, k in exp_ev:  # un impact et un flash au même instant : un seul repère, le plus exigeant
        if ded and abs(ded[-1][0] - t) < 0.06:
            if k == "impact":
                ded[-1] = (t, k)
            continue
        ded.append((t, k))
    exp_ev = ded
    rms50 = 10 * np.log10(uniform_filter1d(E.sum(1), 10) + 1e-12)
    late = []
    for t, k in exp_ev:
        if t >= dur - 0.05:
            continue
        if k == "impact":
            # un coup qui suit un autre de moins de 0,6 s ressort de 3 dB au moins ; un coup isolé, de 6 dB
            rafale = any(0 < t - u < 0.6 for u, kk in exp_ev if kk == "impact")
            near = [(o, j) for o, j, _ in ons if -0.05 <= o - t <= 0.11 and j > (3 if rafale else 6)]
            if not near:
                flag("défaut", t, f"impact programmé à {ts(t)} : aucune attaque audible au bon moment")
            else:
                off = min(near, key=lambda q: abs(q[0] - t))[0] - t
                if abs(off) > 0.04:
                    late.append((t, off))
        elif k == "filé":
            a, b = np.searchsorted(t_fr, [t - 0.4, t + 0.2])
            c0, c1 = np.searchsorted(t_fr, [t - 1.5, t - 0.6])
            if b <= a or c1 <= c0 or rms50[a:b].max() - np.median(rms50[c0:c1]) < 5:
                flag("vérifier", t, f"coupe en filé à {ts(t)} : pas de souffle qui monte (moins de 5 dB)")
        else:
            near = [o for o, j, _ in ons if -0.06 <= o - t <= 0.12 and j > 6]
            if not near:
                flag("vérifier", t, f"flash à {ts(t)} sans son marqué")
    for t, off in late:  # UIT-R BT.1359 : un son en avance se remarque dès 45 ms, en retard à partir de 125 ms
        if off < -0.04 or off > 0.09:
            flag("défaut", t, f"impact à {ts(t)} {'en avance' if off < 0 else 'en retard'} de {abs(off) * 1000:.0f} ms sur l'image (ça se voit)")
    info.append(f"synchro : {len(exp_ev)} repères de la timeline contrôlés")

# ------------------------------------------------------------------ par seconde : souffle trop blanc, aigus agressifs ou figés
S1 = int(round(FPS))
ns = nfr // S1
if ns >= 3:
    Es = E[:ns * S1].reshape(ns, S1, -1).mean(1)
    lvl = np.array([10 * np.log10((m[j * SR:(j + 1) * SR].astype(np.float64) ** 2).mean() + 1e-12) for j in range(ns)])
    octs = np.stack([Es[:, 1 + 3 * o:4 + 3 * o].sum(1) for o in range(6)], 1)  # centres ~315 Hz … 10 kHz
    lo = 10 * np.log10(octs + 1e-12)
    xo = np.log2(np.array([315, 630, 1250, 2500, 5000, 10000.0]))
    slope = ((lo - lo.mean(1, keepdims=True)) * (xo - xo.mean())).sum(1) / ((xo - xo.mean()) ** 2).sum()
    loud = lvl > -45
    for a, b in runs(loud & (slope > 1.0), 3):
        flag("vérifier", a, f"souffle très blanc de {ts(a)} à {ts(b)} (spectre plat, pente {slope[a:b].mean():+.1f} dB/octave : "
                            "bruit de synthèse ; un vrai vent ou une vraie mer descend vers les aigus)")
    hi = 10 * np.log10(Es[:, 16:20].sum(1) + 1e-12)          # 8 à 18 kHz
    mid = 10 * np.log10(Es[:, 4:11].sum(1) + 1e-12)          # 500 Hz à 2,5 kHz
    pres = 10 * np.log10(Es[:, 10:16].sum(1) + 1e-12)        # 2 à 7 kHz
    std = np.array([hi[max(0, j - 4):j + 5].std() for j in range(ns)])
    for a, b in runs(loud & (hi > mid - 15) & (std < 0.8), 8):
        flag("vérifier", a, f"souffle aigu figé de {ts(a)} à {ts(b)} (8-18 kHz constant à moins de 1 dB près : "
                            "les aigus d'un vrai son bougent)")
    for a, b in runs(loud & (pres > mid + 3), 3):
        flag("vérifier", a, f"aigus agressifs de {ts(a)} à {ts(b)} (2-7 kHz plus fort que le médium : fatigue et masquera la voix)")

# ------------------------------------------------------------------ modulation trop régulière (vent ou mer qui « respire » en rythme)
# Un oscillateur de synthèse revient à l'identique : l'autocorrélation de l'enveloppe garde des pics hauts à 1, 2 et 3 périodes.
# Les rafales d'un vrai vent ou les vagues d'une vraie mer se ressemblent d'une fois sur l'autre, sans se répéter : les pics
# retombent vite.
envm = median_filter(E[:, 1:12].sum(1), 47)
k7 = len(envm) // 7
if k7 > 600:
    f25 = FPS / 7
    e25 = 10 * np.log10(envm[:k7 * 7].reshape(k7, 7).mean(1) + 1e-12)
    e25 = e25 - uniform_filter1d(e25, int(30 * f25), mode="nearest")
    wl, hop25 = int(min(60, k7 / f25) * f25), int(20 * f25)
    hits = []
    for a in range(0, max(1, len(e25) - wl + 1), hop25):
        seg = e25[a:a + wl] - e25[a:a + wl].mean()
        if seg.std() < 0.5:
            continue
        ac = np.correlate(seg, seg, "full")[len(seg) - 1:]
        ac = ac / (ac[0] + 1e-9)
        lo_, hi_ = int(0.3 * f25), int(min(12 * f25, len(seg) / 3.2))
        if hi_ <= lo_ + 2:
            continue
        pk_, _ = signal.find_peaks(ac[lo_:hi_], height=0.45)
        if not len(pk_):
            continue
        P = pk_[0] + lo_
        r2 = ac[max(0, 2 * P - 2):2 * P + 3].max() if 2 * P + 3 < len(ac) else 0
        r3 = ac[max(0, 3 * P - 3):3 * P + 4].max() if 3 * P + 4 < len(ac) else 0
        if r2 > 0.4 and r3 > 0.35:
            hits.append((a / f25, f25 / P, ac[P]))
    for g in merge([h[0] for h in hits], 20.5):
        hs = [h for h in hits if g[0] <= h[0] <= g[-1]]
        fq = np.median([h[1] for h in hs])
        flag("vérifier", g[0], f"modulation trop régulière à partir de {ts(g[0])} : le son revient à l'identique toutes les "
                               f"{1 / fq:.1f} s (oscillateur de synthèse, ou tic-tac voulu ?)")

# ------------------------------------------------------------------ ton pur qui dure
NT, HT = 8192, 4096
ft = np.fft.rfftfreq(NT, 1 / SR)
kmax = int(np.searchsorted(ft, 12000))
kmin = int(np.searchsorted(ft, 40))
wt = np.hanning(NT).astype(np.float32)
nft = 1 + max(0, (len(m) - NT) // HT)
lines = []
if nft > 20:
    PK = np.zeros((nft, kmax - kmin), bool)
    for a in range(0, nft, 256):
        b = min(nft, a + 256)
        idx = np.arange(a, b)[:, None] * HT + np.arange(NT)[None, :]
        P = 10 * np.log10(np.abs(np.fft.rfft(m[idx] * wt, axis=1))[:, :kmax] ** 2 + 1e-12)
        floor = uniform_filter1d(P, 31, axis=1)
        frame_tot = 10 * np.log10((10 ** (P / 10)).sum(1, keepdims=True))
        PK[a:b] = ((P - floor > 20) & (P > frame_tot - 30))[:, kmin:]
    PKd = PK | np.roll(PK, 1, 1) | np.roll(PK, -1, 1)
    found = []
    for k in range(PKd.shape[1]):
        for a, b in runs(PKd[:, k], 18):
            found.append((ft[k + kmin], a * HT / SR, (b * HT + NT) / SR))
    found.sort()
    for f, a, b in found:  # regroupe les cases voisines d'une même raie
        if lines and abs(lines[-1][0] - f) < 15 and a < lines[-1][2] and b > lines[-1][1]:
            continue
        lines.append((f, a, b))
    for f, a, b in lines[:6]:
        what = "bourdon grave fixe" if f < 200 else "sifflement fixe"
        flag("vérifier", a, f"ton pur à {f:.0f} Hz de {ts(a)} à {ts(b)} ({what} : son de synthèse, ronflette ou tonalité voulue ?)")
    if len(lines) > 6:
        warn.append(f"… et {len(lines) - 6} autres tons purs")

# ------------------------------------------------------------------ même bruitage répété à l'identique
strong = sorted([o for o in ons if o[1] > 8], key=lambda o: -o[1])[:300]
if len(strong) >= 3:
    span = int(0.3 * FPS)
    fp, keep = [], []
    for t, j, p in strong:
        if p + span >= nfr:
            continue
        v = LE[p:p + span, :20].ravel()
        v = v - v.mean()
        nv = np.linalg.norm(v)
        if nv > 0:
            fp.append(v / nv)
            keep.append((t, p))
    if len(fp) >= 3:
        Fm = np.array(fp)
        C = Fm @ Fm.T
        sos = signal.butter(4, 150, "hp", fs=SR, output="sos")
        parent = list(range(len(keep)))

        def root(a):
            while parent[a] != a:
                parent[a] = parent[parent[a]]
                a = parent[a]
            return a

        snip = {}

        def wave(q):
            if q not in snip:
                s = int(keep[q][0] * SR) - 480
                snip[q] = signal.sosfilt(sos, m[max(0, s):s + int(0.35 * SR)].astype(np.float64))
            return snip[q]

        for a_, b_ in zip(*np.where(np.triu(C, 1) > 0.97)):
            wa, wb = wave(a_), wave(b_)
            n_ = min(len(wa), len(wb))
            cc = signal.correlate(wa[:n_], wb[:n_], "full", "fft")[n_ - 1 - 480:n_ + 480]
            if cc.max() / (np.linalg.norm(wa[:n_]) * np.linalg.norm(wb[:n_]) + 1e-9) > 0.95:
                parent[root(a_)] = root(b_)
        groups = {}
        for q in range(len(keep)):
            groups.setdefault(root(q), []).append(keep[q][0])
        for g in sorted((sorted(v) for v in groups.values() if len(v) >= 3), key=lambda v: v[0]):
            flag("vérifier", g[0], f"même bruitage répété à l'identique {len(g)} fois ({', '.join(ts(t) for t in g[:5])}"
                                   f"{' …' if len(g) > 5 else ''}) : varier hauteur, timbre ou prise")

# ------------------------------------------------------------------ boucle qui revient (même passage de fond deux fois)
k10 = nfr // 10
if k10 > 300:
    F = LE[:k10 * 10, :20].reshape(k10, 10, 20).mean(1)
    F = F - uniform_filter1d(F, 9, axis=0)  # garde le grain fin : deux souffles qui pulsent pareil ne sont pas une boucle
    seg_n = 75  # 4 s
    T = len(F)
    nfft = int(2 ** np.ceil(np.log2(T + seg_n)))
    Ff = np.fft.rfft(F, nfft, axis=0)
    c1 = np.concatenate((np.zeros((1, 20)), np.cumsum(F, 0)))
    c2 = np.concatenate((np.zeros((1, 20)), np.cumsum(F ** 2, 0)))
    P_ = np.arange(T - seg_n + 1)
    var_w = ((c2[P_ + seg_n] - c2[P_]) - (c1[P_ + seg_n] - c1[P_]) ** 2 / seg_n).sum(1)
    loops = []
    for s0 in range(0, T - seg_n, seg_n // 2):
        S = F[s0:s0 + seg_n] - F[s0:s0 + seg_n].mean(0)
        vs = (S ** 2).sum()
        if vs < seg_n * 20 * 0.5:  # passage presque immobile : rien à comparer
            continue
        Sf = np.fft.rfft(S[::-1], nfft, axis=0)
        num = np.fft.irfft((Ff * Sf).sum(1), nfft)[seg_n - 1:seg_n - 1 + len(P_)]
        cc = num / np.sqrt(var_w * vs + 1e-9)
        cc[max(0, s0 - seg_n - 19):s0 + seg_n + 19] = 0
        j = int(cc.argmax())
        if cc[j] > 0.9:
            loops.append((s0 * 10 * HOP / SR, j * 10 * HOP / SR))
    for g in merge([a for a, _ in loops], 4.5)[:4]:
        b = [q for a, q in loops if a == g[0]][0]
        flag("vérifier", g[0], f"boucle : le fond sonore de {ts(g[0])} revient à l'identique à {ts(b)} (une oreille attentive l'entend)")

# ------------------------------------------------------------------ téléphone : mono, impacts sans médium, grave inutile
win1 = SR
nw = len(m) // win1
mono_loss = 10 * np.log10((m.astype(np.float64) ** 2).mean() / ((x.astype(np.float64) ** 2).mean() + 1e-12) + 1e-12)
for j in range(nw):
    a, b = L[j * win1:(j + 1) * win1].astype(np.float64), R[j * win1:(j + 1) * win1].astype(np.float64)
    e = np.sqrt((a ** 2).sum() * (b ** 2).sum())
    if e > 0 and 10 * np.log10(((a ** 2 + b ** 2).mean() / 2) + 1e-12) > -40 and (a * b).sum() / e < -0.2:
        flag("défaut", float(j), f"phases opposées à {ts(j)} : le son disparaît en mono (téléphone, enceinte)")
        break
if mono_loss < -4.5:
    flag("vérifier", None, f"le son perd {-mono_loss:.1f} dB en mono : stéréo trop large pour un téléphone")
thin = [t for t, j, p in ons if j > 12 and E[p:p + 28, 1:].sum() < 0.2 * E[p:p + 28].sum()]
for g in merge(thin, 0.5)[:4]:
    flag("vérifier", g[0], f"impact à {ts(g[0])} presque tout sous 250 Hz : inaudible sur un téléphone (ajouter un claquement dans le médium)")
f_w, P_w = signal.welch(m[::2].astype(np.float64), SR / 2, nperseg=16384)
sub = P_w[f_w < 30].sum() / (P_w.sum() + 1e-20)
if sub > 0.1:
    flag("vérifier", None, f"{sub * 100:.0f} % de l'énergie sous 30 Hz : inaudible, mange la marge (couper sous 30 Hz)")

# ------------------------------------------------------------------ spectrogramme
os.makedirs(os.path.join(ROOT, "output", "verif"), exist_ok=True)
img_path = os.path.join(ROOT, "output", "verif", f"{name}-son.png")
cols = int(min(1800, max(400, dur * 40)))
NS = 2048
pos = np.linspace(0, max(0, len(m) - NS), cols).astype(int)
fq = np.fft.rfftfreq(NS, 1 / SR)
rows = 260
fr_edges = np.geomspace(30, 20000, rows + 1)
lo_i = np.clip(np.searchsorted(fq, fr_edges[:-1]), 0, len(fq) - 1)
ws = np.hanning(NS).astype(np.float32)
spec_img = np.zeros((rows, cols), np.float32)
for a in range(0, cols, 400):
    b = min(cols, a + 400)
    idx = pos[a:b, None] + np.arange(NS)[None, :]
    Pw = (np.abs(np.fft.rfft(m[idx] * ws, axis=1)) / (NS / 4)) ** 2
    spec_img[:, a:b] = np.maximum.reduceat(Pw, lo_i, axis=1).T
db = 10 * np.log10(spec_img + 1e-14)
v = np.clip((db + 90) / 90, 0, 1)[::-1]
anchors = np.array([[0, 0, 4], [59, 15, 112], [140, 41, 129], [222, 73, 104], [254, 159, 109], [252, 253, 191]], np.float32)
pos_a = np.linspace(0, 1, len(anchors))
rgb = np.stack([np.interp(v, pos_a, anchors[:, c]) for c in range(3)], -1).astype(np.uint8)
LM, TOP, SH, LH, BOT = 64, 30, rows, 110, 24
im = Image.new("RGB", (LM + cols + 12, TOP + SH + LH + BOT), (14, 12, 10))
im.paste(Image.fromarray(rgb), (LM, TOP))
dr = ImageDraw.Draw(im)
try:
    fnt = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
except OSError:
    fnt = ImageFont.load_default()
X = lambda t: LM + int(t / dur * (cols - 1))
for f in (50, 100, 250, 500, 1000, 2500, 5000, 10000, 20000):
    y = TOP + SH - 1 - int(np.log(f / 30) / np.log(20000 / 30) * (SH - 1))
    dr.line([(LM - 4, y), (LM, y)], fill=(160, 150, 140))
    dr.text((4, y - 7), f"{f // 1000} kHz" if f >= 1000 else f"{f} Hz", fill=(160, 150, 140), font=fnt)
# niveau à court terme
y0 = TOP + SH + 8
for dbl in (0, -12, -24, -36, -48):
    y = y0 + int(-dbl / 60 * (LH - 16))
    dr.line([(LM, y), (LM + cols, y)], fill=(40, 36, 32))
    dr.text((8, y - 7), f"{dbl} dB", fill=(110, 100, 90), font=fnt)
half = int(0.2 * SR)
pts = []
for c_, p in enumerate(pos):
    s = p + NS // 2
    lv = 10 * np.log10((m[max(0, s - half):s + half].astype(np.float64) ** 2).mean() + 1e-12)
    pts.append((LM + c_, y0 + int(min(60, -lv) / 60 * (LH - 16))))
dr.line(pts, fill=(233, 200, 140), width=1)
for t, k in exp_ev:
    dr.line([(X(t), TOP), (X(t), TOP + SH + LH)], fill=(80, 170, 230), width=1)
    dr.text((X(t) + 2, TOP + 2), {"impact": "I", "filé": "F", "flash": "Fl"}[k], fill=(120, 200, 250), font=fnt)
for t, lev in marks:
    col = (240, 60, 50) if lev == "défaut" else (240, 170, 40)
    xx = X(min(t, dur))
    dr.polygon([(xx - 5, TOP + SH + LH - 2), (xx + 5, TOP + SH + LH - 2), (xx, TOP + SH + LH - 12)], fill=col)
step = 5 if dur <= 90 else (10 if dur <= 240 else 30)
for t in np.arange(0, dur, step):
    dr.line([(X(t), TOP + SH + LH), (X(t), TOP + SH + LH + 4)], fill=(160, 150, 140))
    dr.text((X(t) + 2, TOP + SH + LH + 6), f"{int(t // 60)}:{int(t % 60):02d}", fill=(160, 150, 140), font=fnt)
dr.text((LM, 8), f"{name} · {dur:.1f} s · {lufs} LUFS · crête {peak} dBTP · bleu : repères de la timeline · "
                 "orange : à vérifier · rouge : défaut", fill=(233, 220, 192), font=fnt)
im.save(img_path)

# ------------------------------------------------------------------ rapport
summary = (f"son : {lufs} LUFS, crête {peak} dBTP, dynamique {lra} LU, mono {mono_loss:+.1f} dB, "
           f"{len(ons)} attaques, {len(lines)} ton(s) pur(s)")
if opt.get("json"):
    print(json.dumps({"summary": summary, "bad": bad, "warn": warn, "info": info, "image": img_path}, ensure_ascii=False))
else:
    print(f"{name} : {summary}")
    for line in info:
        print("  " + line)
    for b in bad:
        print("  DÉFAUT     " + b)
    for w in warn:
        print("  À VÉRIFIER " + w)
    if not bad and not warn:
        print("  rien à signaler")
    print(f"  spectrogramme : {img_path}")
sys.exit(1 if bad else 0)
