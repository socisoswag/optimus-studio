#!/usr/bin/env bash
# Teaser sans voix (≈ 50 s) : les cartons de timelines/teaser-cartons.js, intercalés avec des plans tirés
# des pièces finies d'output/. Chaque plan est recoupé à l'image près, avec un fondu son de 30 ms aux
# coupes, puis le tout est réencodé en 1080p 25 i/s, sous 95 Mo.
#
#   tools/build.sh teaser-cartons && tools/teaser.sh     → output/SION-teaser-1080p.mp4
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"

# pièce, début (s), durée (s) ; pour « teaser-cartons », chaque fenêtre commence après la sortie floue
# du mot précédent et s'arrête avant celle du sien
PLAN=(
  "teaser-cartons 0 2.62"       # Une idée.
  "sion-le-mot 9.5 2.4"
  "teaser-cartons 2.92 2.13"    # Une terre.
  "partage-1947 44.9 2.3"
  "teaser-cartons 5.24 2.41"    # Un choc.
  "nakba-1948 13 2.2"
  # rafale, dans l'ordre de l'histoire
  "europe-1881-1914 46.5 1.6"
  "partage-1947 7.6 1.6"
  "deir-yassin 10.6 1.6"
  "flux-humains 12 1.6"
  "six-jours 21.5 1.6"
  "liban-1982 57.5 1.6"
  "frontieres 18.8 1.6"
  "oslo-mur 29.5 1.6"
  "noms-effaces 20.9 1.6"
  "apartheid-textes 50 1.6"
  "guerre-numerique 21.9 1.6"
  "gaza 69.5 1.6"
  "teaser-cartons 7.86 3.38"    # Un siècle
  "generique 29.5 4.4"          # SION
  "teaser-cartons 11.47 3.33"   # Bientôt
)

LIST="$TMP/liste.txt"; : > "$LIST"
i=0
for p in "${PLAN[@]}"; do
  read -r src ss dur <<< "$p"
  i=$((i + 1))
  out="$TMP/$(printf %02d $i).mkv"
  # -ss avant -i avec réencodage : coupe exacte ; vidéo quasi sans perte pour l'encodage final
  ffmpeg -nostdin -y -loglevel error -ss "$ss" -i "output/$src.mp4" -t "$dur" \
    -vf "fps=25,format=yuv420p" -c:v libx264 -preset veryfast -crf 8 \
    -af "aresample=48000,afade=t=in:d=0.03,afade=t=out:st=$(python3 -c "print(round($dur - 0.03, 3))"):d=0.03" \
    -c:a pcm_s16le -ar 48000 -ac 2 "$out"
  echo "file '$out'" >> "$LIST"
done

ffmpeg -nostdin -y -loglevel error -f concat -safe 0 -i "$LIST" -c copy "$TMP/brut.mkv"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/brut.mkv")
# fondu au noir sur les 0,4 dernières secondes, image et son
FIN="fade=t=out:st=$(python3 -c "print(round($DUR - 0.4, 3))"):d=0.4"
AFIN="afade=t=out:st=$(python3 -c "print(round($DUR - 0.4, 3))"):d=0.4"
# volume : -16 LUFS pour YouTube (les pièces sont mixées plus bas, pour passer sous la voix) ; gain fixe
# mesuré sur l'ensemble puis limiteur à -1,5 dB, pour garder les écarts entre les coups et les silences
I=$(ffmpeg -nostdin -i "$TMP/brut.mkv" -af "$AFIN,loudnorm=print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p' | python3 -c "import json,sys; print(json.load(sys.stdin)['input_i'])")
AFIN="$AFIN,volume=$(python3 -c "print(round(-16 - $I, 2))")dB,alimiter=limit=0.84:attack=5:release=60:level=false"
KBPS=$(python3 -c "print(min(12000, int(95 * 8000 / $DUR - 330)))")
ffmpeg -nostdin -y -loglevel error -i "$TMP/brut.mkv" -vf "$FIN" -c:v libx264 -preset slow -b:v "${KBPS}k" -maxrate "${KBPS}k" -bufsize "${KBPS}k" \
  -tune grain -pix_fmt yuv420p -pass 1 -passlogfile "$TMP/x264" -an -f mp4 /dev/null
ffmpeg -nostdin -y -loglevel error -i "$TMP/brut.mkv" -vf "$FIN" -af "$AFIN" -c:v libx264 -preset slow -b:v "${KBPS}k" -maxrate "${KBPS}k" -bufsize "${KBPS}k" \
  -tune grain -pix_fmt yuv420p -pass 2 -passlogfile "$TMP/x264" -c:a aac -aac_pns 0 -aac_is 0 -b:a 320k -movflags +faststart "$TMP/teaser.mp4"
mv "$TMP/teaser.mp4" output/SION-teaser-1080p.mp4
ls -la output/SION-teaser-1080p.mp4
