// Adds the cars from new-cars.json into seed-cars.json (skips cars that are already there).
// Run:  npm run add
const fs = require('fs');
const path = require('path');
const SEED = path.join(__dirname, 'seed-cars.json');
const NEW = path.join(__dirname, 'new-cars.json');

function load(file) {
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch { console.error(`Cannot find ${path.basename(file)} in this folder.`); process.exit(1); }
  if (!text.trim()) { console.error(`${path.basename(file)} is EMPTY. Paste the cars into it and press Ctrl+S to save.`); process.exit(1); }
  try { return JSON.parse(text); } catch (e) { console.error(`${path.basename(file)} has a typing mistake (${e.message}). Check commas and brackets.`); process.exit(1); }
}
const seed = load(SEED);
const extra = load(NEW);
const have = new Set(seed.map(s => s.title.toLowerCase()));

let added = 0;
for (const c of extra) {
  if (!c.title || have.has(c.title.toLowerCase())) { console.log('Skipped (already there):', c.title); continue; }
  seed.push(c); have.add(c.title.toLowerCase()); added++;
}
seed.sort((a, b) => a.from - b.from || a.title.localeCompare(b.title));
fs.writeFileSync(SEED, '[\n' + seed.map(s => '  ' + JSON.stringify(s)).join(',\n') + '\n]\n');
console.log(`Added ${added} cars. seed-cars.json now has ${seed.length} cars.`);
console.log('Next: npm run fetch');