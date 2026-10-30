#!/usr/bin/env bash
# Vrais plans (Adobe Stock, archives) mis au format du film : 1080p 25 i/s, look SION (tools/looks.py),
# finition pellicule, grain et vignette ; sortie output/plans-reels/<nom>.mp4, sans son.
#
#   tools/plans_reels.sh <fichier source> <nom> <look|aucun>
#   tools/plans_reels.sh lot <fichier id|nom|look|url>     télécharge, met au format, efface la source
#
# Cadence, sans jamais sauter ni doubler une image (un saut se voit comme une saccade sur un survol) : 23,976 et
# 24 i/s passent à 25 (4 % plus vite, comme à la télévision) ; 29,97 et 30 i/s gardent toutes leurs images, jouées à
# 25 (17 % plus lent) ; 50 i/s une image sur deux ; 59,94 et 60 i/s une sur deux, jouées à 25 (17 % plus lent).
# Pas de flottement de l'image : sur une vraie prise moderne, il se lit comme un tremblement.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p output/plans-reels data/stock

conforme() {
  local src="$1" nom="$2" look="$3"
  local fps
  fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$src")
  local cad
  case "$fps" in
    24000/1001) cad="setpts=PTS*24000/25025,fps=25" ;;
    24/1) cad="setpts=PTS*24/25,fps=25" ;;
    30000/1001) cad="setpts=PTS*30000/25025,fps=25" ;;
    30/1) cad="setpts=PTS*30/25,fps=25" ;;
    60000/1001 | 60/1) cad="select='not(mod(n\,2))',setpts=N/25/TB,fps=25" ;;
    *) cad="fps=25" ;;
  esac
  local hal
  hal=$(node -e "global.window={}; require('./data/palette.js'); const h=window.PALETTE.halation; console.log('rr='+h[0]+':gg='+h[1]+':bb='+h[2])")
  local fin="format=gbrp,split=2[a][b];[b]curves=all='0/0 0.6/0 0.85/0.5 1/1',gblur=sigma=26,colorchannelmixer=$hal[h];[a][h]blend=all_mode=screen:all_opacity=0.30,curves=all='0/0.02 0.18/0.155 0.5/0.49 0.82/0.86 1/0.965',crop=w=1904:h=1071:x=8:y=4,scale=1920:1080:flags=lanczos"
  local lut=""
  [ "$look" != aucun ] && lut="unsharp=lx=13:ly=13:la=0.5:cx=5:cy=5:ca=0,lut3d=file=data/looks/$look.cube:interp=tetrahedral,"
  local grain=4
  [ "$look" = archive ] || [ "$look" = aucun ] && grain=7
  ffmpeg -nostdin -y -loglevel error -i "$src" -an \
    -vf "$cad,scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,${lut}${fin},noise=c0s=$grain:c0f=t+u:c1s=0:c2s=0,vignette=angle=PI/5,format=yuv420p,setsar=1" \
    -c:v libx264 -preset slow -crf 18 -tune film -movflags +faststart "output/plans-reels/$nom.mp4"
  echo "$nom $(ffprobe -v error -show_entries format=duration -of csv=p=0 "output/plans-reels/$nom.mp4") s ($fps)"
}

if [ "${1:-}" = lot ]; then
  while IFS='|' read -r id nom look url; do
    [ -n "$id" ] || continue
    src="data/stock/$id.mov"
    [ -f "$src" ] || curl -sS -L --max-time 900 -o "$src" "$url"
    conforme "$src" "$nom" "$look" && rm -f "$src"
  done < "$2"
else
  conforme "$1" "$2" "$3"
fi
