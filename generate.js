// Generates all static pages into /public: car pages, brands, collections, journal,
// compare, saved, credits, privacy, terms, 404, sitemap.xml, robots.txt, ads.txt
// Runs automatically after "npm run fetch". Or run alone:  npm run build
const fs = require('fs');
const path = require('path');
const cfg = require('./site.config');
const T = require('./templates');

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')); } catch { return d; } };
const matches = (c, m = {}) => (m.model || []).some(x => c.model.includes(x)) || (m.make || []).includes(c.make) ||
  (m.country || []).includes(c.country) || (m.before && c.from < m.before);

function generate(cars) {
  const notes = readJson('notes.json', {}), arts = readJson('articles.json', []), colDefs = readJson('collections.json', []);
  const site = String(process.env.SITE_URL || cfg.url).replace(/\/$/, '');
  const pub = path.join(__dirname, 'public');
  const indexFile = path.join(pub, 'index.html');
  const index = fs.readFileSync(indexFile, 'utf8');

  const navMatch = index.match(/<nav>[\s\S]*?<\/nav>/);
  if (!navMatch) throw new Error('Could not find <nav> in public/index.html');
  const tb = (index.match(/<!--TB-->[\s\S]*?<!--\/TB-->/) || [''])[0];
  const nav = (navMatch[0] + '\n' + tb).replace(/href="#\//g, 'href="/#/').replace(/href="assets\//g, 'href="/assets/');

  const out = (rel, html) => { const f = path.join(pub, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
  for (const d of ['cars', 'brand', 'collection', 'journal']) fs.rmSync(path.join(pub, d), { recursive: true, force: true });

  const urls = ['/', '/brands.html', '/collections.html', '/journal.html', '/credits.html', '/privacy.html', '/terms.html'];
  for (const c of cars) { out(`cars/${c.id}.html`, T.carPage(c, cars, site, nav, cfg, notes)); urls.push(`/cars/${c.id}.html`); }

  const byBrand = {};
  cars.forEach(c => { (byBrand[c.make] = byBrand[c.make] || []).push(c); });
  out('brands.html', T.brandsPage(cars, site, nav, cfg));
  for (const b of Object.keys(byBrand)) { out(`brand/${T.slug(b)}.html`, T.brandPage(b, byBrand[b], site, nav, cfg)); urls.push(`/brand/${T.slug(b)}.html`); }

  const cols = colDefs.map(d => ({ ...d, list: cars.filter(c => matches(c, d.match)) })).filter(d => d.list.length);
  out('collections.html', T.collectionsPage(cols, site, nav, cfg));
  for (const d of cols) { out(`collection/${d.id}.html`, T.collectionPage(d, d.list, site, nav, cfg)); urls.push(`/collection/${d.id}.html`); }
  out('data/collections.json', JSON.stringify(cols.map(({ id, title, desc, color, list }) => ({ id, title, desc, color, count: list.length }))));

  out('journal.html', T.journalPage(arts, site, nav, cfg));
  for (const a of arts) { out(`journal/${a.slug}.html`, T.articlePage(a, site, nav, cfg)); urls.push(`/journal/${a.slug}.html`); }

  out('credits.html', T.creditsPage(cars, site, nav, cfg));
  out('thanks.html', T.thanksPage(site, nav, cfg));
  for (const k of ['privacy', 'terms']) out(k + '.html', T.legalPage(k, site, nav, cfg));
  out('compare.html', T.comparePage(site, nav, cfg));
  out('saved.html', T.savedPage(site, nav, cfg));
  out('404.html', T.notFoundPage(site, nav, cfg));

  const adsId = (cfg.adsenseId || '').replace(/^ca-/, '');
  if (adsId) out('ads.txt', `google.com, ${adsId}, DIRECT, f08c47fec0942fa0\n`);
  const today = new Date().toISOString().slice(0, 10);
  out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${site}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n</urlset>\n');
  out('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);

  const seo = T.seoTags({
    title: 'Autoryva | Vintage Car Archive',
    desc: `Browse ${cars.length} vintage and classic cars by make, model and year, with photos and short histories.`,
    url: site + '/', image: `${site}/assets/og-image.png`, cfg
  });
  fs.writeFileSync(indexFile, index.replace(/<!--SEO-->[\s\S]*?<!--\/SEO-->/, `<!--SEO-->\n${seo}<!--/SEO-->`));
  console.log(`Generated ${cars.length} car pages, ${Object.keys(byBrand).length} brand pages, ${cols.length} collections, ${arts.length} articles, sitemap and more (site: ${site})`);
}

module.exports = { generate };
if (require.main === module) {
  const data = path.join(__dirname, 'data', 'cars.json');
  if (!fs.existsSync(data)) { console.error('No data/cars.json yet. Run: npm run fetch'); process.exit(1); }
  generate(JSON.parse(fs.readFileSync(data, 'utf8')));
}
