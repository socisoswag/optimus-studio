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
# les niveaux des règles sont relatifs : +5 dB les met à la hauteur des pièces de motion design voisines (vers -26 dBFS
# pour un fond principal), présents et immersifs, toujours sous la voix une fois celle-ci posée
HAUSSE = 5.0

# (motif cherché dans la note « son », puis dans la légende, le fichier et la voix ; fonds [(rôle, dBFS)] ; ponctuels)
# La note « son » passe d'abord ; ensuite le premier motif de lieu qui correspond donne le fond principal.
NOTE = [
    (r"silence presque|aucune musique, aucun effet", "silence"),
    (r"vent sec", [("vent_desert", -36)]),
    (r"vent de neige|neige|corbeaux", [("vent", -31), ("corbeaux", -36)]),
    (r"pas de troupe", [("pas", -32)]),
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
    (r"qui partent|ballots|exode|expuls|chasses de|sur la route|deplaces", [("pas", -32), ("vent", -38)]),
    (r"neige|hiver|medzhybizh|ukraine|cimetiere", [("vent", -32), ("corbeaux", -37)]),
    (r"\btrains?\b|gare|wagons?|deport|rescapes", [("train", -34)], ["train_sifflet?"]),
    (r"demoli|bulldozer|\bd9\b", [("bulldozer", -33), ("vent", -38)]),
    (r"nations unies|\bonu\b|assemblee|congres|conference|tribunal|proces|maison blanche|signature|accords de (paix|camp)|accords d'|"
     r"poignee de main|sommet|parlement|cour internationale", [("salle", -34), ("photographes", -34)], ["applaudissements?"]),
    (r"camp david", [("campagne", -33), ("photographes", -36)]),
    (r"mur occidental|mur des lamentations|priere au mur", [("murmure", -33), ("vent_doux", -40)]),
    (r"yad vashem|memorial", [("vent_doux", -34)]),
    (r"abandonn|lifta", [("vent", -33), ("vent_doux", -40)]),
    (r"cloture|mur de separation|le mur\b|checkpoint|tour de guet", [("vent_desert", -35), ("ville", -42)]),
    (r"nuit|de nuit|soir", [("nuit_ville", -34), ("chiens", -40)]),
    (r"dome du rocher|esplanade|al-aqsa|mosquee", [("foule", -36), ("priere", -34)]),
    (r"saint-sepulcre|bethleem|nativite|eglise|monastere|mar saba", [("vent_doux", -36), ("cloches", -36)]),
    (r"souk|vieille ville|porte de damas|porte de jaffa|jerusalem", [("foule", -33)]),
    (r"chatila|camp de refugies|camp de la plage|shuafat|anata|\bcamps?\b", [("enfants", -35), ("village", -35)]),
    (r"gaza", [("ville", -36), ("ambulance", -40)]),
    (r"\becoles?\b", [("enfants", -36), ("vent_desert", -38)]),
    (r"hebron|naplouse|ramallah|jenine|bethleem", [("ville", -35), ("vent_doux", -40)]),
    (r"masafer yatta|arraba|village|collines|cisjordanie", [("campagne", -34), ("chevres", -40)], ["coq?"]),
    (r"berger|moutons|chevres|troupeau|bedouin", [("moutons", -33), ("vent_desert", -38)]),
    (r"desert|neguev|judee|jericho|mer morte|sinai|ouadi", [("vent_desert", -33)]),
    (r"haifa|jaffa|\bport\b|plage|cote|baie|mediterranee|paquebot|exodus|ellis island|marseille|bateau|navire", [("mer", -31)]),
    (r"galilee|jezreel|thabor|netofa|vallee|plaine|champs?|olivier|oliveraie|tracteur|colonie|kibboutz|orangeraie", [("campagne", -33), ("cigales", -40)]),
    # une ville de jour (les scènes de nuit sont prises plus haut, par « nuit », « soir », « crépuscule »)
    (r"tel-aviv|tel aviv|new york|brooklyn|williamsburg|londres|paris|washington|ville", [("ville", -35), ("foule", -42)]),
    (r"chars?\b|blinde", [("char", -33)]),
    (r"pont aerien|avions?|largage", [("vent", -36)], ["avion?"]),
    (r"helicoptere", [("vent", -36)], ["helico"]),
    (r"ruines|decombres|detruit|bombard|frappe|plomb durci|offensive|guerre", [("vent", -36), ("guerre_loin", -42)]),
]


MODERNES = {"ambulance", "drone", "drone_passe", "generateur"}


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
    # le lieu se lit sur la légende et le nom du fichier (la source et la voix parlent souvent d'autre chose) ; une note
    # qui donne déjà des fonds décide seule
    texte = sans_accents(" ".join(str(p.get(k, "")) for k in ("ecran", "fichier")))
    if not fonds:
        for motif, fs, *pc in LIEU:
            m = re.search(motif, texte)
            if m:
                fonds += fs
                ponct += pc[0] if pc else []
                raisons.append(m.group(0))
                break
    an = annee(p)
    if an is not None and an < 1990:  # pas d'ambulance, de drone ni de groupe électrogène d'aujourd'hui sur une archive
        fonds = [f for f in fonds if f[0] not in MODERNES]
        if not fonds:
            fonds, raisons = [("vent_doux", -36)], raisons or ["archive sans lieu reconnu : un air léger"]
    if not fonds:
        fonds, raisons = [("vent_doux", -36)], ["aucun lieu reconnu : un air léger"]
    return fonds[:2], ponct[:2], ", ".join(raisons)


def sonie(L, R):
    """Sonie perçue en LUFS (pondération K de la norme BS.1770, sans fenêtrage) : ce qu'une oreille entend vraiment, les
    graves comptant moins que les médiums."""
    from scipy.signal import lfilter
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    z = [lfilter(b2, a2, lfilter(b1, a1, c)) for c in (L, R)]
    return -0.691 + 10 * np.log10(sum((c ** 2).mean() for c in z) + 1e-20)


def passe_bande(x, f1, f2):
    sos = butter(2, [f1, f2], "bandpass", fs=SR, output="sos")
    return sosfilt(sos, x)


def lire(src, t, dur, chaine="anull"):
    """Son d'un fichier, de t à t + dur, en stéréo 48 kHz (une source mono passe au centre)."""
    import subprocess
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-ss", f"{t:.3f}", "-t", f"{dur:.3f}", "-i", src, "-vn",
                          "-af", chaine, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)
    return x[:, 0].copy(), x[:, 1].copy()


def original(pid, p):
    """Le vrai son du plan (« son_original » dans le script) à la place des fonds de la banque : une voix qui compte, une
    foule, des explosions lointaines. Aucun bruitage par-dessus ; une parole se sous-titre (tools/sous_titres.py).

        son_original:
          source: output/archives-sources/<dossier>/<fichier>   (la prise d'origine, jamais une copie réduite)
          morceaux: [[début, durée], ...]   les passages de la source, bout à bout, dans l'ordre du fichier du plan
          vitesse: 1.04                     si l'image a été accélérée (24 i/s joués à 25), le son suit sans changer de ton
          debut: 1.9                        facultatif : le son commence à cet instant du plan au lieu de suivre l'image
                                            (plan de motion design : le son de la pièce reste dessous, 12 dB plus bas)
          sonie: -20                        facultatif ; par défaut -20 LUFS pour une parole, -24 pour un son d'ambiance
          baisse: [[0, 5.7], ...]           facultatif : passages du plan où le vrai son passe sous la voix off (-18 dB)

    Renvoie None si la source n'est pas sur cette machine (l'ambiance de la banque prend alors le relais)."""
    so = p["son_original"]
    src = os.path.join(ROOT, so["source"])
    if not os.path.exists(src):
        print(f"{pid} : source du son d'origine absente ({so['source']}), ambiance de la banque à la place")
        return None
    a = float(p.get("entree", 0) or 0)
    d = float(p["sortie"]) - a
    n = int(round(d * SR))
    v = float(so.get("vitesse", 1))
    # grondement sous 40 Hz retiré (vent dans le micro, ronflement) ; souffle des vieux enregistrements adouci, la voix intacte
    chaine = "highpass=f=40" + (",afftdn=nr=8:nf=-42" if p.get("sous_titres") else "") + (f",atempo={v:.5f}" if v != 1 else "")
    morceaux = [lire(src, t, du, chaine) for t, du in so["morceaux"]]
    xl, xr = np.concatenate([m[0] for m in morceaux]), np.concatenate([m[1] for m in morceaux])
    # fondus de 30 ms entre deux morceaux mis bout à bout (pas de clic à la coupe)
    k = int(0.03 * SR)
    pos = 0
    for m in morceaux[:-1]:
        pos += len(m[0])
        for c in (xl, xr):
            c[max(0, pos - k):pos] *= np.linspace(1, 0, min(k, pos))
            c[pos:pos + k] *= np.linspace(0, 1, len(c[pos:pos + k]))
    L, R = np.zeros(n), np.zeros(n)
    if "debut" in so:
        o = int(round(float(so["debut"]) * SR))
        m = max(0, min(len(xl), n - o))
        L[o:o + m], R[o:o + m] = xl[:m], xr[:m]
    else:
        o = int(round(a * SR))
        m = max(0, min(len(xl) - o, n))
        L[:m], R[:m] = xl[o:o + m], xr[o:o + m]
    # passages sous la voix off : -18 dB, rampes de 0,25 s
    env = np.ones(n)
    r_ = int(0.25 * SR)
    for b0, b1 in so.get("baisse", []):
        i0, i1 = int(float(b0) * SR), min(n, int(float(b1) * SR))
        env[i0:i1] = 10 ** (-18 / 20)
        if i0 > 0:
            env[max(0, i0 - r_):i0] = np.linspace(1, 10 ** (-18 / 20), i0 - max(0, i0 - r_))
        if i1 < n:
            env[i1:i1 + r_] = np.linspace(10 ** (-18 / 20), 1, len(env[i1:i1 + r_]))
    # niveau mesuré sur le son lui-même (pas sur les silences autour ni les passages baissés)
    vrai = (np.abs(L) + np.abs(R) > 1e-6) & (env > 0.99)
    cible = float(so.get("sonie", -20 if p.get("sous_titres") else -24))
    g = 10 ** ((cible - sonie(L[vrai], R[vrai])) / 20) if vrai.sum() > SR // 4 else 1.0
    L, R = L * g * env, R * g * env
    couches = ["son d'origine"]
    if "debut" in so:  # plan de motion design : son de la pièce dessous, 12 dB plus bas
        pl, pr = lire(os.path.join(ROOT, p["fichier"]), a, d)
        m = min(n, len(pl))
        L[:m] += pl[:m] * 10 ** (-12 / 20)
        R[:m] += pr[:m] * 10 ** (-12 / 20)
        couches.append("son de la pièce -12 dB")
    k = min(n // 3, int(0.12 * SR))
    if k:
        f = np.linspace(0, 1, k) ** 2
        L[:k] *= f
        R[:k] *= f
        L[-k:] *= f[::-1]
        R[-k:] *= f[::-1]
    L, R = BR.limite(L, R, 0.7)
    dst = os.path.join(OUT, f"{pid}.wav")
    os.makedirs(OUT, exist_ok=True)
    with wave.open(dst + ".part", "wb") as w_:
        w_.setnchannels(2)
        w_.setsampwidth(2)
        w_.setframerate(SR)
        w_.writeframes((np.clip(np.stack([L, R], 1), -1, 1) * 32767).astype("<i2").tobytes())
    os.replace(dst + ".part", dst)
    return {"type": p["type"], "duree": round(d, 2), "annee": annee(p), "epoque": False, "couches": couches,
            "raison": f"son d'origine ({os.path.basename(src)})"}


def ambiance(pid, p):
    if p.get("son_original"):
        r = original(pid, p)
        if r:
            return r
    a = float(p.get("entree", 0) or 0)
    d = float(p["sortie"]) - a
    n = int(round(d * SR))
    rng = np.random.default_rng(zlib.crc32(pid.encode()))
    fonds, ponct, raison = choix(p)
    an = annee(p)
    vieux = p["type"] == "ARCH" and an is not None and an < 1960
    if p["type"] == "ARCH" and an is not None and an < 1930 and B.dispo("projecteur"):
        fonds = fonds + [("projecteur", -42)]
    L, R = np.zeros(n), np.zeros(n)
    faits = []
    for role, db in fonds:
        if not B.dispo(role):
            continue
        l, r = BR.fond(role, d + 0.5, rng, db + HAUSSE)
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
                L[o:o + len(l)] += 0.3 * l
                R[o:o + len(r)] += 0.3 * r
                faits.append("montée finale")
            continue
        if not B.dispo(role) or (opt and rng.random() < 0.5) or d < 3:
            continue
        l, r = B.prise(role, rng, vitesse=1 + 0.05 * (2 * rng.random() - 1))
        m = min(len(l), n - int(0.5 * SR))
        if m < int(0.2 * SR):
            continue
        g = 10 ** ((-20 + HAUSSE) / 20) if role not in ("applaudissements", "manif_cri") else 10 ** ((-27 + HAUSSE) / 20)
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
    # fondus courts (120 ms) : pas de creux à la coupe, le plan suivant prend le relais (fondu enchaîné possible au montage)
    k = min(n // 3, int(0.12 * SR))
    if k:
        f = np.linspace(0, 1, k) ** 2
        L[:k] *= f
        R[:k] *= f
        L[-k:] *= f[::-1]
        R[-k:] *= f[::-1]
    # même sonie d'un plan à l'autre (le son ne saute pas à la coupe), sauf choix voulu : un silence reste un silence, une
    # manifestation se sent plus fort, une archive ancienne reste un peu en retrait
    roles = {f[0] for f in fonds}
    # cibles calées sur le fond des pièces de motion design voisines (leurs passages calmes tournent autour de -24 LUFS) :
    # aucun creux ni saut de niveau à la coupe entre une carte et un vrai plan
    cible = -36.0 if raison.startswith("note « silence") else -22.0 if "manif" in roles else -26.5 if vieux else -25.0
    g = 10 ** ((cible - sonie(L, R)) / 20)
    # un coup isolé (des pas, une cloche) ne fait pas baisser tout le plan : limiteur à anticipation à -6 dBFS
    L, R = BR.limite(L * g, R * g, 0.5)
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
                if (p.get("type") not in TYPES and not p.get("son_original")) or "sortie" not in p:
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
