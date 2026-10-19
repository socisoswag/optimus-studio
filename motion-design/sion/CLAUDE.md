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
   Le contrôle comprend celui des bruitages (tools/verif_son.py) : regarder aussi le spectrogramme
   `output/verif/<nom>-son.png` (pas de bandes horizontales fixes, les temps forts doivent ressortir du fond).
4. Avant tout rendu, vérifier la syntaxe des pages en module : `cp drone.js /tmp/x.mjs && node --check /tmp/x.mjs`
   (un simple `node --check drone.js` laisse passer des erreurs de module).
5. Ne jamais modifier en place `tools/build_intro.sh` (ou tout script bash) pendant qu'un rendu l'exécute :
   écrire un nouveau fichier puis `mv` (nouvel inode).

## Bruitages (vrais sons, jamais « IA »)

- Toujours de vrais enregistrements de la banque (data/bruitages.json, Freesound CC0 ou CC BY ; jamais de licence
  « non commerciale » ni Sampling+ ; `python3 tools/banque_sons.py ajouter <rôle> <numéro>` contrôle licence, titre et
  étiquettes, `prendre` télécharge). 100 % de vrais sons, 0 % d'IA : la synthèse ne sert qu'en secours si une prise manque.
- Une prise CC BY se crédite (titre, auteur, licence, lien) dans SOURCES.md, au générique de fin et dans la description.
- Avant d'ajouter une prise : `python3 tools/banque_sons.py essai <rôle>` (aucun ton pur, aucun motif qui se répète,
  pas de son « Synth » ou « simulation »), puis `python3 tools/banque_sons.py sources` pour SOURCES.md.
- Après un changement de son : `bash tools/resound.sh <pièce>` (l'image n'est pas re-rendue), puis le contrôle.
- Mixage : les fonds restent bas (vent vers -25 dBFS avant la mise à niveau) pour que les coups ressortent ;
  une montée s'arrête 60 ms avant l'impact ; un impact a toujours une couche dans le médium (audible au téléphone) ;
  jamais de décalage d'un canal sur un son grave (il s'annule en mono) ; crête vraie sous -1 dBTP.

## Sources (toujours à jour, sans attendre qu'on le demande)

Dès qu'une nouvelle source entre dans le projet (photo, donnée, image satellite, chiffre, citation,
rapport, police, outil), l'ajouter dans la même livraison à `SOURCES.md` (au bon endroit, avec auteur,
licence, date et lien) et, si elle compte, à `SOURCES-description-youtube.txt` (moins de 5 000 caractères).
Une licence CC BY / CC BY-SA ou une mention Copernicus / OCHA va aussi dans « Mentions obligatoires »
et dans le générique de fin (`timelines/generique-fin.js`). Le signaler en une ligne à l'auteur.

## Exigences de l'auteur

- 1080p seulement ; bruitages seulement, pas de musique ; voix off faite plus tard.
- Aucun tiret long ou moyen à l'écran, pas de formules « à la IA ».
- Point de vue factuel et sourcé, sans rien qui puisse passer pour antisémite.
- Rendu « grand documentaire » : ça doit bouger et claquer (coupes en filé, flashs, impacts,
  rampes de vitesse, traînées d'objectif, chiffres qui défilent), jamais cheap.
- Ne jamais mettre le nom de l'auteur dans les fichiers.
