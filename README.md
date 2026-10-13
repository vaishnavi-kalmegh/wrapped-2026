# WRAPPED.exe — 2026 so far

A chaotic, unofficial, data-driven music + life recap. Built with plain HTML, CSS, and vanilla JavaScript.

## Features

- Import one or more Spotify Extended Streaming History JSON files, processed locally in the browser.
- View a detailed analytics dashboard for tracks, artists, albums, event history and listening patterns, all driven by one shared date range.
- Search, sort and incrementally render large track/artist/album rankings; inspect per-artist track breakdowns and search chronologically ordered events.
- Explore busiest UTC dates, year-specific monthly totals and hourly activity without combining the same month across different years.\n- View a compact lifetime overview with all-time, this-year, rolling 12-month and custom inclusive UTC date ranges, without changing the existing 2026 Wrapped section.
- Keep the existing 2026 Wrapped story, top-five artists/tracks, awards, UTC heatmap, monthly timeline, themes, PNG story-card export, friend comparison and user-authored Life Wrapped.
- Reuse the analytics engine for lifetime totals or filtered date ranges (all time, this year, last 12 months, or custom dates).
- View import diagnostics for recognized files, accepted/rejected records, invalid timestamps, missing metadata and excluded episode/audiobook records.
- Compare two people's selected histories locally and only with their permission.
- Nothing is persisted across refreshes by this app.

## Run the app

Open `index.html` in a modern browser, or publish the repository root using GitHub Pages. The app uses three local scripts: `analytics.js` (normalization and calculations), `script.js` (the existing 2026 Wrapped experience), and `dashboard.js` (the range-aware detailed analytics views).

## Import formats and aliases

The import accepts a top-level JSON array or an object containing an array under `items`, `streamingHistory`, `streaming_history`, `endsong`, `records`, or `history`. One or many files may be selected together; files with invalid JSON or unrecognized structures are reported without discarding valid rows from other files.

The lifetime overview and Phase 2 dashboard share one range selector and the same imported rows. Changing the range recalculates every dashboard view without mutating source history. The original story, awards, heatmap, monthly timeline, friend comparison and share cards remain locked to the existing 2026 Wrapped window.

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
- **Artist estimates:** the primary artist receives 1.0 estimated play point and explicitly listed secondary/featured artists receive 0.5 for each qualifying event. Recorded duration is credited to each explicitly listed artist, so collaborator duration totals overlap and must not be added together. This is an approximation; Spotify's exact ranking formula is proprietary and exports do not always identify all collaborators.
- **Albums:** album + primary artist groups are created only when album metadata is present. Missing album values, artwork, release dates and genres are not guessed. Track and album listening time includes recorded duration from short events; ranking play counts still require more than 30 seconds.
- **Duplicate events:** the app does not deduplicate events based on title and timestamp. Two events that look identical may be separate legitimate plays; no conservative unique event identifier is guaranteed by every export.
- **Episodes/audiobooks:** records marked with recognized episode or audiobook fields are excluded from music analytics. Records with ambiguous or missing content metadata are not assigned invented classifications.
- **2026 Wrapped compatibility:** the current story retains its UTC window from Jan 1 through Nov 15, 2026 (inclusive) and its existing presentation, awards and share cards. The lifetime foundation is separate from that explicit window.

## Tests

Tests use synthetic fixtures only; no personal listening history is committed. Requires Node.js with the built-in test runner (Node 18+ recommended).

Run from the repository root:

```sh
node --test tests/analytics.test.js
```

The tests cover import formats, multi-year totals, the 2026 cutoff, custom ranges, the strict 30-second boundary, secondary artists, track identity, malformed inputs, diagnostics, empty results, duplicate-looking plays, total consistency, ranking order, short-event duration, album grouping, year-specific month buckets and chronological event sorting.

## Privacy and data safety

**This application processes selected listening-history files locally in your browser. It does not upload them, call the Spotify API, use OAuth, or send listening history to a server.** This static site has no backend and does not persist imported history across refreshes. Friend comparison also runs locally.

Do not commit raw Spotify exports or private listening data. The repository's `.gitignore` includes common Spotify export filename patterns, but still check staged files before committing.

## Limitations

- A real personal export has not been used as a committed fixture or as a verification artifact. Validate results against your own downloaded export locally.
- Genre labels, Spotify popularity scores and “most obscure” status are not reliably available in the supported streaming-history fields and are not fabricated.
- This is an unofficial fan project and is not affiliated with Spotify.


## Detailed analytics dashboard

The Overview, Tracks, Artists, Albums, History and Patterns sections use the selected shared date range (All time, This year, Last 12 months or custom inclusive UTC dates). Tracks and albums rank by qualifying play count by default and can be sorted by recorded listening time; rankings include search and incremental rendering. Artist rows can expand to show matching qualifying track groups. History is newest-first, with undated events at the end of All time. Daily, monthly and hourly duration charts use UTC; month keys include the year, so January 2024 and January 2025 are not combined. The charts explain when timestamps or positive durations are unavailable.

The dashboard does not use external chart libraries, remote services, IndexedDB or persistent browser storage. The active range is a view filter only and never discards imported rows. The existing 2026 Wrapped experience remains on its original Jan 1–Nov 15 UTC window.

## Phase 3 insights

The Insights section adds deterministic milestones for recorded listening minutes, qualifying plays, track groups and artists; active-day and longest streaks; first-observed dates within the imported archive; primary-artist listening-time concentration; equal-length comparisons against the immediately preceding UTC period; and import-quality diagnostics. It shares the dashboard's date-range selector and recalculates when history or range changes.

- **Streaks:** a day is active when at least one non-episode/non-audiobook record has a valid UTC timestamp and positive recorded duration. Multiple plays on one date count as one active day; missing dates break streaks.
- **First observed:** the earliest valid timestamp for a track + primary-artist group or artist among the imported records in the selected range. This is not a claim about the user's first-ever listen; older history may be absent.
- **Artist concentration:** recorded duration is attributed only to each record's primary artist for this metric, avoiding collaborator-duration double counting. The separate artist rankings retain their existing weighted collaborator estimates.
- **Period comparison:** bounded ranges compare the selected interval with the immediately preceding interval of equal duration. Percentage change is shown as unavailable when the earlier baseline is zero and the current value is non-zero; no Infinity/NaN percentage is reported.
- **Milestones:** thresholds are display markers calculated from the current selected range, not externally verified Spotify achievements.
- **Diagnostics:** file/record diagnostics are surfaced from the existing local import parser. Insight computations run in the browser on imported rows and do not persist history.

The Phase 3 regression cases are included in `tests/analytics.test.js` and use synthetic fixtures only.

## Phase 4 reliability and local report export

- Import validation distinguishes unreadable/invalid JSON, unrecognized JSON structures, recognized history arrays containing zero records, rejected non-object records, and accepted records. An empty top-level array or an empty recognized history array is a valid but empty import format; it is not reported as an unknown schema.
- Duration diagnostics distinguish absent duration fields, malformed or negative duration values (treated as zero), and explicitly recorded zero-millisecond durations. Positive finite recorded durations are used as-is; numeric strings are accepted. These diagnostics do not deduplicate events or infer missing metadata.
- Re-importing replaces the current session's imported history rather than appending to it. Import tokens prevent an older, slower file-read operation from overwriting a newer import or a reset. Selecting the same file again is possible because the file input is cleared after its File objects are captured.
- The **Export local CSV report** action creates a downloadable report in the browser for the currently selected range. It includes summary metrics, top qualifying track/artist groups, streaks, concentration shares, definitions and caveats. It does not export raw streaming-history rows and does not send data to a server. If the range is invalid or no history is loaded, it reports that state instead of creating a misleading report.
- CSV artist play points remain estimates (primary = 1.0, explicitly listed secondary = 0.5). Artist-attributed collaboration durations overlap and must not be summed as mutually exclusive listening time. A zero baseline is never turned into an infinite percentage.
- Import file parsing and CSV generation remain browser-local. No persistent storage, Spotify API, OAuth, backend, tracking scripts or chart dependencies were added.

The expanded synthetic regression suite covers empty versus unrecognized import structures, malformed/missing/zero duration values, UTC midnight boundaries, undated records, collaboration weighting and overlapping duration, repeated independent parser calls, and safe handling of malformed import inputs. Run the same CI checks from the repository root:

```sh
node --check analytics.js
node --check insights.js
node --check script.js
node --check dashboard.js
node --test tests/analytics.test.js
```

These commands are also run by the existing GitHub Actions workflow on relevant pushes to `main` and pull requests. A successful workflow verifies those commands against synthetic fixtures; it does not replace a browser/mobile smoke test with a real export.

- Possible duplicate file selections with matching name, size and modification time are warned about but retained; the app never guesses that matching events should be deduplicated.
