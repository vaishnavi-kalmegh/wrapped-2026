/* WRAPPED.exe analytics foundation. No network calls; safe for browser and Node. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WrappedAnalytics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clean = value => String(value == null ? '' : value).trim();
  const first = (row, keys) => {
    for (const key of keys) if (row && row[key] != null && row[key] !== '') return row[key];
    return null;
  };
  const ROW_KEYS = ['items', 'streamingHistory', 'streaming_history', 'endsong', 'records', 'history'];
  const TRACK_KEYS = ['trackName', 'track_name', 'master_metadata_track_name', 'name'];
  const PRIMARY_KEYS = ['master_metadata_album_artist_name', 'album_artist_name', 'albumArtistName', 'artistName', 'artist_name', 'artist'];
  const SECONDARY_KEYS = ['featured_artists', 'featuredArtists', 'secondary_artist_names', 'secondaryArtists', 'contributing_artists', 'contributingArtists'];
  const ALBUM_KEYS = ['master_metadata_album_album_name', 'album_name', 'albumName', 'album'];
  const DURATION_KEYS = ['ms_played', 'msPlayed', 'duration_ms', 'played_duration_ms', 'milliseconds_played'];
  const TIME_KEYS = ['ts', 'endTime', 'end_time', 'timestamp', 'played_at', 'playedAt', 'date', 'end_timestamp'];

  function rowsOf(value) {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== 'object') return [];
    for (const key of ROW_KEYS) if (Array.isArray(value[key])) return value[key];
    return [];
  }
  function parseTimestamp(value) {
    if (value == null || value === '') return null;
    let date;
    if (typeof value === 'number' || (typeof value === 'string' && /^\d{10,13}$/.test(value.trim()))) {
      const n = Number(value);
      date = new Date(n > 0 && n < 1e12 ? n * 1000 : n);
    } else date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.getTime() : null;
  }
  function stringList(value) {
    if (Array.isArray(value)) return value.map(clean).filter(Boolean);
    if (typeof value === 'string' && value.trim()) return [value.trim()];
    return [];
  }
  function normalizeRecord(raw, index) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const timestampValue = first(raw, TIME_KEYS);
    const timestamp = parseTimestamp(timestampValue);
    const track = clean(first(raw, TRACK_KEYS));
    const primaryRaw = first(raw, PRIMARY_KEYS);
    const primaryArtist = clean(Array.isArray(primaryRaw) ? primaryRaw[0] : primaryRaw);
    const secondaryRaw = first(raw, SECONDARY_KEYS);
    const artistArray = Array.isArray(first(raw, ['artistName', 'artist_name', 'artist'])) ? first(raw, ['artistName', 'artist_name', 'artist']) : [];
    const secondaryArtists = [...new Set([...stringList(secondaryRaw), ...artistArray.slice(1).map(clean)].filter(a => a && a !== primaryArtist))];
    const albumRaw = first(raw, ALBUM_KEYS);
    const album = clean(typeof albumRaw === 'object' ? (albumRaw.name || albumRaw.album_name || '') : albumRaw);
    const durationRaw = first(raw, DURATION_KEYS);
    const durationNumber = durationRaw == null ? 0 : Number(durationRaw);
    const durationMs = Number.isFinite(durationNumber) && durationNumber > 0 ? durationNumber : 0;
    const episodeName = clean(first(raw, ['episode_name', 'episodeName', 'master_metadata_episode_name']));
    const audiobookTitle = clean(first(raw, ['audiobook_title', 'audiobookTitle']));
    const contentType = clean(first(raw, ['spotify_episode_uri', 'episode_uri'])) || (episodeName ? 'episode' : audiobookTitle ? 'audiobook' : '');
    const isNonMusic = Boolean(episodeName || audiobookTitle || contentType);
    return {
      index, timestamp, date: timestamp == null ? null : new Date(timestamp).toISOString(),
      track, primaryArtist, secondaryArtists, artists: [...new Set([primaryArtist, ...secondaryArtists].filter(Boolean))],
      album: album || null, durationMs, isEpisode: Boolean(episodeName || /episode/i.test(contentType)),
      isAudiobook: Boolean(audiobookTitle || /audiobook/i.test(contentType)), isNonMusic,
      raw
    };
  }
  function normalizeRecords(rows) {
    const diagnostics = { inputRecords: 0, acceptedRecords: 0, rejectedRecords: 0, invalidTimestamps: 0, missingTrack: 0, missingArtist: 0, missingDuration: 0, excludedNonMusic: 0, ambiguousContent: 0, warnings: [] };
    const records = [];
    for (let i = 0; i < (Array.isArray(rows) ? rows.length : 0); i++) {
      diagnostics.inputRecords++;
      const record = normalizeRecord(rows[i], i);
      if (!record) { diagnostics.rejectedRecords++; continue; }
      records.push(record); diagnostics.acceptedRecords++;
      if (record.timestamp == null) diagnostics.invalidTimestamps++;
      if (!record.track) diagnostics.missingTrack++;
      if (!record.primaryArtist) diagnostics.missingArtist++;
      if (!record.durationMs) diagnostics.missingDuration++;
      if (record.isNonMusic) diagnostics.excludedNonMusic++;
      // We do not guess whether an unlabelled record is music or non-music.
      if (!record.track && !record.primaryArtist && !record.isNonMusic) diagnostics.ambiguousContent++;
    }
    if (diagnostics.rejectedRecords) diagnostics.warnings.push(diagnostics.rejectedRecords + ' non-object record(s) were rejected.');
    if (diagnostics.invalidTimestamps) diagnostics.warnings.push(diagnostics.invalidTimestamps + ' record(s) have missing or invalid timestamps and are excluded from date-filtered analytics.');
    if (diagnostics.missingTrack || diagnostics.missingArtist) diagnostics.warnings.push('Some records lack track or artist metadata; they can contribute to eligible duration totals but cannot enter track rankings without both fields.');
    if (diagnostics.excludedNonMusic) diagnostics.warnings.push(diagnostics.excludedNonMusic + ' episode/audiobook-marked record(s) are excluded from music analytics.');
    if (diagnostics.ambiguousContent) diagnostics.warnings.push(diagnostics.ambiguousContent + ' record(s) have insufficient metadata to classify confidently; they are not labelled as music or non-music.');
    return { records, diagnostics };
  }
  function dateRange(kind, options) {
    const opts = options || {}, now = opts.now == null ? Date.now() : parseTimestamp(opts.now);
    if (kind === 'allTime' || kind === 'all-time' || kind === 'all') return { valid: true, kind: 'allTime', start: null, end: null, label: 'All time' };
    if (kind === 'thisYear' || kind === 'this-year') {
      const y = new Date(now == null ? Date.now() : now).getUTCFullYear();
      return { valid: true, kind: 'thisYear', start: Date.UTC(y, 0, 1), end: Date.UTC(y + 1, 0, 1) - 1, label: 'This year' };
    }
    if (kind === 'last12Months' || kind === 'last-12-months') {
      const end = now == null ? Date.now() : now, d = new Date(end);
      const startDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 12, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()));
      return { valid: true, kind: 'last12Months', start: startDate.getTime(), end, label: 'Last 12 months' };
    }
    if (kind === 'custom') {
      const start = parseDateBoundary(opts.start, false), end = parseDateBoundary(opts.end, true);
      if (start == null || end == null) return { valid: false, error: 'Choose valid start and end dates.' };
      if (start > end) return { valid: false, error: 'Start date must be on or before the end date.' };
      return { valid: true, kind: 'custom', start, end, label: 'Custom range' };
    }
    return { valid: false, error: 'Unknown date range.' };
  }
  function parseDateBoundary(value, endOfDay) {
    if (value == null || value === '') return null;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parts = value.split('-').map(Number);
      return endOfDay ? Date.UTC(parts[0], parts[1] - 1, parts[2] + 1) - 1 : Date.UTC(parts[0], parts[1] - 1, parts[2]);
    }
    const ms = parseTimestamp(value);
    return ms == null ? null : ms;
  }
  function inRange(record, range) {
    if (!range || range.kind === 'allTime' || (range.start == null && range.end == null)) return true;
    if (record.timestamp == null) return false;
    return (range.start == null || record.timestamp >= range.start) && (range.end == null || record.timestamp <= range.end);
  }
  function summarize(input, options) {
    const opts = options || {};
    const normalized = input && input.records && input.diagnostics ? input : normalizeRecords(input);
    const requestedRange = opts.range || null;
    if (requestedRange && requestedRange.valid === false) return { valid: false, error: requestedRange.error, diagnostics: normalized.diagnostics };
    const records = normalized.records.filter(r => inRange(r, requestedRange) && !r.isNonMusic);
    const tm = new Map(), am = new Map(), albums = new Map(), artistNames = new Set(), days = new Map(), months = Array(12).fill(0), hours = Array(24).fill(0);
    let total = 0, plays = 0, events = 0, rankedEvents = 0, undatedDuration = 0;
    const add = (map, key, ms, weight) => { const v = map.get(key) || { plays: 0, ms: 0 }; v.plays += weight; v.ms += ms; map.set(key, v); };
    for (const r of records) {
      if (opts.requireTrackAndArtistForDuration && (!r.track || !r.primaryArtist)) continue;
      total += r.durationMs;
      if (r.timestamp == null) undatedDuration += r.durationMs;
      if (r.timestamp != null) {
        const d = new Date(r.timestamp), day = d.toISOString().slice(0, 10);
        days.set(day, (days.get(day) || 0) + r.durationMs);
        months[d.getUTCMonth()] += r.durationMs;
        hours[d.getUTCHours()] += r.durationMs;
      }
      if (r.timestamp == null || !r.track || !r.primaryArtist) continue;
      events++;
      if (r.durationMs > 30000) {
        plays++; rankedEvents++;
        const trackKey = r.track.toLocaleLowerCase() + '\u0000' + r.primaryArtist.toLocaleLowerCase();
        const track = tm.get(trackKey) || { name: r.track, artist: r.primaryArtist, plays: 0, ms: 0, albumNames: new Set() };
        track.plays++; track.ms += r.durationMs; if (r.album) track.albumNames.add(r.album); tm.set(trackKey, track);
        artistNames.add(r.primaryArtist); add(am, r.primaryArtist, r.durationMs, 1);
        r.secondaryArtists.forEach(a => { artistNames.add(a); add(am, a, r.durationMs, 0.5); });
        if (r.album) add(albums, r.album.toLocaleLowerCase() + '\u0000' + r.primaryArtist.toLocaleLowerCase(), r.durationMs, 1);
      }
    }
    const tracks = [...tm.values()].sort((a,b)=>b.plays-a.plays||b.ms-a.ms||a.name.localeCompare(b.name)).map(t=>({...t, albumNames:[...t.albumNames], album:t.albumNames.size===1?[...t.albumNames][0]:null}));
    const artists = [...am.entries()].map(([name,v])=>({name,...v})).sort((a,b)=>b.plays-a.plays||b.ms-a.ms||a.name.localeCompare(b.name));
    const albumRankings = [...albums.entries()].map(([key,v])=>{const [album,artist]=key.split('\u0000');return {album,artist,...v}}).sort((a,b)=>b.plays-a.plays||b.ms-a.ms||a.album.localeCompare(b.album));
    const maxDay = [...days.entries()].sort((a,b)=>b[1]-a[1])[0] || null;
    return { valid:true, range:requestedRange || {valid:true,kind:'allTime',start:null,end:null,label:'All time'}, records, tracks, artists, albums:albumRankings, artistNames, days, months, hours, total, plays, events, rankedEvents, activeDays:days.size, maxDay, maxMonth:months.indexOf(Math.max(...months)), undatedDuration, diagnostics:normalized.diagnostics };
  }
  function inspectFiles(fileResults) {
    const diagnostics = { filesSelected: fileResults.length, filesParsed: 0, invalidFiles: [], emptyFiles: [], acceptedRecords: 0, rejectedRecords: 0, invalidTimestamps: 0, missingTrack: 0, missingArtist: 0, missingDuration: 0, excludedNonMusic: 0, ambiguousContent: 0, warnings: [] };
    const rows = [];
    for (const result of fileResults) {
      if (!result || result.error) { diagnostics.invalidFiles.push({name:result && result.name || 'unknown file',reason:result && result.error || 'Invalid file'}); continue; }
      const found = rowsOf(result.data);
      if (!found.length) { diagnostics.emptyFiles.push(result.name || 'unnamed file'); continue; }
      diagnostics.filesParsed++; rows.push(...found);
    }
    const parsed = normalizeRecords(rows).diagnostics;
    for (const key of ['acceptedRecords','rejectedRecords','invalidTimestamps','missingTrack','missingArtist','missingDuration','excludedNonMusic','ambiguousContent']) diagnostics[key] = parsed[key];
    diagnostics.warnings = [...parsed.warnings];
    if (diagnostics.invalidFiles.length) diagnostics.warnings.unshift(diagnostics.invalidFiles.length + ' file(s) contained invalid JSON or could not be read.');
    if (diagnostics.emptyFiles.length) diagnostics.warnings.push(diagnostics.emptyFiles.length + ' file(s) had no recognized history array.');
    return { rows, diagnostics };
  }
  return { rowsOf, parseTimestamp, normalizeRecord, normalizeRecords, dateRange, inRange, summarize, inspectFiles };
});
