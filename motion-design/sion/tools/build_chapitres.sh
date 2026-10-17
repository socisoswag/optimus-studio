#!/usr/bin/env bash
# Fabrique les 39 titres de chapitre : un seul rendu (timelines/chapitres.js),
# puis un fichier MP4 par chapitre dans output/chapitres/, plus la bobine complète.
#
#   tools/build_chapitres.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"
mkdir -p output/chapitres

node render.mjs --timeline chapitres --workers "${WORKERS:-4}" --crf 14 --out "$TMP/video.mp4"
node tools/cues.mjs chapitres > "$TMP/cues.json"
python3 tools/sound.py "$TMP/cues.json" "$TMP/son.wav"

# même finition « pellicule » que tools/build.sh
FINISH="$(grep '^FINISH=' tools/build.sh | sed 's/^FINISH="//; s/"$//')"
HAL=$(node -e "global.window={}; require('./data/palette.js'); const h=window.PALETTE.halation; console.log('rr='+h[0]+':gg='+h[1]+':bb='+h[2])")
FINISH="${FINISH//\$HAL/$HAL}"  # halo aux couleurs de data/palette.js
CARD=$(node -e "require('./core.js'); require('./timelines/chapitres.js'); console.log(globalThis.TL.cardDur)")
N=$(node -e "require('./core.js'); require('./timelines/chapitres.js'); console.log(globalThis.TL.segments.length)")

for i in $(seq 0 $((N - 1))); do
  NUM=$(printf "%02d" $((i + 1)))
  START=$(python3 -c "print($i * $CARD)")
  ffmpeg -y -loglevel error -ss "$START" -t "$CARD" -i "$TMP/video.mp4" -ss "$START" -t "$CARD" -i "$TMP/son.wav" \
    -map 0:v -map 1:a -vf "$FINISH" -c:v libx264 -preset slow -b:v 10M -maxrate 14M -bufsize 20M -tune grain -pix_fmt yuv420p \
    -af "afade=t=in:d=0.08,afade=t=out:st=$(python3 -c "print($CARD - 0.35)"):d=0.35" -c:a aac -b:a 320k \
    -movflags +faststart "output/chapitres/chapitre-$NUM.mp4"
  echo "chapitre-$NUM"
done

# bobine complète (pour visionner d'une traite)
ffmpeg -y -loglevel error -i "$TMP/video.mp4" -i "$TMP/son.wav" -map 0:v -map 1:a -vf "$FINISH" -c:v libx264 -preset slow \
  -b:v 3500k -maxrate 5000k -bufsize 8M -tune grain -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart \
  "output/chapitres.mp4"
ls -la output/chapitres | tail -3
ls -la output/chapitres.mp4
