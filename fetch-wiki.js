// Fetches text, image and photo credit for every car in seed-cars.json
// from Wikipedia + Wikimedia Commons, and saves the result to data/cars.json.
// Run it with:  npm run fetch
const fs = require('fs');
const path = require('path');

const WIKI = 'https://en.wikipedia.org/w/api.php';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
// Wikipedia asks every app to send a descriptive User-Agent. Put your own contact here.
const UA = 'AutoryvaCarArchive/1.0 (https://autoryva.example; contact: you@example.com)';
const SEED = path.join(__dirname, 'seed-cars.json');
const OUT = path.join(__dirname, 'data', 'cars.json');

async function api(base, params) {
  const url = base + '?' + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(base).hostname}`);
  return res.json();
}
const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
const strip = h => String(h || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Wikipedia: intro text, main image and page link for up to 20 titles per request
async function wikiPages(titles) {
  const found = {}, redirect = {};
  for (const group of chunk(titles, 20)) {
    let cont = {};
    do {
      const j = await api(WIKI, {
        action: 'query', redirects: 1, titles: group.join('|'),
        prop: 'extracts|pageimages|info', exintro: 1, explaintext: 1, exsentences: 3, exlimit: 'max',
        piprop: 'thumbnail|name', pithumbsize: 900, inprop: 'url', ...cont
      });
      const q = j.query || {};
      for (const n of q.normalized || []) redirect[n.from] = n.to;
      for (const r of q.redirects || []) redirect[r.from] = r.to;
      for (const p of q.pages || []) found[p.title] = { ...(found[p.title] || {}), ...p };
      cont = j.continue || null;
    } while (cont);
  }
  return { found, redirect };
}

// Wikimedia Commons: photographer and license of each image
async function commonsInfo(fileNames) {
  const out = {};
  const titles = [...new Set(fileNames)].map(f => 'File:' + f);
  for (const group of chunk(titles, 40)) {
    const j = await api(COMMONS, {
      action: 'query', titles: group.join('|'), prop: 'imageinfo',
      iiprop: 'extmetadata|url', iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl'
    });
    for (const p of (j.query || {}).pages || []) {
      const ii = (p.imageinfo || [])[0];
      if (!ii) continue;
      const m = ii.extmetadata || {};
      out[p.title.replace(/^File:/, '').replace(/ /g, '_')] = {
        author: strip(m.Artist && m.Artist.value),
        license: strip(m.LicenseShortName && m.LicenseShortName.value),
        licenseUrl: strip(m.LicenseUrl && m.LicenseUrl.value),
        page: ii.descriptionurl || ''
      };
    }
  }
  return out;
}

async function buildData() {
  const seed = JSON.parse(fs.readFileSync(SEED, 'utf8'));
  console.log(`Fetching ${seed.length} cars from Wikipedia...`);
  const { found, redirect } = await wikiPages(seed.map(s => s.title));
  const resolve = t => { for (let i = 0; i < 3; i++) t = redirect[t] || t; return t; };

  const rows = [], files = [];
  for (const s of seed) {
    const p = found[resolve(s.title)];
    if (!p || p.missing) { console.warn('  Not found on Wikipedia, skipped:', s.title); continue; }
    rows.push({ s, p });
    if (p.pageimage) files.push(p.pageimage);
  }
  const credits = await commonsInfo(files).catch(e => { console.warn('  Photo credits failed:', e.message); return {}; });

  const used = {};
  const cars = rows.map(({ s, p }) => {
    let id = slug(`${s.make} ${s.model}`);
    used[id] = (used[id] || 0) + 1;
    if (used[id] > 1) id += '-' + used[id];
    return {
      id, make: s.make, model: s.model, from: s.from, to: s.to, country: s.country,
      d: (p.extract || '').trim(),
      image: p.thumbnail ? p.thumbnail.source : null,
      credit: (p.pageimage && credits[p.pageimage]) || null,
      wiki: p.fullurl || ''
    };
  });

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(cars, null, 2));
  console.log(`Saved ${cars.length} cars to data/cars.json (${cars.filter(c => c.image).length} with photos)`);
  return cars;
}

module.exports = { buildData, OUT };
if (require.main === module) buildData().catch(e => { console.error('Failed:', e.message); process.exit(1); });
