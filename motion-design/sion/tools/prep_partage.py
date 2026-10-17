"""Prépare data/partage.js et data/relief/*.png pour la carte du plan de partage (1947).

    python3 tools/prep_partage.py <dossier_sources>

Le dossier de sources contient (les fichiers absents sont téléchargés) :
  UN_Palestine_Partition_Versions_1947.jpg   carte ONU n° 103.1(b), Wikimedia Commons (domaine public)
  ne110.geojson                               Natural Earth, pays 1:110 M (domaine public)
  wd_*.json                                   réponses Wikidata (requêtes SPARQL ci-dessous, CC0)
  dem/                                        tuiles d'altitude « terrarium » (SRTM, NASA, via AWS)

Étapes :
 1. calage : les 8 croisements du quadrillage (35° et 36° E, 30° à 33° N) sont repérés sur la carte
    de l'ONU ; une transformation bilinéaire passe des pixels aux longitudes et latitudes (écart
    inférieur à 2 px, environ 300 m) ; la côte de Natural Earth se superpose à celle de la carte ;
 2. classement des pixels : orange = État arabe, bleu-vert = État juif, blanc cerné = Jérusalem ;
    traits, routes et textes prennent la couleur la plus proche ; contour extérieur : la Palestine
    mandataire de Natural Earth, comme les autres cartes du film ;
 3. les deux points de contact (près d'Afula et près d'Isdud) sont pris au croisement exact des
    traits noirs, et le découpage y est refait en secteurs, pour que les morceaux ne s'y touchent
    que par un point ;
 4. vectorisation en partition planaire : chaque frontière est un trait commun aux deux territoires
    (lissé, coupé aux points de contact), puis découpage en morceaux nommés ; lacs retirés ;
 5. localités (Wikidata) : villages palestiniens détruits en 1947-1949 ; localités palestiniennes de
    Cisjordanie et de Gaza (hors camps, colonies, quartiers, créations après 1947) ; localités arabes,
    druzes et chrétiennes d'Israël (catégories de Wikipédia, hors villes bédouines créées après 1948) ;
    localités juives fondées avant le 29 novembre 1947 (kibboutz, moshav, villes) ; doublons à moins
    de 400 m retirés ;
 6. vote du 29 novembre 1947, frontières de 1947 approchées (URSS d'un seul bloc, Yougoslavie,
    Tchécoslovaquie, Pakistan avec le Bengale oriental, Yémen du Nord seul, colonies laissées de côté) ;
 7. relief : mosaïque d'altitudes en Mercator, ombrage multidirectionnel (lumière principale au
    nord-ouest) et relief local, une texture générale et quatre textures fines pour les gros plans.
"""
import hashlib
import json
import math
import os
import re
import shutil
import sys
import time
import urllib.parse
import urllib.request

import cv2
import numpy as np
from PIL import Image
from pyproj import Geod
from scipy import ndimage as ndi
from shapely.geometry import LineString, MultiLineString, Point, Polygon, mapping, shape, box
from shapely.ops import linemerge, nearest_points, polygonize, unary_union
from shapely.prepared import prep

SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTD = os.environ.get("PARTAGE_OUT") or os.path.join(ROOT, "data")  # PARTAGE_OUT : écrire ailleurs (essai)
UA = "SionDocResearch/1.0"
GEOD = Geod(ellps="WGS84")


def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 200:
        return path
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/sparql-results+json"})
    for k in range(4):
        try:
            with urllib.request.urlopen(req, timeout=240) as r, open(path, "wb") as f:
                f.write(r.read())
            return path
        except Exception:
            time.sleep(2 + 3 * k)
    raise SystemExit(f"échec du téléchargement : {url}")


def km2(g):
    ps = [g] if g.geom_type == "Polygon" else list(g.geoms)
    return sum(abs(GEOD.geometry_area_perimeter(p)[0]) for p in ps) / 1e6


def load_js(name, var):
    s = open(os.path.join(ROOT, "data", name), encoding="utf-8").read()
    s = s[s.index("{"):].rstrip().rstrip(";")
    return json.loads(s)


# ------------------------------------------------------------------ 1. calage de la carte de l'ONU
SCAN = os.path.join(SRC, "UN_Palestine_Partition_Versions_1947.jpg")
_h = hashlib.md5(b"UN_Palestine_Partition_Versions_1947.jpg").hexdigest()
fetch(f"https://upload.wikimedia.org/wikipedia/commons/{_h[0]}/{_h[:2]}/UN_Palestine_Partition_Versions_1947.jpg", SCAN)
rgb = np.asarray(Image.open(SCAN).convert("RGB")).astype(np.int16)
gray = np.asarray(Image.open(SCAN).convert("L")).astype(float)
H, W = gray.shape
# croisements approchés (lon, lat) → (x, y), affinés sur le profil des traits
EST = {(35, 33): (551.5, 309), (36, 33): (1134.5, 309), (35, 32): (552.5, 1004), (36, 32): (1132, 1004),
       (35, 31): (550.5, 1691), (36, 31): (1129.5, 1695), (35, 30): (546.5, 2386.5), (36, 30): (1127, 2386.5)}
CTRL = []
for (lo, la), (x, y) in EST.items():
    x, y = int(round(x)), int(round(y))
    rows, cols = np.r_[y - 80:y - 10, y + 10:y + 80], np.arange(x - 12, x + 13)
    prof = np.median(255 - gray[np.ix_(rows, cols)], axis=0)
    i = int(np.argmax(prof)); w = prof[max(0, i - 2):i + 3]; xv = (w * cols[max(0, i - 2):i + 3]).sum() / w.sum()
    cols2, rws = np.r_[x - 80:x - 10, x + 10:x + 80], np.arange(y - 12, y + 13)
    prof2 = np.median(255 - gray[np.ix_(rws, cols2)], axis=1)
    j = int(np.argmax(prof2)); w2 = prof2[max(0, j - 2):j + 3]; yh = (w2 * rws[max(0, j - 2):j + 3]).sum() / w2.sum()
    CTRL.append((lo, la, xv, yh))
A = np.array(CTRL)
basis = lambda lo, la: np.stack([np.ones_like(lo), lo - 35, la - 31.5, (lo - 35) * (la - 31.5)], -1)
B = basis(A[:, 0], A[:, 1])
cx = np.linalg.lstsq(B, A[:, 2], rcond=None)[0]
cy = np.linalg.lstsq(B, A[:, 3], rcond=None)[0]
print("calage : écarts (px)", np.round(B @ cx - A[:, 2], 2), np.round(B @ cy - A[:, 3], 2))


def topx(lo, la):
    b = basis(np.asarray(lo, float), np.asarray(la, float))
    return b @ cx, b @ cy


LO, LA = np.meshgrid(np.linspace(34, 36.2, 60), np.linspace(29.3, 33.6, 90))
LO, LA = LO.ravel(), LA.ravel()
GX, GY = topx(LO, LA)
pb = lambda x, y: np.stack([((np.asarray(x) - 800) / 500) ** i * ((np.asarray(y) - 1500) / 1000) ** j for i in range(4) for j in range(4 - i)], -1)
clo = np.linalg.lstsq(pb(GX, GY), LO, rcond=None)[0]
cla = np.linalg.lstsq(pb(GX, GY), LA, rcond=None)[0]
toll = lambda x, y: (pb(x, y) @ clo, pb(x, y) @ cla)

# ------------------------------------------------------------------ 2. classement des pixels
R, G, Bc = rgb[..., 0], rgb[..., 1], rgb[..., 2]
orange = (R > 195) & (G > 140) & (G < 215) & (Bc < 150) & ((R - Bc) > 80)
teal = (G > 140) & (Bc > 135) & (R < 175) & ((G - R) > 30)
TER = load_js("territoires.js", "TERRITOIRES")
ne = np.zeros((H, W), np.uint8)
for ring in TER["palestine-mandataire"]:
    r = np.array(ring); x, y = topx(r[:, 0], r[:, 1])
    cv2.fillPoly(ne, [np.stack([x, y], 1).round().astype(np.int32)], 1)
ne = ne > 0
roi = cv2.dilate(ne.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))) > 0


def despeck(m, minpx=40):
    l, n = ndi.label(m); z = ndi.sum(m, l, range(1, n + 1)); return np.isin(l, 1 + np.where(z >= minpx)[0])


o, te = despeck(orange & roi), despeck(teal & roi)
jx, jy = topx(35.21, 31.755)
white = ne & ~orange & ~teal & (R > 200) & (G > 195) & (Bc > 175)
wl, wn = ndi.label(white)
cms, szs = ndi.center_of_mass(white, wl, range(1, wn + 1)), ndi.sum(white, wl, range(1, wn + 1))
sel = [i + 1 for i, (c, z) in enumerate(zip(cms, szs)) if z > 20 and (c[0] - jy) ** 2 + (c[1] - jx) ** 2 < 70 ** 2]
jer = cv2.morphologyEx(np.isin(wl, sel).astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))) > 0
jer = ndi.binary_fill_holes(jer)
l, n = ndi.label(jer); z = ndi.sum(jer, l, range(1, n + 1)); jer = l == (1 + np.argmax(z))
cls = np.zeros((H, W), np.uint8); cls[o] = 1; cls[te] = 2; cls[jer] = 3
_, ind = ndi.distance_transform_edt(cls == 0, return_indices=True)
full = cls[ind[0], ind[1]]; full[~ne] = 0
for _ in range(2):
    oh = np.stack([cv2.blur((full == k).astype(np.float32), (7, 7)) for k in (1, 2, 3)])
    full = np.where(ne, 1 + np.argmax(oh, 0), 0).astype(np.uint8)

# ------------------------------------------------------------------ 3. points de contact
KPX = {"nord": (691.0, 565.0), "sud": (397.5, 1172.5)}  # croisement des traits noirs sur la carte
R0, R1 = 16, 19
for kx, ky in KPX.values():
    src = full.copy()
    yy, xx = np.mgrid[int(ky - R1 - 2):int(ky + R1 + 3), int(kx - R1 - 2):int(kx + R1 + 3)]
    inside = np.hypot(xx - kx, yy - ky) < R0
    th = np.arctan2(yy - ky, xx - kx)
    for y, x, a in zip(yy[inside], xx[inside], th[inside]):
        votes = {}
        for rr in np.linspace(R0, R1, 4):
            c = src[int(round(ky + rr * np.sin(a))), int(round(kx + rr * np.cos(a)))]
            votes[c] = votes.get(c, 0) + 1
        full[y, x] = max(votes, key=votes.get)
KLL = {k: tuple(float(v) for v in toll(*p)) for k, p in KPX.items()}

# ------------------------------------------------------------------ 4. partition planaire
segs = []
dh = (full[:, :-1] != full[:, 1:]) & (full[:, :-1] > 0) & (full[:, 1:] > 0)
for y, x in zip(*np.where(dh)): segs.append(((x + 0.5, y - 0.5), (x + 0.5, y + 0.5)))
dv = (full[:-1, :] != full[1:, :]) & (full[:-1, :] > 0) & (full[1:, :] > 0)
for y, x in zip(*np.where(dv)): segs.append(((x - 0.5, y + 0.5), (x + 0.5, y + 0.5)))
ml = linemerge(MultiLineString(segs))
plines = [l for l in (ml.geoms if ml.geom_type == "MultiLineString" else [ml]) if l.length > 3]


def split_k(l):
    out, cur = [], [l.coords[0]]
    for p in list(l.coords)[1:]:
        hit = next(((kx, ky) for kx, ky in KPX.values() if (p[0] - kx) ** 2 + (p[1] - ky) ** 2 <= 4.0), None)
        if hit:
            cur.append(hit)
            if len(cur) >= 2: out.append(cur)
            cur = [hit]
        else:
            cur.append(p)
    if len(cur) >= 2: out.append(cur)
    res = []
    for c in out:
        d = [c[0]] + [p for i, p in enumerate(c[1:]) if p != c[i]]
        if len(d) >= 2: res.append(LineString(d))
    return res


plines = [q for l in plines for q in split_k(l) if q.length > 1.5]


def chaikin(pts, it=2):
    P = np.array(pts)
    for _ in range(it):
        Q = [P[0]]
        for i in range(len(P) - 1): Q += [0.75 * P[i] + 0.25 * P[i + 1], 0.25 * P[i] + 0.75 * P[i + 1]]
        Q.append(P[-1]); P = np.array(Q)
    return P


outer = unary_union([Polygon(r) for r in TER["palestine-mandataire"]]).buffer(0)
ob = outer.boundary


def to_ll(l):
    s = l.simplify(0.9)
    pts = chaikin(list(s.coords)) if len(s.coords) > 2 else np.array(s.coords)
    lo, la = toll(pts[:, 0], pts[:, 1])
    c = list(zip(lo, la))
    for idx in (0, -1):
        p = Point(c[idx])
        k = next((v for v in KLL.values() if p.distance(Point(v)) < 0.006), None)
        if k: c[idx] = k
        elif p.distance(ob) < 0.012:
            q = nearest_points(ob, p)[0]
            v = np.array(c[idx]) - np.array(c[1 if idx == 0 else -2]); v /= np.linalg.norm(v) + 1e-12
            c[idx] = tuple(np.array([q.x, q.y]) + v * 0.002)
    return LineString(c)


LINES = [to_ll(l) for l in plines]
faces = list(polygonize(unary_union(LINES + [ob])))


def cls_at(poly):
    p = poly.representative_point(); x, y = topx(p.x, p.y)
    x, y = min(max(int(round(float(x))), 0), W - 1), min(max(int(round(float(y))), 0), H - 1)
    v = full[y, x]
    if v == 0:
        w = full[max(0, y - 6):y + 7, max(0, x - 6):x + 7]; vals = w[w > 0]
        v = int(np.bincount(vals).argmax()) if len(vals) else 0
    return int(v)


groups = {1: [], 2: [], 3: []}
for f in faces:
    if outer.buffer(1e-6).contains(f.representative_point()):
        c = cls_at(f)
        if c: groups[c].append(f)
MAP = load_js("map.js", "MAP_DATA")
lakes = []
for rings in MAP["lakes"]:
    rr = [np.array(r).reshape(-1, 2) / 1000 for r in rings]
    if ((rr[0][:, 0] > 34.5) & (rr[0][:, 0] < 36) & (rr[0][:, 1] > 30.5) & (rr[0][:, 1] < 33.5)).any():
        lakes.append(Polygon(rr[0], rr[1:]))
LAKE = unary_union(lakes).buffer(0)
SEEDS = {"arabe-galilee": (1, 35.262, 32.866), "arabe-centre": (1, 35.193, 31.935), "arabe-sud": (1, 34.349, 31.113), "jaffa": (1, 34.758, 32.042),
         "juif-galilee": (2, 35.49, 32.819), "juif-cote": (2, 34.93, 32.335), "juif-neguev": (2, 34.98, 30.621), "jerusalem": (3, 35.255, 31.731)}
sec = {k: [] for k in SEEDS}
for c, fs in groups.items():
    g = unary_union(fs)
    for p in ([g] if g.geom_type == "Polygon" else list(g.geoms)):
        hit = [k for k, (cc, lo, la) in SEEDS.items() if cc == c and p.buffer(1e-9).contains(Point(lo, la))]
        if hit: sec[hit[0]].append(p)
        else:
            cand = [k for k, (cc, _, _) in SEEDS.items() if cc == c]
            sec[min(cand, key=lambda k: min((q.distance(p) for q in sec[k]), default=9))].append(p)
r4 = lambda pts: [[round(x, 4), round(y, 4)] for x, y in pts]
SECTIONS, AREAS = {}, {}
for k, ps in sec.items():
    g = unary_union(ps).difference(LAKE)
    AREAS[k] = km2(unary_union(ps))
    SECTIONS[k] = [[r4(p.exterior.coords)] + [r4(h.coords) for h in p.interiors if Polygon(h).area > 2e-6]
                   for p in ([g] if g.geom_type == "Polygon" else list(g.geoms)) if p.area >= 2e-5]
tot = sum(AREAS.values())
st = lambda pre: sum(v for k, v in AREAS.items() if k.startswith(pre) or (pre == "arabe" and k == "jaffa"))
print(f"surfaces : État arabe {100 * st('arabe') / tot:.1f} %, État juif {100 * st('juif') / tot:.1f} %, Jérusalem {100 * AREAS['jerusalem'] / tot:.2f} %")
LINES.sort(key=lambda l: -max(y for _, y in l.coords))
LINES_OUT = []
for l in LINES:
    c = list(l.coords)
    LINES_OUT.append(r4(c[::-1] if c[0][1] < c[-1][1] else c))

# ------------------------------------------------------------------ 5. localités (Wikidata)
SPARQL = {
    "wd_depop.json": 'SELECT DISTINCT ?v ?vl ?co WHERE { ?v wdt:P31 wd:Q12232785 ; wdt:P625 ?co . OPTIONAL { ?v rdfs:label ?vl FILTER(LANG(?vl)="en") } }',
    "wd_ps.json": 'SELECT DISTINCT ?v ?vl ?co ?inc WHERE { VALUES ?c { wd:Q532 wd:Q3957 wd:Q515 wd:Q486972 wd:Q1549591 } ?v wdt:P17 wd:Q219060 ; wdt:P31 ?c ; wdt:P625 ?co . FILTER NOT EXISTS { ?v wdt:P31 wd:Q582706 } FILTER NOT EXISTS { ?v wdt:P31 wd:Q123705 } OPTIONAL { ?v wdt:P571 ?inc } OPTIONAL { ?v rdfs:label ?vl FILTER(LANG(?vl)="en") } }',
    "wd_jew.json": 'SELECT DISTINCT ?v ?vl ?co ?inc ?c WHERE { VALUES ?c { wd:Q161387 wd:Q917146 wd:Q515 wd:Q3957 wd:Q486972 wd:Q1288520 wd:Q1549591 wd:Q532 } ?v wdt:P31 ?c ; wdt:P17 wd:Q801 ; wdt:P571 ?inc ; wdt:P625 ?co . FILTER(YEAR(?inc) >= 1860 && YEAR(?inc) <= 1947) OPTIONAL { ?v rdfs:label ?vl FILTER(LANG(?vl)="en") } }',
}
CATS = {"wd_arabil.json": "Arab localities in Israel", "wd_cat_Druze_communities_in_Israel.json": "Druze communities in Israel",
        "wd_cat_Arab_Christian_communities_in_Israel.json": "Arab Christian communities in Israel"}
for f, cat in CATS.items():
    SPARQL[f] = ('SELECT ?item ?title ?co WHERE { SERVICE wikibase:mwapi { bd:serviceParam wikibase:api "Generator" ; wikibase:endpoint "en.wikipedia.org" ; '
                 f'mwapi:generator "categorymembers" ; mwapi:gcmtitle "Category:{cat}" ; mwapi:gcmlimit "max" ; mwapi:gcmnamespace "0" . '
                 '?title wikibase:apiOutput mwapi:title . ?item wikibase:apiOutputItem mwapi:item . } OPTIONAL { ?item wdt:P625 ?co } }')
for f, q in SPARQL.items():
    fetch("https://query.wikidata.org/sparql?" + urllib.parse.urlencode({"query": q}), os.path.join(SRC, f))


def wd(f):
    out = []
    for b in json.load(open(os.path.join(SRC, f)))["results"]["bindings"]:
        if "co" not in b: continue
        m = re.match(r"Point\(([-\d.eE]+) ([-\d.eE]+)\)", b["co"]["value"])
        out.append(dict(id=(b.get("v") or b.get("item"))["value"].split("/")[-1], name=b.get("vl", b.get("title", {})).get("value", ""),
                        lon=float(m.group(1)), lat=float(m.group(2)), inc=b.get("inc", {}).get("value", "")[:10]))
    return out


# exclusions vérifiées une à une : localités arabes, colonies allemandes, lieux hors de la Palestine mandataire,
# quartiers, conseils régionaux, villes bédouines créées après 1948
EXCL_J = {"Bariqa", "Beersheba", "Beit Jimal Monastery", "Buq'ata", "Ein al-Asad", "Jisr az-Zarqa", "Manshiya Zabda", "Rehaniya",
          "Umm al-Qutuf", "shuaffat", "Ras Ali", "Sarona", "Wilhelma", "", "Ginegar Archive", "Neve ILan Kibbutz Outpost"}
EXCL_A = {"Mixed cities", "List of bazaars in Palestine and Israel", "Triangle (Israel)", "Al-Batuf Regional Council", "Bustan al-Marj Regional Council",
          "Wadi Ara", "Arab localities in Israel", "Hadar HaCarmel", "Wadi Salib", "Wadi Nisnas", "Abbas, Haifa", "Ajami, Jaffa", "Old Jaffa", "Halisa",
          "Bayt Naqquba", "Rahat", "Lakiya", "Hura", "Tel Sheva", "Kuseife", "Ar'arat an-Naqab", "Shaqib al-Salam", "Carmel City", "Nof HaGalil",
          "Ma'alot-Tarshiha", "Jerusalem", "Haifa", "Acre, Israel", "Jaffa", "Lod", "Ramla", "Christian Quarter", "German Colony, Jerusalem", "Talbiya",
          "Basma", "Ka'abiyye-Tabbash-Hajajre", "Basmat Tab'un", "Zarzir", "Bir al-Maksur", "Tuba-Zangariyye", "Shibli–Umm al-Ghanam"}
PAL = prep(unary_union([Polygon(rs[0][0]) for rs in SECTIONS.values()]).buffer(0.01))
J = [x for x in wd("wd_jew.json") if x["name"] not in EXCL_J and x["inc"] < "1947-11-30"]
Aa = wd("wd_depop.json") + [x for x in wd("wd_ps.json") if not ("camp" in x["name"].lower() or (x["inc"] and not x["inc"].startswith("-") and x["inc"][:4].isdigit() and int(x["inc"][:4]) > 1947))]
for f in CATS: Aa += [x for x in wd(f) if x["name"] not in EXCL_A]


def dedupe(Ls, d=0.004):
    out, seen = [], set()
    for x in Ls:
        if x["id"] in seen: continue
        seen.add(x["id"])
        if PAL.contains(Point(x["lon"], x["lat"])) and not any(abs(x["lon"] - y["lon"]) < d and abs(x["lat"] - y["lat"]) < d for y in out): out.append(x)
    return out


J, Aa = dedupe(J), dedupe(Aa)
print(f"localités : {len(Aa)} arabes, {len(J)} juives")
# villes : population approximative de 1945 (Village Statistics, arrondie), pour la taille des halos seulement
TOWNS = [("Jérusalem", 35.225, 31.776, 65000, 99000), ("Haïfa", 34.99, 32.81, 71000, 74000), ("Tel-Aviv", 34.78, 32.08, 0, 166000), ("Jaffa", 34.752, 32.05, 67000, 28000),
         ("Gaza", 34.46, 31.50, 34000, 0), ("Naplouse", 35.26, 32.22, 23000, 0), ("Hébron", 35.10, 31.53, 24000, 0), ("Lydda", 34.895, 31.951, 17000, 0),
         ("Ramle", 34.866, 31.928, 15000, 0), ("Nazareth", 35.30, 32.70, 14000, 0), ("Acre", 35.08, 32.92, 12000, 0), ("Khan Younès", 34.30, 31.34, 11000, 0),
         ("Majdal", 34.57, 31.67, 10000, 0), ("Safed", 35.50, 32.965, 9500, 2400), ("Tibériade", 35.53, 32.79, 5300, 6000), ("Bethléem", 35.20, 31.705, 8800, 0),
         ("Tulkarem", 35.03, 32.31, 8100, 0), ("Beersheba", 34.79, 31.25, 5500, 0), ("Beisan", 35.50, 32.50, 5200, 0), ("Ramallah", 35.20, 31.90, 5000, 0),
         ("Jénine", 35.30, 32.46, 4000, 0), ("Petah Tikva", 34.887, 32.087, 0, 21500), ("Ramat Gan", 34.82, 32.07, 0, 17000), ("Rehovot", 34.81, 31.894, 0, 12500),
         ("Rishon LeZion", 34.80, 31.96, 0, 11000), ("Netanya", 34.857, 32.33, 0, 11600), ("Hadera", 34.92, 32.44, 0, 11800), ("Bnei Brak", 34.83, 32.085, 0, 11000),
         ("Herzliya", 34.84, 32.165, 0, 5300)]

# ------------------------------------------------------------------ 6. vote du 29 novembre 1947
NE = os.path.join(SRC, "ne110.geojson")
fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson", NE)
by = {f["properties"]["ADM0_A3"]: f for f in json.load(open(NE))["features"]}
VOTE = {
    "pour": ["AUS", "BEL", "BOL", "BRA", "BLR", "CAN", "CRI", "CZE", "SVK", "DNK", "DOM", "ECU", "FRA", "GTM", "HTI", "ISL", "LBR", "LUX", "NLD", "NZL", "NIC",
             "NOR", "PAN", "PRY", "PER", "PHL", "POL", "SWE", "UKR", "ZAF", "USA", "URY", "VEN",
             "RUS", "EST", "LVA", "LTU", "MDA", "GEO", "ARM", "AZE", "KAZ", "UZB", "TKM", "KGZ", "TJK"],  # l'URSS de 1947
    "contre": ["AFG", "CUB", "EGY", "GRC", "IND", "IRN", "IRQ", "LBN", "PAK", "BGD", "SAU", "SYR", "TUR", "YEM"],
    "abstention": ["ARG", "CHL", "CHN", "TWN", "COL", "SLV", "ETH", "HND", "MEX", "GBR", "SVN", "HRV", "BIH", "SRB", "MNE", "MKD", "KOS"],
    "absent": ["THA"],
}
CLIP = {"FRA": box(-6, 41, 10, 52), "NOR": box(4, 57, 32, 72), "NLD": box(3, 50, 8, 54), "USA": box(-180, 15, -60, 72), "DNK": box(7, 54, 16, 58.5),
        "YEM": Polygon([(42.4, 17.6), (46.6, 17.6), (46.2, 15.6), (45.3, 14.7), (44.7, 13.9), (44.1, 13.1), (43.4, 12.6), (42.4, 12.6)])}
geom = lambda c: (shape(by[c]["geometry"]).intersection(CLIP[c]) if c in CLIP else shape(by[c]["geometry"])).buffer(0)
rings = lambda g, a: [[[round(x, 2), round(y, 2)] for x, y in p.exterior.coords] for p in ([g] if g.geom_type == "Polygon" else list(g.geoms)) if p.area > a]
VOTE_OUT = {k: rings(unary_union([geom(c) for c in L]).simplify(0.15, preserve_topology=True), 0.05) for k, L in VOTE.items()}
voters = {c for L in VOTE.values() for c in L}
rest = unary_union([shape(f["geometry"]) for c, f in by.items() if c not in voters and c != "ATA"]
                   + [shape(by[c]["geometry"]).buffer(0).difference(geom(c)) for c in CLIP])
VOTE_OUT["autres"] = rings(rest.simplify(0.2, preserve_topology=True), 0.3)

# ------------------------------------------------------------------ 7. relief
DEM = os.path.join(SRC, "dem"); os.makedirs(DEM, exist_ok=True)
AREAS_DEM = {"base": (10, 34.15, 29.40, 36.0, 33.40, 2.6), "nord": (12, 35.08, 32.50, 35.40, 32.76, 1.8), "sud": (12, 34.58, 31.62, 34.90, 31.88, 1.8),
             "jaffa": (12, 34.66, 31.96, 34.86, 32.14, 1.8), "jer": (12, 35.08, 31.62, 35.36, 31.88, 1.8)}


def tile(lon, lat, z):
    n = 2 ** z
    return int((lon + 180) / 360 * n), int((1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n)


os.makedirs(os.path.join(OUTD, "relief"), exist_ok=True)
RELIEF = {}
for k, (z, lo0, la0, lo1, la1, exag) in AREAS_DEM.items():
    (x0, y0), (x1, y1) = tile(lo0, la1, z), tile(lo1, la0, z)
    rowsd = []
    for y in range(y0, y1 + 1):
        row = []
        for x in range(x0, x1 + 1):
            p = fetch(f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png", os.path.join(DEM, f"{z}_{x}_{y}.png"))
            row.append(np.asarray(Image.open(p).convert("RGB")).astype(np.float64))
        rowsd.append(np.concatenate(row, 1))
    a = np.concatenate(rowsd, 0)
    e = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    n = 256 * 2 ** z
    bb = [(x0 * 256 / n) * 2 * math.pi - math.pi, math.pi - ((y1 + 1) * 256 / n) * 2 * math.pi, ((x1 + 1) * 256 / n) * 2 * math.pi - math.pi, math.pi - (y0 * 256 / n) * 2 * math.pi]
    lat_c = math.degrees(2 * math.atan(math.exp((bb[1] + bb[3]) / 2)) - math.pi / 2)
    px = 40075016.686 / n * math.cos(math.radians(lat_c))
    e = cv2.GaussianBlur(e, (0, 0), 0.7)
    gy, gx = np.gradient(e, px)
    gx, gy = gx * exag, gy * exag
    slope, aspect = np.arctan(np.hypot(gx, gy)), np.arctan2(-gx, gy)
    lam = lambda az, alt: np.clip(math.cos(math.radians(alt)) * np.sin(slope) * np.cos(math.radians(az) - aspect) + math.sin(math.radians(alt)) * np.cos(slope), 0, 1)
    Lm = 0.62 * lam(315, 32) + 0.24 * lam(270, 40) + 0.14 * lam(360, 45)
    flat = 0.62 * math.sin(math.radians(32)) + 0.24 * math.sin(math.radians(40)) + 0.14 * math.sin(math.radians(45))
    kk = max(3, int(round(2500 / px))) | 1
    out = np.clip(0.46 + (Lm - flat) * 0.95 + np.tanh((e - cv2.GaussianBlur(e, (0, 0), kk / 2)) / 120.0) * 0.10, 0, 1)
    Image.fromarray((out * 255).round().astype(np.uint8)).save(os.path.join(OUTD, "relief", f"{k}.png"), optimize=True)
    RELIEF[k] = {"src": f"data/relief/{k}.png", "bbox": [round(v, 8) for v in bb], "w": out.shape[1], "h": out.shape[0]}

# ------------------------------------------------------------------ sortie
DATA = {"sections": SECTIONS, "lines": LINES_OUT, "kiss": {k: [round(v[0], 4), round(v[1], 4)] for k, v in KLL.items()},
        "localites": {"arabe": [[round(x["lon"], 4), round(x["lat"], 4)] for x in Aa], "juif": [[round(x["lon"], 4), round(x["lat"], 4)] for x in J]},
        "villes": TOWNS, "vote": VOTE_OUT, "relief": RELIEF}
HDR = """/* Plan de partage de la Palestine, résolution 181 (II) de l'Assemblée générale de l'ONU, 29 novembre 1947.
 * Frontières : carte ONU n° 103.1(b) « Palestine : plan of partition with economic union proposed by the
 * Ad Hoc Committee on the Palestinian Question » (fond : Survey of Palestine, 1946), calée sur son
 * quadrillage puis vectorisée ; contour extérieur : Palestine mandataire (Natural Earth), comme les autres cartes.
 * Localités : Wikidata (villages palestiniens détruits en 1947-1949 ; localités palestiniennes de Cisjordanie,
 * de Gaza et d'Israël, hors camps et colonies ; localités juives fondées avant le 29 novembre 1947).
 * Vote : 33 pour, 13 contre, 10 abstentions, 1 absent (Siam), frontières de 1947 approchées (Natural Earth).
 * Relief : SRTM / NASA via les tuiles « terrarium » d'AWS (domaine public), ombrage tools/prep_partage.py. */
"""
open(os.path.join(OUTD, "partage.js"), "w", encoding="utf-8").write(HDR + "window.PARTAGE = " + json.dumps(DATA, separators=(",", ":")) + ";\n")
print("data/partage.js et data/relief/ écrits")
