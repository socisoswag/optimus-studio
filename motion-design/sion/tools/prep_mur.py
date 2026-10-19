"""Tracé du mur de séparation en texture, sur la grille du relief de l'intro (data/drone/mur.png).

    python3 tools/prep_mur.py          (après tools/prep_drone.py)

Source : data/ocha.js (window.MUR), OCHA, janvier 2018 (CC BY) : tronçons construits et prévus.
Canaux : R lueur du tracé construit, G lueur du tracé prévu, B ordre le long du tracé, du nord au sud
(0 à 1), pour que la braise le parcoure.
"""
import json
import math
import os
import re

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "drone")
meta = json.load(open(os.path.join(OUT, "meta.json")))
src = open(os.path.join(ROOT, "data", "ocha.js"), encoding="utf-8").read()
MUR = json.loads(re.search(r"window\.MUR\s*=\s*(\{.*\})\s*;", src, re.S).group(1))

A = meta["albedo"]
W, H = A["w"], A["h"]
x0, y0, x1, y1 = A["ext"]
LON0, LAT0 = meta["origin"]
KX, KY = meta["kx"], meta["ky"]
NORD, SUD = 32.6, 31.3


def px(lon, lat):
    x, y = (lon - LON0) * KX, (lat - LAT0) * KY
    return (x - x0) / (x1 - x0) * W, (y1 - y) / (y1 - y0) * H


def draw(lines):
    m = np.zeros((H, W), np.uint8)
    order = np.zeros((H, W), np.float32)
    for ln in lines:
        pts = np.array([px(*p) for p in ln])
        for (a, b), (la, lb) in zip(zip(pts[:-1], pts[1:]), zip(ln[:-1], ln[1:])):
            cv2.line(m, tuple(np.round(a * 4).astype(int)), tuple(np.round(b * 4).astype(int)), 255, 1, cv2.LINE_AA, shift=2)
            v = (NORD - (la[1] + lb[1]) / 2) / (NORD - SUD)
            cv2.line(order, tuple(np.round(a * 4).astype(int)), tuple(np.round(b * 4).astype(int)), float(v), 3, cv2.LINE_8, shift=2)
    d = cv2.distanceTransform((m < 128).astype(np.uint8), cv2.DIST_L2, 5)
    return np.exp(-(d / 1.1) ** 2) * 0.85 + np.exp(-d / 3.5) * 0.15, order


r, oc = draw(MUR["construit"])
g, op = draw(MUR["prevu"])
order = np.maximum(oc, op)
# l'ordre déborde un peu autour du trait, pour que la lueur s'allume avec lui
order = cv2.dilate(order, np.ones((9, 9), np.uint8))
img = np.stack([r, g, np.clip(order, 0, 1)], -1)
Image.fromarray((img * 255).round().astype(np.uint8)).save(os.path.join(OUT, "mur.png"))
km = sum(sum(math.hypot((b[0] - a[0]) * KX, (b[1] - a[1]) * KY) for a, b in zip(l[:-1], l[1:])) for l in MUR["construit"]) / 1000
print("mur.png", W, H, f"construit dans les données : {km:.0f} km")
