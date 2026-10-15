# SION — kit de motion design

Habillage animé du documentaire « SION — L'idée, la terre, le choc ». Une seule direction artistique,
un seul moteur, une timeline par pièce.

| Pièce | Timeline | Durée | Fichiers |
|---|---|---|---|
| Générique d'ouverture | `timelines/generique.js` | 35 s | `output/generique.mp4`, `output/generique.wav` |
| Ouverture de la partie I | `timelines/partie-1.js` | 15 s | `output/partie-1.mp4`, `output/partie-1.wav` |
| Chronologie des figures (1897 – 1995) | `timelines/chronologie.js` | 1 min 20 | `output/chronologie.mp4`, `output/chronologie.wav` |

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

1. **L'idée** — Vienne, 1896. La caméra descend sur l'Europe.
2. **La terre** — Jérusalem, 1917. Vol jusqu'en Palestine, la terre s'embrase.
3. **Le choc** — 1948, Indépendance · Nakba. Artillerie proche, la terre brûle.
4. Noir et silence, puis **SION** en latin, hébreu (ציון) et arabe (صهيون), « L'idée, la terre, le choc ».

## Les ouvertures de partie

Le titre de la partie tombe, puis le sommaire s'écrit ligne à ligne ; chaque chapitre allume son lieu
sur la carte (numéro dans un cartouche braise). Pour la partie I : Jérusalem (Sion), puis l'Europe
(zone de résidence, Paris, Vienne), puis retour en Palestine (Rishon LeZion, la Palestine ottomane).
Les autres parties se font en copiant `timelines/partie-1.js`.

## Fabriquer une pièce

Prérequis : Node 18+, Playwright avec Chromium, ffmpeg, Python 3 avec numpy.

```bash
tools/build.sh generique          # image + son + assemblage → output/generique.mp4
node render.mjs --timeline generique --stills 3,15,28 --out stills   # images de contrôle
```

Chaque image est une fonction du temps (`window.renderFrame(t)`), rendue dans Chromium puis encodée
avec ffmpeg. `index.html?tl=generique` affiche une pièce dans un navigateur (via `npx serve .`).

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
