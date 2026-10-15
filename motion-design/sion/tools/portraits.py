"""Prépare les photos d'archive des personnages : nettoyage, agrandissement,
contraste local, netteté, puis détourage (la personne sans son fond).

    MODEL=/chemin/u2net_human_seg.onnx python3 tools/portraits.py portraits/src portraits

Entrée : une photo par personnage dans portraits/src/ (jpg, png, tif), nommée
comme dans portraits/LISEZMOI.md (herzl.jpg, arafat.jpg…).
Sortie : portraits/<nom>.png (noir et blanc détouré, fond transparent) et
portraits/<nom>.jpg (même photo améliorée, avec son fond).
Modèle de détourage : u2net_human_seg (rembg, licence Apache 2.0).
"""
import glob
import os
import sys

import cv2
import numpy as np
import onnxruntime as ort

SRC, DST = sys.argv[1], sys.argv[2]
MODEL = os.environ.get("MODEL", "u2net_human_seg.onnx")
TARGET_H = 1800  # hauteur de sortie (px)

sess = ort.InferenceSession(MODEL, providers=["CPUExecutionProvider"])
INP = sess.get_inputs()[0].name


def person_mask(rgb):
    """Masque 0..1 de la personne (modèle u2net, entrée 320 × 320)."""
    h, w = rgb.shape[:2]
    x = cv2.resize(rgb, (320, 320), interpolation=cv2.INTER_AREA).astype(np.float32)
    x /= max(1.0, x.max())
    x = (x - np.array([0.485, 0.456, 0.406])) / np.array([0.229, 0.224, 0.225])
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    out = sess.run(None, {INP: x})[0][0, 0]
    out = (out - out.min()) / (out.max() - out.min() + 1e-8)
    return np.clip(cv2.resize(out, (w, h), interpolation=cv2.INTER_CUBIC), 0, 1)


def enhance(gray):
    """Débruitage, agrandissement, contraste local, netteté."""
    g = cv2.fastNlMeansDenoising(gray, None, h=6, templateWindowSize=7, searchWindowSize=21)
    scale = max(1.0, TARGET_H / g.shape[0])
    if scale > 1.0:
        g = cv2.resize(g, None, fx=scale, fy=scale, interpolation=cv2.INTER_LANCZOS4)
    clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
    g = clahe.apply(g)
    blur = cv2.GaussianBlur(g, (0, 0), 2.2)
    g = cv2.addWeighted(g, 1.55, blur, -0.55, 0)
    return g, scale


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
    g, scale = enhance(gray)
    m = cv2.resize(m, (g.shape[1], g.shape[0]), interpolation=cv2.INTER_CUBIC)
    a = np.clip((m - 0.3) / 0.4, 0, 1)
    a = cv2.GaussianBlur(a, (0, 0), 1.2)
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
    print(f"{name}: {g.shape[1]}×{g.shape[0]} px, ×{scale:.1f}, détouré")
