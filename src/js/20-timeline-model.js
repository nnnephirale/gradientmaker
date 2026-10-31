/* ══════════════════════════════════════════════════════════════
   TIMELINE — keys lock the settings at a moment; between them every
   number eases, colours blend in Oklab and the direction takes the
   short way round. Choices (seed, grain type, colour count) hold.
   ══════════════════════════════════════════════════════════════ */
const TWEEN_NUM=['depth','softness','grain','grainSize','scatter','warp','bloom','vivid','hueShift',
  'scale','fwarp','stretch','detail','speed','contrast','sheen','folds','hatch','hatchGap','hatchAngle'];
const TWEEN_HOLD=['seed','grainType','mode','tones'];
const FPS=30, qt=t=>Math.round(t*FPS)/FPS, DURMAX=60;
let tlOpen=false, head=0, applying=false, recording=false, KEYCLIP=null;
const sel=new Set();
const tl=document.getElementById('tl'), tlPlay=document.getElementById('tlPlay'),
      tlTrack=document.getElementById('tlTrack'), tlLane=document.getElementById('tlLane'),
      tlKeys=document.getElementById('tlKeys'), tlHead=document.getElementById('tlHead'),
      tlNow=document.getElementById('tlNow'), tlDur=document.getElementById('tlDur'),
      tlLoop=document.getElementById('tlLoop'), tlLoopZ=document.getElementById('tlLoopZ'),
      tlTicks=document.getElementById('tlTicks'), tlEmpty=document.getElementById('tlEmpty'),
      toggleTl=document.getElementById('toggleTl'), lenIn=document.getElementById('lenIn');
const uid=()=>Math.random().toString(36).slice(2,10);
const keyVals=()=>{
  const v={direction:S.direction,colors:S.colors.slice()};
  TWEEN_NUM.forEach(k=>v[k]=S[k]); TWEEN_HOLD.forEach(k=>v[k]=S[k]);
  return v;
};
const easeU=u=>S.ease==='linear'?u:u*u*(3-2*u);
function mixHex(x,y,u){
  const A=hex2lch(x),B=hex2lch(y); if(!A||!B) return x;
  const a=[A.L,A.C*Math.cos(A.H*D),A.C*Math.sin(A.H*D)], b=[B.L,B.C*Math.cos(B.H*D),B.C*Math.sin(B.H*D)];
  const m=a.map((v,i)=>v+(b[i]-v)*u);
  return lch2hex(m[0],Math.hypot(m[1],m[2]),Math.atan2(m[2],m[1])/D).hex;
}
function mixVals(a,b,u){
  const v={...a,colors:a.colors.slice()};
  if(u<=0) return v;
  TWEEN_NUM.forEach(k=>v[k]=a[k]+(b[k]-a[k])*u);
  const d=((b.direction-a.direction)%360+540)%360-180;
  v.direction=((a.direction+d*u)%360+360)%360;
  if(a.mode===b.mode&&a.colors.length===b.colors.length) v.colors=a.colors.map((h,i)=>mixHex(h,b.colors[i],u));
  return v;
}
/* which two keys a moment sits between, and how far along — loop adds a last
   leg from the final key back to the first, landing exactly at the end */
function segAt(t){
  const K=S.keys, n=K.length;
  if(!n) return null;
  if(t<=K[0].t) return {a:K[0].v,b:K[0].v,u:0};
  for(let i=0;i<n-1;i++) if(t<K[i+1].t) return {a:K[i].v,b:K[i+1].v,u:easeU((t-K[i].t)/(K[i+1].t-K[i].t))};
  const L=K[n-1];
  if(S.loop&&n>1&&S.dur-L.t>1e-6) return {a:L.v,b:K[0].v,u:easeU(clamp((t-L.t)/(S.dur-L.t)))};
  return {a:L.v,b:L.v,u:0};
}
function evalAt(t){ const s=segAt(t); return s&&mixVals(s.a,s.b,s.u); }
/* the flow's drift is speed integrated over time, so a key that changes the
   speed bends the motion instead of jumping it */
function flowTimeAt(t){
  if(!S.keys.length) return S.speed*t;
  const n=Math.max(1,Math.ceil(t*FPS)), dt=t/n; let s=0;
  for(let i=0;i<n;i++){ const g=segAt((i+.5)*dt); s+=(g.a.speed+(g.b.speed-g.a.speed)*g.u)*dt; }
  return s;
}
