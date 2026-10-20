#!/usr/bin/env bash
# Intro hybride : l'espace et la mer en 3D, la terre en vrais plans tournés.
#
#   tools/intro_hybride.sh        → output/intro-aerienne.mp4 + output/intro-aerienne.wav (+ pistes séparées)
#
# Il faut :
#   output/intro-aerienne-3d.mp4  l'intro tout en 3D déjà étalonnée (on n'en garde que le début, jusqu'au premier
#                                 plan « plate » de la timeline) ;
#   les vrais plans conformés     tools/plans_reels.sh (chemins dans timelines/intro-aerienne.js, shots[].plate.src).
# La page 3D rend seulement les textes des plans réels (lieux, altimètre, titre) sur fond transparent ; ils sont posés
# sur les vrais plans, réchauffés pour raccorder avec l'aube de la 3D, avec le filé d'entrée, les éclairs et les bandes.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
node -e "require('./timelines/intro-aerienne.js'); console.log(JSON.stringify(globalThis.INTRO))" > "$TMP/intro.json"
read -r T0 TOTAL CUT2 TITLE PLATES < <(python3 - "$TMP/intro.json" <<'EOF'
import json, sys
I = json.load(open(sys.argv[1]))
p = [s for s in I["shots"] if s.get("plate")]
flash = [c["t"] for c in I["fx"]["cuts"] if c["type"] == "flash"]
print(p[0]["t0"], I["total"], flash[0], flash[1], ",".join(s["plate"]["src"] + ":" + str(s["t1"] - s["t0"]) for s in p))
EOF
)
[ -f output/intro-aerienne-3d.mp4 ] || { echo "output/intro-aerienne-3d.mp4 manque" >&2; exit 1; }

# 1. textes des plans réels, sur fond transparent
nice -n 5 node render.mjs --page drone.html --timeline intro-aerienne --workers 2 --alpha --from "$T0" --to "$TOTAL" --out "$TMP/textes.mov"
# 2. bande-son et pistes séparées de la nouvelle timeline
nice -n 5 python3 tools/sound_intro.py "$TMP/intro.json" "$TMP/son.wav"

# 3. les vrais plans bout à bout, réchauffés, à la durée exacte de leur plan
IN=(); FC=""; k=0
IFS=',' read -ra PL <<< "$PLATES"
for e in "${PL[@]}"; do
  src="${e%:*}"; d="${e##*:}"
  IN+=(-i "$src")
  FC+="[$((k + 2)):v]trim=0:$d,setpts=PTS-STARTPTS,colorbalance=rs=0.05:bs=-0.06:rm=0.06:gm=0.01:bm=-0.06:rh=0.04:bh=-0.05,eq=saturation=1.05[p$k];"
  k=$((k + 1))
done
PLATE_D=$(python3 -c "print(round($TOTAL - $T0, 3))")
C2=$(python3 -c "print(round($CUT2 - $T0, 3))"); CT=$(python3 -c "print(round($TITLE - $T0, 3))")
FO=$(python3 -c "print(round($TOTAL - $T0 - 1.6, 3))")
# filé d'entrée : flou horizontal qui retombe en 0,32 s, comme la sortie du plan 3D
printf '0.00 dblur radius 70;\n0.04 dblur radius 52;\n0.08 dblur radius 36;\n0.12 dblur radius 24;\n0.16 dblur radius 14;\n0.20 dblur radius 7;\n0.24 dblur radius 3;\n0.28 dblur radius 1;\n0.32 dblur radius 0.01;\n' > "$TMP/file.cmd"
FC+="$(for j in $(seq 0 $((k - 1))); do printf '[p%d]' "$j"; done)concat=n=$k:v=1:a=0,format=yuv420p,sendcmd=f=$TMP/file.cmd,dblur=angle=0:radius=70:enable='lt(t,0.34)'[pl];"
# éclairs : coupe vers la mer Morte (chaud, net) et arrivée du titre (braise, léger)
FC+="color=c=0xFFDBB3:s=1920x1080:r=25:d=0.6,format=rgba,fade=t=in:st=0:d=0.14:alpha=1,fade=t=out:st=0.14:d=0.45:alpha=1,setpts=PTS-STARTPTS+($C2-0.14)/TB[f1];"
FC+="color=c=0xFF8C40@0.28:s=1920x1080:r=25:d=0.56,format=rgba,fade=t=in:st=0:d=0.05:alpha=1,fade=t=out:st=0.05:d=0.5:alpha=1,setpts=PTS-STARTPTS+($CT-0.05)/TB[f2];"
FC+="[pl][f1]overlay=eof_action=pass[x1];[x1][f2]overlay=eof_action=pass[x2];"
FC+="[1:v]setpts=PTS-STARTPTS[tx];[x2][tx]overlay=0:0:eof_action=pass,noise=c0s=3:c0f=t+u:c1s=0:c2s=0,"
FC+="drawbox=x=0:y=0:w=1920:h=138:color=black:t=fill,drawbox=x=0:y=942:w=1920:h=138:color=black:t=fill,"
FC+="fade=t=out:st=$FO:d=1.6,trim=0:$PLATE_D,setpts=PTS-STARTPTS,format=yuv420p,setsar=1[reel];"
FC+="[0:v]trim=0:$T0,setpts=PTS-STARTPTS,format=yuv420p,setsar=1[d3];[d3][reel]concat=n=2:v=1:a=0[v]"

AUTO=$(python3 -c "print(min(12000, int(95 * 8000 / $TOTAL - 330)))")
B="${BITRATE:-${AUTO}k}"
nice -n 5 ffmpeg -nostdin -y -loglevel error -i output/intro-aerienne-3d.mp4 -i "$TMP/textes.mov" "${IN[@]}" -filter_complex "$FC" -map "[v]" \
  -c:v libx264 -preset slow -b:v "$B" -maxrate "$B" -bufsize "$B" -tune grain -pix_fmt yuv420p -pass 1 -passlogfile "$TMP/x264" -an -f mp4 /dev/null
nice -n 5 ffmpeg -nostdin -y -loglevel error -i output/intro-aerienne-3d.mp4 -i "$TMP/textes.mov" "${IN[@]}" -i "$TMP/son.wav" -filter_complex "$FC" \
  -map "[v]" -map "$((k + 2)):a" -c:v libx264 -preset slow -b:v "$B" -maxrate "$B" -bufsize "$B" -tune grain -pix_fmt yuv420p -pass 2 \
  -passlogfile "$TMP/x264" -c:a aac -b:a 320k -t "$TOTAL" -movflags +faststart "$TMP/final.mp4"
mv "$TMP/son.wav" output/intro-aerienne.wav
mv "$TMP/final.mp4" output/intro-aerienne.mp4
ls -la output/intro-aerienne.mp4 output/intro-aerienne.wav
