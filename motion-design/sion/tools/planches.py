"""Planches de contrôle : une image par segment de chaque pièce (juste avant sa sortie, quand tous les textes sont là),
réduites et assemblées par neuf, pour vérifier d'un coup d'œil noms, effets et relief.

    python3 tools/planches.py [pièce ...]        (sans nom : toutes les pièces cartes de tools/rendu_tout.sh)

Écrit output/planches/<pièce>-<n>.png. Les pièces de survol (drone.html) sont laissées de côté.
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output", "planches")


def instants(nom):
    js = ("require('./core.js'); require('./timelines/%s.js'); const T = globalThis.TL;"
          "console.log(JSON.stringify(T ? T.segments.map((s) => [s.id || s.type, s.start, s.end]) : null));" % nom)
    r = subprocess.run(["node", "-e", js], cwd=ROOT, capture_output=True, text=True)
    segs = json.loads(r.stdout.strip() or "null")
    if not segs:
        return []
    out = []
    for k, (sid, a, b) in enumerate(segs):
        if b - a > 15:
            out.append((sid, round(a + (b - a) * 0.5, 2)))
        # le dernier segment se lit avant le fondu de fin de la pièce
        fin = 1.8 if k == len(segs) - 1 else 0.45
        out.append((sid, round(max(a + 0.3, b - fin), 2)))
    return out


def planche(nom):
    pts = instants(nom)
    if not pts:
        return None
    d = os.path.join(OUT, "_" + nom)
    os.makedirs(d, exist_ok=True)
    subprocess.run(["node", "render.mjs", "--timeline", nom, "--stills", ",".join(str(t) for _, t in pts), "--out", d],
                   cwd=ROOT, capture_output=True, timeout=1800)
    vignettes = []
    for k, (sid, t) in enumerate(pts):
        src = os.path.join(d, f"still_{t:06.2f}.png")
        if not os.path.exists(src):
            continue
        v = os.path.join(d, f"v{k:03d}.png")
        txt = re.sub(r"[^A-Za-z0-9 .-]", "", f"{sid} {t}")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-vf",
                        f"scale=640:360,drawtext=text='{txt}':x=8:y=8:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6",
                        v], check=True)
        vignettes.append(v)
    faites = []
    for n in range(0, len(vignettes), 9):
        lot = vignettes[n:n + 9]
        dst = os.path.join(OUT, f"{nom}-{n // 9 + 1}.png")
        entree = sum((["-i", v] for v in lot), [])
        cols = 3
        rows = (len(lot) + cols - 1) // cols
        lay = "|".join(f"{(i % cols) * 640}_{(i // cols) * 360}" for i in range(len(lot)))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *entree, "-filter_complex",
                        f"xstack=inputs={len(lot)}:layout={lay}:fill=black" if len(lot) > 1 else "null",
                        "-frames:v", "1", dst], check=True)
        faites.append(dst)
    return faites


def fins(noms):
    """Une seule planche : le dernier segment de chaque pièce, avant le fondu de fin."""
    vign = []
    for nom in noms:
        pts = instants(nom)
        if not pts:
            continue
        sid, t = pts[-1]
        d = os.path.join(OUT, "_fins")
        os.makedirs(d, exist_ok=True)
        subprocess.run(["node", "render.mjs", "--timeline", nom, "--stills", str(t), "--out", os.path.join(d, nom)],
                       cwd=ROOT, capture_output=True, timeout=600)
        src = os.path.join(d, nom, f"still_{t:06.2f}.png")
        if os.path.exists(src):
            v = os.path.join(d, f"{nom}.png")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-vf",
                            f"scale=640:360,drawtext=text='{nom}':x=8:y=8:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6", v], check=True)
            vign.append(v)
        print(nom, flush=True)
    for n in range(0, len(vign), 9):
        lot = vign[n:n + 9]
        lay = "|".join(f"{(i % 3) * 640}_{(i // 3) * 360}" for i in range(len(lot)))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *sum((["-i", v] for v in lot), []), "-filter_complex",
                        f"xstack=inputs={len(lot)}:layout={lay}:fill=black" if len(lot) > 1 else "null",
                        "-frames:v", "1", os.path.join(OUT, f"fins-{n // 9 + 1}.png")], check=True)


def main():
    noms = sys.argv[1:]
    seul_fins = "--fins" in noms
    noms = [n for n in noms if n != "--fins"]
    if not noms:
        liste = re.search(r'LISTE="([^"]*)"', open(os.path.join(ROOT, "tools", "rendu_tout.sh"), encoding="utf-8").read()).group(1)
        noms = [n for n in liste.split() if "root.TL = root.buildTL" in open(os.path.join(ROOT, "timelines", n + ".js"), encoding="utf-8").read()]
    os.makedirs(OUT, exist_ok=True)
    if seul_fins:
        fins(noms)
        return
    for nom in noms:
        f = planche(nom)
        print(nom, ":", ", ".join(os.path.basename(x) for x in f) if f else "aucune image", flush=True)


if __name__ == "__main__":
    main()
