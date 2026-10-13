(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const PAGE_SIZE = 100;
  let sourceRows = [], summary = null, visible = { tracks: PAGE_SIZE, artists: PAGE_SIZE, albums: PAGE_SIZE, history: PAGE_SIZE };
  const number = n => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n);
  const time = ms => {
    if (!Number.isFinite(ms) || ms <= 0) return '0 min';
    const mins = ms / 60000;
    if (mins < 60) return Math.round(mins) + ' min';
    return Math.floor(mins / 60) + ' h ' + Math.round(mins % 60) + ' min';
  };
  const cell = (tr, value, className) => {
    const td = document.createElement('td');
    if (className) td.className = className;
    td.textContent = value == null || value === '' ? '—' : String(value);
    tr.append(td); return td;
  };
  function emptyRow(tbody, colspan, message) {
    tbody.replaceChildren(); const tr = document.createElement('tr'), td = document.createElement('td');
    td.colSpan = colspan; td.className = 'empty-row'; td.textContent = message; tr.append(td); tbody.append(tr);
  }
  function getRange() {
    const mode = $('analyticsRange').value;
    return mode === 'custom'
      ? WrappedAnalytics.dateRange('custom', { start: $('rangeStart').value, end: $('rangeEnd').value })
      : WrappedAnalytics.dateRange(mode);
  }
  function currentRows() {
    const range = getRange();
    if (!range.valid) return { range, result: null };
    return { range, result: WrappedAnalytics.summarize(sourceRows, { range, includeUnqualifiedGroups: true }) };
  }
  function sorted(items, mode, primary) {
    const copy = [...items];
    if (mode === 'time') return copy.sort((a,b)=>b.ms-a.ms||b.plays-a.plays||String(a[primary]||a.name).localeCompare(String(b[primary]||b.name)));
    if (mode === 'title') return copy.sort((a,b)=>String(a[primary]||a.name).localeCompare(String(b[primary]||b.name)));
    return copy.sort((a,b)=>b.plays-a.plays||b.ms-a.ms||String(a[primary]||a.name).localeCompare(String(b[primary]||b.name)));
  }
  function pagedTable(kind, items, tbodyId, columns, query, sorter, primary) {
    const tbody = $(tbodyId), q = query.trim().toLocaleLowerCase();
    const filtered = sorted(items, sorter, primary).filter(item => columns.search(item).toLocaleLowerCase().includes(q));
    const limit = visible[kind];
    if (!sourceRows.length) { emptyRow(tbody, columns.count, 'Import history to begin.'); const more=$(kind+'More'); if(more) more.hidden=true; return { filtered, shown: 0 }; }
    if (!filtered.length) { emptyRow(tbody, columns.count, q ? 'No matches. Try a shorter search.' : 'No qualifying records in this range.'); const more=$(kind+'More');if(more)more.hidden=true;return { filtered, shown: 0 }; }
    tbody.replaceChildren();
    filtered.slice(0,limit).forEach((item,index)=>{const tr=document.createElement('tr');cell(tr,index+1);columns.render(tr,item);tbody.append(tr);});
    const more=$(kind+'More');
    if(more){more.hidden=filtered.length<=limit;more.textContent='SHOW MORE '+kind.toUpperCase()+' ('+number(Math.min(filtered.length,limit))+'/'+number(filtered.length)+')';}
    return { filtered, shown: Math.min(filtered.length,limit) };
  }
  function renderTracks() {
    const s=summary,items=s?s.tracks:[];
    const result=pagedTable('tracks',items,'trackRows',{count:5,search:x=>[x.name,x.artist,(x.albumNames||[]).join(' ')].join(' '),render:(tr,x)=>{cell(tr,x.name);cell(tr,x.artist);cell(tr,number(x.plays));cell(tr,time(x.ms));}},$('trackSearch').value,$('trackSort').value,'name');
    $('trackSummary').textContent=s?number(result.filtered.length)+' track groups · '+number(result.shown)+' shown · '+s.range.label+'.':'Choose valid custom dates to calculate tracks.';
  }
  function renderArtists() {
    const s=summary,items=s?s.artists:[];
    const result=pagedTable('artists',items,'artistRows',{count:5,search:x=>[x.name,...(s?s.tracks:[]).filter(t=>(t.artistNames||[t.artist]).some(a=>a.toLocaleLowerCase()===x.name.toLocaleLowerCase())).map(t=>t.name)].join(' '),render:(tr,x)=>{
      cell(tr,x.name);cell(tr,number(x.plays));cell(tr,time(x.ms));
      const td=document.createElement('td'),button=document.createElement('button');button.type='button';button.className='inline-action';button.textContent='Show tracks';button.setAttribute('aria-expanded','false');
      button.addEventListener('click',()=>{
        const next=tr.nextElementSibling;
        if(next&&next.classList.contains('artist-breakdown')){next.remove();button.setAttribute('aria-expanded','false');button.textContent='Show tracks';return;}
        const detail=document.createElement('tr');detail.className='artist-breakdown';const pane=document.createElement('td');pane.colSpan=5;
        const heading=document.createElement('strong');heading.textContent='Tracks by '+x.name;pane.append(heading);
        const matches=(s?s.tracks:[]).filter(t=>(t.artistNames||[t.artist]).some(a=>a.toLocaleLowerCase()===x.name.toLocaleLowerCase())).sort((a,b)=>b.plays-a.plays||b.ms-a.ms);
        if(!matches.length){const p=document.createElement('p');p.textContent='No qualifying track groups for this artist in the selected range.';pane.append(p);}
        else{const list=document.createElement('ul');matches.slice(0,12).forEach(t=>{const li=document.createElement('li');li.textContent=t.name+' — '+number(t.plays)+' plays · '+time(t.ms);list.append(li);});pane.append(list);}
        detail.append(pane);tr.after(detail);button.setAttribute('aria-expanded','true');button.textContent='Hide tracks';
      });td.append(button);tr.append(td);
    }},$('artistSearch').value,$('artistSort').value,'name');
    $('artistSummary').textContent=s?number(result.filtered.length)+' artist groups in selected history · '+number(result.shown)+' shown · weighted play estimates.':'Choose valid custom dates to calculate artists.';
  }
  function renderAlbums() {
    const s=summary,items=s?s.albums:[];
    const result=pagedTable('albums',items,'albumRows',{count:5,search:x=>[x.album,x.artist].join(' '),render:(tr,x)=>{cell(tr,x.album);cell(tr,x.artist);cell(tr,number(x.plays));cell(tr,time(x.ms));}},$('albumSearch').value,$('albumSort').value,'album');
    $('albumSummary').textContent=s?number(result.filtered.length)+' album + artist groups in selected history · '+number(result.shown)+' shown. Missing album metadata is not guessed.':'Choose valid custom dates to calculate albums.';
  }
  function renderHistory() {
    const tbody=$('historyRows'),q=$('historySearch').value.trim().toLocaleLowerCase(),events=summary?WrappedAnalytics.sortEvents(summary.records):[];
    const filtered=events.filter(r=>[r.track,r.primaryArtist,r.album].join(' ').toLocaleLowerCase().includes(q)),limit=visible.history;
    if(!sourceRows.length){emptyRow(tbody,5,'Import history to inspect events.');$('historyMore').hidden=true;}
    else if(!filtered.length){emptyRow(tbody,5,q?'No events match this search.':'No events found in the selected range.');$('historyMore').hidden=true;}
    else {
      tbody.replaceChildren();
      filtered.slice(0,limit).forEach(r=>{
        const tr=document.createElement('tr'),stamp=r.timestamp==null?'Undated':new Date(r.timestamp).toISOString().replace('T',' ').replace(/\.000Z$/,' UTC').replace(/Z$/,' UTC');
        cell(tr,stamp);cell(tr,r.track||'Unknown track');cell(tr,r.primaryArtist||'Unknown artist');cell(tr,r.album||'Album not provided');cell(tr,r.durationMs?time(r.durationMs):'Duration not provided');tbody.append(tr);
      });
      $('historyMore').hidden=filtered.length<=limit;$('historyMore').textContent='LOAD MORE EVENTS ('+number(Math.min(filtered.length,limit))+'/'+number(filtered.length)+')';
    }
    $('historySummary').textContent=summary?number(filtered.length)+' events in selected range · newest first · '+number(summary.diagnostics.invalidTimestamps)+' source records have missing/invalid timestamps.':'Choose valid custom dates to inspect history.';
  }
  function barRow(label,ms,max) {
    const row=document.createElement('div');row.className='pattern-bar-row';
    const name=document.createElement('span');name.className='pattern-bar-label';name.textContent=label;
    const track=document.createElement('div');track.className='pattern-bar-track';
    const fill=document.createElement('div');fill.className='pattern-bar-fill';fill.style.width=(max>0?Math.max(0,ms/max*100):0)+'%';track.append(fill);
    const value=document.createElement('span');value.className='pattern-bar-value';value.textContent=time(ms);row.append(name,track,value);row.setAttribute('aria-label',label+': '+time(ms));return row;
  }
  function renderBars(id,entries,labelFn,empty) {
    const el=$(id);el.replaceChildren();
    if(!entries.length){const p=document.createElement('p');p.className='empty-row';p.textContent=empty;el.append(p);return;}
    const max=Math.max(0,...entries.map(x=>x[1]));entries.forEach(([key,ms])=>el.append(barRow(labelFn(key),ms,max)));
  }
  function renderPatterns() {
    const s=summary,hasTime=s&&s.timestampedRecords>0&&s.records.some(r=>r.timestamp!=null&&r.durationMs>0);
    if(!s){['dailyPattern','monthlyPattern','hourlyPattern'].forEach(id=>renderBars(id,[],x=>x,'Choose a valid date range.'));$('patternsSummary').textContent='Choose valid custom dates to calculate patterns.';return;}
    if(!s.timestampedRecords){['dailyPattern','monthlyPattern','hourlyPattern'].forEach(id=>renderBars(id,[],x=>x,'No valid timestamps in this date range.'));$('patternsSummary').textContent='No valid timestamps in '+s.range.label+'. Time patterns are unavailable, not zero.';return;}
    if(!hasTime){['dailyPattern','monthlyPattern','hourlyPattern'].forEach(id=>renderBars(id,[],x=>x,'Timestamps exist, but no positive recorded durations are available.'));$('patternsSummary').textContent='Timestamps are present, but this range has no positive recorded listening durations.';return;}
    const days=[...s.days.entries()].filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,14).sort((a,b)=>a[0].localeCompare(b[0]));
    const months=[...(s.monthsByYear||new Map()).entries()].filter(x=>x[1]>0).sort((a,b)=>a[0].localeCompare(b[0])).slice(-36);
    const hours=(s.hours||[]).map((ms,h)=>[String(h).padStart(2,'0')+':00',ms]);
    renderBars('dailyPattern',days,x=>x,'No positive recorded duration by date.');renderBars('monthlyPattern',months,x=>x,'No positive recorded duration by month.');renderBars('hourlyPattern',hours,x=>x,'No valid hourly data.');
    $('patternsSummary').textContent=s.range.label+' · '+number(s.timestampedRecords)+' timestamped records · calendar buckets use UTC. Daily view shows the 14 busiest UTC dates.';
  }
  function render() {
    const next=currentRows();
    if(!next.range.valid){summary=null;['trackSummary','artistSummary','albumSummary','historySummary','patternsSummary'].forEach(id=>$(id).textContent=next.range.error);renderTracks();renderArtists();renderAlbums();renderHistory();renderPatterns();return;}
    summary=next.result;renderTracks();renderArtists();renderAlbums();renderHistory();renderPatterns();
  }
  function resetPages(){visible={tracks:PAGE_SIZE,artists:PAGE_SIZE,albums:PAGE_SIZE,history:PAGE_SIZE};}
  window.addEventListener('wrapped-history-updated',e=>{sourceRows=Array.isArray(e.detail&&e.detail.rows)?e.detail.rows.slice():[];resetPages();render();});
  window.addEventListener('wrapped-range-changed',()=>{resetPages();render();});
  ['trackSearch','artistSearch','albumSearch'].forEach(id=>$(id).addEventListener('input',()=>{const kind=id.replace('Search','').toLowerCase();visible[kind]=PAGE_SIZE;renderTracks();renderArtists();renderAlbums();}));
  $('historySearch').addEventListener('input',()=>{visible.history=PAGE_SIZE;renderHistory();});
  ['trackSort','artistSort','albumSort'].forEach(id=>$(id).addEventListener('change',()=>{const kind=id.replace('Sort','').toLowerCase();visible[kind]=PAGE_SIZE;({tracks:renderTracks,artists:renderArtists,albums:renderAlbums})[kind]();}));
  [['tracksMore','tracks',renderTracks],['artistsMore','artists',renderArtists],['albumsMore','albums',renderAlbums],['historyMore','history',renderHistory]].forEach(([id,kind,fn])=>$(id).addEventListener('click',()=>{visible[kind]+=PAGE_SIZE;fn();}));
  document.querySelector('.analytics-nav').addEventListener('click',e=>{const a=e.target.closest('a');if(a&&a.hash){const target=$(a.hash.slice(1));if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}}});
  render();
})();