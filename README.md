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

## Quel déploiement cette coquille sert — à revérifier à chaque bascule

L'iframe d'`index.html` vise **un ID de déploiement Apps Script**, et cet ID ne suit
ni `git` ni `clasp` : il est écrit en dur ici, dans un dépôt **séparé** de
`bpq-planification`. Aucun hook, aucun `pre-push`, aucun `clasp deploy` ne le vérifie.

| | valeur |
|---|---|
| déploiement visé — **EN SERVICE** (`app.bpq.ca`) | `AKfycbxOsJhObow…PdEh` |
| ancien projet — **ne plus viser** | `AKfycbzew2Pylre…QEoXMqh` |

La table qui fait autorité est dans `bpq-planification/CLAUDE.md`
§ « IL Y A DEUX PROJETS », et l'appariement projet/compte/déploiement dans
`bpq-planification/hooks/clasp-cible.ps1`.

**Ce que l'oubli a coûté**, constaté le 2026-08-21, le lendemain de la bascule du
2026-08-20 : la coquille servait encore l'ancienne app (bandeau rouge), donc plus
personne ne l'installait, donc l'iPhone retrouvait sa barre blanche et l'iPad n'avait
plus ni logo ni plein écran. Et le poste kiosque de la tablette ne pouvait plus
s'installer du tout — le jeton du kiosque vit dans le `localStorage` de CETTE page,
seul document de première partie (voir le gestionnaire `kiosk-get` plus bas dans
`index.html`, et le bloc « Où vit le jeton du poste » dans `Assignation.html`).
La coquille n'est donc pas cosmétique : le kiosque en dépend.

**Contrôle en une commande**, depuis n'importe où :

```bash
curl -s https://jeanphilippelavoie16-png.github.io/bpq-app/ | grep -o 'AKfycb[A-Za-z0-9_-]*'
```

La deuxième chaîne rendue (celle de l'attribut `src`) doit être celle du déploiement
EN SERVICE ; la première n'est que la mention de l'ancien dans le commentaire.
