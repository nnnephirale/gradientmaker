/* ── dial ── */
const dial=document.getElementById('dial'), ind=dial.querySelector('.ind');
function paintDial(){
  ind.style.transform=`rotate(${S.direction}deg)`;
  document.getElementById('angleVal').textContent=Math.round(S.direction)+'°';
  dial.setAttribute('aria-valuenow',Math.round(S.direction));
}
function dialFrom(e,shift){
  const r=dial.getBoundingClientRect();
  let a=(Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))/D+90+360)%360;
  if(shift) a=Math.round(a/15)*15%360;
  S.direction=Math.round(a); paintDial(); build();
}
let dDrag=false;
dial.addEventListener('pointerdown',e=>{dDrag=true;dial.setPointerCapture(e.pointerId);dialFrom(e,e.shiftKey);});
dial.addEventListener('pointermove',e=>{if(dDrag)dialFrom(e,e.shiftKey);});
dial.addEventListener('pointerup',e=>{dDrag=false;dial.releasePointerCapture(e.pointerId);});
dial.addEventListener('keydown',e=>{
  const d=e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0; if(!d)return; e.preventDefault();
  S.direction=(S.direction+d*(e.shiftKey?15:1)+360)%360; paintDial(); build();
});

