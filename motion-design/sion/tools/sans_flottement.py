"""Retire le tremblement rapide des vidéos déjà rendues (le « flottement » de l'ancienne finition, des sauts d'un
pixel plusieurs fois par seconde, qui se lisaient comme des saccades), sans rien refaire en 3D.

    python3 tools/sans_flottement.py output/paroles.mp4 output/plans-reels/*.mp4      (fichiers remplacés sur place)
    python3 tools/sans_flottement.py --mesure output/x.mp4                              (mesure seule)

Le mouvement de l'image est mesuré d'une image à la suivante (corrélation de phase) ; la trajectoire est lissée
(gaussienne de 5 images) et seul l'écart rapide est retiré, 3 pixels au plus : les mouvements de caméra voulus, les
zooms et les secousses des impacts (bien plus amples) restent. Les coupes remettent la mesure à zéro. Le son est copié
tel quel. Un fichier n'est remplacé que si le tremblement mesuré baisse d'au moins un tiers ; sinon il reste intact.
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d

W, H = 1920, 1080
MW, MH = 960, 540  # mesure à mi-résolution (au quart, la correction n'enlevait que la moitié du tremblement)


def info(f):
    j = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate",
                                            "-of", "json", f]))
    v = next(s for s in j["streams"] if s["codec_type"] == "video")
    return v["width"], v["height"], v["r_frame_rate"], any(s["codec_type"] == "audio" for s in j["streams"])


def mesure(f, entree=None, chaine=""):
    """Déplacement (dx, dy) de chaque image par rapport à la précédente, et sa fiabilité. entree : arguments d'entrée
    ffmpeg à la place de « -i f » (une coupe : -ss, -i, -t) ; chaine : filtres à appliquer avant la mise à l'échelle."""
    p = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", *(entree or ["-i", f]), "-map", "0:v:0",
                          "-vf", f"{chaine}scale={MW}:{MH}", "-pix_fmt", "gray", "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
    win = cv2.createHanningWindow((MW, MH), cv2.CV_32F)
    prev, d = None, [(0.0, 0.0, 0.0)]
    while True:
        b = p.stdout.read(MW * MH)
        if len(b) < MW * MH:
            break
        g = np.frombuffer(b, np.uint8).reshape(MH, MW).astype(np.float32)
        if prev is not None:
            if g.std() < 2 or prev.std() < 2:  # noir, fondu au noir : rien à mesurer
                d.append((0.0, 0.0, 0.0))
            else:
                (dx, dy), r = cv2.phaseCorrelate(prev, g, win)
                d.append((dx * W / MW, dy * H / MH, r))
        prev = g
    p.wait()
    return np.array(d)


def tremblement(d):
    """Écart rapide de la trajectoire, image par image (à retirer), et son niveau moyen en pixels."""
    n = len(d)
    j = np.zeros((n, 2))
    coupe = (d[:, 2] < 0.12) | (np.abs(d[:, 0]) > 40) | (np.abs(d[:, 1]) > 40)
    bornes = [0] + [i for i in range(1, n) if coupe[i]] + [n]
    for a, b in zip(bornes[:-1], bornes[1:]):
        if b - a < 12:
            continue
        seg = d[a:b, :2].copy()
        seg[0] = 0
        fiable = d[a:b, 2] > 0.25
        seg[~fiable] = 0  # une mesure douteuse ne fabrique pas de tremblement
        traj = np.cumsum(seg, axis=0)
        lisse = gaussian_filter1d(traj, 5, axis=0, mode="nearest")
        j[a:b] = np.clip(traj - lisse, -3, 3)
    return j, float(np.sqrt((j ** 2).sum(1).mean()))


def commandes(j, chemin, marge=4):
    """Fichier sendcmd pour ffmpeg : à chaque image, la fenêtre de recadrage (crop@j, image élargie de `marge` pixels
    de chaque côté) se décale du tremblement mesuré, arrondi au pixel ; rien ne passe par Python à l'encodage."""
    lignes, avant = [], None
    for k, (dx, dy) in enumerate(j):
        x = int(np.clip(marge + round(dx), 0, 2 * marge))
        y = int(np.clip(marge + round(dy), 0, 2 * marge))
        if (x, y) != avant:
            lignes.append(f"{k / 25:.4f} crop@j x {x}, crop@j y {y};")
            avant = (x, y)
    open(chemin, "w").write("\n".join(lignes) + "\n")
    return f"setpts=PTS-STARTPTS,pad=iw+{2 * marge}:ih+{2 * marge}:{marge}:{marge},fillborders=left={marge}:right={marge}:top={marge}:bottom={marge}:mode=smear," \
           f"sendcmd=f='{chemin}',crop@j=iw-{2 * marge}:ih-{2 * marge}:{marge}:{marge}"


def tuyau(dec, enc, j, w=W, h=H):
    """Images brutes du décodeur dec, décalées de -j (sous-pixel), envoyées à l'encodeur enc (deux commandes ffmpeg)."""
    pd = subprocess.Popen(dec, stdout=subprocess.PIPE)
    pe = subprocess.Popen(enc, stdin=subprocess.PIPE)
    k, fr = 0, w * h * 3
    while True:
        b = pd.stdout.read(fr)
        if len(b) < fr:
            break
        im = np.frombuffer(b, np.uint8).reshape(h, w, 3)
        if k < len(j) and (abs(j[k, 0]) > 0.05 or abs(j[k, 1]) > 0.05):
            m = np.float32([[1, 0, -j[k, 0] * w / W], [0, 1, -j[k, 1] * h / H]])
            im = cv2.warpAffine(im, m, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        pe.stdin.write(im.tobytes())
        k += 1
    pe.stdin.close()
    pd.wait()
    if pe.wait() != 0 or pd.returncode != 0:
        raise SystemExit("décodage ou encodage raté")


def corrige(f, j):
    w, h, fps, son = info(f)
    tmp = f + ".stable.mp4"
    dec = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-i", f, "-pix_fmt", "bgr24", "-f", "rawvideo", "-"],
                           stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-nostdin", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w}x{h}",
                            "-r", fps, "-i", "-", "-i", f, "-map", "0:v", *(["-map", "1:a", "-c:a", "copy"] if son else []),
                            "-c:v", "libx264", "-preset", "faster", "-crf", "15", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                            "-shortest", tmp], stdin=subprocess.PIPE)
    k, fr = 0, w * h * 3
    while True:
        b = dec.stdout.read(fr)
        if len(b) < fr:
            break
        im = np.frombuffer(b, np.uint8).reshape(h, w, 3)
        if k < len(j) and (abs(j[k, 0]) > 0.05 or abs(j[k, 1]) > 0.05):
            m = np.float32([[1, 0, -j[k, 0] * w / W], [0, 1, -j[k, 1] * h / H]])
            im = cv2.warpAffine(im, m, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        enc.stdin.write(im.tobytes())
        k += 1
    enc.stdin.close()
    dec.wait()
    if enc.wait() != 0:
        raise SystemExit(f"encodage raté : {f}")
    return tmp


def main():
    args = sys.argv[1:]
    seul = args and args[0] == "--mesure"
    for f in args[1:] if seul else args:
        d = mesure(f)
        j, avant = tremblement(d)
        if seul or avant < 0.2:
            print(f"{f} : tremblement {avant:.2f} px" + ("" if seul else " (rien à faire)"), flush=True)
            continue
        tmp = corrige(f, j)
        _, apres = tremblement(mesure(tmp))
        if apres < avant * 0.67:
            os.replace(tmp, f)
            print(f"{f} : tremblement {avant:.2f} px -> {apres:.2f} px", flush=True)
        else:
            os.remove(tmp)
            print(f"{f} : tremblement {avant:.2f} px -> {apres:.2f} px, gardé tel quel", flush=True)


if __name__ == "__main__":
    main()
