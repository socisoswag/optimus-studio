"""Ajoute des territoires à data/territoires.js depuis Natural Earth (10m, domaine public).

    python3 tools/prep_territoires.py DOSSIER_NE israel-1949 palestine-mandataire

DOSSIER_NE contient ne_10m_admin_0_countries.geojson et ne_10m_admin_0_disputed_areas.geojson.
Les territoires déjà présents dans le fichier sont gardés tels quels.

  israel-1949           Israël dans les lignes d'armistice de 1949 (sans Golan, Jérusalem-Est
                        ni no man's land) : 78 % de la Palestine mandataire
  palestine-mandataire  la Palestine sous mandat britannique (Israël 1949 + Cisjordanie,
                        Jérusalem-Est et Gaza)
"""
import json
import os
import sys

from shapely.geometry import mapping, shape
from shapely.ops import unary_union

NE, KEYS = sys.argv[1], sys.argv[2:]
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "territoires.js")


def load(name):
    return json.load(open(os.path.join(NE, name), encoding="utf-8"))["features"]


countries = {f["properties"]["ADMIN"]: shape(f["geometry"]) for f in load("ne_10m_admin_0_countries.geojson")}
disputed = {f["properties"]["NAME"]: shape(f["geometry"]) for f in load("ne_10m_admin_0_disputed_areas.geojson")}

israel49 = countries["Israel"].difference(unary_union([disputed[n] for n in ("Golan Heights", "East Jerusalem", "No Man's Land (Jerusalem)", "No Man's Land (Fort Latrun)")]))
BUILD = {
    "israel-1949": israel49,
    "palestine-mandataire": unary_union([israel49, countries["Palestine"], disputed["East Jerusalem"]]).buffer(0.002).buffer(-0.002),
}


def rings(geom, tol=0.0025, min_area=0.0004):
    polys = [geom] if geom.geom_type == "Polygon" else list(geom.geoms)
    out = []
    for p in polys:
        if p.area < min_area:
            continue
        r = p.simplify(tol, preserve_topology=True).exterior.coords
        out.append([[round(x, 4), round(y, 4)] for x, y in r])
    return out


src = open(OUT, encoding="utf-8").read()
head, data = src[: src.index("{")], json.loads(src[src.index("{"): src.rindex("}") + 1])
for k in KEYS:
    data[k] = rings(BUILD[k])
    print(k, len(data[k]), "anneau(x),", sum(len(r) for r in data[k]), "points")
head = "/* Territoires (Natural Earth, domaine public) : " + ", ".join(data) + ". Voir tools/prep_territoires.py. */\nwindow.TERRITOIRES = "
open(OUT, "w", encoding="utf-8").write(head + json.dumps(data, separators=(",", ":")) + ";\n")
