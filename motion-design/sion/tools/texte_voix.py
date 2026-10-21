"""Le texte de la voix off, seul, pour l'enregistrement : script/VOIX-A-LIRE.md (refait depuis script/*.yaml).

    python3 tools/texte_voix.py

Un chapitre par section, avec sa durée ; chaque plan parlé garde son numéro (pour retrouver la prise au montage).
Les plans muets sont sautés. Un plan marqué « verifier » dans le script est signalé : ne pas l'enregistrer avant.
"""
import glob
import os

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def flat(v):
    return " ".join(str(v or "").split())


def mmss(s):
    return f"{int(s // 60)} min {int(round(s % 60)):02d}"


out = ["# Voix off : le texte à lire", "",
       "`/` petite respiration · `//` vrai silence, une seconde · `///` long silence, deux secondes · **mot en gras** : c'est lui qu'on appuie. "
       "Le numéro devant chaque phrase est celui du plan (pour retrouver la prise au montage). Prononciation des noms : "
       "`guide-voix-off.md`. Au début de chaque séance : 10 secondes de silence, sans bouger.", ""]
for f in sorted(glob.glob(os.path.join(ROOT, "script", "0[0-9]-*.yaml"))):
    data = yaml.safe_load(open(f, encoding="utf-8"))
    for ch in data.get("chapitres", []):
        lines, dur = [], 0.0
        for k, p in enumerate(ch.get("plans", []), start=1):
            a = float(p.get("entree", 0) or 0)
            dur += float(p["sortie"]) - a if "sortie" in p else float(p.get("duree", 0) or 0)
            v = flat(p.get("voix"))
            if not v or v.lower() == "silence":
                continue
            warn = f" *(attends avant d'enregistrer : {flat(p['verifier'])})*" if p.get("verifier") else ""
            lines.append(f"**{ch['num']}.{k}** {v}{warn}")
        if lines:
            out += [f"## {ch['titre']}", "", f"*{mmss(dur)} de film*", ""] + [x + "\n" for x in lines]
open(os.path.join(ROOT, "script", "VOIX-A-LIRE.md"), "w", encoding="utf-8").write("\n".join(out).rstrip() + "\n")
print(os.path.join(ROOT, "script", "VOIX-A-LIRE.md"))
