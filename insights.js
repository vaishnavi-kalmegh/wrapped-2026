(function(){
'use strict';
const $=id=>document.getElementById(id), n=x=>new Intl.NumberFormat(undefined,{maximumFractionDigits:1}).format(x);
const mins=ms=>{const m=Math.round(ms/60000);return m<60?m+' min':Math.floor(m/60)+' h '+m%60+' min';};
let rows=[],diagnostics=null;
const section=document.createElement('section');section.className='panel dashboard-panel insight-panel';section.id='insightsPanel';section.setAttribute('aria-labelledby','insightsTitle');
section.innerHTML='<div class="dashboard-heading"><div><p class="eyebrow">06 / INSIGHT ENGINE</p><h2 id="insightsTitle">Insights</h2></div></div><p class="dashboard-status" id="insightsStatus" aria-live="polite">Import history to calculate insights.</p><div class="insight-grid" id="milestoneGrid"></div><div class="insight-columns"><section><h3>Listening streaks</h3><div id="streakContent" class="insight-copy"></div></section><section><h3>Artist concentration</h3><div id="concentrationContent" class="insight-copy"></div></section><section><h3>First observed in this archive</h3><div id="discoveryContent" class="insight-copy"></div></section><section><h3>Equal-length period comparison</h3><div id="comparisonContent" class="insight-copy"></div></section></div><details class="insight-diagnostics"><summary>Import quality diagnostics</summary><div id="diagnosticsContent" class="insight-copy"></div></details><p class="tiny">“First observed” means earliest valid timestamp in the files you imported, not the first time you ever heard an artist or track. Streaks use UTC dates. Artist concentration credits recorded time to the primary artist only; collaboration totals are not double-counted.</p>';
const nav=document.querySelector('.analytics-nav'), patterns=$('patternsPanel');
if(nav){const a=document.createElement('a');a.href='#insightsPanel';a.textContent='Insights';const patternsLink=nav.querySelector('a[href="#patternsPanel"]');if(patternsLink)nav.insertBefore(a,patternsLink);else nav.append(a);}
if(patterns)patterns.before(section);
function item(parent,title,value,detail){const card=document.createElement('article');card.className='insight-card';const h=document.createElement('p');h.className='insight-label';h.textContent=title;const strong=document.createElement('strong');strong.textContent=value;const small=document.createElement('span');small.textContent=detail||'';card.append(h,strong,small);parent.append(card);}
function line(parent,text){const p=document.createElement('p');p.textContent=text;parent.append(p);}
function list(parent,values,empty){if(!values.length){line(parent,empty);return;}const ul=document.createElement('ul');values.forEach(v=>{const li=document.createElement('li');li.textContent=v;ul.append(li);});parent.append(ul);}
function rangeNow(){const mode=$('analyticsRange').value;return mode==='custom'?WrappedAnalytics.dateRange('custom',{start:$('rangeStart').value,end:$('rangeEnd').value}):WrappedAnalytics.dateRange(mode);}
function render(){
 const range=rangeNow(),status=$('insightsStatus');['milestoneGrid','streakContent','concentrationContent','discoveryContent','comparisonContent','diagnosticsContent'].forEach(id=>$(id).replaceChildren());
 if(!rows.length){status.textContent='Import Spotify history to unlock evidence-based insights. Nothing is estimated without source records.';return;}
 if(!range.valid){status.textContent=range.error;return;}
 const s=WrappedAnalytics.summarize(rows,{range,includeUnqualifiedGroups:true});
 const streak=WrappedAnalytics.listeningStreaks(rows,{range}),con=WrappedAnalytics.artistConcentration(rows,{range}),first=WrappedAnalytics.firstObserved(rows,{range});
 status.textContent=range.label+' · insights recalculated from imported rows only.';
 WrappedAnalytics.milestoneBadges(s).forEach(m=>item($('milestoneGrid'),m.label,n(m.value)+' '+m.unit,m.earned.length?'Milestones: '+m.earned.join(', ')+(m.next?' · next '+m.next:''):'Next milestone: '+(m.next||'all thresholds reached')));
 line($('streakContent'),'Longest streak: '+streak.longest.days+' day(s)'+(streak.longest.start?' · '+streak.longest.start+' → '+streak.longest.end:'')+'.');
 line($('streakContent'),'Latest-date streak: '+streak.current.days+' day(s)'+(streak.current.end?' ending '+streak.current.end:'')+'.');
 line($('streakContent'),'Active UTC dates: '+n(streak.activeDays)+'. Dates with no positive recorded music duration break a streak.');
 line($('concentrationContent'),'Top artist: '+(con.artists[0]?con.artists[0].name+' · '+(con.topArtistShare*100).toFixed(1)+'%':'No primary-artist duration available.'));
 line($('concentrationContent'),'Top five primary artists: '+(con.topFiveShare*100).toFixed(1)+'% of primary-attributed recorded duration.');
 list($('discoveryContent'),first.tracks.slice(0,5).map(x=>x.date+' · '+x.name),'No dated track observations in this range.');
 const rangeMs=range.start!=null&&range.end!=null?range.end-range.start+1:null;
 if(rangeMs>0){const prior={valid:true,kind:'custom',start:range.start-rangeMs,end:range.start-1,label:'Previous equal-length period'},cmp=WrappedAnalytics.comparePeriods(rows,prior,range);list($('comparisonContent'),cmp.metrics.map(m=>m.key+': '+n(m.a)+' → '+n(m.b)+' ('+(m.changePercent==null?'baseline is zero':(m.changePercent>0?'+':'')+m.changePercent.toFixed(1)+'%')+')'),'Comparison unavailable for this range.');}
 else line($('comparisonContent'),'Choose a bounded date range (Last 12 months, This year or custom dates) to compare against the immediately preceding equal-length UTC period.');
 if(diagnostics){line($('diagnosticsContent'),'Files selected: '+n(diagnostics.filesSelected||0)+' · recognized history files: '+n(diagnostics.filesParsed||0)+' · invalid files: '+n((diagnostics.invalidFiles||[]).length)+' · unrecognized files: '+n((diagnostics.unrecognizedFiles||[]).length)+' · empty recognized files: '+n((diagnostics.emptyFiles||[]).length)+'.');line($('diagnosticsContent'),'Records accepted: '+n(diagnostics.acceptedRecords||0)+' · rejected: '+n(diagnostics.rejectedRecords||0)+'.');line($('diagnosticsContent'),'Invalid timestamps: '+n(diagnostics.invalidTimestamps||0)+' · missing track: '+n(diagnostics.missingTrack||0)+' · missing artist: '+n(diagnostics.missingArtist||0)+'.');line($('diagnosticsContent'),'Missing duration: '+n(diagnostics.missingDuration||0)+' · malformed/negative duration: '+n(diagnostics.invalidDuration||0)+' · zero duration: '+n(diagnostics.zeroDuration||0)+'.');line($('diagnosticsContent'),'Episode/audiobook-marked records: '+n(diagnostics.excludedNonMusic||0)+'.');list($('diagnosticsContent'),diagnostics.warnings||[],'No parser warnings reported.');}
 else line($('diagnosticsContent'),'Parser diagnostics are not available for this import event. Summary metrics remain based on the rows received.');
}
window.addEventListener('wrapped-history-updated',e=>{rows=Array.isArray(e.detail&&e.detail.rows)?e.detail.rows.slice():[];diagnostics=e.detail&&e.detail.diagnostics||null;render();});
window.addEventListener('wrapped-range-changed',render);
const reset=$('resetData');if(reset)reset.addEventListener('click',()=>{rows=[];diagnostics=null;render();});
render();
})();