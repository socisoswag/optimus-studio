"""Projet Premiere Pro prêt à monter : les plans du dépôt de montage dans l'ordre du film, leurs cartons, une piste
vide pour la voix et, sur chaque plan, un marqueur avec la voix à dire.

    python3 tools/premiere_xml.py                 → output/premiere/SION-premiere.xml (fichiers lus sur le dépôt)
    python3 tools/premiere_xml.py --envoyer       → aussi dans SION/ du dépôt de montage, envoyé
    RACINE="D:/Montage-Moyen-orient" python3 tools/premiere_xml.py --envoyer
                                                  (chemin du dossier sur l'ordinateur de l'auteur, sans « Lier le média »)

Format XML de Final Cut Pro 7 (xmeml), que Premiere importe (Fichier > Importer). Il y trouve :
  - un chutier par partie, un sous-chutier par chapitre (ses plans, ses cartons, ses plans en réserve) ;
  - la séquence « SION », 1080p 25 i/s :
      V1      les plans bout à bout, à la durée prévue par le script ;
      V2      les cartons transparents, posés au début du plan qui les cite ;
      A1      vide, pour la voix ;
      A2, A3  le son des plans (bruitages et ambiances), gauche et droite ;
  - des marqueurs : la partie, le chapitre, puis chaque plan (son numéro ; en commentaire, la voix à dire).
Un plan pas encore en vidéo laisse un trou de sa durée, avec un marqueur « à venir ».
Les chemins partent de RACINE : si le dossier est ailleurs, Premiere propose « Lier le média », et montrer un seul
fichier suffit (il retrouve les autres par le même chemin relatif).
"""
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from urllib.parse import quote

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import derush as D  # noqa: E402

FPS = 25
REPO = os.environ.get("MONTAGE_REPO", "https://github.com/socisoswag/Montage-Moyen-orient")
RACINE = os.environ.get("RACINE", "Montage-Moyen-orient").rstrip("/\\").replace("\\", "/")
NOM = "SION-premiere.xml"
MSG = ("SION : projet Premiere à jour (plans dans l'ordre, cartons, marqueurs de voix)\n\n"
       "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n"
       "Claude-Session: https://claude.ai/code/session_01Up6uBitdRxnv9kmecRQqy1\n")
CARTON = 138  # durée d'un carton transparent (5,52 s) quand son fichier n'est pas sur cette machine


def e(s):
    return html.escape(str(s), quote=True)


def rate():
    return f"<rate><timebase>{FPS}</timebase><ntsc>FALSE</ntsc></rate>"


def images(s):
    return int(round(float(s) * FPS))


def git(*a, **k):
    return subprocess.run(["git", *a], check=True, **k)


def depot(w):
    """Clone sans les vidéos (arbres seuls) : la liste exacte des fichiers livrés, et les manifestes des parties."""
    git("clone", "-q", "--filter=blob:none", "--no-checkout", "--depth", "1", REPO, w)
    noms = git("-C", w, "ls-tree", "-r", "--name-only", "HEAD", "--", "SION", capture_output=True, text=True).stdout.split("\n")
    manif = {}
    for _, folder, _ in D.PARTS:
        r = subprocess.run(["git", "-C", w, "show", f"HEAD:SION/{folder}/.derush.json"], capture_output=True, text=True)
        if r.returncode == 0:
            manif[folder] = json.loads(r.stdout)
    return set(n for n in noms if n), manif


def duree_carton(base):
    loc = os.path.join(ROOT, "output", "cartons", base)
    if os.path.exists(loc):
        return images(D.duration(loc))
    return CARTON


FAMILLES = ("ambiances", "souffles", "impacts", "guerre", "bruitages", "musique")
NOMS_FAM = {"ambiances": "Ambiances", "souffles": "Souffles et montées", "impacts": "Impacts", "guerre": "Guerre",
            "bruitages": "Bruitages", "musique": "Musique"}
_PISTES = {}


def pistes_de(nom):
    """Index des pistes séparées d'une pièce (tools/pistes.py) : {famille: [clips]}, ou {} si elles n'existent pas."""
    if nom not in _PISTES:
        f = os.path.join(ROOT, "output", "pistes", nom, nom + ".json")
        _PISTES[nom] = ({x["famille"]: x["clips"] for x in json.load(open(f, encoding="utf-8"))["pistes"] if x["famille"] != "mixage"}
                        if os.path.exists(f) else {})
    return _PISTES[nom]


def piece_de(p):
    """(pièce, secondes depuis son début) du plan de motion design, pour y retrouver ses sons ; None pour les autres."""
    fic, a = str(p.get("fichier", "")), float(p.get("entree", 0) or 0)
    m = re.match(r"output/chapitres/chapitre-(\d+)\.mp4$", fic)
    if m:
        if "carte" not in _PISTES:
            _PISTES["carte"] = float(subprocess.check_output(["node", "-e", "require('./core.js'); require('./timelines/chapitres.js');"
                                                               " console.log(globalThis.TL.cardDur)"], cwd=ROOT, text=True))
        return ("chapitres", (int(m.group(1)) - 1) * _PISTES["carte"] + a)
    m = re.match(r"output/([a-z0-9-]+)\.mp4$", fic)
    if m and p.get("type") in ("MD", "3D", "CARTON") and pistes_de(m.group(1)):
        return (m.group(1), a)
    return None


def film(fichiers, manif):
    """Le film, partie par partie : [(titre de partie, [(titre de chapitre, [plan…], [réserve…])…])…]."""
    out = []
    # plans resserrés au montage (data/coupes-montage.json) : le fichier livré reste entier, la timeline n'en garde que le
    # début ; on rallonge le plan dans Premiere pour retrouver la fin
    cp = os.path.join(ROOT, "data", "coupes-montage.json")
    cm = json.load(open(cp, encoding="utf-8")) if os.path.exists(cp) else {}
    coupes, oreille = cm.get("plans", {}), cm.get("a_l_oreille", {})
    # plans dont les sons séparés ne retombent pas exactement sur le son livré (tools/verif_premiere.py) : son en bloc
    nc = os.path.join(ROOT, "data", "sons-non-conformes.json")
    bloc = json.load(open(nc, encoding="utf-8")) if os.path.exists(nc) else {}
    for yml, folder, _ in D.PARTS:
        data = yaml.safe_load(open(os.path.join(ROOT, "script", yml), encoding="utf-8"))
        mf = manif.get(folder, {})
        chapitres = []
        for ch in data["chapitres"]:
            rel = f"SION/{folder}/{D.chapter_folder(ch['num'], ch['titre'])}"
            ici = sorted(os.path.basename(f) for f in fichiers if os.path.dirname(f) == rel)
            plans = []
            for k, p in enumerate(ch["plans"], start=1):
                pid = D.plan_id(ch["num"], k)
                fic = next((f for f in ici if f.startswith(f"{pid}-") and f.endswith(".mp4")), None)
                d = float(p["sortie"]) - float(p.get("entree", 0) or 0) if "sortie" in p else float(p.get("duree", 0) or 0)
                if fic and fic in mf and len(mf[fic]) >= 4:
                    d = float(mf[fic][3])  # durée exacte du fichier livré
                cartons = []
                for c in D.cartons_of(p):
                    b = os.path.basename(c)
                    if f"{rel}/cartons/{b}" in fichiers:
                        cartons.append({"rel": f"{rel}/cartons/{b}", "n": duree_carton(b)})
                plans.append({"pid": pid, "rel": f"{rel}/{fic}" if fic else None, "n": images(d), "type": p["type"],
                              "ng": images(min(d, float(coupes[pid]))) if pid in coupes else images(d),
                              "oreille": oreille.get(pid), "son": D.flat(p.get("son")) if p.get("son_original") else "",
                              "piece": None if pid in bloc else piece_de(p), "bloc": pid in bloc,
                              "son_debut": float(p["son_original"].get("debut", 0)) if p.get("son_original") else 0,
                              "voix": D.flat(p.get("voix")).replace("**", ""), "ecran": D.flat(p.get("ecran")), "cartons": cartons})
            reserves = []
            for f in ici:
                if re.match(r".*\.R\d+-.*\.mp4$", f):
                    st = mf.get(f)
                    if st and len(st) >= 4:
                        reserves.append({"rel": f"{rel}/{f}", "n": images(st[3])})
            chapitres.append((ch["titre"], plans, reserves))
        out.append((data["titre"], chapitres))
    return out


class Fichiers:
    """Chaque fichier du dépôt a un clip maître (dans son chutier) ; la séquence y renvoie par son identifiant."""

    def __init__(self):
        self.ids = {}

    def maitre(self, rel, n, son, alpha=False):
        if rel in self.ids:
            return ""
        i = len(self.ids) + 1
        self.ids[rel] = i
        nom = e(os.path.basename(rel))
        url = "file://localhost/" + quote(f"{RACINE}/{rel}", safe="/")
        sc = (f"<samplecharacteristics>{rate()}<width>1920</width><height>1080</height><anamorphic>FALSE</anamorphic>"
              "<pixelaspectratio>square</pixelaspectratio><fielddominance>none</fielddominance></samplecharacteristics>")
        am = ("<audio><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics>"
              "<channelcount>2</channelcount></audio>") if son else ""
        fichier = (f'<file id="file-{i}"><name>{nom}</name><pathurl>{url}</pathurl>{rate()}<duration>{n}</duration>'
                   f"<timecode>{rate()}<string>00:00:00:00</string><frame>0</frame><displayformat>NDF</displayformat></timecode>"
                   f"<media><video>{sc}</video>{am}</media></file>")
        alpha = "straight" if alpha else "none"
        v = (f'<clipitem id="masterclip-{i}-v"><masterclipid>masterclip-{i}</masterclipid><name>{nom}</name>{rate()}'
             f"<alphatype>{alpha}</alphatype>{fichier}</clipitem>")
        a = "".join(f'<track><clipitem id="masterclip-{i}-a{k}"><masterclipid>masterclip-{i}</masterclipid><name>{nom}</name>'
                    f'{rate()}<file id="file-{i}"/><sourcetrack><mediatype>audio</mediatype><trackindex>{k}</trackindex>'
                    "</sourcetrack></clipitem></track>" for k in (1, 2)) if son else ""
        return (f'<clip id="masterclip-{i}"><masterclipid>masterclip-{i}</masterclipid><ismasterclip>TRUE</ismasterclip>'
                f"<duration>{n}</duration>{rate()}<name>{nom}</name><media><video><track>{v}</track></video>"
                + (f"<audio>{a}</audio>" if a else "") + "</media></clip>")

    def maitre_son(self, rel, n):
        """Clip maître d'un son seul (une piste séparée), stéréo."""
        if rel in self.ids:
            return ""
        i = len(self.ids) + 1
        self.ids[rel] = i
        nom = e(os.path.basename(rel))
        url = "file://localhost/" + quote(f"{RACINE}/{rel}", safe="/")
        fichier = (f'<file id="file-{i}"><name>{nom}</name><pathurl>{url}</pathurl>{rate()}<duration>{n}</duration>'
                   "<media><audio><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics>"
                   "<channelcount>2</channelcount></audio></media></file>")
        a = "".join(f'<track><clipitem id="masterclip-{i}-a{k}"><masterclipid>masterclip-{i}</masterclipid><name>{nom}</name>'
                    f'{rate()}{fichier if k == 1 else f"<file id={chr(34)}file-{i}{chr(34)}/>"}<sourcetrack><mediatype>audio</mediatype>'
                    f"<trackindex>{k}</trackindex></sourcetrack></clipitem></track>" for k in (1, 2))
        return (f'<clip id="masterclip-{i}"><masterclipid>masterclip-{i}</masterclipid><ismasterclip>TRUE</ismasterclip>'
                f"<duration>{n}</duration>{rate()}<name>{nom}</name><media><audio>{a}</audio></media></clip>")


def son_rel(piece, fic):
    """Chemin d'une piste séparée dans le dépôt de montage (AAC, tools/livrer_sons.py)."""
    return f"SION/Sons/{piece}/{fic[:-4]}.m4a"


def construit(f):
    F = Fichiers()
    chutiers, v1, v2, a2, a3, marques = [], [], [], [], [], []
    v3 = []  # sous-titres d'une parole gardée : toute la durée du plan, depuis son début
    fam = {x: ([], []) for x in FAMILLES}  # pistes séparées : gauche, droite
    utilises = set()  # (pièce, fichier) des sons posés, à livrer
    t = 0
    nplans = manquants = ncartons = 0
    for p_titre, chapitres in f:
        marques.append((t, p_titre, ""))
        sous = []
        for c_titre, plans, reserves in chapitres:
            marques.append((t, c_titre, ""))
            dedans, sons = [], []
            for p in plans:
                n, ng = p["n"], p["ng"]  # durée du fichier, durée gardée dans la timeline
                if p["rel"]:
                    dedans.append(F.maitre(p["rel"], n, son=True))
                    i = F.ids[p["rel"]]
                    nom = e(os.path.basename(p["rel"]))
                    k = len(v1) + 1
                    lien = (f"<link><linkclipref>seq-v-{k}</linkclipref><mediatype>video</mediatype><trackindex>1</trackindex>"
                            f"<clipindex>{k}</clipindex></link>"
                            + "".join(f"<link><linkclipref>seq-a{x}-{k}</linkclipref><mediatype>audio</mediatype>"
                                      f"<trackindex>{x}</trackindex><clipindex>{k}</clipindex><groupindex>1</groupindex></link>"
                                      for x in (2, 3)))
                    tete = (f"<masterclipid>masterclip-{i}</masterclipid><name>{nom}</name><enabled>TRUE</enabled>"
                            f"<duration>{n}</duration>{rate()}<start>{t}</start><end>{t + ng}</end><in>0</in><out>{ng}</out>")
                    v1.append(f'<clipitem id="seq-v-{k}">{tete}<alphatype>none</alphatype><file id="file-{i}"/>{lien}</clipitem>')
                    # le son mixé d'un plan de motion design reste là, coupé : ses sons séparés le remplacent, plus bas
                    ta = tete.replace("<enabled>TRUE</enabled>", "<enabled>FALSE</enabled>") if p["piece"] else tete
                    for x, lst in ((2, a2), (3, a3)):
                        lst.append(f'<clipitem id="seq-a{x}-{k}">{ta}<file id="file-{i}"/><sourcetrack><mediatype>audio</mediatype>'
                                   f"<trackindex>{x - 1}</trackindex></sourcetrack>{lien}</clipitem>")
                    if p["piece"]:
                        nomp, dec = p["piece"]
                        o = images(dec)
                        for fa, clips in pistes_de(nomp).items():
                            for c in clips:
                                a0, a1 = max(c["debut"], o), min(c["fin"], o + ng)
                                if a1 - a0 < 2:  # moins de 2 images sous ce plan : rien à poser
                                    continue
                                rel = son_rel(nomp, c["fichier"])
                                utilises.add((nomp, c["fichier"]))
                                sons.append(F.maitre_son(rel, c["duree"]))
                                j = F.ids[rel]
                                debut = t + a0 - o
                                for g, lst in enumerate(fam[fa], 1):
                                    lst.append(f'<clipitem id="seq-{fa}{g}-{len(lst) + 1}"><masterclipid>masterclip-{j}</masterclipid>'
                                               f"<name>{e(os.path.basename(rel))}</name><enabled>TRUE</enabled><duration>{c['duree']}</duration>"
                                               f"{rate()}<start>{debut}</start><end>{debut + a1 - a0}</end><in>{a0 - c['debut']}</in>"
                                               f"<out>{a1 - c['debut']}</out><file id=\"file-{j}\"/><sourcetrack><mediatype>audio</mediatype>"
                                               f"<trackindex>{g}</trackindex></sourcetrack></clipitem>")
                    nplans += 1
                    debut = t
                    for c in p["cartons"]:
                        dedans.append(F.maitre(c["rel"], c["n"], son=False, alpha=True))
                        j = F.ids[c["rel"]]
                        if os.path.basename(c["rel"]).startswith("st-"):
                            m = min(c["n"], ng)
                            v3.append(f'<clipitem id="seq-st-{len(v3) + 1}"><masterclipid>masterclip-{j}</masterclipid>'
                                      f"<name>{e(os.path.basename(c['rel']))}</name><enabled>TRUE</enabled><duration>{c['n']}</duration>"
                                      f"{rate()}<start>{t}</start><end>{t + m}</end><in>0</in><out>{m}</out>"
                                      f'<alphatype>straight</alphatype><file id="file-{j}"/></clipitem>')
                            continue
                        m = min(c["n"], ng - (debut - t))
                        if m <= 0:
                            break
                        v2.append(f'<clipitem id="seq-c-{len(v2) + 1}"><masterclipid>masterclip-{j}</masterclipid>'
                                  f"<name>{e(os.path.basename(c['rel']))}</name><enabled>TRUE</enabled><duration>{c['n']}</duration>"
                                  f"{rate()}<start>{debut}</start><end>{debut + m}</end><in>0</in><out>{m}</out>"
                                  f'<alphatype>straight</alphatype><file id="file-{j}"/></clipitem>')
                        ncartons += 1
                        debut += m
                    marques.append((t, p["pid"], p["voix"] or "(silence)"))
                    # notes de montage, à l'image près
                    if ng < n:
                        marques.append((t + ng, f"COUPE · {p['pid']}", f"Coupé ici : {(n - ng) / FPS:.1f} s de temps mort après la voix. "
                                        "Le fichier continue : tire la fin du plan pour rallonger."))
                    if p["oreille"]:
                        g, m = p["oreille"]
                        marques.append((t + images(g), f"À COUPER À L'OREILLE · {p['pid']}",
                                        f"Ta voix finit vers ici ; il reste environ {m:.1f} s avant le plan suivant. La carte bouge en "
                                        "continu : si tu coupes, coupe sur un mouvement, ou laisse."))
                    if p["bloc"]:
                        marques.append((t, f"SON EN BLOC · {p['pid']}", "Les bruitages de ce plan restent mixés ensemble, sur A2-A3 : "
                                        "séparés, ils ne retombaient pas exactement sur le son livré."))
                    if p["son"]:
                        marques.append((t + images(p["son_debut"]), f"SON D'ORIGINE · {p['pid']}",
                                        p["son"] + " Ne pas couvrir par la voix off."))
                else:
                    manquants += 1
                    marques.append((t, f"{p['pid']} · à venir ({p['type']})", p["ecran"] or p["voix"]))
                t += ng
            for r in reserves:
                dedans.append(F.maitre(r["rel"], r["n"], son=True))
            if sons:
                dedans.append(f"<bin><name>Sons</name><children>{''.join(sons)}</children></bin>")
            sous.append(f"<bin><name>{e(c_titre)}</name><children>{''.join(dedans)}</children></bin>")
        chutiers.append(f"<bin><name>{e(p_titre)}</name><children>{''.join(sous)}</children></bin>")
    sc = (f"<samplecharacteristics>{rate()}<width>1920</width><height>1080</height><anamorphic>FALSE</anamorphic>"
          "<pixelaspectratio>square</pixelaspectratio><fielddominance>none</fielddominance></samplecharacteristics>")
    piste = lambda clips, extra="": f"<track>{''.join(clips)}<enabled>TRUE</enabled><locked>FALSE</locked>{extra}</track>"
    marques.sort(key=lambda x: x[0])  # tri stable : à la même image, partie, chapitre puis plan
    mk = "".join(f"<marker><comment>{e(c)}</comment><name>{e(n)}</name><in>{s}</in><out>-1</out></marker>" for s, n, c in marques)
    seq = (f'<sequence id="sequence-1"><name>SION</name><duration>{t}</duration>{rate()}'
           f"<timecode>{rate()}<string>00:00:00:00</string><frame>0</frame><displayformat>NDF</displayformat></timecode>"
           f"<media><video><format>{sc}</format>{piste(v1)}{piste(v2)}{piste(v3) if v3 else ''}</video>"
           "<audio><numOutputChannels>2</numOutputChannels><format><samplecharacteristics><depth>16</depth>"
           "<samplerate>48000</samplerate></samplecharacteristics></format>"
           f"{piste([])}{piste(a2, '<outputchannelindex>1</outputchannelindex>')}{piste(a3, '<outputchannelindex>2</outputchannelindex>')}"
           + "".join(piste(fam[x][g], f"<outputchannelindex>{g + 1}</outputchannelindex>") for x in FAMILLES if fam[x][0] for g in (0, 1))
           + f"</audio></media>{mk}</sequence>")
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n<xmeml version="4"><project><name>SION</name><children>'
           + "".join(chutiers) + seq + "</children></project></xmeml>\n")
    return xml, {"plans": nplans, "manquants": manquants, "cartons": ncartons, "fichiers": len(F.ids),
                 "marqueurs": len(marques), "minutes": t / FPS / 60,
                 "sons": sorted(utilises), "clips_sons": sum(len(fam[x][0]) for x in FAMILLES),
                 "familles": [x for x in FAMILLES if fam[x][0]]}


GUIDE = """# Ouvrir le film dans Premiere Pro

1. Télécharge (ou mets à jour) tout le dossier `Montage-Moyen-orient` sur ton ordinateur.
2. Dans Premiere : **Fichier > Importer**, choisis `SION/SION-premiere.xml`.
3. Premiere crée un chutier `SION-premiere` avec un chutier par partie et un sous-chutier par chapitre (ses plans,
   ses cartons et ses plans en réserve), et la séquence **SION** :
   - **V1** : les {plans} plans dans l'ordre du film, à la durée prévue par le script (quelques plans resserrés, voir 6) ;
   - **V2** : les {cartons} cartons (lieu et date), posés au début de leur plan ;
   - **V3** : les sous-titres des paroles gardées (Trump en 25.40), calés sur leur plan ;
   - **A1** : vide, pour ta voix ;
   - **A2 et A3** : le son des plans, gauche et droite : l'ambiance des vraies images ; pour les plans de motion design,
     leur son mixé est là mais coupé (désactivé), pour comparer ;
   - **A4 et au-delà** : chaque bruitage du motion design sur la piste de sa famille, calé sous son plan, par paires
     gauche-droite, dans cet ordre : {familles}. Les fichiers sont dans `SION/Sons/<pièce>/`.
4. Si les plans s'affichent « hors ligne » : clic droit sur un plan > **Lier le média**, montre le même fichier dans ton
   dossier `Montage-Moyen-orient`, coche « Relier les autres automatiquement » : Premiere retrouve tout le reste.
5. Les **marqueurs** de la séquence donnent la partie, le chapitre, puis le numéro de chaque plan ; leur commentaire
   est la phrase à dire sur ce plan (fenêtre Marqueurs, ou double-clic sur un marqueur).
6. **Mes notes de montage** sont aussi des marqueurs, à l'image près :
   - « COUPE · plan » : j'ai resserré la fin du plan (temps mort après la voix) ; le fichier est entier, tire la fin
     du plan pour rallonger ;
   - « À COUPER À L'OREILLE · plan » : ta voix finit là, il reste de la marge, mais la carte bouge en continu : coupe
     sur un mouvement si ta voix le permet, sinon laisse ;
   - « SON D'ORIGINE · plan » : un vrai son à garder audible (la voix de Ben Gourion en 16.3), sans voix off dessus ;
   - « SON EN BLOC · plan » : les bruitages de ce plan restent mixés ensemble sur A2-A3 (séparés, ils ne retombaient
     pas exactement sur le son livré : on garde le bon son plutôt qu'un son faux).
   Les sons séparés sont environ 3 dB plus bas que le mixage livré (marge pour ne jamais saturer en les additionnant).
7. Enregistre ensuite le projet (Fichier > Enregistrer sous) : c'est ton projet de montage.

Durée de la séquence : {minutes:.1f} min. {manquants_txt}
Ce fichier est refait à chaque livraison : après une relivraison, réimporte-le (ou remplace seulement les plans
changés, listés dans `Script/CHANGEMENTS.md`).
"""


def livrer_sons(w, sons):
    """Les sons posés dans la timeline, en AAC 256 kb/s (le dépôt reste léger ; Premiere les lit tels quels), dans
    SION/Sons/<pièce>/ ; seuls les nouveaux ou changés sont réencodés, ceux qui ne servent plus sont retirés."""
    idx_p = os.path.join(w, "SION", "Sons", "index.json")
    idx = json.load(open(idx_p, encoding="utf-8")) if os.path.exists(idx_p) else {}
    garder = set()
    for k, (piece, fic) in enumerate(sons, 1):
        src = os.path.join(ROOT, "output", "pistes", piece, fic[:-4] + ".m4a")  # déjà en AAC (sinon le WAV, encodé ici)
        if not os.path.exists(src):
            src = os.path.join(ROOT, "output", "pistes", piece, fic)
        rel = son_rel(piece, fic)
        dst = os.path.join(w, rel)
        garder.add(rel)
        tampon = [int(os.path.getmtime(src)), os.path.getsize(src)]
        if idx.get(rel) == tampon and os.path.exists(dst):
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        if src.endswith(".m4a"):
            if os.path.exists(dst):
                os.remove(dst)
            try:
                os.link(src, dst)  # même disque : pas de copie
            except OSError:
                shutil.copy(src, dst)
        else:
            subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", src, "-c:a", "aac", "-aac_pns", "0", "-aac_is", "0",
                            "-b:a", "256k", "-movflags", "+faststart", dst], check=True)
        idx[rel] = tampon
        if k % 200 == 0:
            print(f"  sons : {k}/{len(sons)}", flush=True)
    for rel in [r for r in idx if r not in garder]:
        if os.path.exists(os.path.join(w, rel)):
            os.remove(os.path.join(w, rel))
        del idx[rel]
    os.makedirs(os.path.dirname(idx_p), exist_ok=True)
    json.dump(idx, open(idx_p, "w", encoding="utf-8"), ensure_ascii=False, indent=0)


def main():
    envoyer = "--envoyer" in sys.argv
    w = tempfile.mkdtemp(prefix="premiere-")
    try:
        fichiers, manif = depot(w)
        xml, st = construit(film(fichiers, manif))
        out = os.path.join(ROOT, "output", "premiere")
        os.makedirs(out, exist_ok=True)
        open(os.path.join(out, NOM), "w", encoding="utf-8").write(xml)
        txt = (f"{st['manquants']} plans ne sont pas encore en vidéo : un trou de leur durée, avec un marqueur « à venir »."
               if st["manquants"] else "Tous les plans sont en vidéo.")
        fams = [NOMS_FAM[x] for x in FAMILLES if any(fx == x for fx in st["familles"])]
        guide = GUIDE.format(plans=st["plans"], cartons=st["cartons"], minutes=st["minutes"], manquants_txt=txt,
                             familles=", ".join(f"A{4 + 2 * k} et A{5 + 2 * k} {n}" for k, n in enumerate(fams)))
        open(os.path.join(out, "PREMIERE.md"), "w", encoding="utf-8").write(guide)
        print(f"{st['plans']} plans, {st['manquants']} à venir, {st['cartons']} cartons, {st['fichiers']} fichiers, "
              f"{st['marqueurs']} marqueurs, {st['minutes']:.1f} min, {len(st['sons'])} sons séparés ({st['clips_sons']} poses) "
              f"→ {os.path.join(out, NOM)}", flush=True)
        if envoyer:
            git("-C", w, "sparse-checkout", "set", "--no-cone", f"/SION/{NOM}", "/SION/PREMIERE.md", "/SION/Sons/")
            git("-C", w, "checkout", "-q")
            os.makedirs(os.path.join(w, "SION"), exist_ok=True)
            for f in (NOM, "PREMIERE.md"):
                shutil.copy(os.path.join(out, f), os.path.join(w, "SION", f))
            livrer_sons(w, st["sons"])
            git("-C", w, "add", "-A", "--sparse", "--", f"SION/{NOM}", "SION/PREMIERE.md", "SION/Sons")
            if subprocess.run(["git", "-C", w, "diff", "--cached", "--quiet"]).returncode:
                git("-C", w, "commit", "-q", "-m", MSG)
                git("-C", w, "push", "-q")
                print("envoyé sur le dépôt de montage", flush=True)
            else:
                print("dépôt déjà à jour", flush=True)
    finally:
        shutil.rmtree(w, ignore_errors=True)


if __name__ == "__main__":
    main()
