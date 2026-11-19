# Leonida Legend — GTA 6 Trophy Guide and Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/borcyondo-art/gta6-trophy-guide-v4/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/borcyondo-art/gta6-trophy-guide-v4/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Entry for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01) — "Build the best GTA 6 trophy guide" ($250 total, top 50 paid).

## What it is

An offline web app that guides and tracks all 55 PlayStation 5 trophies of Grand Theft Auto VI: 1 platinum, 2 gold, 6 silver and 46 bronze, 28 of them hidden until earned.

- **Checklist** — every trophy with its official name, description and grade; tick it off and the progress saves in the browser (localStorage), with export to a file and import back. Filters by kind, grade and earned state, plus search and a spoiler setting that hides story trophies until they are earned.
- **Roadmap** — six stages to the platinum, in order, each with its trophies and its progress.
- **Missables** — the one trophy that can be missed (Positive Mental Attitude) and the save discipline the game demands: no mission replay, so keep a manual save at the start of every chapter.
- **Sources** — where every fact comes from. Names, descriptions and grades are as PlayStation publishes them (Exophase and PSNProfiles); the guides are this entry's own words, and where a step is not yet confirmed in the game the guide says so.

## How to run it

```sh
node serve.ts
```

Then open http://localhost:8080. The app is static files under `app/` with no build step and makes no network request at run time.

## How to check it

```sh
node test.mjs
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`test.mjs` runs the entry's own checks (trophy data, store, filters and the grader-style run). `main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's vendored library.

## Files

- `app/index.html` — the page; `app/css/style.css` — the sunset-paper look
- `app/js/main.js` — boot, state and routing; `app/js/data.js` — loads the trophy data
- `app/js/store.js` — saved progress, export and import; `app/js/filters.js` — filters and the spoiler rule
- `app/js/views.js` — the checklist, detail pane, roadmap, missables and sources screens
- `app/data/trophies.json` — the 55 trophies with their guides and sources
- `main.ts` — hands the guide in; `vendor/makefun-frontend.ts` — the kit's library, unchanged
- `screenshots/` — four real renders of the app in a browser
- `test.mjs` — the entry's own checks; `shots.json` — the screenshot list
