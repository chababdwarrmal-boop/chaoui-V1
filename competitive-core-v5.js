/* CHAoui Competitive Core V5 — tournament-first player experience */
(()=>{"use strict";
const esc=v=>window.escapeHTML?window.escapeHTML(v??""):String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const $=id=>document.getElementById(id);
const fmt=v=>{try{return v?new Date(v).toLocaleDateString("ar-MA",{day:"2-digit",month:"short",year:"numeric"}):"—"}catch{return"—"}};
const tm=v=>{try{return v?new Date(v).toLocaleTimeString("ar-MA",{hour:"2-digit",minute:"2-digit"}):""}catch{return""}};
const toast=m=>window.showToast?showToast(m):console.log(m);
let originalOpenTournament=window.openTournament;
let originalOpenMatchRoom=window.openMatchRoom;

function injectStyle(){
 if(document.getElementById("coreV5Style"))return;
 const l=document.createElement("link");l.id="coreV5Style";l.rel="stylesheet";l.href="competitive-core-v5.css?v=20260925-core5";document.head.appendChild(l);
}

function navButtons(){
 document.querySelectorAll("#more .more-grid button").forEach(b=>b.classList.add("core5-more-btn"));
}

async function getSeason(){
 try{
  const {data,error}=await supabaseClient.from("seasons").select("*").order("created_at",{ascending:false}).limit(1);
  if(error||!data?.[0])return null;
  return data[0];
 }catch{return null}
}
function seasonName(s){return s?.name||s?.title||s?.season_name||"الموسم التنافسي الحالي"}
function seasonStatus(s){return s?.status||s?.state||"active"}

async function homeV5(){
 const page=$("home"); if(!page)return;
 let hub=page.querySelector("#coreV5Home");
 if(!hub){
  hub=document.createElement("section");hub.id="coreV5Home";hub.className="core5-home";
  const hero=page.querySelector(".home-hero-v3"); hero?.after(hub);
 }
 if(!currentUser){hub.innerHTML='<div class="core5-panel core5-login-note"><span>CHAOUI COMPETITIVE</span><h2>دخل باش تبدا المسار التنافسي ديالك</h2><p>بطولة → مباراة → نتيجة → Ranking → Season.</p><button class="primary-btn" data-page="tournaments">شوف البطولات</button></div>';return}
 const p=currentProfile||{};
 const [seasonRes,tRes,mRes]=await Promise.all([
  getSeason(),
  supabaseClient.from("tournament_players").select("tournament_id,status").eq("player_id",currentUser.id),
  supabaseClient.from("matches").select("id,status,scheduled_at,round,winner_id,player_a,player_b").or(`player_a.eq.${currentUser.id},player_b.eq.${currentUser.id}`).order("scheduled_at",{ascending:true})
 ]);
 const season=seasonRes, regs=tRes.data||[], ms=mRes.data||[];
 const activeMatches=ms.filter(m=>["scheduled","result_submitted"].includes(m.status));
 const next=ms.find(m=>m.status==="scheduled"&&new Date(m.scheduled_at||0)>=new Date())||activeMatches[0];
 let tName="مازال ما دخلتي حتى بطولة";
 if(regs.length){
  try{
   const ids=[...new Set(regs.map(x=>x.tournament_id).filter(Boolean))];
   const {data:ts}=await supabaseClient.from("tournaments").select("id,name,status,start_at,capacity,current_players").in("id",ids);
   const active=(ts||[]).find(t=>["open","live","paused"].includes(t.status))||(ts||[])[0];
   if(active)tName=active.name;
  }catch{}
 }
 let opp="—";
 if(next){
  const id=next.player_a===currentUser.id?next.player_b:next.player_a;
  if(id){const {data:o}=await supabaseClient.from("profiles").select("display_name,username,rating").eq("id",id).maybeSingle();opp=o?.display_name||o?.username||"المنافس";}
 }
 const played=Number(p.wins||0)+Number(p.losses||0)+Number(p.draws||0);
 const wr=played?Math.round(Number(p.wins||0)*100/played):0;
 hub.innerHTML=`
 <div class="core5-season-strip"><div><span>SEASON</span><strong>${esc(seasonName(season))}</strong><small>${esc(seasonStatus(season))}</small></div><div><span>RATING</span><strong>${Number(p.rating||0)}</strong><small>Rank تنافسي</small></div><div><span>FORM</span><strong>${wr}%</strong><small>${Number(p.wins||0)}W · ${Number(p.losses||0)}L</small></div><div><span>TOURNAMENTS</span><strong>${regs.length}</strong><small>مسجل فيها</small></div></div>
 <div class="core5-home-grid">
  <article class="core5-command ${next?"has-match":""}"><div><span>NEXT GAME</span><h2>${next?"المواجهة الجاية":"الخطوة الجاية"}</h2><p>${next?`${esc(opp)} · ${esc(next.round||"Match")} · ${esc(fmt(next.scheduled_at))} ${esc(tm(next.scheduled_at))}`:"سجل فبطولة مفتوحة باش يتخلق ليك أول ماتش."}</p></div><button class="primary-btn" data-page="${next?"matches":"tournaments"}">${next?"فتح المباراة":"اختار بطولة"} ↗</button></article>
  <article class="core5-track"><span>YOUR COMPETITIVE LOOP</span><div class="core5-steps"><b class="done">PLAYER</b><i>→</i><b class="${regs.length?"done":""}">TOURNAMENT</b><i>→</i><b class="${ms.length?"done":""}">MATCH</b><i>→</i><b class="${ms.some(m=>m.status==="finished")?"done":""}">RESULT</b><i>→</i><b>RANKING</b></div><small>كل خطوة كتزيد فالمسار ديالك.</small></article>
 </div>
 <div class="core5-quick"><button data-page="tournaments"><span>🏆</span><b>البطولات</b><small>اختار المنافسة</small></button><button data-page="matches"><span>⚔️</span><b>المباريات</b><small>${activeMatches.length} مواجهة نشيطة</small></button><button data-page="profile"><span>👤</span><b>Player HQ</b><small>المسار والإنجازات</small></button><button data-page="ranking"><span>📊</span><b>Ranking</b><small>شوف مركزك</small></button></div>`;
}

async function tournamentHub(id){
 const {data:t,error}=await supabaseClient.from("tournaments").select("*").eq("id",id).single();
 if(error||!t)return toast("ما قدرناش نجيبو البطولة.");
 const [pr,ms]=await Promise.all([
  supabaseClient.from("tournament_players").select("id,player_id,status,created_at").eq("tournament_id",id).order("created_at",{ascending:true}),
  supabaseClient.from("matches").select("id,player_a,player_b,status,scheduled_at,round,winner_id,score_a,score_b").eq("tournament_id",id).order("scheduled_at",{ascending:true})
 ]);
 const rows=pr.data||[], matches=ms.data||[], ids=[...new Set(rows.map(x=>x.player_id).concat(matches.flatMap(m=>[m.player_a,m.player_b])).filter(Boolean))];
 let players=[];
 if(ids.length){const r=await supabaseClient.from("profiles").select("id,display_name,username,rating,wins,losses").in("id",ids);players=r.data||[]}
 const map=new Map(players.map(x=>[x.id,x]));
 const mine=rows.some(x=>x.player_id===currentUser?.id);
 const mineMatches=matches.filter(m=>m.player_a===currentUser?.id||m.player_b===currentUser?.id);
 const status=t.status==="live"?"مباشرة 🔴":t.status==="open"?"مفتوحة 🟢":t.status==="done"?"منتهية 🏁":(t.status||"");
 const roster=rows.slice(0,16).map((r,i)=>{const p=map.get(r.player_id)||{};return `<div class="core5-roster"><b>#${i+1}</b><strong>${esc(p.display_name||p.username||"Player")}</strong><small>Rating ${Number(p.rating||0)}</small><em>${r.status==="accepted"?"مقبول":"انتظار"}</em></div>`}).join("");
 const games=matches.map(m=>{const a=map.get(m.player_a)||{},b=map.get(m.player_b)||{};const score=m.score_a!=null?`${m.score_a} : ${m.score_b}`:"VS";return `<div class="core5-game"><span>${esc(m.round||"Match")}</span><strong>${esc(a.display_name||a.username||"Player")} <i>${score}</i> ${esc(b.display_name||b.username||"Player")}</strong><small>${esc(m.status||"")} · ${esc(fmt(m.scheduled_at))}</small></div>`}).join("");
 openModal(`<div class="core5-modal"><div class="core5-modal-hero"><button class="modal-close" onclick="closeModal()">×</button><span>${esc(status)} · ${esc(t.format||"eFootball")}</span><h2>${esc(t.name)}</h2><p>${esc(t.description||"بطولة eFootball تنافسية.")}</p><div class="core5-meta"><b>${Number(t.current_players||rows.length)} / ${t.capacity||"∞"}</b><small>لاعب</small><b>${rows.length}</b><small>مسجل</small><b>${matches.length}</b><small>مباراة</small><b>${esc(fmt(t.start_at))}</b><small>البداية</small></div></div>
 <div class="core5-modal-tabs"><button class="active" data-coretab="overview">نظرة عامة</button><button data-coretab="games">المباريات ${matches.length}</button><button data-coretab="roster">المشاركون ${rows.length}</button></div>
 <div class="core5-tab" data-coretab-panel="overview"><div class="core5-status-card"><span>YOUR STATUS</span><strong>${mine?"✓ مسجل":"غير مسجل"}</strong><small>${mineMatches.length?"عندك "+mineMatches.length+" مباراة فهاد البطولة.":"سجل باش تبدا المسار."}</small></div><div class="core5-action-row">${mine?'<button class="primary-btn" data-page="matches" onclick="closeModal()">فتح مبارياتي</button>':t.status==="open"?`<button class="primary-btn" id="core5Join">التسجيل فالبطولة 🔥</button>`:"<span class='empty-card'>التسجيل ما مفتوحش دابا.</span>"}${t.organizer_id?'<button class="secondary-btn" id="core5OrgContact">💬 تواصل مع المنظم</button>':""}</div></div>
 <div class="core5-tab" data-coretab-panel="games" style="display:none">${games||'<div class="empty-card">المباريات مازال ما تخلقاتش.</div>'}</div>
 <div class="core5-tab" data-coretab-panel="roster" style="display:none">${roster||'<div class="empty-card">مازال ما تسجل حتى لاعب.</div>'}</div></div>`);
 document.querySelectorAll("[data-coretab]").forEach(btn=>btn.addEventListener("click",()=>{const k=btn.dataset.coretab;document.querySelectorAll("[data-coretab]").forEach(x=>x.classList.toggle("active",x===btn));document.querySelectorAll("[data-coretab-panel]").forEach(x=>x.style.display=x.dataset.coretabPanel===k?"block":"none")}));
 $("core5Join")?.addEventListener("click",async()=>{if(window.joinTournament){await joinTournament(id)}});
 $("core5OrgContact")?.addEventListener("click",async()=>{if(!t.organizer_id)return;const {data:o}=await supabaseClient.from("profiles").select("id,display_name,username").eq("id",t.organizer_id).maybeSingle();if(o&&window.startChatFromProfile){closeModal();startChatFromProfile(o.id)}else toast("ما قدرناش نفتح التواصل مع المنظم.")});
}

async function matchRoomV5(id){
 const {data:m,error}=await supabaseClient.from("matches").select("*").eq("id",id).single();
 if(error||!m)return originalOpenMatchRoom?originalOpenMatchRoom(id):toast("المباراة ما لقايناش.");
 const ids=[m.player_a,m.player_b].filter(Boolean);
 const {data:ps}=await supabaseClient.from("profiles").select("id,display_name,username,rating").in("id",ids);
 const map=new Map((ps||[]).map(x=>[x.id,x])),a=map.get(m.player_a)||{},b=map.get(m.player_b)||{};
 const me=currentUser?.id===m.player_a?a:b,opp=currentUser?.id===m.player_a?b:a;
 const myScore=currentUser?.id===m.player_a?m.score_a:m.score_b,opScore=currentUser?.id===m.player_a?m.score_b:m.score_a;
 const resultAction=m.status==="scheduled"?`<button class="primary-btn" onclick="closeModal();openSubmitResult('${esc(id)}')">إدخال النتيجة</button>`:m.status==="result_submitted"?`<button class="primary-btn" onclick="closeModal();confirmSubmittedResult('${esc(id)}')">تأكيد النتيجة</button><button class="secondary-btn" onclick="closeModal();openMatchDispute('${esc(id)}')">اعتراض</button>`:"";
 openModal(`<div class="core5-match-room"><button class="modal-close" onclick="closeModal()">×</button><span>MATCH ROOM · ${esc(m.round||"MATCH")}</span><h2>GAME DAY</h2><div class="core5-vs"><div><i>${esc(getInitials(me.display_name||me.username||"YOU"))}</i><strong>${esc(me.display_name||me.username||"أنت")}</strong><small>Rating ${Number(me.rating||0)}</small></div><b>${myScore!=null?`${myScore} : ${opScore}`:"VS"}</b><div><i>${esc(getInitials(opp.display_name||opp.username||"OPP"))}</i><strong>${esc(opp.display_name||opp.username||"المنافس")}</strong><small>Rating ${Number(opp.rating||0)}</small></div></div><div class="core5-match-meta"><span>الحالة <b>${esc(m.status||"")}</b></span><span>الموعد <b>${esc(fmt(m.scheduled_at))} · ${esc(tm(m.scheduled_at))}</b></span></div><div class="core5-trust"><b>🛡️ نتيجة موثقة</b><span>النتيجة كتدوز من التأكيد/الاعتراض قبل ما تعتبر نهائية.</span></div><div class="core5-action-row">${resultAction}<button class="secondary-btn" onclick="closeModal();showPage('matches')">رجع للمباريات</button></div></div>`);
}

async function profileCareer(){
 const page=$("profile");if(!page||!currentUser)return;
 let box=page.querySelector("#core5Career");
 if(!box){box=document.createElement("section");box.id="core5Career";box.className="core5-career";page.appendChild(box)}
 const {data:regs}=await supabaseClient.from("tournament_players").select("tournament_id,status,created_at").eq("player_id",currentUser.id).order("created_at",{ascending:false}).limit(30);
 const rows=regs||[], ids=[...new Set(rows.map(x=>x.tournament_id).filter(Boolean))];
 const {data:ts}=ids.length?await supabaseClient.from("tournaments").select("id,name,status,format,start_at").in("id",ids):{data:[]};
 const tmaps=new Map((ts||[]).map(x=>[x.id,x]));
 const {data:ms}=await supabaseClient.from("matches").select("id,status,scheduled_at,round,winner_id,player_a,player_b,tournament_id,score_a,score_b").or(`player_a.eq.${currentUser.id},player_b.eq.${currentUser.id}`).order("scheduled_at",{ascending:false}).limit(30);
 const matches=ms||[],finished=matches.filter(m=>m.status==="finished"),wins=finished.filter(m=>m.winner_id===currentUser.id).length;
 const trophies=rows.filter(r=>tmaps.get(r.tournament_id)?.status==="done").length;
 box.innerHTML=`<div class="core5-section-head"><div><span>PLAYER CAREER</span><h2>المسار التنافسي</h2></div><small>${rows.length} بطولات · ${finished.length} مباريات</small></div><div class="core5-career-stats"><div><b>${trophies}</b><span>بطولات مكتملة</span></div><div><b>${wins}</b><span>انتصارات</span></div><div><b>${finished.length?Math.round(wins*100/finished.length):0}%</b><span>Win Rate</span></div><div><b>${Number(currentProfile?.rating||0)}</b><span>Rating</span></div></div><div class="core5-history">${rows.slice(0,8).map(r=>{const t=tmaps.get(r.tournament_id)||{};return `<div><span>🏆</span><strong>${esc(t.name||"بطولة")}</strong><small>${esc(r.status||"") } · ${esc(fmt(t.start_at||r.created_at))}</small></div>`}).join("")||'<div class="empty-card">المسار ديالك غادي يبان من أول تسجيل.</div>'}</div>`;
}

async function rankingV5(){
 const box=$("rankingList");if(!box)return;
 try{
  const {data,error}=await supabaseClient.from("profiles").select("id,username,display_name,rating,wins,losses,draws,points,level");
  if(error)throw error;
  const rows=(data||[]).sort((a,b)=>Number(b.rating||0)-Number(a.rating||0));
  const me=rows.findIndex(x=>x.id===currentUser?.id);
  const mine=me>=0?rows[me]:null;
  box.innerHTML=`<div class="core5-rank-me"><span>YOUR RANK</span><strong>${me>=0?"#"+(me+1):"—"}</strong><b>Rating ${Number(mine?.rating||currentProfile?.rating||0)}</b><small>المركز كيتحسب من اللاعبين الحاليين حسب Rating.</small></div>`+
   rows.slice(0,50).map((p,i)=>`<article class="core5-rank-row ${p.id===currentUser?.id?"is-me":""}"><b>#${i+1}</b><i>${esc(getInitials(p.display_name||p.username||"P"))}</i><div><strong>${esc(p.display_name||p.username||"Player")}</strong><small>@${esc(p.username||"player")} · LV.${Number(p.level||1)}</small></div><em>${Number(p.rating||0)}</em><span>${Number(p.wins||0)}W · ${Number(p.losses||0)}L</span></article>`).join("");
 }catch{box.innerHTML='<div class="empty-card">وقع مشكل فتحميل الترتيب.</div>'}
}

async function organizerV5(){
 const page=$("organizer");if(!page||!currentUser||!isOrganizerActive(currentProfile))return;
 let box=page.querySelector("#core5Organizer");
 if(!box){box=document.createElement("section");box.id="core5Organizer";box.className="core5-organizer";page.querySelector(".organizer-plan-card")?.after(box)}
 const [ts,ms,ds]=await Promise.all([
  supabaseClient.from("tournaments").select("id,name,status,current_players,capacity,start_at").eq("organizer_id",currentUser.id),
  supabaseClient.from("matches").select("id,status,scheduled_at").order("scheduled_at",{ascending:true}).limit(200),
  supabaseClient.from("disputes").select("*").limit(200)
 ]);
 const own=ts.data||[], ownIds=new Set(own.map(x=>x.id)), matchRows=(ms.data||[]), pending=matchRows.filter(m=>m.status==="result_submitted").length;
 const disputes=(ds.data||[]).filter(d=>d.status&&d.status!=="resolved"&&d.status!=="closed").length;
 const open=own.filter(t=>t.status==="open").length, live=own.filter(t=>t.status==="live").length;
 box.innerHTML=`<div class="core5-section-head"><div><span>ORGANIZER HQ</span><h2>شغّل البطولة بلا ضياع</h2></div><button class="primary-small" id="core5Create">+ بطولة جديدة</button></div><div class="core5-org-grid"><div><b>${own.length}</b><span>البطولات</span></div><div><b>${open}</b><span>مفتوحة</span></div><div><b>${live}</b><span>مباشرة</span></div><div><b>${pending}</b><span>نتائج تنتظر</span></div><div><b>${disputes}</b><span>نزاعات مفتوحة</span></div></div><div class="core5-org-list">${own.slice(0,6).map(t=>`<button data-core-org-t="${esc(t.id)}"><strong>${esc(t.name)}</strong><span>${esc(t.status||"")} · ${Number(t.current_players||0)}/${Number(t.capacity||0)||"∞"}</span><small>${esc(fmt(t.start_at))}</small></button>`).join("")||'<div class="empty-card">مازال ما أنشأتي حتى بطولة.</div>'}</div>`;
 $("core5Create")?.addEventListener("click",()=>window.openCreateTournamentModal?openCreateTournamentModal():toast("حل صفحة البطولات لإنشاء بطولة."));
 box.querySelectorAll("[data-core-org-t]").forEach(b=>b.addEventListener("click",()=>{showPage("tournaments");setTimeout(()=>tournamentHub(b.dataset.coreOrgT),150)}));
}

function moreV5(){
 const grid=document.querySelector("#more .more-grid");if(!grid||grid.dataset.core5)return;
 grid.dataset.core5="1";
 grid.innerHTML=`
 <div class="core5-more-section"><span>PLAYER</span><button data-page="profile">👤<b>Player HQ</b><small>الكارير والإحصائيات</small></button><button data-page="season">📅<b>Season</b><small>الموسم والتحديات</small></button><button data-page="notifications">🔔<b>الإشعارات</b><small>التنبيهات المهمة</small></button><button data-page="complaints">🛡️<b>الدعم</b><small>الشكايات والنزاعات</small></button></div>
 <div class="core5-more-section"><span>COMMUNITY</span><button data-page="chat">💬<b>الرسائل</b><small>التواصل</small></button><button data-page="clubs">🏟️<b>الأندية</b><small>المجتمع</small></button><button data-page="search">🔎<b>البحث</b><small>اللاعبين</small></button></div>
 <div class="core5-more-section"><span>REWARDS & EXTRAS</span><button data-page="progression">🎯<b>التقدم</b><small>XP والإنجازات</small></button><button data-page="wallet">🪙<b>Coins & Shop</b><small>ثانوي على المنافسة</small></button><button data-page="premium">💎<b>Premium</b><small>المميزات</small></button><button data-page="hall">👑<b>قاعة الأساطير</b><small>السجل التاريخي</small></button><button data-page="feed">🔥<b>النشاط</b><small>آخر الأخبار</small></button><button data-page="assistant">🤖<b>المساعد</b><small>مساعدة</small></button><button data-page="settings">⚙️<b>الإعدادات</b><small>الحساب</small></button></div>`;
}

function hook(){
 injectStyle();moreV5();
 const oldHome=window.renderHomeDashboard,oldProfile=window.renderProfile,oldRank=window.renderRanking,oldOrg=window.renderOrganizer;
 window.renderHomeDashboard=async()=>{if(oldHome)await oldHome();await homeV5()};
 window.renderProfile=async()=>{if(oldProfile)await oldProfile();await profileCareer()};
 window.renderRanking=rankingV5;
 window.renderOrganizer=async()=>{if(oldOrg)await oldOrg();await organizerV5()};
 originalOpenTournament=window.openTournament;window.openTournament=tournamentHub;
 originalOpenMatchRoom=window.openMatchRoom;window.openMatchRoom=matchRoomV5;
 document.addEventListener("click",e=>{const p=e.target.closest("[data-page]");if(p&&p.dataset.page&&window.showPage)showPage(p.dataset.page)});
 setTimeout(()=>{homeV5();profileCareer();rankingV5();organizerV5()},500);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",hook);else hook();
})();