/* ══════════════════════════════════════════════════════════════
   FORMAT — ratio chips keep the long side, recompute the short one
   ══════════════════════════════════════════════════════════════ */
const RATIOS=[{l:'1:1',v:1},{l:'4:5',v:0.8},{l:'3:2',v:1.5},{l:'16:9',v:16/9}];
const aspectSeg=document.getElementById('aspectSeg');
function currentRatio(){
  const a=S.outW/S.outH;
  return RATIOS.find(r=>Math.abs(r.v-a)<0.006) || null;
}
function renderAspects(){
  const active=currentRatio();
  aspectSeg.innerHTML=RATIOS.map(r=>
    `<button data-v="${r.v}" aria-pressed="${active&&active.l===r.l}">${r.l}</button>`).join('')
    + (active?'':`<button data-custom="1" aria-pressed="true">Custom</button>`);
}
aspectSeg.addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b||b.dataset.custom) return;
  const v=+b.dataset.v, big=Math.max(S.outW,S.outH);
  if(v>=1){ S.outW=big; S.outH=Math.round(big/v); }
  else    { S.outH=big; S.outW=Math.round(big*v); }
  renderAspects(); resize();
});

/* size label — double-click to type an exact pixel size */
const sizeBar=document.querySelector('.sizebar'), sizeLab=document.getElementById('sizeLab'),
      zoomLab=document.getElementById('zoomLab'), zRange=document.getElementById('zRange');
/* the pill's slider is logarithmic against the fit, so a step feels the same
   size whether you are at a quarter or at eight times */
const ZMIN=0.25, ZMAX=8, ZLO=Math.log(ZMIN), ZHI=Math.log(ZMAX);
const zoomToT=z=>clamp((Math.log(z)-ZLO)/(ZHI-ZLO));
const tToZoom=t=>Math.exp(ZLO+clamp(t)*(ZHI-ZLO));
function paintSize(){
  sizeLab.textContent=`${S.outW} × ${S.outH}`;
  /* the true scale of the preview against the exported pixels, not a multiple
     of the fit — 100% means one screen pixel per exported pixel */
  const p=viewW/S.outW*100;
  zoomLab.textContent=(p<10?p.toFixed(1):Math.round(p))+'%';
  if(document.activeElement!==zRange) zRange.value=zoomToT(S.zoom);
}
zRange.addEventListener('input',e=>{ S.zoom=tToZoom(+e.target.value); resize(); });
const nudgeZoom=f=>{ S.zoom=clamp(S.zoom*f,0.001,1000); resize(); };
document.getElementById('zOut').addEventListener('click',()=>nudgeZoom(1/1.25));
document.getElementById('zIn') .addEventListener('click',()=>nudgeZoom(1.25));
sizeLab.addEventListener('dblclick',()=>{
  const inp=document.createElement('input');
  inp.className='sizeinput'; inp.value=`${S.outW} × ${S.outH}`;
  sizeBar.replaceChild(inp,sizeLab); inp.focus(); inp.select();
  const commit=()=>{
    const m=inp.value.match(/(\d{2,5})\s*[x×*, ]\s*(\d{2,5})/);
    if(m){ S.outW=clamp(+m[1],64,8192)|0; S.outH=clamp(+m[2],64,8192)|0; }
    sizeBar.replaceChild(sizeLab,inp);
    paintSize(); renderAspects(); resize();
  };
  inp.addEventListener('blur',commit);
  inp.addEventListener('keydown',e=>{
    if(e.key==='Enter') inp.blur();
    if(e.key==='Escape'){ inp.value=`${S.outW} × ${S.outH}`; inp.blur(); }
  });
});

