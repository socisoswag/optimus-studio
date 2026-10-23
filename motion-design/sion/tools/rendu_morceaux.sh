#!/usr/bin/env bash
# Rendu par morceaux de 60 s, qui reprend après une coupure de la machine :
#
#   bash tools/rendu_morceaux.sh documents-6
#
# Les morceaux finis restent dans output/morceaux/<nom>/ ; relancer la même commande reprend au premier morceau
# manquant. À la fin, tools/build.sh fait le son et la finition à partir des morceaux, puis le dossier est effacé.
set -euo pipefail
NAME="${1:?nom de la timeline}"; STEP="${STEP:-60}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
DIR="output/morceaux/$NAME"; mkdir -p "$DIR"
TOTAL=$(node -e "require('./core.js'); require('./timelines/$NAME.js'); console.log(globalThis.TL.total)")
N=$(python3 -c "import math; print(math.ceil($TOTAL / $STEP))")
: > "$DIR/liste.txt"
for ((k = 0; k < N; k++)); do
  A=$((k * STEP)); B=$(python3 -c "print(min($TOTAL, ($k + 1) * $STEP))")
  F="$DIR/$(printf %03d "$k").mp4"
  if [ ! -s "$F" ]; then
    echo "morceau $((k + 1))/$N : $A à $B s"
    node render.mjs --timeline "$NAME" --from "$A" --to "$B" --workers "${WORKERS:-2}" --shutter "${SHUTTER:-1}" --crf "${CRF:-17}" --out "$F.part.mp4"
    mv "$F.part.mp4" "$F"
  fi
  echo "file '$ROOT/$F'" >> "$DIR/liste.txt"
done
VIDEO_LIST="$ROOT/$DIR/liste.txt" bash tools/build.sh "$NAME"
rm -rf "${DIR:?}"
