/* ── motion ── */
const ICON_PAUSE=`<svg viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="2.6" height="10" rx="1"/><rect x="9.4" y="3" width="2.6" height="10" rx="1"/></svg>`;
const ICON_PLAY=`<svg viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.2v9.6c0 .5.5.8.9.5l7.2-4.8c.4-.3.4-.8 0-1L5.9 2.7c-.4-.3-.9 0-.9.5z"/></svg>`;
const playBtn=document.getElementById('playBtn');
let playing=!matchMedia('(prefers-reduced-motion: reduce)').matches;
let ftime=0, gclock=0, raf=0, lastT=0;
const grainTick=()=>Math.floor(gclock*24);   /* grain re-rolls at film rate, not screen rate */
/* with the timeline open the playhead is the clock: playing moves it, and
   everything — settings and the flow's drift — is read off it */
const moving=()=>tlOpen||S.style!=='soft';
function frame(now){
  raf=0;
  if(!moving()||!playing||document.hidden||recording) return;
  const dt=Math.min(0.05,(now-lastT)/1000); lastT=now;
  if(tlOpen){
    let h=head+dt;
    if(h>=S.dur){ if(S.loop) h%=S.dur; else { h=S.dur; playing=false; } }
    seek(h,true);
    if(!playing){ seek(head); syncPlay(); return; }
  }else{
    ftime+=dt*S.speed; gclock+=dt;
    render(cv.width,cv.height);
  }
  raf=requestAnimationFrame(frame);
}
function syncPlay(){
  [playBtn,tlPlay].forEach(b=>{
    b.innerHTML=playing?ICON_PAUSE:ICON_PLAY;
    b.title=playing?'Pause — Space':'Play — Space';
    b.setAttribute('aria-label',playing?'Pause':'Play');
  });
  if(moving()&&playing&&!document.hidden&&!raf&&!recording){ lastT=performance.now(); raf=requestAnimationFrame(frame); }
}
function togglePlay(){
  if(!playing&&tlOpen&&head>=S.dur-1e-3&&!S.loop) seek(0,true);
  const was=playing; playing=!playing;
  if(was&&tlOpen) seek(head);         /* settle the panel on the frame it stopped at */
  syncPlay();
}
playBtn.addEventListener('click',togglePlay);
document.addEventListener('visibilitychange',syncPlay);

