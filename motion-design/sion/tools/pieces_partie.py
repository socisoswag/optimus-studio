"""Pièces à rendre pour une partie du film, dans l'ordre où elles apparaissent dans son script.

    python3 tools/pieces_partie.py 3 <liste des pièces connues>
"""
import os
import sys

import yaml

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import derush  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
key, connues = sys.argv[1], set(sys.argv[2:])
yml = next(y for y, _, k in derush.PARTS if k == key)
data = yaml.safe_load(open(os.path.join(ROOT, "script", yml), encoding="utf-8"))
vues = []
for ch in data["chapitres"]:
    for p in list(ch.get("plans", [])) + list(ch.get("reserve") or []):
        fic = str(p.get("fichier") or "")
        if fic.startswith("output/chapitres/"):
            nom = "chapitres"
        elif fic.startswith("output/") and fic.count("/") == 1 and fic.endswith(".mp4"):
            nom = os.path.basename(fic)[:-4]
        else:
            continue
        if nom in connues and nom not in vues:
            vues.append(nom)
print(" ".join(vues))
