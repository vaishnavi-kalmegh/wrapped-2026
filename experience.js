/* WRAPPED.exe Phase 6 storytelling experience. Raw history stays in-browser. */
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.WrappedExperience=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  const $=id=>root.document&&root.document.getElementById(id);
  const number=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(n||0);
  const minutes=ms=>{const m=Math.floor((ms||0)/60000);if(m<60)return number(m)+' min';const h=Math.floor(m/60),r=m%60;return h+'h '+r+'m';};
  const hours=ms=>(Math.max(0,ms||0)/3600000).toFixed(1)+' h';
  const safe=(s)=>String(s==null?'':s);
  const key=s=>safe(s).normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g,' ');
  const escapeHTML=s=>safe(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const colors=['#1ed760','#ff4fa0','#a879ff','#ff8b4d','#53d9ff','#e8d95b','#ff6f61','#83e2b2','#b6a0ff','#ffb7d5','#c7f464','#74a7ff'];
  const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function rangeFor(value,start,end){
    const A=root.WrappedAnalytics;
    if(!A)return {valid:false,error:'Analytics engine is unavailable.'};
    if(value==='custom')return A.dateRange('custom',{start,end});
    return A.dateRange(value||'allTime');
  }
  function summarize(rows,range){
    return root.WrappedAnalytics.summarize(rows,{range:range||root.WrappedAnalytics.dateRange('allTime'),includeUnqualifiedGroups:true});
  }
  function monthBuckets(summary,range){
    if(!summary||!summary.valid)return [];
    const records=summary.records||[],dated=records.filter(r=>r.timestamp!=null);
    if(!dated.length)return [];
    const startMs=range&&range.start!=null?range.start:Math.min(...dated.map(r=>r.timestamp));
    const endMs=range&&range.end!=null?range.end:Math.max(...dated.map(r=>r.timestamp));
    const start=new Date(startMs),end=new Date(endMs),cursor=Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),1),last=Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),1);
    const map=summary.monthsByYear instanceof Map?summary.monthsByYear:new Map();
    const out=[];
    for(let t=cursor;t<=last;){const d=new Date(t),id=d.toISOString().slice(0,7),ms=map.get(id)||0;out.push({id,label:monthNames[d.getUTCMonth()]+' '+d.getUTCFullYear(),month:monthNames[d.getUTCMonth()],year:d.getUTCFullYear(),ms,share:0});t=Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1);}
    const total=out.reduce((s,x)=>s+x.ms,0);
    out.forEach(x=>x.share=total?x.ms/total:0);
    return out;
  }
  function hourBuckets(summary){
    const raw=summary&&Array.isArray(summary.hours)?summary.hours:Array(24).fill(0);
    const total=raw.reduce((s,n)=>s+(Number(n)||0),0);
    return raw.map((ms,h)=>({hour:h,label:String(h).padStart(2,'0')+':00',ms:Number(ms)||0,share:total?(Number(ms)||0)/total:0}));
  }
  function heatmapDays(summary){
    const records=(summary&&summary.records||[]).filter(r=>r.timestamp!=null);
    if(!records.length)return {days:[],first:null,last:null};
    const keys=records.map(r=>new Date(r.timestamp).toISOString().slice(0,10)).sort();
    const first=keys[0],last=keys[keys.length-1],map=summary.days instanceof Map?summary.days:new Map();
    const out=[];
    for(let t=Date.parse(first+'T00:00:00Z');t<=Date.parse(last+'T00:00:00Z');t+=86400000){
      const date=new Date(t).toISOString().slice(0,10);
      out.push({date,ms:map.get(date)||0,known:true});
    }
    return {days:out,first,last};
  }
  function loreFor(summary){
    if(!summary||!summary.valid||!summary.records.length)return {title:'Your archive is waiting.',body:'Import your Spotify history to reveal the patterns your records actually support.',kind:'empty',basis:'No listening claims are made before records are imported.'};
    const tracks=summary.tracks.filter(t=>t.plays>0),artists=summary.artists.filter(a=>a.plays>0),plays=summary.plays;
    if(!plays)return {title:'The quiet before the data.',body:'This range has recorded duration, but no qualifying plays over 30 seconds to rank tracks or artists.',kind:'duration',basis:'Short events count toward recorded listening time; a qualifying play must exceed 30,000 ms.'};
    const top=tracks[0],topShare=top?top.plays/plays:0;
    if(top&&plays>=10&&topShare>=.2)return {title:'One track kept calling.',body:top.name+' accounts for '+number(topShare*100)+'% of qualifying plays in this range.',kind:'repeat',basis:'At least 10 qualifying plays; top track is at least 20% of qualifying plays.'};
    const lead=artists[0],artistShare=lead&&summary.plays?lead.plays/summary.plays:0;
    if(lead&&plays>=10&&artistShare>=.5)return {title:'One artist dominates the receipts.',body:lead.name+' leads the estimated artist play points with '+number(artistShare*100)+'% of the total qualifying play count.',kind:'artist',basis:'At least 10 qualifying plays; leading artist point count is at least half of the qualifying play count. Collaborations use weighted estimates.'};
    if(tracks.length>=20&&plays>=10&&topShare<.1)return {title:'Your rotation goes deep.',body:tracks.length+' track groups have qualifying plays, and the top track is under 10% of the qualifying-play total.',kind:'catalog',basis:'At least 10 qualifying plays, at least 20 qualifying track groups, and top track below 10%.'};
    const hour=hourBuckets(summary).sort((a,b)=>b.ms-a.ms||a.hour-b.hour)[0];
    if(hour&&hour.ms>0&&hour.share>=.2)return {title:'A clear hour has emerged.',body:hour.label+' UTC holds '+number(hour.share*100)+'% of the timestamped listening duration in this range.',kind:'hour',basis:'The most active UTC hour holds at least 20% of all timestamped recorded duration.'};
    return {title:'A listening pattern, not a personality test.',body:tracks.length+' track groups and '+artists.length+' artist groups earned qualifying plays in this range.',kind:'breadth',basis:'Counts use qualifying events strictly over 30,000 ms; no genre or mood is inferred.'};
  }
  function makeStory(summary,range){
    if(!summary||!summary.valid)return [{type:'empty',eyebrow:'RANGE ERROR',title:'That range needs a second look.',body:summary&&summary.error||'Choose a valid date range.'}];
    if(!summary.records.length)return [{type:'empty',eyebrow:'NO MATCHING RECORDS',title:'No story without receipts.',body:'No eligible music records were found in this range. Try another date range or import more history.'}];
    const slides=[],lore=loreFor(summary),tracks=summary.tracks.filter(x=>x.plays>0),artists=summary.artists.filter(x=>x.plays>0);
    slides.push({type:'lore',eyebrow:'LISTENING LORE',title:lore.title,body:lore.body,detail:lore.basis});
    if(artists.length)slides.push({type:'artists',eyebrow:'TOP ARTISTS',title:'Your top artists.',items:artists.slice(0,5).map((x,i)=>({rank:i+1,name:x.name,value:number(x.plays)+' estimated play points'})),body:'Primary artist = 1.0 point; explicitly listed secondary artists = 0.5 per qualifying event.'});
    if(tracks.length)slides.push({type:'tracks',eyebrow:'TOP SONGS',title:'The tracks in heavy rotation.',items:tracks.slice(0,5).map((x,i)=>({rank:i+1,name:x.name,artist:x.artist,value:number(x.plays)+' qualifying plays'})),body:'Track groups use track name + primary artist. Qualifying plays exceed 30,000 ms.'});
    slides.push({type:'duration',eyebrow:'YOUR LISTENING NUMBERS',title:minutes(summary.total)+' recorded.',body:number(summary.plays)+' qualifying plays across '+number(summary.artistNames.size)+' artist names with qualifying plays.',detail:'Recorded duration includes positive short events; play rankings require more than 30 seconds.'});
    const months=monthBuckets(summary,range).filter(x=>x.ms>0).sort((a,b)=>b.ms-a.ms||a.id.localeCompare(b.id));
    if(months.length)slides.push({type:'month',eyebrow:'LISTENING PATTERNS',title:months[0].label+' was your peak month.',body:minutes(months[0].ms)+' recorded in that UTC calendar month.',detail:'Only timestamped events can be assigned to a month. The selected export may be incomplete.'});
    const peak=hourBuckets(summary).sort((a,b)=>b.ms-a.ms||a.hour-b.hour)[0];
    if(peak&&peak.ms>0)slides.push({type:'hour',eyebrow:'THE 24-HOUR MIX',title:peak.label+' UTC leads.',body:minutes(peak.ms)+' recorded at this UTC hour.',detail:'Hours are grouped by the timestamp in UTC, not local time.'});
    slides.push({type:'closing',eyebrow:'THE FINAL RECEIPT',title:'All signal. No invented stats.',body:'Based on imported history and the selected range: '+(range.label||'All time')+'.',detail:'This archive may be incomplete. No raw listening-history records are included in story exports.'});
    return slides;
  }
  let rows=[],diagnostics=null,range=null,summary=null,slideList=[],slideIndex=0,trackLimit=10,artistLimit=10,requestToken={artist:0,track:0},artworkCache=new Map();
  function getRange(){
    const mode=$('experienceRange')?.value||'allTime';
    const start=$('experienceStart')?.value||'',end=$('experienceEnd')?.value||'';
    return rangeFor(mode,start,end);
  }
  function renderLore(){
    const lore=loreFor(summary),el=$('loreCard');if(!el)return;
    el.innerHTML='<p class="eyebrow">YOUR LISTENING LORE</p><div class="lore-stamp" aria-hidden="true">'+(lore.kind==='repeat'?'↻':lore.kind==='artist'?'✳':lore.kind==='catalog'?'✦':lore.kind==='hour'?'◷':'✧')+'</div><h2 id="loreHeading">'+escapeHTML(lore.title)+'</h2><p>'+escapeHTML(lore.body)+'</p><details><summary>Why this observation?</summary><p>'+escapeHTML(lore.basis)+'</p></details>';
    $('loreRangeLabel').textContent=range.label||'All time';
  }
  function rankingCard(item,rank,type){
    const artist=type==='artist',name=artist?item.name:item.name,sub=artist?number(item.plays)+' estimated play points':item.artist+' · '+number(item.plays)+' qualifying plays';
    const img=artist?item.imageUrl:item.artworkUrl,alt=artist?'Profile image for '+name:'Album artwork for '+name;
    const image=img?'<img loading="lazy" src="'+escapeHTML(img)+'" alt="'+escapeHTML(alt)+'" referrerpolicy="no-referrer">':'<div class="art-fallback '+(artist?'artist-fallback':'track-fallback')+'" aria-hidden="true"><span>'+(artist?'✳':'♫')+'</span></div>';
    return '<article class="music-card '+(rank<=5?'featured':'')+' '+type+'-card"><div class="music-art">'+image+'<span class="music-rank">'+String(rank).padStart(2,'0')+'</span></div><div class="music-meta"><h3 title="'+escapeHTML(name)+'">'+escapeHTML(name)+'</h3><p>'+escapeHTML(artist?sub:item.artist)+'</p><span class="music-metric">'+escapeHTML(artist?number(item.plays)+' estimated play points':number(item.plays)+' qualifying plays')+'</span></div></article>';
  }
  function renderRanks(type){
    const artist=type==='artist',items=artist?(summary?summary.artists:[]):(summary?summary.tracks:[]),limit=artist?artistLimit:trackLimit,container=$(artist?'artistCards':'trackCards'),more=$(artist?'artistsLoadMore':'tracksLoadMore'),status=$(artist?'artistCardsStatus':'trackCardsStatus');
    const ranked=items.filter(x=>x.plays>0),shown=ranked.slice(0,Math.min(50,limit));
    if(!rows.length||!ranked.length){container.innerHTML='<div class="empty-state"><span>✧</span><h3>Waiting for your data</h3><p>Import a Spotify history JSON file to rank this section.</p></div>';more.hidden=true;status.textContent='No qualifying results in this range.';return;}
    container.innerHTML=shown.map((x,i)=>rankingCard(x,i+1,type)).join('');
    status.textContent='Showing '+shown.length+' of '+Math.min(50,ranked.length)+' available ranked '+(artist?'artist':'track')+' groups. Rankings use the shared analytics engine.';
    more.hidden=shown.length>=Math.min(50,ranked.length);
    more.textContent='LOAD MORE · '+Math.min(10,Math.min(50,ranked.length)-shown.length)+' NEXT';
    const collapse=$(artist?'artistsCollapse':'tracksCollapse');collapse.hidden=shown.length<=10;
    resolveArtwork(shown.slice(0,5),type);
  }
  function resolveArtwork(items,type){
    if(!$('artworkLookupEnabled')||!$('artworkLookupEnabled').checked){items.forEach(item=>{delete item.imageUrl;delete item.artworkUrl;});return;}
    const token=++requestToken[type];
    items.slice(0,5).forEach(item=>{
      const cacheKey=(type==='artist'?'artist:':'track:')+(type==='artist'?item.name:item.name+'|'+item.artist);
      if(artworkCache.has(cacheKey)){item[type==='artist'?'imageUrl':'artworkUrl']=artworkCache.get(cacheKey);return;}
      const task=type==='artist'?artistImage(item.name):trackArtwork(item.name,item.artist);
      task.then(url=>{
        if(!url)return;artworkCache.set(cacheKey,url);
        if(token!==requestToken[type]||!$('artworkLookupEnabled')?.checked)return;
        item[type==='artist'?'imageUrl':'artworkUrl']=url;
        const limit=type==='artist'?artistLimit:trackLimit;
        const visible=(type==='artist'?summary?.artists:summary?.tracks)||[];
        const index=visible.findIndex(x=>key(type==='artist'?x.name:x.name+'|'+x.artist)===key(type==='artist'?item.name:item.name+'|'+item.artist));
        if(index>=0&&index<Math.min(5,limit))renderRanks(type);
      }).catch(()=>{});
    });
  }
  async function trackArtwork(track,artist){
    const query=new URLSearchParams({term:track+' '+artist,entity:'song',limit:'8'});
    const response=await fetch('https://itunes.apple.com/search?'+query.toString(),{mode:'cors'});
    if(!response.ok)throw new Error('Artwork lookup failed');
    const data=await response.json();
    const match=(data.results||[]).find(x=>key(x.trackName)===key(track)&&key(x.artistName)===key(artist)&&x.artworkUrl100);
    return match?match.artworkUrl100.replace('100x100bb','600x600bb'):null;
  }
  async function artistImage(name){
    const url='https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(name);
    const response=await fetch(url,{mode:'cors',headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error('Artist image lookup failed');
    const data=await response.json();
    if(!data.title||key(data.title)!==key(name)||!data.thumbnail||!data.thumbnail.source)return null;
    return data.thumbnail.source;
  }
  function renderNumbers(){
    $('numberTime').textContent=hours(summary.total);
    $('numberPlays').textContent=number(summary.plays);
    $('numberArtists').textContent=number(summary.artistNames.size);
    $('numberTracks').textContent=number(summary.tracks.filter(x=>x.plays>0).length);
    $('numberRange').textContent=range.label||'Selected range';
  }
  function renderDonut(){
    const buckets=monthBuckets(summary,range),chart=$('monthDonut'),legend=$('monthLegend'),status=$('monthChartStatus');
    chart.replaceChildren();legend.replaceChildren();
    const populated=buckets.filter(x=>x.ms>0),total=populated.reduce((s,x)=>s+x.ms,0);
    if(!populated.length){status.textContent='Monthly distribution is unavailable: no positive timestamped listening duration in this range.';chart.innerHTML='<p class="empty-state">No timestamped listening yet.</p>';return;}
    const svgNS='http://www.w3.org/2000/svg',svg=root.document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox','0 0 220 220');svg.setAttribute('role','img');svg.setAttribute('aria-label','Donut chart of listening duration by UTC month');
    let cumulative=0;
    populated.forEach((x,i)=>{
      const circle=root.document.createElementNS(svgNS,'circle');circle.setAttribute('cx','110');circle.setAttribute('cy','110');circle.setAttribute('r','76');circle.setAttribute('fill','none');circle.setAttribute('stroke',colors[i%colors.length]);circle.setAttribute('stroke-width','28');
      const circumference=2*Math.PI*76,segment=circumference*x.ms/total;circle.setAttribute('stroke-dasharray',segment+' '+(circumference-segment));circle.setAttribute('stroke-dashoffset',String(-cumulative));circle.setAttribute('transform','rotate(-90 110 110)');circle.setAttribute('tabindex','0');circle.setAttribute('role','img');circle.setAttribute('aria-label',x.label+': '+minutes(x.ms)+', '+number(x.share*100)+' percent');
      circle.addEventListener('mouseenter',()=>showMonth(x));circle.addEventListener('focus',()=>showMonth(x));circle.addEventListener('click',()=>showMonth(x));svg.append(circle);cumulative+=segment;
    });
    chart.append(svg);
    const center=root.document.createElement('div');center.className='donut-center';center.innerHTML='<strong>'+hours(total)+'</strong><span>DATED TOTAL</span>';chart.append(center);
    populated.forEach((x,i)=>{const button=root.document.createElement('button');button.type='button';button.className='month-legend-item';button.innerHTML='<span class="legend-swatch" style="--swatch:'+colors[i%colors.length]+'"></span><span>'+escapeHTML(x.label)+'</span><strong>'+minutes(x.ms)+'</strong><small>'+number(x.share*100)+'%</small>';button.addEventListener('click',()=>showMonth(x));legend.append(button);});
    status.textContent=populated.length+' months with positive recorded duration. Percentages use only timestamped positive listening duration in the displayed months. Months with zero listening remain in the selected range but are omitted from the donut segments.';
    showMonth(populated[0]);
  }
  function showMonth(x){const el=$('monthDetail');if(el)el.textContent=x.label+' · '+minutes(x.ms)+' recorded · '+number(x.share*100)+'% of dated duration';}
  function polar(cx,cy,r,angle){const a=(angle-90)*Math.PI/180;return {x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)};}
  function arcPath(cx,cy,r1,r2,start,end){
    const p1=polar(cx,cy,r2,start),p2=polar(cx,cy,r2,end),p3=polar(cx,cy,r1,end),p4=polar(cx,cy,r1,start),large=end-start>180?1:0;
    return 'M '+p1.x+' '+p1.y+' A '+r2+' '+r2+' 0 '+large+' 1 '+p2.x+' '+p2.y+' L '+p3.x+' '+p3.y+' A '+r1+' '+r1+' 0 '+large+' 0 '+p4.x+' '+p4.y+' Z';
  }
  function renderClock(){
    const chart=$('hourClock'),legend=$('hourLegend'),status=$('hourChartStatus'),data=hourBuckets(summary),total=data.reduce((s,x)=>s+x.ms,0);
    chart.replaceChildren();legend.replaceChildren();
    if(!total){status.textContent='Hourly activity is unavailable: no positive timestamped duration in this range.';chart.innerHTML='<p class="empty-state">No hourly signal yet.</p>';return;}
    const svgNS='http://www.w3.org/2000/svg',svg=root.document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox','0 0 320 320');svg.setAttribute('role','img');svg.setAttribute('aria-label','24-segment radial listening duration chart grouped by UTC hour');
    data.forEach((x,i)=>{
      const start=i*15+1,end=(i+1)*15-1,outer=88+100*x.ms/Math.max(...data.map(v=>v.ms)),path=root.document.createElementNS(svgNS,'path');
      path.setAttribute('d',arcPath(160,160,72,outer,start,end));path.setAttribute('fill',x.ms?colors[i%colors.length]:'#3b3d42');path.setAttribute('tabindex','0');path.setAttribute('role','button');path.setAttribute('aria-label',x.label+' UTC, '+minutes(x.ms)+', '+number(x.share*100)+' percent');
      path.addEventListener('mouseenter',()=>showHour(x));path.addEventListener('focus',()=>showHour(x));path.addEventListener('click',()=>showHour(x));svg.append(path);
      if(i%3===0){const pos=polar(160,160,108,start+6),t=root.document.createElementNS(svgNS,'text');t.setAttribute('x',pos.x);t.setAttribute('y',pos.y);t.setAttribute('text-anchor','middle');t.setAttribute('dominant-baseline','middle');t.setAttribute('class','clock-label');t.textContent=String(i).padStart(2,'0');svg.append(t);}
    });
    chart.append(svg);const center=root.document.createElement('div');center.className='clock-center';center.innerHTML='<strong>'+hours(total)+'</strong><span>UTC / 24 HOURS</span>';chart.append(center);
    data.forEach(x=>{const b=root.document.createElement('button');b.type='button';b.className='hour-legend-item';b.textContent=x.label+' · '+minutes(x.ms)+' · '+number(x.share*100)+'%';b.addEventListener('click',()=>showHour(x));legend.append(b);});
    status.textContent='Each of 24 radial segments represents one UTC hour. Segment outer radius scales linearly from 88 to 188 units by recorded duration; each hour retains the same 15° angular slot.';
    showHour(data.slice().sort((a,b)=>b.ms-a.ms)[0]);
  }
  function showHour(x){const el=$('hourDetail');if(el)el.textContent=x.label+' UTC · '+minutes(x.ms)+' recorded · '+number(x.share*100)+'% of timestamped duration';}
  function renderHeatmap(){
    const host=$('experienceHeatmap'),tip=$('heatDayDetail'),legend=$('heatLegend');host.replaceChildren();
    const data=heatmapDays(summary),max=Math.max(1,...data.days.map(x=>x.ms));
    if(!data.days.length){host.innerHTML='<div class="empty-state">No valid timestamps in this range. Heatmap dates cannot be assigned.</div>';tip.textContent='No dated listening available.';legend.textContent='Intensity uses recorded duration per UTC day.';return;}
    data.days.forEach(day=>{
      const b=root.document.createElement('button'),ratio=day.ms/max,level=day.ms===0?0:ratio<.15?1:ratio<.4?2:ratio<.7?3:4;
      b.type='button';b.className='heat-day';b.dataset.level=String(level);b.setAttribute('aria-label',day.date+' UTC: '+minutes(day.ms)+' recorded. Coverage may be incomplete.');b.title=day.date+' UTC · '+minutes(day.ms)+' recorded';
      b.addEventListener('mouseenter',()=>showDay(day));b.addEventListener('focus',()=>showDay(day));b.addEventListener('click',()=>showDay(day));host.append(b);
    });
    legend.innerHTML='<span>Less</span><i data-level="0"></i><i data-level="1"></i><i data-level="2"></i><i data-level="3"></i><i data-level="4"></i><span>More</span>';
    tip.textContent='Select a day to inspect UTC duration. Days outside '+data.first+' through '+data.last+' are not shown because no timestamped coverage was observed there; the archive may still be incomplete.';
  }
  function showDay(day){const el=$('heatDayDetail');if(el)el.textContent=day.date+' UTC · '+minutes(day.ms)+' recorded duration · '+(day.ms?'recorded listening':'no listening duration recorded')+'. Export coverage may be incomplete.';}
  function renderStory(){
    slideList=makeStory(summary,range);slideIndex=Math.max(0,Math.min(slideIndex,slideList.length-1));const viewer=$('storyViewer'),slide=slideList[slideIndex]||slideList[0];
    if(!slide)return;
    const items=slide.items||[];
    $('storyCard').innerHTML='<div class="story-card-inner story-'+escapeHTML(slide.type)+'"><p class="eyebrow">'+escapeHTML(slide.eyebrow)+'</p><div class="story-ornament" aria-hidden="true">'+(slide.type==='lore'?'✳':slide.type==='artists'?'◉':slide.type==='tracks'?'♫':slide.type==='hour'?'◷':'✧')+'</div><h2>'+escapeHTML(slide.title)+'</h2>'+(items.length?'<ol class="story-list">'+items.map(x=>'<li><span>'+String(x.rank).padStart(2,'0')+'</span><div><strong>'+escapeHTML(x.name)+'</strong>'+(x.artist?'<small>'+escapeHTML(x.artist)+'</small>':'')+'</div><b>'+escapeHTML(x.value)+'</b></li>').join('')+'</ol>':'')+'<p class="story-body">'+escapeHTML(slide.body||'')+'</p>'+(slide.detail?'<p class="story-detail">'+escapeHTML(slide.detail)+'</p>':'')+'<p class="story-caveat">BASED ON IMPORTED HISTORY · MAY BE INCOMPLETE</p></div>';
    $('storyStep').textContent='STORY '+(slideIndex+1)+' / '+slideList.length;
    $('storyProgress').innerHTML=slideList.map((x,i)=>'<span class="'+(i<=slideIndex?'active':'')+'"></span>').join('');
    $('storyProgress').setAttribute('aria-valuenow',String(slideIndex+1));$('storyProgress').setAttribute('aria-valuemax',String(slideList.length));
    $('storyPrevious').disabled=slideIndex===0;$('storyNext').disabled=slideIndex>=slideList.length-1;
    viewer.setAttribute('aria-label','Story slide '+(slideIndex+1)+' of '+slideList.length+': '+slide.title);
  }
  function openStory(){const v=$('storyViewer');v.hidden=false;root.document.body.classList.add('story-open');$('storyClose').focus();renderStory();}
  function closeStory(){const v=$('storyViewer');v.hidden=true;root.document.body.classList.remove('story-open');$('storyOpen').focus();}
  function wrapText(ctx,text,x,y,maxWidth,lineHeight,maxLines){
    const words=safe(text).split(/\s+/),lines=[];let line='';
    words.forEach(word=>{const candidate=line?line+' '+word:word;if(ctx.measureText(candidate).width<=maxWidth){line=candidate;return;}if(line)lines.push(line);line=word;while(ctx.measureText(line).width>maxWidth&&line.length>1){let cut=line.length;while(cut>1&&ctx.measureText(line.slice(0,cut)).width>maxWidth)cut--;lines.push(line.slice(0,cut));line=line.slice(cut);}});
    if(line)lines.push(line);const shown=lines.slice(0,maxLines);if(lines.length>maxLines&&shown.length)shown[shown.length-1]=shown[shown.length-1].replace(/[.…]*$/,'')+'…';
    shown.forEach((s,i)=>ctx.fillText(s,x,y+i*lineHeight));return y+shown.length*lineHeight;
  }
  async function downloadStory(){
    const slide=slideList[slideIndex];if(!slide)return;
    try{
      const canvas=root.document.createElement('canvas');canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas is unavailable');
      const style=getComputedStyle(root.document.documentElement),bg=style.getPropertyValue('--bg').trim()||'#101010',ink=style.getPropertyValue('--ink').trim()||'#fff',accent=style.getPropertyValue('--lime').trim()||'#1ed760',alt=style.getPropertyValue('--pink').trim()||'#ff4fa0';
      ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1920);ctx.fillStyle=accent;ctx.fillRect(70,72,940,12);ctx.fillStyle=ink;ctx.font='700 26px monospace';ctx.fillText('WRAPPED.exe // LISTENING LORE',72,132);
      ctx.fillStyle=alt;ctx.font='700 27px monospace';ctx.fillText(safe(slide.eyebrow).toUpperCase().slice(0,42),72,230);
      ctx.fillStyle=ink;ctx.font='700 82px sans-serif';let y=wrapText(ctx,slide.title,72,370,900,94,4)+55;
      ctx.fillStyle=accent;ctx.fillRect(72,y,140,7);y+=70;
      ctx.fillStyle=ink;ctx.font='36px sans-serif';y=wrapText(ctx,slide.body||'',72,y,900,52,7)+35;
      if(slide.items&&slide.items.length){ctx.font='600 31px sans-serif';slide.items.slice(0,5).forEach((x,i)=>{ctx.fillStyle=alt;ctx.fillText(String(x.rank).padStart(2,'0'),78,y);ctx.fillStyle=ink;y=wrapText(ctx,x.name,150,y,680,40,2);if(x.artist){ctx.fillStyle='#b8b8b8';y=wrapText(ctx,x.artist,150,y,680,32,1);}ctx.fillStyle=accent;ctx.font='25px monospace';y=wrapText(ctx,x.value,150,y,760,31,1)+30;ctx.font='600 31px sans-serif';});}
      if(slide.detail){ctx.fillStyle='#b8b8b8';ctx.font='24px sans-serif';y=wrapText(ctx,slide.detail,72,Math.min(y+25,1480),900,34,4);}
      ctx.fillStyle='#b8b8b8';ctx.font='22px monospace';wrapText(ctx,'BASED ON IMPORTED HISTORY · MAY BE INCOMPLETE',72,1740,900,32,2);
      ctx.fillStyle=accent;ctx.fillRect(72,1840,936,4);ctx.fillStyle=ink;ctx.font='22px monospace';ctx.fillText((range.label||'Selected range').toUpperCase(),72,1880);
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG creation failed')),'image/png'));
      const url=URL.createObjectURL(blob),a=root.document.createElement('a');a.href=url;a.download='wrapped-story-'+String(slideIndex+1).padStart(2,'0')+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
      $('storyDownloadStatus').textContent='Created a 1080 × 1920 PNG for this story card.';
    }catch(error){$('storyDownloadStatus').textContent='PNG export failed: '+(error&&error.message||'unknown browser error')+'. Your history was not uploaded.';}
  }
  function update(){
    const nextRange=getRange();range=nextRange;
    $('experienceCustomFields').hidden=($('experienceRange').value!=='custom');
    if(!nextRange.valid){summary={valid:false,error:nextRange.error,records:[]};$('experienceStatus').textContent=nextRange.error;renderAll();return;}
    summary=summarize(rows,range);
    $('experienceStatus').textContent=rows.length?(range.label+' · '+number(summary.records.length)+' eligible music records in selected range. Calendar grouping uses UTC. Export may be incomplete.'): 'Import history to unlock your personalized recap.';
    trackLimit=10;artistLimit=10;slideIndex=0;renderAll();
  }
  function renderAll(){renderLore();renderRanks('artist');renderRanks('track');renderNumbers();renderDonut();renderClock();renderHeatmap();renderStory();}
  function init(){
    if(!$('experience'))return;
    $('experienceRange').addEventListener('change',update);
    $('experienceStart').addEventListener('change',()=>{if($('experienceRange').value==='custom')update();});
    $('experienceEnd').addEventListener('change',()=>{if($('experienceRange').value==='custom')update();});
    $('artworkLookupEnabled').addEventListener('change',()=>{requestToken.artist++;requestToken.track++;if($('artworkLookupEnabled').checked){renderRanks('artist');renderRanks('track');}else{artworkCache.clear();renderRanks('artist');renderRanks('track');}});
    $('artistsLoadMore').addEventListener('click',()=>{artistLimit=Math.min(50,artistLimit+10);renderRanks('artist');});
    $('tracksLoadMore').addEventListener('click',()=>{trackLimit=Math.min(50,trackLimit+10);renderRanks('track');});
    $('artistsCollapse').addEventListener('click',()=>{artistLimit=10;renderRanks('artist');});
    $('tracksCollapse').addEventListener('click',()=>{trackLimit=10;renderRanks('track');});
    $('storyOpen').addEventListener('click',openStory);$('storyClose').addEventListener('click',closeStory);
    $('storyPrevious').addEventListener('click',()=>{slideIndex=Math.max(0,slideIndex-1);renderStory();});
    $('storyNext').addEventListener('click',()=>{slideIndex=Math.min(slideList.length-1,slideIndex+1);renderStory();});
    $('storyDownload').addEventListener('click',downloadStory);
    root.document.addEventListener('keydown',e=>{if($('storyViewer').hidden)return;if(e.key==='Escape'){e.preventDefault();closeStory();}else if(e.key==='ArrowRight'){e.preventDefault();slideIndex=Math.min(slideList.length-1,slideIndex+1);renderStory();}else if(e.key==='ArrowLeft'){e.preventDefault();slideIndex=Math.max(0,slideIndex-1);renderStory();}});
    root.addEventListener('wrapped-history-updated',e=>{rows=Array.isArray(e.detail&&e.detail.rows)?e.detail.rows.slice():[];diagnostics=e.detail&&e.detail.diagnostics||null;update();});
    update();
  }
  if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init);else init();}
  return {monthBuckets,hourBuckets,heatmapDays,loreFor,makeStory,rangeFor,escapeHTML};
});