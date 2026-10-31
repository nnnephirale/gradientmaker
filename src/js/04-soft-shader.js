/* ══════════════════════════════════════════════════════════════
   WEBGL
   ══════════════════════════════════════════════════════════════ */
const MAXP=12;
/* hatch: fine parallel hairlines in EXPORTED pixels, like the grain. When the
   preview is minified one fragment spans several export pixels, so the line
   edge widens with the footprint instead of aliasing into moire. */
const HATCH_GLSL=`
float hatchLine(){
  float a=radians(uHatchAngle);
  vec2 hp=gl_FragCoord.xy*uOutScale;
  float x=cos(a)*hp.x+sin(a)*hp.y;
  float d=abs(fract(x/uHatchGap)-0.5)*uHatchGap;
  float w=max(uOutScale,1.0);
  return 1.0-smoothstep(0.55-0.35*w,0.55+0.35*w,d);
}`;
const VS=`attribute vec2 p;varying vec2 vUv;void main(){vUv=p*0.5+0.5;gl_Position=vec4(p,0.,1.);}`;
const FS=`
precision highp float;
varying vec2 vUv;
uniform vec3  uLab[${MAXP}];
uniform vec2  uPos[${MAXP}];
uniform float uSig[${MAXP}];
uniform float uGain[${MAXP}];
uniform int   uCount;
uniform float uAspect,uPreserve,uWarp,uFall,uSeed,uGrain;
uniform float uGrainSize,uGrainType,uOutScale,uSuper;
uniform float uHatch,uHatchGap,uHatchAngle;
${HATCH_GLSL}

float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
/* the old hash multiplied x by y, which lays faint diagonals through the field
   once the grain is fine enough to see. This one (Hoskins) has no such axis. */
float hash13(vec3 p3){
  p3=fract(p3*0.1031);
  p3+=dot(p3,p3.zyx+31.32);
  return fract((p3.x+p3.y)*p3.z);
}
/* three uniforms summed make a bell curve. Uniform noise fires every value
   equally often and reads as television static; a bell spends most of its time
   near zero and only occasionally throws a strong speck — which is what film
   grain and Photoshop's gaussian noise actually look like. */
float gcell(vec2 p,float ch){
  float s=ch+uSeed*7.31;
  return (hash13(vec3(p,s))+hash13(vec3(p,s+19.7))+hash13(vec3(p,s+53.3))-1.5)*0.5774;
}
/* above one pixel the grain must grow as soft clumps, never as hard squares —
   floor() alone is what produced the fat blocks */
float gsmooth(vec2 p,float ch){
  vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
  return mix(mix(gcell(i,ch),          gcell(i+vec2(1,0),ch),u.x),
             mix(gcell(i+vec2(0,1),ch),gcell(i+vec2(1,1),ch),u.x),u.y)*1.72;
}
/* at or below one export pixel the cells are crisp; above it they blend into
   clumps. The crossfade matters because the size slider is scrubbed by hand —
   a hard switch at 1px pops as the pointer crosses it */
float gsample(vec2 opx,float ch){
  float sz=max(uGrainSize,0.001);
  /* below one pixel the grain is finer than the image can hold. Point-sampling
     it would keep full strength and simply relabel the same static, so the
     whole sub-pixel half of the slider would do nothing to the exported PNG.
     Averaging it over the pixel is what a real downsample does, and averaging
     1/sz² independent cells scales the amplitude by sz — so the range reads as
     "finer therefore quieter" and the preview keeps telling the truth. */
  if(sz<1.0) return gcell(floor(opx),ch)*sz;
  vec2 p=opx/sz;
  return mix(gcell(floor(p),ch),gsmooth(p,ch),smoothstep(1.0,1.6,sz));
}
/* when the preview is minified one fragment covers several export pixels, so
   the footprint is averaged rather than point-sampled: the same reason a
   downscaled photo looks smooth instead of crawling */
float grainAt(vec2 opx,float ch){
  if(uSuper>0.5){
    float o=uOutScale*0.25;
    return (gsample(opx+vec2(-o,-o),ch)+gsample(opx+vec2(o,-o),ch)
           +gsample(opx+vec2(-o, o),ch)+gsample(opx+vec2(o, o),ch))*0.25;
  }
  return gsample(opx,ch);
}
float vnoise(vec2 p){
  vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),u.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),u.x),u.y);
}
vec3 oklab2lin(vec3 c){
  float l=c.x+0.3963377774*c.y+0.2158037573*c.z;
  float m=c.x-0.1055613458*c.y-0.0638541728*c.z;
  float s=c.x-0.0894841775*c.y-1.2914855480*c.z;
  l=l*l*l; m=m*m*m; s=s*s*s;
  return vec3( 4.0767416621*l-3.3077115913*m+0.2309699292*s,
              -1.2684380046*l+2.6097574011*m-0.3413193965*s,
              -0.0041960863*l-0.7034186147*m+1.7076147010*s);
}
bool inG(vec3 c){ return all(greaterThanEqual(c,vec3(-0.0015)))&&all(lessThanEqual(c,vec3(1.0015))); }
vec3 lin2srgb(vec3 c){ c=clamp(c,0.0,1.0); return mix(c*12.92,1.055*pow(c,vec3(1.0/2.4))-0.055,step(vec3(0.0031308),c)); }

void main(){
  vec2 uv=vUv;
  if(uWarp>0.0001){
    uv+=(vec2(vnoise(uv*2.05+uSeed*3.71),vnoise(uv*2.35+uSeed*1.93+19.7))-0.5)*uWarp;
  }
  vec2 p=vec2(uv.x*uAspect,uv.y);
  float wsum=0.0,Lsum=0.0,Csum=0.0; vec2 absum=vec2(0.0),dirsum=vec2(0.0);
  for(int i=0;i<${MAXP};i++){
    if(i>=uCount) break;
    vec2 d=p-vec2(uPos[i].x*uAspect,uPos[i].y);
    float dd=dot(d,d)/max(uSig[i]*uSig[i],1e-5);
    float w=(exp(-dd*uFall)+0.0012/(dd+0.02))*uGain[i];
    vec2 ab=uLab[i].yz; float C=length(ab);
    wsum+=w; Lsum+=w*uLab[i].x; absum+=w*ab; Csum+=w*C;
    dirsum+= C>1e-5 ? w*(ab/C) : vec2(0.0);
  }
  float L=Lsum/wsum; vec2 abLin=absum/wsum; float Cmean=Csum/wsum;
  vec2 dsum=dirsum/wsum; float dl=length(dsum);
  /* chroma-preserving branch: keep the weighted hue direction but restore the
     mean chroma, so a blend between hues never sinks toward grey. Only true
     opposites (dl→0) are allowed to desaturate, and softly. */
  vec2 abKeep = dl>1e-4 ? (dsum/dl)*Cmean*smoothstep(0.0,0.34,dl) : abLin;
  vec2 ab=mix(abLin,abKeep,uPreserve);

  vec3 lin=oklab2lin(vec3(L,ab));
  if(!inG(lin)){                       /* gamut map by chroma, never hue-clip */
    float lo=0.0,hi=1.0;
    for(int k=0;k<12;k++){ float m=(lo+hi)*0.5; if(inG(oklab2lin(vec3(L,ab*m)))) lo=m; else hi=m; }
    lin=oklab2lin(vec3(L,ab*lo));
  }
  vec3 col=lin2srgb(lin);
  if(uHatch>0.0001){                   /* hairlines in soft patches, not everywhere */
    float spots=smoothstep(0.42,0.62,vnoise(uv*2.2+vec2(3.1,7.4)+uSeed)*0.65+vnoise(uv*4.7+vec2(1.3,2.9)+uSeed)*0.35);
    col=mix(col,vec3(1.0),hatchLine()*spots*uHatch*0.6);
  }
  if(uGrain>0.0001){
    /* grain is measured in EXPORTED pixels, not preview pixels: a 1px grain is
       one pixel of the saved PNG no matter what the card is showing */
    vec2 opx=gl_FragCoord.xy*uOutScale;
    vec3 g;
    if(uGrainType<0.5){                    /* fine — monochrome, one channel */
      g=vec3(grainAt(opx,0.0));
    }else if(uGrainType<1.5){              /* colour — three independent draws */
      g=vec3(grainAt(opx,0.0),grainAt(opx,71.0),grainAt(opx,137.0));
    }else if(uGrainType<2.5){              /* film — clumps, plus emulsion falloff */
      float f=grainAt(opx,0.0)*0.74+grainAt(opx*2.31,29.0)*0.26;
      float lum=dot(col,vec3(0.2126,0.7152,0.0722));
      /* silver sits thickest in the midtones — grain that ignores this eats the
         shadows and dirties the highlights */
      g=vec3(f*mix(0.30,1.0,clamp(4.0*lum*(1.0-lum),0.0,1.0)));
    }else{                                 /* speckle — only the tail survives */
      float s=grainAt(opx,0.0);
      g=vec3(sign(s)*smoothstep(0.34,0.78,abs(s))*2.1);
    }
    col+=g*uGrain;
  }
  col+=(hash13(vec3(gl_FragCoord.xy,uSeed))-0.5)/255.0;   /* kill 8-bit banding */
  gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
}`;

