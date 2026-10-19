# SION : règles de travail sur les vidéos

## Avant de livrer une vidéo (toujours, sans exception)

1. Lancer le contrôle automatique :
   `python3 tools/verif_video.py output/<nom>.mp4 --timeline <nom>`
   (format 1080p 25 i/s, durée, poids sous 95 Mo, niveau sonore, noirs et images figées,
   textes qui se chevauchent ou sortent du cadre, sol trop agrandi dans les plans 3D).
   Tout « DÉFAUT » se corrige avant d'envoyer ; tout « À VÉRIFIER » se regarde à l'œil.
2. Regarder la planche `output/verif/<nom>-planche.jpg` en entier, puis des images en pleine
   résolution aux moments délicats (coupes, flashs, apparition des titres, chiffres, fin) :
   - flou ou « fondu » de près (plans 3D : rester au-dessus d'environ 4 pixels d'écran par pixel satellite) ;
   - couleurs trop orange ou trop saturées, routes ou lumières qui bavent ;
   - textes lisibles sur fond clair comme sur fond sombre, jamais coupés, jamais l'un sur l'autre ;
   - un nom de lieu n'apparaît que quand son point est bien dans l'image ;
   - effets : filés, flashs et secousses courts et nets, pas de bord vide pendant une secousse.
3. Penser au téléphone : l'aperçu envoyé est compressé, le grain fort y devient de la bouillie.
4. Ne jamais modifier en place `tools/build_intro.sh` (ou tout script bash) pendant qu'un rendu l'exécute :
   écrire un nouveau fichier puis `mv` (nouvel inode).

## Exigences de l'auteur

- 1080p seulement ; bruitages seulement, pas de musique ; voix off faite plus tard.
- Aucun tiret long ou moyen à l'écran, pas de formules « à la IA ».
- Point de vue factuel et sourcé, sans rien qui puisse passer pour antisémite.
- Rendu « grand documentaire » : ça doit bouger et claquer (coupes en filé, flashs, impacts,
  rampes de vitesse, traînées d'objectif, chiffres qui défilent), jamais cheap.
- Ne jamais mettre le nom de l'auteur dans les fichiers.
