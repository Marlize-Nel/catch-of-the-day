# Catch of the Day — Project Plan

A Wordle-style **daily marine-animal guessing game**. One species per day (same for
everyone, deterministic by date, no backend). Guess it and it joins your permanent
aquarium; miss after three tries and it's released back into the ocean forever.

See [context.md](context.md) for the full game concept and rules.

---

## 1. Decisions (locked in)

| Area | Decision | Notes |
|------|----------|-------|
| **Tech stack** | Vanilla **HTML/CSS/JS** (no UI framework) + **Vite** for dev/build | Vite gives a dev server + bundling without pulling in React/Vue etc. |
| **Hosting** | **GitHub Pages** | Project page at `https://marlize-nel.github.io/catch-of-the-day/` |
| **Deploy flow** | Push to `main` → **GitHub Actions** builds with Vite and deploys to Pages | "Commit to main → it's live" — no manual deploy step |
| **Target device** | **Desktop / computer** | Design for mouse + keyboard, wider layouts |
| **Aquarium** | **In-page section** of the website (view/tab), persisted in `localStorage` | Not an OS desktop widget (would need Electron/native) |
| **Species art** | **Emoji / placeholder first**, swap in cartoon images later | Keeps the game playable immediately |
| **Backend** | **None** | All logic client-side; daily species chosen deterministically from the date |
| **Git workflow** | Commit **straight to `main`** in clean staged steps | Switch to branches/PRs after MVP works |

---

## 2. Tech stack detail

- **Vite** (vanilla template) — dev server (`npm run dev`), production build (`npm run build`) to `dist/`.
- **Vanilla ES modules** — no framework; small focused JS modules.
- **CSS** — plain CSS (or CSS custom properties for theming). No preprocessor unless needed.
- **Data** — a single JSON file of species, imported at build time.
- **Persistence** — browser `localStorage` for the aquarium + today's play state.
- **`vite.config.js`** — must set `base: '/catch-of-the-day/'` so asset URLs work on the project-pages path.

---

## 3. Project structure (proposed)

```
catch-of-the-day/
├── index.html            # entry point
├── vite.config.js        # base: '/catch-of-the-day/'
├── package.json
├── src/
│   ├── main.js           # app bootstrap / screen router
│   ├── daily.js          # deterministic date → species selection
│   ├── guess.js          # fuzzy matching + partial-word highlighting
│   ├── storage.js        # localStorage read/write (aquarium + play state)
│   ├── aquarium.js       # aquarium view rendering
│   ├── quiz.js           # quiz screen (3-guess flow)
│   └── styles.css
├── data/
│   └── species.json      # 10–15 marine vertebrates
├── public/
│   └── images/           # species art (placeholder → real later)
├── .github/
│   └── workflows/
│       └── deploy.yml    # build + deploy to Pages on push to main
├── context.md
└── projectplan.md
```

---

## 4. Data model

`data/species.json` — 10–15 **marine vertebrates only** (no seabirds, no invertebrates):

```jsonc
{
  "id": "great-white-shark",
  "commonName": "Great White Shark",
  "scientificName": "Carcharodon carcharias",
  "image": "images/great-white-shark.png",  // placeholder/emoji at first
  "hint": "One clue sentence for the second guess.",
  "decoys": ["Tiger Shark", "Mako Shark"],   // 2 wrong options for multiple choice
  "funFact": "Shown on a correct catch."
}
```

- Accepted answers = `commonName` and `scientificName` (both, case/punctuation-insensitive).
- Multiple-choice options (guess 3) = correct name + the 2 `decoys`, shuffled.

---

## 5. Core game logic

**Daily selection (`daily.js`)**
- Compute an index from the current date (e.g. days-since-epoch `% species.length`), so everyone sees the same species on the same day, no backend needed. Wordle-style.

**Three-guess flow (`quiz.js`)**
1. **Guess 1** — image + text box + "I have no idea" button.
2. **Guess 2** — adds the hint sentence (image + text box + button).
3. **Guess 3** — multiple choice: correct name + 2 decoys (image still shown).

**Fuzzy matching (`guess.js`)** — for text guesses (guesses 1 & 2):
- Normalize: lowercase, trim, strip punctuation, collapse whitespace.
- Accept close spellings as correct (e.g. "Grat White Shark", "Great Wite", "Great White") — fuzzy per-word / edit-distance threshold; show the correct spelling afterward.
- If partially right (some words match, others don't), it's **incorrect** but **highlight the correct word(s) in green** for the next guess.

**Outcomes**
- **Correct** (any guess) → show fun fact → add species to aquarium.
- **Wrong after guess 3** (or "I have no idea" three times) → released forever, not added.
- Persist today's result so refreshing doesn't grant a retry ("no second chances").

**Aquarium (`aquarium.js`)**
- In-page view listing every species caught so far, read from `localStorage`.

---

## 6. Deployment (GitHub Pages via Actions)

- `.github/workflows/deploy.yml`: on push to `main` → `npm ci` → `npm run build` → upload `dist/` → deploy to Pages.
- One-time GitHub setting: **Settings → Pages → Source = GitHub Actions**.
- `vite.config.js` `base` must match the repo name (`/catch-of-the-day/`).

---

## 7. Build order & staged commits

Commit in clean steps so git history tells the build story:

1. **Scaffold** — Vite vanilla project, `vite.config.js` base, `.github/workflows/deploy.yml`. → *push to main, confirm blank app deploys to Pages.*
2. **Data file** — `species.json` with 10–15 species (emoji/placeholder art).
3. **Daily logic** — deterministic date → species selection.
4. **Quiz UI** — the 3-guess flow (image → +hint → multiple choice).
5. **Matching** — fuzzy spelling + partial-word green highlighting.
6. **Local storage** — persist today's result + aquarium; enforce no-retry.
7. **Aquarium view** — in-page section showing caught species.
8. **Polish** — styling, desktop layout, fun-fact / catch & release feedback screens.

(Matches the planned workflow in context.md: scaffold → push to GitHub → build MVP.)

---

## 8. Open items / decide later

- **Real artwork**: replace emoji/placeholders with Pokémon-style cartoon images (AI-generated or supplied).
- **Cross-day aquarium growth**: confirm aquarium simply accumulates over days (assumed yes).
- **Post-game state**: what the screen shows after today's animal is done (e.g. "come back tomorrow" + aquarium).
- **PWA install** (optional later): add a manifest so the site can be "installed" to the desktop dock — closest thing to the original desktop-widget idea without native code.
