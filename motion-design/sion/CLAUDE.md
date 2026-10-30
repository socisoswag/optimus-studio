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

- Sons Envato Elements (licence Envato, sans crédit obligatoire) rangés dans `data/envato-sons/` (hors du dépôt) : enregistrements
  réels partout ; les sons de studio (whoosh, glitch, swipe, « cinematic ») seulement sur les transitions du motion design
  (titres, cartes, chiffres), jamais sur une archive ni un vrai plan ; jamais le générateur IA d'Envato (SoundGen).
- Toujours de vrais enregistrements de la banque (data/bruitages.json, Freesound CC0 ou CC BY ; jamais de licence
  « non commerciale » ni Sampling+ ; `python3 tools/banque_sons.py ajouter <rôle> <numéro>` contrôle licence, titre et
  étiquettes, `prendre` télécharge). 100 % de vrais sons, 0 % d'IA : la synthèse ne sert qu'en secours si une prise manque.
- Une prise CC BY se crédite (titre, auteur, licence, lien) dans SOURCES.md, au générique de fin et dans la description.
- Avant d'ajouter une prise : `python3 tools/banque_sons.py essai <rôle>` (aucun ton pur, aucun motif qui se répète,
  pas de son « Synth » ou « simulation »), puis `python3 tools/banque_sons.py sources` pour SOURCES.md.
- Après un changement de son : `bash tools/resound.sh <pièce>` (l'image n'est pas re-rendue), puis le contrôle.
- Son d'origine (`son_original` sur le plan, tools/ambiances.py) : seulement pour les moments forts où le vrai son compte
  (une voix historique, une parole clé), jamais par principe ; il remplace alors les bruitages du plan. Une parole qui n'est
  pas déjà traduite à l'écran se sous-titre (`sous_titres` sur le plan, tools/sous_titres.py, rangés avec les cartons).
- Mixage : les fonds restent bas (vent vers -25 dBFS avant la mise à niveau) pour que les coups ressortent ;
  une montée s'arrête 60 ms avant l'impact ; un impact a toujours une couche dans le médium (audible au téléphone) ;
  jamais de décalage d'un canal sur un son grave (il s'annule en mono) ; crête vraie sous -1 dBTP.
- Encodage AAC (ffmpeg) : toujours `-aac_pns 0 -aac_is 0`. Avec ces deux options actives, l'encodeur crée par endroits
  un clic de quelques échantillons (+5 dB au-dessus du mixage, relevé sur « frontieres » le 29 octobre).
  Un coup grave reçoit les harmoniques de son grave (`bruitages.presence`) pour rester audible au téléphone.

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
- Générique de fin : ne le refaire (rendu) qu'à la toute fin du film, quand tout le reste est terminé ; d'ici là, tenir
  seulement `timelines/generique-fin.js` et les sources à jour, sans rendu ni relivraison.

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
- Rendus longs (plus de 5 minutes) : `bash tools/rendu_morceaux.sh <nom>` (morceaux de 60 s dans `output/morceaux/`) ;
  si la machine redémarre, relancer la même commande reprend au premier morceau manquant.
- Plans et parties déjà livrés : numéros et découpage figés (l'auteur monte dessus). Jamais de renumérotation, jamais de
  plan inséré ou supprimé ; une vraie image se pose en remplacement, au même numéro. Une coupe de longueur se propose en
  liste (plan, de telle seconde à telle seconde) que l'auteur applique dans Premiere, sans relivrer le plan.
- Après une modification du script : `python3 tools/script.py`, puis `python3 tools/coherence.py` (chapitres qui se
  suivent, fichiers et durées des plans, références « plan 25.8 » des documents), puis commit et push. Un plan inséré
  décale les suivants du chapitre : noter l'ancien et le nouveau numéro dans `script/CHANGEMENTS.md`.
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
- Cartes de données en 3D : `TL.columns` (colonnes de lumière posées sur la carte, hauteur en mètres, valeur au sommet)
  et `TL.partage = { center, land, drain }` sans découpage pour poser une carte sur le relief éclairé (voir terres-1945.js).
  Relief sur toutes les terres de l'image (`relief: true` dans buildTL, ou `terres: true` dans TL.partage) : base Palestine
  (data/partage.js) puis, au-delà, Sinaï, Liban, Jordanie et Golan, région et Europe (data/relief-plus.js, tools/prep_relief_region.py) ;
  une couche trop floue pour le cadrage s'efface d'elle-même.
  Document d'époque posé sur le terrain : `TL.carte = { src, bbox, in, out }` (carte redressée en Mercator, voir
  tools/prep_sykes_picot.py et timelines/sykes-picot.js) ; les zones se dessinent alors par-dessus.
- Archives filmées (`tools/archives_filmees.py`) : toujours le fichier d'origine d'archive.org (jamais les copies réduites),
  recadrage en pixels du fichier ; télécinéma inverse des actualités NTSC, 24 i/s passés à 25 sans doubler d'image (durée
  raccourcie de 4 %), poussières d'une image retirées, tremblement corrigé pour les films à la manivelle (option stab).
- Gabarits du moteur : `quote` (citation et visage), `doc` (fiche d'événement sur la carte 3D : date, titre,
  citation, lignes, épingle), `figure` (fiche de personnage) ; `photo3d.html` pour les archives et les
  reconstitutions ; cartons transparents `timelines/cartons.js`.
- Finition commune (`tools/build.sh`, `tools/build_intro.sh`, `tools/archives_filmees.py`) : halo chaud des hautes
  lumières, courbe argentique, grain, vignette ; 1080p 25 i/s. Plus de « flottement » de l'image : recadré au pixel près,
  il sautait d'un pixel quatre fois par seconde et se lisait comme une saccade (retiré le 30 octobre).
- Cadence (pas de saccade) : jamais `fps=25` seul sur une source à 24, 30 ou 60 i/s (il saute ou double des images).
  23,976 et 24 i/s : accélérés à 25 ; 30 : toutes les images jouées à 25 ; 60 : une sur deux, jouées à 25
  (`tools/plans_reels.sh`, à qui l'on donne la coupe à sa cadence d'origine) ; clips IA à 24 i/s : images interpolées
  (`tools/build_reconstitution.py`). Pas de secousse de caméra sur un survol ; un tour autour d'un bâtiment reste lent.
- Livraison : chaque plan coupé est mesuré et son tremblement rapide retiré (`tools/sans_flottement.py`, appelé par
  `derush.cut`) ; pour ne refaire que quelques plans : `python3 tools/livrer_plans.py <plans>` ou `--types ARCH,RÉEL`
  (même nom de fichier, ancien fichier retiré si le type change, PLANS.md et cartons mis à jour).
- Relief étalonné (moteur, mode « terres ») : ombres froides et profondes, pentes éclairées chaudes, brume bleutée au
  loin (table GRADE de engine.js) ; la grille de points s'efface sous le relief ; les noms de lieu sont cernés de sombre pour rester lisibles sur le relief clair. Grain du moteur fin et doux (grains
  adoucis, opacité 0,2) : un grain dur pixel par pixel devient de la bouillie une fois compressé par YouTube.
- Son : vrais enregistrements de la banque seulement (`data/bruitages.json`), réglés par `tools/sound.py` et
  `tools/sound_intro.py`, contrôlés par `tools/verif_son.py`.
