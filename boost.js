/* ================================================================
   FLASH BRAIN - boost.js  (v4)
   Avatars SVG · Collection & Deck · Boutique · Competitions
   Notifications · Couche sociale Firebase REELLE (amis/DM/echanges)
   Charge APRES engine.js sur chaque page.
================================================================ */

/* ============================================================
   A) AVATAR  -  pieces + rendu SVG en couches
   cost=0 -> gratuit ; sinon prix + monnaie ('coin'|'gem')
   req    -> grade minimum requis (avantage de grade), optionnel
============================================================ */
const AV_SKINS=[
  {id:'sk1',c:'#ffdbb0',cost:0},{id:'sk2',c:'#f1c27d',cost:0},{id:'sk3',c:'#c68642',cost:0},
  {id:'sk4',c:'#8d5524',cost:0},{id:'sk5',c:'#6d4030',cost:0},
  {id:'sk6',c:'#a0e8ff',cost:40,cur:'coin'},{id:'sk7',c:'#caa6ff',cost:40,cur:'coin'},
  {id:'sk8',c:'#7CFC9B',cost:60,cur:'coin'},{id:'sk9',c:'#ff9bb0',cost:60,cur:'coin'},
  {id:'sk10',c:'#cfd8ff',cost:8,cur:'gem'},{id:'sk11',c:'#ffd166',cost:12,cur:'gem',req:'as'},
];
const AV_FACES=[{id:'fa1',cost:0},{id:'fa2',cost:0},{id:'fa3',cost:0}]; // round / square / oval
const AV_EYES=[
  {id:'ey1',cost:0},{id:'ey2',cost:0},{id:'ey3',cost:30,cur:'coin'}/*shades*/,
  {id:'ey4',cost:50,cur:'coin'}/*star*/,{id:'ey5',cost:30,cur:'coin'}/*wink*/,
  {id:'ey6',cost:10,cur:'gem'}/*glow*/,{id:'ey7',cost:18,cur:'gem',req:'champion'}/*laser*/,
];
const AV_HAIR=[
  {id:'ha0',cost:0},{id:'ha1',cost:0},{id:'ha2',cost:0},{id:'ha3',cost:40,cur:'coin'},
  {id:'ha4',cost:60,cur:'coin'},{id:'ha5',cost:60,cur:'coin'},{id:'ha6',cost:80,cur:'coin'},
  {id:'ha7',cost:14,cur:'gem'}/*flame*/,
];
const AV_HAIRCOLORS=['#3a2a20','#0d0d0d','#a8631f','#e0c068','#ff4b00','#00e5ff','#a855f7','#ff5fa2','#06d6a0','#ffffff'];
const AV_HATS=[
  {id:'no',cost:0},{id:'h1',cost:50,cur:'coin'}/*cap*/,{id:'h6',cost:50,cur:'coin'}/*beanie*/,
  {id:'h3',cost:90,cur:'coin'}/*headset*/,{id:'h8',cost:70,cur:'coin'}/*bandana*/,
  {id:'h2',cost:25,cur:'gem',req:'legende'}/*crown*/,{id:'h4',cost:16,cur:'gem'}/*halo*/,
  {id:'h5',cost:16,cur:'gem'}/*horns*/,{id:'h7',cost:20,cur:'gem',req:'maitre'}/*wizard*/,
];
const AV_AURAS=[
  {id:'au0',cost:0},{id:'au1',c:'#00e5ff',cost:0},{id:'au2',c:'#a855f7',cost:60,cur:'coin'},
  {id:'au3',c:'#ffd166',cost:90,cur:'coin',req:'elite'},{id:'au4',c:'#ff4b00',cost:15,cur:'gem'},
  {id:'au5',c:'rainbow',cost:30,cur:'gem',req:'champion'},{id:'au6',c:'#06d6a0',cost:12,cur:'gem'},
];
const AV_OUTFITS=['#00e5ff','#a855f7','#ff4b00','#06d6a0','#ffd166','#ef476f','#3b82f6','#94a3b8','#0d0d0d','#ffffff'];

const AVATAR_CATS={skin:AV_SKINS,face:AV_FACES,eyes:AV_EYES,hair:AV_HAIR,hat:AV_HATS,aura:AV_AURAS};
function avPart(cat,id){return (AVATAR_CATS[cat]||[]).find(x=>x.id===id);}
function skinColor(id){return (AV_SKINS.find(s=>s.id===id)||AV_SKINS[1]).c;}

/* item possede ? (gratuit = toujours possede) */
function ownsItem(p,cat,id){const it=avPart(cat,id);if(!it)return true;if(!it.cost)return true;return (p.ownedItems||[]).includes(cat+':'+id);}
function itemUnlockedByRank(p,it){if(!it||!it.req)return true;return getRankIndex(getRank(p.xp).id)>=getRankIndex(it.req);}

/* --- RENDU SVG --- */
function renderAvatar(av,size){
  av={...DEFAULT_AVATAR,...(av||{})};size=size||96;
  const sk=skinColor(av.skin), out=av.outfit||'#00e5ff', hc=av.hairColor||'#3a2a20';
  let bg='';
  const auraDef=AV_AURAS.find(a=>a.id===av.aura);
  if(auraDef&&auraDef.id!=='au0'){
    if(auraDef.c==='rainbow'){
      bg='<defs><radialGradient id="rb"><stop offset="55%" stop-color="transparent"/><stop offset="75%" stop-color="#ff4b00" stop-opacity=".5"/><stop offset="85%" stop-color="#ffd166" stop-opacity=".5"/><stop offset="92%" stop-color="#06d6a0" stop-opacity=".5"/><stop offset="100%" stop-color="#a855f7" stop-opacity=".5"/></radialGradient></defs><circle cx="50" cy="50" r="49" fill="url(#rb)"/>';
    } else if(auraDef.id==='au4'){
      bg='<circle cx="50" cy="50" r="47" fill="none" stroke="#ff4b00" stroke-width="3" opacity=".5"/><circle cx="50" cy="50" r="43" fill="none" stroke="#ffd166" stroke-width="2" opacity=".4"/>';
    } else { bg='<circle cx="50" cy="50" r="48" fill="'+auraDef.c+'" opacity=".18"/><circle cx="50" cy="50" r="48" fill="none" stroke="'+auraDef.c+'" stroke-width="2" opacity=".5"/>'; }
  }
  // buste / tenue
  let body='<path d="M22 100 Q22 74 50 74 Q78 74 78 100 Z" fill="'+out+'"/><path d="M40 76 h20 v8 a10 10 0 0 1 -20 0 Z" fill="'+sk+'"/>';
  // tete (face shape)
  let head;
  if(av.face==='fa2') head='<rect x="30" y="26" width="40" height="44" rx="12" fill="'+sk+'"/>';
  else if(av.face==='fa3') head='<ellipse cx="50" cy="48" rx="19" ry="24" fill="'+sk+'"/>';
  else head='<circle cx="50" cy="46" r="21" fill="'+sk+'"/>';
  // oreilles
  head+='<circle cx="29" cy="48" r="4" fill="'+sk+'"/><circle cx="71" cy="48" r="4" fill="'+sk+'"/>';
  // yeux
  let eyes;
  switch(av.eyes){
    case 'ey2': eyes='<path d="M40 47 q4 -5 8 0" stroke="#1a1a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M52 47 q4 -5 8 0" stroke="#1a1a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/>';break;
    case 'ey3': eyes='<rect x="36" y="42" width="28" height="9" rx="4" fill="#0d0d0d"/><rect x="38" y="44" width="9" height="5" rx="2" fill="#00e5ff" opacity=".7"/><rect x="53" y="44" width="9" height="5" rx="2" fill="#00e5ff" opacity=".7"/>';break;
    case 'ey4': eyes='<text x="40" y="50" font-size="9">⭐</text><text x="54" y="50" font-size="9">⭐</text>';break;
    case 'ey5': eyes='<circle cx="44" cy="46" r="2.6" fill="#1a1a2a"/><path d="M52 46 q4 -3 8 0" stroke="#1a1a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/>';break;
    case 'ey6': eyes='<circle cx="44" cy="46" r="3.4" fill="#00e5ff"/><circle cx="56" cy="46" r="3.4" fill="#00e5ff"/><circle cx="44" cy="46" r="6" fill="#00e5ff" opacity=".3"/><circle cx="56" cy="46" r="6" fill="#00e5ff" opacity=".3"/>';break;
    case 'ey7': eyes='<rect x="40" y="44" width="6" height="4" fill="#ff2d55"/><rect x="54" y="44" width="6" height="4" fill="#ff2d55"/><rect x="46" y="45.5" width="8" height="1.5" fill="#ff2d55" opacity=".6"/>';break;
    default: eyes='<circle cx="44" cy="46" r="2.8" fill="#1a1a2a"/><circle cx="56" cy="46" r="2.8" fill="#1a1a2a"/>';
  }
  eyes+='<path d="M44 56 q6 5 12 0" stroke="#1a1a2a" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>';
  // cheveux
  let hair='';
  switch(av.hair){
    case 'ha1': hair='<path d="M29 44 Q30 22 50 22 Q70 22 71 44 Q66 32 50 31 Q34 32 29 44 Z" fill="'+hc+'"/>';break;
    case 'ha2': hair='<path d="M30 42 L34 24 L40 36 L46 22 L52 36 L58 23 L64 37 L70 42 Q60 30 50 30 Q40 30 30 42 Z" fill="'+hc+'"/>';break;
    case 'ha3': hair='<path d="M28 60 Q24 26 50 24 Q76 26 72 60 L72 44 Q70 32 50 31 Q30 32 28 44 Z" fill="'+hc+'"/>';break;
    case 'ha4': hair='<path d="M44 20 h12 v24 h-12 Z" fill="'+hc+'"/><path d="M44 20 q6 -6 12 0 v6 h-12 Z" fill="'+hc+'"/>';break;
    case 'ha5': hair='<circle cx="50" cy="32" r="20" fill="'+hc+'"/><circle cx="34" cy="40" r="9" fill="'+hc+'"/><circle cx="66" cy="40" r="9" fill="'+hc+'"/>';break;
    case 'ha6': hair='<path d="M29 44 Q30 24 50 24 Q70 24 71 44 Q66 32 50 31 Q34 32 29 44 Z" fill="'+hc+'"/><path d="M70 34 q14 6 8 26 q-6 -4 -10 -18 Z" fill="'+hc+'"/>';break;
    case 'ha7': hair='<path d="M30 42 L34 24 L40 36 L46 22 L52 36 L58 23 L64 37 L70 42 Q60 30 50 30 Q40 30 30 42 Z" fill="#ff4b00"/><path d="M38 30 L44 18 L50 30 Z" fill="#ffd166" opacity=".9"/>';break;
    case 'ha0': default: hair='';
  }
  // chapeau / accessoire
  let hat='';
  switch(av.hat){
    case 'h1': hat='<path d="M28 38 Q30 22 50 22 Q70 22 72 38 Z" fill="#ef476f"/><path d="M50 38 h26 q2 0 2 4 h-28 Z" fill="#d23a5e"/>';break;
    case 'h6': hat='<path d="M28 40 Q30 24 50 24 Q70 24 72 40 Z" fill="#3b82f6"/><rect x="27" y="38" width="46" height="6" rx="3" fill="#2563eb"/>';break;
    case 'h3': hat='<path d="M27 46 a23 23 0 0 1 46 0" fill="none" stroke="#222" stroke-width="4"/><rect x="22" y="44" width="8" height="14" rx="4" fill="#00e5ff"/><rect x="70" y="44" width="8" height="14" rx="4" fill="#00e5ff"/>';break;
    case 'h8': hat='<path d="M28 36 Q50 28 72 36 L70 42 Q50 36 30 42 Z" fill="#ff4b00"/><path d="M70 38 l8 4 l-7 2 Z" fill="#ff4b00"/>';break;
    case 'h2': hat='<path d="M34 28 L40 16 L50 26 L60 16 L66 28 Z" fill="#ffd166" stroke="#e0a800" stroke-width="1"/><circle cx="40" cy="16" r="2.2" fill="#ef476f"/><circle cx="50" cy="24" r="2.2" fill="#06d6a0"/><circle cx="60" cy="16" r="2.2" fill="#3b82f6"/>';break;
    case 'h4': hat='<ellipse cx="50" cy="18" rx="16" ry="4" fill="none" stroke="#ffd166" stroke-width="3"/>';break;
    case 'h5': hat='<path d="M34 30 Q28 14 36 18 Q38 26 42 30 Z" fill="#ef476f"/><path d="M66 30 Q72 14 64 18 Q62 26 58 30 Z" fill="#ef476f"/>';break;
    case 'h7': hat='<path d="M30 36 Q50 -6 70 36 Z" fill="#a855f7"/><path d="M28 36 h44 q2 0 2 4 h-48 Z" fill="#7c3aed"/><text x="46" y="22" font-size="8">✦</text>';break;
  }
  return '<svg viewBox="0 0 100 100" width="'+size+'" height="'+size+'" xmlns="http://www.w3.org/2000/svg">'+bg+body+head+hair+eyes+hat+'</svg>';
}

/* ============================================================
   B) COLLECTION  -  cartes Flash Brain (rarete + pouvoir passif)
   bonus.type : coin | xp | joker | luck   (coin/xp = fraction)
============================================================ */
const RARITY={common:{c:'#94a3b8',w:62,lbl:'C'},rare:{c:'#3b82f6',w:26,lbl:'R'},epic:{c:'#a855f7',w:9,lbl:'E'},legendary:{c:'#ffd166',w:3,lbl:'L'}};
const CHARACTERS=[
  {id:'c01',name:'Synapse',emoji:'🧠',rarity:'common',bonus:{type:'xp',val:.02}},
  {id:'c02',name:'Bolt',emoji:'⚡',rarity:'common',bonus:{type:'coin',val:.02}},
  {id:'c03',name:'Echo',emoji:'🔊',rarity:'common',bonus:{type:'xp',val:.02}},
  {id:'c04',name:'Pixel',emoji:'👾',rarity:'common',bonus:{type:'coin',val:.02}},
  {id:'c05',name:'Glitch',emoji:'🌀',rarity:'common',bonus:{type:'luck',val:.03}},
  {id:'c06',name:'Nano',emoji:'🔬',rarity:'common',bonus:{type:'xp',val:.02}},
  {id:'c07',name:'Vega',emoji:'✴️',rarity:'common',bonus:{type:'coin',val:.02}},
  {id:'c08',name:'Quark',emoji:'⚛️',rarity:'common',bonus:{type:'luck',val:.03}},
  {id:'c09',name:'Cipher',emoji:'🔐',rarity:'rare',bonus:{type:'coin',val:.04}},
  {id:'c10',name:'Aurora',emoji:'🌌',rarity:'rare',bonus:{type:'xp',val:.05}},
  {id:'c11',name:'Tempo',emoji:'⏱️',rarity:'rare',bonus:{type:'joker',val:1}},
  {id:'c12',name:'Mirage',emoji:'🪞',rarity:'rare',bonus:{type:'luck',val:.06}},
  {id:'c13',name:'Volt',emoji:'🔋',rarity:'rare',bonus:{type:'coin',val:.04}},
  {id:'c14',name:'Seraph',emoji:'🕊️',rarity:'rare',bonus:{type:'xp',val:.05}},
  {id:'c15',name:'Onyx',emoji:'🖤',rarity:'epic',bonus:{type:'coin',val:.07}},
  {id:'c16',name:'Helix',emoji:'🧬',rarity:'epic',bonus:{type:'xp',val:.08}},
  {id:'c17',name:'Specter',emoji:'👻',rarity:'epic',bonus:{type:'luck',val:.10}},
  {id:'c18',name:'Titan',emoji:'🗿',rarity:'epic',bonus:{type:'joker',val:2}},
  {id:'c19',name:'Nova',emoji:'💫',rarity:'epic',bonus:{type:'coin',val:.07}},
  {id:'c20',name:'Oracle',emoji:'🔮',rarity:'legendary',bonus:{type:'xp',val:.12}},
  {id:'c21',name:'Phoenix',emoji:'🔥',rarity:'legendary',bonus:{type:'coin',val:.12}},
  {id:'c22',name:'Zenith',emoji:'👑',rarity:'legendary',bonus:{type:'xp',val:.12}},
  {id:'c23',name:'Eclipse',emoji:'🌑',rarity:'legendary',bonus:{type:'luck',val:.15}},
  {id:'c24',name:'Genesis',emoji:'🌟',rarity:'legendary',bonus:{type:'coin',val:.12}},
];
function cardById(id){return CHARACTERS.find(c=>c.id===id);}
function cardBonus(p,type){p=p||loadProfile();let s=0;(p.deck||[]).forEach(id=>{const c=cardById(id);if(c&&c.bonus.type===type&&(type==='coin'||type==='xp'))s+=c.bonus.val;});return s;}
function deckLuck(p){p=p||loadProfile();let s=0;(p.deck||[]).forEach(id=>{const c=cardById(id);if(c&&c.bonus.type==='luck')s+=c.bonus.val;});return s;}
function deckJokerStart(p){p=p||loadProfile();let s=0;(p.deck||[]).forEach(id=>{const c=cardById(id);if(c&&c.bonus.type==='joker')s+=c.bonus.val;});return s;}
function collectionCount(p){p=p||loadProfile();return Object.keys(p.collection||{}).filter(k=>p.collection[k]>0).length;}
function grantCard(id){const p=loadProfile();p.collection=p.collection||{};const isNew=!p.collection[id];p.collection[id]=(p.collection[id]||0)+1;saveProfile(p);return isNew;}
function rollRarity(luck){
  // luck augmente les chances de rare+
  const w={common:RARITY.common.w*(1-Math.min(.4,luck)),rare:RARITY.rare.w,epic:RARITY.epic.w*(1+luck*2),legendary:RARITY.legendary.w*(1+luck*3)};
  const tot=w.common+w.rare+w.epic+w.legendary;let r=Math.random()*tot;
  for(const k of ['legendary','epic','rare','common']){if(r<w[k])return k;r-=w[k];} return 'common';
}
function openPack(n,luck){
  n=n||3;luck=luck||deckLuck();
  const out=[];
  for(let i=0;i<n;i++){
    const rar=rollRarity(luck);
    const pool=CHARACTERS.filter(c=>c.rarity===rar);
    const card=pool[Math.floor(Math.random()*pool.length)];
    const isNew=grantCard(card.id);
    out.push({id:card.id,isNew});
  }
  const p=loadProfile();p.packsOpened=(p.packsOpened||0)+1;saveProfile(p);
  return out;
}

/* ============================================================
   C) BOUTIQUE
============================================================ */
const SHOP_ITEMS={
  packs:[
    {id:'pack1',n:'Pack Standard',d:'3 cartes',cards:3,cost:120,cur:'coin',emoji:'📦'},
    {id:'pack2',n:'Pack Premium',d:'5 cartes · meilleures chances',cards:5,cost:25,cur:'gem',emoji:'🎁',luck:.15},
    {id:'pack3',n:'Pack Legende',d:'5 cartes · chance epique++',cards:5,cost:60,cur:'gem',emoji:'💠',luck:.4},
  ],
  boosters:[
    {id:'jk_skip',n:'Joker Passer x3',cost:80,cur:'coin',emoji:'⏭️',give:{joker:'skip',n:3}},
    {id:'jk_time',n:'Joker +5s x3',cost:60,cur:'coin',emoji:'⏱️',give:{joker:'time',n:3}},
    {id:'jk_hint',n:'Joker Indice x3',cost:50,cur:'coin',emoji:'💡',give:{joker:'hint',n:3}},
    {id:'coins_s',n:'Sac de 200 pieces',cost:10,cur:'gem',emoji:'🪙',give:{coins:200}},
  ],
  gems:[
    {id:'g1',n:'10 gemmes',cost:300,cur:'coin',emoji:'💎',give:{gems:10}},
    {id:'g2',n:'25 gemmes',cost:650,cur:'coin',emoji:'💎',give:{gems:25}},
  ],
};

/* ============================================================
   D) COMPETITIONS MONDIALES (planifiees 2027 -> 2031)
============================================================ */
const COMPETITIONS=[
  {id:'cup2027a',name:'Open d\'Hiver',date:'2027-01-15',tier:'Bronze',reward:50,emoji:'❄️'},
  {id:'cup2027b',name:'Grand Prix de Printemps',date:'2027-04-12',tier:'Argent',reward:80,emoji:'🌸'},
  {id:'cup2027c',name:'Championnat d\'Ete',date:'2027-07-20',tier:'Or',reward:120,emoji:'☀️'},
  {id:'cup2027d',name:'Mondial d\'Automne',date:'2027-10-18',tier:'Or',reward:140,emoji:'🍂'},
  {id:'cup2028a',name:'Coupe des Nations',date:'2028-03-09',tier:'Platine',reward:200,emoji:'🌍'},
  {id:'cup2028b',name:'Tournoi des Maitres',date:'2028-09-14',tier:'Platine',reward:240,emoji:'🛡️'},
  {id:'cup2029a',name:'Ligue des Legendes Mentales',date:'2029-05-22',tier:'Diamant',reward:350,emoji:'💠'},
  {id:'cup2030a',name:'Mondial Anniversaire',date:'2030-06-18',tier:'Mythe',reward:500,emoji:'🎉'},
  {id:'cup2031a',name:'Grand Chelem Cerebral',date:'2031-08-08',tier:'Mythe',reward:600,emoji:'🏆'},
];
function compStatus(c){
  const now=Date.now(),d=new Date(c.date).getTime();
  if(now<d-86400000)return 'upcoming';
  if(now<=d+86400000)return 'live';
  return 'ended';
}

/* ============================================================
   E) NOTIFICATIONS (local + alimentees par la couche sociale)
============================================================ */
function _notifs(){try{return JSON.parse(localStorage.getItem('fb_notifs')||'[]');}catch{return[];}}
function _saveNotifs(a){try{localStorage.setItem('fb_notifs',JSON.stringify(a.slice(0,60)));}catch{}}
function addNotif(type,data){
  const a=_notifs();
  const key=type+'|'+JSON.stringify(data||{});
  if(a.find(n=>n.key===key&&Date.now()-n.ts<60000))return; // anti-doublon
  a.unshift({id:'n'+Date.now()+Math.random().toString(36).slice(2,5),key,type,data:data||{},ts:Date.now(),read:false});
  _saveNotifs(a);updateBells();
}
function getNotifs(){return _notifs();}
function unreadCount(){return _notifs().filter(n=>!n.read).length;}
function markAllRead(){const a=_notifs();a.forEach(n=>n.read=true);_saveNotifs(a);updateBells();}
function clearNotifs(){_saveNotifs([]);updateBells();}
function notifText(n){
  const d=n.data||{};
  switch(n.type){
    case 'friend_req':return '👤 '+(d.pseudo||'?')+' veut t\'ajouter en ami';
    case 'friend_acc':return '✅ '+(d.pseudo||'?')+' a accepte ta demande';
    case 'dm':return '💬 '+(d.pseudo||'?')+' : '+(d.msg||'').slice(0,40);
    case 'trade':return '🔄 Echange propose par '+(d.pseudo||'?');
    case 'trade_done':return '🔄 Echange avec '+(d.pseudo||'?')+' termine';
    case 'rankup':return '🎖️ Nouveau grade : '+t('rank_'+d.rank);
    case 'comp':return '🏆 Inscription : '+(d.name||'competition');
    default:return d.msg||'Notification';
  }
}
/* cloche : injecte un bouton avec pastille dans #bellSlot s'il existe */
function mountBell(){
  document.querySelectorAll('[data-bell]').forEach(slot=>{
    if(slot.dataset.mounted)return;slot.dataset.mounted='1';
    const b=document.createElement('button');b.className='bellbtn';b.innerHTML='🔔<span class="bdot" style="display:none"></span>';
    b.onclick=()=>{SFX&&SFX.navigate&&SFX.navigate();location.href='notifications.html';};
    slot.appendChild(b);
  });
  updateBells();
}
function updateBells(){
  const n=unreadCount();
  document.querySelectorAll('.bellbtn .bdot').forEach(d=>{
    if(n>0){d.style.display='flex';d.textContent=n>9?'9+':n;}else d.style.display='none';
  });
}

/* ============================================================
   F) COUCHE SOCIALE FIREBASE  (amis / demandes / DM / echanges)
   Tout est REEL via la Realtime Database. Sans config -> degrade
   proprement (ok=false, jamais de faux joueurs).
   Modele :
     users/{uid}     : {pseudo,pseudoLower,xp,rank,avatar,lastSeen}
     friends/{uid}/{fid} : {pseudo,since}
     requests/{uid}/{fromUid} : {pseudo,ts}
     dm/{thread}/{push} : {from,name,msg,ts}
     trades/{uid}/{push}: {fromUid,fromPseudo,give:[ids],status,ts}
============================================================ */
const Social={
  ok(){return typeof fbReady==='function'&&fbReady();},
  configured(){return typeof fbConfigured==='function'&&fbConfigured();},

  async publishMe(){
    if(!this.ok())return;
    const p=loadProfile();if(!p.pseudo)return;
    try{await _db.ref('users/'+myUid()).update({
      pseudo:p.pseudo,pseudoLower:p.pseudo.toLowerCase(),xp:p.xp,rank:getRank(p.xp).id,
      avatar:p.avatar||DEFAULT_AVATAR,lastSeen:Date.now()
    });}catch(e){}
  },

  async findUser(pseudo){
    if(!this.ok()||!pseudo)return null;
    try{
      const s=await _db.ref('users').orderByChild('pseudoLower').equalTo(pseudo.trim().toLowerCase()).limitToFirst(1).once('value');
      const d=s.val();if(!d)return null;
      const uid=Object.keys(d)[0];return {uid,...d[uid]};
    }catch(e){return null;}
  },

  async sendRequest(pseudo){
    if(!this.ok())return {ok:false,err:'nodb'};
    const u=await this.findUser(pseudo);
    if(!u)return {ok:false,err:'notfound'};
    if(u.uid===myUid())return {ok:false,err:'self'};
    const friends=await this.friendsOnce();
    if(friends[u.uid])return {ok:false,err:'already'};
    const me=loadProfile();
    try{await _db.ref('requests/'+u.uid+'/'+myUid()).set({pseudo:me.pseudo,ts:Date.now()});
      return {ok:true,pseudo:u.pseudo};}catch(e){return {ok:false,err:'exc'};}
  },

  listenRequests(cb){
    if(!this.ok())return;
    _db.ref('requests/'+myUid()).on('value',s=>{const d=s.val()||{};
      Object.entries(d).forEach(([uid,r])=>addNotif('friend_req',{uid,pseudo:r.pseudo}));
      cb&&cb(Object.entries(d).map(([uid,r])=>({uid,...r})));
    });
  },
  async requestsOnce(){if(!this.ok())return [];try{const d=(await _db.ref('requests/'+myUid()).once('value')).val()||{};return Object.entries(d).map(([uid,r])=>({uid,...r}));}catch{return[];}},

  async accept(fromUid,fromPseudo){
    if(!this.ok())return false;const me=loadProfile();
    try{
      await _db.ref('friends/'+myUid()+'/'+fromUid).set({pseudo:fromPseudo,since:Date.now()});
      await _db.ref('friends/'+fromUid+'/'+myUid()).set({pseudo:me.pseudo,since:Date.now()});
      await _db.ref('requests/'+myUid()+'/'+fromUid).remove();
      addNotif('friend_acc',{pseudo:fromPseudo});
      return true;
    }catch(e){return false;}
  },
  async decline(fromUid){if(!this.ok())return;try{await _db.ref('requests/'+myUid()+'/'+fromUid).remove();}catch{}},

  listenFriends(cb){if(!this.ok()){cb&&cb([]);return;}_db.ref('friends/'+myUid()).on('value',async s=>{
    const d=s.val()||{};const list=Object.entries(d).map(([uid,r])=>({uid,...r}));
    // enrichir avec presence/xp
    for(const f of list){try{const u=(await _db.ref('users/'+f.uid).once('value')).val();if(u){f.xp=u.xp;f.rank=u.rank;f.avatar=u.avatar;f.lastSeen=u.lastSeen;}}catch{}}
    cb&&cb(list);
  });},
  async friendsOnce(){if(!this.ok())return {};try{return (await _db.ref('friends/'+myUid()).once('value')).val()||{};}catch{return{};}},
  async removeFriend(uid){if(!this.ok())return;try{await _db.ref('friends/'+myUid()+'/'+uid).remove();await _db.ref('friends/'+uid+'/'+myUid()).remove();}catch{}},

  thread(a,b){return [a,b].sort().join('__');},
  async sendDM(toUid,msg){
    if(!this.ok())return;msg=(msg||'').trim().slice(0,300);if(!msg)return;
    const me=loadProfile();
    try{await _db.ref('dm/'+this.thread(myUid(),toUid)).push({from:myUid(),name:me.pseudo,msg,ts:Date.now()});}catch{}
  },
  listenDM(otherUid,cb){if(!this.ok()){cb&&cb([]);return ()=>{};}
    const ref=_db.ref('dm/'+this.thread(myUid(),otherUid)).limitToLast(80);
    const h=ref.on('value',s=>{const d=s.val()||{};cb&&cb(Object.values(d).sort((a,b)=>a.ts-b.ts));});
    return ()=>{try{ref.off('value',h);}catch{}};
  },
  /* notifie l'autre d'un nouveau DM (poll global) */
  listenInbox(){
    if(!this.ok())return;
    // demandes
    this.listenRequests();
    // echanges entrants
    _db.ref('trades/'+myUid()).on('child_added',s=>{const tr=s.val();if(tr&&tr.status==='pending')addNotif('trade',{pseudo:tr.fromPseudo,id:s.key});});
  },

  /* ECHANGE de cartes : reel via Firebase comme bus de messages.
     L'initiateur propose 'give' (cartes qu'il donne) contre 'want'.
     A l'acceptation, chaque cote applique l'echange a SA collection locale. */
  async proposeTrade(toUid,give,want){
    if(!this.ok())return {ok:false,err:'nodb'};
    const me=loadProfile();
    // verifier qu'on possede bien les cartes 'give'
    for(const id of give){if((me.collection[id]||0)<1)return {ok:false,err:'missing'};}
    try{await _db.ref('trades/'+toUid).push({fromUid:myUid(),fromPseudo:me.pseudo,give,want:want||[],status:'pending',ts:Date.now()});
      return {ok:true};}catch(e){return {ok:false,err:'exc'};}
  },
  async tradesOnce(){if(!this.ok())return [];try{const d=(await _db.ref('trades/'+myUid()).once('value')).val()||{};return Object.entries(d).map(([k,v])=>({key:k,...v}));}catch{return[];}},
  async acceptTrade(tr){
    if(!this.ok())return false;
    const me=loadProfile();
    // je dois posseder les 'want'
    for(const id of (tr.want||[])){if((me.collection[id]||0)<1)return false;}
    // j'applique : je perds 'want', je recois 'give'
    (tr.want||[]).forEach(id=>{me.collection[id]=Math.max(0,(me.collection[id]||0)-1);});
    (tr.give||[]).forEach(id=>{me.collection[id]=(me.collection[id]||0)+1;});
    me.tradesDone=(me.tradesDone||0)+1;saveProfile(me);
    try{
      // signaler a l'initiateur d'appliquer l'inverse
      await _db.ref('tradeResults/'+tr.fromUid).push({byPseudo:me.pseudo,give:tr.give,want:tr.want||[],ts:Date.now()});
      await _db.ref('trades/'+myUid()+'/'+tr.key).remove();
    }catch{}
    addNotif('trade_done',{pseudo:tr.fromPseudo});
    return true;
  },
  async declineTrade(tr){if(!this.ok())return;try{await _db.ref('trades/'+myUid()+'/'+tr.key).remove();}catch{}},
  /* l'initiateur applique l'inverse quand l'autre a accepte */
  listenTradeResults(){
    if(!this.ok())return;
    _db.ref('tradeResults/'+myUid()).on('child_added',async s=>{
      const r=s.val();if(!r)return;const me=loadProfile();
      (r.give||[]).forEach(id=>{me.collection[id]=Math.max(0,(me.collection[id]||0)-1);}); // j'avais donne
      (r.want||[]).forEach(id=>{me.collection[id]=(me.collection[id]||0)+1;});             // je recois
      me.tradesDone=(me.tradesDone||0)+1;saveProfile(me);
      addNotif('trade_done',{pseudo:r.byPseudo});
      try{await _db.ref('tradeResults/'+myUid()+'/'+s.key).remove();}catch{}
    });
  },
};

/* publie mon profil + ecoute la boite de reception sur chaque page */
document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{ try{ if(Social.ok()){Social.publishMe();Social.listenInbox();Social.listenTradeResults();} }catch(e){} },800);
  mountBell();
});
