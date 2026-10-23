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
bannières de Nebi Musa à al-Aqsa, la place du marché de Jaffa, le laboureur et ses bœufs devant Jérusalem (plan 5.8),
l'aire de battage près de Bethléem, la manifestation de Jaffa en 1933 (8.15), le souk vide en 1936 (8.16), Lydda en
1936 (8.17), le mur occidental (10.4), le Bund en 1917 (10.3), Tel-Aviv en 1909 (5.9), puis avec Kling : la Haganah
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

## 6. Réponses Perplexity du 23 octobre 2026 (dossier de vérification, 26 pages) : intégrées

Fiches (`timelines/documents-6.js`, `timelines/gaza.js`) et voix corrigées, sources dans SOURCES.md (section 7) :
Gaza au 22 octobre 2026 (74 498 morts, 175 616 blessés, 1 538 morts depuis la trêve ; nouvelle fiche « depuis le
cessez-le-feu », plan 25.41) ; l'argent du Qatar (plan 25.18), la phrase rapportée de Netanyahou avec son démenti
(plan 25.19) et celle de Smotrich (plan 25.20) ; l'eau (plan 23.14) ; le Néguev (plan 28.8) ; les détenus (plan
35.19) ; les journalistes, d'après le CPJ (plan 27.8) ; les vetos (plan 33.9 : 52, de 1972 à 2025, dont un amendement) ;
Macron (plan 31.16) ; la Cisjordanie (plan 26.8) ; Barghouti (plan 21.13) ; la photo du Goush Emounim (plan 26.2) :
mont Huwara, près de Naplouse.

Restent ouverts (sans bloquer la voix) : le bulletin original du ministère de la Santé de Gaza ; le compteur d'al-Araqib
en 2026 ; la capture datée du tableau HaMoked ; la date exacte de la photo FL45816230 sur la notice de la Bibliothèque
nationale d'Israël ; aucune photo libre validée du Jour de la Terre 1976 ni des maisons de Jaffa en 1949 (on s'en passe).

## 7. Nouveaux sujets du 23 octobre au soir : réponses reçues et intégrées (dossier Perplexity, 16 points)

Corrections faites : Meyer Habib (sa phrase du 23 octobre 2023 à l'Assemblée ; « mon meilleur ami » non vérifié, retiré) ; ELNET (101 des 666 voyages, Mediapart) ; Albanese (environ 1 000 entités, des dizaines nommées) ; la base de l'ONU (112 puis 97 entreprises, dont Alstom et Egis) ; l'AIPAC (61 millions de dollars en 2023-2024) ; les églises (18 et 3 morts) ; les villages bédouins (non raccordés aux réseaux publics). Pegasus n'est pas ajouté : l'espionnage relevé vient du Maroc, le lien avec Israël tient à la licence d'exportation. Questions posées :

> Pour un documentaire, avec pour chaque point le texte exact dans la langue d'origine, la date, la source primaire et
> le lien. 1) The New York Times, 30 novembre 2023, le document « Jericho Wall » : auteurs de l'article, nombre de pages,
> date à laquelle l'armée l'obtient, et les alertes de 2023 (analyste de l'unité 8200) ; 2) +972 Magazine, 3 avril
> 2024, « Lavender » : nombre de Palestiniens marqués, nombre d'officiers interrogés, durée du contrôle humain, et la
> réponse officielle de l'armée israélienne ; 3) Donald Trump, conférence de presse du 4 février 2025 avec Netanyahou :
> phrases exactes sur la prise de Gaza par les États-Unis, la « Riviera du Moyen-Orient » et le départ des habitants ;
> 4) le bilan du Haut-Commissariat de l'ONU aux droits de l'homme sur les Palestiniens tués en cherchant de la
> nourriture du 27 mai au 31 juillet 2025 (total, et près des sites de la Gaza Humanitarian Foundation) ; 5) B'Tselem,
> « Welcome to Hell », août 2024 : date, nombre de témoignages ; Sde Teiman, 29 juillet 2024 : arrestation de soldats,
> accusation, intrusion de manifestants et de députés ; 6) les frappes sur l'église Saint-Porphyre (19 octobre 2023) et
> sur l'église de la Sainte-Famille (17 juillet 2025) à Gaza : bilans et sources ; 7) Disclose et Marsactu, mars 2024 :
> Eurolinks, nombre de maillons, destinataire, date ; Eurosatory 2024 : décision d'exclure les firmes israéliennes,
> date, et décision du tribunal de commerce de Paris ; 8) le télégramme du ministre de l'Intérieur du 12 octobre 2023
> sur les manifestations propalestiniennes, et l'ordonnance du Conseil d'État du 18 octobre 2023 (phrase clé) ;
> 9) Meyer Habib : ses mandats de député (dates, circonscription, élections annulées ou perdues, situation en octobre
> 2026) et ses phrases exactes sur son lien avec Benyamin Netanyahou, avec le média et la date ; 10) ELNET France :
> inscription au répertoire de la HATVP, dépenses déclarées, voyages d'élus en Israël (nombre, années) ; 11) avril 2025 :
> les visas des élus français annulés par Israël (nombre, partis, date) ; août 2025 : la lettre de Netanyahou à Macron
> (phrase exacte) et la réponse de l'Élysée (mot exact) ; 12) le rapport A/HRC/59/23 de Francesca Albanese (juillet
> 2025) : nombre d'entreprises nommées, exemples, et date des sanctions américaines contre elle ; 13) la base de données
> de l'ONU sur les entreprises liées aux colonies : nombre en février 2020 et après la mise à jour de juin 2023,
> exemples ; 14) l'AIPAC et le United Democracy Project : dépenses aux primaires de 2024 (total et exemples : Jamaal
> Bowman, Cori Bush), d'après la FEC ou OpenSecrets ; nombre de membres revendiqué par Christians United for Israel ;
> 15) les villages bédouins non reconnus : une source (Human Rights Watch, « Off the Map », 2008, ou plus récente) sur
> l'absence de raccordement aux réseaux d'eau et d'électricité ; 16) le logiciel espion Pegasus (NSO Group) : la licence
> d'exportation du ministère israélien de la Défense, et le numéro d'Emmanuel Macron dans la liste révélée par Forbidden
> Stories et Le Monde en juillet 2021 (quel pays client est soupçonné, qu'a confirmé l'enquête).

## 8. Relecture complète du 23 octobre (la terre, 1948, Gaza, le génocide) : réponses reçues et intégrées (17 points)

Corrections faites : le code de 1858 (des paysans évitent l'enregistrement, des notables accumulent les titres) ; Petah Tikva (29 mars 1886, « l'un des premiers ») ; le Fonds national juif (mémorandum de 1907) ; les Sursock (1 746 familles, chiffres de 1930 discutés) ; Hope Simpson (29,4 % dans 104 villages) ; Herzog (12 octobre) ; le blocus (78 jours) ; E1 (3 401 logements) ; al-Omari (gravement endommagée) ; les phrases exactes d'Amnesty, de B'Tselem, de l'IAGS et de Navi Pillay. Questions posées :

> Pour un documentaire, avec pour chaque point le texte exact dans la langue d'origine, la date, la source primaire
> ou l'historien de référence, et le lien. 1) Edmond de Rothschild : à partir de quelle date il finance Rishon LeZion,
> Zikhron Yaakov et Rosh Pina, quand il confie ses colonies à la Jewish Colonization Association, comment ses agents
> achetaient les terres, et l'ordre de grandeur des ouvriers arabes employés dans ses colonies vers 1890-1900 (Gershon
> Shafir, Ran Aaronsohn) ; 2) le code foncier ottoman de 1858 : l'obligation d'enregistrer les terres et les inscriptions
> au nom de notables pour échapper à l'impôt et à la conscription (Kenneth Stein, Rashid Khalidi) ; 3) Petah Tikva et le
> village de Yahudiya en 1886 : date exacte et faits de l'affrontement ; 4) le Fonds national juif (1901) : la règle
> des terres inaliénables, louées seulement à des Juifs, et le texte qui la fixe ; 5) les ventes de la famille Sursock
> dans la plaine de Jezréel dans les années 1920 : surfaces, nombre de villages, nombre de familles ou de métayers
> expulsés ; 6) le rapport Hope Simpson (octobre 1930) : le pourcentage exact de familles arabes rurales sans terre, et
> la lettre de Ramsay MacDonald du 13 février 1931 ; 7) le lien entre paysans chassés, bidonvilles de Haïfa et
> Izz ad-Din al-Qassam ; 8) le plan Dalet du 10 mars 1948 : la phrase exacte sur la destruction des villages et
> l'expulsion de la population en cas de résistance (texte hébreu et traduction de Walid Khalidi, 1988) ; 9) Tantura
> (22-23 mai 1948) et al-Dawayima (29 octobre 1948) : bilans selon les historiens (Benny Morris, Adam Raz, Teddy Katz) et
> le film « Tantura » d'Alon Schwarz (2022) ; 10) Gadi Eisenkot, doctrine Dahiya, Yedioth Ahronoth, octobre 2008 : phrase
> exacte (« force disproportionnée », « ce ne sont pas des villages civils, ce sont des bases militaires ») ; 11) Isaac
> Herzog (13 octobre 2023), Amichai Eliyahu (5 novembre 2023) et Avi Dichter (11 novembre 2023) : phrases exactes, et
> où la Cour internationale de justice ou la requête de l'Afrique du Sud les citent ; 12) Hind Rajab (29 janvier 2024) :
> faits, date où elle est retrouvée, les deux secouristes, l'enquête de Forensic Architecture ; 13) les secouristes tués
> à Rafah le 23 mars 2025 : nombre, organisations, la vidéo, les conclusions de l'enquête de l'armée israélienne ;
> 14) le blocus total de l'aide à Gaza en 2025 : date de début et de reprise ; 15) le projet E1 : date d'approbation,
> nombre de logements, phrase exacte de Bezalel Smotrich ; 16) Gaza : la Grande Mosquée al-Omari (date de destruction),
> les universités (combien détruites ou endommagées), les Archives centrales, le mot « scolasticide » des experts de
> l'ONU ; 17) le texte exact (en français si possible) des conclusions sur le génocide : Amnesty International
> (5 décembre 2024, Agnès Callamard), Human Rights Watch (19 décembre 2024, titre du rapport), B'Tselem et PHRI
> (« Notre génocide », 28 juillet 2025), l'Association internationale des chercheurs sur le génocide (résolution du
> 1er septembre 2025, et le pourcentage des votes), Omer Bartov (The New York Times, 15 juillet 2025), la commission
> d'enquête de l'ONU (16 septembre 2025, phrase de conclusion et actes retenus).

## 9. Les autres films longs en français sur YouTube (relevé Perplexity du 23 octobre 2026)

Huit vidéos de plus de 45 minutes retrouvées ; aucune ne couvre en un seul film la période de 1881 à Gaza en octobre
2026 (le relevé n'est pas exhaustif : ne jamais écrire « le seul » ni « le premier »).

| Chaîne | Titre | Durée | Période |
|---|---|---|---|
| Osons Causer | L'origine du conflit : de l'invention du sionisme à la création d'Israël | 1 h 04 | fin XIXe siècle à 1949 |
| France Culture | Avant l'État d'Israël, le sionisme et le peuplement de la Palestine (Le Cours de l'histoire) | 59 min | émission de radio |
| Palestine report | film de Simone Bitton (1992), de 1880 à 1950 | 56 min | 1880 à 1950, beaucoup d'archives |
| World View - History | Une terre deux fois promise, épisodes 1 et 2 (William Karel, Blanche Finger) | 1 h 46 | 1897 à 1967 |
| SLICE Histoire | Et Israël fut (Romed Wyder) | 53 min | origines à 1948 |
| Histoire d'apprendre | L'Histoire du conflit israélo-palestinien (compilation) | 4 h 07 | bibliographie en description |
| ELUCID | entretien avec Monique Chemillier-Gendreau | 1 h 31 | entretien, jusqu'à 2025 |
| ARTE | Dans Gaza (Hélène Lam Trong) | 1 h 12 | Gaza depuis octobre 2023 |

Ce qui distingue SION, à dire tel quel : de 1881 à octobre 2026 en un seul film, la source affichée à l'écran plan
par plan (les autres donnent au mieux une bibliographie en description), cartes 3D et archives libres de droits.

## 10. À confirmer sur Perplexity (séquence « Quatre guerres », chapitre 25)

1. « Quel est le bilan final du ministère de la Santé de Gaza (ou du ministère de la Santé palestinien) pour l'offensive
   israélienne de novembre 2012 (« Pilier de défense », 14 au 21 novembre 2012) : nombre de morts, dont enfants ? Donner
   la source d'origine (communiqué du ministère, date, lien). Euro-Med Monitor cite 185 morts, dont 47 enfants. »
2. « Sur la page « Data on casualties » d'OCHA (ochaopt.org/data/casualties), combien de Palestiniens et d'Israéliens
   ont été tués du 1er janvier 2008 au 19 septembre 2023, au total, puis à Gaza seulement ? Plusieurs médias citent
   6 407 Palestiniens et 308 Israéliens. Donner les chiffres exacts du tableau et la date de consultation. »
3. « Quel est le bilan final du ministère de la Santé de Gaza pour mai 2021 (10 au 21 mai) ? Le jour du cessez-le-feu,
   il donnait 243 morts dont 66 enfants ; l'ONU (Haut-Commissariat) en compte 261 dont 67 enfants. »
4. « La liste nominative des morts de Gaza publiée par le ministère de la Santé (reprise par Tech for Palestine,
   data.techforpalestine.org) : combien de noms dans la mise à jour du 27 juillet 2026, combien d'enfants de moins de
   18 ans et de moins d'un an ? Le site donne 72 835 noms, 21 637 enfants, 1 072 de moins d'un an. »

## 11. Cartes « Le plan Peel » et « L'eau » : vérifié le 23 octobre au soir (Perplexity à court de crédits, sources primaires)

- Peel, transfert : CONFIRMÉ sur le texte du rapport (Cmd. 5479, chapitre XXII, texte sur la Jewish Virtual Library) :
  « Sooner or later there should be a transfer of land and, as far as possible, an exchange of population. » ;
  « in the area allocated to the Jewish State [...] there are now about 225,000 Arabs. In the area allocated to the
  Arab State there are only about 1,250 Jews ».
- 20e congrès sioniste (Zurich, août 1937) : CONFIRMÉ (Encyclopaedia Judaica, « Palestine, Partition and Partition
  Plans ») : le plan est jugé inacceptable, l'exécutif est autorisé à négocier les termes précis d'un État juif, à
  soumettre à un nouveau congrès. Abandon par Londres : déclaration de novembre 1938 après le rapport Woodhead (Cmd. 5893).
- B'Tselem, Parched (mai 2023) : CONFIRMÉ, 82,4 et 247 litres ; « the World Health Organization and the United States
  Agency for International Development recommend 100 liters of water per person per day ». Israël, de son côté,
  invoque l'accord intérimaire de 1995.
- Amnesty, Troubled Waters (octobre 2009) : CONFIRMÉ, « Israel uses more than 80 per cent of the water from the Mountain
  Aquifer » ; le comité mixte de l'eau décide par consensus (Oslo II, annexe III, article 40), chaque côté peut donc
  refuser un projet.

Questions gardées pour Perplexity (quand le compte aura des crédits) :

1. « Dans le rapport de la commission royale pour la Palestine (commission Peel, Cmd. 5479, 7 juillet 1937), quels
   chiffres exacts sont donnés pour le transfert de population proposé (Arabes de l'État juif, Juifs de l'État arabe) ?
   Citer le paragraphe en anglais. On a : jusqu'à 225 000 Arabes et 1 250 Juifs. »
2. « Qu'a décidé le 20e congrès sioniste (Zurich, août 1937) sur le plan Peel : rejet du tracé et mandat pour
   négocier un meilleur partage ? Et à quelle date Londres a-t-il abandonné le partage (rapport Woodhead et déclaration
   du gouvernement, novembre 1938) ? Citer la résolution et le texte britannique. »
3. « Le rapport « Parched » de B'Tselem (2 mai 2023) cite-t-il un minimum de 100 litres par jour et par personne
   recommandé par l'Organisation mondiale de la santé ? Citer la phrase exacte. »
4. « Amnesty International, Troubled Waters (octobre 2009) : quelle part de l'eau de la nappe de la montagne Israël
   utilise-t-il (environ 80 %) et que dit le rapport du comité mixte de l'eau et des refus de puits palestiniens ?
   Citer les phrases. »
