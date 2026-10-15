# Chronologie Israël · Palestine (1897 – 1995)

Motion design de 1 min 20 pour un documentaire. Il suit les grandes figures, de Theodor Herzl à
l'assassinat d'Yitzhak Rabin, avec une caméra qui survole une carte d'état-major dans la fumée.

- `output/chronologie-israel-palestine_1080p25.mp4` : la vidéo avec sa bande-son (1920 × 1080, 25 i/s)
- `output/bande-son.wav` : la bande-son seule (48 kHz, 24 bits), pour la remixer sous la voix off

## Direction artistique

| Rôle | Choix | Pourquoi |
|---|---|---|
| Fond | `#0d0c0a` nuit de cendre, fumée en mouvement, lueurs d'incendie, éclairs d'artillerie au loin, projecteurs | évoquer la guerre sans montrer de violence |
| Texte | `#e9dcc0` pierre de Jérusalem | blanc chaud, jamais blanc pur |
| Accent | `#ff5b1f` braise | dates, itinéraire, impacts |
| Carte | `#7f989a` encre d'état-major | trame froide qui contraste avec le feu |
| Noms | Archivo très condensée (prénom fin, nom noir) | le nom de la police dit déjà « archives » |
| Phrases | Newsreader italique | voix éditoriale, presse d'époque |
| Repères | DM Mono | coordonnées, frise, sur-titres tapés à la machine |
| Noms d'origine | Noto Sans Hebrew, Noto Kufi Arabic | chaque figure aussi dans sa langue |

La signature : un seul plan-séquence de caméra qui vole de ville en ville (Bâle, Londres, Jérusalem,
Paris, Haïfa, Al-Qastal, Tel-Aviv, Le Caire, Koweït, Camp David, Gaza, Oslo). Chaque arrivée allume les
terres autour du lieu, un itinéraire en pointillés braise relie les étapes, le compteur d'années roule et la
frise du bas défile avec les grands événements.

Mouvement permanent : vols avec zoom arrière / zoom avant (avec flou de bougé), poussée lente sur chaque
fiche, rotation de la carte, impact (flash, secousse, aberration chromatique) sur chaque nom, sortie « à
travers » le texte, braises, cendres, fumée en parallaxe, grain et poussière de pellicule.

## Choix éditoriaux (neutralité)

- Aucune frontière politique moderne sur la carte : uniquement côtes, fleuves, lacs et villes.
- Palette neutre : ni les couleurs du drapeau israélien ni celles du drapeau palestinien.
- « Israël » et « Palestine » ont la même taille et la même graisse dans le titre.
- 1948 est montré deux fois, côte à côte et à égalité : « Indépendance » et « Nakba ».
- Texte factuel, une phrase par figure. Le récit et les nuances restent à la voix off.

## Les fiches

| Année | Figure | Lieu |
|---|---|---|
| 1897 | Theodor Herzl | Bâle |
| 1917 | Chaïm Weizmann | Londres |
| 1921 | Hadj Amin al-Husseini | Jérusalem |
| 1925 | Ze'ev Jabotinsky | Paris |
| 1935 | Izz al-Din al-Qassam | Haïfa |
| 1948 | Abd al-Qadir al-Husseini | Al-Qastal |
| 1948 | David Ben Gourion | Tel-Aviv |
| 1948 | Indépendance · Nakba | — |
| 1956 | Gamal Abdel Nasser | Le Caire |
| 1959 | Yasser Arafat | Koweït |
| 1973 | Golda Meir | Jérusalem |
| 1978 | Menahem Begin & Anouar el-Sadate | Camp David |
| 1987 | Cheikh Ahmed Yassine | Gaza |
| 1993 | Yitzhak Rabin & Yasser Arafat | Oslo |
| 1995 | Assassinat de Rabin | Tel-Aviv |

Tout le texte est dans `timeline.js` (dates, phrases, lieux, durées). À relire avec ton conseiller
historique avant diffusion.

## Ajouter les photos d'archive

Chaque fiche a un champ `photo`. Dépose les images dans `portraits/` (une par figure, cadrage buste,
verticale de préférence) et renseigne le chemin, par exemple `photo: 'portraits/herzl.jpg'`. La photo
apparaît dans un cadre à côté du texte, passée en noir et blanc, trame et teinte braise, avec un lent
zoom. Vérifie les droits de chaque image.

## Refaire le rendu

Prérequis : Node 18+, Playwright avec Chromium, ffmpeg, Python 3 avec numpy.

```bash
# images de contrôle
node render.mjs --stills 9,40,57.8 --out stills

# bande-son
node tools/cues.mjs > cues.json
python3 tools/sound.py cues.json output/bande-son.wav

# vidéo (4 processus en parallèle, ~10 min), puis assemblage avec le son
node render.mjs --workers 4 --crf 14 --out video.mp4
ffmpeg -i video.mp4 -i output/bande-son.wav -map 0:v -map 1:a -c:v libx264 -preset slow \
  -b:v 9M -maxrate 12M -bufsize 18M -tune grain -pix_fmt yuv420p -c:a aac -b:a 320k \
  -movflags +faststart output/chronologie-israel-palestine_1080p25.mp4
```

`index.html` s'ouvre aussi dans un navigateur via un petit serveur local (`npx serve .`) ; chaque image
est une fonction du temps (`window.renderFrame(t)`).

## Crédits

- Cartographie : [Natural Earth](https://www.naturalearthdata.com/), domaine public
  (`tools/prep_map.py` génère `data/map.js`).
- Polices sous licence SIL Open Font License : Archivo (Omnibus-Type), Newsreader (Production Type),
  DM Mono (Colophon), Noto Sans Hebrew et Noto Kufi Arabic (Google).
- Bande-son entièrement synthétisée (`tools/sound.py`), sans échantillon externe.
