'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../analytics.js');
const row = (ts, trackName, artistName, ms_played, extra = {}) => ({ ts, trackName, artistName, ms_played, ...extra });
const custom = (start, end) => A.dateRange('custom', { start, end });

test('single valid file preserves track, album, duration and source fields', () => {
  const p = A.normalizeRecords([{ts:'2026-01-02T12:00:00Z',master_metadata_track_name:'Track',master_metadata_album_artist_name:'Artist',ms_played:45000,master_metadata_album_album_name:'Album',shuffle:true}]);
  assert.equal(p.diagnostics.acceptedRecords,1); assert.equal(p.records[0].album,'Album'); assert.equal(p.records[0].raw.shuffle,true);
});
test('multiple files and years are accepted', () => {
  const x=A.inspectFiles([{name:'a.json',data:[row('2022-01-01T00:00:00Z','Old','A',40000)]},{name:'b.json',data:{streaming_history:[row('2026-01-01T00:00:00Z','New','B',50000)]}}]);
  assert.equal(x.diagnostics.filesParsed,2); assert.equal(A.summarize(x.rows).events,2);
});
test('lifetime totals combine records from several years', () => {
  const s=A.summarize([row('2021-01-01T00:00:00Z','A','A',40000),row('2024-01-01T00:00:00Z','B','B',50000),row('2026-01-01T00:00:00Z','C','C',60000)]);
  assert.equal(s.total,150000); assert.equal(s.plays,3);
});
test('2026 Wrapped date window preserves inclusive Jan 1 through Nov 15 UTC cutoff', () => {
  const s=A.summarize([row('2025-12-31T23:59:59Z','Before','A',50000),row('2026-01-01T00:00:00Z','Start','A',50000),row('2026-11-15T23:59:59.999Z','Last','B',50000),row('2026-11-16T00:00:00Z','After','C',50000)],{range:custom('2026-01-01','2026-11-15'),requireTrackAndArtistForDuration:true});
  assert.equal(s.events,2); assert.equal(s.total,100000);
});
test('custom date range excludes out-of-range records and includes end calendar day', () => {
  const s=A.summarize([row('2025-12-31T23:59:59Z','A','A',40000),row('2026-01-01T00:00:00Z','B','A',40000),row('2026-01-02T23:59:59.999Z','C','A',40000),row('2026-01-03T00:00:00Z','D','A',40000)],{range:custom('2026-01-01','2026-01-02')});
  assert.equal(s.events,2); assert.equal(s.total,80000);
});
test('qualifying play threshold is strictly greater than 30000 ms', () => {
  const s=A.summarize([row('2026-01-01T00:00:00Z','Exactly','A',30000),row('2026-01-01T00:01:00Z','Over','A',30001)]);
  assert.equal(s.plays,1); assert.equal(s.total,60001);
});
test('short events contribute duration but not qualifying rankings', () => {
  const s=A.summarize([row('2026-01-01T00:00:00Z','Skip','A',12000)]);
  assert.equal(s.total,12000); assert.equal(s.events,1); assert.equal(s.plays,0); assert.equal(s.tracks.length,0);
});
test('primary and secondary artists are weighted; missing secondary metadata is safe', () => {
  const s=A.summarize([row('2026-01-01T00:00:00Z','Collab','Lead',60000,{featured_artists:['Guest']}),row('2026-01-02T00:00:00Z','Solo','Solo Artist',45000)]);
  assert.equal(s.artists.find(x=>x.name==='Lead').plays,1); assert.equal(s.artists.find(x=>x.name==='Guest').plays,0.5); assert.equal(s.artists.find(x=>x.name==='Solo Artist').plays,1); assert.ok(s.tracks.find(x=>x.name==='Collab').artistNames.includes('Guest'));
});
test('same title by different artists stays in separate track groups', () => {
  const s=A.summarize([row('2026-01-01T00:00:00Z','Home','Artist A',45000),row('2026-01-02T00:00:00Z','Home','Artist B',45000)]);
  assert.equal(s.tracks.length,2); assert.deepEqual(new Set(s.tracks.map(x=>x.artist)),new Set(['Artist A','Artist B']));
});
test('invalid JSON and unexpected structures report diagnostics without crashing', () => {
  const x=A.inspectFiles([{name:'bad.json',error:'Invalid JSON'},{name:'unknown.json',data:{notHistory:{}}},{name:'ok.json',data:[row('2026-01-01T00:00:00Z','OK','A',40000)]}]);
  assert.equal(x.diagnostics.invalidFiles.length,1); assert.deepEqual(x.diagnostics.unrecognizedFiles,['unknown.json']); assert.deepEqual(x.diagnostics.emptyFiles,[]); assert.equal(x.rows.length,1);
});
test('invalid timestamps, missing track/artist metadata and malformed rows are diagnosed', () => {
  const p=A.normalizeRecords([row('not-a-date','No Date','Artist',40000),{ts:'2026-01-01T00:00:00Z',ms_played:70000},null]);
  assert.equal(p.diagnostics.invalidTimestamps,1); assert.equal(p.diagnostics.missingTrack,1); assert.equal(p.diagnostics.missingArtist,1); assert.equal(p.diagnostics.rejectedRecords,1);
  assert.equal(A.summarize(p.records).total,110000); assert.equal(A.summarize(p.records,{range:custom('2026-01-01','2026-12-31')}).total,70000);
});
test('empty imports and ranges with no matching records return zero summaries', () => {
  assert.equal(A.inspectFiles([{name:'empty.json',data:[]}]).rows.length,0);
  const s=A.summarize([row('2020-01-01T00:00:00Z','Old','A',50000)],{range:custom('2026-01-01','2026-12-31')});
  assert.equal(s.events,0); assert.equal(s.total,0); assert.equal(s.tracks.length,0);
});
test('duplicate-looking events are preserved as separate legitimate plays', () => {
  const r=row('2026-01-01T00:00:00Z','Repeat','A',45000),s=A.summarize([r,{...r}]);
  assert.equal(s.plays,2); assert.equal(s.tracks[0].plays,2);
});
test('all-time and complete date range totals match for dated eligible records', () => {
  const rows=[row('2021-01-01T00:00:00Z','One','A',40000),row('2023-05-01T00:00:00Z','Two','B',25000),row('2026-10-01T00:00:00Z','Three','C',60000),row('2024-01-01T00:00:00Z','Podcast','Narrator',90000,{episode_name:'Episode'})];
  const all=A.summarize(rows),ranged=A.summarize(rows,{range:custom('2021-01-01','2026-12-31')});
  assert.equal(all.total,125000); assert.equal(ranged.total,all.total); assert.equal(ranged.plays,all.plays);
});
test('custom ranges reject reversed and impossible calendar dates', () => {
  assert.equal(custom('2026-02-02','2026-02-01').valid,false); assert.equal(custom('2026-02-31','2026-03-01').valid,false);
});
test('this-year and last-12-month presets use a supplied current date', () => {
  const y=A.dateRange('thisYear',{now:'2026-06-15T12:00:00Z'}); assert.equal(new Date(y.start).toISOString(),'2026-01-01T00:00:00.000Z');
  assert.equal(new Date(y.end).toISOString(),'2026-12-31T23:59:59.999Z');
  const r=A.dateRange('last12Months',{now:'2026-10-13T12:00:00Z'}); assert.equal(new Date(r.start).toISOString(),'2025-10-13T12:00:00.000Z');
});


test('track and album recorded time includes short events while play counts require over 30 seconds', () => {
  const s=A.summarize([
    row('2026-01-01T00:00:00Z','Mix','Artist',60000,{master_metadata_album_album_name:'Album'}),
    row('2026-01-01T00:01:00Z','Mix','Artist',10000,{master_metadata_album_album_name:'Album'}),
    row('2026-01-01T00:02:00Z','Short only','Other',20000,{master_metadata_album_album_name:'Short Album'})
  ]);
  assert.equal(s.tracks.length,1);
  assert.equal(s.tracks[0].plays,1);
  assert.equal(s.tracks[0].ms,70000);
  assert.equal(s.albums.length,1);
  assert.equal(s.albums[0].ms,70000);
});
test('track and album rankings sort by qualifying plays then recorded duration', () => {
  const s=A.summarize([
    row('2026-01-01T00:00:00Z','Less plays','A',40000,{master_metadata_album_album_name:'A1'}),
    row('2026-01-02T00:00:00Z','More plays','B',40000,{master_metadata_album_album_name:'B1'}),
    row('2026-01-03T00:00:00Z','More plays','B',45000,{master_metadata_album_album_name:'B1'})
  ]);
  assert.equal(s.tracks[0].name,'More plays');
  assert.equal(s.albums[0].album,'B1');
});
test('album groups preserve display metadata and separate same title by artist', () => {
  const s=A.summarize([
    row('2026-01-01T00:00:00Z','One','Artist A',40000,{master_metadata_album_album_name:'Shared Album'}),
    row('2026-01-02T00:00:00Z','Two','Artist B',50000,{master_metadata_album_album_name:'Shared Album'})
  ]);
  assert.equal(s.albums.length,2);
  assert.deepEqual(new Set(s.albums.map(x=>x.artist)),new Set(['Artist A','Artist B']));
  assert.equal(s.albums.find(x=>x.artist==='Artist A').album,'Shared Album');
});
test('multi-year month buckets retain year and respect date filters', () => {
  const rows=[row('2024-01-02T12:00:00Z','Old','A',40000),row('2025-01-02T12:00:00Z','Middle','B',50000),row('2026-01-02T12:00:00Z','Now','C',60000)];
  const all=A.summarize(rows),filtered=A.summarize(rows,{range:custom('2025-01-01','2026-12-31')});
  assert.equal(all.monthsByYear.get('2024-01'),40000);
  assert.equal(all.monthsByYear.get('2025-01'),50000);
  assert.equal(all.monthsByYear.get('2026-01'),60000);
  assert.equal(filtered.total,110000);
  assert.equal(filtered.monthsByYear.has('2024-01'),false);
});
test('chronological event sorting puts newest dated events first and undated records last', () => {
  const normalized=A.normalizeRecords([
    row('2026-01-01T00:00:00Z','Old','A',40000),
    row('not-a-date','Undated','A',40000),
    row('2026-03-01T00:00:00Z','New','A',40000)
  ]).records;
  assert.deepEqual(A.sortEvents(normalized).map(x=>x.track),['New','Old','Undated']);
  assert.deepEqual(A.sortEvents(normalized,'asc').map(x=>x.track),['Old','New','Undated']);
});
test('missing album metadata is never inferred and missing names remain safely countable', () => {
  const s=A.summarize([
    row('2026-01-01T00:00:00Z','Known','Artist',45000),
    {ts:'2026-01-02T00:00:00Z',ms_played:60000,master_metadata_album_album_name:'Album'}
  ]);
  assert.equal(s.albums.length,0);
  assert.equal(s.total,105000);
  assert.equal(s.tracks.length,1);
});


test('detailed dashboard option retains short-only groups for listening-time sorting', () => {
  const rows=[
    row('2026-01-01T00:00:00Z','Short track','Artist',25000,{master_metadata_album_album_name:'Short album'}),
    row('2026-01-02T00:00:00Z','Qualified track','Artist',45000,{master_metadata_album_album_name:'Long album'})
  ];
  const defaultSummary=A.summarize(rows),detailed=A.summarize(rows,{includeUnqualifiedGroups:true});
  assert.equal(defaultSummary.tracks.some(t=>t.name==='Short track'),false);
  assert.equal(detailed.tracks.find(t=>t.name==='Short track').plays,0);
  assert.equal(detailed.tracks.find(t=>t.name==='Short track').ms,25000);
  assert.equal(detailed.albums.find(a=>a.album==='Short album').plays,0);
  assert.equal(detailed.artists.find(a=>a.name==='Artist').plays,1);
});


test('all-time rankings can include undated track records but date ranges exclude them', () => {
  const rows=[row('not-a-date','Undated track','Artist',45000),row('2026-01-01T00:00:00Z','Dated track','Artist',50000)];
  const all=A.summarize(rows,{range:A.dateRange('allTime')});
  const year=A.summarize(rows,{range:custom('2026-01-01','2026-12-31')});
  assert.equal(all.tracks.length,2);
  assert.equal(all.total,95000);
  assert.equal(year.tracks.length,1);
  assert.equal(year.tracks[0].name,'Dated track');
  assert.equal(year.total,50000);
});

test('Phase 3 milestone thresholds are deterministic and expose the next threshold',()=>{
  const s=A.summarize([row('2026-01-01T00:00:00Z','One','A',60001)]),m=A.milestoneBadges(s);
  assert.equal(m.find(x=>x.key==='plays').value,1);assert.deepEqual(m.find(x=>x.key==='plays').earned,[]);assert.equal(m.find(x=>x.key==='plays').next,10);
});
test('listening streaks count distinct UTC dates and split across missing days',()=>{
  const rows=[row('2026-01-01T01:00:00Z','A','X',40000),row('2026-01-01T22:00:00Z','B','X',40000),row('2026-01-02T00:00:00Z','C','X',40000),row('2026-01-04T00:00:00Z','D','X',40000)],s=A.listeningStreaks(rows);
  assert.equal(s.activeDays,3);assert.deepEqual(s.longest,{days:2,start:'2026-01-01',end:'2026-01-02'});assert.equal(s.current.days,1);
});
test('first observed dates use earliest valid records and never call them lifetime discoveries',()=>{
  const rows=[row('2026-02-01T00:00:00Z','Later','A',40000),row('2026-01-01T00:00:00Z','Earlier','A',40000),row('invalid','Undated','B',40000)],x=A.firstObserved(rows);
  assert.equal(x.tracks[0].name,'Earlier');assert.equal(x.tracks.length,2);assert.equal(x.artists.find(a=>a.name==='A').date,'2026-01-01');
});
test('artist concentration counts primary-artist duration once and handles empty data',()=>{
  const rows=[row('2026-01-01T00:00:00Z','A','Lead',60000,{featured_artists:['Guest']}),row('2026-01-02T00:00:00Z','B','Other',40000)],c=A.artistConcentration(rows);
  assert.equal(c.totalPrimaryArtistMs,100000);assert.equal(c.topArtistShare,0.6);assert.equal(c.topFiveShare,1);assert.equal(A.artistConcentration([]).topArtistShare,0);
});
test('equal-period comparisons handle zero baselines without Infinity',()=>{
  const rows=[row('2026-01-01T00:00:00Z','A','Artist',45000)],x=A.comparePeriods(rows,custom('2025-01-01','2025-12-31'),custom('2026-01-01','2026-12-31'));
  assert.equal(x.valid,true);assert.equal(x.metrics.find(m=>m.key==='qualifyingPlays').changePercent,null);
  const same=A.comparePeriods(rows,custom('2026-01-01','2026-12-31'),custom('2026-01-01','2026-12-31'));assert.equal(same.metrics.find(m=>m.key==='qualifyingPlays').changePercent,0);
});
test('insight calculations honor date ranges and exclude marked non-music',()=>{
  const rows=[row('2025-12-31T23:59:59Z','Old','Old Artist',50000),row('2026-01-01T00:00:00Z','Podcast','Narrator',50000,{episode_name:'Podcast'}),row('2026-01-02T00:00:00Z','In range','Artist',45000)],range=custom('2026-01-01','2026-12-31');
  assert.deepEqual(A.listeningStreaks(rows,{range}).dates,['2026-01-02']);assert.equal(A.artistConcentration(rows,{range}).artists.length,1);assert.equal(A.firstObserved(rows,{range}).tracks.length,1);
});


test('recognized empty JSON arrays are distinct from unrecognized structures', () => {
  const x = A.inspectFiles([
    {name:'empty.json',data:[]},
    {name:'empty-export.json',data:{streaming_history:[]}},
    {name:'unknown.json',data:{notHistory:{}}},
    {name:'valid.json',data:[row('2026-01-01T00:00:00Z','Valid','Artist',40000)]}
  ]);
  assert.equal(x.diagnostics.filesSelected,4);
  assert.equal(x.diagnostics.filesParsed,3);
  assert.deepEqual(x.diagnostics.emptyFiles,['empty.json','empty-export.json']);
  assert.deepEqual(x.diagnostics.unrecognizedFiles,['unknown.json']);
  assert.equal(x.diagnostics.acceptedRecords,1);
  assert.equal(x.rows.length,1);
});

test('missing, malformed, negative and zero durations have separate diagnostics', () => {
  const p = A.normalizeRecords([
    {ts:'2026-01-01T00:00:00Z',trackName:'Missing',artistName:'A'},
    row('2026-01-01T00:01:00Z','Malformed','A','not-a-number'),
    row('2026-01-01T00:02:00Z','Negative','A',-5),
    row('2026-01-01T00:03:00Z','Zero','A',0),
    row('2026-01-01T00:04:00Z','Numeric string','A','30001')
  ]);
  assert.equal(p.diagnostics.missingDuration,1);
  assert.equal(p.diagnostics.invalidDuration,2);
  assert.equal(p.diagnostics.zeroDuration,1);
  assert.equal(p.records[1].durationMs,0);
  assert.equal(p.records[2].durationMs,0);
  assert.equal(p.records[3].durationMs,0);
  assert.equal(p.records[4].durationMs,30001);
  assert.equal(A.summarize(p).total,30001);
  assert.ok(p.diagnostics.warnings.some(w=>w.includes('malformed or negative duration')));
});

test('UTC midnight boundaries belong to the correct UTC day and custom date', () => {
  const rows = [
    row('2026-01-01T23:59:59.999Z','Before midnight','A',40000),
    row('2026-01-02T00:00:00.000Z','At midnight','A',50000)
  ];
  const s = A.summarize(rows,{range:custom('2026-01-02','2026-01-02')});
  assert.equal(s.total,50000);
  assert.deepEqual([...s.days.keys()],['2026-01-02']);
  assert.equal(A.listeningStreaks(rows).longest.days,2);
});

test('all-time includes undated duration while bounded date ranges exclude it', () => {
  const rows = [row('invalid','Undated','A',12000),row('2026-01-01T00:00:00Z','Dated','A',30001)];
  assert.equal(A.summarize(rows).total,42001);
  assert.equal(A.summarize(rows,{range:custom('2026-01-01','2026-01-01')}).total,30001);
  assert.equal(A.summarize(rows,{range:custom('2027-01-01','2027-01-02')}).total,0);
});

test('collaboration artist durations overlap but play points use documented weights', () => {
  const s = A.summarize([row('2026-01-01T00:00:00Z','Collab','Lead',60000,{featured_artists:['Guest','Third']})]);
  assert.equal(s.total,60000);
  assert.equal(s.plays,1);
  assert.equal(s.artists.find(a=>a.name==='Lead').plays,1);
  assert.equal(s.artists.find(a=>a.name==='Guest').plays,0.5);
  assert.equal(s.artists.find(a=>a.name==='Third').plays,0.5);
  assert.equal(s.artists.reduce((sum,a)=>sum+a.ms,0),180000);
  assert.equal(A.artistConcentration([row('2026-01-01T00:00:00Z','Collab','Lead',60000,{featured_artists:['Guest']})]).totalPrimaryArtistMs,60000);
});

test('malformed file-result inputs return safe empty diagnostics', () => {
  const x = A.inspectFiles(null);
  assert.equal(x.rows.length,0);
  assert.equal(x.diagnostics.filesSelected,0);
  assert.equal(x.diagnostics.filesParsed,0);
  assert.equal(A.summarize(null).total,0);
});

test('repeated independent imports do not accumulate rows inside the parser', () => {
  const files = [{name:'history.json',data:[row('2026-01-01T00:00:00Z','Only','A',40000)]}];
  const first = A.inspectFiles(files);
  const second = A.inspectFiles(files);
  assert.equal(first.rows.length,1);
  assert.equal(second.rows.length,1);
  assert.equal(A.summarize(second.rows).plays,1);
});


test('possible duplicate file selections are warned about but never discarded', () => {
  const record = row('2026-01-01T00:00:00Z','Repeated','Artist',40000);
  const x = A.inspectFiles([
    {name:'endsong_0.json',size:100,lastModified:123,data:[record]},
    {name:'endsong_0.json',size:100,lastModified:123,data:[{...record}]}
  ]);
  assert.equal(x.diagnostics.possibleDuplicateFiles.length,1);
  assert.equal(x.rows.length,2);
  assert.equal(A.summarize(x.rows).plays,2);
  assert.ok(x.diagnostics.warnings.some(w=>w.includes('never deduplicated automatically')));
});
