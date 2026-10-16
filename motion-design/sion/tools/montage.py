"""Range toutes les pièces dans output/montage/ : un dossier par partie du film, et dedans un
sous-dossier par chapitre (son titre, puis les séquences et les fiches de la chronologie qui
l'illustrent). Les extraits (fiches de la chronologie, deux moitiés des exodes) sont découpés et
réencodés à 10 Mbit/s ; les autres fichiers sont copiés tels quels. Un fichier déjà présent et plus
récent que sa source n'est pas refait (le dépôt ne grossit pas pour rien) ; les fichiers qui ne
font plus partie du montage sont supprimés.

    python3 tools/montage.py          (à relancer après chaque nouveau rendu)
"""
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output")
DST = os.path.join(OUT, "montage")

PARTS = [
    ("1-Partie-I-L-idee", "partie-1", range(1, 7)),
    ("2-Partie-II-Le-basculement", "partie-2", range(7, 12)),
    ("3-Partie-III-La-catastrophe-fondatrice", "partie-3", range(12, 19)),
    ("4-Partie-IV-Resistances-et-oppressions", "partie-4", range(19, 24)),
    ("5-Partie-V-La-derive-d-un-projet", "partie-5", range(24, 29)),
    ("6-Partie-VI-Voix-et-contre-voix", "partie-6", range(29, 32)),
    ("7-Partie-VII-Une-histoire-universelle", "partie-7", range(32, 37)),
    ("8-Conclusion", "conclusion", range(37, 40)),
]

# Après le titre d'un chapitre : les séquences et les fiches de la chronologie qui l'illustrent.
# ("fichier source", début, fin, "nom") ; début/fin à None = fichier entier.
EXTRAS = {
    4: [("chronologie", "herzl", "chronologie-herzl")],
    7: [("trois-promesses", None, "sequence-trois-promesses"), ("chronologie", "weizmann", "chronologie-weizmann")],
    8: [("chronologie", "amin-husseini", "chronologie-amin-al-husseini"), ("chronologie", "qassam", "chronologie-al-qassam")],
    11: [("chronologie", "jabotinsky", "chronologie-jabotinsky")],
    13: [("nakba-1948", None, "sequence-1948-la-nakba"), ("flux-humains", (0.0, 20.7), "sequence-exode-palestinien-1948"), ("chronologie", "split-1948", "chronologie-1948-deux-regards"),
         ("chronologie", "abd-al-qadir", "chronologie-abd-al-qadir")],
    16: [("chronologie", "ben-gourion", "chronologie-ben-gourion")],
    17: [("flux-humains", (20.7, None), "sequence-juifs-des-pays-arabes")],
    18: [("chronologie", "meir", "chronologie-golda-meir")],
    19: [("six-jours", None, "sequence-six-jours-la-naksa"), ("chronologie", "nasser", "chronologie-nasser"), ("chronologie", "camp-david", "chronologie-camp-david")],
    21: [("chronologie", "arafat", "chronologie-arafat")],
    22: [("chronologie", "yassine", "chronologie-yassine")],
    23: [("chronologie", "oslo", "chronologie-oslo")],
    33: [("resolutions", None, "sequence-resolutions-onu")],
    36: [("chronologie", "rabin-1995", "chronologie-assassinat-de-rabin")],
    39: [("chronologie", "outro", "chronologie-fin-un-siecle")],
}


def chrono_cuts():
    js = "require('./core.js'); require('./timelines/chronologie.js'); console.log(JSON.stringify(Object.fromEntries(globalThis.TL.segments.map(s => [s.id || s.type, [s.start, s.end]]))))"
    return json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT))


def chapter_titles():
    src = open(os.path.join(ROOT, "timelines", "chapitres.js"), encoding="utf-8").read()
    return {int(n): t for n, t in re.findall(r"\[(\d+), '[IVC]+', '((?:[^'\\]|\\.)*)'", src)}


def slug(text, n=60):
    t = unicodedata.normalize("NFKD", text.replace("’", "-").replace("'", "-")).encode("ascii", "ignore").decode()
    t = re.sub(r"[^A-Za-z0-9]+", "-", t).strip("-")
    return t[:n].rstrip("-")


def duration(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]))


def fresh(src, dst):
    return os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src)


def copy(src, dst):
    if not (fresh(src, dst) and os.path.getsize(dst) == os.path.getsize(src)):
        shutil.copyfile(src, dst)
    KEEP.add(dst)


def cut(src, a, b, dst):
    KEEP.add(dst)
    if fresh(src, dst):
        return
    d = (b if b is not None else duration(src)) - a
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{a:.3f}", "-i", src, "-t", f"{d:.3f}",
                    "-c:v", "libx264", "-preset", "slow", "-b:v", "10M", "-maxrate", "14M", "-bufsize", "20M", "-tune", "grain",
                    "-pix_fmt", "yuv420p", "-af", f"afade=t=in:d=0.04,afade=t=out:st={max(0, d - 0.06):.3f}:d=0.06",
                    "-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart", dst], check=True)


KEEP = set()


def main():
    seg = chrono_cuts()
    titles = chapter_titles()
    os.makedirs(DST, exist_ok=True)
    lines = ["# Montage : les pièces rangées par partie et par chapitre\n\n",
             "Un dossier par partie, un sous-dossier par chapitre. Dans chaque dossier, pose les fichiers dans l'ordre de leur numéro.\n"]
    d0 = os.path.join(DST, "0-Generique-et-prologue")
    os.makedirs(d0, exist_ok=True)
    copy(os.path.join(OUT, "generique.mp4"), os.path.join(d0, "01-generique.mp4"))
    a, b = seg["intro"]
    cut(os.path.join(OUT, "chronologie.mp4"), a, b, os.path.join(d0, "02-chronologie-ouverture-facultatif.mp4"))
    copy(os.path.join(OUT, "chronologie.mp4"), os.path.join(d0, "03-chronologie-complete-facultatif.mp4"))
    lines += ["\n## 0-Generique-et-prologue\n", "- 01 générique\n", "- 02 et 03 : la chronologie en prologue (facultatif)\n"]
    for folder, opener, chapters in PARTS:
        d = os.path.join(DST, folder)
        os.makedirs(d, exist_ok=True)
        copy(os.path.join(OUT, f"{opener}.mp4"), os.path.join(d, f"00-ouverture-{opener}.mp4"))
        lines += [f"\n## {folder}\n", "- 00 ouverture de la partie\n"]
        for ch in chapters:
            cd = os.path.join(d, f"Chapitre-{ch:02d}-{slug(titles.get(ch, ''))}")
            os.makedirs(cd, exist_ok=True)
            copy(os.path.join(OUT, "chapitres", f"chapitre-{ch:02d}.mp4"), os.path.join(cd, "01-titre.mp4"))
            items = ["titre"]
            for k, (src, span, name) in enumerate(EXTRAS.get(ch, []), start=2):
                path = os.path.join(cd, f"{k:02d}-{name}.mp4")
                full = os.path.join(OUT, f"{src}.mp4")
                if span is None:
                    copy(full, path)
                elif isinstance(span, str):
                    cut(full, *seg[span], path)
                else:
                    cut(full, span[0], span[1], path)
                items.append(name.replace("-", " "))
            lines.append(f"- Chapitre {ch} · {titles.get(ch, '')} : {', '.join(items)}\n")
        print(folder, "ok")
    open(os.path.join(DST, "LISEZMOI.md"), "w", encoding="utf-8").write("".join(lines))
    KEEP.add(os.path.join(DST, "LISEZMOI.md"))
    for dp, dn, fn in os.walk(DST, topdown=False):
        for f in fn:
            if os.path.join(dp, f) not in KEEP:
                os.remove(os.path.join(dp, f))
        if dp != DST and not os.listdir(dp):
            os.rmdir(dp)


if __name__ == "__main__":
    sys.exit(main())
