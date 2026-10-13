'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../analytics.js');
global.WrappedAnalytics = A;
const E = require('../experience.js');
const fs = require('node:fs');
const path = require('node:path');
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
  const empty=A.comparePeriods([],custom('2024-01-01','2024-12-31'),custom('2025-01-01','2025-12-31'));assert.ok(empty.metrics.every(m=>m.changePercent===null));
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


test('null, empty and invalid timestamps are diagnosed and excluded from bounded ranges', () => {
  const rows = [
    row(null,'Null date','A',40000),
    row('','Empty date','A',45000),
    row('not-a-date','Invalid date','A',50000),
    row('2026-01-01T00:00:00Z','Dated','A',60000)
  ];
  const normalized = A.normalizeRecords(rows);
  assert.equal(normalized.diagnostics.invalidTimestamps,3);
  assert.equal(A.summarize(rows).total,195000);
  assert.equal(A.summarize(rows,{range:custom('2026-01-01','2026-01-01')}).total,60000);
});

test('import diagnostics separate rejected rows, missing metadata, and marked non-music', () => {
  const x = A.inspectFiles([{name:'mixed.json',data:[
    row('2026-01-01T00:00:00Z','Music','Artist',40000),
    row('invalid','Undated','Artist',undefined),
    {ts:'2026-01-02T00:00:00Z',ms_played:50000},
    row('2026-01-03T00:00:00Z','Episode','Narrator',80000,{episode_name:'A show'}),
    null
  ]}]);
  assert.equal(x.diagnostics.acceptedRecords,4);
  assert.equal(x.diagnostics.rejectedRecords,1);
  assert.equal(x.diagnostics.invalidTimestamps,1);
  assert.equal(x.diagnostics.missingTrack,1);
  assert.equal(x.diagnostics.missingArtist,1);
  assert.equal(x.diagnostics.missingDuration,1);
  assert.equal(x.diagnostics.excludedNonMusic,1);
  assert.equal(A.summarize(x.rows).total,90000);
});

test('first-observed discoveries respect selected UTC range and exclude undated rows', () => {
  const rows = [
    row('2025-12-31T23:59:59.999Z','Earlier','Artist',40000),
    row('2026-01-01T00:00:00.000Z','In range','Artist',40000),
    row('invalid','Undated','Other',40000)
  ];
  const found = A.firstObserved(rows,{range:custom('2026-01-01','2026-12-31')});
  assert.deepEqual(found.tracks.map(x=>x.name),['In range']);
  assert.deepEqual(found.artists.map(x=>x.name),['Artist']);
});


test('timestamp parsing rejects implicit JavaScript coercions but accepts valid epoch values', () => {
  assert.equal(A.parseTimestamp(true),null);
  assert.equal(A.parseTimestamp({timestamp:'2026-01-01'}),null);
  assert.equal(A.parseTimestamp('123'),null);
  assert.equal(A.parseTimestamp('not-a-date'),null);
  assert.equal(A.parseTimestamp('1767225600'),Date.UTC(2026,0,1));
  assert.equal(A.parseTimestamp('2026-01-01T00:00:00Z'),Date.UTC(2026,0,1));
});


test('Story Mode returns a truthful empty state for empty and malformed inputs', () => {
  const empty=A.buildStory(null,{range:custom('2026-01-01','2026-12-31')});
  assert.equal(empty.valid,true);
  assert.equal(empty.empty,true);
  assert.equal(empty.stories.length,1);
  assert.match(empty.stories[0].title,/No story/);
  const invalid=A.buildStory([row('2026-01-01T00:00:00Z','Track','Artist',40000)],{range:{valid:false,error:'Invalid date range'}});
  assert.equal(invalid.valid,false);
  assert.equal(invalid.stories.length,0);
});

test('Story Mode handles one qualifying track and one artist without inventing repeat patterns', () => {
  const range=custom('2026-01-01','2026-12-31');
  const x=A.buildStory([row('2026-01-01T23:59:59Z','Solo Track','Solo Artist',40000)],{range});
  const tracks=x.stories.find(s=>s.type==='tracks');
  const artists=x.stories.find(s=>s.type==='artists');
  assert.equal(x.summary.plays,1);
  assert.equal(tracks.list.length,1);
  assert.match(tracks.list[0],/Solo Track — Solo Artist · 1 qualifying play/);
  assert.match(artists.list[0],/Solo Artist — 1 estimated play points/);
  assert.equal(x.stories.some(s=>s.type==='repeat'),false);
  assert.equal(x.stories.some(s=>s.type==='identity'),false);
});

test('Story Mode repeat story counts qualifying plays while duration includes short events', () => {
  const rows=[
    row('2026-01-01T23:59:59Z','Repeat Song','Artist',45000),
    row('2026-01-02T00:00:00Z','Repeat Song','Artist',40000),
    row('2026-01-02T12:00:00Z','Repeat Song','Artist',10000)
  ];
  const x=A.buildStory(rows,{range:custom('2026-01-01','2026-12-31')});
  assert.equal(x.summary.total,95000);
  assert.equal(x.summary.plays,2);
  assert.match(x.stories.find(s=>s.type==='repeat').body,/2 qualifying plays \(100%/);
});

test('Story Mode shows estimated collaboration points and never sums overlapping artist time', () => {
  const rows=[row('2026-01-01T00:00:00Z','Duet','Lead',60000,{featured_artists:['Guest']})];
  const x=A.buildStory(rows,{range:custom('2026-01-01','2026-12-31')});
  const artists=x.stories.find(s=>s.type==='artists');
  assert.equal(x.summary.total,60000);
  assert.match(artists.list.join(' '),/Lead — 1 estimated play points/);
  assert.match(artists.list.join(' '),/Guest — 0.5 estimated play points/);
  assert.match(artists.body,/durations overlap/);
});

test('Story Mode excludes undated rows from bounded dates and handles UTC midnight peaks', () => {
  const rows=[
    row('invalid','Undated','Artist',90000),
    row('2026-01-01T23:59:59.999Z','Before','Artist',40000),
    row('2026-01-02T00:00:00.000Z','At midnight','Artist',50000)
  ];
  const x=A.buildStory(rows,{range:custom('2026-01-02','2026-01-02')});
  assert.equal(x.summary.total,50000);
  assert.equal(x.summary.plays,1);
  assert.equal(x.stories.find(s=>s.type==='peak-day').title,'2026-01-02 UTC');
  assert.equal(x.stories.find(s=>s.type==='streak').number,'1');
});

test('Story Mode labels first-observed tracks as archive observations and discloses incomplete history', () => {
  const rows=[
    row('2026-01-02T00:00:00Z','Later','Artist',40000),
    row('2026-01-01T00:00:00Z','Earliest','Artist',40000)
  ];
  const x=A.buildStory(rows,{range:custom('2026-01-01','2026-12-31'),incomplete:true});
  const discovery=x.stories.find(s=>s.type==='first-observed');
  assert.match(discovery.title,/Earliest/);
  assert.match(discovery.body,/not a claim about your lifetime first listen/i);
  assert.ok(x.stories.every(s=>s.caveat.includes('may be incomplete')));
});

test('Story Mode preserves long titles and Unicode punctuation for safe card wrapping', () => {
  const title='極めて長い曲名 — “✨ Midnight / Signal: (Deluxe Version)” '.repeat(8).trim();
  const artist='Artist with an exceptionally long name & friends 🎧';
  const x=A.buildStory([row('2026-01-01T00:00:00Z',title,artist,60000)],{range:custom('2026-01-01','2026-12-31')});
  assert.ok(x.stories.find(s=>s.type==='tracks').list[0].includes(title));
  assert.ok(x.stories.find(s=>s.type==='tracks').list[0].includes(artist));
});


test('Story Mode identity labels follow documented thresholds and omit unsupported labels', () => {
  const range=custom('2026-01-01','2026-12-31');
  const loopRows=[];
  for(let i=0;i<3;i++)loopRows.push(row('2026-01-01T00:00:0'+i+'Z','Loop Track','Artist',40000));
  for(let i=0;i<7;i++)loopRows.push(row('2026-01-02T00:00:0'+i+'Z','Other '+i,'Artist',40000));
  const loop=A.buildStory(loopRows,{range});
  assert.equal(loop.stories.find(s=>s.type==='identity').title,'The Loop Architect');
  assert.match(loop.stories.find(s=>s.type==='identity').body,/20% or more/);

  const deepRows=[];
  for(let i=0;i<20;i++)deepRows.push(row('2026-02-'+String(i+1).padStart(2,'0')+'T00:00:00Z','Catalog '+i,'Artist',40000));
  const deep=A.buildStory(deepRows,{range});
  assert.equal(deep.stories.find(s=>s.type==='identity').title,'The Deep-Catalog Drifter');
  assert.match(deep.stories.find(s=>s.type==='identity').body,/20 or more qualifying track groups/);

  const steadyRows=[];
  for(let day=1;day<=5;day++){
    steadyRows.push(row('2026-03-'+String(day).padStart(2,'0')+'T01:00:00Z','Daily '+day+' A','Artist',40000));
    steadyRows.push(row('2026-03-'+String(day).padStart(2,'0')+'T02:00:00Z','Daily '+day+' B','Artist',40000));
  }
  const steady=A.buildStory(steadyRows,{range});
  assert.equal(steady.stories.find(s=>s.type==='identity').title,'The Steady Signal');
  assert.match(steady.stories.find(s=>s.type==='identity').body,/5 consecutive active UTC dates/);
});


test('Story Mode UI exposes navigation, accessible status, responsive reduced-motion, and export failure paths', () => {
  const root=path.join(__dirname,'..');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const script=fs.readFileSync(path.join(root,'script.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
  for(const id of ['storyPanel','storyLaunch','storyExit','storyPrev','storyNext','storyProgress','storySlide','downloadCard','storyRangeMode','includeRangeOnCard','includeCalculationNote'])assert.ok(html.includes('id="'+id+'"'),id+' control missing');
  assert.match(html,/aria-live="polite"/);
  assert.match(script,/ArrowRight/);
  assert.match(script,/ArrowLeft/);
  assert.match(script,/function wrapText/);
  assert.match(script,/canvas\.toBlob/);
  assert.match(script,/Image export failed/);
  assert.match(script,/The image was created but the download could not start/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});


test('Phase 6 rankings show ten by default, expand by batches, cap at fifty, and respect short lists', () => {
  const ranked=Array.from({length:63},(_,i)=>({name:'Track '+i,plays:100-i,ms:(100-i)*40000}));
  assert.equal(E.visibleRankings(ranked,10).length,10);
  assert.deepEqual(E.visibleRankings(ranked,10).map(x=>x.name),ranked.slice(0,10).map(x=>x.name));
  assert.equal(E.visibleRankings(ranked,20).length,20);
  assert.equal(E.visibleRankings(ranked,30).length,30);
  assert.equal(E.visibleRankings(ranked,40).length,40);
  assert.equal(E.visibleRankings(ranked,50).length,50);
  assert.equal(E.visibleRankings(ranked,60).length,50);
  assert.equal(E.visibleRankings(ranked.slice(0,8),10).length,8);
  assert.equal(E.visibleRankings(ranked.map(x=>({...x,plays:0})),10).length,0);
});

test('Phase 6 monthly buckets sum short-event duration and calculate consistent percentages', () => {
  const range=custom('2026-01-01','2026-02-28');
  const summary=A.summarize([
    row('2026-01-01T01:00:00Z','Short','A',10000),
    row('2026-01-02T01:00:00Z','Long','A',40000),
    row('2026-02-01T01:00:00Z','Short Feb','B',30000),
    row('2026-02-02T01:00:00Z','Long Feb','B',70000),
    row('invalid','Undated','C',50000),
    row('2025-12-31T23:59:59Z','Outside','D',100000)
  ],{range});
  const buckets=E.monthBuckets(summary,range);
  assert.deepEqual(buckets.map(x=>x.id),['2026-01','2026-02']);
  assert.deepEqual(buckets.map(x=>x.ms),[50000,100000]);
  assert.ok(Math.abs(buckets.reduce((s,x)=>s+x.share,0)-1)<1e-12);
  assert.ok(Math.abs(buckets[0].share-1/3)<1e-12);
  assert.ok(Math.abs(buckets[1].share-2/3)<1e-12);
});

test('Phase 6 monthly buckets include zero months and never assign undated records to a month', () => {
  const range=custom('2026-01-01','2026-03-31');
  const summary=A.summarize([row('2026-01-02T01:00:00Z','Jan','A',40000),row('2026-03-02T01:00:00Z','Mar','A',50000),row('invalid','Undated','A',90000)],{range});
  const buckets=E.monthBuckets(summary,range);
  assert.deepEqual(buckets.map(x=>x.id),['2026-01','2026-02','2026-03']);
  assert.deepEqual(buckets.map(x=>x.ms),[40000,0,50000]);
  assert.equal(buckets.reduce((s,x)=>s+x.ms,0),90000);
});

test('Phase 6 hourly aggregation uses UTC buckets and includes short-event duration', () => {
  const range=custom('2026-01-01','2026-01-02');
  const summary=A.summarize([
    row('2026-01-01T23:50:00Z','Late','A',40000),
    row('2026-01-02T00:10:00Z','Midnight','A',60000),
    row('2026-01-02T12:00:00Z','Short noon','A',10000),
    row('invalid','Undated','A',50000)
  ],{range});
  const hours=E.hourBuckets(summary);
  assert.equal(hours.length,24);
  assert.equal(hours[23].ms,40000);
  assert.equal(hours[0].ms,60000);
  assert.equal(hours[12].ms,10000);
  assert.equal(hours.reduce((s,x)=>s+x.ms,0),110000);
  assert.ok(Math.abs(hours.reduce((s,x)=>s+x.share,0)-1)<1e-12);
});

test('Phase 6 heatmap supplies day duration, includes zero-duration dates, and bounds to observed dates', () => {
  const summary=A.summarize([
    row('2026-01-01T00:00:00Z','First','A',40000),
    row('2026-01-03T00:00:00Z','Zero duration','A',0),
    row('2026-01-05T00:00:00Z','Last','A',50000),
    row('invalid','Undated','A',80000)
  ]);
  const heat=E.heatmapDays(summary);
  assert.equal(heat.first,'2026-01-01');
  assert.equal(heat.last,'2026-01-05');
  assert.deepEqual(heat.days.map(x=>x.date),['2026-01-01','2026-01-02','2026-01-03','2026-01-04','2026-01-05']);
  assert.deepEqual(heat.days.map(x=>x.ms),[40000,0,0,0,50000]);
  assert.ok(heat.days.every(x=>x.known===true));
});

test('Phase 6 Listening Lore uses explicit evidence thresholds and story excludes retired story types', () => {
  const rows=[];
  for(let i=0;i<3;i++)rows.push(row('2026-01-01T00:00:'+String(i).padStart(2,'0')+'Z','Loop Song','Artist',40000));
  for(let i=0;i<7;i++)rows.push(row('2026-01-02T00:00:'+String(i).padStart(2,'0')+'Z','Other '+i,'Artist',40000));
  const range=custom('2026-01-01','2026-12-31'),summary=A.summarize(rows,{range});
  const lore=E.loreFor(summary),stories=E.makeStory(summary,range);
  assert.equal(lore.kind,'repeat');
  assert.match(lore.basis,/at least 10 qualifying plays/i);
  assert.equal(stories[0].type,'lore');
  assert.ok(!stories.some(x=>x.type==='streak'||x.type==='first-observed'));
  assert.ok(stories.some(x=>x.type==='artists'));
  assert.ok(stories.some(x=>x.type==='tracks'));
});

test('Phase 6 artwork matches require exact track and artist metadata; failures safely fall back', () => {
  const results=[
    {trackName:'Other Song',artistName:'Artist',artworkUrl100:'https://example.test/wrong.jpg'},
    {trackName:'Song ✨',artistName:'Different Artist',artworkUrl100:'https://example.test/wrong-artist.jpg'},
    {trackName:'Song ✨',artistName:'Artist',artworkUrl600:'https://example.test/right.jpg'}
  ];
  assert.equal(E.findTrackArtwork(results,'Song ✨','Artist'),'https://example.test/right.jpg');
  assert.equal(E.findTrackArtwork(results,'Song ✨','Missing Artist'),null);
  assert.equal(E.findTrackArtwork([], 'Unknown','Unknown'),null);
  assert.equal(E.isExactArtistPage('Björk','Björk'),true);
  assert.equal(E.isExactArtistPage('Björk (album)','Björk'),false);
  assert.equal(E.isExactArtistPage('Other Artist','Björk'),false);
});

test('Phase 6 story-first navigation, portrait export, keyboard, mobile and reduced-motion contracts exist', () => {
  const root=path.join(__dirname,'..');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const script=fs.readFileSync(path.join(root,'experience.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
  const visible=html.split('<div class="legacy-interface" hidden aria-hidden="true">')[0];
  const order=['id="loreCard"','id="artistCards"','id="trackCards"','id="numbersHeading"','id="patternsHeading"','id="fullStoryHeading"'];
  let last=-1;
  for(const token of order){const pos=visible.indexOf(token);assert.ok(pos>last,token+' should appear in story-first order');last=pos;}
  assert.ok(!visible.includes('id="historyPanel"'));
  assert.ok(!visible.includes('id="comparisonContent"'));
  for(const id of ['artistsLoadMore','tracksLoadMore','artistsCollapse','tracksCollapse','storyViewer','storyPrevious','storyNext','storyClose','storyDownload','artworkLookupEnabled'])assert.ok(html.includes('id="'+id+'"'),id+' missing');
  assert.match(script,/canvas\.width=1080/);
  assert.match(script,/canvas\.height=1920/);
  assert.match(script,/Image export failed|PNG export failed/);
  assert.match(script,/ArrowRight/);
  assert.match(script,/ArrowLeft/);
  assert.match(script,/if\(e\.key==='Tab'\)/);
  assert.match(css,/aspect-ratio:9\/16/);
  assert.match(css,/@media\(max-width:560px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});


test('Phase 6 default story range preserves the Jan 1–Nov 15 2026 UTC window', () => {
  const range=E.rangeFor('wrapped2026');
  assert.equal(range.valid,true);
  assert.equal(range.start,Date.UTC(2026,0,1));
  assert.equal(range.end,Date.UTC(2026,10,16)-1);
  assert.match(range.label,/2026 Wrapped.*Nov 15 UTC/);
});

test('Phase 6 invalid custom range has a safe story empty state', () => {
  const range=E.rangeFor('custom','','');
  assert.equal(range.valid,false);
  const stories=E.makeStory({valid:false,error:range.error,records:[]},range);
  assert.equal(stories.length,1);
  assert.equal(stories[0].type,'empty');
  assert.match(stories[0].title,/range/i);
});
