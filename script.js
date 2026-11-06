(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var store={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var fine=window.matchMedia&&matchMedia('(pointer:fine)').matches;
var C=null,lang='en',cur='all',first=true;
var BGS=['classic','solar','sunrise','sections','panel'];

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
  renderGallery(r);
  $('#extra-links').innerHTML=arr(C.links).filter(function(l){return l&&l.url}).map(function(l){return '<a class="btn ghost" href="'+esc(safeUrl(l.url))+'" target="_blank" rel="noopener">'+esc(L(l.label)||l.url)+'</a>'}).join('');
  renderPubs();
  ['#research-cards','#awards','#certs','#skills-grid','#edu-grid','#stats','#timeline'].forEach(function(sel){
    $$(':scope > *',$(sel)).forEach(function(e,i){e.style.transitionDelay=(i*0.1)+'s'});
  });
}
/* ---------- gallery: categories + view modes ---------- */
var galCat='all',galView=null;
var GV=[['masonry','▥',{en:'Masonry',bn:'ম্যাসনরি',ar:'متدرج'}],['grid','▦',{en:'Grid',bn:'গ্রিড',ar:'شبكة'}],['mosaic','◧',{en:'Mosaic',bn:'মোজাইক',ar:'فسيفساء'}],['slider','⇆',{en:'Slider',bn:'স্লাইডার',ar:'شريط'}],['polaroid','❏',{en:'Polaroid',bn:'পোলারয়েড',ar:'بولارويد'}]];
function galAll(){return arr(C&&C.gallery).filter(function(g){return g&&g.img})}
function galItems(){return galAll().filter(function(g){return galCat==='all'||g.cat===galCat})}
function galCurView(){
  var ok=GV.map(function(x){return x[0]}),v=C.galleryView;if(ok.indexOf(v)<0)v='masonry';
  if(C.galleryPick!==false){var u=store.get('galview');if(ok.indexOf(u)>-1)v=u}
  return v;
}
function renderGallery(r){
  var all=galAll(),cats=arr(C.galleryCats).filter(function(c){return c&&c.id&&all.some(function(g){return g.cat===c.id})});
  if(galCat!=='all'&&!cats.some(function(c){return c.id===galCat}))galCat='all';
  $('#galFilters').innerHTML=cats.length?'<button class="chipbtn'+(galCat==='all'?' active':'')+'" data-c="all">'+esc(T('gal_all')||'All')+' <small>'+all.length+'</small></button>'+cats.map(function(c){var n=all.filter(function(g){return g.cat===c.id}).length;return '<button class="chipbtn'+(galCat===c.id?' active':'')+'" data-c="'+esc(c.id)+'">'+esc(L(c.name))+' <small>'+n+'</small></button>'}).join(''):'';
  galView=galCurView();
  $('#galViews').innerHTML=C.galleryPick===false?'':GV.map(function(x){return '<button type="button" class="vbtn'+(galView===x[0]?' on':'')+'" data-v="'+x[0]+'" title="'+esc(L(x[2]))+'" aria-label="'+esc(L(x[2]))+'">'+x[1]+'</button>'}).join('');
  var g=$('#gallery-grid');g.className='gallery v-'+galView;
  $('#galArrows').style.display=galView==='slider'?'':'none';
  g.innerHTML=galItems().map(function(g,i){var c=L(g.caption);return '<figure class="gitem '+(r||'reveal in')+'" data-i="'+i+'" tabindex="0" role="button" aria-label="'+esc(c||'Photo '+(i+1))+'"><img src="'+esc(safeUrl(g.img))+'" alt="'+esc(c)+'" loading="lazy" decoding="async">'+(c?'<figcaption>'+esc(c)+'</figcaption>':'')+'</figure>'}).join('');
}
$('#galFilters').addEventListener('click',function(e){var b=e.target.closest('.chipbtn');if(!b)return;galCat=b.dataset.c;renderGallery('reveal in')});
$('#galViews').addEventListener('click',function(e){var b=e.target.closest('.vbtn');if(!b)return;store.set('galview',b.dataset.v);renderGallery('reveal in')});
$('#galPrev').addEventListener('click',function(){var g=$('#gallery-grid');g.scrollBy({left:-g.clientWidth*.8,behavior:'smooth'})});
$('#galNext').addEventListener('click',function(){var g=$('#gallery-grid');g.scrollBy({left:g.clientWidth*.8,behavior:'smooth'})});

/* ---------- section order / visibility (from admin "Page sections") ---------- */
var DEF_LAYOUT=['about','research','experience','achievements','gallery','publications','skills','education','contact'];
var NAVKEY={about:'nav_about',research:'nav_research',experience:'nav_experience',achievements:'nav_awards',gallery:'nav_gallery',publications:'nav_pubs',skills:'nav_skills',education:'nav_edu',contact:'nav_contact'};
var NAVDEF={about:'About',research:'Research',experience:'Experience',achievements:'Awards',gallery:'Gallery',publications:'Publications',skills:'Skills',education:'Education',contact:'Contact'};
function layout(){
  var seen={},l=arr(C.layout).filter(function(x){return x&&NAVKEY[x.id]&&!seen[x.id]&&(seen[x.id]=1)});
  DEF_LAYOUT.forEach(function(id){if(!seen[id])l.push({id:id,show:true})});
  return l;
}
function applyLayout(){
  var prev=$('#stats'),n=0,nav='';
  layout().forEach(function(x){
    var s=document.getElementById(x.id);if(!s)return;
    var show=x.show!==false&&!(x.id==='gallery'&&!arr(C.gallery).filter(function(g){return g&&g.img}).length);
    s.style.display=show?'':'none';
    prev.after(s);prev=s;
    if(!show)return;
    var num=$('.num',s);if(num){n++;num.textContent=(n<10?'0':'')+n}
    nav+='<a href="#'+x.id+'">'+esc(T(NAVKEY[x.id])||NAVDEF[x.id])+'</a>';
  });
  $('#links').innerHTML=nav;
}
function applyBg(){
  var b=BGS.indexOf(C&&C.background)>-1?C.background:'classic',h=document.documentElement;
  if(h.getAttribute('data-bg')!==b){h.setAttribute('data-bg',b);initBg()}
  if(b==='panel')pvStart();else if(pRaf)pvStop();
  if(location.search.indexOf('preview=1')<0)store.set('bg',b);
  spy();
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
  renderStatic();renderLists();applyLayout();applyBg();restartTyping();
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
$('#links').addEventListener('click',function(e){if(e.target.closest('a'))$('#links').classList.remove('open')});
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

function spy(){
  var h=document.documentElement,max=Math.max(1,h.scrollHeight-h.clientHeight),p=Math.max(0,Math.min(1,h.scrollTop/max));
  $('#progress').style.width=(p*100)+'%';
  var y=h.scrollTop+140,c='';$$('main section[id]').forEach(function(s){if(s.style.display!=='none'&&s.offsetTop<=y)c=s.id});
  $$('#links a').forEach(function(a){a.classList.toggle('active',a.getAttribute('href')==='#'+c)});
  var bg=h.getAttribute('data-bg');
  if(bg==='panel'){pTarget=p;if(!pRaf)pvApply(p,0)}
  if(bg==='sunrise')h.style.setProperty('--p',p.toFixed(3));
  var sc=(!c||c==='stats')?'home':c;
  if(bg==='sections'&&h.getAttribute('data-sec')!==sc)h.setAttribute('data-sec',sc);
}
addEventListener('scroll',spy,{passive:true});

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

/* ---------- gallery lightbox ---------- */
var lb=$('#lb'),lbi=0,lbl=[],lbx=null;
function lbShow(i){
  lbl=galItems();if(!lbl.length)return;
  lbi=(i+lbl.length)%lbl.length;var g=lbl[lbi];
  $('#lbImg').src=safeUrl(g.img);$('#lbImg').alt=L(g.caption);$('#lbCap').textContent=L(g.caption);
  $('#lbCount').textContent=(lbi+1)+' / '+lbl.length;
  lb.hidden=false;document.body.style.overflow='hidden';
}
function lbClose(){lb.hidden=true;$('#lbImg').removeAttribute('src');document.body.style.overflow=''}
$('#gallery-grid').addEventListener('click',function(e){var f=e.target.closest('.gitem');if(f)lbShow(+f.dataset.i)});
$('#gallery-grid').addEventListener('keydown',function(e){var f=e.target.closest('.gitem');if(f&&(e.key==='Enter'||e.key===' ')){e.preventDefault();lbShow(+f.dataset.i)}});
$('#lbX').addEventListener('click',lbClose);
$('#lbPrev').addEventListener('click',function(){lbShow(lbi-1)});
$('#lbNext').addEventListener('click',function(){lbShow(lbi+1)});
lb.addEventListener('click',function(e){if(e.target===lb||e.target.classList.contains('lb-fig'))lbClose()});
addEventListener('keydown',function(e){if(lb.hidden)return;if(e.key==='Escape')lbClose();else if(e.key==='ArrowLeft')lbShow(lbi-1);else if(e.key==='ArrowRight')lbShow(lbi+1)});
lb.addEventListener('touchstart',function(e){lbx=e.touches[0].clientX},{passive:true});
lb.addEventListener('touchend',function(e){if(lbx==null)return;var d=e.changedTouches[0].clientX-lbx;lbx=null;if(Math.abs(d)>50)lbShow(lbi+(d<0?1:-1))},{passive:true});

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
  if(document.documentElement.getAttribute('data-bg')!=='classic'){cancelAnimationFrame(raf);return}
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

/* ---------- solar panel theme: eased sky + glowing photons that become electricity ---------- */
var pv=$('#pv'),pc=pv.getContext('2d'),SXf=.1,SYf=.5,phs=[],sps=[],els=[],pRaf=0,pLast=0,pAcc=0,pTarget=0,pSm=0,sprLt=null,sPh,sEl,sFl,BGX=null;
var HZC=[[255,176,110],[190,225,250],[255,150,120]];
function pvOn(){return document.documentElement.getAttribute('data-bg')==='panel'}
function pvSize(){pv.width=innerWidth;pv.height=innerHeight}
function pvLight(){return document.documentElement.getAttribute('data-theme')==='light'}
function mkSpr(rgb){
  var c=document.createElement('canvas');c.width=c.height=64;var g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
  r.addColorStop(0,'rgba('+rgb+',1)');r.addColorStop(.22,'rgba('+rgb+',.6)');r.addColorStop(.55,'rgba('+rgb+',.15)');r.addColorStop(1,'rgba('+rgb+',0)');
  g.fillStyle=r;g.fillRect(0,0,64,64);return c;
}
function pvSprites(){var lt=pvLight();if(sprLt===lt)return;sprLt=lt;sPh=mkSpr(lt?'250,140,20':'255,222,120');sEl=mkSpr(lt?'6,120,170':'70,225,255');sFl=mkSpr(lt?'255,170,90':'255,210,150')}
function pvApply(p,t){
  var b=BGX||(BGX=$('.bgx'));SXf=.1+.8*p;SYf=.5-.4*Math.sin(Math.PI*p);
  var wD=Math.max(0,1-2*p),wN=1-Math.abs(2*p-1),wS=Math.max(0,2*p-1),hz=[0,1,2].map(function(i){return Math.round(wD*HZC[0][i]+wN*HZC[1][i]+wS*HZC[2][i])});
  var s=b.style;s.setProperty('--sx',(SXf*100).toFixed(2)+'%');s.setProperty('--sy',(SYf*100).toFixed(2)+'%');
  s.setProperty('--d2',wN.toFixed(3));s.setProperty('--d3',wS.toFixed(3));s.setProperty('--hz',hz.join(','));
  s.setProperty('--st',Math.min(1,Math.max(0,1-p*4)+Math.max(0,p*4-3)).toFixed(3));
  s.setProperty('--ty',(p*620+((t||0)*.007)%136).toFixed(1)+'px');
}
function pvStop(){cancelAnimationFrame(pRaf);pRaf=0;phs.length=sps.length=els.length=0;pc.clearRect(0,0,pv.width,pv.height)}
function pvStart(){if(pRaf||reduce){if(reduce)pvApply(pTarget,0);return}pvSize();pvSprites();pSm=pTarget;pLast=performance.now();pRaf=requestAnimationFrame(pvFrame)}
function bez(p,k){var u=1-k;return {x:u*u*p.x0+2*u*k*p.cx+k*k*p.tx,y:u*u*p.y0+2*u*k*p.cy+k*k*p.ty}}
function pvFrame(t){
  if(!pvOn()){pvStop();return}
  pRaf=requestAnimationFrame(pvFrame);
  if(document.hidden){pLast=t;return}
  var dt=Math.min(64,t-pLast);pLast=t;
  pSm+=(pTarget-pSm)*(1-Math.exp(-dt/240));pvApply(pSm,t);
  pvSprites();
  var W=pv.width,H=pv.height,hz=H*.65,sx=SXf*W,sy=SYf*H,lt=pvLight(),mob=W<700,i,j,p,pt;
  pAcc+=dt;var gap=mob?170:85;
  while(pAcc>gap){pAcc-=gap;if(phs.length<(mob?20:42)){var tx=W*(.03+Math.random()*.94),ty=hz+10+Math.pow(Math.random(),.8)*(H-hz-24);phs.push({x0:sx+(Math.random()-.5)*14,y0:sy+(Math.random()-.5)*14,tx:tx,ty:ty,cx:(sx+tx)/2+(Math.random()-.5)*W*.14,cy:(sy+ty)/2-H*.04,t:0,d:1100+Math.random()*800})}}
  pc.clearRect(0,0,W,H);pc.globalCompositeOperation=lt?'source-over':'lighter';
  /* soft lens flare along the line sun → screen centre (only while the sun is above the horizon) */
  if(sy<hz-30){
    var fa=(lt?.55:1),fl=[[.28,26,.10],[.5,12,.12],[.72,40,.07],[.95,18,.09]];
    for(i=0;i<fl.length;i++){var fx=sx+(W/2-sx)*fl[i][0]*1.25,fy=sy+(H*.45-sy)*fl[i][0]*1.25,r=fl[i][1]*(mob?.7:1);pc.globalAlpha=fl[i][2]*fa;pc.drawImage(sFl,fx-r,fy-r,r*2,r*2)}
  }
  for(i=phs.length-1;i>=0;i--){
    p=phs[i];p.t+=dt;var k=p.t/p.d;
    if(k>=1){sps.push({x:p.tx,y:p.ty,t:0,f:.4+.9*(p.ty-hz)/(H-hz)});if(Math.random()<.42&&els.length<16)els.push({x:p.tx,y:p.ty,v:(.12+Math.random()*.14)*(.6+.8*(p.ty-hz)/(H-hz)),dir:p.tx<W/2?-1:1});phs.splice(i,1);continue}
    var e=Math.pow(k,1.45),fade=Math.min(1,k*3);
    for(j=0;j<8;j++){pt=bez(p,Math.max(0,e-j*.02));var sz=(8-j)*1.5+1.5;pc.globalAlpha=(1-j/8)*(.35+.65*fade);pc.drawImage(sPh,pt.x-sz,pt.y-sz,sz*2,sz*2)}
  }
  for(i=sps.length-1;i>=0;i--){
    p=sps[i];p.t+=dt;var s=p.t/620;if(s>=1){sps.splice(i,1);continue}
    var fr=18+s*34*p.f;pc.globalAlpha=(1-s)*.9;pc.drawImage(sPh,p.x-fr,p.y-fr*.4,fr*2,fr*.8);
    pc.globalAlpha=(1-s)*.5;pc.strokeStyle=lt?'rgba(240,140,30,1)':'rgba(255,225,140,1)';pc.lineWidth=1.2;pc.beginPath();pc.ellipse(p.x,p.y,6+s*40*p.f,2+s*11*p.f,0,0,6.283);pc.stroke();
  }
  for(i=els.length-1;i>=0;i--){
    p=els[i];p.x+=p.dir*p.v*dt;if(p.x<-60||p.x>W+60){els.splice(i,1);continue}
    for(j=0;j<9;j++){var ex=p.x-p.dir*j*7,sz2=(9-j)*1.1+1.2;pc.globalAlpha=(1-j/9)*.9;pc.drawImage(sEl,ex-sz2*1.6,p.y-sz2*1.6,sz2*3.2,sz2*3.2)}
  }
  pc.globalAlpha=1;
}
addEventListener('resize',function(){if(pvOn())pvSize()});

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
