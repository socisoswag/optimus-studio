#!/usr/bin/env bash
# Fabrique l'intro aérienne : survol en 3D (drone.html), bande-son, finition pellicule, encodage.
#
#   python3 tools/prep_drone.py <cache>   (une fois : relief, images satellite, lumière → data/drone/)
#   tools/build_intro.sh                  → output/intro-aerienne.mp4 + output/intro-aerienne.wav
#   NOTEXT=1 tools/build_intro.sh         → output/intro-aerienne-sans-texte.mp4 (sans lieux ni titre)
#
# Variables : WORKERS (4 par défaut), SHUTTER (1 ; 2 pour un flou de bougé), BITRATE.
set -euo pipefail
NAME="${1:-intro-aerienne}"
OUTNAME="$NAME"; RFLAGS=""
if [ "${NOTEXT:-0}" = "1" ]; then OUTNAME="$NAME-sans-texte"; RFLAGS="--notext"; fi
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"
mkdir -p output
[ -f data/drone/meta.json ] || { echo "data/drone/ manque : lancer d'abord tools/prep_drone.py" >&2; exit 1; }

node render.mjs --page drone.html --timeline "$NAME" --workers "${WORKERS:-4}" --shutter "${SHUTTER:-1}" --crf 12 $RFLAGS --out "$TMP/video.mp4"
node -e "require('./timelines/$NAME.js'); console.log(JSON.stringify(globalThis.INTRO))" > "$TMP/intro.json"
WAV="output/$NAME.wav"
if [ "$OUTNAME" = "$NAME" ] || [ ! -f "$WAV" ]; then
  python3 tools/sound_intro.py "$TMP/intro.json" "$TMP/son.wav"
  WAV="$TMP/son.wav"
fi
DUR=$(python3 -c "import json; print(json.load(open('$TMP/intro.json'))['total'])")

# même finition que tools/build.sh : halo chaud des hautes lumières, courbe argentique, flottement
HAL=$(node -e "global.window={}; require('./data/palette.js'); const h=window.PALETTE.halation; console.log('rr='+h[0]+':gg='+h[1]+':bb='+h[2])")
FINISH="format=gbrp,split=2[a][b];[b]curves=all='0/0 0.6/0 0.85/0.5 1/1',gblur=sigma=26,colorchannelmixer=$HAL[h];[a][h]blend=all_mode=screen:all_opacity=0.30,curves=all='0/0.02 0.18/0.155 0.5/0.49 0.82/0.86 1/0.965',crop=w=1904:h=1071:x='8+1.1*sin(n*0.37)+0.6*sin(n*1.13)':y='4.5+0.9*sin(n*0.29+1)+0.5*sin(n*0.97)',scale=1920:1080:flags=lanczos"

AUTO=$(python3 -c "print(min(12000, int(95 * 8000 / $DUR - 330)))")
B="${BITRATE:-${AUTO}k}"
ffmpeg -nostdin -y -loglevel error -i "$TMP/video.mp4" -vf "$FINISH" -c:v libx264 -preset slow -b:v "$B" -maxrate "$B" -bufsize "$B" \
  -tune grain -pix_fmt yuv420p -pass 1 -passlogfile "$TMP/x264" -an -f mp4 /dev/null
ffmpeg -nostdin -y -loglevel error -i "$TMP/video.mp4" -i "$WAV" -map 0:v -map 1:a -vf "$FINISH" -c:v libx264 -preset slow \
  -b:v "$B" -maxrate "$B" -bufsize "$B" -tune grain -pix_fmt yuv420p -pass 2 -passlogfile "$TMP/x264" \
  -c:a aac -b:a 320k -t "$DUR" -movflags +faststart "$TMP/final.mp4"
[ "$WAV" = "$TMP/son.wav" ] && mv "$TMP/son.wav" "output/$NAME.wav"
mv "$TMP/final.mp4" "output/$OUTNAME.mp4"
ls -la "output/$OUTNAME.mp4" "output/$NAME.wav"
