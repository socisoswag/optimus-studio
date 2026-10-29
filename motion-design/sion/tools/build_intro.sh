#!/usr/bin/env bash
# Fabrique l'intro aérienne : survol en 3D (drone.html), bande-son, finition pellicule, encodage.
#
#   python3 tools/prep_drone.py <cache>   (une fois : relief, images satellite, lumière → data/drone/)
#   tools/build_intro.sh                  → output/intro-aerienne.mp4 + output/intro-aerienne.wav
#   NOTEXT=1 tools/build_intro.sh         → output/intro-aerienne-sans-texte.mp4 (sans lieux ni titre)
#   tools/build_intro.sh archives-vivantes → photos d'archives en relief (INTRO.page = photo3d.html,
#                                           après tools/prep_archives.py)
#
# Variables : WORKERS (4 par défaut), SHUTTER (1 ; 2 pour un flou de bougé), BITRATE, VIDEO_LIST (reprise).
set -euo pipefail
NAME="${1:-intro-aerienne}"
OUTNAME="$NAME"; RFLAGS=""
if [ "${NOTEXT:-0}" = "1" ]; then OUTNAME="$NAME-sans-texte"; RFLAGS="--notext"; fi
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"
mkdir -p output
node -e "require('./timelines/$NAME.js'); console.log(JSON.stringify(globalThis.INTRO))" > "$TMP/intro.json"
# page de rendu : survol 3D (drone.html) par défaut, ou celle que demande la timeline (photo3d.html pour les archives)
PAGE=$(python3 -c "import json; print(json.load(open('$TMP/intro.json')).get('page', 'drone.html'))")
if [ "$PAGE" = "drone.html" ]; then
  [ -f data/drone/meta.json ] || { echo "data/drone/ manque : lancer d'abord tools/prep_drone.py" >&2; exit 1; }
fi

# VIDEO_LIST : liste concat des morceaux d'un rendu déjà fait (render.mjs, /tmp/chrono-*/list.txt) dont
# l'assemblage a échoué (disque plein) : on reprend sans refaire les images
IN=(-i "$TMP/video.mp4")
if [ -n "${VIDEO_LIST:-}" ]; then
  IN=(-f concat -safe 0 -i "$VIDEO_LIST")
else
  node render.mjs --page "$PAGE" --timeline "$NAME" --workers "${WORKERS:-4}" --shutter "${SHUTTER:-1}" --crf 12 $RFLAGS --out "$TMP/video.mp4"
fi
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
ffmpeg -nostdin -y -loglevel error "${IN[@]}" -vf "$FINISH" -c:v libx264 -preset slow -b:v "$B" -maxrate "$B" -bufsize "$B" \
  -tune grain -pix_fmt yuv420p -pass 1 -passlogfile "$TMP/x264" -an -f mp4 /dev/null
ffmpeg -nostdin -y -loglevel error "${IN[@]}" -i "$WAV" -map 0:v -map 1:a -vf "$FINISH" -c:v libx264 -preset slow \
  -b:v "$B" -maxrate "$B" -bufsize "$B" -tune grain -pix_fmt yuv420p -pass 2 -passlogfile "$TMP/x264" \
  -c:a aac -aac_pns 0 -aac_is 0 -b:a 320k -t "$DUR" -movflags +faststart "$TMP/final.mp4"
[ "$WAV" = "$TMP/son.wav" ] && mv "$TMP/son.wav" "output/$NAME.wav"
mv "$TMP/final.mp4" "output/$OUTNAME.mp4"
# plans à monter séparément (INTRO.plans) : un fichier par plan, coupé à l'image près
if python3 -c "import json,sys; sys.exit(0 if json.load(open('$TMP/intro.json')).get('plans') else 1)"; then
  mkdir -p "output/$OUTNAME"
  python3 -c "import json; [print(i + 1, s['id'], s['t0'], s['t1']) for i, s in enumerate(json.load(open('$TMP/intro.json'))['shots'])]" |
  while read -r k id t0 t1; do
    D=$(python3 -c "print(round($t1 - $t0, 3))")
    ffmpeg -nostdin -y -loglevel error -ss "$t0" -i "output/$OUTNAME.mp4" -t "$D" -c:v libx264 -preset slow -b:v "$B" -maxrate "$B" -bufsize "$B" \
      -tune grain -pix_fmt yuv420p -c:a aac -aac_pns 0 -aac_is 0 -b:a 320k -movflags +faststart "output/$OUTNAME/$k-$id.mp4"
  done
  ls -la "output/$OUTNAME"
fi
ls -la "output/$OUTNAME.mp4" "output/$NAME.wav"
