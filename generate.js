// Generates one page per car, the credits page, sitemap.xml and robots.txt into /public
// Runs automatically after "npm run fetch". Or run alone:  npm run build
const fs = require('fs');
const path = require('path');
const cfg = require('./site.config');
const { carPage, creditsPage, thanksPage, legalPage, seoTags } = require('./templates');

function generate(cars) {
  let notes = {};
  try { notes = JSON.parse(fs.readFileSync(path.join(__dirname, 'notes.json'), 'utf8')); } catch { /* notes are optional */ }
  const site = String(process.env.SITE_URL || cfg.url).replace(/\/$/, '');
  const pub = path.join(__dirname, 'public');
  const indexFile = path.join(pub, 'index.html');
  const index = fs.readFileSync(indexFile, 'utf8');

  // reuse the site's navigation bar on the generated pages
  const navMatch = index.match(/<nav>[\s\S]*?<\/nav>/);
  if (!navMatch) throw new Error('Could not find <nav> in public/index.html');
  const nav = navMatch[0].replace(/href="#\//g, 'href="/#/').replace(/href="assets\//g, 'href="/assets/');

  const dir = path.join(pub, 'cars');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const c of cars) fs.writeFileSync(path.join(dir, c.id + '.html'), carPage(c, cars, site, nav, cfg, notes));
  fs.writeFileSync(path.join(pub, 'credits.html'), creditsPage(cars, site, nav, cfg));
  fs.writeFileSync(path.join(pub, 'thanks.html'), thanksPage(site, nav, cfg));
  for (const k of ['privacy', 'terms']) fs.writeFileSync(path.join(pub, k + '.html'), legalPage(k, site, nav, cfg));
  const adsId = (cfg.adsenseId || '').replace(/^ca-/, '');
  if (adsId) fs.writeFileSync(path.join(pub, 'ads.txt'), `google.com, ${adsId}, DIRECT, f08c47fec0942fa0\n`);

  const today = new Date().toISOString().slice(0, 10);
  const urls = ['/', '/credits.html', '/privacy.html', '/terms.html', ...cars.map(c => `/cars/${c.id}.html`)];
  fs.writeFileSync(path.join(pub, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${site}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n</urlset>\n');
  fs.writeFileSync(path.join(pub, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);

  // fill the SEO tags of the home page
  const seo = seoTags({
    title: 'Autoryva | Vintage Car Archive',
    desc: `Browse ${cars.length} vintage and classic cars by make, model and year, with photos and short histories.`,
    url: site + '/', image: `${site}/assets/og-image.png`, cfg
  });
  fs.writeFileSync(indexFile, index.replace(/<!--SEO-->[\s\S]*?<!--\/SEO-->/, `<!--SEO-->\n${seo}<!--/SEO-->`));
  console.log(`Generated ${cars.length} car pages, credits page, sitemap.xml, robots.txt (site: ${site})`);
}

module.exports = { generate };
if (require.main === module) {
  const data = path.join(__dirname, 'data', 'cars.json');
  if (!fs.existsSync(data)) { console.error('No data/cars.json yet. Run: npm run fetch'); process.exit(1); }
  generate(JSON.parse(fs.readFileSync(data, 'utf8')));
}
