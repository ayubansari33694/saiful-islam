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
function migrate(d,b){
  if(!d||!b)return d;
  var hadTraining=Array.isArray(d.training);
  Object.keys(b).forEach(function(k){if(d[k]===undefined)d[k]=b[k]});
  if(b.t){d.t=d.t||{};Object.keys(b.t).forEach(function(k){if(d.t[k]===undefined)d.t[k]=b.t[k]})}
  if(!hadTraining&&Array.isArray(d.certs))d.certs=d.certs.filter(function(c){var e=c&&c.text&&(c.text.en||c.text);return !/^Training:/.test(String(e))});
  return d;
}
function ensureAbout(d){
  if(!d||Array.isArray(d.aboutBlocks))return d;
  var t=d.t||{},meta=[['👋',{en:'Who I am',bn:'আমি কে',ar:'من أنا'}],['🔬',{en:'How I work',bn:'আমার কাজের ধরন',ar:'طريقة عملي'}],['🌍',{en:'Today & collaboration',bn:'এখন ও সহযোগিতা',ar:'اليوم والتعاون'}]];
  d.aboutBlocks=[1,2,3].map(function(n){return {text:t['about_p'+n]||{en:'',bn:'',ar:''}}}).filter(function(b){return b.text&&(b.text.en||b.text.bn||b.text.ar)});
  return d;
}
function clone(o){return JSON.parse(JSON.stringify(o))}
function getp(o,p){return p.split('.').reduce(function(a,k){return a==null?a:a[k]},o)}
function setp(o,p,v){var ks=p.split('.'),l=ks.pop(),t=o;ks.forEach(function(k){if(t[k]==null||typeof t[k]!=='object')t[k]={};t=t[k]});t[l]=v}
function toast(msg,kind){var t=el('div',{class:'toast '+(kind||'ok'),text:msg});$('#toasts').appendChild(t);setTimeout(function(){t.remove()},kind==='err'?7000:3200)}
function isDirty(){return JSON.stringify(C)!==JSON.stringify(published)}
function refreshState(){var s=$('#state'),d=isDirty();s.textContent=d?'Unpublished changes':'All changes published';s.className='pill '+(d?'dirty':'ok');document.body.classList.toggle('isdirty',d)}
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
  var box=el('div',{class:'tri'}),v=asTri(get()),inputs=[];
  function marks(){var c=asTri(get());inputs.forEach(function(x){x.i.classList.toggle('miss',x.l!=='en'&&!String(c[x.l]).trim()&&!!String(c.en).trim())})}
  [['en','EN'],['bn','বাং'],['ar','عربي']].forEach(function(p){
    var inp=area?el('textarea'):el('input',{type:'text'});inp.value=v[p[0]];
    if(p[0]==='ar')inp.dir='rtl';
    inputs.push({l:p[0],i:inp});
    inp.addEventListener('input',function(){var cur=asTri(get());cur[p[0]]=inp.value;set(cur);touch();marks()});
    box.appendChild(el('div',{class:'lang','data-l':p[0]},[el('i',{text:p[1]}),inp]));
  });
  marks();
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

/* ---------- list editor (drag to reorder, expand/collapse, search) ---------- */
function ctlList(f,base){
  var wrap=el('div',{class:'lwrap'}),box=el('div',{class:'list'}),cnt=el('span',{class:'lcount'}),bar=el('div',{class:'lbar'}),dragI=null,q='';
  function arr(){var a=getp(base,f.k);if(!Array.isArray(a)){a=[];setp(base,f.k,a)}return a}
  function title(item,i){
    var t='';try{t=f.sum?f.sum(item,i):''}catch(e){}
    if(!t&&(f.item==='tri'||f.item==='tria'))t=asTri(item).en;
    return (t||('Item '+(i+1))).toString().slice(0,90);
  }
  function addItem(){
    var a=arr();if(f.max&&a.length>=f.max){toast('Maximum '+f.max+' items for this list','err');return}
    var n=f.item==='tri'||f.item==='tria'?{en:'',bn:'',ar:''}:clone(f.blank||{});a.push(n);if(f.onadd)f.onadd(n);
    if(typeof n==='object')openSet.add(n);touch();q='';if(search)search.value='';build();
    var last=box.lastElementChild;if(last&&last.scrollIntoView)last.scrollIntoView({block:'center',behavior:'smooth'});
  }
  function applyQ(){var t=q.toLowerCase();Array.prototype.forEach.call(box.children,function(d){if(!d.classList.contains('item'))return;d.style.display=!t||d.textContent.toLowerCase().indexOf(t)>-1&&true?'':'none'})}
  function build(){
    box.innerHTML='';var a=arr();cnt.textContent=a.length+(a.length===1?' item':' items');
    a.forEach(function(item,i){
      var d=el('details',{class:'item'}),sum=el('span',{class:'sum',text:title(item,i)});
      if(typeof item==='object'&&item&&openSet.has(item))d.open=true;
      d.addEventListener('toggle',function(){if(typeof item==='object'&&item){d.open?openSet.add(item):openSet.delete(item)}});
      function mv(dx){return function(e){e.preventDefault();var j=i+dx;if(j<0||j>=a.length)return;var t=a[i];a[i]=a[j];a[j]=t;touch();build()}}
      var grip=el('span',{class:'grip',title:'Drag to reorder',text:'⠿'});
      grip.addEventListener('mousedown',function(){d.draggable=true});
      grip.addEventListener('click',function(e){e.preventDefault()});
      d.addEventListener('dragstart',function(e){dragI=i;e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',String(i))}catch(x){}d.classList.add('dragging')});
      d.addEventListener('dragend',function(){d.draggable=false;dragI=null;Array.prototype.forEach.call(box.children,function(c){c.classList.remove('dragging','over')})});
      d.addEventListener('dragover',function(e){if(dragI==null)return;e.preventDefault();d.classList.add('over')});
      d.addEventListener('dragleave',function(){d.classList.remove('over')});
      d.addEventListener('drop',function(e){e.preventDefault();if(dragI==null||dragI===i)return;var it=a.splice(dragI,1)[0];a.splice(i,0,it);dragI=null;touch();build()});
      var acts=el('span',{class:'acts'},[
        el('button',{type:'button',title:'Move up',text:'↑',onclick:mv(-1)}),
        el('button',{type:'button',title:'Move down',text:'↓',onclick:mv(1)}),
        el('button',{type:'button',title:'Duplicate',text:'⧉',onclick:function(e){e.preventDefault();a.splice(i+1,0,clone(item));touch();build()}}),
        el('button',{type:'button',class:'del',title:'Delete',text:'🗑',onclick:function(e){e.preventDefault();if(confirm('Delete this item?')){a.splice(i,1);touch();build()}}})
      ]);
      d.appendChild(el('summary',null,[grip,el('span',{class:'num',text:String(i+1)}),sum,acts]));
      var body=el('div',{class:'body'});
      if(f.item==='tri'||f.item==='tria'){
        body.appendChild(ctlTri(function(){return a[i]},function(v){a[i]=v},f.item==='tria'));
        body.firstChild.addEventListener('input',function(){sum.textContent=title(a[i],i)});
      }else{
        f.fields.forEach(function(sf){body.appendChild(field(sf,item))});
        body.addEventListener('input',function(){sum.textContent=title(item,i)});
        body.addEventListener('change',function(){sum.textContent=title(item,i)});
      }
      d.appendChild(body);box.appendChild(d);
    });
    if(!a.length)box.appendChild(el('div',{class:'empty',text:'Nothing here yet. Press “+ '+(f.add||'Add item')+'” to create the first one.'}));
    searchWrap.style.display=a.length>6?'':'none';applyQ();
  }
  var search=el('input',{type:'search',placeholder:'Search in this list…'}),searchWrap=el('span',{class:'lsearch'},[search]);
  search.addEventListener('input',function(){q=search.value;applyQ()});
  function setAll(o){Array.prototype.forEach.call(box.querySelectorAll('details.item'),function(d){d.open=o})}
  bar.appendChild(cnt);bar.appendChild(searchWrap);bar.appendChild(el('span',{class:'grow'}));
  bar.appendChild(el('button',{type:'button',class:'btn sm ghost',text:'Expand all',onclick:function(){setAll(true)}}));
  bar.appendChild(el('button',{type:'button',class:'btn sm ghost',text:'Collapse all',onclick:function(){setAll(false)}}));
  bar.appendChild(el('button',{type:'button',class:'btn sm primary addbtn',text:'+ '+(f.add||'Add item'),onclick:addItem}));
  wrap.appendChild(bar);wrap.appendChild(box);build();
  wrap.appendChild(el('button',{class:'btn addrow addbtn',type:'button',text:'+ '+(f.add||'Add item'),onclick:addItem}));
  return wrap;
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
  var wrap=el('div',{class:'field'+(['tri','tria','area','lines','list','image'].indexOf(f.type)>-1?' wide':'')},kids);
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
  {title:'Texts',fields:[T('about_h','Section title'),]},
  {title:'About paragraphs',hint:'These paragraphs appear together in one card in the About section. Press “Add paragraph” (+) to add more. Drag to reorder.',fields:[{k:'aboutBlocks',label:'Paragraphs',type:'list',add:'Add paragraph',blank:{text:{en:'',bn:'',ar:''}},sum:function(i){var t=asTri(i.text).en||'';return t.length>60?t.slice(0,60)+'…':(t||'New paragraph')},fields:[{k:'text',label:'Paragraph',type:'tria'}]}]},
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
  {title:'Conferences & seminars',fields:[{k:'certs',label:'Certificates',type:'list',add:'Add certificate',blank:{year:'',text:{en:'',bn:'',ar:''}},sum:function(i){return i.year+' – '+asTri(i.text).en},fields:[{k:'year',label:'Year'},{k:'text',label:'Text',type:'tria'}]}]}]},
 {id:'training',title:'Training',icon:'🛠️',lead:'Courses and hands-on training. It appears on the website as its own section.',blocks:[
  {title:'Titles',fields:[T('tr_h','Section title'),T('tr_sub','Short description under the title','tria')]},
  {title:'Training items',fields:[{k:'training',label:'Trainings',type:'list',add:'Add training',blank:{year:'',icon:'🛠️',title:{en:'',bn:'',ar:''},org:{en:'',bn:'',ar:''},text:{en:'',bn:'',ar:''}},sum:function(i){return (i.year?i.year+' – ':'')+asTri(i.title).en},fields:[{k:'year',label:'Year or label (for example 2024)'},{k:'icon',label:'Icon (an emoji)'},{k:'title',label:'Training name',type:'tri'},{k:'org',label:'Organisation / place',type:'tri'},{k:'text',label:'Details (optional)',type:'tria'}]}]}]},
 {id:'custom',title:'Extra sections',icon:'➕',lead:'Create any new section for your website, for example Projects, Teaching, Media or Volunteering. Each one appears as its own section and in the menu.',blocks:[
  {title:'Your extra sections',hint:'Press “Add new section”, give it a name, choose how it looks, then add items. You can reorder, hide or delete it any time. Move it on the page from “Page sections”.',fields:[{k:'customSections',label:'Sections',type:'list',add:'Add new section',onadd:function(n){n.id='s'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)},blank:{id:'',title:{en:'',bn:'',ar:''},intro:{en:'',bn:'',ar:''},layout:'cards',items:[]},sum:function(i){return asTri(i.title).en||'New section'},fields:[{k:'title',label:'Section name (also used in the menu)',type:'tri'},{k:'intro',label:'Short description (optional)',type:'tria'},{k:'layout',label:'How to show the items',type:'select',options:[['cards','Cards – icon, title and text'],['list','Simple list'],['timeline','Timeline']]},{k:'items',label:'Items',type:'list',add:'Add item',blank:{icon:'✨',tag:'',title:{en:'',bn:'',ar:''},text:{en:'',bn:'',ar:''},link:'',linkText:{en:'',bn:'',ar:''}},sum:function(i){return (i.tag?i.tag+' – ':'')+asTri(i.title).en},fields:[{k:'icon',label:'Icon (an emoji, for cards)'},{k:'tag',label:'Year or small label'},{k:'title',label:'Title',type:'tri'},{k:'text',label:'Text (optional)',type:'tria'},{k:'link',label:'Link (optional)',type:'url'},{k:'linkText',label:'Link text (optional)',type:'tri'}]}]}]}]},
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
 {id:'background',title:'Background',icon:'🎨',custom:'background'},
 {id:'layout',title:'Page sections',icon:'🧩',custom:'layout'},
 {id:'menu',title:'Menu labels',icon:'🧭',lead:'Names in the top navigation bar.',blocks:[
  {title:'Navigation',fields:[T('nav_about','About'),T('nav_research','Research'),T('nav_experience','Experience'),T('nav_awards','Awards'),T('nav_training','Training'),T('nav_gallery','Gallery'),T('nav_pubs','Publications'),T('nav_skills','Skills'),T('nav_edu','Education'),T('nav_contact','Contact')]}]},
 {id:'backup',title:'Backup & import',icon:'💾',custom:'backup'}
];

/* ---------- views ---------- */
var GROUPS=[['Overview',['dash']],['Website content',['profile','home','about','research','experience','awards','training','publications','skills','education','contact']],['Extra',['custom']],['Media',['gallery']],['Look & layout',['background','layout','menu']],['Settings',['backup']]];
function secById(id){return SECTIONS.filter(function(x){return x.id===id})[0]}
function countOf(id){
  var c=C||{},n={research:(c.research||[]).length,experience:(c.experience||[]).length,awards:(c.awards||[]).length+(c.certs||[]).length,publications:(c.publications||[]).length,skills:(c.skills||[]).length,education:(c.education||[]).length,gallery:(c.gallery||[]).length,profile:(c.links||[]).length,training:(c.training||[]).length,custom:(c.customSections||[]).length};
  return n[id]||null;
}
function go(id,add){
  cur=id;$('#side').classList.remove('open');render();window.scrollTo(0,0);
  if(add)setTimeout(function(){var b=document.querySelector('#view .addbtn');if(b){var d=b.closest('details.block');if(d)d.open=true;b.click()}},60);
}
function renderSide(){
  var s=$('#sidelist');s.innerHTML='';
  GROUPS.forEach(function(g){
    var grp=el('div',{class:'grp'},[el('div',{class:'sep',text:g[0]})]);
    g[1].forEach(function(id){
      var x=secById(id);if(!x)return;var n=countOf(id);
      var b=el('button',{type:'button',class:'nav'+(id===cur?' on':''),'data-t':x.title.toLowerCase(),onclick:function(){go(id)}},[el('span',{class:'ic',text:x.icon}),el('span',{class:'nm',text:x.title}),n?el('span',{class:'badge',text:String(n)}):null]);
      grp.appendChild(b);
    });
    s.appendChild(grp);
  });
  filterSide();
}
function filterSide(){
  var q=($('#sideq').value||'').trim().toLowerCase();
  Array.prototype.forEach.call($('#sidelist').querySelectorAll('.grp'),function(g){
    var any=false;Array.prototype.forEach.call(g.querySelectorAll('.nav'),function(b){var ok=!q||b.dataset.t.indexOf(q)>-1;b.style.display=ok?'':'none';if(ok)any=true});
    g.style.display=any?'':'none';
  });
}
function countUp(v){
  Array.prototype.forEach.call(v.querySelectorAll('.stat b'),function(b){
    var to=+b.textContent||0;if(!to||window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    var t0=performance.now();(function f(t){var p=Math.min((t-t0)/800,1);b.textContent=Math.round(to*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)})(t0);
  });
}
function head(title,icon,lead){
  return el('div',{class:'phead'},[el('div',{class:'pico',text:icon||''}),el('div',{class:'ptxt'},[el('h1',{text:title}),lead?el('p',{class:'lead',text:lead}):null])]);
}
function wrapHead(v,sec){
  var h=v.querySelector('h1'),l=v.querySelector('.lead');if(!h)return;
  var ph=head(h.textContent,sec.icon,l?l.textContent:'');h.remove();if(l)l.remove();v.insertBefore(ph,v.firstChild);
}
function pager(v){
  var flat=[];GROUPS.forEach(function(g){g[1].forEach(function(id){flat.push(id)})});
  var i=flat.indexOf(cur),p=i>0?secById(flat[i-1]):null,n=i<flat.length-1?secById(flat[i+1]):null;
  if(!p&&!n)return;
  v.appendChild(el('div',{class:'pager'},[
    p?el('button',{type:'button',class:'btn ghost',text:'← '+p.title,onclick:function(){go(p.id)}}):el('span'),
    n?el('button',{type:'button',class:'btn ghost',text:n.title+' →',onclick:function(){go(n.id)}}):el('span')]));
}
function render(){
  renderSide();
  var sec=secById(cur),v=$('#view');v.innerHTML='';
  var custom={dash:dash,backup:backup,gallery:galleryView,layout:layoutView,background:backgroundView}[sec.custom];
  if(custom){custom(v);if(sec.custom!=='dash')wrapHead(v,sec);else countUp(v);pager(v);return}
  v.appendChild(head(sec.title,sec.icon,sec.lead));
  var many=sec.blocks.length>3;
  if(sec.blocks.length>1){
    var chips=el('div',{class:'jump'},[el('span',{class:'jl',text:'Jump to:'})]);
    sec.blocks.forEach(function(b,i){chips.appendChild(el('button',{type:'button',class:'chip',text:b.title,onclick:function(){var d=v.querySelectorAll('details.block')[i];d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'})}}))});
    chips.appendChild(el('span',{class:'grow'}));
    chips.appendChild(el('button',{type:'button',class:'chip tog',text:'Collapse all',onclick:function(){v.querySelectorAll('details.block').forEach(function(d){d.open=false})}}));
    chips.appendChild(el('button',{type:'button',class:'chip tog',text:'Expand all',onclick:function(){v.querySelectorAll('details.block').forEach(function(d){d.open=true})}}));
    v.appendChild(chips);
  }
  sec.blocks.forEach(function(b,i){
    var bl=el('details',{class:'block'}),open=!many||i===0;if(open)bl.open=true;
    bl.appendChild(el('summary',null,[el('h2',{text:b.title}),b.hint?el('span',{class:'shint',text:b.hint}):null]));
    var body=el('div',{class:'bbody'});
    if(b.hint)body.appendChild(el('p',{class:'hint',text:b.hint}));
    b.fields.forEach(function(f){body.appendChild(field(f,C))});
    bl.appendChild(body);v.appendChild(bl);
  });
  v.appendChild(el('div',{class:'msg soft',text:'Everything you type is saved automatically as a draft on this device. Use “Preview” to see it on the website, then “Publish” to make it live.'}));
  pager(v);
}

/* ---------- photo gallery editor ---------- */
var GAL_VIEWS=[['masonry','Masonry – natural heights, like a magazine'],['grid','Grid – equal squares, neat and tidy'],['mosaic','Mosaic – some photos bigger, creative collage'],['slider','Slider – swipe sideways, one by one'],['polaroid','Polaroid – tilted instant-photo cards']];
var DEFAULT_CATS=[['lab','Lab & research','ল্যাব ও গবেষণা','المختبر والبحث'],['conf','Conferences & seminars','কনফারেন্স ও সেমিনার','المؤتمرات والندوات'],['awards','Awards & achievements','পুরস্কার ও অর্জন','الجوائز والإنجازات'],['results','Research results','গবেষণার ফলাফল','نتائج البحث'],['campus','University & team','বিশ্ববিদ্যালয় ও টিম','الجامعة والفريق'],['travel','Travel','ভ্রমণ','رحلات'],['life','Personal moments','ব্যক্তিগত মুহূর্ত','لحظات شخصية']];
var galFilter='all',galUpCat='';
function ensureGal(){
  if(!Array.isArray(C.gallery))C.gallery=[];
  if(!Array.isArray(C.galleryCats))C.galleryCats=DEFAULT_CATS.map(function(c){return {id:c[0],name:{en:c[1],bn:c[2],ar:c[3]}}});
  C.galleryCats.forEach(function(c){if(!c.id)c.id='c'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)});
}
function galleryView(v){
  ensureGal();
  v.appendChild(el('h1',{text:'Photo gallery'}));
  v.appendChild(el('p',{class:'lead',text:'Add photos into sections (categories), choose how the gallery looks, and change anything any time.'}));

  /* 1. titles + look */
  var tb=el('section',{class:'block'},[el('h2',{text:'Title & look'})]);
  tb.appendChild(field(T('gal_h','Section title'),C));
  tb.appendChild(field(T('gal_sub','Short description under the title','tria'),C));
  tb.appendChild(field({k:'galleryView',label:'Default view',type:'select',options:GAL_VIEWS.map(function(x){return [x[0],x[1]]}),help:'How the photos look when someone opens the gallery.'},C));
  tb.appendChild(field({k:'galleryPick',label:'Let visitors switch between views (shows small view buttons)',type:'bool'},C));
  v.appendChild(tb);

  /* 2. categories */
  var cb=el('section',{class:'block'},[el('h2',{text:'Gallery sections (categories)'}),el('p',{class:'hint',text:'Visitors get filter buttons like “Lab & research”, “Conferences”. Rename, reorder, add or remove sections freely. A section with no photos is not shown on the website.'})]);
  cb.appendChild(field({k:'galleryCats',label:'Sections',type:'list',add:'Add gallery section',blank:{name:{en:'',bn:'',ar:''}},sum:function(i){return asTri(i.name).en},fields:[{k:'name',label:'Section name',type:'tri'}]},C));
  v.appendChild(cb);

  /* 3. photos */
  var blk=el('section',{class:'block'},[el('h2',{text:'Photos'})]);
  blk.appendChild(el('p',{class:'hint',text:'Choose a section, then press “Add photos” (you can pick many at once). Each photo can be moved to another section later.'}));
  var tabs=el('div',{class:'galtabs'}),grid=el('div',{class:'galadm'}),status=el('div',{class:'help'});
  var upSel=el('select'),file=el('input',{type:'file',accept:'image/*',multiple:'multiple'});file.style.display='none';
  function catOpts(sel,withAll){
    sel.innerHTML='';
    if(withAll)sel.appendChild(el('option',{value:'',text:'No section'}));
    C.galleryCats.forEach(function(c){sel.appendChild(el('option',{value:c.id,text:asTri(c.name).en||'(unnamed)'}))});
  }
  function visible(){return C.gallery.filter(function(g){return galFilter==='all'||(galFilter==='none'?!g.cat||!C.galleryCats.some(function(c){return c.id===g.cat}):g.cat===galFilter)})}
  function buildTabs(){
    tabs.innerHTML='';
    function tab(id,label,n){tabs.appendChild(el('button',{type:'button',class:'gtab'+(galFilter===id?' on':''),text:label+' ('+n+')',onclick:function(){galFilter=id;if(id!=='all'&&id!=='none')galUpCat=id;buildAll()}}))}
    tab('all','All',C.gallery.length);
    C.galleryCats.forEach(function(c){tab(c.id,asTri(c.name).en||'(unnamed)',C.gallery.filter(function(g){return g.cat===c.id}).length)});
    var un=C.gallery.filter(function(g){return !g.cat||!C.galleryCats.some(function(c){return c.id===g.cat})}).length;
    if(un)tab('none','No section',un);
  }
  function buildGrid(){
    grid.innerHTML='';var a=C.gallery,fl=visible();
    fl.forEach(function(g,pos){
      function mv(dx){return function(){var t=fl[pos+dx];if(!t)return;var i=a.indexOf(g),j=a.indexOf(t);a[i]=t;a[j]=g;touch();buildAll()}}
      var im=el('img',{alt:'',loading:'lazy'});im.src=g.img||'';
      var acts=el('div',{class:'ga'},[
        el('button',{type:'button',title:'Move earlier',text:'←',onclick:mv(-1)}),
        el('button',{type:'button',title:'Move later',text:'→',onclick:mv(1)}),
        el('button',{type:'button',title:'Move to first',text:'⇤',onclick:function(){var i=a.indexOf(g);if(i>0){a.unshift(a.splice(i,1)[0]);touch();buildAll()}}}),
        el('button',{type:'button',class:'del',title:'Delete',text:'🗑',onclick:function(){if(confirm('Remove this photo from the gallery?')){a.splice(a.indexOf(g),1);touch();buildAll()}}})]);
      var cs=el('select');catOpts(cs,true);cs.value=g.cat||'';
      cs.addEventListener('change',function(){g.cat=cs.value;touch();buildAll()});
      var cap=ctlTri(function(){return g.caption},function(x){g.caption=x},false);
      grid.appendChild(el('div',{class:'gcard'},[el('div',{class:'gimg'},[im,el('span',{class:'gn',text:String(pos+1)})]),acts,el('div',{class:'lbl',text:'Section'}),cs,cap]));
    });
    if(!fl.length)grid.appendChild(el('div',{class:'help',text:C.gallery.length?'No photos in this section yet.':'No photos yet. Choose a section above and press “Add photos”.'}));
    status.textContent=C.gallery.length?C.gallery.length+' photo'+(C.gallery.length>1?'s':'')+' in total':'';
  }
  function buildAll(){ensureGal();catOpts(upSel,true);upSel.value=C.galleryCats.some(function(c){return c.id===galUpCat})?galUpCat:'';buildTabs();buildGrid()}
  upSel.addEventListener('change',function(){galUpCat=upSel.value});
  var add=el('button',{class:'btn primary',type:'button',text:'+ Add photos',onclick:function(){file.click()}});
  file.addEventListener('change',function(){
    var fl=Array.prototype.slice.call(file.files);file.value='';if(!fl.length)return;
    var cat=upSel.value;add.disabled=true;var n=0,fail=0;
    fl.reduce(function(p,f){return p.then(function(){
      add.textContent='Uploading '+(n+fail+1)+' of '+fl.length+'…';
      return uploadImage(f).then(function(url){C.gallery.push({img:url,cat:cat,caption:{en:'',bn:'',ar:''}});n++;touch();buildAll()}).catch(function(e){fail++;toast(f.name+': '+(e.message||e),'err')});
    })},Promise.resolve()).then(function(){add.disabled=false;add.textContent='+ Add photos';if(n)toast(n+' photo'+(n>1?'s':'')+' added. Press Publish to make them live.')});
  });
  blk.appendChild(el('div',{class:'upbar'},[el('label',{class:'lbl',text:'Add into section:'}),upSel,add,file]));
  blk.appendChild(tabs);blk.appendChild(status);blk.appendChild(grid);
  v.appendChild(blk);
  /* keep photo section lists in step when categories are edited above */
  cb.addEventListener('input',function(){buildAll()});cb.addEventListener('click',function(){setTimeout(buildAll,0)});
  buildAll();
  v.appendChild(el('div',{class:'msg',text:'The gallery is hidden on the website automatically while it has no photos.'}));
}

/* ---------- background theme switcher ---------- */
var BG_THEMES=[
 ['classic','Classic','Dark blue with soft glowing colours and drifting dots (the original look).','radial-gradient(circle at 20% 20%,#0ea5e9aa,transparent 50%),radial-gradient(circle at 80% 70%,#6366f1aa,transparent 50%),#050b18'],
 ['solar','Solar cells','A faint solar-panel grid with a light beam sweeping across and a warm sun glow. Fits your research.','radial-gradient(circle at 85% 0%,#fde04755,transparent 45%),linear-gradient(#8cc8ff30 1px,transparent 1px) 0 0/16px 16px,linear-gradient(90deg,#8cc8ff30 1px,transparent 1px) 0 0/16px 16px,#06132a'],
 ['sunrise','Sunrise','Warm golden sunrise at the top that slowly turns into bright daylight as you scroll down.','radial-gradient(circle at 85% 5%,#ffe58a,#fb923c88 25%,transparent 55%),linear-gradient(#2a1450,#0a2147)'],
 ['panel','Solar panel field ★ new','A creative scene: a sun travels across the sky as you scroll (dawn → noon → dusk) above a field of 3D solar panels. Light rays fall onto the panels and turn into flowing electricity.','radial-gradient(circle at 25% 38%,#fff6c0 0,#fbbf2488 10%,transparent 26%),linear-gradient(180deg,#0a3277 0%,#2a7fd0 50%,transparent 51%),repeating-linear-gradient(0deg,#1c4b95 0 6px,#d7e6ff 6px 7px) 0 52%/100% 48% no-repeat,#0b2a5e'],
 ['sections','Section-wise','Every section has its own mood and pattern. The background changes smoothly as you scroll.','linear-gradient(90deg,#0a1030,#04141f 25%,#1a1206 50%,#1a0b24 75%,#1d1040)']
];
function backgroundView(v){
  v.appendChild(el('h1',{text:'Background'}));
  v.appendChild(el('p',{class:'lead',text:'Choose the look of the website background. It works in both dark and light mode. Press “Preview draft” to see it, then Publish.'}));
  var blk=el('section',{class:'block'},[el('h2',{text:'Choose a style'})]),grid=el('div',{class:'bgpick'});
  function build(){
    grid.innerHTML='';var cur=C.background||'classic';
    BG_THEMES.forEach(function(t){
      var card=el('button',{type:'button',class:'bgcard'+(cur===t[0]?' on':''),onclick:function(){C.background=t[0];touch();build()}},[
        el('span',{class:'bgprev',style:'background:'+t[3]}),
        el('b',{text:t[1]+(cur===t[0]?'  ✓':'')}),
        el('small',{text:t[2]})]);
      grid.appendChild(card);
    });
  }
  build();blk.appendChild(grid);v.appendChild(blk);
  v.appendChild(el('div',{class:'msg',text:'You can switch back and forth any time. Nothing is lost.'}));
}

/* ---------- page sections: order + show/hide ---------- */
var LAYOUT_SECS={about:['🙋','About'],research:['🔬','Research'],experience:['💼','Experience'],achievements:['🏆','Awards & certifications'],training:['🛠️','Training'],gallery:['🖼️','Photo gallery'],publications:['📚','Publications'],skills:['🛠️','Skills'],education:['🎓','Education'],contact:['✉️','Contact']};
var LAYOUT_ORDER=['about','research','experience','achievements','training','gallery','publications','skills','education','contact'];
function layoutInfo(id){
  if(LAYOUT_SECS[id])return LAYOUT_SECS[id];
  var c=(C.customSections||[]).filter(function(x){return 'cs_'+x.id===id})[0];
  return c?['➕',(asTri(c.title).en||'New section')+' (extra)']:null;
}
function normLayout(){
  (C.customSections||[]).forEach(function(c){if(!c.id)c.id='s'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)});
  var ids=LAYOUT_ORDER.concat((C.customSections||[]).map(function(c){return 'cs_'+c.id})),known={};ids.forEach(function(i){known[i]=1});
  var seen={},l=(Array.isArray(C.layout)?C.layout:[]).filter(function(x){return x&&known[x.id]&&!seen[x.id]&&(seen[x.id]=1)});
  ids.forEach(function(id,k){
    if(seen[id])return;seen[id]=1;var at=-1,q,m;
    if(id.indexOf('cs_')===0){for(q=0;q<l.length;q++)if(l[q].id==='contact')at=q}
    else{for(m=k-1;m>=0&&at<0;m--)for(q=0;q<l.length;q++)if(l[q].id===LAYOUT_ORDER[m])at=q+1}
    if(at<0)l.push({id:id,show:true});else l.splice(at,0,{id:id,show:true});
  });
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
      var info=layoutInfo(x.id)||['•',x.id];
      box.appendChild(el('div',{class:'lrow'+(x.show===false?' off':'')},[
        el('span',{class:'lname',text:(i+1)+'. '+info[0]+' '+info[1]}),
        el('label',{class:'chk'},[chk,'Show']),
        el('span',{class:'acts'},[el('button',{type:'button',title:'Move up',text:'↑',onclick:mv(-1)}),el('button',{type:'button',title:'Move down',text:'↓',onclick:mv(1)})])]));
    });
  }
  build();blk.appendChild(box);v.appendChild(blk);
}

function dash(v){
  var dirty=isDirty();
  v.appendChild(head('Dashboard','🏠','Everything in one place. Choose what you want to do.'));
  v.appendChild(el('section',{class:'hero '+(dirty?'dirty':'ok')},[
    el('div',{class:'ht'},[el('b',{text:dirty?'You have changes that are not published yet':'Your website is up to date'}),
      el('span',{text:dirty?'Preview them first, then press Publish to make them live.':'What visitors see is exactly what you have here.'})]),
    el('div',{class:'hb'},[
      el('button',{type:'button',class:'btn',text:'Preview',onclick:previewDraft}),
      el('button',{type:'button',class:'btn primary pubbtn',text:'Publish now',onclick:function(){doPublish()}}),
      el('a',{class:'btn ghost',href:'../',target:'_blank',rel:'noopener',text:'View live site ↗'})])]));
  v.appendChild(el('h3',{class:'dh',text:'Quick actions'}));
  var qa=el('div',{class:'qa'});
  [['📷','Add photos','Upload to the gallery','gallery',false],['📚','Add a publication','New research paper','publications',true],['🏆','Add an award','Award or milestone','awards',true],['💼','Add a position','Work experience','experience',true],['➕','Add a new section','Projects, teaching, media…','custom',true],['🎨','Change background','Pick a theme','background',false],['🧩','Reorder sections','Move or hide parts of the page','layout',false]].forEach(function(a){
    qa.appendChild(el('button',{type:'button',class:'qcard',onclick:function(){go(a[3],a[4])}},[el('span',{class:'qi',text:a[0]}),el('b',{text:a[1]}),el('small',{text:a[2]})]));
  });
  v.appendChild(qa);
  v.appendChild(el('h3',{class:'dh',text:'Your content'}));
  var ov=el('div',{class:'ovg'});
  [['publications','Publications',(C.publications||[]).length],['experience','Positions',(C.experience||[]).length],['awards','Awards & certificates',(C.awards||[]).length+(C.certs||[]).length],['training','Trainings',(C.training||[]).length],['skills','Skill groups',(C.skills||[]).length],['education','Education',(C.education||[]).length],['gallery','Photos',(C.gallery||[]).length]].forEach(function(o){
    ov.appendChild(el('button',{type:'button',class:'stat',onclick:function(){go(o[0])}},[el('b',{text:String(o[2])}),el('span',{text:o[1]})]));
  });
  v.appendChild(ov);
  v.appendChild(el('h3',{class:'dh',text:'Draft & account'}));
  v.appendChild(el('div',{class:'tools'},[
    el('button',{type:'button',class:'btn danger',text:'Discard draft',onclick:discard}),
    el('button',{type:'button',class:'btn',text:'Backup & import',onclick:function(){go('backup')}}),
    el('button',{type:'button',class:'btn',text:'Sign out',onclick:function(){api('/api/logout',{}).then(function(){location.reload()})}})]));
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
  var btns=document.querySelectorAll('.pubbtn');btns.forEach(function(b){b.disabled=true;b.textContent='Publishing…'});
  api('/api/save',C).then(function(){
    published=clone(C);store.del(DRAFT);refreshState();
    toast('Published! The live site shows it within a minute.');
  }).catch(function(e){toast(e.message,'err');alert('Could not publish:\n\n'+e.message)}).then(function(){btns.forEach(function(b){b.disabled=false;b.textContent=b.dataset.l||'Publish'})});
}
function viaImg(file){
  return new Promise(function(res,rej){
    var u=URL.createObjectURL(file),i=new Image();
    i.onload=function(){URL.revokeObjectURL(u);res(i)};
    i.onerror=function(){URL.revokeObjectURL(u);rej(new Error('This photo could not be read. Please use a JPG or PNG photo (iPhone HEIC photos must be converted first).'))};
    i.src=u;
  });
}
function loadBitmap(file){
  if(!/^image\//.test(file.type||'image/')&&!/\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name||''))return Promise.reject(new Error('This file is not a photo.'));
  if(window.createImageBitmap)return createImageBitmap(file,{imageOrientation:'from-image'}).catch(function(){return viaImg(file)});
  return viaImg(file);
}
/* Resize + compress until the photo is small enough for the server (keeps every upload well under the 4.5 MB request limit). */
function shrink(bm){
  var W=bm.width||bm.naturalWidth,H=bm.height||bm.naturalHeight,steps=[[1600,.85],[1600,.72],[1400,.7],[1200,.65],[1000,.6]],i=0;
  function next(){
    var st=steps[i++],sc=Math.min(1,st[0]/Math.max(W,H)),cv=document.createElement('canvas');
    cv.width=Math.max(1,Math.round(W*sc));cv.height=Math.max(1,Math.round(H*sc));
    var cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);cx.drawImage(bm,0,0,cv.width,cv.height);
    return new Promise(function(res){cv.toBlob(res,'image/jpeg',st[1])}).then(function(b){
      if(!b)throw new Error('Could not process this photo.');
      if(b.size<=1500000||i>=steps.length)return b;
      return next();
    });
  }
  return next();
}
function sendUpload(file,b64,tries){
  return api('/api/upload',{name:file.name,data:b64}).catch(function(e){
    var m=e.message||'';
    if(tries>0&&(/Server error 5/.test(m)||/Failed to fetch|NetworkError|Load failed/i.test(m)))return new Promise(function(r){setTimeout(r,1200)}).then(function(){return sendUpload(file,b64,tries-1)});
    if(/Server error 413/.test(m))throw new Error('The photo is too large for the server.');
    if(/Failed to fetch|NetworkError|Load failed/i.test(m))throw new Error('No internet connection, or the connection dropped. Try again.');
    throw e;
  });
}
function uploadImage(file){
  return loadBitmap(file).then(shrink).then(function(blob){
    return new Promise(function(res,rej){var rd=new FileReader();rd.onload=function(){res(rd.result.split(',')[1])};rd.onerror=function(){rej(new Error('Could not read this photo.'))};rd.readAsDataURL(blob)});
  }).then(function(b){return sendUpload(file,b,2)}).then(function(j){return j.url});
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
  document.body.classList.add('authed');
  $('#themeBtn').addEventListener('click',function(){var n=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',n);store.set('admin_theme',n);var m=document.querySelector('meta[name=theme-color]');if(m)m.content=n==='dark'?'#0b1220':'#eef2fb'});
  function th(){document.documentElement.style.setProperty('--toph',document.querySelector('.top').offsetHeight+'px')}th();addEventListener('resize',th);
  $('#burger').addEventListener('click',function(){$('#side').classList.toggle('open')});
  $('#preview').addEventListener('click',previewDraft);
  $('#publish').addEventListener('click',function(){doPublish()});
  $('#mPreview').addEventListener('click',previewDraft);$('#mPublish').addEventListener('click',function(){doPublish()});
  $('#sideq').addEventListener('input',filterSide);
  var el0=store.get('portfolio_editlang')||'all';
  function setEL(l){el0=l;store.set('portfolio_editlang',l);$('#view').setAttribute('data-el',l);Array.prototype.forEach.call(document.querySelectorAll('#editlang button'),function(b){b.classList.toggle('on',b.dataset.l===l)})}
  $('#editlang').addEventListener('click',function(e){var b=e.target.closest('button');if(b)setEL(b.dataset.l)});
  setEL(el0);
  addEventListener('keydown',function(e){if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='s'){e.preventDefault();touch();toast('Saved as a draft. Press Publish to make it live.')}});
  store.del('portfolio_admin_token');store.del('portfolio_admin_cfg');
  fetch('/api/content?fresh=1',{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.json()}).catch(function(){return fetch('../content.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('Could not load the content ('+r.status+')');return r.json()})}).then(function(j){
    if(Array.isArray(j.training)&&j.layout&&j.galleryCats)return ensureAbout(j);
    return fetch('../content.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(b){return migrate(j,b)}).catch(function(){return j}).then(ensureAbout);
  }).then(function(j){
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
