#!/usr/bin/env bash
# Livre le dossier plan par plan (tools/derush.py) dans le dépôt de montage, une partie par envoi : clone partiel
# (sans les vidéos déjà livrées), coupe des plans de la partie, envoi, puis le clone est effacé. Le disque ne garde
# jamais plus d'une partie à la fois.
# Les anciennes vidéos de la partie ne sont pas téléchargées quand tous ses plans ont leur rendu sur cette machine
# (ils sont tous recoupés) : la partie la plus lourde tient ainsi dans 3 Go au lieu de 4,5. Sinon (rendu absent, plan
# déjà livré à garder tel quel), la partie est récupérée en entier comme avant.
#
#   bash tools/livrer_derush.sh 0 1 2      (ouverture, partie I, partie II ; 8 = conclusion)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
REPO="${MONTAGE_REPO:-https://github.com/socisoswag/Montage-Moyen-orient}"
W="${WORK:-$(dirname "$(dirname "$(dirname "$ROOT")")")/_livraison-sion}"
# un envoi raté (disque plein, réseau) ne laisse pas son clone sur le disque
trap 'rm -rf "${W:?}"' EXIT
push() {
  for d in 2 4 8 16 0; do
    # sans « thin pack » ni recherche de deltas : sinon git télécharge les anciennes vidéos de la partie pour s'en servir
    # de base de compression (une vidéo ne se compresse pas), et le disque sature
    git -C "$W" -c pack.window=0 push --no-thin -q origin HEAD:main && return 0
    [ "$d" = 0 ] && return 1
    echo "envoi refusé, nouvel essai dans $d s" >&2; sleep "$d"
  done
}
for key in "$@"; do
  folder=$(python3 -c "import sys; sys.path.insert(0, 'tools'); import derush; print(next(f for _, f, k in derush.PARTS if k == '$key'))")
  rm -rf "${W:?}"
  git clone -q --filter=blob:none --sparse "$REPO" "$W"
  if python3 tools/derush.py --tout-local "$key"; then
    git -C "$W" sparse-checkout set "SION/Script"
    MONTAGE_DIR="$W/SION" nice -n 5 python3 tools/derush.py "$key"
    # plans livrés autrefois qui ne sont plus dans le script : retirés de l'index (leurs vidéos n'ont pas été téléchargées)
    git -C "$W" ls-files -z -- "SION/$folder" | while IFS= read -r -d '' f; do
      [ -e "$W/$f" ] || git -C "$W" rm -q --cached --sparse -- "$f"
    done
    LEGER=1
  else
    git -C "$W" sparse-checkout set "SION/Script" "SION/$folder"
    MONTAGE_DIR="$W/SION" nice -n 5 python3 tools/derush.py "$key"
    LEGER=0
  fi
  big=$(find "$W/SION" -type f -size +95M)
  [ -z "$big" ] || { echo "trop gros pour GitHub (plus de 95 Mo) : $big" >&2; exit 1; }
  taille=$(du -sh "$W/SION/$folder" | cut -f1)
  if [ "$LEGER" = 1 ]; then
    # chapitre par chapitre : ajouté à l'index (ses vidéos passent dans .git) puis effacé du disque ; la partie n'y
    # tient jamais deux fois (la IV, près de 2,5 Go, ne passerait pas sinon). Ces chapitres ne sont plus jamais ajoutés
    # avec -A : leurs fichiers effacés ne deviennent pas des suppressions.
    git -C "$W" add --sparse -A -- SION/Script SION/LISEZMOI.md
    for d in "$W/SION/$folder"/*/; do
      git -C "$W" add --sparse -A -- "${d#"$W"/}"
      find "$d" -type f \( -name '*.mp4' -o -name '*.mov' \) -delete
    done
    find "$W/SION/$folder" -maxdepth 1 -type f -print0 | while IFS= read -r -d '' f; do
      git -C "$W" add --sparse -- "${f#"$W"/}"
    done
  else
    git -C "$W" add -A SION
  fi
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
    echo "$folder : envoyé ($taille)"
  fi
  rm -rf "${W:?}"
done
