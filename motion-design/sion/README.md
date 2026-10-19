# SION — kit de motion design

Habillage animé du documentaire « SION — L'idée, la terre, le choc ». Une seule direction artistique,
un seul moteur, une timeline par pièce.

| Pièce | Timeline | Durée | Fichier |
|---|---|---|---|
| Générique d'ouverture | `timelines/generique.js` | 35 s | `output/generique.mp4` |
| Ouverture partie I · L'idée | `timelines/partie-1.js` | 15 s | `output/partie-1.mp4` |
| Ouverture partie II · Le basculement | `timelines/partie-2.js` | 15 s | `output/partie-2.mp4` |
| Ouverture partie III · La catastrophe fondatrice | `timelines/partie-3.js` | 16 s | `output/partie-3.mp4` |
| Ouverture partie IV · Résistances et oppressions | `timelines/partie-4.js` | 14 s | `output/partie-4.mp4` |
| Ouverture partie V · La dérive d'un projet | `timelines/partie-5.js` | 14 s | `output/partie-5.mp4` |
| Ouverture partie VI · Voix et contre-voix | `timelines/partie-6.js` | 14 s | `output/partie-6.mp4` |
| Ouverture partie VII · Une histoire universelle ? | `timelines/partie-7.js` | 13 s | `output/partie-7.mp4` |
| Ouverture de la conclusion | `timelines/conclusion.js` | 14 s | `output/conclusion.mp4` |
| Titres des 39 chapitres | `timelines/chapitres.js` | 39 × 4,6 s | `output/chapitres/chapitre-01.mp4` … `-39.mp4` |
| Chronologie des figures (1897 – 1995) | `timelines/chronologie.js` | 1 min 20 | `output/chronologie.mp4` |
| Trois promesses, 1915 – 1917 (chapitre 7) | `timelines/trois-promesses.js` | 55 s | `output/trois-promesses.mp4` |
| Exodes, 1947 – années 1970 (chapitres 13 et 17) | `timelines/flux-humains.js` | 45 s | `output/flux-humains.mp4` |
| Les résolutions 194, 242, 338 (chapitre 33) | `timelines/resolutions.js` | 1 min | `output/resolutions.mp4` |
| 1948, la Nakba (chapitre 13) | `timelines/nakba-1948.js` | 1 min 33 | `output/nakba-1948.mp4` |
| Six jours, la Naksa, juin 1967 (chapitre 19) | `timelines/six-jours.js` | 1 min 20 | `output/six-jours.mp4` |
| Suez, 1956 (chapitre 19) | `timelines/suez-1956.js` | 1 min 10 | `output/suez-1956.mp4` |
| Deir Yassin, 9 avril 1948 (chapitre 15) | `timelines/deir-yassin.js` | 50 s | `output/deir-yassin.mp4` |
| Liban, 1982 (chapitre 20) | `timelines/liban-1982.js` | 1 min 23 | `output/liban-1982.mp4` |
| Octobre 1973 (chapitre 21) | `timelines/octobre-1973.js` | 1 min 07 | `output/octobre-1973.mp4` |
| Gaza, 2007 – 2025 (chapitre 25) | `timelines/gaza.js` | 1 min 34 | `output/gaza.mp4` |
| Le découpage : plan de partage de l'ONU, 1947 (chapitre 12) | `timelines/partage-1947.js` | 1 min 38 | `output/partage-1947.mp4`, `output/partage-1947-sans-texte.mp4` |
| Les frontières qui bougent, 1947 – aujourd'hui (chapitre 19) | `timelines/frontieres.js` | 51 s | `output/frontieres.mp4` |
| Jérusalem (chapitre 19) | `timelines/jerusalem.js` | 1 min 01 | `output/jerusalem.mp4` |
| Les camps (chapitre 20) | `timelines/camps.js` | 40 s | `output/camps.mp4` |
| Oslo et le mur (chapitre 23) | `timelines/oslo-mur.js` | 49 s | `output/oslo-mur.mp4` |
| Les aliyas, 1882 – 1939 (chapitre 5) | `timelines/aliyas.js` | 57 s | `output/aliyas.mp4` |
| Citations : Herzl (4), Ben Gourion (16), Golda Meir (18), Mahmoud Darwich (38) | `timelines/citation-*.js` | 12 à 13 s | `output/citation-*.mp4` |
| Chiffres-clés : zone C (19), réfugiés (20), colons (23), Gaza (25) | `timelines/chiffre-*.js` | 13 s | `output/chiffre-*.mp4` |
| Sion, le mot (chapitre 1) | `timelines/sion-le-mot.js` | 1 min 01 | `output/sion-le-mot.mp4` |
| L'Europe en feu, de 1881 à 1914 (chapitre 2) | `timelines/europe-1881-1914.js` | 1 min 10 | `output/europe-1881-1914.mp4` |
| Les figures d'aujourd'hui : Netanyahou, Lieberman (24), Smotrich et Ben Gvir (26) | `timelines/figures-aujourdhui.js` | 20 s | `output/figures-aujourdhui.mp4` |
| La guerre numérique (chapitre 27) | `timelines/guerre-numerique.js` | 1 min | `output/guerre-numerique.mp4` |
| Les noms effacés (chapitre 34) | `timelines/noms-effaces.js` | 1 min 17 | `output/noms-effaces.mp4` |
| Apartheid, ce que disent les textes (chapitre 35) | `timelines/apartheid-textes.js` | 1 min 02 | `output/apartheid-textes.mp4` |
| Intro aérienne en 3D : de l'orbite à la mer Morte, titre | `timelines/intro-aerienne.js` (`drone.html`) | 1 min 24 | `output/intro-aerienne.mp4` |
| Générique de fin (sans nom de l'équipe) | `timelines/generique-fin.js` | 1 min 02 | `output/generique-fin.mp4` |
| 26 cartons transparents : lieux et dates, mentions de source | `timelines/cartons.js` | 5,5 s chacun | `output/cartons/*.mov` |

Le dossier `output/montage/` range tout pour le montage : un dossier par partie, un sous-dossier par
chapitre, et chaque séquence découpée **plan par plan** (séquence complète, un fichier par plan et
`PLANS.md` avec la durée, la place dans la séquence et le texte de chaque plan). Il se refait avec
`python3 tools/montage.py`.

Pour tout voir d'une traite dans l'ordre du film : `output/SION-bout-a-bout-1080p-partie-1.mp4` … `-14.mp4`
(environ 33 min en 14 morceaux de moins de 3 min, refaits avec `python3 tools/bout_a_bout.py`).

Pour démarrer le montage dans Premiere Pro ou DaVinci Resolve : `output/montage/SION-timeline.xml`, refait avec
`python3 tools/timeline_xml.py output/montage output/montage/SION-timeline.xml SION-montage`, est une séquence 1080p 25 i/s (XML Final Cut Pro 7)
avec toutes les pièces dans l'ordre du film et un marqueur par partie et par chapitre. Le dernier
argument est le dossier racine des médias, à relier à l'ouverture.

Le teaser sans voix (environ 45 s) : `tools/build.sh teaser-cartons && tools/teaser.sh` monte les
cartons de `timelines/teaser-cartons.js` avec des plans tirés des pièces finies, dans
`output/SION-teaser-1080p.mp4`. La liste des plans (pièce, début, durée) est en tête du script.

Le son ne contient que des bruitages, sans musique : les pièces s'intègrent au montage sous la
musique du film. Chaque pièce a aussi ses bruitages seuls en `.wav` à côté du `.mp4`.

Vidéos en 1920 × 1080, 25 i/s, H.264 9 Mbit/s (cartons de chapitre : 10 Mbit/s). Les `.wav`
(48 kHz, 24 bits) se remixent sous la voix off. Pour retrouver le lit musical (drone et accords) :
`MUSIC=1 tools/resound.sh`, qui refait le son sans toucher à l'image.

## Direction artistique

| Rôle | Choix |
|---|---|
| Fond | `#0d0c0a` nuit de cendre, fumée en mouvement, lueurs d'incendie, éclairs d'artillerie, projecteurs |
| Texte | `#e9dcc0` pierre de Jérusalem |
| Accent | vermillon `rgb(232,52,30)` : force, feu, occupation, bilans |
| Vie | olive pâle `rgb(170,182,110)` : villages, villes la nuit, réfugiés, terres palestiniennes |
| Encre froide | gris-bleu `rgb(124,156,188)` : territoire attribué à l'État juif en 1947, puis Israël (cartes du partage et des frontières) |
| Carte | `#7f989a` encre d'état-major, sans frontières politiques |
| Titres | Archivo très condensée (fin + noir) |
| Phrases | Newsreader (italique pour les phrases, romain pour les sommaires) |
| Repères | DM Mono |
| Écritures d'origine | Noto Sans Hebrew, Noto Kufi Arabic |

Toutes les couleurs d'accent se règlent dans `data/palette.js` (le halo de la finition pellicule
aussi). La couleur code les lieux et les populations, jamais les individus.

Signature : une caméra qui survole une carte d'état-major dans la fumée, zoome fort sur chaque lieu
(avec flou de bougé), allume les terres en braise, et des titres qui tombent avec flash, secousse et
aberration chromatique.

## Le générique

Trois mots, trois rythmes différents :

1. **L'idée** — Vienne, 1896. La caméra descend sur l'Europe, le mot apparaît comme une mise au point.
2. **La terre** — Jérusalem, 1917. Vol jusqu'en Palestine, le mot tombe, la terre s'embrase.
3. **Le choc** — 1948. Rafale : une lettre par impact, coupes franches de caméra, puis « 1948 :
   indépendance pour les Israéliens, Nakba pour les Palestiniens ».
4. Noir et silence, puis **SION** en latin, hébreu (ציון) et arabe (صهيون), « L'idée, la terre, le choc ».

## Les ouvertures de partie

Le titre de la partie tombe, puis le sommaire s'écrit ligne à ligne ; chaque chapitre allume son lieu
sur la carte (numéro dans un cartouche braise). Pour la partie I : Jérusalem (Sion), puis l'Europe
(zone de résidence, Paris, Vienne), puis retour en Palestine (Rishon LeZion, la Palestine ottomane).
Les chapitres sont numérotés de 1 à 39 (la déclaration Balfour devient le 7, « Colonisation
rampante et colonies illégales » le 23).

## Les titres de chapitre

Un carton de 4,6 s par chapitre. Le titre est coupé au deux-points : le début en grand, la suite en
italique. Trois mises en page (gauche, centre, droite) et trois apparitions (impact, balayage avec
barre de braise, mise au point) alternent ; chaque carton s'ouvre sur un lieu de la carte, et le
chapitre 34 éteint les points de la carte un à un. Fabrication : `tools/build_chapitres.sh`.

## Les séquences documentaires

Trois séquences s'appuient sur des textes et des chiffres sourcés (les sources sont en tête de
chaque fichier de `timelines/`). Les citations sont mot pour mot ; `[…]` marque une coupe.

1. **Trois promesses** (chapitre 7) — la lettre McMahon à Hussein (Le Caire, 1915), les accords
   Sykes-Picot (1916, et les zones qui s'allument sur la carte), la déclaration Balfour (Londres,
   1917), puis la phrase d'Arthur Koestler sur la Palestine, avec les trois engagements posés sur
   la même terre.
2. **Exodes** (chapitres 13 et 17) — environ 700 000 Palestiniens expulsés ou en fuite en
   1947 – 1949, puis environ 850 000 juifs qui quittent les pays arabes de 1948 aux années 1970.
   Des flux de particules partent des villes, un compteur monte, les lieux d'arrivée s'allument.
   Les deux départs se suivent sans être mis en équivalence.
3. **Les résolutions de l'ONU** (chapitre 33) — 194, 242 et 338 : date, organe, vote, extrait.
   Pour la 242, l'écart entre le texte français (« des territoires ») et le texte anglais
   (« from territories »).

### Écrans réutilisables

Ces trois séquences ajoutent au moteur des écrans que l'on peut reprendre dans n'importe quelle
timeline :

| Type | Usage | Champs principaux |
|---|---|---|
| `doc` | document cité (lettre, accord, résolution) | `eyebrow`, `title` (2 lignes), `meta`, `quote` (texte ou liste de paragraphes), `rows`, `ref`, `note` |
| `stat` | chiffre-choc avec compteur | `kicker`, `pre`, `value`, `label`, `text`, `source`, `layout` `'L'` ou `'B'` (bas d'écran) |
| `quote` | citation plein écran | `text`, `author`, `pos: 'low'` pour la poser en bas, sur la carte, `native` (texte dans sa langue d'origine), `context` (une ligne sous l'auteur) |
| `roll` | générique déroulant | `sections` : `{ h, lines }`, une ligne `[texte, précision]` ; `{ big, lines }` pour le titre final ; `hold` |

`stat` accepte aussi `unit` (« % » après le compteur). Un visage s'ajoute à n'importe quel écran avec
`faces: [root.face('herzl', { side, x, h, at, until, tag, tagPos })]` ; dans une paire, les têtes
sont mises à la même taille et à la même hauteur.

Dans une paire (`pair`), chaque personne peut avoir sa propre phrase sous son nom (`text`) et sa taille
de tête (`norm`) ; la phrase du bas est alors celle qui leur est commune. Un chiffre-clé (`stat`) avance
par pas de `step` (137 par défaut) et ne dépasse jamais sa valeur finale.

Dans un texte, `[[ … ]]` souligne un passage d'un trait de braise. Les flux de particules se
déclarent dans `flows` (départs, arrivée, nombre de particules, moment) ; voir `flux-humains.js`.

### Cartes de guerre

`six-jours.js` sert de modèle. Tout se déclare en coordonnées (lon, lat) et en temps relatif à une
séquence (`seg`, `at`) :

| Liste | Effet | Champs principaux |
|---|---|---|
| `units` | chars, automitrailleuses, avions, navires, bulldozers en formation, avec poussière, ombre, traînées | `kind` (`tank`, `truck`, `plane`, `ship`, `dozer`), `n`, `path`, `dur`, `size`, `fire: [{ at, to }]` (tir et impact) |
| `arrows` | flèches d'offensive effilées qui avancent | `path`, `dur`, `w`, `label`, `tone: 'stone'` (l'autre camp) |
| `strikes` | frappe : éclair, onde de choc, feu, fumée qui monte | `lon`, `lat`, `power`, `burn` |
| `zones` | territoire qui se hachure depuis un point (`data/territoires.js`, `data/ocha.js`) | `name` (`cisjordanie`, `gaza`, `jerusalem-est`, `golan`, `sinai`, `israel-1949`, `palestine-mandataire`, `oslo-ab`, `oslo-c`, `oslo-reserve`, `jerusalem-est-annexee`, `hebron-h2`), `from`, `dur`, `until`, `tone: 'stone'`, `'life'` ou `'cold'` |
| `plans` | tracé au sol à l'échelle d'un quartier (rempart, esplanade, mur) | `path`, `closed`, `style` (`wall`, `sacred`, `focus`, `grid`), `label`, `labelAt` |
| `blocks` | maisons en relief qui s'effondrent (poussière, gravats, empreinte) | `lon`, `lat`, `w`, `d`, `h` (mètres), `rot`, `fall` |
| `clock` | date et heure en haut de l'écran | `text` |

Le type d'écran `cap` pose une légende en bas à gauche (`kicker`, `title`, `text`, `textW` pour une
colonne plus étroite) au-dessus de la carte. Un repère `erase: true, ghost: true` figure un village
qui s'éteint en laissant son empreinte. Territoires et flèches s'effacent d'eux-mêmes quand la caméra descend à l'échelle de la rue ;
plans et maisons n'apparaissent qu'à cette échelle. Le son suit : avions, moteurs et chenilles,
explosions, effondrements.

### Réseaux et noms effacés

| Liste | Effet | Champs principaux |
|---|---|---|
| `nets` | réseau de faux comptes : des profils s'allument autour d'une cible, reliés au plus proche, des messages circulent, puis les comptes sont supprimés un à un (`guerre-numerique.js`) | `hub`, `n`, `spread`, `grow`, `off`, `offDur`, `until` |
| `renames` | nom remplacé : l'ancien nom s'écrit en olive, un trait de braise le barre, le nouveau s'écrit au-dessus (`noms-effaces.js`) | `from`, `to`, `lon`, `lat`, `dir`, `strike`, `gap`, `until` |

### La carte du partage (chapitre 12)

`partage-1947.js` met en scène le plan de partage de l'ONU (résolution 181, 29 novembre 1947) sur une
maquette en relief : le vote pays par pays sur la carte du monde, la Palestine éclairée avec ses
localités (olive : arabes, encre froide : juives), une lame qui trace les frontières, les morceaux qui
prennent la couleur de leur État puis se décollent, les deux points où les territoires ne se touchent
que par un coin (près d'Afula et d'Isdud), l'enclave de Jaffa, puis 56 % du territoire face aux 7 % de
terres possédées. Aucun drapeau : les couleurs suivent le code du film. La dernière image est le
cadre d'ouverture de `nakba-1948` : on enchaîne sans coupe visible, en prenant la Nakba à 0,9 s.

Les données (`data/partage.js`, `data/relief/*.png`) se refont avec `python3 tools/prep_partage.py
<dossier>` : calage de la carte ONU n° 103.1(b) sur son quadrillage, découpage en partition planaire,
localités Wikidata, vote, ombrage du relief SRTM. Le minutage se déclare dans `TL.partage` (`land`,
`dotsArabe`, `dotsJuif`, `blade`, `tint`, `split`, `settle`, `labels`, `marks`, `pulse`, `drain`,
`vote`), avec les écrans `ballot` (décompte des voix), `cap` + `legend` et `stat` + `grid` (une case
pour 1 %). Les bruitages (machine à écrire, marteau de séance, scalpel, dalles, radio, coups de feu)
sont listés dans `TL.sound.foley`. La version sans texte (`node render.mjs --notext`) garde les
mentions tapées sur la carte et retire légendes, titres et chiffres, pour une voix off.

## L'intro aérienne

Un survol en 3D du relief réel, rendu image par image dans Chromium (WebGL, three.js) :

1. **l'espace** : la Terre de nuit vue de 7 000 km, les lumières des villes, le soleil qui se lève
   derrière le bord de la planète, puis une plongée continue jusqu'à 3 km, à travers une nappe de
   cumulus au large de Jaffa (altimètre en haut à droite) ;
2. **la mer** au large de Jaffa à l'aube, face au soleil ;
3. **les monts de Judée** à l'ouest de Jérusalem, repères accrochés au relief (Jérusalem, Bethléem) ;
4. **le désert de Judée** jusqu'à la falaise d'Ein Gedi : l'altimètre plonge à −430 m ;
5. **la mer Morte** vers le sud et le titre SION, en braise qui refroidit.

Le globe est calculé par pixel : atmosphère à diffusion simple (bleu du ciel, aube, halo du bord de la
Terre), ombre de la nuit, lumières des villes, reflet du soleil sur la mer, nuages. Les textures passent
de la Terre entière (5 km) au Levant (500 m), à Sentinel-2 (60 m) puis au relief fin (17 m, détails à
8 m). Au sol : relief SRTM (33 m), ombres et lumière du ciel précalculées pour le soleil de chaque plan,
brume en altitude, scintillement sur l'eau, halo et reflets d'objectif, étalonnage. Bruitages seuls.

```bash
python3 tools/prep_drone.py <cache>   # relief, Sentinel-2 du 11 mai 2025, lumière → data/drone/
python3 tools/prep_globe.py <cache>   # Terre entière, Levant, Sentinel-2 à 60 m (NASA, Copernicus)
tools/build_intro.sh                  # → output/intro-aerienne.mp4 ; NOTEXT=1 : sans lieux ni titre
node render.mjs --page drone.html --timeline intro-aerienne --stills 6,40 --out stills
```

`data/drone/` (environ 200 Mo) n'est pas versionné : les deux scripts le refont. Sources libres pour un
usage commercial : NASA (domaine public), Copernicus Sentinel-2 (« Contains modified Copernicus Sentinel
data 2025 »), SRTM. Les données de 2000 du relief placent la mer Morte à −412 m ; son rivage de 2025 vient
de l'image satellite.

## Fabriquer une pièce

Prérequis : Node 18+, Playwright avec Chromium, ffmpeg, Python 3 avec numpy.

```bash
tools/build.sh generique          # image + son + assemblage → output/generique.mp4
node render.mjs --timeline generique --stills 3,15,28 --out stills   # images de contrôle
```

Chaque image est une fonction du temps (`window.renderFrame(t)`), rendue dans Chromium puis encodée
avec ffmpeg. L'encodage ajoute une finition « pellicule » : halo chaud autour des hautes lumières
(halation), courbe argentique et léger flottement de l'image. `index.html?tl=generique` affiche une pièce dans un navigateur (via `npx serve .`).

Fichiers : `core.js` (minutage commun image/son), `engine.js` (moteur), `index.html` (styles),
`timelines/` (contenu), `tools/sound.py` (bande-son), `tools/prep_map.py` (carte).

## Photos d'archive

Les visages des personnages sont des photos d'archive restaurées et détourées (`portraits/*.png`,
`tools/portraits.py`), avec auteur et licence de chacune dans `portraits/LISEZMOI.md`.

## Cartons à poser sur les images

`tools/build_cartons.sh` fabrique les cartons lieu et date et les mentions de source sur fond
transparent (`render.mjs --alpha`) : un MOV par carton dans `output/cartons/`, codec PNG avec couche
alpha, que Premiere, DaVinci Resolve et Final Cut lisent directement.

## Crédits

- Cartographie : [Natural Earth](https://www.naturalearthdata.com/), domaine public ; zones des accords
  d'Oslo (Autorité palestinienne, ministère du Plan) et tracé du mur de janvier 2018 (CC BY), publiés
  par l'OCHA sur [HDX](https://data.humdata.org/) (`tools/prep_ocha.py`).
- Photos des personnages : Wikimedia Commons, auteurs et licences dans `portraits/LISEZMOI.md`.
- Polices sous licence SIL Open Font License : Archivo (Omnibus-Type), Newsreader (Production Type),
  DM Mono (Colophon), Noto Sans Hebrew et Noto Kufi Arabic (Google).
- Bandes-son entièrement synthétisées (`tools/sound.py`), sans échantillon externe.

## Photos d'archive animées par IA (reconstitutions)

1. `python3 tools/prep_reconstitution.py <cache>` : images de départ en 16:9 dans `output/reconstitution/`
   (photos de la Bibliothèque du Congrès, sources dans `data/reconstitution.json` et `SOURCES.md`).
2. L'auteur anime chaque image dans Gemini (Veo), Kling ou Firefly (textes fournis à part).
3. `python3 tools/build_reconstitution.py <dossier_des_clips>` : reconnaît chaque clip par sa première image,
   le ramène en 1080p 25 i/s, puis le rend avec le traitement du film (photo figée, légende, elle s'anime,
   se fige ; ton papier, grain, poussière ; mention « Photo d'archive animée par IA »). Légendes :
   `data/reconstitution-legendes.json`. Sortie : `output/reconstitutions/<n>-<nom>.mp4`, un fichier par plan.

## Bruitages réels et contrôle du son

- `tools/banque_sons.py` : banque de vrais enregistrements Freesound sous licence CC0 (catalogue `data/bruitages.json`,
  fichiers dans `data/sons/`, hors du dépôt). `prendre` télécharge, `chercher` trouve de nouvelles prises (CC0 seulement),
  `essai <rôle>` contrôle chaque prise, `sources` réécrit la liste dans SOURCES.md. Les prises sont nettoyées au chargement
  (clics, grave sous 30 Hz).
- `tools/bruitages.py` : briques prêtes à mixer (fonds sans boucle audible, impacts en couches réelles calés sur leur
  attaque, souffles amenés à la durée d'une coupe, montées qui culminent sur l'impact, coups découpés dans les prises,
  vraies réverbérations).
- `tools/verif_son.py` : contrôle de chaque bande-son (lancé aussi par `verif_video.py`) : niveau, crête vraie, clics,
  coupures sèches, sons de synthèse (tons purs, souffle trop blanc, oscillateur régulier, même son répété), mono et
  téléphone, synchro avec les coupes, les flashs et les impacts de la timeline ; spectrogramme dans `output/verif/`.
- `tools/resound.sh <pièce>` refait le son d'une pièce déjà rendue (2D, 3D ou photo) sans toucher à l'image.

