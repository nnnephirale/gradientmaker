const cv=document.getElementById('gl');
const gl=cv.getContext('webgl',{preserveDrawingBuffer:true,antialias:false,alpha:false});
let U={};
(function initGL(){
  const sh=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
  const prog=gl.createProgram();
  gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS));
  gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS));
  gl.bindAttribLocation(prog,0,'p');          /* both programs read the quad from slot 0 */
  gl.linkProgram(prog); gl.useProgram(prog); U.prog=prog;
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=0;
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  ['uLab','uPos','uSig','uGain'].forEach(n=>U[n]=gl.getUniformLocation(prog,n+'[0]'));
  ['uCount','uAspect','uPreserve','uWarp','uFall','uSeed','uGrain',
   'uGrainSize','uGrainType','uOutScale','uSuper','uHatch','uHatchGap','uHatchAngle'].forEach(n=>U[n]=gl.getUniformLocation(prog,n));
})();
const FLOW=flowProgram(gl,VS,FLOW_FS);
/* what this device can actually draw into — 16384 on desktop, 4096 on plenty
   of older and mobile GPUs */
const MAXBUF=Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_VIEWPORT_DIMS)[0]);

