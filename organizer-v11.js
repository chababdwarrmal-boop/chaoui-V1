/* CHAoui Organizer HQ V11 */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const esc=v=>window.escapeHTML?window.escapeHTML(v??""):String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const toast=m=>window.showToast?window.showToast(m):alert(m);
const fmt=v=>{try{return v?new Date(v).toLocaleString("ar-MA",{dateStyle:"medium",timeStyle:"short"}):"—"}catch{return"—"}};
const sl=s=>({pending:"في الانتظار",accepted:"مقبول",waitlist:"لائحة الانتظار",rejected:"مرفوض",open:"مفتوحة",live:"مباشرة",done:"منتهية",paused:"متوقفة",draft:"مسودة",cancelled:"ملغاة"}[s]||s||"—");
const fl=s=>({direct:"إقصاء مباشر",groups:"مجموعات",groups_knockout:"مجموعات + إقصائيات"}[s]||s||"eFootball");
const allowed=()=>!!window.currentProfile&&["owner","organizer"].includes(currentProfile.role)&&(!window.isOrganizerActive||currentProfile.role==="owner"||isOrganizerActive(currentProfile));
let currentT=null,tab="registrations";

async function mine(){
 if(!allowed()||!window.currentUser)return[];
 let q=supabaseClient.from("tournaments").select("*").order("created_at",{ascending:false});
 if(currentProfile.role!=="owner")q=q.eq("organizer_id",currentUser.id);
 const r=await q;if(r.error){console.error(r.error);toast("وقع مشكل فتحميل البطولات.");return[]}return r.data||[];
}
function baseShell(){
 const root=$("organizer");if(!root)return;
 root.innerHTML='<div class="org11-shell"><header class="org11-top"><div class="org11-brand"><div class="org11-logo">🏆</div><div><b>لوحة المنظم</b><small>eFootball 1VS1</small></div></div><div class="org11-role">'+esc(currentProfile.role==="owner"?"OWNER":"ORGANIZER")+'</div><button class="org11-exit" data-page="home">← رجوع</button></header><div class="org11-hero"><div><span>CHAoui TOURNAMENT CONTROL</span><h1>نظّم البطولة من البداية حتى النهاية.</h1><p>التسجيلات، المشاركون، المباريات، النتائج، التأهل والتواصل فمكان واحد.</p></div><button class="org11-primary" id="org11Create">+ إنشاء بطولة</button></div><div id="org11Body"></div></div>';
 $("org11Create").onclick=()=>window.openCreateTournament?.();
 document.querySelector("#organizer [data-page='home']").onclick=()=>window.showPage?.("home");
}
async function render(){
 const root=$("organizer");if(!root)return;
 if(!allowed()){root.innerHTML='<div class="org11-lock"><div>🔒</div><h2>صفحة المنظم</h2><p>هاد الصفحة كتخدم غير للـOwner والمنظم المفعّل.</p></div>';return}
 baseShell();
 const ts=await mine(),ids=ts.map(t=>t.id);
 const {data:regs}=ids.length?await supabaseClient.from("tournament_players").select("tournament_id,status").in("tournament_id",ids):{data:[]};
 const rr=regs||[], pending=rr.filter(x=>x.status==="pending").length,accepted=rr.filter(x=>x.status==="accepted").length;
 $("org11Body").innerHTML='<section class="org11-stats"><article><span>🏆 البطولات</span><strong>'+ts.length+'</strong></article><article><span>🟢 مفتوحة</span><strong>'+ts.filter(x=>x.status==="open").length+'</strong></article><article><span>🔴 مباشرة</span><strong>'+ts.filter(x=>x.status==="live").length+'</strong></article><article><span>⏳ تسجيلات تنتظر</span><strong>'+pending+'</strong></article><article><span>👥 لاعبين مقبولين</span><strong>'+accepted+'</strong></article></section><section class="org11-workflow"><div><span>WORKFLOW</span><b>التسجيل → القبول → البداية → المباريات → النتائج → النهاية</b></div><small>كل مرحلة كتظل واضحة قدامك حتى تسالي البطولة.</small></section><section class="org11-list"><div class="org11-list-head"><div><span>MY TOURNAMENTS</span><h2>بطولاتي</h2></div><button class="org11-secondary" id="org11Refresh">تحديث</button></div><div id="org11TournamentCards"></div></section>';
 $("org11Refresh").onclick=render;
 const box=$("org11TournamentCards");
 box.innerHTML=ts.map(t=>{
   const count=rr.filter(x=>x.tournament_id===t.id).length,ac=rr.filter(x=>x.tournament_id===t.id&&x.status==="accepted").length,pe=rr.filter(x=>x.tournament_id===t.id&&x.status==="pending").length,pct=t.capacity?Math.min(100,Math.round(Number(t.current_players||0)/Number(t.capacity)*100)):0;
   return '<article class="org11-card"><div class="org11-card-head"><div><span class="org11-status '+esc(t.status)+'">'+esc(sl(t.status))+'</span><h3>'+esc(t.name)+'</h3><p>'+esc(t.game||"eFootball")+' · '+esc(fl(t.format))+' · '+fmt(t.start_at)+'</p></div><strong>'+Number(t.current_players||0)+'/'+Number(t.capacity||0)+'</strong></div><div class="org11-progress"><i style="width:'+pct+'%"></i></div><div class="org11-meta"><span>👥 '+count+' تسجيل</span><span>✅ '+ac+' مقبول</span><span>⏳ '+pe+' انتظار</span></div><div class="org11-actions"><button class="org11-primary" data-org-open="'+esc(t.id)+'">فتح إدارة البطولة</button><button class="org11-secondary" data-org-public="'+esc(t.id)+'">صفحة البطولة</button>'+(t.status==="open"?'<button class="org11-start" data-org-start="'+esc(t.id)+'">🚀 بدء البطولة</button>':"")+'</div></article>';
 }).join("")||'<div class="org11-empty">مازال ما عندك حتى بطولة. أنشئ أول بطولة وابدأ التسجيل.</div>';
 box.querySelectorAll("[data-org-open]").forEach(b=>b.onclick=()=>openControl(b.dataset.orgOpen,ts));
 box.querySelectorAll("[data-org-public]").forEach(b=>b.onclick=()=>window.openTournament?.(b.dataset.orgPublic));
 box.querySelectorAll("[data-org-start]").forEach(b=>b.onclick=async()=>{await window.closeTournamentRegistration?.(b.dataset.orgStart);await render()});
}
async function openControl(id,ts){
 currentT=ts.find(x=>x.id===id);if(!currentT)return;tab="registrations";
 const m=document.createElement("div");m.className="org11-modal";m.id="org11Modal";
 m.innerHTML='<div class="org11-modal-box"><button class="org11-close" id="org11Close">×</button><div class="org11-modal-head"><span>TOURNAMENT CONTROL</span><h2>'+esc(currentT.name)+'</h2><p>'+esc(sl(currentT.status))+' · '+esc(fl(currentT.format))+' · '+Number(currentT.current_players||0)+'/'+Number(currentT.capacity||0)+'</p></div><div class="org11-tabs" id="org11Tabs"><button class="active" data-tab="registrations">📋 التسجيلات</button><button data-tab="matches">⚔️ المباريات</button><button data-tab="settings">⚙️ إعدادات البطولة</button><button data-tab="communication">📢 التواصل</button></div><div id="org11ControlBody"></div></div>';
 document.body.appendChild(m);$("org11Close").onclick=()=>m.remove();
 m.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;m.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));controlBody()});
 await controlBody();
}
async function controlBody(){
 const b=$("org11ControlBody");if(!b||!currentT)return;b.innerHTML='<div class="org11-loading">جاري تحميل المعلومات...</div>';
 if(tab==="registrations")return registrations(b);if(tab==="matches")return matches(b);if(tab==="settings")return settings(b);return communication(b);
}
async function registrations(b){
 const r=await supabaseClient.from("tournament_players").select("*").eq("tournament_id",currentT.id).order("created_at",{ascending:true});
 if(r.error){b.innerHTML='<div class="org11-empty">ما قدرناش نحملو التسجيلات.</div>';return}
 const rows=r.data||[],ids=rows.map(x=>x.player_id).filter(Boolean);
 const p=ids.length?(await supabaseClient.from("profiles").select("id,username,display_name,efootball_name,rating,points").in("id",ids)).data||[]:[];
 const map=new Map(p.map(x=>[x.id,x])),c={pending:0,accepted:0,waitlist:0,rejected:0};rows.forEach(x=>c[x.status]=(c[x.status]||0)+1);
 b.innerHTML='<div class="org11-reg-summary"><span>📋 '+rows.length+' تسجيل</span><span>⏳ '+c.pending+' انتظار</span><span>✅ '+c.accepted+' مقبول</span><span>🟡 '+c.waitlist+' لائحة انتظار</span><span>❌ '+c.rejected+' مرفوض</span></div><div class="org11-reg-list">'+(rows.map(x=>{const q=map.get(x.player_id)||{};return '<article class="org11-reg"><div class="org11-reg-main"><div class="org11-avatar">'+esc((q.display_name||q.username||"P").slice(0,1).toUpperCase())+'</div><div><h3>'+esc(x.registration_name||q.display_name||q.username||"Player")+'</h3><p>@'+esc(q.username||"—")+' · '+esc(x.registration_efootball_name||q.efootball_name||"eFootball")+'</p><div class="org11-reg-tags"><span>📱 '+esc(x.registration_whatsapp||"—")+'</span><span>'+(x.registration_type==="premium"?"💎 Premium":"🆓 Free")+'</span><span>⏰ '+esc(x.preferred_time||"—")+'</span><span>📶 '+esc(x.connection_type==="conix"?"Conix":"WiFi")+'</span><span>'+(x.prior_participation?"🏆 سبق شارك":"🆕 أول مشاركة")+'</span><span>'+(x.commitment_confirmed?"🤝 ملتزم":"⚠️ الالتزام ناقص")+'</span></div></div></div><div class="org11-reg-side"><span class="org11-status '+esc(x.status)+'">'+esc(sl(x.status))+'</span><small>Rating '+Number(q.rating||0)+' · '+Number(q.points||0)+' pts</small><div class="org11-actions">'+(x.status!=="accepted"?'<button data-rs="accepted" data-id="'+esc(x.id)+'">✅ قبول</button>':"")+(x.status!=="waitlist"?'<button data-rs="waitlist" data-id="'+esc(x.id)+'">⏳ انتظار</button>':"")+(x.status!=="rejected"?'<button class="danger" data-rs="rejected" data-id="'+esc(x.id)+'">❌ رفض</button>':"")+'</div></div></article>'}).join("")||'<div class="org11-empty">مازال ما كاين حتى تسجيل.</div>')+'</div>';
 b.querySelectorAll("[data-rs]").forEach(x=>x.onclick=async()=>{const z=await supabaseClient.from("tournament_players").update({status:x.dataset.rs}).eq("id",x.dataset.id);if(z.error)return toast("ما قدرناش نبدلو الحالة.");toast(x.dataset.rs==="accepted"?"تقبل اللاعب ✅":x.dataset.rs==="waitlist"?"تحط فالانتظار ⏳":"ترفض التسجيل ❌");await render();await controlBody()});
}
async function matches(b){
 const r=await supabaseClient.from("matches").select("*").eq("tournament_id",currentT.id).order("scheduled_at",{ascending:true}),ms=r.data||[],ids=[...new Set(ms.flatMap(x=>[x.player_a,x.player_b]).filter(Boolean))],pp=ids.length?(await supabaseClient.from("profiles").select("id,display_name,username").in("id",ids)).data||():[],map=new Map(pp.map(x=>[x.id,x]));
 b.innerHTML='<div class="org11-match-summary"><span>⚔️ '+ms.length+' مباراة</span><span>⏳ '+ms.filter(x=>x.status==="result_submitted").length+' تحتاج تأكيد</span><span>🏁 '+ms.filter(x=>x.status==="finished").length+' منتهية</span></div><div class="org11-match-list">'+(ms.map(x=>{const a=map.get(x.player_a)||{},d=map.get(x.player_b)||{};return '<article><div><span>'+esc(x.round||"Match")+'</span><h3>'+esc(a.display_name||a.username||"TBD")+' <b>VS</b> '+esc(d.display_name||d.username||"TBD")+'</h3><small>'+esc(fmt(x.scheduled_at))+'</small></div><strong>'+(x.score_a!=null?Number(x.score_a)+" : "+Number(x.score_b):"VS")+'</strong><button class="org11-secondary" data-m="'+esc(x.id)+'">فتح Match Room</button></article>'}).join("")||'<div class="org11-empty">مازال ما تخلقو مباريات. بدا البطولة من بعد قبول اللاعبين.</div>')+'</div>';
 b.querySelectorAll("[data-m]").forEach(x=>x.onclick=()=>window.openMatchRoom?.(x.dataset.m));
}
function settings(b){
 b.innerHTML='<div class="org11-settings-grid"><article><span>GAME</span><strong>'+esc(currentT.game||"eFootball")+'</strong></article><article><span>FORMAT</span><strong>'+esc(fl(currentT.format))+'</strong></article><article><span>CAPACITY</span><strong>'+Number(currentT.capacity||0)+' لاعبين</strong></article><article><span>ENTRY</span><strong>'+(currentT.entry_type==="premium"?"💎 Premium":"🆓 Free")+'</strong></article><article><span>START</span><strong>'+esc(fmt(currentT.start_at))+'</strong></article><article><span>STATUS</span><strong>'+esc(sl(currentT.status))+'</strong></article></div><div class="org11-settings-actions"><button class="org11-primary" id="org11Edit">تعديل البطولة</button>'+(currentT.status==="open"?'<button class="org11-start" id="org11Start">🚀 بدء البطولة</button>':"")+'</div>';
 $("org11Edit").onclick=()=>window.editTournamentFetchAndOpen?.(currentT.id);
 $("org11Start")?.addEventListener("click",async()=>{await window.closeTournamentRegistration?.(currentT.id);$("org11Modal")?.remove();await render()});
}
async function communication(b){
 const r=await supabaseClient.from("tournament_players").select("player_id").eq("tournament_id",currentT.id).eq("status","accepted"),rows=r.data||[];
 b.innerHTML='<article class="org11-announce"><span>📢 TOURNAMENT ANNOUNCEMENT</span><h3>صيفط إعلان للمشاركين</h3><textarea id="org11Announcement" placeholder="مثال: الماتشات غادي تبدا مع 22:00..."></textarea><button class="org11-primary" id="org11Send">إرسال لـ '+rows.length+' لاعب</button></article>';
 $("org11Send").onclick=async()=>{const msg=$("org11Announcement").value.trim();if(!msg)return toast("كتب الإعلان أولا.");if(!rows.length)return toast("مازال ما كاين حتى لاعب مقبول.");const z=await supabaseClient.from("notifications").insert(rows.map(x=>({user_id:x.player_id,title:"إعلان البطولة: "+currentT.name,message:msg,read:false})));if(z.error)return toast("تعذر إرسال الإعلان.");toast("تبعث الإعلان 📢");$("org11Announcement").value=""};
}
async function registrationForm(id){
 if(!window.currentUser){window.showLoginForm?.();return}
 const t=(await supabaseClient.from("tournaments").select("*").eq("id",id).single()).data;if(!t)return toast("البطولة ما لقايناش.");
 const p=(await supabaseClient.from("profiles").select("display_name,username,efootball_name,premium").eq("id",currentUser.id).single()).data||{};
 const pv=(await supabaseClient.from("player_private").select("whatsapp").eq("id",currentUser.id).maybeSingle()).data||{};
 const typ=t.entry_type==="premium"?"premium":(p.premium?"premium":"free");
 openModal('<div class="org11-form"><div class="org11-form-head"><button class="modal-close" onclick="closeModal()">×</button><span>REGISTRATION</span><h2>التسجيل فـ '+esc(t.name)+'</h2><p>المعلومات اللي غادي يحتاجها المنظم باش ينظم الماتشات.</p></div><label>الاسم الكامل<input id="orgRegName" class="modal-input" value="'+esc(p.display_name||"")+'"></label><label>اسم eFootball<input id="orgRegEfootball" class="modal-input" value="'+esc(p.efootball_name||p.username||"")+'"></label><label>WhatsApp<input id="orgRegWhatsapp" class="modal-input" value="'+esc(pv.whatsapp||"")+'"></label><label>نوع المشاركة<select id="orgRegType" class="modal-input" '+(t.entry_type==="premium"?"disabled":"")+'><option value="free" '+(typ==="free"?"selected":"")+'>🆓 Free</option><option value="premium" '+(typ==="premium"?"selected":"")+'>💎 Premium</option></select></label><label>الوقت المناسب<select id="orgRegTime" class="modal-input"><option>20:00 - 22:00</option><option>22:00 - 00:00</option><option>18:00 - 20:00</option><option>مرن</option></select></label><label>الكونيكسيون<select id="orgRegConn" class="modal-input"><option value="wifi">WiFi</option><option value="conix">Conix</option></select></label><label class="org11-check"><input id="orgRegPrior" type="checkbox"> سبق ليك شاركتي فبطولات؟</label><label class="org11-check"><input id="orgRegCommit" type="checkbox"> كنأكد باللي نقدر نلتازم بالمباريات ديالي.</label><label class="org11-check"><input id="orgRegRules" type="checkbox"> قريت وقبلت قوانين البطولة.</label><label>ملاحظة للمنظم<textarea id="orgRegNote" class="modal-input" rows="3"></textarea></label><button id="orgRegSubmit" class="org11-primary org11-submit">تأكيد التسجيل 🔥</button></div>');
 $("orgRegSubmit").onclick=async()=>{const a={p_tournament_id:id,p_registration_name:$("orgRegName").value.trim(),p_registration_whatsapp:$("orgRegWhatsapp").value.trim(),p_registration_efootball_name:$("orgRegEfootball").value.trim(),p_registration_type:$("orgRegType").value,p_preferred_time:$("orgRegTime").value,p_connection_type:$("orgRegConn").value,p_prior_participation:$("orgRegPrior").checked,p_commitment_confirmed:$("orgRegCommit").checked,p_rules_accepted:$("orgRegRules").checked,p_registration_note:$("orgRegNote").value.trim()||null};if(!a.p_registration_name||!a.p_registration_efootball_name||!a.p_registration_whatsapp)return toast("عمر الاسم، eFootball وWhatsApp.");if(!a.p_commitment_confirmed||!a.p_rules_accepted)return toast("خاصك تأكد الالتزام وقبول القوانين.");const btn=$("orgRegSubmit");btn.disabled=true;btn.textContent="جاري التسجيل...";const r=await supabaseClient.rpc("join_tournament_with_registration",a);if(r.error){btn.disabled=false;btn.textContent="تأكيد التسجيل 🔥";return toast((r.error.message||"").includes("PREMIUM")?"هاد التسجيل خاصو Premium 💎":"وقع مشكل فالتسجيل.");}closeModal();toast(r.data==="waitlist"?"تسجلتي فـ Waitlist ⏳":"تسجلتي فالبطولة بنجاح ✅");await window.renderTournaments?.();await window.openTournament?.(id)};
window.renderOrganizerV11=render;window.openOrganizerTournamentControl=openControl;window.openTournamentRegistration=registrationForm;
if(window.showPage&&!window.__org11ShowWrapped){const old=window.showPage;window.__org11ShowWrapped=true;window.showPage=(p,o)=>{old(p,o);if(p==="organizer")setTimeout(render,30)}}
if(!window.__org11JoinWrapped){window.__org11JoinWrapped=true;window.joinTournament=registrationForm}
document.addEventListener("click",e=>{const b=e.target.closest("[data-tv2-join]");if(b){e.preventDefault();registrationForm(b.dataset.tv2Join)}});
setTimeout(()=>{if($("organizer")?.classList.contains("active-page"))render()},100);
})();