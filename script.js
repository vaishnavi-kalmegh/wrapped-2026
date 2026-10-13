const $ = id => document.getElementById(id);

const themeCopy = {
 spotify: {
 heroEyebrow:'YOUR YEAR, YOUR RECEIPTS // 2026', heroTitle:'THE YEAR<br>WAS <span class="chaos">LOUD.</span>', heroLede:'A lovingly unhinged recap of the songs you looped and the life you lived. No imaginary lore.',
 heroButton:'LOAD YOUR DATA ↘', receipts:'THE RECEIPTS', bring:'Bring the evidence.', receiptsCopy:'Choose one or more Spotify Extended Streaming History JSON files. They\'re analyzed in this browser and never uploaded by this app.',
 numbers:'THE NUMBERS', listeningLore:'Your listening lore.', plot:'THE PLOT TWIST', pressPlay:'Press play on your year.', activity:'ACTIVITY LOG', activityTitle:'When the soundtrack happened.',
 awards:'TROPHIES & DELUSIONS', awardsTitle:'Your evidence-based awards.', friend:'FRIEND LORE', friendTitle:'Compare soundtracks.', life:'PERSONAL DLC', lifeTitle:'Life Wrapped.',
 upload:'Choose your listening history', uploadCopy:'Select Spotify streaming-history JSON files, usually named Streaming_History or endsong. Multiple files are supported.',
 choose:'CHOOSE JSON FILES', topArtists:'Artists on repeat.', topTracks:'Soundtrack of the year.', storyWait:'WAITING FOR THE RECEIPTS', storyTitle:'Your year has a soundtrack.', storyCopy:'Upload your streaming history to unlock your personalized story.',
 footer:'BUILT FOR THE PLOT.'
 },
 y2k: {
 heroEyebrow:'BABE, YOUR 2026 RECEIPTS ✧', heroTitle:'YOUR YEAR<br>WAS <span class="chaos">ICONIC.</span>', heroLede:'Your listening diary, but make it glittery, dramatic and a tiny bit delulu. The numbers are real. The sparkle is extra.',
 heroButton:'SPILL MY STATS ✧', receipts:'THE TEA, WITH RECEIPTS', bring:'Okay bestfren, drop the data.', receiptsCopy:'Pick your Spotify Extended Streaming History JSON files. We do the math right here in your browser—no uploading your lore.',
 numbers:'THE MAIN CHARACTER STATS', listeningLore:'The soundtrack of your slay.', plot:'THE PLOT TWIST ✦', pressPlay:'Cue the dramatic reveal.', activity:'THE LISTENING DIARY', activityTitle:'When the change happened.',
 awards:'CROWNS & CHAOTIC WINS', awardsTitle:'Awards you actually earned, babe.', friend:'TWIN CHECK', friendTitle:'Are your music taste twins?', life:'THE LORE DROP', lifeTitle:'Life Wrapped, diva edition.',
 upload:'Bestie, drop your listening lore', uploadCopy:'Choose your Spotify history JSON files. Look for Streaming_History or endsong in your download. Yes, you can select multiple files.',
 choose:'LET ME SEE THE RECEIPTS ✨', topArtists:'Your ride-or-dies.', topTracks:'The bops on repeat.', storyWait:'THE TEA IS LOADING', storyTitle:'Your year had RANGE.', storyCopy:'Upload your history and let the main-character montage begin.',
 footer:'STAY SPARKLY. STAY UNREASONABLE.'
 },
 futuristic: {
 heroEyebrow:'AUDIO ARCHIVE // CYCLE 2026', heroTitle:'YEARLY<br><span class="chaos">SIGNAL.</span>', heroLede:'A precision-built listening debrief. Verified records only. No synthetic memories. No unsupported conclusions.',
 heroButton:'INITIALIZE DATA ↘', receipts:'DATA INTAKE', bring:'Import listening archive.', receiptsCopy:'Select Spotify Extended Streaming History JSON files. Processing remains client-side; the archive is not transmitted to this interface.',
 numbers:'SYSTEM METRICS', listeningLore:'Your audio profile.', plot:'SEQUENCE PLAYBACK', pressPlay:'Review annual sequence.', activity:'TEMPORAL ANALYSIS', activityTitle:'Listening across the timeline.',
 awards:'VERIFIED DISTINCTIONS', awardsTitle:'Awards by recorded evidence.', friend:'CROSS-ARCHIVE', friendTitle:'Compare two listening profiles.', life:'USER-DEFINED ARCHIVE', lifeTitle:'Personal event log.',
 upload:'Select listening archive', uploadCopy:'Import Spotify streaming-history JSON files, commonly named Streaming_History or endsong. Multiple archive segments are accepted.',
 choose:'SELECT JSON ARCHIVE', topArtists:'Highest-frequency artists.', topTracks:'Highest-frequency tracks.', storyWait:'AWAITING ARCHIVE', storyTitle:'Your audio record awaits.', storyCopy:'Import listening history to generate your personalized sequence.',
 footer:'SIGNAL VERIFIED. LORE UNMODIFIED.'
 }
};
function applyTheme(theme) {
 document.documentElement.dataset.theme = theme;
 const t = themeCopy[theme] || themeCopy.spotify;
 const set=(selector,value)=>{const el=document.querySelector(selector);if(el)el.innerHTML=value};
 set('.hero-copy .eyebrow',t.heroEyebrow); set('.hero-copy h1',t.heroTitle);
 set('.hero-copy .lede',t.heroLede); set('.hero-copy .button-bright',t.heroButton);
 const receiptHead=document.querySelector('.section-head'); if(receiptHead){const e=receiptHead.querySelector('.eyebrow'),h=receiptHead.querySelector('h2'),p=receiptHead.querySelector(':scope > p');if(e)e.textContent=t.receipts;if(h)h.textContent=t.bring;if(p)p.textContent=t.receiptsCopy}
 const lifetimeHead=document.querySelector('.lifetime-section-head');
 if(lifetimeHead){const e=lifetimeHead.querySelector('.eyebrow'),h=lifetimeHead.querySelector('h2'),p=lifetimeHead.querySelector(':scope > p');
  if(theme==='y2k'){if(e)e.textContent='THE WHOLE BOP ARCHIVE ✧';if(h)h.textContent='Your entire era.';if(p)p.textContent='Every year, every loop, all the receipts. Pick a date range and let the lore unfold.'}
  else if(theme==='futuristic'){if(e)e.textContent='ARCHIVE ANALYTICS // ALL CYCLES';if(h)h.textContent='Lifetime listening profile.';if(p)p.textContent='Aggregate recorded listening across imported history. Select a temporal window to recalculate.'}
  else{if(e)e.textContent='THE FULL ARCHIVE';if(h)h.textContent='Your lifetime listening.';if(p)p.textContent='This overview uses the same analytics engine across all imported years. The original Wrapped section below stays locked to its 2026 window.'}
 }
 const heads=document.querySelectorAll('.section-head');
 const pairs=[[1,t.numbers,t.listeningLore],[2,t.plot,t.pressPlay],[3,t.activity,t.activityTitle],[4,t.awards,t.awardsTitle],[5,t.friend,t.friendTitle],[6,t.life,t.lifeTitle]];
 pairs.forEach(([i,e,h])=>{if(heads[i]){const a=heads[i].querySelector('.eyebrow');const b=heads[i].querySelector('h2');if(a)a.textContent=e;if(b)b.textContent=h}});
 const put=(id,value)=>{const el=$(id);if(el)el.textContent=value};
 put('uploadTitle',t.upload);put('uploadCopy',t.uploadCopy);
 const uploadH=document.querySelector('.upload-zone h3');if(uploadH)uploadH.textContent=t.upload;
 const uploadP=document.querySelector('.upload-zone > div:nth-child(2) p');if(uploadP)uploadP.textContent=t.uploadCopy;
 const choose=document.querySelector('label[for="historyFiles"]');if(choose)choose.textContent=t.choose;
 const ra=document.querySelector('.rankings .ranking-panel:first-child .panel-title h3');if(ra)ra.textContent=t.topArtists;
 const rt=document.querySelector('.rankings .ranking-panel:last-child .panel-title h3');if(rt)rt.textContent=t.topTracks;
 const wait=$('storySlide');if(wait&&!slides.length){const eyebrow=wait.querySelector('.eyebrow'),h=wait.querySelector('h3'),p=wait.querySelector('p:not(.eyebrow)');if(eyebrow)eyebrow.textContent=t.storyWait;if(h)h.textContent=t.storyTitle;if(p)p.textContent=t.storyCopy}
 const footer=document.querySelector('footer span:nth-child(2)');if(footer)footer.textContent=t.footer;
 const wordmark=document.querySelector('.wordmark span');if(wordmark)wordmark.textContent=theme==='spotify'?'.exe':theme==='y2k'?'✧exe':'//exe';
 const labels = theme==='y2k'
  ? ['MINUTES IN YOUR FEELS','ARTISTS IN YOUR ORBIT','QUALIFYING PLAYS (>30S)','YOUR #1 OBSESSION']
  : theme==='futuristic'
   ? ['LISTENING DURATION','UNIQUE ARTIST NODES','QUALIFYING PLAYS (>30S)','PRIMARY TRACK']
   : ['TIME SPENT LISTENING','UNIQUE ARTISTS','QUALIFYING PLAYS (>30S)','YOUR #1 TRACK'];
 document.querySelectorAll('.stats-grid .stat-label').forEach((el,i)=>{if(labels[i])el.textContent=labels[i]});
  const lifetimeLabels=theme==='y2k'?['TIME IN YOUR ENTIRE FEELS','ARTIST ORBIT','BOPS OVER 30 SECONDS','ALBUM LORE']:theme==='futuristic'?['RECORDED DURATION','ARTIST NODES','QUALIFYING EVENTS','ALBUM GROUPS']:['RECORDED LISTENING','QUALIFYING PLAYS','ARTIST NAMES','ALBUM GROUPS'];
  document.querySelectorAll('.lifetime-metrics .stat-label').forEach((el,i)=>{if(lifetimeLabels[i])el.textContent=lifetimeLabels[i]});
 const storyEyebrow=document.querySelector('.story-topline .eyebrow');
 if(storyEyebrow)storyEyebrow.textContent=theme==='y2k'?'YOUR YEAR, THE GLITTER CUT ✧':theme==='futuristic'?'RECAP SEQUENCE // ACTIVE':'YOUR RECAP / STORY MODE';
 const btns={storyPrev:theme==='y2k'?'← BACK, BESTIE':theme==='futuristic'?'← PREVIOUS FRAME':'← PREVIOUS',downloadCard:theme==='y2k'?'↓ SAVE THE SLAY ✨':theme==='futuristic'?'↓ EXPORT FRAME':'↓ SAVE CARD',legacyStoryNext:theme==='y2k'?'NEXT PLOT TWIST ✧':theme==='futuristic'?'NEXT FRAME ↗':'NEXT SLIDE ↗',resetData:theme==='y2k'?'RESET THE LORE ✦':theme==='futuristic'?'CLEAR SESSION DATA':'RESET MY DATA',buildLife:theme==='y2k'?'MAKE MY LORE ✨':theme==='futuristic'?'COMPILE EVENT LOG ↗':'MAKE MY LIFE RECAP ↗'};
 Object.entries(btns).forEach(([id,value])=>{const el=$(id);if(el){if(id==='legacyStoryNext'&&slides.length&&slideIndex===slides.length-1)el.textContent=theme==='y2k'?'THE END, ICON ✧':theme==='futuristic'?'SEQUENCE COMPLETE ✓':'END OF STORY ✓';else el.textContent=value}});
 const compareTitle=document.querySelector('.compare-copy h3');if(compareTitle)compareTitle.textContent=theme==='y2k'?'Two besties. One shared bop era.':theme==='futuristic'?'Initialize cross-profile comparison.':'Two playlists enter. Shared lore leaves.';
 const lifeTitle=document.querySelector('.life-intro h3');if(lifeTitle)lifeTitle.textContent=theme==='y2k'?'Dump the lore, diva.':theme==='futuristic'?'Enter user-defined events.':'Dump the lore.';
 const storyButton=$('legacyStoryNext');if(storyButton&&storyButton.disabled&&!slides.length)storyButton.textContent=theme==='y2k'?'NEXT PLOT TWIST ✧':theme==='futuristic'?'NEXT FRAME ↗':'NEXT SLIDE ↗';
 if(slides.length) { 
   if(mine) buildSlides();
   else renderSlide();
 }
}

const YEAR = 2026, WRAPPED_CUTOFF = Date.UTC(YEAR, 10, 15, 23, 59, 59, 999), fmt = n => new Intl.NumberFormat(undefined, {maximumFractionDigits: 1}).format(n), clean = v => String(v ?? '').trim();
let mine = null, friend = null, slides = [], slideIndex = 0, myHistoryRows = [], mineImportToken = 0, friendImportToken = 0;
function dateOf(r){const n=WrappedAnalytics.normalizeRecord(r,0);return n&&n.timestamp!=null?new Date(n.timestamp):null}
function trackOf(r){return WrappedAnalytics.normalizeRecord(r,0)?.track||''}
function primaryArtistOf(r){return WrappedAnalytics.normalizeRecord(r,0)?.primaryArtist||''}
function secondaryArtistsOf(r){return WrappedAnalytics.normalizeRecord(r,0)?.secondaryArtists||[]}
function artistsOf(r){return WrappedAnalytics.normalizeRecord(r,0)?.artists||[]}
function msOf(r){return WrappedAnalytics.normalizeRecord(r,0)?.durationMs||0}
function rowsOf(x){return WrappedAnalytics.rowsOf(x)}
async function loadFiles(files){
 const results=[];
 for(const f of [...files]){
  try{results.push({name:f.name,size:f.size,lastModified:f.lastModified,data:JSON.parse(await f.text())})}
  catch{results.push({name:f.name,error:'Invalid JSON or unreadable file'})}
 }
 const parsed=WrappedAnalytics.inspectFiles(results);
 const errors=[...parsed.diagnostics.invalidFiles.map(x=>x.name+': '+x.reason),...parsed.diagnostics.unrecognizedFiles.map(x=>x+': no recognized Spotify history array; choose an Extended Streaming History JSON file.'),...parsed.diagnostics.emptyFiles.map(x=>x+': recognized history file contains zero records.')];
 return{rows:parsed.rows,errors,count:files.length,diagnostics:parsed.diagnostics};
}
function summarize(rows){
 const range={valid:true,kind:'wrapped2026',start:Date.UTC(YEAR,0,1),end:WRAPPED_CUTOFF,label:'2026 Wrapped (Jan 1–Nov 15 UTC)'};
 return WrappedAnalytics.summarize(rows,{range,requireTrackAndArtistForDuration:true});
}
function renderLifetimeList(id,items,kind){
 const el=$(id);el.replaceChildren();
 if(!items.length){const li=document.createElement('li');li.textContent='No qualifying records in this range.';el.append(li);return}
 items.slice(0,5).forEach(item=>{const li=document.createElement('li'),small=document.createElement('small');li.textContent=kind==='artist'?item.name:item.name+' — '+item.artist;small.textContent=kind==='artist'?'weighted score: '+fmt(item.plays)+' (estimate)':fmt(item.plays)+' qualifying plays';li.append(small);el.append(li)});
}
function renderLifetimeAnalytics(){
 const status=$('lifetimeStatus'),mode=$('analyticsRange').value,customFields=$('customRangeFields');
 customFields.hidden=mode!=='custom';
 const metricIds=['lifetimeTime','lifetimePlays','lifetimeArtists','lifetimeAlbums'];
 if(!myHistoryRows.length){
  metricIds.forEach(id=>$(id).textContent='—');
  status.textContent='Upload your history above to calculate lifetime totals. Imported files remain in this browser only.';
  renderLifetimeList('lifetimeTopArtists',[],'artist');renderLifetimeList('lifetimeTopTracks',[],'track');return;
 }
 const range=mode==='custom'?WrappedAnalytics.dateRange('custom',{start:$('rangeStart').value,end:$('rangeEnd').value}):WrappedAnalytics.dateRange(mode);
 if(!range.valid){
  metricIds.forEach(id=>$(id).textContent='—');status.textContent=range.error;
  renderLifetimeList('lifetimeTopArtists',[],'artist');renderLifetimeList('lifetimeTopTracks',[],'track');return;
 }
 const result=WrappedAnalytics.summarize(myHistoryRows,{range});
 $('lifetimeTime').textContent=hoursText(result.total);
 $('lifetimePlays').textContent=fmt(result.plays);
 $('lifetimeArtists').textContent=fmt(result.artistNames.size);
 $('lifetimeAlbums').textContent=fmt(result.albums.length);
 renderLifetimeList('lifetimeTopArtists',result.artists,'artist');
 renderLifetimeList('lifetimeTopTracks',result.tracks,'track');
 status.textContent=range.label+' · '+fmt(result.events)+' track records · '+fmt(result.plays)+' qualifying plays. Duration uses recorded values; artist rankings are estimates. '+(result.events===0?'No matching dated track records were found.':'');
}
function renderRank(id,arr,kind){const el=$(id);el.replaceChildren();if(!arr.length){const li=document.createElement('li');li.className='empty-row';li.textContent='No matching 2026 records found.';el.append(li);return}
 arr.slice(0,5).forEach(v=>{const li=document.createElement('li'),wrap=document.createElement('div'),name=document.createElement('span'),sub=document.createElement('span'),count=document.createElement('span');name.className='rank-name';name.textContent=kind==='artist'?v.name:v.name;sub.className='rank-sub';sub.textContent=kind==='artist'?'weighted streams (approx.)':'by '+v.artist;name.append(sub);wrap.append(name);count.className='rank-count';count.textContent=kind==='artist'?fmt(v.plays)+' score':fmt(v.plays)+' plays';li.append(wrap,count);el.append(li)})}
const hoursText=ms=>(ms/3600000).toFixed(1)+' h';
function renderHeat(s){const el=$('heatmap');el.replaceChildren();const max=Math.max(1,...s.days.values());for(let d=new Date(Date.UTC(YEAR,0,1));d<=new Date(Date.UTC(YEAR,11,31));d.setUTCDate(d.getUTCDate()+1)){const key=d.toISOString().slice(0,10),ms=s.days.get(key)||0,ratio=ms/max,level=!ms?0:ratio<.15?1:ratio<.4?2:ratio<.7?3:4,cell=document.createElement('span');cell.className='heat-cell';cell.dataset.level=level;cell.title=key+': '+hoursText(ms)+' recorded';cell.setAttribute('aria-label',cell.title);cell.tabIndex=0;el.append(cell)}}
function renderMonths(s){const el=$('monthlyTimeline');el.replaceChildren();const labels=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],max=Math.max(1,...s.months);labels.forEach((label,i)=>{const row=document.createElement('div'),name=document.createElement('span'),track=document.createElement('div'),fill=document.createElement('div'),value=document.createElement('span');row.className='month-row';name.className='month-name';name.textContent=label;track.className='month-track';track.setAttribute('aria-label',label+' '+hoursText(s.months[i]));fill.className='month-fill';fill.style.width=(s.months[i]/max*100)+'%';track.append(fill);value.className='month-value';value.textContent=hoursText(s.months[i]);row.append(name,track,value);el.append(row)})}
function awards(s){const out=[],top=s.tracks[0],total=s.plays;if(!top)return[{icon:'🔎',title:'No track records yet',detail:'No qualifying plays over 30 seconds were found for 2026.',proof:'Try selecting all history JSON files.'}];
 if(top.plays>=2)out.push({icon:'🔁',title:'The Repeat Offender',detail:'Your most-recorded track came back for another round.',proof:top.name+' — '+fmt(top.plays)+' recorded plays'});
 if(s.artistNames.size>=30&&total>=50)out.push({icon:'🧭',title:'The Artist Explorer',detail:'A wide artist roster across your recorded plays.',proof:fmt(s.artistNames.size)+' unique artist names · '+fmt(total)+' events'});
 if(total>=10&&top.plays/total>=.1)out.push({icon:'💿',title:'One Track, One Era',detail:'Your top track accounts for at least 10% of recorded track events.',proof:top.name+' — '+(top.plays/total*100).toFixed(1)+'% of events'});
 if(s.maxDay&&s.maxDay[1]>0)out.push({icon:'⚡',title:'Peak Listening Day',detail:'Your busiest UTC day by recorded listening time.',proof:s.maxDay[0]+' — '+hoursText(s.maxDay[1])});
 const month=['January','February','March','April','May','June','July','August','September','October','November','December'][s.maxMonth];if(s.months[s.maxMonth]>0)out.push({icon:'📈',title:'The Main Month',detail:'Your biggest month by recorded listening time.',proof:month+' — '+hoursText(s.months[s.maxMonth])});
 if(s.activeDays>=20)out.push({icon:'📆',title:'Regular on the Rotation',detail:'You have track activity on at least 20 dates.',proof:fmt(s.activeDays)+' active UTC days in 2026'});
 return out.length?out:[{icon:'🪩',title:'The Open Tab',detail:'Your listening pattern is still taking shape.',proof:fmt(total)+' recorded track events so far'}]}
function renderAwards(s){const el=$('awardsGrid');el.replaceChildren();awards(s).forEach(a=>{const card=document.createElement('article'),icon=document.createElement('span'),h=document.createElement('h3'),p=document.createElement('p'),proof=document.createElement('span');card.className='panel award-card';icon.className='award-icon';icon.textContent=a.icon;h.textContent=a.title;p.textContent=a.detail;proof.className='award-proof';proof.textContent=a.proof;card.append(icon,h,p,proof);el.append(card)})}
function getStoryRange(){
 if($('storyRangeMode')?.value!=='dashboard')return{valid:true,kind:'wrapped2026',start:Date.UTC(YEAR,0,1),end:WRAPPED_CUTOFF,label:'2026 Wrapped (Jan 1–Nov 15 UTC)'};
 const mode=$('analyticsRange').value;
 return mode==='custom'?WrappedAnalytics.dateRange('custom',{start:$('rangeStart').value,end:$('rangeEnd').value}):WrappedAnalytics.dateRange(mode);
}
function buildSlides(){
 if(!myHistoryRows.length){slides=[];slideIndex=0;renderSlide();return}
 const range=getStoryRange();
 if(!range.valid){slides=[{type:'error',eyebrow:'DATE RANGE NEEDS ATTENTION',title:'Check the selected dates.',body:range.error||'Choose a valid date range before building this story.'}];slideIndex=0;renderSlide();return}
 const result=WrappedAnalytics.buildStory(myHistoryRows,{range,incomplete:true,requireTrackAndArtistForDuration:true});
 slides=result.stories||[];slideIndex=0;renderSlide();
}
function renderSlide(){
 const el=$('storySlide');el.replaceChildren();
 if(!slides.length){
  const ey=document.createElement('p'),h=document.createElement('h3'),p=document.createElement('p');
  ey.className='eyebrow';ey.textContent='WAITING FOR THE RECEIPTS';h.textContent='Your year has a soundtrack.';p.textContent='Import your history to unlock a verified sequence of listening stories.';
  el.append(ey,h,p);$('storyCounter').textContent='0 / 0';$('legacyStoryProgress').replaceChildren();$('legacyStoryProgress').setAttribute('aria-valuemin','0');$('legacyStoryProgress').setAttribute('aria-valuemax','0');$('legacyStoryProgress').setAttribute('aria-valuenow','0');$('legacyStoryProgress').setAttribute('aria-valuetext','No story loaded');
  $('storyPrev').disabled=true;$('legacyStoryNext').disabled=true;$('downloadCard').disabled=true;$('legacyStoryNext').textContent='NEXT SLIDE ↗';
  return;
 }
 const s=slides[slideIndex],ey=document.createElement('p'),h=document.createElement('h3'),p=document.createElement('p');
 ey.className='eyebrow';ey.textContent=s.eyebrow||'YOUR LISTENING STORY';h.id='storySlideHeading';h.textContent=s.title||'Listening story';p.textContent=s.body||'';
 el.setAttribute('aria-label','Story '+(slideIndex+1)+' of '+slides.length);
 el.append(ey);
 if(s.number){const n=document.createElement('div');n.className='story-number';n.textContent=s.number;el.append(n)}
 el.append(h);
 if(Array.isArray(s.list)&&s.list.length){
  const ul=document.createElement('ul');ul.className='story-list';
  s.list.forEach(value=>{const li=document.createElement('li');li.textContent=value;ul.append(li)});el.append(ul);
 }
 el.append(p);
 const meta=document.createElement('p');meta.className='story-meta';meta.textContent=[s.rangeLabel,s.caveat].filter(Boolean).join(' · ');
 if(meta.textContent)el.append(meta);
 $('storyCounter').textContent=(slideIndex+1)+' / '+slides.length;
 const prog=$('legacyStoryProgress');prog.replaceChildren();prog.setAttribute('role','progressbar');prog.setAttribute('aria-valuemin','1');prog.setAttribute('aria-valuemax',String(slides.length));prog.setAttribute('aria-valuenow',String(slideIndex+1));prog.setAttribute('aria-valuetext','Story '+(slideIndex+1)+' of '+slides.length);
 slides.forEach((_,i)=>{const x=document.createElement('span');if(i<=slideIndex)x.className='active';x.setAttribute('aria-hidden','true');prog.append(x)});
 $('storyPrev').disabled=slideIndex===0;$('legacyStoryNext').disabled=slideIndex===slides.length-1;
 $('downloadCard').disabled=s.type==='empty'||s.type==='error';
 $('legacyStoryNext').textContent=slideIndex===slides.length-1?'END OF STORY ✓':'NEXT SLIDE ↗';
 el.classList.remove('story-refresh');void el.offsetWidth;el.classList.add('story-refresh');
}
function wrapText(ctx,text,x,y,width,lineHeight,maxLines=100){
 const lines=[];
 for(const paragraph of String(text??'').split(/\n/)){
  if(!paragraph.trim()){lines.push('');continue}
  let line='';
  for(const word of paragraph.split(/\s+/)){
   if(ctx.measureText(word).width>width){
    if(line){lines.push(line);line=''}
    let chunk='';
    for(const char of Array.from(word)){
     if(chunk&&ctx.measureText(chunk+char).width>width){lines.push(chunk);chunk=char}else chunk+=char;
    }
    line=chunk;
   }else{
    const test=line?line+' '+word:word;
    if(ctx.measureText(test).width>width&&line){lines.push(line);line=word}else line=test;
   }
  }
  if(line)lines.push(line);
 }
 let visible=lines;
 if(lines.length>maxLines){
  visible=lines.slice(0,maxLines);
  let last=visible[visible.length-1]||'';
  while(last&&ctx.measureText(last+'…').width>width)last=Array.from(last).slice(0,-1).join('');
  visible[visible.length-1]=last+'…';
 }
 visible.forEach((line,index)=>ctx.fillText(line,x,y+index*lineHeight));
 return y+visible.length*lineHeight;
}
function downloadCard(){
 const cardIndex=slideIndex,cardCount=slides.length,s=slides[cardIndex];
 if(!s||s.type==='empty'||s.type==='error'){ $('fileStatus').textContent='Choose a story with verified listening statistics before exporting a card.';return; }
 try{
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas drawing is unavailable in this browser.');
  const theme=document.documentElement.dataset.theme;
  const palettes={
   spotify:{bg:'#101010',panel:'#191919',accent:'#c8ff00',accent2:'#ff4fa3',ink:'#f7f7f2',muted:'#b7b7ad',footer:'YOUR YEAR. YOUR RECEIPTS.'},
   y2k:{bg:'#220d35',panel:'#39134d',accent:'#ff91df',accent2:'#a7a0ff',ink:'#fff5ff',muted:'#f5bde9',footer:'STAY SPARKLY. STAY ICONIC. ✧'},
   futuristic:{bg:'#101317',panel:'#1e242a',accent:'#e9f2f8',accent2:'#8f9da9',ink:'#f4f7f9',muted:'#aeb8c1',footer:'ARCHIVE COMPLETE // SIGNAL VERIFIED'}
  };
  const p=palettes[theme]||palettes.spotify;
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,1080,1920);ctx.strokeStyle=p.accent;ctx.lineWidth=3;ctx.strokeRect(34,34,1012,1852);ctx.fillStyle=p.panel;ctx.fillRect(54,54,972,1812);
  if(theme==='spotify'){
   ctx.fillStyle=p.accent;ctx.fillRect(54,54,972,16);ctx.save();ctx.translate(900,290);ctx.rotate(-.22);ctx.fillStyle=p.accent2;ctx.fillRect(-115,-115,230,230);ctx.rotate(.44);ctx.fillStyle=p.accent;ctx.fillRect(-92,-92,184,184);ctx.restore();ctx.fillStyle=p.bg;ctx.beginPath();ctx.arc(900,290,52,0,Math.PI*2);ctx.fill();
  }else if(theme==='y2k'){
   const g=ctx.createLinearGradient(80,80,1000,1840);g.addColorStop(0,'#ff8bdc');g.addColorStop(.48,'#a59aff');g.addColorStop(1,'#68dfff');ctx.strokeStyle=g;ctx.lineWidth=9;ctx.strokeRect(72,72,936,1776);
   for(let i=0;i<55;i++){const x=(i*137)%1000+40,y=(i*211)%1770+80;ctx.fillStyle=i%3===0?'#fff4ff':i%2?p.accent:p.accent2;ctx.font='24px sans-serif';ctx.fillText(i%5===0?'✧':i%3===0?'✦':'✶',x,y)}
  }else{
   const metal=ctx.createLinearGradient(100,100,980,450);metal.addColorStop(0,'#66727d');metal.addColorStop(.25,'#f8fcff');metal.addColorStop(.5,'#7f8b95');metal.addColorStop(.72,'#edf3f7');metal.addColorStop(1,'#58636d');ctx.strokeStyle=metal;ctx.lineWidth=10;ctx.strokeRect(72,72,936,1776);ctx.strokeStyle='#64717d';ctx.lineWidth=1;
   for(let y=180;y<1750;y+=48){ctx.beginPath();ctx.moveTo(78,y);ctx.lineTo(1002,y);ctx.stroke()}
  }
  ctx.fillStyle=p.ink;ctx.font='600 27px monospace';ctx.fillText(theme==='y2k'?'WRAPPED.exe ✧ YOUR STORY':theme==='futuristic'?'WRAPPED.exe // AUDIO ARCHIVE':'WRAPPED.exe / LISTENING STORY',82,132);
  ctx.fillStyle=p.accent;ctx.font='700 25px monospace';wrapText(ctx,(theme==='y2k'?'✧ ':'')+String(s.eyebrow||'YOUR LISTENING STORY').toUpperCase(),82,520,850,38,2);
  ctx.fillStyle=p.ink;ctx.font='700 76px sans-serif';const titleEnd=wrapText(ctx,s.title||'Your recap',82,635,850,84,3);
  let y=Math.max(900,titleEnd+28);
  if(s.number){const numGrad=ctx.createLinearGradient(82,0,850,0);numGrad.addColorStop(0,p.accent);numGrad.addColorStop(1,p.accent2);ctx.fillStyle=numGrad;ctx.font='700 112px sans-serif';y=wrapText(ctx,s.number,82,y,850,120,1)+18}
  const bodyText=[...(Array.isArray(s.list)?s.list:[]),s.body||''].filter(Boolean).join('\n');
  ctx.fillStyle=p.ink;ctx.font='400 29px sans-serif';wrapText(ctx,bodyText,82,Math.max(1070,y),850,43,6);
  if($('includeRangeOnCard').checked){ctx.fillStyle=p.accent;ctx.font='600 21px monospace';wrapText(ctx,'RANGE: '+(s.rangeLabel||'Selected date range'),82,1370,850,28,2)}
  ctx.fillStyle=p.muted;ctx.font='20px monospace';wrapText(ctx,'BASED ON IMPORTED HISTORY · MAY BE INCOMPLETE',82,1430,850,27,2);
  if($('includeCalculationNote').checked){ctx.fillStyle=p.muted;ctx.font='19px monospace';wrapText(ctx,'QUALIFYING PLAYS > 30,000 MS · ARTIST POINTS ARE ESTIMATES',82,1500,850,26,2)}
  ctx.fillStyle=p.accent2;ctx.fillRect(82,1608,916,3);ctx.fillStyle=p.accent;ctx.font='700 27px monospace';ctx.fillText(p.footer,82,1680);ctx.fillStyle=p.muted;ctx.font='22px monospace';ctx.fillText('CARD '+String(slideIndex+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0'),82,1740);ctx.fillText(theme==='y2k'?'made with real receipts & extra glitter':theme==='futuristic'?'LOCAL PROCESSING // NO DATA UPLOADED':'Generated locally from selected history',82,1790);
  canvas.toBlob(blob=>{
   if(!blob){$('fileStatus').textContent='Image export failed in this browser. Try another browser or save the story text manually.';return}
   try{
    const url=URL.createObjectURL(blob),link=document.createElement('a'),safeType=String(s.type||'story').replace(/[^a-z0-9-]/gi,'').toLowerCase();
    link.href=url;link.download='wrapped-story-card-'+safeType+'-'+String(cardIndex+1).padStart(2,'0')+'.png';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    $('fileStatus').textContent='Saved story card '+(cardIndex+1)+' of '+cardCount+' as a PNG. Only this story card was exported; raw history stays in this browser.';
   }catch(error){$('fileStatus').textContent='The image was created but the download could not start. Check your browser download settings and try again.'}
  },'image/png');
 }catch(error){$('fileStatus').textContent='Image export failed: '+(error&&error.message?error.message:'unsupported canvas operation')+'. Your listening history was not uploaded.'}
}
function renderMine(rows,count,diagnostics){myHistoryRows=rows.slice();window.dispatchEvent(new CustomEvent('wrapped-history-updated',{detail:{rows:myHistoryRows,diagnostics}}));mine=summarize(rows);const s=mine;$('minutesStat').textContent=fmt(Math.floor(s.total/60000));$('hoursStat').textContent=hoursText(s.total)+' recorded';$('artistsStat').textContent=fmt(s.artistNames.size);$('playsStat').textContent=fmt(s.plays);$('topTrackStat').textContent=s.tracks[0]?.name||'No track data';$('topTrackArtist').textContent=s.tracks[0]?.artist||'Check selected JSON files';$('dataBadge').textContent=s.plays?'2026 DATA LOADED':'NO 2026 PLAYS FOUND';renderRank('topArtists',s.artists,'artist');renderRank('topTracks',s.tracks,'track');renderHeat(s);renderMonths(s);renderAwards(s);buildSlides();renderLifetimeAnalytics();$('fileStatus').textContent='Read '+count+' selected JSON file(s) locally; '+fmt(diagnostics?.filesParsed??count)+' contained recognized history arrays. '+fmt(diagnostics?.acceptedRecords??rows.length)+' records accepted, '+fmt(diagnostics?.rejectedRecords??0)+' malformed records rejected, '+fmt(diagnostics?.invalidTimestamps??0)+' invalid/missing timestamps, '+fmt(diagnostics?.missingDuration??0)+' missing durations, '+fmt(diagnostics?.invalidDuration??0)+' malformed/negative durations, and '+fmt(diagnostics?.possibleDuplicateFiles?.length??0)+' possible duplicate file selections. Found '+fmt(s.events)+' track records and '+fmt(s.plays)+' qualifying plays (>30 seconds) in the Wrapped-style window (Jan 1–Nov 15, 2026). Artist scores are estimates (1.0 primary, 0.5 explicitly listed secondary artists). No files leave this browser.';renderCompare()}
function compare(){if(!mine||!friend)return;const aa=new Set(mine.artists.map(x=>x.name.toLocaleLowerCase())),ba=new Set(friend.artists.map(x=>x.name.toLocaleLowerCase())),at=new Set(mine.tracks.map(x=>(x.name+'\u0000'+x.artist).toLocaleLowerCase())),bt=new Set(friend.tracks.map(x=>(x.name+'\u0000'+x.artist).toLocaleLowerCase())),sa=[...aa].filter(x=>ba.has(x)),st=[...at].filter(x=>bt.has(x)),combined=new Set([...aa,...ba]);return{sa,st,overlap:Math.round(sa.length/Math.max(1,combined.size)*100)}}
function renderCompare(){const el=$('compareResults');el.replaceChildren();if(!mine||!friend){el.hidden=true;return}const s=compare();[[fmt(s.sa.length),'SHARED ARTISTS'],[fmt(s.st.length),'SHARED TRACKS'],[s.overlap+'%','ARTIST OVERLAP']].forEach(([v,l])=>{const card=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');card.className='compare-metric';strong.textContent=v;span.textContent=l;card.append(strong,span);el.append(card)});const detail=document.createElement('div'),h=document.createElement('h4'),p=document.createElement('p');detail.className='compare-shared';h.textContent='Your shared soundtrack';p.textContent=s.st.length?s.st.slice(0,12).map(x=>x.replace('\u0000',' — ')).join(' · '):'No matching track + artist names found in the selected 2026 records.';detail.append(h,p);el.append(detail);el.hidden=false}
$('historyFiles').addEventListener('change',async e=>{
 if(!e.target.files?.length)return;
 const token=++mineImportToken,files=[...e.target.files];e.target.value='';
 $('fileStatus').textContent='Reading selected files locally…';
 let r;
 try{r=await loadFiles(files);}catch(error){if(token!==mineImportToken)return;$('resetData').click();$('fileStatus').textContent='Could not read the selected files. Check that they are valid JSON files and try again.';return;}
 if(token!==mineImportToken)return;
 if(!r.rows.length){
  $('resetData').click();
  $('fileStatus').textContent='No history records were imported. Check the file messages and choose a valid Spotify Extended Streaming History JSON export. '+r.errors.join(' · ');
  return;
 }
 renderMine(r.rows,r.count,r.diagnostics);
 if(r.errors.length)$('fileStatus').textContent+=' Skipped: '+r.errors.join(' · ');
});
$('friendFiles').addEventListener('change',async e=>{
 if(!e.target.files?.length)return;
 const token=++friendImportToken,files=[...e.target.files];e.target.value='';
 $('friendStatus').textContent='Reading the second export locally…';
 let r;
 try{r=await loadFiles(files);}catch(error){if(token!==friendImportToken)return;friend=null;$('friendStatus').textContent='Could not read the selected files. Choose valid Spotify history JSON files and try again.';renderCompare();return;}
 if(token!==friendImportToken)return;
 if(!r.rows.length){friend=null;$('friendStatus').textContent='No comparison records were imported. '+r.errors.join(' · ');renderCompare();return;}
 friend=summarize(r.rows);
 $('friendStatus').textContent='Processed '+r.count+' file(s) locally; '+fmt(r.diagnostics.acceptedRecords)+' records accepted, '+fmt(r.diagnostics.rejectedRecords)+' rejected, '+fmt(r.diagnostics.invalidDuration||0)+' invalid durations. '+fmt(friend.plays)+' eligible 2026 plays.';
 renderCompare();
});
$('storyPrev').addEventListener('click',()=>{if(slideIndex>0){slideIndex--;renderSlide()}});
$('legacyStoryNext').addEventListener('click',()=>{if(slideIndex<slides.length-1){slideIndex++;renderSlide()}});
$('downloadCard').addEventListener('click',downloadCard);
$('storyRangeMode').addEventListener('change',buildSlides);
$('storyExit').addEventListener('click',()=>{$('storyPanel').hidden=true;$('storyLaunch').hidden=false;$('storyLaunch').setAttribute('aria-expanded','false');$('storyLaunch').focus()});
$('storyLaunch').addEventListener('click',()=>{$('storyLaunch').hidden=true;$('storyPanel').hidden=false;$('storyLaunch').setAttribute('aria-expanded','true');$('storySlide').focus()});
window.addEventListener('wrapped-range-changed',()=>{if($('storyRangeMode').value==='dashboard')buildSlides()});
document.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 const panel=$('storyPanel');
 if(!panel||panel.hidden||!panel.contains(document.activeElement))return;
 if(e.key==='ArrowRight'&&slideIndex<slides.length-1){e.preventDefault();slideIndex++;renderSlide()}
 if(e.key==='ArrowLeft'&&slideIndex>0){e.preventDefault();slideIndex--;renderSlide()}
});
$('analyticsRange').addEventListener('change',()=>{renderLifetimeAnalytics();window.dispatchEvent(new Event('wrapped-range-changed'))});
$('applyRange').addEventListener('click',()=>{renderLifetimeAnalytics();window.dispatchEvent(new Event('wrapped-range-changed'))});
$('rangeStart').addEventListener('change',()=>{if($('analyticsRange').value==='custom'){renderLifetimeAnalytics();window.dispatchEvent(new Event('wrapped-range-changed'))}});
$('rangeEnd').addEventListener('change',()=>{if($('analyticsRange').value==='custom'){renderLifetimeAnalytics();window.dispatchEvent(new Event('wrapped-range-changed'))}});
$('themeSelect').addEventListener('change',e=>applyTheme(e.target.value));
applyTheme($('themeSelect').value);
$('resetData').addEventListener('click',()=>{mineImportToken++;friendImportToken++;mine=null;friend=null;myHistoryRows=[];window.dispatchEvent(new CustomEvent('wrapped-history-updated',{detail:{rows:[],diagnostics:null}}));slides=[];slideIndex=0;$('historyFiles').value='';$('friendFiles').value='';['minutesStat','artistsStat','playsStat'].forEach(id=>$(id).textContent='—');$('hoursStat').textContent='Upload history to calculate';$('topTrackStat').textContent='Not unlocked';$('topTrackArtist').textContent='Real data goes here';$('dataBadge').textContent='NO DATA LOADED';$('fileStatus').textContent='Waiting for your data. Nothing is calculated yet.';$('friendStatus').textContent='No comparison data loaded.';renderRank('topArtists',[],'artist');renderRank('topTracks',[],'track');$('heatmap').replaceChildren();const e=document.createElement('p');e.className='empty-row';e.textContent='Upload history to build your heatmap.';$('heatmap').append(e);$('monthlyTimeline').replaceChildren();const m=e.cloneNode();m.textContent='Your monthly timeline will appear after upload.';$('monthlyTimeline').append(m);$('awardsGrid').replaceChildren();const a=document.createElement('article');a.className='panel award-card';a.innerHTML='<span class="award-icon">🏆</span><h3>Awards are locked.</h3><p>Upload history to see which records qualify.</p>';$('awardsGrid').append(a);$('storySlide').replaceChildren();const h=document.createElement('h3'),p=document.createElement('p');h.textContent='Your year has a soundtrack.';p.textContent='Upload your streaming history to unlock your personalized story.';$('storySlide').append(h,p);$('storyCounter').textContent='0 / 0';$('legacyStoryProgress').replaceChildren();$('legacyStoryProgress').setAttribute('aria-valuemin','0');$('legacyStoryProgress').setAttribute('aria-valuemax','0');$('legacyStoryProgress').setAttribute('aria-valuenow','0');$('legacyStoryProgress').setAttribute('aria-valuetext','No story loaded');$('storyPrev').disabled=true;$('legacyStoryNext').disabled=true;$('downloadCard').disabled=true;$('legacyStoryNext').textContent='NEXT SLIDE ↗';$('compareResults').replaceChildren();$('compareResults').hidden=true;renderLifetimeAnalytics()});
$('buildLife').addEventListener('click',()=>{const lines=$('lifeNotes').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean),out=$('lifeOutput');out.replaceChildren();out.hidden=false;const h=document.createElement('h3');h.textContent=lines.length?'THE LORE, AS SUBMITTED.':'THE LORE IS CURRENTLY LOADING…';out.append(h);if(!lines.length){const p=document.createElement('p');p.textContent='Add one or more memories above. We will only recap details you actually enter.';out.append(p);return}const p=document.createElement('p');p.textContent='Your recap contains '+lines.length+' item'+(lines.length===1?'':'s')+' you entered. No extra life events were inferred.';out.append(p);const ul=document.createElement('ul');lines.forEach(line=>{const li=document.createElement('li');li.textContent=line;ul.append(li)});out.append(ul)});
