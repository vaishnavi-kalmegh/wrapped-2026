# WRAPPED.exe — your listening story

A personal, Spotify Wrapped-inspired listening recap built with plain HTML, CSS, and vanilla JavaScript. It turns imported Spotify Extended Streaming History into ranked music cards, evidence-based Listening Lore, interactive UTC visualizations, and a full-screen shareable story.

**Live site:** https://vaishnavi-kalmegh.github.io/wrapped-2026/

## The experience

The primary flow is intentionally story-first:

1. **Listening Lore** — one concise archive observation, shown only when its documented threshold is supported by the selected records.
2. **Top Artists** — ranked artist cards, with exact-title Wikipedia page thumbnails when available and explicitly enabled.
3. **Top Songs** — ranked track cards with matching album artwork from Apple's public iTunes Search API when available and explicitly enabled.
4. **Your Listening Numbers** — recorded duration, qualifying plays, artist names and track groups.
5. **Listening Patterns** — a monthly donut chart, a 24-hour UTC radial duration chart, and a day-level UTC heatmap.
6. **Full Story Mode** — a viewport-filling, sequential recap with Previous/Next, progress, Escape/arrow-key navigation, and individual 1080 × 1920 PNG card export.

The established **2026 Wrapped window is Jan 1–Nov 15, 2026 UTC** and is the default selection. The range control also supports All imported history, This UTC year, Last 12 months, and custom inclusive UTC dates. The chart labels include years, so the same month in different years is never combined or presented as a complete calendar year when it is only a partial window.

Top Artists and Top Songs show the first 10 ranked results by default. Each Load More action reveals the next 10, up to 50; Collapse returns the section to 10. If fewer than 50 ranked groups exist, only those available are shown. The shared analytics engine provides the rankings; the interface does not independently recalculate them.

Albums remain available in the underlying analytics engine but are not a separate primary section in this story-first redesign. The main experience no longer exposes a Listening History page, listening-streak views, equal-length period comparisons, or first-observed-in-this-archive discoveries. Those calculations are not used in the new Story Mode.

## Analytics rules

- **Qualifying play:** \`ms_played > 30,000\` milliseconds. Exactly 30,000 ms does not qualify.
- **Recorded listening duration:** sums positive recorded duration values, including short events. No track length is inferred.
- **Track identity:** track name + primary artist. Same-titled tracks by different primary artists remain separate groups.
- **Artist play points:** primary artist = 1.0 point; each explicitly listed secondary/featured artist = 0.5 point per qualifying event. This is an estimate, not Spotify's proprietary ranking formula. Collaborator duration totals overlap and must not be added together.
- **Calendar grouping:** month, hour and day calculations use UTC consistently.
- **Date-bounded ranges:** exclude records without a valid timestamp. All Time can include undated records in duration totals; undated records cannot be assigned to month/hour/day charts.
- **Monthly chart:** uses positive recorded duration from timestamped eligible music records. Month buckets include zero-duration months in the selected calendar span; their legend values are 0 minutes and 0%. Percentages are each month's duration divided by the total timestamped duration represented in the chart.
- **Hourly clock:** each segment has the same 15° clock position for one UTC hour. Segment outer radius scales linearly from 88 to 188 SVG units according to that hour's recorded duration. The displayed share is that hour's duration divided by total timestamped duration in the selected range.
- **Heatmap:** each square is one UTC date between the earliest and latest observed timestamps in the selected range. Intensity is based on that date's recorded duration relative to the busiest observed date. A zero-duration square means no positive duration was recorded for that date in the imported records—not proof that no listening happened. Dates outside the observed timestamp span are not inferred.
- **Listening Lore:** observations use explicit thresholds, not genre guesses or psychological claims:
  - **One track kept calling:** at least 10 qualifying plays and the top track is at least 20% of qualifying plays.
  - **One artist dominates the receipts:** at least 10 qualifying plays and the leading artist accounts for at least 50% of estimated artist play points. The artist denominator includes the established weighted collaboration estimates.
  - **Your rotation goes deep:** at least 10 qualifying plays, at least 20 qualifying track groups, and the top track is below 10% of qualifying plays.
  - **A clear hour has emerged:** the leading UTC hour holds at least 20% of timestamped recorded duration.
  - Otherwise, a neutral archive summary is shown instead of forcing a personality label.
- **Incomplete history:** the app cannot verify that an export contains every event from the account. Lore, heatmap tooltips, and story cards state that the result is based on imported history and may be incomplete.

## Artwork and privacy

Artwork lookup is **off until you explicitly enable “Allow artwork lookups (names only)”**.

- **Track covers:** the browser queries Apple's public iTunes Search API first with the quoted track title and primary artist. If no suitable result is found, it retries with a broader title + artist query. Both returned track title and artist must match after Unicode/case/punctuation normalization; only narrow formatting differences (featured-artist suffixes and explicit/clean/radio-edit/release-edition labels) are normalized. Remix words remain meaningful, and unrelated artists or similar-but-different song titles are rejected. If the imported history identifies one album consistently, the result's collection title must also match that album. Artwork URLs must be valid HTTPS URLs returned by Apple; the app does not construct cover URLs.
- **Artist images:** Wikipedia's public page-summary API is used only for artist thumbnails, and only when the returned page title matches the requested artist. Wikipedia is not used for track covers.
- Successful and no-match results are cached in memory for 30 minutes and 5 minutes respectively; transient lookup errors are cached for 30 seconds. Duplicate in-flight lookups are shared. Requests have a timeout, and HTTP failures, malformed responses, missing artwork and image-load errors fall back to the designed placeholders. A failed image URL is marked unavailable for the current session window rather than repeatedly rendered.
- These opt-in requests send music names to the external services and your browser also fetches the returned image. **Raw streaming-history files, account identifiers, and complete event records are never sent.** If you leave lookups disabled or a service is unavailable, the app remains usable with fallback artwork.
- The current stylesheet also imports DM Mono and Space Grotesk from Google Fonts. That font request is separate from listening-history processing and may require a network connection.
- No Spotify OAuth, API key, backend, mandatory login, persistent browser storage, or chart library is used. Imported history stays in browser memory and is cleared when the page is refreshed.

## Import and diagnostics

1. Request Spotify **Extended streaming history** from Spotify's [Account Privacy page](https://www.spotify.com/account/privacy/).
2. Extract the downloaded archive locally.
3. Select one or more streaming-history JSON files in the app.

Supported top-level history arrays include a JSON array or an array under \`items\`, \`streamingHistory\`, \`streaming_history\`, \`endsong\`, \`records\`, or \`history\`. Common timestamp, track, artist, album, and duration aliases are normalized by \`analytics.js\`. Unknown metadata is not guessed.

Importing again replaces the current session's records. Import tokens prevent a slower, older file-read operation from overwriting a newer import or reset. Invalid/unrecognized files and malformed rows are diagnosed; matching file names are never used to deduplicate listening events. The import status remains available near the upload control without putting parser diagnostics into the story flow.

CSV summary export and the older detailed views are retained only inside a hidden compatibility container while this redesign is stabilized; they are not part of the primary user interface. CSV reports contain summary metrics rather than raw streaming-history rows. The new primary flow does not depend on downloading CSV.

## Run locally

Open \`index.html\` in a modern browser, or publish the repository root with GitHub Pages. Files are plain static assets:

- \`analytics.js\` — normalization, shared summaries, date ranges and legacy analytics helpers.
- \`script.js\` — safe file import/replacement, original theme copy, and legacy compatibility.
- \`dashboard.js\` / \`insights.js\` — retained legacy code, not part of the visible story-first interface.
- \`experience.js\` — Listening Lore, ranked cards, opt-in artwork, charts, heatmap, full-screen story and PNG export.
- \`styles.css\` — themes and responsive presentation.

No personal Spotify exports should be committed. Tests use synthetic fixtures only.

## Tests and verification

Requires Node.js 20 for the configured GitHub Actions workflow (Node 18+ is generally sufficient for the built-in test runner).

Run from the repository root:

\`\`\`sh
node --check analytics.js
node --check insights.js
node --check script.js
node --check dashboard.js
node --check experience.js
node --test tests/analytics.test.js
\`\`\`

The automated tests cover the shared analytics rules, range boundaries, ranking pagination helper, monthly/hourly/day aggregations, Listening Lore thresholds, exact artwork matching, visible section order, portrait export code contracts, keyboard hooks, responsive CSS, and reduced-motion styles. Synthetic/static tests do **not** prove that the real site renders correctly in a browser or that external artwork endpoints, touch interactions, and actual PNG downloads work across devices.

## Current verification limits

The source defines portrait exports as **1080 × 1920 pixels (9:16)**. The application and latest GitHub Pages deployment still need a real desktop and mobile browser smoke test to verify visual layout, chart interactions, external image matches, and downloaded PNG rendering. Do not treat static assertions or a passing Node test suite as proof of those browser behaviors.

This is an unofficial fan project and is not affiliated with Spotify.
