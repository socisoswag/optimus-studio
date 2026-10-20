"""Vraies archives filmées du domaine public, mises au format du film : output/archives-filmees/<nom>.mp4.

    python3 tools/archives_filmees.py            (toutes)
    python3 tools/archives_filmees.py eichmann   (celles dont le nom contient « eichmann »)

Chaque plan est pris sur archive.org, seulement les passages utiles (jamais le film entier), coupe par coupe à
l'image près, recadré à l'intérieur de l'image (sans les bords arrondis ni le noir de la pellicule), puis mis au
format du film comme les autres archives (tools/plans_reels.sh) : 1080p 25 i/s, look « archive » (tools/looks.py),
halo, courbe pellicule, flottement, grain et vignette. Sans son : le son vient du montage.
Sources et licences : SOURCES.md 4.2.
"""
import os
import subprocess
import sys
import tempfile
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output", "archives-filmees")
IA = "https://archive.org/download/"

# nom : (identifiant archive.org, fichier, recadrage w:h:x:y dans la source, [(début, fin) de chaque coupe, en s]
#        [, réglage d'exposition avant le look, pour une copie trop claire ou trop sombre])
ARCHIVES = {
    "1903-ellis-island-immigrants": ("emigrants-i.e.-immigrants-landing-at-ellis-island",
                                     "Emigrants_(i.e._immigrants)_landing_at_Ellis_Island_-.mp4", "610:458:15:11", [(85.0, 91.0)]),
    "1899-melies-dreyfus-ile-du-diable": ("LAffaireDreyfus1899", "L’Affaire Dreyfus (1899).mp4", "620:465:10:8", [(83.0, 92.0)]),
    "1899-melies-dreyfus-bagarre-journalistes": ("LAffaireDreyfus1899", "L’Affaire Dreyfus (1899).mp4", "620:465:10:8", [(451.0, 461.0)]),
    "1950-sands-of-sorrow-refugies": ("sands_of_sorrow", "sands_of_sorrow.mpeg", "690:466:15:7",
                                      [(126.0, 131.0), (148.0, 154.0), (220.5, 225.5)],
                                      "curves=all='0/0 0.35/0.24 0.7/0.55 1/0.84'"),
    "1897-lumiere-jerusalem-porte-de-jaffa": ("JaffaGateJerusalem1897", "Porte de Jaffa - coté Est.mkv", "1300:975:310:54", [(10.0, 20.0)]),
    "1918-jerusalem-mur-occidental": ("jerusalem-1918", "Jérusalem, 1918.mp4", "600:450:20:15",
                                      [(77.2, 83.4), (110.8, 116.7), (123.0, 124.9)]),
    "1961-proces-eichmann": ("1961-04-13_Eichmann_trial", "1961-04-13_Eichmann_trial.mp4", "580:436:30:22",
                             [(4.9, 8.8), (9.1, 13.0), (13.3, 21.2), (35.7, 39.0)]),
}


def url(ident, name):
    """Adresse réelle du fichier (archive.org redirige ; les accents sont tantôt composés, tantôt non)."""
    import unicodedata
    for form in ("NFC", "NFD"):
        u = IA + ident + "/" + urllib.parse.quote(unicodedata.normalize(form, name))
        r = subprocess.run(["curl", "-sS", "-L", "-A", "Mozilla/5.0", "-r", "0-10", "-o", "/dev/null", "-w", "%{http_code} %{url_effective}", u],
                           capture_output=True, text=True)
        code, eff = r.stdout.split(" ", 1)
        if code in ("200", "206"):
            return eff
    raise SystemExit(f"introuvable : {ident}/{name}")


def finition():
    h = subprocess.check_output(["node", "-e", "global.window={}; require('./data/palette.js'); const h=window.PALETTE.halation; "
                                 "console.log('rr='+h[0]+':gg='+h[1]+':bb='+h[2])"], cwd=ROOT, text=True).strip()
    return ("format=gbrp,split=2[a][b];[b]curves=all='0/0 0.6/0 0.85/0.5 1/1',gblur=sigma=26,colorchannelmixer=" + h + "[h];"
            "[a][h]blend=all_mode=screen:all_opacity=0.30,curves=all='0/0.02 0.18/0.155 0.5/0.49 0.82/0.86 1/0.965',"
            "crop=w=1904:h=1071:x='8+1.1*sin(n*0.37)+0.6*sin(n*1.13)':y='4.5+0.9*sin(n*0.29+1)+0.5*sin(n*0.97)',scale=1920:1080:flags=lanczos")


def fabrique(nom, ident, fichier, crop, coupes, pre=None):
    src = url(ident, fichier)
    net = ["-http_proxy", os.environ["HTTPS_PROXY"]] if os.environ.get("HTTPS_PROXY") else []
    with tempfile.TemporaryDirectory() as tmp:
        parts = []
        for k, (a, b) in enumerate(coupes):
            p = os.path.join(tmp, f"{k}.mp4")
            # un peu de marge avant la coupe, puis coupe exacte (la recherche par réseau tombe sur une image clé)
            subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", *net, "-ss", f"{max(0, a - 3):.3f}", "-i", src,
                            "-ss", f"{a - max(0, a - 3):.3f}", "-t", f"{b - a:.3f}", "-an", "-vf", f"crop={crop},scale='trunc(iw*sar/2)*2':ih,setsar=1,fps=25",
                            "-c:v", "libx264", "-crf", "10", "-preset", "fast", p], check=True)
            parts.append(p)
        lst = os.path.join(tmp, "liste.txt")
        open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
        lut = os.path.join(ROOT, "data", "looks", "archive.cube")
        vf = (f"scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,"
              + (f"{pre}," if pre else "") +
              f"unsharp=lx=13:ly=13:la=0.5:cx=5:cy=5:ca=0,lut3d=file={lut}:interp=tetrahedral,{finition()},"
              "noise=c0s=7:c0f=t+u:c1s=0:c2s=0,vignette=angle=PI/5,format=yuv420p,setsar=1")
        os.makedirs(OUT, exist_ok=True)
        dst = os.path.join(OUT, f"{nom}.mp4")
        subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-vf", vf,
                        "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-tune", "film", "-movflags", "+faststart", dst + ".part.mp4"],
                       check=True)
        os.replace(dst + ".part.mp4", dst)
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", dst]))
    print(f"{nom} : {d:.2f} s ({len(coupes)} coupe{'s' if len(coupes) > 1 else ''})")


if __name__ == "__main__":
    filtre = sys.argv[1:]
    for nom, args in ARCHIVES.items():
        if not filtre or any(f in nom for f in filtre):
            fabrique(nom, *args)
