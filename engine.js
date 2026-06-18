/* ================================================================
   FLASH BRAIN - engine.js  (v3)
   Firebase reel - Lobby - Partie synchronisee (hote-arbitre)
   Chat - Amis - Pieces - XP - Rangs - Profil - Narrateur - Succes
================================================================ */

/* ============================================================
   1) CONFIG FIREBASE
   ------------------------------------------------------------
   POUR JOUER EN LIGNE (entre vrais joueurs), tu DOIS coller ici
   la config de TON projet Firebase (gratuit). Voir LISEZMOI.txt.
   Tant que c'est "VOTRE_...", les modes Solo/Local/Defi marchent
   hors-ligne, mais l'Arene en ligne affichera "a configurer".
============================================================ */
const FB_CFG = {
  apiKey: "AIzaSyDDc-eOnEaF5U4pMqXJsXRSB17NyC9yNjw",
  authDomain: "flashbrain-b2ec2.firebaseapp.com",
  databaseURL: "https://flashbrain-b2ec2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "flashbrain-b2ec2",
  storageBucket: "flashbrain-b2ec2.firebasestorage.app",
  messagingSenderId: "1061042756502",
  appId: "1:1061042756502:web:39f87f9a1606fda21b9bb7",
};

let _db=null, _fbOk=false;
function fbReady(){ return _fbOk; }
function fbConfigured(){ return FB_CFG.apiKey && FB_CFG.apiKey.indexOf('VOTRE_')!==0; }

function _initFB(){
  if(_fbOk)return;
  if(!fbConfigured())return;            // pas configure -> on ne tente meme pas
  try{
    if(typeof firebase==='undefined')return;
    if(!firebase.apps.length)firebase.initializeApp(FB_CFG);
    _db=firebase.database();_fbOk=true;
  }catch(e){console.warn('[FB]',e.message);}
}

/* ============================================================
   2) IDENTITE STABLE (uid persistant par appareil)
============================================================ */
function myUid(){
  let u=localStorage.getItem('fb_uid');
  if(!u){u='u'+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);localStorage.setItem('fb_uid',u);}
  return u;
}

/* ============================================================
   3) LEADERBOARD GLOBAL
============================================================ */
async function fbSetScore(pseudo,xp,rankId){
  if(!_db||!pseudo)return;
  try{await _db.ref('lb/'+myUid()).set({pseudo,xp,rank:rankId,ts:Date.now()});}catch{}
}
async function fbGetLB(n=30){
  if(!_db)return null;
  try{
    const s=await _db.ref('lb').orderByChild('xp').limitToLast(n).once('value');
    const d=s.val();if(!d)return[];
    return Object.values(d).sort((a,b)=>b.xp-a.xp);
  }catch{return null;}
}

/* ============================================================
   4) AMIS (liste locale + presence via leaderboard)
============================================================ */
function loadFriends(){try{return JSON.parse(localStorage.getItem('fb_friends')||'[]');}catch{return[];}}
function saveFriends(a){try{localStorage.setItem('fb_friends',JSON.stringify(a));}catch{}}
function addFriend(pseudo){
  pseudo=(pseudo||'').trim(); if(!pseudo)return false;
  const f=loadFriends(); if(f.find(x=>x.toLowerCase()===pseudo.toLowerCase()))return false;
  f.push(pseudo); saveFriends(f); return true;
}
function removeFriend(pseudo){ saveFriends(loadFriends().filter(x=>x!==pseudo)); }

/* ============================================================
   4b) SALLES ACTIVES (pour le Monde : lobby + en jeu, non vides)
============================================================ */
async function fbGetActiveRooms(){
  if(!_db)return null;
  try{
    const s=await _db.ref('rooms').limitToLast(40).once('value');
    const d=s.val(); if(!d)return [];
    const out=[];
    Object.values(d).forEach(r=>{
      if(!r||!r.meta)return;
      const m=r.meta;
      if(m.status!=='lobby'&&m.status!=='playing')return;
      const players=r.players?Object.values(r.players).filter(p=>p&&p.online!==false):[];
      if(!players.length)return;                 // salle vide -> ignorer
      out.push({code:m.code,host:m.hostName,status:m.status,max:m.maxPlayers||4,count:players.length});
    });
    return out.sort((a,b)=>b.count-a.count);
  }catch{return null;}
}

/* ============================================================
   5) RANGS
============================================================ */
/* Grades plus durs a atteindre : 10 paliers, courbe exponentielle.
   Chaque grade donne des AVANTAGES (perks) cumulables :
     coinMult : multiplicateur de pieces gagnees
     gemReward: gemmes offertes en atteignant le grade
     freeJoker: jokers offerts a chaque montee
*/
const RANKS=[
  {id:'recrue',  icon:'🪖',minXP:0,    css:'rank-recrue', coinMult:1.00,gemReward:0, freeJoker:0},
  {id:'agent',   icon:'🔵',minXP:300,  css:'rank-agent',  coinMult:1.06,gemReward:5, freeJoker:1},
  {id:'expert',  icon:'💜',minXP:900,  css:'rank-expert', coinMult:1.12,gemReward:8, freeJoker:1},
  {id:'elite',   icon:'⭐',minXP:2200, css:'rank-elite',  coinMult:1.20,gemReward:12,freeJoker:2},
  {id:'maitre',  icon:'🛡️',minXP:4800, css:'rank-maitre', coinMult:1.30,gemReward:18,freeJoker:2},
  {id:'as',      icon:'♦️',minXP:9000, css:'rank-as',     coinMult:1.42,gemReward:25,freeJoker:3},
  {id:'veteran', icon:'🎖️',minXP:16000,css:'rank-veteran',coinMult:1.55,gemReward:35,freeJoker:3},
  {id:'champion',icon:'🏆',minXP:28000,css:'rank-champion',coinMult:1.70,gemReward:50,freeJoker:4},
  {id:'legende', icon:'🔥',minXP:48000,css:'rank-legende',coinMult:1.85,gemReward:75,freeJoker:5},
  {id:'mythe',   icon:'👑',minXP:80000,css:'rank-mythe',  coinMult:2.00,gemReward:120,freeJoker:6},
];
function getRank(xp){let r=RANKS[0];for(const k of RANKS){if(xp>=k.minXP)r=k;}return r;}
function getRankIndex(id){return RANKS.findIndex(r=>r.id===id);}
function getNextRank(xp){for(const k of RANKS){if(xp<k.minXP)return k;}return null;}
function getXPPct(xp){const r=getRank(xp),n=getNextRank(xp);if(!n)return 100;return Math.round(((xp-r.minXP)/(n.minXP-r.minXP))*100);}

/* ============================================================
   6) PROFIL + PIECES + JOKERS
============================================================ */
const DEFAULT_AVATAR={skin:'sk2',face:'fa1',eyes:'ey1',hair:'ha0',hairColor:'#3a2a20',hat:'no',outfit:'#00e5ff',aura:'au0'};
const DP={pseudo:'',xp:0,coins:0,gems:0,gamesPlayed:0,wins:0,bestStreak:0,totalCorrect:0,
  firstTime:true,achievements:[],createdAt:null,dailyCount:0,onlineWins:0,lastDaily:null,
  perfectGames:0,fastAnswers:0,jokers:{skip:1,time:1,hint:1},arcadeBest:{},
  avatar:{...DEFAULT_AVATAR},ownedItems:[],collection:{},deck:[],
  arcadeWins:0,tradesDone:0,packsOpened:0,competitionsJoined:[]};
function loadProfile(){try{const r=localStorage.getItem('fb_profile');const p=r?{...DP,...JSON.parse(r)}:{...DP};p.avatar={...DEFAULT_AVATAR,...(p.avatar||{})};p.jokers={skip:0,time:0,hint:0,...(p.jokers||{})};p.collection=p.collection||{};p.ownedItems=p.ownedItems||[];p.deck=p.deck||[];return p;}catch{return{...DP,avatar:{...DEFAULT_AVATAR}};}}
function saveProfile(p){try{localStorage.setItem('fb_profile',JSON.stringify(p));}catch{}}

/* multiplicateur total de pieces = grade x cartes equipees */
function coinMult(p){p=p||loadProfile();let m=getRank(p.xp).coinMult||1;m+=(typeof cardBonus==='function'?cardBonus(p,'coin'):0);return m;}
function xpBonus(p){p=p||loadProfile();return (typeof cardBonus==='function'?cardBonus(p,'xp'):0);} // bonus plat % via cartes

function addXP(n){
  const p=loadProfile(),old=getRank(p.xp);
  const mult=1+xpBonus(p);
  p.xp+=Math.round(n*mult);const nw=getRank(p.xp);
  if(old.id!==nw.id){
    // recompenses de montee de grade (peut sauter plusieurs paliers)
    let oi=getRankIndex(old.id),ni=getRankIndex(nw.id);
    for(let i=oi+1;i<=ni;i++){const rk=RANKS[i];p.gems=(p.gems||0)+(rk.gemReward||0);
      p.jokers=p.jokers||{};const jk=['skip','time','hint'][i%3];p.jokers[jk]=(p.jokers[jk]||0)+(rk.freeJoker||0);}
    saveProfile(p);
    showToast('🎉 '+t('rank_'+nw.id)+' ! +'+(nw.gemReward||0)+' 💎','flash',3800);Audio?.SFX?.levelup?.();vibrate([100,50,200,50,300]);
    if(typeof addNotif==='function')addNotif('rankup',{rank:nw.id});
    if(typeof Social!=='undefined')Social.publishMe&&Social.publishMe();
  } else { saveProfile(p); }
  fbSetScore(p.pseudo,p.xp,nw.id);
  return p;
}
function addCoins(n,raw){const p=loadProfile();const gain=raw?n:Math.round(n*coinMult(p));p.coins=Math.max(0,(p.coins||0)+gain);saveProfile(p);return p.coins;}
function spendCoins(n){const p=loadProfile();if((p.coins||0)<n)return false;p.coins-=n;saveProfile(p);return true;}
function addGems(n){const p=loadProfile();p.gems=Math.max(0,(p.gems||0)+n);saveProfile(p);return p.gems;}
function spendGems(n){const p=loadProfile();if((p.gems||0)<n)return false;p.gems-=n;saveProfile(p);return true;}

/* ============================================================
   7) PREFS
============================================================ */
const DP2={lang:'fr',sfxEnabled:true,musicEnabled:true,musicVol:0.32,sfxVol:0.72,
  narratorEnabled:true,vibrateEnabled:true,musicStyle:'auto'};
function loadPrefs(){try{const r=localStorage.getItem('fb_prefs');return r?{...DP2,...JSON.parse(r)}:{...DP2};}catch{return{...DP2};}}
function savePrefs(p){try{localStorage.setItem('fb_prefs',JSON.stringify(p));}catch{}}
function applyPrefs(){
  const p=loadPrefs();
  if(typeof Audio!=='undefined'){Audio.setSFX(p.sfxEnabled);Audio.setMusic(p.musicEnabled);Audio.setMVol(p.musicVol??0.32);Audio.setSVol(p.sfxVol??0.72);Audio.setStyle(p.musicStyle||'auto');}
  _nar=p.narratorEnabled!==false;_vib=p.vibrateEnabled!==false;
}

/* ============================================================
   8) ACHIEVEMENTS
============================================================ */
const ACHIEVEMENTS=[
  {id:'first_game',icon:'🎮',check:p=>p.gamesPlayed>=1},
  {id:'first_win', icon:'🏆',check:p=>p.wins>=1},
  {id:'streak_3',  icon:'🔥',check:p=>p.bestStreak>=3},
  {id:'streak_5',  icon:'💥',check:p=>p.bestStreak>=5},
  {id:'streak_10', icon:'⚡',check:p=>p.bestStreak>=10},
  {id:'games_10',  icon:'🎯',check:p=>p.gamesPlayed>=10},
  {id:'games_50',  icon:'🎖️',check:p=>p.gamesPlayed>=50},
  {id:'games_100', icon:'💎',check:p=>p.gamesPlayed>=100},
  {id:'correct_50',icon:'🧠',check:p=>p.totalCorrect>=50},
  {id:'correct_200',icon:'🔬',check:p=>p.totalCorrect>=200},
  {id:'correct_1000',icon:'🌟',check:p=>p.totalCorrect>=1000},
  {id:'rank_agent',icon:'🔵',check:p=>p.xp>=100},
  {id:'rank_expert',icon:'💜',check:p=>p.xp>=300},
  {id:'rank_elite',icon:'⭐',check:p=>p.xp>=700},
  {id:'rank_legende',icon:'👑',check:p=>p.xp>=1500},
  {id:'daily_3',   icon:'📅',check:p=>(p.dailyCount||0)>=3},
  {id:'daily_7',   icon:'📆',check:p=>(p.dailyCount||0)>=7},
  {id:'online_win',icon:'🌍',check:p=>(p.onlineWins||0)>=1},
  {id:'no_miss',   icon:'💯',check:p=>(p.perfectGames||0)>=1},
  {id:'speed_5',   icon:'⚡',check:p=>(p.fastAnswers||0)>=5},
  {id:'rich_100',  icon:'🪙',check:p=>(p.coins||0)>=100},
];
function checkAchievements(profile){
  const news=[];
  for(const a of ACHIEVEMENTS){if(!profile.achievements.includes(a.id)&&a.check(profile)){profile.achievements.push(a.id);news.push(a);}}
  if(news.length){saveProfile(profile);news.forEach((a,i)=>setTimeout(()=>{showToast(a.icon+' '+t('ach_'+a.id),'warn',3000);Audio?.SFX?.achieve?.();},i*1500));}
}

/* ============================================================
   9) TOAST / VIBRATION / NARRATEUR
============================================================ */
let _tt=null;
function showToast(msg,type='neutral',dur=1800){
  let el=document.getElementById('fb-toast');
  if(!el){el=document.createElement('div');el.id='fb-toast';el.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(20px);padding:12px 22px;border-radius:14px;font-weight:700;font-size:.92rem;pointer-events:none;opacity:0;transition:opacity .2s,transform .2s;z-index:9999;backdrop-filter:blur(12px);font-family:Inter,sans-serif;max-width:90vw;text-align:center;word-break:break-word;';document.body.appendChild(el);}
  clearTimeout(_tt);el.textContent=msg;
  const bg={success:'rgba(6,214,160,.2)',danger:'rgba(239,71,111,.2)',flash:'rgba(255,75,0,.2)',warn:'rgba(255,209,102,.2)',neutral:'rgba(255,255,255,.08)',info:'rgba(0,229,255,.12)'};
  const bc={success:'#06d6a0',danger:'#ef476f',flash:'#ff4b00',warn:'#ffd166',neutral:'rgba(0,229,255,.2)',info:'#00e5ff'};
  const co={success:'#06d6a0',danger:'#ef476f',flash:'#ff4b00',warn:'#ffd166',neutral:'#dde8ff',info:'#00e5ff'};
  el.style.background=bg[type]||bg.neutral;el.style.border='1px solid '+(bc[type]||bc.neutral);el.style.color=co[type]||co.neutral;
  el.style.opacity='1';el.style.transform='translateX(-50%) translateY(0)';
  _tt=setTimeout(()=>{el.style.opacity='0';el.style.transform='translateX(-50%) translateY(10px)';},dur);
}
let _vib=true;
function vibrate(p){if(_vib&&'vibrate' in navigator){try{navigator.vibrate(p);}catch{}}}
let _nar=true;
const NAR={
  fr:{welcome:["Bienvenue, Agent !","FLASH BRAIN en ligne."],go:["GO ! MAINTENANT !","C'est parti !","En route !"],
      correct:["Excellent !","Bien joue !","Parfait !","Neurones en feu !","Bravo !"],
      wrong:["Rate !","Trop lent !","Erreur critique !"],flash:["FLASH ! Vite !","FLASH ! Maintenant !"],
      streak3:["3 de suite !"],streak5:["5 consecutives ! Machine !"],streak10:["10 !! LEGENDAIRE !!"],
      levelup:["Rang superieur !"],win:["Mission accomplie !","Tu es le meilleur !"],
      lose:["Recommence.","Prochaine fois !"],countdown3:["3"],countdown2:["2"],countdown1:["1"],
      steal:["A toi de voler !","Vol possible !"]},
  en:{welcome:["Welcome, Agent!","FLASH BRAIN online."],go:["GO! NOW!","Let's go, Agent!"],
      correct:["Excellent!","Well played!","Perfect!","Neurons on fire!"],
      wrong:["Missed!","Too slow!","Critical error!"],flash:["FLASH! Answer fast!","FLASH! Now!"],
      streak3:["3 in a row!"],streak5:["5 consecutive! Machine!"],streak10:["10!! LEGENDARY!!"],
      levelup:["New rank!"],win:["Mission complete!","You're the best!"],
      lose:["Try again.","Next time!"],countdown3:["3"],countdown2:["2"],countdown1:["1"],
      steal:["Your turn to steal!","Steal chance!"]}
};
function narrate(key){
  if(!_nar||!('speechSynthesis' in window))return;
  const lang=getLang(),lines=(NAR[lang]||NAR.fr)[key];if(!lines?.length)return;
  const txt=lines[Math.floor(Math.random()*lines.length)];
  try{window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(txt);
  u.lang=lang==='en'?'en-US':'fr-FR';u.rate=1.1;u.pitch=1.1;u.volume=.85;
  window.speechSynthesis.speak(u);}catch{}
}

/* ============================================================
   10) ONLINE - moteur de salle hote-arbitre
   ------------------------------------------------------------
   Etat partage sous rooms/{code} :
     meta   : {code,hostUid,hostName,maxPlayers,status,lang,diff,createdAt,lastActive}
     players: {uid:{name,isHost,score,streak,online,joinedAt,lastSeen}}
     game   : {round,maxRounds,phase,word,ruleId,flasher,activeUid,
               order,reveal,deadline,seq}
     submit : {uid,answer,ts}      (intention -> traitee par l'hote)
     flash  : {uid,ts}             (claim du flash -> transaction)
     chat   : {pushId:{name,msg,ts}}
============================================================ */
const Online = {
  code:null, name:null, uid:null, isHost:false,
  meta:null, players:{}, game:null,
  _refs:[], _hb:null, _hostTimer:null,
  onMeta:null, onPlayers:null, onGame:null, onChat:null,

  ref(p){ return _db.ref('rooms/'+this.code+(p?'/'+p:'')); },

  genCode(){ return Math.floor(1000+Math.random()*9000).toString(); },

  /* --- creer une salle (je deviens hote) --- */
  async create(code, name, maxPlayers, lang, diff){
    if(!_db)return false;
    this.code=code; this.name=name; this.uid=myUid(); this.isHost=true;
    try{
      await this.ref().set({
        meta:{code,hostUid:this.uid,hostName:name,maxPlayers:maxPlayers||4,
              status:'lobby',lang:lang||'fr',diff:diff||'normal',
              createdAt:Date.now(),lastActive:Date.now()},
        players:{[this.uid]:{name,isHost:true,score:0,streak:0,online:true,joinedAt:Date.now(),lastSeen:Date.now()}}
      });
      this._attach();
      return true;
    }catch(e){console.warn('[create]',e.message);return false;}
  },

  /* --- ecrit seulement le doc salle (sans attacher) : utilise par setup --- */
  async createRoomDoc(code, name, maxPlayers, lang, diff){
    if(!_db)return false;
    const uid=myUid();
    try{
      await _db.ref('rooms/'+code).set({
        meta:{code,hostUid:uid,hostName:name,maxPlayers:maxPlayers||4,
              status:'lobby',lang:lang||'fr',diff:diff||'normal',
              createdAt:Date.now(),lastActive:Date.now()},
        players:{[uid]:{name,isHost:true,score:0,streak:0,online:true,joinedAt:Date.now(),lastSeen:Date.now()}}
      });
      return true;
    }catch(e){console.warn('[createRoomDoc]',e.message);return false;}
  },

  /* --- rejoindre une salle existante --- */
  async join(code, name){
    if(!_db)return {ok:false,err:'nodb'};
    this.code=code; this.name=name; this.uid=myUid();
    try{
      const snap=await this.ref('meta').once('value');
      const meta=snap.val();
      if(!meta)return {ok:false,err:'notfound'};
      const pl=(await this.ref('players').once('value')).val()||{};
      const count=Object.keys(pl).length;
      const already=!!pl[this.uid];
      if(!already && count>=(meta.maxPlayers||4))return {ok:false,err:'full'};
      this.isHost=(meta.hostUid===this.uid);
      await this.ref('players/'+this.uid).update({
        name,isHost:this.isHost,score:0,streak:0,online:true,
        joinedAt:already?(pl[this.uid].joinedAt||Date.now()):Date.now(),lastSeen:Date.now()
      });
      this._attach();
      return {ok:true,status:meta.status};
    }catch(e){console.warn('[join]',e.message);return {ok:false,err:'exc'};}
  },

  _attach(){
    this._detach();
    // presence : se retire proprement a la deconnexion
    try{ this.ref('players/'+this.uid).onDisconnect().remove(); }catch{}
    // heartbeat
    this._hb=setInterval(()=>{ if(_db&&this.code) this.ref('players/'+this.uid+'/lastSeen').set(Date.now()).catch(()=>{}); },4000);

    const mref=this.ref('meta');
    const mh=mref.on('value',s=>{ this.meta=s.val(); this.onMeta&&this.onMeta(this.meta); this._maybeBecomeHost(); });
    this._refs.push([mref,'value',mh]);

    const pref=this.ref('players');
    const ph=pref.on('value',s=>{ this.players=s.val()||{}; this.onPlayers&&this.onPlayers(this.players); });
    this._refs.push([pref,'value',ph]);

    const gref=this.ref('game');
    const gh=gref.on('value',s=>{ this.game=s.val(); this.onGame&&this.onGame(this.game); });
    this._refs.push([gref,'value',gh]);

    const cref=this.ref('chat').limitToLast(50);
    const ch=cref.on('value',s=>{ this.onChat&&this.onChat(s.val()||{}); });
    this._refs.push([cref,'value',ch]);

    // l'hote ecoute flash + submit pour arbitrer
    if(this.isHost) this._hostListeners();
  },

  _detach(){
    this._refs.forEach(([r,ev,h])=>{try{r.off(ev,h);}catch{}});
    this._refs=[];
    if(this._hb){clearInterval(this._hb);this._hb=null;}
    if(this._hostTimer){clearTimeout(this._hostTimer);this._hostTimer=null;}
  },

  /* l'hote a quitte -> le plus ancien present devient hote */
  _maybeBecomeHost(){
    if(!this.meta||this.isHost)return;
    const hostUid=this.meta.hostUid;
    if(this.players[hostUid]&&this.players[hostUid].online!==false)return; // hote encore la
    const present=Object.entries(this.players).filter(([u,p])=>p&&p.online!==false)
      .sort((a,b)=>(a[1].joinedAt||0)-(b[1].joinedAt||0));
    if(present.length && present[0][0]===this.uid){
      this.isHost=true;
      this.ref('meta').update({hostUid:this.uid,hostName:this.name});
      this.ref('players/'+this.uid+'/isHost').set(true);
      this._hostListeners();
    }
  },

  /* --- ACTIONS JOUEUR --- */
  setReadyName(name){ this.ref('players/'+this.uid+'/name').set(name); this.name=name; },

  async claimFlash(){
    if(!_db||!this.game||this.game.phase!=='flash')return false;
    const me=this.uid;
    const res=await this.ref('game/flasher').transaction(cur=> cur==null?me:cur);
    return res.committed && res.snapshot.val()===me;
  },

  submitAnswer(answer){
    if(!_db)return;
    this.ref('submit').set({uid:this.uid,answer,ts:Date.now()});
  },

  sendChat(msg){
    msg=(msg||'').trim().slice(0,160); if(!msg||!_db)return;
    this.ref('chat').push({name:this.name,msg,ts:Date.now()});
  },

  async leave(){
    if(!_db||!this.code)return;
    try{ await this.ref('players/'+this.uid).remove(); }catch{}
    // si plus personne -> on nettoie la salle
    try{
      const pl=(await this.ref('players').once('value')).val();
      if(!pl) await this.ref().remove();
    }catch{}
    this._detach(); this.code=null;
  },

  /* l'hote demarre la partie depuis le lobby */
  startGame(maxRounds){
    if(!this.isHost||!_db)return;
    const order=this._connectedUids();
    if(!order.length)return;
    // reset scores
    const upd={};
    order.forEach(u=>{upd['players/'+u+'/score']=0;upd['players/'+u+'/streak']=0;});
    upd['meta/status']='playing';
    this.ref().update(upd);
    this._newRound(1, maxRounds||5);
  },

  _connectedUids(){
    return Object.entries(this.players)
      .filter(([u,p])=>p&&p.online!==false)
      .sort((a,b)=>(a[1].joinedAt||0)-(b[1].joinedAt||0))
      .map(([u])=>u);
  },

  /* ---------- BOUCLE ARBITRE (hote uniquement) ---------- */
  _hostListeners(){
    if(this._hostBound)return; this._hostBound=true;
    // flash claim -> passer en phase answer
    this.ref('game/flasher').on('value',s=>{
      const f=s.val();
      if(f && this.game && this.game.phase==='flash'){
        this._setAnswerer(f, true);
      }
    });
    // submit -> valider
    this.ref('submit').on('value',async s=>{
      const sub=s.val(); if(!sub)return;
      await this.ref('submit').remove();
      this._judge(sub.uid, sub.answer);
    });
  },

  _hostSet(g){ this.ref('game').set(g); this.game=g; },

  _newRound(round, maxRounds){
    const lang=this.meta?.lang||'fr';
    const order=this._connectedUids();
    let pool=getGameWords(lang).filter(w=>!(this._used||new Set()).has(w));
    if(!pool.length){this._used=new Set();pool=getGameWords(lang);}
    const word=pool[Math.floor(Math.random()*pool.length)];
    (this._used=this._used||new Set()).add(word);
    const rule=ONLINE_RULE_POOL[Math.floor(Math.random()*ONLINE_RULE_POOL.length)];
    const diff=this.meta?.diff||'normal';
    const flashWindow=({easy:9,normal:7,hard:5}[diff]||7);
    const g={round,maxRounds:maxRounds||(this.game?.maxRounds||5),phase:'countdown',
      word,ruleId:rule,flasher:null,activeUid:null,order,answered:[],
      reveal:null,deadline:Date.now()+3200,seq:(this.game?.seq||0)+1,flashWindow};
    this._hostSet(g);
    // apres le decompte -> phase flash
    this._hostAfter(3200,()=>{
      const gg={...g,phase:'flash',deadline:Date.now()+flashWindow*1000};
      this._hostSet(gg);
      this._hostAfter(flashWindow*1000,()=>{
        // personne n'a flashe
        if(this.game&&this.game.phase==='flash'&&!this.game.flasher) this._reveal(null,null,'noflash');
      });
    });
  },

  _setAnswerer(uid, fromFlash){
    const diff=this.meta?.diff||'normal';
    const ansWindow=({easy:12,normal:9,hard:6}[diff]||9);
    const g={...this.game,phase:'answer',activeUid:uid,
      flasher:fromFlash?uid:(this.game.flasher),deadline:Date.now()+ansWindow*1000};
    this._hostSet(g);
    this._hostAfter(ansWindow*1000,()=>{
      if(this.game&&this.game.phase==='answer'&&this.game.activeUid===uid){
        this._afterAttempt(uid,false,'timeout','');  // delai depasse
      }
    });
  },

  async _judge(uid, answer){
    if(!this.game||this.game.phase!=='answer'||this.game.activeUid!==uid)return;
    const lang=this.meta?.lang||'fr';
    const word=this.game.word, rule=ONLINE_RULES[this.game.ruleId];
    const a=foldAccents((answer||'').toLowerCase().normalize('NFC'));
    const m=foldAccents(word.toLowerCase());
    let ok=true, reason='';
    if(!a){ok=false;reason='empty';}
    else if(!(await isValidWord(answer,lang))){ok=false;reason='notword';}
    else if(a===m){ok=false;reason='same';}
    else if(a[0]!==m[0]){ok=false;reason='letter';}
    else if(rule&&!rule.check(a)){ok=false;reason='rule';}
    this._afterAttempt(uid, ok, reason, answer);
  },

  _afterAttempt(uid, ok, reason, answer){
    const isFlasher=(uid===this.game.flasher);
    if(ok){
      const pts=isFlasher?2:1;
      const cur=this.players[uid]?.score||0;
      const st=(this.players[uid]?.streak||0)+1;
      this.ref('players/'+uid).update({score:cur+pts,streak:st});
      this._reveal(uid,answer,'win',pts);
    } else {
      if(isFlasher||this.game.activeUid===this.game.flasher){
        // le flasher rate -> reset son streak
        this.ref('players/'+uid+'/streak').set(0);
      } else {
        this.ref('players/'+uid+'/streak').set(0);
      }
      // chercher le prochain voleur parmi les joueurs connectes (temps reel)
      const answered=[...(this.game.answered||[]),uid];
      const pool=this._connectedUids();
      const next=pool.find(u=>u!==this.game.flasher && !answered.includes(u));
      if(next){
        const g={...this.game,answered,reveal:{uid,ok:false,reason,answer,steal:true}};
        this._hostSet(g);
        this._hostAfter(1400,()=>{ this._setAnswerer(next,false); });
      } else {
        this._reveal(null,null,'fail');
      }
    }
  },

  _reveal(winnerUid, answer, kind, pts){
    const g={...this.game,phase:'reveal',
      reveal:{uid:winnerUid,answer,kind,pts:pts||0,word:this.game.word}};
    this._hostSet(g);
    this._hostAfter(2400,()=>{
      const next=this.game.round+1;
      if(next>this.game.maxRounds){ this._finish(); }
      else { this._newRound(next, this.game.maxRounds); }
    });
  },

  _finish(){
    const standings=this._connectedUids().map(u=>({uid:u,name:this.players[u]?.name||'?',score:this.players[u]?.score||0}))
      .sort((a,b)=>b.score-a.score);
    const g={...this.game,phase:'over',standings};
    this._hostSet(g);
    this.ref('meta/status').set('finished');
  },

  /* retour au lobby pour rejouer (hote) */
  backToLobby(){
    if(!this.isHost)return;
    this.ref('game').remove();
    this.ref('meta/status').set('lobby');
    this._used=new Set();
  },

  _hostAfter(ms, fn){
    if(this._hostTimer)clearTimeout(this._hostTimer);
    this._hostTimer=setTimeout(()=>{ try{fn();}catch(e){console.warn(e);} }, ms);
  },
};

/* --- regles utilisees en ligne (sous-ensemble lisible) --- */
const ONLINE_RULES={
  vowel:{check:w=>'aeiouy'.includes(foldAccents(w)[0])},
  cons:{check:w=>'bcdfghjklmnpqrstvwxz'.includes(foldAccents(w)[0])},
  long:{check:w=>w.length>=6},
  short:{check:w=>w.length<=4},
  five:{check:w=>w.length===5},
  end_e:{check:w=>w.endsWith('e')},
  no_a:{check:w=>!foldAccents(w).includes('a')},
  no_e:{check:w=>!foldAccents(w).includes('e')},
  no_s:{check:w=>!w.includes('s')},
  two_vowels:{check:w=>(foldAccents(w).match(/[aeiouy]/g)||[]).length>=2},
};
const ONLINE_RULE_POOL=Object.keys(ONLINE_RULES);

/* ============================================================
   11) UTILS + INIT
============================================================ */
function pickRandom(arr){return arr[Math.floor(Math.random()*arr.length)];}
function setActiveNav(id){document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.nav===id));}
function goTo(page){Audio?.SFX?.navigate?.();window.location.href=page;}

document.addEventListener('DOMContentLoaded',()=>{_initFB();applyPrefs();});
window.addEventListener('beforeunload',()=>{ if(Online.code) try{Online.ref('players/'+Online.uid).remove();}catch{} });
