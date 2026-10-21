# Ce qui manque encore en vidéo

Les portraits restent en motion design (visage détouré, nom, citation). Ici : les **lieux et les événements** qui sont
encore des photos, et ce qu'il faut pour les passer en vidéo. Quand une vraie archive filmée libre existe, elle passe
avant tout (déjà fait : Ellis Island 1903, Méliès 1899, Lumière 1897, le mur occidental en 1918, les réfugiés en 1950,
le procès Eichmann).

## 1. Reconstitutions à générer avec Gemini (Veo), d'après une vraie photo

Méthode du film (SOURCES.md 4) : on part toujours d'une **vraie photo d'archive** ; le montage montre la photo
(« Photo d'archive »), puis un fondu vers le clip (« Reconstitution par IA, d'après une photo d'archive »).
Clip de 8 à 10 s, 16:9, 1080p au moins. Les photos prêtes sont dans `Script/photos-de-depart/` du dépôt de montage. Je reconnais chaque clip tout seul à sa première image
(`tools/build_reconstitution.py`), pas besoin de le renommer.

Chaque clip reçoit le traitement des archives du film (ton papier, grain, poussière, papillotement) et sa légende
(date · lieu · ce qu'on voit, `data/reconstitution-legendes.json`), puis la mention « Reconstitution par IA ».

Prompt de base (à coller, puis ajouter la ligne du plan) :

> Animate this archival black-and-white photograph as real film footage from its era. Keep the exact composition,
> people, clothes and buildings. Subtle, natural motion only (people walking, cloth moving, dust, light). Static or
> very slow camera. Film grain, no color, no text, no logos, no new people, no faces changing.

Le texte complet, prêt à coller plan par plan, est aussi dans `output/a-faire-gemini/PROMPTS.txt`.

**Photos prêtes** (1920 x 1080, dans `Script/photos-de-depart/`) :

| Plan | Durée | Ce qu'on doit voir | Photo de départ | Ligne à ajouter au prompt |
|---|---|---|---|---|
| 8.13 | 10 s | **à refaire** (le premier clip montrait une silhouette « fantôme ») : la grève générale de 1936, le souk des bijoutiers, désert pendant six mois | `output/reconstitution/20-greve-1936-souk-desert.jpg` | Very slow push forward along the empty covered market; the wooden shop doors stay closed; dust floats in the sunbeams at the end of the alley. Nobody walks in, the street stays empty. |
| 10.4 | 14 s | **à refaire en 8 s** (le premier clip ne durait que 5 s) : des Juifs en prière au mur occidental (remplace le film « Jérusalem, 1918 », droits non établis) | `output/reconstitution/23-mur-occidental.jpg` | The women and men pray facing the wall, small movements: heads bow, a hand touches the stones, a shawl moves; the children at the right look around. |
| 14.3 | 13 s | l'hôtel King David après l'attentat, 22 juillet 1946 | `output/reconstitution/22-king-david-1946.jpg` | Thin dust and smoke drift from the collapsed wing; the crane arms move slowly; soldiers and rescuers search the rubble. No bodies, no blood. |
| 17.3 | 17 s | des immigrants juifs d'Irak arrivent à l'aéroport de Lod, mai 1951 (photo 6) | `data/reconstitution/24-immigrants-irak-lod-1951.jpg` | The families wait next to the truck; a man hands bundles and bags down from the truck to the people below; the propeller plane stands still in the background; wind moves the scarves and the clothes. |
| 17.4 | 16 s | la maabara de Nahariya, février 1952 (photo 7) | `data/reconstitution/25-maabara-nahariya-1952.jpg` | The women at the table fill in forms and talk; the man with the briefcase walks slowly toward the table; the tablecloth moves slightly in the wind. |
| 28.3 | 16 s | des immigrants yéménites au camp de Rosh HaAyin, février 1950 (photo 8) | `data/reconstitution/26-rosh-haayin-1950.jpg` | The crowd of families stands in front of the tents with small movements: heads turn, a mother holds her child, people shift their weight; wind moves the tent canvas. |
| 14.2 | 12 s | l'entraînement de recrues de la Haganah, avril 1948 (photo 9) | `data/reconstitution/27-haganah-1948.jpg` | The young recruits stand and listen in the courtyard; a few walk slowly forward holding their rifles; slight wind in the pine tree. |

**Photos à télécharger toi-même** sur Wikimedia Commons (mots à taper entre guillemets ; envoie-moi la photo avec le clip) :

| Plan | Durée | Ce qu'on doit voir | Chercher | Ligne à ajouter au prompt |
|---|---|---|---|---|
| 16.6 | 13 s | un soldat contrôle le laissez-passer d'un Arabe israélien, années 1950 | « Israel military government 1950s permit » (si rien : une fiche) | The soldier checks the paper, the man waits. |
| 26.2 | 15 s | les colons du Goush Emounim à Sébastia, 1975 | « Gush Emunim Sebastia 1975 » | The crowd of settlers stands on the hill, flags move in the wind. |
| 28.2 | 17 s | la manifestation des Black Panthers israéliens, Jérusalem, 1971 | « Israeli Black Panthers 1971 » | The demonstrators march with their signs. |

Pas d'IA, par choix : les massacres (Hébron 1929, Deir Yassin, le convoi de Hadassah) restent en fiches sobres, sans
images reconstituées.

## 2. Clips Gemini déjà reçus

Reçus et reconnus (11) : les orangeraies de Jaffa, le port de Jaffa, le marché aux moutons de la porte de Damas, la
savonnerie de Naplouse, l'entrée des troupes britanniques par la porte de Jaffa (1917), la procession de Nebi Musa, les
bannières de Nebi Musa à al-Aqsa, la place du marché de Jaffa, le laboureur et ses bœufs devant Jérusalem (plan 5.5),
l'aire de battage près de Bethléem, la manifestation de Jaffa en 1933 (plan 8.12). Il manque seulement **la scène du vote de l'ONU (1947)** : renvoie-la si tu l'as
encore.

## 3. Événements récents : faits en fiches sur la carte (fait)

Pas d'IA pour un événement récent ni pour une tuerie : septembre 1970 (20.7), Jabaliya et l'intifada (22.2, 22.3),
les Israéliens éthiopiens (28.4), Neturei Karta, Jewish Voice for Peace, Briser le silence (29.2 à 29.5), les
yeshivas (30.5), la réforme de la justice (36.4, 36.6) et le Cercle des parents (38.5) sont des fiches animées sur
la carte, dans la DA du film (`timelines/documents-3.js`, `output/documents-3.mp4`). Si tu trouves plus tard une
vraie vidéo sous licence libre (CC BY ou CC BY-SA), elle peut remplacer la fiche à la même durée.

## 4. Photos de portraits à télécharger (Wikimedia Commons, domaine public ou licence libre)

Pour les fiches en motion design (je les détoure) : Edwin Montagu, Jacob Israël de Haan, Folke Bernadotte, Judah
Magnes, Martin Buber, le rabbin Joel Teitelbaum, Yeshayahou Leibowitz, Edgar Morin. Mets-les dans `portraits/src/`,
nommées par la personne (`montagu.jpg`, `de-haan.jpg`…).

## 5. À vérifier sur Perplexity (avant d'enregistrer la voix)

Réponses reçues le 21 octobre 2026 : Herzl écrit bien « quintupler et décupler » (la lettre est en français) ;
« Sands of Sorrow » est donné dans le domaine public (gardé, avec le crédit) ; « Jérusalem, 1918 » : droits non
établis, film retiré (plan 10.4 en reconstitution).

Encore deux questions :

1. « Dans la lettre de Theodor Herzl à Youssouf Diya al-Khalidi du 19 mars 1899, écrite en français (transcription
   publiée par PalQuest, Institut d'études palestiniennes), quel est le texte français exact de la phrase qui correspond
   en anglais à "You see another difficulty, Excellency, in the existence of the non-Jewish population in Palestine.
   But who would think of sending them away?" ? Donne le texte français mot pour mot et le lien. »
2. « Le film "Paths in Palestine" (Archives nationales américaines, NARA, identifiant 2767364, série 428-NPC, copie
   archive.org 428-npc-44524) porte au générique "Copyright MCMXXXIV, International Copyright Secured". Qui l'a
   produit (la marine des États-Unis ou une société privée ?), le droit d'auteur de 1934 a-t-il été renouvelé
   (registre du Copyright Office, 1961-1962), et le film est-il aujourd'hui dans le domaine public aux États-Unis ? »
