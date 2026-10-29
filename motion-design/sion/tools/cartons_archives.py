"""Une légende pour chaque archive filmée du script : date, lieu, une phrase (cartons transparents à poser sur l'image).

    python3 tools/cartons_archives.py      puis   bash tools/build_cartons.sh

Lit dans script/*.yaml les plans ARCH dont la ligne « ecran » donne la légende (« carton : date · lieu · phrase », ou une
mention obligatoire), écrit la liste dans timelines/cartons.js (entre les deux lignes « ARCHIVES ») et note dans chaque
plan le fichier du carton (champ « carton », output/cartons/NN-nom.mov). Les cartons existants gardent leur numéro.
"""
import glob
import json
import os
import re

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOIS = r"janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre"


def maj(s):
    return s[:1].upper() + s[1:] if s else s


def legende(ecran):
    """(date, lieu, phrase) à partir de la ligne « ecran » du plan, ou None."""
    e = ecran.strip()
    if e.startswith("mention :"):
        parts = [x.strip() for x in e.split(":", 1)[1].split(" · ")]
        an = next((x[:4] for x in parts if re.match(r"\d{4}", x)), "")
        return an, parts[0].replace("'", "’"), "Film de Georges Méliès, scène reconstituée à l’époque."
    if e.startswith("mention obligatoire :"):
        m = re.search(r"(\d{4})", e)
        return (m.group(1) if m else "", "L’Affaire Dreyfus", maj(e.split(":", 1)[1].strip()).rstrip(".") + ".")
    if not e.startswith("carton :") or "output/cartons" in e:
        return None
    parts = [p.strip() for p in e.split(":", 1)[1].split(" · ") if p.strip()]
    if len(parts) < 2:
        return None
    est_date = lambda p: re.search(r"\b1[89]\d\d\b|\b20\d\d\b", p) and (re.fullmatch(rf"(?:\d+ )?(?:(?:{MOIS}) )?\d{{4}}", p, re.I) or len(p) < 14)
    i = next((k for k, p in enumerate(parts) if est_date(p)), None)
    if i is None:
        return None
    date = maj(parts[i])
    reste = parts[:i] + parts[i + 1:]
    lieu, phrase = reste[0], " · ".join(reste[1:])
    phrase = re.sub(r"\s*\((film amateur)\)", r", \1", phrase)
    phrase = maj(phrase).rstrip(".") + "." if phrase else ""
    return date, lieu.replace("'", "’"), phrase.replace("'", "’")


def main():
    cartons = os.path.join(ROOT, "timelines", "cartons.js")
    js = open(cartons, encoding="utf-8").read()
    n_fixes = len(re.findall(r"^    \['[a-z0-9-]+', '", js.split("const ARCHIVES")[0], re.M))  # lieux et sources
    liste, vus = [], {}
    for f in sorted(glob.glob(os.path.join(ROOT, "script", "0*.yaml"))):
        d = yaml.safe_load(open(f, encoding="utf-8"))
        for ch in d.get("chapitres", []):
            for p in ch.get("plans", []):
                if p.get("type") != "ARCH" or not p.get("ecran"):
                    continue
                lg = legende(str(p["ecran"]))
                if not lg:
                    continue
                nom = "arch-" + os.path.splitext(os.path.basename(p["fichier"]))[0]
                if nom in vus:
                    continue
                vus[nom] = len(liste)
                liste.append([nom, *lg])
    # ordre déjà en place gardé (les fichiers des cartons portent leur numéro, déjà livrés) ; les nouveaux à la fin ;
    # une archive retirée du script garde sa place, pour ne pas décaler les suivantes
    avant = re.search(r"  const ARCHIVES = \[\n(.*?)  \];\n", js, re.S)
    anciens = [json.loads(l.strip().rstrip(",")) for l in avant.group(1).splitlines() if l.strip()] if avant else []
    neufs = {x[0]: x for x in liste}
    liste = [neufs.pop(x[0], x) for x in anciens] + list(neufs.values())
    vus = {x[0]: k for k, x in enumerate(liste) if x[0] in vus}
    bloc = ("  // ARCHIVES : légendes des archives filmées, écrites par tools/cartons_archives.py d'après le script (ne pas modifier à la main)\n"
            "  const ARCHIVES = [\n" + "".join(f"    {json.dumps(x, ensure_ascii=False)},\n" for x in liste) + "  ];\n"
            "  // ARCHIVES (fin)\n")
    if "const ARCHIVES" in js:
        js = re.sub(r"  // ARCHIVES : .*?  // ARCHIVES \(fin\)\n", bloc, js, flags=re.S)
    else:
        js = js.replace("  const cam = {", bloc + "  const cam = {", 1)
        js = js.replace("    ...SOURCES.map(([id, kicker]) => ({ id, type: 'cap', layout: 'source', dur: CARD, out: CARD - 0.4, fly: 0.15, capAt: 0.2, kicker, title: '', cam, camEnd: cam })),\n",
                        "    ...SOURCES.map(([id, kicker]) => ({ id, type: 'cap', layout: 'source', dur: CARD, out: CARD - 0.4, fly: 0.15, capAt: 0.2, kicker, title: '', cam, camEnd: cam })),\n"
                        "    ...ARCHIVES.map(([id, kicker, title, text]) => ({ id, type: 'cap', layout: 'small', dur: CARD, out: CARD - 0.4, fly: 0.15, capAt: 0.2, kicker, title, text, cam, camEnd: cam })),\n", 1)
    open(cartons, "w", encoding="utf-8").write(js)
    # le fichier du carton dans chaque plan, juste sous « fichier » (édition au texte, pour garder la mise en forme du script)
    for f in sorted(glob.glob(os.path.join(ROOT, "script", "0*.yaml"))):
        s = re.sub(r"\n        carton: output/cartons/.*(?=\n)", "", open(f, encoding="utf-8").read())
        for nom, k in vus.items():
            fic = f"output/cartons/{n_fixes + k + 1:02d}-{nom}.mov"
            s = re.sub(rf"\n(        fichier: output/[a-z-]+/{re.escape(nom[5:])}\.mp4)\n", rf"\n\1\n        carton: {fic}\n", s)
        open(f, "w", encoding="utf-8").write(s)
    for nom, k in vus.items():
        print(f"{n_fixes + k + 1:02d}-{nom} : {liste[k][1]} · {liste[k][2]} · {liste[k][3]}")


if __name__ == "__main__":
    main()
