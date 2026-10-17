"""Prépare data/ocha.js à partir de deux jeux de données de l'OCHA publiés sur HDX
(data.humdata.org) : les zones des accords d'Oslo en Cisjordanie (source : Autorité palestinienne,
ministère du Plan) et le tracé du mur de séparation (janvier 2018, CC BY).

    python3 tools/prep_ocha.py dossier/OsloAgreement.shp dossier/Barrier_Jan2018.shp

Écrit des territoires de plus pour les zones (`zones` des timelines) :
  oslo-ab (zones A et B, sous administration palestinienne), oslo-c (zone C, contrôle israélien),
  oslo-reserve (réserves naturelles de Wye River), jerusalem-est-annexee (limite municipale déclarée
  par Israël à Jérusalem-Est), hebron-h2 ;
et window.MUR : le tracé du mur, une liste de lignes par état (construit, en construction, prévu).
Nécessite pyshp, pyproj et shapely.
"""
import json
import os
import sys

import pyproj
import shapefile
from shapely.geometry import LineString, MultiLineString, shape
from shapely.ops import linemerge, transform, unary_union

OSLO, MUR = sys.argv[1], sys.argv[2]
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "ocha.js")
TOL = 0.0006  # simplification ≈ 60 m, invisible à l'écran

CLASSES = {"A": "oslo-ab", "C": "oslo-c", "Nature Reserve": "oslo-reserve",
           "Israeli Declared East Jerusalem": "jerusalem-est-annexee", "H2": "hebron-h2"}


def rings(geom):
    out = []
    for p in getattr(geom, "geoms", [geom]):
        if p.area < 2e-6:  # moins de 2 hectares environ : invisible
            continue
        for r in [p.exterior, *p.interiors]:
            out.append([[round(x, 4), round(y, 4)] for x, y in r.coords])
    return out


zones = {}
r = shapefile.Reader(OSLO)
groups = {}
for sh, rec in zip(r.shapes(), r.records()):
    name = CLASSES.get(rec[1])
    if name:
        groups.setdefault(name, []).append(shape(sh.__geo_interface__).buffer(0))
for name, gs in groups.items():
    zones[name] = rings(unary_union(gs).simplify(TOL, preserve_topology=True))

utm = pyproj.Transformer.from_crs("EPSG:32636", "EPSG:4326", always_xy=True).transform
STATUS = {"Constructed": "construit", "Under Construction": "en construction", "Projected": "prevu"}
lines = {}
b = shapefile.Reader(MUR)
fields = [f[0] for f in b.fields[1:]]
for sh, rec in zip(b.shapes(), b.records()):
    st = STATUS.get(dict(zip(fields, rec))["Status"])
    if st and len(sh.points) > 1:
        lines.setdefault(st, []).append(transform(utm, LineString(sh.points)))
mur = {}
for st, ls in lines.items():
    m = linemerge(MultiLineString(ls))
    mur[st] = [[[round(x, 4), round(y, 4)] for x, y in l.simplify(TOL / 2).coords] for l in getattr(m, "geoms", [m])]

with open(OUT, "w", encoding="utf-8") as f:
    f.write("/* OCHA (HDX) : zones d'Oslo en Cisjordanie (Autorité palestinienne, ministère du Plan) et tracé du mur\n"
            "   de séparation, janvier 2018 (CC BY). Voir tools/prep_ocha.py. */\n")
    f.write("Object.assign(window.TERRITOIRES, " + json.dumps(zones, separators=(",", ":")) + ");\n")
    f.write("window.MUR = " + json.dumps(mur, separators=(",", ":")) + ";\n")
print({k: sum(len(x) for x in v) for k, v in zones.items()}, {k: len(v) for k, v in mur.items()}, os.path.getsize(OUT) // 1024, "Ko")
