/* Autoryva - app logic */
// Tries the Node server first, then the static data file (used on free static hosting)
let cars=[];
const API_URLS=["/api/cars","data/cars.json"];
const addId=c=>c.id?c:{...c,id:(c.make+" "+c.model).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")};
async function loadCars(){
  for(const u of API_URLS){
    try{
      const r=await fetch(u); if(!r.ok) continue;
      const list=await r.json(); if(Array.isArray(list)&&list.length) return list.map(addId);
    }catch(e){}
  }
  return CARS.map(addId);
}
const esc=t=>String(t==null?"":t).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function imgFail(el){const d=document.createElement("div");d.innerHTML=art("#62752F");el.replaceWith(d.firstChild)}
function thumb(c){return c.image?`<img src="${esc(c.image)}" alt="${esc(c.make+" "+c.model)}" loading="lazy" referrerpolicy="no-referrer" onerror="imgFail(this)">`:art(c.c||"#62752F")}
function attachSuggest(input){
  const box=document.createElement("ul");box.className="sug";box.setAttribute("role","listbox");box.hidden=true;
  input.parentNode.style.position="relative";input.parentNode.appendChild(box);
  let items=[],idx=-1;
  const go=c=>{location.href="/cars/"+c.id+".html"};
  const nm=c=>(c.make+" "+c.model).toLowerCase();
  function paint(){box.innerHTML=items.map((c,i)=>`<li role="option" data-i="${i}" class="${i==idx?"on":""}">${esc(c.make+" "+c.model)}<small>${c.from}–${c.to}</small></li>`).join("")}
  function update(){
    const q=input.value.trim().toLowerCase();idx=-1;
    if(!q){box.hidden=true;return}
    items=cars.filter(c=>nm(c).includes(q)).sort((a,b)=>(nm(b).startsWith(q)-nm(a).startsWith(q))||a.from-b.from).slice(0,6);
    if(!items.length){box.hidden=true;return}
    box.style.left=input.offsetLeft+"px";box.style.top=(input.offsetTop+input.offsetHeight+4)+"px";box.style.width=input.offsetWidth+"px";
    paint();box.hidden=false;
  }
  input.addEventListener("input",update);
  input.addEventListener("keydown",e=>{
    if(box.hidden) return;
    if(e.key=="ArrowDown"){e.preventDefault();idx=(idx+1)%items.length;paint()}
    else if(e.key=="ArrowUp"){e.preventDefault();idx=(idx-1+items.length)%items.length;paint()}
    else if(e.key=="Enter"&&idx>=0){e.preventDefault();go(items[idx])}
    else if(e.key=="Escape"){box.hidden=true}
  });
  box.addEventListener("pointerdown",e=>{const li=e.target.closest("li");if(li){e.preventDefault();go(items[+li.dataset.i])}});
  input.addEventListener("blur",()=>setTimeout(()=>{box.hidden=true},150));
}
function usePhotoSlides(){
  const withImg=cars.filter(c=>c.image).sort((a,b)=>a.from-b.from);
  if(withImg.length<3) return;
  const n=Math.min(6,withImg.length), step=withImg.length/n;
  const pick=Array.from({length:n},(_,k)=>withImg[Math.floor(k*step)]);
  slides=pick.map(c=>[0,0,0,0,`${c.make} ${c.model} (${c.from}–${c.to})`]);
  sl.innerHTML=pick.map((c,i)=>`<div class="sl${i?"":" on"}"><img src="${esc(c.image)}" alt="${esc(c.make+" "+c.model)}" referrerpolicy="no-referrer"></div>`).join("")+`<div class="shade"></div>`;
  $("#dots").innerHTML=slides.map((s,i)=>`<button aria-label="Slide ${i+1}" onclick="go(${i})"></button>`).join("");
  go(0);
}
function initCars(){
usePhotoSlides();
const withImg=cars.filter(c=>c.image);
  const pick=(withImg.length>=6?withImg:cars).slice(0,6);
  $("#feat").innerHTML=pick.map(c=>`<a class="card" href="/cars/${esc(c.id)}.html">${thumb(c)}<div class="b"><span class="yr">${c.from}–${c.to}</span><h3 style="margin-top:8px">${esc(c.make)} ${esc(c.model)}</h3><div class="meta">${esc(c.country)}</div></div></a>`).join("");
[...new Set(cars.map(c=>c.country))].sort().forEach(x=>$("#country").insertAdjacentHTML("beforeend",`<option>${x}</option>`));
  renderDecades();
  render();
}
function art(c,w){return `<svg viewBox="0 0 400 220" role="img" aria-label="Car illustration"><rect width="400" height="220" fill="${c}"/><rect y="168" width="400" height="52" fill="rgba(0,0,0,.28)"/><path d="M52 160c0-16 8-24 26-28l46-8 30-34c6-7 14-10 24-10h74c12 0 22 5 30 14l22 28 36 6c10 2 18 10 18 22v10H52z" fill="rgba(255,255,255,.92)"/><path d="M146 96l22-0 0 28-52 6z M184 96h56l24 28h-80z" fill="${c}" opacity=".75"/><circle cx="116" cy="164" r="22" fill="#14201D"/><circle cx="116" cy="164" r="9" fill="#C8D0CB"/><circle cx="294" cy="164" r="22" fill="#14201D"/><circle cx="294" cy="164" r="9" fill="#C8D0CB"/></svg>`}
let dec="all",ctry="all";
const $=s=>document.querySelector(s);
let slides=[["#F6B26B","#B45F3C","#7A3B2B","#5B2E2A","Open tourers of the 1920s"],["#8EC5E8","#DCEEF7","#2F5D50","#3F7A5E","Roadsters of the 1930s"],["#2B3A55","#6B7FA6","#B08D57","#1A2438","Coupes of the 1950s"],["#F2D492","#D99A4E","#9B3B3B","#7A4A2A","Grand tourers of the 1960s"]];
const sl=$("#slider");let si=0,st;
sl.innerHTML=slides.map((s,i)=>`<div class="sl${i?"":" on"}"><svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="g${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s[0]}"/><stop offset="1" stop-color="${s[1]}"/></linearGradient></defs><rect width="800" height="450" fill="url(#g${i})"/><circle cx="560" cy="110" r="46" fill="rgba(255,255,255,.4)"/><path d="M0 250Q200 190 400 240T800 220V450H0z" fill="${s[3]}"/><rect y="262" width="800" height="190" fill="rgba(0,0,0,.4)"/><g transform="translate(210 90) scale(.95)"><path d="M52 160c0-16 8-24 26-28l46-8 30-34c6-7 14-10 24-10h74c12 0 22 5 30 14l22 28 36 6c10 2 18 10 18 22v10H52z" fill="${s[2]}"/><path d="M146 96h22v28l-52 6zM184 96h56l24 28h-80z" fill="rgba(255,255,255,.55)"/><circle cx="116" cy="164" r="22" fill="#10100f"/><circle cx="116" cy="164" r="9" fill="#C8D0CB"/><circle cx="294" cy="164" r="22" fill="#10100f"/><circle cx="294" cy="164" r="9" fill="#C8D0CB"/></g></svg></div>`).join("")+`<div class="shade"></div>`;
$("#dots").innerHTML=slides.map((s,i)=>`<button aria-label="Slide ${i+1}" onclick="go(${i})"></button>`).join("");
function go(i){si=(i+slides.length)%slides.length;sl.querySelectorAll(".sl").forEach((x,k)=>x.classList.toggle("on",k==si));[...$("#dots").children].forEach((d,k)=>d.classList.toggle("on",k==si));$("#cap").textContent=slides[si][4];clearInterval(st);if(!matchMedia("(prefers-reduced-motion:reduce)").matches)st=setInterval(()=>go(si+1),4500)}
go(0);
const hero=document.querySelector(".hero");let sx=0;
hero.addEventListener("touchstart",e=>{sx=e.touches[0].clientX},{passive:true});
hero.addEventListener("touchend",e=>{const d=e.changedTouches[0].clientX-sx;if(Math.abs(d)>50)go(si+(d<0?1:-1))});
function setDecade(d){dec=d;document.querySelectorAll(".chip").forEach(x=>x.setAttribute("aria-pressed",x.dataset.d==d));render();location.hash="#/gallery"}
function renderDecades(){
  const tint=["#2F5D50","#5B2E2A","#2E4A7A","#B08D57","#C2662D"];
  $("#decs").innerHTML=["1920","1930","1950","1960","1970"].map((d,i)=>{
    const inEra=cars.filter(c=>c.from<+d+10&&c.to>=+d);
    const c=inEra.find(x=>x.image);
    return `<button class="card" onclick="setDecade('${d}')">${c?thumb(c):art(tint[i])}<div class="b"><h3>${d}s</h3><div class="meta">${inEra.length?inEra.length+" cars":"View cars"}</div></div></button>`;
  }).join("");
}
renderDecades();
let lt;function hideLoad(){$("#load").classList.add("hide")}
function showLoad(ms){const l=$("#load");l.classList.remove("first","hide");l.style.display="none";void l.offsetHeight;l.style.display="";clearTimeout(lt);lt=setTimeout(hideLoad,ms)}
document.querySelector(".logo").addEventListener("click",()=>showLoad(1400));
addEventListener("load",()=>{clearTimeout(lt);lt=setTimeout(hideLoad,2400)});lt=setTimeout(hideLoad,3500);
function render(){
const q=$("#q").value.trim().toLowerCase();
const list=cars.filter(c=>(dec=="all"||(c.from<+dec+10&&c.to>=+dec))&&(ctry=="all"||c.country==ctry)&&(c.make+" "+c.model).toLowerCase().includes(q));
$("#count").textContent=list.length+" cars";
$("#grid").innerHTML=list.length?list.map(c=>{const i=cars.indexOf(c);return `<a class="card" href="/cars/${esc(c.id)}.html">${thumb(c)}<div class="b"><span class="yr">${c.from}–${c.to}</span><h3 style="margin-top:8px">${esc(c.make)} ${esc(c.model)}</h3><div class="meta">${esc(c.country)}</div><p>${esc((c.d||"").slice(0,90))}…</p></div></a>`}).join(""):`<div class="empty">No cars match. Try another era or clear the search.</div>`;
}
function show(i){const c=cars[i];const cr=c.credit?`<p class="credit">Photo: ${esc(c.credit.author||"Wikimedia Commons")}${c.credit.license?", "+(c.credit.licenseUrl?`<a href="${esc(c.credit.licenseUrl)}" target="_blank" rel="noopener">${esc(c.credit.license)}</a>`:esc(c.credit.license)):""}${c.credit.page?` (<a href="${esc(c.credit.page)}" target="_blank" rel="noopener">source</a>)`:""}</p>`:"";const wk=c.wiki?`<p><a href="${esc(c.wiki)}" target="_blank" rel="noopener">Read more on Wikipedia</a></p>`:"";$("#dbody").innerHTML=`${thumb(c)}<div class="b"><h2>${esc(c.make)} ${esc(c.model)}</h2><p style="color:var(--mute)">${esc(c.d)}</p><dl><dt>Make</dt><dd>${esc(c.make)}</dd><dt>Model</dt><dd>${esc(c.model)}</dd><dt>Produced</dt><dd>${c.from} to ${c.to}</dd><dt>Country</dt><dd>${esc(c.country)}</dd></dl>${wk}${cr}<button class="btn" onclick="dlg.close()">Close</button></div>`;dlg.showModal()}
document.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{document.querySelectorAll(".chip").forEach(x=>x.setAttribute("aria-pressed","false"));b.setAttribute("aria-pressed","true");dec=b.dataset.d;render()});
$("#country").onchange=e=>{ctry=e.target.value;render()};
$("#q").oninput=render;
attachSuggest($("#q"));attachSuggest($("#hq"));
function route(){const h=location.hash.replace("#/","")||"home";const p=["home","gallery","about"].includes(h)?h:"home";document.querySelectorAll(".page").forEach(x=>x.hidden=x.id!="p-"+p);document.querySelectorAll("nav a[data-p]").forEach(a=>a.classList.toggle("on",a.dataset.p==p));scrollTo(0,0)}
addEventListener("hashchange",()=>{route();showLoad(1100)});route();
$("#hs").onsubmit=e=>{e.preventDefault();$("#q").value=$("#hq").value;render();location.hash="#/gallery"};
dlg.addEventListener("click",e=>{if(e.target==dlg)dlg.close()});
loadCars().then(list=>{cars=list;initCars()});
