"""Ambiance sonore des vrais plans, des archives et des reconstitutions (plans RÉEL, ARCH, IA, PHOTO du script), qui
sortaient muets : un fond du lieu et de l'époque, au plus un ou deux sons ponctuels, toujours de vraies prises de la
banque (Freesound et Envato, tools/banque_sons.py). tools/derush.py les pose sous les plans sans son.

    python3 tools/ambiances.py            → output/ambiances/<plan>.wav et output/ambiances/liste.json
    python3 tools/ambiances.py 25.16      → seulement ces plans (pour écouter)

Choix, dans l'ordre : la note « son » du plan (le script décide), puis le lieu et le sujet (légende, fichier, voix
off), puis l'époque. Règles d'un grand documentaire : rester sous la voix (fond vers -31 dBFS), ne jamais empiler plus
de deux fonds, garder les silences voulus (« silence presque total »), un seul son ponctuel bien placé plutôt que dix.
Archives d'avant 1960 : bande resserrée (200 Hz à 5 kHz) et image stéréo étroite, comme un son d'époque ; films muets
d'avant 1930 : le ronron du projecteur, très bas.
"""
import json
import os
import re
import sys
import unicodedata
import wave
import zlib

import numpy as np
import yaml
from scipy.signal import butter, sosfilt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import banque_sons as B  # noqa: E402
import bruitages as BR  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output", "ambiances")
SR = 48000
TYPES = {"RÉEL", "ARCH", "IA", "PHOTO"}

# (motif cherché dans la note « son », puis dans la légende, le fichier et la voix ; fonds [(rôle, dBFS)] ; ponctuels)
# La note « son » passe d'abord ; ensuite le premier motif de lieu qui correspond donne le fond principal.
NOTE = [
    (r"silence presque|aucune musique, aucun effet", "silence"),
    (r"vent sec", [("vent_desert", -36)]),
    (r"vent de neige|neige", [("vent", -31)]),
    (r"tole|tôle", [("vent", -33)], ["tole"]),
    (r"salle immense|murmure", [("salle", -31), ("bureau", -40)]),
    (r"applaudissements", [("salle", -33)], ["applaudissements"]),
    (r"marteau de seance", [("bureau", -38)], ["marteau"]),
    (r"cloches", [("cloches", -33)]),
    (r"appel lointain", [("priere", -33)]),
    (r"ville au crepuscule|la nuit tombe|ville le soir|la ville, le soir", [("nuit_ville", -32)]),
    (r"ville au loin", [("nuit_ville", -34)]),
    (r"foule", [("foule", -33)]),
    (r"montee lente", [], ["montee_fin"]),
    (r"tampon", [], ["tampon"]),
]
LIEU = [
    (r"marche du retour|manifest|protest|reforme de la justice|rassemblement", [("manif", -29)], ["manif_cri"]),
    (r"nations unies|\bonu\b|assemblee|knesset|congres|conference|tribunal|proces|maison blanche|signature|accords? de|"
     r"poignee de main|sommet|parlement|cour internationale", [("salle", -34), ("bureau", -40)], ["applaudissements?"]),
    (r"camp david", [("campagne", -33)]),
    (r"mur occidental|mur des lamentations|priere au mur", [("murmure", -33), ("vent_doux", -40)]),
    (r"dome du rocher|esplanade|al-aqsa|mosquee", [("foule", -36), ("priere", -34)]),
    (r"saint-sepulcre|bethleem|nativite|eglise|monastere|mar saba", [("vent_doux", -36), ("cloches", -36)]),
    (r"souk|vieille ville|porte de damas|porte de jaffa|jerusalem", [("foule", -33)]),
    (r"chatila|camp de refugies|camp de la plage|shuafat|anata|\bcamps?\b|refugies", [("enfants", -35), ("village", -35)]),
    (r"gaza", [("ville", -36), ("drone", -38)]),
    (r"masafer yatta|hebron|naplouse|ramallah|jenine|arraba|village|collines|cisjordanie", [("campagne", -34), ("chevres", -40)], ["coq?"]),
    (r"berger|moutons|chevres|troupeau|bedouin", [("moutons", -33), ("vent_desert", -38)]),
    (r"desert|neguev|judee|jericho|mer morte|sinai|ouadi", [("vent_desert", -33)]),
    (r"haifa|jaffa|\bport\b|plage|cote|baie|mediterranee|paquebot|exodus|ellis island|marseille|bateau|navire", [("mer", -31)]),
    (r"galilee|jezreel|thabor|netofa|vallee|plaine|champs?|olivier|oliveraie|tracteur|colonie|kibboutz|orangeraie", [("campagne", -33), ("cigales", -40)]),
    (r"tel-aviv|tel aviv|new york|brooklyn|williamsburg|londres|paris|washington|ville", [("nuit_ville", -35)]),
    (r"nuit|soir", [("nuit", -33)]),
    (r"chars?\b|blinde", [("char", -33)]),
    (r"pont aerien|avions?|largage", [("vent", -36)], ["avion?"]),
    (r"helicoptere", [("vent", -36)], ["helico"]),
    (r"ruines|decombres|detruit|bombard|frappe|plomb durci|offensive|guerre", [("vent", -36), ("guerre_loin", -42)]),
    (r"cloture|mur de separation|le mur\b|checkpoint|tour de guet", [("vent_desert", -35)]),
]


def sans_accents(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")


def annee(p):
    for txt in (str(p.get("ecran", "")), os.path.basename(str(p.get("fichier", "")))):
        m = re.search(r"\b(18[89]\d|19\d\d|20[0-2]\d)\b", txt)
        if m:
            return int(m.group(1))
    return 2025 if "aujourd" in str(p.get("ecran", "")) else None


def choix(p):
    """Fonds [(rôle, dBFS)] et sons ponctuels [rôle] du plan, et la raison du choix."""
    note = sans_accents(str(p.get("son", "")))
    fonds, ponct, raisons = [], [], []
    for regle in NOTE:
        if re.search(regle[0], note):
            if regle[1] == "silence":
                return [("vent_doux", -44)], [], "note « silence » : un souffle d'air seulement"
            fonds += regle[1]
            ponct += regle[2] if len(regle) > 2 else []
            raisons.append("note")
    texte = sans_accents(" ".join(str(p.get(k, "")) for k in ("ecran", "fichier", "source")))
    voix = sans_accents(str(p.get("voix", "")))
    if len(fonds) < 2:
        for motif, fs, *pc in LIEU:
            if re.search(motif, texte) or (not raisons and re.search(motif, voix)):
                fonds += [f for f in fs if f[0] not in {x[0] for x in fonds}]
                ponct += pc[0] if pc else []
                raisons.append(re.search(motif, texte + " " + voix).group(0))
                break
    if not fonds:
        fonds, raisons = [("vent_doux", -36)], ["aucun lieu reconnu : un air léger"]
    return fonds[:2], ponct[:2], ", ".join(raisons)


def passe_bande(x, f1, f2):
    sos = butter(2, [f1, f2], "bandpass", fs=SR, output="sos")
    return sosfilt(sos, x)


def ambiance(pid, p):
    a = float(p.get("entree", 0) or 0)
    d = float(p["sortie"]) - a
    n = int(round(d * SR))
    rng = np.random.default_rng(zlib.crc32(pid.encode()))
    fonds, ponct, raison = choix(p)
    an = annee(p)
    vieux = p["type"] == "ARCH" and an is not None and an < 1960
    if p["type"] == "ARCH" and an is not None and an < 1930 and B.dispo("projecteur"):
        fonds = fonds[:1] + [("projecteur", -42)]
    L, R = np.zeros(n), np.zeros(n)
    faits = []
    for role, db in fonds:
        if not B.dispo(role):
            continue
        l, r = BR.fond(role, d + 0.5, rng, db)
        L += l[:n]
        R += r[:n]
        faits.append(f"{role} {db}")
    for k, role in enumerate(ponct):
        opt = role.endswith("?")
        role = role.rstrip("?")
        if role == "montee_fin":
            if B.dispo("montee") and d > 3:
                l, r = BR.montee(rng, min(6.0, d - 0.5))
                o = n - len(l) - int(0.15 * SR)
                L[o:o + len(l)] += 0.18 * l
                R[o:o + len(r)] += 0.18 * r
                faits.append("montée finale")
            continue
        if not B.dispo(role) or (opt and rng.random() < 0.5) or d < 3:
            continue
        l, r = B.prise(role, rng, vitesse=1 + 0.05 * (2 * rng.random() - 1))
        m = min(len(l), n - int(0.5 * SR))
        if m < int(0.2 * SR):
            continue
        g = 10 ** (-20 / 20) if role not in ("applaudissements", "manif_cri") else 10 ** (-27 / 20)
        o = int((0.3 + 0.35 * k + 0.1 * rng.random()) * max(0, n - m))
        w = np.ones(m)
        q = min(m // 4, int(0.3 * SR))
        if q:
            w[-q:] = np.linspace(1, 0, q)
        L[o:o + m] += g * l[:m] * w
        R[o:o + m] += g * r[:m] * w
        faits.append(f"{role} ponctuel")
    if vieux:  # son d'époque : bande resserrée, image presque mono
        L, R = passe_bande(L, 200, 5000), passe_bande(R, 200, 5000)
        mid = (L + R) / 2
        L, R = 0.75 * mid + 0.25 * L, 0.75 * mid + 0.25 * R
        L, R = L * 0.8, R * 0.8
    k = min(n // 3, int(0.4 * SR))
    if k:
        f = np.linspace(0, 1, k) ** 2
        L[:k] *= f
        R[:k] *= f
        L[-k:] *= f[::-1]
        R[-k:] *= f[::-1]
    pk = max(np.abs(L).max(), np.abs(R).max(), 1e-9)
    if pk > 0.5:  # jamais plus haut que -6 dBFS : c'est un fond
        L, R = L * 0.5 / pk, R * 0.5 / pk
    os.makedirs(OUT, exist_ok=True)
    dst = os.path.join(OUT, f"{pid}.wav")
    with wave.open(dst + ".part", "wb") as w_:
        w_.setnchannels(2)
        w_.setsampwidth(2)
        w_.setframerate(SR)
        w_.writeframes((np.stack([L, R], 1) * 32767).astype("<i2").tobytes())
    os.replace(dst + ".part", dst)
    return {"type": p["type"], "duree": round(d, 2), "annee": an, "epoque": vieux, "couches": faits, "raison": raison}


def main():
    sys.path.insert(0, os.path.join(ROOT, "tools"))
    from derush import PARTS, plan_id
    seuls = set(sys.argv[1:])
    liste_p = os.path.join(OUT, "liste.json")
    liste = json.load(open(liste_p)) if os.path.exists(liste_p) and seuls else {}
    for yml, _, _ in PARTS:
        data = yaml.safe_load(open(os.path.join(ROOT, "script", yml), encoding="utf-8"))
        for ch in data["chapitres"]:
            for k, p in enumerate(ch["plans"], start=1):
                pid = plan_id(ch["num"], k)
                court = pid.lstrip("0")
                if p.get("type") not in TYPES or "sortie" not in p:
                    continue
                if seuls and pid not in seuls and court not in seuls:
                    continue
                liste[pid] = ambiance(pid, p)
                print(f"{pid} {p['type']:5} {liste[pid]['duree']:5.1f} s : {', '.join(liste[pid]['couches'])} ({liste[pid]['raison']})")
    os.makedirs(OUT, exist_ok=True)
    json.dump(liste, open(liste_p, "w"), ensure_ascii=False, indent=1)
    print(f"{len(liste)} ambiances dans {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
