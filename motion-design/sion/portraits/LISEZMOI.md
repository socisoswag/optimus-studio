# Photos des personnages

Une photo d'archive par personne dans `portraits/src/`, nommée par sa clé (`herzl.jpg`…), puis :

```bash
MODELS=/dossier/des/modeles python3 tools/portraits.py portraits/src portraits
```

Le script restaure la photo (débruitage, taches et rayures, super-résolution fidèle, contraste,
netteté), détoure la personne et écrit `portraits/<clé>.png`. Les timelines y pointent déjà : une
photo présente apparaît au rendu suivant, une photo absente est simplement ignorée.

| Clé | Personne | Vidéos |
|---|---|---|
| `herzl` | Theodor Herzl | chronologie, ouverture I, chapitre 4 |
| `weizmann` | Chaïm Weizmann | chronologie |
| `amin-husseini` | Hadj Amin al-Husseini | chronologie |
| `jabotinsky` | Ze'ev Jabotinsky | chronologie |
| `qassam` | Izz al-Din al-Qassam | chronologie |
| `abd-al-qadir` | Abd al-Qadir al-Husseini | chronologie |
| `ben-gourion` | David Ben Gourion | chronologie, ouverture III, chapitre 16 |
| `nasser` | Gamal Abdel Nasser | chronologie |
| `arafat` | Yasser Arafat | chronologie, ouverture IV, chapitre 21 |
| `meir` | Golda Meir | chronologie, ouverture III, chapitre 18 |
| `begin`, `sadate` | Menahem Begin, Anouar el-Sadate | chronologie (Camp David) |
| `yassine` | Cheikh Ahmed Yassine | chronologie |
| `rabin` | Yitzhak Rabin | chronologie (Oslo, 4 novembre 1995) |
| `mcmahon`, `hussein-ben-ali` | Henry McMahon, Hussein ben Ali | trois promesses (1915) |
| `sykes`, `picot` | Mark Sykes, François Georges-Picot | trois promesses (1916) |
| `balfour`, `rothschild` | Arthur Balfour, Walter Rothschild | trois promesses (1917), ouverture II, chapitre 7 |
| `koestler` | Arthur Koestler | trois promesses (citation) |
| `dreyfus` | Alfred Dreyfus | ouverture I, chapitre 3 |
| `arlozoroff` | Haïm Arlozoroff | ouverture II, chapitre 9 |
| `netanyahou`, `lieberman` | Benyamin Netanyahou, Avigdor Lieberman | ouverture V, chapitre 24 |
| `bhl`, `finkielkraut` | Bernard-Henri Lévy, Alain Finkielkraut | ouverture VI, chapitre 31 |

Format conseillé : la plus grande version disponible, buste ou portrait. Vérifie les droits de
chaque image (domaine public ou licence libre) et garde la source pour le générique de fin.
