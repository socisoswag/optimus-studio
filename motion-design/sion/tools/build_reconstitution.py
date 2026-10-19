"""Monte les photos d'archive animées par IA (clips Gemini/Veo, Kling, Firefly) avec le traitement du film.

    python3 tools/build_reconstitution.py <dossier_des_clips>            reconnaît, prépare et rend tous les clips
    python3 tools/build_reconstitution.py <dossier_des_clips> --essai    reconnaît et prépare seulement (pas de rendu)

1. Reconnaissance : la première image de chaque clip est comparée aux images de départ
   (output/reconstitution/*.jpg) ; pas besoin de renommer les fichiers. Un clip sans photo de départ
   (la scène du vote) se reconnaît à son nom de fichier (« vote » ou « 19 »).
2. Images : chaque clip est ramené en 1920 x 1080, 25 images/s, dans output/reconstitution/images/<nom>/.
3. Timeline générée : timelines/reconstitutions.js (page photo3d.html), un plan par clip :
   la photo reste figée 1,4 s (première image du clip) le temps que la légende arrive, puis s'anime,
   et se fige 0,6 s sur sa dernière image ; ton papier, grain, poussière, mention « animée par IA ».
4. Rendu : tools/build_intro.sh reconstitutions → output/reconstitutions.mp4 et un fichier par plan
   dans output/reconstitutions/ ; puis contrôle (tools/verif_video.py).
Légendes : data/reconstitution-legendes.json.
"""
import glob
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1]
essai = "--essai" in sys.argv
LEG = json.load(open(os.path.join(ROOT, "data", "reconstitution-legendes.json")))
REF = {os.path.splitext(os.path.basename(f))[0]: f for f in glob.glob(os.path.join(ROOT, "output", "reconstitution", "*.jpg"))}
FPS, HOLD, FREEZE, FADE = 25, 1.4, 0.6, 0.35


def sig(img):
    a = np.asarray(img.convert("L").resize((96, 54), Image.BILINEAR)).astype(np.float32)
    a -= a.mean()
    return a / (np.linalg.norm(a) + 1e-6)


refs = {k: sig(Image.open(f)) for k, f in REF.items()}
clips = sorted(f for f in glob.glob(os.path.join(src, "*")) if os.path.splitext(f)[1].lower() in (".mp4", ".mov", ".webm", ".mkv"))
found = {}
tmp = os.path.join(ROOT, "output", "reconstitution", "images")
os.makedirs(tmp, exist_ok=True)
for f in clips:
    first = os.path.join(tmp, "_premiere.jpg")
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", f, "-frames:v", "1", first], check=True)
    s = sig(Image.open(first))
    scores = sorted(((float((s * r).sum()), k) for k, r in refs.items()), reverse=True)
    base = os.path.basename(f).lower()
    if "vote" in base or base.startswith("19"):
        name, score = "19-vote-onu-1947", 1.0
    else:
        score, name = scores[0]
    ok = score > 0.55
    print(f"{os.path.basename(f)} : {name if ok else 'non reconnu'} (ressemblance {score:.2f})")
    if ok:
        if name in found:
            print(f"  déjà un clip pour {name} : on garde le premier ({os.path.basename(found[name])})")
            continue
        found[name] = f

photos, shots, amb, t = [], [], [], 0.0
order = sorted(found, key=lambda k: list(LEG).index(k) if k in LEG else 99)
for name in order:
    out = os.path.join(tmp, name)
    os.makedirs(out, exist_ok=True)
    for old in glob.glob(os.path.join(out, "*.jpg")):
        os.remove(old)
    vf = f"fps={FPS},scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080"
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", found[name], "-vf", vf, "-q:v", "3", os.path.join(out, "%04d.jpg")], check=True)
    n = len(glob.glob(os.path.join(out, "*.jpg")))
    L = LEG.get(name, {})
    dur = HOLD + n / FPS + FREEZE
    photos.append({
        "id": name, "t0": round(t, 3), "t1": round(t + dur, 3), "fade": FADE, "hold": HOLD,
        "frames": {"dir": f"output/reconstitution/images/{name}", "n": n, "fps": FPS},
        "eyebrow": L.get("eyebrow", ""), "place": L.get("place", ""), "sub": L.get("sub", ""), "at": 0.35, "out": max(1.0, dur - 5.2),
        "credit": L.get("credit", "Photo d’archive animée par IA · Matson · Bibliothèque du Congrès"
                        if name != "07-immigrants-ellis-island" else "Photo d’archive animée par IA · Bibliothèque du Congrès"),
        "from": {"cx": 0.5, "cy": 0.5, "w": 1.0, "focus": 0.5}, "to": {"cx": 0.5, "cy": 0.5, "w": 0.95, "focus": 0.5},
    })
    shots.append({"id": name, "t0": round(t, 3), "t1": round(t + dur, 3)})
    amb.append([round(t, 3), round(t + dur, 3), L.get("amb", "vent"), 0.9])
    print(f"  {name} : {n} images, {dur:.1f} s")
    t += dur

if not photos:
    sys.exit("aucun clip reconnu")
intro = {
    "name": "reconstitutions", "page": "photo3d.html", "total": round(t, 3), "fov": 50, "xfade": 0, "fadeIn": 0.01, "fadeOut": 0.01,
    "coc": 0, "photos": photos, "shots": shots, "plans": True,
    "sound": {"wind": False, "projector": True, "amb": amb},
}
path = os.path.join(ROOT, "timelines", "reconstitutions.js")
with open(path, "w") as fh:
    fh.write("/* Généré par tools/build_reconstitution.py : ne pas modifier à la main (légendes : data/reconstitution-legendes.json). */\n")
    fh.write("(function (root) {\n  root.INTRO = " + json.dumps(intro, ensure_ascii=False, indent=1) + ";\n})(typeof window !== 'undefined' ? window : globalThis);\n")
print(f"timeline : {path} ({len(photos)} plans, {t:.1f} s)")
if essai:
    sys.exit(0)
subprocess.run(["bash", "tools/build_intro.sh", "reconstitutions"], cwd=ROOT, check=True)
subprocess.run(["python3", "tools/verif_video.py", "output/reconstitutions.mp4", "--timeline", "reconstitutions"], cwd=ROOT)
