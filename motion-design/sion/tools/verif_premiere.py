"""Contrôle de la timeline Premiere (output/premiere/SION-premiere.xml) avant de l'envoyer, sans Premiere :

  1. chaque fichier cité existe dans le dépôt de montage, au chemin exact ;
  2. structure : identifiants uniques, chaque clip renvoie à un fichier défini, entrée < sortie <= durée du média,
     longueur sur la timeline = longueur prise dans le média ;
  3. V1 : les plans se suivent sans trou ni chevauchement, du début à la fin de la séquence ;
  4. pistes séparées : gauche et droite identiques, durées des sons vérifiées sur les fichiers ;
  5. calage du son : pour chaque plan de motion design, les sons posés sous lui (lus depuis l'XML, comme Premiere)
     sont additionnés et comparés au son de sa pièce au même endroit : même forme (corrélation), aucun décalage.

    python3 tools/verif_premiere.py        → « OK » ou la liste des défauts ; code de sortie 1 s'il y en a
"""
import json
import os
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from urllib.parse import unquote

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import premiere_xml as P  # noqa: E402

FPS, SR, SPF = 25, 48000, 1920
XMLF = os.path.join(ROOT, "output", "premiere", P.NOM)
defauts, notes = [], []


def son(path, sr=SR):
    """Son d'un fichier, mono, en float (ffmpeg applique la liste de montage de l'AAC, comme les lecteurs)."""
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", path, "-vn", "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def main():
    x = ET.parse(XMLF).getroot()
    seq = x.find(".//sequence")
    total = int(seq.find("duration").text)

    # fichiers définis (une seule fois chacun) et leur chemin dans le dépôt
    fichiers = {}
    for f in x.iter("file"):
        if f.find("pathurl") is not None:
            fid = f.get("id")
            if fid in fichiers:
                defauts.append(f"fichier défini deux fois : {fid}")
            url = unquote(f.find("pathurl").text)
            rel = url.split(f"/{P.RACINE}/", 1)[1]
            fichiers[fid] = (rel, int(f.find("duration").text))
    # 1. existence dans le dépôt de montage
    w = tempfile.mkdtemp(prefix="verif-premiere-")
    try:
        depot, manif = P.depot(w)
    finally:
        subprocess.run(["rm", "-rf", w])
    absents = [r for r, _ in fichiers.values() if r not in depot]
    if absents:
        defauts.append(f"{len(absents)} fichiers absents du dépôt, dont : {absents[:5]}")

    # durées réelles : plans (manifestes des parties), cartons et sons (fichiers locaux, identiques à ceux envoyés)
    reel = {}
    for folder, mf in manif.items():
        for name, st in mf.items():
            if len(st) >= 4:
                reel[name] = round(float(st[3]) * FPS)
    for fid, (rel, n) in fichiers.items():
        b = os.path.basename(rel)
        loc = None
        if rel.startswith("SION/Sons/"):
            piece = rel.split("/")[2]
            loc = os.path.join(ROOT, "output", "pistes", piece, b)
        elif "/cartons/" in rel:
            loc = os.path.join(ROOT, "output", "cartons", b)
        if loc and os.path.exists(loc):
            d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", loc]))
            reel[b] = int(d * FPS + 1e-6)
        elif loc:
            defauts.append(f"fichier local introuvable pour contrôler sa durée : {rel}")

    # 2. structure des clips de la séquence
    ids = set()
    pistes = []
    for kind in ("video", "audio"):
        for k, tr in enumerate(seq.find("media").find(kind).findall("track"), 1):
            clips = []
            for c in tr.findall("clipitem"):
                cid = c.get("id")
                if cid in ids:
                    defauts.append(f"identifiant de clip en double : {cid}")
                ids.add(cid)
                fid = c.find("file").get("id")
                if fid not in fichiers:
                    defauts.append(f"{cid} renvoie à un fichier non défini ({fid})")
                    continue
                s, e, i, o = (int(c.find(t).text) for t in ("start", "end", "in", "out"))
                rel, n = fichiers[fid]
                vrai = reel.get(os.path.basename(rel), n)
                if not (0 <= i < o) or e - s != o - i:
                    defauts.append(f"{cid} : entrée/sortie incohérentes ({s}-{e}, {i}-{o})")
                if o > vrai + 1:  # une image de tolérance (arrondi des durées)
                    defauts.append(f"{cid} : sort après la fin de {os.path.basename(rel)} ({o} > {vrai} images)")
                clips.append((s, e, i, o, rel, c.find("enabled").text))
            pistes.append((kind, k, clips))

    # 3. V1 continue
    v1 = sorted(pistes[0][2])
    pos = 0
    for s, e, *_ in v1:
        if s != pos:
            defauts.append(f"V1 : {'trou' if s > pos else 'chevauchement'} à l'image {pos} ({s})")
        pos = e
    if pos != total:
        defauts.append(f"V1 finit à {pos}, la séquence à {total}")
    notes.append(f"V1 : {len(v1)} plans, {total / FPS / 60:.1f} min ; V2 : {len(pistes[1][2])} cartons")

    # 4. pistes séparées : paires gauche/droite identiques
    audio = [p for p in pistes if p[0] == "audio"]
    fam = audio[3:]  # A1 voix, A2-A3 son des plans, puis les familles par paires
    for g, d in zip(fam[0::2], fam[1::2]):
        if [c[:5] for c in g[2]] != [c[:5] for c in d[2]]:
            defauts.append(f"pistes A{g[1]} et A{d[1]} : gauche et droite différentes")
    sons = [c for g in fam[0::2] for c in g[2]]
    notes.append(f"sons séparés : {len(sons)} poses sur {len(fam) // 2} familles")

    # 5. calage : chaque plan de motion design, sons de l'XML additionnés contre le son de sa pièce
    plans = P.film(depot, manif)
    t = 0
    par_piece = defaultdict(list)
    for _, chapitres in plans:
        for _, pl, _ in chapitres:
            for p in pl:
                if p["piece"] and p["rel"]:
                    par_piece[p["piece"][0]].append((t, p["ng"], p["piece"][1], p["pid"]))
                t += p["ng"]
    cache = {}
    mauvais, pire, n_ok, ecarts, exclus = [], 1.0, 0, [], {}
    for piece, lst in sorted(par_piece.items()):
        ref = son(os.path.join(ROOT, "output", "chapitres.mp4" if piece == "chapitres" else f"{piece}.mp4"))
        for t0, ng, dec, pid in lst:
            n = ng * SPF
            somme = np.zeros(n)
            for s, e, i, o, rel, _ in sons:
                if e <= t0 or s >= t0 + ng:
                    continue
                if rel not in cache:
                    cache[rel] = son(os.path.join(ROOT, "output", "pistes", rel.split("/")[2], os.path.basename(rel)))
                a = cache[rel][i * SPF:o * SPF]
                k = (s - t0) * SPF
                m = min(len(a), n - k)
                somme[k:k + m] += a[:m]
            r0 = int(round(dec * SR))
            r = ref[r0:r0 + n]
            if len(r) < n or np.sqrt((r ** 2).mean()) < 1e-4:
                continue  # plan silencieux dans la pièce : rien à comparer
            if np.sqrt((somme ** 2).mean()) < 1e-5:
                mauvais.append(f"{pid} : aucun son posé alors que sa pièce en a")
                exclus[pid] = f"{piece} : aucun son séparé sous ce plan"
                continue
            # décalage : intercorrélation sur ±200 ms
            L = int(0.2 * SR)
            fr = np.fft.rfft(np.pad(r, (0, 2 * L)))
            fs = np.fft.rfft(np.pad(somme, (0, 2 * L)))
            cc = np.fft.irfft(fr * np.conj(fs))
            lags = np.concatenate([cc[:L], cc[-L:]])
            lag = int(np.argmax(lags))
            lag = lag if lag < L else lag - 2 * L
            corr = float(np.dot(r, somme) / (np.linalg.norm(r) * np.linalg.norm(somme) + 1e-12))
            pire = min(pire, corr)
            ecarts.append(20 * np.log10(np.sqrt((somme ** 2).mean()) / np.sqrt((r ** 2).mean())))
            if abs(lag) > SR // FPS // 2 or corr < 0.9:
                mauvais.append(f"{pid} ({piece}) : corrélation {corr:.2f}, décalage {lag / SR * 1000:+.0f} ms")
                exclus[pid] = f"{piece} : corrélation {corr:.2f}, décalage {lag / SR * 1000:+.0f} ms"
            else:
                n_ok += 1
    if exclus:  # ces plans garderont leur son mixé à la prochaine construction de la timeline
        nc = os.path.join(ROOT, "data", "sons-non-conformes.json")
        tous = json.load(open(nc, encoding="utf-8")) if os.path.exists(nc) else {}
        tous.update(exclus)
        json.dump(dict(sorted(tous.items())), open(nc, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    if mauvais:
        defauts.append(f"calage du son : {len(mauvais)} plans à revoir : " + " ; ".join(mauvais[:12]))
    notes.append(f"calage du son : {n_ok} plans de motion design conformes à leur pièce (pire corrélation {pire:.3f}) ; "
                 f"niveau des sons séparés : {np.median(ecarts):+.1f} dB en médiane par rapport au mixage livré"
                 f" (de {min(ecarts):+.1f} à {max(ecarts):+.1f} dB)" if ecarts else "")

    for n_ in notes:
        print(n_)
    if defauts:
        print("DÉFAUTS :")
        for d in defauts:
            print(" -", d)
        sys.exit(1)
    print("OK : aucun défaut")


if __name__ == "__main__":
    main()
