"""Range toutes les pièces dans output/montage/ : un dossier par partie du film, et dedans un
sous-dossier par chapitre (son titre, puis les séquences et les fiches de la chronologie qui
l'illustrent, puis les cartons transparents lieu/date du chapitre).

Chaque séquence a son propre dossier, découpé plan par plan : la séquence complète, puis un fichier
par plan, et PLANS.md (durée de chaque plan, sa place dans la séquence, le texte à l'écran). Les
extraits (plans, fiches de la chronologie, deux moitiés des exodes) sont découpés et réencodés à
10 Mbit/s ; les autres fichiers sont copiés tels quels. Un fichier déjà présent et plus récent que
sa source n'est pas refait (le dépôt ne grossit pas pour rien) ; les fichiers qui ne font plus
partie du montage sont supprimés. Une pièce pas encore rendue est simplement sautée.

    python3 tools/montage.py          (à relancer après chaque nouveau rendu)
"""
import glob
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
    4: [("chronologie", "herzl", "chronologie-herzl"), ("citation-herzl", None, "citation-herzl-1895")],
    7: [("trois-promesses", "plans", "sequence-trois-promesses"), ("chronologie", "weizmann", "chronologie-weizmann")],
    8: [("chronologie", "amin-husseini", "chronologie-amin-al-husseini"), ("chronologie", "qassam", "chronologie-al-qassam")],
    11: [("chronologie", "jabotinsky", "chronologie-jabotinsky")],
    15: [("deir-yassin", "plans", "sequence-deir-yassin")],
    13: [("nakba-1948", "plans", "sequence-1948-la-nakba"), ("flux-humains", (0.0, 20.7), "sequence-exode-palestinien-1948"), ("chronologie", "split-1948", "chronologie-1948-deux-regards"),
         ("chronologie", "abd-al-qadir", "chronologie-abd-al-qadir")],
    16: [("chronologie", "ben-gourion", "chronologie-ben-gourion"), ("citation-ben-gourion", None, "citation-ben-gourion-1938")],
    17: [("flux-humains", (20.7, None), "sequence-juifs-des-pays-arabes")],
    18: [("chronologie", "meir", "chronologie-golda-meir"), ("citation-meir", None, "citation-golda-meir-1969")],
    19: [("suez-1956", "plans", "sequence-suez-1956"), ("chronologie", "nasser", "chronologie-nasser"), ("six-jours", "plans", "sequence-six-jours-la-naksa"),
         ("chronologie", "camp-david", "chronologie-camp-david"), ("chiffre-zone-c", None, "chiffre-cle-zone-c")],
    20: [("chiffre-refugies", None, "chiffre-cle-refugies-et-camps"), ("liban-1982", "plans", "sequence-liban-1982")],
    21: [("chronologie", "arafat", "chronologie-arafat"), ("octobre-1973", "plans", "sequence-octobre-1973")],
    22: [("chronologie", "yassine", "chronologie-yassine")],
    23: [("chronologie", "oslo", "chronologie-oslo"), ("chiffre-colons", None, "chiffre-cle-colons")],
    25: [("gaza", "plans", "sequence-gaza"), ("chiffre-gaza", None, "chiffre-cle-femmes-et-enfants")],
    33: [("resolutions", "plans", "sequence-resolutions-onu")],
    36: [("chronologie", "rabin-1995", "chronologie-assassinat-de-rabin")],
    38: [("citation-darwich", None, "citation-mahmoud-darwich")],
    39: [("chronologie", "outro", "chronologie-fin-un-siecle")],
}


# Cartons transparents (output/cartons/, tools/build_cartons.sh) : ceux de lieu et date vont dans
# leur chapitre ; les mentions de source, utiles partout, dans un dossier à part.
CARTONS = {
    "vienne-1896": 4, "bale-1897": 4, "londres-1917": 7, "jerusalem-1917": 8, "jaffa-1936": 11,
    "new-york-1947": 12, "tel-aviv-1948": 13, "lydda-1948": 13, "deir-yassin-1948": 15,
    "jerusalem-1967": 19, "amman-1970": 20, "beyrouth-1982": 20, "jabaliya-1987": 22,
    "jerusalem-2000": 22, "washington-1993": 23, "cisjordanie-2002": 23, "cisjordanie-aujourdhui": 23,
    "gaza-2007": 25, "gaza-2023": 25, "tel-aviv-1995": 36,
}


def segments(name):
    """Plans d'une séquence : début, fin et texte à l'écran de chaque segment de sa timeline."""
    js = f"""require('./core.js'); require('./timelines/{name}.js');
const txt = (v) => Array.isArray(v) ? v.map(txt).join(' ') : (v && typeof v === 'object') ? Object.values(v).filter((x) => typeof x === 'string').join(' ') : typeof v === 'number' ? v.toLocaleString('fr-FR') : (v === undefined || v === null ? '' : String(v));
console.log(JSON.stringify(globalThis.TL.segments.map((s) => ({{ id: s.id || s.type, type: s.type, start: s.start, end: s.end,
  head: txt(s.title || s.word || s.name || (s.value !== undefined ? [s.pre, s.value, s.label] : '') || s.eyebrow || ''),
  screen: ['kicker', 'eyebrow', 'title', 'word', 'name', 'pre', 'value', 'label', 'sub', 'text', 'quote', 'lines', 'source']
    .map((k) => txt(s[k])).filter(Boolean).join(' · ').replace(/\\[\\[|\\]\\]/g, '') }}))))"""
    return json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT))


def tc(x):
    return f"{int(x // 60)}:{x % 60:05.2f}"


def plans(name, folder):
    """Dossier d'une séquence : la séquence complète, un fichier par plan, PLANS.md."""
    full = os.path.join(OUT, f"{name}.mp4")
    os.makedirs(folder, exist_ok=True)
    copy(full, os.path.join(folder, "00-sequence-complete.mp4"))
    segs = segments(name)
    total = duration(full)
    rows = ["| Plan | Fichier | Durée | Dans la séquence | À l'écran |\n", "|---|---|---|---|---|\n"]
    for k, sg in enumerate(segs, start=1):
        a, b = sg["start"], (sg["end"] if k < len(segs) else total)
        f = f"{k:02d}-{slug(sg['head'] or sg['id'], 40).lower() or sg['id']}.mp4"
        cut(full, a, None if k == len(segs) else b, os.path.join(folder, f))
        rows.append(f"| {k} | `{f}` | {b - a:.1f} s | {tc(a)} → {tc(b)} | {sg['screen'].replace('|', '/')} |\n")
    doc = os.path.join(folder, "PLANS.md")
    open(doc, "w", encoding="utf-8").write(
        f"# {name} : plan par plan\n\n`00-sequence-complete.mp4` contient toute la séquence ({total:.1f} s). "
        "Chaque plan commence par le mouvement de caméra qui l'amène et finit là où le suivant commence : "
        "posés bout à bout, ils redonnent exactement la séquence. Le son de chaque plan est fondu sur quelques "
        "millisecondes aux coupes.\n\n" + "".join(rows))
    KEEP.add(doc)
    return len(segs)


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


def carton(cid):
    """Fichier d'un carton transparent (numéroté par tools/build_cartons.sh)."""
    found = glob.glob(os.path.join(OUT, "cartons", f"*-{cid}.mov"))
    return found[0] if found else os.path.join(OUT, "cartons", f"{cid}.mov")


def main():
    seg = chrono_cuts()
    titles = chapter_titles()
    os.makedirs(DST, exist_ok=True)
    lines = ["# Montage : les pièces rangées par partie et par chapitre\n\n",
             "Un dossier par partie, un sous-dossier par chapitre. Dans chaque dossier, pose les fichiers dans l'ordre de leur numéro. "
             "Une séquence est un dossier découpé plan par plan (voir son PLANS.md).\n"]
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
            k = 1
            for src, span, name in EXTRAS.get(ch, []):
                full = os.path.join(OUT, f"{src}.mp4")
                if not os.path.exists(full):
                    print("  pas encore rendu :", src)
                    continue
                k += 1
                path = os.path.join(cd, f"{k:02d}-{name}.mp4")
                if span == "plans":
                    n = plans(src, path[:-4])
                    items.append(f"{name.replace('-', ' ')} ({n} plans, dossier {k:02d})")
                    continue
                if span is None:
                    copy(full, path)
                elif isinstance(span, str):
                    cut(full, *seg[span], path)
                else:
                    cut(full, span[0], span[1], path)
                items.append(name.replace("-", " "))
            cart = [c for c, n in CARTONS.items() if n == ch and os.path.exists(carton(c))]
            if cart:
                os.makedirs(os.path.join(cd, "cartons"), exist_ok=True)
                for c in cart:
                    copy(carton(c), os.path.join(cd, "cartons", os.path.basename(carton(c))))
                items.append(f"cartons lieu/date transparents : {', '.join(cart)}")
            lines.append(f"- Chapitre {ch} · {titles.get(ch, '')} : {', '.join(items)}\n")
        print(folder, "ok")
    fin = os.path.join(OUT, "generique-fin.mp4")
    if os.path.exists(fin):
        d9 = os.path.join(DST, "9-Generique-de-fin")
        os.makedirs(d9, exist_ok=True)
        copy(fin, os.path.join(d9, "01-generique-de-fin.mp4"))
        lines += ["\n## 9-Generique-de-fin\n", "- 01 générique de fin (crédits des photos, des sources, des cartes et des polices)\n"]
    srcs = sorted(f for f in glob.glob(os.path.join(OUT, "cartons", "*-source-*.mov")))
    if srcs:
        d9 = os.path.join(DST, "Cartons-sources-transparents")
        os.makedirs(d9, exist_ok=True)
        for f in srcs:
            copy(f, os.path.join(d9, os.path.basename(f)))
        lines += ["\n## Cartons-sources-transparents\n", "- mentions de source transparentes (ONU, UNRWA, OCHA, B'Tselem…), à poser sur n'importe quelle image\n"]
    lines += ["\n## Cartons transparents\n",
              "Les fichiers `cartons/*.mov` ont un fond transparent (codec PNG avec couche alpha) : pose-les sur une piste "
              "au-dessus des images d'archive. Premiere, DaVinci Resolve et Final Cut les lisent directement.\n"]
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
