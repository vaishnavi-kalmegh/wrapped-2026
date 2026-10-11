# WRAPPED.exe — 2026 so far

A chaotic, unofficial, data-driven music + life recap. Built with plain HTML, CSS, and JavaScript.

## Current status

- Music history upload and in-browser calculations are implemented.
- Life Wrapped summarizes only the notes you type into the page.
- No fake top artists, songs, genres, or listening totals are included.
- Genre rankings and track popularity/obscurity are intentionally omitted until a reliable metadata source is added.

## Run it

Open `index.html` in a browser, or enable GitHub Pages in **Settings → Pages** and publish from the `main` branch root.

## Add your Spotify history

1. Request **Extended Streaming History** from [Spotify Account Privacy](https://www.spotify.com/account/privacy/).
2. When the archive arrives, extract it on your computer.
3. Open the site and select the JSON files whose names start with `Streaming_History` or `endsong`.
4. The page filters recorded track plays to calendar year 2026 and calculates recorded play events, unique artists, total recorded milliseconds converted to minutes/hours, and top-five rankings by play-event count.

The selected files are processed locally in your browser. They are not uploaded by this app. Do **not** commit the raw export or any personal account data to this repository.

## Data caveats

- Listening time is the sum of Spotify's recorded `msPlayed` / `ms_played` values; it is not an estimate based on full track duration.
- Rankings count records in the supplied export and are not guaranteed to match Spotify's proprietary Wrapped methodology.
- Extended streaming history may include short or partial plays. This project currently counts records with a track and artist name as play events.
- Streaming history does not reliably contain genre labels or Spotify popularity scores. Those metrics must not be invented.
- Life Wrapped is user-authored text only; nothing is inferred from listening behavior.

## Tech

Static HTML/CSS/JavaScript; no framework, no build step, no backend, no data persistence.

Unofficial fan project; not affiliated with Spotify.

