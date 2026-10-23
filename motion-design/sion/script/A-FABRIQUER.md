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

**Photos prêtes** : toutes faites (les 5 dernières, 14.2, 14.3, 17.3, 17.4 et 28.3, avec Kling le 23 octobre).

**Deux dernières photos, prêtes pour Kling** (trouvées le 23 octobre sur Wikimedia Commons ; dans
`output/a-faire-kling/`, 6 et 7) :

| Plan | Durée | Ce qu'on doit voir | Photo de départ | Ligne à ajouter au prompt |
|---|---|---|---|---|
| 26.2 | 15 s | des colons du Goush Emounim lèvent le drapeau sur une colonie non autorisée, 22 septembre 1978 | `data/reconstitution/30-goush-emounim-1978.jpg` | The settlers on the rocky hilltop gather around the flagpole and unpack their equipment; the flag waves slowly in the wind and keeps its exact design; a few people walk slowly over the rocks. |
| 28.2 | 17 s | des militants des Black Panthers israéliens, université de Tel-Aviv, 1972 | `data/reconstitution/31-black-panthers-1972.jpg` | The young men and women stand together in the sun with small natural movements: a smile, a glance, a hand moving; light wind in their hair and shirts. Nobody walks in. |

Le plan 16.6 (le gouvernement militaire, 1948 à 1966) devient une fiche sur la carte (`timelines/documents-4.js`) :
aucune photo libre d'un contrôle de laissez-passer.

Pas d'IA, par choix : les massacres (Hébron 1929, Deir Yassin, le convoi de Hadassah) restent en fiches sobres, sans
images reconstituées.

## 2. Clips Gemini déjà reçus

Reçus et reconnus (21) : les orangeraies de Jaffa, le port de Jaffa, le marché aux moutons de la porte de Damas, la
savonnerie de Naplouse, l'entrée des troupes britanniques par la porte de Jaffa (1917), la procession de Nebi Musa, les
bannières de Nebi Musa à al-Aqsa, la place du marché de Jaffa, le laboureur et ses bœufs devant Jérusalem (plan 5.5),
l'aire de battage près de Bethléem, la manifestation de Jaffa en 1933 (8.12), le souk vide en 1936 (8.13), Lydda en
1936 (8.14), le mur occidental (10.4), le Bund en 1917 (10.3), Tel-Aviv en 1909 (5.6), puis avec Kling : la Haganah
(14.2), l'hôtel King David (14.3), Lod en 1951 (17.3), la maabara de Nahariya (17.4) et Rosh HaAyin (28.3). Il manque
seulement **la scène du vote de l'ONU (1947)** : renvoie-la si tu l'as encore.

## 3. Événements récents : faits en fiches sur la carte (fait)

Pas d'IA pour un événement récent ni pour une tuerie : septembre 1970 (20.7), Jabaliya et l'intifada (22.2, 22.3),
les Israéliens éthiopiens (28.4), Neturei Karta, Jewish Voice for Peace, Briser le silence (29.2 à 29.5), les
yeshivas (30.5), la réforme de la justice (36.4, 36.6) et le Cercle des parents (38.6) sont des fiches animées sur
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

Réponse du 23 octobre : la phrase de Herzl (plan 6.9) est « Mais qui donc songerait à les éloigner ? » (transcription
PalQuest ; « Mans » y est une coquille). Voix et fiche corrigées.

Encore une question :

1. « Le film "Paths in Palestine" (Archives nationales américaines, NARA, identifiant 2767364, série 428-NPC, copie
   archive.org 428-npc-44524) porte au générique "Copyright MCMXXXIV, International Copyright Secured". Qui l'a
   produit (la marine des États-Unis ou une société privée ?), le droit d'auteur de 1934 a-t-il été renouvelé
   (registre du Copyright Office, 1961-1962), et le film est-il aujourd'hui dans le domaine public aux États-Unis ? »

## 6. Sujets ajoutés le 23 octobre : chiffres à vérifier sur Perplexity

Les fiches sont faites (`timelines/documents-6.js`) et restent qualitatives tant que la réponse n'est pas là ; les
plans marqués « verifier » dans le script ne s'enregistrent pas avant.

> Pour un documentaire, donne des chiffres récents et datés avec leurs sources primaires (lien) : 1) l'eau en
> Cisjordanie : consommation moyenne par Palestinien et par colon (litres par jour), part des nappes contrôlée par
> Israël depuis Oslo II (rapports B'Tselem, Amnesty, Banque mondiale, ONU) ; 2) les villages bédouins non reconnus du
> Néguev : combien aujourd'hui, et combien de fois al-Araqib a été démoli ; 3) les mineurs palestiniens jugés chaque
> année par les tribunaux militaires israéliens, et le nombre de détenus administratifs au dernier décompte (B'Tselem,
> HaMoked, Defense for Children International, UNICEF) ; 4) l'enquête du New York Times du 10 décembre 2023 sur l'argent
> du Qatar vers Gaza et la phrase de Netanyahou rapportée par Haaretz (mars 2019) : texte exact, date, lien ; 5) le
> nombre de journalistes tués à Gaza depuis octobre 2023 selon le CPJ, et la phrase du CPJ qui en fait le conflit le
> plus meurtrier ; 6) le nombre exact de vetos américains au Conseil de sécurité sur des résolutions concernant Israël
> et la Palestine depuis 1972 ; 7) des photos libres de droits (domaine public ou CC BY) du Jour de la Terre (30 mars
> 1976) et des maisons arabes de Jaffa ou d'Ajami occupées par de nouveaux immigrants en 1949 (fonds GPO, Wikimedia
> Commons, Bibliothèque nationale d'Israël).

### Priorité : l'argent du Qatar (plan 25.8, juste avant le 7 octobre)

> Pour un documentaire, avec le texte exact dans la langue d'origine, la date et le lien : 1) l'enquête du New York
> Times du 10 décembre 2023 (« Buying Quiet: Inside the Israeli Plan That Propped Up Hamas ») : montants versés par le
> Qatar à Gaza avec l'accord du gouvernement israélien, période, et la phrase qui résume la stratégie ; 2) la phrase de
> Benyamin Netanyahou rapportée par Haaretz, réunion des députés du Likoud de mars 2019 (« celui qui veut empêcher un
> État palestinien doit soutenir le renforcement du Hamas… ») : texte exact en anglais ou en hébreu, qui l'a rapportée,
> et Netanyahou l'a-t-il démentie ; 3) la phrase de Bezalel Smotrich de 2015 (« l'Autorité palestinienne est un
> fardeau, le Hamas est un atout ») : texte exact, média, date ; 4) l'article de Tal Schneider dans The Times of Israel
> du 8 octobre 2023 (« For years, Netanyahu propped up Hamas ») : titre et passage clé ; 5) la réponse officielle du
> bureau de Netanyahou à ces accusations.

