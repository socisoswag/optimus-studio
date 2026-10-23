#!/bin/bash
# Chaîne de tous les rendus du film (bash tools/rendu_tout.sh), relief sur toutes les terres compris, par morceaux de 60 s (reprend où il s'est arrêté) ; marqueurs output/.rendu-ok-<nom>-v2
cd /home/user/optimus-studio/motion-design/sion
exec 9>output/.rendu.lock
flock -n 9 || exit 0
rm -rf /tmp/chrono-* 2>/dev/null
LOG=output/rendu-tout.log
export CRF=20 WORKERS=3
LISTE="suez-1956 six-jours octobre-1973 frontieres nakba-1948 camps liban-1982 gaza gaza-guerres terres-1945 aliyas flux-humains europe-1881-1914 oslo-mur jerusalem noms-effaces deir-yassin trois-promesses chronologie les-noms generique-fin chapitres partie-1 partie-2 partie-3 partie-4 partie-5 partie-6 partie-7 citation-ben-gourion citation-darwich citation-herzl citation-meir chiffre-colons chiffre-zone-c figures-aujourdhui resolutions apartheid-textes genocide-textes documents documents-2 documents-3 documents-7 portraits-1 portraits-2 portraits-3 documents-6"
{
  echo "=== $(date -u +%H:%M) départ"
  for t in $LISTE; do
    if [ ! -f "output/.rendu-ok-$t-v2" ]; then
      echo "=== $(date -u +%H:%M) $t"
      bash tools/rendu_morceaux.sh "$t" && python3 tools/verif_video.py "output/$t.mp4" --timeline "$t" && touch "output/.rendu-ok-$t-v2"
    fi
  done
  # archives filmées restaurées (scintillement lissé, bruit atténué), toutes refaites
  if [ ! -f output/.rendu-ok-archives-v2 ]; then
    python3 tools/archives_filmees.py && touch output/.rendu-ok-archives-v2
  fi
  if [ ! -f output/.rendu-ok-photos-fixes-2 ]; then
    python3 tools/build_reconstitution.py --fixes && touch output/.rendu-ok-photos-fixes-2
  fi
  manque=0
  for m in $LISTE; do [ -f "output/.rendu-ok-$m-v2" ] || { manque=$((manque+1)); echo "manque : $m"; }; done
  [ -f output/.rendu-ok-photos-fixes-2 ] || manque=$((manque+1))
  [ -f output/.rendu-ok-archives-v2 ] || manque=$((manque+1))
  echo "fin: $manque"
} >> $LOG 2>&1
