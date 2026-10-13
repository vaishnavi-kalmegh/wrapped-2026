'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../analytics.js');
const row = (ts, trackName, artistName, ms_played, extra = {}) => ({ ts, trackName, artistName, ms_played, ...extra });
const custom = (start, end) => A.dateRange('custom', { start, end });

test('single valid file preserves track, album, duration and source fields', () => {
  const p = A.normalizeRecords([row('2026-01-02T12:00:00Z','Track','Artist',45000,{master_metadata_album_album_name:'Album',shuffle:true})]);
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
  assert.equal(s.artists.find(x=>x.name==='Lead').plays,1); assert.equal(s.artists.find(x=>x.name==='Guest').plays,0.5); assert.equal(s.artists.find(x=>x.name==='Solo Artist').plays,1);
});
test('same title by different artists stays in separate track groups', () => {
  const s=A.summarize([row('2026-01-01T00:00:00Z','Home','Artist A',45000),row('2026-01-02T00:00:00Z','Home','Artist B',45000)]);
  assert.equal(s.tracks.length,2); assert.deepEqual(new Set(s.tracks.map(x=>x.artist)),new Set(['Artist A','Artist B']));
});
test('invalid JSON and unexpected structures report diagnostics without crashing', () => {
  const x=A.inspectFiles([{name:'bad.json',error:'Invalid JSON'},{name:'unknown.json',data:{notHistory:{}}},{name:'ok.json',data:[row('2026-01-01T00:00:00Z','OK','A',40000)]}]);
  assert.equal(x.diagnostics.invalidFiles.length,1); assert.deepEqual(x.diagnostics.emptyFiles,['unknown.json']); assert.equal(x.rows.length,1);
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
