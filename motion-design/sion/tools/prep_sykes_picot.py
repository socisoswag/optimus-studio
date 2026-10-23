"""Accord Sykes-Picot (1916) : la vraie carte signée, posée sur le relief, et ses zones (data/sykes-picot.js,
data/cartes/sykes-picot-1916.jpg).

    python3 tools/prep_sykes_picot.py <carte.jpg>

Carte : « MPK1-426 Sykes Picot Agreement Map signed 8 May 1916 », The National Archives (Royaume-Uni), MPK 1/426,
domaine public (Wikimedia Commons, version de 1920 px). Fond : Royal Geographical Society, « Map of Eastern Turkey in
Asia, Syria and Western Persia » (1910, chemins de fer de novembre 1915), projection conique ; zones coloriées à la
main, signée par Mark Sykes et François Georges-Picot.
Calage : les graduations de degrés des bords (haut, bas, gauche) donnent la projection (polyconique, ajustée par
moindres carrés : écart moyen d'environ 2 px, soit 1,6 km) ; vérifié sur Haïfa, Jérusalem, Gaza, Aqaba, Damas, Beyrouth,
Bagdad et Bassora. La carte est ensuite redressée en Mercator pour le moteur.
La zone jaune (administration internationale) est lue à la couleur et coupée sur la côte d'aujourd'hui (data/map.js) ;
le bleu (France), le rouge (Royaume-Uni), A et B restent ceux de la carte elle-même.
"""
import json
import math
import os
import sys

import cv2
import numpy as np
from pyproj import Proj
from scipy.optimize import least_squares
from shapely.geometry import Polygon
from shapely.ops import unary_union

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
im = cv2.imread(sys.argv[1])
H0, W0 = im.shape[:2]
# graduations lues sur les bords de la carte (pixels de la version de 1920 px)
TOP = {33: 65, 34: 172, 36: 378, 37: 482, 38: 585, 39: 688, 40: 791, 41: 894, 42: 998, 43: 1100, 44: 1205, 45: 1307, 46: 1412, 47: 1514, 48: 1615, 49: 1718, 50: 1820}
BOT = {36: 282, 37: 403, 38: 525, 39: 646, 40: 768, 42: 1010, 43: 1132, 44: 1253, 45: 1373, 46: 1494, 47: 1612}
LEFT = {41: 150, 40: 300, 39: 445, 38: 589, 36: 870, 35: 1013, 34: 1153, 33: 1293, 32: 1432, 31: 1570, 30: 1712}
YT, YB, XL = 44, 1824, 41
P = Proj(proj="poly", lat_0=36, lon_0=41.5, R=6371000)


def sim(p, x, y):
    s, th, tx, ty = p
    c, si = math.cos(th), math.sin(th)
    return tx + s * (c * x - si * y), ty - s * (si * x + c * y)


def res(p):
    nt, nb = len(TOP), len(BOT)
    r = []
    for (lon, X), la in zip(TOP.items(), p[4:4 + nt]):
        x, y = P(lon, la); u, v = sim(p[:4], x / 1000, y / 1000); r += [u - X, v - YT]
    for (lon, X), la in zip(BOT.items(), p[4 + nt:4 + nt + nb]):
        x, y = P(lon, la); u, v = sim(p[:4], x / 1000, y / 1000); r += [u - X, v - YB]
    for (lat, Y), lo in zip(LEFT.items(), p[4 + nt + nb:]):
        x, y = P(lo, lat); u, v = sim(p[:4], x / 1000, y / 1000); r += [u - XL, v - Y]
    return r


sol = least_squares(res, [1.0, 0.0, 900, 900] + [42.5] * len(TOP) + [29.5] * len(BOT) + [32.6] * len(LEFT))
S4 = sol.x[:4]
e = np.hypot(*np.array(res(sol.x)).reshape(-1, 2).T)
print(f"calage : écart moyen {e.mean():.1f} px, médian {np.median(e):.1f} px")


def vers_pixel(lon, lat):
    x, y = P(lon, lat)
    return sim(S4, np.asarray(x) / 1000, np.asarray(y) / 1000)


def vers_geo(u, v):
    s, th, tx, ty = S4
    c, si = math.cos(th), math.sin(th)
    a, b = (np.asarray(u) - tx) / s, -(np.asarray(v) - ty) / s
    x, y = c * a + si * b, -si * a + c * b
    return P(x * 1000, y * 1000, inverse=True)


# carte redressée en Mercator (coordonnées du moteur : longitude et y de Mercator en radians)
LO0, LA0, LO1, LA1 = 33.0, 29.6, 48.6, 41.8
MY = lambda la: math.log(math.tan(math.pi / 4 + math.radians(la) / 2))
W = 2600
X0, X1, Y0, Y1 = math.radians(LO0), math.radians(LO1), MY(LA0), MY(LA1)
H = int(round(W * (Y1 - Y0) / (X1 - X0)))
gx = np.linspace(X0, X1, W, endpoint=False) + (X1 - X0) / W / 2
gy = Y1 - (np.arange(H) + 0.5) * (Y1 - Y0) / H
LON, LAT = np.degrees(gx)[None, :].repeat(H, 0), np.degrees(2 * np.arctan(np.exp(gy)) - np.pi / 2)[:, None].repeat(W, 1)
U, V = vers_pixel(LON, LAT)
U, V = U.astype(np.float32), V.astype(np.float32)
carte = cv2.remap(im, U, V, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0))
dedans = ((U > XL + 2) & (U < W0 - 30) & (V > YT + 2) & (V < YB - 2))
carte[~dedans] = 0
# bords adoucis : la carte s'efface sur 90 px vers son cadre (le moteur rend transparent ce qui est noir)
rampe = np.clip(cv2.distanceTransform(dedans.astype(np.uint8), cv2.DIST_L2, 5) / 90.0, 0, 1)
rampe = rampe * rampe * (3 - 2 * rampe)
carte = (carte.astype(np.float32) * rampe[..., None]).astype(np.uint8)
os.makedirs(os.path.join(ROOT, "data", "cartes"), exist_ok=True)
cv2.imwrite(os.path.join(ROOT, "data", "cartes", "sykes-picot-1916.jpg"), carte, [cv2.IMWRITE_JPEG_QUALITY, 88])

# zones lues à la couleur (teinte et saturation, après lissage des écritures)
hsv = cv2.cvtColor(cv2.medianBlur(im, 9), cv2.COLOR_BGR2HSV).astype(int)
h, s_, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
# seul le jaune (la zone internationale) se lit proprement : le bleu et le rouge, passés sur les hachures du relief,
# restent ceux de la carte elle-même, montrée telle quelle
MASQ = {"sp-brun": (h >= 17) & (h <= 28) & (s_ >= 95) & (v >= 110)}
terre = []
MAP = json.loads(open(os.path.join(ROOT, "data", "map.js"), encoding="utf-8").read().split("=", 1)[1].strip().rstrip(";"))
for poly in MAP["landHi"]:
    rings = [[(r[i] / 1000, r[i + 1] / 1000) for i in range(0, len(r), 2)] for r in poly]
    if not rings or len(rings[0]) < 4:
        continue
    pg = Polygon(rings[0], [x for x in rings[1:] if len(x) >= 4]).buffer(0)
    if pg.intersects(Polygon([(LO0, LA0), (LO1, LA0), (LO1, LA1), (LO0, LA1)])):
        terre.append(pg)
terre = unary_union(terre)
cadre = Polygon(np.array(vers_geo([XL, W0 - 30, W0 - 30, XL], [YT, YT, YB, YB])).T)
R, debug = {}, im.copy()
for k, m in MASQ.items():
    m = (m & True).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    polys = []
    for c in cs:
        if cv2.contourArea(c) < 900:
            continue
        c = cv2.approxPolyDP(c, 2.0, True)[:, 0, :].astype(float)
        cv2.polylines(debug, [c.astype(np.int32)], True, (0, 0, 255) if k == "sp-rouge" else (255, 0, 0) if k == "sp-bleu" else (0, 200, 255), 3)
        lo, la = vers_geo(c[:, 0], c[:, 1])
        polys.append(Polygon(list(zip(lo, la))).buffer(0))
    g = unary_union(polys).intersection(terre).intersection(cadre).simplify(0.01)
    gs = [g] if isinstance(g, Polygon) else [p for p in getattr(g, "geoms", []) if isinstance(p, Polygon) and p.area > 0.01]
    R[k] = [[[round(x, 3), round(y, 3)] for x, y in p.exterior.coords] for p in gs]
    print(k, len(R[k]), "morceau(x),", round(sum(p.area for p in gs), 2), "degrés carrés")
cv2.imwrite(sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "output", "sykes-picot-zones.jpg"), debug)
info = {"carte": {"src": "data/cartes/sykes-picot-1916.jpg", "bbox": [round(X0, 8), round(Y0, 8), round(X1, 8), round(Y1, 8)], "w": W, "h": H}}
js = ("/* Accord Sykes-Picot, carte signée du 8 mai 1916 (The National Archives, MPK 1/426, domaine public),\n"
      " * redressée en Mercator et zones lues à la couleur : tools/prep_sykes_picot.py. */\n"
      f"window.SYKES_PICOT = {json.dumps(info)};\n"
      f"window.TERRITOIRES = Object.assign(window.TERRITOIRES || {{}}, {json.dumps(R, separators=(',', ':'))});\n")
open(os.path.join(ROOT, "data", "sykes-picot.js"), "w", encoding="utf-8").write(js)
print("carte", W, "x", H, f"{os.path.getsize(os.path.join(ROOT, 'data', 'cartes', 'sykes-picot-1916.jpg')) / 1e6:.1f} Mo")
