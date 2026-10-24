#!/bin/bash
# Rendus dans l'ordre du film (bash tools/rendu_par_partie.sh) : les pièces de l'ouverture, puis de la partie I, etc. ;
# chaque partie part sur Montage-Moyen-orient (tools/livrer_derush.sh) dès que toutes ses pièces sont rendues et
# contrôlées, jamais avant (un plan décalé garderait sinon l'ancien fichier de son numéro). Reprend où il s'est arrêté :
# marqueurs output/.rendu-ok-<nom>-v2 (pièces) et output/.livre-<partie>-v3 (livraisons).
cd /home/user/optimus-studio/motion-design/sion
exec 9>output/.rendu.lock
flock -n 9 || exit 0
find /tmp -maxdepth 1 -name "chrono-*" -mmin +30 -exec rm -rf {} + 2>/dev/null  # restes de rendus tués (un rendu en cours écrit sans cesse dans le sien)
LOG=output/rendu-tout.log
export CRF=20 WORKERS=3
LISTE=$(grep -o 'LISTE="[^"]*"' tools/rendu_tout.sh | head -1 | cut -d'"' -f2)
rendre() {
  [ -f "output/.rendu-ok-$1-v2" ] && return 0
  echo "=== $(date -u +%H:%M) $1"
  if grep -q "root.INTRO = " "timelines/$1.js"; then
    # survols (drone.html, photo3d.html) : rendus par tools/build_intro.sh ; un rendu plus récent que sa timeline et sa page est gardé
    local PAGE
    PAGE=$(node -e "require('./timelines/$1.js'); console.log(globalThis.INTRO.page || 'drone.html')")
    if [ ! -s "output/$1.mp4" ] || [ "timelines/$1.js" -nt "output/$1.mp4" ] || [ "$PAGE" -nt "output/$1.mp4" ] || [ "${PAGE%.html}.js" -nt "output/$1.mp4" ]; then
      bash tools/build_intro.sh "$1" || return 1
    fi
    python3 tools/verif_video.py "output/$1.mp4" --timeline "$1" --page "$PAGE" && touch "output/.rendu-ok-$1-v2"
    return
  fi
  bash tools/rendu_morceaux.sh "$1" && python3 tools/verif_video.py "output/$1.mp4" --timeline "$1" && touch "output/.rendu-ok-$1-v2"
}
{
  echo "=== $(date -u +%H:%M) départ (ordre du film)"
  for key in 0 1 2 3 4 5 6 7 8; do
    PIECES=$(python3 tools/pieces_partie.py "$key" $LISTE)
    for t in $PIECES; do rendre "$t"; done
    pret=1
    for t in $PIECES; do [ -f "output/.rendu-ok-$t-v2" ] || pret=0; done
    if [ "$pret" = 1 ] && [ ! -f "output/.livre-$key-v3" ]; then
      echo "=== $(date -u +%H:%M) livraison de la partie $key"
      bash tools/livrer_derush.sh "$key" && touch "output/.livre-$key-v3"
    fi
  done
  # pièces de la liste qu'aucune partie ne cite (teaser, réserve)
  for t in $LISTE; do rendre "$t"; done
  manque=0
  for m in $LISTE; do [ -f "output/.rendu-ok-$m-v2" ] || { manque=$((manque+1)); echo "manque : $m"; }; done
  for key in 0 1 2 3 4 5 6 7 8; do [ -f "output/.livre-$key-v3" ] || { manque=$((manque+1)); echo "pas livrée : partie $key"; }; done
  echo "fin: $manque"
} >> $LOG 2>&1
