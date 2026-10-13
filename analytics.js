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

  function inspectStructure(value) {
    if (Array.isArray(value)) return { recognized: true, rows: value };
    if (!value || typeof value !== 'object') return { recognized: false, rows: [] };
    for (const key of ROW_KEYS) {
      if (Array.isArray(value[key])) return { recognized: true, rows: value[key] };
    }
    return { recognized: false, rows: [] };
  }
  function rowsOf(value) {
    return inspectStructure(value).rows;
  }
  function parseTimestamp(value) {
    if (value == null || value === '') return null;
    if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
    let date;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return null;
      date = new Date(value > 0 && value < 1e12 ? value * 1000 : value);
    } else if (typeof value === 'string') {
      const text = value.trim();
      if (!text) return null;
      if (/^\d+$/.test(text)) {
        if (!/^\d{10,13}$/.test(text)) return null;
        const n = Number(text);
        date = new Date(n > 0 && n < 1e12 ? n * 1000 : n);
      } else date = new Date(text);
    } else return null;
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
    const album = clean(albumRaw != null && typeof albumRaw === 'object' ? (albumRaw.name || albumRaw.album_name || '') : albumRaw);
    const durationRaw = first(raw, DURATION_KEYS);
    const durationMissing = durationRaw == null || (typeof durationRaw === 'string' && !durationRaw.trim());
    const durationNumber = durationMissing ? 0 : (typeof durationRaw === 'number' || typeof durationRaw === 'string') ? Number(durationRaw) : NaN;
    const durationStatus = durationMissing ? 'missing' : !Number.isFinite(durationNumber) || durationNumber < 0 ? 'invalid' : durationNumber === 0 ? 'zero' : 'valid';
    const durationMs = durationStatus === 'valid' ? durationNumber : 0;
    const episodeName = clean(first(raw, ['episode_name', 'episodeName', 'master_metadata_episode_name']));
    const audiobookTitle = clean(first(raw, ['audiobook_title', 'audiobookTitle']));
    const contentType = clean(first(raw, ['spotify_episode_uri', 'episode_uri'])) || (episodeName ? 'episode' : audiobookTitle ? 'audiobook' : '');
    const isNonMusic = Boolean(episodeName || audiobookTitle || contentType);
    return {
      index, timestamp, date: timestamp == null ? null : new Date(timestamp).toISOString(),
      track, primaryArtist, secondaryArtists, artists: [...new Set([primaryArtist, ...secondaryArtists].filter(Boolean))],
      album: album || null, durationMs, durationStatus, isEpisode: Boolean(episodeName || /episode/i.test(contentType)),
      isAudiobook: Boolean(audiobookTitle || /audiobook/i.test(contentType)), isNonMusic,
      raw
    };
  }
  function normalizeRecords(rows) {
    const diagnostics = { inputRecords: 0, acceptedRecords: 0, rejectedRecords: 0, invalidTimestamps: 0, missingTrack: 0, missingArtist: 0, missingDuration: 0, invalidDuration: 0, zeroDuration: 0, excludedNonMusic: 0, ambiguousContent: 0, warnings: [] };
    const records = [];
    for (let i = 0; i < (Array.isArray(rows) ? rows.length : 0); i++) {
      diagnostics.inputRecords++;
      const record = normalizeRecord(rows[i], i);
      if (!record) { diagnostics.rejectedRecords++; continue; }
      records.push(record); diagnostics.acceptedRecords++;
      if (record.timestamp == null) diagnostics.invalidTimestamps++;
      if (!record.track) diagnostics.missingTrack++;
      if (!record.primaryArtist) diagnostics.missingArtist++;
      if (record.durationStatus === 'missing') diagnostics.missingDuration++;
      if (record.durationStatus === 'invalid') diagnostics.invalidDuration++;
      if (record.durationStatus === 'zero') diagnostics.zeroDuration++;
      if (record.isNonMusic) diagnostics.excludedNonMusic++;
      // We do not guess whether an unlabelled record is music or non-music.
      if (!record.track && !record.primaryArtist && !record.isNonMusic) diagnostics.ambiguousContent++;
    }
    if (diagnostics.rejectedRecords) diagnostics.warnings.push(diagnostics.rejectedRecords + ' non-object record(s) were rejected.');
    if (diagnostics.invalidTimestamps) diagnostics.warnings.push(diagnostics.invalidTimestamps + ' record(s) have missing or invalid timestamps and are excluded from date-filtered analytics.');
    if (diagnostics.missingTrack || diagnostics.missingArtist) diagnostics.warnings.push('Some records lack track or artist metadata; they can contribute to eligible duration totals but cannot enter track rankings without both fields.');
    if (diagnostics.missingDuration) diagnostics.warnings.push(diagnostics.missingDuration + ' record(s) have no recorded duration value.');
    if (diagnostics.invalidDuration) diagnostics.warnings.push(diagnostics.invalidDuration + ' record(s) have malformed or negative duration values; their duration is treated as zero.');
    if (diagnostics.zeroDuration) diagnostics.warnings.push(diagnostics.zeroDuration + ' record(s) have a recorded duration of zero milliseconds.');
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
      const targetYear = d.getUTCFullYear() - 1, targetMonth = d.getUTCMonth();
      const day = Math.min(d.getUTCDate(), new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate());
      const startDate = Date.UTC(targetYear, targetMonth, day, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds());
      return { valid: true, kind: 'last12Months', start: startDate, end, label: 'Last 12 months' };
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
      const check = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      if (check.getUTCFullYear() !== parts[0] || check.getUTCMonth() !== parts[1] - 1 || check.getUTCDate() !== parts[2]) return null;
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
    const isNormalizedArray = Array.isArray(input) && input.length > 0 && input.every(r => r && typeof r === 'object' && Object.prototype.hasOwnProperty.call(r, 'durationMs') && Object.prototype.hasOwnProperty.call(r, 'primaryArtist') && Object.prototype.hasOwnProperty.call(r, 'timestamp'));
    const normalized = input && input.records && input.diagnostics ? input : isNormalizedArray ? { records: input, diagnostics: { inputRecords: input.length, acceptedRecords: input.length, rejectedRecords: 0, invalidTimestamps: input.filter(r => r.timestamp == null).length, missingTrack: input.filter(r => !r.track).length, missingArtist: input.filter(r => !r.primaryArtist).length, missingDuration: input.filter(r => r.durationStatus === 'missing' || (!r.durationStatus && !r.durationMs)).length, invalidDuration: input.filter(r => r.durationStatus === 'invalid').length, zeroDuration: input.filter(r => r.durationStatus === 'zero').length, excludedNonMusic: input.filter(r => r.isNonMusic).length, ambiguousContent: 0, warnings: [] } } : normalizeRecords(input);
    const requestedRange = opts.range || null;
    if (requestedRange && requestedRange.valid === false) return { valid: false, error: requestedRange.error, diagnostics: normalized.diagnostics };
    const records = normalized.records.filter(r => inRange(r, requestedRange) && !r.isNonMusic);
    const tm = new Map(), am = new Map(), albums = new Map(), artistNames = new Set(), days = new Map(), months = Array(12).fill(0), monthsByYear = new Map(), hours = Array(24).fill(0);
    let total = 0, plays = 0, events = 0, rankedEvents = 0, undatedDuration = 0, timestampedRecords = 0, durationRecords = 0;
    const add = (map, key, label, ms, weight, qualifies) => {
      const v = map.get(key) || { name: label, plays: 0, ms: 0 };
      v.ms += ms;
      if (qualifies) v.plays += weight;
      map.set(key, v);
    };
    for (const r of records) {
      if (opts.requireTrackAndArtistForDuration && (!r.track || !r.primaryArtist)) continue;
      total += r.durationMs;
      if (r.durationMs > 0) durationRecords++;
      if (r.timestamp == null) undatedDuration += r.durationMs;
      if (r.timestamp != null) {
        timestampedRecords++;
        const d = new Date(r.timestamp), day = d.toISOString().slice(0, 10), monthKey = day.slice(0, 7);
        days.set(day, (days.get(day) || 0) + r.durationMs);
        months[d.getUTCMonth()] += r.durationMs;
        monthsByYear.set(monthKey, (monthsByYear.get(monthKey) || 0) + r.durationMs);
        hours[d.getUTCHours()] += r.durationMs;
      }
      if ((requestedRange && requestedRange.kind !== 'allTime' && r.timestamp == null) || !r.track || !r.primaryArtist) continue;
      events++;
      const qualifies = r.durationMs > 30000;
      if (qualifies) { plays++; rankedEvents++; artistNames.add(r.primaryArtist); }
      const trackKey = r.track.toLocaleLowerCase() + '\u0000' + r.primaryArtist.toLocaleLowerCase();
      const track = tm.get(trackKey) || { name: r.track, artist: r.primaryArtist, plays: 0, ms: 0, albumNames: new Set(), artistNames: new Set([r.primaryArtist]) };
      track.ms += r.durationMs;
      if (qualifies) track.plays++;
      if (r.album) track.albumNames.add(r.album);
      r.secondaryArtists.forEach(a => track.artistNames.add(a));
      tm.set(trackKey, track);
      add(am, r.primaryArtist.toLocaleLowerCase(), r.primaryArtist, r.durationMs, 1, qualifies);
      r.secondaryArtists.forEach(a => { if (qualifies) artistNames.add(a); add(am, a.toLocaleLowerCase(), a, r.durationMs, 0.5, qualifies); });
      if (r.album) {
        const albumKey = r.album.toLocaleLowerCase() + '\u0000' + r.primaryArtist.toLocaleLowerCase();
        const entry = albums.get(albumKey) || { album: r.album, artist: r.primaryArtist, plays: 0, ms: 0 };
        entry.ms += r.durationMs;
        if (qualifies) entry.plays++;
        albums.set(albumKey, entry);
      }
    }
    const tracks = [...tm.values()].filter(t=>opts.includeUnqualifiedGroups || t.plays>0).sort((a,b)=>b.plays-a.plays||b.ms-a.ms||a.name.localeCompare(b.name)).map(t=>({...t, albumNames:[...t.albumNames], artistNames:[...t.artistNames], album:t.albumNames.size===1?[...t.albumNames][0]:null}));
    const artists = [...am.values()].filter(a=>opts.includeUnqualifiedGroups || a.plays>0).sort((a,b)=>b.plays-a.plays||b.ms-a.ms||a.name.localeCompare(b.name));
    const albumRankings = [...albums.values()].filter(a=>opts.includeUnqualifiedGroups || a.plays>0).sort((a,b)=>b.plays-a.plays||b.ms-a.ms||a.album.localeCompare(b.album));
    const maxDay = [...days.entries()].sort((a,b)=>b[1]-a[1])[0] || null;
    return { valid:true, range:requestedRange || {valid:true,kind:'allTime',start:null,end:null,label:'All time'}, records, tracks, artists, albums:albumRankings, artistNames, days, months, monthsByYear, hours, total, plays, events, rankedEvents, activeDays:days.size, maxDay, maxMonth:months.indexOf(Math.max(...months)), undatedDuration, timestampedRecords, durationRecords, diagnostics:normalized.diagnostics };
  }
  function inspectFiles(fileResults) {
    const results = Array.isArray(fileResults) ? fileResults : [];
    const diagnostics = { filesSelected: results.length, filesParsed: 0, invalidFiles: [], unrecognizedFiles: [], emptyFiles: [], possibleDuplicateFiles: [], acceptedRecords: 0, rejectedRecords: 0, invalidTimestamps: 0, missingTrack: 0, missingArtist: 0, missingDuration: 0, invalidDuration: 0, zeroDuration: 0, excludedNonMusic: 0, ambiguousContent: 0, warnings: [] };
    const rows = [];
    const fileSignatures = new Set();
    for (const result of results) {
      if (result && result.name && result.size != null && result.lastModified != null) {
        const signature = [result.name, result.size, result.lastModified].join('\\u0000');
        if (fileSignatures.has(signature)) diagnostics.possibleDuplicateFiles.push(result.name);
        else fileSignatures.add(signature);
      }
      if (!result || result.error) { diagnostics.invalidFiles.push({name:result && result.name || 'unknown file',reason:result && result.error || 'Invalid file'}); continue; }
      const structure = inspectStructure(result.data);
      if (!structure.recognized) { diagnostics.unrecognizedFiles.push(result.name || 'unnamed file'); continue; }
      diagnostics.filesParsed++;
      if (!structure.rows.length) diagnostics.emptyFiles.push(result.name || 'unnamed file');
      rows.push(...structure.rows);
    }
    const parsed = normalizeRecords(rows).diagnostics;
    for (const key of ['acceptedRecords','rejectedRecords','invalidTimestamps','missingTrack','missingArtist','missingDuration','invalidDuration','zeroDuration','excludedNonMusic','ambiguousContent']) diagnostics[key] = parsed[key];
    diagnostics.warnings = [...parsed.warnings];
    if (diagnostics.invalidFiles.length) diagnostics.warnings.unshift(diagnostics.invalidFiles.length + ' file(s) contained invalid JSON or could not be read.');
    if (diagnostics.unrecognizedFiles.length) diagnostics.warnings.push(diagnostics.unrecognizedFiles.length + ' file(s) did not contain a recognized Spotify history array.');
    if (diagnostics.emptyFiles.length) diagnostics.warnings.push(diagnostics.emptyFiles.length + ' recognized history file(s) contained zero records.');
    if (diagnostics.possibleDuplicateFiles.length) diagnostics.warnings.push('Possible duplicate file selection: ' + [...new Set(diagnostics.possibleDuplicateFiles)].join(', ') + '. These files were retained; check the selection if totals look doubled. Listening events are never deduplicated automatically.');
    return { rows, diagnostics };
  }
  function sortEvents(records, direction) {
    const sign = direction === 'asc' ? 1 : -1;
    return [...(Array.isArray(records) ? records : [])].sort((a,b) => {
      if (a.timestamp == null && b.timestamp == null) return (a.index ?? 0) - (b.index ?? 0);
      if (a.timestamp == null) return 1;
      if (b.timestamp == null) return -1;
      return sign * (a.timestamp - b.timestamp) || (a.index ?? 0) - (b.index ?? 0);
    });
  }

  function milestoneBadges(summary) {
    const s=summary||{};
    const metrics=[
      {key:'minutes',label:'Listening time',value:Math.floor((s.total||0)/60000),unit:'minutes',thresholds:[60,300,1000,5000,10000]},
      {key:'plays',label:'Qualifying plays',value:s.plays||0,unit:'plays',thresholds:[10,100,500,1000,5000]},
      {key:'tracks',label:'Track groups',value:(s.tracks||[]).filter(t=>t.plays>0).length,unit:'tracks',thresholds:[10,50,100,500,1000]},
      {key:'artists',label:'Artists heard',value:(s.artistNames||new Set()).size,unit:'artists',thresholds:[10,25,50,100,250]}
    ];
    return metrics.map(m=>({...m,earned:m.thresholds.filter(n=>m.value>=n),next:m.thresholds.find(n=>m.value<n)||null}));
  }
  function listeningStreaks(input, options) {
    const n=input&&input.records&&input.diagnostics?input:normalizeRecords(input),range=options&&options.range,active=new Set();
    n.records.forEach(r=>{if(!r.isNonMusic&&r.timestamp!=null&&r.durationMs>0&&inRange(r,range))active.add(new Date(r.timestamp).toISOString().slice(0,10));});
    const dates=[...active].sort();let longest={days:0,start:null,end:null},current={days:0,start:null,end:null},previous=null;
    for(const day of dates){const d=Date.parse(day+'T00:00:00Z');current=previous!=null&&d-previous===86400000?{days:current.days+1,start:current.start,end:day}:{days:1,start:day,end:day};if(current.days>longest.days)longest={...current};previous=d;}
    const latest=dates[dates.length-1]||null;let currentDays=0,cursor=latest;
    while(cursor&&active.has(cursor)){currentDays++;const d=new Date(cursor+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-1);cursor=d.toISOString().slice(0,10);}
    return {activeDays:dates.length,longest,current:{days:currentDays,end:currentDays?latest:null},dates};
  }
  function firstObserved(input, options) {
    const n=input&&input.records&&input.diagnostics?input:normalizeRecords(input),range=options&&options.range,tracks=new Map(),artists=new Map();
    const keep=(map,key,label,r)=>{if(!key||r.timestamp==null||r.isNonMusic||!inRange(r,range))return;const old=map.get(key);if(!old||r.timestamp<old.timestamp)map.set(key,{name:label,timestamp:r.timestamp,date:new Date(r.timestamp).toISOString().slice(0,10)});};
    n.records.forEach(r=>{if(r.durationMs<=0)return;if(r.track&&r.primaryArtist)keep(tracks,r.track.toLocaleLowerCase()+'\u0000'+r.primaryArtist.toLocaleLowerCase(),r.track,r);r.artists.forEach(a=>keep(artists,a.toLocaleLowerCase(),a,r));});
    const sort=map=>[...map.values()].sort((a,b)=>a.timestamp-b.timestamp||a.name.localeCompare(b.name));
    return {tracks:sort(tracks),artists:sort(artists)};
  }
  function artistConcentration(input, options) {
    const n=input&&input.records&&input.diagnostics?input:normalizeRecords(input),range=options&&options.range,totals=new Map();let total=0;
    n.records.forEach(r=>{if(r.isNonMusic||!r.primaryArtist||!inRange(r,range))return;total+=r.durationMs;const key=r.primaryArtist.toLocaleLowerCase(),v=totals.get(key)||{name:r.primaryArtist,ms:0};v.ms+=r.durationMs;totals.set(key,v);});
    const ranked=[...totals.values()].sort((a,b)=>b.ms-a.ms||a.name.localeCompare(b.name)),topMs=ranked.slice(0,5).reduce((sum,a)=>sum+a.ms,0);
    return {totalPrimaryArtistMs:total,artists:ranked.map(a=>({...a,share:total?a.ms/total:0})),topArtistShare:total?(ranked[0]?.ms||0)/total:0,topFiveShare:total?topMs/total:0};
  }
  function comparePeriods(input, rangeA, rangeB) {
    const a=summarize(input,{range:rangeA,includeUnqualifiedGroups:true}),b=summarize(input,{range:rangeB,includeUnqualifiedGroups:true});
    if(!a.valid||!b.valid)return {valid:false,error:a.error||b.error};
    const metrics=[['listeningMs',a.total,b.total],['qualifyingPlays',a.plays,b.plays],['activeDays',a.activeDays,b.activeDays],['trackGroups',a.tracks.length,b.tracks.length],['artistGroups',a.artists.length,b.artists.length]];
    return {valid:true,a:{range:a.range,summary:a},b:{range:b.range,summary:b},metrics:metrics.map(([key,previous,current])=>({key,a:previous,b:current,delta:current-previous,changePercent:previous===0?null:(current-previous)/previous*100}))};
  }
  return { rowsOf, parseTimestamp, normalizeRecord, normalizeRecords, dateRange, inRange, summarize, inspectFiles, sortEvents, milestoneBadges, listeningStreaks, firstObserved, artistConcentration, comparePeriods };
});
