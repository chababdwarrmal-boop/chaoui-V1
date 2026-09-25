/* CHAoui Match Center V2 */
(()=>{"use strict";
let filter="all", query="";
const esc=v=>window.escapeHTML?window.escapeHTML(v??""):String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const statusLabel=s=>({scheduled:"مجدولة",result_submitted:"في انتظار التأكيد",finished:"منتهية",cancelled:"ملغاة"}[s]||s||"");
const fmt=v=>{try{return v?new Date(v).toLocaleDateString("ar-MA",{day:"2-digit",month:"short",year:"numeric"}):"غير محدد"}catch{return"غير محدد"}};
const tm=v=>{try{return v?new Date(v).toLocaleTimeString("ar-MA",{hour:"2-digit",minute:"2-digit"}):""}catch{return""}};
const rel=(v)=>{if(!v)return"";const d=new Date(v).getTime()-Date.now(),m=Math.floor(d/60000),h=Math.floor(m/60),day=Math.floor(h/24);if(d<=0)return"دابا";if(day>0)return"بعد "+day+" يوم";if(h>0)return"بعد "+h+" س";return"بعد "+Math.max(1,m)+" د"};

function shell(){
 const page=document.getElementById("matches"),box=document.getElementById("matchesList"); if(!page||!box||page.dataset.mv2)return;
 page.dataset.mv2="1";
 const title=page.querySelector(".page-title");
 if(title) title.insertAdjacentHTML("afterend",`
 <div class="mv2-filterbar"><div class="mv2-tabs" id="mv2Tabs">
 <button class="active" data-mv-filter="all">الكل</button><button data-mv-filter="scheduled">جاية</button><button data-mv-filter="result_submitted">تحتاج تأكيد</button><button data-mv-filter="finished">منتهية</button></div>
 <div class="mv2-search"><span>⌕</span><input id="mv2Search" placeholder="قلب على الخصم..." autocomplete="off"></div></div>
 <div id="mv2Next"></div><div class="mv2-summary" id="mv2Summary"></div>`);
 page.querySelector("#mv2Tabs").onclick=e=>{const b=e.target.closest("[data-mv-filter]");if(!b)return;filter=b.dataset.mvFilter;page.querySelectorAll("[data-mv-filter]").forEach(x=>x.classList.toggle("active",x===b));render()};
 page.querySelector("#mv2Search").oninput=e=>{query=e.target.value.trim().toLowerCase();render()};
 box.classList.add("mv2-list");
}

async function load(){
 if(!currentUser)return[];
 const {data,error}=await supabaseClient.from("matches").select("*").or(`player_a.eq.${currentUser.id},player_b.eq.${currentUser.id}`).order("scheduled_at",{ascending:true});
 if(error){console.error(error);return null}
 const ms=data||[],ids=[...new Set(ms.flatMap(m=>[m.player_a,m.player_b]).filter(Boolean))];
 const {data:p}=ids.length?await supabaseClient.from("profiles").select("id,username,display_name,avatar_url,rating").in("id",ids):{data:[]};
 const map=new Map((p||[]).map(x=>[x.id,x]));
 const mids=ms.map(m=>m.id);
 const {data:r}=mids.length?await supabaseClient.from("match_results").select("match_id,submitted_by,status").in("match_id",mids):{data:[]};
 const rm=new Map((r||[]).map(x=>[x.match_id,x]));
 return {ms,map,rm};
}
function opponent(m,map){const id=m.player_a===currentUser.id?m.player_b:m.player_a;return map.get(id)||{}}
function card(m,map,rm){
 const op=opponent(m,map), myA=m.player_a===currentUser.id, mine=myA?m.score_a:m.score_b, theirs=myA?m.score_b:m.score_a;
 const actionable=m.status==="scheduled"?`<button class="primary-small" onclick="openSubmitResult('${esc(m.id)}')">إدخال النتيجة</button>`:m.status==="result_submitted"&&rm.get(m.id)?.submitted_by!==currentUser.id?`<button class="primary-small" onclick="confirmSubmittedResult('${esc(m.id)}')">تأكيد النتيجة</button><button class="secondary-small" onclick="openMatchDispute('${esc(m.id)}')">اعتراض</button>`:"";
 return `<article class="mv2-card ${m.status==="scheduled"?"is-next":""}">
 <div class="mv2-card-head"><span class="mv2-status ${esc(m.status)}">${esc(statusLabel(m.status))}</span><span>${esc(m.round||"Match")}</span></div>
 <div class="mv2-versus"><div class="mv2-player"><div class="mv2-avatar">${esc((getInitials(op.display_name||op.username||"P")) )}</div><strong>${esc(op.display_name||op.username||"المنافس")}</strong><small>@${esc(op.username||"player")}</small></div>
 <div class="mv2-score">${mine!=null?`<strong>${mine} : ${theirs}</strong>`:"<strong>VS</strong>"}<small>${esc(fmt(m.scheduled_at))} · ${esc(tm(m.scheduled_at))}</small></div></div>
 <div class="mv2-card-meta"><span>⏱ ${esc(rel(m.scheduled_at))}</span><span>⚡ Rating ${Number(op.rating||0)}</span></div>
 <div class="mv2-actions">${actionable}<button class="secondary-small" onclick="openMatchRoom('${esc(m.id)}')">💬 Match Room</button></div></article>`
}
async function render(){
 shell();const box=document.getElementById("matchesList");if(!box)return;
 if(!currentUser){box.innerHTML='<div class="empty-card">دخل للحساب باش تشوف مبارياتك.</div>';return}
 const payload=await load();if(!payload){box.innerHTML='<div class="empty-card">وقع مشكل فتحميل المباريات.</div>';return}
 const {ms,map,rm}=payload;
 const wins=ms.filter(m=>m.winner_id===currentUser.id).length,finished=ms.filter(m=>m.status==="finished").length;
 const next=ms.find(m=>m.status==="scheduled"&&new Date(m.scheduled_at||0)>=new Date());
 const needs=ms.filter(m=>m.status==="result_submitted"&&rm.get(m.id)?.submitted_by!==currentUser.id).length;
 const nextBox=document.getElementById("mv2Next");
 if(nextBox)nextBox.innerHTML=next?(()=>{
 const op=opponent(next,map);return `<section class="mv2-next"><div><span class="mv2-kicker">NEXT MATCH ⚔️</span><h2>المواجهة الجاية</h2><p>${esc(next.round||"Match")} · ${esc(fmt(next.scheduled_at))} · ${esc(tm(next.scheduled_at))}</p></div><div class="mv2-next-vs"><span>YOU</span><strong>VS</strong><span>${esc(op.display_name||op.username||"المنافس")}</span></div><div class="mv2-next-bottom"><b id="mv2Countdown">${esc(rel(next.scheduled_at))}</b><button class="primary-btn" onclick="openMatchRoom('${esc(next.id)}')">فتح Match Room 💬</button></div></section>`})():"";
 const sum=document.getElementById("mv2Summary");if(sum)sum.innerHTML=[["⚔️",ms.length,"المباريات"],["🏆",wins,"الانتصارات"],["⏳",needs,"تحتاج تأكيد"],["🔥",finished,"منتهية"]].map(x=>`<div><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join("");
 const visible=ms.filter(m=>(filter==="all"||m.status===filter)&&(!query||String(opponent(m,map).display_name||opponent(m,map).username||"").toLowerCase().includes(query)));
 box.innerHTML=visible.map(m=>card(m,map,rm)).join("")||'<div class="empty-card mv2-empty">ما كايناش مباريات بهاد الاختيار.</div>';
}
function boot(){shell();const original=window.renderMatches;window.renderMatches=render;setTimeout(render,200)}
boot();
})();