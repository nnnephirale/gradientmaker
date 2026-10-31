/* ── mode ── */
function syncMode(){
  const single=S.mode==='single';
  if(!single && S.colors.length<2){
    const b=hex2lch(S.colors[0])||{L:.6,C:.14,H:140};
    const H=(b.H+62)%360, L=clamp(b.L-0.14,0.15,0.9);
    S.colors.push(lch2hex(L,Math.min(b.C,maxC(L,H)*0.9),H).hex);
  }
  document.querySelectorAll('#modeSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===S.mode)));
  document.getElementById('addColor').classList.toggle('off',single);
  document.getElementById('ramp').classList.toggle('off',!single);
  document.getElementById('modeHint').textContent = single
    ? 'One colour becomes a run of tones in the same family — pale highlight through deep shadow.'
    : 'Your exact colours are kept. Depth adds light and shade without shifting the hues.';
}
/* ── style ── */
const STYLE_HINT={
  soft:'Soft blends your colours into a still, smooth field.',
  flow:'Flow folds your colours into moving silk, dark to light.',
  sky:'Sky lays your colours in soft drifting bands, first colour at the top.'
};
function syncStyle(){
  const flow=S.style!=='soft';
  document.querySelectorAll('#styleSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===S.style)));
  document.getElementById('styleHint').textContent=STYLE_HINT[S.style];
  renderPresets();
  ['ctlFlow','motionGrp','copyCode'].forEach(id=>document.getElementById(id).classList.toggle('off',!flow));
  ['copyCss'].forEach(id=>document.getElementById(id).classList.toggle('off',flow));
  SLIDERS.softness.classList.toggle('off',flow);
  // Depth is shared: sits among the flow sliders (before Folds), or first in Look for soft
  if(flow) SLIDERS.folds.parentNode.insertBefore(SLIDERS.depth,SLIDERS.folds); else SLIDERS.softness.parentNode.insertBefore(SLIDERS.depth,SLIDERS.softness);
  syncVideoRow(); syncPlay();
}
document.getElementById('styleSeg').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b||b.dataset.v===S.style) return;
  S.bank[S.style]=pickLook(S);
  S.style=b.dataset.v;
  Object.assign(S,S.bank[S.style]);
  showSeed();
  syncStyle(); syncGrainSeg(); paintDial();
  Object.values(SLIDERS).forEach(s=>s._paint());
  if(S.keys.length) seek(head); else build();
});
const presetRow=document.getElementById('presetRow');
/* a preset stays lit while the colours are still the ones it set */
function syncPresets(){
  const cur=S.colors.join();
  presetRow.querySelectorAll('button').forEach(b=>{
    const p=PRESETS[S.style][b.dataset.p];
    b.setAttribute('aria-pressed',String(S.mode==='multi'&&p.c.join()===cur));
  });
}
function renderPresets(){
  presetRow.innerHTML=Object.keys(PRESETS[S.style]).map(n=>`<button data-p="${n}" aria-pressed="false" title="${n}">${n}</button>`).join('');
  syncPresets();
}
presetRow.addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  const p=PRESETS[S.style][b.dataset.p];
  S.mode='multi'; S.colors=p.c.slice(); openIdx=-1;
  if(S.style==='soft'){
    ['depth','softness','grain','scatter','bloom','warp','direction'].forEach(k=>S[k]=p[k]);
  }else{
    S.depth=.2;
    ['scale','fwarp','stretch','detail','speed','contrast','sheen','folds','hatch','hatchGap','hatchAngle'].forEach(k=>S[k]=p[k]);
    S.direction=(p.angle+360)%360;
    /* the study's grain was uniform ±g/2; the studio's is a bell of the same spread */
    S.grain=snap(clamp(p.grain*4.55),.01);
  }
  S.grainType=0;
  syncMode(); syncGrainSeg(); renderTiles(); paintDial();
  Object.values(SLIDERS).forEach(s=>s._paint());
  build();
});

