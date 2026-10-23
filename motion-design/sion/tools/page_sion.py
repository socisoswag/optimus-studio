"""Page de téléchargement du film plan par plan (artefact « SION Projection ») : output/page-sion/index.html.

    python3 tools/page_sion.py

Refaite depuis script/*.yaml avec les mêmes noms de fichiers que tools/derush.py : un lien direct par plan vers le
dépôt de livraison (Montage-Moyen-orient, dossier SION), rangé par partie et par chapitre. Les plans cités dans la
dernière section de script/CHANGEMENTS.md sont marqués « nouveau ».

Progression (barres en haut de la page) : data/progression.json, inscrit dans la page à la publication et copié dans la
base de l'artefact (document progression/etat) ; la page suit ce document en direct, sans republier.
"""
import json
import datetime
import html
import os
import re
from urllib.parse import quote

import yaml

import derush
from derush import PARTS, VIDEO, chapter_folder, flat, plan_id
from montage import slug

ROOT = derush.ROOT
OUT = os.path.join(ROOT, "output", "page-sion", "index.html")
REPO = "https://github.com/socisoswag/Montage-Moyen-orient"
RAW = REPO + "/raw/refs/heads/main/SION/"
TREE = REPO + "/tree/main/SION/"
TYPES = {"MD": "Animation", "3D": "3D", "RÉEL": "Vrai plan", "ARCH": "Archive", "PHOTO": "Photo", "IA": "Reconstitution",
         "CARTON": "Titre", "NOIR": "Noir"}
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre",
        "décembre"]


def url(base, *parts):
    return base + "/".join(quote(p) for p in parts)


def mmss(s):
    s = int(round(s))
    return f"{s // 60} min {s % 60:02d}" if s >= 60 else f"{s} s"


def court(t, n=150):
    t = re.sub(r"\*\*|/+", "", t)
    t = " ".join(t.split())
    return t if len(t) <= n else t[:n].rsplit(" ", 1)[0] + "…"


def nouveaux():
    """Plans cités dans la dernière section de CHANGEMENTS.md (« 14.02 », « 05.06 »…), et sa date."""
    txt = open(os.path.join(ROOT, "script", "CHANGEMENTS.md"), encoding="utf-8").read()
    secs = re.split(r"^## ", txt, flags=re.M)
    last = secs[-1] if len(secs) > 1 else ""
    return set(re.findall(r"\b(\d\d\.\d\d)\b", last)), last.split("\n", 1)[0].strip()


def main():
    neuf, quand = nouveaux()
    body, n_plans, n_ok, total = [], 0, 0, 0.0
    for yml, folder, _ in PARTS:
        data = yaml.safe_load(open(os.path.join(ROOT, "script", yml), encoding="utf-8"))
        chs = []
        for ch in data["chapitres"]:
            cf = chapter_folder(ch["num"], ch["titre"])
            rows, dur, new = [], 0.0, False
            for k, p in enumerate(ch["plans"], start=1):
                pid = plan_id(ch["num"], k)
                fic = flat(p.get("fichier"))
                a = float(p.get("entree", 0) or 0)
                d = float(p["sortie"]) - a if "sortie" in p else float(p.get("duree", 0) or 0)
                dur += d
                typ = p["type"]
                name = None
                if typ == "NOIR":
                    name = f"{pid}-noir.mp4"
                elif typ in VIDEO and fic.startswith("output/") and fic.endswith(".mp4") and not p.get("a_obtenir"):
                    base = os.path.splitext(os.path.basename(fic))[0]
                    name = f"{pid}-{typ.replace('É', 'E')}-{slug(base, 40).lower()}.mp4"
                n_plans += 1
                n_ok += name is not None
                isnew = pid in neuf
                new |= isnew
                ecran = court(flat(p.get("ecran")) or os.path.splitext(os.path.basename(fic))[0].replace("-", " "), 110)
                voix = court(flat(p.get("voix")))
                lien = (f'<a class="dl" href="{url(RAW, folder, cf, name)}" target="_blank" rel="noopener">Télécharger</a>'
                        if name else '<span class="nv">à venir</span>')
                rows.append(
                    f'<li{" class=new" if isnew else ""}><span class="id">{pid}</span><span class="ty">{TYPES.get(typ, typ)}</span>'
                    f'<span class="du">{d:.1f} s</span>{lien}' + ('<span class="badge">nouveau</span>' if isnew else "")
                    + f'<span class="tx">{html.escape(ecran)}</span>'
                    + (f'<span class="vo">« {html.escape(voix)} »</span>' if voix and voix.lower() != "silence" else "") + "</li>")
            for r, x in enumerate(ch.get("reserve") or [], start=1):
                typ = (x.get("type") or "IA").replace("É", "E")
                name = f"{plan_id(ch['num'], 0)[:-3]}.R{r}-{typ}-{slug(os.path.splitext(os.path.basename(x['fichier']))[0], 40).lower()}.mp4"
                rows.append(f'<li class="res"><span class="id">{name.split("-")[0]}</span><span class="ty">En réserve</span><span class="du"></span>'
                            f'<a class="dl" href="{url(RAW, folder, cf, name)}" target="_blank" rel="noopener">Télécharger</a>'
                            f'<span class="tx">{html.escape(court(flat(x.get("note")), 110))}</span></li>')
            cartons = list(dict.fromkeys(c for p in ch["plans"] for c in derush.cartons_of(p)))
            for c in cartons:
                b = os.path.basename(c)
                rows.append(f'<li class="res"><span class="id">carton</span><span class="ty">Transparent</span><span class="du"></span>'
                            f'<a class="dl" href="{url(RAW, folder, cf, "cartons", b)}" target="_blank" rel="noopener">Télécharger</a>'
                            f'<span class="tx">{html.escape(os.path.splitext(b)[0].split("-", 1)[-1].replace("-", " "))} (fond transparent, .mov)</span></li>')
            total += dur
            titre = ch["titre"].split(" · ", 1)[-1]
            num = ch["titre"].split(" · ", 1)[0] if " · " in ch["titre"] else ""
            chs.append(f'<details class="ch"{" open" if new else ""}><summary><span class="num">{html.escape(num)}</span>'
                       f'<span class="tt">{html.escape(titre)}</span><span class="meta">{len(ch["plans"])} plans · {mmss(dur)}'
                       + (' · <b>nouveau</b>' if new else "") + f'</span></summary>'
                       f'<a class="tree" href="{url(TREE, folder, cf)}" target="_blank" rel="noopener">Dossier sur GitHub</a>'
                       f'<ul>{"".join(rows)}</ul></details>')
        eb, _, t = data["titre"].partition(" · ")
        body.append(f'<section class="part"><h2>{"<span>" + html.escape(eb) + "</span>" if t else ""}{html.escape(t or eb)}</h2>'
                    f'<a class="tree" href="{url(TREE, folder)}" target="_blank" rel="noopener">Ouvrir le dossier de la partie</a>'
                    f'{"".join(chs)}</section>')
    d = datetime.date.today()
    etat = json.load(open(os.path.join(ROOT, "data", "progression.json"), encoding="utf-8"))
    page = HEAD + f"""
<div class="wrap">
  <header>
    <div class="kicker">Documentaire · le film plan par plan</div>
    <h1>Sion</h1>
    <p class="sub">Chaque plan du film en 1080p, coupé à sa durée, rangé dans l’ordre : partie, chapitre, plan. Posés bout à bout, les plans d’un chapitre font le chapitre.</p>
    <div class="facts"><span><b>{n_ok}</b> plans sur {n_plans}</span><span><b>{mmss(total)}</b> de film</span><span>1920 × 1080 · 25 i/s</span><span>Bruitages seuls, sans voix ni musique</span><span>Mis à jour le {d.day} {MOIS[d.month - 1]} {d.year}</span></div>
  </header>
  <section class="prog" aria-label="Progression">
    <div class="kicker">Où en est le film</div>
    <div class="tot"><div class="tt2">Film entier</div><div class="pc" id="pc-tot"></div><div class="bar big"><i id="bar-tot"></i></div></div>
    <ul class="taches" id="taches"></ul>
    <p class="maj" id="maj"></p>
  </section>
  <div class="how">
    <div class="kicker">Télécharger</div>
    <p><b>Un plan :</b> chaque lien vert télécharge le fichier depuis GitHub. Le nom commence par son numéro : <b>14.02</b> = chapitre 14, plan 2.</p>
    <p><b>Tout d’un coup :</b> sur <a href="{REPO}" target="_blank" rel="noopener">la page du dépôt</a>, bouton vert <b>Code</b> puis <b>Download ZIP</b> (plusieurs gigaoctets). Avec GitHub Desktop, un simple « Fetch » récupère ensuite seulement ce qui a changé.</p>
    <p><b>Même nom, nouvelle version :</b> Premiere reprend le fichier tout seul. Nouveau nom : remplace le plan dans ta timeline, il a la même durée. Le détail de chaque envoi : <a href="{url(TREE.replace('/tree/', '/blob/'), 'Script', 'CHANGEMENTS.md')}" target="_blank" rel="noopener">CHANGEMENTS.md</a>.</p>
    <p><b>Pour la voix off :</b> <a href="{url(RAW, 'Script', 'SION-scenario-voix-off.pdf')}" target="_blank" rel="noopener">le scénario complet en PDF</a>, avec les pauses, les appuis et la prononciation.</p>
  </div>
  <div class="how neuf"><div class="kicker">Dernier envoi · {html.escape(quand)}</div><p>Les plans nouveaux ou refaits sont marqués <span class="badge">nouveau</span> et leurs chapitres sont ouverts.</p></div>
  {"".join(body)}
</div>
<script id="etat" type="application/json">{json.dumps(etat, ensure_ascii=False).replace("</", "<\\/")}</script>
<script>{SCRIPT}</script>"""
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, "w", encoding="utf-8").write(page)
    print(OUT, f"{n_ok}/{n_plans} plans", f"{len(page) // 1024} Ko")


SCRIPT = """
// Barres de progression : l'état inscrit dans la page, puis le document progression/etat en direct (s'il existe).
const QUI = { fait: 'fait', moi: 'Claude', toi: 'toi' };
function render(e) {
  const t = Array.isArray(e && e.taches) ? e.taches : [];
  const w = t.reduce((a, x) => a + (+x.poids || 0), 0) || 1;
  const tot = Math.round(t.reduce((a, x) => a + Math.max(0, Math.min(100, +x.pct || 0)) * (+x.poids || 0), 0) / w);
  document.getElementById('pc-tot').textContent = tot + ' %';
  document.getElementById('bar-tot').style.width = tot + '%';
  const ul = document.getElementById('taches');
  ul.replaceChildren(...t.map((x) => {
    const pct = Math.max(0, Math.min(100, +x.pct || 0));
    const li = document.createElement('li');
    li.className = pct >= 100 ? 'ok' : pct > 0 ? 'cours' : 'afaire';
    const nom = document.createElement('span'); nom.className = 'nm'; nom.textContent = x.nom || '';
    const qui = document.createElement('span'); qui.className = 'qui ' + (x.qui || ''); qui.textContent = pct >= 100 ? 'fait' : (QUI[x.qui] || x.qui || '');
    const pc = document.createElement('span'); pc.className = 'pc'; pc.textContent = pct + ' %';
    const bar = document.createElement('div'); bar.className = 'bar'; const i = document.createElement('i'); i.style.width = pct + '%'; bar.append(i);
    const det = document.createElement('span'); det.className = 'det'; det.textContent = x.detail || '';
    li.append(nom, qui, pc, bar, det);
    return li;
  }));
  document.getElementById('maj').textContent = e && e.maj ? 'Mis à jour : ' + e.maj : '';
}
try { render(JSON.parse(document.getElementById('etat').textContent)); } catch (err) {}
(async () => {
  try {
    const db = window.claude && (await window.claude.use('db'));
    if (!db) return;
    db.doc('progression/etat').onSnapshot((s) => { if (s.exists) render(s.data()); }, () => {});
  } catch (err) {}
})();
"""

HEAD = """<title>SION Projection</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&family=DM+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;1,6..72,400&display=swap">
<style>
  /* Même DA que le film : nuit de cendre, pierre de Jérusalem, vermillon, olive. Un seul thème, voulu. */
  :root {
    --ink: #0d0c0a; --panel: #15130f; --stone: #e9dcc0; --ash: #a39886;
    --ember: rgb(232, 52, 30); --life: rgb(170, 182, 110); --line: rgba(233, 220, 192, 0.14);
    --display: 'Archivo', 'Arial Narrow', sans-serif; --serif: 'Newsreader', Georgia, serif; --mono: 'DM Mono', ui-monospace, monospace;
    color-scheme: dark;
  }
  body { background: var(--ink); color: var(--stone); font-family: var(--serif); }
  .wrap { max-width: 1040px; margin: 0 auto; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 40px 72px; display: flex; flex-direction: column; gap: 40px; }
  header { display: flex; flex-direction: column; gap: 12px; }
  .kicker { font-family: var(--mono); font-size: 12px; letter-spacing: .24em; text-transform: uppercase; color: var(--ember); }
  h1 { margin: 0; font-family: var(--display); font-variation-settings: 'wdth' 62, 'wght' 860; font-size: clamp(64px, 14vw, 132px); line-height: .86; letter-spacing: .06em; text-transform: uppercase; }
  .sub { font-style: italic; font-size: 21px; line-height: 1.4; color: var(--ash); margin: 0; max-width: 62ch; }
  .facts { display: flex; flex-wrap: wrap; gap: 8px 24px; font-family: var(--mono); font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--ash); }
  .facts b { color: var(--life); font-weight: 500; }
  .how { background: var(--panel); border: 1px solid var(--line); border-left: 3px solid var(--ember); padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; }
  .how p { margin: 0; font-size: 17px; line-height: 1.5; color: var(--ash); max-width: 72ch; }
  .how p b { color: var(--stone); font-weight: 400; }
  .neuf { border-left-color: var(--life); }
  a { color: var(--stone); text-decoration-color: var(--ember); text-underline-offset: 4px; }
  a:focus-visible, summary:focus-visible { outline: 2px solid var(--ember); outline-offset: 3px; }
  .part { display: flex; flex-direction: column; gap: 12px; border-top: 1px solid var(--line); padding-top: 22px; }
  h2 { margin: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 14px; font-family: var(--display); font-variation-settings: 'wdth' 68, 'wght' 780; font-size: clamp(28px, 6vw, 40px); line-height: 1; text-transform: uppercase; text-wrap: balance; }
  h2 span { font-family: var(--mono); font-size: 13px; font-weight: 400; letter-spacing: .22em; color: var(--ember); }
  .tree { font-family: var(--mono); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--ash); align-self: flex-start; }
  details.ch { border-left: 1px solid var(--line); padding-left: 14px; min-width: 0; }
  details.ch > summary { cursor: pointer; display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; padding: 8px 0; list-style: none; }
  details.ch > summary::-webkit-details-marker { display: none; }
  details.ch > summary::before { content: '+'; font-family: var(--mono); color: var(--ember); width: 1ch; }
  details.ch[open] > summary::before { content: '−'; }
  .num { font-family: var(--mono); font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--ember); }
  .tt { font-size: 20px; line-height: 1.3; flex: 1 1 280px; min-width: 0; }
  .meta { font-family: var(--mono); font-size: 12px; color: var(--ash); letter-spacing: .06em; }
  .meta b { color: var(--life); font-weight: 500; }
  ul { list-style: none; margin: 6px 0 14px; padding: 0; display: flex; flex-direction: column; }
  li { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 12px; padding: 8px 0; border-bottom: 1px dashed var(--line); min-width: 0; }
  li.new { background: linear-gradient(90deg, rgba(170, 182, 110, 0.10), transparent 70%); }
  li.res .id { color: var(--ash); }
  .id { font-family: var(--mono); font-size: 14px; color: var(--ember); flex: none; min-width: 6ch; }
  .ty { font-family: var(--mono); font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--ash); flex: none; min-width: 13ch; }
  .du { font-family: var(--mono); font-size: 12px; color: var(--ash); flex: none; min-width: 6ch; }
  .dl { font-family: var(--mono); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--life); text-decoration-color: var(--life); flex: none; }
  .nv { font-family: var(--mono); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--ash); flex: none; }
  .badge { font-family: var(--mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--ink); background: var(--life); padding: 1px 6px; flex: none; }
  .tx { flex: 1 1 100%; font-size: 15px; line-height: 1.45; color: var(--stone); min-width: 0; }
  .vo { flex: 1 1 100%; font-size: 14px; line-height: 1.45; color: var(--ash); font-style: italic; min-width: 0; }
  .prog { background: var(--panel); border: 1px solid var(--line); padding: 20px; display: flex; flex-direction: column; gap: 14px; }
  .tot { display: grid; grid-template-columns: 1fr auto; gap: 8px 16px; align-items: baseline; }
  .tt2 { font-family: var(--display); font-variation-settings: 'wdth' 68, 'wght' 780; font-size: 26px; text-transform: uppercase; }
  .tot .pc { font-family: var(--display); font-variation-settings: 'wdth' 62, 'wght' 860; font-size: 44px; color: var(--life); line-height: 1; }
  .bar { grid-column: 1 / -1; height: 6px; background: rgba(233, 220, 192, 0.10); position: relative; overflow: hidden; }
  .bar.big { height: 14px; }
  .bar i { position: absolute; inset: 0 auto 0 0; background: var(--life); transition: width .8s ease; }
  .taches { margin: 0; gap: 0; }
  .taches li { display: grid; grid-template-columns: 1fr auto auto; gap: 4px 12px; align-items: baseline; padding: 10px 0; }
  .taches .nm { font-size: 17px; min-width: 0; }
  .taches .pc { font-family: var(--mono); font-size: 13px; color: var(--stone); }
  .taches .det { grid-column: 1 / -1; font-size: 14px; color: var(--ash); font-style: italic; }
  .taches li.cours .bar i { background: var(--ember); }
  .taches li.afaire .nm { color: var(--ash); }
  .qui { font-family: var(--mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; padding: 1px 6px; border: 1px solid var(--line); color: var(--ash); }
  .qui.toi { color: var(--ink); background: var(--stone); border-color: var(--stone); }
  .maj { margin: 0; font-family: var(--mono); font-size: 12px; letter-spacing: .08em; color: var(--ash); }
  @media (max-width: 520px) { .ty { min-width: 0; } }
</style>"""

if __name__ == "__main__":
    main()
