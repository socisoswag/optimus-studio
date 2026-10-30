"""Sous-titres des plans où l'on entend parler quelqu'un (son d'origine gardé, tools/ambiances.py) : un fichier
transparent par plan, de la durée du plan, à poser au-dessus de l'image comme un carton (output/cartons/st-*.mov, codec
PNG avec couche alpha ; tools/derush.py le range avec les cartons du chapitre).

    python3 tools/sous_titres.py           → tous les plans du script qui ont des « sous_titres »
    python3 tools/sous_titres.py 16.3      → seulement ces plans

Dans le script, sur le plan :
    sous_titres:
      - [1.9, 6.4, "Texte de la première ligne,"]      début et fin en secondes depuis le début du plan
      - [6.6, 13.9, "puis la suite."]
    qui: "David Ben Gourion, 14 mai 1948"          facultatif : la personne, en petit au-dessus de la première ligne

Style du film : Archivo, ivoire, ombre douce (lisible sur un ciel clair comme sur une nuit), deux lignes au plus,
centré en bas dans la zone sûre ; le nom en DM Mono vermillon, espacé. Fondus de 0,15 s, jamais de tiret long.
"""
import os
import subprocess
import sys
import tempfile

import yaml
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
W, H, FPS = 1920, 1080, 25
IVOIRE = (243, 236, 224)
VERMILLON = (255, 116, 78)  # PALETTE.hot
BAS = 958  # bas de la dernière ligne
LARGEUR = 1480
FONDU = 0.15


def nom(p):
    """Nom du fichier de sous-titres d'un plan (lié à son image, pas à son numéro : il survit à une renumérotation)."""
    from montage import slug
    base = os.path.splitext(os.path.basename(str(p["fichier"])))[0]
    return f"st-{slug(base, 40).lower()}-{int(round(float(p.get('entree', 0) or 0) * 10))}.mov"


def police(fichier, taille, poids):
    f = ImageFont.truetype(os.path.join(ROOT, "fonts", fichier), taille)
    try:
        f.set_variation_by_axes([poids, 100] if "Archivo" in fichier else [poids])
    except (OSError, ValueError):
        pass
    return f


def lignes(texte, f, d):
    mots, out, cur = texte.split(), [], ""
    for m in mots:
        t = f"{cur} {m}".strip()
        if d.textlength(t, font=f) > LARGEUR and cur:
            out.append(cur)
            cur = m
        else:
            cur = t
    return out + [cur]


def image(texte, qui):
    """Une ligne de sous-titre sur fond transparent (et le nom de la personne au-dessus, s'il y en a un)."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    f = police("Archivo[wdth,wght].ttf", 46, 500)
    ls = lignes(texte, f, d)
    pas = 60
    y0 = BAS - pas * len(ls)
    ombre = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    do = ImageDraw.Draw(ombre)
    for k, l in enumerate(ls):
        x = (W - d.textlength(l, font=f)) / 2
        do.text((x, y0 + k * pas + 3), l, font=f, fill=(0, 0, 0, 235))
        d.text((x, y0 + k * pas), l, font=f, fill=IVOIRE + (255,))
    if qui:
        g = police("DMMono-Regular.ttf", 22, 400)
        t = " ".join(qui.upper())  # lettres espacées, comme les mentions du film
        x = (W - d.textlength(t, font=g)) / 2
        do.text((x, y0 - 44 + 2), t, font=g, fill=(0, 0, 0, 220))
        d.text((x, y0 - 44), t, font=g, fill=VERMILLON + (255,))
    ombre = ombre.filter(ImageFilter.GaussianBlur(7))
    ombre = Image.alpha_composite(ombre, ombre)  # une ombre plus dense près des lettres
    return Image.alpha_composite(ombre, im)


def rendre(p, dst):
    a = float(p.get("entree", 0) or 0)
    d = float(p["sortie"]) - a
    n = int(round(d * FPS))
    vide = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cartes = [(float(t0), float(t1), image(txt, p.get("qui") if k == 0 else None)) for k, (t0, t1, txt) in enumerate(p["sous_titres"])]
    with tempfile.TemporaryDirectory() as tmp:
        for i in range(n):
            t = i / FPS
            fr = vide
            for t0, t1, im in cartes:
                if t0 <= t < t1:
                    al = min(1.0, (t - t0) / FONDU, (t1 - t) / FONDU)
                    fr = im if al >= 1 else Image.blend(vide, im, al)
                    break
            fr.save(os.path.join(tmp, f"{i:05d}.png"), compress_level=1)
        subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i",
                        os.path.join(tmp, "%05d.png"), "-c:v", "png", "-pix_fmt", "rgba", dst + ".part.mov"], check=True)
    os.replace(dst + ".part.mov", dst)


def main():
    from derush import PARTS, plan_id
    seuls = set(sys.argv[1:])
    os.makedirs(os.path.join(ROOT, "output", "cartons"), exist_ok=True)
    for yml, _, _ in PARTS:
        data = yaml.safe_load(open(os.path.join(ROOT, "script", yml), encoding="utf-8"))
        for ch in data["chapitres"]:
            for k, p in enumerate(ch["plans"], start=1):
                pid = plan_id(ch["num"], k)
                if not p.get("sous_titres") or (seuls and pid not in seuls and pid.lstrip("0") not in seuls):
                    continue
                dst = os.path.join(ROOT, "output", "cartons", nom(p))
                rendre(p, dst)
                print(f"{pid} : {os.path.relpath(dst, ROOT)} ({len(p['sous_titres'])} sous-titres)")


if __name__ == "__main__":
    main()
