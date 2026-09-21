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

## ⛔ Chaque kiosque a SON adresse — `?poste=<id>`

Demande du 2026-09-21 : « je veux que chaque kiosque s'installe manuellement chacun, pas
"installer en mode kiosque" — ça règle beaucoup de problèmes de relogin et tout. Comme ça
**chaque kiosque est autonome**. »

**Sur la tablette, une fois :**

1. ouvrir `https://jeanphilippelavoie16-png.github.io/bpq-app/?poste=<id>` dans Safari ;
2. Partager → **Ajouter à l'écran d'accueil** — l'icône s'appelle « BPQ Batching », « BPQ Punch »… ;
3. ouvrir l'icône, toucher **« Installer cette tablette sur le poste … »**, taper le code d'usine.

| poste | `?poste=` |
|---|---|
| Manutention | `manutention` |
| Production | `production` |
| Ferraillage | `ferrailleur` |
| Inspection | `inspection` |
| Punch | `punch` |
| CNC | `cnckiosque` |
| Batching | `usine` |
| Superviseur (TV) | `calendrier` |

Cette page passe le poste à l'app (`/exec?kiosque=<id>`), nomme l'icône, et réécrit le
manifeste pour Chrome — iOS, lui, retient l'URL courante tout seul.

**Pourquoi l'adresse et pas une mémoire.** Le poste vivait dans le `localStorage` de cette
page (`bpqKioskPage`). Ça marche — mais un nettoyage de Safari le perd, et surtout : cette
moitié-là **n'a jamais été livrée**. L'app envoyait le poste depuis le 2026-09-17 ; cette page
est restée au commit du 2026-08-21, elle l'ignorait et n'en renvoyait aucun. Résultat :
**toutes les tablettes repartaient sur Manutention à chaque redémarrage**, quel que soit le
poste installé, pendant quatre jours, sans un message. L'adresse du document de premier
niveau, elle, traverse un redémarrage, une coupure de courant et un nettoyage.

Le rangement reste, en second : les tablettes déjà installées sans adresse continuent de
marcher.

⚠ **Le poste n'ouvre aucune porte.** Il dit ce que la tablette AFFICHE. C'est le jeton,
vérifié côté serveur, qui décide de ce qu'elle a le droit de faire — une adresse fabriquée à
la main ne donne rien de plus qu'une adresse.

## Le banc — `node verifier-coquille.cjs`

Ce dépôt n'a ni `clasp`, ni `pre-push`, ni aucun des contrôles de `bpq-planification` : un
push là-bas ne touche jamais cette page, et un oubli ici ne se signale nulle part. **Deux
pannes l'ont déjà montré** — l'iframe restée sur l'ancien projet (2026-08-21) et le poste qui
ne voyageait pas (2026-09-17).

```bash
node verifier-coquille.cjs
```

Il exécute le vrai script de la page dans un faux navigateur : le déploiement visé, le poste
qui descend jusqu'à l'app, le nom de l'icône, et les quatre promesses du rangement (garder,
rendre, ne pas effacer sur une page vide, ignorer une autre origine). **À lancer avant chaque
push ici.**

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
