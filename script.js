(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var store={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var fine=window.matchMedia&&matchMedia('(pointer:fine)').matches;
var C=null,lang='en',cur='all',first=true;

/* ---------- helpers ---------- */
function L(v){if(v==null)return '';if(typeof v==='string'||typeof v==='number')return String(v);return v[lang]||v.en||''}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function T(k){return C&&C.t&&C.t[k]?L(C.t[k]):''}
function arr(x){return Array.isArray(x)?x:[]}
function safeUrl(u){u=String(u||'');return /^(https?:|mailto:|assets\/|\/|#)/i.test(u)?u:'#'}
function get(o,path){return path.split('.').reduce(function(a,k){return a==null?a:a[k]},o)}

/* ---------- load content ---------- */
function load(){
  if(location.search.indexOf('preview=1')>-1){
    var d=store.get('portfolio_draft');
    if(d){try{return Promise.resolve(JSON.parse(d))}catch(e){}}
  }
  return fetch('/api/content',{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).catch(function(){return fetch('content.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})});
}

/* ---------- render ---------- */
function R(){return first||reduce?'reveal':'reveal in'}
function renderStatic(){
  $$('[data-i18n]').forEach(function(el){var v=T(el.dataset.i18n);if(v)el.textContent=v});
  var p=C.profile||{};
  $$('[data-bind]').forEach(function(el){var v=get(p,el.dataset.bind);if(v!=null)el.textContent=v});
  $$('[data-link]').forEach(function(el){
    var k=el.dataset.link,mail=k.indexOf('mailto:')===0,key=mail?k.slice(7):k;
    var v=p[key]!==undefined?p[key]:C[key];
    if(v)el.href=mail?'mailto:'+v:safeUrl(v);
  });
  $$('[data-bind-src]').forEach(function(el){var v=p[el.dataset.bindSrc];if(v)el.src=safeUrl(v)});
}
function renderLists(){
  var r=R();
  $('#orbits').innerHTML=arr(C.orbit).map(function(o,i){return '<div class="orbit o'+(i%3+1)+'"><span class="chip">'+esc(o)+'</span></div>'}).join('');
  $('#badges').innerHTML=arr(C.badges).slice(0,2).map(function(b,i){return '<div class="badge b'+(i+1)+'"><b>'+esc(b.value)+'</b><small>'+esc(L(b.label))+'</small></div>'}).join('');
  var mq=arr(C.marquee).map(function(m){return '<span>'+esc(m)+'</span>'}).join('');
  $('#marquee').innerHTML=mq+mq;
  $('#stats').innerHTML=arr(C.stats).map(function(s){return '<div class="stat '+r+'"><b data-count="'+(+s.value||0)+'" data-suffix="'+esc(s.suffix||'')+'">'+((first&&!reduce)?0:(+s.value||0)+esc(s.suffix||''))+'</b><span>'+esc(L(s.label))+'</span></div>'}).join('');
  $('#interests').innerHTML=arr(C.interests).map(function(i){return '<span>'+esc(L(i))+'</span>'}).join('');
  var p=C.profile||{};
  $('#facts').innerHTML=arr(C.facts).map(function(f){
    var v=f.kind==='email'?'<a href="mailto:'+esc(p.email||'')+'">'+esc(p.email||'')+'</a>':esc(L(f.value));
    return '<li><span>'+esc(L(f.label))+'</span><b>'+v+'</b></li>';
  }).join('');
  $('#bars').innerHTML=arr(C.bars).map(function(b){return '<div class="bar-row"><span>'+esc(L(b.label))+'</span><div class="bar'+(b.best?' best':'')+'"><i style="--w:'+(+b.pct||0)+'%"></i></div><b>'+esc(b.value)+'</b></div>'}).join('');
  $('#research-cards').innerHTML=arr(C.research).map(function(c){return '<article class="card tilt '+r+'"><div class="ico">'+esc(c.icon||'')+'</div><h3>'+esc(L(c.title))+'</h3><p>'+esc(L(c.text))+'</p><div class="tags">'+arr(c.tags).map(function(x){return '<span>'+esc(x)+'</span>'}).join('')+'</div></article>'}).join('');
  $('#timeline').innerHTML=arr(C.experience).map(function(e){
    return '<article class="t-item '+r+'"><span class="dot'+(e.current?' now':'')+'"></span><div class="t-card card"><div class="t-meta"><span>'+esc(e.dates)+'</span>'+(e.tag&&L(e.tag)?'<span class="tag">'+esc(L(e.tag))+'</span>':'')+(e.current?'<span class="tag live">'+esc(T('now'))+'</span>':'')+'</div><h3>'+esc(L(e.role))+'</h3><p class="org">'+esc(L(e.org))+'</p><ul>'+arr(e.bullets).map(function(b){return '<li>'+esc(L(b))+'</li>'}).join('')+'</ul></div></article>';
  }).join('');
  $('#awards').innerHTML=arr(C.awards).map(function(a){return '<article class="card tilt '+r+'"><span class="year">'+esc(a.year)+'</span><div class="ico">'+esc(a.icon||'')+'</div><h3>'+esc(L(a.title))+'</h3><p>'+esc(L(a.text))+'</p></article>'}).join('');
  $('#certs').innerHTML=arr(C.certs).map(function(c){return '<li class="'+r+'"><b>'+esc(c.year)+'</b><span>'+esc(L(c.text))+'</span></li>'}).join('');
  $('#skills-grid').innerHTML=arr(C.skills).map(function(s){return '<div class="card '+r+'"><h3>'+esc(L(s.title))+'</h3><div class="chips">'+arr(s.chips).map(function(x){return '<span>'+esc(x)+'</span>'}).join('')+'</div></div>'}).join('');
  $('#edu-grid').innerHTML=arr(C.education).map(function(e){return '<article class="card '+r+'"><span class="year">'+esc(e.year)+'</span><h3>'+esc(L(e.title))+'</h3>'+(L(e.org)?'<p class="org">'+esc(L(e.org))+'</p>':'')+(L(e.text)?'<p class="edtext">'+esc(L(e.text))+'</p>':'')+(L(e.extra)?'<p class="edtext">'+esc(L(e.extra))+'</p>':'')+'</article>'}).join('');
  renderPubs();
  ['#research-cards','#awards','#certs','#skills-grid','#edu-grid','#stats','#timeline'].forEach(function(sel){
    $$(':scope > *',$(sel)).forEach(function(e,i){e.style.transitionDelay=(i*0.1)+'s'});
  });
}
function renderPubs(){
  var box=$('#pubs');box.innerHTML='';
  arr(C.publications).forEach(function(p){
    var a=document.createElement('a');a.className='pub reveal in';a.href='https://doi.org/'+encodeURI(p.doi);a.target='_blank';a.rel='noopener';
    a.dataset.k=p.kind||'journal';a.dataset.q=p.q||'';
    var conf=p.q==='Conf',qc=p.q==='Q2'?'q q2':(conf?'q cf':'q');
    var jl={bn:' জার্নাল',ar:' مجلة',en:' Journal'}[lang],cl={bn:'কনফারেন্স',ar:'مؤتمر',en:'Conference'}[lang];
    a.innerHTML='<div class="yr">'+esc(p.year)+'</div><div><h3 dir="ltr"></h3><div class="meta" dir="ltr"></div><div class="row"><span class="'+qc+'">'+esc(conf?cl:(p.q||'')+jl)+'</span>'+(+p.cites?'<span class="cite">'+esc(T('cited'))+' '+(+p.cites)+'</span>':'')+'<span class="cite" dir="ltr">DOI '+esc(p.doi)+'</span></div>'+(p.note&&L(p.note)?'<p class="pnote">'+esc(L(p.note))+'</p>':'')+'</div><span class="go" aria-label="'+esc(T('open'))+'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg></span>';
    $('h3',a).textContent=p.title;$('.meta',a).textContent=p.journal;
    box.appendChild(a);
  });
  applyFilter();
}
function applyFilter(){$$('.pub').forEach(function(e){e.style.display=(cur==='all'||e.dataset.k===cur||(cur==='q1'&&e.dataset.q==='Q1'))?'':'none'})}
$('#filters').addEventListener('click',function(e){var b=e.target.closest('.chipbtn');if(!b)return;cur=b.dataset.f;$$('.chipbtn').forEach(function(x){x.classList.toggle('active',x===b)});applyFilter()});

/* ---------- language ---------- */
function setLang(l,initial){
  lang=l;document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';store.set('lang',l);
  $$('#lang button').forEach(function(b){b.classList.toggle('on',b.dataset.l===l)});
  renderStatic();renderLists();restartTyping();
  if(first){observe()}
  first=false;
  if(!initial)drawTL();
}
$('#lang').addEventListener('click',function(e){var b=e.target.closest('button');if(b&&C)setLang(b.dataset.l)});

/* ---------- theme ---------- */
$('#theme').addEventListener('click',function(){
  var n=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',n);store.set('theme',n);
  var m=document.querySelector('meta[name=theme-color]');if(m)m.content=n==='dark'?'#050b18':'#f3f6ff';
  initBg();
});

/* ---------- typed ---------- */
var tmr,ti=0,ci=0,del=false;
function tick(){
  var words=arr(C.typed),el=$('#typed');if(!words.length)return;
  var w=L(words[ti%words.length]);
  ci+=del?-1:1;el.textContent=w.slice(0,ci);
  var d=del?35:75;
  if(!del&&ci>=w.length){del=true;d=1400}else if(del&&ci<=0){del=false;ti++;d=300}
  tmr=setTimeout(tick,d);
}
function restartTyping(){clearTimeout(tmr);ti=0;ci=0;del=false;var w=arr(C.typed);if(!w.length){$('#typed').textContent='';return}if(reduce){$('#typed').textContent=L(w[0]);return}tick()}

/* ---------- menu ---------- */
$('#menu').addEventListener('click',function(){var o=$('#links').classList.toggle('open');this.setAttribute('aria-expanded',o)});
$$('#links a').forEach(function(a){a.addEventListener('click',function(){$('#links').classList.remove('open')})});
addEventListener('keydown',function(e){if(e.key==='Escape')$('#links').classList.remove('open')});

/* ---------- reveal + counters ---------- */
var io=new IntersectionObserver(function(es){es.forEach(function(e){
  if(!e.isIntersecting)return;e.target.classList.add('in');io.unobserve(e.target);
  var n=e.target.matches('[data-count]')?e.target:$('[data-count]',e.target);if(n)count(n);
});},{threshold:.12,rootMargin:'0px 0px -4% 0px'});
function observe(){$$('.reveal').forEach(function(e){if(!e.classList.contains('in'))io.observe(e)})}
function count(n){
  var to=+n.dataset.count,suf=n.dataset.suffix||'';if(reduce){n.textContent=to+suf;return}
  var t0=performance.now();(function f(t){var p=Math.min((t-t0)/1400,1),v=Math.round(to*(1-Math.pow(1-p,3)));n.textContent=v+suf;if(p<1)requestAnimationFrame(f)})(t0);
}

/* ---------- scroll progress + active link ---------- */
var secs=$$('main section[id]'),lnks=$$('#links a');
addEventListener('scroll',function(){
  var h=document.documentElement;$('#progress').style.width=(h.scrollTop/Math.max(1,h.scrollHeight-h.clientHeight)*100)+'%';
  var y=h.scrollTop+140,c='';secs.forEach(function(s){if(s.offsetTop<=y)c=s.id});
  lnks.forEach(function(a){a.classList.toggle('active',a.getAttribute('href')==='#'+c)});
},{passive:true});

/* ---------- pointer effects (desktop only) ---------- */
if(!reduce&&fine){
  var tc=null;
  document.addEventListener('mousemove',function(e){
    var t=e.target.closest&&e.target.closest('.tilt');
    if(tc&&tc!==t){tc.style.transform='';tc=null}
    if(t){tc=t;var r=t.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;t.style.transform='perspective(800px) rotateY('+x*8+'deg) rotateX('+-y*8+'deg) translateY(-4px)'}
  },{passive:true});
  $$('.btn').forEach(function(b){
    b.addEventListener('mousemove',function(e){var r=b.getBoundingClientRect();b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.18)+'px,'+((e.clientY-r.top-r.height/2)*.28)+'px)'});
    b.addEventListener('mouseleave',function(){b.style.transform=''});
  });
}

/* ---------- timeline draws as you scroll ---------- */
function drawTL(){var tl=$('.timeline');if(!tl||reduce)return;var r=tl.getBoundingClientRect(),f=(innerHeight*.75-r.top)/Math.max(1,r.height);tl.style.setProperty('--tl',Math.max(.04,Math.min(1,f)))}
addEventListener('scroll',drawTL,{passive:true});

/* ---------- copy email ---------- */
var tt;
$('#copy').addEventListener('click',function(){
  var m=(C&&C.profile&&C.profile.email)||'';
  var done=function(){var t=$('#toast');t.textContent=T('copied');t.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('show')},2200)};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(m).then(done,function(){location.href='mailto:'+m})}else{location.href='mailto:'+m}
});

/* ---------- background: drifting particles ---------- */
var cv=$('#bg'),cx=cv.getContext('2d'),pts=[],W,H,raf;
function initBg(){
  W=cv.width=innerWidth;H=cv.height=innerHeight;
  var n=Math.min(70,Math.floor(W*H/(W<700?30000:22000)));pts=[];
  for(var i=0;i<n;i++)pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,r:Math.random()*1.6+.6});
  cancelAnimationFrame(raf);if(reduce){draw();return}loop();
}
function col(){return document.documentElement.getAttribute('data-theme')==='light'?'79,70,229':'34,211,238'}
function draw(){
  cx.clearRect(0,0,W,H);var c=col();
  for(var i=0;i<pts.length;i++){var p=pts[i];
    cx.beginPath();cx.arc(p.x,p.y,p.r,0,6.283);cx.fillStyle='rgba('+c+',.7)';cx.fill();
    for(var j=i+1;j<pts.length;j++){var q=pts[j],dx=p.x-q.x,dy=p.y-q.y,d=dx*dx+dy*dy;
      if(d<16000){cx.strokeStyle='rgba('+c+','+(.16*(1-d/16000))+')';cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(q.x,q.y);cx.stroke()}}}
}
function loop(){
  if(document.hidden){raf=requestAnimationFrame(loop);return}
  pts.forEach(function(p){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1});
  draw();raf=requestAnimationFrame(loop);
}
var rs,lw=innerWidth;addEventListener('resize',function(){clearTimeout(rs);rs=setTimeout(function(){if(innerWidth!==lw){lw=innerWidth;initBg()}},200)});

/* ---------- init ---------- */
if(location.search.indexOf('preview=1')>-1){var rb=document.createElement('div');rb.textContent='Draft preview - not published yet';rb.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:300;background:#f59e0b;color:#111;font:600 13px system-ui;padding:7px 16px;border-radius:99px;box-shadow:0 6px 20px rgba(0,0,0,.3)';document.body.appendChild(rb)}
$('#yr').textContent=new Date().getFullYear();
initBg();
$$('.hero-text > .reveal').forEach(function(e,i){e.style.transitionDelay=(i*0.09)+'s'});
$('.hero-visual').style.transitionDelay='.25s';
load().then(function(data){
  C=data;
  var l=store.get('lang');setLang(l==='bn'||l==='ar'?l:'en',true);
  drawTL();
}).catch(function(err){
  var t=$('#toast');t.textContent='Could not load content.';t.classList.add('show');
  $$('.reveal').forEach(function(e){e.classList.add('in')});
  if(window.console)console.error(err);
});
})();
