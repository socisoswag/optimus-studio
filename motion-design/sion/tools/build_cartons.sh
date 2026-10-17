#!/usr/bin/env bash
# Cartons à poser sur les images (lieu et date, mentions de source), fond transparent :
# un seul rendu (timelines/cartons.js), puis un fichier MOV par carton dans output/cartons/
# (codec PNG avec couche alpha : Premiere, DaVinci Resolve, Final Cut le lisent directement).
#
#   tools/build_cartons.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"
mkdir -p output/cartons

node render.mjs --timeline cartons --alpha --workers "${WORKERS:-4}" --out "$TMP/cartons.mov"
CARD=$(node -e "require('./core.js'); require('./timelines/cartons.js'); console.log(globalThis.TL.cardDur)")
node -e "require('./core.js'); require('./timelines/cartons.js'); globalThis.TL.segments.forEach((s, i) => console.log(i, s.id))" | while read -r i id; do
  START=$(python3 -c "print($i * $CARD)")
  ffmpeg -y -loglevel error -ss "$START" -t "$CARD" -i "$TMP/cartons.mov" -c:v png -pix_fmt rgba -an "output/cartons/$(printf '%02d' $((i + 1)))-$id.mov" < /dev/null
  echo "$(printf '%02d' $((i + 1)))-$id"
done
du -sh output/cartons
