"""Pistes séparées pour l'ingé son : le montage son se refait dans Premiere Pro, puis part en AAF ou OMF (Pro Tools…).

Les scripts de son (tools/sound.py, tools/sound_intro.py) rangent chaque son dans une famille (ambiances, souffles et
montées, impacts, guerre, bruitages) ; à la fin, chaque famille est découpée en clips là où elle n'est pas silencieuse
(un clip par son ou par groupe de sons rapprochés), calés à l'image près, en WAV 48 kHz 24 bits :

    output/pistes/<pièce>/<pièce>_<famille>_<NN>.wav   les clips, sans limiteur ni saturation (la somme refait le mixage)
    output/pistes/<pièce>/<pièce>_mixage.wav           le mixage livré, pour comparer
    output/pistes/<pièce>/<pièce>.xml                  séquence Final Cut Pro 7 (Premiere : Fichier > Importer)
    output/pistes/<pièce>/<pièce>.aaf                  avec AAF=1 : la même séquence en AAF, sons inclus (Pro Tools, Resolve)

Dans Premiere : importer le .xml ; s'il demande où sont les médias, montrer la vidéo (output/<pièce>.mp4) puis un clip
du dossier de la pièce, il retrouve les autres. Fichier > Exporter > AAF (ou OMF) pour le studio son.
"""
import os
import wave

import numpy as np

SR = 48000
FPS = 25
SPF = SR // FPS  # échantillons par image
FAMILLES = ("ambiances", "souffles", "impacts", "guerre", "bruitages", "musique")
NOMS = {"ambiances": "Ambiances", "souffles": "Souffles et montées", "impacts": "Impacts", "guerre": "Guerre",
        "bruitages": "Bruitages", "musique": "Musique", "mixage": "Mixage (référence)"}


class Pistes:
    """PST("impacts") choisit la famille des sons ajoutés ensuite ; PST.ajoute() est appelé par add()."""

    def __init__(self, n):
        self.n, self.cur, self.buf, self.ev = n, "ambiances", {}, {}

    def __call__(self, famille):
        assert famille in FAMILLES, famille
        self.cur = famille

    def multiplie(self, env):  # même traitement que tout le mixage (creux avant les coups)
        for l, r in self.buf.values():
            l *= env
            r *= env

    def ajoute(self, i0, l, r):
        b = self.buf.get(self.cur)
        if b is None:
            b = self.buf[self.cur] = (np.zeros(self.n), np.zeros(self.n))
        b[0][i0:i0 + len(l)] += l
        b[1][i0:i0 + len(r)] += r
        # où ce son s'entend vraiment : de sa première à sa dernière valeur au-dessus de -60 dB de sa crête
        a = np.maximum(np.abs(l), np.abs(r))
        pk = a.max() if len(a) else 0.0
        if pk > 0:
            idx = np.flatnonzero(a > pk * 1e-3)
            self.ev.setdefault(self.cur, []).append((i0 + idx[0], i0 + idx[-1] + 1))


def ecrire_wav(p, l, r):
    pcm = np.clip(np.stack([l, r], 1) * (2 ** 23 - 1), -(2 ** 23), 2 ** 23 - 1).astype("<i4")
    with wave.open(p, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(pcm.reshape(-1).view(np.uint8).reshape(-1, 4)[:, :3].tobytes())


def regions(l, r, seuil_db=-72.0, marge=0.15, trou=0.6):
    """Plages non silencieuses, en images : [(i0, i1)], séparées d'au moins `trou` secondes de silence."""
    nf = int(np.ceil(len(l) / SPF))
    a = np.zeros(nf * SPF)
    a[:len(l)] = np.maximum(np.abs(l), np.abs(r))
    on = a.reshape(nf, SPF).max(1) > 10 ** (seuil_db / 20)
    if not on.any():
        return []
    k = int(np.ceil(marge * FPS))
    idx = np.flatnonzero(on)
    out = []
    for f in idx:
        if out and f - out[-1][1] <= int(trou * FPS) + 2 * k:
            out[-1][1] = f + 1
        else:
            out.append([f, f + 1])
    return [(max(0, a_ - k), min(nf, b_ + k)) for a_, b_ in out]


def clips_sons(ev, nf, trou=0.3):
    """Un clip par son (ou par groupe de sons à moins de `trou` secondes) : [(image début, image fin)]."""
    out = []
    for a, b in sorted(ev):
        f0, f1 = a // SPF, min(nf, -(-b // SPF))
        if out and f0 <= out[-1][1] + int(trou * FPS):
            out[-1][1] = max(out[-1][1], f1)
        else:
            out.append([f0, f1])
    return [(a, b) for a, b in out if b > a]


def ecrire(pst, nom, traite, mix, video=None, dossier=None):
    """Écrit les clips de chaque famille (traités par `traite(l, r)` : enveloppe et gain du mixage), le mixage,
    la séquence XML et l'AAF. Renvoie le dossier."""
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dossier = dossier or os.path.join(root, "output", "pistes", nom)
    os.makedirs(dossier, exist_ok=True)
    for f in os.listdir(dossier):  # une nouvelle passe remplace tout
        if f.startswith(nom + "_") and f.endswith(".wav") or f in (nom + ".xml", nom + ".aaf"):
            os.remove(os.path.join(dossier, f))
    n = len(mix[0])
    nf = int(np.ceil(n / SPF))
    traitees = {fam: traite(*pst.buf[fam]) for fam in FAMILLES if fam in pst.buf}
    # sans limiteur, la somme des pistes dépasse parfois 0 dBFS : toutes baissent du même nombre de dB (équilibre gardé)
    crete = max([max(np.abs(l).max(), np.abs(r).max()) for l, r in traitees.values()] + [1e-9])
    k = min(1.0, 10 ** (-1.0 / 20) / crete)
    pistes = []
    for fam, (l, r) in traitees.items():
        l, r = l * k, r * k
        clips = []
        zones = clips_sons(pst.ev[fam], nf) if pst.ev.get(fam) else regions(l, r)
        for j, (f0, f1) in enumerate(zones, 1):
            fic = f"{nom}_{fam}_{j:02d}.wav"
            cl, cr = l[f0 * SPF:f1 * SPF].copy(), r[f0 * SPF:f1 * SPF].copy()
            q = min(len(cl) // 2, int(0.02 * SR))  # 20 ms de fondu à la coupe d'une traîne : jamais de clic
            if q and f1 < nf:
                cl[-q:] *= np.linspace(1, 0, q)
                cr[-q:] *= np.linspace(1, 0, q)
            ecrire_wav(os.path.join(dossier, fic), cl, cr)
            clips.append({"fichier": fic, "debut": f0, "fin": min(f1, nf), "duree": min(f1, nf) - f0})
        if clips:
            pistes.append({"famille": fam, "nom": NOMS[fam], "clips": clips})
    fic = f"{nom}_mixage.wav"
    ecrire_wav(os.path.join(dossier, fic), *mix)
    pistes.append({"famille": "mixage", "nom": NOMS["mixage"], "muet": True,
                   "clips": [{"fichier": fic, "debut": 0, "fin": nf, "duree": nf}]})
    xml = sequence_xml(nom, nf, pistes, video or f"{nom}.mp4")
    open(os.path.join(dossier, nom + ".xml"), "w", encoding="utf-8").write(xml)
    if os.environ.get("AAF") == "1":  # AAF direct (sons inclus, double le poids) ; sinon Premiere l'exporte depuis le XML
        try:
            sequence_aaf(os.path.join(dossier, nom + ".aaf"), nom, nf, pistes, dossier)
        except Exception as e:  # l'AAF est un bonus : le XML suffit pour Premiere
            print(f"AAF non écrit ({e.__class__.__name__}: {e})")
    nb = sum(len(p["clips"]) for p in pistes) - 1
    bas = f", {20 * np.log10(k):.1f} dB sous le mixage" if k < 1 else ""
    print(f"pistes : {dossier} ({len(pistes) - 1} familles, {nb} clips{bas})")
    return dossier


# ------------------------------------------------------------------ séquence Final Cut Pro 7 (xmeml), lue par Premiere
def _rate():
    return f"<rate><timebase>{FPS}</timebase><ntsc>FALSE</ntsc></rate>"


def _esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def sequence_xml(nom, nf, pistes, video):
    vid = os.path.basename(video)
    out = ['<?xml version="1.0" encoding="UTF-8"?>', "<!DOCTYPE xmeml>", '<xmeml version="5">',
           f'<sequence id="sequence-1"><name>SION {_esc(nom)}</name><duration>{nf}</duration>{_rate()}',
           f"<timecode>{_rate()}<string>00:00:00:00</string><frame>0</frame><displayformat>NDF</displayformat></timecode>",
           "<media><video><format><samplecharacteristics>" + _rate() +
           "<width>1920</width><height>1080</height><anamorphic>FALSE</anamorphic><pixelaspectratio>square</pixelaspectratio>"
           "<fielddominance>none</fielddominance></samplecharacteristics></format>",
           f'<track><clipitem id="clipitem-video"><name>{_esc(vid)}</name><enabled>TRUE</enabled><duration>{nf}</duration>'
           f"{_rate()}<start>0</start><end>{nf}</end><in>0</in><out>{nf}</out>"
           f'<file id="file-video"><name>{_esc(vid)}</name><pathurl>{_esc(vid)}</pathurl>{_rate()}<duration>{nf}</duration>'
           "<media><video><samplecharacteristics>" + _rate() + "<width>1920</width><height>1080</height></samplecharacteristics>"
           "</video><audio><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics>"
           "<channelcount>2</channelcount></audio></media></file></clipitem><enabled>TRUE</enabled><locked>FALSE</locked></track>",
           "</video>", "<audio><numOutputChannels>2</numOutputChannels><format><samplecharacteristics><depth>24</depth>"
           "<samplerate>48000</samplerate></samplecharacteristics></format>"]
    # chaque famille stéréo = deux pistes (gauche, droite) dont les clips sont liés deux à deux, comme Final Cut Pro 7
    fid = 0
    tracks = []
    for pi, p in enumerate(pistes):
        ta, tb = 2 * pi + 1, 2 * pi + 2
        items = ([], [])
        for ci, c in enumerate(p["clips"], 1):
            fid += 1
            ids = (f"clipitem-a{ta}-{ci}", f"clipitem-a{tb}-{ci}")
            links = "".join(f"<link><linkclipref>{ids[j]}</linkclipref><mediatype>audio</mediatype>"
                            f"<trackindex>{(ta, tb)[j]}</trackindex><clipindex>{ci}</clipindex><groupindex>1</groupindex></link>"
                            for j in (0, 1))
            for j in (0, 1):
                fdef = (f'<file id="file-{fid}"><name>{_esc(c["fichier"])}</name><pathurl>{_esc(c["fichier"])}</pathurl>'
                        f'{_rate()}<duration>{c["duree"]}</duration><media><audio><samplecharacteristics><depth>24</depth>'
                        "<samplerate>48000</samplerate></samplecharacteristics><channelcount>2</channelcount></audio></media></file>"
                        if j == 0 else f'<file id="file-{fid}"/>')
                items[j].append(
                    f'<clipitem id="{ids[j]}"><name>{_esc(c["fichier"])}</name><enabled>TRUE</enabled>'
                    f'<duration>{c["duree"]}</duration>{_rate()}<start>{c["debut"]}</start><end>{c["fin"]}</end>'
                    f'<in>0</in><out>{c["fin"] - c["debut"]}</out>{fdef}'
                    f"<sourcetrack><mediatype>audio</mediatype><trackindex>{j + 1}</trackindex></sourcetrack>{links}</clipitem>")
        on = "FALSE" if p.get("muet") else "TRUE"
        for j in (0, 1):
            side = "gauche" if j == 0 else "droite"
            tracks.append(f'<track><name>{_esc(p["nom"])} {side}</name>{"".join(items[j])}'
                          f"<enabled>{on}</enabled><locked>FALSE</locked><outputchannelindex>{j + 1}</outputchannelindex></track>")
    out += tracks + ["</audio></media></sequence></xmeml>", ""]
    return "\n".join(out)


# ------------------------------------------------------------------ AAF (sons inclus dans le fichier)
def sequence_aaf(path, nom, nf, pistes, dossier):
    """AAF avec les sons inclus : chaque famille = deux pistes mono (gauche, droite), positions à l'échantillon près."""
    import tempfile
    import aaf2

    tmp = tempfile.mkdtemp()
    try:
        with aaf2.open(path, "w") as f:
            comp = f.create.CompositionMob(f"SION {nom}")
            f.content.mobs.append(comp)
            for p in pistes:
                if p.get("muet"):
                    continue
                seqs = []
                for ch in (0, 1):
                    seq = f.create.Sequence(media_kind="sound")
                    pos = 0
                    for c in p["clips"]:
                        with wave.open(os.path.join(dossier, c["fichier"])) as w:
                            x = np.frombuffer(w.readframes(w.getnframes()), np.uint8).reshape(-1, 2, 3)[:, ch]
                        mono = os.path.join(tmp, f"{c['fichier'][:-4]}_{'G' if ch == 0 else 'D'}.wav")
                        with wave.open(mono, "wb") as w:
                            w.setnchannels(1)
                            w.setsampwidth(3)
                            w.setframerate(SR)
                            w.writeframes(x.tobytes())
                        mm = f.create.MasterMob(os.path.basename(mono)[:-4])
                        f.content.mobs.append(mm)
                        slot = mm.import_audio_essence(mono, SR)
                        if c["debut"] * SPF > pos:
                            seq.components.append(f.create.Filler("sound", c["debut"] * SPF - pos))
                        seq.components.append(mm.create_source_clip(slot.slot_id, length=len(x)))
                        pos = c["debut"] * SPF + len(x)
                    seqs.append(seq)
                for ch, seq in enumerate(seqs):
                    ts = comp.create_timeline_slot(SR)
                    ts.name = f"{p['nom']} {'gauche' if ch == 0 else 'droite'}"
                    ts.segment = seq
    finally:
        for fic in os.listdir(tmp):
            os.remove(os.path.join(tmp, fic))
        os.rmdir(tmp)
