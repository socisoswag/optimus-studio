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

| Plan | Durée | Ce qu'on doit voir | Photo de départ | Ligne à ajouter au prompt |
|---|---|---|---|---|
| 5.5 | 10 s | un paysan laboure avec ses bœufs, Jérusalem au loin | `output/reconstitution/10-labour-boeufs.jpg` (prête) | The farmer walks behind the oxen, the plough cuts the earth. |
| 5.6 | 10 s | la loterie des terrains d'Ahuzat Bayit, futur Tel-Aviv, avril 1909 | photo d'Avraham Soskine, 11 avril 1909 (Wikimedia Commons, « Ahuzat Bayit lottery ») | The crowd on the sand dunes gathers, a man draws shells from a box. |
| 8.12 | 8 s | la manifestation de Jaffa, octobre 1933 | Bibliothèque du Congrès, matpc 15788 (prête : `data/archives/15788.jpg`) | The crowd moves forward slowly, flags and banners sway. |
| 8.13 | 10 s | la grève générale de 1936 | `output/reconstitution/18-greve-1936-camion.jpg` (prête) | The truck drives slowly through the empty street, closed shops. |
| 8.14 | 12 s | une maison dynamitée par l'armée britannique, 1936 | photo du domaine public (Bibliothèque du Congrès, Matson : démolitions de Jaffa, juin 1936) | Dust settles over the ruins, people look at the rubble. |
| 10.3 | 15 s | des membres du Bund, Russie, vers 1905 | photo du domaine public (Wikimedia Commons ou YIVO) | The group stands still, small movements, a flag moves in the wind. |
| 14.2 | 12 s | des combattants de la Haganah, 1947-1948 | photo du domaine public (Wikimedia Commons, GPO) | The men walk with their rifles, slow camera. |
| 14.3 | 13 s | l'hôtel King David après l'attentat, 22 juillet 1946 | photo du domaine public (Wikimedia Commons) | Smoke and dust drift from the collapsed wing, rescuers search the rubble. |
| 16.6 | 13 s | un soldat contrôle le laissez-passer d'un Arabe israélien, années 1950 | photo GPO (domaine public en Israël) | The soldier checks the paper, the man waits. |
| 17.3 | 17 s | des Juifs irakiens arrivent à l'aéroport de Lod, 1951 | photo GPO (opération Ezra et Néhémie) | Families step down from the plane with their bags. |
| 17.4 | 16 s | une maabara (camp de toile), vers 1950 | photo GPO | Children walk between the tents, laundry moves in the wind. |
| 20.7 | 11 s | Amman, septembre 1970 | photo du domaine public ou sous licence libre | Smoke over the city, empty street. |
| 22.2 et 22.3 | 13 s et 13 s | la première intifada, Gaza, 1987-1988 | deux photos sous licence libre (Wikimedia Commons) | Young people in the street, soldiers in the distance, no violence shown close up. |
| 26.2 | 15 s | les colons du Goush Emounim à Sébastia, 1975 | photo GPO | The crowd of settlers stands on the hill, flags. |
| 28.2 | 17 s | la manifestation des Black Panthers israéliens, Jérusalem, 1971 | photo GPO | The demonstrators march with their signs. |
| 28.3 | 16 s | des immigrants yéménites, camp de Rosh HaAyin, vers 1950 | photo GPO | Families sit in front of the tents, children move. |

Pas d'IA, par choix : les massacres (Hébron 1929, Deir Yassin, le convoi de Hadassah) restent en fiches sobres, sans
images reconstituées.

## 2. Clips Gemini déjà faits mais absents du disque : à renvoyer

Ils sont dans SOURCES.md 4 mais plus ici (le conteneur a été vidé) : **les troupes britanniques entrent par la porte de
Jaffa (1917)**, **la procession de Nebi Musa**, **les bannières de Nebi Musa à al-Aqsa**, **la place du marché de
Jaffa**, et **la scène du vote de l'ONU (1947)**. Renvoie-les tels quels, je les reconnais tout seul.

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
