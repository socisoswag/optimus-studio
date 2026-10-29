"""Relivre seulement quelques plans (après une petite correction : une ambiance, un son, un recadrage), sans recouper
toute leur partie.

    python3 tools/livrer_plans.py 09.04 28.02 30.03

Même découpe et même encodage que tools/derush.py, même nom de fichier, au même endroit du dépôt de montage : Premiere
reprend le plan tout seul. Clone partiel sans les vidéos déjà livrées, un seul envoi, puis le clone est effacé.
"""
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


def trouve(ids):
    """Pour chaque numéro demandé : (chemin dans le dépôt, pièce source, entrée, durée, ambiance)."""
    res = {}
    for yml, folder, _ in D.PARTS:
        data = yaml.safe_load(open(os.path.join(ROOT, "script", yml), encoding="utf-8"))
        for ch in data["chapitres"]:
            for k, p in enumerate(ch["plans"], start=1):
                pid = D.plan_id(ch["num"], k)
                if pid not in ids:
                    continue
                fic = D.flat(p.get("fichier"))
                if p["type"] not in D.VIDEO or not fic.startswith("output/") or not fic.endswith(".mp4"):
                    raise SystemExit(f"{pid} : pas un plan vidéo coupé dans une pièce ({p['type']}, {fic})")
                a = float(p.get("entree", 0) or 0)
                d = float(p["sortie"]) - a if "sortie" in p else float(p.get("duree", 0) or 0)
                base = os.path.splitext(os.path.basename(fic))[0]
                name = f"{pid}-{p['type'].replace('É', 'E')}-{D.slug(base, 40).lower()}.mp4"
                rel = os.path.join("SION", folder, D.chapter_folder(ch["num"], ch["titre"]), name)
                res[pid] = (rel, os.path.join(ROOT, fic), a, d, os.path.join(ROOT, "output", "ambiances", f"{pid}.wav"))
    manque = [i for i in ids if i not in res]
    if manque:
        raise SystemExit(f"plans introuvables dans le script : {' '.join(manque)}")
    return res


def git(*args):
    subprocess.run(["git", "-C", W, *args], check=True)


def main():
    ids = sys.argv[1:]
    if not ids:
        raise SystemExit(__doc__)
    plans = trouve(ids)
    if os.path.isdir(W):
        shutil.rmtree(W)
    try:
        subprocess.run(["git", "clone", "-q", "--filter=blob:none", "--sparse", REPO, W], check=True)
        git("sparse-checkout", "set", "SION/Script")
        for pid, (rel, src, a, d, amb) in plans.items():
            dst = os.path.join(W, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            D.cut(src, a, d, dst, amb)
            print(f"  {pid} : {rel}")
        git("add", "--sparse", "--", *[r for r, *_ in plans.values()])
        msg = (f"SION : plans {', '.join(ids)} refaits\n\nMême découpe, même nom de fichier : Premiere reprend le plan tout "
               "seul.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n"
               "Claude-Session: https://claude.ai/code/session_01Up6uBitdRxnv9kmecRQqy1\n")
        subprocess.run(["git", "-C", W, "commit", "-q", "-F", "-"], input=msg, text=True, check=True)
        git("config", "http.postBuffer", "524288000")
        # sans « thin pack » ni deltas : git ne télécharge pas les anciennes vidéos (voir tools/livrer_derush.sh)
        git("-c", "pack.window=0", "push", "--no-thin", "-q", "origin", "HEAD:main")
        print(f"{len(plans)} plan(s) envoyé(s)")
    finally:
        shutil.rmtree(W, ignore_errors=True)


if __name__ == "__main__":
    main()
