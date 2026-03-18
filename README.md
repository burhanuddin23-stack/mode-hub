# Mode Hub

Base home page plus a dedicated Ronaldo page, with live Ronaldo news served through a Vercel serverless endpoint.

## File structure

```text
.
├── api
│   ├── matcha-recipes.js
│   ├── ronaldo-matches.js
│   └── ronaldo-news.js
├── index.html
├── matcha.html
├── ronaldo.html
├── styles.css
├── src
│   ├── home-page.js
│   ├── matcha-data.js
│   ├── matcha-page.js
│   ├── ronaldo-data.js
│   └── ronaldo-page.js
├── vercel.json
└── README.md
```

## Run locally

Serve the folder with any static server because the Ronaldo page uses ES modules.

```bash
python3 -m http.server 4173
```

Then open:

- `http://localhost:4173/` for the home page
- `http://localhost:4173/ronaldo.html` for Ronaldo Mode

## Notes

- `index.html` is the base home page with placeholder tabs and shortcuts.
- `ronaldo.html` is the dedicated Ronaldo page.
- `matcha.html` is the dedicated Matcha page.
- Only the news section attempts a live fetch.
- In production on Vercel, the news section fetches from `/api/ronaldo-news`.
- In production on Vercel, the next-match and recent-match sections fetch from `/api/ronaldo-matches`.
- In production on Vercel, the Matcha page fetches recipe cards from `/api/matcha-recipes`.
- If the live news fetch fails, fallback cards from `src/ronaldo-data.js` are shown instead.
- If the live match fetch fails, fallback match data from `src/ronaldo-data.js` is shown instead.
- If the live matcha recipe fetch fails, fallback recipe cards from `src/matcha-data.js` are shown instead.
- The daily quiz changes based on the day of the month.

## Deploy on Vercel

1. Push this folder to GitHub.
2. Import the repo into Vercel.
3. Use the default project settings for a static site.
4. Deploy.

After deploy:

- Home page will be `/`
- Ronaldo page will be `/ronaldo`
- Matcha page will be `/matcha`
- Live news endpoint will be `/api/ronaldo-news`

## Important

- The live news feature depends on Google News RSS being reachable by the Vercel function.
- If Google News changes its RSS format, `api/ronaldo-news.js` may need a parser update.
- Local static serving will not run the Vercel API route, so local news will fall back unless you emulate Vercel functions.
