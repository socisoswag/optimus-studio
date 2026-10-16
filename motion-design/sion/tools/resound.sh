#!/usr/bin/env bash
# Refait la bande-son de pièces déjà rendues, sans toucher à l'image (copie du flux vidéo).
# Utile après un changement de tools/sound.py (par exemple MUSIC=1 pour remettre la musique).
#
#   tools/resound.sh generique partie-1 …     (sans argument : toutes les pièces de output/)
#   tools/resound.sh chapitres                 → les 39 cartons et la bobine complète
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"

if [ $# -eq 0 ]; then
  set -- $(ls output/*.mp4 | xargs -n1 basename | sed 's/\.mp4$//' | grep -v '^SION-' | grep -v '^chapitres$') chapitres
fi

for NAME in "$@"; do
  node tools/cues.mjs "$NAME" > "$TMP/cues.json"
  if [ "$NAME" = chapitres ]; then
    python3 tools/sound.py "$TMP/cues.json" "$TMP/son.wav"
    CARD=$(node -e "require('./core.js'); require('./timelines/chapitres.js'); console.log(globalThis.TL.cardDur)")
    for f in output/chapitres/chapitre-*.mp4; do
      i=$((10#$(basename "$f" .mp4 | sed 's/chapitre-//') - 1))
      START=$(python3 -c "print($i * $CARD)")
      ffmpeg -y -loglevel error -i "$f" -ss "$START" -t "$CARD" -i "$TMP/son.wav" -map 0:v -map 1:a -c:v copy \
        -af "afade=t=in:d=0.08,afade=t=out:st=$(python3 -c "print($CARD - 0.35)"):d=0.35" -c:a aac -b:a 320k \
        -movflags +faststart "$TMP/carte.mp4"
      mv "$TMP/carte.mp4" "$f"
    done
    ffmpeg -y -loglevel error -i output/chapitres.mp4 -i "$TMP/son.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k \
      -shortest -movflags +faststart "$TMP/bobine.mp4"
    mv "$TMP/bobine.mp4" output/chapitres.mp4
  else
    python3 tools/sound.py "$TMP/cues.json" "output/$NAME.wav"
    ffmpeg -y -loglevel error -i "output/$NAME.mp4" -i "output/$NAME.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k \
      -shortest -movflags +faststart "$TMP/piece.mp4"
    mv "$TMP/piece.mp4" "output/$NAME.mp4"
  fi
  echo "son refait : $NAME"
done
