"""Timeline de départ pour le montage : toutes les pièces du dossier montage, dans l'ordre du film,
posées bout à bout sur une séquence 1080p 25 i/s, avec un marqueur par partie et par chapitre.

Format XML de Final Cut Pro 7 (xmeml), que Premiere Pro et DaVinci Resolve importent tous les deux.
Les chemins des médias partent d'un dossier racine (RACINE) : à l'ouverture, Premiere propose de
« Lier le média » (choisir un fichier suffit, il retrouve les autres) ; Resolve demande le dossier
où chercher les sources.

    python3 tools/timeline_xml.py output/montage SION-timeline.xml SION-montage
"""
import html
import json
import os
import re
import subprocess
import sys
from urllib.parse import quote

FPS = 25


def probe(path):
    o = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,channels",
                                            "-of", "json", path]))
    audio = [s for s in o.get("streams", []) if s.get("codec_type") == "audio"]
    return round(float(o["format"]["duration"]) * FPS), (audio[0].get("channels", 2) if audio else 0)


def pieces(d):
    """Comme tools/bout_a_bout.py : les pièces d'un dossier dans l'ordre, séquences complètes,
    sans les versions facultatives, sans texte, plans découpés ni cartons transparents."""
    out = []
    for name in sorted(os.listdir(d)):
        p = os.path.join(d, name)
        if name == "cartons" or "facultatif" in name or "sans-texte" in name:
            continue
        if os.path.isdir(p):
            full = os.path.join(p, "00-sequence-complete.mp4")
            out += [full] if os.path.exists(full) else pieces(p)
        elif name.endswith(".mp4"):
            out.append(p)
    return out


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# titres exacts, tels qu'à l'écran (les noms de dossiers n'ont ni accents ni ponctuation)
TITLES = {int(n): t.replace("\\'", "'") for n, t in re.findall(r"\[(\d+), '[IVC]+', '((?:[^'\\\\]|\\\\.)*)'",
                                                               open(os.path.join(ROOT, "timelines", "chapitres.js"), encoding="utf-8").read())}
PARTS = {"0": "Générique et prologue", "1": "Partie I · L’idée", "2": "Partie II · Le basculement", "3": "Partie III · La catastrophe fondatrice",
         "4": "Partie IV · Résistances et oppressions", "5": "Partie V · La dérive d’un projet", "6": "Partie VI · Voix et contre-voix",
         "7": "Partie VII · Une histoire universelle ?", "8": "Conclusion", "9": "Générique de fin"}


def label(folder):
    """Nom d'un marqueur : le titre exact du chapitre, ou le nom de la partie."""
    parts = folder.split("-")
    if parts[0] == "Chapitre":
        n = int(parts[1])
        return f"Chapitre {n:02d} · {TITLES.get(n, ' '.join(parts[2:]))}"
    return PARTS.get(parts[0], folder.replace("-", " "))


def rate():
    return f"<rate><timebase>{FPS}</timebase><ntsc>FALSE</ntsc></rate>"


def main():
    montage, out, racine = sys.argv[1], sys.argv[2], sys.argv[3]
    clips, markers, t = [], [], 0
    for top in sorted(d for d in os.listdir(montage) if os.path.isdir(os.path.join(montage, d)) and d[0].isdigit()):
        td = os.path.join(montage, top)
        markers.append((t, label(top)))
        last = None
        for f in pieces(td):
            rel = os.path.relpath(f, montage)
            chap = next((c for c in rel.split(os.sep) if c.startswith("Chapitre-")), None)
            if chap and chap != last:
                markers.append((t, label(chap)))
                last = chap
            n, ch = probe(f)
            clips.append({"rel": rel, "start": t, "dur": n, "ch": ch})
            t += n
    total = t
    sc = (f"<samplecharacteristics>{rate()}<width>1920</width><height>1080</height>"
          "<anamorphic>FALSE</anamorphic><pixelaspectratio>square</pixelaspectratio><fielddominance>none</fielddominance></samplecharacteristics>")
    v, a1, a2 = [], [], []
    for i, c in enumerate(clips, 1):
        name = html.escape(os.path.basename(os.path.dirname(c["rel"])) if c["rel"].endswith("00-sequence-complete.mp4") else os.path.basename(c["rel"]))
        url = "file://localhost/" + quote(f"{racine}/{c['rel']}".replace(os.sep, "/"))
        head = f"<name>{name}</name><duration>{c['dur']}</duration>{rate()}<start>{c['start']}</start><end>{c['start'] + c['dur']}</end><in>0</in><out>{c['dur']}</out>"
        links = f"<link><linkclipref>v{i}</linkclipref><mediatype>video</mediatype></link>" + "".join(
            f"<link><linkclipref>a{k}-{i}</linkclipref><mediatype>audio</mediatype><trackindex>{k}</trackindex></link>" for k in (1, 2) if c["ch"])
        fmedia = f"<media><video>{sc}</video>" + (f"<audio><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics><channelcount>{c['ch']}</channelcount></audio>" if c["ch"] else "") + "</media>"
        v.append(f'<clipitem id="v{i}">{head}<file id="f{i}"><name>{name}</name><pathurl>{url}</pathurl>{rate()}<duration>{c["dur"]}</duration>{fmedia}</file>{links}</clipitem>')
        if c["ch"]:
            for k, lst in ((1, a1), (2, a2)):
                lst.append(f'<clipitem id="a{k}-{i}">{head}<file id="f{i}"/><sourcetrack><mediatype>audio</mediatype><trackindex>{k}</trackindex></sourcetrack>{links}</clipitem>')
    mk = "".join(f"<marker><name>{html.escape(n)}</name><comment></comment><in>{s}</in><out>-1</out></marker>" for s, n in markers)
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n<xmeml version="4"><sequence id="sion">'
           f"<name>SION · habillage dans l'ordre du film</name><duration>{total}</duration>{rate()}"
           f"<timecode>{rate()}<string>00:00:00:00</string><frame>0</frame><displayformat>NDF</displayformat></timecode>"
           f"<media><video><format>{sc}</format><track>{''.join(v)}</track></video>"
           f"<audio><numOutputChannels>2</numOutputChannels><track>{''.join(a1)}</track><track>{''.join(a2)}</track></audio></media>"
           f"{mk}</sequence></xmeml>\n")
    open(out, "w", encoding="utf-8").write(xml)
    print(f"{len(clips)} pièces, {len(markers)} marqueurs, {total / FPS / 60:.1f} min")


if __name__ == "__main__":
    main()
