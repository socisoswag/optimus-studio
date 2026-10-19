"""Contrôle d'une vidéo avant de la livrer : à lancer sur chaque rendu, puis regarder la planche.

    python3 tools/verif_video.py output/intro-aerienne.mp4
    python3 tools/verif_video.py output/intro-aerienne.mp4 --timeline intro-aerienne --page drone.html

Vérifie :
  - format : 1920 x 1080, 25 images/s, durée de la timeline, son présent, moins de 95 Mo (limite GitHub) ;
  - son : niveau intégré entre -24 et -14 LUFS, crêtes sous -0,5 dBTP ;
  - image : passages noirs ou figés en dehors des fondus d'ouverture et de fin ;
  - textes (avec --timeline, pages qui proposent window.qa) : textes qui se chevauchent, textes hors de la zone sûre
    ou dans les bandes cinéma, sol trop agrandi (plus de 5 pixels d'écran par pixel satellite : image floue de près).
Fabrique une planche (une image toutes les 1,5 s, horodatée) dans output/verif/<nom>-planche.jpg, à regarder en entier :
flou, couleurs, textes coupés, effets ratés ne se voient qu'à l'œil.
Code de sortie 1 si un défaut bloquant est trouvé.
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[1:]
video = args[0]
opt = {args[i][2:]: args[i + 1] for i in range(1, len(args) - 1, 2) if args[i].startswith("--")}
name = os.path.splitext(os.path.basename(video))[0]
bad, warn = [], []


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, cwd=ROOT)


# ------------------------------------------------------------------ format
info = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "format=duration,size:stream=codec_type,width,height,r_frame_rate,sample_rate",
                       "-of", "json", video]).stdout)
vs = [s for s in info["streams"] if s["codec_type"] == "video"]
aus = [s for s in info["streams"] if s["codec_type"] == "audio"]
dur = float(info["format"]["duration"])
size = int(info["format"]["size"]) / 1e6
if not vs or (vs[0]["width"], vs[0]["height"]) != (1920, 1080):
    bad.append(f"résolution {vs[0]['width']}x{vs[0]['height'] if vs else '?'} (attendu 1920x1080)")
if vs and vs[0]["r_frame_rate"] != "25/1":
    bad.append(f"cadence {vs[0]['r_frame_rate']} (attendu 25/1)")
if not aus:
    bad.append("pas de son")
if size > 95:
    bad.append(f"{size:.1f} Mo (plus de 95 Mo : refusé par GitHub)")
tl = None
if opt.get("timeline"):
    tl = json.loads(run(["node", "-e", f"require('./timelines/{opt['timeline']}.js'); console.log(JSON.stringify(globalThis.INTRO || {{}}))"]).stdout or "{}")
    if tl.get("total") and abs(dur - tl["total"]) > 0.15:
        bad.append(f"durée {dur:.2f} s (timeline : {tl['total']} s)")

# ------------------------------------------------------------------ son
if aus:
    err = run(["ffmpeg", "-nostdin", "-hide_banner", "-i", video, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
    m_i = re.findall(r"I:\s+(-?[\d.]+) LUFS", err)
    m_p = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", err)
    lufs = float(m_i[-1]) if m_i else None
    peak = float(m_p[-1]) if m_p else None
    if lufs is not None and not -24 <= lufs <= -14:
        bad.append(f"niveau sonore {lufs} LUFS (attendu entre -24 et -14)")
    if peak is not None and peak > -0.5:
        warn.append(f"crête {peak} dBTP (au-dessus de -0,5)")
else:
    lufs = peak = None

# ------------------------------------------------------------------ noirs et images figées (hors fondus d'ouverture et de fin)
fin = float((tl or {}).get("fadeIn", 2.5)) + 0.4
fout = dur - float((tl or {}).get("fadeOut", 2.0)) - 0.4
err = run(["ffmpeg", "-nostdin", "-hide_banner", "-i", video, "-an", "-vf", "blackdetect=d=0.3:pix_th=0.05,freezedetect=n=0.001:d=1.2",
           "-f", "null", "-"]).stderr
for a, b in re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", err):
    a, b = float(a), float(b)
    if b > fin and a < fout:
        warn.append(f"noir de {a:.2f} à {b:.2f} s")
fz = re.findall(r"freeze_start: ([\d.]+)", err)
fe = re.findall(r"freeze_end: ([\d.]+)", err)
for i, a in enumerate(fz):
    a = float(a)
    b = float(fe[i]) if i < len(fe) else dur
    if b > fin and a < fout:
        warn.append(f"image figée de {a:.2f} à {b:.2f} s")

# ------------------------------------------------------------------ planche
os.makedirs(os.path.join(ROOT, "output", "verif"), exist_ok=True)
sheet = os.path.join(ROOT, "output", "verif", f"{name}-planche.jpg")
n = int(dur / 1.5) + 1
cols = 6
font = os.path.join(ROOT, "fonts", "DMMono-Regular.ttf")
vf = (f"fps=1/1.5,scale=480:270,drawtext=fontfile={font}:text='%{{pts\\:hms}}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4,"
      f"tile={cols}x{(n + cols - 1) // cols}:padding=6:color=0x111111")
run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", video, "-an", "-vf", vf, "-frames:v", "1", "-q:v", "3", sheet])

# ------------------------------------------------------------------ textes et netteté, dans la page (si elle le propose)
qa_lines = []
if opt.get("timeline"):
    page = opt.get("page") or (tl or {}).get("page") or "drone.html"
    out = run(["node", "render.mjs", "--page", page, "--timeline", opt["timeline"], "--qa", opt.get("pas", "0.5")]).stdout
    try:
        q = json.loads(out.strip().splitlines()[-1])
    except (ValueError, IndexError):
        q = {"qa": False}
    if q.get("qa"):
        def spans(flag):  # regroupe les instants consécutifs en intervalles
            res, cur = [], None
            for f in q["frames"]:
                v = flag(f)
                if v and cur and cur[2] == v and f["t"] - cur[1] < 0.8:
                    cur[1] = f["t"]
                elif v:
                    cur = [f["t"], f["t"], v]
                    res.append(cur)
            return res
        for a, b, v in spans(lambda f: ", ".join(sorted(set(f["over"])))):
            bad.append(f"textes qui se chevauchent de {a:.1f} à {b:.1f} s : {v}")
        for a, b, v in spans(lambda f: ", ".join(sorted(set(f["out"])))):
            bad.append(f"texte hors zone sûre de {a:.1f} à {b:.1f} s : {v}")
        for a, b, v in spans(lambda f: "flou" if f["mag"] > 5 else ""):
            mx = max(f["mag"] for f in q["frames"] if a <= f["t"] <= b)
            warn.append(f"sol trop agrandi de {a:.1f} à {b:.1f} s (jusqu'à {mx} px par pixel satellite : image floue de près)")
        qa_lines.append(f"textes et netteté : {len(q['frames'])} instants contrôlés")
    else:
        qa_lines.append("textes et netteté : la page ne propose pas de contrôle (regarder la planche)")

# ------------------------------------------------------------------ rapport
print(f"{name} : {dur:.2f} s, {size:.1f} Mo, son {lufs} LUFS, crête {peak} dBTP")
for line in qa_lines:
    print("  " + line)
for b in bad:
    print("  DÉFAUT    " + b)
for w in warn:
    print("  À VÉRIFIER " + w)
if not bad and not warn:
    print("  rien à signaler")
print(f"  planche : {sheet}")
sys.exit(1 if bad else 0)
