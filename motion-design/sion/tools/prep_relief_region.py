"""Relief au-delà de la Palestine : textures d'ombrage de la région et du monde, pour les cartes en relief
(data/relief/<zone>.png, <zone>-x.png et data/relief-plus.js).

    python3 tools/prep_relief_region.py [dossier de cache des tuiles] [zone ...]

Sans zone, toutes les zones sont refaites ; avec des zones, seules celles-là, et data/relief-plus.js garde les autres.

Même méthode que tools/prep_partage.py (section 7) et tools/prep_relief_lumiere.py : altitudes SRTM / NASA
(tuiles « terrarium » d'AWS, domaine public), ombrage multidirectionnel au nord-ouest et relief local ; canal
rouge : lumière rasante ; canal vert : creux des vallées. Chaque texture est ramenée au ton de la texture de base
(moyenne et contraste mesurés là où elles se recouvrent) pour qu'on ne voie aucun raccord.
Zones : monde (Europe, Méditerranée, Proche-Orient), region (Égypte, Liban, Syrie, Jordanie, Irak, nord de l'Arabie),
sinai (Sinaï et canal de Suez, aussi fin que la base), liban (Liban, Beyrouth, Bekaa), est (plateau de Jordanie,
Amman, Golan, Damas) ; puis, pour les cartes hors du Proche-Orient : europe (de l'Atlantique à la mer Noire et à
l'Anatolie), orient (Irak, golfe Persique, nord de l'Arabie), usa (les États-Unis), et des textures fines pour les plans
serrés sur une ville : Londres, Paris, La Haye, les Alpes de Genève, Bâle et Turin, Munich, Berlin, Vienne, Istanbul,
la côte est américaine (Washington, Philadelphie, Pittsburgh) et New York.
"""
import json
import math
import os
import sys
import time
import urllib.request

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARGS = sys.argv[1:]
OUT = os.path.join(ROOT, "data", "relief")
# zone : (zoom, lon0, lat0, lon1, lat1, exagération)
ZONES = {"monde": (5, -12.0, 24.0, 52.0, 61.0, 9.0), "region": (8, 26.0, 27.0, 42.0, 37.0, 4.2),
         "sinai": (10, 31.4, 29.3, 34.4, 31.7, 2.6), "liban": (11, 35.0, 33.0, 36.0, 34.1, 2.0),
         "est": (10, 35.85, 29.3, 37.2, 34.2, 2.6),
         "usa": (6, -125.0, 24.0, -66.0, 50.0, 7.0), "europe": (7, -10.0, 36.0, 33.0, 57.0, 5.5),
         "orient": (7, 38.0, 24.0, 53.0, 38.0, 5.5),
         "usa-est": (9, -80.8, 38.2, -72.8, 41.6, 3.4), "newyork": (10, -74.5, 40.3, -73.4, 41.1, 2.6),
         "londres": (9, -1.4, 50.8, 1.2, 52.2, 3.4), "paris": (9, 1.1, 48.1, 3.6, 49.6, 3.4),
         "lahaye": (9, 3.2, 51.4, 5.6, 52.8, 3.4), "alpes": (9, 5.4, 44.4, 8.8, 48.2, 2.4),
         "munich": (9, 10.4, 47.4, 12.8, 48.9, 2.8), "berlin": (9, 12.2, 51.8, 14.6, 53.2, 3.4),
         "vienne": (9, 15.2, 47.6, 17.6, 48.9, 2.8), "istanbul": (9, 27.8, 40.4, 30.2, 41.6, 2.8)}
# texture dont chaque zone prend le ton (là où elles se recouvrent) ; par défaut la base de la Palestine
REF = {"europe": "monde", "orient": "region", "usa-est": "usa", "newyork": "usa-est", "londres": "europe", "paris": "europe",
       "lahaye": "europe", "alpes": "europe", "munich": "europe", "berlin": "europe", "vienne": "europe", "istanbul": "europe"}
CHOIX = [a for a in ARGS if a in ZONES] or list(ZONES)
CACHE = next((a for a in ARGS if a not in ZONES), os.path.join(ROOT, "output", "dem"))
os.makedirs(CACHE, exist_ok=True)


def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 200:
        return path
    req = urllib.request.Request(url, headers={"User-Agent": "SionDocResearch/1.0"})
    for k in range(5):
        try:
            with urllib.request.urlopen(req, timeout=240) as r, open(path + ".part", "wb") as f:
                f.write(r.read())
            os.replace(path + ".part", path)
            return path
        except Exception:
            time.sleep(2 + 3 * k)
    raise SystemExit(f"échec du téléchargement : {url}")


def tile(lon, lat, z):
    n = 2 ** z
    return int((lon + 180) / 360 * n), int((1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n)


def ombrage(z, lo0, la0, lo1, la1, exag):
    (x0, y0), (x1, y1) = tile(lo0, la1, z), tile(lo1, la0, z)
    rows = []
    for y in range(y0, y1 + 1):
        row = []
        for x in range(x0, x1 + 1):
            p = fetch(f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png", os.path.join(CACHE, f"{z}_{x}_{y}.png"))
            row.append(np.asarray(Image.open(p).convert("RGB")).astype(np.float64))
        rows.append(np.concatenate(row, 1))
    a = np.concatenate(rows, 0)
    e = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    n = 256 * 2 ** z
    bb = [(x0 * 256 / n) * 2 * math.pi - math.pi, math.pi - ((y1 + 1) * 256 / n) * 2 * math.pi,
          ((x1 + 1) * 256 / n) * 2 * math.pi - math.pi, math.pi - (y0 * 256 / n) * 2 * math.pi]
    # taille d'un pixel au sol, ligne par ligne (Mercator : elle change avec la latitude sur une grande zone)
    lat_rows = np.degrees(2 * np.arctan(np.exp(bb[3] - (np.arange(e.shape[0]) + 0.5) / e.shape[0] * (bb[3] - bb[1]))) - np.pi / 2)
    px_rows = 40075016.686 / n * np.cos(np.radians(lat_rows))
    px = float(np.median(px_rows))
    e = cv2.GaussianBlur(e, (0, 0), 0.7)
    gy, gx = np.gradient(e)
    gx, gy = gx / px_rows[:, None] * exag, gy / px_rows[:, None] * exag
    slope, aspect = np.arctan(np.hypot(gx, gy)), np.arctan2(-gx, gy)
    lam = lambda az, alt: np.clip(math.cos(math.radians(alt)) * np.sin(slope) * np.cos(math.radians(az) - aspect) + math.sin(math.radians(alt)) * np.cos(slope), 0, 1)
    Lm = 0.62 * lam(315, 32) + 0.24 * lam(270, 40) + 0.14 * lam(360, 45)
    flat = 0.62 * math.sin(math.radians(32)) + 0.24 * math.sin(math.radians(40)) + 0.14 * math.sin(math.radians(45))
    kk = max(3, int(round(2500 / px))) | 1
    local = np.tanh((e - cv2.GaussianBlur(e, (0, 0), kk / 2)) / 120.0)
    base = np.clip(0.46 + (Lm - flat) * 0.95 + local * 0.10, 0, 1)
    Lr = 0.85 * lam(298, 12) + 0.15 * lam(330, 45)
    flr = 0.85 * math.sin(math.radians(12)) + 0.15 * math.sin(math.radians(45))
    light = np.clip(0.42 + (Lr - flr) * 1.8 + local * 0.14, 0, 1)
    k4 = max(3, int(round(4000 / px)))
    valley = np.clip((-(e - cv2.GaussianBlur(e, (0, 0), k4)) - 40.0) / 220.0, 0, 1)
    valley = cv2.GaussianBlur(valley, (0, 0), max(1.0, 600 / px))
    return base, light, valley, bb, e


def charge(k):
    src = open(os.path.join(ROOT, "data", "partage.js"), encoding="utf-8").read()
    m = json.loads(src[src.index("=", src.index("window.PARTAGE")) + 1:].strip().rstrip(";"))["relief"][k]
    return np.asarray(Image.open(os.path.join(ROOT, m["src"]))).astype(np.float64) / 255, m["bbox"]


def accorde(v, bb, ref, rbb):
    """Gain et décalage qui ramènent v au ton de la texture de référence, mesurés sur leur partie commune."""
    X0, Y0, X1, Y1 = max(bb[0], rbb[0]), max(bb[1], rbb[1]), min(bb[2], rbb[2]), min(bb[3], rbb[3])
    if X1 <= X0 or Y1 <= Y0:
        return 1.0, 0.0
    cut = lambda img, b: img[int((b[3] - Y1) / (b[3] - b[1]) * img.shape[0]):int((b[3] - Y0) / (b[3] - b[1]) * img.shape[0]),
                             int((X0 - b[0]) / (b[2] - b[0]) * img.shape[1]):int((X1 - b[0]) / (b[2] - b[0]) * img.shape[1])]
    a, r = cut(v, bb), cut(ref, rbb)
    r = cv2.resize(r, (a.shape[1], a.shape[0]), interpolation=cv2.INTER_AREA)
    # le contraste dépend de la finesse : on compare à la référence ramenée à la même finesse
    g = r.std() / max(a.std(), 1e-6)
    return g, r.mean() - g * a.mean()


def texture(k):
    """Texture de ton déjà faite (data/relief/<k>.png) et son cadre, pour accorder une zone voisine."""
    if k not in PLUS:
        return charge("base")
    return np.asarray(Image.open(os.path.join(ROOT, PLUS[k]["src"]))).astype(np.float64) / 255, PLUS[k]["bbox"]


src = open(os.path.join(ROOT, "data", "relief-plus.js"), encoding="utf-8").read()
PLUS = json.loads(src[src.index("=", src.index("window.RELIEF_PLUS")) + 1:].strip().rstrip(";"))
for k in CHOIX:
    z, lo0, la0, lo1, la1, exag = ZONES[k]
    base, light, valley, bb, e = ombrage(z, lo0, la0, lo1, la1, exag)
    ref, rbb = texture(REF.get(k, "base"))
    g, o = accorde(base, bb, ref, rbb)
    if not 0.6 <= g <= 1.8:  # recouvrement trop petit : pas d'accord de ton
        g, o = 1.0, 0.0
    base = np.clip(g * base + o, 0, 1)
    light = np.clip(g * light + o, 0, 1)
    # la mer reste plate (fond marin à peine visible : la carte la masque, mais pas de reliefs sous-marins aux côtes)
    mer = cv2.GaussianBlur((e < -2).astype(np.float64), (0, 0), 1.2)
    base = base * (1 - mer) + np.median(base) * mer
    light = light * (1 - mer) + np.median(light) * mer
    valley = valley * (1 - mer)
    Image.fromarray((base * 255).round().astype(np.uint8)).save(os.path.join(OUT, f"{k}.png"), optimize=True)
    Image.fromarray((np.dstack([light, valley, np.zeros_like(light)]) * 255).round().astype(np.uint8)).save(os.path.join(OUT, f"{k}-x.png"), optimize=True)
    PLUS[k] = {"src": f"data/relief/{k}.png", "bbox": [round(v, 8) for v in bb], "w": base.shape[1], "h": base.shape[0]}
    print(k, base.shape[1], "x", base.shape[0], f"gain {g:.2f}", f"{os.path.getsize(os.path.join(OUT, k + '.png')) / 1e6:.1f} Mo")

js = ("/* Relief au-delà de la Palestine (tools/prep_relief_region.py) : altitudes SRTM / NASA, tuiles terrarium d'AWS\n"
      " * (domaine public). Textures plus larges et moins fines que data/partage.js (relief), utilisées là où la base\n"
      " * ne va pas : Égypte, Sinaï, Liban, Syrie, Jordanie, Irak, Europe et Méditerranée, États-Unis ; textures fines\n"
      " * pour les plans serrés sur quelques villes d'Europe et d'Amérique. */\n"
      f"window.RELIEF_PLUS = {json.dumps({k: PLUS[k] for k in ZONES if k in PLUS})};\n")
open(os.path.join(ROOT, "data", "relief-plus.js"), "w", encoding="utf-8").write(js)
print("data/relief-plus.js")
