# Autoryva (frontend + Wikipedia backend)

## Run (needs Node.js 18 or newer: https://nodejs.org)
    npm install
    npm start
Open http://localhost:3000

The first start downloads car text, photos and photo credits from Wikipedia
and saves them in data/cars.json (takes a few seconds). After that it loads instantly.

## Add more cars
Add a line to seed-cars.json, for example:
    {"title":"Ford Mustang (first generation)","make":"Ford","model":"Mustang","from":1964,"to":1973,"country":"USA"}
"title" must be the exact Wikipedia page title (copy it from the page URL).
Then run:  npm run fetch   and restart the server.

## Before you publish
Open fetch-wiki.js and put your own website and email in the UA line near the top.
