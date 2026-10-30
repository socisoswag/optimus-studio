"""Monte les photos d'archive animées par IA (clips Gemini/Veo, Kling, Firefly) avec le traitement du film.

    python3 tools/build_reconstitution.py <dossier_des_clips>            reconnaît, prépare et rend tous les clips
    python3 tools/build_reconstitution.py <dossier_des_clips> --essai    reconnaît et prépare seulement (pas de rendu)
    python3 tools/build_reconstitution.py <dossier> 6a0417f9=2-quai-jaffa   attribue un clip à la main (morceau de son nom)
    python3 tools/build_reconstitution.py data/gemini   les clips reçus, gardés sous le nom de leur photo de départ
    python3 tools/build_reconstitution.py --fixes       les photos montrées seules par choix (« fixe » dans les
                                                        légendes) : timelines/photos-fixes.js → output/photos-fixes/

1. Reconnaissance : la première image de chaque clip est comparée aux images de départ
   (output/reconstitution/*.jpg) ; pas besoin de renommer les fichiers. Un clip sans photo de départ
   (la scène du vote) se reconnaît à son nom de fichier (« vote » ou « 19 »).
2. Images : chaque clip est ramené en 1920 x 1080, 25 images/s, dans output/reconstitution/images/<nom>/.
3. Timeline générée : timelines/reconstitutions.js (page photo3d.html), un plan par clip, selon ce que l'IA a fait
   (ressemblance de chaque image du clip avec la photo, deux fois par seconde) :
   - le clip anime vraiment la photo : elle reste figée 1,4 s le temps que la légende arrive, s'anime, se fige
     0,6 s sur sa dernière image ; mention « Photo d'archive animée par IA » ;
   - le clip réinvente la scène : la vraie photo d'abord, 2,6 s (mention « Photo d'archive »), puis fondu vers le clip
     (mention « Reconstitution par IA, d'après une photo d'archive ») ; si le clip part de la photo puis change
     de scène, ce passage est coupé ;
   - sans photo de départ (le vote) : « Scène reconstituée par IA ».
   Ton papier, grain, poussière et papillotement comme les archives en relief.
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
# --fixes : seulement les photos sans clip par choix (personnes réelles, sujets où la vraie photo vaut preuve),
# dans une pièce à part pour ne pas refaire le rendu des reconstitutions
FIXES = "--fixes" in sys.argv
NOM = "photos-fixes" if FIXES else "reconstitutions"
# attribution à la main : un morceau du nom du fichier = nom du plan (pour une scène trop réinventée pour être reconnue)
MANUEL = dict(x.split("=", 1) for x in sys.argv[2:] if "=" in x)
LEG = json.load(open(os.path.join(ROOT, "data", "reconstitution-legendes.json")))
# photos de départ : copie versionnée dans data/reconstitution/, celles de output/reconstitution/ (tools/prep_reconstitution.py) passent devant
REF = {os.path.splitext(os.path.basename(f))[0]: f for d in ("data", "output") for f in sorted(glob.glob(os.path.join(ROOT, d, "reconstitution", "*.jpg")))}
FPS, HOLD, FREEZE, FADE = 25, 1.4, 0.6, 0.35
PHOTO = 2.6  # la vraie photo, seule à l'écran avant le fondu vers la reconstitution


def sig(img):
    a = np.asarray(img.convert("L").resize((96, 54), Image.BILINEAR)).astype(np.float32)
    a -= a.mean()
    return a / (np.linalg.norm(a) + 1e-6)


refs = {k: sig(Image.open(f)) for k, f in REF.items()}
clips = [] if FIXES else sorted(f for f in glob.glob(os.path.join(src, "*")) if os.path.splitext(f)[1].lower() in (".mp4", ".mov", ".webm", ".mkv"))
found = {}
tmp = os.path.join(ROOT, "output", "reconstitution", "images")
os.makedirs(tmp, exist_ok=True)
for f in clips:
    first = os.path.join(tmp, "_premiere.jpg")
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", f, "-frames:v", "1", first], check=True)
    s = sig(Image.open(first))
    scores = sorted(((float((s * r).sum()), k) for k, r in refs.items()), reverse=True)
    base = os.path.basename(f).lower()
    hand = [v for k, v in MANUEL.items() if k.lower() in base]
    if hand:
        name, score = hand[0], 1.0
    elif os.path.splitext(base)[0] in {k.lower() for k in REF}:  # clip rangé sous le nom de sa photo (data/gemini/)
        name, score = next(k for k in REF if k.lower() == os.path.splitext(base)[0]), 1.0
    elif "vote" in base or base.startswith("19"):
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
XF = 0.8
SRC_CREDIT = "Matson · Bibliothèque du Congrès"


def drift(f, ref):
    """Ressemblance de l'image du clip avec la photo de départ, deux fois par seconde."""
    d = os.path.join(tmp, "_derive")
    os.makedirs(d, exist_ok=True)
    for old in glob.glob(os.path.join(d, "*.jpg")):
        os.remove(old)
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", f, "-vf", "fps=2", os.path.join(d, "%04d.jpg")], check=True)
    return [(i / 2, float((sig(Image.open(g)) * ref).sum())) for i, g in enumerate(sorted(glob.glob(os.path.join(d, "*.jpg"))))]


order = sorted(found, key=lambda k: list(LEG).index(k) if k in LEG else 99)
for name in order:
    out = os.path.join(tmp, name)
    os.makedirs(out, exist_ok=True)
    for old in glob.glob(os.path.join(out, "*.jpg")):
        os.remove(old)
    L = LEG.get(name, {})
    # « vitesse » < 1 (légendes) : clip ralenti, images fondues entre elles (pas de saccade)
    vit = f"setpts=PTS/{L['vitesse']},minterpolate=fps={FPS}:mi_mode=blend," if L.get("vitesse") else ""
    # 24 i/s (Gemini, Veo) → 25 par images interpolées, jamais une image doublée : fps=25 seul en doublait une par
    # seconde, un petit arrêt sur image visible à chaque seconde du clip
    if not vit:
        r = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate",
                                     "-of", "csv=p=0", found[name]], text=True).strip()
        if r != f"{FPS}/1":
            vit = f"minterpolate=fps={FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,"
    vf = f"{vit}fps={FPS},scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080"
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", found[name], "-vf", vf, "-q:v", "3", os.path.join(out, "%04d.jpg")], check=True)
    n = len(glob.glob(os.path.join(out, "*.jpg")))
    # source de la photo : « credit » des légendes (photos hors fonds Matson : GPO, Wikimedia Commons), sinon Matson
    src = L.get("credit") or ("Bibliothèque du Congrès" if name == "07-immigrants-ellis-island" else SRC_CREDIT)
    lab = {"eyebrow": L.get("eyebrow", ""), "place": L.get("place", ""), "sub": L.get("sub", ""), "at": 0.35}
    clip = {"frames": {"dir": f"output/reconstitution/images/{name}", "n": n, "fps": FPS},
            "from": {"cx": 0.5, "cy": 0.5, "w": 1.0, "focus": 0.5}, "to": {"cx": 0.5, "cy": 0.5, "w": 0.95, "focus": 0.5}}
    t0 = t
    if name in refs:
        dr = drift(found[name], refs[name])
        first, low = dr[0][1], min(v for _, v in dr)
        print(f"  {name} : ressemblance avec la photo au début {first:.2f}, au plus bas {low:.2f}")
    else:
        dr, first, low = [], 0, 0
    if name in refs and first >= 0.9 and low >= 0.7:
        # la photo elle-même, animée : figée sur sa première image, elle s'anime, se fige sur la dernière
        # « hold » (légendes) : la photo reste plus longtemps figée au début, quand le plan dure plus que le clip
        hold = L.get("hold", HOLD)
        dur = hold + n / FPS + FREEZE
        photos.append({"id": name, "t0": round(t, 3), "t1": round(t + dur, 3), "fade": FADE, "hold": hold, **clip, **lab,
                       "out": max(1.0, dur - 5.2), "credit": f"Photo d’archive animée par IA\n{src}"})
        t += dur
        mode = "photo animée"
    elif name in refs:
        # scène réinventée d'après la photo : la vraie photo d'abord, puis fondu vers la reconstitution
        start = 0.0
        # le clip part de la photo puis change de scène (saut brusque entre deux images à 0,5 s) : on coupe ce
        # passage ; une ressemblance qui baisse peu à peu, c'est juste du mouvement (troupes qui défilent, caméra)
        saut = next((dr[i + 1][0] for i in range(len(dr) - 1) if dr[i][1] - dr[i + 1][1] >= 0.25), None)
        if first >= 0.9 and saut is not None:
            start = saut + 0.3
        ph = L.get("photo", PHOTO)  # « photo » (légendes) : la vraie photo reste plus longtemps avant le fondu
        still = os.path.join(tmp, name + "-photo")
        os.makedirs(still, exist_ok=True)
        Image.open(REF[name]).convert("RGB").save(os.path.join(still, "0001.jpg"), quality=95)
        photos.append({"id": name + "-photo", "t0": round(t, 3), "t1": round(t + ph + XF, 3), "fadeIn": FADE,
                       "frames": {"dir": f"output/reconstitution/images/{name}-photo", "n": 1, "fps": FPS},
                       "from": {"cx": 0.5, "cy": 0.5, "w": 1.0, "focus": 0.5}, "to": {"cx": 0.5, "cy": 0.5, "w": 0.985, "focus": 0.5},
                       **lab, "out": -4.0, "credit": f"Photo d’archive\n{src}"})
        clip["frames"]["start"] = round(start, 2)
        cd = (n - start * FPS) / FPS + FREEZE
        photos.append({"id": name, "t0": round(t + ph, 3), "t1": round(t + ph + cd, 3), "fadeOut": FADE, "hold": 0, **clip,
                       "credit": f"Reconstitution par IA, d’après une photo d’archive\n{src}"})
        t += ph + cd
        mode = f"reconstitution d'après la photo (clip pris à partir de {start:.1f} s)"
    else:
        # sans photo de départ (la scène du vote)
        dur = n / FPS + FREEZE
        photos.append({"id": name, "t0": round(t, 3), "t1": round(t + dur, 3), "fade": FADE, "hold": 0, **clip, **lab,
                       "out": max(1.0, dur - 5.2), "credit": L.get("credit", "Scène reconstituée par IA")})
        t += dur
        mode = "scène reconstituée"
    shots.append({"id": name, "t0": round(t0, 3), "t1": round(t, 3)})
    amb.append([round(t0, 3), round(t, 3), L.get("amb", "vent"), 0.9])
    print(f"  {name} : {mode}, {t - t0:.1f} s")

# photos sans clip, en attente de leur reconstitution (« provisoire » : durée en s, dans les légendes), ou montrées
# seules par choix (« fixe », avec --fixes ; « vers » : cadrage d'arrivée cx, cy, largeur) : la vraie
# photo seule, lente avancée de la caméra, mention « Photo d'archive » ; le clip la remplacera au même nom
for name, L in LEG.items():
    if name in found or not isinstance(L, dict) or not L.get("fixe" if FIXES else "provisoire") or name not in REF:
        continue
    dur = float(L["fixe" if FIXES else "provisoire"])
    cx, cy, w = L.get("vers", (0.52, 0.52, 0.88))
    still = os.path.join(tmp, name + "-photo")
    os.makedirs(still, exist_ok=True)
    Image.open(REF[name]).convert("RGB").save(os.path.join(still, "0001.jpg"), quality=95)
    lab = {"eyebrow": L.get("eyebrow", ""), "place": L.get("place", ""), "sub": L.get("sub", ""), "at": 0.35}
    photos.append({"id": name, "t0": round(t, 3), "t1": round(t + dur, 3), "fade": FADE, "hold": 0,
                   "frames": {"dir": f"output/reconstitution/images/{name}-photo", "n": 1, "fps": FPS},
                   "from": {"cx": 0.5, "cy": 0.5, "w": 1.0, "focus": 0.4}, "to": {"cx": cx, "cy": cy, "w": w, "focus": 0.7},
                   **lab, "out": max(1.0, dur - 5.2), "credit": f"Photo d’archive\n{L.get('credit') or SRC_CREDIT}"})
    shots.append({"id": name, "t0": round(t, 3), "t1": round(t + dur, 3)})
    amb.append([round(t, 3), round(t + dur, 3), L.get("amb", "vent"), 0.9])
    t += dur
    print(f"  {name} : photo seule{'' if FIXES else ', en attente de son clip'}, {dur:.1f} s")

if not photos:
    sys.exit("aucun clip reconnu")
intro = {
    "name": NOM, "page": "photo3d.html", "total": round(t, 3), "fov": 50, "xfade": XF, "fadeIn": 0.01, "fadeOut": 0.01,
    "coc": 0, "photos": photos, "shots": shots, "plans": True,
    "sound": {"wind": False, "projector": True, "amb": amb},
}
path = os.path.join(ROOT, "timelines", NOM + ".js")
with open(path, "w") as fh:
    fh.write("/* Généré par tools/build_reconstitution.py : ne pas modifier à la main (légendes : data/reconstitution-legendes.json). */\n")
    fh.write("(function (root) {\n  root.INTRO = " + json.dumps(intro, ensure_ascii=False, indent=1) + ";\n})(typeof window !== 'undefined' ? window : globalThis);\n")
print(f"timeline : {path} ({len(photos)} plans, {t:.1f} s)")
if essai:
    sys.exit(0)
subprocess.run(["bash", "tools/build_intro.sh", NOM], cwd=ROOT, check=True)
subprocess.run(["python3", "tools/verif_video.py", f"output/{NOM}.mp4", "--timeline", NOM], cwd=ROOT)
