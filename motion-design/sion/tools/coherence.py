"""Contrôle de cohérence du film, à lancer après chaque changement du script :

    python3 tools/coherence.py

1. Les chapitres se suivent (1 à 39, dans l'ordre des parties) et chacun a son carton de titre.
2. Chaque plan pointe vers un fichier qui existe, et sa sortie ne dépasse pas la durée du fichier.
3. Les références « plan 25.8 » ou « 25.8 » des documents de travail (A-FABRIQUER, SOURCES, CLAUDE.md, guide de la
   voix) désignent des plans qui existent.
4. Les plans en réserve existent.
Sortie : « OK » ou la liste des écarts.
"""
import glob
import os
import re
import subprocess

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = ["script/A-FABRIQUER.md", "SOURCES.md", "CLAUDE.md", "script/guide-voix-off.md"]


def duree(path, cache={}):
    if path not in cache:
        cache[path] = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                                     "-of", "csv=p=0", path]))
    return cache[path]


def main():
    ecarts, nplans, chapitres = [], {}, []
    for f in sorted(glob.glob(os.path.join(ROOT, "script", "0[0-9]-*.yaml"))):
        for ch in yaml.safe_load(open(f, encoding="utf-8"))["chapitres"]:
            num = str(ch["num"])
            nplans[num] = len(ch["plans"])
            if num.isdigit():
                chapitres.append(int(num))
                if not os.path.exists(os.path.join(ROOT, "output", "chapitres", f"chapitre-{int(num):02d}.mp4")):
                    ecarts.append(f"chapitre {num} : carton de titre absent (output/chapitres/chapitre-{int(num):02d}.mp4)")
            for k, p in enumerate(ch["plans"], start=1):
                fic = str(p.get("fichier") or "")
                if p.get("type") == "NOIR":
                    continue
                if p.get("a_obtenir") or not fic.startswith("output/"):
                    ecarts.append(f"plan {num}.{k} : pas encore de fichier ({fic[:60]})")
                    continue
                src = os.path.join(ROOT, fic)
                if not os.path.exists(src):
                    ecarts.append(f"plan {num}.{k} : fichier absent {fic}")
                    continue
                if "sortie" in p and float(p["sortie"]) > duree(src) + 0.05:
                    ecarts.append(f"plan {num}.{k} : sortie {p['sortie']} s après la fin de {fic} ({duree(src):.2f} s)")
            for r, x in enumerate(ch.get("reserve") or [], start=1):
                if not os.path.exists(os.path.join(ROOT, x["fichier"])):
                    ecarts.append(f"chapitre {num}, réserve {r} : fichier absent {x['fichier']}")
    if chapitres != list(range(1, len(chapitres) + 1)):
        ecarts.append(f"numérotation des chapitres : {chapitres}")
    for doc in DOCS:
        path = os.path.join(ROOT, doc)
        if not os.path.exists(path):
            continue
        for n, line in enumerate(open(path, encoding="utf-8"), start=1):
            for c, k in re.findall(r"\bplans? (\d{1,2})\.(\d{1,2})\b", line):
                if c not in nplans or int(k) > nplans[c]:
                    ecarts.append(f"{doc}:{n} : le plan {c}.{k} n'existe pas")
    print("\n".join(ecarts) if ecarts else "OK")
    return len(ecarts)


if __name__ == "__main__":
    raise SystemExit(1 if main() else 0)
