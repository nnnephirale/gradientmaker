/* ══════════════════════════════════════════════════════════════
   COLOUR CORE — sRGB ⇄ linear ⇄ Oklab ⇄ OKLCH, gamut-safe
   ══════════════════════════════════════════════════════════════ */
const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v, D=Math.PI/180;
function hex2rgb(h){
  h=(h||'').trim().replace(/^#/,'');
  if(h.length===3) h=h.split('').map(c=>c+c).join('');
  if(!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const n=parseInt(h,16); return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];
}
const rgb2hex=c=>'#'+c.map(v=>Math.round(clamp(v)*255).toString(16).padStart(2,'0')).join('').toUpperCase();
const s2l=c=>c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);
const l2s=c=>c<=0.0031308?c*12.92:1.055*Math.pow(c,1/2.4)-0.055;
function lin2oklab(r,g,b){
  const l=Math.cbrt(0.4122214708*r+0.5363325363*g+0.0514459929*b);
  const m=Math.cbrt(0.2119034982*r+0.6806995451*g+0.1073969566*b);
  const s=Math.cbrt(0.0883024619*r+0.2817188376*g+0.6299787005*b);
  return [0.2104542553*l+0.7936177850*m-0.0040720468*s,
          1.9779984951*l-2.4285922050*m+0.4505937099*s,
          0.0259040371*l+0.7827717662*m-0.8086757660*s];
}
function oklab2lin(L,a,b){
  let l=L+0.3963377774*a+0.2158037573*b, m=L-0.1055613458*a-0.0638541728*b, s=L-0.0894841775*a-1.2914855480*b;
  l=l*l*l; m=m*m*m; s=s*s*s;
  return [ 4.0767416621*l-3.3077115913*m+0.2309699292*s,
          -1.2684380046*l+2.6097574011*m-0.3413193965*s,
          -0.0041960863*l-0.7034186147*m+1.7076147010*s];
}
const inG=(c,e=1e-4)=>c[0]>=-e&&c[0]<=1+e&&c[1]>=-e&&c[1]<=1+e&&c[2]>=-e&&c[2]<=1+e;
function hex2lch(hex){
  const rgb=hex2rgb(hex); if(!rgb) return null;
  const [L,a,b]=lin2oklab(...rgb.map(s2l));
  return {L,C:Math.hypot(a,b),H:(Math.atan2(b,a)/D+360)%360};
}
const lchLin=(L,C,H)=>oklab2lin(L,C*Math.cos(H*D),C*Math.sin(H*D));
function maxC(L,H){
  let lo=0,hi=0.42; if(inG(lchLin(L,hi,H))) return hi;
  for(let i=0;i<22;i++){const m=(lo+hi)/2; inG(lchLin(L,m,H))?lo=m:hi=m;}
  return lo;
}
function lch2hex(L,C,H){
  L=clamp(L,0,1); let lin=lchLin(L,C,H);
  if(!inG(lin)){ C=Math.min(C,maxC(L,H)); lin=lchLin(L,C,H); }
  return {hex:rgb2hex(lin.map(l2s)),L,C,H:(H%360+360)%360};
}

