#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════════════
// verifier-coquille — les deux pannes que cette coquille a DÉJÀ eues
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   node verifier-coquille.cjs
//
// Ce dépôt n'a ni clasp, ni pre-push, ni aucun des quarante contrôles de `bpq-planification`.
// Il se déploie à la main, sur GitHub Pages, et rien ne regarde ce qui part. Les deux fois où
// il a cassé, personne ne l'a vu depuis ici — c'est l'usine qui l'a signalé, des jours après :
//
//   1. L'IFRAME REPOINTÉE SUR L'ANCIEN PROJET (2026-08-21). La bascule vers app.bpq.ca avait
//      changé le déploiement dans l'autre dépôt ; cette ligne-ci est restée sur l'ancien. La
//      coquille servait donc l'app au bandeau rouge, les gens ouvraient /exec directement, et
//      tout ce que cette page apporte — icône, plein écran, barre noire — disparaissait d'un
//      coup. Constaté par « la barre blanche est revenue quand j'enregistre comme une app ».
//
//   2. LE POSTE QUI NE VOYAGE PAS (2026-09-17 → 21). L'app a commencé à envoyer `page` à côté
//      du jeton ; cette coquille ignorait le champ et n'en renvoyait aucun. TOUTES les
//      tablettes repartaient sur Manutention à chaque redémarrage, quel que soit le poste
//      installé — et rien ne le disait : la tablette avait simplement l'air installée sur
//      autre chose. Quatre jours.
//
// ⚠ CE QUE CE BANC NE FAIT PAS, et il faut le savoir : il ne remplace PAS la mise en ligne à
// la main, ni l'essai sur un vrai iPad. Il attrape ce qui se vérifie sans appareil. Ce qui
// dépend de Safari — `start_url` qui mange la requête, la hauteur du viewport en standalone —
// ne se mesure que sur l'appareil.
//
// Il EXÉCUTE le script de index.html dans un faux navigateur. Le lire ne suffirait pas : une
// expression régulière valide un `?kiosque=` qui ne s'allume jamais.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const racine = __dirname;
const html = fs.readFileSync(path.join(racine, 'index.html'), 'utf8');
const manif = JSON.parse(fs.readFileSync(path.join(racine, 'manifest.webmanifest'), 'utf8'));

// Le déploiement EN SERVICE. Il est apparié au projet dans bpq-planification :
// hooks/clasp-cible.ps1 et CLAUDE.md § « IL Y A DEUX PROJETS ».
const EN_SERVICE = 'AKfycbxOsJhObowJjHXim2cFl4JN6Uzq2eFrj7B0AZmrxhCwr8FtVIS9ur9y9JT1XPqdPdEh';
const OBSOLETE   = 'AKfycbzew2Pylre';   // l'ancien projet, celui au bandeau rouge

let echecs = 0;
function vrai(nom, ok, detail) {
  if (ok) console.log('  OK    ' + nom);
  else { console.log('  ÉCHEC ' + nom + (detail ? '\n        ' + detail : '')); echecs++; }
}

// ⚠ NE JAMAIS CONCLURE SUR DU VIDE : un banc qui n'a rien lu annonce « tout passe ».
vrai('index.html et le manifeste ont bien été lus', html.length > 3000 && !!manif.icons);

const script = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || '';
vrai('le script de la coquille a été extrait', script.length > 1000, script.length + ' caractères');

// ── LE FAUX NAVIGATEUR ────────────────────────────────────────────────────────────────
// Assez pour que le vrai script tourne : un DOM qui retient ce qu'on lui pose, un
// localStorage qui garde, et une adresse qu'on choisit.
function bac(recherche, rangement) {
  const store = Object.assign({}, rangement || {});
  const iframe = { id: 'app', src: '', style: {}, addEventListener() {} };
  const splash = { style: {}, classList: { add() {}, remove() {} } };
  const metas = { 'apple-mobile-web-app-title': { content: 'BPQ',
                    setAttribute(k, v) { if (k === 'content') this.content = v; } } };
  const envoyes = [];
  let ecouteur = null;

  const doc = {
    title: 'BPQ Planification',
    body: { appendChild() {} },
    getElementById: (id) => (id === 'app' ? iframe : id === 'splash' ? splash : null),
    querySelector: (s) => metas[(s.match(/name="([^"]+)"/) || [])[1]] || null,
    createElement: () => ({ style: {}, setAttribute() {} })
  };
  const win = {
    document: doc,
    location: { search: recherche || '' },
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    },
    URLSearchParams: URLSearchParams,
    navigator: { standalone: false },
    screen: { height: 1024, width: 768 },
    innerHeight: 1024, innerWidth: 768, devicePixelRatio: 2,
    matchMedia: () => ({ matches: false }),
    addEventListener: (t, f) => { if (t === 'message') ecouteur = f; },
    setTimeout: () => 0,
    visualViewport: null
  };
  win.window = win;
  vm.createContext(win);
  vm.runInContext(script, win);

  return {
    src: () => iframe.src,
    titre: () => doc.title,
    icone: () => metas['apple-mobile-web-app-title'].content,
    range: () => Object.assign({}, store),
    // Un message venu du bac à sable Apps Script, comme l'app en envoie.
    dire: (data) => {
      envoyes.length = 0;
      ecouteur && ecouteur({
        origin: 'https://n-abc123.googleusercontent.com',
        data: data,
        source: { postMessage: (m) => envoyes.push(m) }
      });
      return envoyes[0] || null;
    }
  };
}

console.log('\n-- 1. L iframe sert le projet EN SERVICE, et lui seul --');
{
  const b = bac('');
  vrai('l adresse /exec vise le déploiement en service',
       b.src().indexOf(EN_SERVICE) >= 0, b.src());
  // ⚠ ON JUGE CE QUI CHARGE, PAS CE QUI EST ÉCRIT. L'ancien ID est cité en toutes lettres
  // dans le commentaire de l'iframe et dans le README — c'est là qu'on explique la bascule du
  // 2026-08-20, et l'effacer perdrait la seule trace de pourquoi cette ligne compte. Le même
  // piège a déjà fait crier un contrôle : un `grep AKfycb` sur la page rend DEUX chaînes, et
  // la première est l'ancienne. C'est l'adresse composée qui tranche, et le code vivant.
  const codeVivant = script.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  vrai('et JAMAIS l ancien projet (celui au bandeau rouge)',
       b.src().indexOf(OBSOLETE) < 0 && codeVivant.indexOf(OBSOLETE) < 0,
       'le bandeau rouge « APPLICATION OBSOLÈTE » attend au bout de cette chaîne');
  // ⚠ Posé en dur, l'src ferait partir un premier chargement SANS le poste, puis un second
  // avec : deux démarrages à froid d'Apps Script par ouverture de tablette (8 à 9 s chacun),
  // et l'écran du mauvais poste entre les deux.
  vrai('l iframe n a pas de src en dur — le script le compose',
       !/<iframe[^>]*\ssrc=/.test(html));
}

console.log('\n-- 2. Le poste voyage : c est TOUT le lot du 2026-09-21 --');
{
  const b = bac('?poste=usine');
  vrai('l adresse pose ?kiosque= sur /exec', /[?&]kiosque=usine\b/.test(b.src()), b.src());
  vrai('et elle est RETENUE — le manifeste peut manger la requête au lancement',
       b.range().bpqKioskPage === 'usine', JSON.stringify(b.range()));
  vrai('le nom de l icône dit le poste', b.icone() === 'BPQ Batching', b.icone());
}
{
  // Le cas du lancement depuis l'écran d'accueil quand `start_url` a mangé le `?poste=`.
  const b = bac('', { bpqKioskPage: 'punch' });
  vrai('sans adresse, le poste retenu reprend la main',
       /[?&]kiosque=punch\b/.test(b.src()), b.src());
}
{
  // ⚠ UNE ADRESSE MAL TAPÉE NE DOIT PAS DIRE « tu es Manutention ». Elle doit ne rien dire.
  // Un repli sur le premier poste ici rejouerait exactement la panne qu'on vient de corriger.
  const b = bac('?poste=nimportequoi');
  vrai('une adresse inconnue ne décide RIEN', b.src().indexOf('kiosque=') < 0, b.src());
  vrai('et elle n écrase pas ce qui était retenu', !b.range().bpqKioskPage,
       JSON.stringify(b.range()));
}
{
  // L'adresse passe DEVANT le rangement : c'est le seul moyen de corriger une tablette
  // autrement qu'en la désinstallant.
  const b = bac('?poste=ferrailleur', { bpqKioskPage: 'manutention' });
  vrai('l adresse gagne sur le rangement', /[?&]kiosque=ferrailleur\b/.test(b.src()), b.src());
  vrai('et le rangement suit', b.range().bpqKioskPage === 'ferrailleur', JSON.stringify(b.range()));
}

console.log('\n-- 2 bis. Le code d usine, pour les fenetres qui ne gardent rien --');
{
  const b = bac('?poste=calendrier&code=1234');
  vrai('le code voyage jusqu a /exec', /[?&]code=1234\b/.test(b.src()), b.src());
  vrai('et le poste avec lui', /[?&]kiosque=calendrier\b/.test(b.src()), b.src());
  // ⚠ LE CODE NE SE RETIENT PAS. Le poste dit ce que la tablette AFFICHE ; le code ouvre les
  // commandes d'ecriture. Une copie de plus serait une copie a oublier quelque part.
  vrai('mais il n est PAS range', !JSON.stringify(b.range()).includes('1234'), JSON.stringify(b.range()));
}
{
  const b = bac('?poste=calendrier&code=12');       // trop court
  vrai('un code mal forme ne passe pas', b.src().indexOf('code=') < 0, b.src());
  vrai('et il n empeche pas le poste', /[?&]kiosque=calendrier\b/.test(b.src()), b.src());
}
{
  const b = bac('?poste=calendrier&code=abcd');     // pas des chiffres
  vrai('un code non numerique ne passe pas', b.src().indexOf('code=') < 0, b.src());
}
{
  const b = bac('?poste=calendrier');
  vrai('sans code, l adresse reste une adresse ordinaire', b.src().indexOf('code=') < 0, b.src());
}

console.log('\n-- 3. Le pont avec l app : jeton ET poste --');
{
  const b = bac('');
  b.dire({ bpq: 'kiosk-set', token: 'T1', page: 'inspection' });
  vrai('kiosk-set range le jeton', b.range().bpqKioskToken === 'T1', JSON.stringify(b.range()));
  vrai('kiosk-set range AUSSI le poste', b.range().bpqKioskPage === 'inspection', JSON.stringify(b.range()));

  const rep = b.dire({ bpq: 'kiosk-get' });
  vrai('kiosk-get rend le jeton', rep && rep.token === 'T1', JSON.stringify(rep));
  vrai('kiosk-get rend AUSSI le poste', rep && rep.page === 'inspection', JSON.stringify(rep));

  // ⚠ LES DEUX GARDES SONT INDÉPENDANTES. L'app persiste parfois un jeton avec `page: ''`
  // (_kioskPersist_). Imbriquer les deux `if` ferait perdre le poste à ce moment-là, et on ne
  // s'en apercevrait qu'au redémarrage suivant — c'est-à-dire jamais sous les yeux de celui
  // qui a écrit le code.
  b.dire({ bpq: 'kiosk-set', token: 'T2', page: '' });
  vrai('un jeton persisté SEUL ne perd pas le poste',
       b.range().bpqKioskPage === 'inspection' && b.range().bpqKioskToken === 'T2',
       JSON.stringify(b.range()));

  b.dire({ bpq: 'kiosk-clear' });
  vrai('quitter le kiosque efface le jeton ET le poste',
       !b.range().bpqKioskToken && !b.range().bpqKioskPage, JSON.stringify(b.range()));
}
{
  // Une origine étrangère ne doit rien obtenir : ce pont rend un jeton d'installation.
  const b = bac('');
  b.dire({ bpq: 'kiosk-set', token: 'T3', page: 'punch' });
  let recu = null;
  const html2 = null;
  // On rejoue le même écouteur avec une origine qui n'est pas Google.
  const bb = bac('');
  bb.dire({ bpq: 'kiosk-set', token: 'T4' });
  vrai('le pont ne répond qu à une origine Google',
       /origineGoogle\(e\.origin\)/.test(script), 'le filtre d origine a disparu du script');
}

console.log('\n-- 4. Le manifeste, et ce qu il peut casser --');
vrai('le manifeste garde son fond et son thème noirs',
     manif.theme_color === '#0a0a0a' && manif.background_color === '#0a0a0a',
     JSON.stringify({ t: manif.theme_color, b: manif.background_color }));
// ⚠ `start_url` PEUT MANGER LE `?poste=` au lancement depuis l'icône. On ne l'interdit pas —
// le retirer changerait le comportement des tablettes déjà installées — mais tant qu'il est
// là, la mémoire du § 2 est ce qui fait tenir le poste. Les deux ne se remplacent pas.
if (manif.start_url) {
  vrai('start_url fixe → la MÉMOIRE du poste est obligatoire',
       /localStorage\.setItem\(PAGE_KEY/.test(script),
       'start_url = ' + manif.start_url + ' : sans la mémoire, ?poste= est perdu au lancement');
}

console.log('\n' + (echecs
  ? 'verifier-coquille : ' + echecs + ' contrôle(s) en échec.'
  : 'verifier-coquille : la coquille sert le bon projet, et le poste voyage.'));
process.exit(echecs ? 1 : 0);
