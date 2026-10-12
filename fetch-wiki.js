// Fetches text, image and photo credit for every car in seed-cars.json
// from Wikipedia + Wikimedia Commons, and saves the result to data/cars.json.
// Run it with:  npm run fetch
const fs = require('fs');
const path = require('path');
// Many home networks reset IPv6 connections to Wikimedia (ECONNRESET). Prefer IPv4.
require('dns').setDefaultResultOrder('ipv4first');
console.log('fetch-wiki v3');

const WIKI = 'https://en.wikipedia.org/w/api.php';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
// Wikipedia asks every app to send a descriptive User-Agent. Put your own contact here.
const UA = 'AutoryvaCarArchive/1.0 (https://autoryva.example; contact: you@example.com)';
const SEED = path.join(__dirname, 'seed-cars.json');
const OUT = path.join(__dirname, 'data', 'cars.json');

async function api(base, params, tries = 3) {
  const url = base + '?' + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  for (let n = 1; ; n++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      const why = (e.cause && (e.cause.code || e.cause.message)) || e.message;
      if (n >= tries) throw new Error(`${why} (${new URL(base).hostname})`);
      await new Promise(r => setTimeout(r, 1500 * n));
    }
  }
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
        piprop: 'thumbnail|name', pithumbsize: 960, inprop: 'url', ...cont
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
  for (const group of chunk(titles, 8)) {
    await new Promise(r => setTimeout(r, 400));
    let j;
    const params = {
      action: 'query', titles: group.join('|'), prop: 'imageinfo',
      iiprop: 'extmetadata|url', iiurlwidth: 960, iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl'
    };
    try {
      // Wikipedia's own API also returns info for Commons photos, and it connects reliably
      j = await api(WIKI, params, 2);
    } catch (e1) {
      try { j = await api(COMMONS, params, 2); }
      catch (e2) { console.warn('  Photo credits failed for one batch:', e2.message); continue; }
    }
    for (const p of (j.query || {}).pages || []) {
      const ii = (p.imageinfo || [])[0];
      if (!ii) continue;
      const m = ii.extmetadata || {};
      out[p.title.replace(/^File:/, '').replace(/ /g, '_')] = {
        author: strip(m.Artist && m.Artist.value),
        license: strip(m.LicenseShortName && m.LicenseShortName.value),
        licenseUrl: strip(m.LicenseUrl && m.LicenseUrl.value),
        page: ii.descriptionurl || '',
        thumb: ii.thumburl || ''
      };
    }
  }
  return out;
}

// Finds a photo on Commons when the Wikipedia page has none (JPG only, to avoid logos/PDFs)
async function commonsSearch(q) {
  const j = await api(COMMONS, { action: 'query', list: 'search', srnamespace: 6, srsearch: q, srlimit: 8 });
  const hit = ((j.query || {}).search || []).find(h => /\.jpe?g$/i.test(h.title));
  return hit ? hit.title.replace(/^File:/, '') : null;
}

async function buildData() {
  const seed = JSON.parse(fs.readFileSync(SEED, 'utf8'));
  console.log(`Fetching ${seed.length} cars from Wikipedia...`);
  const { found, redirect } = await wikiPages(seed.map(s => s.title));
  const resolve = t => { for (let i = 0; i < 3; i++) t = redirect[t] || t; return t; };

  const pageOf = new Map(), missing = [];
  for (const s of seed) {
    const p = found[resolve(s.title)];
    if (p && !p.missing) pageOf.set(s, p); else missing.push(s);
  }
  // Fallback: if a title is wrong, search Wikipedia for the closest page
  for (const s of missing) {
    try {
      const j = await api(WIKI, { action: 'query', list: 'search', srsearch: `${s.make} ${s.model}`, srlimit: 1 });
      const hit = ((j.query || {}).search || [])[0];
      if (!hit) { console.warn(`  NOT FOUND: "${s.title}" - fix the title in seed-cars.json`); continue; }
      const r = await wikiPages([hit.title]);
      const p = r.found[r.redirect[hit.title] || hit.title];
      if (p && !p.missing) {
        pageOf.set(s, p);
        console.warn(`  CHECK: "${s.title}" was not found, used "${p.title}" instead. Make sure it is the right car.`);
      } else console.warn(`  NOT FOUND: "${s.title}" - fix the title in seed-cars.json`);
    } catch (e) { console.warn(`  NOT FOUND: "${s.title}" (${e.message})`); }
  }

  const rows = seed.filter(s => pageOf.has(s)).map(s => ({ s, p: pageOf.get(s) }));
  // accepts a plain file name, "File:Name.jpg", or the full Commons page link
  const key = f => { if (!f) return null; let n = String(f).trim().replace(/^.*File:/i, ''); try { n = decodeURIComponent(n); } catch {} return n.replace(/ /g, '_'); };
  // No photo on the Wikipedia page? Search Wikimedia Commons for one
  for (const { s, p } of rows) {
    if (p.thumbnail || s.imageFile) continue;
    try {
      const file = await commonsSearch(`${s.make} ${s.model}`);
      if (file) { s._auto = file; console.warn(`  CHECK PHOTO: ${s.make} ${s.model} -> "${file}" (found on Commons, make sure it shows the right car)`); }
    } catch (e) { console.warn(`  Photo search failed for ${s.make} ${s.model}: ${e.message}`); }
  }
  // "imageFile" in seed-cars.json (a file name from Wikimedia Commons) overrides the Wikipedia main image
  const files = rows.flatMap(({ s, p }) => [key(s.imageFile || s._auto), key(p.pageimage)]).filter(Boolean);
  const credits = await commonsInfo(files).catch(e => { console.warn('  Photo credits failed:', e.message); return {}; });
  if (files.length && !Object.keys(credits).length) console.warn('  WARNING: no photo credits were saved. Run again, or check that commons.wikimedia.org opens in your browser.');

  const used = {};
  const cars = rows.map(({ s, p }) => {
    let id = slug(`${s.make} ${s.model}`);
    used[id] = (used[id] || 0) + 1;
    if (used[id] > 1) id += '-' + used[id];
    const over = credits[key(s.imageFile || s._auto)];
    const main = credits[key(p.pageimage)];
    const useOver = !!(over && over.thumb);
    return {
      id, make: s.make, model: s.model, from: s.from, to: s.to, country: s.country,
      d: (p.extract || '').trim(),
      image: useOver ? over.thumb : (p.thumbnail ? p.thumbnail.source : null),
      credit: useOver ? over : (main || (p.pageimage ? { author: '', license: '', licenseUrl: '', page: 'https://en.wikipedia.org/wiki/File:' + encodeURIComponent(p.pageimage) } : null)),
      wiki: p.fullurl || ''
    };
  });

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(cars, null, 2));
  // Also copy the data into public/data so the static website (Netlify) can read it
  try {
    const pub = path.join(__dirname, 'public', 'data');
    fs.mkdirSync(pub, { recursive: true });
    fs.writeFileSync(path.join(pub, 'cars.json'), JSON.stringify(cars));
  } catch (e) { console.warn('  Could not copy data to public/data:', e.message); }
  console.log(`Saved ${cars.length} of ${seed.length} cars to data/cars.json (${cars.filter(c => c.image).length} with photos)`);
  const noPhoto = cars.filter(c => !c.image).map(c => `${c.make} ${c.model}`);
  if (noPhoto.length) console.log('Cars without a photo:', noPhoto.join(', '), '\n  Fix: add "imageFile":"File name from Wikimedia Commons.jpg" to that car in seed-cars.json');
  return cars;
}

module.exports = { buildData, OUT };
if (require.main === module) buildData().catch(e => { console.error('Failed:', e.message); process.exit(1); });