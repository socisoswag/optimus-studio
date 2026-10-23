"""Vraies archives filmées du domaine public, mises au format du film : output/archives-filmees/<nom>.mp4.

    python3 tools/archives_filmees.py            (toutes)
    python3 tools/archives_filmees.py eichmann   (celles dont le nom contient « eichmann »)

Chaque plan est pris sur archive.org dans le fichier d'origine (jamais les copies réduites), seulement les passages
utiles (jamais le film entier), coupe par coupe à l'image près, recadré à l'intérieur de l'image (sans les bords
arrondis ni le noir de la pellicule ; recadrage en pixels du fichier, avant la correction de forme des pixels).
Restauration, sans IA :
  - retour aux images du film : les actualités transférées en vidéo NTSC entrelacée (29,97 i/s, 3 images de film
    sur 5 étalées en demi-images) retrouvent leurs 24 images par seconde d'origine (télécinéma inverse) ;
  - cadence : 24 et 23,976 i/s passent à 25 sans perdre ni doubler d'image (légère accélération, comme à la télévision) ;
  - scintillement lissé, poussières et taches d'une seule image remplacées par l'image voisine (seulement là où l'image
    d'avant et celle d'après sont identiques, jamais sur un mouvement), bruit atténué ;
  - films tournés à la manivelle (1903, 1918) : tremblement de la pellicule corrigé, mouvement de caméra gardé.
Puis mis au format du film comme les autres archives (tools/plans_reels.sh) : 1080p 25 i/s, look « archive »
(tools/looks.py), halo, courbe pellicule, flottement, grain et vignette. Sans son : le son vient du montage.
Sources et licences : SOURCES.md 4.2.
"""
import json
import os
import subprocess
import sys
import tempfile
import urllib.parse

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output", "archives-filmees")
IA = "https://archive.org/download/"

# nom : (identifiant archive.org, fichier d'origine, recadrage w:h:x:y en pixels du fichier, [(début, fin) de chaque coupe, en s]
#        [, options : pre = réglage d'exposition avant le look (copie trop claire ou trop sombre), stab = corriger le
#        tremblement de la pellicule, decimer = copie déjà désentrelacée qui garde les images en double du télécinéma])
ARCHIVES = {
    "1903-ellis-island-immigrants": ("emigrants-i.e.-immigrants-landing-at-ellis-island",
                                     "Emigrants_(i.e._immigrants)_landing_at_Ellis_Island_-.webm", "1408:1056:16:12", [(85.0, 91.0)],
                                     {"stab": True}),
    "1899-melies-dreyfus-ile-du-diable": ("LAffaireDreyfus1899", "L’Affaire Dreyfus (1899).mp4", "620:465:10:8", [(83.0, 92.0)]),
    "1899-melies-dreyfus-bagarre-journalistes": ("LAffaireDreyfus1899", "L’Affaire Dreyfus (1899).mp4", "620:465:10:8", [(451.0, 461.0)]),
    "1950-sands-of-sorrow-refugies": ("sands_of_sorrow", "sands_of_sorrow.mpeg", "690:466:15:7",
                                      [(126.0, 131.0), (148.0, 154.0), (220.5, 225.5)],
                                      {"pre": "curves=all='0/0 0.35/0.24 0.7/0.55 1/0.84'"}),
    "1897-lumiere-jerusalem-porte-de-jaffa": ("JaffaGateJerusalem1897", "Porte de Jaffa - coté Est.mkv", "1300:975:310:54", [(10.0, 20.0)]),
    "1918-jerusalem-mur-occidental": ("jerusalem-1918", "Jérusalem, 1918.mp4", "600:450:20:15",
                                      [(77.2, 83.4), (110.8, 116.7), (123.0, 124.9)], {"stab": True}),
    "1961-proces-eichmann": ("1961-04-13_Eichmann_trial", "1961-04-13_Eichmann_trial.mpeg", "652:436:34:22",
                             [(4.9, 8.8), (9.1, 13.0), (13.3, 21.2), (35.7, 39.0)]),
    # actualités Universal (domaine public), en réserve : camp de personnes déplacées d'Admont, Autriche, septembre 1946
    "1946-camp-refugies-juifs-autriche": ("1946-09-19_Sec_Wallace_Stirs_Foreign_Policy_Debate",
                                          "1946-09-19_Sec_Wallace_Stirs_Foreign_Policy_Debate.mpeg", "652:420:34:30",
                                          [(68.9, 73.9), (77.4, 81.1), (114.3, 117.5)]),
    # Nasser annonce la nationalisation du canal de Suez, juillet 1956
    "1956-nasser-canal-de-suez": ("1956-07-30_Suez_Canal_Seized", "1956-07-30_Suez_Canal_Seized.mpeg", "692:462:14:9",
                                  [(4.6, 7.4), (11.9, 16.8), (31.1, 34.5)]),
    # juin 1967 : un char dans le Sinaï, le panneau « Welcome to Gaza »
    "1967-sinai-gaza": ("1967-06-09_Egypt_Accepts_UN_Cease-Fire", "1967-06-09_Egypt_Accepts_UN_Cease-Fire.mpeg", "696:462:12:9",
                        [(3.6, 7.7), (24.1, 29.7)]),
    # juin 1967 : la ligne de partage de Jérusalem, Moshe Dayan, le drapeau hissé
    "1967-jerusalem": ("1967-06-13_Cease-Fire", "1967-06-13_Cease-Fire.mpeg", "696:462:12:9",
                       [(252.1, 257.2), (268.9, 273.6), (274.2, 279.3)]),
    # juin 1967 : le Conseil de sécurité des Nations unies, à New York
    "1967-onu-conseil-de-securite": ("1967-06-13_Cease-Fire", "1967-06-13_Cease-Fire.mpeg", "696:462:14:9",
                                     [(5.4, 11.0), (17.7, 23.5), (47.9, 51.5)]),
    # United News (Office of War Information, domaine public), juin 1946 : des réfugiés juifs d'Europe débarquent en Palestine
    "1946-refugies-juifs-palestine": ("ARC-31482", "ARC-31482.mov", "1248:704:16:8",
                                      [(309.5, 313.5), (314.0, 317.5), (318.0, 321.0), (322.0, 326.5)], {"decimer": True}),
    # même actualité : Amman fête l'indépendance de la Transjordanie, l'émir Abdallah, la Légion arabe (en réserve)
    "1946-transjordanie-independance": ("ARC-31482", "ARC-31482.mov", "1248:704:16:8",
                                        [(336.0, 339.0), (343.5, 346.5), (366.0, 369.0), (375.0, 380.0)], {"decimer": True}),
    # US Air Force (domaine public), octobre 1973 : le pont aérien vers Israël, déchargement d'un char à Lod
    "1973-pont-aerien-americain": ("342-adw-264", "342-adw-264-r6.mp4", "1400:1050:260:15",
                                   [(380.0, 386.5), (915.5, 921.0), (927.0, 932.5)]),
    "1945-roosevelt-ibn-saoud": ("1945-02-21_FDR_confers_with_Middle_East_Chiefs",
                                 "1945-02-21_FDR_confers_with_Middle_East_Chiefs.mpeg", "674:462:16:9",
                                 [(79.5, 83.6), (87.2, 90.3), (124.5, 136.3)]),
    "1956-sinai-gaza-armee-israelienne": ("1956-11-05_Eisenhower_Re-Elected", "1956-11-05_Eisenhower_Re-Elected.mpeg",
                                          "694:462:14:9", [(54.6, 56.5), (57.0, 60.0), (63.3, 66.4)],
                                          {"pre": "curves=all='0/0 0.25/0.36 0.6/0.72 1/1'"}),
    "1956-port-said": ("1956-11-12_Near_East_Crisis", "1956-11-12_Near_East_Crisis.mpeg", "694:462:14:9",
                       [(5.5, 10.8), (30.2, 33.0), (44.0, 46.8)]),
    "1957-tel-aviv-retrait-gaza": ("1957-02-14_Tel_Aviv_Israel", "1957-02-14_Tel_Aviv_Israel.mpeg", "694:462:14:9",
                                   [(2.6, 4.3), (4.6, 7.0), (7.3, 10.5), (13.5, 15.3)]),
    "1967-mai-pacte-nasser-hussein": ("1967-06-06_Mid-East", "1967-06-06_Mid-East.mpeg", "696:462:12:9",
                                      [(30.0, 33.4), (47.5, 52.5), (35.6, 42.0)]),
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


def cadence(src, net, opts):
    """Filtre qui rend les images du film, et la cadence qu'il donne."""
    p = json.loads(subprocess.check_output(["ffprobe", "-v", "error", *net, "-select_streams", "v:0", "-show_entries",
                                            "stream=r_frame_rate,field_order", "-of", "json", src]))["streams"][0]
    fps = p["r_frame_rate"]
    if p.get("field_order") in ("tt", "bb", "tb", "bt") and fps in ("30000/1001", "2997/100"):
        # télécinéma 3:2 : on réassemble les demi-images de chaque image de film, puis on retire l'image en trop sur 5
        return "fieldmatch=order=auto:combmatch=full,yadif=deint=interlaced,decimate", "24000/1001"
    if opts.get("decimer"):
        return "decimate", "24000/1001"
    return "null", fps


def vitesse(fps):
    """Passage à 25 i/s : 24 et 23,976 sans perdre ni doubler d'image (légère accélération), le reste par fps=25."""
    return {"24000/1001": "setpts=PTS*24000/25025,", "24/1": "setpts=PTS*24/25,"}.get(fps, "") + "fps=25"


def poussieres(entree, sortie, t1=14, t2=22):
    """Taches d'une seule image (poussière, cheveu, rayure courte) : remplacées par la médiane des 3 images voisines,
    seulement là où l'image d'avant et celle d'après se ressemblent (aucun mouvement) et où l'image courante s'en écarte."""
    g = (f"[0]format=yuv444p,split=3[v][vm][vg];[vg]format=gray,split=4[c0][c1][p0][n0];"
         f"[p0]tpad=start=1:start_mode=clone[prev];[n0]trim=start_frame=1,setpts=PTS-STARTPTS,tpad=stop=1:stop_mode=clone[next];"
         f"[c0]tmedian=radius=1[med];[prev][next]lut2=c0='if(lt(abs(x-y),{t1}),255,0)'[calme];"
         f"[c1][med]lut2=c0='if(gt(abs(x-y),{t2}),255,0)'[ecart];"
         f"[calme][ecart]blend=all_mode=multiply,dilation,dilation,gblur=sigma=1.2,split=3[m1][m2][m3];"
         f"[m1][m2][m3]mergeplanes=0x001020:yuv444p[m];[vm]tmedian=radius=1[mv];[v][mv][m]maskedmerge,format=yuv420p[o]")
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", entree, "-filter_complex", g, "-map", "[o]",
                    "-c:v", "libx264", "-crf", "10", "-preset", "fast", sortie], check=True)


def stabilise(entree, sortie):
    """Tremblement de la pellicule (films à la manivelle) : décalage global d'une image à l'autre (corrélation de phase),
    trajectoire lissée sur un tiers de seconde, seul l'écart rapide est corrigé (le mouvement de caméra reste)."""
    w, h = map(int, subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                             "stream=width,height", "-of", "csv=p=0", entree], text=True).strip().split(","))
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", entree, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)
    k = 320 / w
    petit = [cv2.resize(cv2.cvtColor(f, cv2.COLOR_RGB2GRAY), (320, int(h * k))).astype(np.float32) for f in fr]
    win = cv2.createHanningWindow((320, int(h * k)), cv2.CV_32F)
    pas, coupe = [(0.0, 0.0)], [0]
    for a, b in zip(petit, petit[1:]):
        (dx, dy), r = cv2.phaseCorrelate(a, b, win)
        if r < 0.05 or abs(dx) > 12 or abs(dy) > 12:  # changement de plan : on repart de zéro
            coupe.append(len(pas)); dx = dy = 0.0
        pas.append((dx / k, dy / k))
    pos = np.cumsum(np.array(pas), 0)
    coupe.append(len(pas))
    corr = np.zeros_like(pos)
    for a, b in zip(coupe, coupe[1:]):
        seg = pos[a:b]
        lisse = np.stack([cv2.GaussianBlur(seg[:, c].reshape(-1, 1), (1, 0), 3.0).ravel() for c in range(2)], 1) if len(seg) > 3 else seg
        corr[a:b] = np.clip(lisse - seg, -0.03 * w, 0.03 * w)
    out = subprocess.Popen(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}",
                            "-r", "25", "-i", "-", "-c:v", "libx264", "-crf", "10", "-preset", "fast", "-pix_fmt", "yuv420p", sortie],
                           stdin=subprocess.PIPE)
    for f, (cx, cy) in zip(fr, corr):
        m = np.float32([[1, 0, cx], [0, 1, cy]])
        out.stdin.write(cv2.warpAffine(f, m, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT).tobytes())
    out.stdin.close()
    out.wait()
    print(f"  tremblement corrigé : {np.abs(corr).mean(0).round(1)} px en moyenne (x, y)")


def fabrique(nom, ident, fichier, crop, coupes, opts=None):
    opts = opts or {}
    src = url(ident, fichier)
    net = ["-http_proxy", os.environ["HTTPS_PROXY"]] if os.environ.get("HTTPS_PROXY") else []
    cad, fps = cadence(src, net, opts)
    with tempfile.TemporaryDirectory() as tmp:
        parts = []
        for k, (a, b) in enumerate(coupes):
            p = os.path.join(tmp, f"{k}.mp4")
            # 3 s de marge avant la coupe (la recherche par réseau tombe sur une image clé, et le télécinéma inverse a
            # besoin de quelques images pour se caler), puis coupe exacte en temps réel, avant le passage à 25 i/s
            m = a - max(0, a - 3)
            subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", *net, "-ss", f"{a - m:.3f}", "-i", src, "-an", "-vf",
                            f"{cad},trim=start={m:.3f}:duration={b - a:.3f},setpts=PTS-STARTPTS,crop={crop},"
                            f"scale='trunc(iw*sar/2)*2':ih,setsar=1,{vitesse(fps)}",
                            "-c:v", "libx264", "-crf", "10", "-preset", "fast", p], check=True)
            parts.append(p)
        lst = os.path.join(tmp, "liste.txt")
        open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
        brut = os.path.join(tmp, "brut.mp4")
        subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
                        "-vf", "deflicker=size=7:mode=am", "-c:v", "libx264", "-crf", "10", "-preset", "fast", brut], check=True)
        propre = os.path.join(tmp, "propre.mp4")
        poussieres(brut, propre)
        if opts.get("stab"):
            stable = os.path.join(tmp, "stable.mp4")
            stabilise(propre, stable)
            propre = stable
        lut = os.path.join(ROOT, "data", "looks", "archive.cube")
        pre = opts.get("pre")
        # bruit atténué dans le temps avant l'agrandissement (le grain du film est rajouté à la fin, plus fin et régulier)
        vf = (f"hqdn3d=2.2:1.6:5.5:4.5,"
              f"scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,"
              + (f"{pre}," if pre else "") +
              f"unsharp=lx=13:ly=13:la=0.65:cx=5:cy=5:ca=0,cas=strength=0.35,lut3d=file={lut}:interp=tetrahedral,{finition()},"
              "noise=c0s=7:c0f=t+u:c1s=0:c2s=0,vignette=angle=PI/5,format=yuv420p,setsar=1")
        os.makedirs(OUT, exist_ok=True)
        dst = os.path.join(OUT, f"{nom}.mp4")
        subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", propre, "-vf", vf,
                        "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-tune", "film", "-movflags", "+faststart", dst + ".part.mp4"],
                       check=True)
        os.replace(dst + ".part.mp4", dst)
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", dst]))
    print(f"{nom} : {d:.2f} s ({len(coupes)} coupe{'s' if len(coupes) > 1 else ''}, source {fps} i/s)", flush=True)


if __name__ == "__main__":
    filtre = sys.argv[1:]
    for nom, args in ARCHIVES.items():
        if not filtre or any(f in nom for f in filtre):
            fabrique(nom, *args)
