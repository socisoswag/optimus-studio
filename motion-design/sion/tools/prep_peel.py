"""Plan de partage de la commission Peel (7 juillet 1937) : tracés pour la carte du chapitre 8 (data/peel-1937.js).

    python3 tools/prep_peel.py <carte.png>

Carte de départ : « Peel map pd.png » (Wikimedia Commons, domaine public, par Ynhockey, d'après la carte du rapport
de la commission royale, Cmd. 5479, 1937), téléchargée en 960 px. Géoréférencée sur 13 villes (transformation affine
en Mercator, écart donné à la fin), régions lues à la couleur, puis coupées sur les frontières réelles de la
Palestine mandataire (data/territoires.js) : la côte et les frontières viennent du fond de carte, seules les limites
intérieures viennent du plan. Tracé simplifié : on le présente comme tel à l'écran.
"""
import json
import math
import os
import sys

import cv2
import numpy as np
from shapely.geometry import Polygon, MultiPolygon, mapping
from shapely.ops import unary_union

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
im = cv2.imread(sys.argv[1])
# centres des points des villes sur la carte (pixels) et leurs vraies coordonnées
VILLES = {"Acre": ((571.0, 250.4), (35.0818, 32.9281)), "Haïfa": ((533.7, 306.4), (34.9896, 32.7940)),
          "Nazareth": ((655.7, 348.7), (35.3035, 32.6996)), "Jénine": ((657.9, 459.0), (35.3027, 32.4646)),
          "Naplouse": ((648.0, 574.8), (35.2544, 32.2211)), "Tel Aviv": ((450.0, 648.6), (34.7818, 32.0853)),
          "Ramla": ((496.1, 723.9), (34.8723, 31.9293)), "Jérusalem": ((639.5, 777.5), (35.2137, 31.7683)),
          "Bethléem": ((617.4, 813.5), (35.2003, 31.7054)), "Gaza": ((324.3, 896.4), (34.4668, 31.5017)),
          "Hébron": ((577.0, 891.0), (35.0998, 31.5326)), "Khan Younès": ((260.0, 971.8), (34.3061, 31.3461)),
          "Beersheba": ((459.1, 1001.8), (34.7913, 31.2520))}
MY = lambda la: math.log(math.tan(math.pi / 4 + math.radians(la) / 2))
P = np.array([[x, y, 1] for (x, y), _ in VILLES.values()])
L = np.array([[lo, MY(la)] for _, (lo, la) in VILLES.values()])
A, *_ = np.linalg.lstsq(P, L, rcond=None)
res = P @ A - L
inv_my = lambda y: math.degrees(2 * math.atan(math.exp(y)) - math.pi / 2)


def geo(x, y):
    lo, my = np.array([x, y, 1]) @ A
    return float(lo), inv_my(float(my))


# couleurs des régions (RVB) : État juif, État arabe, zone sous mandat
COUL = {"juif": (219, 226, 232), "arabe": (226, 230, 204), "mandat": (229, 200, 195)}
rgb = im[..., ::-1].astype(np.int32)
TER = json.loads(open(os.path.join(ROOT, "data", "territoires.js"), encoding="utf-8").read().split("=", 1)[1].strip().rstrip(";"))
pal = unary_union([Polygon(r[0], r[1:]) if isinstance(r[0][0], list) else Polygon(r) for r in TER["palestine-mandataire"]]).buffer(0)
out, aires = {}, {}
for k, c in COUL.items():
    m = (np.abs(rgb - np.array(c)).sum(-1) < 22).astype(np.uint8) * 255
    # le texte et les traits fins sont bouchés, puis on garde les grandes plages
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    polys = []
    for cnt in cs:
        if cv2.contourArea(cnt) < 600:
            continue
        cnt = cv2.approxPolyDP(cnt, 1.2, True)[:, 0, :]
        polys.append(Polygon([geo(x, y) for x, y in cnt]).buffer(0))
    out[k] = unary_union(polys)
# les limites intérieures du plan, les frontières réelles du pays : chaque région est coupée sur la Palestine mandataire,
# et l'État arabe prend ce qui reste (petits trous des traits et des lettres)
juif = out["juif"].intersection(pal)
mandat = out["mandat"].intersection(pal).difference(juif)
arabe = pal.difference(juif.buffer(0.004)).difference(mandat.buffer(0.004)).buffer(0)
R = {}
for k, g in {"peel-juif": juif, "peel-mandat": mandat, "peel-arabe": arabe}.items():
    g = g.simplify(0.003)
    gs = [g] if isinstance(g, Polygon) else [p for p in g.geoms if p.area > 2e-4]
    R[k] = [[[round(x, 4), round(y, 4)] for x, y in p.exterior.coords] for p in gs]
    # surface (km², à la latitude du pays)
    aires[k] = sum(p.area for p in gs) * 111.32 ** 2 * math.cos(math.radians(31.8))
tot = sum(aires.values())
js = ("/* Plan de partage de la commission Peel, 7 juillet 1937 (tools/prep_peel.py) : d'après « Peel map pd.png » (Wikimedia\n"
      " * Commons, domaine public), géoréférencée sur 13 villes, coupée sur les frontières de la Palestine mandataire. */\n"
      f"window.PEEL_1937 = {json.dumps(R, separators=(',', ':'))};\n"
      "window.TERRITOIRES = Object.assign(window.TERRITOIRES || {}, window.PEEL_1937);\n")
open(os.path.join(ROOT, "data", "peel-1937.js"), "w", encoding="utf-8").write(js)
ek = [math.hypot((g[0] - lo) * 94.6, (g[1] - la) * 111.2) for g, (_, (lo, la)) in ((geo(*xy), v) for xy, v in ((v[0], v) for v in VILLES.values()))]
print(f"écart des villes après géoréférencement : {np.mean(ek):.1f} km en moyenne, {max(ek):.1f} km au plus")
for k, v in aires.items():
    print(k, f"{v:,.0f} km²", f"{100 * v / tot:.1f} %", len(R[k]), "morceau(x)")
