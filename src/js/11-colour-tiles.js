/* ══════════════════════════════════════════════════════════════
   COLOUR TILES — the swatch is the picker; it opens in place
   ══════════════════════════════════════════════════════════════ */
/* the picker itself speaks HSB — the familiar hue / saturation / brightness of
   every design tool. Oklab is for blending, not for choosing. */
function rgb2hsv([r,g,b]){
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
  let h=0;
  if(d) h=60*(mx===r ? ((g-b)/d+(g<b?6:0)) : mx===g ? ((b-r)/d+2) : ((r-g)/d+4));
  return {h, s: mx?d/mx:0, v: mx};
}
function hsv2rgb(h,s,v){
  h=((h%360)+360)%360;
  const c=v*s, x=c*(1-Math.abs((h/60)%2-1)), m=v-c;
  const t=[[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][Math.floor(h/60)%6];
  return [t[0]+m,t[1]+m,t[2]+m];
}
/* the Photoshop pipette: fat bulb up-right, hairline point down-left */
const ICON_DROP=`<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
  <g transform="rotate(-45 8 8)">
    <rect x="5.9" y="1.3" width="4.2" height="3.9" rx="1.5"/>
    <rect x="6.7" y="4.6" width="2.6" height="5.7"/>
    <path d="M6.7 10.1h2.6L8 14.7 6.7 10.1Z"/>
  </g></svg>`;

const tileHost=document.getElementById('tileHost');
let openIdx=-1;
function setOpen(idx){
  openIdx=idx;
  [...tileHost.children].forEach((w,j)=>w.classList.toggle('open',j===idx));
}

function renderTiles(){
  tileHost.innerHTML='';
  const single=S.mode==='single';
  const list=single?S.colors.slice(0,1):S.colors;
  list.forEach((hex,i)=>{
    const wrap=document.createElement('div');
    wrap.className='tilewrap'+(openIdx===i?' open':'');
    wrap.innerHTML=`
      <div class="tile${single?' solo':''}${!single&&S.colors.length<3?' solo':''}">
        <input class="hex" value="${hex}" spellcheck="false" maxlength="7">
        <span class="spacer"></span>
        <span class="chev"><span></span><span></span></span>
        <button class="kill" title="Remove">×</button>
      </div>
      <div class="pickwrap"><div class="pick"><div class="pickinner">
        <div class="pad"><div class="dot"></div></div>
        <div class="hue"><div class="dot"></div></div>
        <div class="pickfoot">
          <label class="fld" data-f="h"><b>H</b><input inputmode="numeric" aria-label="Hue"><i>°</i></label>
          <label class="fld" data-f="s"><b>S</b><input inputmode="numeric" aria-label="Saturation"><i>%</i></label>
          <label class="fld" data-f="v"><b>B</b><input inputmode="numeric" aria-label="Brightness"><i>%</i></label>
          <button class="eyedrop off" type="button" title="Pick a colour off the screen">${ICON_DROP}</button>
        </div>
      </div></div></div>`;
    const tile=wrap.querySelector('.tile'), tx=wrap.querySelector('.hex'),
          pad=wrap.querySelector('.pad'), padDot=pad.querySelector('.dot'),
          hue=wrap.querySelector('.hue'), hueDot=hue.querySelector('.dot'),
          eye=wrap.querySelector('.eyedrop'),
          flds={h:wrap.querySelector('[data-f=h] input'),
                s:wrap.querySelector('[data-f=s] input'),
                v:wrap.querySelector('[data-f=v] input')};

    /* hue and saturation survive a trip through grey or black, which they
       would not if we re-derived them from the hex every time */
    const mem=rgb2hsv(hex2rgb(S.colors[i])||[0,0,0]);
    function syncMem(){
      const n=rgb2hsv(hex2rgb(S.colors[i])||[0,0,0]);
      if(n.s>0.004) mem.h=n.h;
      if(n.v>0.004) mem.s=n.s;
      mem.v=n.v;
    }
    function paintTile(){
      const c=hex2lch(S.colors[i])||{L:.6}, fg=c.L>0.62?'#000':'#fff';
      tile.style.background=S.colors[i]; tile.style.color=fg;
      tile.querySelector('.kill').style.color=fg;
      tx.style.color=fg;
      if(document.activeElement!==tx) tx.value=S.colors[i];
    }
    function paintPicker(){
      const hueHex=rgb2hex(hsv2rgb(mem.h,1,1));
      pad.style.background=`linear-gradient(to top,#000,rgba(0,0,0,0)),linear-gradient(to right,#FFF,${hueHex})`;
      padDot.style.left=(mem.s*100)+'%';
      padDot.style.top =((1-mem.v)*100)+'%';
      hueDot.style.left=(mem.h/360*100)+'%';
      const shown={h:Math.round(mem.h),s:Math.round(mem.s*100),v:Math.round(mem.v*100)};
      for(const k in flds) if(document.activeElement!==flds[k]) flds[k].value=shown[k];
    }
    function setColor(hexNew,keepMem){
      S.colors[i]=hexNew;
      if(!keepMem) syncMem();
      paintTile(); paintPicker(); build();
    }
    const applyHsv=()=>setColor(rgb2hex(hsv2rgb(mem.h,mem.s,mem.v)),true);

    /* open / close — toggle the class on the live DOM. Re-rendering here would
       hand the browser fresh nodes already in their end state, and the CSS
       transitions would never run. */
    tile.addEventListener('click',e=>{
      if(e.target.closest('.hex')||e.target.closest('.kill')) return;
      setOpen(openIdx===i ? -1 : i);
      if(openIdx===i) paintPicker();
    });
    tx.addEventListener('input',e=>{
      let v=e.target.value.trim(); if(v && v[0]!=='#') v='#'+v;
      const rgb=hex2rgb(v); if(!rgb) return;
      setColor(rgb2hex(rgb));
    });
    tx.addEventListener('blur',paintTile);
    wrap.querySelector('.kill').addEventListener('click',e=>{
      e.stopPropagation();
      if(S.colors.length<3) return;
      S.colors.splice(i,1); openIdx=-1; renderTiles(); build();
    });

    /* pad → saturation × brightness */
    const grab=(el,fn)=>{
      let on=false;
      el.addEventListener('pointerdown',e=>{on=true;try{el.setPointerCapture(e.pointerId)}catch(x){};fn(e);});
      el.addEventListener('pointermove',e=>{if(on)fn(e);});
      el.addEventListener('pointerup',e=>{on=false;try{el.releasePointerCapture(e.pointerId)}catch(x){}});
      el.addEventListener('pointercancel',()=>{on=false});
    };
    grab(pad,e=>{
      const r=pad.getBoundingClientRect();
      mem.s=clamp((e.clientX-r.left)/r.width);
      mem.v=1-clamp((e.clientY-r.top)/r.height);
      applyHsv();
    });
    grab(hue,e=>{
      const r=hue.getBoundingClientRect();
      mem.h=clamp((e.clientX-r.left)/r.width)*360;
      applyHsv();
    });

    /* H / S / B are typed into directly, one field each */
    for(const k in flds){
      const el=flds[k];
      const put=n=>{ mem[k]=k==='h'?((n%360)+360)%360:clamp(n,0,100)/100; applyHsv(); };
      el.addEventListener('input',e=>{
        const n=parseFloat(e.target.value.replace(/[^\d.-]/g,''));
        if(!isNaN(n)) put(n);
      });
      el.addEventListener('keydown',e=>{
        const d=e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0; if(!d) return;
        e.preventDefault();
        const cur=k==='h'?mem.h:mem[k]*100;
        put(cur+d*(e.shiftKey?10:1));
        el.value=Math.round(k==='h'?mem.h:mem[k]*100);
      });
      el.addEventListener('focus',()=>el.select());
      el.addEventListener('blur',paintPicker);
    }

    /* screen eyedropper, where the browser has one */
    if(window.EyeDropper){
      eye.classList.remove('off');
      eye.addEventListener('click',async e=>{
        e.stopPropagation();
        try{ const r=await new EyeDropper().open(); setColor(rgb2hex(hex2rgb(r.sRGBHex))); }catch(err){}
      });
    }

    tileHost.appendChild(wrap);
    paintTile(); paintPicker();
  });
}
addEventListener('keydown',e=>{ if(e.key==='Escape'&&openIdx>=0) setOpen(-1); });

document.getElementById('addColor').addEventListener('click',()=>{
  if(S.colors.length>=MAXP-1) return toast('That is plenty');
  const last=hex2lch(S.colors[S.colors.length-1])||{L:.6,C:.14,H:140};
  const H=(last.H+62)%360, L=clamp(last.L+(last.L>0.6?-0.16:0.14),0.15,0.9);
  S.colors.push(lch2hex(L,Math.min(last.C*1.02,maxC(L,H)*0.9),H).hex);
  renderTiles(); build();
});
addEventListener('paste',e=>{
  if(e.target.matches('input,[contenteditable]')) return;
  const t=(e.clipboardData||window.clipboardData).getData('text')||'';
  const clip=readKeyClip(t);
  if(clip){ e.preventDefault(); KEYCLIP=clip; pasteKeys(); return; }
  const found=(t.match(/#?\b[0-9a-fA-F]{6}\b/g)||[]).map(hex2rgb).filter(Boolean).map(rgb2hex).slice(0,MAXP-1);
  if(!found.length) return;
  S.colors=found; S.mode=found.length>1?'multi':'single'; openIdx=-1;
  syncMode(); renderTiles(); build();
  toast(found.length+' colour'+(found.length>1?'s':'')+' pasted');
});

