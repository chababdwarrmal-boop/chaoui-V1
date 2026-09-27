/* CHAoui V23 — product shell, usability and operational redesign */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const esc=v=>window.escapeHTML?window.escapeHTML(v??""):String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const logo="chaoui-mark.svg";
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let started=false, baseShowPage=null, playerMounted=false, ownerMounted=false;
let ownerTab="overview", ownerCache={players:[],tournaments:[],matches:[],complaints:[],registrations:[],settings:null};

function toast(message){
 const old=$("v23Toast");if(old)old.remove();
 const n=document.createElement("div");n.id="v23Toast";n.className="v23-toast";n.textContent=message;document.body.append(n);
 setTimeout(()=>n.remove(),2600);
}
function statusLabel(s){
 const map={open:["مفتوحة","green"],live:["مباشرة","red"],done:["منتهية","gold"],scheduled:["مجدولة","gold"],result_submitted:["في انتظار التأكيد","gold"],finished:["منتهية","green"],pending:["في الانتظار","gold"],accepted:["مقبول","green"],waitlist:["لائحة الانتظار","gold"],rejected:["مرفوض","red"]};
 const x=map[s]||[s||"—",""];
 return '<span class="v23-pill '+x[1]+'">'+esc(x[0])+"</span>";
}
function avatar(name){return esc((String(name||"C").trim()[0]||"C").toUpperCase())}
function fmtDate(v){if(!v)return"—";try{return new Date(v).toLocaleString("ar-MA",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}catch{return"—"}}
function setLogo(scope=document){scope.querySelectorAll("img[src='logo.png'],img[src*='logo.png']").forEach(i=>i.src=logo)}

function shellTop(title,subtitle){
 return '<div class="v23-topbar"><div class="v23-brand"><img src="'+logo+'" alt="CHAoui PRO"><div class="v23-brand-copy"><b>CHAoui PRO</b><small>eFootball • Tournament Platform</small></div></div><div class="v23-top-actions"><button class="v23-icon-btn" type="button" data-page="notifications" title="الإشعارات">◈</button><button class="v23-icon-btn" type="button" data-page="profile" title="الحساب">◎</button></div></div><div class="v23-title"><span class="eyebrow">'+esc(subtitle||"PLAYER")+'</span><h1>'+esc(title)+'</h1></div>';
}
function bottomNav(active){
 const items=[["home","⌂","الرئيسية"],["tournaments","♜","البطولات"],["matches","⚔","المباريات"],["ranking","🏆","الترتيب"],["profile","◎","حسابي"]];
 return '<nav class="v23-bottom-nav">'+items.map(x=>'<button type="button" class="'+(active===x[0]?"active":"")+'" data-page="'+x[0]+'"><i>'+x[1]+'</i><b>'+x[2]+"</b></button>").join("")+"</nav>";
}
function hidePlayerLegacy(){
 document.body.classList.add("v23-ready");
 document.querySelector(".p15-top")?.remove();
 document.querySelector(".p15-bottom")?.remove();
 document.querySelector("#app>.app-header")?.classList.add("v23-hidden");
 document.querySelector("#bottomNav")?.classList.add("v23-hidden");
 ["wallet","premium","hall","progression","clubs","season","feed","assistant","more"].forEach(id=>$(id)?.classList.add("v23-hidden"));
}
function page(id){const p=$(id);if(!p)return null;p.className="page v23-page";p.style.display="";return p}
function bindPageButtons(root){
 root.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>window.showPage?.(b.dataset.page));
 root.querySelectorAll("[data-action]").forEach(b=>{b.onclick=()=>runAction(b.dataset.action,b.dataset.id||"")});
 setLogo(root);
}
async function runAction(action,id){
 if(action==="tournament"){window.openTournament?.(id);return}
 if(action==="create"){window.openCreateTournament?.();return}
 if(action==="match"){window.openMatchRoom?.(id);return}
 if(action==="submit"){window.openSubmitResult?.(id);return}
 if(action==="confirm"){window.confirmSubmittedResult?.(id);return}
 if(action==="dispute"){window.openMatchDispute?.(id);return}
 if(action==="organizer"){window.openOrganizerAccessModal?.(id);return}
}

async function playerStats(){
 const p=window.currentProfile||{},uid=window.currentUser?.id;
 const matches=[];
 if(uid&&window.supabaseClient){
  const r=await supabaseClient.from("matches").select("*").or("player_a.eq."+uid+",player_b.eq."+uid).order("scheduled_at",{ascending:false}).limit(50);
  matches.push(...(r.data||[]));
 }
 const total=Number(p.wins||0)+Number(p.losses||0)+Number(p.draws||0);
 return {p,matches,total,winRate:total?Math.round(Number(p.wins||0)/total*100):0};
}
async function renderPlayerHome(){
 const p=page("home");if(!p)return;
 const s=await playerStats();
 const me=s.p,n=me.display_name||me.username||"CHAoui Player";
 const upcoming=s.matches.find(m=>["scheduled","result_submitted"].includes(m.status)&&new Date(m.scheduled_at||0)>=new Date())||s.matches.find(m=>["scheduled","result_submitted"].includes(m.status));
 let opp=null;
 if(upcoming&&window.supabaseClient){
  const oid=upcoming.player_a===window.currentUser?.id?upcoming.player_b:upcoming.player_a;
  if(oid){const r=await supabaseClient.from("profiles").select("display_name,username,rating").eq("id",oid).maybeSingle();opp=r.data||null}
 }
 let tournaments=[];
 if(window.supabaseClient){
  const tr=await supabaseClient.from("tournaments").select("id,name,status,format,game,current_players,capacity,start_at,entry_type").order("created_at",{ascending:false}).limit(4);
  tournaments=tr.data||[];
 }
 p.innerHTML='<div class="v23-wrap">'+shellTop("الرئيسية","PLAYER COMMAND CENTER")+
 '<section class="v23-hero"><div class="v23-hero-copy"><span class="v23-hero-kicker">⚡ CHAOUI PLAYER</span><h2>مرحبا <span>'+esc(n)+'</span></h2><p>من هنا كتبدأ المنافسة: البطولة، المباراة، النتيجة، ثم الترتيب. بلا زواق زايد وبلا صفحات كتضيعك.</p><div class="v23-hero-actions"><button class="v23-btn primary" data-page="tournaments">شوف البطولات</button><button class="v23-btn" data-page="profile">الحساب ديالي</button></div></div><div class="v23-hero-visual"><img src="'+logo+'" alt="CHAoui PRO"></div></section>'+
 '<div class="v23-grid cols-4">'+
 '<article class="v23-card v23-kpi cyan"><span>RATING</span><b>'+Number(me.rating||0)+'</b></article>'+
 '<article class="v23-card v23-kpi gold"><span>POINTS</span><b>'+Number(me.points||0)+'</b></article>'+
 '<article class="v23-card v23-kpi green"><span>WINS</span><b>'+Number(me.wins||0)+'</b></article>'+
 '<article class="v23-card"><span class="v23-muted" style="color:var(--v23-muted)">WIN RATE</span><b style="font-size:25px">'+s.winRate+'%</b></article></div>'+
 '<section class="v23-section"><div class="v23-section-head"><h3>المواجهة الجاية</h3><span>NEXT MATCH</span></div>'+
 (upcoming?'<article class="v23-match"><div class="v23-player"><div class="v23-avatar">'+avatar(n)+'</div><b>'+esc(n)+'</b><small>RATING '+Number(me.rating||0)+'</small></div><div class="v23-vs"><strong>VS</strong><span>'+esc(upcoming.round||"MATCH")+'</span></div><div class="v23-player"><div class="v23-avatar">'+avatar(opp?.display_name||opp?.username||"?")+'</div><b>'+esc(opp?.display_name||opp?.username||"المنافس")+'</b><small>RATING '+Number(opp?.rating||0)+'</small></div></article><div class="v23-hero-actions" style="margin-top:9px"><button class="v23-btn primary" data-action="match" data-id="'+esc(upcoming.id)+'">فتح المباراة</button></div>':'<div class="v23-empty"><b>ما عندك حتى مواجهة دابا</b>سجل فبطولة مفتوحة باش تبدأ المنافسة.</div>')+
 '</section>'+
 '<section class="v23-section"><div class="v23-section-head"><h3>البطولات المتاحة</h3><span>OPEN / LIVE</span></div>'+
 '<div class="v23-grid cols-2">'+(tournaments.map(t=>'<article class="v23-card v23-tournament-card"><div class="v23-card-top"><div><h3>'+esc(t.name)+'</h3><p>'+esc(t.game||"eFootball")+' · '+esc(t.format||"1VS1")+'</p></div>'+statusLabel(t.status)+'</div><div class="v23-meta"><span class="v23-pill">'+Number(t.current_players||0)+' / '+Number(t.capacity||0)+'</span><span class="v23-pill gold">'+esc(t.entry_type||"free")+'</span></div><div class="v23-hero-actions"><button class="v23-btn" data-action="tournament" data-id="'+esc(t.id)+'">تفاصيل البطولة</button></div></article>').join("")||'<div class="v23-empty"><b>ما كايناش بطولات متاحة</b>خلي عينك على الإعلانات ديال المنظم.</div>')+'</div></section></div>'+bottomNav("home");
 bindPageButtons(p);
}
async function renderTournaments(){
 const p=page("tournaments");if(!p)return;
 let data=[];if(window.supabaseClient){const r=await supabaseClient.from("tournaments").select("id,name,description,status,format,game,current_players,capacity,start_at,end_at,entry_type,created_at").order("created_at",{ascending:false}).limit(60);data=r.data||[]}
 p.innerHTML='<div class="v23-wrap">'+shellTop("البطولات","COMPETITION HUB")+
 '<section class="v23-hero" style="grid-template-columns:1fr"><div class="v23-hero-copy"><span class="v23-hero-kicker">🏆 FIND YOUR COMPETITION</span><h2>اختار البطولة ودخل مباشرة فالمنافسة.</h2><p>كل بطاقة كتوريك الحالة، عدد المشاركين والصيغة قبل ما تدخل للتفاصيل.</p></div></section>'+
 '<div class="v23-grid cols-2">'+(data.map(t=>'<article class="v23-card v23-tournament-card"><div class="v23-card-top"><div><h3>'+esc(t.name)+'</h3><p>'+esc(t.description||"بطولة eFootball منظمة داخل CHAoui.")+'</p></div>'+statusLabel(t.status)+'</div><div class="v23-meta"><span class="v23-pill">🎮 '+esc(t.game||"eFootball")+'</span><span class="v23-pill">♟ '+esc(t.format||"1VS1")+'</span><span class="v23-pill">👥 '+Number(t.current_players||0)+'/'+Number(t.capacity||0)+'</span><span class="v23-pill gold">⏱ '+fmtDate(t.start_at)+'</span></div><div class="v23-hero-actions"><button class="v23-btn '+(t.status==="open"?"primary":"")+'" data-action="tournament" data-id="'+esc(t.id)+'">'+(t.status==="open"?"التسجيل / التفاصيل":"فتح البطولة")+'</button></div></article>').join("")||'<div class="v23-empty"><b>ما كاين حتى بطولة</b>المنظم يقدر يطلق بطولة جديدة من لوحة الإدارة.</div>')+'</div></div>'+bottomNav("tournaments");
 bindPageButtons(p);
}
async function renderMatches(){
 const p=page("matches");if(!p)return;const uid=window.currentUser?.id;let data=[];if(uid&&window.supabaseClient){const r=await supabaseClient.from("matches").select("*").or("player_a.eq."+uid+",player_b.eq."+uid).order("scheduled_at",{ascending:false}).limit(80);data=r.data||[]}
 const ids=[...new Set(data.flatMap(m=>[m.player_a,m.player_b]).filter(Boolean))];let profiles={};if(ids.length){const r=await supabaseClient.from("profiles").select("id,display_name,username,rating").in("id",ids);(r.data||[]).forEach(x=>profiles[x.id]=x)}
 const cards=data.map(m=>{const oid=m.player_a===uid?m.player_b:m.player_a;const opp=profiles[oid]||{};const st=m.status||"scheduled";let action=st==="scheduled"?"submit":st==="result_submitted"?"confirm":"match";return '<article class="v23-card"><div class="v23-section-head"><h3>'+esc(m.round||"Match")+'</h3>'+statusLabel(st)+'</div><div class="v23-match"><div class="v23-player"><div class="v23-avatar">'+avatar(window.currentProfile?.display_name||window.currentProfile?.username)+'</div><b>أنت</b><small>RATING '+Number(window.currentProfile?.rating||0)+'</small></div><div class="v23-vs"><strong>'+(m.score_a!=null&&m.score_b!=null?esc(m.score_a)+" : "+esc(m.score_b):"VS")+'</strong><span>'+fmtDate(m.scheduled_at)+'</span></div><div class="v23-player"><div class="v23-avatar">'+avatar(opp.display_name||opp.username||"?")+'</div><b>'+esc(opp.display_name||opp.username||"المنافس")+'</b><small>RATING '+Number(opp.rating||0)+'</small></div></div><div class="v23-hero-actions">'+(st==="scheduled"?'<button class="v23-btn primary" data-action="submit" data-id="'+esc(m.id)+'">إرسال النتيجة</button>':st==="result_submitted"?'<button class="v23-btn gold" data-action="confirm" data-id="'+esc(m.id)+'">تأكيد النتيجة</button><button class="v23-btn danger" data-action="dispute" data-id="'+esc(m.id)+'">فتح نزاع</button>':'<button class="v23-btn" data-action="match" data-id="'+esc(m.id)+'">Match Room</button>')+'</div></article>'}).join("");
 p.innerHTML='<div class="v23-wrap">'+shellTop("مبارياتي","MATCH CENTER")+"<div class=\"v23-grid\">"+(cards||'<div class="v23-empty"><b>مازال ما كايناش مباريات.</b>منين يتم قبولك فبطولة، المباريات ديالك غادي تبان هنا.</div>')+"</div></div>"+bottomNav("matches");
 bindPageButtons(p);
}
async function renderRanking(){
 const p=page("ranking");if(!p)return;let data=[];if(window.supabaseClient){const r=await supabaseClient.from("profiles").select("id,display_name,username,rating,points,wins,losses,draws").order("rating",{ascending:false}).limit(25);data=r.data||[]}
 const uid=window.currentUser?.id;const mine=data.findIndex(x=>x.id===uid);p.innerHTML='<div class="v23-wrap">'+shellTop("الترتيب","COMPETITIVE LADDER")+
 '<section class="v23-hero" style="grid-template-columns:1fr"><div class="v23-hero-copy"><span class="v23-hero-kicker">🏆 LIVE RANKING</span><h2>كل مباراة كتبدل المركز ديالك.</h2><p>الترتيب هنا مباشر من بيانات اللاعبين الحالية. ركز على الأداء والمباريات.</p></div></section>'+
 '<section class="v23-card"><div class="v23-section-head"><h3>المتصدرين</h3><span>'+data.length+' PLAYERS</span></div><div class="v23-list">'+(data.map((x,i)=>'<div class="v23-row"><div class="v23-row-main"><b>#'+(i+1)+' · '+esc(x.display_name||x.username||"Player")+(x.id===uid?' · أنت':'')+'</b><small>@'+esc(x.username||"player")+' · '+Number(x.wins||0)+' فوز · '+(Number(x.wins||0)+Number(x.losses||0)+Number(x.draws||0))+' مباراة</small></div><div class="v23-row-meta"><span class="v23-pill cyan">'+Number(x.rating||0)+' Rating</span><span class="v23-pill gold">'+Number(x.points||0)+' PTS</span></div></div>').join("")||'<div class="v23-empty"><b>مازال ما كاين حتى ترتيب.</b>بدا أول بطولة.</div>')+'</div></section>'+
 (mine>=0?'<section class="v23-section"><div class="v23-card"><b>مركزك الحالي: #'+(mine+1)+'</b><div class="v23-progress" style="margin-top:9px"><span style="width:'+Math.max(8,Math.min(100,((25-mine)/25)*100))+'%"></span></div></div></section>':"")+'</div>'+bottomNav("ranking");
 bindPageButtons(p);
}
async function renderProfile(){
 const p=page("profile");if(!p)return;const me=window.currentProfile||{};const total=Number(me.wins||0)+Number(me.losses||0)+Number(me.draws||0),wr=total?Math.round(Number(me.wins||0)/total*100):0,n=me.display_name||me.username||"CHAoui Player";
 p.innerHTML='<div class="v23-wrap">'+shellTop("حسابي","PLAYER IDENTITY")+
 '<section class="v23-card"><div class="v23-profile"><div class="v23-profile-main"><div class="v23-big-avatar">'+avatar(n)+'</div><div><h2>'+esc(n)+'</h2><p>@'+esc(me.username||"chaoui_player")+'</p><div class="v23-profile-badges"><span class="v23-pill cyan">PLAYER</span><span class="v23-pill gold">RATING '+Number(me.rating||0)+'</span><span class="v23-pill">'+esc(me.efootball_name||"eFootball")+'</span></div></div></div><div class="v23-card" style="margin:0;background:#081421"><span style="color:var(--v23-muted);font-size:9px">WIN RATE</span><b style="display:block;font-size:29px;margin-top:5px;color:var(--v23-green)">'+wr+'%</b></div></div><div class="v23-stat-grid"><div class="v23-stat-box"><span>مباريات</span><b>'+total+'</b></div><div class="v23-stat-box"><span>فوز</span><b>'+Number(me.wins||0)+'</b></div><div class="v23-stat-box"><span>نقاط</span><b>'+Number(me.points||0)+'</b></div><div class="v23-stat-box"><span>أفضل Rating</span><b>'+Number(me.rating||0)+'</b></div></div></section>'+
 '<section class="v23-section"><div class="v23-section-head"><h3>الوصول السريع</h3><span>ACCOUNT</span></div><div class="v23-grid cols-2"><button class="v23-card" type="button" data-page="chat" style="text-align:right"><h3>💬 الرسائل</h3><p>تواصل مع اللاعبين أو المنظم عند الحاجة.</p></button><button class="v23-card" type="button" data-page="settings" style="text-align:right"><h3>⚙️ إعدادات الحساب</h3><p>الأمان، الحالة وتسجيل الخروج.</p></button><button class="v23-card" type="button" data-page="complaints" style="text-align:right"><h3>🛠️ مساعدة وشكايات</h3><p>إلا وقع مشكل فمباراة ولا التسجيل، بلغنا.</p></button><button class="v23-card" type="button" data-page="notifications" style="text-align:right"><h3>🔔 الإشعارات</h3><p>آخر أخبار البطولة والنتائج.</p></button></div></section></div>'+bottomNav("profile");
 bindPageButtons(p);
}
function renderSimplePage(id,title,subtitle,body){
 const p=page(id);if(!p)return;p.innerHTML='<div class="v23-wrap">'+shellTop(title,subtitle)+'<div class="v23-card">'+body+'</div></div>'+bottomNav("profile");bindPageButtons(p);
}
function renderPlayer(pageName){
 hidePlayerLegacy();
 if(pageName==="home")return renderPlayerHome();
 if(pageName==="tournaments")return renderTournaments();
 if(pageName==="matches")return renderMatches();
 if(pageName==="ranking")return renderRanking();
 if(pageName==="profile")return renderProfile();
 if(pageName==="notifications")return renderSimplePage("notifications","الإشعارات","UPDATES",'<div class="v23-empty"><b>الإشعارات ديالك كيجيو هنا.</b>أخبار المنظم، النتائج وتغييرات المباريات.</div>');
 if(pageName==="settings")return renderSimplePage("settings","الإعدادات","ACCOUNT",'<div class="v23-grid"><button class="v23-btn danger" type="button" id="v23Logout">تسجيل الخروج</button></div>');
 if(pageName==="complaints")return renderSimplePage("complaints","مركز المساعدة","SUPPORT",'<div class="v23-empty"><b>عندك مشكل؟</b>استعمل زر الشكاية الموجود فمركز الدعم الحالي أو تواصل مع المنظم.</div>');
 return null;
}

async function loadOwner(){
 if(!["owner","organizer"].includes(window.currentProfile?.role))return;
 const q=async()=>Promise.all([
  supabaseClient.from("profiles").select("id,display_name,username,role,rating,points,wins,losses,draws,player_code,created_at").order("created_at",{ascending:false}).limit(200),
  supabaseClient.from("tournaments").select("id,name,status,format,game,current_players,capacity,start_at,entry_type,organizer_id,created_at").order("created_at",{ascending:false}).limit(100),
  supabaseClient.from("matches").select("id,tournament_id,player_a,player_b,status,round,score_a,score_b,scheduled_at").order("scheduled_at",{ascending:false}).limit(100),
  supabaseClient.from("complaints").select("*").order("created_at",{ascending:false}).limit(50),
  supabaseClient.from("tournament_players").select("id,tournament_id,player_id,status,registration_name,registration_whatsapp,registration_efootball_name,registration_type,preferred_time,connection_type,created_at").order("created_at",{ascending:false}).order("created_at",{ascending:false}).limit(100),
  supabaseClient.from("app_settings").select("*").eq("id",1).maybeSingle()
 ]);
 const [p,t,m,c,r,s]=await q();
 ownerCache={players:p.data||[],tournaments:t.data||[],matches:m.data||[],complaints:c.data||[],registrations:r.data||[],settings:s.data||null};
 if(window.currentProfile?.role==="organizer"){
   const uid=window.currentUser?.id;
   const ownTournamentIds=new Set(ownerCache.tournaments.filter(x=>x.organizer_id===uid).map(x=>x.id));
   const ownRegistrations=ownerCache.registrations.filter(x=>ownTournamentIds.has(x.tournament_id));
   const ownMatches=ownerCache.matches.filter(x=>ownTournamentIds.has(x.tournament_id));
   const ownPlayerIds=new Set(ownRegistrations.map(x=>x.player_id).filter(Boolean));
   ownerCache.tournaments=ownerCache.tournaments.filter(x=>ownTournamentIds.has(x.id));
   ownerCache.registrations=ownRegistrations;
   ownerCache.matches=ownMatches;
   ownerCache.players=ownerCache.players.filter(x=>ownPlayerIds.has(x.id)||x.id===uid);
   ownerCache.complaints=[];
 }
 return ownerCache;
}
function ownerShell(){
 const host=$("organizer")||$("king");if(!host)return;
 host.className="page v23-owner-shell active-page";host.style.display="block";
 const role=window.currentProfile?.role==="owner"?"OWNER":"ORGANIZER";
 const nav=[["overview","⌂","الرئيسية"],["registrations","📝","التسجيلات"],["tournaments","🏆","البطولات"],["players","👥","اللاعبون"],["matches","⚔","المباريات"],["issues","⚠","المشكلات"],["settings","⚙","الإعدادات"]];
 const navHtml=nav.map(x=>'<button type="button" class="'+(ownerTab===x[0]?"active":"")+'" data-otab="'+x[0]+'"><span>'+x[1]+"</span>"+x[2]+"</button>").join("");
 const mobileHtml=nav.slice(0,5).map(x=>'<button type="button" class="'+(ownerTab===x[0]?"active":"")+'" data-otab="'+x[0]+'"><span>'+x[1]+"</span><b>"+x[2]+"</b></button>").join("");
 host.innerHTML=`<div class="v23-owner-grid">
   <aside class="v23-owner-sidebar">
     <div class="v23-owner-brand"><img src="${logo}" alt="CHAoui PRO"><div><b>CHAoui PRO</b><small>${role} COMMAND CENTER</small></div></div>
     <div class="v23-owner-nav">${navHtml}</div>
     <button class="v23-btn danger" id="v23OwnerLogout" type="button" style="width:100%;margin-top:12px">تسجيل الخروج</button>
   </aside>
   <main class="v23-owner-main">
     <div class="v23-owner-top"><div><h1>${esc(ownerTab==="overview"?"مركز القيادة":nav.find(x=>x[0]===ownerTab)?.[2]||"لوحة الإدارة")}</h1><p>إدارة البطولة واللاعبين والمباريات من مكان واحد.</p></div><span class="v23-owner-badge">${role}</span></div>
     <div id="v23OwnerBody"></div>
   </main>
 </div><nav class="v23-owner-nav-mobile">${mobileHtml}</nav>`;
 bindOwnerNav(host);
}
function bindOwnerNav(host){host.querySelectorAll("[data-otab]").forEach(b=>b.onclick=async()=>{ownerTab=b.dataset.otab;await renderOwner()});$("v23OwnerLogout")?.addEventListener("click",()=>window.logoutUser?.())}
async function renderOwner(){
 await loadOwner();ownerShell();const body=$("v23OwnerBody");if(!body)return;
 const o=ownerCache;
 if(ownerTab==="overview"){
  const live=o.tournaments.filter(x=>x.status==="live").length,open=o.tournaments.filter(x=>x.status==="open").length,activeMatches=o.matches.filter(x=>["scheduled","result_submitted"].includes(x.status)).length,issues=o.complaints.filter(x=>!["resolved","closed"].includes(x.status)).length;
  body.innerHTML='<div class="v23-owner-kpis"><div class="v23-owner-kpi"><span>اللاعبون</span><b>'+o.players.length+'</b></div><div class="v23-owner-kpi"><span>بطولات مفتوحة</span><b>'+open+'</b></div><div class="v23-owner-kpi"><span>مباشرة</span><b>'+live+'</b></div><div class="v23-owner-kpi"><span>تدخل مطلوب</span><b>'+(o.registrations.length+activeMatches+issues)+'</b></div></div><section class="v23-owner-section"><div class="v23-owner-card"><div class="v23-section-head"><h3>أهم ما يحتاج تدخلك</h3><span>NOW</span></div><div class="v23-list"><div class="v23-row"><div class="v23-row-main"><b>طلبات التسجيل</b><small>قبول، لائحة انتظار أو رفض</small></div><div class="v23-row-meta"><span class="v23-pill gold">'+o.registrations.length+'</span><button class="v23-btn" data-otab="registrations">فتح</button></div></div><div class="v23-row"><div class="v23-row-main"><b>مباريات نشطة</b><small>نتائج مجدولة أو في انتظار التأكيد</small></div><div class="v23-row-meta"><span class="v23-pill cyan">'+activeMatches+'</span><button class="v23-btn" data-otab="matches">فتح</button></div></div><div class="v23-row"><div class="v23-row-main"><b>مشكلات مفتوحة</b><small>شكايات تحتاج متابعة</small></div><div class="v23-row-meta"><span class="v23-pill red">'+issues+'</span><button class="v23-btn danger" data-otab="issues">فتح</button></div></div></div></div></section><section class="v23-owner-section"><div class="v23-owner-card"><div class="v23-section-head"><h3>البطولات الأخيرة</h3><button class="v23-btn gold" data-action="create">+ إنشاء بطولة</button></div><div class="v23-list">'+(o.tournaments.slice(0,6).map(t=>'<div class="v23-row"><div class="v23-row-main"><b>'+esc(t.name)+'</b><small>'+esc(t.format||"1VS1")+' · '+Number(t.current_players||0)+'/'+Number(t.capacity||0)+'</small></div><div class="v23-row-meta">'+statusLabel(t.status)+'<button class="v23-btn" data-action="tournament" data-id="'+esc(t.id)+'">فتح</button></div></div>').join("")||'<div class="v23-empty"><b>مازال ما كاينة حتى بطولة.</b>أنشئ أول بطولة.</div>')+'</div></div></section>';
 } else if(ownerTab==="registrations"){
  const pids=[...new Set(o.registrations.map(x=>x.player_id).filter(Boolean))],tids=[...new Set(o.registrations.map(x=>x.tournament_id).filter(Boolean))];
  const [pr,tr]=await Promise.all([
    pids.length?supabaseClient.from("profiles").select("id,display_name,username,efootball_name,rating").in("id",pids):Promise.resolve({data:[]}),
    tids.length?supabaseClient.from("tournaments").select("id,name,capacity,current_players").in("id",tids):Promise.resolve({data:[]})
  ]);
  const pm={};(pr.data||[]).forEach(x=>pm[x.id]=x);const tm={};(tr.data||[]).forEach(x=>tm[x.id]=x);
  const pending=o.registrations.filter(x=>x.status==="pending"),waitlist=o.registrations.filter(x=>x.status==="waitlist"),processed=o.registrations.filter(x=>["accepted","rejected"].includes(x.status));
  body.innerHTML='<section class="v23-owner-section"><div class="v23-owner-card"><div class="v23-section-head"><div><h3>طلبات التسجيل</h3><span>'+pending.length+' جديدة · '+waitlist.length+' انتظار · '+processed.length+' معالجة</span></div><span>REVIEW</span></div><div class="v23-list">'+
    (o.registrations.slice().sort((a,b)=>String(a.status).localeCompare(String(b.status))).map(r=>{
      const p=pm[r.player_id]||{},t=tm[r.tournament_id]||{};
      const actions=r.status==="pending"||r.status==="waitlist"
        ? '<button class="v23-btn gold" data-review="accepted" data-id="'+esc(r.id)+'">قبول</button><button class="v23-btn" data-review="waitlist" data-id="'+esc(r.id)+'">انتظار</button><button class="v23-btn danger" data-review="rejected" data-id="'+esc(r.id)+'">رفض</button>'
        : '';
      return '<article class="v23-row" data-registration-row="'+esc(r.id)+'"><div class="v23-row-main"><b>'+esc(p.display_name||r.registration_name||"Player")+'</b><small>'+esc(t.name||"Tournament")+' · '+esc(r.registration_efootball_name||p.efootball_name||"eFootball")+' · WhatsApp '+esc(r.registration_whatsapp||"—")+'</small><small>الوقت: '+esc(r.preferred_time||"—")+' · الاتصال: '+esc(r.connection_type||"—")+' · '+fmtDate(r.created_at)+'</small></div><div class="v23-row-meta">'+statusLabel(r.status)+actions+'</div></article>';
    }).join("")||'<div class="v23-empty"><b>ما كايناش تسجيلات دابا.</b>منين لاعب يسجل غادي يبان هنا للمراجعة.</div>')+'</div></div></section>';
} else if(ownerTab==="tournaments"){
  body.innerHTML='<section class="v23-owner-section"><div class="v23-owner-card"><div class="v23-section-head"><h3>إدارة البطولات</h3><button class="v23-btn gold" data-action="create">+ بطولة جديدة</button></div><div class="v23-list">'+(o.tournaments.map(t=>'<div class="v23-row"><div class="v23-row-main"><b>'+esc(t.name)+'</b><small>'+esc(t.game||"eFootball")+' · '+esc(t.format||"1VS1")+' · '+Number(t.current_players||0)+'/'+Number(t.capacity||0)+'</small></div><div class="v23-row-meta">'+statusLabel(t.status)+'<button class="v23-btn" data-action="tournament" data-id="'+esc(t.id)+'">فتح</button></div></div>').join("")||'<div class="v23-empty"><b>لا بطولات.</b>أنشئ أول وحدة.</div>')+'</div></div></section>';
 } else if(ownerTab==="players"){
  body.innerHTML='<section class="v23-owner-section"><div class="v23-owner-card"><div class="v23-section-head"><h3>اللاعبون</h3><span>'+o.players.length+' TOTAL</span></div><input class="v23-owner-search" id="v23PlayerSearch" placeholder="قلب بالاسم أو username..."><div class="v23-list" id="v23PlayersList" style="margin-top:9px">'+o.players.map(p=>'<div class="v23-row v23-player-owner-row" data-search="'+esc((p.display_name||"")+" "+(p.username||""))+'"><div class="v23-row-main"><b>'+esc(p.display_name||p.username||"Player")+'</b><small>@'+esc(p.username||"player")+' · '+esc(p.role||"player")+' · Rating '+Number(p.rating||0)+'</small></div><div class="v23-row-meta"><span class="v23-pill cyan">'+Number(p.rating||0)+'</span>'+(p.role==="player"&&window.currentProfile?.role==="owner"?'<button class="v23-btn" data-action="organizer" data-id="'+esc(p.id)+'">إدارة الصلاحية</button>':"")+'</div></div>').join("")+'</div></div></section>';
  $("v23PlayerSearch")?.addEventListener("input",e=>{const q=e.target.value.toLowerCase().trim();document.querySelectorAll(".v23-player-owner-row").forEach(r=>r.style.display=!q||r.dataset.search.toLowerCase().includes(q)?"flex":"none")});
 } else if(ownerTab==="matches"){
  const ids=[...new Set(o.matches.flatMap(m=>[m.player_a,m.player_b]).filter(Boolean))];let pm={};if(ids.length){const r=await supabaseClient.from("profiles").select("id,display_name,username").in("id",ids);(r.data||[]).forEach(x=>pm[x.id]=x)}
  body.innerHTML='<section class="v23-owner-section"><div class="v23-owner-card"><div class="v23-section-head"><h3>المباريات</h3><span>'+o.matches.length+' TOTAL</span></div><div class="v23-list">'+(o.matches.map(m=>'<div class="v23-row"><div class="v23-row-main"><b>'+esc(m.round||"Match")+' · '+esc(pm[m.player_a]?.display_name||pm[m.player_a]?.username||"Player")+' VS '+esc(pm[m.player_b]?.display_name||pm[m.player_b]?.username||"Player")+'</b><small>'+fmtDate(m.scheduled_at)+'</small></div><div class="v23-row-meta">'+statusLabel(m.status)+'<button class="v23-btn" data-action="match" data-id="'+esc(m.id)+'">Match Room</button></div></div>').join("")||'<div class="v23-empty"><b>ما كايناش مباريات.</b></div>')+'</div></div></section>';
 } else if(ownerTab==="issues"){
  body.innerHTML='<section class="v23-owner-section"><div class="v23-owner-card"><div class="v23-section-head"><h3>المشكلات والشكايات</h3><span>'+o.complaints.length+' TOTAL</span></div><div class="v23-list">'+(o.complaints.map(c=>'<div class="v23-row"><div class="v23-row-main"><b>'+esc(c.subject||c.title||"شكاية")+'</b><small>'+esc(c.status||"open")+' · '+fmtDate(c.created_at)+'</small></div><div class="v23-row-meta"><button class="v23-btn danger" data-page="complaints">فتح</button></div></div>').join("")||'<div class="v23-empty"><b>ما كايناش شكايات.</b></div>')+'</div></div></section>';
 } else if(ownerTab==="settings"){
  const s=o.settings||{};body.innerHTML='<section class="v23-owner-section"><div class="v23-owner-card"><h3>حالة المنصة</h3><div class="v23-list"><div class="v23-row"><div class="v23-row-main"><b>التسجيل العام</b><small>هل يمكن للاعبين إنشاء حسابات جديدة؟</small></div><div class="v23-row-meta"><button class="v23-btn '+(s.registration_enabled?"gold":"")+'" data-setting="registration_enabled">'+(s.registration_enabled?"مفتوح":"مغلق")+'</button></div></div><div class="v23-row"><div class="v23-row-main"><b>الانضمام للبطولات</b><small>تحكم فدخول اللاعبين للبطولات المفتوحة.</small></div><div class="v23-row-meta"><button class="v23-btn '+(s.join_enabled?"gold":"")+'" data-setting="join_enabled">'+(s.join_enabled?"مفتوح":"مغلق")+'</button></div></div><div class="v23-row"><div class="v23-row-main"><b>الصيانة</b><small>قفل الواجهة أمام المستخدمين عند الحاجة.</small></div><div class="v23-row-meta"><button class="v23-btn danger" data-setting="maintenance">'+(s.maintenance?"مفعلة":"غير مفعلة")+'</button></div></div></div><p style="color:#756e66;font-size:9px;margin:12px 0 0">الصلاحيات الحساسة تبقى عند Owner. المنظم العادي يشوف التشغيل وما يبدلش إعدادات المنصة إلا بإذن Owner.</p></div></section>';
  if(window.currentProfile?.role!=="owner")body.querySelectorAll("[data-setting]").forEach(b=>b.disabled=true);
 }
 bindOwnerBody(body);
}
function bindOwnerBody(body){
 body.querySelectorAll("[data-otab]").forEach(b=>b.onclick=async()=>{ownerTab=b.dataset.otab;await renderOwner()});
 body.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>window.showPage?.(b.dataset.page));
 bindPageButtons(body);
 body.querySelectorAll("[data-review]").forEach(b=>b.onclick=async()=>{
   const id=b.dataset.id,decision=b.dataset.review;if(!id)return;
   body.querySelectorAll("[data-review]").forEach(x=>x.disabled=true);
   const r=await supabaseClient.rpc("review_tournament_registration",{p_registration_id:id,p_decision:decision});
   if(r.error){toast(r.error.message==="CAPACITY_REACHED"?"البطولة عامرة دابا. دير Waitlist أو زيد السعة.":"تعذر تحديث التسجيل.");await renderOwner();return}
   toast(decision==="accepted"?"تم قبول اللاعب ✓":decision==="waitlist"?"تحط فـ لائحة الانتظار ✓":"تم رفض التسجيل ✓");await renderOwner();
 });
 body.querySelectorAll("[data-setting]").forEach(b=>b.onclick=async()=>{if(window.currentProfile?.role!=="owner")return;const key=b.dataset.setting;const value=!Boolean(ownerCache.settings?.[key]);const r=await supabaseClient.from("app_settings").update({[key]:value}).eq("id",1);if(r.error)return toast("تعذر تغيير الإعداد.");toast("تبدلات حالة المنصة ✓");await renderOwner()});
}
async function renderStaff(){
 document.body.classList.add("v23-ready");document.querySelector(".p15-top")?.remove();document.querySelector(".p15-bottom")?.remove();
 document.querySelector("#home")?.classList.remove("active-page");
 await renderOwner();
}

function patchShowPage(){
 if(started||typeof window.showPage!=="function")return false;
 started=true;baseShowPage=window.showPage;
 window.showPage=function(target,...args){
  const staff=["owner","organizer"].includes(window.currentProfile?.role);
  if(staff&&(target==="organizer"||target==="king")){const r=baseShowPage.apply(this,[target,...args]);setTimeout(()=>renderStaff(),30);return r}
  if(!staff&&["home","tournaments","matches","ranking","profile","notifications","settings","complaints"].includes(target)){
   const r=baseShowPage.apply(this,[target,...args]);setTimeout(()=>renderPlayer(target),30);return r
  }
  return baseShowPage.apply(this,[target,...args]);
 };
 return true;
}
async function waitBoot(){
 let n=0;
 while(n<80){
  if(window.currentProfile&&typeof window.showPage==="function"){
   patchShowPage();
   const staff=["owner","organizer"].includes(window.currentProfile.role);
   if(staff){await renderStaff()}else{await renderPlayer(window.__chaouiInitialPage||"home")}
   return;
  }
  n++;await delay(250);
 }
}
function boot(){
 if(window.__chaouiV23)return;window.__chaouiV23=true;
 setLogo();waitBoot();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();