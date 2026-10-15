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

Chaque pièce a aussi sa bande-son seule en `.wav` à côté du `.mp4`.

Vidéos en 1920 × 1080, 25 i/s, H.264 9 Mbit/s avec le son. Les `.wav` (48 kHz, 24 bits) sont les
bandes-son seules, pour les remixer sous la voix off.

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
