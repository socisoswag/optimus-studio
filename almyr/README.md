# ALMYR — site vitrine

Site statique, une seule page, avec séquence d'images pilotée au scroll
(technique Apple : le scroll est le curseur temporel de la vidéo, pas une
lecture vidéo).

## Lancer en local

```bash
cd almyr
python3 -m http.server 4173
# puis http://localhost:4173
```

## Structure

```
almyr/
├── index.html              page unique
├── css/
│   ├── style.css
│   └── fonts/              Cormorant Garamond + Jost (auto-hébergés)
├── js/
│   ├── app.js              moteur de scroll
│   └── vendor/             GSAP + ScrollTrigger + Lenis (auto-hébergés)
├── frames/                 121 frames 1600px  (desktop) — 5,7 Mo
├── frames-mobile/          121 frames 660px   (portrait) — 3,5 Mo
└── netlify.toml            en-têtes sécurité + cache long
```

Aucune dépendance externe : ni CDN, ni Google Fonts. Le site fonctionne
hors-ligne et ne fait fuiter aucune IP visiteur (RGPD).

## Régénérer les frames

Depuis une nouvelle vidéo source (idéalement 5 s, 24 fps) :

```bash
# desktop
ffmpeg -i source.mp4 -vf "scale=1600:-2" -vsync 0 \
       -c:v libwebp -quality 74 -compression_level 6 frames/frame_%04d.webp

# mobile (recadrage portrait centré)
ffmpeg -i source.mp4 -vf "crop=800:1064:574:0,scale=660:-2" -vsync 0 \
       -c:v libwebp -quality 72 -compression_level 6 frames-mobile/frame_%04d.webp
```

Si le nombre de frames change, mettre à jour `FRAME_COUNT` en tête de
`js/app.js`.

## Rythme des chapitres

Chaque `<section class="scroll-section">` porte `data-enter` / `data-leave`,
exprimés en pourcentage de la séquence. Ils déterminent à la fois la
position verticale du texte et la frame affichée derrière. Modifier ces deux
nombres suffit à recaler un chapitre sur un moment précis de la vidéo.

## À traiter avant mise en ligne

Le flacon de la vidéo source porte l'étiquette « ACILE CORDOBA ». Elle reste
lisible sur les premiers chapitres. Il faut une vidéo avec le flacon ALMYR
(ou un détourage de l'étiquette) avant toute diffusion publique.
