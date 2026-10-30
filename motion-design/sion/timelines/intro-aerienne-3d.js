// La partie 3D de l'intro seule (l'espace et la descente dans les nuages, jusqu'au premier vrai plan), pour
// tools/intro_hybride.sh : tools/build_intro.sh intro-aerienne-3d → output/intro-aerienne-3d.mp4.
// Fabriqué depuis intro-aerienne.js (le navigateur du rendu ne lit pas require) ; à refaire si l'intro change.
globalThis.INTRO = {
 "name": "intro-aerienne-3d",
 "total": 24.5,
 "fov": 38,
 "fadeStart": 1.2,
 "fadeIn": 2.6,
 "fadeOut": 1.6,
 "dips": [],
 "fx": {
  "letterbox": 2.39,
  "streak": 0.35,
  "cuts": [
   {
    "t": 23,
    "type": "fondu",
    "dur": 0.8
   },
   {
    "t": 56.72,
    "type": "flash",
    "col": [
     1,
     0.86,
     0.7
    ],
    "pre": 0.14,
    "dur": 0.45
   },
   {
    "t": 63.2,
    "type": "flash",
    "col": [
     1,
     0.55,
     0.25
    ],
    "k": 0.28,
    "pre": 0.05,
    "dur": 0.5
   }
  ],
  "shakes": []
 },
 "dipCol": [
  0.93,
  0.87,
  0.79
 ],
 "shots": [
  {
   "id": "espace",
   "type": "space",
   "t0": 0,
   "t1": 23,
   "light": "cote",
   "sun": [
    101,
    3.2
   ],
   "env": {
    "sunI": 20,
    "mie": 0.000013,
    "night": 0.6,
    "clouds": 1,
    "stars": 1,
    "day": 0.85,
    "albedo": 0.5,
    "specLo": 140,
    "sun": [
     3,
     2.2,
     1.6
    ],
    "bloomThr": 1.6,
    "flare": 0.6,
    "tint": 0.15
   },
   "fov": 42,
   "lapse": [
    [
     0,
     59
    ],
    [
     6.4,
     53.4
    ],
    [
     11,
     40
    ],
    [
     16,
     15
    ],
    [
     19.5,
     3
    ],
    [
     23,
     -2.5
    ]
   ],
   "expo": [
    [
     0,
     1.8
    ],
    [
     6,
     1.25
    ],
    [
     10,
     1
    ],
    [
     16,
     1
    ],
    [
     20,
     0.9
    ],
    [
     23,
     0.9
    ]
   ],
   "nightKeys": [
    [
     0,
     1
    ],
    [
     14,
     1
    ],
    [
     16.5,
     0.45
    ],
    [
     18.5,
     0.12
    ],
    [
     20,
     0
    ]
   ],
   "fovKeys": [
    [
     0,
     44
    ],
    [
     14,
     40
    ],
    [
     23,
     38
    ]
   ],
   "cloudPass": [
    [
     21.3,
     0
    ],
    [
     22.6,
     1
    ],
    [
     23,
     1
    ]
   ],
   "hud": [
    3.5,
    21.6
   ],
   "deck": {
    "lon": 34.56,
    "lat": 32.03,
    "alt": 3600,
    "r": 34000
   },
   "keys": [
    {
     "t": 0,
     "lon": 11,
     "lat": 26,
     "alt": 7400000,
     "hdg": 54,
     "pitch": -69
    },
    {
     "t": 6,
     "lon": 13,
     "lat": 26.6,
     "alt": 6800000,
     "hdg": 55,
     "pitch": -68
    },
    {
     "t": 11,
     "lon": 21.5,
     "lat": 29,
     "alt": 3200000,
     "hdg": 68,
     "pitch": -54
    },
    {
     "t": 15,
     "lon": 30.5,
     "lat": 31.3,
     "alt": 550000,
     "hdg": 86,
     "pitch": -36
    },
    {
     "t": 18,
     "lon": 33.6,
     "lat": 31.95,
     "alt": 60000,
     "hdg": 99,
     "pitch": -30
    },
    {
     "t": 20.5,
     "lon": 34.43,
     "lat": 32.03,
     "alt": 12000,
     "hdg": 104,
     "pitch": -20
    },
    {
     "t": 23,
     "lon": 34.62,
     "lat": 32.033,
     "alt": 3000,
     "hdg": 103,
     "pitch": -8
    }
   ]
  },
  {
   "id": "jaffa",
   "t0": 23,
   "t1": 38.6,
   "plate": {
    "src": "output/plans-reels/jaffa-vieille-ville-aerien-intro.mp4",
    "envato": "YQ5W8UK"
   },
   "cloudPass": [
    [
     0,
     1
    ],
    [
     0.6,
     1
    ],
    [
     1.5,
     0
    ]
   ],
   "light": "cote",
   "detail": "cote",
   "sun": [
    101,
    3.2
   ],
   "env": {
    "sun": [
     3.6,
     1.85,
     0.9
    ],
    "sky": [
     0.22,
     0.27,
     0.38
    ],
    "haze": [
     0.5,
     0.4,
     0.34
    ],
    "glow": [
     1.35,
     0.68,
     0.32
    ],
    "zenith": [
     0.07,
     0.13,
     0.3
    ],
    "horizon": [
     0.92,
     0.6,
     0.38
    ],
    "fogA": 0.000024,
    "fogB": 0.0007692307692307692,
    "rayK": 0.000004,
    "clouds": 0.34,
    "exposure": 1.05,
    "waves": 1,
    "bloomThr": 1.4,
    "flare": 1,
    "albedo": 0.5,
    "sat": 0.98
   },
   "label": {
    "at": 2.2,
    "eyebrow": "32°03′ N · 34°45′ E",
    "place": "Jaffa",
    "sub": "La vieille ville, face à la Méditerranée"
   },
   "keys": [
    {
     "t": 0,
     "lon": 34.668,
     "lat": 32.031,
     "alt": 640,
     "hdg": 90,
     "pitch": -5.5
    },
    {
     "t": 10,
     "lon": 34.689,
     "lat": 32.026,
     "alt": 540,
     "hdg": 88.6,
     "pitch": -4.4
    }
   ]
  }
 ],
 "title": {
  "at": 63.2,
  "out": 74.6,
  "word": "SION",
  "scripts": [
   "ציון",
   "صهيون"
  ],
  "sub": "L’idée, la terre, le choc"
 },
 "sound": {
  "space": [
   0,
   15
  ],
  "sunrise": 6.4,
  "entry": [
   12,
   22.8
  ],
  "surf": [
   23,
   39.2
  ],
  "reveal": 56.9,
  "titleSilence": 0.7,
  "whips": [
   [
    38.6,
    1
   ]
  ],
  "risers": [
   [
    55.1,
    56.72
   ]
  ],
  "impacts": [
   [
    56.72,
    1
   ]
  ]
 }
};
