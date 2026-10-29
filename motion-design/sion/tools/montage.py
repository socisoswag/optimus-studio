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
    MONTAGE_DIR=/tmp/montage python3 tools/montage.py   (dans un dossier de travail)
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
# MONTAGE_DIR : fabriquer ailleurs (dossier de travail), puis recopier une fois tout terminé
DST = os.environ.get("MONTAGE_DIR") or os.path.join(OUT, "montage")

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
    1: [("sion-le-mot", "plans", "sequence-sion-le-mot")],
    2: [("europe-1881-1914", "plans", "sequence-l-europe-en-feu")],
    5: [("aliyas", "plans", "sequence-les-aliyas")],
    4: [("chronologie", "herzl", "chronologie-herzl"), ("citation-herzl", None, "citation-herzl-1895")],
    7: [("trois-promesses", "plans", "sequence-trois-promesses"), ("chronologie", "weizmann", "chronologie-weizmann")],
    8: [("chronologie", "amin-husseini", "chronologie-amin-al-husseini"), ("chronologie", "qassam", "chronologie-al-qassam")],
    11: [("chronologie", "jabotinsky", "chronologie-jabotinsky")],
    12: [("partage-1947", "plans", "sequence-le-decoupage"), ("partage-1947-sans-texte", None, "sequence-le-decoupage-sans-texte")],
    15: [("deir-yassin", "plans", "sequence-deir-yassin")],
    13: [("nakba-1948", "plans", "sequence-1948-la-nakba"), ("flux-humains", (0.0, 20.7), "sequence-exode-palestinien-1948"), ("chronologie", "split-1948", "chronologie-1948-deux-regards"),
         ("chronologie", "abd-al-qadir", "chronologie-abd-al-qadir")],
    16: [("chronologie", "ben-gourion", "chronologie-ben-gourion"), ("citation-ben-gourion", None, "citation-ben-gourion-1938")],
    17: [("flux-humains", (20.7, None), "sequence-juifs-des-pays-arabes")],
    18: [("chronologie", "meir", "chronologie-golda-meir"), ("citation-meir", None, "citation-golda-meir-1969")],
    19: [("frontieres", "plans", "sequence-frontieres-qui-bougent"), ("suez-1956", "plans", "sequence-suez-1956"), ("chronologie", "nasser", "chronologie-nasser"), ("six-jours", "plans", "sequence-six-jours-la-naksa"),
         ("chronologie", "camp-david", "chronologie-camp-david"), ("jerusalem", "plans", "sequence-jerusalem"), ("chiffre-zone-c", None, "chiffre-cle-zone-c")],
    20: [("camps", "plans", "sequence-les-camps"), ("chiffre-refugies", None, "chiffre-cle-refugies-et-camps"), ("liban-1982", "plans", "sequence-liban-1982")],
    21: [("chronologie", "arafat", "chronologie-arafat"), ("octobre-1973", "plans", "sequence-octobre-1973")],
    22: [("chronologie", "yassine", "chronologie-yassine")],
    23: [("chronologie", "oslo", "chronologie-oslo"), ("oslo-mur", "plans", "sequence-oslo-et-le-mur"), ("chiffre-colons", None, "chiffre-cle-colons")],
    24: [("figures-aujourdhui", "netanyahou", "chronologie-netanyahou"), ("figures-aujourdhui", "lieberman", "chronologie-lieberman")],
    25: [("gaza", "plans", "sequence-gaza"), ("chiffre-gaza", None, "chiffre-cle-femmes-et-enfants")],
    26: [("figures-aujourdhui", "smotrich-ben-gvir", "chronologie-smotrich-et-ben-gvir")],
    27: [("guerre-numerique", "plans", "sequence-la-guerre-numerique")],
    33: [("resolutions", "plans", "sequence-resolutions-onu")],
    34: [("noms-effaces", "plans", "sequence-les-noms-effaces")],
    35: [("apartheid-textes", "plans", "sequence-apartheid-ce-que-disent-les-textes")],
    36: [("chronologie", "rabin-1995", "chronologie-assassinat-de-rabin")],
    38: [("citation-darwich", None, "citation-mahmoud-darwich")],
    39: [("chronologie", "outro", "chronologie-fin-un-siecle")],
}


# Pièces 3D (survols, archives en relief) : (fichier, nom) rangées dans leur chapitre, avec leurs fichiers plan par plan.
SURVOLS = {
    13: [("villages-lumieres", "survol-418-villages-vides-en-1948")],
    23: [("mur-cicatrice", "survol-la-cicatrice-du-mur")],
    25: [("gaza-vue-du-ciel", "survol-gaza-vue-du-ciel-2023-2025")],
}

# Vrais plans tournés sur place (output/plans-reels/, tools/plans_reels.sh ; sources : SOURCES.md 4.1), par chapitre.
PLANS_REELS = {
    0: ["jaffa-clocher-vieille-ville-aerien", "mer-morte-aerien"],
    1: ["jerusalem-survol-vieille-ville", "jerusalem-remparts-tour-de-david-aerien", "jerusalem-saint-sepulcre",
        "jerusalem-dome-du-rocher-couchant-nuit-2023"],
    2: ["medzhybizh-cimetiere-juif-neige"],
    13: ["figuier-de-barbarie-sabr", "recolte-des-olives-a-la-main"],
    19: ["cisjordanie-1967-chars-detruits-film-amateur", "jerusalem-porte-de-damas-aerien-2022",
         "jerusalem-esplanade-des-mosquees-ramadan-2024"],
    23: ["checkpoint-hizma-jerusalem-est", "cisjordanie-al-eizariya-minaret-desert", "cisjordanie-monastere-mar-saba"],
}


def reels(ch, cd, items):
    noms = [n for n in PLANS_REELS.get(ch, []) if os.path.exists(os.path.join(OUT, "plans-reels", f"{n}.mp4"))]
    if noms:
        os.makedirs(os.path.join(cd, "plans-reels"), exist_ok=True)
        for n in noms:
            copy(os.path.join(OUT, "plans-reels", f"{n}.mp4"), os.path.join(cd, "plans-reels", f"{n}.mp4"))
        items.append(f"vrais plans tournés sur place : {', '.join(noms)} (sources : SOURCES.md 4.1)")


def survol(src, path, items, name):
    """Pièce 3D entière, ses fichiers plan par plan (output/<src>/) et son son en pistes."""
    full = os.path.join(OUT, f"{src}.mp4")
    if not os.path.exists(full):
        return
    os.makedirs(path, exist_ok=True)
    copy(full, os.path.join(path, "00-sequence-complete.mp4"))
    son(src, path, "00-sequence-complete.mp4")
    for f in sorted(glob.glob(os.path.join(OUT, src, "*.mp4"))):
        copy(f, os.path.join(path, os.path.basename(f)))
    items.append(f"{name.replace('-', ' ')} (survol 3D, dossier)")


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
    son(name, folder, "00-sequence-complete.mp4")
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


CUTS = {}


def chrono_cuts(name="chronologie"):
    """Début et fin de chaque fiche d'une timeline (par son id), pour en extraire une seule."""
    if name not in CUTS:
        js = f"require('./core.js'); require('./timelines/{name}.js'); console.log(JSON.stringify(Object.fromEntries(globalThis.TL.segments.map(s => [s.id || s.type, [s.start, s.end]]))))"
        CUTS[name] = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT))
    return CUTS[name]


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
    """Lien physique quand c'est possible (aucune place en plus sur le disque), sinon copie."""
    if not (os.path.exists(dst) and os.path.samefile(src, dst)):
        if os.path.exists(dst):
            os.remove(dst)
        try:
            os.link(src, dst)
        except OSError:
            shutil.copyfile(src, dst)
    KEEP.add(dst)


def son(name, folder, video):
    """Pistes séparées de la pièce (tools/pistes.py) : clips WAV dans son/, séquence XML pour Premiere à côté de la
    vidéo (Fichier > Importer ; puis Fichier > Exporter > AAF ou OMF pour le studio son)."""
    src = os.path.join(OUT, "pistes", name)
    if not os.path.isdir(src):
        return False
    os.makedirs(os.path.join(folder, "son"), exist_ok=True)
    for f in sorted(os.listdir(src)):
        if f.endswith(".wav"):
            copy(os.path.join(src, f), os.path.join(folder, "son", f))
    x = open(os.path.join(src, f"{name}.xml"), encoding="utf-8").read()
    x = re.sub(r"<pathurl>([^<]+\.wav)</pathurl>", r"<pathurl>son/\1</pathurl>", x)
    x = x.replace(f"<pathurl>{name}.mp4</pathurl>", f"<pathurl>{video}</pathurl>").replace(f"<name>{name}.mp4</name>", f"<name>{video}</name>")
    dst = os.path.join(folder, f"{name}-son-premiere.xml")
    open(dst, "w", encoding="utf-8").write(x)
    KEEP.add(dst)
    return True


def cut(src, a, b, dst):
    KEEP.add(dst)
    if fresh(src, dst):
        return
    d = (b if b is not None else duration(src)) - a
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{a:.3f}", "-i", src, "-t", f"{d:.3f}",
                    "-c:v", "libx264", "-preset", "slow", "-b:v", "10M", "-maxrate", "14M", "-bufsize", "20M", "-tune", "grain",
                    "-pix_fmt", "yuv420p", "-af", f"afade=t=in:d=0.04,afade=t=out:st={max(0, d - 0.06):.3f}:d=0.06",
                    "-c:a", "aac", "-aac_pns", "0", "-aac_is", "0", "-b:a", "320k", "-movflags", "+faststart", dst], check=True)


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
    pro = []
    survol("intro-aerienne", os.path.join(d0, "00-intro-aerienne"), pro, "intro-aerienne")
    reels(0, d0, pro)
    lines += ["\n## 0-Generique-et-prologue\n", "- 00 intro aérienne (de l'orbite à la mer Morte, titre), dossier plan par plan\n",
              "- 01 générique\n", "- 02 et 03 : la chronologie en prologue (facultatif)\n"] + [f"- {x}\n" for x in pro[1:]]
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
                    son(src, cd, os.path.basename(path))
                elif isinstance(span, str):
                    cut(full, *chrono_cuts(src)[span], path)
                else:
                    cut(full, span[0], span[1], path)
                items.append(name.replace("-", " "))
            for src, name in SURVOLS.get(ch, []):
                k += 1
                survol(src, os.path.join(cd, f"{k:02d}-{name}"), items, name)
            reels(ch, cd, items)
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
    extra = []
    survol("plans-respiration", os.path.join(DST, "Plans-de-respiration"), extra, "plans-de-respiration")
    survol("archives-vivantes", os.path.join(DST, "Archives-en-relief"), extra, "archives-en-relief")
    if extra:
        lines += ["\n## Plans de respiration et archives en relief\n",
                  "- plans aériens sans texte, à poser entre deux séquences ; photos d'archive en relief\n"]
    srcs = sorted(f for f in glob.glob(os.path.join(OUT, "cartons", "*-source-*.mov")))
    if srcs:
        d9 = os.path.join(DST, "Cartons-sources-transparents")
        os.makedirs(d9, exist_ok=True)
        for f in srcs:
            copy(f, os.path.join(d9, os.path.basename(f)))
        lines += ["\n## Cartons-sources-transparents\n", "- mentions de source transparentes (ONU, UNRWA, OCHA, B'Tselem…), à poser sur n'importe quelle image\n"]
    lines += ["\n## Le son pour l'ingé son\n",
              "Chaque séquence a un dossier `son/` (un clip WAV 48 kHz 24 bits par son, rangés par famille : ambiances, "
              "souffles et montées, impacts, guerre, bruitages) et un fichier `<pièce>-son-premiere.xml` : dans Premiere, "
              "Fichier > Importer ce XML (s'il demande où sont les médias, montrer la vidéo puis un clip de `son/`), puis "
              "Fichier > Exporter > AAF ou OMF pour le studio son. La dernière paire de pistes, muette, est le mixage livré.\n",
              "\n## Cartons transparents\n",
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
