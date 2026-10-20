#!/usr/bin/env bash
# Livre le dossier plan par plan (tools/derush.py) dans le dépôt de montage, une partie par envoi : clone partiel
# (sans les vidéos déjà livrées), coupe des plans de la partie, envoi, puis le clone est effacé. Le disque ne garde
# jamais plus d'une partie à la fois.
#
#   bash tools/livrer_derush.sh 0 1 2      (ouverture, partie I, partie II ; 8 = conclusion)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
REPO="${MONTAGE_REPO:-https://github.com/socisoswag/montage-moyen-orient}"
W="${WORK:-$(dirname "$(dirname "$(dirname "$ROOT")")")/_livraison-sion}"
push() {
  for d in 2 4 8 16 0; do
    git -C "$W" push -q origin HEAD:main && return 0
    [ "$d" = 0 ] && return 1
    echo "envoi refusé, nouvel essai dans $d s" >&2; sleep "$d"
  done
}
for key in "$@"; do
  folder=$(python3 -c "import sys; sys.path.insert(0, 'tools'); import derush; print(next(f for _, f, k in derush.PARTS if k == '$key'))")
  rm -rf "${W:?}"
  git clone -q --filter=blob:none --sparse "$REPO" "$W"
  git -C "$W" sparse-checkout set "SION/Script" "SION/$folder"
  MONTAGE_DIR="$W/SION" nice -n 5 python3 tools/derush.py "$key"
  big=$(find "$W/SION" -type f -size +95M)
  [ -z "$big" ] || { echo "trop gros pour GitHub (plus de 95 Mo) : $big" >&2; exit 1; }
  git -C "$W" add -A SION
  if git -C "$W" diff --cached --quiet; then
    echo "$folder : rien de nouveau"
  else
    git -C "$W" commit -q -F - <<EOF
SION : $folder, un fichier par plan du script

Coupés à l'image près dans les pièces rendues, numérotés dans l'ordre du film ; PLANS.md dans chaque
chapitre (texte à l'écran, voix off, plans pas encore en vidéo).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Up6uBitdRxnv9kmecRQqy1
EOF
    git -C "$W" config http.postBuffer 524288000
    push
    echo "$folder : envoyé ($(du -sh "$W/SION/$folder" | cut -f1))"
  fi
  rm -rf "${W:?}"
done
