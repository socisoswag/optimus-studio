# Photos des personnages

Une photo d'archive par personne dans `portraits/src/`, nommée par sa clé (`herzl.jpg`…), puis :

```bash
MODELS=/dossier/des/modeles python3 tools/portraits.py portraits/src portraits
```

Le script restaure la photo (débruitage, taches et rayures, super-résolution fidèle, contraste,
netteté), détoure la personne, efface en douceur le bas du buste et les bords coupés par le cadre
de la photo d'origine, puis écrit `portraits/<clé>.png` (gris + transparence, 1 400 px de haut au
plus : les visages s'affichent à 940 px au maximum). Les timelines y pointent déjà : une photo
présente apparaît au rendu suivant, une photo absente est simplement ignorée.

Pour reprendre seulement les bords et la taille de PNG déjà faits :

```bash
python3 tools/portraits.py --bords portraits
```

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
| `begin` | Menahem Begin | Deir Yassin (chef de l'Irgoun), chronologie |
| `arafat` | Yasser Arafat | Octobre 1973 (Rabat, ONU 1974) |
| `sharon` | Ariel Sharon | Liban 1982 (commission Kahan) |
| `netanyahou` | Benyamin Netanyahou | Gaza (mandat d'arrêt de la CPI) |
| `mcmahon`, `hussein-ben-ali` | Henry McMahon, Hussein ben Ali | trois promesses (1915) |
| `sykes`, `picot` | Mark Sykes, François Georges-Picot | trois promesses (1916) |
| `balfour`, `rothschild` | Arthur Balfour, Walter Rothschild | trois promesses (1917), ouverture II, chapitre 7 |
| `koestler` | Arthur Koestler | trois promesses (citation) |
| `dreyfus` | Alfred Dreyfus | ouverture I, chapitre 3 |
| `arlozoroff` | Haïm Arlozoroff | ouverture II, chapitre 9 |
| `netanyahou`, `lieberman` | Benyamin Netanyahou, Avigdor Lieberman | ouverture V, chapitre 24 |
| `bhl`, `finkielkraut` | Bernard-Henri Lévy, Alain Finkielkraut | ouverture VI, chapitre 31 |

## Sources et licences (pour le générique de fin)

Toutes les photos viennent de Wikimedia Commons. Les licences CC BY et CC BY-SA demandent de
citer l'auteur ; une photo du domaine public peut être citée par courtoisie.

| Clé | Licence | Auteur | Fichier sur Commons |
|---|---|---|---|
| `abd-al-qadir` | domaine public | auteur inconnu | Husseini Abd Al Qader1.jpg |
| `amin-husseini` | domaine public | American Colony, Jérusalem | Amin al-Husseini 1929 (3x4 cropped).jpg |
| `arafat` | CC BY 4.0 | Gideon Markowiz | Leader of the PLO, Yasser Arafat, 1996 Dan Hadani Archive.jpg |
| `arlozoroff` | domaine public | auteur inconnu | Haim Arlozorov enface.jpg |
| `balfour` | domaine public | Bain News Service | A.J. Balfour LCCN2014682753 (cropped).jpg |
| `begin` | domaine public | US Air Force | Menachem Begin 1978 (3x4 cropped).jpg |
| `ben-gourion` | domaine public | Fritz Cohen | David Ben-Gurion (D597-087).jpg |
| `bhl` | CC BY-SA 3.0 | Itzike | Bernard-Henri Lévy-tau-1.jpg |
| `dreyfus` | domaine public | Aron Gerschel | Alfred Dreyfus (1859-1935) - photo originale.jpg |
| `finkielkraut` | CC BY-SA 2.0 | Jérémy Barande | Alain Finkielkraut.jpg |
| `herzl` | domaine public | Carl Pietzner | Theodor Herzl (3x4 cropped).jpg |
| `hussein-ben-ali` | domaine public | auteur inconnu | Sharif Husayn.jpg |
| `jabotinsky` | domaine public | Government Press Office (Israël) | PORTRAIT OF VLADIMIR JABOTINSKY TAKEN BY BRITT IN PARIS. פורטרט, זאב ז'בוטינסקי.D850-062 (cropped).jpg |
| `koestler` | CC BY-SA 3.0 | Eric Koch / Anefo | Arthur Koestler (1969).jpg |
| `lieberman` | domaine public | Département de la Défense des États-Unis | Avigdor Lieberman 2017.jpg |
| `mcmahon` | domaine public | auteur inconnu | Henry McMahon.jpeg |
| `meir` | CC BY-SA 4.0 | Willem van de Poll | Golda Meir (1964) cropped.jpg |
| `nasser` | CC BY-SA 3.0 | Stevan Kragujević | Stevan Kragujevic, Gamal Abdel Naser u Beogradu, 1962.jpg |
| `netanyahou` | CC BY-SA 3.0 | Avi Ohayon | Benjamin Netanyahu, February 2023.jpg |
| `picot` | domaine public | auteur inconnu | François Georges-Picot cropped.JPG |
| `qassam` | domaine public | auteur inconnu | Izz ad-Din al-Qassam HQ.jpg |
| `rabin` | CC BY-SA 3.0 | Yaakov Saar | Yitzhak Rabin 1994 Portrait (3x4 cropped).jpg |
| `rothschild` | domaine public | auteur inconnu | Walter Rothschild.jpg |
| `sadate` | domaine public | gouvernement égyptien | Anwar El Sadat (cropped).jpg |
| `sharon` | CC BY 4.0 | IPPA, collection Dan Hadani (Bibliothèque nationale d'Israël) | Ariel Sharon holding a press conference in Tel Aviv (FL45794251).jpg |
| `sykes` | domaine public | auteur inconnu | Mark Sykes00.jpg |
| `weizmann` | CC BY-SA 3.0 | Hugo Mendelson | Flickr - Government Press Office (GPO) - President Chaim Weizmann (retouched).jpg |
| `yassine` | CC BY-SA 3.0 | Yonathan Torgovnik, unité du porte-parole de l'armée israélienne | Military trial of Ahmed Yassin, March 1990 I (cropped1).jpg |

Format conseillé : la plus grande version disponible, buste ou portrait. Vérifie les droits de
chaque image (domaine public ou licence libre) et garde la source pour le générique de fin.
