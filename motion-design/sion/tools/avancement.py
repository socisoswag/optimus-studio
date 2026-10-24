"""Une ligne d'avancement du rendu du film : barre, pourcentage, pièce en cours, fin estimée.

    python3 tools/avancement.py

Le pourcentage compte les secondes de film déjà rendues (pièces finies, plus les morceaux de 60 s de la pièce en
cours) sur le total des pièces de tools/rendu_tout.sh. Durées gardées dans output/.durees.json.
"""
import datetime
import glob
import json
import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "output", ".durees.json")


def durees(liste):
    d = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    for t in liste:
        if t not in d:
            js = f"require('./core.js'); require('./timelines/{t}.js'); const T = globalThis.TL || globalThis.INTRO; console.log(T ? T.total : 0)"
            r = subprocess.run(["node", "-e", js], cwd=ROOT, capture_output=True, text=True)
            d[t] = float(r.stdout.strip() or 0)
    json.dump(d, open(CACHE, "w"))
    return d


def main():
    liste = re.search(r'LISTE="([^"]*)"', open(os.path.join(ROOT, "tools", "rendu_tout.sh"), encoding="utf-8").read()).group(1).split()
    d = durees(liste)
    total = sum(d.values())
    fait = sum(d[t] for t in liste if os.path.exists(os.path.join(ROOT, "output", f".rendu-ok-{t}-v2")))
    log = open(os.path.join(ROOT, "output", "rendu-tout.log"), encoding="utf-8").read().splitlines()
    etapes = [l for l in log if l.startswith("=== ")]
    depart = max((i for i, l in enumerate(etapes) if "départ" in l), default=0)
    cours = etapes[-1].split(" ", 2)[-1] if etapes else ""
    if cours in d and not os.path.exists(os.path.join(ROOT, "output", f".rendu-ok-{cours}-v2")):
        fait += min(d[cours], 60 * len(glob.glob(os.path.join(ROOT, "output", "morceaux", cours, "[0-9]*.mp4"))))
    p = fait / total if total else 0
    # fin estimée : vitesse mesurée depuis le départ de la chaîne (environ 12 s de calcul par seconde de film sinon)
    h0 = etapes[depart].split()[1] if etapes else None
    eta = ""
    if h0 and p > 0.02:
        t0 = datetime.datetime.combine(datetime.date.today(), datetime.time.fromisoformat(h0))
        now = datetime.datetime.utcnow()
        if t0 > now:
            t0 -= datetime.timedelta(days=1)
        reste = (now - t0) / max(p, 1e-3) * (1 - p)
        eta = f" · fin vers {(now + reste + datetime.timedelta(hours=2)).strftime('%H h %M')} (Paris)"
    n = 20
    barre = "▓" * round(p * n) + "░" * (n - round(p * n))
    livrees = sum(os.path.exists(os.path.join(ROOT, "output", f".livre-{k}-v3")) for k in range(9))
    print(f"Rendu {barre} {p * 100:.0f} % · {livrees}/9 parties livrées · en cours : {cours}{eta}")


if __name__ == "__main__":
    main()
