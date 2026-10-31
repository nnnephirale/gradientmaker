/* ══════════════════════════════════════════════════════════════
   COLOUR GENERATION
   ══════════════════════════════════════════════════════════════ */
function buildFamily(base,{tones,range,hueShift}){
  const out=[], hi=clamp(base.L+range*0.60,0.06,0.975), lo=clamp(base.L-range*0.40,0.06,0.975);
  for(let i=0;i<tones;i++){
    const t=tones===1?0.5:i/(tones-1);
    const L=hi+(lo-hi)*t, H=base.H+hueShift*(0.5-t)*2;
    /* riding a fraction of the gamut ceiling is what gives a chalky highlight
       and a dense shadow instead of a flat tint ramp */
    out.push(lch2hex(L,Math.min(base.C,maxC(L,H)*0.94),H));
  }
  return out;
}
function buildPalette(cols,{depth}){
  const n=cols.length;
  return cols.map((c,i)=>{
    const t=n===1?0.5:i/(n-1);
    const L=clamp(c.L+(0.5-t)*2*depth*0.20,0.06,0.975);
    return lch2hex(L,Math.min(c.C,maxC(L,c.H)*0.98),c.H);
  });
}

