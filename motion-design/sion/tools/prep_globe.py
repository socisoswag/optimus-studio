"""Textures du globe pour l'ouverture spatiale de l'intro (data/drone/globe-*.jpg).

    python3 tools/prep_globe.py <dossier_cache>      (après tools/prep_drone.py, même cache)

Sources (NASA, domaine public ; Copernicus) :
  nasa/bm.jpg      Blue Marble Next Generation, décembre 2004, 21600 × 10800
  nasa/night.jpg   Black Marble 2016 (lumières des villes la nuit), 3 km
  nasa/clouds.tif  couverture nuageuse mondiale, 8192 × 4096
  nasa/c1.png      Blue Marble, tuile 0-90° E, 0-90° N à 500 m
  nasa/night_c1.jpg  Black Marble 2016, même tuile à 500 m
  tci/*.tif        les quatre scènes Sentinel-2 du 11 mai 2025 (comme prep_drone.py)

Sorties, toutes en longitude-latitude (équirectangulaire) :
  globe-day.jpg, globe-night.jpg, globe-clouds.jpg   la Terre entière, 8192 × 4096
  levant.jpg, levant-night.jpg                       24-44° E, 22-40° N, environ 500 m
  s2wide.jpg                                         34,04-36,30° E, 30,60-32,53° N, environ 60 m
"""
import json
import os
import sys

import numpy as np
import rasterio
from PIL import Image
from rasterio.crs import CRS
from rasterio.transform import from_bounds
from rasterio.warp import Resampling, reproject

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = sys.argv[1]
OUT = os.path.join(ROOT, "data", "drone")
NASA = os.path.join(CACHE, "nasa")
LEVANT = (24.0, 22.0, 44.0, 40.0)
S2BOX = (34.04, 30.60, 36.30, 32.53)


def save(img, name, q=92):
    img.save(os.path.join(OUT, name), quality=q)
    print(" ", name, img.size, flush=True)


print("globe…", flush=True)
save(Image.open(os.path.join(NASA, "bm.jpg")).convert("RGB").resize((8192, 4096), Image.LANCZOS), "globe-day.jpg")
save(Image.open(os.path.join(NASA, "night.jpg")).convert("L").resize((8192, 4096), Image.LANCZOS), "globe-night.jpg")
cl = Image.open(os.path.join(NASA, "clouds.tif"))
save(cl.convert("L").resize((8192, 4096), Image.LANCZOS), "globe-clouds.jpg")

print("Levant…", flush=True)
c1 = Image.open(os.path.join(NASA, "c1.png")).convert("RGB")  # 0-90° E, 90-0° N, 240 px par degré
k = c1.size[0] / 90
box = (int(LEVANT[0] * k), int((90 - LEVANT[3]) * k), int(LEVANT[2] * k), int((90 - LEVANT[1]) * k))
save(c1.crop(box), "levant.jpg")
del c1
n1 = Image.open(os.path.join(NASA, "night_c1.jpg")).convert("L")  # lumières de nuit, même découpage, 500 m
save(n1.crop(box), "levant-night.jpg")
del n1

print("Sentinel-2 à 60 m…", flush=True)
w = 3600
h = int(round(w * (S2BOX[3] - S2BOX[1]) / (S2BOX[2] - S2BOX[0]) / np.cos(np.radians(31.6))))
tr = from_bounds(*S2BOX, w, h)
out = np.zeros((3, h, w), np.uint8)
for f in sorted(os.listdir(os.path.join(CACHE, "tci"))):
    tmp = np.zeros((3, h, w), np.uint8)
    with rasterio.open(os.path.join(CACHE, "tci", f)) as src:
        reproject(rasterio.band(src, [1, 2, 3]), tmp, dst_transform=tr, dst_crs=CRS.from_epsg(4326),
                  resampling=Resampling.average, src_nodata=0, dst_nodata=0, num_threads=4)
    m = tmp.min(0) > 0
    out[:, m] = tmp[:, m]
save(Image.fromarray(out.transpose(1, 2, 0)), "s2wide.jpg", 93)

meta = json.load(open(os.path.join(OUT, "meta.json")))
meta["globe"] = {"levant": LEVANT, "s2wide": S2BOX,
                 "credits": ["Terre : NASA Blue Marble Next Generation et Black Marble 2016 (domaine public)",
                             "Nuages : NASA Visible Earth (domaine public)"]}
json.dump(meta, open(os.path.join(OUT, "meta.json"), "w"), indent=1)
print("OK")
