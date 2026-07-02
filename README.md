# catch-of-the-day

**Catch of the Day** is a daily marine-animal guessing game. One species a day —
the same for everyone, chosen deterministically from the date (Wordle-style, no
backend). Guess it in three tries and it joins your permanent aquarium; miss and
it's released back into the ocean forever.

Built as a project for an AI-assisted coding course, going from idea to working
prototype using AI coding tools.

## How to play

1. **Guess 1** — you see the mystery species; type its common or scientific name.
2. **Guess 2** — a hint appears.
3. **Guess 3** — multiple choice between three species.

Slight misspellings still count (e.g. "Grat White Shark"). Get a word partly
right and it's highlighted in green for your next try. Caught species live in
your **aquarium** — pick up to 5 favourites for the display tank; the rest wait
in the back aquarium.

## Run locally

Pure static site — plain HTML/CSS/JS, no build step. It only needs to be served
over `http://` (not opened as a `file://` path, or the data fetch is blocked):

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Project layout

```
index.html            entry point + tab shell
src/
  main.js             bootstrap + Today/Aquarium tab router
  daily.js            date → species-of-the-day
  guess.js            fuzzy matching + partial-word highlighting
  storage.js          localStorage: aquarium, display picks, daily result
  quiz.js             3-guess flow + "come back tomorrow" silhouette
  aquarium.js         display tank + back aquarium
  styles.css
data/species.json     the marine species
assets/images/        placeholder SVG art (swap in real art later)
.github/workflows/    deploy to GitHub Pages on push to main
```

## Artwork

The species art in `assets/images/` is placeholder SVG. To swap in real
Pokémon-style images, drop a file at the path each species points to in
`data/species.json` (e.g. `assets/images/great-white-shark.png`) and update that
`image` field — no code changes needed.

## Deployment

Push to `main` → GitHub Actions publishes the site to GitHub Pages. One-time
setup: **Settings → Pages → Source = GitHub Actions**.

See [context.md](context.md) and [projectplan.md](projectplan.md) for the full
concept and build plan.
