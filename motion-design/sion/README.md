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
| Six jours, la Naksa, juin 1967 (chapitre 19) | `timelines/six-jours.js` | 1 min 18 | `output/six-jours.mp4` |

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
| Accent | `#ff5b1f` braise |
| Carte | `#7f989a` encre d'état-major, sans frontières politiques |
| Titres | Archivo très condensée (fin + noir) |
| Phrases | Newsreader (italique pour les phrases, romain pour les sommaires) |
| Repères | DM Mono |
| Écritures d'origine | Noto Sans Hebrew, Noto Kufi Arabic |

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
| `quote` | citation plein écran | `text`, `author`, `pos: 'low'` pour la poser en bas, sur la carte |

Dans un texte, `[[ … ]]` souligne un passage d'un trait de braise. Les flux de particules se
déclarent dans `flows` (départs, arrivée, nombre de particules, moment) ; voir `flux-humains.js`.

### Cartes de guerre

`six-jours.js` sert de modèle. Tout se déclare en coordonnées (lon, lat) et en temps relatif à une
séquence (`seg`, `at`) :

| Liste | Effet | Champs principaux |
|---|---|---|
| `units` | chars, avions, navires, bulldozers en formation, avec poussière, ombre, traînées | `kind` (`tank`, `plane`, `ship`, `dozer`), `n`, `path`, `dur`, `size`, `fire: [{ at, to }]` (tir et impact) |
| `arrows` | flèches d'offensive effilées qui avancent | `path`, `dur`, `w`, `label` |
| `strikes` | frappe : éclair, onde de choc, feu, fumée qui monte | `lon`, `lat`, `power`, `burn` |
| `zones` | territoire qui se hachure depuis un point (`data/territoires.js`) | `name` (`cisjordanie`, `gaza`, `jerusalem-est`, `golan`, `sinai`), `from`, `dur` |
| `plans` | tracé au sol à l'échelle d'un quartier (rempart, esplanade, mur) | `path`, `closed`, `style` (`wall`, `sacred`, `focus`, `grid`), `label`, `labelAt` |
| `blocks` | maisons en relief qui s'effondrent (poussière, gravats, empreinte) | `lon`, `lat`, `w`, `d`, `h` (mètres), `rot`, `fall` |
| `clock` | date et heure en haut de l'écran | `text` |

Le type d'écran `cap` pose une légende en bas à gauche (`kicker`, `title`, `text`) au-dessus de la
carte. Territoires et flèches s'effacent d'eux-mêmes quand la caméra descend à l'échelle de la rue ;
plans et maisons n'apparaissent qu'à cette échelle. Le son suit : avions, moteurs et chenilles,
explosions, effondrements.

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

Les fiches de la chronologie acceptent une photo (`photo: 'portraits/herzl.jpg'`), voir
`portraits/LISEZMOI.md`. Vérifie les droits de chaque image.

## Crédits

- Cartographie : [Natural Earth](https://www.naturalearthdata.com/), domaine public.
- Polices sous licence SIL Open Font License : Archivo (Omnibus-Type), Newsreader (Production Type),
  DM Mono (Colophon), Noto Sans Hebrew et Noto Kufi Arabic (Google).
- Bandes-son entièrement synthétisées (`tools/sound.py`), sans échantillon externe.
