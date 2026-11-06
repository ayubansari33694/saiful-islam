(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
var DRAFT='portfolio_draft';
var store={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},del:function(k){try{localStorage.removeItem(k)}catch(e){}}};
var C=null,published=null,cur='dash',openSet=new WeakSet(),saveT=null;

/* ---------- small helpers ---------- */
function el(tag,attrs,kids){
  var e=document.createElement(tag);
  if(attrs)Object.keys(attrs).forEach(function(k){
    if(k==='class')e.className=attrs[k];else if(k==='text')e.textContent=attrs[k];
    else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),attrs[k]);else e.setAttribute(k,attrs[k]);
  });
  (kids||[]).forEach(function(c){if(c!=null)e.appendChild(typeof c==='string'?document.createTextNode(c):c)});
  return e;
}
function clone(o){return JSON.parse(JSON.stringify(o))}
function getp(o,p){return p.split('.').reduce(function(a,k){return a==null?a:a[k]},o)}
function setp(o,p,v){var ks=p.split('.'),l=ks.pop(),t=o;ks.forEach(function(k){if(t[k]==null||typeof t[k]!=='object')t[k]={};t=t[k]});t[l]=v}
function toast(msg,kind){var t=el('div',{class:'toast '+(kind||'ok'),text:msg});$('#toasts').appendChild(t);setTimeout(function(){t.remove()},kind==='err'?7000:3200)}
function isDirty(){return JSON.stringify(C)!==JSON.stringify(published)}
function refreshState(){var s=$('#state');if(isDirty()){s.textContent='Unpublished changes';s.className='pill dirty'}else{s.textContent='All changes published';s.className='pill ok'}}
function touch(){store.set(DRAFT,JSON.stringify(C));refreshState()}
function b64(str){return btoa(unescape(encodeURIComponent(str)))}

/* ---------- field controls ---------- */
function ctlText(f,get,set,type){
  var i=el('input',{type:type||'text'});i.value=get()==null?'':get();
  if(f.placeholder)i.placeholder=f.placeholder;
  i.addEventListener('input',function(){set(type==='number'&&i.value!==''?+i.value:i.value);touch()});
  return i;
}
function ctlArea(get,set,rows){
  var t=el('textarea');t.value=get()==null?'':get();if(rows)t.rows=rows;
  t.addEventListener('input',function(){set(t.value);touch()});return t;
}
function asTri(v){if(v&&typeof v==='object')return {en:v.en||'',bn:v.bn||'',ar:v.ar||''};var s=v==null?'':String(v);return {en:s,bn:s,ar:s}}
function ctlTri(get,set,area){
  var box=el('div',{class:'tri'}),v=asTri(get());
  [['en','EN'],['bn','বাং'],['ar','عربي']].forEach(function(p){
    var inp=area?el('textarea'):el('input',{type:'text'});inp.value=v[p[0]];
    if(p[0]==='ar')inp.dir='rtl';
    inp.addEventListener('input',function(){var cur=asTri(get());cur[p[0]]=inp.value;set(cur);touch()});
    box.appendChild(el('div',{class:'lang'},[el('i',{text:p[1]}),inp]));
  });
  return box;
}
function ctlSelect(f,get,set){
  var s=el('select');f.options.forEach(function(o){var op=el('option',{value:o[0],text:o[1]});s.appendChild(op)});
  s.value=get()==null?f.options[0][0]:get();
  s.addEventListener('change',function(){set(s.value);touch();if(f.rerender)render()});return s;
}
function ctlBool(f,get,set){
  var c=el('input',{type:'checkbox'});c.checked=!!get();
  c.addEventListener('change',function(){set(c.checked);touch()});
  return el('label',{class:'chk'},[c,f.label]);
}
function ctlLines(get,set){
  var t=el('textarea');t.rows=5;t.value=(get()||[]).join('\n');
  t.addEventListener('input',function(){set(t.value.split('\n').map(function(x){return x.trim()}).filter(Boolean));touch()});return t;
}
function ctlImage(f,get,set){
  var wrap=el('div',{class:'imgbox'}),img=el('img',{alt:'preview'}),path=el('input',{type:'text'});
  function src(v){return !v?'':(/^https?:/.test(v)?v:'../'+v.replace(/^\//,''))}
  function show(){var v=get()||'';path.value=v;img.src=src(v)}
  path.addEventListener('input',function(){set(path.value);touch();img.src=src(path.value)});
  var file=el('input',{type:'file',accept:'image/*'});file.style.display='none';
  var up=el('button',{class:'btn',text:'Upload new photo',onclick:function(){file.click()}});
  file.addEventListener('change',function(){
    var fl=file.files[0];if(!fl)return;
    uploadImage(fl).then(function(p){set(p);touch();show();toast('Photo uploaded: '+p)}).catch(function(e){toast(e.message||String(e),'err')});
  });
  show();
  var right=el('div',{style:'flex:1;min-width:220px'},[path,el('div',{class:'help',text:'Path of the image on the site. Use “Upload new photo” to replace it.'}),el('div',{style:'margin-top:8px'},[up,file])]);
  wrap.appendChild(img);wrap.appendChild(right);return wrap;
}

/* ---------- list editor ---------- */
function ctlList(f,base,getArr){
  var wrap=el('div'),box=el('div',{class:'list'});wrap.appendChild(box);
  function arr(){var a=getp(base,f.k);if(!Array.isArray(a)){a=[];setp(base,f.k,a)}return a}
  function title(item,i){
    var t='';try{t=f.sum?f.sum(item,i):''}catch(e){}
    if(!t&&f.item==='tri')t=asTri(item).en;
    if(!t&&f.item==='tria')t=asTri(item).en;
    return (t||('Item '+(i+1))).toString().slice(0,90);
  }
  function build(){
    box.innerHTML='';var a=arr();
    a.forEach(function(item,i){
      var d=el('details',{class:'item'}),sum=el('span',{class:'sum',text:(i+1)+'. '+title(item,i)});
      if(typeof item==='object'&&item&&openSet.has(item))d.open=true;
      d.addEventListener('toggle',function(){if(typeof item==='object'&&item){d.open?openSet.add(item):openSet.delete(item)}});
      function mv(dx){return function(e){e.preventDefault();var j=i+dx;if(j<0||j>=a.length)return;var t=a[i];a[i]=a[j];a[j]=t;touch();build()}}
      var acts=el('span',{class:'acts'},[
        el('button',{type:'button',title:'Move up',text:'↑',onclick:mv(-1)}),
        el('button',{type:'button',title:'Move down',text:'↓',onclick:mv(1)}),
        el('button',{type:'button',title:'Duplicate',text:'⧉',onclick:function(e){e.preventDefault();a.splice(i+1,0,clone(item));touch();build()}}),
        el('button',{type:'button',class:'del',title:'Delete',text:'🗑',onclick:function(e){e.preventDefault();if(confirm('Delete this item?')){a.splice(i,1);touch();build()}}})
      ]);
      d.appendChild(el('summary',null,[sum,acts]));
      var body=el('div',{class:'body'});
      if(f.item==='tri'||f.item==='tria'){
        body.appendChild(ctlTri(function(){return a[i]},function(v){a[i]=v},f.item==='tria'));
        body.firstChild.addEventListener('input',function(){sum.textContent=(i+1)+'. '+title(a[i],i)});
      }else{
        f.fields.forEach(function(sf){body.appendChild(field(sf,item))});
        body.addEventListener('input',function(){sum.textContent=(i+1)+'. '+title(item,i)});
        body.addEventListener('change',function(){sum.textContent=(i+1)+'. '+title(item,i)});
      }
      d.appendChild(body);box.appendChild(d);
    });
    if(!a.length)box.appendChild(el('div',{class:'help',text:'Nothing here yet. Use the button below to add one.'}));
  }
  build();
  var max=f.max,addb=el('button',{class:'btn addrow',type:'button',text:'+ '+(f.add||'Add item'),onclick:function(){
    var a=arr();if(max&&a.length>=max){toast('Maximum '+max+' items for this list','err');return}
    var n=f.item==='tri'||f.item==='tria'?{en:'',bn:'',ar:''}:clone(f.blank||{});a.push(n);
    if(typeof n==='object')openSet.add(n);touch();build();
  }});
  wrap.appendChild(addb);return wrap;
}

/* ---------- field dispatcher ---------- */
function field(f,base){
  var g=function(){return getp(base,f.k)},s=function(v){setp(base,f.k,v)};
  if(f.type==='bool')return el('div',{class:'field'},[ctlBool(f,g,s)]);
  var c;
  switch(f.type){
    case 'tri':c=ctlTri(g,s,false);break;
    case 'tria':c=ctlTri(g,s,true);break;
    case 'area':c=ctlArea(g,s,f.rows||4);break;
    case 'number':c=ctlText(f,g,s,'number');break;
    case 'url':c=ctlText(f,g,s,'url');break;
    case 'select':c=ctlSelect(f,g,s);break;
    case 'lines':c=ctlLines(g,s);break;
    case 'image':c=ctlImage(f,g,s);break;
    case 'list':c=ctlList(f,base);break;
    default:c=ctlText(f,g,s,'text');
  }
  var kids=[el('div',{class:'lbl',text:f.label})];
  kids.push(c);
  if(f.help)kids.push(el('div',{class:'help',text:f.help}));
  var wrap=el('div',{class:'field'},kids);
  if(f.showIf&&!f.showIf(base))wrap.style.display='none';
  return wrap;
}
function T(k,label,type,help){return {k:'t.'+k,label:label,type:type||'tri',help:help}}

/* ---------- schema ---------- */
var QOPT=[['Q1','Q1 journal'],['Q2','Q2 journal'],['Q3','Q3 journal'],['Q4','Q4 journal'],['Conf','Conference paper']];
var SECTIONS=[
 {id:'dash',title:'Dashboard',icon:'🏠',custom:'dash'},
 {sep:'Content'},
 {id:'profile',title:'Profile & links',icon:'👤',lead:'Name, contact details, social links and your main photo.',blocks:[
  {title:'Basic information',fields:[
    {k:'profile.name',label:'Full name'},{k:'profile.email',label:'Main email'},{k:'profile.email2',label:'Second email'},
    {k:'profile.scholar',label:'Google Scholar link',type:'url'},{k:'profile.linkedin',label:'LinkedIn link',type:'url'}]},
  {title:'Home page photo',hint:'Shown inside the round frame on the home page.',fields:[{k:'profile.photo',label:'Photo',type:'image'}]},
  {title:'Extra links',hint:'Add any link you like (YouTube, ResearchGate, ORCID, Facebook…). They appear as buttons in the Contact section. You can reorder or remove them any time.',fields:[{k:'links',label:'Links',type:'list',add:'Add link',blank:{label:{en:'',bn:'',ar:''},url:''},sum:function(i){return asTri(i.label).en||i.url},fields:[{k:'label',label:'Button text',type:'tri'},{k:'url',label:'Link (https://…)',type:'url'}]}]}]},
 {id:'home',title:'Home page',icon:'✨',lead:'Everything you see first: greeting, typing words, badges and numbers.',blocks:[
  {title:'Top texts',fields:[T('status','Availability chip'),T('hero_eyebrow','Small line above the name'),T('hero_hi','Greeting (before the name)'),T('hero_lead','Intro paragraph','tria'),T('hero_cta1','First button'),T('hero_cta2','Second button')]},
  {title:'Typing words',hint:'These words are typed one after another under your name.',fields:[{k:'typed',label:'Words',type:'list',item:'tri',add:'Add word'}]},
  {title:'Big badges next to the photo',hint:'Up to two floating badges. Example: value “Q1”, label “journals”.',fields:[{k:'badges',label:'Badges',type:'list',max:2,add:'Add badge',blank:{value:'',label:{en:'',bn:'',ar:''}},sum:function(i){return i.value+' '+asTri(i.label).en},fields:[{k:'value',label:'Big text'},{k:'label',label:'Small label',type:'tri'}]}]},
  {title:'Orbit labels',hint:'Small chips orbiting the photo (up to 3 look best). One per line.',fields:[{k:'orbit',label:'Chips',type:'lines'}]},
  {title:'Scrolling keyword strip',fields:[{k:'marquee',label:'Keywords (one per line)',type:'lines'}]},
  {title:'Numbers strip',hint:'Counters under the home section.',fields:[{k:'stats',label:'Numbers',type:'list',add:'Add number',blank:{value:0,suffix:'',label:{en:'',bn:'',ar:''}},sum:function(i){return i.value+(i.suffix||'')+' – '+asTri(i.label).en},fields:[{k:'value',label:'Number',type:'number'},{k:'suffix',label:'Suffix (for example +)'},{k:'label',label:'Label',type:'tri'}]}]}]},
 {id:'about',title:'About',icon:'🙋',lead:'Your introduction, interests and quick facts.',blocks:[
  {title:'Texts',fields:[T('about_h','Section title'),T('about_p1','Paragraph 1','tria'),T('about_p2','Paragraph 2','tria'),T('about_p3','Paragraph 3','tria')]},
  {title:'Interest chips',fields:[{k:'interests',label:'Interests',type:'list',item:'tri',add:'Add interest'}]},
  {title:'Quick facts card',fields:[T('facts_h','Card title'),{k:'facts',label:'Facts',type:'list',add:'Add fact',blank:{label:{en:'',bn:'',ar:''},value:{en:'',bn:'',ar:''},kind:'text'},sum:function(i){return asTri(i.label).en},fields:[{k:'label',label:'Label',type:'tri'},{k:'kind',label:'Type',type:'select',options:[['text','Normal text'],['email','Show the main email']]},{k:'value',label:'Value',type:'tri'}]}]}]},
 {id:'research',title:'Research',icon:'🔬',lead:'Featured result with chart, plus research focus cards.',blocks:[
  {title:'Featured result',fields:[T('res_h','Section title'),T('hl_tag','Small tag'),T('hl_h','Headline'),T('hl_p','Description','tria'),T('read_paper','Link text'),{k:'highlightLink',label:'Paper link',type:'url'}]},
  {title:'Chart bars',hint:'“Bar length %” is how long the bar is (0–100). Tick “Highlight” for the green bar.',fields:[{k:'bars',label:'Bars',type:'list',add:'Add bar',blank:{label:{en:'',bn:'',ar:''},value:'',pct:50,best:false},sum:function(i){return asTri(i.label).en+' – '+i.value},fields:[{k:'label',label:'Label',type:'tri'},{k:'value',label:'Value shown (e.g. 11.43%)'},{k:'pct',label:'Bar length %',type:'number'},{k:'best',label:'Highlight (green)',type:'bool'}]}]},
  {title:'Research cards',fields:[{k:'research',label:'Cards',type:'list',add:'Add card',blank:{icon:'🔬',title:{en:'',bn:'',ar:''},text:{en:'',bn:'',ar:''},tags:[]},sum:function(i){return asTri(i.title).en},fields:[{k:'icon',label:'Icon (an emoji)'},{k:'title',label:'Title',type:'tri'},{k:'text',label:'Text',type:'tria'},{k:'tags',label:'Tags (one per line)',type:'lines'}]}]}]},
 {id:'experience',title:'Experience',icon:'💼',lead:'Your work history, newest first.',blocks:[
  {title:'Labels',fields:[T('exp_h','Section title'),T('ft','“Full-time” label'),T('pt','“Part-time” label'),T('now','“Current” label')]},
  {title:'Positions',fields:[{k:'experience',label:'Positions',type:'list',add:'Add position',blank:{dates:'',tag:{en:'Full-time',bn:'ফুল-টাইম',ar:'دوام كامل'},current:false,role:{en:'',bn:'',ar:''},org:'',bullets:[]},sum:function(i){return asTri(i.role).en+' ('+i.dates+')'},fields:[{k:'dates',label:'Dates (e.g. Oct 2022 – Jun 2025)'},{k:'tag',label:'Type (Full-time / Part-time)',type:'tri'},{k:'current',label:'This is my current position',type:'bool'},{k:'role',label:'Job title',type:'tri'},{k:'org',label:'Organisation and place',type:'tri'},{k:'bullets',label:'What I did',type:'list',item:'tria',add:'Add bullet point'}]}]}]},
 {id:'awards',title:'Awards & certifications',icon:'🏆',lead:'Awards, milestones, conferences and seminars.',blocks:[
  {title:'Titles',fields:[T('aw_h','Section title'),T('cert_h','Sub-title for certificates')]},
  {title:'Awards & milestones',fields:[{k:'awards',label:'Cards',type:'list',add:'Add award',blank:{year:'',icon:'🏆',title:{en:'',bn:'',ar:''},text:{en:'',bn:'',ar:''}},sum:function(i){return i.year+' – '+asTri(i.title).en},fields:[{k:'year',label:'Year or label'},{k:'icon',label:'Icon (an emoji)'},{k:'title',label:'Title',type:'tri'},{k:'text',label:'Description',type:'tria'}]}]},
  {title:'Conferences, seminars & training',fields:[{k:'certs',label:'Certificates',type:'list',add:'Add certificate',blank:{year:'',text:{en:'',bn:'',ar:''}},sum:function(i){return i.year+' – '+asTri(i.text).en},fields:[{k:'year',label:'Year'},{k:'text',label:'Text',type:'tria'}]}]}]},
 {id:'gallery',title:'Photo gallery',icon:'🖼️',custom:'gallery'},
 {id:'publications',title:'Publications',icon:'📚',lead:'Research papers. The DOI makes the card clickable.',blocks:[
  {title:'Labels',fields:[T('pub_h','Section title'),T('fl_all','Filter: All'),T('fl_q1','Filter: Q1'),T('fl_j','Filter: Journals'),T('fl_c','Filter: Conference'),T('all_scholar','Scholar link text'),T('cited','“Cited by” word')]},
  {title:'Papers',fields:[{k:'publications',label:'Papers',type:'list',add:'Add paper',blank:{year:new Date().getFullYear(),title:'',journal:'',q:'Q1',cites:0,doi:'',kind:'journal',note:{en:'',bn:'',ar:''}},sum:function(i){return i.year+' – '+i.title},fields:[{k:'title',label:'Title'},{k:'year',label:'Year',type:'number'},{k:'journal',label:'Journal / conference and volume'},{k:'q',label:'Type / quartile',type:'select',options:QOPT},{k:'kind',label:'Group for filter',type:'select',options:[['journal','Journal'],['conf','Conference']]},{k:'cites',label:'Citations',type:'number'},{k:'doi',label:'DOI (example: 10.1016/j.jmrt.2024.11.016)'},{k:'note',label:'Key finding (optional)',type:'tria'}]}]}]},
 {id:'skills',title:'Skills',icon:'🛠️',lead:'Skill groups with chips.',blocks:[
  {title:'Title',fields:[T('sk_h','Section title')]},
  {title:'Skill groups',fields:[{k:'skills',label:'Groups',type:'list',add:'Add group',blank:{title:{en:'',bn:'',ar:''},chips:[]},sum:function(i){return asTri(i.title).en},fields:[{k:'title',label:'Group title',type:'tri'},{k:'chips',label:'Skills (one per line)',type:'lines'}]}]}]},
 {id:'education',title:'Education',icon:'🎓',lead:'Degrees and schools.',blocks:[
  {title:'Title',fields:[T('edu_h','Section title')]},
  {title:'Education entries',fields:[{k:'education',label:'Entries',type:'list',add:'Add education',blank:{year:'',title:{en:'',bn:'',ar:''},org:{en:'',bn:'',ar:''},text:{en:'',bn:'',ar:''},extra:{en:'',bn:'',ar:''}},sum:function(i){return i.year+' – '+asTri(i.title).en},fields:[{k:'year',label:'Year'},{k:'title',label:'Degree / certificate',type:'tri'},{k:'org',label:'School / university',type:'tri'},{k:'text',label:'Details (major, result…)',type:'tria'},{k:'extra',label:'More details (e.g. supervisors)',type:'tria'}]}]}]},
 {id:'contact',title:'Contact & footer',icon:'✉️',lead:'Closing section and footer.',blocks:[
  {title:'Contact card',fields:[T('ct_h','Title'),T('ct_p','Message','tria'),T('ct_mail','“Send an email” button'),T('copy','“Copy email” button'),T('copied','Message after copying')]},
  {title:'Footer',fields:[T('foot','Footer text'),T('top','“Back to top” text')]}]},
 {sep:'Site'},
 {id:'layout',title:'Page sections',icon:'🧩',custom:'layout'},
 {id:'menu',title:'Menu labels',icon:'🧭',lead:'Names in the top navigation bar.',blocks:[
  {title:'Navigation',fields:[T('nav_about','About'),T('nav_research','Research'),T('nav_experience','Experience'),T('nav_awards','Awards'),T('nav_gallery','Gallery'),T('nav_pubs','Publications'),T('nav_skills','Skills'),T('nav_edu','Education'),T('nav_contact','Contact')]}]},
 {id:'backup',title:'Backup & import',icon:'💾',custom:'backup'}
];

/* ---------- views ---------- */
function renderSide(){
  var s=$('#side');s.innerHTML='';
  SECTIONS.forEach(function(x){
    if(x.sep){s.appendChild(el('div',{class:'sep',text:x.sep}));return}
    s.appendChild(el('button',{class:x.id===cur?'on':'',onclick:function(){cur=x.id;s.classList.remove('open');render();window.scrollTo(0,0)}},[x.icon+' ',x.title]));
  });
}
function render(){
  renderSide();
  var sec=SECTIONS.filter(function(x){return x.id===cur})[0],v=$('#view');v.innerHTML='';
  if(sec.custom==='dash')return dash(v);
  if(sec.custom==='backup')return backup(v);
  if(sec.custom==='gallery')return galleryView(v);
  if(sec.custom==='layout')return layoutView(v);
  v.appendChild(el('h1',{text:sec.title}));v.appendChild(el('p',{class:'lead',text:sec.lead||''}));
  sec.blocks.forEach(function(b){
    var bl=el('section',{class:'block'},[el('h2',{text:b.title})]);
    if(b.hint)bl.appendChild(el('p',{class:'hint',text:b.hint}));
    b.fields.forEach(function(f){bl.appendChild(field(f,C))});
    v.appendChild(bl);
  });
  v.appendChild(el('div',{class:'msg',text:'Changes are saved as a draft in this browser automatically. Press “Preview draft” to see them, then “Publish” to make them live.'}));
}


/* ---------- photo gallery editor ---------- */
function galleryView(v){
  v.appendChild(el('h1',{text:'Photo gallery'}));
  v.appendChild(el('p',{class:'lead',text:'Add photos any time. They appear in the “Photo gallery” section of the website. Reorder, caption or delete them whenever you like.'}));
  var tb=el('section',{class:'block'},[el('h2',{text:'Titles'})]);
  tb.appendChild(field(T('gal_h','Section title'),C));
  tb.appendChild(field(T('gal_sub','Short description under the title','tria'),C));
  v.appendChild(tb);
  if(!Array.isArray(C.gallery))C.gallery=[];
  var blk=el('section',{class:'block'},[el('h2',{text:'Photos'})]);
  blk.appendChild(el('p',{class:'hint',text:'You can pick many photos at once. Each photo is resized automatically. The caption is optional and shows when someone hovers or opens the photo.'}));
  var grid=el('div',{class:'galadm'}),status=el('div',{class:'help'});
  var file=el('input',{type:'file',accept:'image/*',multiple:'multiple'});file.style.display='none';
  function build(){
    grid.innerHTML='';var a=C.gallery;
    a.forEach(function(g,i){
      function mv(dx){return function(){var j=i+dx;if(j<0||j>=a.length)return;var t=a[i];a[i]=a[j];a[j]=t;touch();build()}}
      var im=el('img',{alt:'',loading:'lazy'});im.src=g.img||'';
      var acts=el('div',{class:'ga'},[
        el('button',{type:'button',title:'Move earlier',text:'←',onclick:mv(-1)}),
        el('button',{type:'button',title:'Move later',text:'→',onclick:mv(1)}),
        el('button',{type:'button',title:'Move to first',text:'⇤',onclick:function(){if(i){a.unshift(a.splice(i,1)[0]);touch();build()}}}),
        el('button',{type:'button',class:'del',title:'Delete',text:'🗑',onclick:function(){if(confirm('Remove this photo from the gallery?')){a.splice(i,1);touch();build()}}})]);
      var cap=ctlTri(function(){return g.caption},function(x){g.caption=x},false);
      grid.appendChild(el('div',{class:'gcard'},[el('div',{class:'gimg'},[im,el('span',{class:'gn',text:String(i+1)})]),acts,cap]));
    });
    if(!a.length)grid.appendChild(el('div',{class:'help',text:'No photos yet. Press “Add photos” to start.'}));
    status.textContent=a.length?a.length+' photo'+(a.length>1?'s':'')+' in the gallery':'';
  }
  var add=el('button',{class:'btn primary',type:'button',text:'+ Add photos',onclick:function(){file.click()}});
  file.addEventListener('change',function(){
    var fl=Array.prototype.slice.call(file.files);file.value='';if(!fl.length)return;
    add.disabled=true;var n=0,fail=0;
    fl.reduce(function(p,f){return p.then(function(){
      add.textContent='Uploading '+(n+fail+1)+' of '+fl.length+'…';
      return uploadImage(f).then(function(url){C.gallery.push({img:url,caption:{en:'',bn:'',ar:''}});n++;touch();build()}).catch(function(e){fail++;toast(f.name+': '+(e.message||e),'err')});
    })},Promise.resolve()).then(function(){add.disabled=false;add.textContent='+ Add photos';if(n)toast(n+' photo'+(n>1?'s':'')+' added. Press Publish to make them live.')});
  });
  blk.appendChild(el('div',{style:'margin-bottom:14px'},[add,file]));
  blk.appendChild(status);blk.appendChild(grid);build();
  v.appendChild(blk);
  v.appendChild(el('div',{class:'msg',text:'The gallery section is hidden on the website automatically while it has no photos.'}));
}

/* ---------- page sections: order + show/hide ---------- */
var LAYOUT_SECS={about:['🙋','About'],research:['🔬','Research'],experience:['💼','Experience'],achievements:['🏆','Awards & certifications'],gallery:['🖼️','Photo gallery'],publications:['📚','Publications'],skills:['🛠️','Skills'],education:['🎓','Education'],contact:['✉️','Contact']};
function normLayout(){
  var seen={},l=(Array.isArray(C.layout)?C.layout:[]).filter(function(x){return x&&LAYOUT_SECS[x.id]&&!seen[x.id]&&(seen[x.id]=1)});
  Object.keys(LAYOUT_SECS).forEach(function(id){if(!seen[id])l.push({id:id,show:true})});
  C.layout=l;return l;
}
function layoutView(v){
  v.appendChild(el('h1',{text:'Page sections'}));
  v.appendChild(el('p',{class:'lead',text:'Choose the order of the sections on your website and hide any you do not need. The menu bar and the section numbers update by themselves.'}));
  var blk=el('section',{class:'block'},[el('h2',{text:'Sections, from top to bottom'}),el('p',{class:'hint',text:'The top area (name, photo, numbers strip) always stays first. Use ↑ ↓ to move a section, and the tick box to show or hide it.'})]);
  var box=el('div',{class:'list'});
  function build(){
    box.innerHTML='';var l=normLayout();
    l.forEach(function(x,i){
      function mv(dx){return function(){var j=i+dx;if(j<0||j>=l.length)return;var t=l[i];l[i]=l[j];l[j]=t;touch();build()}}
      var chk=el('input',{type:'checkbox'});chk.checked=x.show!==false;
      chk.addEventListener('change',function(){x.show=chk.checked;touch();build()});
      var info=LAYOUT_SECS[x.id];
      box.appendChild(el('div',{class:'lrow'+(x.show===false?' off':'')},[
        el('span',{class:'lname',text:(i+1)+'. '+info[0]+' '+info[1]}),
        el('label',{class:'chk'},[chk,'Show']),
        el('span',{class:'acts'},[el('button',{type:'button',title:'Move up',text:'↑',onclick:mv(-1)}),el('button',{type:'button',title:'Move down',text:'↓',onclick:mv(1)})])]));
    });
  }
  build();blk.appendChild(box);v.appendChild(blk);
}

function dash(v){
  v.appendChild(el('h1',{text:'Dashboard'}));
  v.appendChild(el('p',{class:'lead',text:'Edit any section from the menu, preview your draft, then publish.'}));
  var counts=[['Publications',(C.publications||[]).length],['Positions',(C.experience||[]).length],['Awards',(C.awards||[]).length],['Skill groups',(C.skills||[]).length],['Education',(C.education||[]).length],['Photos',(C.gallery||[]).length]];
  var grid=el('div',{class:'cards'});counts.forEach(function(c){grid.appendChild(el('div',{class:'stat'},[el('b',{text:String(c[1])}),el('span',{text:c[0]})]))});
  v.appendChild(el('section',{class:'block'},[el('h2',{text:'Your site at a glance'}),grid]));
  v.appendChild(el('section',{class:'block'},[el('h2',{text:'Publish'}),
    el('p',{class:'hint',text:'Preview first to check how it looks. Publishing makes this draft live within seconds.'}),
    el('div',{style:'display:flex;gap:10px;flex-wrap:wrap'},[
      el('button',{class:'btn',text:'Preview draft',onclick:previewDraft}),
      el('button',{class:'btn primary',text:'Publish now',onclick:function(){doPublish()}}),
      el('button',{class:'btn danger',text:'Discard draft',onclick:discard})])]));
  v.appendChild(el('section',{class:'block'},[el('h2',{text:'Account'}),
    el('p',{class:'hint',text:'You are signed in. The session stays active on this device for 30 days.'}),
    el('button',{class:'btn',text:'Sign out',onclick:function(){api('/api/logout',{}).then(function(){location.reload()})}})]));
}
function backup(v){
  v.appendChild(el('h1',{text:'Backup & import'}));
  v.appendChild(el('p',{class:'lead',text:'Download all your content as a file, or load a saved file back.'}));
  var file=el('input',{type:'file',accept:'application/json'});file.style.display='none';
  file.addEventListener('change',function(){
    var f=file.files[0];if(!f)return;var rd=new FileReader();
    rd.onload=function(){try{var d=JSON.parse(rd.result);if(!d.t||!d.publications)throw new Error('This does not look like a portfolio content file.');C=d;touch();render();toast('Imported. Review it, then publish.')}catch(e){toast(e.message,'err')}};rd.readAsText(f);
  });
  v.appendChild(el('section',{class:'block'},[el('h2',{text:'Backup'}),
    el('div',{style:'display:flex;gap:10px;flex-wrap:wrap'},[
      el('button',{class:'btn',text:'Download content.json',onclick:function(){
        var a=el('a',{href:URL.createObjectURL(new Blob([JSON.stringify(C,null,1)],{type:'application/json'})),download:'content-backup-'+new Date().toISOString().slice(0,10)+'.json'});document.body.appendChild(a);a.click();a.remove()}}),
      el('button',{class:'btn',text:'Import from file',onclick:function(){file.click()}}),file,
      el('button',{class:'btn',text:'Reload published version',onclick:discard})])]));
}

/* ---------- actions ---------- */
function previewDraft(){touch();window.open('../index.html?preview=1','_blank')}
function discard(){
  if(!confirm('Discard your draft and reload the published content?'))return;
  store.del(DRAFT);C=clone(published);refreshState();render();toast('Draft discarded');
}

/* ---------- server API ---------- */
function api(path,body){
  return fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(body||{})}).then(function(r){
    return r.json().catch(function(){return {}}).then(function(j){
      if(!r.ok){
        if(r.status===401&&path!=='/api/login'){sessionExpired()}
        throw new Error(j.error||('Server error '+r.status));
      }
      return j;
    });
  });
}
function sessionExpired(){toast('Your session ended. Please sign in again (your draft is safe).','err');setTimeout(function(){location.reload()},1800)}
function doPublish(){
  var bad=[];
  if(!C.profile||!C.profile.email)bad.push('Main email is empty');
  (C.publications||[]).forEach(function(p,i){if(!p.title||!p.doi)bad.push('Paper '+(i+1)+' needs a title and a DOI')});
  if(bad.length){alert('Please fix first:\n\n- '+bad.join('\n- '));return}
  if(!isDirty()&&!confirm('There are no changes compared with the published version. Publish anyway?'))return;
  if(!confirm('Publish these changes to the live website?'))return;
  var btn=$('#publish');btn.disabled=true;btn.textContent='Publishing…';
  api('/api/save',C).then(function(){
    published=clone(C);store.del(DRAFT);refreshState();
    toast('Published! The live site shows it within a minute.');
  }).catch(function(e){toast(e.message,'err');alert('Could not publish:\n\n'+e.message)}).then(function(){btn.disabled=false;btn.textContent='Publish'});
}
function uploadImage(file){
  return createImageBitmap(file).then(function(bm){
    var max=1600,sc=Math.min(1,max/Math.max(bm.width,bm.height)),cv=document.createElement('canvas');
    cv.width=Math.round(bm.width*sc);cv.height=Math.round(bm.height*sc);cv.getContext('2d').drawImage(bm,0,0,cv.width,cv.height);
    return new Promise(function(res){cv.toBlob(res,'image/jpeg',.88)});
  }).then(function(blob){
    return new Promise(function(res){var rd=new FileReader();rd.onload=function(){res(rd.result.split(',')[1])};rd.readAsDataURL(blob)});
  }).then(function(b){return api('/api/upload',{name:file.name,data:b})}).then(function(j){return j.url});
}

/* ---------- login + init ---------- */
function loginScreen(info){
  document.querySelector('.layout').style.display='none';
  document.querySelector('.top').style.display='none';
  var pw=el('input',{type:'password',placeholder:'Password',autocomplete:'current-password'});
  var err=el('div',{class:'msg err',style:'display:none'});
  var btn=el('button',{class:'btn primary',type:'submit',text:'Sign in'});
  var form=el('form',{class:'login'},[
    el('div',{class:'logo',text:'MS'}),
    el('h1',{text:'Portfolio Admin'}),
    el('p',{class:'lead',text:'Sign in to edit your portfolio.'}),
    pw,btn,err]);
  if(info&&!info.passwordSet){err.style.display='block';err.textContent='Setup not finished: the admin password has not been set on the server yet.'}
  form.addEventListener('submit',function(e){
    e.preventDefault();err.style.display='none';btn.disabled=true;btn.textContent='Checking…';
    api('/api/login',{password:pw.value}).then(function(){location.reload()}).catch(function(x){err.textContent=x.message;err.style.display='block';btn.disabled=false;btn.textContent='Sign in';pw.select()});
  });
  document.body.appendChild(el('div',{class:'loginwrap'},[form]));
  pw.focus();
}
function start(){
  $('#burger').addEventListener('click',function(){$('#side').classList.toggle('open')});
  $('#preview').addEventListener('click',previewDraft);
  $('#publish').addEventListener('click',function(){doPublish()});
  store.del('portfolio_admin_token');store.del('portfolio_admin_cfg');
  fetch('/api/content?fresh=1',{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.json()}).catch(function(){return fetch('../content.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('Could not load the content ('+r.status+')');return r.json()})}).then(function(j){
    published=j;var d=store.get(DRAFT),draft=null;
    if(d){try{draft=JSON.parse(d)}catch(e){}}
    C=draft||clone(j);
    if(draft&&JSON.stringify(draft)!==JSON.stringify(j))toast('Your unpublished draft was restored.');
    refreshState();render();
  }).catch(function(e){$('#view').appendChild(el('div',{class:'msg err',text:e.message}))});
}
fetch('/api/me',{credentials:'same-origin',cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('no api');return r.json()}).then(function(info){
  if(info.authed)start();else loginScreen(info);
}).catch(function(){
  document.body.appendChild(el('div',{class:'loginwrap'},[el('div',{class:'login'},[el('h1',{text:'Portfolio Admin'}),el('div',{class:'msg err',text:'The admin service is not reachable here. Open the admin from the live website address.'})])]));
  document.querySelector('.layout').style.display='none';document.querySelector('.top').style.display='none';
});
})();
