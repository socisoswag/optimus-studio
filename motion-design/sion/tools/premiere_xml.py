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


def film(fichiers, manif):
    """Le film, partie par partie : [(titre de partie, [(titre de chapitre, [plan…], [réserve…])…])…]."""
    out = []
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


def construit(f):
    F = Fichiers()
    chutiers, v1, v2, a2, a3, marques = [], [], [], [], [], []
    t = 0
    nplans = manquants = ncartons = 0
    for p_titre, chapitres in f:
        marques.append((t, p_titre, ""))
        sous = []
        for c_titre, plans, reserves in chapitres:
            marques.append((t, c_titre, ""))
            dedans = []
            for p in plans:
                n = p["n"]
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
                            f"<duration>{n}</duration>{rate()}<start>{t}</start><end>{t + n}</end><in>0</in><out>{n}</out>")
                    v1.append(f'<clipitem id="seq-v-{k}">{tete}<alphatype>none</alphatype><file id="file-{i}"/>{lien}</clipitem>')
                    for x, lst in ((2, a2), (3, a3)):
                        lst.append(f'<clipitem id="seq-a{x}-{k}">{tete}<file id="file-{i}"/><sourcetrack><mediatype>audio</mediatype>'
                                   f"<trackindex>{x - 1}</trackindex></sourcetrack>{lien}</clipitem>")
                    nplans += 1
                    debut = t
                    for c in p["cartons"]:
                        dedans.append(F.maitre(c["rel"], c["n"], son=False, alpha=True))
                        j = F.ids[c["rel"]]
                        m = min(c["n"], n - (debut - t))
                        if m <= 0:
                            break
                        v2.append(f'<clipitem id="seq-c-{len(v2) + 1}"><masterclipid>masterclip-{j}</masterclipid>'
                                  f"<name>{e(os.path.basename(c['rel']))}</name><enabled>TRUE</enabled><duration>{c['n']}</duration>"
                                  f"{rate()}<start>{debut}</start><end>{debut + m}</end><in>0</in><out>{m}</out>"
                                  f'<alphatype>straight</alphatype><file id="file-{j}"/></clipitem>')
                        ncartons += 1
                        debut += m
                    marques.append((t, p["pid"], p["voix"] or "(silence)"))
                else:
                    manquants += 1
                    marques.append((t, f"{p['pid']} · à venir ({p['type']})", p["ecran"] or p["voix"]))
                t += n
            for r in reserves:
                dedans.append(F.maitre(r["rel"], r["n"], son=True))
            sous.append(f"<bin><name>{e(c_titre)}</name><children>{''.join(dedans)}</children></bin>")
        chutiers.append(f"<bin><name>{e(p_titre)}</name><children>{''.join(sous)}</children></bin>")
    sc = (f"<samplecharacteristics>{rate()}<width>1920</width><height>1080</height><anamorphic>FALSE</anamorphic>"
          "<pixelaspectratio>square</pixelaspectratio><fielddominance>none</fielddominance></samplecharacteristics>")
    piste = lambda clips, extra="": f"<track>{''.join(clips)}<enabled>TRUE</enabled><locked>FALSE</locked>{extra}</track>"
    mk = "".join(f"<marker><comment>{e(c)}</comment><name>{e(n)}</name><in>{s}</in><out>-1</out></marker>" for s, n, c in marques)
    seq = (f'<sequence id="sequence-1"><name>SION</name><duration>{t}</duration>{rate()}'
           f"<timecode>{rate()}<string>00:00:00:00</string><frame>0</frame><displayformat>NDF</displayformat></timecode>"
           f"<media><video><format>{sc}</format>{piste(v1)}{piste(v2)}</video>"
           "<audio><numOutputChannels>2</numOutputChannels><format><samplecharacteristics><depth>16</depth>"
           "<samplerate>48000</samplerate></samplecharacteristics></format>"
           f"{piste([])}{piste(a2, '<outputchannelindex>1</outputchannelindex>')}{piste(a3, '<outputchannelindex>2</outputchannelindex>')}"
           f"</audio></media>{mk}</sequence>")
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n<xmeml version="4"><project><name>SION</name><children>'
           + "".join(chutiers) + seq + "</children></project></xmeml>\n")
    return xml, {"plans": nplans, "manquants": manquants, "cartons": ncartons, "fichiers": len(F.ids),
                 "marqueurs": len(marques), "minutes": t / FPS / 60}


GUIDE = """# Ouvrir le film dans Premiere Pro

1. Télécharge (ou mets à jour) tout le dossier `Montage-Moyen-orient` sur ton ordinateur.
2. Dans Premiere : **Fichier > Importer**, choisis `SION/SION-premiere.xml`.
3. Premiere crée un chutier `SION-premiere` avec un chutier par partie et un sous-chutier par chapitre (ses plans,
   ses cartons et ses plans en réserve), et la séquence **SION** :
   - **V1** : les {plans} plans dans l'ordre du film, à la durée prévue par le script ;
   - **V2** : les {cartons} cartons (lieu et date), posés au début de leur plan ;
   - **A1** : vide, pour ta voix ;
   - **A2 et A3** : le son des plans (bruitages et ambiances), gauche et droite.
4. Si les plans s'affichent « hors ligne » : clic droit sur un plan > **Lier le média**, montre le même fichier dans ton
   dossier `Montage-Moyen-orient`, coche « Relier les autres automatiquement » : Premiere retrouve tout le reste.
5. Les **marqueurs** de la séquence donnent la partie, le chapitre, puis le numéro de chaque plan ; leur commentaire
   est la phrase à dire sur ce plan (fenêtre Marqueurs, ou double-clic sur un marqueur).
6. Enregistre ensuite le projet (Fichier > Enregistrer sous) : c'est ton projet de montage.

Durée de la séquence : {minutes:.1f} min. {manquants_txt}
Ce fichier est refait à chaque livraison : après une relivraison, réimporte-le (ou remplace seulement les plans
changés, listés dans `Script/CHANGEMENTS.md`).
"""


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
        guide = GUIDE.format(plans=st["plans"], cartons=st["cartons"], minutes=st["minutes"], manquants_txt=txt)
        open(os.path.join(out, "PREMIERE.md"), "w", encoding="utf-8").write(guide)
        print(f"{st['plans']} plans, {st['manquants']} à venir, {st['cartons']} cartons, {st['fichiers']} fichiers, "
              f"{st['marqueurs']} marqueurs, {st['minutes']:.1f} min → {os.path.join(out, NOM)}", flush=True)
        if envoyer:
            git("-C", w, "sparse-checkout", "set", "--no-cone", f"/SION/{NOM}", "/SION/PREMIERE.md")
            git("-C", w, "checkout", "-q")
            os.makedirs(os.path.join(w, "SION"), exist_ok=True)
            for f in (NOM, "PREMIERE.md"):
                shutil.copy(os.path.join(out, f), os.path.join(w, "SION", f))
            git("-C", w, "add", "--sparse", "--", f"SION/{NOM}", "SION/PREMIERE.md")
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
