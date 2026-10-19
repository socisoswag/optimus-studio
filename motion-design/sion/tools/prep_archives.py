"""Photos d'archives animées en relief (photo3d.html) : téléchargement, retouche, carte de profondeur.

    python3 tools/prep_archives.py <dossier_cache>

Photos : collection Matson (G. Eric and Edith Matson Photograph Collection), Bibliothèque du Congrès
des États-Unis, « no known restrictions on publication ». Fichiers d'origine (TIFF) téléchargés dans le cache,
ramenés à 2400 px de large dans data/archives/<numéro>.jpg (versionnés) ; les TIFF restent dans le cache.
Profondeur : Depth Anything V2 Small (Apache 2.0), version ONNX d'onnx-community, exécutée par onnxruntime ;
carte lissée dans data/archives/<numéro>-depth.png (proche = clair).
Couche arrière pour les trous de parallaxe : <numéro>-fond.jpg et <numéro>-fond-depth.png.
"""
import os
import sys
import time
import urllib.error
import urllib.request

import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(sys.argv[1], "archives")
OUT = os.path.join(ROOT, "data", "archives")
UA = "SionDocResearch/1.0"
# numéro LC-DIG-matpc → dossier sur tile.loc.gov
PHOTOS = ["06520", "04992", "12518", "21600", "20377", "17778", "15788"]
# cadrage (gauche, haut, droite, bas, en fraction) : cadre noir du négatif, numéros et légendes écrits au bord,
# 04992 est une vue stéréo (on garde l'image de gauche)
CROP = {
    "06520": (0.04, 0.01, 0.98, 0.93),
    "04992": (0.02, 0.01, 0.49, 0.92),
    "12518": (0.06, 0.045, 0.93, 0.955),
    "21600": (0.08, 0.05, 0.92, 0.935),
    "20377": (0.10, 0.095, 0.91, 0.93),
    "17778": (0.10, 0.09, 0.94, 0.925),
    "15788": (0.08, 0.045, 0.965, 0.975),
}
MODEL = "https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/main/onnx/model.onnx"


def fetch(url, path, tries=5):
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        return path
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=300) as r, open(path + ".part", "wb") as f:
                while True:
                    b = r.read(1 << 20)
                    if not b:
                        break
                    f.write(b)
            break
        except (urllib.error.URLError, TimeoutError):
            # tile.loc.gov renvoie parfois 520 : on réessaie un peu plus tard
            if k == tries - 1:
                raise
            time.sleep(10 * 2 ** k)
    os.replace(path + ".part", path)
    return path


def back_layer(n):
    """Couche arrière, vue seulement dans les trous qu'ouvre la parallaxe au bord des premiers plans :
    profondeur sans les premiers plans (érosion) et image prolongée derrière eux, depuis le fond seulement."""
    rgb = cv2.imread(os.path.join(OUT, f"{n}.jpg")).astype(np.float32)
    d = cv2.imread(os.path.join(OUT, f"{n}-depth.png"), 0).astype(np.float32) / 255
    h, w = d.shape
    r = int(0.035 * w)
    bd = cv2.erode(d, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1)))
    bd = np.minimum(cv2.GaussianBlur(bd, (0, 0), r / 3), d)
    # seulement près des vraies ruptures de profondeur (pas sur les pentes douces du sol)
    gx, gy = cv2.Sobel(d, cv2.CV_32F, 1, 0, ksize=5) / 48, cv2.Sobel(d, cv2.CV_32F, 0, 1, ksize=5) / 48
    edge = (np.hypot(gx, gy) > 0.012).astype(np.uint8)
    near = cv2.distanceTransform(1 - edge, cv2.DIST_L2, 5) < r
    band = near & ((d - bd) > 0.03)
    k = cv2.GaussianBlur(band.astype(np.float32), (0, 0), 6)
    bd = d + (bd - d) * np.clip(k * 2, 0, 1)
    # remplissage à mi-résolution : chaque pixel de la bande ne prend la couleur que de voisins plus lointains
    s = 0.5
    sz = (round(w * s), round(h * s))
    C = cv2.resize(rgb, sz, interpolation=cv2.INTER_AREA)
    Bd = cv2.resize(bd, sz, interpolation=cv2.INTER_AREA)
    Z = cv2.resize(d, sz, interpolation=cv2.INTER_AREA)
    todo = cv2.resize(band.astype(np.uint8), sz, interpolation=cv2.INTER_NEAREST) > 0
    todo = cv2.dilate(todo.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    V = ~todo
    for _ in range(int(r * s * 1.6)):
        left = todo & ~V
        if not left.any():
            break
        acc = np.zeros_like(C)
        cnt = np.zeros(Z.shape, np.float32)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx or dy:
                    ok = left & np.roll(V, (dy, dx), (0, 1)) & (np.roll(Z, (dy, dx), (0, 1)) <= Bd + 0.03)
                    acc[ok] += np.roll(C, (dy, dx), (0, 1))[ok]
                    cnt[ok] += 1
        new = cnt > 0
        C[new] = acc[new] / cnt[new][:, None]
        Z[new] = Bd[new]
        V |= new
    left = (todo & ~V).astype(np.uint8)
    if left.any():  # coins sans fond visible : reconstitution classique
        C = cv2.inpaint(np.clip(C, 0, 255).astype(np.uint8), left * 255, 5, cv2.INPAINT_TELEA).astype(np.float32)
    # adoucit les traînées du remplissage, dans la bande seulement
    tb = todo.astype(np.float32)
    Cb = cv2.GaussianBlur(C * tb[..., None], (0, 0), 3.5) / np.maximum(cv2.GaussianBlur(tb, (0, 0), 3.5), 1e-4)[..., None]
    C = np.where(todo[..., None], Cb, C)
    C = cv2.GaussianBlur(C, (0, 0), 1.0)
    up = cv2.resize(C, (w, h), interpolation=cv2.INTER_CUBIC)
    m = cv2.GaussianBlur(cv2.dilate(band.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(np.float32), (0, 0), 2)[..., None]
    cv2.imwrite(os.path.join(OUT, f"{n}-fond.jpg"), np.clip(rgb * (1 - m) + up * m, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])
    cv2.imwrite(os.path.join(OUT, f"{n}-fond-depth.png"), (bd * 255).round().astype(np.uint8))


os.makedirs(CACHE, exist_ok=True)
os.makedirs(OUT, exist_ok=True)
sess = ort.InferenceSession(fetch(MODEL, os.path.join(CACHE, "depth-anything-v2-small.onnx")), providers=["CPUExecutionProvider"])
inp = sess.get_inputs()[0].name

for n in PHOTOS:
    if os.path.exists(os.path.join(OUT, f"{n}-depth.png")):
        if not os.path.exists(os.path.join(OUT, f"{n}-fond-depth.png")):
            back_layer(n)
            print(n, "fond", flush=True)
        continue
    folder = f"{int(n) // 100 * 100:05d}"
    tif = fetch(f"https://tile.loc.gov/storage-services/master/pnp/matpc/{folder}/{n}u.tif", os.path.join(CACHE, f"{n}u.tif"))
    im = Image.open(tif)
    im = im.convert("RGB") if im.mode not in ("RGB", "L") else im
    # négatifs sur verre et tirages : bord abîmé rogné, niveaux automatiques doux
    w, h = im.size
    c = int(min(w, h) * 0.015)
    im = im.crop((c, c, w - c, h - c))
    l, t, r, b = CROP.get(n, (0, 0, 1, 1))
    w, h = im.size
    im = im.crop((round(l * w), round(t * h), round(r * w), round(b * h)))
    im = ImageOps.autocontrast(im.convert("L") if im.mode == "L" else im, cutoff=0.4)
    print(n, "original", im.size, flush=True)
    im = im.resize((2400, round(2400 * im.size[1] / im.size[0])), Image.LANCZOS)
    rgb = im.convert("RGB")
    rgb.save(os.path.join(OUT, f"{n}.jpg"), quality=90)
    # profondeur : entrée 518 px, normalisation ImageNet
    a = np.asarray(rgb.resize((518, round(518 * rgb.size[1] / rgb.size[0] / 14) * 14), Image.BICUBIC)).astype(np.float32) / 255
    a = (a - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    d = sess.run(None, {inp: a.transpose(2, 0, 1)[None].astype(np.float32)})[0][0]
    d = cv2.resize(d, rgb.size, interpolation=cv2.INTER_CUBIC)
    lo, hi = np.percentile(d, 1), np.percentile(d, 99)
    d = np.clip((d - lo) / (hi - lo), 0, 1)
    # lissage qui respecte les bords (moins d'étirements aux contours)
    d = cv2.bilateralFilter(d.astype(np.float32), 9, 0.08, 9)
    # premiers plans légèrement élargis : quand la caméra bouge, l'étirement tombe dans le fond qui les entoure
    # (ciel, mur), pas sur leurs bords ; les feuillages deviennent une masse au lieu d'un peigne
    r = max(2, int(0.004 * d.shape[1]))
    d = cv2.dilate(d, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1)))
    d = cv2.GaussianBlur(d, (0, 0), 2.5)
    Image.fromarray((d * 255).round().astype(np.uint8)).save(os.path.join(OUT, f"{n}-depth.png"))
    back_layer(n)
    print(n, rgb.size, flush=True)
print("OK")
