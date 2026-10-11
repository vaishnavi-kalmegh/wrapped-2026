# WRAPPED.exe — 2026 so far

A chaotic, unofficial, data-driven music + life recap. Built with plain HTML, CSS, and JavaScript.

## Features in this branch

- Upload one or more Spotify streaming-history JSON files; process data entirely in the browser.
- Calculate recorded 2026 listening time, track-play events, unique artist names, and top-five artists/tracks.
- Navigate animated story slides and download the current slide as a PNG share card.
- View a daily listening heatmap and monthly listening-time timeline.
- Unlock evidence-based awards with visible criteria and supporting numbers.
- Compare two people's selected histories for shared artists and tracks, locally and with their permission.
- Switch between Chaos, Afterglow, and Mono visual themes.
- Add a user-authored Life Wrapped recap. Life events are never inferred from listening history.
- Reset both sets of results; nothing is stored by this static app.

## Run it

Open `index.html` in a browser, or enable GitHub Pages in **Settings → Pages** and publish from the branch root. This feature branch has not been verified as deployed.

## Add your Spotify history

1. Request **Extended Streaming History** from [Spotify Account Privacy](https://www.spotify.com/account/privacy/).
2. When the archive arrives, extract it on your computer.
3. Select the JSON files whose names start with `Streaming_History` or `endsong`.
4. For friend comparison, select the other person's export only with their explicit permission.

The selected files are processed locally in your browser. This app does not upload the files to a server. Do **not** commit raw exports or personal account data to this repository.

## Data rules and caveats

- The year filter uses the UTC year from each record's timestamp.
- Listening time is the sum of recorded `msPlayed` / `ms_played` values; it is not an estimate based on full track duration.
- Rankings count records with a track and artist name and are not guaranteed to match Spotify's proprietary Wrapped methodology. Short and partial plays may be included.
- Heatmap and monthly totals are based on recorded duration by UTC date/month.
- Awards use explicit thresholds or direct comparisons visible in their evidence text. They are playful labels, not claims about a person's mood or psychology.
- Friend overlap compares normalized artist names and track + artist pairs. Different spellings/metadata can reduce the apparent overlap.
- Streaming history does not reliably contain genre labels or Spotify popularity scores. Genre rankings and “most obscure track” are not fabricated.
- No real export has been used to verify the displayed results yet; validate with an actual export before relying on individual calculations.

## Tech

Static HTML/CSS/JavaScript; no framework, no build step, no backend, no data persistence.

Unofficial fan project; not affiliated with Spotify.
