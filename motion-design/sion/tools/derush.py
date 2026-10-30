"""Dossier de montage tiré du script : un fichier vidéo par plan, coupé à l'image près, rangé par partie et par
chapitre, numéroté dans l'ordre du film. On pose les fichiers d'un chapitre bout à bout et on a le chapitre.

    MONTAGE_DIR=/dossier python3 tools/derush.py            (tout le film)
    MONTAGE_DIR=/dossier python3 tools/derush.py 0 1        (seulement l'ouverture et la partie I)

Pour chaque plan du script (script/*.yaml) :
  MD, 3D, RÉEL, ARCH, IA, CARTON  coupé dans sa pièce (entree → sortie), 1080p 25 i/s, son de la pièce ;
  NOIR                            un noir silencieux de la bonne durée ;
  PHOTO, plan « à obtenir »       pas encore de vidéo : listé dans PLANS.md du chapitre, avec ce qu'il faut.
Les cartons transparents lieu/date cités par les plans du chapitre sont rangés dans cartons/ ; le script complet
(texte, voix off, minutage, guide de la voix) est copié dans Script/. Un plan déjà coupé et plus récent que sa
pièce n'est pas refait. Les fichiers qui ne sont plus dans le script sont retirés des parties traitées.
"""
import glob
import json
import os
import re
import subprocess
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.environ.get("MONTAGE_DIR") or os.path.join(ROOT, "output", "derush")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from montage import slug  # noqa: E402
import sans_flottement as SF  # noqa: E402

# (fichier du script, dossier, clé à donner en argument)
PARTS = [
    ("00-ouverture.yaml", "0-Ouverture", "0"),
    ("01-partie-I.yaml", "1-Partie-I-L-idee", "1"),
    ("02-partie-II.yaml", "2-Partie-II-Le-basculement", "2"),
    ("03-partie-III.yaml", "3-Partie-III-La-catastrophe-fondatrice", "3"),
    ("04-partie-IV.yaml", "4-Partie-IV-Resistances-et-oppressions", "4"),
    ("05-partie-V.yaml", "5-Partie-V-La-derive-d-un-projet", "5"),
    ("06-partie-VI.yaml", "6-Partie-VI-Voix-et-contre-voix", "6"),
    ("07-partie-VII.yaml", "7-Partie-VII-Une-histoire-universelle", "7"),
    ("08-conclusion.yaml", "8-Conclusion", "8"),
]
VIDEO = {"MD", "3D", "RÉEL", "ARCH", "IA", "CARTON", "PHOTO"}
KEEP = set()
# .derush.json de chaque partie : pour chaque plan coupé, sa pièce, la date de la pièce, l'entrée et la durée.
# Un plan n'est recoupé que si l'une d'elles change (les dates des fichiers du dépôt ne disent rien après un clone).
MANIFEST = {}


def duration(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]))


def link(src, dst):
    KEEP.add(dst)
    if os.path.exists(dst) and os.path.samefile(src, dst):
        return
    if os.path.exists(dst):
        os.remove(dst)
    try:
        os.link(src, dst)
    except OSError:
        subprocess.run(["cp", src, dst], check=True)


# livraison de quelques plans seulement (tools/livrer_plans.py) : numéros des plans (« 13.12 ») et des plans en
# réserve (« 05.R1 ») à recouper ; les autres plans ne sont pas recoupés mais restent dans les PLANS.md
SEULS = None

# préréglage x264 des plans livrés : « fast » est 2,2 fois plus rapide que « slow » pour la même image (mesuré le 29
# octobre sur six-jours : SSIM 19,73 dB contre 19,88 face à la pièce, même taille, plafonnée par le débit maximal)
PRESET = os.environ.get("DERUSH_PRESET", "fast")
STAB = os.environ.get("DERUSH_STAB", "1") == "1"  # tremblement retiré des plans (voir cut)


def cut(src, a, d, dst, amb=None):
    """Coupe à l'image près ; qualité de montage (CRF 16), son fondu sur quelques millisecondes aux coupes. Un plan
    sans son (vrai plan, archive, reconstitution) reçoit son ambiance (output/ambiances/<plan>.wav, tools/ambiances.py).
    Le tremblement rapide de l'ancienne finition (« flottement », des sauts d'un pixel plusieurs fois par seconde, vus
    comme des saccades) est mesuré puis retiré image par image (tools/sans_flottement.py : translation seule, 3 pixels
    au plus) ; les mouvements de caméra voulus et les secousses des impacts restent. Les cartons n'en ont pas besoin."""
    KEEP.add(dst)
    amb = amb if amb and os.path.exists(amb) else None
    stamp = [os.path.relpath(src, ROOT), int(os.path.getmtime(src)), round(a, 3), round(d, 3)] + ([int(os.path.getmtime(amb))] if amb else [])
    if os.path.exists(dst) and MANIFEST.get(os.path.basename(dst)) == stamp:
        return
    has_audio = bool(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", src]).strip())
    # GitHub refuse les fichiers de plus de 100 Mo : le débit plafond tient le plan sous 90 Mo, son compris
    rate = max(4000, min(24000, int(88 * 8000 / max(d, 1)) - 330))
    cmd = ["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-ss", f"{a:.3f}", "-i", src]
    if not has_audio:
        cmd += ["-i", amb] if amb else ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]
    chaine = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=25,setsar=1"
    j = None
    if STAB and "/chapitres/" not in src:
        j, tr = SF.tremblement(SF.mesure(src, ["-ss", f"{a:.3f}", "-i", src, "-t", f"{d:.3f}"], chaine + ","))
        if tr < 0.2:
            j = None
    if j is not None:  # images décodées, décalées sous le pixel (un recadrage au pixel près ne suffit pas), puis encodées
        dec = ["ffmpeg", "-nostdin", "-loglevel", "error", "-ss", f"{a:.3f}", "-i", src, "-t", f"{d:.3f}", "-map", "0:v:0",
               "-vf", chaine, "-pix_fmt", "bgr24", "-f", "rawvideo", "-"]
        cmd = ["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", "1920x1080", "-r", "25",
               "-i", "-", *(["-ss", f"{a:.3f}", "-i", src] if has_audio else (["-i", amb] if amb else ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]))]
    cmd += ["-t", f"{d:.3f}", "-map", "0:v:0", "-map", "1:a:0" if (j is not None or not has_audio) else "0:a:0",
            "-vf", "format=yuv420p" if j is not None else chaine + ",format=yuv420p",
            "-c:v", "libx264", "-preset", PRESET, "-crf", "16", "-maxrate", f"{rate}k", "-bufsize", f"{rate * 2}k", "-tune", "grain",
            "-af", f"aresample=48000,afade=t=in:d=0.04,afade=t=out:st={max(0, d - 0.06):.3f}:d=0.06",
            "-c:a", "aac", "-aac_pns", "0", "-aac_is", "0", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", dst + ".part.mp4"]
    if j is not None:
        SF.tuyau(dec, cmd, j)
    else:
        subprocess.run(cmd, check=True)
    os.replace(dst + ".part.mp4", dst)
    MANIFEST[os.path.basename(dst)] = stamp


def black(d, dst):
    KEEP.add(dst)
    if os.path.exists(dst) and abs(duration(dst) - d) < 0.05:
        return
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"color=c=black:s=1920x1080:r=25:d={d:.3f}",
                    "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", f"{d:.3f}", "-c:v", "libx264", "-preset", "slow",
                    "-crf", "16", "-pix_fmt", "yuv420p", "-c:a", "aac", "-aac_pns", "0", "-aac_is", "0", "-b:a", "128k", "-movflags", "+faststart", dst], check=True)


def flat(v):
    return " ".join(str(v).split()) if v is not None else ""


def plan_id(num, k):
    m = re.match(r"^(\d+)$", str(num))
    return f"{int(m.group(1)):02d}.{k:02d}" if m else f"{num}.{k:02d}"


def chapter_folder(num, titre):
    if re.match(r"^\d+$", str(num)):
        return f"Chapitre-{int(num):02d}-{slug(titre.split('·', 1)[-1].strip())}"
    return f"00-{slug(titre)}"


def cartons_of(plan):
    """Cartons transparents cités par un plan (output/cartons/<nom>, avec ou sans numéro ni extension)."""
    out = []
    for m in re.findall(r"output/cartons/([A-Za-z0-9_-]+)", " ".join(flat(plan.get(k)) for k in ("ecran", "fichier", "note", "carton"))):
        name = re.sub(r"^\d+-", "", m.removesuffix(".mov"))
        found = glob.glob(os.path.join(ROOT, "output", "cartons", f"*{name}.mov"))
        out += found[:1]
    return out


def part(yml, folder):
    data = yaml.safe_load(open(os.path.join(ROOT, "script", yml), encoding="utf-8"))
    pd = os.path.join(DST, folder)
    os.makedirs(pd, exist_ok=True)
    mf = os.path.join(pd, ".derush.json")
    MANIFEST.clear()
    if os.path.exists(mf):
        MANIFEST.update(json.load(open(mf, encoding="utf-8")))
    resume = []
    for ch in data["chapitres"]:
        cd = os.path.join(pd, chapter_folder(ch["num"], ch["titre"]))
        os.makedirs(cd, exist_ok=True)
        rows, manque, total, ok = [], [], 0.0, 0
        cartons, tous_cartons = [], False
        for k, p in enumerate(ch["plans"], start=1):
            pid = plan_id(ch["num"], k)
            fic = flat(p.get("fichier"))
            src = os.path.join(ROOT, fic) if fic.startswith("output/") and fic.endswith(".mp4") else None
            a = float(p.get("entree", 0) or 0)
            d = float(p["sortie"]) - a if "sortie" in p else float(p.get("duree", 0) or 0)
            total += d
            typ = p["type"]
            name = None
            sel = SEULS is None or pid in SEULS
            if typ == "NOIR":
                name = f"{pid}-noir.mp4"
                if sel:
                    black(d, os.path.join(cd, name))
            elif typ in VIDEO and src and os.path.exists(src) and not p.get("a_obtenir"):
                base = os.path.splitext(os.path.basename(fic))[0]
                name = f"{pid}-{typ.replace('É', 'E')}-{slug(base, 40).lower()}.mp4"
                if sel:
                    cut(src, a, d, os.path.join(cd, name), os.path.join(ROOT, "output", "ambiances", f"{pid}.wav"))
            else:
                # rendu absent sur cette machine (nouvelle session) mais plan déjà livré : on garde la version livrée
                old = [] if p.get("a_obtenir") or not src else sorted(glob.glob(os.path.join(cd, f"{pid}-*.mp4")))
                if old:
                    name = os.path.basename(old[0])
                    KEEP.add(old[0])
                else:
                    why = "à obtenir" if p.get("a_obtenir") else ("photo à remplacer par de la vidéo" if typ == "PHOTO" else "pas encore rendu")
                    manque.append(f"| {pid} | {typ} | {d:.1f} s | {why} : {fic.replace('|', '/')} |")
            ok += name is not None
            cartons += cartons_of(p) if sel else []
            tous_cartons = tous_cartons or bool(cartons_of(p))
            ecr = flat(p.get('ecran')) + (f" (carton `{os.path.basename(flat(p['carton']))}`)" if p.get("carton") else "")
            rows.append(f"| {pid} | `{name}` | {typ} | {d:.1f} s | {ecr.replace('|', '/')} | {flat(p.get('voix')).replace('|', '/') or 'silence'} |"
                        if name else f"| {pid} | à venir | {typ} | {d:.1f} s | {flat(p.get('ecran')).replace('|', '/')} | {flat(p.get('voix')).replace('|', '/') or 'silence'} |")
        if cartons:
            os.makedirs(os.path.join(cd, "cartons"), exist_ok=True)
            for c in dict.fromkeys(cartons):
                link(c, os.path.join(cd, "cartons", os.path.basename(c)))
        # plans en réserve (clé « reserve » du chapitre) : rendus en entier, à placer librement au montage
        reserve = []
        for r, x in enumerate(ch.get("reserve") or [], start=1):
            src = os.path.join(ROOT, x["fichier"])
            if os.path.exists(src):
                typ = (x.get("type") or "IA").replace("É", "E")  # une archive filmée en réserve garde son type
                rid = f"{plan_id(ch['num'], 0)[:-3]}.R{r}"
                name = f"{rid}-{typ}-{slug(os.path.splitext(os.path.basename(x['fichier']))[0], 40).lower()}.mp4"
                if SEULS is None or rid in SEULS:
                    cut(src, 0, duration(src), os.path.join(cd, name))
                reserve.append(f"| `{name}` | {duration(src):.1f} s | {flat(x.get('note')).replace('|', '/')} |")
        doc = [f"# {ch['titre']}\n", f"{len(ch['plans'])} plans, {total:.1f} s. Pose les fichiers dans l'ordre de leur numéro : "
               "chaque plan a la durée prévue par le script pour sa voix off (2,4 mots par seconde au plus).\n"]
        if ch.get("intention"):
            doc.append(f"*Intention : {flat(ch['intention'])}*\n")
        doc += ["| Plan | Fichier | Type | Durée | À l'écran | Voix off |", "|---|---|---|---|---|---|"] + rows
        if manque:
            doc += ["", "## Pas encore en vidéo", "", "| Plan | Type | Durée | Ce qu'il faut |", "|---|---|---|---|"] + manque
        if reserve:
            doc += ["", "## En réserve (plans en plus, à placer où tu veux)", "", "| Fichier | Durée | Ce que c'est |", "|---|---|---|"] + reserve
        if tous_cartons:
            doc += ["", "Cartons transparents (lieu et date, fond transparent) dans `cartons/` : à poser au-dessus du plan qui les cite."]
        path = os.path.join(cd, "PLANS.md")
        open(path, "w", encoding="utf-8").write("\n".join(doc) + "\n")
        KEEP.add(path)
        resume.append(f"- {ch['titre']} : {ok} plans sur {len(ch['plans'])} en vidéo")
        print(f"  {ch['titre'][:60]} : {ok}/{len(ch['plans'])}")
    path = os.path.join(pd, "LISEZMOI.md")
    open(path, "w", encoding="utf-8").write(f"# {data['titre']}\n\n" + "\n".join(resume) + "\n")
    KEEP.add(path)
    # quelques plans seulement : les autres plans de la partie gardent leur ligne du manifeste, rien n'est effacé
    json.dump({k: v for k, v in MANIFEST.items() if SEULS is not None or any(x.endswith("/" + k) for x in KEEP)},
              open(mf, "w", encoding="utf-8"), indent=0)
    KEEP.add(mf)
    for dp, dn, fn in ([] if SEULS is not None else os.walk(pd, topdown=False)):
        for f in fn:
            if os.path.join(dp, f) not in KEEP:
                os.remove(os.path.join(dp, f))
        if dp != pd and not os.listdir(dp):
            os.rmdir(dp)


def tout_local(key):
    """Vrai si chaque plan vidéo et chaque plan en réserve de la partie a son rendu sur cette machine : la livraison
    peut alors tout recouper sans télécharger les vidéos déjà livrées (tools/livrer_derush.sh)."""
    yml = next(y for y, _, k in PARTS if k == key)
    data = yaml.safe_load(open(os.path.join(ROOT, "script", yml), encoding="utf-8"))
    for ch in data["chapitres"]:
        for p in ch["plans"]:
            fic = flat(p.get("fichier"))
            if p["type"] in VIDEO and not p.get("a_obtenir") and fic.startswith("output/") and fic.endswith(".mp4") \
                    and not os.path.exists(os.path.join(ROOT, fic)):
                return False
        if any(not os.path.exists(os.path.join(ROOT, x["fichier"])) for x in ch.get("reserve") or []):
            return False
    return True


def main():
    if sys.argv[1:2] == ["--tout-local"]:
        sys.exit(0 if all(tout_local(k) for k in sys.argv[2:]) else 1)
    keys = sys.argv[1:] or [k for _, _, k in PARTS]
    os.makedirs(DST, exist_ok=True)
    sd = os.path.join(DST, "Script")
    os.makedirs(sd, exist_ok=True)
    for f in glob.glob(os.path.join(ROOT, "script", "*.md")):
        link(f, os.path.join(sd, os.path.basename(f)))
    # photos de départ des reconstitutions à générer, citées dans A-FABRIQUER.md
    todo = open(os.path.join(ROOT, "script", "A-FABRIQUER.md"), encoding="utf-8").read()
    for rel in dict.fromkeys(re.findall(r"`([\w./-]+\.jpg)`", todo)):
        if os.path.exists(os.path.join(ROOT, rel)):
            os.makedirs(os.path.join(sd, "photos-de-depart"), exist_ok=True)
            link(os.path.join(ROOT, rel), os.path.join(sd, "photos-de-depart", os.path.basename(rel)))
    open(os.path.join(DST, "LISEZMOI.md"), "w", encoding="utf-8").write(
        "# SION : le film plan par plan\n\n"
        "Un dossier par partie, un sous-dossier par chapitre. Dans chaque chapitre, un fichier vidéo par plan du script, "
        "numéroté dans l'ordre du film (`06.08-…` = chapitre 6, plan 8) et coupé à la durée prévue pour la voix off : "
        "posés bout à bout, ils font le chapitre. `PLANS.md` donne pour chaque plan le texte à l'écran et la voix off, "
        "et la liste des plans qui n'ont pas encore de vidéo. Le script complet est dans `Script/` (`MINUTAGE.md` pour le "
        "minutage du film, `guide-voix-off.md` pour la prononciation).\n\n"
        "Image : 1920 × 1080, 25 i/s, H.264 de qualité montage. Son : les bruitages de chaque plan (48 kHz), sans voix ni "
        "musique ; un noir est silencieux.\n\n"
        "Cartons transparents (`cartons/*.mov`, codec PNG avec couche alpha) : à poser sur une piste au-dessus de l'image.\n\n"
        + "\n".join(f"- `{folder}`" for _, folder, _ in PARTS) + "\n")
    for yml, folder, key in PARTS:
        if key in keys:
            print(folder)
            part(yml, folder)


if __name__ == "__main__":
    main()
