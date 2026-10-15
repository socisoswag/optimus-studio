"""Prépare data/map.js à partir de Natural Earth (domaine public).

Usage : python3 tools/prep_map.py <dossier_geojson_natural_earth>

Volontairement, aucune frontière politique n'est tracée : seulement les
côtes, les fleuves, les lacs et une trame de points sur les terres.
"""
import json
import sys
from pathlib import Path

from shapely.geometry import box, shape, Point, mapping
from shapely.ops import unary_union
from shapely.prepared import prep

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / "data" / "map.js"

# Zones où l'on zoome fort : données 1:10 M. Ailleurs : 1:50 M.
HI_ZONES = [
    box(-12, 10, 56, 66),   # Europe, Méditerranée, Afrique du Nord, Proche-Orient, Yémen
    box(-80, 36, -72, 42),  # Maryland / Washington (Camp David)
]
HI = unary_union(HI_ZONES)
LEVANT = box(33.6, 29.2, 36.9, 33.8)


def load(name):
    return json.loads((SRC / f"{name}.geojson").read_text())["features"]


def lines_of(geom):
    if geom.is_empty:
        return []
    t = geom.geom_type
    if t == "LineString":
        return [geom]
    if t == "LinearRing":
        return [geom]
    if t in ("MultiLineString", "GeometryCollection"):
        out = []
        for g in geom.geoms:
            out += lines_of(g)
        return out
    if t == "Polygon":
        return [geom.exterior, *geom.interiors]
    if t == "MultiPolygon":
        out = []
        for g in geom.geoms:
            out += lines_of(g)
        return out
    return []


def polys_of(geom):
    if geom.is_empty:
        return []
    if geom.geom_type == "Polygon":
        return [geom]
    if geom.geom_type in ("MultiPolygon", "GeometryCollection"):
        out = []
        for g in geom.geoms:
            out += polys_of(g)
        return out
    return []


def q(coords, k=1000):
    flat = []
    for x, y in coords:
        flat += [round(x * k), round(y * k)]
    return flat


def pack_lines(geoms, tol, k=1000, min_pts=2):
    out = []
    for g in geoms:
        for ln in lines_of(g.simplify(tol, preserve_topology=False)):
            c = list(ln.coords)
            if len(c) >= min_pts:
                out.append(q(c, k))
    return out


def pack_polys(geoms, tol, k=1000):
    out = []
    for g in geoms:
        for p in polys_of(g.simplify(tol, preserve_topology=True)):
            rings = [q(p.exterior.coords, k)] + [q(r.coords, k) for r in p.interiors]
            if len(rings[0]) >= 8:
                out.append(rings)
    return out


coast10 = [shape(f["geometry"]) for f in load("ne_10m_coastline")]
coast50 = [shape(f["geometry"]) for f in load("ne_50m_coastline")]
land10 = unary_union([shape(f["geometry"]) for f in load("ne_10m_land")])
land50 = unary_union([shape(f["geometry"]) for f in load("ne_50m_land")])

coast_hi = [g.intersection(HI) for g in coast10]
coast_lo = [g.difference(HI) for g in coast50]
land_hi = land10.intersection(HI)
land_lo = land50.difference(HI).intersection(box(-180, -58, 180, 84))

RIVERS = {"Jordan", "Nile", "Euphrates", "Tigris", "Litani", "Danube", "Rhine",
          "Seine", "Thames", "Potomac", "Volga"}
rivers = [shape(f["geometry"]) for f in load("ne_10m_rivers_lake_centerlines")
          if (f["properties"].get("name") or "") in RIVERS]
LAKES = {"Lake Geneva", "Sea of Galilee", "Lake Nasser", "Dead Sea", "Great Bitter Lake"}
lakes = [unary_union([shape(f["geometry"]) for f in load("ne_10m_lakes")
                     if (f["properties"].get("name") or "") in LAKES])]


def dot_grid(land, x0, y0, x1, y1, step, exclude=None, seen=None):
    """Trame de points sur les terres, calée sur une grille globale (pas de doublons)."""
    pl = prep(land)
    ex = prep(exclude) if exclude is not None else None
    out = []
    for j in range(int(round(y0 / step)), int(round(y1 / step)) + 1):
        y = j * step
        for i in range(int(round(x0 / step)), int(round(x1 / step)) + 1):
            x = i * step
            if seen is not None:
                if (i, j) in seen:
                    continue
                seen.add((i, j))
            p = Point(x, y)
            if pl.contains(p) and (ex is None or not ex.contains(p)):
                out += [round(x * 1000), round(y * 1000)]
    return out


dots_world = dot_grid(land50, -180, -56, 180, 80, 1.0)
dots_region = dot_grid(land10, -12, 10, 56, 66, 0.25)
dots_levant = dot_grid(land10, 33.6, 29.2, 36.9, 33.8, 0.05)
dots_levant2 = dot_grid(land10, 34.1, 30.9, 35.9, 33.2, 0.025)
# trame fine continue sur toute la zone de travail (pas de rectangle visible en vue moyenne)
dots_local = dot_grid(land10, -12, 10, 56, 62, 0.08)
dots_md = dot_grid(land10, -80, 36, -72, 42, 0.1)

data = {
    "coastHi": pack_lines(coast_hi, 0.004),
    "coastLo": pack_lines(coast_lo, 0.04),
    "landHi": pack_polys([land_hi], 0.006),
    "landLo": pack_polys([land_lo], 0.05),
    "rivers": pack_lines(rivers, 0.004),
    "lakes": pack_polys(lakes, 0.003),
    "dots": {
        "world": {"step": 1.0, "pts": dots_world},
        "region": {"step": 0.25, "pts": dots_region},
        "levant": {"step": 0.05, "pts": dots_levant},
        "levant2": {"step": 0.025, "pts": dots_levant2},
        "local": {"step": 0.08, "pts": dots_local},
        "md": {"step": 0.1, "pts": dots_md},
    },
}
OUT.write_text("window.MAP_DATA=" + json.dumps(data, separators=(",", ":")) + ";\n")
print(OUT, OUT.stat().st_size // 1024, "Ko")
for k in ("coastHi", "coastLo", "landHi", "landLo", "rivers", "lakes"):
    print(k, len(data[k]))
for k, v in data["dots"].items():
    print("dots", k, len(v["pts"]) // 2)
