#!/usr/bin/env bash
# Intro hybride : l'espace et la mer en 3D, la terre en vrais plans tournés.
#
#   tools/intro_hybride.sh        → output/intro-aerienne.mp4 + output/intro-aerienne.wav (+ pistes séparées)
#
# Il faut :
#   output/intro-aerienne-3d.mp4  l'intro tout en 3D déjà étalonnée (on n'en garde que le début, jusqu'au premier
#                                 plan « plate » de la timeline) ;
#   les vrais plans conformés     tools/plans_reels.sh (chemins dans timelines/intro-aerienne.js, shots[].plate.src).
# La page 3D rend seulement les textes des plans réels (lieux, altimètre, titre) sur fond transparent ; ils sont posés
# sur les vrais plans, réchauffés pour raccorder avec l'aube de la 3D. Passage 3D → réel : un fondu de 0,8 s ; entre
# deux vrais plans : un filé (souffle de la bande-son) puis l'éclair de la mer Morte ; bandes cinéma partout.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
node -e "require('./timelines/intro-aerienne.js'); console.log(JSON.stringify(globalThis.INTRO))" > "$TMP/intro.json"
read -r T0 TOTAL CUT2 TITLE WHIP PLATES < <(python3 - "$TMP/intro.json" <<'EOF'
import json, sys
I = json.load(open(sys.argv[1]))
p = [s for s in I["shots"] if s.get("plate")]
flash = [c["t"] for c in I["fx"]["cuts"] if c["type"] == "flash"]
whip = p[1]["t0"] - p[0]["t0"] if len(p) > 1 else 0   # filé à l'entrée du deuxième vrai plan
print(p[0]["t0"], I["total"], flash[0], flash[1], round(whip, 3),
      ",".join(s["plate"]["src"] + ":" + str(round(s["t1"] - s["t0"], 3)) for s in p))
EOF
)
[ -f output/intro-aerienne-3d.mp4 ] || { echo "output/intro-aerienne-3d.mp4 manque" >&2; exit 1; }

# 1. textes des plans réels, sur fond transparent
nice -n 5 node render.mjs --page drone.html --timeline intro-aerienne --workers 2 --alpha --from "$T0" --to "$TOTAL" --out "$TMP/textes.mov"
# 2. bande-son et pistes séparées de la nouvelle timeline
nice -n 5 python3 tools/sound_intro.py "$TMP/intro.json" "$TMP/son.wav"

# 3. les vrais plans bout à bout, réchauffés, à la durée exacte de leur plan
IN=(); FC=""; k=0
IFS=',' read -ra PL <<< "$PLATES"
for e in "${PL[@]}"; do
  src="${e%:*}"; d="${e##*:}"
  IN+=(-i "$src")
  FC+="[$((k + 2)):v]trim=0:$d,setpts=PTS-STARTPTS,colorbalance=rs=0.05:bs=-0.06:rm=0.06:gm=0.01:bm=-0.06:rh=0.04:bh=-0.05,eq=saturation=1.05[p$k];"
  k=$((k + 1))
done
r(){ python3 -c "print(round($1, 3))"; }
PLATE_D=$(r "$TOTAL - $T0"); C2=$(r "$CUT2 - $T0"); CT=$(r "$TITLE - $T0"); FO=$(r "$TOTAL - $T0 - 1.6")
# filé : flou horizontal qui retombe en 0,32 s à l'entrée du deuxième vrai plan
W=$WHIP
python3 -c "
w = $W
print(''.join(f'{w + 0.04 * i:.2f} dblur radius {r};\\n' for i, r in enumerate([70, 52, 36, 24, 14, 7, 3, 1, 0.01])))" > "$TMP/file.cmd"
FC+="$(for j in $(seq 0 $((k - 1))); do printf '[p%d]' "$j"; done)concat=n=$k:v=1:a=0,format=yuv420p,sendcmd=f=$TMP/file.cmd,dblur=angle=0:radius=0.01:enable='between(t,$W,$(r "$W + 0.34"))'[pl];"
# éclairs : coupe vers la mer Morte (chaud, net) et arrivée du titre (braise, léger)
FC+="color=c=0xFFDBB3:s=1920x1080:r=25:d=0.6,format=rgba,fade=t=in:st=0:d=0.14:alpha=1,fade=t=out:st=0.14:d=0.45:alpha=1,setpts=PTS-STARTPTS+($C2-0.14)/TB[f1];"
FC+="color=c=0xFF8C40@0.28:s=1920x1080:r=25:d=0.56,format=rgba,fade=t=in:st=0:d=0.05:alpha=1,fade=t=out:st=0.05:d=0.5:alpha=1,setpts=PTS-STARTPTS+($CT-0.05)/TB[f2];"
FC+="[pl][f1]overlay=eof_action=pass[x1];[x1][f2]overlay=eof_action=pass[x2];"
FC+="[1:v]setpts=PTS-STARTPTS[tx];[x2][tx]overlay=0:0:eof_action=pass,noise=c0s=3:c0f=t+u:c1s=0:c2s=0,"
FC+="drawbox=x=0:y=0:w=1920:h=138:color=black:t=fill,drawbox=x=0:y=942:w=1920:h=138:color=black:t=fill,"
FC+="fade=t=out:st=$FO:d=1.6,trim=0:$PLATE_D,setpts=PTS-STARTPTS,format=yuv420p,setsar=1,"
# fondu 3D → réel centré sur T0 : 0,4 s d'image figée devant le vrai plan pour garder la synchronisation
FC+="tpad=start_duration=0.4:start_mode=clone,fps=25,settb=AVTB[reel];"
# ciel de la mer en 3D : le haut assombri en dégradé, comme un filtre gradué de chef opérateur
FC+="[0:v]trim=0:$(r "$T0 + 0.4"),setpts=PTS-STARTPTS,format=yuv444p,"
FC+="geq=lum='lum(X,Y)*(1-0.32*pow(clip(1-(Y-138)/(H*0.36),0,1),1.5))':cb='cb(X,Y)':cr='cr(X,Y)':enable='gte(t,23)',"
FC+="format=yuv420p,setsar=1,fps=25,settb=AVTB[d3];[d3][reel]xfade=transition=fade:duration=0.8:offset=$(r "$T0 - 0.4"),format=yuv420p[v]"

AUTO=$(python3 -c "print(min(12000, int(95 * 8000 / $TOTAL - 330)))")
B="${BITRATE:-${AUTO}k}"
nice -n 5 ffmpeg -nostdin -y -loglevel error -i output/intro-aerienne-3d.mp4 -i "$TMP/textes.mov" "${IN[@]}" -filter_complex "$FC" -map "[v]" \
  -c:v libx264 -preset slow -b:v "$B" -maxrate "$B" -bufsize "$B" -tune grain -pix_fmt yuv420p -pass 1 -passlogfile "$TMP/x264" -an -f mp4 /dev/null
nice -n 5 ffmpeg -nostdin -y -loglevel error -i output/intro-aerienne-3d.mp4 -i "$TMP/textes.mov" "${IN[@]}" -i "$TMP/son.wav" -filter_complex "$FC" \
  -map "[v]" -map "$((k + 2)):a" -c:v libx264 -preset slow -b:v "$B" -maxrate "$B" -bufsize "$B" -tune grain -pix_fmt yuv420p -pass 2 \
  -passlogfile "$TMP/x264" -c:a aac -b:a 320k -t "$TOTAL" -movflags +faststart "$TMP/final.mp4"
mv "$TMP/son.wav" output/intro-aerienne.wav
mv "$TMP/final.mp4" output/intro-aerienne.mp4
ls -la output/intro-aerienne.mp4 output/intro-aerienne.wav
