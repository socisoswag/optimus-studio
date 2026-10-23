# Enregistrer la voix off de SION : le guide

La voix fait la moitié du film. Une voix proche, posée et propre vaut mieux qu'un beau micro mal placé.
Le texte à lire : `script/VOIX-A-LIRE.md` ou le PDF `script/SION-scenario-voix-off.pdf` (un chapitre par séance).

## 1. La pièce (le plus important)

- Une petite pièce pleine de tissus : chambre avec lit, rideaux, armoire ouverte pleine de vêtements. Jamais une
  cuisine, une salle de bain ou une pièce vide (l'écho ne s'enlève pas).
- Le truc des youtubeurs : enregistrer face à l'armoire ouverte, ou sous une couette tendue derrière le micro.
- Couper frigo, ventilateur, chauffage soufflant, notifications. Téléphone en mode avion.
- Toujours à la même place et à la même heure de la journée : la voix doit sonner pareil sur les 39 chapitres.

## 2. Le micro

- Ce que tu as de mieux : micro USB cardioïde (type Rode NT-USB, Shure MV7, Audio-Technica AT2020USB) ou micro-cravate
  branché sur le téléphone. Un téléphone seul marche si tu le tiens à 20 cm, micro du bas vers ta bouche.
- Distance : une main ouverte, 15 à 20 cm. Un peu de côté (pas en face) pour éviter les « p » et les « b » qui claquent ;
  un filtre anti-pop (ou un collant tendu sur un cintre) devant.
- Niveau : quand tu parles fort, l'indicateur monte vers -12 dB, jamais dans le rouge. Mieux vaut un peu trop bas que saturé.
- Format : WAV, 48 kHz, 24 bits (Audacity, Reaper, ou l'appli « Dictaphone » en qualité maximale).

## 3. La séance

- Un fichier par chapitre : `chapitre-08.wav`.
- Au début de chaque fichier : **10 secondes de silence sans bouger** (le bruit de la pièce, pour le nettoyage).
- **2 secondes de silence entre deux plans** (entre deux numéros du texte) : c'est ce qui permet de caler la voix
  automatiquement sur les images.
- Une erreur : ne t'arrête pas. Silence de 2 secondes, tape une fois dans les mains, et reprends la phrase depuis le début.
  Le clap se voit sur l'onde : on garde la dernière prise.
- Debout ou assis bien droit, l'eau à température ambiante à côté (pas de café ni de lait avant). Pause toutes les 20 minutes.

## 4. Le ton

- Le ton d'un grand documentaire : calme, grave, proche, comme si tu parlais à une seule personne à 1 mètre.
  Jamais crié, jamais « annonce ». Les faits sont assez forts tout seuls.
- Le rythme : environ 150 mots par minute, plus lent que dans la vie. Le minutage du film est calé dessus.
- Les signes du texte : `/` petite respiration · `//` une seconde de silence · `///` deux secondes · le **mot en gras**
  est celui qu'on appuie (souvent le dernier : on le pose, on ne le lâche pas).
- Les noms propres : la prononciation est dans le PDF quand elle n'est pas évidente (arabe, hébreu).
- Les passages durs (le 7 octobre, Gaza, les noms) : plus lent encore, plus bas, et laisser les silences.

## 5. Après la séance

    python3 tools/voix.py chapitre-08.wav --ton 10

Nettoyage sans IA (bruit, grave, sifflantes, niveau -16 LUFS) dans `output/voix/`. Le rapport dit si la prise est bonne
(bruit de fond, niveau, saturation). Dans Premiere : voix à -16 LUFS, bruitages baissés dessous (Son essentiel,
atténuation automatique), musique Envato en dessous des bruitages, film fini à -14 LUFS.

## 6. La séquence « Leurs noms » (chapitre 25)

Une seule phrase au début (« Derrière ces chiffres, des noms… »), puis rien : les noms défilent dans le silence.
Pas de musique forte sur ce passage.
