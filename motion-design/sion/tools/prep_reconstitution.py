"""Images de départ pour les reconstitutions (photos d'archive animées par IA : Gemini/Veo, Kling, Firefly).

    python3 tools/prep_reconstitution.py <dossier_cache>

Chaque photo : original TIFF de la Bibliothèque du Congrès (« no known restrictions on publication »), bord du négatif
rogné, niveaux automatiques doux, cadrage 16:9 en 1920 x 1080 dans output/reconstitution/<nom>.jpg.
Les sources (titre, date, lien) vont dans data/reconstitution.json, pour le générique.
Les six premières images (photos des archives en relief) viennent de data/archives/.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

import numpy as np
from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(sys.argv[1], "reconstitution")
OUT = os.path.join(ROOT, "output", "reconstitution")
UA = "SionDocResearch/1.0"
# nom : (identifiant loc.gov, cadrage 16:9 = centre x, centre y, largeur en fraction de la photo) ;
# 07, 09 et 16 sont des vues stéréo : on garde l'image de gauche ; 08 : la moitié droite du négatif est noire
PHOTOS = {
    "07-immigrants-ellis-island": ("2012646350", (0.25, 0.42, 0.48)),
    "08-entree-britanniques-1917": ("2019695912", (0.27, 0.62, 0.54)),
    "09-nebi-musa": ("2019692714", (0.25, 0.6, 0.48)),
    "09b-nebi-musa-drapeaux": ("2019695529", (0.5, 0.56, 1.0)),
    "10-labour-boeufs": ("2019702392", (0.47, 0.55, 0.9)),
    "11-aire-de-battage": ("2019696292", (0.5, 0.55, 1.0)),
    "12-recolte-olives": ("2019696818", (0.5, 0.42, 0.95)),
    "13-pecheur-cesaree": ("2019694294", (0.5, 0.52, 1.0)),
    "14-port-haifa": ("2019712764", (0.5, 0.62, 1.0)),
    "15-tel-aviv-allenby": ("2019704646", (0.5, 0.6, 1.0)),
    "15b-tel-aviv-boutiques": ("2019705962", (0.5, 0.55, 1.0)),
    "16-immigrants-premiere-maison": ("2019696993", (0.25, 0.55, 0.48)),
    "17-manifestation-1929": ("2019706516", (0.5, 0.6, 1.0)),
    "18-greve-1936-camion": ("2019708987", (0.5, 0.55, 1.0)),
    "18b-marche-1936": ("2019708941", (0.5, 0.56, 1.0)),
}
if os.environ.get("CADRAGE"):  # cadrages ajustés à l'œil (JSON {nom: [cx, cy, w]})
    for k, v in json.load(open(os.environ["CADRAGE"])).items():
        PHOTOS[k] = (PHOTOS[k][0], tuple(v))


def get(url, tries=5):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=300) as r:
                return r.read()
        except (urllib.error.URLError, TimeoutError):
            if k == tries - 1:
                raise
            time.sleep(10 * 2 ** k)  # tile.loc.gov renvoie parfois 520


def border(g, dark=70, frac=0.7, lim=0.13):
    """Cadre noir du négatif et numéros écrits au bord : dernière ligne majoritairement sombre près de chaque bord."""
    h, w = g.shape
    def side(prof, n):
        idx = np.nonzero(prof[:int(n * lim)] > frac)[0]
        return idx.max() + 1 if len(idx) else 0
    cols, rows = (g < dark).mean(0), (g < dark).mean(1)
    return side(cols, w) / w, side(rows, h) / h, 1 - side(cols[::-1], w) / w, 1 - side(rows[::-1], h) / h


os.makedirs(CACHE, exist_ok=True)
os.makedirs(OUT, exist_ok=True)
src_path = os.path.join(ROOT, "data", "reconstitution.json")
sources = json.load(open(src_path)) if os.path.exists(src_path) else {}
for name, (iid, (cx, cy, fw)) in PHOTOS.items():
    full = os.path.join(CACHE, f"{name}.jpg")
    if not os.path.exists(full):
        d = json.loads(get(f"https://www.loc.gov/pictures/item/{iid}/?fo=json"))
        it, res = d.get("item", {}), (d.get("resources") or [{}])[0]
        url = res.get("larger") if str(res.get("larger", "")).endswith(".tif") else res.get("large")
        tif = os.path.join(CACHE, f"{name}.tif")
        open(tif, "wb").write(get(url))
        im = Image.open(tif)
        im = im.convert("RGB") if im.mode not in ("RGB", "L") else im
        w, h = im.size
        c = int(min(w, h) * 0.015)
        im = im.crop((c, c, w - c, h - c))
        g = np.asarray(im.convert("L").resize((800, round(800 * im.size[1] / im.size[0]))))
        l, t, r, b = border(g)
        pad = 0.01
        w, h = im.size
        im = im.crop((round((l + pad) * w), round((t + pad) * h), round((r - pad) * w), round((b - pad) * h)))
        im = ImageOps.autocontrast(im, cutoff=0.4)
        if im.size[0] > 3200:
            im = im.resize((3200, round(3200 * im.size[1] / im.size[0])), Image.LANCZOS)
        im.convert("RGB").save(full, quality=93)
        os.remove(tif)
        sources[name] = {"titre": it.get("title"), "date": it.get("date") or it.get("created_published_date"),
                         "lien": f"https://www.loc.gov/pictures/item/{iid}/", "droits": "No known restrictions on publication (Bibliothèque du Congrès)",
                         "fonds": "G. Eric and Edith Matson Photograph Collection" if res.get("aggregate") == "matpc" else res.get("aggregate")}
    im = Image.open(full).convert("RGB")
    pw, ph = im.size
    ww = fw * pw
    hh = ww * 9 / 16
    if hh > ph:
        hh, ww = ph, ph * 16 / 9
    x0 = min(max(cx * pw - ww / 2, 0), pw - ww)
    y0 = min(max(cy * ph - hh / 2, 0), ph - hh)
    im.crop((round(x0), round(y0), round(x0 + ww), round(y0 + hh))).resize((1920, 1080), Image.LANCZOS).save(os.path.join(OUT, f"{name}.jpg"), quality=92)
    print(name, (pw, ph), flush=True)
json.dump(sources, open(src_path, "w"), ensure_ascii=False, indent=1)
print("OK")
