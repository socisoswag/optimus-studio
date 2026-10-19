"""Script du film : les plans de chaque partie (script/NN-*.yaml) deviennent un script lisible (script/NN-*.md)
avec les timecodes exacts du film et des sources, au format Premiere HH:MM:SS:II (II = image, 25 par seconde).

    python3 tools/script.py            recalcule tous les timecodes, écrit les .md et script/MINUTAGE.md

Chaque plan du YAML :
    type: MD | 3D | RÉEL | ARCH | PHOTO | IA | CARTON | NOIR
    fichier: output/... (chemin depuis le dossier sion)        entree / sortie : secondes dans le fichier source
    duree: secondes (si pas d'entrée/sortie)                   voix : le texte de la voix off (avec / // ///)
    ecran / son / source / note : facultatifs                  a_obtenir: true si l'image reste à trouver
La voix est contrôlée : au plus 2,4 mots par seconde de plan (environ 140 mots par minute, pauses comprises).
"""
import glob
import os
import re
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOSSIER = os.path.join(ROOT, "script")
FPS = 25
MAX_MOTS_S = 2.4


def tc(s):
    f = int(round(s * FPS))
    return f"{f // (3600 * FPS):02d}:{f // (60 * FPS) % 60:02d}:{f // FPS % 60:02d}:{f % FPS:02d}"


def mots(voix):
    t = re.sub(r"\([^)]*\)", " ", voix or "")
    t = re.sub(r"[/*«»\"“”:;,.!?]", " ", t)
    return len([w for w in t.split() if re.search(r"\w", w)])


def duree(p):
    if p.get("entree") is not None and p.get("sortie") is not None:
        return float(p["sortie"]) - float(p["entree"])
    return float(p["duree"])


def bloc(num, p, t0, alertes):
    d = duree(p)
    src = f"`{p['fichier']}`" if p.get("fichier") else "(à fabriquer)"
    if p.get("entree") is not None:
        src += f" · source {tc(float(p['entree']))} → {tc(float(p['sortie']))}"
    out = [f"**{num}** · film **{tc(t0)} → {tc(t0 + d)}** ({d:.1f} s) · **[{p['type']}]** {src}"]
    if p.get("a_obtenir"):
        out[0] += " · **À OBTENIR**"
    if p.get("source"):
        out.append(f"Source : {p['source']}")
    if p.get("ecran"):
        out.append(f"À l'écran : {p['ecran']}")
    v = (p.get("voix") or "").strip()
    if v:
        n = mots(v)
        out.append(f"> VOIX : {v}")
        out.append(f"({n} mots, {n / d:.1f} par seconde)")
        if n / d > MAX_MOTS_S:
            alertes.append(f"{num} : {n} mots pour {d:.1f} s ({n / d:.1f} mots/s)")
    else:
        out.append("> VOIX : silence")
    if p.get("son"):
        out.append(f"Son : {p['son']}")
    if p.get("note"):
        out.append(f"Note : {p['note']}")
    return "  \n".join(out) + "\n"


def main():
    t = 0.0
    minutage = ["# Minutage du film\n", "| Bloc | Début | Durée |", "|---|---|---|"]
    alertes, manque = [], []
    for f in sorted(glob.glob(os.path.join(DOSSIER, "[0-9][0-9]-*.yaml"))):
        partie = yaml.safe_load(open(f, encoding="utf-8"))
        lignes = [f"# {partie['titre']}\n", f"{partie.get('intro', '').strip()}\n"] if partie.get("intro") else [f"# {partie['titre']}\n"]
        debut_partie = t
        for ch in partie["chapitres"]:
            t_ch = t
            corps = []
            for k, p in enumerate(ch["plans"], 1):
                num = f"{ch['num']}.{k}"
                corps.append(bloc(num, p, t, alertes))
                if p.get("a_obtenir"):
                    manque.append(f"{num} : {p.get('fichier')}" + (f" ({p['note']})" if p.get("note") else ""))
                t += duree(p)
            lignes.append(f"\n## {ch['titre']}\n")
            lignes.append(f"Film {tc(t_ch)} → {tc(t)} · durée {(t - t_ch) // 60:.0f} min {(t - t_ch) % 60:04.1f} s\n")
            if ch.get("intention"):
                lignes.append(f"*Intention : {ch['intention'].strip()}*\n")
            lignes += ["\n" + c for c in corps]
            minutage.append(f"| {ch['titre']} | {tc(t_ch)} | {(t - t_ch) // 60:.0f} min {(t - t_ch) % 60:04.1f} s |")
        lignes.append(f"\n---\nDurée de la partie : {(t - debut_partie) // 60:.0f} min {(t - debut_partie) % 60:04.1f} s "
                      f"(film {tc(debut_partie)} → {tc(t)})\n")
        open(f[:-5] + ".md", "w", encoding="utf-8").write("\n".join(lignes))
    minutage.append(f"| **Total** | | **{t // 60:.0f} min {t % 60:04.1f} s** |")
    if manque:
        minutage += ["\n## Images à obtenir\n"] + [f"- {m}" for m in manque]
    if alertes:
        minutage += ["\n## Voix trop longue pour le plan\n"] + [f"- {a}" for a in alertes]
    open(os.path.join(DOSSIER, "MINUTAGE.md"), "w", encoding="utf-8").write("\n".join(minutage) + "\n")
    print(f"total {tc(t)} ; {len(alertes)} alerte(s) de voix ; {len(manque)} image(s) à obtenir")
    for a in alertes:
        print("  voix trop longue :", a)


if __name__ == "__main__":
    sys.exit(main())
