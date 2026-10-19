#!/usr/bin/env bash
# Fabrique une pièce complète : image (flou de bougé), bande-son, assemblage.
#
#   tools/build.sh generique            → output/generique.mp4 + output/generique.wav
#   PREVIEW_DIR=/tmp tools/build.sh generique   → ajoute un aperçu < 29 Mo dans /tmp
#
# Variables : WORKERS (4 par défaut), BITRATE (9000k, moins pour tenir sous 95 Mo), NOTEXT=1 (version sans texte).
set -euo pipefail
NAME="${1:?nom de la timeline, ex. generique}"
# NOTEXT=1 : version sans texte (output/<nom>-sans-texte.mp4), même bande-son que la version normale
OUTNAME="$NAME"; RFLAGS=""
if [ "${NOTEXT:-0}" = "1" ]; then OUTNAME="$NAME-sans-texte"; RFLAGS="--notext"; fi
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"
mkdir -p output

# SHUTTER=2 : flou de bougé réel (deux sous-images par image, obturateur à 180°), rendu deux fois plus long
node render.mjs --timeline "$NAME" --workers "${WORKERS:-4}" --shutter "${SHUTTER:-1}" --crf 14 $RFLAGS --out "$TMP/video.mp4"
# tout se fabrique dans $TMP ; les fichiers finis ne rejoignent output/ qu'à la fin (jamais à moitié écrits)
WAV="output/$NAME.wav"
if [ "$OUTNAME" = "$NAME" ] || [ ! -f "output/$NAME.wav" ]; then
  node tools/cues.mjs "$NAME" > "$TMP/cues.json"
  python3 tools/sound.py "$TMP/cues.json" "$TMP/son.wav"
  WAV="$TMP/son.wav"
fi
DUR=$(node -e "require('./core.js'); require('./timelines/$NAME.js'); console.log(globalThis.TL.total)")

# Finition « pellicule » : halo chaud autour des hautes lumières (halation),
# courbe argentique (noirs à peine levés, hautes lumières adoucies) et léger
# flottement de l'image dans le couloir (gate weave).
HAL=$(node -e "global.window={}; require('./data/palette.js'); const h=window.PALETTE.halation; console.log('rr='+h[0]+':gg='+h[1]+':bb='+h[2])")
FINISH="format=gbrp,split=2[a][b];[b]curves=all='0/0 0.6/0 0.85/0.5 1/1',gblur=sigma=26,colorchannelmixer=$HAL[h];[a][h]blend=all_mode=screen:all_opacity=0.38,curves=all='0/0.02 0.18/0.155 0.5/0.49 0.82/0.86 1/0.965',crop=w=1904:h=1071:x='8+1.1*sin(n*0.37)+0.6*sin(n*1.13)':y='4.5+0.9*sin(n*0.29+1)+0.5*sin(n*0.97)',scale=1920:1080:flags=lanczos"

encode() { # $1 = débit vidéo, $2 = fichier de sortie, $3 = filtre vidéo
  ffmpeg -y -loglevel error -i "$TMP/video.mp4" -vf "$3" -c:v libx264 -preset slow -b:v "$1" -maxrate "$1" -bufsize "$1" \
    -tune grain -pix_fmt yuv420p -pass 1 -passlogfile "$TMP/x264" -an -f mp4 /dev/null
  ffmpeg -y -loglevel error -i "$TMP/video.mp4" -i "$WAV" -map 0:v -map 1:a -vf "$3" -c:v libx264 -preset slow \
    -b:v "$1" -maxrate "$1" -bufsize "$1" -tune grain -pix_fmt yuv420p -pass 2 -passlogfile "$TMP/x264" \
    -c:a aac -b:a 320k -t "$DUR" -movflags +faststart "$2"
}

# débit : 9 Mbit/s, abaissé pour les pièces longues afin de rester sous 95 Mo (GitHub refuse plus de 100 Mo)
AUTO=$(python3 -c "print(min(9000, int(95 * 8000 / $DUR - 330)))")
encode "${BITRATE:-${AUTO}k}" "$TMP/final.mp4" "$FINISH"

if [ -n "${PREVIEW_DIR:-}" ]; then
  # aperçu partageable : 29 Mo maximum, en 1080p si possible
  KBPS=$(python3 -c "print(int(29 * 8192 / $DUR - 340))")
  encode "${KBPS}k" "$PREVIEW_DIR/apercu_$NAME.mp4" "$FINISH"
fi
[ "$WAV" = "$TMP/son.wav" ] && mv "$TMP/son.wav" "output/$NAME.wav"
mv "$TMP/final.mp4" "output/$OUTNAME.mp4"
ls -la "output/$OUTNAME.mp4" "output/$NAME.wav"
