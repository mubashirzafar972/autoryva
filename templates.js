// HTML templates for the car pages and credits page (used by generate.js)
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const FONTS = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Kanit:ital,wght@0,500;0,700;1,800&display=swap';

function headExtras(cfg) {
  let h = '';
  if (cfg.searchConsoleToken) h += `<meta name="google-site-verification" content="${esc(cfg.searchConsoleToken)}">\n`;
  if (cfg.adsenseId) h += `<meta name="google-adsense-account" content="${esc(cfg.adsenseId)}">\n`;
  const ids = JSON.stringify({ analyticsId: cfg.analyticsId || '', adsenseId: cfg.adsenseId || '' }).replace(/</g, '\\u003c');
  h += `<script>window.AV_CFG=${ids};</script>\n<script src="/js/consent.js" defer></script>\n`;
  return h;
}

function seoTags({ title, desc, url, image, cfg }) {
  return `<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Autoryva">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
${headExtras(cfg)}`;
}

function layout({ title, desc, url, image, body, nav, cfg }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
${seoTags({ title, desc, url, image, cfg })}<link href="${FONTS}" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
${nav}
${body}
<footer><div class="wrap">Autoryva &middot; <a href="/credits.html">Credits and licenses</a> &middot; <a href="/privacy.html">Privacy</a> &middot; <a href="/terms.html">Terms</a> &middot; Car text and photos come from Wikipedia and Wikimedia Commons.</div></footer>
</body>
</html>
`;
}

const short = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '\u2026'; };
const name = c => `${c.make} ${c.model}`;
const cardHtml = c => `<a class="card" href="/cars/${esc(c.id)}.html">${c.image ? `<img src="${esc(c.image)}" alt="${esc(name(c))}" loading="lazy" referrerpolicy="no-referrer">` : '<div class="ph"></div>'}<div class="b"><span class="yr">${c.from}\u2013${c.to}</span><h3 style="margin-top:8px">${esc(name(c))}</h3><div class="meta">${esc(c.country)}</div></div></a>`;

function creditLine(c) {
  if (!c.credit) return '';
  const cr = c.credit;
  const lic = cr.license ? (cr.licenseUrl ? `<a href="${esc(cr.licenseUrl)}" target="_blank" rel="noopener">${esc(cr.license)}</a>` : esc(cr.license)) : '';
  return `<p class="credit">Photo: ${esc(cr.author || 'Wikimedia Commons')}${lic ? ', ' + lic : ''}${cr.page ? ` (<a href="${esc(cr.page)}" target="_blank" rel="noopener">source</a>)` : ''}</p>`;
}

function carPage(c, all, site, nav, cfg, notes) {
  const url = `${site}/cars/${c.id}.html`;
  const title = `${name(c)} (${c.from}\u2013${c.to}) | Autoryva`;
  const desc = short(c.d || `${name(c)}, a classic car from ${c.country}, built ${c.from} to ${c.to}.`, 155);
  const image = c.image || `${site}/assets/og-image.png`;
  const related = all.filter(x => x.id !== c.id).sort((a, b) => Math.abs(a.from - c.from) - Math.abs(b.from - c.from)).slice(0, 3);
  const text = encodeURIComponent(`${name(c)} (${c.from}\u2013${c.to}) on Autoryva`);
  const u = encodeURIComponent(url);
  const body = `<main class="wrap car-page">
<p class="crumbs"><a href="/">Home</a> / <a href="/#/gallery">Gallery</a> / ${esc(name(c))}</p>
<div class="car-grid">
<div>${c.image ? `<img class="car-img" src="${esc(c.image)}" alt="${esc(name(c))}" referrerpolicy="no-referrer">` : '<div class="car-img ph"></div>'}${creditLine(c)}</div>
<div>
<span class="yr">${c.from}\u2013${c.to}</span>
<h1>${esc(name(c))}</h1>
${notes && notes[c.id] ? `<section class="notes"><h2>Autoryva Notes</h2><p>${esc(notes[c.id])}</p></section>` : ''}
<p class="src">From Wikipedia</p>
<p class="lead" style="margin-top:0">${esc(c.d)}</p>
<dl class="facts"><dt>Make</dt><dd>${esc(c.make)}</dd><dt>Model</dt><dd>${esc(c.model)}</dd><dt>Produced</dt><dd>${c.from} to ${c.to}</dd><dt>Country</dt><dd>${esc(c.country)}</dd></dl>
<div class="share"><span>Share:</span>
<a class="btn" href="https://wa.me/?text=${text}%20${u}" target="_blank" rel="noopener">WhatsApp</a>
<a class="btn" href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener">Facebook</a>
<button class="btn" type="button" onclick="navigator.clipboard.writeText(location.href).then(()=>{this.textContent='Copied!'})">Copy link</button></div>
${c.wiki ? `<p><a href="${esc(c.wiki)}" target="_blank" rel="noopener">Read more on Wikipedia</a></p>` : ''}
</div></div>
<h2 style="margin:40px 0 16px">More cars from the same era</h2>
<div class="grid">${related.map(cardHtml).join('')}</div>
</main>`;
  return layout({ title, desc, url, image, body, nav, cfg });
}

function creditsPage(all, site, nav, cfg) {
  const rows = all.filter(c => c.image).map(c => {
    const cr = c.credit || {};
    return `<tr><td><a href="/cars/${esc(c.id)}.html">${esc(name(c))}</a></td><td>${esc(cr.author || 'Wikimedia Commons')}</td><td>${cr.licenseUrl ? `<a href="${esc(cr.licenseUrl)}" target="_blank" rel="noopener">${esc(cr.license)}</a>` : esc(cr.license || '')}</td><td>${cr.page ? `<a href="${esc(cr.page)}" target="_blank" rel="noopener">source</a>` : ''}</td></tr>`;
  }).join('');
  const body = `<main class="wrap car-page">
<h1>Credits and licenses</h1>
<p class="lead">Autoryva is a free guide to vintage and classic cars. The car descriptions come from <a href="https://www.wikipedia.org" target="_blank" rel="noopener">Wikipedia</a> and are available under the <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a> license. Each description links back to its Wikipedia article.</p>
<p class="lead">The photos come from <a href="https://commons.wikimedia.org" target="_blank" rel="noopener">Wikimedia Commons</a>. Every photo belongs to its photographer and is used under the license listed below.</p>
<div class="tablewrap"><table class="credits"><thead><tr><th>Car</th><th>Photographer</th><th>License</th><th>Original</th></tr></thead><tbody>${rows}</tbody></table></div>
</main>`;
  return layout({ title: 'Credits and licenses | Autoryva', desc: 'Where the Autoryva car descriptions and photos come from, with photographer names and licenses.', url: `${site}/credits.html`, image: `${site}/assets/og-image.png`, body, nav, cfg });
}

function thanksPage(site, nav, cfg) {
  const body = `<main class="wrap car-page" style="text-align:center;padding:80px 20px">
<h1>Thank you!</h1>
<p class="lead" style="margin:12px auto 24px">Your message was sent. We read every suggestion and use it to make Autoryva better.</p>
<a class="btn" href="/" style="display:inline-block;text-decoration:none">Back to Autoryva</a>
</main>`;
  return layout({ title: 'Thank you | Autoryva', desc: 'Thank you for your feedback.', url: `${site}/thanks.html`, image: `${site}/assets/og-image.png`, body, nav, cfg })
    .replace('</head>', '<meta name="robots" content="noindex">\n</head>');
}

const when = () => new Date().toISOString().slice(0, 10);
function legalPage(kind, site, nav, cfg) {
  const mail = cfg.contactEmail ? `<a href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>` : 'the feedback form on our About page';
  const privacy = `<h1>Privacy Policy</h1><p class="lead">Last updated: ${when()}</p>
<h2>Who we are</h2><p>Autoryva is a free guide to vintage and classic cars at ${esc(site)}. You can reach us through ${mail}.</p>
<h2>What we collect</h2><p>If you send us a message through the feedback form, we receive the message and the name or email you chose to type. We use it only to read and answer your feedback. Cars you save in the browser stay on your own device.</p>
<h2>Cookies and similar technology</h2><p>When you click Accept on our cookie notice, we may load Google Analytics to count visits and Google AdSense to show ads. These services may set cookies and collect information such as your device, pages viewed and approximate location. If you click Decline, we do not load them. You can clear your browser storage at any time to see the notice again.</p>
<h2>Advertising</h2><p>Google and its partners may use cookies to show ads based on your visits to this and other sites. You can manage personalised ads in your Google ad settings.</p>
<h2>Other services</h2><p>Our pages load car photos and text from Wikipedia and Wikimedia Commons, fonts from Google Fonts, and are hosted by Netlify. These services receive your IP address when your browser loads their files and have their own privacy policies.</p>
<h2>Your choices</h2><p>You can ask us to delete a message you sent, and you can block cookies in your browser settings. We do not sell personal information.</p>
<h2>Children</h2><p>This site is a general interest site and is not directed at children under 13.</p>
<h2>Changes</h2><p>We may update this policy and will change the date above when we do.</p>`;
  const terms = `<h1>Terms of Use</h1><p class="lead">Last updated: ${when()}</p>
<h2>Using the site</h2><p>Autoryva is provided free for personal, non-commercial reading. Please do not misuse the site or try to disrupt it.</p>
<h2>Content and licenses</h2><p>Car descriptions marked From Wikipedia come from Wikipedia and are available under the CC BY-SA 4.0 license. Photos come from Wikimedia Commons and belong to their photographers under the licenses shown on each page and on the Credits page. The Autoryva Notes and journal articles are our own work. Please link back to us if you share them.</p>
<h2>Accuracy</h2><p>We try to be accurate, but car details, years and facts may contain mistakes. The information is for general interest and is not advice for buying, selling or repairing a car. Please verify details before making any decision.</p>
<h2>Links</h2><p>We link to other websites, and we are not responsible for their content.</p>
<h2>Liability</h2><p>The site is provided as it is, without promises of any kind, and we are not liable for loss caused by using it.</p>
<h2>Contact</h2><p>Questions or corrections: ${mail}.</p>`;
  const isP = kind === 'privacy';
  const body = `<main class="wrap car-page legal">${isP ? privacy : terms}</main>`;
  return layout({ title: `${isP ? 'Privacy Policy' : 'Terms of Use'} | Autoryva`, desc: isP ? 'How Autoryva handles your information, cookies and ads.' : 'The rules for using Autoryva and how its content is licensed.', url: `${site}/${kind}.html`, image: `${site}/assets/og-image.png`, body, nav, cfg });
}

module.exports = { carPage, creditsPage, thanksPage, legalPage, seoTags, esc };
