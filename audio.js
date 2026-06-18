/* ================================================================
   FLASH BRAIN - audio.js  (v3)  Moteur audio generatif multi-styles
   NB: musiques 100% originales generees a la volee (Web Audio).
   Les vraies chansons TikTok/artistes ne peuvent pas etre integrees
   (droits d'auteur) -> on offre plusieurs styles maison varies.
================================================================ */
const Audio=(()=>{
  let ctx=null,mG=null,sG=null,_sf=true,_mu=true,_mv=0.32,_sv=0.72,_stop=null,_style='auto';
  const STYLES=['synthwave','lofi','arcade','epic','trap'];

  function _i(){if(ctx)return;try{ctx=new(window.AudioContext||window.webkitAudioContext)();mG=ctx.createGain();sG=ctx.createGain();const comp=ctx.createDynamicsCompressor();comp.threshold.value=-12;mG.connect(comp);sG.connect(comp);comp.connect(ctx.destination);mG.gain.value=_mv;sG.gain.value=_sv;}catch{}_ap();}
  function _ap(){try{const p=JSON.parse(localStorage.getItem('fb_prefs')||'{}');_sf=p.sfxEnabled!==false;_mu=p.musicEnabled!==false;_mv=p.musicVol??0.32;_sv=p.sfxVol??0.72;_style=p.musicStyle||'auto';if(mG)mG.gain.value=_mu?_mv:0;if(sG)sG.gain.value=_sf?_sv:0;}catch{}}
  function _res(){if(ctx&&ctx.state==='suspended')ctx.resume();}

  function osc(f,t,dur,v,dl=0,a=0.01,dest=null,detune=0){
    if(!ctx)return;const tm=ctx.currentTime+dl,o=ctx.createOscillator(),g=ctx.createGain();
    o.type=t;o.frequency.value=f;o.detune.value=detune;o.connect(g);g.connect(dest||mG);
    g.gain.setValueAtTime(0,tm);g.gain.linearRampToValueAtTime(v,tm+a);
    g.gain.exponentialRampToValueAtTime(0.0001,tm+dur);o.start(tm);o.stop(tm+dur+0.05);return o;
  }
  function beep({f=440,t='sine',d=0.14,v=0.26,dl=0,a=0.01}){if(!ctx||!_sf)return;_res();osc(f,t,d,v,dl,a,sG);}
  function noise(d=0.1,v=0.14,dl=0,lo=400,hi=1800,dest=null){
    if(!ctx)return;_res();const buf=ctx.createBuffer(1,Math.max(1,ctx.sampleRate*d),ctx.sampleRate),dat=buf.getChannelData(0);
    for(let i=0;i<dat.length;i++)dat[i]=Math.random()*2-1;
    const src=ctx.createBufferSource(),g=ctx.createGain(),fl=ctx.createBiquadFilter();
    fl.type='bandpass';fl.frequency.value=(lo+hi)/2;fl.Q.value=0.8;
    src.buffer=buf;src.connect(fl);fl.connect(g);g.connect(dest||sG);
    const tm=ctx.currentTime+dl;g.gain.setValueAtTime(v,tm);g.gain.exponentialRampToValueAtTime(0.0001,tm+d);
    src.start(tm);src.stop(tm+d+0.05);
  }
  function kick(tm,v=0.5){if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(mG);o.frequency.setValueAtTime(150,tm);o.frequency.exponentialRampToValueAtTime(45,tm+0.13);g.gain.setValueAtTime(v,tm);g.gain.exponentialRampToValueAtTime(0.0001,tm+0.18);o.start(tm);o.stop(tm+0.2);}
  function snare(tm,v=0.3){noise(0.13,v,tm-ctx.currentTime,900,5000,mG);}
  function hat(tm,v=0.08){noise(0.03,v,tm-ctx.currentTime,7000,16000,mG);}

  const SFX={
    tick(){beep({f:1100,t:'square',d:.06,v:.14});},
    tickWarn(){beep({f:1400,t:'square',d:.05,v:.2});beep({f:700,t:'square',d:.05,v:.12,dl:.06});},
    correct(){beep({f:523,d:.09,v:.25,a:.005});beep({f:659,d:.09,v:.25,a:.005,dl:.08});beep({f:784,d:.18,v:.3,a:.005,dl:.16});},
    wrong(){beep({f:280,t:'sawtooth',d:.12,v:.28});beep({f:200,t:'sawtooth',d:.2,v:.2,dl:.1});noise(.12,.1,.05);},
    flash(){noise(.04,.22);beep({f:1800,t:'square',d:.04,v:.18,dl:.02});beep({f:2200,t:'square',d:.08,v:.22,dl:.06});},
    go(){[0,.07,.14,.22].forEach((d,i)=>beep({f:523+i*130,t:'square',d:.06,v:.28,dl:d}));noise(.06,.1,.22);},
    countdown(){beep({f:440,t:'square',d:.1,v:.22,a:.004});},
    levelup(){[0,.11,.23,.37,.53].forEach((d,i)=>beep({f:440+i*120,d:.2,v:.26,dl:d}));},
    win(){[0,.13,.27,.43,.61,.81].forEach((d,i)=>beep({f:392+i*130,d:.22,v:.28,dl:d}));noise(.06,.08,.55);},
    lose(){beep({f:350,t:'sawtooth',d:.14,v:.24});beep({f:220,t:'sawtooth',d:.28,v:.2,dl:.12});},
    navigate(){beep({f:700,d:.07,v:.11,a:.003});},
    select(){beep({f:880,d:.06,v:.13,a:.003});},
    achieve(){[0,.08,.17,.28,.41].forEach((d,i)=>beep({f:500+i*120,d:.2,v:.24,dl:d}));noise(.05,.08,.45);},
    streak(){noise(.04,.12);beep({f:1046,d:.12,v:.26,dl:.03});beep({f:1318,d:.15,v:.28,dl:.12});},
    copy(){beep({f:800,d:.06,v:.14});beep({f:1000,d:.06,v:.14,dl:.07});},
    coin(){beep({f:988,t:'square',d:.07,v:.2});beep({f:1318,t:'square',d:.12,v:.22,dl:.07});},
    join(){beep({f:660,d:.1,v:.18});beep({f:880,d:.12,v:.2,dl:.09});},
    chat(){beep({f:920,t:'sine',d:.05,v:.12});},
    openModal(){beep({f:660,d:.09,v:.13});beep({f:440,d:.09,v:.11,dl:.07});},
    steal(){beep({f:740,t:'sawtooth',d:.08,v:.18});beep({f:980,t:'square',d:.12,v:.2,dl:.07});},
  };

  function _stopM(){if(_stop){try{_stop();}catch{}_stop=null;}}

  /* ---- MENU : nappe douce + arpege ---- */
  function _menuLoop(){
    let run=true;const N=[130.81,146.83,164.81,174.61,195.99,220,246.94,261.63];let s=0;
    function note(){if(!run||!ctx)return;const f=N[s%N.length],tm=ctx.currentTime;
      osc(f,s%3===0?'sine':'triangle',2.8,.13,0,.4,mG);osc(f*2.01,'sine',2.4,.04,0,.5,mG);s++;if(run)setTimeout(note,1500+Math.random()*700);}
    function pad(){if(!run||!ctx)return;[65.4,98,130.81].forEach(f=>osc(f,'sine',8,.03,0,1.5,mG,Math.random()*4-2));if(run)setTimeout(pad,7000);}
    note();pad();return()=>{run=false;};
  }

  /* ---- styles de jeu ---- */
  function _synthwave(){
    let run=true,beat=0;const bpm=118,ivl=60000/bpm/2;
    const BASS=[55,55,82.4,82.4,73.4,73.4,98,98],ARP=[261.6,329.6,392,523.2,392,329.6];let a=0;
    function tick(){if(!run||!ctx)return;const tm=ctx.currentTime+.02,b=beat%8;
      if(b%2===0)kick(tm,.45);hat(tm,b%2?.05:.09);if(b===4)snare(tm,.22);
      const bf=BASS[b];const o=ctx.createOscillator(),g=ctx.createGain();o.type='sawtooth';o.frequency.value=bf;o.connect(g);g.connect(mG);g.gain.setValueAtTime(.16,tm);g.gain.exponentialRampToValueAtTime(.0001,tm+.24);o.start(tm);o.stop(tm+.3);
      if(b%2===0){osc(ARP[a%ARP.length],'square',.13,.05,.01,.005,mG);a++;}
      beat++;if(run)setTimeout(tick,ivl);}
    tick();return()=>{run=false;};
  }
  function _arcade(){
    let run=true,beat=0;const ivl=60000/140/2;const LEAD=[523,659,784,659,587,494,587,784];let l=0;
    function tick(){if(!run||!ctx)return;const tm=ctx.currentTime+.02,b=beat%8;
      if(b%2===0)kick(tm,.4);hat(tm,.05);osc(LEAD[l%LEAD.length],'square',.1,.06,0,.004,mG);l++;
      if(b%4===0)osc(LEAD[l%LEAD.length]/2,'triangle',.18,.07,0,.004,mG);
      beat++;if(run)setTimeout(tick,ivl);}
    tick();return()=>{run=false;};
  }
  function _lofi(){
    let run=true,beat=0;const ivl=60000/82/2;
    const CH=[[261.6,311.1,392],[233.1,293.7,349.2],[207.7,261.6,329.6],[196,246.9,311.1]];let c=0;
    function tick(){if(!run||!ctx)return;const tm=ctx.currentTime+.02,b=beat%8;
      if(b===0||b===6)kick(tm,.3);if(b===4)snare(tm,.14);hat(tm,.03);
      if(b===0){CH[c%CH.length].forEach((f,i)=>osc(f,'sine',1.8,.06,i*.02,.2,mG,Math.random()*6-3));c++;}
      beat++;if(run)setTimeout(tick,ivl);}
    tick();return()=>{run=false;};
  }
  function _epic(){
    let run=true,beat=0;const ivl=60000/100/2;
    const BASS=[65.4,65.4,98,87.3],PAD=[[130.8,164.8,196],[146.8,174.6,220]];let p=0,bi=0;
    function tick(){if(!run||!ctx)return;const tm=ctx.currentTime+.02,b=beat%16;
      if(b%4===0)kick(tm,.5);if(b===8)snare(tm,.28);hat(tm,b%2?.04:.07);
      if(b%4===0){osc(BASS[bi%BASS.length],'sawtooth',.5,.16,0,.01,mG);bi++;}
      if(b===0){PAD[p%PAD.length].forEach((f,i)=>osc(f,'triangle',3.6,.05,i*.03,.6,mG));p++;}
      beat++;if(run)setTimeout(tick,ivl);}
    tick();return()=>{run=false;};
  }
  function _trap(){
    let run=true,beat=0;const ivl=60000/140/4; // double-time hats
    const BASS=[49,0,0,49,0,58.3,0,0,55,0,0,55,0,43.7,0,0];let bi=0;
    function tick(){if(!run||!ctx)return;const tm=ctx.currentTime+.02,b=beat%16;
      if(b===0||b===10)kick(tm,.5);if(b===8)snare(tm,.26);
      // hi-hat rolls
      const hv=(b%4===2)?.02:.06;hat(tm,hv);if(b%4===3){hat(tm+ivl/2000,.04);}
      const bf=BASS[b];if(bf){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=bf;o.connect(g);g.connect(mG);g.gain.setValueAtTime(.22,tm);g.gain.exponentialRampToValueAtTime(.0001,tm+.4);o.start(tm);o.stop(tm+.45);}
      beat++;if(run)setTimeout(tick,ivl);}
    tick();return()=>{run=false;};
  }
  const GAME_STYLES={synthwave:_synthwave,arcade:_arcade,lofi:_lofi,epic:_epic,trap:_trap};

  function playGame(){
    if(!ctx||!_mu)return;_stopM();_res();
    let st=_style;
    if(st==='auto'||!GAME_STYLES[st]) st=STYLES[Math.floor(Math.random()*STYLES.length)];
    _stop=GAME_STYLES[st]();
  }
  function playMenu(){ if(!ctx||!_mu)return;_stopM();_res();_stop=_menuLoop(); }
  function playResults(win=true){
    if(!ctx||!_mu)return;_stopM();_res();let run=true;
    const CH=win?[[261.6,329.6,392,523.2],[293.7,370,440],[349.2,440,523.2]]:[[220,261.6,311.1],[196,246.9,293.7]];let ci=0;
    function chord(){if(!run||!ctx)return;CH[ci%CH.length].forEach((f,i)=>osc(f,win?'sine':'triangle',3,.1,i*.05,.3,mG));ci++;if(run)setTimeout(chord,2200);}
    chord();_stop=()=>{run=false;};
  }
  function playOnboarding(){
    if(!ctx||!_mu)return;_stopM();_res();let run=true;const M=[261.6,293.7,329.6,349.2,392,349.2,329.6,293.7];let mi=0;
    function note(){if(!run||!ctx)return;osc(M[mi%M.length],'sine',.7,.1,0,.14,mG);mi++;if(run)setTimeout(note,390+Math.random()*80);}
    note();_stop=()=>{run=false;};
  }
  function playArcade(){ if(!ctx||!_mu)return;_stopM();_res();_stop=_arcade(); }

  function stopMusic(){_stopM();}
  function setSFX(v){_sf=v;if(sG)sG.gain.value=v?_sv:0;}
  function setMusic(v){_mu=v;if(mG)mG.gain.value=v?_mv:0;if(!v)_stopM();}
  function setMVol(v){_mv=v;if(mG&&_mu)mG.gain.value=v;}
  function setSVol(v){_sv=v;if(sG&&_sf)sG.gain.value=v;}
  function setStyle(s){_style=s;}
  const ul=()=>{_i();_res();};
  document.addEventListener('click',ul);document.addEventListener('touchstart',ul);
  return{init:_i,stopMusic,playMenu,playGame,playResults,playOnboarding,playArcade,SFX,
    setSFX,setMusic,setMVol,setSVol,setStyle,STYLES,
    get sfxEnabled(){return _sf;},get musicEnabled(){return _mu;},get musicVol(){return _mv;},get sfxVol(){return _sv;},get style(){return _style;}};
})();
const SFX=Audio.SFX;
