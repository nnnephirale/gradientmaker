/* ══════════════════════════════════════════════════════════════
   SESSIONS — saved by hand only. A loaded session shows a dot once it
   differs from what was saved; Save overwrites it, Save as new forks it.
   ══════════════════════════════════════════════════════════════ */
const SKEY='gs-sessions';
const sessName=document.getElementById('sessName'), sessDirty=document.getElementById('sessDirty'),
      sessSave=document.getElementById('sessSave'), sessNew=document.getElementById('sessNew'),
      sessList=document.getElementById('sessList'), sessBtns=document.getElementById('sessBtns');
let SESS=[], curId=null, curJSON=null;
try{ SESS=JSON.parse(localStorage.getItem(SKEY))||[]; }catch(e){ SESS=[]; }
function persist(){
  try{ localStorage.setItem(SKEY,JSON.stringify(SESS)); return true; }
  catch(e){ toast('Could not save — browser storage is full or blocked'); return false; }
}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* key order never decides whether something changed */
const canon=o=>JSON.stringify(o,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)
  ?Object.fromEntries(Object.keys(v).sort().map(x=>[x,v[x]])):v);
/* what a session holds. Zoom is a view, not the work. With keys, the live
   values are just wherever the playhead is, so the keys stand for them. */
function sessionData(){
  const o=structuredClone(S); delete o.zoom;
  if(o.keys.length){ ['direction','colors',...TWEEN_NUM,...TWEEN_HOLD].forEach(k=>delete o[k]); }
  return o;
}
const curSess=()=>SESS.find(s=>s.id===curId)||null;
const STYLE_NAME={soft:'Soft',flow:'Flow',sky:'Sky'};
function freshName(base){
  const names=new Set(SESS.map(s=>s.name));
  if(!names.has(base)) return base;
  const stem=base.replace(/\s+\d+$/,''); let n=2;
  while(names.has(`${stem} ${n}`)) n++;
  return `${stem} ${n}`;
}
function ago(ts){
  const s=(Date.now()-ts)/1000;
  if(s<60) return 'now'; if(s<3600) return Math.floor(s/60)+'m'; if(s<86400) return Math.floor(s/3600)+'h';
  return new Date(ts).toLocaleDateString(undefined,{month:'short',day:'numeric'});
}
function sessColors(d){
  const c=(d.keys&&d.keys.length?d.keys[0].v:d).colors||['#888'];
  const list=(d.keys&&d.keys.length?d.keys[0].v.mode:d.mode)==='single'?c.slice(0,1):c;
  return list.length>1?list.join(','):`${list[0]},${list[0]}`;
}
function renderSessions(){
  document.getElementById('sessCount').textContent=SESS.length||'';
  sessList.innerHTML=SESS.map(s=>`<div class="sess" data-id="${s.id}" aria-current="${s.id===curId}" title="Load ${esc(s.name)}">
    <span class="chip" style="background:linear-gradient(90deg,${sessColors(s.data)})"></span>
    <span class="nm">${esc(s.name)}</span>
    <span class="when">${s.data.keys&&s.data.keys.length?'◆ ':''}${ago(s.at)}</span>
    <button class="x" title="Delete" aria-label="Delete ${esc(s.name)}">×</button></div>`).join('');
  sessList.classList.toggle('off',!SESS.length);
  syncDirty();
}
let dirtyQ=0;
function queueDirty(){ if(!dirtyQ) dirtyQ=requestAnimationFrame(()=>{ dirtyQ=0; syncDirty(); }); }
function syncDirty(){
  const s=curSess();
  const d=!!s&&(canon(sessionData())!==curJSON||sessName.value.trim()!==s.name);
  sessDirty.classList.toggle('on',d);
  sessSave.disabled=!!s&&!d;
  sessSave.textContent=s?'Save':'Save session';
  sessNew.classList.toggle('off',!s); sessBtns.classList.toggle('one',!s);
}
function saveNew(){
  const s=curSess();
  let nm=sessName.value.trim()||`${STYLE_NAME[S.style]} 1`;
  if(s&&nm===s.name) nm=freshName(nm+' 2'); else nm=freshName(nm);
  const data=sessionData(), n={id:uid(),name:nm,at:Date.now(),data};
  SESS.unshift(n);
  if(!persist()){ SESS.shift(); return; }
  curId=n.id; curJSON=canon(data); sessName.value=nm;
  renderSessions(); toast(`Saved “${esc(nm)}”`);
}
function saveCur(){
  const s=curSess(); if(!s) return saveNew();
  const prev={name:s.name,at:s.data,ts:s.at};
  s.name=sessName.value.trim()||s.name; s.data=sessionData(); s.at=Date.now();
  if(!persist()){ s.name=prev.name; s.data=prev.at; s.at=prev.ts; return; }
  curJSON=canon(s.data); sessName.value=s.name;
  renderSessions(); toast(`Saved “${esc(s.name)}”`);
}
sessSave.addEventListener('click',saveCur);
sessNew.addEventListener('click',saveNew);
sessName.addEventListener('input',queueDirty);
sessName.addEventListener('keydown',e=>{ if(e.key==='Enter'){ sessName.blur(); saveCur(); } });
/* loading is instant; whatever was on screen comes back with Undo */
function loadSession(id){
  const s=SESS.find(x=>x.id===id); if(!s||recording) return;
  const back={S:structuredClone(S),curId,curJSON,name:sessName.value,head};
  const next={...structuredClone(DEFAULTS),...structuredClone(s.data),zoom:S.zoom};
  if(playing&&tlOpen){ playing=false; syncPlay(); }
  curId=id; curJSON=canon(s.data); sessName.value=s.name; head=0;
  applyState(next);
  if(next.keys.length) setTl(true);
  renderSessions();
  toast(`Loaded “${esc(s.name)}” · <u>Undo</u>`,()=>{
    curId=back.curId; curJSON=back.curJSON; sessName.value=back.name; head=back.head;
    applyState(back.S); renderSessions();
  });
}
sessList.addEventListener('click',e=>{
  const row=e.target.closest('.sess'); if(!row) return;
  const id=row.dataset.id;
  if(e.target.closest('.x')){
    const i=SESS.findIndex(s=>s.id===id), gone=SESS[i], wasCur=curId===id;
    SESS.splice(i,1); persist();
    if(wasCur){ curId=null; curJSON=null; }
    renderSessions();
    toast(`Deleted “${esc(gone.name)}” · <u>Undo</u>`,()=>{
      SESS.splice(i,0,gone); persist();
      if(wasCur){ curId=id; curJSON=canon(gone.data); }
      renderSessions();
    });
    return;
  }
  if(id===curId) return;
  loadSession(id);
});

