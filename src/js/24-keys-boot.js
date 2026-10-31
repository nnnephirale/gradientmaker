document.getElementById('copyHex').addEventListener('click',()=>{
  navigator.clipboard.writeText(STOPS.map(s=>s.hex).join('\n')).then(()=>toast('Colours copied'),()=>toast('Copy blocked'));
});
addEventListener('keydown',e=>{
  if(e.target.matches('input,[contenteditable]')) return;
  if(e.metaKey||e.ctrlKey||e.altKey) return;
  if(e.key==='r'||e.key==='R') document.getElementById('shuffle').click();
  if(e.key==='t'||e.key==='T') setTl(!tlOpen);
  if(e.key===' '&&moving()&&!e.target.closest('button')){ e.preventDefault(); togglePlay(); }
});

/* boot */
syncMode(); syncStyle(); syncGrainSeg(); renderTiles(); paintDial(); renderAspects(); renderTrack(); renderSessions(); resize();
