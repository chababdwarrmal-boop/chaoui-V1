/* CHAoui Visual V8 — More Hub, single icon layer, match cards and chat */
(()=>{"use strict";
const ICONS={
home:"<svg viewBox='0 0 24 24' fill='none'><path d='M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 19.5v-9Z'/></svg>",
tournaments:"<svg viewBox='0 0 24 24' fill='none'><path d='M6 4h12v4a6 6 0 0 1-12 0V4Z'/><path d='M6 6H3v2a4 4 0 0 0 4 4M18 6h3v2a4 4 0 0 1-4 4M12 14v5M8 21h8'/></svg>",
matches:"<svg viewBox='0 0 24 24' fill='none'><path d='m8 5 8 7-8 7V5Z'/><path d='M4 4v16'/></svg>",
ranking:"<svg viewBox='0 0 24 24' fill='none'><path d='M5 20V10M12 20V4M19 20v-7'/><path d='M3 20h18'/></svg>",
profile:"<svg viewBox='0 0 24 24' fill='none'><circle cx='12' cy='7' r='3.5'/><path d='M5 21a7 7 0 0 1 14 0'/></svg>",
chat:"<svg viewBox='0 0 24 24' fill='none'><path d='M20 11.5a7.5 7.5 0 0 1-8 7.5 9.2 9.2 0 0 1-4-.9L4 20l1-4a7.4 7.4 0 0 1-.5-2.5A7.5 7.5 0 0 1 12 6a7.5 7.5 0 0 1 8 5.5Z'/><path d='M8 12h.01M12 12h.01M16 12h.01'/></svg>",
"progression":"<svg viewBox='0 0 24 24' fill='none'><path d='m4 17 5-5 3 3 7-8'/><path d='M15 7h4v4'/></svg>",
wallet:"<svg viewBox='0 0 24 24' fill='none'><path d='M4 6h15a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12'/><path d='M20 11h-5a2 2 0 0 0 0 4h5'/></svg>",
premium:"<svg viewBox='0 0 24 24' fill='none'><path d='m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z'/></svg>",
notifications:"<svg viewBox='0 0 24 24' fill='none'><path d='M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4'/></svg>",
complaints:"<svg viewBox='0 0 24 24' fill='none'><path d='M6 3h12v18H6z'/><path d='M9 7h6M9 11h6M9 15h4'/></svg>",
hall:"<svg viewBox='0 0 24 24' fill='none'><path d='M8 5h8v5a4 4 0 0 1-8 0V5Z'/><path d='M8 7H4v2a4 4 0 0 0 4 4M16 7h4v2a4 4 0 0 1-4 4M12 14v5M8 21h8'/></svg>",
clubs:"<svg viewBox='0 0 24 24' fill='none'><path d='M4 20V8l8-4 8 4v12'/><path d='M8 20v-5h8v5M8 10h.01M12 10h.01M16 10h.01'/></svg>",
season:"<svg viewBox='0 0 24 24' fill='none'><rect x='3' y='5' width='18' height='16' rx='2'/><path d='M7 3v4M17 3v4M3 10h18'/></svg>",
feed:"<svg viewBox='0 0 24 24' fill='none'><path d='m13 3 1.7 5.3L20 10l-5.3 1.7L13 17l-1.7-5.3L6 10l5.3-1.7L13 3Z'/><path d='m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z'/></svg>",
assistant:"<svg viewBox='0 0 24 24' fill='none'><rect x='4' y='5' width='16' height='14' rx='3'/><path d='M8 10h.01M12 10h.01M16 10h.01M9 15h6'/></svg>",
settings:"<svg viewBox='0 0 24 24' fill='none'><path d='M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z'/><path d='m19 13 1.5 1-.9 2-1.8-.1a7.7 7.7 0 0 1-1.4 1.4l.1 1.8-2 .9-1-1.5a7.8 7.8 0 0 1-2 0l-1 1.5-2-.9.1-1.8a7.7 7.7 0 0 1-1.4-1.4l-1.8.1-.9-2L5 13a7.8 7.8 0 0 1 0-2L3.5 10l.9-2 1.8.1a7.7 7.7 0 0 1 1.4-1.4L7.5 5l2-.9 1 1.5a7.8 7.8 0 0 1 2 0l1-1.5 2 .9-.1 1.8a7.7 7.7 0 0 1 1.4 1.4l1.8-.1.9 2-1.5 1a7.8 7.8 0 0 1 0 2Z'/></svg>"
};
function iconFor(page){return ICONS[page]||"<svg viewBox='0 0 24 24' fill='none'><circle cx='12' cy='12' r='8'/></svg>"}
function decorate(){
 document.querySelectorAll("[data-page]").forEach(b=>{
  const p=b.dataset.page;if(!ICONS[p]||b.dataset.v6icon||b.classList.contains("more-feature"))return;
  const first=b.firstElementChild;
  if(first && first.tagName==="SPAN" && /^[\p{Extended_Pictographic}\s]+$/u.test(first.textContent.trim())){
    first.className="v6-icon";
    first.innerHTML=iconFor(p);
  }else{
    const raw=[...b.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(" ").trim();
    if(raw && /^[\p{Extended_Pictographic}\s+]+$/u.test(raw)) b.dataset.v6OldIcon=raw;
    const i=document.createElement("span");i.className="v6-icon";i.innerHTML=iconFor(p);
    b.insertBefore(i,b.firstChild);
  }
  b.dataset.v6icon="1";
 });
 document.querySelectorAll(".home-quick-v3 button,.player-actions button").forEach(b=>{
  if(b.dataset.v6decor)return;
  const span=b.querySelector(":scope > span:first-child");if(span){span.classList.add("v6-icon-wrap");span.innerHTML=iconFor(b.dataset.page||"matches")}
  b.dataset.v6decor="1";
 });
 document.querySelectorAll(".core5-quick button").forEach(b=>{
  if(b.dataset.v6decor)return;
  const p=b.dataset.page||"matches";const s=b.querySelector("span");if(s){s.className="v6-icon-wrap";s.innerHTML=iconFor(p)}
  b.dataset.v6decor="1";
 });
}
function improveMatches(){
 document.querySelectorAll(".mv2-card").forEach((c,i)=>{
  c.classList.add("mv6-match-card");
  const vs=c.querySelector(".mv2-versus"); if(vs&&!vs.querySelector(".mv6-versus-line")){const x=document.createElement("div");x.className="mv6-versus-line";x.innerHTML="<span></span><b>VS</b><span></span>";vs.appendChild(x)}
 });
}
function improveChat(){
 const page=document.querySelector("#chat");if(!page)return;
 page.classList.add("chat-v6");
 const input=document.querySelector("#chatMessageInput"); if(input)input.placeholder="كتب رسالة...";
 const form=document.querySelector("#chatComposer");
 if(form&&!form.querySelector(".chat-v6-tools")){
  const tools=document.createElement("div");tools.className="chat-v6-tools";tools.innerHTML="<button type='button' aria-label='Emoji'>☺</button><button type='button' aria-label='Sticker'>✦</button>";
  form.insertBefore(tools,form.firstChild);
 }
}


const MORE_GROUPS={
 player:[
  ["profile","صفحتي","الملف والإحصائيات"],
  ["notifications","الإشعارات","التنبيهات المهمة"],
  ["progression","التقدم والتحديات","XP والإنجازات"],
  ["season","الموسم","الموسم والتحديات"]
 ],
 community:[
  ["chat","الرسائل","تواصل مع اللاعبين"],
  ["clubs","الأندية","مجتمعك الرياضي"],
  ["feed","النشاط","آخر النشاطات"],
  ["search","البحث","ابحث عن لاعب أو محتوى"]
 ],
 rewards:[
  ["wallet","Coins & Shop","الرصيد والمكافآت"],
  ["premium","Premium","المزايا الإضافية"],
  ["hall","الأساطير","Hall of Fame"]
 ],
 support:[
  ["complaints","الشكايات","الدعم والنزاعات"],
  ["assistant","المساعد","مساعد CHAoui"],
  ["settings","الإعدادات","الحساب والتفضيلات"]
 ]
};
const MORE_ICONS={player:"♙",community:"◉",rewards:"◆",support:"✦"};
function initMoreHub(){
 const root=document.querySelector("#more");
 const panel=document.querySelector("#moreHubV8Panel");
 if(!root||!panel||root.dataset.moreV8)return;
 root.dataset.moreV8="1";
 root.querySelectorAll(".more-category").forEach(card=>{
  card.addEventListener("click",()=>{
   const key=card.dataset.moreCategory, items=MORE_GROUPS[key]||[];
   root.querySelectorAll(".more-category").forEach(x=>x.classList.toggle("active",x===card));
   panel.hidden=false;
   panel.innerHTML=`<div class="more-panel-head"><div><span class="more-panel-icon">${MORE_ICONS[key]}</span><div><small>CHAoui HUB</small><h2>${card.querySelector("b")?.textContent||""}</h2></div></div><button type="button" class="more-panel-close">×</button></div><div class="more-feature-list">${items.map(([page,title,desc])=>`<button type="button" class="more-feature" data-page="${page}"><span class="more-feature-icon"></span><span><b>${title}</b><small>${desc}</small></span><strong>‹</strong></button>`).join("")}</div>`;
   decorate();
   panel.querySelector(".more-panel-close").onclick=()=>{panel.hidden=true;root.querySelectorAll(".more-category").forEach(x=>x.classList.remove("active"))};
   panel.querySelectorAll(".more-feature").forEach(btn=>btn.addEventListener("click",()=>{if(typeof window.showPage==="function") window.showPage(btn.dataset.page)}));
   panel.querySelectorAll(".more-feature").forEach(btn=>{const p=btn.dataset.page;btn.querySelector(".more-feature-icon").innerHTML=iconFor(p)});
  });
 });
}

function run(){decorate();improveMatches();improveChat();initMoreHub()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(run,500));else setTimeout(run,500);
const mo=new MutationObserver(()=>{decorate();improveMatches();improveChat()});mo.observe(document.body,{subtree:true,childList:true});
})();