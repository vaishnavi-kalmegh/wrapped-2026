const $ = (id) => document.getElementById(id);
const YEAR = 2026;
const fmt = (n) => new Intl.NumberFormat().format(n);
const clean = (value) => String(value ?? "").trim();
function getDate(row) {
  const raw = row.endTime ?? row.end_time ?? row.timestamp ?? row.played_at;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}
function getTrack(row) {
  return clean(row.trackName ?? row.track_name ?? row.master_metadata_track_name ?? row.name);
}
function getArtist(row) {
  const raw = row.artistName ?? row.artist_name ?? row.master_metadata_album_artist_name ?? row.artist;
  if (Array.isArray(raw)) return raw.map(clean).filter(Boolean);
  return clean(raw) ? [clean(raw)] : [];
}
function getDuration(row) {
  const n = Number(row.msPlayed ?? row.ms_played ?? row.ms_played ?? row.duration_ms ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function getAlbum(row) {
  return clean(row.albumName ?? row.album_name ?? row.master_metadata_album_album_name);
}
function isTrackPlay(row) {
  return Boolean(getTrack(row)) && !row.episode_name && !row.audiobook_title;
}
function makeCounter() { return new Map(); }
function bump(map, key, duration) {
  const old = map.get(key) || { plays: 0, ms: 0 };
  old.plays += 1; old.ms += duration; map.set(key, old);
}
function ranked(map) {
  return [...map.entries()].sort((a,b) => b[1].plays-a[1].plays || b[1].ms-a[1].ms || a[0].localeCompare(b[0]));
}
function renderRankings(targetId, rows, kind) {
  const target = $(targetId);
  target.replaceChildren();
  if (!rows.length) {
    const li = document.createElement('li'); li.className='empty-row';
    li.textContent='No matching 2026 records found in the selected files.'; target.append(li); return;
  }
  rows.slice(0,5).forEach(([name, data]) => {
    const li = document.createElement('li');
    const wrap = document.createElement('div');
    const title = document.createElement('span'); title.className='rank-name'; title.textContent=name;
    const sub = document.createElement('span'); sub.className='rank-sub';
    sub.textContent = kind === 'artist' ? 'artist play events' : 'recorded play events';
    title.append(sub); wrap.append(title);
    const count = document.createElement('span'); count.className='rank-count'; count.textContent=fmt(data.plays)+' plays';
    li.append(wrap,count); target.append(li);
  });
}
function renderHistory(rows, fileCount) {
  const tracks = new Map(), artists = new Map(), artistNames = new Set();
  let totalMs = 0, eligibleRows = 0;
  for (const row of rows) {
    const date = getDate(row);
    if (!date || date.getFullYear() !== YEAR || !isTrackPlay(row)) continue;
    const track = getTrack(row);
    const names = getArtist(row);
    if (!track || !names.length) continue;
    const ms = getDuration(row);
    eligibleRows += 1; totalMs += ms;
    bump(tracks, track + '\u0000' + names.join(', '), ms);
    for (const artist of names) { artistNames.add(artist); bump(artists, artist, ms); }
  }
  const trackRank = ranked(tracks).map(([key, data]) => [key.split('\u0000')[0] + ' — ' + key.split('\u0000').slice(1).join('\u0000'), data]);
  const artistRank = ranked(artists);
  $('minutesStat').textContent = fmt(Math.floor(totalMs/60000));
  $('hoursStat').textContent = (totalMs/3600000).toFixed(1) + ' hours recorded';
  $('artistsStat').textContent = fmt(artistNames.size);
  $('playsStat').textContent = fmt(eligibleRows);
  $('topTrackStat').textContent = trackRank.length ? trackRank[0][0].split(' — ')[0] : 'No track data';
  $('topTrackArtist').textContent = trackRank.length ? trackRank[0][0].split(' — ').slice(1).join(' — ') : 'Check selected JSON files';
  $('dataBadge').textContent = eligibleRows ? '2026 DATA LOADED' : 'NO 2026 PLAYS FOUND';
  renderRankings('topArtists', artistRank, 'artist');
  renderRankings('topTracks', trackRank, 'track');
  $('fileStatus').textContent = 'Processed ' + fileCount + ' JSON file(s). Found ' + fmt(eligibleRows) + ' eligible track-play events dated in 2026.';
}
$('historyFiles').addEventListener('change', async (event) => {
  const files = [...event.target.files];
  if (!files.length) return;
  $('fileStatus').textContent = 'Reading selected files locally…';
  const allRows = [];
  const errors = [];
  for (const file of files) {
    try {
      const parsed = JSON.parse(await file.text());
      if (Array.isArray(parsed)) allRows.push(...parsed);
      else if (Array.isArray(parsed.items)) allRows.push(...parsed.items);
      else errors.push(file.name + ': JSON did not contain a recognized array');
    } catch { errors.push(file.name + ': could not parse JSON'); }
  }
  if (!allRows.length) {
    $('fileStatus').textContent = 'No history rows could be read. Choose Spotify streaming-history JSON files. ' + errors.join(' · ');
    return;
  }
  renderHistory(allRows, files.length);
  if (errors.length) $('fileStatus').textContent += ' Skipped: ' + errors.join(' · ');
});
$('buildLife').addEventListener('click', () => {
  const lines = $('lifeNotes').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const out = $('lifeOutput'); out.replaceChildren(); out.hidden = false;
  const title = document.createElement('h3');
  title.textContent = lines.length ? 'THE LORE, AS SUBMITTED.' : 'THE LORE IS CURRENTLY LOADING…';
  out.append(title);
  if (!lines.length) {
    const p = document.createElement('p'); p.textContent='Add one or more memories above. We will only recap details you actually enter.'; out.append(p); return;
  }
  const p = document.createElement('p'); p.textContent='Your recap contains ' + lines.length + ' item' + (lines.length===1?'':'s') + ' you entered. No extra life events were inferred.'; out.append(p);
  const ul = document.createElement('ul');
  lines.forEach(line=>{const li=document.createElement('li');li.textContent=line;ul.append(li)});
  out.append(ul);
});
