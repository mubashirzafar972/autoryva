const express = require('express');
const fs = require('fs');
const path = require('path');
const { buildData, OUT } = require('./fetch-wiki');

const app = express();
const PORT = process.env.PORT || 3000;
let cache = null;

const readCache = () => { try { return JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch { return null; } };

// Cars API used by the website
app.get('/api/cars', async (req, res) => {
  cache = cache || readCache();
  if (!cache) {
    try { cache = await buildData(); }
    catch (e) { return res.status(503).json({ error: 'Could not load data from Wikipedia: ' + e.message }); }
  }
  res.json(cache);
});

// The website itself
// On your computer the feedback form cannot save messages; just show the thank-you page
app.post('/thanks.html', (req, res) => res.redirect(303, '/thanks.html'));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Autoryva is running: http://localhost:${PORT}`);
  if (!readCache()) buildData().then(d => { cache = d; }).catch(e => console.warn('First data fetch failed:', e.message));
});
