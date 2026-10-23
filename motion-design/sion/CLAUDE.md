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

## Réalisme et étalonnage : contrôlés avant de montrer quoi que ce soit (automatisme)

L'auteur ne doit jamais découvrir lui-même un défaut visible. Avant toute livraison ou tout aperçu :

1. **Effet maquette** : tout plan 3D près du sol (moins de 5 km d'altitude environ) est comparé, image contre image,
   à un vrai plan du même type de paysage. S'il manque la matière du réel (arbres, pierres, maisons, eau vivante),
   ce n'est pas livrable : le remplacer par un vrai plan, ou monter plus haut. La 3D sert l'espace, la haute altitude
   et les données (cartes, tracés, lumières) ; la terre vue de près, ce sont de vrais plans.
2. **Raccord de couleur** : chaque plan est comparé au plan de référence (la Terre de l'intro) et à ses voisins de
   montage, côte à côte. Même chaîne de finition partout (tools/looks.py, halo, courbe, grain, bandes) ; aucun plan
   plus gris, plus froid, plus bouché ou plus saturé que ses voisins sans raison de récit.
3. **Matière de départ** : les vrais plans se téléchargent dans la meilleure définition proposée (4K), puis se
   réduisent en 1080p ; jamais de rendu de prévisualisation comme source.
4. Ces contrôles se font sans attendre qu'on les demande ; les défauts trouvés se corrigent avant d'envoyer.

## Recherches à confier à Perplexity

Dès qu'un fait, un chiffre ou une citation ne peut pas être vérifié ici dans une source primaire (texte original,
vidéo, archive, page de livre), le dire tout de suite à l'auteur : une question par point, prête à copier, avec ce
qu'il faut rapporter (texte exact dans la langue d'origine, date, lien). Ne pas chercher à sa place quand il l'a
demandé, et ne rien enregistrer en voix tant que la réponse n'est pas vérifiée.

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

- 1080p seulement ; voix off de l'auteur. Musique : sur tout le film, choisie par l'auteur à la fin (Envato, licence par
  morceau, chaîne YouTube enregistrée) ; les rendus livrés restent sans musique (bruitages seuls) pour le mixage.
- Aucun tiret long ou moyen à l'écran, pas de formules « à la IA ».
- Point de vue factuel et sourcé, sans rien qui puisse passer pour antisémite.
- Rendu « grand documentaire » : ça doit bouger et claquer (coupes en filé, flashs, impacts,
  rampes de vitesse, traînées d'objectif, chiffres qui défilent), jamais cheap.
- Ne jamais mettre le nom de l'auteur dans les fichiers.

## Reprise dans une nouvelle session (à lire d'abord)

État du projet et choses à faire : `script/A-FABRIQUER.md` (ce qui manque, prompts Gemini, questions Perplexity),
`script/CHANGEMENTS.md` (ce qui a changé à chaque envoi, à tenir à jour), `SOURCES.md`. Le dossier `output/` n'est
pas versionné : dans un conteneur neuf, les rendus n'existent pas ; ne relivrer une partie qu'après avoir refait
les rendus qu'elle utilise (derush garde les plans déjà livrés dont le rendu manque, mais ne les met pas à jour).

- Reconstitutions IA (Gemini/Veo, toujours d'après une vraie photo d'archive) : ranger chaque nouveau clip dans
  `data/gemini/<nom de la photo>.mp4` (noms des photos dans `data/reconstitution/`, légendes dans
  `data/reconstitution-legendes.json`), puis `python3 tools/build_reconstitution.py data/gemini` ; placer le
  fichier `output/reconstitutions/<n>-<nom>.mp4` dans le plan du script (type IA, entree/sortie).
- Livraison plan par plan : `bash tools/livrer_derush.sh <parties>` (0 ouverture, 1 à 7, 8 conclusion), dépôt
  `Montage-Moyen-orient` ; noter dans `script/CHANGEMENTS.md` chaque plan nouveau, remplacé ou retiré.
- Voix off : `python3 tools/texte_voix.py` (texte à lire, `script/VOIX-A-LIRE.md`) et `python3 tools/script_pdf.py` (le scénario complet en PDF pour l'enregistrement, `script/SION-scenario-voix-off.pdf`) ; nettoyage sans IA :
  `python3 tools/voix.py <brut.wav> --ton 10` → `output/voix/`. Mixage : la voix à -16 LUFS, les bruitages
  baissés dessous (dans Premiere : Son essentiel, atténuation automatique), le film fini à -14 LUFS.
- Après une modification du script : `python3 tools/script.py`, puis commit et push.
- Page de téléchargement de l'auteur (artefact « SION Projection », https://claude.ai/artifact/5vRzrQzskK6wFNDaWCiiZ7) :
  après chaque livraison, `python3 tools/page_sion.py` puis la republier (même url). Les barres de progression lisent le
  document `progression/etat` de sa base : mettre à jour `data/progression.json` puis l'y écrire (ArtifactData, set).

## Direction artistique (fixée : ne pas la réinventer, la reprendre)

Toute nouvelle pièce part de la timeline existante la plus proche (`timelines/*.js`), copiée puis adaptée : même
moteur, mêmes gabarits, même finition. Rien de neuf sans raison de récit.
- Couleurs : `data/palette.js` (fond, accent orange, halo) ; étalonnage par les LUT de `data/looks/`
  (`archive.cube` pour les archives filmées, `reconstitution.cube` pour les clips IA, `terre*.cube` pour la 3D).
- Polices (`index.html`) : Archivo en capitales pour les titres et les lieux, Newsreader italique pour les phrases,
  DM Mono espacée pour les dates et les mentions ; Noto Kufi Arabic et Noto Sans Hebrew pour l'arabe et l'hébreu.
- Légende d'un plan : date en DM Mono orange précédée d'un trait, lieu en grandes capitales Archivo, phrase en
  Newsreader italique ; mention de source ou « Reconstitution par IA, d'après une photo d'archive » en bas.
- Gabarits du moteur : `quote` (citation et visage), `doc` (fiche d'événement sur la carte 3D : date, titre,
  citation, lignes, épingle), `figure` (fiche de personnage) ; `photo3d.html` pour les archives et les
  reconstitutions ; cartons transparents `timelines/cartons.js`.
- Finition commune (`tools/build.sh`, `tools/build_intro.sh`, `tools/archives_filmees.py`) : halo chaud des hautes
  lumières, courbe argentique, léger flottement de l'image, grain, vignette ; 1080p 25 i/s.
- Son : vrais enregistrements de la banque seulement (`data/bruitages.json`), réglés par `tools/sound.py` et
  `tools/sound_intro.py`, contrôlés par `tools/verif_son.py`.
