/* ── seed / shuffle ── */
const seedVal=document.getElementById('seedVal'), showSeed=()=>{ seedVal.textContent=S.seed; };
showSeed();
/* shuffle rolls the arrangement — everything that decides where the colours
   land, never what they are. Each value it touches owns a control in the rail,
   so every one of them is repainted: the panel never disagrees with the canvas. */
const rand=(a,b)=>a+Math.random()*(b-a);
const snap=(v,step)=>Math.round(Math.round(v/step)*step*1e6)/1e6;
document.getElementById('shuffle').addEventListener('click',()=>{
  S.seed=Math.floor(Math.random()*9999);
  S.direction=Math.round(rand(0,360))%360;
  if(S.style!=='soft'){ showSeed(); paintDial(); build(); return; }
  /* mid-range rolls only — the extremes of these three are for hand-tuning,
     not for a button you press twenty times in a row */
  S.scatter=snap(rand(0.45,1.25),.01);
  S.bloom=snap(rand(0.25,1.00),.01);
  S.warp=snap(rand(0,0.22),.005);
  showSeed();
  paintDial();
  build();
});
const overlay=document.getElementById('overlay');
document.getElementById('toggleContent').addEventListener('click',e=>{
  const on=!overlay.classList.toggle('off');
  e.currentTarget.setAttribute('aria-pressed',String(on));
});
function applyState(next){
  S=structuredClone(next); showSeed(); openIdx=-1;
  syncMode(); syncStyle(); syncGrainSeg(); renderTiles(); paintDial(); paintSize(); renderAspects();
  Object.values(SLIDERS).forEach(s=>s._paint());
  sel.clear(); head=clamp(head,0,S.dur); renderTrack();
  resize();
  if(S.keys.length) seek(head);
}
/* no confirm: reset happens at once and the toast carries the way back */
document.getElementById('reset').addEventListener('click',()=>{
  const before=structuredClone(S);
  applyState(DEFAULTS);
  toast('Reset · <u>Undo</u>',()=>{ applyState(before); toast('Restored'); });
});

