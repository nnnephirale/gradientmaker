/* ══════════════════════════════════════════════════════════════
   VIDEO — MediaRecorder is real time, so the take plays out on the card
   itself at video size. With a timeline it runs 0 → length exactly as the
   playhead would; without one it carries on from the live drift.
   ══════════════════════════════════════════════════════════════ */
const dlVideo=document.getElementById('dlVideo'), videoHint=document.getElementById('videoHint');
function syncVideoRow(){
  const on=S.style!=='soft'||S.keys.length>0;
  document.getElementById('videoRow').classList.toggle('off',!on);
  videoHint.textContent=S.keys.length
    ? `Records the timeline — ${S.keys.length} key${S.keys.length>1?'s':''}${S.loop?', looped':''}. MP4, or WebM where MP4 isn't available.`
    : 'Copy code gives a live, moving version for any website. Video saves the motion as MP4, or WebM where MP4 isn\'t available. Open Animate to keyframe it.';
}
dlVideo.addEventListener('click',async()=>{
  if(recording) return;
  if(!window.MediaRecorder||!cv.captureStream) return toast('This browser cannot record video');
  const mime=['video/mp4;codecs=avc1.640028','video/mp4;codecs=avc1','video/mp4',
    'video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
  if(!mime) return toast('This browser cannot record video');
  const ext=mime.startsWith('video/mp4')?'mp4':'webm';
  /* long side capped at 1920 and both sides even — what H.264 encoders accept */
  const k=Math.min(1,1920/Math.max(S.outW,S.outH));
  const w=Math.max(2,Math.round(S.outW*k/2)*2), h=Math.max(2,Math.round(S.outH*k/2)*2);
  const timed=tlOpen||S.keys.length>0, dur=S.dur, ft0=timed?0:ftime, head0=head, was=playing;
  const ow=cv.width, oh=cv.height;
  playing=false; cancelAnimationFrame(raf); raf=0;
  recording=true; document.body.classList.add('rec'); dlVideo.disabled=true;
  cv.width=w; cv.height=h;
  const at=t=>{
    applying=true;
    if(S.keys.length){ const v=evalAt(t); Object.assign(S,v); S.colors=v.colors.slice(); syncControls(); }
    ftime=ft0+flowTimeAt(t); gclock=t;
    rebuildLight();
    applying=false;
    if(tlOpen){ head=t; paintHead(); }
    /* hand each drawn frame to the encoder ourselves, rather than leaving it
       to sample whatever the compositor happened to show */
    if(track&&track.requestFrame) track.requestFrame();
  };
  const stream=cv.captureStream(0), track=stream.getVideoTracks()[0];
  at(0);
  const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:24e6});
  const chunks=[]; rec.ondataavailable=e=>{ if(e.data.size) chunks.push(e.data); };
  const stopped=new Promise(r=>rec.onstop=r), started=new Promise(r=>rec.onstart=r);
  rec.start(); await Promise.race([started,new Promise(r=>setTimeout(r,400))]);
  await new Promise(done=>{
    const start=performance.now();
    const step=now=>{
      const el=(now-start)/1000;
      at(Math.min(el,dur));
      dlVideo.textContent=`Recording… ${Math.max(1,Math.ceil(dur-el))}s`;
      if(el>=dur+2/FPS) return done();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  rec.stop(); await stopped;
  stream.getTracks().forEach(t=>t.stop());
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob(chunks,{type:mime}));
  a.download=`${S.style}-${STOPS[0].hex.slice(1).toLowerCase()}-${S.seed}-${w}x${h}-${+dur.toFixed(1)}s.${ext}`;
  a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),8000);
  cv.width=ow; cv.height=oh;
  recording=false; document.body.classList.remove('rec'); dlVideo.disabled=false; dlVideo.textContent='Download video';
  if(tlOpen) seek(head0); else build();
  playing=was; syncPlay();
  toast(`${ext.toUpperCase()} ${w}×${h} saved`);
});

