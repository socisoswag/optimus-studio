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
import zoneinfo

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
        fait += min(d[cours], 60 * len(glob.glob(os.path.join(ROOT, "output", "morceaux", cours, "[0-9][0-9][0-9].mp4"))))
    p = fait / total if total else 0
    # fin estimée : vitesse mesurée sur ce qui a été rendu depuis le départ de la chaîne
    eta = ""
    h0 = etapes[depart].split()[1] if etapes else None
    if h0:
        now = datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
        t0 = datetime.datetime.combine(now.date(), datetime.time.fromisoformat(h0))
        if t0 > now:
            t0 -= datetime.timedelta(days=1)
        # début de la campagne de rendu (output/.campagne, heure UTC) : la vitesse se mesure sur toute la campagne,
        # pas seulement depuis la dernière relance (la chaîne est relancée toutes les deux heures)
        camp = os.path.join(ROOT, "output", ".campagne")
        if os.path.exists(camp):
            t0 = min(t0, datetime.datetime.fromisoformat(open(camp).read().strip()))
        run = sum(d[t] for t in liste if os.path.exists(f := os.path.join(ROOT, "output", f".rendu-ok-{t}-v2"))
                  and datetime.datetime.fromtimestamp(os.path.getmtime(f), datetime.UTC).replace(tzinfo=None) >= t0)
        if cours in d and not os.path.exists(os.path.join(ROOT, "output", f".rendu-ok-{cours}-v2")):
            run += min(d[cours], 60 * len(glob.glob(os.path.join(ROOT, "output", "morceaux", cours, "[0-9][0-9][0-9].mp4"))))
        # temps où la machine était arrêtée (output/.pause, en secondes) : ne compte pas dans la vitesse
        pf = os.path.join(ROOT, "output", ".pause")
        pause = datetime.timedelta(seconds=float(open(pf).read()) if os.path.exists(pf) else 0)
        if run > 60:
            paris = zoneinfo.ZoneInfo("Europe/Paris")  # heure d'été ou d'hiver selon la date
            fin = (now + (now - t0 - pause) / run * (total - fait)).replace(tzinfo=datetime.UTC).astimezone(paris)
            jour = "" if fin.date() == now.replace(tzinfo=datetime.UTC).astimezone(paris).date() else " demain"
            eta = f" · fin estimée{jour} vers {fin.strftime('%H h %M')} (Paris)"
    n = 20
    barre = "▓" * round(p * n) + "░" * (n - round(p * n))
    livrees = sum(os.path.exists(os.path.join(ROOT, "output", f".livre-{k}-v3")) for k in range(9))
    print(f"Rendu {barre} {p * 100:.0f} % · {livrees}/9 parties livrées · en cours : {cours}{eta}")


if __name__ == "__main__":
    main()
