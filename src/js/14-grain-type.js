/* ── grain type ── */
function syncGrainSeg(){
  document.querySelectorAll('#grainSeg button').forEach(b=>
    b.setAttribute('aria-pressed',String(+b.dataset.v===S.grainType)));
}
document.getElementById('grainSeg').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  S.grainType=+b.dataset.v; syncGrainSeg(); build();
});

document.getElementById('modeSeg').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  S.mode=b.dataset.v; openIdx=-1; syncMode(); renderTiles(); build();
});

