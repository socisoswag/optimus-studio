#!/usr/bin/env bash
# Fabrique une pièce complète : image (flou de bougé), bande-son, assemblage.
#
#   tools/build.sh generique            → output/generique.mp4 + output/generique.wav
#   PREVIEW_DIR=/tmp tools/build.sh generique   → ajoute un aperçu < 29 Mo dans /tmp
#
# Variables : WORKERS (4 par défaut), BITRATE (9000k par défaut).
set -euo pipefail
NAME="${1:?nom de la timeline, ex. generique}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"
mkdir -p output

node render.mjs --timeline "$NAME" --workers "${WORKERS:-4}" --crf 14 --out "$TMP/video.mp4"
node tools/cues.mjs "$NAME" > "$TMP/cues.json"
python3 tools/sound.py "$TMP/cues.json" "output/$NAME.wav"
DUR=$(node -e "require('./core.js'); require('./timelines/$NAME.js'); console.log(globalThis.TL.total)")

encode() { # $1 = débit vidéo, $2 = fichier de sortie, $3 = filtre vidéo
  ffmpeg -y -loglevel error -i "$TMP/video.mp4" -vf "$3" -c:v libx264 -preset slow -b:v "$1" -maxrate "$1" -bufsize "$1" \
    -tune grain -pix_fmt yuv420p -pass 1 -passlogfile "$TMP/x264" -an -f mp4 /dev/null
  ffmpeg -y -loglevel error -i "$TMP/video.mp4" -i "output/$NAME.wav" -map 0:v -map 1:a -vf "$3" -c:v libx264 -preset slow \
    -b:v "$1" -maxrate "$1" -bufsize "$1" -tune grain -pix_fmt yuv420p -pass 2 -passlogfile "$TMP/x264" \
    -c:a aac -b:a 320k -t "$DUR" -movflags +faststart "$2"
}

encode "${BITRATE:-9000k}" "output/$NAME.mp4" null

if [ -n "${PREVIEW_DIR:-}" ]; then
  # aperçu partageable : 29 Mo maximum, en 1080p si possible
  KBPS=$(python3 -c "print(int(29 * 8192 / $DUR - 340))")
  encode "${KBPS}k" "$PREVIEW_DIR/apercu_$NAME.mp4" null
fi
ls -la "output/$NAME.mp4" "output/$NAME.wav"
