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
# recadrages serrés (fractions de la hauteur gardées) pour les photos prises de trop loin
# (haut, bas) ou (gauche, haut, droite, bas)
CROP = {"abd-al-qadir": (0.0, 0.64), "finkielkraut": (0.18, 0.0, 0.86, 0.62)}
# débruitage plafonné pour les tirages très compressés (sinon la peau fait des plaques)
DENOISE_MAX = {"mcmahon": 2.5}
# zones à exclure du détourage (polygones en fractions de l'image) : voisins collés au sujet
ERASE = {
    "koestler": [
        [(0.64, 0.0), (1.0, 0.0), (1.0, 0.62), (0.86, 0.6), (0.8, 0.42), (0.77, 0.3), (0.74, 0.2), (0.70, 0.12), (0.66, 0.06)],
        [(0.0, 0.0), (0.24, 0.0), (0.2, 0.3), (0.12, 0.45), (0.05, 0.55), (0.0, 0.56)],
    ],
    "begin": [
        [(0.27, 0.0), (0.71, 0.0), (0.71, 0.062), (0.27, 0.062)],
        [(0.70, 0.0), (1.0, 0.0), (1.0, 0.57), (0.76, 0.45), (0.735, 0.30)],
        [(0.0, 0.0), (0.28, 0.0), (0.265, 0.3), (0.2, 0.45), (0.12, 0.56), (0.1, 1.0), (0.0, 1.0)],
    ],
}
TARGET_H = 1500  # hauteur visée après agrandissement (px) ; affiché à ~900 px dans les vidéos
MAX_UP = 3.2     # jamais plus de ×3,2 : au-delà, l'image devient lisse et « fabriquée »

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
    """Affine le contour par filtre guidé (rapide, léger en mémoire) ; MATTING=cf pour le matting
    « closed-form », plus fin mais qui peut saturer la mémoire sur certaines photos."""
    if os.environ.get("MATTING") == "cf":
        return refine_alpha_cf(gray, m)
    from cv2.ximgproc import guidedFilter
    g = gray.astype(np.float32) / 255.0
    a = guidedFilter(g, m.astype(np.float32), 18, 2e-3)   # silhouette
    a = guidedFilter(g, np.clip(a, 0, 1), 5, 2e-4)        # cheveux, bords fins
    return np.clip((a - 0.18) / 0.64, 0, 1)


def refine_alpha_cf(gray, m):
    """Affine le contour (cheveux) par matting sur une bande d'incertitude autour du masque."""
    try:
        from pymatting import estimate_alpha_cf
    except ImportError:
        return np.clip((m - 0.3) / 0.4, 0, 1)
    h, w = gray.shape
    k = 760 / max(h, w)  # matting à ~760 px : assez fin pour les cheveux, sans saturer la mémoire
    small = cv2.resize(gray, None, fx=k, fy=k, interpolation=cv2.INTER_AREA) if k < 1 else gray
    ms = cv2.resize(m, (small.shape[1], small.shape[0]), interpolation=cv2.INTER_AREA)
    fg = cv2.erode((ms > 0.85).astype(np.uint8), np.ones((9, 9), np.uint8))
    bg = cv2.erode((ms < 0.15).astype(np.uint8), np.ones((15, 15), np.uint8))
    tri = np.full(ms.shape, 0.5)
    tri[fg > 0] = 1.0
    tri[bg > 0] = 0.0
    if (tri == 0.5).mean() > 0.2:
        # bord trop incertain (costume sombre sur fond sombre) : le matting s'emballe en mémoire ;
        # on garde le masque des réseaux, adouci
        return np.clip((cv2.GaussianBlur(m, (0, 0), 1.2) - 0.35) / 0.3, 0, 1)
    img = cv2.cvtColor(small, cv2.COLOR_GRAY2RGB).astype(np.float64) / 255.0
    a = estimate_alpha_cf(img, tri)
    return np.clip(cv2.resize(a.astype(np.float32), (w, h), interpolation=cv2.INTER_CUBIC), 0, 1)


def decontaminate(gray, a):
    """Retire la couleur du fond d'origine dans les zones semi-transparentes (cheveux, épaules)."""
    try:
        from pymatting import estimate_foreground_ml
    except ImportError:
        return gray
    h, w = gray.shape
    k = 900 / max(h, w)
    small = cv2.resize(gray, None, fx=k, fy=k, interpolation=cv2.INTER_AREA) if k < 1 else gray
    sa = cv2.resize(a, (small.shape[1], small.shape[0]), interpolation=cv2.INTER_AREA)
    fg = estimate_foreground_ml(cv2.cvtColor(small, cv2.COLOR_GRAY2RGB).astype(np.float64) / 255.0, sa.astype(np.float64))
    fg = cv2.resize(fg[..., 0].astype(np.float32), (w, h), interpolation=cv2.INTER_CUBIC)
    # on ne remplace que le bord : l'intérieur garde tout son détail
    edge = ((a > 0.02) & (a < 0.98)).astype(np.float32)
    edge = cv2.GaussianBlur(cv2.dilate(edge, np.ones((5, 5), np.uint8)), (0, 0), 2)
    out = gray.astype(np.float32) * (1 - edge) + np.clip(fg * 255, 0, 255) * edge
    return np.clip(out, 0, 255).astype(np.uint8)


def noise_sigma(g):
    """Estimation du grain (écart absolu médian du laplacien)."""
    lap = cv2.Laplacian(g.astype(np.float32), cv2.CV_32F)
    return float(np.median(np.abs(lap)) * 1.4826 / 2.0)


def despeckle(g):
    """Retire les petites taches blanches/noires et les rayures fines (pellicule, tirage abîmé)."""
    med = cv2.medianBlur(g, 5)
    diff = cv2.absdiff(g, med)
    # une tache est un point isolé sur une zone lisse : jamais un poil de barbe, un motif ou un œil
    mf = med.astype(np.float32)
    std = np.sqrt(np.maximum(cv2.blur(mf * mf, (11, 11)) - cv2.blur(mf, (11, 11)) ** 2, 0))
    spots = ((diff > 45) & (std < 9)).astype(np.uint8)
    spots = cv2.morphologyEx(spots, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(spots)
    keep = np.zeros_like(spots)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] <= 30:
            keep[lab == i] = 1
    if keep.any():
        g = cv2.inpaint(g, cv2.dilate(keep, np.ones((3, 3), np.uint8)) * 255, 3, cv2.INPAINT_TELEA)
    return g


def upscale(g):
    """Super-résolution EDSR (fidèle) jusqu'à TARGET_H, puis Lanczos pour l'ajustement final."""
    h = g.shape[0]
    need = min(TARGET_H / h, MAX_UP)
    if need <= 1.05:
        return g, 1.0
    # EDSR seulement pour un vrai agrandissement : en dessous de ×1,6, Lanczos suffit (et EDSR sur
    # une grande image coûte des minutes et des gigaoctets)
    f = 0 if need < 1.6 else 4 if need > 2.6 and model("EDSR_x4.pb") else 2 if model("EDSR_x2.pb") else 0
    if f:
        sr = cv2.dnn_superres.DnnSuperResImpl_create()
        sr.readModel(model(f"EDSR_x{f}.pb"))
        sr.setModel("edsr", f)
        big = sr.upsample(cv2.cvtColor(g, cv2.COLOR_GRAY2BGR))
        g2 = cv2.cvtColor(big, cv2.COLOR_BGR2GRAY)
    else:
        g2 = g
    s = need * h / g2.shape[0]
    if abs(s - 1) > 0.02:
        g2 = cv2.resize(g2, None, fx=s, fy=s, interpolation=cv2.INTER_LANCZOS4 if s > 1 else cv2.INTER_AREA)
    return g2, need


def enhance(gray, name=""):
    """Ne pas abîmer : une photo récente et nette n'est ni débruitée ni agrandie ;
    un vieux tirage petit et granuleux reçoit la restauration complète."""
    sig = noise_sigma(gray)
    h0 = gray.shape[0]
    old = h0 < 1300
    g = despeckle(gray)
    if (old and sig > 2.5) or sig > 7:  # vieux tirage, ou photo récente très granuleuse
        g = cv2.fastNlMeansDenoising(g, None, h=float(np.clip(sig * 0.7, 2, DENOISE_MAX.get(name, 5.5))), templateWindowSize=7, searchWindowSize=15)
    g, scale = upscale(g) if old else (g, 1.0)
    g = cv2.createCLAHE(clipLimit=1.15, tileGridSize=(4, 4)).apply(g)
    blur = cv2.GaussianBlur(g, (0, 0), 1.0)
    g = cv2.addWeighted(g, 1.16 if old else 1.08, blur, -(0.16 if old else 0.08), 0)
    # grain fin réinjecté sur les tirages agrandis (évite l'aspect lissé « IA »)
    if scale > 1.05:
        rng = np.random.default_rng(7)
        g = np.clip(g.astype(np.float32) + rng.normal(0, 2.0, g.shape), 0, 255).astype(np.uint8)
    return g, scale, sig


os.makedirs(DST, exist_ok=True)
files = sorted(f for f in glob.glob(os.path.join(SRC, "*")) if f.lower().endswith((".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp")))
FORCE = os.environ.get("FORCE") == "1"
for f in files:
    name = os.path.splitext(os.path.basename(f))[0]
    if not FORCE and os.path.exists(os.path.join(DST, f"{name}.png")):
        continue  # déjà fait (FORCE=1 pour tout refaire)
    bgr = cv2.imread(f, cv2.IMREAD_COLOR)
    if bgr is None:
        print("illisible :", f)
        continue
    if name in CROP:
        c = CROP[name]; hb, wb = bgr.shape[:2]
        x0, y0, x1, y1 = (0.0, c[0], 1.0, c[1]) if len(c) == 2 else c
        bgr = bgr[int(y0 * hb):int(y1 * hb), int(x0 * wb):int(x1 * wb)]
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    m = person_mask(rgb)
    for poly in ERASE.get(name, []):
        hb, wb = m.shape
        z = np.zeros_like(m, np.uint8)
        cv2.fillPoly(z, [np.array([[int(x * wb), int(y * hb)] for x, y in poly], np.int32)], 1)
        m = m * (1 - cv2.GaussianBlur(z.astype(np.float32), (0, 0), 3))
    g, scale, sig = enhance(gray, name)
    m = cv2.resize(m, (g.shape[1], g.shape[0]), interpolation=cv2.INTER_CUBIC)
    a = refine_alpha(g, m)
    # contour resserré d'un pixel, puis adouci : plus de liseré du fond d'origine
    a = cv2.erode(a, np.ones((3, 3), np.uint8))
    a = cv2.GaussianBlur(a, (0, 0), 0.9)
    # ne garder que la personne principale (la plus grande tache), pas un voisin à l'arrière-plan
    nlab, lab, st, _ = cv2.connectedComponentsWithStats((a > 0.35).astype(np.uint8))
    if nlab > 2:
        main = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
        keep = cv2.dilate((lab == main).astype(np.uint8), np.ones((25, 25), np.uint8)).astype(np.float32)
        a = a * cv2.GaussianBlur(keep, (0, 0), 6)
    gd = decontaminate(g, a)  # bord nettoyé pour le détourage ; la version avec fond reste intacte
    # cadrage serré sur la personne (marge de 4 %), le bas du buste reste au bord
    ys, xs = np.where(a > 0.5)
    if len(xs):
        mx, my = int(0.04 * g.shape[1]), int(0.04 * g.shape[0])
        x0, x1 = max(0, xs.min() - mx), min(g.shape[1], xs.max() + mx)
        y0, y1 = max(0, ys.min() - my), g.shape[0]
        g, gd, a = g[y0:y1, x0:x1], gd[y0:y1, x0:x1], a[y0:y1, x0:x1]
    # le buste s'efface vers le bas au lieu d'être coupé net
    hh = a.shape[0]; ramp = np.ones(hh, np.float32); n0 = int(hh * 0.16)
    ramp[hh - n0:] = np.linspace(1, 0, n0) ** 1.6
    a = a * ramp[:, None]
    rgba = np.dstack([gd, gd, gd, (a * 255).astype(np.uint8)])
    cv2.imwrite(os.path.join(DST, f"{name}.png"), cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
    cv2.imwrite(os.path.join(DST, f"{name}.jpg"), g, [cv2.IMWRITE_JPEG_QUALITY, 92])
    print(f"{name}: {g.shape[1]}×{g.shape[0]} px, ×{scale:.1f}, grain {sig:.1f}, détouré")
