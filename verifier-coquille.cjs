#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════════════
// verifier-coquille — CE DÉPÔT N'A AUCUN FILET, ET ÇA A COÛTÉ CHER
// ═══════════════════════════════════════════════════════════════════════════════════════
//
//   node verifier-coquille.cjs
//
// Pas de clasp, pas de pre-push, aucun des contrôles de `bpq-planification` : un `git push`
// là-bas ne touche jamais cette page, et un oubli ici ne se signale nulle part. Deux pannes
// l'ont déjà montré :
//
//   · 2026-08-21 — l'iframe visait encore le déploiement de l'ANCIEN projet. La coquille
//     servait l'app au bandeau rouge, alors les gens ouvraient /exec directement, et tout ce
//     que cette page apporte (icône, plein écran, barre noire, jeton) disparaissait d'un coup.
//   · 2026-09-17 — l'app s'est mise à envoyer le POSTE avec le jeton. Cette page ne l'a
//     jamais reçu : restée au commit du 2026-08-21, elle ignorait le champ et n'en renvoyait
//     aucun. Toutes les tablettes repartaient donc sur Manutention à chaque redémarrage,
//     quel que soit le poste installé. Quatre jours, sans un message.
//
// Ce script EXÉCUTE le vrai script de la page dans un faux navigateur, et vérifie ce que les
// deux dépôts se promettent. Il ne remplace pas un essai sur l'iPad ; il attrape ce qui se
// vérifie sans appareil.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
let echecs = 0;
const dire = (n, ok, d) => {
  if (ok) console.log('  ok    ' + n);
  else { console.log('  ECHEC ' + n + (d !== undefined ? ' — ' + d : '')); echecs++; }
};

// ── 1. LE DÉPLOIEMENT VISÉ ──────────────────────────────────────────────────────────────
// C'est le contrôle que CLAUDE.md (bpq-planification) fait lire à la main après chaque
// `clasp deploy`. On le refait ici sur le fichier, pour qu'il rate AVANT la mise en ligne.
console.log('\n-- Le deploiement que cette coquille sert --');
const EN_SERVICE = 'AKfycbxOsJhObowJjHXim2cFl4JN6Uzq2eFrj7B0AZmrxhCwr8FtVIS9ur9y9JT1XPqdPdEh';
const OBSOLETE = 'AKfycbzew2Pylre';
const srcAttr = (html.match(/src="([^"]*AKfycb[^"]*)"/) || [])[1] || '';
dire('l iframe porte un src avec un ID de deploiement', !!srcAttr,
     'le controle de CLAUDE.md lit `src="…AKfycb…"` : sans cet attribut il repond « rien », ce qui se lit comme « coquille perimee »');
dire('…et c est le projet EN SERVICE', srcAttr.indexOf(EN_SERVICE) >= 0, srcAttr);
dire('…pas l ancien', srcAttr.indexOf(OBSOLETE) < 0, srcAttr);

// ── LE FAUX NAVIGATEUR ──────────────────────────────────────────────────────────────────
// Assez pour exécuter le script de la page, et rien de plus : ce qu'on mesure est ce qu'elle
// fait de l'adresse et des messages, pas sa mise en page.
function bac(recherche) {
  const rangement = {};
  const messages = [];          // ce que la page répond à l'app
  const ecouteurs = [];
  const metas = {};
  const iframe = { _src: (html.match(/src="([^"]*AKfycb[^"]*)"/) || [])[1] || '',
    get src() { return this._src; }, set src(v) { this._src = v; },
    getAttribute(n) { return n === 'src' ? this._src : null; },
    setAttribute() {}, addEventListener() {}, style: {}, classList: { add() {}, remove() {} } };
  const splash = { classList: { add() {}, remove() {} }, style: {} };
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    document: {
      title: 'BPQ',
      getElementById(id) {
        if (id === 'app') return iframe;
        if (id === 'splash') return splash;
        if (id === 'titreIcone') return { setAttribute(n, v) { metas.titre = v; } };
        return null;
      },
      querySelector(sel) { return sel.indexOf('manifest') >= 0 ? { href: '' } : null; },
      createElement() { return { style: { cssText: '' }, textContent: '' }; },
      body: { appendChild() {} }, addEventListener() {}
    },
    localStorage: {
      getItem(k) { return rangement[k] === undefined ? null : rangement[k]; },
      setItem(k, v) { rangement[k] = String(v); },
      removeItem(k) { delete rangement[k]; }
    },
    location: { search: recherche || '' },
    navigator: { standalone: false },
    matchMedia: () => ({ matches: false }),
    screen: { width: 1024, height: 1366 }, innerWidth: 1024, innerHeight: 1366,
    visualViewport: null,
    setTimeout: () => 1, clearTimeout() {},
    fetch: () => Promise.reject(new Error('pas de reseau au banc')),
    URL: { createObjectURL: () => 'blob:x' }, Blob: function () {}
  };
  sb.window = sb; sb.self = sb;
  sb.addEventListener = (t, fn) => { if (t === 'message') ecouteurs.push(fn); };
  vm.createContext(sb);
  const src = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1];
  if (!src) { console.log('  ECHEC le script de la page est introuvable'); process.exit(1); }
  vm.runInContext(src, sb, { filename: 'coquille.js' });
  return {
    iframe, metas, rangement, messages,
    // L'app parle depuis le bac à sable d'Apps Script : c'est l'ORIGINE qui est filtrée.
    dire(data, origine) {
      ecouteurs.slice().forEach(function (fn) {
        fn({ data: data, origin: origine || 'https://n-abc.googleusercontent.com',
             source: { postMessage(m) { messages.push(m); } } });
      });
    }
  };
}

// ── 2. L'ADRESSE DU POSTE ───────────────────────────────────────────────────────────────
console.log('\n-- `?poste=` : chaque kiosque a son adresse --');
{
  const b = bac('?poste=usine');
  dire('le poste part vers l app dans SON url', /[?&]kiosque=usine\b/.test(b.iframe.src), b.iframe.src);
  dire('…et le deploiement reste le meme', b.iframe.src.indexOf(EN_SERVICE) >= 0, b.iframe.src);
  dire('l icone porte le nom du poste', b.metas.titre === 'BPQ Batching', b.metas.titre);
}
{
  const b = bac('');
  dire('sans adresse, l url de l app ne change pas', b.iframe.src.indexOf('kiosque=') < 0, b.iframe.src);
  dire('…et l icone reste « BPQ »', b.metas.titre === undefined, b.metas.titre);
}
{
  // Un id que la coquille ne connaît pas : elle le PASSE quand même. C'est l'app qui valide
  // (KIOSK_POSTES), et deux validations finiraient par ne plus dire la même chose.
  const b = bac('?poste=quelque-chose');
  dire('un poste inconnu passe quand meme a l app', /[?&]kiosque=quelque-chose\b/.test(b.iframe.src), b.iframe.src);
  dire('…sans renommer l icone', b.metas.titre === undefined, b.metas.titre);
}

// ── 3. LE RANGEMENT : LE POSTE VOYAGE AVEC LE JETON ─────────────────────────────────────
// ⛔ LA PANNE DU 2026-09-17, ET C'EST ELLE QUE CE BLOC EXISTE POUR EMPÊCHER DE REVENIR.
console.log('\n-- `page` : le poste se garde et se rend --');
{
  const b = bac('');
  b.dire({ bpq: 'kiosk-set', token: 'T', page: 'punch' });
  dire('le jeton est garde', b.rangement.bpqKioskToken === 'T');
  dire('ET le poste', b.rangement.bpqKioskPage === 'punch', JSON.stringify(b.rangement));
  b.dire({ bpq: 'kiosk-get' });
  const rep = b.messages[b.messages.length - 1] || {};
  dire('la reponse rend le jeton', rep.token === 'T', JSON.stringify(rep));
  dire('ET le poste', rep.page === 'punch', JSON.stringify(rep));
}
{
  const b = bac('');
  b.dire({ bpq: 'kiosk-set', token: 'T', page: 'usine' });
  // `page` vide ne doit RIEN effacer : l'app persiste parfois le jeton seul, et le poste
  // survivrait mal à un effacement silencieux. Les deux moitiés promettent la même chose.
  b.dire({ bpq: 'kiosk-set', token: 'T2', page: '' });
  dire('un jeton seul n efface pas le poste', b.rangement.bpqKioskPage === 'usine', JSON.stringify(b.rangement));
  dire('…et le jeton, lui, a bien change', b.rangement.bpqKioskToken === 'T2');
}
{
  const b = bac('');
  b.dire({ bpq: 'kiosk-set', token: 'T', page: 'punch' });
  b.dire({ bpq: 'kiosk-clear' });
  dire('quitter le kiosque efface le jeton', b.rangement.bpqKioskToken === undefined);
  dire('ET le poste', b.rangement.bpqKioskPage === undefined, JSON.stringify(b.rangement));
}
{
  // L'origine est le SEUL filtre : le message vient du bac à sable interne
  // (googleusercontent.com), pas de l'iframe directe, donc on ne peut pas comparer la source.
  const b = bac('');
  b.dire({ bpq: 'kiosk-set', token: 'VOLE', page: 'punch' }, 'https://exemple-mechant.test');
  dire('une autre origine n ecrit rien', b.rangement.bpqKioskToken === undefined, JSON.stringify(b.rangement));
  b.dire({ bpq: 'kiosk-get' }, 'https://exemple-mechant.test');
  dire('…et n obtient rien', b.messages.length === 0, JSON.stringify(b.messages));
}

console.log('');
if (echecs) { console.log('verifier-coquille : ' + echecs + ' echec(s)\n'); process.exit(1); }
console.log('verifier-coquille : la coquille sert le bon projet, et le poste voyage.\n');
