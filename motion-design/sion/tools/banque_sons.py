"""Banque de vrais bruitages : enregistrements Freesound sous licence CC0 (domaine public) ou CC BY (auteur crédité).
Jamais de licence « non commerciale » (CC BY-NC, Sampling+) : la chaîne peut être monétisée. Jamais de son de synthèse ni d'IA.

    python3 tools/banque_sons.py chercher "wind desert" [15] [court|long] [by]   cherche (CC0, ou CC0 et CC BY avec « by »)
    python3 tools/banque_sons.py ajouter <rôle> <numéro> [coup=0.04]             ajoute une prise (licence et étiquettes contrôlées)
    python3 tools/banque_sons.py prendre                                       télécharge le catalogue dans data/sons/
    python3 tools/banque_sons.py essai <rôle>                                  contrôle (verif_son) de chaque son d'un rôle
    python3 tools/banque_sons.py sources                                       réécrit la liste des bruitages dans SOURCES.md

Le catalogue est data/bruitages.json : pour chaque rôle (vent, mer, foule, impact…), la liste des prises retenues
(numéro Freesound, auteur, titre). Les fichiers (aperçus haute qualité, OGG jusqu'à 96 kHz, environ 200 kbit/s : plus fin
que ce que YouTube garde) vont dans data/sons/, hors du dépôt ; `prendre` les récupère sur une autre machine.
Les sources sont listées dans SOURCES.md (section bruitages).

Côté scripts de son (tools/sound.py, tools/sound_intro.py) :
    import banque_sons as B
    if B.dispo("vent"): l, r = B.fond("vent", n, rng)       fond de n échantillons, sans boucle audible
    l, r = B.prise("impact", rng)                            une prise au hasard, jamais deux fois la même d'affilée
Tout est rendu en 48 kHz stéréo, coupé sous 30 Hz, à niveau constant (RMS -20 dBFS pour les fonds, crête 0 dBFS pour les prises).
"""
import html
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.error
import urllib.request

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAT = os.path.join(ROOT, "data", "bruitages.json")
DIR = os.path.join(ROOT, "data", "sons")
SR = 48000
UA = {"User-Agent": "Mozilla/5.0 (documentaire SION, bruitages CC0)"}


CAT_ENV = os.path.join(ROOT, "data", "bruitages-envato.json")


def _principal():
    return json.load(open(CAT)) if os.path.exists(CAT) else {"roles": {}}


def catalogue():
    """Catalogue complet : les prises Freesound (data/bruitages.json) puis les prises Envato Elements téléchargées par
    l'auteur (data/bruitages-envato.json, fichiers dans data/envato-sons/, hors du dépôt)."""
    cat = _principal()
    if os.path.exists(CAT_ENV):
        for role, lst in json.load(open(CAT_ENV))["roles"].items():
            cat["roles"].setdefault(role, []).extend(lst)
    return cat


def fichier(s):
    if s.get("fichier"):  # prise Envato : chemin dans le projet
        return os.path.join(ROOT, s["fichier"])
    return os.path.join(DIR, f"{s['id']}.ogg")


# ------------------------------------------------------------------ recherche et téléchargement
def _get(url, timeout=40):
    """Freesound refuse parfois une requête (403, 429) : on réessaie patiemment, peu de requêtes, bien espacées."""
    import time
    for attente in (20, 45, 90, 0):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout)
        except urllib.error.HTTPError as e:
            if e.code not in (403, 429) or not attente:
                raise
            time.sleep(attente)


def chercher(q, n=15, duree=None, by=False):
    f = 'license:("Creative Commons 0" OR "Attribution")' if by else 'license:"Creative Commons 0"'
    if duree == "court":
        f += " duration:[0 TO 8]"
    elif duree == "long":
        f += " duration:[30 TO 100000]"
    url = "https://freesound.org/search/?" + urllib.parse.urlencode({"q": q, "f": f, "s": "Downloads (most first)"})
    h = _get(url).read().decode("utf-8", "replace")
    out = []
    for blk in h.split('class="bw-player"')[1:]:
        g = lambda k: (re.search(rf'data-{k}="([^"]*)"', blk) or [None, ""])[1]
        note = re.search(r'aria-label="Average rating of ([\d.]+)"', blk)
        out.append({"id": int(g("sound-id")), "user": g("username"), "titre": html.unescape(g("title")),
                    "duree": float(g("duration") or 0), "sr": int(float(g("samplerate") or 0)),
                    "telechargements": int(g("num-downloads") or 0), "note": float(note[1]) if note else None,
                    "ogg": g("ogg").replace("-lq.ogg", "-hq.ogg")})
        if len(out) >= n:
            break
    return out


# un son dont le titre ou les étiquettes parlent de synthèse ou d'IA n'entre jamais dans la banque
PAS_REEL = re.compile(r"\b(ai|a\.i\.|ai[- ]generated|generated|generative|text[- ]to[- ](sound|audio)|elevenlabs|suno|udio|"
                      r"synth|synths|synthesi[sz]ed|synthesizer|synthetic|simulation|simulated|procedural|chiptune|8[- ]?bit|"
                      r"vst|plugin|tts)\b", re.I)


def licence_de(page_html):
    """CC0, CC BY x.y, ou None pour toute licence refusée (non commerciale, Sampling+)."""
    m = re.search(r"creativecommons\.org/(publicdomain/zero/1\.0|licenses/([a-z-]+)/(\d\.\d))", page_html)
    if not m:
        return None
    if m[1].startswith("publicdomain"):
        return "CC0"
    return f"CC BY {m[3]}" if m[2] == "by" else None


def ajouter(role, sid, **extra):
    """Ajoute la prise Freesound `sid` au rôle, après contrôle de la licence, du titre et des étiquettes."""
    rep = _get(f"https://freesound.org/s/{sid}/")
    page, h = rep.geturl(), rep.read().decode("utf-8", "replace")
    lic = licence_de(h)
    if lic is None:
        sys.exit(f"{sid} refusé : licence non commerciale ou inconnue")
    titre = html.unescape((re.search(r'<meta property="og:title" content="([^"]*)"', h) or [None, ""])[1])
    tags = " ".join(re.findall(r'href="/browse/tags/([^/"]+)/?"', h))
    if PAS_REEL.search(titre + " " + tags.replace("-", " ")):
        sys.exit(f"{sid} refusé : « {titre} » ({tags[:120]}) parle de synthèse ou d'IA")
    auteur = re.search(r"/people/([^/]+)/sounds/", page)[1]
    titre = re.sub(rf"\s+by {re.escape(auteur)}$", "", titre)
    ogg = re.search(r"https://cdn\.freesound\.org/previews/\d+/\d+_\d+-[hl]q\.ogg", h)[0].replace("-lq.ogg", "-hq.ogg")
    duree = float((re.search(r'data-duration="([\d.]+)"', h) or [None, 0])[1])
    cat = _principal()
    lst = cat["roles"].setdefault(role, [])
    if any(x["id"] == sid for x in lst):
        sys.exit(f"{sid} est déjà dans « {role} »")
    lst.append({"id": sid, "auteur": auteur, "titre": titre, "duree": duree, "licence": lic, "page": page, "ogg": ogg, **extra})
    json.dump(cat, open(CAT, "w"), ensure_ascii=False, indent=1)
    print(f"{role} : {sid} « {titre} » de {auteur} ({lic}) ajouté ; reste à lancer prendre puis essai {role}")


def credits_by():
    """Prises CC BY du catalogue (à citer au générique et dans la description) : [(titre, auteur, licence, page)]."""
    return [(s["titre"], s["auteur"], s["licence"], s["page"]) for lst in catalogue()["roles"].values() for s in lst
            if s.get("licence", "CC0").startswith("CC BY")]


def prendre():
    from concurrent.futures import ThreadPoolExecutor
    os.makedirs(DIR, exist_ok=True)
    todo = [(role, s) for role, lst in _principal()["roles"].items() for s in lst
            if not (os.path.exists(fichier(s)) and os.path.getsize(fichier(s)) > 1000)]

    def one(item):
        role, s = item
        p = fichier(s)
        data = _get(s["ogg"], timeout=300).read()
        with open(p + ".part", "wb") as fh:
            fh.write(data)
        os.replace(p + ".part", p)
        return f"{role} : {s['id']} {s['titre'][:60]} ({len(data) / 1e6:.1f} Mo)"

    with ThreadPoolExecutor(4) as ex:  # le serveur sert lentement chaque fichier : quatre à la fois
        for line in ex.map(one, todo):
            print(line, flush=True)


# ------------------------------------------------------------------ côté scripts de son
_cache = {}


def _spec_hp(x, fc=30):
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(len(x), 1 / SR)[:, None]
    return np.fft.irfft(X / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** 8), len(x), axis=0)


def declic(x):
    """Répare les clics isolés d'une prise (choc sur le micro, braise qui claque trop sec) : saut d'un échantillon
    à l'autre qui dépasse de loin le grain du son autour et n'est suivi d'aucun son nouveau. Le passage de 1 ms est
    remplacé par une interpolation, inaudible. Même critère que tools/verif_son.py."""
    x = x.copy()
    for c in range(x.shape[1]):
        ch = x[:, c]
        d2 = np.abs(np.diff(ch, 2))
        B_ = 240
        nb = len(d2) // B_
        if nb < 50:
            continue
        blk = d2[:nb * B_].reshape(nb, B_)
        mx = blk.max(1)
        rms = np.sqrt((blk ** 2).mean(1)) + 1e-9
        k = 41
        pad = np.pad(rms, k // 2, mode="edge")
        bg = np.median(np.lib.stride_tricks.sliding_window_view(pad, k), 1)
        floor = 0.3 * np.sqrt((ch ** 2).mean())  # seuil relatif : une prise faible sera remontée au mixage
        # seuils plus bas que ceux du contrôle (14 et 12) : tout ce que le contrôle signalerait est réparé, avec de la marge
        for b in np.where((mx > 10 * bg) & (mx > floor))[0]:
            i = b * B_ + int(blk[b].argmax()) + 1
            if i < 1000 or i > len(ch) - 1500:
                continue
            near = np.concatenate((d2[i - 241:i - 17], d2[i + 15:i + 239]))
            if mx[b] < 8 * np.sqrt((near ** 2).mean()):
                continue
            w2 = d2[i - 49:i + 48] ** 2
            if w2[46:51].sum() < 0.5 * w2.sum():  # éclat naturel, étalé : on le garde
                continue
            before = np.sqrt((ch[i - 960:i - 96] ** 2).mean()) + 1e-6
            after = np.sqrt((ch[i + 96:i + 1440] ** 2).mean())
            if after < 3 * before:  # lissage sur 4 ms, fondu en douceur aux deux bouts : aucune cassure
                a, z = i - 96, i + 96
                sm = np.convolve(ch[a - 16:z + 16], np.ones(17) / 17, "same")[16:-16]
                w = np.ones(z - a)
                w[:32] = np.sin(np.linspace(0, np.pi / 2, 32)) ** 2
                w[-32:] = w[:32][::-1]
                ch[a:z] = ch[a:z] * (1 - w) + sm * w
    return x


def charge(s):
    """Prise décodée en 48 kHz stéréo float64, coupée sous 30 Hz, sans décalage continu."""
    key = (s["id"], s.get("debut"), s.get("fin"))
    if key not in _cache:
        cmd = ["ffmpeg", "-nostdin", "-v", "error"]
        if s.get("debut"):
            cmd += ["-ss", str(s["debut"])]
        if s.get("fin"):
            cmd += ["-to", str(s["fin"])]
        cmd += ["-i", fichier(s), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"]
        raw = subprocess.run(cmd, capture_output=True, check=True).stdout
        x = np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)
        x = declic(_spec_hp(x - x.mean(0)))
        if s.get("mono"):  # prise mono déguisée en stéréo : garder une seule voie propre
            x[:, 1] = x[:, 0]
        _cache[key] = x
    return _cache[key]


def prises(role):
    return [s for s in catalogue()["roles"].get(role, []) if os.path.exists(fichier(s))]


def dispo(role):
    return bool(prises(role))


def _rms(x):
    return np.sqrt((x ** 2).mean() + 1e-20)


def fond(role, n, rng, rms_db=-20.0, xf=3.0):
    """Fond continu de n échantillons tiré des prises du rôle : morceaux pris à des endroits différents, enchaînés
    en fondus à puissance constante de xf secondes (jamais deux fois le même passage de suite : pas de boucle audible)."""
    ps = prises(role)
    out = np.zeros((n, 2))
    pos, last = 0, None
    X = int(xf * SR)
    while pos < n:
        s = ps[rng.integers(len(ps))] if len(ps) > 1 else ps[0]
        x = charge(s)
        want = min(n - pos + X, len(x))
        seg_len = int(min(len(x), max(want, 8 * SR)))
        a = int(rng.integers(0, max(1, len(x) - seg_len + 1)))
        if last is not None and last[0] == s["id"] and abs(a - last[1]) < seg_len and len(x) > 2 * seg_len:
            a = (last[1] + seg_len + int(rng.integers(0, SR * 5))) % max(1, len(x) - seg_len)
        seg = x[a:a + seg_len].copy()
        # un passage très calme n'est pas remonté au niveau des autres (son souffle de micro deviendrait du bruit
        # blanc) : la remontée s'arrête à la moitié du niveau moyen de la prise
        seg *= 10 ** (rms_db / 20) / max(_rms(seg), 0.5 * _rms(x))
        if os.environ.get("SONS_TRACE"):
            print(f"fond {role} : prise {s['id']} de {a / SR:.2f} s, placée à {max(0, pos) / SR:.2f} s", file=sys.stderr)
        if pos == 0:
            k = min(len(seg), n)
            out[:k] = seg[:k]
            pos = len(seg) - X
        else:
            k = min(X, len(seg), n - pos)
            w = np.sin(np.linspace(0, np.pi / 2, k))[:, None]
            out[pos:pos + k] = out[pos:pos + k] * np.cos(np.linspace(0, np.pi / 2, k))[:, None] + seg[:k] * w
            m = min(len(seg) - k, n - pos - k)
            if m > 0:
                out[pos + k:pos + k + m] = seg[k:k + m]
            pos = pos + len(seg) - X
        last = (s["id"], a)
        if len(seg) <= X + SR:  # prise trop courte pour un fond
            break
    return out[:, 0], out[:, 1]


_derniere = {}


def tirage(cle, n, rng, memoire=4):
    """Indice tiré au hasard parmi n, jamais l'un des `memoire` derniers tirés pour cette clé (moins s'il y a peu de
    choix) : avec plusieurs prises, la même ne revient jamais à la suite ni à quelques coups d'écart."""
    vus = _derniere.setdefault(cle, [])
    m = min(memoire, n - 1)
    libres = [k for k in range(n) if k not in vus[-m:]] if m > 0 else list(range(n))
    k = libres[int(rng.integers(len(libres)))]
    vus.append(k)
    del vus[:-8]
    return k


def prise(role, rng, vitesse=1.0, idx=None):
    """Une prise du rôle (au hasard, jamais l'une des quatre dernières), crête à 0 dBFS. vitesse < 1 : plus grave et
    plus long (lecture ralentie, comme une bande), > 1 : plus aigu. Varier la vitesse de ±6 % évite l'effet copier-coller."""
    ps = prises(role)
    if idx is None:
        k = tirage(role, len(ps), rng)
    else:
        k = idx % len(ps)
        _derniere.setdefault(role, []).append(k)
    x = charge(ps[k])
    if abs(vitesse - 1) > 1e-3:
        src = np.arange(0, len(x) - 1, vitesse)
        x = np.stack([np.interp(src, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
    x = x / (np.abs(x).max() + 1e-9)
    fin = min(len(x), int(0.01 * SR))  # 10 ms de fondu : jamais de clic en fin de prise
    x[len(x) - fin:] *= np.linspace(1, 0, fin)[:, None]
    x[:48] *= np.linspace(0, 1, 48)[:, None]  # ni au début (prise qui commence sur un échantillon non nul)
    return x[:, 0].copy(), x[:, 1].copy()


NOMS = {"vent": "Vent fort (survols)", "vent_doux": "Vent léger", "brise": "Brise de jour", "village": "Rue de village",
        "mer": "Mer sur les rochers", "foule": "Souk", "salle": "Grande salle", "atelier": "Atelier", "moutons": "Moutons",
        "campagne": "Campagne", "nuit": "Nuit, grillons", "nuit_ville": "Nuit, ville au loin", "feu": "Feu, braises",
        "projecteur": "Projecteur de cinéma", "grondement": "Grondement lointain", "explosion": "Explosions lointaines",
        "artillerie": "Artillerie", "souffle": "Souffles (coupes, survols)", "impact": "Impacts", "impact_objet": "Coups d'objets",
        "impact_sourd": "Coups sourds", "timbale": "Timbales", "tampon": "Tampon", "montee": "Montées (cymbales)",
        "tic": "Tic-tac", "machine": "Machine à écrire", "machine_cloche": "Sonnette de machine à écrire", "coeur": "Cœur",
        "avion": "Avions de chasse", "tir": "Coups de feu lointains", "radio": "Radio", "char": "Char", "pas": "Pas, foule qui marche",
        "pierre": "Pierre", "papier": "Papier", "ecroulement": "Effondrement", "marteau": "Marteau de séance",
        "papier_coupe": "Papier coupé", "ir_salle": "Réverbération d'une salle de concert", "ir_grand": "Réverbération d'une église"}


def ecrire_sources():
    """Réécrit la liste des bruitages dans SOURCES.md, entre les repères <!-- bruitages --> et <!-- /bruitages -->."""
    rows = ["| Rôle | Prise | Preneur de son | Licence | Lien |", "|---|---|---|---|---|"]
    for role, lst in catalogue()["roles"].items():
        for s in lst:
            titre = s["titre"].replace("|", "/")
            rows.append(f"| {NOMS.get(role, role)} | {titre} | {s['auteur']} | {s.get('licence', 'CC0')} | {s['page']} |")
    p = os.path.join(ROOT, "SOURCES.md")
    txt = open(p).read()
    a, b = txt.index("<!-- bruitages -->"), txt.index("<!-- /bruitages -->")
    n = sum(len(v) for v in catalogue()["roles"].values())
    block = "<!-- bruitages -->\n" + "\n".join(rows) + "\n"
    open(p, "w").write(txt[:a] + block + txt[b:])
    print(f"SOURCES.md : {n} prises listées")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "chercher":
        n = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3].isdigit() else 15
        duree = next((a for a in sys.argv[3:] if a in ("court", "long")), None)
        for r in chercher(sys.argv[2], n, duree, by="by" in sys.argv[3:]):
            print(f"{r['id']:>7}  {r['duree']:6.1f} s  {r['sr'] // 1000:>3} kHz  {r['telechargements']:>6} tél.  "
                  f"note {r['note'] or 0:.1f}  {r['user'][:16]:16}  {r['titre'][:70]}")
    elif cmd == "ajouter":
        extra = {k: (float(v) if re.fullmatch(r"[\d.]+", v) else v) for k, v in (a.split("=", 1) for a in sys.argv[4:])}
        ajouter(sys.argv[2], int(sys.argv[3]), **extra)
    elif cmd == "prendre":
        prendre()
    elif cmd == "sources":
        ecrire_sources()
    elif cmd == "essai":
        for s in prises(sys.argv[2]):
            subprocess.run(["python3", os.path.join(ROOT, "tools", "verif_son.py"), fichier(s), "--nom", f"banque-{s['id']}"])
    else:
        print(__doc__)
