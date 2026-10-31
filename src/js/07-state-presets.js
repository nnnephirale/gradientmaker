/* ══════════════════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════════════════ */
const DEFAULTS={
  mode:'single',
  colors:['#3FBF5A'],
  depth:0.44, softness:0.32, grain:0.25,
  direction:148, seed:7412,
  outW:1600, outH:1600, radius:22, zoom:1,
  vivid:0.85, tones:5, hueShift:-10,
  scatter:0.8, warp:0.10, bloom:0.55,
  grainType:0, grainSize:1,
  style:'soft',
  /* flow */
  scale:1.0, fwarp:1.9, stretch:2.4, detail:3.2, speed:0.3,
  contrast:1.0, sheen:0.3, folds:2.0,
  /* hatch — both styles */
  hatch:0, hatchGap:7, hatchAngle:45,
  /* timeline — keys hold settings at points in time; dur is also the video length */
  keys:[], dur:10, loop:false, ease:'smooth'
};
/* one set of presets per style.
   Soft: candy 3D objects — coins, butterflies, gems, bubbles.
   Flow: jewel tones, folded into silk dark → light.
   Sky:  banded skies, colours listed top to bottom. */
const SOFT={depth:.3,softness:.45,grain:.3,scatter:.8,bloom:.6,warp:.1};
const SILK={scale:1.0,fwarp:1.9,stretch:2.4,angle:-20,detail:3.2,speed:.3,contrast:1.1,sheen:.35,folds:2.2,hatch:0,hatchGap:7,hatchAngle:45,grain:.03};
const SKY ={scale:.7,fwarp:1.0,stretch:3.6,angle:0,detail:2.0,speed:.15,contrast:.9,sheen:.06,folds:1.2,hatch:0,hatchGap:7,hatchAngle:45,grain:.06};
const PRESETS={
  soft:{
    Coin:     {...SOFT,c:['#FF4A12','#FF8A2A','#FFC46B'],direction:140},
    Butterfly:{...SOFT,c:['#4B32D0','#8C6CF2','#3FC7C0'],direction:200},
    Gem:      {...SOFT,c:['#A62CE6','#F06CC8','#FFB6E8'],direction:120},
    Heart:    {...SOFT,c:['#FF8A3D','#FFB79A','#FF7FB0'],direction:160},
    Bubble:   {...SOFT,c:['#8EDFF2','#C3B2FF','#FFC6E6','#FFF1BE'],direction:135,depth:.15,grain:.2},
    Slime:    {...SOFT,c:['#16B23A','#8FE05C','#E6F577'],direction:150}
  },
  flow:{
    Velvet:  {...SILK,c:['#1C260C','#3D5417','#6E7D22','#C9A93A','#FFE6A0']},
    Ruby:    {...SILK,c:['#24030A','#6A0A16','#BE172A','#FF6A58','#FFD3C4'],angle:15},
    Amethyst:{...SILK,c:['#120838','#3A1FA0','#6B3FE0','#B48CFF','#EADCFF'],angle:-35},
    Gold:    {...SILK,c:['#352006','#87580F','#D7A01E','#FFD35E','#FFF4C8'],angle:25,sheen:.5},
    Night:   {...SILK,c:['#14060A','#2B0E1C','#7A2E8A','#E07AC8','#FFC6E8']},
    Holo:    {...SILK,c:['#3A6FD8','#8C9CF0','#E0A8F0','#A8F0E0','#F6F8FF'],contrast:.9,sheen:.45,stretch:3.2}
  },
  sky:{
    Sneaker: {...SKY,c:['#00BD3E','#5FBA8D','#D2B5D6','#FEB2F7','#EED4A4','#E7D1DF']},
    Clips:   {...SKY,c:['#C9C2C6','#C6AEF2','#B5A9F0','#C4D7A6','#B9E37A','#E8C98A'],fwarp:1.3},
    Daydream:{...SKY,c:['#6CB8F8','#B7B4F7','#E7B4F6','#FABD8A','#FCC15B']},
    Party:   {...SKY,c:['#4FC3E8','#C9A4F0','#FF9FD0','#FFD45A','#7EDB5E','#2DBE4A'],fwarp:1.2},
    Bubblegum:{...SKY,c:['#9C7CF4','#D795EE','#FF9FCB','#FFC4A6','#FFE3B8']},
    Wins:    {...SKY,c:['#1EC4B0','#6FA8F0','#FFC21A','#FF9A4A','#FF7FB0'],contrast:.8}
  }
};
/* each style keeps its own look. Colours, format and content are shared, but
   switching style never carries one style's sliders into another — Flow looks
   the same whether you arrive from Soft or from Sky */
const LOOK_KEYS=['direction','seed','depth','softness','grain','grainType','grainSize','scatter','warp','bloom',
  'vivid','tones','hueShift','scale','fwarp','stretch','detail','speed','contrast','sheen','folds','hatch','hatchGap','hatchAngle'];
const STYLE_LOOK={
  soft:{},
  flow:{},
  sky:{direction:0,scale:SKY.scale,fwarp:SKY.fwarp,stretch:SKY.stretch,detail:SKY.detail,speed:SKY.speed,
       contrast:SKY.contrast,sheen:SKY.sheen,folds:SKY.folds,grain:Math.round(SKY.grain*455)/100}
};
const pickLook=o=>Object.fromEntries(LOOK_KEYS.map(k=>[k,o[k]]));
DEFAULTS.bank=Object.fromEntries(Object.keys(STYLE_LOOK).map(st=>[st,pickLook({...DEFAULTS,...STYLE_LOOK[st]})]));
let S=structuredClone(DEFAULTS), STOPS=[], PTS=[];
const spreadOf  = s => 0.30+0.78*s;
const falloffOf = s => 2.30-1.62*s;

