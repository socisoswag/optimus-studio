"""Bout-à-bout de tout l'habillage, dans l'ordre du film, pour le visionner d'une traite.

Lit output/montage/ (fabriqué par tools/montage.py) dans l'ordre des dossiers et des numéros : le
générique, puis pour chaque partie son ouverture, et pour chaque chapitre son titre, ses séquences
(complètes) et ses fiches ; enfin le générique de fin. Les pièces facultatives, les plans découpés
et les cartons transparents sont laissés de côté. Le tout est réencodé en 1080p et coupé en parties
de moins de 95 Mo (limite de GitHub : 100 Mo par fichier), sans couper une pièce en deux.

    python3 tools/bout_a_bout.py
"""
import glob
import os
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output")
MONTAGE = os.path.join(OUT, "montage")
DEST = os.environ.get("BOUT_DIR") or OUT  # BOUT_DIR : fabriquer ailleurs, puis recopier
PART = 175.0      # secondes par partie au plus
RATE = 4000       # kbit/s vidéo : 175 s ≈ 92 Mo avec le son


def duration(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]))


def pieces(d):
    """Pièces d'un dossier du montage, dans l'ordre de leurs numéros."""
    out = []
    for name in sorted(os.listdir(d)):
        p = os.path.join(d, name)
        if name == "cartons" or "facultatif" in name:
            continue
        if os.path.isdir(p):
            full = os.path.join(p, "00-sequence-complete.mp4")
            out += [full] if os.path.exists(full) else pieces(p)
        elif name.endswith(".mp4"):
            out.append(p)
    return out


def main():
    order = []
    for top in sorted(d for d in os.listdir(MONTAGE) if os.path.isdir(os.path.join(MONTAGE, d)) and d[0].isdigit()):
        order += pieces(os.path.join(MONTAGE, top))
    parts, cur, acc = [], [], 0.0
    for f in order:
        d = duration(f)
        if cur and acc + d > PART:
            parts.append(cur); cur, acc = [], 0.0
        cur.append(f); acc += d
    if cur:
        parts.append(cur)
    for old in glob.glob(os.path.join(DEST, "SION-bout-a-bout-1080p-partie-*.mp4")):
        os.remove(old)
    for i, files in enumerate(parts, start=1):
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as lst:
            lst.write("".join(f"file '{f}'\n" for f in files))
        dst = os.path.join(DEST, f"SION-bout-a-bout-1080p-partie-{i}.mp4")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst.name, "-fps_mode", "cfr", "-r", "25",
                        "-c:v", "libx264", "-preset", "slow", "-b:v", f"{RATE}k", "-maxrate", f"{RATE * 1.4:.0f}k", "-bufsize", f"{RATE * 2}k",
                        "-tune", "grain", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", dst], check=True)
        os.remove(lst.name)
        print(f"partie {i} : {len(files)} pièces, {duration(dst):.0f} s, {os.path.getsize(dst) / 1e6:.0f} Mo")


if __name__ == "__main__":
    main()
