/* CHAoui Admin HQ V9 */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const esc=v=>window.escapeHTML?window.escapeHTML(v??""):String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const toast=m=>window.showToast?window.showToast(m):alert(m);
const fmt=v=>{try{return v?new Date(v).toLocaleString("ar-MA",{dateStyle:"medium",timeStyle:"short"}):"—"}catch{return"—"}};
const roleLabel=r=>({owner:"المالك",organizer:"منظم",player:"لاعب"}[r]||r||"لاعب");
let state={tab:"overview",players:[],tournaments:[],matches:[],complaints:[],requests:[],settings:null};

function ownerOnly(){if(!window.currentProfile||currentProfile.role!=="owner"){toast("هاد اللوحة خاصة بالمالك 👑");return false}return true}
function icon(n){return({overview:"⌂",players:"♙",tournaments:"🏆",matches:"⚔",groups:"▦",requests:"✉",content:"✦",economy:"◆",maintenance:"🛠"})[n]||"•"}
async function loadAll(){
 if(!ownerOnly())return;
 const r=await Promise.all([
  supabaseClient.from("profiles").select("*").order("created_at",{ascending:false}).limit(100),
  supabaseClient.from("tournaments").select("*").order("created_at",{ascending:false}).limit(100),
  supabaseClient.from("matches").select("*").order("scheduled_at",{ascending:false}).limit(100),
  supabaseClient.from("complaints").select("*").order("created_at",{ascending:false}).limit(50),
  supabaseClient.from("organizer_subscription_requests").select("*").order("requested_at",{ascending:false}).limit(50),
  supabaseClient.from("app_settings").select("*").eq("id",1).maybeSingle()
 ]);
 state.players=r[0].data||[];state.tournaments=r[1].data||[];state.matches=r[2].data||[];state.complaints=r[3].data||[];state.requests=r[4].data||[];state.settings=r[5].data||null;
 render();
}
function shell(){
 const root=$("king");if(!root)return;
 root.innerHTML='<div class="ahq-top"><div class="ahq-brand"><div class="ahq-logo">🏆</div><div><b>لوحة المنظم</b><small>eFootball 1VS1</small></div></div><div class="ahq-search">⌕ <span>بحث عن لاعب...</span></div><button class="ahq-logout" data-ahq-logout>↪ تسجيل الخروج</button></div><div class="ahq-nav" id="ahqTabs"></div><div class="ahq-hero"><div><span class="ahq-kicker">eFOOTBALL 1VS1 • OWNER</span><h1>التحكم الكامل 👑</h1><p>كل أدوات إدارة البطولة واللاعبين والمباريات والنتائج في مكان واحد.</p></div><div class="ahq-owner"><b>'+esc(currentProfile?.display_name||currentProfile?.username||"OWNER")+'</b><small>صلاحيات المالك مفعلة</small></div></div><div id="ahqBody"></div>';
}
function renderTabs(){
 const tabs=[["overview","نظرة عامة"],["players","اللاعبين"],["tournaments","البطولات"],["matches","المباريات والنتائج"],["groups","دور المجموعات والتأهل"],["requests","الطلبات والمشاكل"],["content","التواصل والمحتوى"],["economy","Coins / XP / المتجر"],["maintenance","الصيانة والإعدادات"]];
 $("ahqTabs").innerHTML=tabs.map(x=>'<button class="'+(state.tab===x[0]?"active":"")+'" data-tab="'+x[0]+'"><span>'+icon(x[0])+"</span>"+x[1]+"</button>").join("");
 $("ahqTabs").querySelectorAll("button").forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;render()});
}
function stat(a,b,c){return'<article class="ahq-stat ahq-'+c+'"><span>'+a+"</span><strong>"+b+"</strong></article>"}
function empty(t){return'<div class="ahq-empty">'+t+"</div>"}
function trow(t){return'<div class="ahq-row"><div><b>'+esc(t.name)+'</b><small>'+esc(t.game||"eFootball")+" · "+esc(t.format||"direct")+" · "+(t.current_players||0)+"/"+(t.capacity||0)+'</small></div><span class="ahq-pill '+esc(t.status||"")+'">'+esc(t.status||"—")+'</span><button class="ahq-mini" data-open-tournament="'+t.id+'">فتح</button></div>'}
function render(){
 if(!ownerOnly())return;
 if(!$("ahqBody"))shell();
 renderTabs();
 const b=$("ahqBody");
 b.innerHTML=state.tab==="overview"?overview():state.tab==="players"?players():state.tab==="tournaments"?tournaments():state.tab==="matches"?matches():state.tab==="groups"?groups():state.tab==="requests"?requests():state.tab==="content"?content():state.tab==="economy"?economy():maintenance();
 bind();
}
function overview(){
 const live=state.tournaments.filter(x=>x.status==="live").length,open=state.tournaments.filter(x=>x.status==="open").length,pending=state.matches.filter(x=>["scheduled","result_submitted"].includes(x.status)).length,issues=state.complaints.filter(x=>!["resolved","closed"].includes(x.status)).length;
 return'<section><div class="ahq-stats">'+stat("اللاعبين",state.players.length,"blue")+stat("البطولات",state.tournaments.length,"gold")+stat("مباشرة",live,"red")+stat("مفتوحة",open,"green")+stat("مباريات نشيطة",pending,"violet")+stat("مشاكل مفتوحة",issues,"pink")+'</div><div class="ahq-grid2"><article class="ahq-card ahq-command"><div class="ahq-card-title"><span>⚡ CONTROL CENTER</span><h2>شنو خاصك تدير دابا؟</h2></div><div class="ahq-actions"><button data-action="new-tournament">➕ إنشاء بطولة</button><button data-tab-go="players">♙ إدارة اللاعبين</button><button data-tab-go="matches">⚔ مراجعة النتائج</button><button data-tab-go="maintenance">🛠 وضع المنصة</button></div></article><article class="ahq-card"><div class="ahq-card-title"><span>STATUS</span><h2>حالة المنصة</h2></div><div class="ahq-status-row"><b class="'+(state.settings?.maintenance?"danger":"ok")+'">'+(state.settings?.maintenance?"🔴 صيانة":"🟢 مفتوحة")+'</b><span>التسجيل: '+(state.settings?.registration_enabled?"مفتوح":"مغلق")+'</span><span>الانضمام: '+(state.settings?.join_enabled?"مفتوح":"مغلق")+"</span></div></article></div><article class=\"ahq-card\"><div class=\"ahq-card-title\"><span>RECENT</span><h2>آخر البطولات</h2></div>"+(state.tournaments.slice(0,5).map(trow).join("")||empty("ماكايناش بطولات حاليا."))+"</article></section>";
}
function playerCard(p){
 return'<article class="ahq-player"><div class="ahq-player-main"><div class="ahq-avatar">'+esc((p.display_name||p.username||"C").slice(0,1).toUpperCase())+'</div><div><b>'+esc(p.display_name||p.username)+'</b><small>@'+esc(p.username||"—")+" · "+roleLabel(p.role)+" · LV."+String(p.level||1)+'</small><small>Rating '+(p.rating||0)+" · "+(p.points||0)+" pts · "+(p.wins||0)+"W/"+(p.losses||0)+"L · 🪙 "+(p.coins||0)+'</small></div></div><div class="ahq-player-actions"><button data-premium="'+p.id+'">'+(p.premium?"💎 إلغاء Premium":"💎 Premium")+'</button><button data-coins="'+p.id+'">🪙 Coins</button><button data-organizer="'+p.id+'">🏆 Organizer</button>'+(p.player_code?'<button data-code="'+esc(p.player_code)+'">🔐 '+esc(p.player_code)+"</button>":"")+"</div></article>"
}
function players(){
 return'<section><div class="ahq-toolbar"><div><span>PLAYER CONTROL</span><h2>اللاعبين</h2><small>Premium، Coins، Organizer وبيانات اللاعب.</small></div><input id="ahqPlayerSearch" placeholder="بحث عن لاعب..."></div><div class="ahq-player-list">'+state.players.map(playerCard).join("")+'</div></section>'
}
function tournaments(){
 return'<section><div class="ahq-toolbar"><div><span>TOURNAMENT CONTROL</span><h2>إدارة البطولات</h2><small>لاعبين، حالات، بداية البطولة والتقدم.</small></div><button class="ahq-primary" data-action="new-tournament">+ بطولة</button></div><div class="ahq-list">'+(state.tournaments.map(t=>'<article class="ahq-tournament"><div class="ahq-t-head"><div><b>'+esc(t.name)+'</b><small>'+esc(t.game||"eFootball")+" · "+esc(t.format||"direct")+" · "+(t.current_players||0)+"/"+(t.capacity||0)+'</small></div><span class="ahq-pill '+esc(t.status||"")+'">'+esc(t.status||"—")+'</span></div><div class="ahq-actions"><button data-open-tournament="'+t.id+'">👥 اللاعبين</button>'+(t.status==="open"?'<button data-start="'+t.id+'">🚀 بدء</button>':"")+(t.status==="live"&&t.format==="groups"?'<button data-advance-group="'+t.id+'">➡️ تأهل المجموعات</button>':"")+(t.status==="live"&&t.format!=="groups"?'<button data-advance-direct="'+t.id+'">➡️ تقدم الإقصائيات</button>':"")+'<button class="danger-btn" data-delete-tournament="'+t.id+'">🗑 حذف</button></div></article>').join("")||empty("ماكايناش بطولات.")+"</div></section>"
}
function matches(){
 return'<section><div class="ahq-toolbar"><div><span>MATCH OPERATIONS</span><h2>المباريات والنتائج</h2><small>مراجعة الحالات والنتائج المرسلة والتأكيد.</small></div></div><div class="ahq-list">'+(state.matches.map(m=>{const a=state.players.find(p=>p.id===m.player_a),b=state.players.find(p=>p.id===m.player_b),t=state.tournaments.find(x=>x.id===m.tournament_id);return'<article class="ahq-match"><div><span>'+esc(m.round||"MATCH")+'</span><b>'+esc(a?.display_name||a?.username||"TBD")+' <i>VS</i> '+esc(b?.display_name||b?.username||"TBD")+'</b><small>'+esc(t?.name||"بطولة")+" · "+fmt(m.scheduled_at)+'</small></div><strong>'+(m.score_a!=null?m.score_a+" : "+m.score_b:"VS")+'</strong><div class="ahq-actions">'+(m.result_submitted||m.status==="result_submitted"?'<button data-confirm-match="'+m.id+'">✅ تأكيد النتيجة</button>':"")+'<button data-match-page="'+m.id+'">فتح Match Room</button></div></article>'}).join("")||empty("ماكايناش مباريات.")+"</div></section>"
}
function groups(){
 const ts=state.tournaments.filter(t=>["groups","groups_knockout"].includes(t.format));
 return'<section><div class="ahq-toolbar"><div><span>GROUPS • QUALIFICATION</span><h2>المجموعات والتأهل</h2><small>مرحلة المجموعات ثم دفع البطولة للمرحلة الموالية.</small></div></div>'+(ts.map(t=>'<article class="ahq-card"><div class="ahq-t-head"><div><b>'+esc(t.name)+'</b><small>'+(t.current_players||0)+"/"+(t.capacity||0)+" لاعب · "+esc(t.status||"")+'</small></div><span class="ahq-pill">'+esc(t.format)+'</span></div><div class="ahq-actions"><button data-open-tournament="'+t.id+'">👥 المشاركون</button><button data-advance-group="'+t.id+'">🏅 تطبيق التأهل</button></div></article>').join("")||empty("ماكايناش بطولات بنظام المجموعات."))+"</section>"
}
function requests(){
 const cs=state.complaints.filter(x=>!["resolved","closed"].includes(x.status));
 return'<section><div class="ahq-stats">'+stat("طلبات المنظم",state.requests.filter(x=>x.status==="pending").length,"gold")+stat("مشاكل مفتوحة",cs.length,"red")+'</div><div class="ahq-grid2"><article class="ahq-card"><div class="ahq-card-title"><span>ORGANIZER REQUESTS</span><h2>طلبات المنظم</h2></div>'+(state.requests.map(r=>'<div class="ahq-row"><div><b>'+esc(r.plan_code||"Organizer")+'</b><small>'+(r.duration_days||0)+" يوم · "+(r.amount||0)+" "+esc(r.currency||"DH")+" · "+esc(r.status||"")+'</small></div><div class="ahq-actions">'+(r.status==="pending"?'<button data-request="'+r.id+'" data-req-action="approve">قبول</button><button data-request="'+r.id+'" data-req-action="reject" class="danger-btn">رفض</button>':"")+"</div></div>").join("")||empty("ماكايناش طلبات."))+'</article><article class="ahq-card"><div class="ahq-card-title"><span>COMPLAINTS</span><h2>المشاكل والشكايات</h2></div>'+(cs.map(c=>'<div class="ahq-row"><div><b>'+esc(c.subject||c.type||"شكوى")+'</b><small>'+esc(c.ticket_code||"")+" · "+fmt(c.created_at)+'</small></div><span class="ahq-pill">'+esc(c.status||"open")+"</span></div>").join("")||empty("ماكايناش شكايات مفتوحة."))+"</article></div></section>"
}
function content(){
 return'<section><div class="ahq-grid2"><article class="ahq-card"><div class="ahq-card-title"><span>📢 ANNOUNCEMENTS</span><h2>إرسال إعلان</h2></div><textarea id="ahqBroadcast" placeholder="كتب الإعلان اللي بغيتي يوصل للاعبين..."></textarea><button class="ahq-primary" data-broadcast>إرسال للجميع</button></article><article class="ahq-card"><div class="ahq-card-title"><span>💬 COMMUNICATION</span><h2>التواصل</h2></div><div class="ahq-actions"><button data-page-go="chat">فتح الرسائل</button><button data-page-go="assistant">المساعد الذكي</button><button data-page-go="complaints">الشكايات</button></div><p class="ahq-note">التواصل باقي مرتبط بالأنظمة الحالية ديال CHAoui.</p></article></div><article class="ahq-card"><div class="ahq-card-title"><span>CONTENT</span><h2>المحتوى والإعلانات</h2></div><div class="ahq-feature-grid"><b>📢 الإعلانات</b><b>🧾 قوانين البطولات</b><b>🏆 Hall of Fame</b><b>📊 Ranking</b><b>🎯 Challenges</b><b>📣 إشعارات اللاعبين</b></div></article></section>'
}
function economy(){
 return'<section><div class="ahq-grid2"><article class="ahq-card"><div class="ahq-card-title"><span>COINS</span><h2>الاقتصاد</h2></div><p>من تبويب اللاعبين تقدر تمنح Coins مباشرة. إعدادات المكافآت الحالية باقية خدامة.</p><button class="ahq-primary" data-open-old="coin">إعدادات Coins</button></article><article class="ahq-card"><div class="ahq-card-title"><span>XP • SHOP</span><h2>XP والمتجر</h2></div><div class="ahq-feature-grid"><b>⚡ أكواد XP</b><b>🛒 نقاط المتجر</b><b>🎁 Rewards</b><b>🎲 Mystery Boxes</b></div><button class="ahq-primary" data-open-old="shop">فتح إدارة المتجر</button></article></div></section>'
}
function maintenance(){
 const s=state.settings||{};
 return'<section><div class="ahq-grid2"><article class="ahq-card"><div class="ahq-card-title"><span>MAINTENANCE</span><h2>وضع التطبيق</h2></div><div class="ahq-maintenance-state"><b class="'+(s.maintenance?"danger":"ok")+'">'+(s.maintenance?"🔴 التطبيق فالصيانة":"🟢 التطبيق مفتوح")+'</b><button class="ahq-danger" data-maintenance-toggle>'+(s.maintenance?"إلغاء الصيانة":"تفعيل الصيانة")+'</button></div><p class="ahq-note">الصيانة الحالية مرتبطة بـ app_settings.</p></article><article class="ahq-card"><div class="ahq-card-title"><span>GLOBAL SETTINGS</span><h2>إعدادات المنصة</h2></div><label class="ahq-check"><input id="ahqRegistration" type="checkbox" '+(s.registration_enabled?"checked":"")+'> التسجيل مفتوح</label><label class="ahq-check"><input id="ahqJoin" type="checkbox" '+(s.join_enabled?"checked":"")+'> الانضمام للبطولات مفتوح</label><label class="ahq-check"><input id="ahqPremium" type="checkbox" '+(s.premium_enabled?"checked":"")+'> Premium مفعّل</label><button class="ahq-primary" data-save-settings>حفظ</button></article></div><article class="ahq-card"><div class="ahq-card-title"><span>TOOLS</span><h2>أدوات الإدارة</h2></div><div class="ahq-feature-grid"><b>♙ اللاعبين المحذوفين</b><b>🔐 استرجاع الأكواد</b><b>📝 طلبات الأسماء</b><b>🕘 سجل العمليات</b></div><p class="ahq-note">الأدوات اللي ما عندهاش جداول مستقلة حاليا ما غاديش نخترعو ليها بيانات.</p></article></section>'
}
function bind(){
 const search=$("ahqPlayerSearch");if(search)search.oninput=()=>{const q=search.value.toLowerCase();document.querySelectorAll(".ahq-player").forEach(x=>x.style.display=x.textContent.toLowerCase().includes(q)?"":"none")};
 document.querySelectorAll("[data-tab-go]").forEach(b=>b.onclick=()=>{state.tab=b.dataset.tabGo;render()});
 document.querySelectorAll("[data-page-go]").forEach(b=>b.onclick=()=>window.showPage?.(b.dataset.pageGo));
 document.querySelectorAll("[data-match-page]").forEach(b=>b.onclick=()=>window.openMatchRoom?.(b.dataset.matchPage));
 document.querySelectorAll("[data-open-tournament]").forEach(b=>b.onclick=()=>openTournamentAdmin(b.dataset.openTournament));
 document.querySelectorAll("[data-start]").forEach(b=>b.onclick=()=>runRpc("start_tournament",{p_tournament_id:b.dataset.start},"تم بدء البطولة 🚀"));
 document.querySelectorAll("[data-advance-group]").forEach(b=>b.onclick=()=>runRpc("advance_group_tournament",{p_tournament_id:b.dataset.advanceGroup},"تم تطبيق مرحلة التأهل 🏅"));
 document.querySelectorAll("[data-advance-direct]").forEach(b=>b.onclick=()=>runRpc("advance_direct_tournament",{p_tournament_id:b.dataset.advanceDirect},"تم تقدم البطولة ➡️"));
 document.querySelectorAll("[data-confirm-match]").forEach(b=>b.onclick=()=>runRpc("confirm_match_result",{p_match_id:b.dataset.confirmMatch},"تم تأكيد النتيجة ✅"));
 document.querySelectorAll("[data-premium]").forEach(b=>b.onclick=()=>runRpc("owner_set_account",{p_target:b.dataset.premium,p_action:"premium",p_value:!state.players.find(x=>x.id===b.dataset.premium)?.premium},"تم تحديث Premium"));
 document.querySelectorAll("[data-coins]").forEach(b=>b.onclick=()=>coinModal(b.dataset.coins));
 document.querySelectorAll("[data-organizer]").forEach(b=>b.onclick=()=>window.openOrganizerAccessModal?.(b.dataset.organizer));
 document.querySelectorAll("[data-delete-tournament]").forEach(b=>b.onclick=()=>window.deleteTournamentConfirmed?.(b.dataset.deleteTournament));
 document.querySelectorAll("[data-request]").forEach(b=>b.onclick=()=>decideRequest(b.dataset.request,b.dataset.reqAction));
 document.querySelector("[data-broadcast]")?.addEventListener("click",broadcast);
 document.querySelector("[data-save-settings]")?.addEventListener("click",saveSettings);
 document.querySelector("[data-maintenance-toggle]")?.addEventListener("click",toggleMaintenance);
 document.querySelectorAll("[data-action='new-tournament']").forEach(b=>b.onclick=()=>window.openCreateTournament?.());
 document.querySelector("[data-open-old='coin']")?.addEventListener("click",()=>window.openCoinSettingsModal?.());
 document.querySelector("[data-open-old='shop']")?.addEventListener("click",()=>window.openOwnerShopManager?.());
}
async function runRpc(fn,args,msg){const r=await supabaseClient.rpc(fn,args);if(r.error){console.error(fn,r.error);toast("ما قدرناش نطبق العملية: "+(r.error.message||""));return}toast(msg);await loadAll()}
async function coinModal(id){const p=state.players.find(x=>x.id===id);if(!p)return;const a=prompt("شحال من Coin نعطي لـ "+(p.display_name||p.username)+"؟","50");if(a===null)return;const n=Number(a);if(!Number.isInteger(n)||n===0)return toast("دخل رقم صحيح.");const reason=prompt("السبب","Owner reward")||"Owner reward";const r=await supabaseClient.rpc("owner_grant_coins",{p_target:id,p_amount:n,p_reason:reason,p_note:"من Admin HQ"});if(r.error)return toast("وقع مشكل فـ Coins.");toast("تم تحديث Coins 🪙");loadAll()}
async function decideRequest(id,action){const note=prompt(action==="approve"?"ملاحظة القبول (اختياري)":"سبب الرفض (اختياري)","")||"";const r=await supabaseClient.rpc("owner_decide_organizer_request",{p_request_id:id,p_action:action,p_owner_note:note});if(r.error)return toast("وقع مشكل فالطلب.");toast(action==="approve"?"تقبل الطلب ✅":"ترفض الطلب.");loadAll()}
async function saveSettings(){const r=await supabaseClient.from("app_settings").update({registration_enabled:$("ahqRegistration")?.checked||false,join_enabled:$("ahqJoin")?.checked||false,premium_enabled:$("ahqPremium")?.checked||false}).eq("id",1);if(r.error)return toast("ما تحفضاتش الإعدادات.");toast("تحفظات الإعدادات ✅");loadAll()}
async function toggleMaintenance(){const r=await supabaseClient.from("app_settings").update({maintenance:!state.settings?.maintenance}).eq("id",1);if(r.error)return toast("ما قدرناش نبدلو وضع الصيانة.");toast(state.settings?.maintenance?"تسدات الصيانة.":"تفعلات الصيانة 🛠");loadAll()}
async function broadcast(){const msg=$("ahqBroadcast")?.value.trim();if(!msg)return toast("كتب الإعلان أولا.");const rows=state.players.map(p=>({user_id:p.id,title:"إعلان من CHAoui",message:msg,read:false}));const r=await supabaseClient.from("notifications").insert(rows);if(r.error)return toast("تعذر إرسال الإعلان: "+(r.error.message||""));toast("تبعث الإعلان 📢");$("ahqBroadcast").value=""}
async function openTournamentAdmin(id){
 const t=state.tournaments.find(x=>x.id===id);if(!t)return;
 const r=await supabaseClient.from("tournament_players").select("*").eq("tournament_id",id).order("created_at",{ascending:true});
 const rows=r.data||[],ids=rows.map(x=>x.player_id).filter(Boolean),people=ids.length?(await supabaseClient.from("profiles").select("id,username,display_name,rating,points").in("id",ids)).data||[]:[],map=new Map(people.map(x=>[x.id,x]));
 const html=rows.map(x=>{const p=map.get(x.player_id)||{};return'<div class="ahq-row"><div><b>'+esc(p.display_name||p.username||"Player")+'</b><small>Rating '+(p.rating||0)+" · "+(p.points||0)+" pts</small></div><span class=\"ahq-pill\">"+esc(x.status||"pending")+'</span><div class="ahq-actions"><button data-tp="'+x.id+'" data-status="accepted">✅ تأهيل</button><button data-tp="'+x.id+'" data-status="waitlist">⏳ انتظاري</button><button data-tp="'+x.id+'" data-status="rejected" class="danger-btn">❌ رفض</button></div></div>'}).join("")||empty("ماكاين حتى لاعب.");
 const m=document.createElement("div");m.className="ahq-modal";m.innerHTML='<div class="ahq-modal-box"><button class="ahq-close">×</button><span class="ahq-kicker">TOURNAMENT</span><h2>'+esc(t.name)+'</h2><p>'+esc(t.description||"")+" · "+esc(t.format||"")+'</p><div class="ahq-modal-list">'+html+"</div></div>";document.body.appendChild(m);m.querySelector(".ahq-close").onclick=()=>m.remove();m.querySelectorAll("[data-tp]").forEach(b=>b.onclick=async()=>{const r=await supabaseClient.from("tournament_players").update({status:b.dataset.status}).eq("id",b.dataset.tp);if(r.error)return toast("ما قدرناش نبدلو الحالة.");toast("تبدلات حالة اللاعب.");m.remove();openTournamentAdmin(id);loadAll()});
}
window.adminHQRenderKing=async function(){if(!ownerOnly())return;shell();await loadAll()};
window.adminHQRefresh=loadAll;
})();