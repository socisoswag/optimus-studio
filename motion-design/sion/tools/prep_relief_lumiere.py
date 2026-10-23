"""Textures d'accompagnement du relief éclairé (data/relief/<zone>-x.png), pour les cartes en relief :

    python3 tools/prep_relief_lumiere.py [dossier de cache des tuiles]

Mêmes zones, même mosaïque d'altitudes et même cadrage que tools/prep_partage.py (section 7), donc mêmes
dimensions que data/relief/<zone>.png. Deux canaux :
  rouge : un second éclairage, rasant (soleil bas à l'ouest-nord-ouest, ombres longues), toujours venu du haut à
          gauche comme l'éclairage principal pour ne jamais inverser le relief, vers lequel la lumière glisse ;
  vert  : le creux des vallées (altitude sous la moyenne des environs, sur 4 km), pour y poser de la brume.
Altitudes : SRTM / NASA via les tuiles « terrarium » d'AWS (domaine public).
"""
import math
import os
import sys
import time
import urllib.request

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "output", "dem")
os.makedirs(CACHE, exist_ok=True)
OUT = os.path.join(ROOT, "data", "relief")
# zone : (zoom, lon0, lat0, lon1, lat1, exagération), comme tools/prep_partage.py
AREAS_DEM = {"base": (10, 34.15, 29.40, 36.0, 33.40, 2.6), "nord": (12, 35.08, 32.50, 35.40, 32.76, 1.8), "sud": (12, 34.58, 31.62, 34.90, 31.88, 1.8),
             "jaffa": (12, 34.66, 31.96, 34.86, 32.14, 1.8), "jer": (12, 35.08, 31.62, 35.36, 31.88, 1.8)}


def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 200:
        return path
    req = urllib.request.Request(url, headers={"User-Agent": "SionDocResearch/1.0"})
    for k in range(4):
        try:
            with urllib.request.urlopen(req, timeout=240) as r, open(path, "wb") as f:
                f.write(r.read())
            return path
        except Exception:
            time.sleep(2 + 3 * k)
    raise SystemExit(f"échec du téléchargement : {url}")


def tile(lon, lat, z):
    n = 2 ** z
    return int((lon + 180) / 360 * n), int((1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n)


for k, (z, lo0, la0, lo1, la1, exag) in AREAS_DEM.items():
    (x0, y0), (x1, y1) = tile(lo0, la1, z), tile(lo1, la0, z)
    rowsd = []
    for y in range(y0, y1 + 1):
        row = []
        for x in range(x0, x1 + 1):
            p = fetch(f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png", os.path.join(CACHE, f"{z}_{x}_{y}.png"))
            row.append(np.asarray(Image.open(p).convert("RGB")).astype(np.float64))
        rowsd.append(np.concatenate(row, 1))
    a = np.concatenate(rowsd, 0)
    e = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    n = 256 * 2 ** z
    bb = [(x0 * 256 / n) * 2 * math.pi - math.pi, math.pi - ((y1 + 1) * 256 / n) * 2 * math.pi]
    lat_c = math.degrees(2 * math.atan(math.exp((bb[1] + (math.pi - (y0 * 256 / n) * 2 * math.pi)) / 2)) - math.pi / 2)
    px = 40075016.686 / n * math.cos(math.radians(lat_c))
    e = cv2.GaussianBlur(e, (0, 0), 0.7)
    gy, gx = np.gradient(e, px)
    gx, gy = gx * exag, gy * exag
    slope, aspect = np.arctan(np.hypot(gx, gy)), np.arctan2(-gx, gy)
    lam = lambda az, alt: np.clip(math.cos(math.radians(alt)) * np.sin(slope) * np.cos(math.radians(az) - aspect) + math.sin(math.radians(alt)) * np.cos(slope), 0, 1)
    # lumière rasante (soleil bas), un peu de lumière du ciel pour ne pas boucher les versants à l'ombre
    Lr = 0.85 * lam(298, 12) + 0.15 * lam(330, 45)
    flat = 0.85 * math.sin(math.radians(12)) + 0.15 * math.sin(math.radians(45))
    kk = max(3, int(round(2500 / px))) | 1
    local = np.tanh((e - cv2.GaussianBlur(e, (0, 0), kk / 2)) / 120.0)
    light = np.clip(0.42 + (Lr - flat) * 1.8 + local * 0.14, 0, 1)
    # creux des vallées : sous la moyenne des environs (4 km), adouci
    k4 = max(3, int(round(4000 / px)))
    valley = np.clip((-(e - cv2.GaussianBlur(e, (0, 0), k4)) - 40.0) / 220.0, 0, 1)
    valley = cv2.GaussianBlur(valley, (0, 0), max(1.0, 600 / px))
    rgb = np.dstack([light, valley, np.zeros_like(light)])
    Image.fromarray((rgb * 255).round().astype(np.uint8)).save(os.path.join(OUT, f"{k}-x.png"), optimize=True)
    ref = Image.open(os.path.join(OUT, f"{k}.png")).size
    print(k, rgb.shape[1], "x", rgb.shape[0], "(texture principale :", ref[0], "x", ref[1], ")")
