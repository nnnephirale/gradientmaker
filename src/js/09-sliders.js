/* ══════════════════════════════════════════════════════════════
   SLIDERS — label and explainer share one line
   ══════════════════════════════════════════════════════════════ */
const pc=v=>Math.round(v*100);
const SPECS={
  ctlLook:[
    {k:'depth',    l:'Depth',    hint:'light to dark',   min:0,max:1,step:.01,f:pc},
    {k:'softness', l:'Softness', hint:'zones to wash',   min:0,max:1,step:.01,f:pc},
    {k:'grain',    l:'Grain',                            min:0,max:1,step:.01,f:pc}
  ],
  ctlFlow:[
    {k:'scale',    l:'Scale',                              min:.3,max:4,step:.01,f:v=>v.toFixed(2)+'×'},
    {k:'stretch',  l:'Stretch',  hint:'long streaks',      min:1,max:6,step:.01,f:v=>v.toFixed(2)+'×'},
    {k:'fwarp',    l:'Warp',     hint:'how folded',        min:0,max:4,step:.01,f:v=>v.toFixed(2)},
    {k:'contrast', l:'Contrast',                           min:.5,max:2.2,step:.01,f:v=>v.toFixed(2)},
    {k:'folds',    l:'Folds',                              min:.5,max:6,step:.01,f:v=>v.toFixed(2)},
    {k:'detail',   l:'Detail',                             min:1,max:6,step:.01,f:v=>v.toFixed(2)},
    {k:'sheen',    l:'Sheen',    hint:'shine on the folds', min:0,max:1,step:.01,f:pc}
  ],
  ctlHatch:[
    {k:'hatch',    l:'Hatch',    hint:'fine lines in soft patches', min:0,max:1,step:.01,f:pc}
  ],
  ctlMotion:[
    {k:'speed',    l:'Speed',                              min:0,max:1.5,step:.01,f:v=>v.toFixed(2)+'×'}
  ],
  ctlGrain:[
    {k:'grainSize',l:'Grain size',hint:'in exported pixels', min:0.01,max:3,step:.01,
     f:v=>v.toFixed(2)+'px'}
  ],
  ctlFmt:[
    {k:'radius',   l:'Radius',                           min:0,max:90,step:1,f:v=>v+'px'}
  ],
};
const SLIDERS={};
function makeSlider(sp,host){
  const el=document.createElement('div');
  el.className='ctl';
  el.tabIndex=0;
  el.setAttribute('role','slider');
  el.setAttribute('aria-label',sp.l);
  el.setAttribute('aria-valuemin',sp.min);
  el.setAttribute('aria-valuemax',sp.max);
  /* the hint moves to the tooltip: in a 34px row it lengthened the label until
     the value tick struck through it */
  if(sp.hint) el.title=`${sp.l} — ${sp.hint}`;
  el.innerHTML=`<div class="fill"></div><div class="tick"></div>
    <div class="lab">
      <span class="ctl-lab">${sp.l}</span>
      <span class="ctl-val"></span>
    </div>`;
  host.appendChild(el);
  const track=el,fill=el.querySelector('.fill'),
        tick=el.querySelector('.tick'),val=el.querySelector('.ctl-val');
  function paint(){
    const t=clamp((S[sp.k]-sp.min)/(sp.max-sp.min));
    fill.style.width=(t*100)+'%';
    /* the clamp keeps the marker inside the row at both ends — at 0 it reads as
       "sitting at the floor", not as a missing control */
    tick.style.left=`clamp(8px, ${(t*100).toFixed(3)}%, calc(100% - 8px))`;
    val.textContent=sp.f(S[sp.k]);
    el.setAttribute('aria-valuenow',S[sp.k]);
  }
  function set(t){
    let v=sp.min+clamp(t)*(sp.max-sp.min);
    v=Math.round(Math.round(v/sp.step)*sp.step*1e6)/1e6;
    if(v!==S[sp.k]){ S[sp.k]=v; paint(); build(); }
  }
  let drag=false;
  const fromX=e=>{const r=track.getBoundingClientRect();return (e.clientX-r.left)/r.width;};
  track.addEventListener('pointerdown',e=>{drag=true;track.setPointerCapture(e.pointerId);set(fromX(e));});
  track.addEventListener('pointermove',e=>{if(drag)set(fromX(e));});
  track.addEventListener('pointerup',e=>{drag=false;track.releasePointerCapture(e.pointerId);});
  track.addEventListener('keydown',e=>{
    const d=e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0; if(!d)return; e.preventDefault();
    S[sp.k]=clamp(Math.round((S[sp.k]+d*sp.step*(e.shiftKey?.2:1))*1e6)/1e6,sp.min,sp.max);
    paint(); build();
  });
  el._paint=paint; paint(); SLIDERS[sp.k]=el;
}
for(const [host,list] of Object.entries(SPECS)){
  const h=document.getElementById(host); list.forEach(sp=>makeSlider(sp,h));
}

