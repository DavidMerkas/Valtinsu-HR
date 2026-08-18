/* ==========================================================================
   provjeri.js - brza kontrola prije uploada
   Pokretanje:  node scripts/provjeri.js
   Izlazni kod 1 ako ima gresaka, pa se moze zakaciti na CI ako zatreba.
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    // Mape s podvlakom (_dokumenti i slicno) ne idu na server, pa se ni ne provjeravaju.
    if (e.name === '.claude' || e.name === 'scripts' || e.name === 'node_modules') continue;
    if (e.isDirectory() && e.name.startsWith('_')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
let problema = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const dir = path.dirname(file);

  // Komentari se ne racunaju - u njima su primjeri i jos nepostojece datoteke.
  const html = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');

  const nalazi = [];

  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) nalazi.push(`h1 = ${h1}, mora biti tocno 1`);

  if (!/<html lang="hr">/.test(html)) nalazi.push('nedostaje lang="hr"');

  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  if (!title) nalazi.push('nema <title>');
  else if (title.length > 60) nalazi.push(`title ${title.length} znakova, preko 60`);

  const desc = (html.match(/name="description" content="([^"]*)"/) || [])[1] || '';
  if (!desc) nalazi.push('nema meta description');
  else if (desc.length < 120 || desc.length > 160) {
    nalazi.push(`description ${desc.length} znakova, izvan raspona 120-160`);
  }

  const canon = (html.match(/rel="canonical" href="([^"]*)"/) || [])[1] || '';
  if (!canon) nalazi.push('nema canonical');
  else if (!canon.startsWith('http')) nalazi.push('canonical nije apsolutan URL');

  if (/name="keywords"/.test(html)) nalazi.push('ima meta keywords - Google ih ignorira od 2009.');

  // Duga crtica se ne koristi na ovoj stranici.
  // Pisana kao escape da je nema ni u ovoj datoteci.
  const crtice = (html.match(/\u2014/g) || []).length;
  if (crtice) nalazi.push(`${crtice}x duga crtica, zamijeniti zarezom ili tockom`);

  // Broj modela se ne upisuje u tekst. Ponuda raste, tekst ostaje isti
  // i stranica pocne lagati na vise mjesta odjednom.
  const brojevi = /\b(jedan|jedna|dva|dvije|tri|cetiri|četiri|pet|sest|šest)\s+(model|modela|motocikl|motocikla|verzij\w+)\b/gi;
  for (const m of html.match(brojevi) || []) {
    nalazi.push(`brojcana tvrdnja u tekstu: "${m}" - napisati bez broja`);
  }

  // Slike moraju imati alt kad se ubace prave fotografije
  for (const img of html.match(/<img\b[^>]*>/g) || []) {
    if (!/\balt=/.test(img)) nalazi.push(`<img> bez alt atributa: ${img.slice(0, 60)}…`);
  }

  // Relativne poveznice moraju pokazivati na postojecu datoteku
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (/^(https?:|mailto:|tel:|#|data:)/.test(raw)) continue;
    const meta = raw.split('#')[0].split('?')[0];
    if (!meta) continue;
    if (!fs.existsSync(path.resolve(dir, meta))) nalazi.push(`pukla poveznica -> ${raw}`);
  }

  if (nalazi.length) {
    problema += nalazi.length;
    console.log(`\n${rel}`);
    for (const n of nalazi) console.log(`   ${n}`);
  }
}

// Privremene slike za sprdnju. Ne ruse provjeru, ali moraju se vidjeti
// svaki put, da ne odu na server zajedno sa svime ostalim.
for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  // Bez komentara i bez razmaka u putanji, inace navodnici uhvate pola datoteke.
  const html = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  for (const m of html.matchAll(/"([^"\s]*PRIVREMENO[^"\s]*)"/g)) {
    const ima = fs.existsSync(path.resolve(ROOT, m[1]));
    console.log(`\nUPOZORENJE  ${rel}`);
    console.log(`   privremena slika: ${m[1]}${ima ? '' : '  (datoteka jos ne postoji)'}`);
    console.log('   maknuti prije uploada');
  }
}

if (problema === 0) {
  console.log(`\nSve cisto - provjereno ${files.length} stranica.\n`);
} else {
  console.log(`\n=== ukupno problema: ${problema} ===\n`);
  process.exit(1);
}
