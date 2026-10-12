// Builds a "dist" folder for free static hosting (Netlify, Cloudflare Pages, GitHub Pages).
// Run:  npm run build
const fs = require('fs');
const path = require('path');
const { buildData, OUT } = require('./fetch-wiki');

(async () => {
  let cars;
  try { cars = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch {}
  if (!cars) { console.log('No data yet, fetching from Wikipedia...'); cars = await buildData(); }

  const dist = path.join(__dirname, 'dist');
  fs.rmSync(dist, { recursive: true, force: true });
  fs.cpSync(path.join(__dirname, 'public'), dist, { recursive: true });
  fs.mkdirSync(path.join(dist, 'data'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'data', 'cars.json'), JSON.stringify(cars));
  console.log(`Done. ${cars.length} cars. Upload the "dist" folder to your host.`);
})().catch(e => { console.error('Build failed:', e.message); process.exit(1); });