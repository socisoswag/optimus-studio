"""Répare un plan déjà rendu dont la source à 30 (ou 29,97) i/s est passée à 25 par fps=25 : une image sur six
était jetée, d'où un à-coup cinq fois par seconde (une saccade sur tout mouvement). Sans retourner à la source :

    python3 tools/recadence.py output/plans-reels/x.mp4 [autres…]          (remplacé sur place)
    python3 tools/recadence.py --essai output/plans-reels/x.mp4            (mesure seule)

1. Écart image à image (image floutée, pour ne pas compter le grain), rapporté à sa médiane locale : là où une image
   manque, l'écart double. Les coupes (écart très fort) séparent les morceaux, chacun refait à part.
2. Dans chaque morceau, les images sautées suivent la règle de fps=25 (image k du plan = image round(k × 1,2) de la
   source), à un décalage près : on garde le décalage qui tombe sur les écarts forts. Un morceau sans à-coup net
   (plan fixe, morceau venu d'une source à 25 i/s) n'est pas touché.
3. Chaque image reprend son instant d'origine, puis les images à 25 i/s sont recalculées par compensation de
   mouvement (minterpolate) : même durée, même vitesse, plus d'image manquante. Le plan n'est remplacé que si
   l'à-coup mesuré baisse nettement.
"""
import os
import subprocess
import sys

import numpy as np
from scipy.ndimage import gaussian_filter, median_filter

W, H = 320, 180
CADENCES = (30.0, 30000 / 1001)  # sources possibles : 30 i/s et 29,97 (à 29,97, les sauts se décalent peu à peu)


def ecarts(f):
    p = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-i", f, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
                         stdout=subprocess.PIPE)
    prev, d = None, []
    while True:
        b = p.stdout.read(W * H)
        if len(b) < W * H:
            break
        g = gaussian_filter(np.frombuffer(b, np.uint8).reshape(H, W).astype(np.float32), 1.5)
        if prev is not None:
            d.append(np.abs(g - prev).mean())
        prev = g
    p.wait()
    d = np.array(d)
    return d / (median_filter(d, 11, mode="nearest") + 1e-3)


def sautes(n, c, r):
    """Positions i (écart entre l'image i et i+1) où fps=25 a jeté une image, pour un morceau de n images décalé de c,
    source à r × 25 i/s."""
    k = np.arange(n + 1)
    s = np.round((k + c) * r) - np.round(c * r)
    return np.where(np.diff(s) == 2)[0]


def morceaux(x):
    coupe = [i + 1 for i in range(len(x)) if x[i] > 3.0]
    bornes = [0] + [b for b in coupe if b > 0] + [len(x) + 1]
    return [(a, b) for a, b in zip(bornes[:-1], bornes[1:]) if b - a > 0]


def plan(x):
    """[(début, fin, (décalage, rapport) ou None, excès)] : None = morceau laissé tel quel."""
    res = []
    for a, b in morceaux(x):
        seg = np.clip(x[a:b - 1], 0, 2.6)
        if len(seg) < 15:
            res.append((a, b, None, 0.0))
            continue
        best = max(((float(seg[sautes(len(seg), c, f / 25)].mean() - np.median(seg)), (c, f / 25))
                    for c in np.arange(0, 5, 0.2) for f in CADENCES))
        res.append((a, b, best[1] if best[0] >= 0.3 else None, round(best[0], 2)))
    return res


def expression(pl):
    """setpts : chaque image à son instant d'origine dans la source (en s), morceau par morceau."""
    e = "N/25"
    for a, b, cr, _ in reversed(pl):
        if cr is None:
            continue
        c, r = cr
        f = f"({a}/25+(round((N-{a}+{c:.1f})*{r:.6f})-{round(c * r)})/{25 * r:.6f})"
        e = f"if(between(N,{a},{b - 1}),{f},{e})"
    return e


def mesure(x):
    pl = plan(x)
    return [p for p in pl if p[2] is not None], pl


def main():
    args = sys.argv[1:]
    essai = "--essai" in args
    for f in [a for a in args if a != "--essai"]:
        x = ecarts(f)
        faits, pl = mesure(x)
        print(f"{os.path.basename(f)} : {len(pl)} morceau(x), à-coups dans {len(faits)} : "
              + ", ".join(f"{a}-{b} (+{e})" for a, b, c, e in pl), flush=True)
        if essai or not faits:
            continue
        tmp = f + ".recadence.mp4"
        subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", f, "-an", "-vf",
                        f"setpts='({expression(pl)})/TB',minterpolate=fps=25:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,"
                        "format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-tune", "film",
                        "-movflags", "+faststart", tmp], check=True)
        apres = [e for *_, e in plan(ecarts(tmp)) if e]
        avant = [e for *_, e in faits]
        if max(apres or [0]) < 0.6 * max(avant):
            os.replace(tmp, f)
            print(f"  refait : à-coup {max(avant):.2f} → {max(apres or [0]):.2f}", flush=True)
        else:
            os.remove(tmp)
            print(f"  gardé tel quel : à-coup {max(avant):.2f} → {max(apres or [0]):.2f}", flush=True)


if __name__ == "__main__":
    main()
