/* ══════════════════════════════════════════════════════════════
   EXPORT
   ══════════════════════════════════════════════════════════════ */
function toast(msg,action){
  const t=document.getElementById('toast');
  t.innerHTML=msg; t.classList.add('on'); t.classList.toggle('act',!!action);
  t.onclick=action?()=>{ t.classList.remove('on'); action(); }:null;
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('on'),action?3200:1600);
}
document.getElementById('dlPng').addEventListener('click',()=>{
  const w=S.outW, h=S.outH, ow=cv.width, oh=cv.height;
  cv.width=w; cv.height=h; render(w,h);
  cv.toBlob(bl=>{
    const a=document.createElement('a');
    a.href=URL.createObjectURL(bl);
    a.download=`${S.style==='soft'?'gradient':S.style}-${STOPS[0].hex.slice(1).toLowerCase()}-${S.seed}-${w}x${h}.png`;
    a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    cv.width=ow; cv.height=oh; render(ow,oh);
    toast(`PNG ${w}×${h} saved`);
  },'image/png');
});
document.getElementById('copyCss').addEventListener('click',()=>{
  /* first layer paints on top in CSS, so reverse: the highlight sits over the field */
  const layers=PTS.slice().reverse().map(p=>{
    const r=Math.round(p.sig*185*(p.gain>1?0.75:1));
    const c=lch2hex(p.lch.L,p.lch.C,p.lch.H).hex;
    return `  radial-gradient(${r}% ${r}% at ${(p.x*100).toFixed(1)}% ${(p.y*100).toFixed(1)}%, ${c} 0%, ${c}00 76%)`;
  });
  const css=`background-color: ${STOPS[Math.floor(STOPS.length/2)].hex};\nbackground-image:\n${layers.join(',\n')};`;
  navigator.clipboard.writeText(css).then(()=>toast('CSS copied — approximate, no grain'),()=>toast('Copy blocked'));
});
/* a live snippet: one div, one canvas, one script. It draws with the same
   three functions the studio uses, sizes itself to its box, pauses off-screen
   and holds a still frame for anyone who asks for reduced motion. */
function embedCode(){
  const P={...FP}, fallback=`linear-gradient(${S.direction}deg,${[0,1,2,3,4,5,6].map(i=>rgb2hex(P.c.slice(i*3,i*3+3))).join(',')})`;
  const js=`(function(){
var box=document.currentScript.parentNode,cv=box.querySelector('canvas');
var g=cv.getContext('webgl',{antialias:false,alpha:false});
if(!g){box.style.background=${JSON.stringify(fallback)};return;}
var P=${JSON.stringify(P)};
var VS=${JSON.stringify(VS)};
var FS=${JSON.stringify(FLOW_FS)};
${flowProgram.toString()}
${flowQuad.toString()}
${flowDraw.toString()}
var F=flowProgram(g,VS,FS);flowQuad(g);
var t=${ftime.toFixed(3)},clock=0,last=0,raf=0,seen=true,d=1;
var still=matchMedia('(prefers-reduced-motion: reduce)').matches;
function size(){var r=box.getBoundingClientRect();d=Math.min(window.devicePixelRatio||1,2);
  cv.width=Math.max(2,Math.round(r.width*d));cv.height=Math.max(2,Math.round(r.height*d));}
function draw(){flowDraw(g,F,cv.width,cv.height,P,t,1/d,Math.floor(clock*24));}
function loop(now){raf=0;if(!seen||still||document.hidden)return;var dt=Math.min(.05,(now-last)/1000);last=now;
  t+=dt*P.speed;clock+=dt;draw();raf=requestAnimationFrame(loop);}
function go(){if(!raf&&seen&&!still&&!document.hidden){last=performance.now();raf=requestAnimationFrame(loop);}}
new ResizeObserver(function(){size();draw();}).observe(box);
new IntersectionObserver(function(e){seen=e[0].isIntersecting;go();}).observe(box);
document.addEventListener('visibilitychange',go);
})();`;
  return `<!-- Gradient Studio · ${S.style==='sky'?'Sky':'Flow'} texture (live WebGL, pauses off-screen) -->
<div style="position:relative;width:100%;aspect-ratio:${S.outW} / ${S.outH};border-radius:${S.radius}px;overflow:hidden;background:${fallback}">
<canvas aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;display:block"></canvas>
<script>${js}<\/script>
</div>`;
}
document.getElementById('copyCode').addEventListener('click',()=>{
  navigator.clipboard.writeText(embedCode()).then(()=>toast('Code copied — paste it into any page'),()=>toast('Copy blocked'));
});

