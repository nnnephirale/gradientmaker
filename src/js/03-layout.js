/* ══════════════════════════════════════════════════════════════
   LAYOUT
   ══════════════════════════════════════════════════════════════ */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function layout(stops,o){
  const rnd=mulberry32((o.seed|0)+1), n=stops.length;
  const a=(o.direction-90)*D, ca=Math.cos(a), sa=Math.sin(a);
  const place=(u,v)=>({x:0.5+(u*ca-v*sa)*0.70, y:0.5+(u*sa+v*ca)*0.70});
  const pts=[];
  for(let i=0;i<n;i++){
    const t=n===1?0.5:i/(n-1);
    /* along the flow axis — the dial points at the light end; ends run past
       the frame so they own the corners */
    const u=(0.5-t)*1.62+(rnd()-0.5)*0.22*o.scatter;
    /* zig-zag across it — this is what turns a linear ramp into a mesh */
    const v=(i%2?1:-1)*(0.14+0.50*rnd())*o.scatter;
    pts.push({...place(u,v), sig:o.spread*(0.60+0.40*rnd())*(1.05/Math.sqrt(n)+0.30), gain:1, lch:stops[i]});
  }
  if(o.bloom>0.001){                    /* soft hot-spot of the lightest tone */
    /* this used to take the colour of whichever stop was lightest — a discrete
       argmax. Depth drives the stops' lightness in opposite directions, so two
       colours of similar lightness swap places partway along the slider and the
       highlight snapped from one hue to the other in a single step. Weighting
       the stops by lightness hands over gradually instead. The falloff is set
       so only stops within roughly 0.05 of the leader get a real say. */
    /* finite support, not an exponential: a stop more than BLOOM_TIE below the
       leader contributes exactly nothing, so every palette with a clear
       lightest tone renders bit-identically to before. Only a genuine near-tie
       — the situation that used to snap — mixes at all. */
    const BLOOM_TIE=0.08;
    let hi=stops[0].L; stops.forEach(s=>{ if(s.L>hi) hi=s.L; });
    let wsum=0,L=0,C=0,dx=0,dy=0;
    stops.forEach(s=>{
      const u=Math.min((hi-s.L)/BLOOM_TIE,1), w=(1-u)*(1-u);
      if(w<=0) return;
      wsum+=w; L+=w*s.L; C+=w*s.C; dx+=w*Math.cos(s.H*D); dy+=w*Math.sin(s.H*D);
    });
    L/=wsum; C/=wsum; dx/=wsum; dy/=wsum;
    /* mean chroma magnitude with the mean hue DIRECTION, rather than a straight
       Oklab average: blending two hues component-wise would sink the highlight
       toward grey exactly at the handover, which is the moment it is most seen */
    const dl=Math.hypot(dx,dy);
    const H=dl>1e-6?(Math.atan2(dy,dx)/D+360)%360:stops[0].H;
    pts.push({...place(0.10+0.34*rnd(),(rnd()*2-1)*0.42), sig:o.spread*(0.34+0.14*rnd()), gain:o.bloom*1.7, lch:{L,C,H}});
  }
  return pts;
}

