"""Relivre seulement quelques plans (après une correction : une ambiance, un son, un recadrage, une saccade), sans
recouper toute leur partie.

    python3 tools/livrer_plans.py 09.04 28.02 30.03           ces plans
    python3 tools/livrer_plans.py --types ARCH,RÉEL,IA        tous les plans de ces types
    python3 tools/livrer_plans.py --reserves 13.12            ce plan et tous les plans en réserve (« 05.R1 »)

Même découpe et même encodage que tools/derush.py (tremblement retiré compris), même nom de fichier, au même endroit
du dépôt de montage : Premiere reprend le plan tout seul. Un plan qui a changé de type (une fiche remplacée par une
archive) change de nom : l'ancien fichier est retiré. Les PLANS.md, les sommaires et les cartons des plans relivrés
sont mis à jour. Clone partiel sans les vidéos déjà livrées, refait pour chaque partie (le disque ne garde jamais plus
d'une partie), un envoi par chapitre, puis le clone est effacé.
"""
import glob
import os
import shutil
import subprocess
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import derush as D  # noqa: E402

REPO = os.environ.get("MONTAGE_REPO", "https://github.com/socisoswag/Montage-Moyen-orient")
W = os.environ.get("WORK") or os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(ROOT))), "_livraison-plans")
MSG = ("SION : {quoi}\n\nMême découpe, même nom de fichier : Premiere reprend le plan tout seul. Tremblement de l'image "
       "retiré, cadence sans image sautée ni doublée.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n"
       "Claude-Session: https://claude.ai/code/session_01Up6uBitdRxnv9kmecRQqy1\n")


def choix(ids, types, reserves):
    """Pour chaque partie (clé de D.PARTS) : les numéros de plans et de réserves à relivrer."""
    res, vus = {}, set()
    for yml, folder, key in D.PARTS:
        data = yaml.safe_load(open(os.path.join(ROOT, "script", yml), encoding="utf-8"))
        for ch in data["chapitres"]:
            for k, p in enumerate(ch["plans"], start=1):
                pid = D.plan_id(ch["num"], k)
                if pid in ids or p["type"] in types:
                    res.setdefault(key, set()).add(pid)
                    vus.add(pid)
            for r, _ in enumerate(ch.get("reserve") or [], start=1):
                rid = f"{D.plan_id(ch['num'], 0)[:-3]}.R{r}"
                if reserves or rid in ids:
                    res.setdefault(key, set()).add(rid)
                    vus.add(rid)
    manque = [i for i in ids if i not in vus]
    if manque:
        raise SystemExit(f"plans introuvables dans le script : {' '.join(manque)}")
    return res


def git(*args, **kw):
    return subprocess.run(["git", "-C", W, *args], check=True, **kw)


def envoi(quoi):
    if subprocess.run(["git", "-C", W, "diff", "--cached", "--quiet"]).returncode == 0:
        return
    subprocess.run(["git", "-C", W, "commit", "-q", "-F", "-"], input=MSG.format(quoi=quoi), text=True, check=True)
    for d in (2, 4, 8, 16, 0):
        # sans « thin pack » ni deltas : git ne télécharge pas les anciennes vidéos (voir tools/livrer_derush.sh)
        if subprocess.run(["git", "-C", W, "-c", "pack.window=0", "push", "--no-thin", "-q", "origin", "HEAD:main"]).returncode == 0:
            return
        if not d:
            raise SystemExit("envoi refusé")
        print(f"envoi refusé, nouvel essai dans {d} s", flush=True)
        subprocess.run(["sleep", str(d)])


def main():
    args, types, reserves = sys.argv[1:], set(), False
    if "--types" in args:
        i = args.index("--types")
        types = set(args[i + 1].split(","))
        del args[i:i + 2]
    if "--reserves" in args:
        args.remove("--reserves")
        reserves = True
    if not (args or types or reserves):
        raise SystemExit(__doc__)
    sel = choix(set(args), types, reserves)
    print(f"{sum(map(len, sel.values()))} plans à relivrer", flush=True)
    premier = True
    for yml, folder, key in D.PARTS:
        if key not in sel:
            continue
        print(folder, flush=True)
        if os.path.isdir(W):
            shutil.rmtree(W)
        try:
            subprocess.run(["git", "clone", "-q", "--filter=blob:none", "--sparse", REPO, W], check=True)
            git("sparse-checkout", "set", "SION/Script")
            git("config", "http.postBuffer", "524288000")
            D.DST = os.path.join(W, "SION")
            D.KEEP.clear()
            if premier:
                for f in glob.glob(os.path.join(ROOT, "script", "*.md")):
                    D.link(f, os.path.join(D.DST, "Script", os.path.basename(f)))
                git("add", "--sparse", "-A", "--", "SION/Script")
                envoi("script à jour")
                premier = False
            pd = os.path.join(D.DST, folder)
            os.makedirs(pd, exist_ok=True)
            # manifeste de la partie (ce qui a été coupé, dans quoi) : repris du dépôt pour garder les autres plans
            r = subprocess.run(["git", "-C", W, "show", f"HEAD:SION/{folder}/.derush.json"], capture_output=True)
            if r.returncode == 0:
                open(os.path.join(pd, ".derush.json"), "wb").write(r.stdout)
            D.KEEP.clear()
            D.SEULS = sel[key]
            D.part(yml, folder)
            ecrits = {os.path.relpath(f, W) for f in D.KEEP if os.path.exists(f)}
            # anciens fichiers des plans relivrés (autre type, autre pièce, autre nom) : retirés de l'index
            prefixes = tuple(f"{i}-" for i in sel[key])
            suivis = git("ls-files", "-z", "--", f"SION/{folder}", capture_output=True).stdout.decode().split("\0")
            for f in suivis:
                if f and os.path.basename(f).startswith(prefixes) and f not in ecrits:
                    git("rm", "-q", "--cached", "--sparse", "--", f)
                    print(f"  retiré : {os.path.basename(f)}", flush=True)
            for cd in sorted(glob.glob(os.path.join(pd, "*/"))):
                fichiers = sorted(f for f in ecrits if f.startswith(os.path.relpath(cd, W) + os.sep))
                if fichiers:
                    git("add", "--sparse", "--", *fichiers)
                    n = sum(f.endswith(".mp4") for f in fichiers)
                    envoi(f"{folder}, {os.path.basename(cd.rstrip('/'))}, {n} plan(s) refait(s)")
                    print(f"  {os.path.basename(cd.rstrip('/'))} : {n} plan(s)", flush=True)
                for f in fichiers:
                    if f.endswith((".mp4", ".mov")):
                        os.remove(os.path.join(W, f))
            fichiers = [f for f in ecrits if os.path.dirname(f) == os.path.relpath(pd, W)]
            if fichiers:
                git("add", "--sparse", "--", *fichiers)
                envoi(f"{folder}, sommaire")
        finally:
            D.SEULS = None
            shutil.rmtree(W, ignore_errors=True)


if __name__ == "__main__":
    main()
