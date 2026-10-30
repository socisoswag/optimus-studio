"""Vraies archives filmées du domaine public, mises au format du film : output/archives-filmees/<nom>.mp4.

    python3 tools/archives_filmees.py            (toutes)
    python3 tools/archives_filmees.py eichmann   (celles dont le nom contient « eichmann »)

Chaque plan est pris sur archive.org dans le fichier d'origine (jamais les copies réduites), seulement les passages
utiles (jamais le film entier), coupe par coupe à l'image près, recadré à l'intérieur de l'image (sans les bords
arrondis ni le noir de la pellicule ; recadrage en pixels du fichier, avant la correction de forme des pixels).
Restauration, sans IA :
  - retour aux images du film : les actualités transférées en vidéo NTSC entrelacée (29,97 i/s, 3 images de film
    sur 5 étalées en demi-images) retrouvent leurs 24 images par seconde d'origine (télécinéma inverse) ;
  - cadence : 24 et 23,976 i/s passent à 25 sans perdre ni doubler d'image (légère accélération, comme à la télévision) ;
  - scintillement lissé, poussières et taches d'une seule image remplacées par l'image voisine (seulement là où l'image
    d'avant et celle d'après sont identiques, jamais sur un mouvement), bruit atténué ;
  - films tournés à la manivelle (1903, 1918) : tremblement de la pellicule corrigé, mouvement de caméra gardé.
Puis mis au format du film comme les autres archives (tools/plans_reels.sh) : 1080p 25 i/s, look « archive »
(tools/looks.py), halo, courbe pellicule, grain et vignette (sans flottement : il se lisait comme une saccade). Sans son : le son vient du montage.
Sources et licences : SOURCES.md 4.2.
"""
import glob
import json
import os
import subprocess
import sys
import tempfile
import urllib.parse

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output", "archives-filmees")
IA = "https://archive.org/download/"

# nom : (identifiant archive.org, fichier d'origine, recadrage w:h:x:y en pixels du fichier, [(début, fin) de chaque coupe, en s]
#        [, options : pre = réglage d'exposition avant le look (copie trop claire ou trop sombre), stab = corriger le
#        tremblement de la pellicule, decimer = copie déjà désentrelacée qui garde les images en double du télécinéma,
#        rayure = (x, largeur) d'une rayure verticale permanente de la copie, en pixels du fichier, comblée par ses voisins])
ARCHIVES = {
    "1903-ellis-island-immigrants": ("emigrants-i.e.-immigrants-landing-at-ellis-island",
                                     "Emigrants_(i.e._immigrants)_landing_at_Ellis_Island_-.webm", "1408:1056:16:12", [(85.0, 91.0)],
                                     {"stab": True}),
    "1899-melies-dreyfus-ile-du-diable": ("LAffaireDreyfus1899", "L’Affaire Dreyfus (1899).mp4", "620:465:10:8", [(83.0, 92.0)]),
    "1899-melies-dreyfus-bagarre-journalistes": ("LAffaireDreyfus1899", "L’Affaire Dreyfus (1899).mp4", "620:465:10:8", [(451.0, 461.0)]),
    "1950-sands-of-sorrow-refugies": ("sands_of_sorrow", "sands_of_sorrow.mpeg", "690:466:15:7",
                                      [(126.0, 131.0), (148.0, 154.0), (220.5, 225.5)],
                                      {"pre": "curves=all='0/0 0.35/0.24 0.7/0.55 1/0.84'"}),
    "1897-lumiere-jerusalem-porte-de-jaffa": ("JaffaGateJerusalem1897", "Porte de Jaffa - coté Est.mkv", "1300:975:310:54", [(10.0, 20.0)]),
    "1918-jerusalem-mur-occidental": ("jerusalem-1918", "Jérusalem, 1918.mp4", "600:450:20:15",
                                      [(77.2, 83.4), (110.8, 116.7), (123.0, 124.9)], {"stab": True}),
    "1961-proces-eichmann": ("1961-04-13_Eichmann_trial", "1961-04-13_Eichmann_trial.mpeg", "652:436:34:22",
                             [(4.9, 8.8), (9.1, 13.0), (13.3, 21.2), (35.7, 39.0)]),
    # actualités Universal (domaine public), en réserve : camp de personnes déplacées d'Admont, Autriche, septembre 1946
    "1946-camp-refugies-juifs-autriche": ("1946-09-19_Sec_Wallace_Stirs_Foreign_Policy_Debate",
                                          "1946-09-19_Sec_Wallace_Stirs_Foreign_Policy_Debate.mpeg", "652:420:34:30",
                                          [(68.9, 73.9), (77.4, 81.1), (114.3, 117.5)]),
    # Nasser annonce la nationalisation du canal de Suez, juillet 1956
    "1956-nasser-canal-de-suez": ("1956-07-30_Suez_Canal_Seized", "1956-07-30_Suez_Canal_Seized.mpeg", "692:462:14:9",
                                  [(4.6, 7.4), (11.9, 16.8), (31.1, 34.5)]),
    # juin 1967 : un char dans le Sinaï, le panneau « Welcome to Gaza »
    "1967-sinai-gaza": ("1967-06-09_Egypt_Accepts_UN_Cease-Fire", "1967-06-09_Egypt_Accepts_UN_Cease-Fire.mpeg", "696:462:12:9",
                        [(3.6, 7.7), (24.1, 29.7)]),
    # juin 1967 : la ligne de partage de Jérusalem, Moshe Dayan, le drapeau hissé
    "1967-jerusalem": ("1967-06-13_Cease-Fire", "1967-06-13_Cease-Fire.mpeg", "696:462:12:9",
                       [(252.1, 257.2), (268.9, 273.6), (274.2, 279.3)]),
    # juin 1967 : le Conseil de sécurité des Nations unies, à New York
    "1967-onu-conseil-de-securite": ("1967-06-13_Cease-Fire", "1967-06-13_Cease-Fire.mpeg", "696:462:14:9",
                                     [(5.4, 11.0), (17.7, 23.5), (47.9, 51.5)]),
    # United News (Office of War Information, domaine public), juin 1946 : des réfugiés juifs d'Europe débarquent en Palestine
    "1946-refugies-juifs-palestine": ("ARC-31482", "ARC-31482.mov", "1248:704:16:8",
                                      [(309.5, 313.5), (314.0, 317.5), (318.0, 321.0), (322.0, 326.5)], {"decimer": True}),
    # même actualité : Amman fête l'indépendance de la Transjordanie, l'émir Abdallah, la Légion arabe (en réserve)
    "1946-transjordanie-independance": ("ARC-31482", "ARC-31482.mov", "1248:704:16:8",
                                        [(336.0, 339.0), (343.5, 346.5), (366.0, 369.0), (375.0, 380.0)], {"decimer": True}),
    # US Air Force (domaine public), octobre 1973 : le pont aérien vers Israël, déchargement d'un char à Lod
    "1973-pont-aerien-americain": ("342-adw-264", "342-adw-264-r6.mp4", "1400:1050:260:15",
                                   [(380.0, 386.5), (915.5, 921.0), (927.0, 932.5)]),
    "1945-roosevelt-ibn-saoud": ("1945-02-21_FDR_confers_with_Middle_East_Chiefs",
                                 "1945-02-21_FDR_confers_with_Middle_East_Chiefs.mpeg", "674:462:16:9",
                                 [(79.5, 83.6), (87.2, 90.3), (124.5, 136.3)]),
    "1956-sinai-gaza-armee-israelienne": ("1956-11-05_Eisenhower_Re-Elected", "1956-11-05_Eisenhower_Re-Elected.mpeg",
                                          "694:462:14:9", [(54.6, 56.5), (57.0, 60.0), (63.3, 66.4)],
                                          {"pre": "curves=all='0/0 0.25/0.36 0.6/0.72 1/1'"}),
    "1956-port-said": ("1956-11-12_Near_East_Crisis", "1956-11-12_Near_East_Crisis.mpeg", "694:462:14:9",
                       [(5.5, 10.8), (30.2, 33.0), (44.0, 46.8)]),
    "1957-tel-aviv-retrait-gaza": ("1957-02-14_Tel_Aviv_Israel", "1957-02-14_Tel_Aviv_Israel.mpeg", "694:462:14:9",
                                   [(2.6, 4.3), (4.6, 7.0), (7.3, 10.5), (13.5, 15.3)]),
    "1967-mai-pacte-nasser-hussein": ("1967-06-06_Mid-East", "1967-06-06_Mid-East.mpeg", "696:462:12:9",
                                      [(30.0, 33.4), (47.5, 52.5), (35.6, 42.0)]),
    # film amateur de la famille Levy (Prelinger Archives, domaine public), 1933 : la prière au mur occidental, l'inscription
    # en hébreu sur les pierres, la foule au pied du mur ; rayure verticale permanente de la copie retirée (colonnes 182-187)
    "1933-jerusalem-mur-occidental": ("Levycoll1933", "Levycoll1933.mpeg", "360:466:2:8",
                                      [(376.2, 378.9), (381.0, 385.0), (396.1, 402.6), (403.4, 405.4)],
                                      {"rayure": (182, 6), "pre": "curves=all='0/0.03 0.2/0.32 0.55/0.7 1/0.98'"}),
    # US Army Signal Corps (archives nationales américaines 111-ADC-9721), « Freed Jews », 17 avril 1945 : un train de
    # déportés juifs libéré par l'armée américaine en Allemagne, les rescapés le long des wagons, la foule autour d'un soldat
    "1945-deportes-juifs-liberes": ("111-adc-9721", "111-adc-9721.mp4", "1424:1068:248:6",
                                    [(63.6, 67.3), (75.0, 78.6), (96.8, 99.6)]),
    # US Army Signal Corps (111-ADC-5604), « D P Zionist demonstration, Frankfurt, Germany », novembre 1945 : banderole à
    # Truman, un jeune homme qui crie, « Open the gates of Palestine », le drapeau à l'étoile de David
    "1945-francfort-personnes-deplacees-juives": ("111-adc-5604", "111-adc-5604.mp4", "688:440:12:26",
                                                  [(160.5, 164.0), (133.2, 136.0), (201.7, 205.2), (218.5, 221.0)]),
    # actualités Universal « Nazi Murder Mills », 26 avril 1945 (domaine public) : Eisenhower, Bradley et Patton au camp
    # d'Ohrdruf, puis des rescapés ; seulement des visages, aucun corps à l'image
    "1945-ohrdruf-camp-libere": ("1945-04-26_Nazi_Murder_Mills", "1945-04-26_Nazi_Murder_Mills.mpeg", "672:450:24:14",
                                 [(128.2, 131.3), (140.2, 145.8), (151.2, 154.2), (251.0, 252.9), (257.0, 259.6), (260.1, 262.7)]),
    # actualités Universal du 28 juin 1945, « San Francisco Parley Ends » : le 26 juin, cinquante pays signent la Charte des
    # Nations unies (les délégués et les drapeaux, deux signatures, le livre de la Charte, Truman et Stettinius)
    "1945-san-francisco-charte-onu": ("1945-06-28_San_Francisco_Parley_Ends", "1945-06-28_San_Francisco_Parley_Ends.mpeg",
                                      "690:456:16:12", [(16.2, 19.6), (7.2, 9.4), (27.2, 30.4), (12.2, 15.6), (33.2, 36.3)]),
    # même film amateur Levy, 1933 : le dôme du Rocher, la place devant les murs de Jérusalem, un passant, la foule d'une
    # rue commerçante, des hommes en robe sur une estrade de marché
    "1933-jerusalem-bethleem-rues": ("Levycoll1933", "Levycoll1933.mpeg", "360:466:2:8",
                                     [(538.0, 539.8), (523.0, 531.5), (113.4, 115.4), (900.0, 902.5), (905.5, 909.8)],
                                     {"rayure": (182, 6)}),
    # « Sands of Sorrow » (1950), autre passage : les enfants des camps de réfugiés palestiniens, sous la tente-école
    "1950-sands-of-sorrow-enfants": ("sands_of_sorrow", "sands_of_sorrow.mpeg", "690:466:15:7",
                                     [(1121.5, 1124.0), (1127.3, 1131.0), (1154.4, 1157.4)],
                                     {"pre": "curves=all='0/0 0.35/0.24 0.7/0.55 1/0.84'"}),
    # le camp de tentes vu de loin, puis les tentes de près (1:41 à 1:55 du film)
    "1950-sands-of-sorrow-camp-de-tentes": ("sands_of_sorrow", "sands_of_sorrow.mpeg", "690:466:15:7",
                                            [(101.5, 108.6), (111.3, 115.2)],
                                            {"pre": "curves=all='0/0 0.35/0.24 0.7/0.55 1/0.84'"}),
    # actualités Universal du 1er novembre 1956, « War in Egypt » : la flotte en Méditerranée orientale, les avions,
    # une bombe sous l'aile
    # actualités Universal du 18 mai 1948, « Jews Defend New Zion State », copie du musée américain de l'Holocauste (USHMM,
    # irn1000897, « Public Domain », d'après la NARA 200 UN 21-144-1) : Haïfa vue d'en haut, des hommes arabes fouillés, des
    # femmes qui partent avec leurs bagages, une vieille femme, une mère et son enfant ; aucun corps à l'image ; recadrée
    # au-dessus du minutage incrusté de la copie
    "1948-haifa-habitants-arabes": ("https://film-assets.ushmm.org/mp4/FV0936_RG601137.01.01.mp4", "", "624:400:8:16",
                                    [(4.4, 6.8), (28.0, 31.0), (40.1, 44.3), (46.9, 49.3), (50.0, 53.0)], {"decimer": True}),
    # Wikimedia Commons, « Golda Meir visiting Sinai front, 1973 » (service film du porte-parole de l'armée israélienne,
    # CC BY-SA 3.0), 15 octobre 1973 : Golda Meir au milieu des soldats, sous une tente, puis les soldats derrière les
    # barbelés (avant le panoramique filé) ; copie déjà très contrastée, hautes lumières adoucies ; fichier coupé vers 10 min 08
    "1973-golda-meir-front-du-sinai": ("https://upload.wikimedia.org/wikipedia/commons/0/0b/Golda_Meir_visiting_Sinai_front,_1973.webm",
                                       "", "468:360:6:0", [(281.2, 289.2), (569.6, 574.0), (574.4, 576.4)],
                                       {"pre": "curves=all='0/0.03 0.3/0.27 0.6/0.52 0.85/0.72 1/0.8'"}),
    # même film : la foule des soldats autour d'elle, puis les soldats alignés derrière les barbelés
    "1973-golda-meir-soldats-sinai": ("https://upload.wikimedia.org/wikipedia/commons/0/0b/Golda_Meir_visiting_Sinai_front,_1973.webm",
                                      "", "468:360:6:0", [(457.5, 463.8), (530.4, 535.2)],
                                      {"pre": "curves=all='0/0.04 0.25/0.26 0.6/0.55 0.85/0.74 1/0.82'"}),
    # Wikimedia Commons, « King Hussein 1970 » (film de la CIA conservé aux Archives nationales américaines, domaine public) :
    # un camp de réfugiés en Jordanie, une enfant qui marche dans la boue
    "1970-jordanie-camp-de-refugies": ("https://upload.wikimedia.org/wikipedia/commons/b/ba/King_Hussein_1970.ogv",
                                       "", "628:470:6:5", [(254.0, 260.0)]),
    # même film : la foule du camp, des enfants qui regardent la caméra
    "1970-jordanie-camp-foule-enfants": ("https://upload.wikimedia.org/wikipedia/commons/b/ba/King_Hussein_1970.ogv",
                                         "", "628:470:6:5", [(273.5, 277.5), (278.0, 282.0)]),
    # même film : le roi Hussein en gros plan, puis des hommes armés derrière des sacs de sable et un mortier
    "1970-roi-hussein-et-hommes-armes": ("https://upload.wikimedia.org/wikipedia/commons/b/ba/King_Hussein_1970.ogv",
                                         "", "628:470:6:5", [(36.0, 41.0), (123.7, 126.8), (131.0, 136.0)]),
    # rushes de la March of Time (cédés sans restriction aux États-Unis, Archives nationales américaines, catalogue 124450989
    # et suivants ; copie archive.org FedFlix), recadrés au-dessus du minutage incrusté : 1938, une colonie juive de la plaine
    # côtière, un tracteur qui défriche
    "1938-colonie-juive-et-tracteur": ("https://archive.org/download/mt-mtt-666t/mt-mtt-666t.mp4", "", "696:376:12:6",
                                       [(36.7, 43.5), (63.7, 68.5)], {"film24": True}),
    # même fonds, 1938 (NARA 200 MTT 666 F, caméra S. R. Sozio ; date de la notice du musée américain de l'Holocauste,
    # irn1001006) : les rues commerçantes de Tel-Aviv, un boulevard vu d'en haut
    "1938-tel-aviv-rues": ("https://archive.org/download/mt-mtt-666f/mt-mtt-666f.mp4", "", "696:376:12:6",
                           [(283.6, 290.0), (296.4, 301.6), (415.2, 418.8)], {"film24": True}),
    # même fonds, 1938 : un paquebot à quai dans le port de Haïfa, des hommes sur le quai
    "1938-haifa-paquebot-au-port": ("https://archive.org/download/mt-mtt-666e/mt-mtt-666e.mp4", "", "696:376:12:6",
                                    [(292.3, 302.8)], {"film24": True}),
    # Castle Films, « Unrest in Palestine and Exodus ship », 1947 (musée américain de l'Holocauste, film 2876, domaine public) :
    # l'Exodus à Haïfa, des enfants à un hublot défoncé, les soldats britanniques sur le quai ; recadré au-dessus du minutage
    "1947-exodus-haifa": ("https://film-assets.ushmm.org/mp4/FV2876_RG604848.01.01.mp4", "", "624:432:8:10",
                          [(115.6, 117.3), (118.6, 121.3), (121.5, 122.6)], {"decimer": True}),
    # Universal Newsreel du 18 mai 1948 (USHMM, irn1000897, domaine public), autre passage : deux soldats tiennent le drapeau
    # du nouvel État
    "1948-mai-drapeau": ("https://film-assets.ushmm.org/mp4/FV0936_RG601137.01.01.mp4", "", "624:400:8:16",
                                [(66.95, 70.85)], {"decimer": True}),
    # « Hagana Troops », 1948, rushes Universal (NARA 200 UN 5894x3 ; USHMM, film 929, irn1000361, domaine public), date
    # exacte non établie, tourné à Jérusalem et à Haïfa selon la notice : des familles arabes
    # assises avec leurs ballots au port, des femmes qui partent avec un landau ; aucun corps à l'image (la fin du film en montre,
    # écartée)
    "1948-familles-arabes-qui-partent": ("https://film-assets.ushmm.org/mp4/FV0929_RG601026.01.01.mp4", "", "624:416:8:8",
                                        [(36.9, 39.5), (117.5, 121.0)], {"decimer": True}),
    # même film : des hommes emmenés en camion par des soldats, un soldat de la Haganah, des hommes fouillés, d'autres arrêtés
    # et assis au sol, un soldat sur les décombres
    "1948-haganah-fouilles-et-arrestations": ("https://film-assets.ushmm.org/mp4/FV0929_RG601026.01.01.mp4", "", "624:416:8:8",
                                         [(29.6, 34.1), (97.4, 98.6), (101.9, 105.1), (108.2, 112.8), (105.8, 107.3)],
                                         {"decimer": True}),
    # rushes de la March of Time, 1938 (NARA 200 MTT 666 CC, caméra S. R. Sozio ; musée américain de l'Holocauste, irn1001012,
    # domaine public) : un convoi du 2e bataillon du Royal West Kent Regiment, stationné à Haïfa, en route vers le village de
    # Qaddum, en Samarie ; les soldats avancent à travers les collines ; un prêtre et des villageois interrogés, des papiers
    # contrôlés ; recadré au-dessus du minutage
    "1938-convoi-britannique-village": ("https://film-assets.ushmm.org/mp4/FV0047_RG600915.01.01.mp4", "", "624:420:8:10",
                                        [(157.0, 160.5), (308.5, 313.0), (348.5, 352.5), (358.5, 361.0)], {"decimer": True}),
    # rushes de la March of Time, 13 août 1945 (musée américain de l'Holocauste, irn1003498, film 2732, domaine public) :
    # la première conférence sioniste mondiale d'après-guerre, à Londres ; la salle, puis David Ben Gourion qui parle
    "1945-ben-gourion-conference-londres": ("https://film-assets.ushmm.org/mp4/FV2732_RG604086.01.01.mp4", "", "624:400:8:8",
                                            [(100.0, 104.5), (240.0, 251.0)], {"decimer": True}),
    "1956-suez-flotte-et-avions": ("1956-11-01_War_in_Egypt", "1956-11-01_War_in_Egypt.mpeg", "696:458:10:10",
                                   [(57.2, 60.0), (66.2, 67.6), (68.2, 70.6), (74.2, 76.6), (78.2, 80.6)]),
    # Wikimedia Commons, copies envoyées par l'auteur (Wikimedia refuse les téléchargements depuis le serveur) :
    # « The Life of the Jews in Palestine », Noah Sokolovsky, 1913, domaine public ; Hébron, la ville puis des Juifs
    # d'Hébron sur des marches (recadré à droite du logo CNC/IFA, en bas à gauche)
    "1913-hebron-la-communaute-juive": ("https://upload.wikimedia.org/wikipedia/commons/d/da/The_Life_of_the_Jews_in_Palestine_-_Hebron_segment_%281913%29.webm",
                                        "", "376:282:96:0", [(13.0, 18.0), (95.0, 102.0)],
                                        {"stab": True, "pre": "curves=all='0/0.06 0.25/0.36 0.6/0.74 1/0.97'"}),
    # même film de 1913 (copie entière reçue par la Dropbox) : quatre plans à la place de reconstitutions par IA,
    # toujours recadrés à droite du logo CNC/IFA (en bas à gauche) ; film à la manivelle : tremblement corrigé
    "1913-tel-aviv-la-jeune-ville": ("https://upload.wikimedia.org/wikipedia/commons/5/50/The_Life_of_the_Jews_in_Palestine_(1913).webm", "", "376:282:96:0", [(228.0, 238.6)], {"stab": True}),
    "1913-lac-de-tiberiade-pionniers-labourent": ("https://upload.wikimedia.org/wikipedia/commons/5/50/The_Life_of_the_Jews_in_Palestine_(1913).webm", "", "376:282:96:0", [(1544.0, 1554.6)], {"stab": True}),
    "1913-jerusalem-la-vieille-ville": ("https://upload.wikimedia.org/wikipedia/commons/5/50/The_Life_of_the_Jews_in_Palestine_(1913).webm", "", "376:282:96:0", [(1832.0, 1839.8)], {"stab": True}),
    "1913-tiberiade-puis-hebron": ("https://upload.wikimedia.org/wikipedia/commons/5/50/The_Life_of_the_Jews_in_Palestine_(1913).webm", "", "376:282:96:0", [(1411.4, 1418.8), (2401.0, 2404.4)], {"stab": True}),
    # l'entrée du général Allenby à Jérusalem, 11 décembre 1917 (War Office Cinema Committee, domaine public) :
    # Allenby et son état-major à pied, devant la porte de Jaffa
    "1917-allenby-entre-a-jerusalem": ("https://upload.wikimedia.org/wikipedia/commons/b/b6/General_Allenby%27s_entry_into_Jerusalem_%281917%29.webm",
                                       "", "584:480:14:0", [(94.0, 104.0)], {"stab": True}),
    # Lord Balfour en Palestine, mars 1925 (Archives de la Planète, musée départemental Albert-Kahn, opérateur Camille
    # Sauvageot, CC BY-SA 4.0) : la foule et les drapeaux, Balfour à la tribune, le cortège sous l'arche à l'étoile
    "1925-balfour-en-palestine": ("https://upload.wikimedia.org/wikipedia/commons/b/bd/Visite_de_Lord_Balfour_dans_quelques_colonies_sionistes_-_AI13634.webm",
                                  "", "698:574:12:2", [(284.0, 289.0), (322.2, 327.7), (432.5, 435.5)]),
    # Maison Blanche, 17 septembre 1978, après la signature des accords de Camp David : Sadate, Carter, Begin
    # (bibliothèque Carter, Archives nationales américaines, domaine public)
    "1978-camp-david-sadate-carter-begin": ("https://upload.wikimedia.org/wikipedia/commons/8/80/Israeli_Prime_Minister_Begin%27s_remarks_at_the_Camp_David_Agreement%2C_17_September_1978.webm",
                                            "", "654:368:0:30", [(103.0, 108.0)]),
    # Maison Blanche, 13 septembre 1993 : la poignée de main entre Rabin et Arafat, Clinton entre eux
    # (bibliothèque Clinton, domaine public)
    "1993-oslo-poignee-de-main": ("https://upload.wikimedia.org/wikipedia/commons/b/b3/Signing_of_the_Israeli-Palestinian_Declaration_of_Principles.webm",
                                  "", "448:252:60:20", [(2224.2, 2229.0)]),
    # Camp David, 11 juillet 2000 : Barak, Clinton et Arafat à l'ouverture du sommet (bibliothèque Clinton, domaine public)
    "2000-camp-david-barak-clinton-arafat": ("https://upload.wikimedia.org/wikipedia/commons/3/32/Photo-Op_of_President_Clinton_with_Prime_Minister_Barak_and_Chairman_Arafat_at_Camp_David.webm",
                                             "", "654:368:0:40", [(54.5, 67.5)]),
}


def url(ident, name):
    """Adresse réelle du fichier (archive.org redirige ; les accents sont tantôt composés, tantôt non)."""
    import unicodedata
    for form in ("NFC", "NFD"):
        u = IA + ident + "/" + urllib.parse.quote(unicodedata.normalize(form, name))
        r = subprocess.run(["curl", "-sS", "-L", "-A", "Mozilla/5.0", "-r", "0-10", "-o", "/dev/null", "-w", "%{http_code} %{url_effective}", u],
                           capture_output=True, text=True)
        code, eff = r.stdout.split(" ", 1)
        if code in ("200", "206"):
            return eff
    raise SystemExit(f"introuvable : {ident}/{name}")


def finition():
    h = subprocess.check_output(["node", "-e", "global.window={}; require('./data/palette.js'); const h=window.PALETTE.halation; "
                                 "console.log('rr='+h[0]+':gg='+h[1]+':bb='+h[2])"], cwd=ROOT, text=True).strip()
    return ("format=gbrp,split=2[a][b];[b]curves=all='0/0 0.6/0 0.85/0.5 1/1',gblur=sigma=26,colorchannelmixer=" + h + "[h];"
            "[a][h]blend=all_mode=screen:all_opacity=0.30,curves=all='0/0.02 0.18/0.155 0.5/0.49 0.82/0.86 1/0.965',"
            "crop=w=1904:h=1071:x=8:y=4,scale=1920:1080:flags=lanczos")


def cadence(src, net, opts):
    """Filtre qui rend les images du film, et la cadence qu'il donne."""
    p = json.loads(subprocess.check_output(["ffprobe", "-v", "error", *net, "-select_streams", "v:0", "-show_entries",
                                            "stream=r_frame_rate,field_order", "-of", "json", src]))["streams"][0]
    fps = p["r_frame_rate"]
    if p.get("field_order") in ("tt", "bb", "tb", "bt") and fps in ("30000/1001", "2997/100"):
        # télécinéma 3:2 : on réassemble les demi-images de chaque image de film, puis on retire l'image en trop sur 5
        return "fieldmatch=order=auto:combmatch=full,yadif=deint=interlaced,decimate", "24000/1001"
    if opts.get("decimer"):
        return "decimate", "24000/1001"
    if opts.get("film24"):
        # copie vidéo à 60 images par seconde d'un film à 24 : on reprend 24 images par seconde (puis 25 sans en doubler)
        return "fps=24000/1001", "24000/1001"
    return "null", fps


def vitesse(fps):
    """Passage à 25 i/s sans perdre ni doubler d'image : 24 et 23,976 légèrement accélérés, 30 et 29,97 joués à 25
    (17 % plus lent ; fps=25 seul sautait une image sur six, une saccade cinq fois par seconde), 60 une sur deux."""
    return {"24000/1001": "setpts=PTS*24000/25025,", "24/1": "setpts=PTS*24/25,",
            "30000/1001": "setpts=PTS*30000/25025,", "2997/100": "setpts=PTS*2997/2500,", "30/1": "setpts=PTS*30/25,",
            "60000/1001": "select='not(mod(n\\,2))',setpts=N/25/TB,", "60/1": "select='not(mod(n\\,2))',setpts=N/25/TB,",
            "50/1": "select='not(mod(n\\,2))',setpts=N/25/TB,"}.get(fps, "") + "fps=25"


def poussieres(entree, sortie, t1=14, t2=22):
    """Taches d'une seule image (poussière, cheveu, rayure courte) : remplacées par la médiane des 3 images voisines,
    seulement là où l'image d'avant et celle d'après se ressemblent (aucun mouvement) et où l'image courante s'en écarte."""
    g = (f"[0]format=yuv444p,split=3[v][vm][vg];[vg]format=gray,split=4[c0][c1][p0][n0];"
         f"[p0]tpad=start=1:start_mode=clone[prev];[n0]trim=start_frame=1,setpts=PTS-STARTPTS,tpad=stop=1:stop_mode=clone[next];"
         f"[c0]tmedian=radius=1[med];[prev][next]lut2=c0='if(lt(abs(x-y),{t1}),255,0)'[calme];"
         f"[c1][med]lut2=c0='if(gt(abs(x-y),{t2}),255,0)'[ecart];"
         f"[calme][ecart]blend=all_mode=multiply,dilation,dilation,gblur=sigma=1.2,split=3[m1][m2][m3];"
         f"[m1][m2][m3]mergeplanes=0x001020:yuv444p[m];[vm]tmedian=radius=1[mv];[v][mv][m]maskedmerge,format=yuv420p[o]")
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", entree, "-filter_complex", g, "-map", "[o]",
                    "-c:v", "libx264", "-crf", "10", "-preset", "fast", sortie], check=True)


def stabilise(entree, sortie):
    """Tremblement de la pellicule (films à la manivelle) : décalage global d'une image à l'autre (corrélation de phase),
    trajectoire lissée sur un tiers de seconde, seul l'écart rapide est corrigé (le mouvement de caméra reste)."""
    w, h = map(int, subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                             "stream=width,height", "-of", "csv=p=0", entree], text=True).strip().split(","))
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", entree, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)
    k = 320 / w
    petit = [cv2.resize(cv2.cvtColor(f, cv2.COLOR_RGB2GRAY), (320, int(h * k))).astype(np.float32) for f in fr]
    win = cv2.createHanningWindow((320, int(h * k)), cv2.CV_32F)
    pas, coupe = [(0.0, 0.0)], [0]
    for a, b in zip(petit, petit[1:]):
        (dx, dy), r = cv2.phaseCorrelate(a, b, win)
        if r < 0.05 or abs(dx) > 12 or abs(dy) > 12:  # changement de plan : on repart de zéro
            coupe.append(len(pas)); dx = dy = 0.0
        pas.append((dx / k, dy / k))
    pos = np.cumsum(np.array(pas), 0)
    coupe.append(len(pas))
    corr = np.zeros_like(pos)
    for a, b in zip(coupe, coupe[1:]):
        seg = pos[a:b]
        lisse = np.stack([cv2.GaussianBlur(seg[:, c].reshape(-1, 1), (1, 0), 3.0).ravel() for c in range(2)], 1) if len(seg) > 3 else seg
        corr[a:b] = np.clip(lisse - seg, -0.03 * w, 0.03 * w)
    out = subprocess.Popen(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}",
                            "-r", "25", "-i", "-", "-c:v", "libx264", "-crf", "10", "-preset", "fast", "-pix_fmt", "yuv420p", sortie],
                           stdin=subprocess.PIPE)
    for f, (cx, cy) in zip(fr, corr):
        m = np.float32([[1, 0, cx], [0, 1, cy]])
        out.stdin.write(cv2.warpAffine(f, m, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT).tobytes())
    out.stdin.close()
    out.wait()
    print(f"  tremblement corrigé : {np.abs(corr).mean(0).round(1)} px en moyenne (x, y)")


def fabrique(nom, ident, fichier, crop, coupes, opts=None):
    opts = opts or {}
    src = ident if ident.startswith("https://") else url(ident, fichier)
    net = ["-http_proxy", os.environ["HTTPS_PROXY"]] if os.environ.get("HTTPS_PROXY") else []
    # copie déjà téléchargée, même nom de fichier, dans output/archives-sources/<lot>/ (Wikimedia Commons refuse les
    # téléchargements répétés) : lue sur le disque plutôt que sur le réseau
    loc = glob.glob(os.path.join(ROOT, "output", "archives-sources", "*", glob.escape(urllib.parse.unquote(src.rsplit("/", 1)[1]))))
    if loc:
        src, net = loc[0], []
    cad, fps = cadence(src, net, opts)
    if opts.get("rayure"):
        x, w = opts["rayure"]
        h = int(subprocess.check_output(["ffprobe", "-v", "error", *net, "-select_streams", "v:0", "-show_entries", "stream=height",
                                         "-of", "csv=p=0", src], text=True).strip().split(",")[0])
        cad += f",delogo=x={x}:y=1:w={w}:h={h - 2}"
    with tempfile.TemporaryDirectory() as tmp:
        parts = []
        for k, (a, b) in enumerate(coupes):
            p = os.path.join(tmp, f"{k}.mp4")
            # 3 s de marge avant la coupe (la recherche par réseau tombe sur une image clé, et le télécinéma inverse a
            # besoin de quelques images pour se caler), puis coupe exacte en temps réel, avant le passage à 25 i/s
            m = a - max(0, a - 3)
            subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", *net, "-ss", f"{a - m:.3f}", "-i", src, "-an", "-vf",
                            f"{cad},trim=start={m:.3f}:duration={b - a:.3f},setpts=PTS-STARTPTS,crop={crop},"
                            f"scale='trunc(iw*sar/2)*2':ih,setsar=1,{vitesse(fps)}",
                            "-c:v", "libx264", "-crf", "10", "-preset", "fast", p], check=True)
            parts.append(p)
        lst = os.path.join(tmp, "liste.txt")
        open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
        brut = os.path.join(tmp, "brut.mp4")
        subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
                        "-vf", "deflicker=size=7:mode=am", "-c:v", "libx264", "-crf", "10", "-preset", "fast", brut], check=True)
        propre = os.path.join(tmp, "propre.mp4")
        poussieres(brut, propre)
        if opts.get("stab"):
            stable = os.path.join(tmp, "stable.mp4")
            stabilise(propre, stable)
            propre = stable
        lut = os.path.join(ROOT, "data", "looks", "archive.cube")
        pre = opts.get("pre")
        # bruit atténué dans le temps avant l'agrandissement (le grain du film est rajouté à la fin, plus fin et régulier)
        vf = (f"hqdn3d=2.2:1.6:5.5:4.5,"
              f"scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,"
              + (f"{pre}," if pre else "") +
              f"unsharp=lx=13:ly=13:la=0.65:cx=5:cy=5:ca=0,cas=strength=0.35,lut3d=file={lut}:interp=tetrahedral,{finition()},"
              "noise=c0s=7:c0f=t+u:c1s=0:c2s=0,vignette=angle=PI/5,format=yuv420p,setsar=1")
        os.makedirs(OUT, exist_ok=True)
        dst = os.path.join(OUT, f"{nom}.mp4")
        subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", propre, "-vf", vf,
                        "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-tune", "film", "-movflags", "+faststart", dst + ".part.mp4"],
                       check=True)
        os.replace(dst + ".part.mp4", dst)
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", dst]))
    print(f"{nom} : {d:.2f} s ({len(coupes)} coupe{'s' if len(coupes) > 1 else ''}, source {fps} i/s)", flush=True)


if __name__ == "__main__":
    filtre = sys.argv[1:]
    for nom, args in ARCHIVES.items():
        if not filtre or any(f in nom for f in filtre):
            fabrique(nom, *args)
