/* CHAoui Elite Core V2026 — phases 4/5/7/8/12/13/14/15/16/19/21 */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const esc=v=>window.escapeHTML?window.escapeHTML(v??""):String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const initials=v=>String(v||"P").trim().split(/\\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"P";
const toast=m=>window.showToast?window.showToast(m):console.log(m);
const fmt=v=>{try{return v?new Date(v).toLocaleDateString("ar-MA",{day:"2-digit",month:"short",year:"numeric"}):"—"}catch{return"—"}};

function injectShell(){
 const ranking=$("ranking"),profile=$("profile"),notif=$("notifications"),premium=$("premium"),prog=$("progression"),wallet=$("wallet"),org=$("organizer"),king=$("king");
 if(ranking&&!$("eliteRankingHero")) ranking.querySelector(".page-title")?.insertAdjacentHTML("afterend",'<div id="eliteRankingHero" class="elite-hero"></div><div class="elite-ranking-tools"><div class="elite-segment" id="eliteRankTabs"><button class="active" data-rank="rating">Rating</button><button data-rank="points">Points</button><button data-rank="wins">Wins</button><button data-rank="winrate">Win Rate</button></div><div class="elite-search"><span>⌕</span><input id="eliteRankSearch" placeholder="قلب على لاعب..." autocomplete="off"></div></div>');
 if(profile&&!$("eliteProfileProgress")) profile.querySelector(".profile-card")?.insertAdjacentHTML("afterend",'<div id="eliteProfileProgress" class="elite-profile-grid"></div>');
 if(notif&&!$("eliteNotifHead")) notif.querySelector(".page-title")?.insertAdjacentHTML("afterend",'<div id="eliteNotifHead" class="elite-notif-head"></div>');
 if(premium&&!$("elitePremiumV2")) premium.querySelector(".premium-card")?.insertAdjacentHTML("afterbegin",'<div id="elitePremiumV2"></div>');
 if(prog&&!$("eliteProgressV2")) prog.querySelector(".page-title")?.insertAdjacentHTML("afterend",'<div id="eliteProgressV2"></div>');
 if(wallet&&!$("eliteWalletV2")) wallet.querySelector(".page-title")?.insertAdjacentHTML("afterend",'<div id="eliteWalletV2"></div>');
 if(org&&!$("eliteOrganizerV2")) org.querySelector(".page-title")?.insertAdjacentHTML("afterend",'<div id="eliteOrganizerV2"></div>');
 if(king&&!$("eliteKingV2")) king.querySelector(".king-header")?.insertAdjacentHTML("afterend",'<div id="eliteKingV2"></div>');
}

let rankMode="rating",rankQ="";
async function renderEliteRanking(){
 const box=$("rankingList"),hero=$("eliteRankingHero"); if(!box||!window.supabaseClient)return;
 const {data,error}=await supabaseClient.from("profiles").select("id,username,display_name,avatar_url,rating,wins,losses,draws,points,level,title,premium,online,current_streak,best_streak");
 if(error){box.innerHTML='<div class="empty-card">تعذر تحميل الترتيب.</div>';return}
 let rows=data||[];
 rows.sort((a,b)=>rankMode==="points"?Number(b.points||0)-Number(a.points||0):rankMode==="wins"?Number(b.wins||0)-Number(a.wins||0):rankMode==="winrate"?((Number(b.wins||0)/Math.max(1,Number(b.wins||0)+Number(b.losses||0)+Number(b.draws||0)))-(Number(a.wins||0)/Math.max(1,Number(a.wins||0)+Number(a.losses||0)+Number(a.draws||0)))):Number(b.rating||0)-Number(a.rating||0));
 rows=rows.filter(p=>!rankQ||String(p.display_name||"").toLowerCase().includes(rankQ)||String(p.username||"").toLowerCase().includes(rankQ));
 const me=rows.find(p=>p.id===currentUser?.id), pos=me?rows.findIndex(p=>p.id===me.id)+1:null;
 if(hero) hero.innerHTML=me?'<div><span>YOUR RANK</span><strong>#'+pos+'</strong><small>'+esc(me.display_name||me.username)+'</small></div><div><span>RATING</span><strong>'+Number(me.rating||0)+'</strong><small>🔥 '+Number(me.current_streak||0)+' streak</small></div><div><span>FORM</span><strong>'+Number(me.wins||0)+'W</strong><small>'+Number(me.losses||0)+'L · '+Number(me.draws||0)+'D</small></div><div><span>LEVEL</span><strong>LV.'+Number(me.level||1)+'</strong><small>'+esc(me.title||"Player")+'</small></div>':'<div><span>RANKING</span><strong>—</strong><small>دخل للحساب باش تشوف ترتيبك</small></div>';
 box.innerHTML=rows.slice(0,50).map((p,i)=>{const wr=Math.round(Number(p.wins||0)/Math.max(1,Number(p.wins||0)+Number(p.losses||0)+Number(p.draws||0))*100);return '<article class="elite-rank-card '+(p.id===currentUser?.id?"is-me":"")+'"><div class="elite-rank-pos">'+(i+1)+'</div><div class="elite-rank-avatar">'+esc(initials(p.display_name||p.username))+'</div><div class="elite-rank-main"><strong>'+esc(p.display_name||p.username||"Player")+(p.premium?' 💎':'')+'</strong><small>@'+esc(p.username||"player")+' · LV.'+Number(p.level||1)+'</small></div><div class="elite-rank-stat"><strong>'+Number(p.rating||0)+'</strong><small>Rating</small></div><div class="elite-rank-stat"><strong>'+wr+'%</strong><small>Win Rate</small></div><div class="elite-rank-stat"><strong>'+Number(p.points||0)+'</strong><small>Points</small></div></article>'}).join("")||'<div class="empty-card">ما كاين حتى لاعب بهاد البحث.</div>';
}
function rankEvents(){
 const tabs=$("eliteRankTabs"); if(tabs&&!tabs.dataset.ready){tabs.dataset.ready="1";tabs.onclick=e=>{const b=e.target.closest("[data-rank]");if(!b)return;rankMode=b.dataset.rank;tabs.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));renderEliteRanking()};$("eliteRankSearch").oninput=e=>{rankQ=e.target.value.toLowerCase().trim();renderEliteRanking()}}
}

async function renderEliteProfile(){
 const box=$("eliteProfileProgress");if(!box||!currentProfile)return;
 const total=Number(currentProfile.wins||0)+Number(currentProfile.losses||0)+Number(currentProfile.draws||0),wr=Math.round(Number(currentProfile.wins||0)/Math.max(1,total)*100),xp=Number(currentProfile.xp||0),level=Number(currentProfile.level||1),next=Math.max(250,level*250),pct=Math.min(100,Math.round((xp%250)/250*100));
 box.innerHTML='<article><span>⚡ POWER</span><strong>'+Number(currentProfile.rating||0)+'</strong><small>Competitive Rating</small></article><article><span>📈 FORM</span><strong>'+wr+'%</strong><small>'+Number(currentProfile.wins||0)+'W · '+Number(currentProfile.losses||0)+'L</small></article><article><span>🔥 STREAK</span><strong>'+Number(currentProfile.current_streak||0)+'</strong><small>Best '+Number(currentProfile.best_streak||0)+'</small></article><article><span>🎯 XP</span><strong>LV.'+level+'</strong><div class="elite-xp"><i style="width:'+pct+'%"></i></div><small>'+xp+' XP · next '+next+'</small></article>';
}

async function renderEliteNotifications(){
 const box=$("notificationsList"),head=$("eliteNotifHead");if(!box||!currentUser)return;
 const {data,error}=await supabaseClient.from("notifications").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(80);
 if(error){box.innerHTML='<div class="empty-card">تعذر تحميل الإشعارات.</div>';return}
 const rows=data||[],unread=rows.filter(x=>x.read===false||x.is_read===false).length;
 if(head)head.innerHTML='<div><span>NOTIFICATIONS</span><strong>'+unread+'</strong><small>إشعار غير مقروء</small></div><button class="secondary-btn" id="eliteNotifRefresh">تحديث</button>';
 box.innerHTML=rows.map(n=>'<article class="elite-notif '+((n.read===false||n.is_read===false)?"unread":"")+'"><span class="elite-notif-icon">🔔</span><div><strong>'+esc(n.title||n.type||"إشعار")+'</strong><p>'+esc(n.body||n.message||"كاين تحديث جديد فالحساب ديالك.")+'</p><small>'+fmt(n.created_at)+'</small></div></article>').join("")||'<div class="empty-card">ما عندك حتى إشعار جديد.</div>';
 $("eliteNotifRefresh")?.addEventListener("click",renderEliteNotifications);
}

function renderElitePremium(){
 const box=$("elitePremiumV2");if(!box)return;const p=currentProfile||{};const active=!!p.premium||p.role==="owner";
 box.innerHTML='<div class="elite-premium-hero"><span>CHAOUI PREMIUM</span><strong>'+ (active?"ACTIVE 💎":"LEVEL UP 💎") +'</strong><p>'+ (active?"الحساب ديالك عندو وصول Premium.":"فتح تجربة متقدمة للاعبين اللي باغين إحصائيات ومزايا إضافية.") +'</p></div><div class="elite-premium-grid"><article>📊<strong>Advanced Stats</strong><small>تحليل الأداء والتقدم</small></article><article>🏆<strong>Priority Tournaments</strong><small>واجهة أوضح للبطولات المميزة</small></article><article>💎<strong>Premium Identity</strong><small>شارة ومظهر خاص</small></article><article>⚡<strong>Competitive Tools</strong><small>معلومات أسرع على المواجهات</small></article></div>';
}

async function renderEliteProgress(){
 const box=$("eliteProgressV2");if(!box||!currentProfile)return;const p=currentProfile,xp=Number(p.xp||0),lvl=Number(p.level||1),goal=lvl*250,pct=Math.min(100,Math.round((xp%250)/250*100));
 let ach=0,ch=0;try{const [a,c]=await Promise.all([supabaseClient.from("player_achievements").select("id",{count:"exact",head:true}).eq("player_id",currentUser.id),supabaseClient.from("player_challenges").select("id",{count:"exact",head:true}).eq("player_id",currentUser.id)]);ach=a.count||0;ch=c.count||0}catch{}
 box.innerHTML='<section class="elite-roadmap"><div class="elite-roadmap-head"><div><span>PLAYER ROADMAP</span><h2>التقدم ديالك ماشي غير رقم</h2></div><strong>LV.'+lvl+'</strong></div><div class="elite-roadmap-xp"><div><span>'+xp+' XP</span><b>'+goal+' XP</b></div><i><em style="width:'+pct+'%"></em></i></div><div class="elite-roadmap-grid"><div>🏆<strong>'+ach+'</strong><small>Achievements</small></div><div>🎯<strong>'+ch+'</strong><small>Challenges</small></div><div>🔥<strong>'+Number(p.current_streak||0)+'</strong><small>Current Streak</small></div><div>🪙<strong>'+Number(p.coins||0)+'</strong><small>Coins</small></div></div></section>';
}

async function renderEliteWallet(){
 const box=$("eliteWalletV2");if(!box||!currentProfile)return;
 let ledger=[];try{const r=await supabaseClient.from("coin_ledger").select("*").eq("player_id",currentUser.id).order("created_at",{ascending:false}).limit(8);ledger=r.data||[]}catch{}
 box.innerHTML='<section class="elite-wallet-hero"><div><span>CHAoui WALLET</span><strong>🪙 '+Number(currentProfile.coins||0)+'</strong><small>الرصيد الحالي</small></div><div><span>DAILY LOOP</span><strong>Coins → Rewards</strong><small>لعب · إنجاز · تحديات · مكافآت</small></div></section><div class="elite-wallet-grid">'+ledger.map(x=>'<div><span>'+esc(x.reason||x.description||"عملية")+'</span><strong class="'+(Number(x.amount||0)<0?"minus":"plus")+'">'+(Number(x.amount||0)>0?"+":"")+Number(x.amount||0)+'</strong></div>').join("")||'<div class="empty-card">مازال ما كايناش عمليات.</div>'+'</div>';
}

async function renderEliteOrganizer(){
 const box=$("eliteOrganizerV2");if(!box||!currentProfile)return;
 if(!["organizer","owner"].includes(currentProfile.role)){box.innerHTML="";return}
 const {data:ts}=await supabaseClient.from("tournaments").select("id,status,current_players,capacity,created_at").eq("organizer_id",currentUser.id);
 const rows=ts||[],players=rows.reduce((s,t)=>s+Number(t.current_players||0),0),live=rows.filter(t=>t.status==="live").length;
 box.innerHTML='<section class="elite-manager"><div class="elite-manager-head"><div><span>ORGANIZER HQ</span><h2>مركز قيادة البطولات</h2></div><button class="primary-btn" data-page="tournaments">شوف البطولات</button></div><div class="elite-manager-grid"><div><strong>'+rows.length+'</strong><small>البطولات</small></div><div><strong>'+live+'</strong><small>مباشرة</small></div><div><strong>'+players+'</strong><small>مشاركات</small></div><div><strong>'+Number(currentProfile.rating||0)+'</strong><small>Rating ديالك</small></div></div><div class="elite-manager-actions"><button class="secondary-btn" id="eliteOrgCreate">➕ بطولة جديدة</button><button class="secondary-btn" data-page="complaints">🎫 الشكايات</button><button class="secondary-btn" data-page="matches">⚔️ المباريات</button></div></section>';
 $("eliteOrgCreate")?.addEventListener("click",()=>window.openCreateTournamentModal?openCreateTournamentModal():toast("فتح إنشاء البطولة من صفحة البطولات."));
}

async function renderEliteKing(){
 const box=$("eliteKingV2");if(!box||!currentProfile)return;
 if(currentProfile.role!=="owner"){box.innerHTML='<div class="empty-card">هاد الصفحة خاصة بالـOwner.</div>';return}
 const [{data:ps},{data:ts},{data:ms}]=await Promise.all([supabaseClient.from("profiles").select("id,rating,premium,online,role"),supabaseClient.from("tournaments").select("id,status"),supabaseClient.from("matches").select("id,status")]);
 const premium=(ps||[]).filter(x=>x.premium).length,online=(ps||[]).filter(x=>x.online).length;
 box.innerHTML='<section class="elite-king-dashboard"><div class="elite-manager-head"><div><span>KING CONTROL</span><h2>لوحة قيادة المنصة 👑</h2></div><span class="elite-live-dot">● LIVE</span></div><div class="elite-king-grid"><div><strong>'+(ps||[]).length+'</strong><small>Players</small></div><div><strong>'+online+'</strong><small>Online</small></div><div><strong>'+premium+'</strong><small>Premium</small></div><div><strong>'+(ts||[]).filter(x=>x.status==="live").length+'</strong><small>Live Tournaments</small></div><div><strong>'+(ms||[]).filter(x=>x.status==="scheduled").length+'</strong><small>Scheduled Matches</small></div><div><strong>'+(ms||[]).filter(x=>x.status==="result_submitted").length+'</strong><small>Pending Results</small></div></div><div class="elite-king-note">الأرقام مباشرة من قاعدة البيانات. التغييرات الحساسة بقات مربوطة بصلاحيات الـOwner الموجودة أصلاً.</div></section>';
}

function performance(){
 if(!document.getElementById("elitePerfMeta")){const m=document.createElement("meta");m.id="elitePerfMeta";m.name="theme-color";m.content="#07111f";document.head.appendChild(m)}
 if("connection" in navigator&&navigator.connection?.saveData) document.documentElement.classList.add("save-data");
 document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();const input=$("playerSearchInput")||$("eliteRankSearch");input?.focus();input?.scrollIntoView({behavior:"smooth",block:"center"})}});
}
function hook(){
 injectShell();rankEvents();performance();
 const orig={ranking:window.renderRanking,profile:window.renderProfile,notifications:window.renderNotifications,premium:window.renderPremium,progression:window.renderProgression,wallet:window.renderWallet,organizer:window.renderOrganizer,king:window.renderKing};
 window.renderRanking=async()=>{await renderEliteRanking()};window.renderProfile=async()=>{if(orig.profile)await orig.profile();await renderEliteProfile()};
 window.renderNotifications=renderEliteNotifications;window.renderPremium=renderElitePremium;
 window.renderProgression=async()=>{if(orig.progression)await orig.progression();await renderEliteProgress()};
 window.renderWallet=async()=>{if(orig.wallet)await orig.wallet();await renderEliteWallet()};
 window.renderOrganizer=async()=>{if(orig.organizer)await orig.organizer();await renderEliteOrganizer()};
 window.renderKing=async()=>{if(orig.king)await orig.king();await renderEliteKing()};
 setTimeout(()=>{renderEliteRanking();renderEliteProfile();renderEliteNotifications();renderElitePremium();renderEliteProgress();renderEliteWallet();renderEliteOrganizer();renderEliteKing()},350);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",hook);else hook();
})();