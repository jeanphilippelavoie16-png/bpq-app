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

## L'adresse dit le poste — 2026-09-21

Chaque kiosque a **son** adresse. On l'ouvre dans Safari, on l'ajoute à l'écran d'accueil
(l'icône s'appelle « BPQ Batching », « BPQ Punch »…), on ouvre l'icône, et on tape le code
d'usine. Le poste ne se choisit plus : l'adresse l'a déjà dit.

| poste | adresse |
|---|---|
| Manutention | `…/bpq-app/?poste=manutention` |
| Production | `…/bpq-app/?poste=production` |
| Ferraillage | `…/bpq-app/?poste=ferrailleur` |
| Inspection | `…/bpq-app/?poste=inspection` |
| Punch | `…/bpq-app/?poste=punch` |
| CNC | `…/bpq-app/?poste=cnckiosque` |
| **Batching** | `…/bpq-app/?poste=usine` |
| **Superviseur (TV)** | `…/bpq-app/?poste=calendrier` |

⚠ Deux ids ne portent pas le nom qu'on dirait : Batching est `usine`, la TV est `calendrier`.
Ce sont ceux de `KIOSK_POSTES` dans `bpq-planification` — les renommer ici ne renommerait rien
là-bas, ça ne ferait que rendre l'adresse muette.

**Pourquoi l'adresse et pas seulement un rangement.** Le poste vivait déjà dans le
`localStorage` de cette coquille depuis le 2026-09-17 (`bpqKioskPage`) — sauf que ce dépôt-ci
n'a jamais reçu sa moitié du lot. Il ignorait le champ que l'app lui envoyait et n'en renvoyait
aucun : **toutes les tablettes repartaient sur Manutention à chaque redémarrage**, quel que soit
le poste installé, et rien ne le disait. Quatre jours. L'adresse, elle, survit à un redémarrage,
à une coupure de courant et à un nettoyage de Safari.

⚠ **`start_url` du manifeste peut manger la requête** au lancement depuis l'icône. La coquille
RETIENT donc ce que l'adresse a dit et le relit quand elle se tait. Les deux ne se remplacent
pas : si tu retires la mémoire, vérifie d'abord sur un vrai iPad que `?poste=` survit au
lancement — ça ne se mesure pas d'ici.

## Le banc

```bash
node verifier-coquille.cjs
```

Il exécute le script de `index.html` dans un faux navigateur et refuse les **deux pannes que
cette coquille a déjà eues** : l'iframe repointée sur l'ancien projet, et le poste qui ne
voyage pas. Éprouvé en sabotant les deux, plus l'adresse inconnue qui retomberait sur
Manutention.

Il ne remplace pas l'essai sur un iPad : ce qui dépend de Safari — `start_url`, la hauteur du
viewport en standalone — ne se mesure que sur l'appareil.
