"""Le scénario complet en PDF, pour le lire et enregistrer la voix off : script/SION-scenario-voix-off.pdf.

    python3 tools/script_pdf.py

Refait depuis script/*.yaml (à relancer après chaque changement du script). Pour chaque chapitre : l'intention, la
prononciation des noms difficiles (tirée de script/guide-voix-off.md), puis chaque plan dans l'ordre, avec ce qu'on
voit à l'écran et, en gros, le texte à dire avec ses pauses. Les numéros sont ceux des plans (comme dans
VOIX-A-LIRE.md et dans les fichiers livrés). Un plan marqué « verifier » est signalé : ne pas l'enregistrer avant.
"""
import datetime
import glob
import html
import os
import re
import subprocess

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, "output", "script-pdf")
PDF = os.path.join(ROOT, "script", "SION-scenario-voix-off.pdf")
WPM = 140  # débit visé par le guide de la voix off
PAUSE = {"///": 2.0, "//": 1.0, "/": 0.35}
TYPES = {"MD": "Animation", "3D": "3D", "RÉEL": "Vrai plan", "ARCH": "Archive filmée", "PHOTO": "Photo",
         "IA": "Reconstitution", "CARTON": "Titre", "NOIR": "Noir"}
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre",
        "décembre"]


def flat(v):
    return " ".join(str(v or "").split())


def duree(p):
    return float(p["sortie"]) - float(p.get("entree", 0) or 0) if "sortie" in p else float(p.get("duree", 0) or 0)


def mmss(s):
    s = int(round(s))
    return f"{s // 60} min {s % 60:02d}" if s >= 60 else f"{s} s"


def parle(p):
    v = flat(p.get("voix"))
    return v if v and v.lower() != "silence" else ""


def temps_voix(v):
    """Durée de lecture estimée : les mots au débit du guide, plus les pauses marquées."""
    t = 0.0
    for k in ("///", "//", "/"):  # du plus long au plus court, pour ne pas compter « // » comme deux « / »
        t += v.count(k) * PAUSE[k]
        v = v.replace(k, " ")
    return mots(v) / WPM * 60 + t


def mots(v):
    return len(re.sub(r"\([^)]*\)", " ", v).replace("/", " ").replace("*", "").split())


def fr(t):
    """Espaces insécables de la typographie française : une ligne ne commence jamais par « » : ? ! ou une pause."""
    t = re.sub(r"« ", "«\u00a0", t)
    t = re.sub(r" ([»:;?!])", "\u00a0\\1", t)
    return re.sub(r" (/+)", "\u00a0\\1", t)


def voix_html(v):
    """Le texte à dire : pauses en couleur, mot appuyé en gras, indications de jeu en italique."""
    h = html.escape(fr(v), quote=False).replace("///", "\x03").replace("//", "\x02").replace("/", "\x01")
    h = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", h)
    h = re.sub(r"\(([^)]*)\)", r'<span class="dir">(\1)</span>', h)
    return (h.replace("\x03", '<span class="p p3">///</span>').replace("\x02", '<span class="p p2">//</span>')
            .replace("\x01", '<span class="p p1">/</span>'))


def ecran(p):
    e = flat(p.get("ecran"))
    if e:
        return e
    if p.get("type") == "NOIR":
        return "écran noir"
    f = os.path.splitext(os.path.basename(str(p.get("fichier") or p.get("photo") or "")))[0]
    return re.sub(r"^\d+-", "", f).replace("-", " ") if f else ""


def prononciations():
    """Les tableaux « Prononciation » du guide : [(noms à chercher, mot, à dire)]."""
    out, dedans = [], False
    for line in open(os.path.join(ROOT, "script", "guide-voix-off.md"), encoding="utf-8"):
        if line.startswith("## "):
            dedans = "Prononciation" in line
        elif dedans and line.startswith("| ") and not line.startswith("| Mot") and not line.startswith("|---"):
            mot, dire = [c.strip() for c in line.strip().strip("|").split("|")[:2]]
            noms = [n.strip() for n in re.split(r",| et ", mot) if n.strip()]
            out.append((noms, mot, dire))
    return out


def trouve(nom, texte):
    return re.search(r"(?<![\w'-])" + re.escape(nom) + r"(?![\w-])", texte, re.I) is not None


def chapitres():
    for f in sorted(glob.glob(os.path.join(ROOT, "script", "0[0-9]-*.yaml"))):
        yield yaml.safe_load(open(f, encoding="utf-8"))


def page_html(parts, pages):
    pron = prononciations()
    fonts = os.path.join(ROOT, "fonts")
    total_film = total_voix = total_mots = 0.0
    n_ch = 0
    corps, sommaire = [], []
    for part in parts:
        titre_part = part["titre"]
        ouv = [c for c in part["chapitres"] if not any(parle(p) for p in c["plans"])]
        chs = [c for c in part["chapitres"] if any(parle(p) for p in c["plans"])]
        eyebrow, _, nom = titre_part.partition(" · ")
        if not nom:
            eyebrow, nom = "", titre_part
        sommaire.append(f'<div class="som-part">{html.escape(titre_part)}</div>')
        bloc = [f'<section class="partie"><div class="eyebrow">{html.escape(eyebrow.upper())}</div>'
                f'<h1>{html.escape(nom)}</h1>']
        if part.get("intro"):
            bloc.append(f'<p class="intro">{html.escape(fr(flat(part["intro"])))}</p>')
        for c in ouv:
            d = sum(duree(p) for p in c["plans"])
            total_film += d
            vu = " · ".join(html.escape(ecran(p)) for p in c["plans"] if ecran(p))
            bloc.append(f'<div class="ouv"><span class="mono">{html.escape(c["titre"])} · {mmss(d)} · sans voix</span>'
                        f'<p>{vu}</p></div>')
        bloc.append("</section>")
        corps.append("".join(bloc))
        for c in chs:
            n_ch += 1
            plans = c["plans"]
            d_film = sum(duree(p) for p in plans)
            textes = [parle(p) for p in plans if parle(p)]
            d_voix = sum(temps_voix(v) for v in textes)
            n_mots = sum(mots(v) for v in textes)
            total_film += d_film
            total_voix += d_voix
            total_mots += n_mots
            eb, _, t = c["titre"].partition(" · ")
            cle = eb.upper()
            page = pages.get(cle, "")
            sommaire.append(f'<div class="som-ch"><span class="som-t">{html.escape(c["titre"])}</span>'
                            f'<span class="som-d">{mmss(d_film)}</span><span class="som-p">{page}</span></div>')
            tout = " ".join(textes)
            pr = [(m, dire) for noms, m, dire in pron if any(trouve(n, tout) for n in noms)]
            h = [f'<section class="chap"><div class="eyebrow">{html.escape(cle)}</div><h2>{html.escape(t or eb)}</h2>',
                 f'<div class="meta">{mmss(d_film)} de film · {n_mots} mots · environ {mmss(d_voix)} de voix · '
                 f'{len(textes)} plans parlés</div>']
            if c.get("intention"):
                h.append(f'<p class="intention"><span class="lab">L’intention</span> {html.escape(fr(flat(c["intention"])))}</p>')
            if pr:
                rows = "".join(f"<tr><td>{html.escape(m)}</td><td>{html.escape(dire)}</td></tr>" for m, dire in pr)
                h.append(f'<table class="pron"><caption>Prononciation</caption>{rows}</table>')
            deja = False
            for k, p in enumerate(plans, start=1):
                v = parle(p)
                num = f'{c["num"]}.{k}'
                typ = TYPES.get(p.get("type"), p.get("type", ""))
                e = ecran(p)
                if not v:
                    h.append(f'<div class="plan muet"><div class="g"><span class="num">{num}</span></div>'
                             f'<div class="d"><span class="mono">{html.escape(typ)} · {mmss(duree(p))} · image seule</span>'
                             + (f' <span class="ec">{html.escape(fr(e))}</span>' if e else "") + "</div></div>")
                    continue
                if deja:
                    h.append('<div class="sil"><span>2 s de silence</span></div>')
                deja = True
                warn = ""
                if p.get("verifier"):
                    warn = (f'<div class="warn"><b>N’enregistre pas encore ce plan.</b> On attend : '
                            f'{html.escape(fr(flat(p["verifier"])))}</div>')
                h.append(f'<div class="plan"><div class="g"><span class="num">{num}</span>'
                         f'<span class="typ">{html.escape(typ)}</span><span class="dur">{mmss(duree(p))}</span></div>'
                         f'<div class="d">' + (f'<div class="ec">À l’écran : {html.escape(fr(e))}</div>' if e else "")
                         + f'{warn}<p class="voix">{voix_html(v)}</p></div></div>')
            h.append("</section>")
            corps.append("".join(h))

    today = datetime.date.today()
    version = f"{today.day} {MOIS[today.month - 1]} {today.year}"
    hm = int(round(total_film / 60))
    couverture = f"""
<section class="couv">
  <div class="eyebrow">Documentaire · scénario et voix off</div>
  <div class="titre">SION</div>
  <div class="scripts"><span class="he">ציון</span> · <span class="ar">صهيون</span></div>
  <p class="sous">Tout le scénario, plan par plan, avec le texte à dire, ses pauses et ses appuis.</p>
  <div class="chiffres">
    <div><b>{n_ch}</b><span>chapitres</span></div>
    <div><b>{hm // 60} h {hm % 60:02d}</b><span>de film</span></div>
    <div><b>{f"{int(round(total_mots, -2)):,}".replace(",", "\u202f")}</b><span>mots à dire</span></div>
    <div><b>{int(round(total_voix / 60))} min</b><span>de voix environ</span></div>
  </div>
  <div class="version">Version du {version}</div>
</section>"""
    mode = f"""
<section class="mode">
  <h2 class="m">Avant d’enregistrer</h2>
  <h3>Les signes dans le texte</h3>
  <table class="signes">
    <tr><td><span class="p p1">/</span></td><td>une petite respiration, sans couper la phrase</td></tr>
    <tr><td><span class="p p2">//</span></td><td>un vrai silence, une seconde</td></tr>
    <tr><td><span class="p p3">///</span></td><td>un long silence, deux secondes : on laisse l’image parler</td></tr>
    <tr><td><strong class="ex">mot</strong></td><td>le seul mot de la phrase sur lequel on appuie</td></tr>
    <tr><td><span class="dir">(lentement)</span></td><td>une indication de jeu : ne pas la lire</td></tr>
    <tr><td><span class="sil-ex">2 s de silence</span></td><td>entre deux plans parlés : tais-toi deux secondes, puis enchaîne</td></tr>
  </table>
  <h3>La méthode</h3>
  <ol>
    <li><b>Un fichier par chapitre</b>, nommé <span class="mono">chapitre-08.wav</span> (WAV, 48 kHz, 24 bits, mono).
      Au début de chaque fichier : <b>10 secondes de silence</b> sans bouger, pour le bruit de la pièce.</li>
    <li><b>Deux secondes de silence entre deux plans.</b> C’est grâce à elles que je cale chaque plan sur ta voix.
      À l’intérieur d’un plan, les silences restent plus courts.</li>
    <li><b>Si tu te trompes</b> : tais-toi trois secondes, puis reprends <b>la phrase entière</b>, pas le mot. Je garde
      toujours la dernière prise. Pas besoin de dire les numéros des plans.</li>
    <li><b>Le rythme</b> : environ {WPM} mots par minute, calme et précis. La durée de chaque plan est indiquée à
      gauche : elle te donne le tempo, pas un chronomètre. Je cale les images sur ta voix ensuite.</li>
    <li><b>Le ton</b> : parle à une seule personne, intelligente, qui ne connaît pas le sujet. Pas d’indignation : les
      faits suffisent. Plus le sujet est dur, plus la voix est simple. Les citations : une voix un peu plus neutre,
      comme une lettre qu’on lit, sans imitation.</li>
    <li><b>Les chiffres</b> : lentement, bien détachés. Ce sont eux que les gens retiennent.</li>
    <li><b>Séances de 45 minutes au plus.</b> Commence par le chapitre 1 et envoie-le-moi : je te fais un retour
      (rythme, appuis, son de la pièce) avant le reste.</li>
  </ol>
  <h3>Comment lire une page</h3>
  <div class="plan demo"><div class="g"><span class="num">4.5</span><span class="typ">Animation</span><span class="dur">14 s</span></div>
    <div class="d"><div class="ec">À l’écran : ce que le spectateur voit pendant ce plan</div>
    <p class="voix">Le texte à dire, <span class="p p1">/</span> en gros, <span class="p p2">//</span> avec ses <strong>appuis</strong>.</p></div></div>
  <div class="plan muet demo"><div class="g"><span class="num">4.6</span></div><div class="d"><span class="mono">Titre · 5 s · image seule</span>
    <span class="ec">les plans sans voix sont en petit : ils te donnent le fil du film</span></div></div>
</section>"""
    som = f'<section class="sommaire"><h2 class="m">Sommaire</h2>{"".join(sommaire)}</section>'

    css = f"""
@font-face {{ font-family: 'Archivo'; src: url('file://{fonts}/Archivo[wdth,wght].ttf'); font-weight: 100 900; font-stretch: 62% 125%; }}
@font-face {{ font-family: 'Newsreader'; src: url('file://{fonts}/Newsreader[opsz,wght].ttf'); font-weight: 200 800; }}
@font-face {{ font-family: 'Newsreader'; src: url('file://{fonts}/Newsreader-Italic[opsz,wght].ttf'); font-weight: 200 800; font-style: italic; }}
@font-face {{ font-family: 'DM Mono'; src: url('file://{fonts}/DMMono-Regular.ttf'); font-weight: 400; }}
@font-face {{ font-family: 'DM Mono'; src: url('file://{fonts}/DMMono-Medium.ttf'); font-weight: 500; }}
@font-face {{ font-family: 'Noto Sans Hebrew'; src: url('file://{fonts}/NotoSansHebrew[wdth,wght].ttf'); }}
@font-face {{ font-family: 'Noto Kufi Arabic'; src: url('file://{fonts}/NotoKufiArabic[wght].ttf'); }}
:root {{ --ink: #1d1916; --mute: #7d746c; --line: #e4ddd5; --tint: #f6f1eb; --accent: #c8321c; --accent2: #e8341e; --cold: #4f6f8f; }}
* {{ box-sizing: border-box; }}
html {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
body {{ margin: 0; color: var(--ink); background: #fff; font: 11pt/1.5 'Newsreader', Georgia, serif; font-variation-settings: 'opsz' 12; }}
.mono, .meta, .eyebrow, .num, .dur, .typ, caption {{ font-family: 'DM Mono', monospace; }}
.eyebrow {{ font-size: 8.5pt; letter-spacing: .22em; color: var(--accent); }}
h1, h2, .titre {{ font-family: 'Archivo', sans-serif; text-transform: uppercase; text-wrap: balance; margin: 0; }}
h1 {{ font-size: 34pt; line-height: 1.02; font-weight: 800; font-stretch: 88%; margin: 3mm 0 8mm; }}
h2 {{ font-size: 19pt; line-height: 1.08; font-weight: 800; font-stretch: 90%; margin: 2mm 0 2.5mm; }}
h2.m {{ font-size: 15pt; letter-spacing: .04em; margin-bottom: 6mm; }}
h3 {{ font-family: 'Archivo', sans-serif; font-size: 9pt; letter-spacing: .14em; text-transform: uppercase; margin: 7mm 0 3mm; color: var(--accent); }}
section {{ break-before: page; }}
.couv {{ break-before: auto; height: 255mm; display: flex; flex-direction: column; justify-content: center; }}
.couv .titre {{ font-size: 110pt; font-weight: 900; font-stretch: 80%; line-height: .9; letter-spacing: .02em; margin-top: 6mm; }}
.couv .scripts {{ font-size: 26pt; color: var(--accent); margin: 2mm 0 10mm; }}
.he {{ font-family: 'Noto Sans Hebrew'; unicode-bidi: isolate; }} .ar {{ font-family: 'Noto Kufi Arabic'; unicode-bidi: isolate; }}
.couv .scripts {{ direction: ltr; unicode-bidi: isolate; }}
.couv .sous {{ font: italic 15pt/1.4 'Newsreader', serif; max-width: 120mm; margin: 0 0 14mm; }}
.chiffres {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 6mm; border-top: 1px solid var(--line); padding-top: 6mm; max-width: 150mm; }}
.chiffres b {{ display: block; font: 800 20pt 'Archivo', sans-serif; font-stretch: 90%; }}
.chiffres span {{ font: 8pt 'DM Mono', monospace; letter-spacing: .1em; color: var(--mute); }}
.version {{ margin-top: 16mm; font: 8.5pt 'DM Mono', monospace; letter-spacing: .14em; color: var(--mute); }}
.mode ol {{ margin: 0; padding-left: 5mm; display: grid; gap: 2.2mm; }}
.signes {{ border-collapse: collapse; }}
.signes td {{ padding: 1.2mm 4mm 1.2mm 0; vertical-align: baseline; }}
.signes td:first-child {{ width: 32mm; font-size: 14pt; }}
.sil-ex {{ font: 7.5pt 'DM Mono', monospace; letter-spacing: .12em; color: var(--cold); }}
.demo {{ border: 1px dashed var(--line); border-radius: 2mm; padding: 3mm; margin-top: 2mm; }}
.sommaire {{ font-size: 10pt; }}
.som-part {{ font: 700 8.5pt 'Archivo', sans-serif; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); margin: 4.5mm 0 1mm; }}
.som-ch {{ display: grid; grid-template-columns: 1fr 18mm 10mm; gap: 3mm; padding: .7mm 0; border-bottom: 1px solid var(--tint); }}
.som-d, .som-p {{ font: 8.5pt 'DM Mono', monospace; color: var(--mute); text-align: right; }}
.som-p {{ color: var(--ink); }}
.partie {{ padding-top: 60mm; }}
.intro {{ font-style: italic; font-size: 12.5pt; line-height: 1.55; max-width: 140mm; color: #3d3631; }}
.ouv {{ margin-top: 8mm; padding: 3mm 4mm; background: var(--tint); border-radius: 1.5mm; }}
.ouv p {{ margin: 1.5mm 0 0; font-size: 9.5pt; color: var(--mute); }}
.ouv .mono {{ font-size: 8pt; letter-spacing: .08em; }}
.meta {{ font-size: 8pt; letter-spacing: .08em; color: var(--mute); margin-bottom: 4mm; }}
.intention {{ font-style: italic; font-size: 10pt; color: #4a423c; margin: 0 0 4mm; max-width: 150mm; }}
.lab {{ font: normal 7.5pt 'DM Mono', monospace; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); margin-right: 1.5mm; }}
.pron {{ border-collapse: collapse; margin: 0 0 6mm; font-size: 9.5pt; background: var(--tint); width: 100%; }}
.pron caption {{ text-align: left; font-size: 7.5pt; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); padding: 0 0 1.5mm; }}
.pron td {{ padding: 1mm 3mm; border-bottom: 1px solid #fff; }}
.pron td:first-child {{ width: 45%; font-weight: 600; }}
.plan {{ display: grid; grid-template-columns: 22mm 1fr; gap: 4mm; break-inside: avoid; padding: 2.5mm 0; }}
.plan .g {{ display: flex; flex-direction: column; gap: .6mm; padding-top: 1.2mm; }}
.num {{ font-size: 11pt; font-weight: 500; color: var(--accent); }}
.typ {{ font-size: 6.2pt; letter-spacing: .05em; text-transform: uppercase; color: var(--mute); }}
.dur {{ font-size: 8pt; color: var(--ink); white-space: nowrap; }}
.ec {{ font-style: italic; font-size: 9.5pt; color: var(--mute); line-height: 1.4; margin-bottom: 1.5mm; }}
.voix {{ font-size: 16pt; line-height: 1.68; margin: 0; font-variation-settings: 'opsz' 16; text-wrap: pretty; }}
.voix strong {{ font-weight: 750; text-decoration: underline; text-decoration-color: var(--accent2); text-decoration-thickness: 1.5pt; text-underline-offset: 2.5pt; }}
.ex {{ font-weight: 750; text-decoration: underline; text-decoration-color: var(--accent2); text-decoration-thickness: 1.5pt; text-underline-offset: 2.5pt; }}
.p {{ font-family: 'DM Mono', monospace; color: var(--accent2); font-weight: 500; letter-spacing: -.05em; padding: 0 .5mm; }}
.p1 {{ font-size: .8em; opacity: .75; }}
.p2 {{ font-size: .85em; }}
.p3 {{ font-size: .9em; background: #fde7e2; border-radius: 1mm; padding: 0 1mm; }}
.dir {{ font-style: italic; font-size: .72em; color: var(--accent); }}
.plan.muet {{ padding: 1mm 0; }}
.plan.muet .g {{ padding-top: 0; }}
.plan.muet .num {{ font-size: 8.5pt; color: var(--mute); }}
.plan.muet .d {{ font-size: 9pt; color: var(--mute); }}
.plan.muet .mono {{ font-size: 7.5pt; letter-spacing: .06em; margin-right: 1.5mm; }}
.plan.muet .ec {{ font-size: 9pt; margin: 0; }}
.sil {{ display: grid; grid-template-columns: 22mm 1fr; gap: 4mm; align-items: center; margin: .5mm 0; }}
.sil span {{ grid-column: 2; font: 7pt 'DM Mono', monospace; letter-spacing: .14em; color: var(--cold); display: flex; align-items: center; gap: 3mm; }}
.sil span::after {{ content: ''; flex: 1; border-top: 1px dashed #c9d5e1; }}
.warn {{ border-left: 2.5pt solid var(--accent2); background: #fde7e2; padding: 2mm 3mm; font-size: 9.5pt; margin: 1mm 0 2.5mm; }}
"""
    return (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>SION · scénario et voix off</title>'
            f'<style>{css}</style></head><body>{couverture}{mode}{som}{"".join(corps)}</body></html>')


def numeros(pdf):
    """Page de début de chaque chapitre (« CHAPITRE 12 » en tête de page), après le sommaire."""
    n = int(re.search(r"Pages:\s+(\d+)", subprocess.check_output(["pdfinfo", pdf], text=True)).group(1))
    pages = {}
    for i in range(1, n + 1):
        t = subprocess.check_output(["pdftotext", "-f", str(i), "-l", str(i), "-layout", pdf, "-"], text=True)
        if "Sommaire" in t or "SOMMAIRE" in t:
            continue
        for m in re.findall(r"^\s*CHAPITRE\s+(\d+)\s*$", t, re.M):
            pages.setdefault(f"CHAPITRE {m}", i)
    return pages, n


def main():
    os.makedirs(WORK, exist_ok=True)
    parts = list(chapitres())
    src = os.path.join(WORK, "scenario.html")
    pied = "SION · scénario et voix off"
    pages = {}
    for _ in range(2):  # deux passes : la seconde écrit les numéros de page dans le sommaire
        open(src, "w", encoding="utf-8").write(page_html(parts, pages))
        subprocess.run(["node", os.path.join(ROOT, "tools", "html_pdf.mjs"), src, PDF, pied], check=True)
        pages, n = numeros(PDF)
    print(PDF, f"{n} pages", f"{len(pages)} chapitres repérés")


if __name__ == "__main__":
    main()
