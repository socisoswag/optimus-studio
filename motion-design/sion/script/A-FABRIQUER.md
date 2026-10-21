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

Prompt de base (à coller, puis ajouter la ligne du plan) :

> Animate this archival black-and-white photograph as real film footage from its era. Keep the exact composition,
> people, clothes and buildings. Subtle, natural motion only (people walking, cloth moving, dust, light). Static or
> very slow camera. Film grain, no color, no text, no logos, no new people, no faces changing.

Le texte complet, prêt à coller plan par plan, est aussi dans `output/a-faire-gemini/PROMPTS.txt`.

**Photos prêtes** (1920 x 1080, dans `Script/photos-de-depart/`) :

| Plan | Durée | Ce qu'on doit voir | Photo de départ | Ligne à ajouter au prompt |
|---|---|---|---|---|
| 8.12 | 8 s | la manifestation de Jaffa, octobre 1933 (remplacera la photo en relief) | `output/reconstitution/19-manifestation-jaffa-1933.jpg` | The crowd of demonstrators slowly advances along the street toward the line of British policemen in the foreground; the policemen hold their line with small movements; dust hangs in the sunlight. |
| 8.13 | 10 s | la grève générale de 1936 : le souk des bijoutiers, désert pendant six mois | `output/reconstitution/20-greve-1936-souk-desert.jpg` | Very slow push forward along the empty covered market; the wooden shop doors stay closed; dust floats in the sunbeams at the end of the alley. Nobody walks in, the street stays empty. |
| 8.14 | 12 s | Lydda, 1936 : les propriétaires d'une maison dynamitée par l'armée cherchent leurs affaires | `output/reconstitution/21-maison-dynamitee-lydda-1936.jpg` | The family and the neighbours search the rubble of the blown-up house for their belongings: they bend down, lift stones, the old man in the striped robe walks slowly forward; dust drifts in the sunlight. |
| 10.4 | 14 s | des Juifs en prière au mur occidental (remplace le film « Jérusalem, 1918 », droits non établis) | `output/reconstitution/23-mur-occidental.jpg` | The women and men pray facing the wall, small movements: heads bow, a hand touches the stones, a shawl moves; the children at the right look around. |
| 14.3 | 13 s | l'hôtel King David après l'attentat, 22 juillet 1946 | `output/reconstitution/22-king-david-1946.jpg` | Thin dust and smoke drift from the collapsed wing; the crane arms move slowly; soldiers and rescuers search the rubble. No bodies, no blood. |

**Photos à télécharger toi-même** sur Wikimedia Commons (mots à taper entre guillemets ; envoie-moi la photo avec le clip) :

| Plan | Durée | Ce qu'on doit voir | Chercher | Ligne à ajouter au prompt |
|---|---|---|---|---|
| 5.6 | 10 s | la loterie des terrains d'Ahuzat Bayit, futur Tel-Aviv, 11 avril 1909 (photo d'Avraham Soskine) | « Ahuzat Bayit lottery Soskine » | The crowd on the sand dunes gathers; a man draws shells from a box; the wind moves the clothes. |
| 10.3 | 15 s | des membres du Bund, Russie, vers 1905 | « General Jewish Labour Bund 1905 » | The group stands still for the photographer with small movements; a flag moves in the wind. |
| 14.2 | 12 s | des combattants de la Haganah, 1947-1948 | « Haganah 1948 » | The men walk with their rifles, slow camera. |
| 16.6 | 13 s | un soldat contrôle le laissez-passer d'un Arabe israélien, années 1950 | « Israel military government 1950s permit » (si rien : une fiche) | The soldier checks the paper, the man waits. |
| 17.3 | 17 s | des Juifs irakiens arrivent à l'aéroport de Lod, 1951 | « Operation Ezra and Nehemiah Lod 1951 » | Families step down from the plane with their bags. |
| 17.4 | 16 s | une maabara (camp de toile), vers 1950 | « Ma'abarot » | Children walk between the tents, laundry moves in the wind. |
| 20.7 | 11 s | Amman, septembre 1970 | « Black September 1970 Amman » | Smoke rises slowly over the city, the street is empty. |
| 22.2 et 22.3 | 13 s et 13 s | la première intifada, Gaza, 1987-1988 (CC BY ou CC BY-SA obligatoire) | « First Intifada Gaza » | Young people in the street, soldiers in the distance, no violence shown close up. |
| 26.2 | 15 s | les colons du Goush Emounim à Sébastia, 1975 | « Gush Emunim Sebastia 1975 » | The crowd of settlers stands on the hill, flags move in the wind. |
| 28.2 | 17 s | la manifestation des Black Panthers israéliens, Jérusalem, 1971 | « Israeli Black Panthers 1971 » | The demonstrators march with their signs. |
| 28.3 | 16 s | des immigrants yéménites, camp de Rosh HaAyin, vers 1950 | « Rosh HaAyin immigrant camp 1950 » | Families sit in front of the tents, children move. |

Pas d'IA, par choix : les massacres (Hébron 1929, Deir Yassin, le convoi de Hadassah) restent en fiches sobres, sans
images reconstituées.

## 2. Clips Gemini déjà reçus

Reçus et reconnus (10) : les orangeraies de Jaffa, le port de Jaffa, le marché aux moutons de la porte de Damas, la
savonnerie de Naplouse, l'entrée des troupes britanniques par la porte de Jaffa (1917), la procession de Nebi Musa, les
bannières de Nebi Musa à al-Aqsa, la place du marché de Jaffa, le laboureur et ses bœufs devant Jérusalem (plan 5.5),
l'aire de battage près de Bethléem. Il manque seulement **la scène du vote de l'ONU (1947)** : renvoie-la si tu l'as
encore.

## 3. Vraies vidéos d'aujourd'hui : à chercher avec Perplexity, à télécharger toi-même

Pas d'IA pour des événements récents et réels : il faut de vraies images sous licence libre (CC BY ou CC BY-SA,
jamais « NC »). Wikimedia bloque ce serveur : c'est toi qui télécharges. Questions prêtes à copier :

1. « Liste des fichiers vidéo (webm, ogv) sur Wikimedia Commons montrant les manifestations contre la réforme
   judiciaire en Israël en 2023 (Tel-Aviv, rue Kaplan, mars à juillet 2023) : nom exact du fichier, auteur, licence,
   durée, lien. Seulement CC BY, CC BY-SA ou domaine public. »
2. « Même chose pour : les manifestations d'Israéliens d'origine éthiopienne à Tel-Aviv en mai 2015 ; les
   manifestations de Neturei Karta (New York, Londres, Jérusalem) ; les manifestations ultra-orthodoxes contre la
   conscription à Jérusalem en 2024. »
3. « Même chose pour : le sit-in de Jewish Voice for Peace au Capitole (18 octobre 2023) et à la gare de Grand Central
   (27 octobre 2023) ; des rassemblements de l'association Breaking the Silence ou de jeunes objecteurs de conscience
   israéliens ; une rencontre du Parents Circle-Families Forum. Inclure aussi les vidéos du domaine public du
   gouvernement américain (Voice of America, Congrès) si elles existent. »

Plans concernés : 28.4, 29.2, 29.3, 29.4, 29.5, 30.5, 36.4, 36.6, 38.5.

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
