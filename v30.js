/* CHAoui V30 — one clean runtime for Player + Owner */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const esc=v=>window.escapeHTML?window.escapeHTML(v??""):String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const logo="chaoui-mark.svg";
let ready=false, ownerTab="overview", baseShowPage=null;
const owner={players:[],tournaments:[],matches:[],registrations:[],complaints:[]};

function avatar(name){return esc((String(name||"C").trim()[0]||"C").toUpperCase())}
function date(v){if(!v)return"—";try{return new Date(v).toLocaleString("ar-MA",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}catch{return"—"}}
function status(s){const m={open:["مفتوحة","green"],live:["مباشرة","red"],done:["منتهية","gold"],scheduled:["مجدولة","gold"],result_submitted:["انتظار التأكيد","gold"],finished:["منتهية","green"],pending:["في الانتظار","gold"],accepted:["مقبول","green"],waitlist:["لائحة الانتظار","gold"],rejected:["مرفوض","red"]};const x=m[s]||[s||"—",""];return'<span class="c30-pill '+x[1]+'">'+esc(x[0])+"</span>"}
function page(id){const p=$(id);if(!p)return null;p.className="page c30-page active-page";p.style.display="block";return p}
function setLogo(root=document){root.querySelectorAll('img[src="logo.png"]').forEach(i=>i.src=logo)}
function appbar(title,sub){
 return'<div class="c30-appbar"><div class="c30-appbrand"><img src="'+logo+'" alt="CHAoui"><div><b>CHAoui PRO</b><small>eFootball Tournament Platform</small></div></div><div class="c30-actions"><button class="c30-icon" data-page="notifications" title="الإشعارات">◈</button><button class="c30-icon" data-page="profile" title="الحساب">◎</button></div></div><div class="c30-heading"><div><span class="c30-eyebrow">'+esc(sub||"PLAYER")+'</span><h1>'+esc(title)+'</h1></div></div>';
}
function bottom(active){
 const items=[["home","⌂","الرئيسية"],["tournaments","🏆","البطولات"],["matches","⚔","المباريات"],["ranking","📊","الترتيب"],["profile","◎","حسابي"]];
 return'<nav class="c30-bottom">'+items.map(i=>'<button type="button" class="'+(active===i[0]?"active":"")+'" data-page="'+i[0]+'"><i>'+i[1]+'</i><b>'+i[2]+"</b></button>").join("")+"</nav>";
}
function bind(root){
 root.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>window.showPage?.(b.dataset.page));
 root.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>action(b.dataset.action,b.dataset.id||""));
 setLogo(root);
}
function action(a,id){
 if(a==="tournament")return window.openTournament?.(id);
 if(a==="match")return window.openMatchRoom?.(id);
 if(a==="submit")return window.openSubmitResult?.(id);
 if(a==="confirm")return window.confirmSubmittedResult?.(id);
 if(a==="dispute")return window.openMatchDispute?.(id);
 if(a==="create")return window.openCreateTournament?.();
 if(a==="organizer")return window.openOrganizerAccessModal?.(id);
}
async function profileStats(){
 const p=window.currentProfile||{},uid=window.currentUser?.id;let matches=[];
 if(uid&&window.supabaseClient){const r=await supabaseClient.from("matches").select("*").or("player_a.eq."+uid+",player_b.eq."+uid).order("scheduled_at",{ascending:false}).limit(40);matches=r.data||[]}
 const total=Number(p.wins||0)+Number(p.losses||0)+Number(p.draws||0);
 return{p,matches,total,wr:total?Math.round(Number(p.wins||0)/total*100):0}
}
async function renderHome(){
 const p=page("home");if(!p)return;const s=await profileStats(),me=s.p,name=me.display_name||me.username||"Player";
 let tournaments=[];if(window.supabaseClient){const r=await supabaseClient.from("tournaments").select("id,name,status,format,game,current_players,capacity,start_at,entry_type").order("created_at",{ascending:false}).limit(4);tournaments=r.data||[]}
 const next=s.matches.find(m=>["scheduled","result_submitted"].includes(m.status));
 let opp={};if(next&&window.supabaseClient){const id=next.player_a===window.currentUser?.id?next.player_b:next.player_a;if(id){const r=await supabaseClient.from("profiles").select("display_name,username,rating").eq("id",id).maybeSingle();opp=r.data||{}}}
 p.innerHTML='<div class="c30-page-inner">'+appbar("الرئيسية","PLAYER HQ")+
 '<section class="c30-hero"><span class="c30-eyebrow">⚡ CHAoui PLAYER</span><h2>مرحبا <span>'+esc(name)+'</span></h2><p>كلشي واضح: البطولة، المباراة، النتيجة والترتيب. الواجهة كتخدم بنفس المنطق فالتليفون والـPC.</p><div class="c30-buttons"><button class="c30-btn gold" data-page="tournaments">شوف البطولات ↗</button><button class="c30-btn" data-page="profile">الحساب ديالي</button></div></section>'+
 '<div class="c30-grid four"><article class="c30-box c30-kpi"><span>RATING</span><b>'+Number(me.rating||0)+'</b></article><article class="c30-box c30-kpi"><span>POINTS</span><b>'+Number(me.points||0)+'</b></article><article class="c30-box c30-kpi"><span>WINS</span><b>'+Number(me.wins||0)+'</b></article><article class="c30-box c30-kpi"><span>WIN RATE</span><b>'+s.wr+'%</b></article></div>'+
 '<section style="margin-top:13px"><div class="c30-heading"><div><span class="c30-eyebrow">NEXT MATCH</span><h1>المواجهة الجاية</h1></div></div>'+
 (next?'<article class="c30-next"><div class="c30-player"><div class="c30-avatar">'+avatar(name)+'</div><b>'+esc(name)+'</b><small>RATING '+Number(me.rating||0)+'</small></div><div class="c30-vs"><strong>VS</strong><span>'+esc(next.round||"MATCH")+'</span></div><div class="c30-player"><div class="c30-avatar">'+avatar(opp.display_name||opp.username||"?")+'</div><b>'+esc(opp.display_name||opp.username||"المنافس")+'</b><small>RATING '+Number(opp.rating||0)+'</small></div></article><div class="c30-buttons"><button class="c30-btn gold" data-action="match" data-id="'+esc(next.id)+'">فتح المباراة</button></div>':'<div class="c30-box"><h3>ما عندك حتى مباراة مبرمجة</h3><p>سجل فبطولة مفتوحة باش تبدأ المنافسة.</p></div>')+
 '</section><section style="margin-top:13px"><div class="c30-heading"><div><span class="c30-eyebrow">COMPETE</span><h1>البطولات</h1></div></div><div class="c30-grid two">'+(tournaments.map(t=>'<article class="c30-box"><div class="c30-heading" style="margin-bottom:7px"><div><h3>'+esc(t.name)+'</h3><p>'+esc(t.game||"eFootball")+' · '+esc(t.format||"1VS1")+'</p></div>'+status(t.status)+'</div><div class="c30-buttons"><span class="c30-pill">'+Number(t.current_players||0)+'/'+Number(t.capacity||0)+'</span><button class="c30-btn" data-action="tournament" data-id="'+esc(t.id)+'">التفاصيل</button></div></article>').join("")||'<div class="c30-box"><h3>ما كايناش بطولات</h3><p>المنظم يقدر يفتح بطولة جديدة من لوحة الإدارة.</p></div>')+'</div></section></div>'+bottom("home");
 bind(p);
}
async function renderTournaments(){
 const p=page("tournaments");if(!p)return;let data=[];if(window.supabaseClient){const r=await supabaseClient.from("tournaments").select("id,name,description,status,format,game,current_players,capacity,start_at,end_at,entry_type").order("created_at",{ascending:false}).limit(60);data=r.data||[]}
 p.innerHTML='<div>'+appbar("البطولات","COMPETITION HUB")+'<div class="c30-grid two">'+(data.map(t=>'<article class="c30-box"><div class="c30-heading"><div><h3>'+esc(t.name)+'</h3><p>'+esc(t.description||"بطولة eFootball داخل CHAoui.")+'</p></div>'+status(t.status)+'</div><div class="c30-buttons"><span class="c30-pill">'+esc(t.format||"1VS1")+'</span><span class="c30-pill gold">'+Number(t.current_players||0)+'/'+Number(t.capacity||0)+'</span><button class="c30-btn '+(t.status==="open"?"gold":"")+'" data-action="tournament" data-id="'+esc(t.id)+'">'+(t.status==="open"?"التسجيل / التفاصيل":"فتح البطولة")+'</button></div></article>').join("")||'<div class="c30-box"><h3>ما كاين حتى بطولة</h3></div>')+'</div></div>'+bottom("tournaments");bind(p)
}
async function renderMatches(){
 const p=page("matches");if(!p)return;const uid=window.currentUser?.id;let data=[];if(uid&&window.supabaseClient){const r=await supabaseClient.from("matches").select("*").or("player_a.eq."+uid+",player_b.eq."+uid).order("scheduled_at",{ascending:false}).limit(80);data=r.data||[]}
 const ids=[...new Set(data.flatMap(m=>[m.player_a,m.player_b]).filter(Boolean))];let pm={};if(ids.length){const r=await supabaseClient.from("profiles").select("id,display_name,username,rating").in("id",ids);(r.data||[]).forEach(x=>pm[x.id]=x)}
 p.innerHTML='<div>'+appbar("مبارياتي","MATCH CENTER")+'<div class="c30-list">'+(data.map(m=>{const oid=m.player_a===uid?m.player_b:m.player_a,op=pm[oid]||{},st=m.status||"scheduled";return'<article class="c30-box"><div class="c30-heading"><div><h3>'+esc(m.round||"Match")+'</h3><p>'+date(m.scheduled_at)+'</p></div>'+status(st)+'</div><div class="c30-next"><div class="c30-player"><div class="c30-avatar">'+avatar(window.currentProfile?.display_name)+'</div><b>أنت</b></div><div class="c30-vs"><strong>'+((m.score_a!=null&&m.score_b!=null)?esc(m.score_a)+" : "+esc(m.score_b):"VS")+'</strong></div><div class="c30-player"><div class="c30-avatar">'+avatar(op.display_name||op.username)+'</div><b>'+esc(op.display_name||op.username||"المنافس")+'</b></div></div><div class="c30-buttons">'+(st==="scheduled"?'<button class="c30-btn gold" data-action="submit" data-id="'+esc(m.id)+'">إرسال النتيجة</button>':st==="result_submitted"?'<button class="c30-btn gold" data-action="confirm" data-id="'+esc(m.id)+'">تأكيد</button><button class="c30-btn red" data-action="dispute" data-id="'+esc(m.id)+'">اعتراض</button>':'<button class="c30-btn" data-action="match" data-id="'+esc(m.id)+'">Match Room</button>')+'</div></article>'}).join("")||'<div class="c30-box"><h3>مازال ما كايناش مباريات</h3><p>منين يتم قبولك فبطولة، المباريات ديالك غادي تبان هنا.</p></div>')+'</div></div>'+bottom("matches");bind(p)
}
async function renderRanking(){
 const p=page("ranking");if(!p)return;let data=[];if(window.supabaseClient){const r=await supabaseClient.from("profiles").select("id,display_name,username,rating,points,wins,losses,draws").order("rating",{ascending:false}).limit(50);data=r.data||[]}
 const uid=window.currentUser?.id;p.innerHTML='<div>'+appbar("الترتيب","COMPETITIVE LADDER")+'<div class="c30-box"><div class="c30-list">'+data.map((x,i)=>'<div class="c30-row"><div class="c30-row-main"><b>#'+(i+1)+' · '+esc(x.display_name||x.username||"Player")+(x.id===uid?" · أنت":"")+'</b><small>@'+esc(x.username||"player")+' · '+Number(x.wins||0)+' فوز</small></div><div class="c30-row-meta"><span class="c30-pill gold">'+Number(x.rating||0)+' Rating</span><span class="c30-pill">'+Number(x.points||0)+' PTS</span></div></div>').join("")||'<div class="c30-box"><h3>مازال ما كاين حتى ترتيب</h3></div>'+'</div></div></div>'+bottom("ranking");bind(p)
}
async function renderProfile(){
 const p=page("profile");if(!p)return;const me=window.currentProfile||{},name=me.display_name||me.username||"Player",total=Number(me.wins||0)+Number(me.losses||0)+Number(me.draws||0),wr=total?Math.round(Number(me.wins||0)/total*100):0;
 p.innerHTML='<div>'+appbar("حسابي","PLAYER IDENTITY")+'<section class="c30-box"><div class="c30-profile"><div class="c30-big-avatar">'+avatar(name)+'</div><div><span class="c30-eyebrow">CHAOUI PLAYER</span><h2>'+esc(name)+'</h2><p>@'+esc(me.username||"player")+'</p><div class="c30-buttons"><span class="c30-pill gold">Rating '+Number(me.rating||0)+'</span><span class="c30-pill">Level '+Number(me.level||1)+'</span></div></div></div><div class="c30-stats"><div class="c30-stat"><span>مباريات</span><b>'+total+'</b></div><div class="c30-stat"><span>فوز</span><b>'+Number(me.wins||0)+'</b></div><div class="c30-stat"><span>Points</span><b>'+Number(me.points||0)+'</b></div><div class="c30-stat"><span>Win Rate</span><b>'+wr+'%</b></div></div></section><section style="margin-top:12px"><div class="c30-grid two"><button type="button" class="c30-box" data-page="chat" style="text-align:right"><h3>💬 الرسائل</h3><p>تواصل مع المنظم واللاعبين.</p></button><button type="button" class="c30-box" data-page="notifications" style="text-align:right"><h3>🔔 الإشعارات</h3><p>آخر أخبار البطولة والنتائج.</p></button><button type="button" class="c30-box" data-page="complaints" style="text-align:right"><h3>🛠️ المساعدة</h3><p>المشاكل، الشكايات والدعم.</p></button><button type="button" class="c30-box" id="c30Logout" style="text-align:right"><h3>🚪 تسجيل الخروج</h3><p>الخروج من الحساب الحالي.</p></button></div></section></div>'+bottom("profile");bind(p);$("c30Logout")?.addEventListener("click",()=>window.logoutUser?.())
}
function renderSimple(id,title,sub,body){
 const p=page(id);if(!p)return;p.innerHTML='<div>'+appbar(title,sub)+'<div class="c30-box">'+body+"</div></div>"+bottom("profile");bind(p)
}
async function loadOwner(){
 if(!["owner","organizer"].includes(window.currentProfile?.role))return;
 const [p,t,m,r,c]=await Promise.all([
  supabaseClient.from("profiles").select("id,display_name,username,role,rating,points,wins,losses,draws,player_code").order("created_at",{ascending:false}).limit(300),
  supabaseClient.from("tournaments").select("id,name,status,format,game,current_players,capacity,start_at,entry_type,organizer_id").order("created_at",{ascending:false}).limit(100),
  supabaseClient.from("matches").select("*").order("scheduled_at",{ascending:false}).limit(120),
  supabaseClient.from("tournament_players").select("id,tournament_id,player_id,status,registration_name,registration_whatsapp,registration_efootball_name,preferred_time,connection_type,created_at").order("created_at",{ascending:false}).limit(150),
  supabaseClient.from("complaints").select("*").order("created_at",{ascending:false}).limit(50)
 ]);
 owner.players=p.data||[];owner.tournaments=t.data||[];owner.matches=m.data||[];owner.registrations=r.data||[];owner.complaints=c.data||[];
 if(window.currentProfile.role==="organizer"){const uid=window.currentUser?.id,ids=new Set(owner.tournaments.filter(x=>x.organizer_id===uid).map(x=>x.id));owner.tournaments=owner.tournaments.filter(x=>ids.has(x.id));owner.registrations=owner.registrations.filter(x=>ids.has(x.tournament_id));owner.matches=owner.matches.filter(x=>ids.has(x.tournament_id));owner.players=owner.players.filter(x=>x.id===uid||owner.registrations.some(r=>r.player_id===x.id))}
}
function adminNav(){
 const items=[["overview","⌂","الرئيسية"],["registrations","📝","التسجيلات"],["tournaments","🏆","البطولات"],["players","👥","اللاعبون"],["matches","⚔","المباريات"],["issues","⚠","المشكلات"],["settings","⚙","الإعدادات"]];
 return items
}
function ownerShell(){
 const host=$("organizer")||$("king");if(!host)return;host.className="page c30-admin active-page";host.style.display="block";const nav=adminNav(),role=window.currentProfile?.role==="owner"?"OWNER":"ORGANIZER";
 host.innerHTML='<div class="c30-admin-wrap"><aside class="c30-admin-side"><div class="c30-admin-brand"><img src="'+logo+'"><div><b>CHAoui PRO</b><small>'+role+' COMMAND CENTER</small></div></div><nav class="c30-admin-nav">'+nav.map(x=>'<button type="button" class="'+(ownerTab===x[0]?"active":"")+'" data-otab="'+x[0]+'">'+x[1]+' '+x[2]+"</button>").join("")+'</nav><button id="c30AdminLogout" class="c30-btn red">تسجيل الخروج</button></aside><main class="c30-admin-main"><div class="c30-admin-top"><div><span class="c30-eyebrow">CHAoui PRO</span><h1>'+esc(nav.find(x=>x[0]===ownerTab)?.[2]||"مركز القيادة")+'</h1><p>إدارة البطولات واللاعبين والمباريات من مكان واحد.</p></div><span class="c30-admin-badge">'+role+'</span></div><div id="c30AdminBody"></div></main></div><nav class="c30-admin-mobile">'+nav.slice(0,5).map(x=>'<button type="button" class="'+(ownerTab===x[0]?"active":"")+'" data-otab="'+x[0]+'">'+x[1]+'<br>'+x[2]+"</button>").join("")+"</nav>";
 host.querySelectorAll("[data-otab]").forEach(b=>b.onclick=async()=>{ownerTab=b.dataset.otab;await renderOwner()});$("c30AdminLogout")?.addEventListener("click",()=>window.logoutUser?.())
}
async function renderOwner(){
 await loadOwner();ownerShell();const body=$("c30AdminBody");if(!body)return;
 if(ownerTab==="overview"){
  const open=owner.tournaments.filter(t=>t.status==="open").length,live=owner.tournaments.filter(t=>t.status==="live").length,pending=owner.registrations.filter(r=>r.status==="pending").length,active=owner.matches.filter(m=>["scheduled","result_submitted"].includes(m.status)).length;
  body.innerHTML='<div class="c30-grid four"><div class="c30-box c30-kpi"><span>اللاعبون</span><b>'+owner.players.length+'</b></div><div class="c30-box c30-kpi"><span>البطولات</span><b>'+owner.tournaments.length+'</b></div><div class="c30-box c30-kpi"><span>مفتوحة / مباشرة</span><b>'+open+' / '+live+'</b></div><div class="c30-box c30-kpi"><span>يحتاج تدخل</span><b>'+pending+' / '+active+'</b></div></div><section style="margin-top:12px"><div class="c30-box"><div class="c30-heading"><div><span class="c30-eyebrow">NOW</span><h1>شنو خاصو يتدار دابا؟</h1></div></div><div class="c30-list"><div class="c30-row"><div class="c30-row-main"><b>طلبات التسجيل</b><small>قبول / انتظار / رفض</small></div><div class="c30-row-meta"><span class="c30-pill gold">'+pending+'</span><button class="c30-btn" data-otab="registrations">فتح</button></div></div><div class="c30-row"><div class="c30-row-main"><b>المباريات النشيطة</b><small>نتيجة أو تأكيد</small></div><div class="c30-row-meta"><span class="c30-pill">'+active+'</span><button class="c30-btn" data-otab="matches">فتح</button></div></div></div></div></section><section style="margin-top:12px"><div class="c30-box"><div class="c30-heading"><div><span class="c30-eyebrow">TOURNAMENTS</span><h1>آخر البطولات</h1></div><button class="c30-btn gold" data-action="create">+ إنشاء بطولة</button></div><div class="c30-list">'+(owner.tournaments.slice(0,6).map(t=>'<div class="c30-row"><div class="c30-row-main"><b>'+esc(t.name)+'</b><small>'+Number(t.current_players||0)+'/'+Number(t.capacity||0)+' · '+esc(t.format||"1VS1")+'</small></div><div class="c30-row-meta">'+status(t.status)+'<button class="c30-btn" data-action="tournament" data-id="'+esc(t.id)+'">فتح</button></div></div>').join("")||'<div class="c30-box"><h3>مازال ما كاينة حتى بطولة</h3></div>')+'</div></div></section>';
 }else if(ownerTab==="registrations"){
  body.innerHTML='<div class="c30-box"><div class="c30-heading"><div><span class="c30-eyebrow">REGISTRATION REVIEW</span><h1>طلبات التسجيل</h1><p>'+owner.registrations.filter(r=>r.status==="pending").length+' طلبات في الانتظار</p></div></div><div class="c30-list">'+(owner.registrations.map(r=>'<div class="c30-row"><div class="c30-row-main"><b>'+esc(r.registration_name||"Player")+'</b><small>'+esc(r.registration_efootball_name||"eFootball")+' · '+esc(r.registration_whatsapp||"—")+' · '+date(r.created_at)+'</small></div><div class="c30-row-meta">'+status(r.status)+(r.status==="pending"||r.status==="waitlist"?'<button class="c30-btn gold" data-review="accepted" data-id="'+esc(r.id)+'">قبول</button><button class="c30-btn" data-review="waitlist" data-id="'+esc(r.id)+'">انتظار</button><button class="c30-btn red" data-review="rejected" data-id="'+esc(r.id)+'">رفض</button>':"")+'</div></div>').join("")||'<div class="c30-box"><h3>ما كايناش تسجيلات</h3></div>')+'</div></div>';
 }else if(ownerTab==="tournaments"){
  body.innerHTML='<div class="c30-box"><div class="c30-heading"><div><span class="c30-eyebrow">TOURNAMENT CONTROL</span><h1>البطولات</h1></div><button class="c30-btn gold" data-action="create">+ إنشاء بطولة</button></div><div class="c30-list">'+(owner.tournaments.map(t=>'<div class="c30-row"><div class="c30-row-main"><b>'+esc(t.name)+'</b><small>'+esc(t.game||"eFootball")+' · '+esc(t.format||"1VS1")+' · '+Number(t.current_players||0)+'/'+Number(t.capacity||0)+'</small></div><div class="c30-row-meta">'+status(t.status)+'<button class="c30-btn" data-action="tournament" data-id="'+esc(t.id)+'">فتح</button></div></div>').join("")||'<div class="c30-box"><h3>أنشئ أول بطولة ديالك</h3></div>')+'</div></div>';
 }else if(ownerTab==="players"){
  body.innerHTML='<div class="c30-box"><div class="c30-heading"><div><span class="c30-eyebrow">PLAYER MANAGEMENT</span><h1>اللاعبون</h1></div></div><input id="c30PlayerSearch" class="c30-search" placeholder="بحث بالاسم أو username..."><div id="c30Players" class="c30-list" style="margin-top:9px">'+owner.players.map(p=>'<div class="c30-row c30-player-row" data-q="'+esc((p.display_name||"")+" "+(p.username||""))+'"><div class="c30-row-main"><b>'+esc(p.display_name||p.username||"Player")+'</b><small>@'+esc(p.username||"player")+' · '+esc(p.role||"player")+' · Rating '+Number(p.rating||0)+'</small></div><div class="c30-row-meta"><span class="c30-pill gold">'+Number(p.rating||0)+'</span>'+(window.currentProfile?.role==="owner"&&p.role==="player"?'<button class="c30-btn" data-action="organizer" data-id="'+esc(p.id)+'">الصلاحية</button>':"")+'</div></div>').join("")+'</div></div>';
  $("c30PlayerSearch")?.addEventListener("input",e=>{const q=e.target.value.toLowerCase();document.querySelectorAll(".c30-player-row").forEach(r=>r.style.display=!q||r.dataset.q.toLowerCase().includes(q)?"flex":"none")});
 }else if(ownerTab==="matches"){
  body.innerHTML='<div class="c30-box"><div class="c30-heading"><div><span class="c30-eyebrow">MATCH CONTROL</span><h1>المباريات</h1></div></div><div class="c30-list">'+(owner.matches.map(m=>'<div class="c30-row"><div class="c30-row-main"><b>'+esc(m.round||"Match")+'</b><small>'+date(m.scheduled_at)+' · '+esc(m.status||"scheduled")+'</small></div><div class="c30-row-meta">'+status(m.status)+'<button class="c30-btn" data-action="match" data-id="'+esc(m.id)+'">Match Room</button></div></div>').join("")||'<div class="c30-box"><h3>ما كايناش مباريات</h3></div>')+'</div></div>';
 }else if(ownerTab==="issues"){
  body.innerHTML='<div class="c30-box"><div class="c30-heading"><div><span class="c30-eyebrow">SUPPORT</span><h1>المشكلات</h1></div></div><div class="c30-list">'+(owner.complaints.map(c=>'<div class="c30-row"><div class="c30-row-main"><b>'+esc(c.subject||c.title||"شكاية")+'</b><small>'+esc(c.status||"open")+' · '+date(c.created_at)+'</small></div><div class="c30-row-meta"><button class="c30-btn red" data-page="complaints">فتح</button></div></div>').join("")||'<div class="c30-box"><h3>ما كايناش مشكلات مفتوحة</h3></div>')+'</div></div>';
 }else{
  body.innerHTML='<div class="c30-box"><div class="c30-heading"><div><span class="c30-eyebrow">PLATFORM</span><h1>الإعدادات</h1></div></div><div class="c30-list"><div class="c30-row"><div class="c30-row-main"><b>التسجيل العام</b><small>فتح أو إغلاق تسجيل الحسابات.</small></div><div class="c30-row-meta"><span class="c30-pill gold">Owner</span></div></div><div class="c30-row"><div class="c30-row-main"><b>الصيانة</b><small>إدارة وضع المنصة عند الحاجة.</small></div><div class="c30-row-meta"><span class="c30-pill">متاح من Supabase</span></div></div></div></div>';
 }
 bind(body);
 body.querySelectorAll("[data-otab]").forEach(b=>b.onclick=async()=>{ownerTab=b.dataset.otab;await renderOwner()});
 body.querySelectorAll("[data-review]").forEach(b=>b.onclick=async()=>{const r=await supabaseClient.rpc("review_tournament_registration",{p_registration_id:b.dataset.id,p_decision:b.dataset.review});if(r.error)alert(r.error.message||"تعذر تحديث التسجيل");else await renderOwner()});
}
function renderPlayer(id){
 document.body.classList.add("v23-ready");
 if(id==="home")return renderHome();
 if(id==="tournaments")return renderTournaments();
 if(id==="matches")return renderMatches();
 if(id==="ranking")return renderRanking();
 if(id==="profile")return renderProfile();
 if(id==="notifications")return renderSimple("notifications","الإشعارات","UPDATES","<h3>الإشعارات ديالك</h3><p>أخبار البطولة، النتائج والتغييرات المهمة.</p>");
 if(id==="complaints")return renderSimple("complaints","المساعدة","SUPPORT","<h3>مركز المساعدة</h3><p>المنظم وOwner كيتابعو الشكايات ومشاكل المباريات.</p>");
 if(id==="settings")return renderSimple("settings","الإعدادات","ACCOUNT","<h3>إعدادات الحساب</h3><p>الأمان والحساب وتسجيل الخروج كيبقاو واضحين وبسيطين.</p>");
 if(id==="chat"){const p=page("chat");if(p){p.innerHTML='<div>'+appbar("الرسائل","COMMUNICATION")+'<div class="c30-box"><h3>💬 الرسائل</h3><p>المحادثات ديال البطولة كيبقاو هنا. اختار محادثة من النظام الحالي.</p><div class="c30-buttons"><button class="c30-btn gold" data-action="chat">فتح الرسائل</button></div></div></div>'+bottom("profile");bind(p)}return}
}
function renderAdmin(id){return renderOwner()}
function patch(){
 if(baseShowPage||typeof window.showPage!=="function")return;
 const old=window.showPage;baseShowPage=old;
 window.showPage=function(id,opts={}){
  old.call(this,id,opts);
  const staff=["owner","organizer"].includes(window.currentProfile?.role);
  if(staff&&(id==="organizer"||id==="king"))setTimeout(()=>renderAdmin(id),25);
  else if(!staff&&["home","tournaments","matches","ranking","profile","notifications","complaints","settings","chat"].includes(id))setTimeout(()=>renderPlayer(id),25);
 };
}
async function boot(){
 if(ready)return;ready=true;
 let tries=0;
 while(tries<100){
  if(window.currentProfile&&typeof window.showPage==="function")break;
  await new Promise(r=>setTimeout(r,200));tries++;
 }
 patch();
 if(window.currentProfile&&["owner","organizer"].includes(window.currentProfile.role))await renderOwner();
 else if(window.currentProfile)await renderHome();
}
window.__CHAouiV30={boot,renderPlayer,renderOwner};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();