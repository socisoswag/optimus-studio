"""Range les sons Envato Elements téléchargés par l'auteur (data/envato-sons/<son>/, hors du dépôt) dans les rôles de
la banque de bruitages : écrit data/bruitages-envato.json, que tools/banque_sons.py ajoute au catalogue Freesound.

    python3 tools/banque_envato.py            (relancer après chaque nouveau lot de sons)

Modes : « fond » (prise entière, pour les fonds continus : 8 s au moins), « entier » (prise entière, un seul son),
« coups » (chaque coup de la prise devient une prise à part, de l'attaque à son extinction, au plus `max` secondes),
« un » (le premier coup et toute sa traîne, `max` secondes),
« sommet » (le passage le plus fort, une voiture qui passe : `max` secondes autour). Licence Envato : usage YouTube
permis, pas de mention obligatoire ; les fichiers ne vont jamais dans le dépôt public.
Sons de studio (whoosh, glitch, swipe) : rôle « studio », réservé aux transitions du motion design (CLAUDE.md).
"""
import glob
import json
import os
import re
import subprocess
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "data", "envato-sons")
OUT = os.path.join(ROOT, "data", "bruitages-envato.json")
SR = 48000

# son (dossier) : [(rôle, mode, max en secondes)]
R = {
    # impacts
    # impact principal : le premier coup et toute sa traîne (c'est elle qui donne l'ampleur)
    **{k: [("impact", "un", 3.0)] for k in ("heavy-door-slam", "metal-gate-slam", "metal-door-shut", "metal-bang-hollow-box-hit-impact",
                                          "heavy-impact-crash", "light-metal-door-slam")},
    **{k: [("impact_objet", "coups", 1.2)] for k in ("hit-wood-table-with-fist-1", "hitting-table-with-fist-deep-thuddy-impact-4",
                                                   "hard-knocking-on-metal-door", "heavy-metal-clank", "heavy-metal-clank-impact")},
    **{k: [("impact_sourd", "coups", 1.5)] for k in ("object-impact-sand-bag-drop-14", "impact-body-fall-sand-thud-02",
                                                   "impact-body-fall-sand-thud-03", "falling-body-on-soft-wooden-floor", "soft-punch-hit")},
    # souffles (passages d'air) : les voitures, seulement leur passage
    **{k: [("souffle", "entier", 3.5)] for k in ("foley-whoosh-cloth-01", "foley-whoosh-feather-quick-01", "bamboo-woosh")},
    "flock-of-birds-taking-flight": [("souffle", "entier", 3.5), ("oiseaux", "entier", 6)],
    **{k: [("souffle", "sommet", 1.8)] for k in ("fast-road-car-passing", "very-fast-car-passing", "passing-car-mid-distant-whoosh")},
    # montées jouées
    **{k: [("montee", "entier", 20)] for k in ("timpani-roll-with-crescendo", "short-timpani-roll", "cymbal-roll-1",
                                             "timpani-drum-roll-hit")},
    "long-gong-swell": [("montee", "entier", 20), ("gong", "entier", 12)],
    # guerre
    **{k: [("explosion", "entier", 15)] for k in ("distant-explosion-03", "distant-explosion-2", "large-distant-explosion",
                                                "large-distant-and-muted-explosion", "explosion-distant-thunder",
                                                "warfare-distant-explosions", "artillery-shell-explosion-4933",
                                                "artillery-cannon-single-shot", "105mm-howitzer-cannon-fires")},
    "rumble-long-distant-explosions-crumbling-roll": [("grondement", "fond", 0), ("guerre_loin", "fond", 0)],
    **{k: [("grondement", "fond", 0)] for k in ("thunder-distant-rumble-5", "distant-thunder-rumbling", "distant-rolling-thunder")},
    "distant-gunfire-constant": [("guerre_loin", "fond", 0)],
    "artillery-distant-2": [("guerre_loin", "fond", 0), ("explosion", "entier", 60)],
    **{k: [("tir", "coups", 2.5)] for k in ("distant-gunshot", "distant-gunshot-2", "weapons-rifle-distant-shot-06")},
    "automatic-gunshots-distant": [("tir", "entier", 3)],
    **{k: [("ecroulement", "coups", 7)] for k in ("concrete-building-collapses", "concrete-wall-collapsing", "falling-rubble",
                                                "stone-rubble-and-debris-falling-on-dirt", "huge-building-collapse")},
    **{k: [("avion", "entier", 30)] for k in ("f-18-fighter-jet-fly-by-1", "f16-airplane-jet-pass-overhead",
                                            "fast-jet-flyover-airplane", "military-jet-fighter-close-flyby-02")},
    **{k: [("char", "fond", 0)] for k in ("military-tank-driving", "military-tank-moving-tracks-squeaking",
                                        "ats-59-military-tank-fast-pull-away", "ats-59-military-tanks-fast-approach",
                                        "bmp-1-military-tank-on-board-medium-speed")},
    **{k: [("helico", "entier", 40)] for k in ("military-helicopter-fly-over", "helicopter-passing-overhead")},
    **{k: [("avion_helice", "entier", 40)] for k in ("prop-plane-flyby", "propeller-aircraft-flyby",
                                                   "propeller-plane-twin-engine-fly-by")},
    "small-drone-hover-1": [("drone", "fond", 0)],
    "drone-flying-passing-by": [("drone_passe", "entier", 5)],
    **{k: [("sirene", "fond", 0)] for k in ("air-raid-siren-1", "air-raid-siren-2", "air-raid-siren-old-fashioned")},
    # fonds de lieu
    **{k: [("feu", "fond", 0)] for k in ("fire-crackling", "fireplace-flames-fluttering",
                                       "fires-fireplace-wood-fire-grows-rustle-crackles")},
    **{k: [("vent", "fond", 0), ("vent_desert", "fond", 0)] for k in ("howling-wind-ambience", "strong-desert-wind",
                                                                    "violent-sandstorm-wind-blowing")},
    "wind-gust": [("vent", "fond", 0)],
    **{k: [("foule", "fond", 0)] for k in ("immerse-yourself-in-a-bustling-arabic-market-with", "exterior-large-arab-crowd")},
    "muslim-town-ambience-loop": [("foule", "fond", 0), ("ville", "fond", 0)],
    **{k: [("mer", "fond", 0)] for k in ("seashore", "harbor-atmosphere-with-seagulls", "city-harbor-with-seagulls-morning-ambience")},
    "field-and-meadow-ambience": [("campagne", "fond", 0)],
    "animals-goats-bleat-calls-warbling-baa-movements": [("moutons", "fond", 0), ("chevres", "fond", 0)],
    "goat-livestock-bells-ringing": [("moutons", "fond", 0), ("chevres", "fond", 0)],
    "animal-goat-baa-herd-excitement-03": [("chevre", "entier", 7)],
    **{k: [("nuit", "fond", 0)] for k in ("cricket-nighttime-ambience", "night-ambience-with-light-crickets")},
    "cicadas-at-night-1": [("nuit", "fond", 0), ("cigales", "fond", 0)],
    "cicadas": [("cigales", "fond", 0)],
    **{k: [("nuit_ville", "fond", 0)] for k in ("city-night-ambience-5", "city-night-ambience-6", "city-ambience-night-distant-traffic-2")},
    "distant-muslim-prayers-mingle-with-chatter-cricke": [("village", "fond", 0), ("priere", "fond", 0)],
    **{k: [("priere", "fond", 0)] for k in ("the-muezzin-calls-to-prayer-amid-an-intense-urban", "muslim-mosque-prayer-loop")},
    "church-bell-evening-prayer-call-distant-ringing": [("cloches", "fond", 0)],
    **{k: [("coq", "entier", 6)] for k in ("rooster-call-morning", "rooster-crowing")},
    **{k: [("pluie", "fond", 0)] for k in ("rain-on-canvas-tent", "rain-on-tin-roof", "heavy-rain-on-tin-roof-1",
                                         "heavy-rain-falling-on-metal-roof")},
    **{k: [("enfants", "fond", 0)] for k in ("distant-playground-schoolyard", "children-playing-in-a-schoolyard", "schoolyard")},
    **{k: [("manif", "fond", 0)] for k in ("rioting-demonstration-crowd", "rioting-crowd")},
    **{k: [("manif_cri", "entier", 6)] for k in ("crowd-chanting-revolution", "energetic-crowd-chanting")},
    **{k: [("applaudissements", "fond", 0)] for k in ("large-crowd-applause-cheering-in-hall",
                                                    "large-crowd-applause-cheering-in-convention-hall")},
    "large-crowd-murmur-2": [("salle", "fond", 0), ("murmure", "fond", 0)],
    "large-crowd-murmur": [("murmure", "entier", 6)],
    **{k: [("bureau", "fond", 0)] for k in ("room-tone-empty-office-space", "quiet-clean-office-room-tone", "office-room-tone",
                                          "computer-input-room-ambience")},
    **{k: [("teletype", "fond", 0)] for k in ("teletype-machine-printing", "teletype-teleprinter-working",
                                            "newsroom-office-teletype-printers", "telegraph-sending-morse-code")},
    **{k: [("clavier", "fond", 0)] for k in ("old-computer-keyboard-typing", "fast-keyboard-typing")},
    # objets et documents
    **{k: [("tic", "fond", 0)] for k in ("antique-clock-ticking", "old-clock-pendulum-ticking", "wall-clock-ticking")},
    "typewriter-writing": [("machine", "entier", 60)],
    "antique-typewriter-load-sheet-of-paper": [("machine_papier", "entier", 5)],
    "court-judge-gavel-hit": [("marteau", "entier", 2)],
    **{k: [("pierre", "coups", 5)] for k in ("rock-dragged-over-stone-plate", "heavy-stone-slab-movement")},
    **{k: [("radio", "fond", 0)] for k in ("radio-static", "walkie-talkie-dead-air-static")},
    **{k: [("radio_coup", "entier", 2)] for k in ("transmission-end-static", "walkie-talkie-static-burst")},
    **{k: [("tole", "entier", 5)] for k in ("sheet-metal-vibration", "heavy-metal-rattle")},
    **{k: [("papier", "entier", 6)] for k in ("paper-rustle", "paper-shuffle-page-turn-rustle", "newspaper-page-turn",
                                            "rustling-paper-suggests-manipulating-a-newspaper")},
    **{k: [("carte_papier", "entier", 7)] for k in ("open-map", "unfolding-map", "map", "huge-treasure-map-unfurled",
                                                  "foley-map-map-chart-pull-out")},
    **{k: [("tampon", "coups", 1.2)] for k in ("ink-stamp-on-pad-and-stamp", "small-rubber-stamp", "stamps-from-small-rubber-stamp")},
    **{k: [("stylo", "entier", 8)] for k in ("handwriting-fountainpen-029", "signature-scribble-with-pen")},
    **{k: [("diapo", "entier", 7)] for k in ("slide-projector-advance", "slide-projector-click-1", "vintage-film-camera-rewind")},
    **{k: [("bol", "entier", 25)] for k in ("tibetan-singing-bowl-1", "tibetan-singing-bowl-2", "meditation-singing-bowl-tone-3")},
    **{k: [("cles", "entier", 10)] for k in ("keys-jingle", "keys-on-keyring", "lock-unlock-with-key",
                                           "key-locking-and-unlocking-sound-pack")},
    "wooden-creaking-door": [("porte", "entier", 3)],
    # sons de studio : transitions du motion design seulement
    **{k: [("studio", "entier", 7)] for k in ("cinematic-photo", "cinematic-transition-whoosh-11", "incoming-cinematic-transition",
                                            "swipe", "glitch", "glitch-accent-1", "glitch-rough",
                                            "clicking-a-ui-bubble-button-provides-a-crisp-tap")},
}


def pcm(path):
    raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def env_db(x, h=240):
    nb = len(x) // h
    return 10 * np.log10((x[:nb * h].reshape(nb, h) ** 2).mean(1) + 1e-12), h


def coups(x, cap):
    """[(début, fin, attaque)] en secondes : chaque coup net, coupé avant le suivant ou quand il s'est éteint."""
    e, h = env_db(x)
    top = e.max()
    ons = [j for j in range(10, len(e) - 2) if e[j] > top - 32 and e[j] - e[j - 10:j - 1].min() > 12]
    keep = []
    for j in ons:
        if not keep or j - keep[-1] > int(0.25 * SR / h):
            keep.append(j)
    out = []
    for i, j in enumerate(keep):
        fin = keep[i + 1] - 4 if i + 1 < len(keep) else len(e)
        fin = min(fin, j + int(cap * SR / h))
        pk = e[j:fin].max() if fin > j else e[j]
        q = j + 1
        while q < fin and not (e[q:q + 20] < pk - 45).all():
            q += 1
        d0, d1 = max(0, j - 2) * h / SR, q * h / SR
        if d1 - d0 >= 0.12:
            out.append((round(d0, 3), round(d1, 3), round(j * h / SR - d0, 3)))
    return out[:8]


def sommet(x, cap):
    e, h = env_db(x)
    j = int(np.argmax(np.convolve(e, np.ones(40) / 40, "same")))
    t = j * h / SR
    return round(max(0, t - 0.55 * cap), 3), round(min(len(x) / SR, t + 0.45 * cap), 3)


def lien(nom):
    txt = open(os.path.join(ROOT, "script", "LIENS-ENVATO.md"), encoding="utf-8").read()
    m = re.search(rf"https://elements\.envato\.com/{re.escape(nom)}-[A-Z0-9]{{7}}\b", txt)
    return m[0] if m else ""


def main():
    roles, absents, refus = {}, [], []
    for nom, regles in sorted(R.items()):
        d = os.path.join(DIR, nom)
        wavs = sorted(f for f in glob.glob(os.path.join(d, "*")) if f.lower().endswith((".wav", ".aif", ".aiff", ".flac")))
        if not wavs:
            wavs = sorted(glob.glob(os.path.join(d, "*.mp3")))
        if not wavs:
            absents.append(nom)
            continue
        for k, f in enumerate(wavs):
            rel = os.path.relpath(f, ROOT)
            x = pcm(f)
            dur = len(x) / SR
            titre = os.path.splitext(os.path.basename(f))[0].replace("_", " ")
            base = {"auteur": "Envato Elements", "licence": "Envato", "page": lien(nom), "fichier": rel, "titre": titre}
            for role, mode, cap in regles:
                lst = roles.setdefault(role, [])
                sid = f"env:{nom}:{k}"
                if mode == "fond":
                    if dur < 8:
                        refus.append(f"{nom} ({dur:.1f} s) trop court pour un fond « {role} »")
                        continue
                    lst.append({"id": sid, **base, "duree": round(dur, 1)})
                elif mode == "entier":
                    e = {"id": sid, **base, "duree": round(min(dur, cap), 1)}
                    if dur > cap:
                        e["fin"] = cap
                    lst.append(e)
                elif mode == "un":
                    cs = coups(x, cap)
                    d0 = cs[0][0] if cs else 0.0
                    d1 = round(min(dur, d0 + cap), 3)
                    lst.append({"id": sid, **base, "debut": d0, "fin": d1, "coup": cs[0][2] if cs else 0.0,
                                "duree": round(d1 - d0, 2)})
                elif mode == "sommet":
                    a, b = sommet(x, cap)
                    lst.append({"id": sid, **base, "debut": a, "fin": b, "duree": round(b - a, 2)})
                elif mode == "coups":
                    for c, (a, b, att) in enumerate(coups(x, cap)):
                        lst.append({"id": f"{sid}:{c}", **base, "debut": a, "fin": b, "coup": att, "duree": round(b - a, 2)})
    json.dump({"_": "Sons Envato Elements de l'auteur (licence Envato, sans mention obligatoire), rangés par "
                    "tools/banque_envato.py ; fichiers dans data/envato-sons/, hors du dépôt.", "roles": roles},
              open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    n = sum(len(v) for v in roles.values())
    print(f"{n} prises Envato dans {len(roles)} rôles -> {os.path.relpath(OUT, ROOT)}")
    for r, v in sorted(roles.items()):
        print(f"  {r} : {len(v)}")
    for a in refus:
        print("  écarté :", a)
    if absents:
        print("  pas encore téléchargés :", ", ".join(absents))
    rien = sorted(set(os.listdir(DIR)) - set(R))
    if rien:
        print("  sons sans rôle (à ranger) :", ", ".join(rien), file=sys.stderr)


if __name__ == "__main__":
    main()
