"""Prépare les photos d'archive des personnages : restauration, agrandissement fidèle,
contraste, netteté, puis détourage fin (cheveux compris).

    MODELS=/dossier/des/modeles python3 tools/portraits.py portraits/src portraits

Entrée : une photo par personnage dans portraits/src/ (jpg, png, tif, webp), nommée par sa
clé (herzl.jpg, arafat.jpg… voir portraits/LISEZMOI.md).
Sortie : portraits/<clé>.png (noir et blanc détouré, fond transparent, cadré sur la personne)
et portraits/<clé>.jpg (même photo restaurée, avec son fond).

Chaîne, sans rien inventer du visage :
  1. débruitage adapté au grain mesuré, retrait des petites taches et rayures (inpainting local) ;
  2. agrandissement par super-résolution EDSR (réseau fidèle, non génératif) jusqu'à ~1 900 px ;
  3. contraste local (CLAHE) et netteté douce ;
  4. détourage : modèle IS-Net (bords précis) combiné à U²-Net « humain », puis affinage du
     contour par matting (pymatting) pour garder les cheveux.
Modèles (licences libres) : EDSR_x2.pb / EDSR_x4.pb (Saafke/EDSR_Tensorflow, Apache 2.0),
isnet-general-use.onnx et u2net_human_seg.onnx (rembg, Apache 2.0).
"""
import glob
import os
import sys

import cv2
import numpy as np
import onnxruntime as ort

SRC, DST = sys.argv[1], sys.argv[2]
MODELS = os.environ.get("MODELS", ".")
TARGET_H = 1900  # hauteur visée après agrandissement (px)

def model(name):
    path = os.path.join(MODELS, name)
    return path if os.path.exists(path) else None


SEG = []
for name, size in (("isnet-general-use.onnx", 1024), ("u2net_human_seg.onnx", 320)):
    if model(name):
        s = ort.InferenceSession(model(name), providers=["CPUExecutionProvider"])
        SEG.append((s, s.get_inputs()[0].name, size))
if not SEG:
    sys.exit("aucun modèle de détourage trouvé dans MODELS")


def seg_mask(rgb, sess, inp, size):
    h, w = rgb.shape[:2]
    x = cv2.resize(rgb, (size, size), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    if size == 1024:  # IS-Net : normalisation simple
        x = (x - 0.5) / 1.0
    else:  # U²-Net : normalisation ImageNet
        x = (x - np.array([0.485, 0.456, 0.406])) / np.array([0.229, 0.224, 0.225])
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    out = sess.run(None, {inp: x})[0][0, 0]
    out = (out - out.min()) / (out.max() - out.min() + 1e-8)
    return np.clip(cv2.resize(out, (w, h), interpolation=cv2.INTER_CUBIC), 0, 1)


def person_mask(rgb):
    """Moyenne des modèles disponibles (IS-Net pour les bords, U²-Net pour la silhouette)."""
    ms = [seg_mask(rgb, *s) for s in SEG]
    return np.clip(sum(ms) / len(ms), 0, 1)


def refine_alpha(gray, m):
    """Affine le contour (cheveux) par matting sur une bande d'incertitude autour du masque."""
    try:
        from pymatting import estimate_alpha_cf
    except ImportError:
        return np.clip((m - 0.3) / 0.4, 0, 1)
    h, w = gray.shape
    k = 900 / max(h, w)
    small = cv2.resize(gray, None, fx=k, fy=k, interpolation=cv2.INTER_AREA) if k < 1 else gray
    ms = cv2.resize(m, (small.shape[1], small.shape[0]), interpolation=cv2.INTER_AREA)
    fg = cv2.erode((ms > 0.85).astype(np.uint8), np.ones((9, 9), np.uint8))
    bg = cv2.erode((ms < 0.15).astype(np.uint8), np.ones((15, 15), np.uint8))
    tri = np.full(ms.shape, 0.5)
    tri[fg > 0] = 1.0
    tri[bg > 0] = 0.0
    img = cv2.cvtColor(small, cv2.COLOR_GRAY2RGB).astype(np.float64) / 255.0
    a = estimate_alpha_cf(img, tri)
    return np.clip(cv2.resize(a.astype(np.float32), (w, h), interpolation=cv2.INTER_CUBIC), 0, 1)


def noise_sigma(g):
    """Estimation du grain (écart absolu médian du laplacien)."""
    lap = cv2.Laplacian(g.astype(np.float32), cv2.CV_32F)
    return float(np.median(np.abs(lap)) * 1.4826 / 2.0)


def despeckle(g):
    """Retire les petites taches blanches/noires et les rayures fines (pellicule, tirage abîmé)."""
    med = cv2.medianBlur(g, 5)
    diff = cv2.absdiff(g, med)
    spots = (diff > 38).astype(np.uint8)
    spots = cv2.morphologyEx(spots, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(spots)
    keep = np.zeros_like(spots)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] <= 60:  # seulement les petits défauts, jamais les détails
            keep[lab == i] = 1
    if keep.any():
        g = cv2.inpaint(g, cv2.dilate(keep, np.ones((3, 3), np.uint8)) * 255, 3, cv2.INPAINT_TELEA)
    return g


def upscale(g):
    """Super-résolution EDSR (fidèle) jusqu'à TARGET_H, puis Lanczos pour l'ajustement final."""
    h = g.shape[0]
    need = TARGET_H / h
    if need <= 1.05:
        return g, 1.0
    f = 4 if need > 2.6 and model("EDSR_x4.pb") else 2 if model("EDSR_x2.pb") else 0
    if f:
        sr = cv2.dnn_superres.DnnSuperResImpl_create()
        sr.readModel(model(f"EDSR_x{f}.pb"))
        sr.setModel("edsr", f)
        big = sr.upsample(cv2.cvtColor(g, cv2.COLOR_GRAY2BGR))
        g2 = cv2.cvtColor(big, cv2.COLOR_BGR2GRAY)
    else:
        g2 = g
    s = TARGET_H / g2.shape[0]
    if abs(s - 1) > 0.02:
        g2 = cv2.resize(g2, None, fx=s, fy=s, interpolation=cv2.INTER_LANCZOS4 if s > 1 else cv2.INTER_AREA)
    return g2, TARGET_H / h


def enhance(gray):
    sig = noise_sigma(gray)
    g = despeckle(gray)
    g = cv2.fastNlMeansDenoising(g, None, h=float(np.clip(sig * 1.6, 3, 12)), templateWindowSize=7, searchWindowSize=21)
    g, scale = upscale(g)
    g = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(g)
    blur = cv2.GaussianBlur(g, (0, 0), 1.6)
    g = cv2.addWeighted(g, 1.45, blur, -0.45, 0)  # netteté douce
    return g, scale, sig


os.makedirs(DST, exist_ok=True)
files = sorted(f for f in glob.glob(os.path.join(SRC, "*")) if f.lower().endswith((".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp")))
for f in files:
    name = os.path.splitext(os.path.basename(f))[0]
    bgr = cv2.imread(f, cv2.IMREAD_COLOR)
    if bgr is None:
        print("illisible :", f)
        continue
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    m = person_mask(rgb)
    g, scale, sig = enhance(gray)
    m = cv2.resize(m, (g.shape[1], g.shape[0]), interpolation=cv2.INTER_CUBIC)
    a = refine_alpha(g, m)
    a = cv2.GaussianBlur(a, (0, 0), 0.8)
    # cadrage serré sur la personne (marge de 4 %), le bas du buste reste au bord
    ys, xs = np.where(a > 0.5)
    if len(xs):
        mx, my = int(0.04 * g.shape[1]), int(0.04 * g.shape[0])
        x0, x1 = max(0, xs.min() - mx), min(g.shape[1], xs.max() + mx)
        y0, y1 = max(0, ys.min() - my), g.shape[0]
        g, a = g[y0:y1, x0:x1], a[y0:y1, x0:x1]
    rgba = np.dstack([g, g, g, (a * 255).astype(np.uint8)])
    cv2.imwrite(os.path.join(DST, f"{name}.png"), cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
    cv2.imwrite(os.path.join(DST, f"{name}.jpg"), g, [cv2.IMWRITE_JPEG_QUALITY, 92])
    print(f"{name}: {g.shape[1]}×{g.shape[0]} px, ×{scale:.1f}, grain {sig:.1f}, détouré")
