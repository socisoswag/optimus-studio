# Démos sectorielles

Trois sites vitrines complets, qui servent à deux choses à la fois :
le portfolio d'Optimus Studio, et le gabarit à cloner pour chaque prospect.

| Dossier | Secteur | Direction artistique |
|---|---|---|
| `maison-verrier/` | Restaurant | Sombre. Forêt, os, ambre. Rayon 2 px. Outfit + Newsreader |
| `barbier-lacroix/` | Barbier | Clair. Monochrome froid, bleu électrique. Angles vifs. Archivo + Karla |
| `plomberie-vasseur/` | Artisan | Clair. Papier froid, charcoal, orange de sécurité. Rayon 4 px. Barlow + Source Sans 3 |

Les trois divergent volontairement. Montrées côte à côte, trois démos qui se
ressemblent disent « template » ; trois qui divergent disent « studio ».

## Cloner pour un prospect

```bash
cp -r demos/barbier-lacroix demos/nom-du-prospect
```

Puis, dans cet ordre :

1. **Les deux images.** Elles sont marquées `REMPLACER` dans le HTML et pointent
   sur picsum.photos. Prenez les vraies photos du commerce sur sa fiche Google
   Business : c'est ce qui fait basculer la démo de « joli » à « c'est chez moi ».
2. **Le nom, l'adresse, le téléphone, les horaires.** Ils apparaissent dans le
   HTML et dans le bloc JSON-LD en tête de fichier. Le JSON-LD doit rester
   cohérent avec le contenu visible, sinon Google l'ignore.
3. **Les tarifs et les prestations.**
4. **Les avis.** Reprenez de vrais avis Google du commerce, avec le prénom et
   l'initiale. N'en inventez jamais : c'est le genre de détail qu'un gérant
   repère immédiatement, et vous perdez la vente.
5. **Le pied de page.** Retirez la mention « site de démonstration » une fois
   que le client a signé.

Comptez 40 minutes. Ensuite vous publiez sur
`demo.optimusstudio.fr/nom-du-prospect` et vous enregistrez 30 secondes
d'écran en scrollant : c'est cette vidéo qui s'envoie, pas le lien seul.

## Choix techniques communs

- CSS natif, aucune étape de compilation. Un dossier se déploie tel quel.
- Chaque démo est autonome : pas de fichier partagé entre les dossiers, pour
  qu'un `cp -r` suffise.
- Révélations au scroll par `IntersectionObserver`, jamais d'écouteur `scroll`.
  La démo plomberie n'en a aucune : sur un site d'artisan, tout doit rester
  lisible à l'arrêt.
- `prefers-reduced-motion` respecté partout.
- Les formulaires ne sont pas branchés. En production, ajoutez
  `data-netlify="true"` sur le `<form>` et retirez la simulation dans `app.js`.
