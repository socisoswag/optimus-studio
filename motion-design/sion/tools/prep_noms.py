"""Séquence « Leurs noms » : écrit timelines/les-noms.js à partir de la liste nominative des morts de Gaza.

    python3 tools/prep_noms.py [killed-in-gaza.json]

Liste : ministère de la Santé de Gaza, morts identifiés nom par nom, mise en données ouvertes par Tech for Palestine
(https://data.techforpalestine.org/api/v2/killed-in-gaza.json ; résumé : /api/v3/summary.json, rubrique
« known_killed_in_gaza »). On garde les enfants de moins d'un an (âge 0), dans l'ordre de la liste, nom arabe et
transcription seulement (ni numéro d'identité ni date de naissance à l'écran).
"""
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = "https://data.techforpalestine.org/api/v2/killed-in-gaza.json"
SUM = "https://data.techforpalestine.org/api/v3/summary.json"


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "SionDocResearch/1.0"})
    with urllib.request.urlopen(req, timeout=240) as r:
        return json.loads(r.read())


rows = json.load(open(sys.argv[1], encoding="utf-8")) if len(sys.argv) > 1 else get(URL)
summary = get(SUM)["known_killed_in_gaza"]
bebes = [[r["name"].strip(), r["en_name"].strip()] for r in rows if r.get("age") == 0 and r.get("name")]
enfants = sum(1 for r in rows if isinstance(r.get("age"), int) and r["age"] < 18)
assert summary["records"] == len(rows), (summary["records"], len(rows))
fr = lambda n: f"{n:,}".replace(",", " ")
print(len(rows), "morts identifiés,", enfants, "enfants,", len(bebes), "de moins d'un an ; liste du", summary["last_update"], "jusqu'au", summary["includes_until"])

GAZA = [[34.219, 31.322], [34.267, 31.219], [34.375, 31.297], [34.501, 31.467], [34.567, 31.535], [34.49, 31.596], [34.428, 31.543], [34.335, 31.43]]
js = f"""/*
 * Séquence « Leurs noms » (chapitre 25, après le bilan), ≈ 1 min 19, écrite par tools/prep_noms.py (ne pas modifier à la main).
 *
 * Ministère de la Santé de Gaza, liste nominative des morts identifiés, mise à jour du {summary["last_update"]} (morts
 * jusqu'au {summary["includes_until"]}) : {len(rows)} personnes, dont {enfants} enfants de moins de 18 ans et {len(bebes)} de moins d'un an ;
 * données ouvertes de Tech for Palestine (data.techforpalestine.org). À l'écran : les {len(bebes)} enfants de moins d'un an,
 * nom arabe et transcription, dans l'ordre de la liste. Une lumière par enfant sur la bande de Gaza.
 */
(function (root) {{
  const NOMS = {json.dumps(bebes, ensure_ascii=False, separators=(",", ":"))};
  const segments = [
    {{
      id: 'mot', type: 'beat', dur: 7.0, hitAt: 1.0, rgb: 10,
      kicker: 'Gaza · d’octobre 2023 à mai 2026', word: 'Leurs noms',
      sub: 'Le ministère de la Santé de Gaza publie, nom par nom, la liste des morts identifiés.', subAt: 2.0,
      cam: {{ lon: 34.4, lat: 31.42, w: 0.034, pitch: 40, bearing: -44 }},
      camEnd: {{ lon: 34.4, lat: 31.42, w: 0.03, pitch: 44, bearing: -40 }},
    }},
    {{
      id: 'roll', type: 'roll', dur: 72.0, fly: 1.5, hitAt: 0, hold: 6.0,
      sections: [
        {{ h: 'Ils avaient moins d’un an · {fr(len(bebes))} noms', grid: 5, names: NOMS }},
        {{ big: '{fr(enfants)}', lines: ['enfants identifiés par leur nom.', 'Sur {fr(len(rows))} morts identifiés, jusqu’au 7 mai 2026.', ['Ministère de la Santé de Gaza', 'liste du {summary["last_update"]}']] }},
      ],
      cam: {{ lon: 34.39, lat: 31.41, w: 0.03, pitch: 44, bearing: -42 }},
      camEnd: {{ lon: 34.4, lat: 31.43, w: 0.026, pitch: 50, bearing: -34 }},
    }},
  ];
  const lights = [{{ seg: 'roll', at: 0.4, poly: {json.dumps(GAZA)}, n: {len(bebes)} }}];

  root.TL = root.buildTL({{
    name: 'les-noms',
    seed: 1072,
    segments,
    lights,
    cities: [],
    hud: {{ label: ['Sion', 'Chapitre 25 · Leurs noms'], index: false, coords: true, ruler: false, odo: false, from: 0.5 }},
    fadeIn: 0.8,
    fadeOut: 2.0,
    sound: {{ ticks: null }},
  }});
}})(typeof window !== 'undefined' ? window : globalThis);
"""
open(os.path.join(ROOT, "timelines", "les-noms.js"), "w", encoding="utf-8").write(js)
print("timelines/les-noms.js")
