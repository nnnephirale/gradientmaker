const wrap=document.getElementById('wrap'), stage=document.getElementById('stage');
const MAXCSS=2600;              /* ceiling on the backing store, not on the export */
let viewW=0;                    /* what the card is actually showing, in CSS px */
/* measured off the stage, never off the scrolling pane: a scrollbar appearing
   at high zoom would otherwise shrink the fit and oscillate */
function fitW(){
  const aspect=S.outW/S.outH;
  const aw=stage.clientWidth-88, ah=stage.clientHeight-88-tlReserve();
  let w=Math.min(aw,760,S.outW);
  if(w/aspect>ah) w=ah*aspect;
  return Math.max(w,40);
}
function resize(){
  if(recording) return;            /* the canvas is the video while a take runs */
  const aspect=S.outW/S.outH, f=fitW();
  const cap=Math.min(MAXCSS,MAXCSS*aspect);   /* caps the long side either way */
  const w=clamp(f*S.zoom,40,cap);
  S.zoom=w/f;                                 /* absorb the clamp so scrolling at
                                                 the limit cannot bank up */
  const h=w/aspect;
  card.style.width=Math.round(w)+'px'; card.style.height=Math.round(h)+'px';
  /* deep zoom on a modest GPU would ask for a buffer it cannot allocate, so the
     pixel ratio gives way before the limit does — soft beats blank */
  const dpr=Math.min(window.devicePixelRatio||1,2,MAXBUF/Math.max(w,h));
  cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
  viewW=w;
  paintSize(); build();
  wrap.classList.toggle('pannable',
    wrap.scrollWidth>wrap.clientWidth+1 || wrap.scrollHeight>wrap.clientHeight+1);
}
new ResizeObserver(resize).observe(stage);

/* wheel anywhere over the stage zooms, anchored on the pointer: whatever is
   under the cursor stays under it, so zooming never undoes a pan */
wrap.addEventListener('wheel',e=>{
  e.preventDefault();
  const r=wrap.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top;
  const fx=(wrap.scrollLeft+px)/Math.max(wrap.scrollWidth,1);
  const fy=(wrap.scrollTop +py)/Math.max(wrap.scrollHeight,1);
  const d=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?100:1);
  S.zoom=clamp(S.zoom*Math.exp(-d*0.0016),0.001,1000);
  resize();
  wrap.scrollLeft=fx*wrap.scrollWidth-px;   /* clamps itself back to 0 when it fits */
  wrap.scrollTop =fy*wrap.scrollHeight-py;
},{passive:false});

/* drag to shift the view once the card outgrows the pane. Editable overlay text
   and controls keep their own pointer behaviour. */
let pan=null;
wrap.addEventListener('pointerdown',e=>{
  if(!wrap.classList.contains('pannable')) return;
  if(e.target.closest('[contenteditable],button,input')) return;
  pan={x:e.clientX,y:e.clientY,l:wrap.scrollLeft,t:wrap.scrollTop};
  wrap.classList.add('grabbing');
  try{ wrap.setPointerCapture(e.pointerId); }catch(x){}
  e.preventDefault();
});
wrap.addEventListener('pointermove',e=>{
  if(!pan) return;
  wrap.scrollLeft=pan.l-(e.clientX-pan.x);
  wrap.scrollTop =pan.t-(e.clientY-pan.y);
});
const endPan=e=>{
  if(!pan) return;
  pan=null; wrap.classList.remove('grabbing');
  try{ wrap.releasePointerCapture(e.pointerId); }catch(x){}
};
wrap.addEventListener('pointerup',endPan);
wrap.addEventListener('pointercancel',endPan);
/* click fits, double-click goes to 1:1 with the exported pixels. The single
   click is held back a beat so a double never flashes through fit on its way. */
let zTap;
zoomLab.addEventListener('click',()=>{
  clearTimeout(zTap);
  zTap=setTimeout(()=>{ S.zoom=1; resize(); },180);
});
zoomLab.addEventListener('dblclick',()=>{
  clearTimeout(zTap);
  S.zoom=S.outW/fitW();          /* resize() clamps this if the card won't fit */
  resize();
});

