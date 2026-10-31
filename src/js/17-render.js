/* ══════════════════════════════════════════════════════════════
   BUILD + RENDER
   ══════════════════════════════════════════════════════════════ */
const engine=()=>({direction:S.direction,seed:S.seed,scatter:S.scatter,bloom:S.bloom,
                   spread:spreadOf(S.softness),fall:falloffOf(S.softness)});
function currentStops(){
  const lch=S.colors.map(hex2lch).filter(Boolean);
  if(!lch.length) return [lch2hex(0.6,0.14,140)];
  return S.mode==='single'
    ? buildFamily(lch[0],{tones:S.tones,range:0.10+S.depth*0.55,hueShift:S.hueShift})
    : buildPalette(lch.slice(0,MAXP-1),{depth:S.depth});
}
/* flow reads its ramp from the same stops as soft: sorted dark → light and
   resampled to seven in Oklab, with a highlight lifted off the lightest.
   Sky keeps the colours in the order given — first at the top */
let FP=null;
function flowParams(){
  const sky=S.style==='sky';
  const labs=STOPS.map(s=>[s.L,s.C*Math.cos(s.H*D),s.C*Math.sin(s.H*D)]);
  if(!sky) labs.sort((a,b)=>a[0]-b[0]);
  const m=labs.length, c=[];
  const toRgb=([L,a,b])=>hex2rgb(lch2hex(L,Math.hypot(a,b),(Math.atan2(b,a)/D+360)%360).hex);
  for(let i=0;i<7;i++){
    const u=m===1?0:i/6*(m-1), k=Math.min(Math.floor(u),Math.max(m-2,0)), f=m===1?0:u-k;
    const A=labs[k], B=labs[Math.min(k+1,m-1)];
    c.push(...toRgb(A.map((v,j)=>v+(B[j]-v)*f)));
  }
  const top=sky?labs.reduce((a,b)=>b[0]>a[0]?b:a):labs[m-1];
  const hi=toRgb([Math.min(0.985,top[0]+0.12),top[1]*0.6,top[2]*0.6]);
  return {c,hi,band:sky?1:0,scale:S.scale,warp:S.fwarp,stretch:S.stretch,angle:S.direction,detail:S.detail,
    contrast:S.contrast,sheen:S.sheen,folds:S.folds,hatch:S.hatch,hatchGap:S.hatchGap,hatchAngle:S.hatchAngle,
    grain:S.grain*0.22,grainType:S.grainType,grainSize:S.grainSize,seed:(S.seed%1000)/10,speed:S.speed};
}
function render(w,h){
  if(S.style!=='soft'){ flowDraw(gl,FLOW,w,h,FP,ftime,S.outH/Math.max(h,1),grainTick()); return; }
  gl.useProgram(U.prog);
  gl.viewport(0,0,w,h);
  const n=Math.min(PTS.length,MAXP);
  const lab=new Float32Array(MAXP*3),pos=new Float32Array(MAXP*2),
        sig=new Float32Array(MAXP),gain=new Float32Array(MAXP);
  for(let i=0;i<n;i++){
    const p=PTS[i],{L,C,H}=p.lch;
    lab[i*3]=L; lab[i*3+1]=C*Math.cos(H*D); lab[i*3+2]=C*Math.sin(H*D);
    pos[i*2]=p.x; pos[i*2+1]=1-p.y;                 // GL origin is bottom-left
    sig[i]=p.sig; gain[i]=p.gain;
  }
  gl.uniform3fv(U.uLab,lab); gl.uniform2fv(U.uPos,pos);
  gl.uniform1fv(U.uSig,sig); gl.uniform1fv(U.uGain,gain);
  gl.uniform1i(U.uCount,n);
  gl.uniform1f(U.uAspect,w/h);
  gl.uniform1f(U.uPreserve,S.vivid);
  gl.uniform1f(U.uWarp,S.warp);
  gl.uniform1f(U.uFall,falloffOf(S.softness));
  gl.uniform1f(U.uSeed,(S.seed%997)/97);
  gl.uniform1f(U.uGrain,S.grain*0.22);
  /* export pixels covered by one fragment: 1 while exporting, >1 whenever the
     preview is showing the card smaller than it will be saved */
  const outScale=S.outH/Math.max(h,1);
  gl.uniform1f(U.uGrainSize,S.grainSize);
  gl.uniform1f(U.uGrainType,S.grainType);
  gl.uniform1f(U.uOutScale,outScale);
  gl.uniform1f(U.uSuper,outScale>1.15?1:0);
  gl.uniform1f(U.uHatch,S.hatch); gl.uniform1f(U.uHatchGap,S.hatchGap); gl.uniform1f(U.uHatchAngle,S.hatchAngle);
  gl.drawArrays(gl.TRIANGLES,0,3);
}
const ramp=document.getElementById('ramp'), card=document.getElementById('card');
function build(){
  STOPS=currentStops();
  PTS=layout(STOPS,engine());
  FP=flowParams();
  ramp.innerHTML=STOPS.map(s=>`<div style="background:${s.hex}" title="${s.hex}"></div>`).join('');
  card.style.borderRadius=S.radius+'px';
  render(cv.width,cv.height);
  syncPresets();
  afterEdit();
}
/* the cheap half of build, for frames where only the timeline moved */
function rebuildLight(){
  STOPS=currentStops(); PTS=layout(STOPS,engine()); FP=flowParams();
  render(cv.width,cv.height);
}
