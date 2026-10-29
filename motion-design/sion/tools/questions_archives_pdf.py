"""Le dossier de recherche d'archives pour Perplexity, en un seul PDF : script/QUESTIONS-PERPLEXITY-ARCHIVES.pdf.

    python3 tools/questions_archives_pdf.py

Refait depuis script/QUESTIONS-PERPLEXITY-ARCHIVES.md (consignes, questions par sujet, vérifications, fichiers à mettre
dans la Dropbox) et script/*.yaml : la liste, plan par plan, des séquences du film qui gagneraient une vraie image
(fiches d'événements, portraits, citations sur fond noir, photos, reconstitutions), avec leur durée, ce qu'on voit
aujourd'hui et ce que dit la voix. Les plans d'avant le cinéma (toutes leurs dates avant 1896) n'y sont pas. Les
archives filmées déjà dans le film sont listées pour que Perplexity ne les propose pas une seconde fois.
"""
import glob
import html
import os
import re
import subprocess
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from derush import flat, plan_id  # noqa: E402

MD = os.path.join(ROOT, "script", "QUESTIONS-PERPLEXITY-ARCHIVES.md")
PDF = os.path.join(ROOT, "script", "QUESTIONS-PERPLEXITY-ARCHIVES.pdf")
WORK = os.path.join(ROOT, "output", "questions-pdf")
VRAI = {"ARCH", "RÉEL", "PHOTO"}
# pièces de motion design qu'une vraie image peut remplacer ou précéder (les cartes et les données restent en 3D)
REMPLACABLES = ("documents", "portraits", "paroles", "photos-fixes", "reconstitutions", "chronologie",
                "figures-aujourdhui")


def duree(p):
    a = float(p.get("entree", 0) or 0)
    return float(p["sortie"]) - a if "sortie" in p else float(p.get("duree", 0) or 0)


def voix_courte(v, n=230):
    t = re.sub(r"\*\*|//|/", " ", flat(v))
    t = " ".join(t.split())
    return t if len(t) <= n else t[:n].rsplit(" ", 1)[0] + " …"


def annees(*txt):
    return [int(y) for y in re.findall(r"\b(1[89]\d\d|20[0-2]\d)\b", " ".join(flat(t) for t in txt))]


def sequences():
    out = []
    for y in sorted(glob.glob(os.path.join(ROOT, "script", "0*.yaml"))):
        d = yaml.safe_load(open(y, encoding="utf-8"))
        for ch in d["chapitres"]:
            tot = sum(duree(p) for p in ch["plans"])
            vrai = sum(duree(p) for p in ch["plans"] if p["type"] in VRAI)
            part = 100 * vrai / tot if tot else 0
            lignes = []
            for k, p in enumerate(ch["plans"], start=1):
                f = flat(p.get("fichier"))
                if p["type"] in VRAI or p["type"] in ("CARTON", "NOIR") or duree(p) < 3:
                    continue
                if not (p["type"] == "IA" or any(x in f for x in REMPLACABLES)):
                    continue
                ys = annees(p.get("ecran"), p.get("voix"), p.get("note"))
                if ys and max(ys) < 1896:
                    continue  # avant le cinéma : aucune image filmée possible
                vu = flat(p.get("ecran"))
                if p["type"] == "IA":
                    vu = (vu + " · " if vu else "") + "reconstitution par IA (à remplacer si une vraie archive existe)"
                elif not vu:
                    vu = {"portraits": "portrait de la personne citée (photo fixe)", "paroles": "citation sur fond noir",
                          "documents": "fiche de l'événement sur la carte", "photos-fixes": "photo fixe"}.get(
                        next((x for x in REMPLACABLES if x in f), ""), "motion design")
                lignes.append({"id": plan_id(ch["num"], k), "d": duree(p), "vu": vu, "voix": voix_courte(p.get("voix")),
                               "ans": f"{min(ys)}" + (f" à {max(ys)}" if max(ys) != min(ys) else "") if ys else ""})
            if lignes:
                out.append({"titre": ch["titre"], "part": part, "prio": 1 if part < 25 else 2, "lignes": lignes})
    return out


def blocs():
    """Les sections du fichier .md : (titre, texte hors bloc, blocs de code)."""
    txt = open(MD, encoding="utf-8").read()
    secs = re.split(r"^## ", txt, flags=re.M)
    intro, res = secs[0], []
    for s in secs[1:]:
        titre, _, corps = s.partition("\n")
        codes = re.findall(r"```\n(.*?)```", corps, flags=re.S)
        texte = re.sub(r"```\n.*?```", "", corps, flags=re.S).strip()
        res.append((titre.strip(), texte, codes))
    return intro, res


def md_inline(t):
    t = html.escape(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"`(.+?)`", r"<code>\1</code>", t)
    return re.sub(r"(https?://[^\s<|]+)", r'<a href="\1">\1</a>', t)


def md_texte(t):
    """Paragraphes, listes et tableaux simples du .md."""
    out, table = [], []
    for ligne in t.splitlines() + [""]:
        if ligne.startswith("|"):
            if not set(ligne.replace("|", "").strip()) <= set("-: "):
                table.append([c.strip() for c in ligne.strip("|").split("|")])
            continue
        if table:
            tete, *rangs = table
            out.append("<table class='t'><tr>" + "".join(f"<th>{md_inline(c)}</th>" for c in tete) + "</tr>"
                       + "".join("<tr>" + "".join(f"<td>{md_inline(c)}</td>" for c in r) + "</tr>" for r in rangs)
                       + "</table>")
            table = []
        if re.match(r"^\d+\. |^- ", ligne):
            out.append(f"<p class='li'>{md_inline(ligne)}</p>")
        elif ligne.strip():
            if out and out[-1].startswith("<p class='p'>") and not out[-1].endswith("</p>"):
                out[-1] += " " + md_inline(ligne.strip())
            else:
                out.append("<p class='p'>" + md_inline(ligne.strip()))
        elif out and out[-1].startswith("<p class='p'>") and not out[-1].endswith("</p>"):
            out[-1] += "</p>"
    return "".join(o if o.endswith(("</p>", "</table>")) else o + "</p>" for o in out)


def deja():
    noms = sorted(os.path.basename(f)[:-4] for f in glob.glob(os.path.join(ROOT, "output", "archives-filmees", "*.mp4")))
    return [n[:4] + " · " + n[5:].replace("-", " ") for n in noms]


def page():
    intro, secs = blocs()
    seqs = sequences()
    n_l = sum(len(s["lignes"]) for s in seqs)
    d_l = sum(x["d"] for s in seqs for x in s["lignes"])
    fonts = os.path.join(ROOT, "fonts")
    corps = []
    corps.append(f"""<section class="couv"><div class="eyebrow">DOSSIER DE RECHERCHE · ARCHIVES FILMÉES</div>
<h1>Palestine, Israël : les vraies images qui manquent</h1>
<p class="lead">Un documentaire historique en français (1880 à 2025, 95 minutes, diffusé sur YouTube) cherche des images
filmées réelles et libres de droits. Ce dossier dit précisément lesquelles : d'abord les règles, puis des questions par
sujet, puis la liste des {n_l} plans du film ({d_l / 60:.0f} minutes) qui gagneraient une vraie image, chacun avec son
numéro, sa durée, ce qu'on voit aujourd'hui et ce que dit la voix.</p>
<div class="chiffres"><div><b>19 %</b><span>vraies images aujourd'hui</span></div><div><b>35 à 40 %</b><span>objectif</span></div>
<div><b>+15 à 20 min</b><span>à trouver</span></div><div><b>{n_l}</b><span>plans à couvrir</span></div></div>
<h2>Comment répondre</h2>
<p class="p">Commence par les questions A et B (Gaza, Cisjordanie), puis la liste des plans, chapitre par chapitre, en
commençant par ceux marqués <b>priorité 1</b>. Pour chaque plan, propose une ou deux vraies images qui montrent ce que
dit la voix : le numéro du plan, le film, sa date et son lieu, le moment utile (début et fin), la licence avec la
phrase de la page, le lien de la page, le lien direct du fichier et le crédit à citer. Un plan sans image possible :
écris « rien de libre » et passe au suivant. Si tout ne tient pas dans une réponse, réponds par lots d'une vingtaine
de plans, dans l'ordre, et termine par « arrêté au plan … » : je te dirai de continuer.</p></section>""")
    trouves = []
    for titre, texte, codes in secs:
        if titre.startswith("Déjà trouvés"):  # pour l'auteur (Dropbox) : ici, seulement « déjà trouvés »
            trouves = [r.split("|")[2].strip() for r in texte.splitlines() if re.match(r"^\| F\d", r)]
            continue
        titre = re.sub(r" \(à coller.*?\)", "", titre)
        corps.append(f"<section class='q'><h2>{md_inline(titre)}</h2>{md_texte(texte) if texte else ''}"
                     + "".join(f"<pre>{html.escape(c.rstrip())}</pre>" for c in codes) + "</section>")
    corps.append("""<section class="plans"><h2>Les plans du film qui attendent une vraie image</h2>
<p class="p">Chapitre par chapitre. Le pourcentage est la part de vraies images du chapitre aujourd'hui. « Ce qu'on
voit » décrit le plan actuel (motion design) ; la vraie image peut le remplacer ou passer juste avant lui, sur la même
voix. Les dates entre parenthèses sont celles que citent le plan et la voix.</p>""")
    for s in seqs:
        rows = "".join(f"<tr><td class='id'>{x['id']}</td><td class='d'>{x['d']:.0f} s</td><td>{html.escape(x['vu'])}"
                       f"{' <span class=an>(' + x['ans'] + ')</span>' if x['ans'] else ''}</td>"
                       f"<td class='v'>{html.escape(x['voix'])}</td></tr>" for x in s["lignes"])
        # titre du chapitre en légende du tableau : il ne reste jamais seul en bas d'une page
        corps.append(f"<table class='plans'><caption>{html.escape(s['titre'])} <span class='p{s['prio']}'>priorité "
                     f"{s['prio']} · {s['part']:.0f} % de vraies images</span></caption><tr><th>Plan</th><th>Durée</th>"
                     f"<th>Ce qu'on voit aujourd'hui</th><th>Ce que dit la voix</th></tr>{rows}</table>")
    corps.append("</section>")
    corps.append("<section class='deja'><h2>Déjà dans le film : ne pas les proposer</h2><p class='p'>Les archives filmées "
                 "déjà montées (année, sujet). Un autre extrait du même film n'apporte rien.</p><p class='liste'>"
                 + " · ".join(html.escape(n) for n in deja()) + "</p>"
                 + ("<p class='p'>Déjà trouvés aussi, pas encore montés :</p><p class='liste'>"
                    + " · ".join(html.escape(t) for t in trouves) + "</p>" if trouves else "") + "</section>")
    css = f"""
@font-face {{ font-family: 'Archivo'; src: url('file://{fonts}/Archivo[wdth,wght].ttf'); font-weight: 100 900; font-stretch: 62% 125%; }}
@font-face {{ font-family: 'Newsreader'; src: url('file://{fonts}/Newsreader[opsz,wght].ttf'); font-weight: 200 800; }}
@font-face {{ font-family: 'Newsreader'; src: url('file://{fonts}/Newsreader-Italic[opsz,wght].ttf'); font-weight: 200 800; font-style: italic; }}
@font-face {{ font-family: 'DM Mono'; src: url('file://{fonts}/DMMono-Regular.ttf'); font-weight: 400; }}
@font-face {{ font-family: 'DM Mono'; src: url('file://{fonts}/DMMono-Medium.ttf'); font-weight: 500; }}
:root {{ --ink: #1d1916; --mute: #7d746c; --line: #e4ddd5; --tint: #f6f1eb; --accent: #c8321c; }}
body {{ margin: 0; color: var(--ink); background: #fff; font: 10pt/1.45 'Newsreader', Georgia, serif; }}
h1 {{ font: 800 25pt/1.05 'Archivo', sans-serif; font-stretch: 85%; letter-spacing: -.01em; margin: 3mm 0 6mm; text-wrap: balance; }}
h2 {{ font: 700 12.5pt 'Archivo', sans-serif; font-stretch: 90%; margin: 8mm 0 3mm; color: var(--ink); break-after: avoid; }}
h3 {{ font: 700 9.5pt 'Archivo', sans-serif; letter-spacing: .02em; margin: 6mm 0 2mm; break-after: avoid; }}
caption {{ caption-side: top; text-align: left; font: 700 9.5pt 'Archivo', sans-serif; letter-spacing: .02em; padding: 6mm 0 2mm; break-after: avoid; }}
caption span, h3 span {{ font: 500 7.5pt 'DM Mono', monospace; letter-spacing: .08em; margin-left: 2mm; }}
.p1 {{ color: var(--accent); }} .p2 {{ color: var(--mute); }}
.eyebrow {{ font: 500 8pt 'DM Mono', monospace; letter-spacing: .22em; color: var(--accent); }}
.lead {{ font-size: 12pt; line-height: 1.5; max-width: 160mm; }}
.chiffres {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 5mm; border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line); padding: 4mm 0; margin: 6mm 0; }}
.chiffres b {{ display: block; font: 800 15pt 'Archivo', sans-serif; font-stretch: 85%; color: var(--accent); }}
.chiffres span {{ font: 7.5pt 'DM Mono', monospace; letter-spacing: .06em; color: var(--mute); }}
.p {{ margin: 0 0 2.5mm; max-width: 170mm; }} .li {{ margin: 0 0 1.2mm 4mm; }}
pre {{ font: 8.2pt/1.45 'DM Mono', monospace; background: var(--tint); border-left: 2px solid var(--accent);
  padding: 3mm 4mm; white-space: pre-wrap; margin: 2mm 0 4mm; break-inside: avoid; }}
code {{ font: 8.5pt 'DM Mono', monospace; }}
a {{ color: var(--ink); text-decoration: none; word-break: break-all; }}
table {{ width: 100%; border-collapse: collapse; font-size: 8.4pt; line-height: 1.35; }}
th {{ font: 500 7pt 'DM Mono', monospace; letter-spacing: .08em; text-transform: uppercase; color: var(--mute);
  text-align: left; border-bottom: 1px solid var(--ink); padding: 1.2mm 1.5mm; }}
td {{ border-bottom: 1px solid var(--line); padding: 1.3mm 1.5mm; vertical-align: top; }}
tr {{ break-inside: avoid; }}
td.id {{ font: 500 8pt 'DM Mono', monospace; white-space: nowrap; color: var(--accent); }}
td.d {{ font: 8pt 'DM Mono', monospace; white-space: nowrap; color: var(--mute); }}
td.v {{ font-style: italic; width: 46%; }}
.an {{ font: 7.5pt 'DM Mono', monospace; color: var(--mute); }}
table.t td, table.t th {{ font-size: 8pt; }}
.liste {{ font: 8pt/1.6 'DM Mono', monospace; color: var(--mute); }}
.couv {{ break-after: page; }} .plans {{ break-before: page; }}
"""
    return f"<!doctype html><html lang='fr'><head><meta charset='utf-8'><title>Archives pour Perplexity</title><style>{css}</style></head><body>{''.join(corps)}</body></html>", n_l, d_l


def main():
    os.makedirs(WORK, exist_ok=True)
    src = os.path.join(WORK, "questions.html")
    doc, n_l, d_l = page()
    open(src, "w", encoding="utf-8").write(doc)
    subprocess.run(["node", os.path.join(ROOT, "tools", "html_pdf.mjs"), src, PDF, "SION · archives à trouver"], check=True)
    n = re.search(r"Pages:\s+(\d+)", subprocess.check_output(["pdfinfo", PDF], text=True)).group(1)
    print(PDF, f"{n} pages", f"{n_l} plans ({d_l / 60:.1f} min)")


if __name__ == "__main__":
    main()
