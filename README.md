# BPQ — coquille PWA (iOS)

Mince page « coquille » qui charge l'application **BPQ Planification** (webapp Google Apps Script)
dans une iframe plein écran, pour permettre une installation « Ajouter à l'écran d'accueil »
propre sur iPhone :

- **barre de statut noire** (`theme-color` / `apple-mobile-web-app-status-bar-style`) — corrige la
  bande blanche visible dans la zone de la Dynamic Island quand l'app Apps Script est ouverte
  directement (l'enveloppe Google est blanche et non modifiable de l'intérieur) ;
- **icône BPQ** sur l'écran d'accueil (au lieu d'une capture d'écran) ;
- **plein écran standalone**.

Ce dépôt ne contient **aucun code applicatif ni secret** : uniquement la coquille (iframe vers
l'URL `/exec` publique) et les icônes. Le vrai code vit dans le dépôt privé `bpq-planification`.

Hébergé via **GitHub Pages**.
