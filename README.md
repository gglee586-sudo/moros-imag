# Moro.iMac — version web (mobile)

Application web mobile-first pour trier, organiser et retrouver ses photos, vidéos et PDF.
Construite avec TanStack Start (React 19 + Vite + Tailwind CSS v4). Toutes les données sont
stockées localement sur l'appareil (IndexedDB) : aucun compte, aucun serveur, aucun envoi sur
Internet.

## Fonctionnalités

- Dossiers personnalisables (couverture, couleur, icône), séparés en deux modes :
  - **Photos** (bleu) : accueil, trieur `/sort`, galerie, favoris, recherche
  - **Documents** (bleu-vert) : bibliothèque `/docs`, trieur `/sort-docs` (PDF, Word, Excel, PowerPoint, EPUB)
- Tri rapide : un fichier à la fois, boutons de dossiers, passer / annuler / supprimer
- Déplacement ou copie (réglable), historique d'annulation
- Corbeille : restauration ou suppression définitive
- Annotations : texte + dessin superposés, la photo originale reste intacte
- Favoris, recherche globale, tags et notes
- Réglages : thème, partage, gestes, tri indépendant par mode
- Fonctionne comme PWA sur téléphone

## Lancer le projet

```sh
npm install
npm run dev      # serveur de développement
npm run build    # build de production
```

## Structure

- `src/routes/` — pages (accueil, tri photos, tri documents, bibliothèque documents, dossiers, favoris, recherche, corbeille, réglages)
- `src/components/moro/` — composants de l'application
- `src/lib/moro-db.ts` — base de données locale (IndexedDB)
- `src/lib/moro-media.ts` — détection des types de fichiers, miniatures
- `src/styles.css` — thème et couleurs (bleu photos / bleu-vert documents)

## Remarque

Ce projet utilise le plugin `@lovable.dev/vite-tanstack-config`. Sur une autre plateforme,
si le build pose problème, ce paquet peut être remplacé par la configuration Vite standard
de TanStack Start.
