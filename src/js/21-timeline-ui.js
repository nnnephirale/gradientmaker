let shownMode=null, shownCount=-1;
function paintTilesLight(){
  const n=S.mode==='single'?1:S.colors.length;
  if(openIdx>=0||S.mode!==shownMode||n!==tileHost.children.length){ syncMode(); renderTiles(); }
  else [...tileHost.children].forEach((w,i)=>{
    const t=w.querySelector('.tile'), x=w.querySelector('.hex'), hex=S.colors[i];
    const fg=(hex2lch(hex)||{L:.6}).L>0.62?'#000':'#fff';
    t.style.background=hex; t.style.color=fg; x.style.color=fg; t.querySelector('.kill').style.color=fg;
    if(document.activeElement!==x) x.value=hex;
  });
  shownMode=S.mode;
}
function syncControls(){
  Object.values(SLIDERS).forEach(s=>s._paint()); paintDial(); showSeed(); syncGrainSeg(); paintTilesLight();
}
/* move the playhead. light = mid-drag or playing: skip the rail's slower work */
function seek(t,light){
  head=clamp(t,0,S.dur);
  applying=true;
  if(S.keys.length){ const v=evalAt(head); Object.assign(S,v); S.colors=v.colors.slice(); syncControls(); }
  if(tlOpen){ ftime=flowTimeAt(head); gclock=head; }
  if(light) rebuildLight(); else build();
  applying=false;
  paintHead();
}
/* once there is a key, changing any setting writes one at the playhead */
let editQ=0;
function afterEdit(){
  queueDirty();
  if(applying||recording||editQ) return;
  editQ=requestAnimationFrame(()=>{ editQ=0; autoKey(); });
}
function autoKey(){
  if(!S.keys.length||applying||recording) return;
  const cur=keyVals();
  if(canon(cur)===canon(evalAt(head))) return;
  if(playing&&tlOpen){ playing=false; syncPlay(); }
  upsertKey(head,cur);
}
function upsertKey(t,v){
  t=clamp(qt(t),0,S.dur);
  let k=S.keys.find(k=>Math.abs(k.t-t)<0.5/FPS);
  if(k) k.v=v; else { k={id:uid(),t,v}; S.keys.push(k); }
  S.keys.sort((a,b)=>a.t-b.t);
  renderTrack();
  return k;
}
function lockKey(){
  if(!tlOpen) setTl(true);
  const first=!S.keys.length;
  const k=upsertKey(head,keyVals());
  sel.clear(); sel.add(k.id); renderTrack();
  toast(first?'Key locked — move the playhead and change a setting':`Key at ${k.t.toFixed(2)}s`);
}
function paintHead(){
  tlHead.style.left=(head/S.dur*100)+'%';
  tlNow.textContent=head.toFixed(2);
}
function renderTrack(){
  const d=S.dur, maj=d>20?10:5;
  let ticks='';
  for(let s=1;s<d;s++) ticks+=`<i class="${s%maj?'':'maj'}" style="left:${s/d*100}%"></i>`;
  tlTicks.innerHTML=ticks;
  tlKeys.innerHTML=S.keys.map(k=>`<b class="tl-key${sel.has(k.id)?' sel':''}" data-id="${k.id}" style="left:${k.t/d*100}%" title="${k.t.toFixed(2)}s"></b>`).join('');
  const last=S.keys[S.keys.length-1], lz=S.loop&&S.keys.length>1&&last.t<d;
  tlLoopZ.classList.toggle('off',!lz);
  if(lz){ tlLoopZ.style.left=(last.t/d*100)+'%'; tlLoopZ.style.width=((d-last.t)/d*100)+'%'; }
  tlEmpty.classList.toggle('off',S.keys.length>0);
  [tlDur,lenIn].forEach(x=>{ if(document.activeElement!==x) x.value=+d.toFixed(2); });
  tlLoop.checked=S.loop;
  document.querySelectorAll('#tlEase button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===S.ease)));
  document.getElementById('tlCopy').classList.toggle('off',!sel.size);
  document.getElementById('tlDel').classList.toggle('off',!sel.size);
  document.getElementById('tlPaste').classList.toggle('off',!KEYCLIP);
  paintHead(); syncVideoRow(); queueDirty();
}
const tlReserve=()=>tlOpen?tl.offsetHeight+16:0;
function setTl(on){
  if(on===tlOpen) return;
  tlOpen=on;
  tl.classList.toggle('on',on); stage.classList.toggle('tl-on',on);
  toggleTl.setAttribute('aria-pressed',String(on));
  stage.style.setProperty('--tlh',tl.offsetHeight+'px');
  wrap.style.paddingBottom=(44+tlReserve())+'px';
  if(on){ playing=false; renderTrack(); seek(head); }
  resize(); syncPlay();
}
toggleTl.addEventListener('click',()=>setTl(!tlOpen));
tlPlay.addEventListener('click',togglePlay);
document.getElementById('tlKey').addEventListener('click',lockKey);
tlLoop.addEventListener('change',()=>{ S.loop=tlLoop.checked; renderTrack(); seek(head); });
document.getElementById('tlEase').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  S.ease=b.dataset.v; renderTrack(); seek(head);
});
/* length can't cut keys off the end — it stops at the last one */
function setDur(x){
  const n=parseFloat(String(x.value).replace(',','.'));
  if(!isNaN(n)){
    const lastT=S.keys.length?S.keys[S.keys.length-1].t:0;
    S.dur=Math.round(clamp(n,Math.max(1,lastT),DURMAX)*10)/10;
  }
  x.value=S.dur; head=Math.min(head,S.dur); renderTrack(); if(tlOpen) seek(head);
}
[tlDur,lenIn].forEach(x=>{
  x.addEventListener('change',()=>setDur(x));
  x.addEventListener('keydown',e=>{ if(e.key==='Enter') x.blur(); });
  x.addEventListener('focus',()=>x.select());
});

/* track: drag a key to retime it (all selected keys move together), click or
   drag anywhere else to scrub; the playhead catches on keys it passes near */
let tdrag=null;
const laneT=x=>{ const r=tlLane.getBoundingClientRect(); return clamp((x-r.left)/r.width)*S.dur; };
function snapT(x){
  const r=tlLane.getBoundingClientRect(), t=laneT(x);
  for(const k of S.keys) if(Math.abs(k.t-t)/S.dur*r.width<6) return k.t;
  return qt(t);
}
tlTrack.addEventListener('pointerdown',e=>{
  if(playing){ playing=false; syncPlay(); }
  try{ tlTrack.setPointerCapture(e.pointerId); }catch(x){}
  const kEl=e.target.closest('.tl-key');
  if(kEl){
    const id=kEl.dataset.id, k=S.keys.find(k=>k.id===id);
    if(e.shiftKey){ sel.has(id)?sel.delete(id):sel.add(id); }
    else if(!sel.has(id)){ sel.clear(); sel.add(id); }
    tdrag={key:k,x0:e.clientX,orig:new Map(S.keys.filter(k=>sel.has(k.id)).map(k=>[k.id,k.t]))};
    renderTrack(); seek(k.t,true);
  }else{
    if(!e.shiftKey) sel.clear();
    tdrag={scrub:true}; renderTrack(); seek(snapT(e.clientX),true);
  }
});
tlTrack.addEventListener('pointermove',e=>{
  if(!tdrag) return;
  if(tdrag.scrub) return seek(snapT(e.clientX),true);
  const r=tlLane.getBoundingClientRect(), dt=(e.clientX-tdrag.x0)/r.width*S.dur;
  S.keys.forEach(k=>{ if(tdrag.orig.has(k.id)) k.t=clamp(qt(tdrag.orig.get(k.id)+dt),0,S.dur); });
  S.keys.sort((a,b)=>a.t-b.t);
  renderTrack(); seek(tdrag.key.t,true);
});
const endT=e=>{
  if(!tdrag) return;
  tdrag=null; try{ tlTrack.releasePointerCapture(e.pointerId); }catch(x){}
  renderTrack(); seek(head);
};
tlTrack.addEventListener('pointerup',endT);
tlTrack.addEventListener('pointercancel',endT);

/* copy / paste — a copied run keeps its spacing, so a whole tween can be
   lifted and dropped somewhere else. It also goes to the clipboard as text,
   which is how keys travel between sessions and tabs. */
function copyKeys(){
  const ks=S.keys.filter(k=>sel.has(k.id)); if(!ks.length) return;
  const t0=ks[0].t;
  KEYCLIP=ks.map(k=>({dt:k.t-t0,v:structuredClone(k.v)}));
  try{ navigator.clipboard.writeText(JSON.stringify({gsKeys:KEYCLIP})).catch(()=>{}); }catch(x){}
  renderTrack();
  toast(ks.length>1?`${ks.length} keys copied`:'Key copied');
}
function readKeyClip(t){
  if(!t||t.indexOf('gsKeys')<0) return null;
  try{ const o=JSON.parse(t); return Array.isArray(o.gsKeys)&&o.gsKeys.length?o.gsKeys:null; }catch(x){ return null; }
}
function pasteKeys(){
  if(!KEYCLIP) return;
  if(!tlOpen) setTl(true);
  const span=KEYCLIP[KEYCLIP.length-1].dt;
  if(head+span>S.dur) S.dur=Math.min(DURMAX,Math.ceil((head+span)*10)/10);
  sel.clear();
  KEYCLIP.forEach(c=>{ const k=upsertKey(head+c.dt,{...keyVals(),...structuredClone(c.v)}); sel.add(k.id); });
  renderTrack(); seek(head);
  toast(KEYCLIP.length>1?`${KEYCLIP.length} keys pasted`:'Key pasted');
}
function deleteKeys(){
  if(!sel.size) return;
  const before=structuredClone(S.keys), n=sel.size;
  S.keys=S.keys.filter(k=>!sel.has(k.id)); sel.clear();
  renderTrack(); seek(head);
  toast(`${n>1?n+' keys':'Key'} deleted · <u>Undo</u>`,()=>{ S.keys=before; renderTrack(); seek(head); });
}
document.getElementById('tlCopy').addEventListener('click',copyKeys);
document.getElementById('tlPaste').addEventListener('click',pasteKeys);
document.getElementById('tlDel').addEventListener('click',deleteKeys);
addEventListener('keydown',e=>{
  if(!tlOpen||e.target.matches('input,[contenteditable]')) return;
  const mod=e.metaKey||e.ctrlKey;
  if(mod&&(e.key==='c'||e.key==='C')&&sel.size&&!String(getSelection())){ e.preventDefault(); copyKeys(); }
  else if(!mod&&(e.key==='Backspace'||e.key==='Delete')&&sel.size){ e.preventDefault(); deleteKeys(); }
  else if(!mod&&(e.key==='k'||e.key==='K')) lockKey();
  else if(!mod&&(e.key==='ArrowLeft'||e.key==='ArrowRight')&&!e.target.closest('.ctl,.dial')){
    e.preventDefault();
    if(playing){ playing=false; syncPlay(); }
    seek(qt(head)+(e.key==='ArrowLeft'?-1:1)*(e.shiftKey?1:1/FPS));
  }
});

