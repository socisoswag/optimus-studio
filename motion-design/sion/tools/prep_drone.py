"""Prépare les données des survols en 3D (timelines de drone.html), zone par zone.

    python3 tools/prep_drone.py <dossier_cache>            zone « terre » → data/drone/ (intro aérienne)
    python3 tools/prep_drone.py <dossier_cache> gaza       zone « gaza »  → data/drone-gaza/ (2023 et 2025)
    LIGHT_ONLY=lune python3 tools/prep_drone.py <cache>     seulement la lumière de ces plans (relief déjà fait)

Sources (téléchargées dans le dossier cache, une seule fois) :
  terrarium/   altitudes « terrarium » z12, environ 33 m (SRTM, NASA ; bathymétrie GEBCO), via AWS
  tci/         images Sentinel-2 L2A en couleurs vraies (TCI, 10 m) du 11 mai 2025, quatre tuiles prises
               le même jour par le même satellite, via AWS (Element 84) ; données Copernicus libres, usage
               commercial permis avec la mention « Contains modified Copernicus Sentinel data 2025 »

Sorties dans data/drone*/ (non versionnées, refaites par ce script) :
  meta.json            emprise, tailles, niveau de la mer Morte, emprises des textures fines
  height.bin           altitudes en int16 (quart de mètre), grille métrique locale
  albedo*.jpg          couleur du sol (une par date pour Gaza)
  detail-<nom>.jpg     couleur fine (environ 8 m) des zones survolées de près
  light-<plan>.png     R ombre portée du soleil (douce), G lumière du ciel, B eau

La grille est un plan local en mètres (x vers l'est, y vers le nord) centré sur l'origine de la zone.
"""
import json
import math
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

import cv2
import numpy as np
from PIL import Image
import rasterio
from rasterio.crs import CRS
from rasterio.transform import from_origin
from rasterio.warp import Resampling, reproject
from scipy.ndimage import map_coordinates

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = sys.argv[1]
UA = "SionDocResearch/1.0"
T25 = ["36/R/XV/2025/5/S2A_36RXV_20250511_0_L2A", "36/R/YV/2025/5/S2A_36RYV_20250511_1_L2A",
       "36/S/XA/2025/5/S2A_36SXA_20250511_0_L2A", "36/S/YA/2025/5/S2A_36SYA_20250511_1_L2A"]
# emprises : (ouest, sud, est, nord) ; soleil de chaque plan : azimut (depuis le nord, sens horaire), hauteur
ZONES = {
    "terre": dict(out="drone", origin=(35.0, 31.75), reg=(34.30, 31.20, 35.75, 32.30), hw=4096, aw=8192, z=12,
                  albedos={"albedo": T25}, deadsea=True,
                  details={"cote": (34.66, 31.94, 34.98, 32.16), "collines": (34.96, 31.62, 35.26, 31.86),
                           "desert": (35.22, 31.36, 35.56, 31.62)},
                  suns={"cote": (101, 3.2), "collines": (128, 11), "desert": (114, 17), "titre": (118, 14), "lune": (252, 22), "crepuscule": (262, 5)},
                  credit="Images : Copernicus Sentinel-2 (ESA), 11 mai 2025, via AWS (Element 84). Contains modified Copernicus Sentinel data 2025"),
    # Gaza : deux images de la même saison, même heure de passage, sans nuages (17 septembre 2023, 11 septembre 2025)
    "gaza": dict(out="drone-gaza", origin=(34.39, 31.42), reg=(34.17, 31.18, 34.62, 31.635), hw=2048, aw=5400, z=13,
                 albedos={"albedo-2023": ["36/R/XV/2023/9/S2A_36RXV_20230917_0_L2A"],
                          "albedo-2025": ["36/R/XV/2025/9/S2B_36RXV_20250911_0_L2A"]},
                 deadsea=False, details={}, suns={"gaza": (228, 36)},
                 credit="Images : Copernicus Sentinel-2 (ESA), 17 septembre 2023 et 11 septembre 2025. Contains modified Copernicus Sentinel data 2023, 2025"),
}
Z = ZONES[sys.argv[2] if len(sys.argv) > 2 else "terre"]
OUT = os.path.join(ROOT, "data", Z["out"])
LON0, LAT0 = Z["origin"]
REG = Z["reg"]
KX = 111320 * math.cos(math.radians(LAT0))  # mètres par degré de longitude
KY = 110950  # mètres par degré de latitude
HW, AW = Z["hw"], Z["aw"]  # largeurs de la grille d'altitudes et de la texture de couleur
DETAILS, SUNS = Z["details"], Z["suns"]


def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 100:
        return path
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for k in range(6):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                data = r.read()
            with open(path + ".part", "wb") as f:
                f.write(data)
            os.replace(path + ".part", path)
            return path
        except Exception:
            time.sleep(2 + 3 * k)
    raise SystemExit(f"échec du téléchargement : {url}")


def tile(lon, lat, z):
    n = 2 ** z
    return ((lon + 180) / 360 * n,
            (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n)


def mosaic(z, bbox, url, folder, decode):
    """Assemble les tuiles Mercator couvrant bbox ; renvoie l'image et une fonction lon/lat → pixel."""
    (fx0, fy0), (fx1, fy1) = tile(bbox[0], bbox[3], z), tile(bbox[2], bbox[1], z)
    x0, y0, x1, y1 = int(fx0), int(fy0), int(fx1), int(fy1)
    os.makedirs(folder, exist_ok=True)
    jobs = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
    with ThreadPoolExecutor(4) as ex:
        paths = list(ex.map(lambda xy: fetch(url.format(z=z, x=xy[0], y=xy[1]), os.path.join(folder, f"{z}_{xy[0]}_{xy[1]}")), jobs))
    tiles = dict(zip(jobs, paths))
    rows = [np.concatenate([decode(tiles[(x, y)]) for x in range(x0, x1 + 1)], 1) for y in range(y0, y1 + 1)]
    img = np.concatenate(rows, 0)

    def px(lon, lat):
        tx, ty = tile_vec(lon, lat, z)
        return (tx - x0) * 256, (ty - y0) * 256
    return img, px


def tile_vec(lon, lat, z):
    n = 2 ** z
    la = np.radians(lat)
    return (lon + 180) / 360 * n, (1 - np.log(np.tan(la) + 1 / np.cos(la)) / np.pi) / 2 * n


def grid(bbox, w):
    """Grille métrique régulière sur bbox : renvoie (lon, lat) de chaque pixel et la hauteur en pixels."""
    x0, x1 = (bbox[0] - LON0) * KX, (bbox[2] - LON0) * KX
    y0, y1 = (bbox[1] - LAT0) * KY, (bbox[3] - LAT0) * KY
    step = (x1 - x0) / w
    h = int(round((y1 - y0) / step))
    xs = x0 + (np.arange(w) + 0.5) * step
    ys = y1 - (np.arange(h) + 0.5) * step  # ligne 0 au nord
    X, Y = np.meshgrid(xs, ys)
    return LON0 + X / KX, LAT0 + Y / KY, h, (x0, y1 - h * step, x0 + w * step, y1), step


def resample(img, px, lon, lat, order=1):
    u, v = px(lon, lat)
    coords = [v - 0.5, u - 0.5]
    if img.ndim == 2:
        return map_coordinates(img, coords, order=order, mode="nearest")
    return np.stack([map_coordinates(img[..., c], coords, order=order, mode="nearest") for c in range(img.shape[2])], -1)


def dec_dem(p):
    a = np.asarray(Image.open(p).convert("RGB")).astype(np.float32)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768


def dec_rgb(p):
    return np.asarray(Image.open(p).convert("RGB"))


TCI = "https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/{}/TCI.tif"
# la grille locale est un plan équidistant ; en y elle compte KY m par degré, la projection eqc a·π/180
GRID_CRS = CRS.from_proj4(f"+proj=eqc +lat_ts={LAT0} +lat_0={LAT0} +lon_0={LON0} +a=6378137 +b=6378137 +units=m +no_defs")
YF = 6378137 * math.pi / 180 / KY
DEM = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"

os.makedirs(OUT, exist_ok=True)
ONLY = [x for x in os.environ.get("LIGHT_ONLY", "").split(",") if x]
print("altitudes…", flush=True)
dem, dpx = mosaic(Z["z"], REG, DEM, os.path.join(CACHE, "terrarium"), dec_dem)
lon, lat, HH, ext, hstep = grid(REG, HW)
H = resample(dem, dpx, lon, lat, order=3).astype(np.float32)
# mer Méditerranée aplanie à 0 m (la bathymétrie ne sert pas), mer Morte : niveau le plus fréquent sous -380 m
west = lon < 35.2
sea = west & (H <= 0.5)
H[sea] = 0.0
lake = None
if Z["deadsea"]:
    low = H[(H < -380) & (lon > 35.3)]
    hist, edges = np.histogram(low, bins=np.arange(-440, -380, 0.5))
    lake = float(edges[hist.argmax()] + 0.25)
    gy, gx = np.gradient(H, hstep)
    flat = np.hypot(gx, gy) < 0.01
    dead = (lon > 35.3) & (lat < 31.85) & (lat > 31.0) & (H < lake + 1.5) & flat
    dead = cv2.morphologyEx(dead.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)).astype(bool)
    H[dead] = lake
print(f"  grille {HW}×{HH}, pas {hstep:.1f} m, mer Morte {lake}", flush=True)
np.round(H * 4).astype("<i2").tofile(os.path.join(OUT, "height.bin"))

if ONLY:  # relief et eau déjà préparés : on ne refait que la lumière des plans demandés
    meta = json.load(open(os.path.join(OUT, "meta.json")))
    H = np.fromfile(os.path.join(OUT, "height.bin"), "<i2").reshape(HH, HW).astype(np.float32) * 0.25
    water = np.asarray(Image.open(os.path.join(OUT, f"light-{next(iter(SUNS))}.png")))[..., 2] > 127
    SUNS = {k: v for k, v in SUNS.items() if k in ONLY}
print("couleur…" if not ONLY else "lumière seule…", flush=True)
os.makedirs(os.path.join(CACHE, "tci"), exist_ok=True)


def to_grid(bbox, w, resampling, scenes):
    """Des scènes Sentinel-2 reprojetées sur la grille locale (bbox, w pixels de large)."""
    _, _, h, ext, step = grid(bbox, w)
    tr = from_origin(ext[0], ext[3] * YF, step, step * YF)
    out = np.zeros((3, h, w), np.uint8)
    for p in scenes:
        tmp = np.zeros((3, h, w), np.uint8)
        with rasterio.open(p) as src:
            reproject(rasterio.band(src, [1, 2, 3]), tmp, dst_transform=tr, dst_crs=GRID_CRS,
                      resampling=resampling, src_nodata=0, dst_nodata=0, num_threads=4)
        m = tmp.min(0) > 0
        out[:, m] = tmp[:, m]
    return out.transpose(1, 2, 0), h, ext


if not ONLY:
    for name, ids in Z["albedos"].items():
        scenes = [fetch(TCI.format(s), os.path.join(CACHE, "tci", os.path.basename(s) + ".tif")) for s in ids]
        A, AH, aext = to_grid(REG, AW, Resampling.average if AW / ((REG[2] - REG[0]) * KX) < 0.1 else Resampling.cubic, scenes)
        Image.fromarray(A).save(os.path.join(OUT, f"{name}.jpg"), quality=93)
        print(f"  {name} {AW}×{AH}", flush=True)
    water = sea
    if Z["deadsea"]:
        # eau de la mer Morte d'après l'image de 2025 : le rivage a reculé depuis le relief de 2000 (environ 25 m
    # plus bas) ; dans la cuvette, l'eau est sombre et bleutée, le fond découvert est clair
        a2 = A[: 2 * HH, : 2 * HW].reshape(HH, 2, HW, 2, 3).mean((1, 3))
        lum = a2 @ np.array([0.299, 0.587, 0.114])
        basin = (lon > 35.3) & (lat < 31.85) & (lat > 31.0) & (H < lake + 30)
        # eau sombre, ou eau peu profonde turquoise (rouge nettement sous le vert et le bleu)
        dead_img = basin & ((lum < 92) & (a2[..., 2] >= a2[..., 0]) | (a2[..., 0] < np.minimum(a2[..., 1], a2[..., 2]) - 6) & (lum < 170))
        dead_img = cv2.morphologyEx(dead_img.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
        water = sea | dead_img
        del a2
    del A

    details = {}
    for name, bb in DETAILS.items():
        w = int(round((bb[2] - bb[0]) * KX / 8.0))
        D, dh, dext = to_grid(bb, w, Resampling.cubic, [os.path.join(CACHE, "tci", os.path.basename(s) + ".tif") for s in list(Z["albedos"].values())[0]])
        Image.fromarray(D).save(os.path.join(OUT, f"detail-{name}.jpg"), quality=93)
        details[name] = {"ext": dext, "w": w, "h": dh}
        print(f"  {name} {w}×{dh}", flush=True)


def shift(a, dx, dy):
    """a décalé : out[i, j] = a[i + dy, j + dx] (bords répétés)."""
    h, w = a.shape
    ys = np.clip(np.arange(h) + dy, 0, h - 1)
    xs = np.clip(np.arange(w) + dx, 0, w - 1)
    return a[ys][:, xs]


def sun_shadow(az, el):
    """Ombre douce : pour chaque point, la pente la plus forte vers le soleil comparée à sa hauteur."""
    ex, ey = math.sin(math.radians(az)), math.cos(math.radians(az))  # direction du soleil (est, nord)
    tan_el = math.tan(math.radians(el))
    occ = np.full(H.shape, -1e9, np.float32)
    d = hstep
    while d < 26000:
        k = int(round(d / hstep))
        s = shift(H, int(round(ex * k)), int(round(-ey * k)))
        occ = np.maximum(occ, (s - H) / d - tan_el)
        d *= 1.06
    # pénombre : un soleil d'environ un demi-degré, élargi pour adoucir les bords
    pen = math.tan(math.radians(1.6))
    return np.clip(0.5 - occ / pen, 0, 1)


def sky_light():
    """Part du ciel visible : horizon dans 16 directions, sur 3 km."""
    acc = np.zeros(H.shape, np.float32)
    for a in range(16):
        ex, ey = math.cos(a * math.pi / 8), math.sin(a * math.pi / 8)
        mx = np.zeros(H.shape, np.float32)
        d = hstep
        while d < 3000:
            k = int(round(d / hstep))
            s = shift(H, int(round(ex * k)), int(round(-ey * k)))
            mx = np.maximum(mx, (s - H) / d)
            d *= 1.25
        acc += 1 - np.sin(np.arctan(mx))
    return acc / 16


print("lumière…", flush=True)
sky = sky_light()
for shot, (az, el) in SUNS.items():
    sh = sun_shadow(az, el)
    sh = cv2.GaussianBlur(sh, (0, 0), 0.8)
    rgb = np.stack([sh, sky, water.astype(np.float32)], -1)
    Image.fromarray((rgb * 255).round().astype(np.uint8)).save(os.path.join(OUT, f"light-{shot}.png"))
    print(f"  {shot}", flush=True)

if ONLY:
    meta["suns"].update(SUNS)
    json.dump(meta, open(os.path.join(OUT, "meta.json"), "w"), indent=1)
    print("OK", OUT)
    sys.exit(0)
json.dump({
    "origin": [LON0, LAT0], "kx": KX, "ky": KY,
    "height": {"w": HW, "h": HH, "ext": ext, "step": hstep, "scale": 0.25},
    "albedo": {"w": AW, "h": AH, "ext": aext},
    "details": details, "suns": SUNS, "lake": lake,
    "albedos": list(Z["albedos"]),
    "credits": ["Relief : SRTM (NASA), tuiles terrarium via AWS", Z["credit"]],
}, open(os.path.join(OUT, "meta.json"), "w"), indent=1)
print("OK", OUT)
