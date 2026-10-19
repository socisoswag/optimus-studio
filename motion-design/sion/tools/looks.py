"""Looks du film (étalonnage) : tables de couleur 3D (.cube) que ffmpeg (lut3d) et Premiere (Lumetri) lisent.

Les cartes 2D sont la référence (noirs chauds, braise, crème). Les looks y ramènent tout ce qui vient d'ailleurs :

    terre            plans de jour : 3D satellite et vrais plans d'aujourd'hui (verts vers l'olive de la palette,
                     bleus vers l'encre froide, pierre ambrée, noirs chauds, hautes lumières douces)
    terre-dure       la même en plus sombre et plus contrastée (guerre, Gaza, le mur)
    archive          vraies archives filmées : noir et blanc argentique à peine chaud
    reconstitution   reconstitutions (IA) : ambre adouci, jamais confondu avec une archive

    python3 tools/looks.py                      écrit data/looks/<look>.cube
    python3 tools/looks.py appliquer <look> entree.mp4 sortie.mp4 [grain]   applique le look (+ grain, vignette)
"""
import os
import subprocess
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOSSIER = os.path.join(ROOT, "data", "looks")
N = 33

OLIVE = np.array([170, 182, 110]) / 255   # palette.life
ENCRE = np.array([124, 156, 188]) / 255   # palette.cold
CREME = np.array([233, 220, 192]) / 255   # texte du film
NOIR = np.array([0.045, 0.036, 0.030])    # noir chaud des cartes


def _hsv(rgb):
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn + 1e-9
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, d / (mx + 1e-9), mx


def _bande(h, centre, largeur):
    x = np.abs(((h - centre + 180) % 360) - 180) / largeur
    return np.clip(1 - x, 0, 1) ** 2


def _filmique(y, sombre=0.0, contraste=1.0):
    """Courbe de pellicule : médium un peu plus bas, contraste autour du gris, épaule douce (jamais de blanc dur)."""
    y = np.clip(y, 0, 1) ** (1.14 + 0.3 * sombre)
    y = 0.42 + (y - 0.42) * contraste
    y = np.clip(y, 0, None)
    return np.where(y < 0.78, y, 0.78 + 0.17 * (1 - np.exp(-(y - 0.78) / 0.17)))


def terre(rgb, sombre=0.0, contraste=1.06):
    y = rgb @ np.array([0.2126, 0.7152, 0.0722])
    h, s, v = _hsv(rgb)
    vert, bleu, chaud = _bande(h, 105, 55), _bande(h, 215, 50), _bande(h, 30, 35)
    sat = 0.72 - 0.30 * bleu - 0.18 * vert + 0.12 * chaud
    out = y[..., None] + sat[..., None] * (rgb - y[..., None])
    # verts vers l'olive de la palette, bleus vers l'encre froide (même luminosité)
    yo, ye = OLIVE @ np.array([0.2126, 0.7152, 0.0722]), ENCRE @ np.array([0.2126, 0.7152, 0.0722])
    out = out + 0.45 * (vert * s)[..., None] * (OLIVE / yo * y[..., None] - out)
    out = out + 0.35 * (bleu * s)[..., None] * (ENCRE / ye * y[..., None] - out)
    # tonalité : courbe de pellicule sur la luminosité, couleurs gardées
    y2 = out @ np.array([0.2126, 0.7152, 0.0722])
    yt = _filmique(y2, sombre, contraste)
    out = out * (yt / np.maximum(y2, 1e-4))[..., None]
    # noirs chauds, hautes lumières crème
    w_ombre, w_lum = (1 - yt) ** 3, yt ** 2.2
    out = out + w_ombre[..., None] * (NOIR - 0.02) * 0.9
    out = out * (1 - 0.12 * w_lum[..., None]) + 0.12 * w_lum[..., None] * CREME * yt[..., None] / CREME.mean()
    return np.clip(out, 0, 1)


def archive(rgb):
    y = rgb @ np.array([0.2126, 0.7152, 0.0722])
    yt = _filmique(y, 0.3, 1.12)
    teinte = (1 - yt)[..., None] * np.array([1.02, 1.0, 0.96]) + yt[..., None] * np.array([1.0, 0.975, 0.92])
    return np.clip(yt[..., None] * teinte, 0, 1)


def reconstitution(rgb):
    y = rgb @ np.array([0.2126, 0.7152, 0.0722])
    out = y[..., None] + 0.62 * (rgb - y[..., None])
    yt = _filmique(out @ np.array([0.2126, 0.7152, 0.0722]), 0.1, 0.92)
    out = out * (yt / np.maximum(out @ np.array([0.2126, 0.7152, 0.0722]), 1e-4))[..., None]
    ambre = np.array([1.04, 0.99, 0.86])
    return np.clip(out * ambre, 0, 1)


LOOKS = {
    "terre": terre,
    "terre-dure": lambda x: terre(x, sombre=0.6, contraste=1.18),
    "archive": archive,
    "reconstitution": reconstitution,
}


def ecrire(nom):
    g = np.linspace(0, 1, N)
    b, gg, r = np.meshgrid(g, g, g, indexing="ij")  # .cube : le rouge varie le plus vite
    rgb = np.stack([r, gg, b], -1).reshape(-1, 3)
    out = LOOKS[nom](rgb)
    os.makedirs(DOSSIER, exist_ok=True)
    p = os.path.join(DOSSIER, f"{nom}.cube")
    with open(p, "w") as f:
        f.write(f'TITLE "SION {nom}"\nLUT_3D_SIZE {N}\nDOMAIN_MIN 0 0 0\nDOMAIN_MAX 1 1 1\n')
        f.write("\n".join(f"{a:.6f} {c:.6f} {d:.6f}" for a, c, d in out))
        f.write("\n")
    return p


def filtre(nom, grain=4, clarte=0.5):
    """Chaîne ffmpeg : clarté (contraste local, contre la brume), look, grain de pellicule, vignette douce."""
    p = os.path.join(DOSSIER, f"{nom}.cube")
    return (f"unsharp=lx=13:ly=13:la={clarte}:cx=5:cy=5:ca=0,lut3d=file='{p}':interp=tetrahedral,"
            f"noise=c0s={grain}:c0f=t+u:c1s=0:c2s=0,vignette=angle=PI/5:mode=forward")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "appliquer":
        nom, src, dst = sys.argv[2:5]
        grain = int(sys.argv[5]) if len(sys.argv) > 5 else 4
        subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", src, "-vf", filtre(nom, grain) + ",format=yuv420p",
                        "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-tune", "film", "-c:a", "copy",
                        "-movflags", "+faststart", dst], check=True)
    else:
        for nom in LOOKS:
            print(ecrire(nom))
