"""Nettoyage de la voix off, sans IA : filtres classiques d'ffmpeg uniquement.

    python3 tools/voix.py <brut.wav> [sortie.wav] [--ton 10]

--ton N : les N premières secondes sont le silence de la pièce (enregistré au début de la séance) ; elles servent
à mesurer le bruit de fond, puis sont coupées. Sans --ton, le bruit est mesuré sur la seconde la plus calme.
Chaîne : coupe du grave (pas, bureau), débruitage spectral réglé sur le bruit mesuré, moins de « carton »
vers 250 Hz, un peu de présence vers 4,5 kHz, sifflantes adoucies, compression douce, niveau -16 LUFS
(crête -1,5 dBTP), mono 48 kHz 24 bits. Sortie par défaut : output/voix/<nom>.wav.
Le rapport dit si la prise est bonne : bruit de fond, niveau, saturation.
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith("--")]
ton = float(sys.argv[sys.argv.index("--ton") + 1]) if "--ton" in sys.argv else 0.0
if ton:
    args = [a for a in args if a != sys.argv[sys.argv.index("--ton") + 1]]
src = args[0]
dst = args[1] if len(args) > 1 else os.path.join(ROOT, "output", "voix", os.path.splitext(os.path.basename(src))[0] + ".wav")
os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)


def stats(path, start=0.0, dur=None, filt=""):
    """Niveaux RMS par fenêtre de 0,5 s (pour trouver le silence) et crête, via astats."""
    cmd = ["ffmpeg", "-nostdin", "-hide_banner", "-ss", str(start)] + (["-t", str(dur)] if dur else []) + ["-i", path, "-af",
           (filt + "," if filt else "") + "aformat=channel_layouts=mono,astats=metadata=1:reset=24000,ametadata=print:key=lavfi.astats.Overall.RMS_level",
           "-f", "null", "-"]
    err = subprocess.run(cmd, capture_output=True, text=True).stderr
    rms = [float(v) for v in re.findall(r"RMS_level=(-?[\d.]+|-inf)", err) if v != "-inf"]
    return rms


rms = stats(src, 0, ton) if ton else stats(src)
floor = min(rms) if rms else -60.0
nf = max(-80.0, min(-20.0, floor))
chain = ("highpass=f=80:poles=2,"
         f"afftdn=nr=12:nf={nf:.1f}:tn=1,"
         "equalizer=f=250:t=q:w=1.0:g=-2,equalizer=f=4500:t=q:w=1.2:g=1.5,"
         "deesser=i=0.35:m=0.5:f=0.5,"
         "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2")
pre = ["ffmpeg", "-nostdin", "-hide_banner", "-y"] + (["-ss", str(ton)] if ton else []) + ["-i", src]
# deux passes de loudnorm : mesure, puis correction linéaire exacte
err = subprocess.run(pre + ["-af", chain + ",aformat=channel_layouts=mono,loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json",
                            "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(err[err.rindex("{"):err.rindex("}") + 1])
ln = (f"loudnorm=I=-16:TP=-1.5:LRA=7:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
subprocess.run(pre + ["-af", chain + ",aformat=channel_layouts=mono," + ln, "-ar", "48000", "-c:a", "pcm_s24le", dst], check=True,
               capture_output=True)
peak = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", src, "-af", "astats", "-f", "null", "-"], capture_output=True,
                      text=True).stderr
pk = [float(v) for v in re.findall(r"Peak level dB: (-?[\d.]+)", peak)]
print(f"{dst}")
print(f"  bruit de fond {floor:.0f} dBFS : " + ("très bien" if floor < -60 else "correct" if floor < -50 else "trop fort (frigo, ventilation, pièce ?)"))
print(f"  niveau de la prise {float(m['input_i']):.0f} LUFS : " + ("bien" if -30 < float(m['input_i']) < -14 else "trop bas : monte le gain" if float(m['input_i']) <= -30 else "trop fort : baisse le gain"))
if pk and max(pk) > -0.5:
    print(f"  ATTENTION saturation (crête {max(pk):.1f} dBFS) : baisse le gain du micro et refais la prise")
print("  sortie : -16 LUFS, crête -1,5 dBTP, mono 48 kHz 24 bits")
