# WRAPPED.exe — 2026 so far

A chaotic, unofficial, data-driven music + life recap. Built with plain HTML, CSS, and vanilla JavaScript.

## Features

- Import one or more Spotify Extended Streaming History JSON files, processed locally in the browser.
- Keep the existing 2026 Wrapped story, top-five artists/tracks, awards, UTC heatmap, monthly timeline, themes, PNG story-card export, friend comparison and user-authored Life Wrapped.
- Reuse the analytics engine for lifetime totals or filtered date ranges (all time, this year, last 12 months, or custom dates).
- View import diagnostics for recognized files, accepted/rejected records, invalid timestamps, missing metadata and excluded episode/audiobook records.
- Compare two people's selected histories locally and only with their permission.
- Nothing is persisted across refreshes by this app.

## Run the app

Open `index.html` in a modern browser, or publish the repository root using GitHub Pages. The app uses two local scripts: `analytics.js` (normalization and calculations) and `script.js` (the existing UI and 2026 Wrapped experience).

## Import formats and aliases

The import accepts a top-level JSON array or an object containing an array under `items`, `streamingHistory`, `streaming_history`, `endsong`, `records`, or `history`. One or many files may be selected together; files with invalid JSON or unrecognized structures are reported without discarding valid rows from other files.

The normalizer recognizes common export aliases:

- Timestamps: `ts`, `endTime`, `end_time`, `timestamp`, `played_at`, `playedAt`, `date`, `end_timestamp`.
- Track names: `trackName`, `track_name`, `master_metadata_track_name`, `name`.
- Primary artist: `master_metadata_album_artist_name`, `album_artist_name`, `albumArtistName`, `artistName`, `artist_name`, `artist`.
- Secondary artists: `featured_artists`, `featuredArtists`, `secondary_artist_names`, `secondaryArtists`, `contributing_artists`, `contributingArtists`, plus additional entries in an artist array.
- Album: `master_metadata_album_album_name`, `album_name`, `albumName`, or `album`.
- Duration: `ms_played`, `msPlayed`, `duration_ms`, `played_duration_ms`, or `milliseconds_played`.

Unknown fields remain available on each normalized record's `raw` property. This is not a general-purpose parser for every possible third-party export schema. Missing names or metadata are left missing, never inferred.

## Analytics rules

- **Lifetime vs date ranges:** `analytics.js` exposes `normalizeRecords()`, `summarize()`, `dateRange()`, `inRange()`, and `inspectFiles()`. All-time and filtered calculations use the same summarization logic. Filtering does not mutate imported records.
- **Date policy:** timestamps are parsed into instants and calendar-day/month/hour grouping uses UTC. Custom start and end dates are inclusive UTC calendar dates; the end date includes the full day through 23:59:59.999 UTC. “This year” means the current UTC calendar year. “Last 12 months” is a rolling 12-month interval ending at the supplied/current instant. Invalid or reversed custom ranges return a validation error.
- **Undated records:** date-filtered summaries exclude records without a valid timestamp. All-time recorded-duration totals may include otherwise eligible records without timestamps; those records cannot contribute to UTC day/month/hour groups. Diagnostics count missing/invalid timestamps.
- **Recorded duration:** only finite, positive recorded duration values are summed. No duration is estimated from track length. In all-time analytics, a music record with a valid duration may contribute to total time even if track or artist metadata is missing. The legacy Wrapped view keeps its stricter behavior and requires timestamp, track name and primary artist for duration totals.
- **Qualifying plays:** a record qualifies for track/artist play rankings only when recorded duration is strictly greater than 30,000 ms. Shorter events still contribute to listening time.
- **Track identity:** tracks are grouped by normalized track name plus primary artist identity, so same-titled tracks by different artists remain separate. This is a grouping key, not a deduplication rule.
- **Artist estimates:** the primary artist receives weight 1.0 and explicitly listed secondary/featured artists receive weight 0.5 for each qualifying event. This is an approximation; Spotify's exact Wrapped ranking formula is not public, and exports do not always identify all collaborators.
- **Albums:** album rankings are created only when album metadata is present. Missing album values are not guessed.
- **Duplicate events:** the app does not deduplicate events based on title and timestamp. Two events that look identical may be separate legitimate plays; no conservative unique event identifier is guaranteed by every export.
- **Episodes/audiobooks:** records marked with recognized episode or audiobook fields are excluded from music analytics. Records with ambiguous or missing content metadata are not assigned invented classifications.
- **2026 Wrapped compatibility:** the current story retains its UTC window from Jan 1 through Nov 15, 2026 (inclusive) and its existing presentation, awards and share cards. The lifetime foundation is separate from that explicit window.

## Tests

Tests use synthetic fixtures only; no personal listening history is committed. Requires Node.js with the built-in test runner (Node 18+ recommended).

Run from the repository root:

```sh
node --test tests/analytics.test.js
```

The tests cover import formats, multi-year totals, the 2026 cutoff, custom ranges, the strict 30-second boundary, secondary artists, track identity, malformed inputs, diagnostics, empty results, duplicate-looking plays, and total consistency.

## Privacy and data safety

**This application processes selected listening-history files locally in your browser. It does not upload them, call the Spotify API, use OAuth, or send listening history to a server.** This static site has no backend and does not persist imported history across refreshes. Friend comparison also runs locally.

Do not commit raw Spotify exports or private listening data. The repository's `.gitignore` includes common Spotify export filename patterns, but still check staged files before committing.

## Limitations

- A real personal export has not been used as a committed fixture or as a verification artifact. Validate results against your own downloaded export locally.
- Genre labels, Spotify popularity scores and “most obscure” status are not reliably available in the supported streaming-history fields and are not fabricated.
- This is an unofficial fan project and is not affiliated with Spotify.
