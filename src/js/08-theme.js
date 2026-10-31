/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const ICON_SUN=`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
  <circle cx="8" cy="8" r="3.1"/><path d="M8 1v1.6M8 13.4V15M15 8h-1.6M2.6 8H1M12.9 3.1l-1.1 1.1M4.2 11.8l-1.1 1.1M12.9 12.9l-1.1-1.1M4.2 4.2 3.1 3.1"/></svg>`;
const ICON_MOON=`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
  <path d="M13.5 9.6A5.9 5.9 0 0 1 6.4 2.5a5.9 5.9 0 1 0 7.1 7.1Z"/></svg>`;
const themeBtn=document.getElementById('themeBtn');
function setTheme(t){
  document.documentElement.dataset.theme=t;
  themeBtn.innerHTML = t==='light' ? ICON_MOON : ICON_SUN;
  try{ localStorage.setItem('gs-theme',t); }catch(e){}
}
themeBtn.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='light'?'dark':'light'));
(function(){
  let t=null; try{ t=localStorage.getItem('gs-theme'); }catch(e){}
  setTheme(t || (matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'));
})();

