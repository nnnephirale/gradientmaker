/* ══════════════════════════════════════════════════════════════
   FLOW — moving silk, folded from the Superhuman texture study
   (34_DESIGNSYSTEMS/superhuman/shader). Two-pass domain warp over fbm,
   a five-stop ramp dark → light, sheen ridges where the field folds.
   Grain and hatch are the studio's own, measured in exported pixels.
   ══════════════════════════════════════════════════════════════ */
const FLOW_FS=`
precision highp float;
uniform vec2  uRes;
uniform float uTime,uSeed,uOutScale,uSuper,uGrainSeed;
uniform vec3  uC[7];
uniform vec3  uHi;
uniform float uScale,uWarp,uStretch,uAngle,uDetail,uContrast,uSheen,uFolds;
uniform float uHatch,uHatchGap,uHatchAngle,uBand;
uniform float uGrain,uGrainType,uGrainSize;

vec2 h2(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return -1.0+2.0*fract(sin(p)*43758.5453123); }
float noise(vec2 p){                  /* gradient noise, quintic fade */
  vec2 i=floor(p),f=fract(p),u=f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(dot(h2(i),f),dot(h2(i+vec2(1,0)),f-vec2(1,0)),u.x),
             mix(dot(h2(i+vec2(0,1)),f-vec2(0,1)),dot(h2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p){                    /* fractional octave count = soft Detail slider */
  float a=0.5,s=0.0,n=0.0;
  mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<6;i++){
    float w=clamp(uDetail-float(i),0.0,1.0);
    s+=a*w*noise(p); n+=a*w; p=m*p; a*=0.5;
  }
  return s/max(n,1e-3);
}
vec3 ramp(float t){
  t=clamp(t,0.0,1.0)*6.0;
  vec3 c=uC[0];
  for(int i=1;i<7;i++) c=mix(c,uC[i],smoothstep(float(i-1),float(i),t));
  return c;
}
mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float hash13(vec3 p3){ p3=fract(p3*0.1031); p3+=dot(p3,p3.zyx+31.32); return fract((p3.x+p3.y)*p3.z); }
float gcell(vec2 p,float ch){
  float s=ch+uGrainSeed*7.31;
  return (hash13(vec3(p,s))+hash13(vec3(p,s+19.7))+hash13(vec3(p,s+53.3))-1.5)*0.5774;
}
float gsmooth(vec2 p,float ch){
  vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
  return mix(mix(gcell(i,ch),gcell(i+vec2(1,0),ch),u.x),mix(gcell(i+vec2(0,1),ch),gcell(i+vec2(1,1),ch),u.x),u.y)*1.72;
}
float gsample(vec2 opx,float ch){
  float sz=max(uGrainSize,0.001);
  if(sz<1.0) return gcell(floor(opx),ch)*sz;
  vec2 p=opx/sz;
  return mix(gcell(floor(p),ch),gsmooth(p,ch),smoothstep(1.0,1.6,sz));
}
float grainAt(vec2 opx,float ch){
  if(uSuper>0.5){
    float o=uOutScale*0.25;
    return (gsample(opx+vec2(-o,-o),ch)+gsample(opx+vec2(o,-o),ch)+gsample(opx+vec2(-o,o),ch)+gsample(opx+vec2(o,o),ch))*0.25;
  }
  return gsample(opx,ch);
}
${HATCH_GLSL}

void main(){
  vec2 p=(gl_FragCoord.xy-0.5*uRes)/uRes.y;   /* height-relative, so preview = export */
  float t=uTime;
  /* rotate, then stretch along one axis: long silky streaks */
  vec2 q=rot(radians(uAngle))*p;
  q.x/=uStretch;
  q=q*uScale*2.0+uSeed;
  /* two-pass domain warp — flowing, folded fabric of colour */
  vec2 w1=vec2(fbm(q+vec2(0.0,0.11*t)),fbm(q+vec2(5.2,1.3)-0.08*t));
  vec2 w2=vec2(fbm(q+uWarp*w1+vec2(1.7,9.2)+0.05*t),fbm(q+uWarp*w1+vec2(8.3,2.8)-0.06*t));
  float f=fbm(q+uWarp*w2)*0.5+0.5;
  f=clamp((f-0.5)*uContrast*1.6+0.5,0.0,1.0);
  /* sky: the ramp runs down the frame in order, and the warped field only
     nudges it — wide banded sky with soft wavy seams */
  if(uBand>0.5){ float along=-(rot(radians(uAngle))*p).y; f=clamp(0.5+along*1.04+(f-0.5)*0.42,0.0,1.0); }
  vec3 col=ramp(f);
  /* sheen: thin bright ridges where the warped field folds over itself */
  float ridge=abs(sin(3.14159*(f*uFolds+length(w2)*0.9)));
  float sh=pow(1.0-ridge,8.0)*smoothstep(0.25,0.75,f);
  col=mix(col,uHi,sh*uSheen);
  /* iridescent drift: a tiny hue lean along the warp keeps flat areas alive */
  col+=(vec3(0.02,-0.01,0.03)*w1.x+vec3(-0.02,0.015,0.01)*w2.y)*0.8;
  if(uHatch>0.0001){
    float spots=smoothstep(0.42,0.62,fbm(p*1.1+vec2(3.1,7.4)+0.02*t+uSeed)*0.5+0.5);
    col=mix(col,vec3(1.0),hatchLine()*spots*uHatch*0.6);
  }
  col=clamp(col,0.0,1.0);
  if(uGrain>0.0001){
    vec2 opx=gl_FragCoord.xy*uOutScale;
    vec3 g;
    if(uGrainType<0.5){ g=vec3(grainAt(opx,0.0)); }
    else if(uGrainType<1.5){ g=vec3(grainAt(opx,0.0),grainAt(opx,71.0),grainAt(opx,137.0)); }
    else if(uGrainType<2.5){
      float fg=grainAt(opx,0.0)*0.74+grainAt(opx*2.31,29.0)*0.26;
      float lum=dot(col,vec3(0.2126,0.7152,0.0722));
      g=vec3(fg*mix(0.30,1.0,clamp(4.0*lum*(1.0-lum),0.0,1.0)));
    }else{
      float s=grainAt(opx,0.0);
      g=vec3(sign(s)*smoothstep(0.34,0.78,abs(s))*2.1);
    }
    col+=g*uGrain;
  }
  col+=(hash13(vec3(gl_FragCoord.xy,uSeed))-0.5)/255.0;   /* kill 8-bit banding */
  gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
}`;
/* These three functions are written to stand alone — no outside variables —
   because Copy code pastes their source straight into the snippet. The app and
   the embed therefore draw with literally the same code. */
function flowProgram(g,vs,fs){
  function sh(t,src){var s=g.createShader(t);g.shaderSource(s,src);g.compileShader(s);
    if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw new Error(g.getShaderInfoLog(s));return s;}
  var p=g.createProgram();
  g.attachShader(p,sh(g.VERTEX_SHADER,vs)); g.attachShader(p,sh(g.FRAGMENT_SHADER,fs));
  g.bindAttribLocation(p,0,'p'); g.linkProgram(p);
  var L={},names=['uRes','uTime','uSeed','uOutScale','uSuper','uGrainSeed','uHi','uScale','uWarp','uStretch',
    'uAngle','uDetail','uContrast','uSheen','uFolds','uHatch','uHatchGap','uHatchAngle','uGrain','uGrainType','uGrainSize','uBand'];
  for(var i=0;i<names.length;i++) L[names[i]]=g.getUniformLocation(p,names[i]);
  L.uC=g.getUniformLocation(p,'uC[0]');
  return {p:p,L:L};
}
function flowQuad(g){
  g.bindBuffer(g.ARRAY_BUFFER,g.createBuffer());
  g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),g.STATIC_DRAW);
  g.enableVertexAttribArray(0); g.vertexAttribPointer(0,2,g.FLOAT,false,0,0);
}
/* os = exported pixels per drawn pixel (grain + hatch sizes); tick re-rolls the
   grain while it moves, so it reads as film rather than a dirty screen */
function flowDraw(g,F,w,h,P,t,os,tick){
  var L=F.L; g.useProgram(F.p); g.viewport(0,0,w,h);
  g.uniform2f(L.uRes,w,h); g.uniform1f(L.uTime,t); g.uniform1f(L.uSeed,P.seed);
  g.uniform1f(L.uOutScale,os); g.uniform1f(L.uSuper,os>1.15?1:0);
  g.uniform1f(L.uGrainSeed,P.seed*3.1+(tick%997)*1.618);
  g.uniform3fv(L.uC,P.c); g.uniform3fv(L.uHi,P.hi);
  g.uniform1f(L.uScale,P.scale); g.uniform1f(L.uWarp,P.warp); g.uniform1f(L.uStretch,P.stretch);
  g.uniform1f(L.uAngle,P.angle); g.uniform1f(L.uDetail,P.detail); g.uniform1f(L.uContrast,P.contrast);
  g.uniform1f(L.uSheen,P.sheen); g.uniform1f(L.uFolds,P.folds); g.uniform1f(L.uBand,P.band||0);
  g.uniform1f(L.uHatch,P.hatch); g.uniform1f(L.uHatchGap,P.hatchGap); g.uniform1f(L.uHatchAngle,P.hatchAngle);
  g.uniform1f(L.uGrain,P.grain); g.uniform1f(L.uGrainType,P.grainType); g.uniform1f(L.uGrainSize,P.grainSize);
  g.drawArrays(g.TRIANGLES,0,3);
}

