/* CHAoui Functional Core V17 — wire existing V15 UI to real Supabase data/actions */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const esc=v=>window.escapeHTML?window.escapeHTML(v??""):String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const toast=m=>window.showToast?.(m)||console.log(m);
let ownerBound=false,playerBound=false,selectedTournament=null;

async function ownerLoad(){
 if(window.currentProfile?.role!=="owner")return;
 const [p,t,m,c,r,s]=await Promise.all([
  supabaseClient.from("profiles").select("*").order("created_at",{ascending:false}).limit(100),
  supabaseClient.from("tournaments").select("*").order("created_at",{ascending:false}).limit(100),
  supabaseClient.from("matches").select("*").order("scheduled_at",{ascending:false}).limit(100),
  supabaseClient.from("complaints").select("*").order("created_at",{ascending:false}).limit(50),
  supabaseClient.from("organizer_subscription_requests").select("*").order("requested_at",{ascending:false}).limit(50),
  supabaseClient.from("app_settings").select("*").eq("id",1).maybeSingle()
 ]);
 const o=window.__chaouiOwner17={players:p.data||[],tournaments:t.data||[],matches:m.data||[],complaints:c.data||[],requests:r.data||[],settings:s.data||null};
 return o;
}
function modal(html){
 document.querySelector(".v17-modal")?.remove();
 const m=document.createElement("div");m.className="v17-modal";m.innerHTML='<div class="v17-modal-box"><button class="v17-x" type="button">×</button>'+html+"</div>";
 document.body.append(m);m.querySelector(".v17-x").onclick=()=>m.remove();return m;
}
async function playerManager(id){
 const o=window.__chaouiOwner17||await ownerLoad(),p=o?.players?.find(x=>x.id===id);if(!p)return;
 const m=modal('<span class="v17-kicker">PLAYER CONTROL</span><h2>'+esc(p.display_name||p.username||"Player")+'</h2><p class="v17-muted">@'+esc(p.username||"—")+' · Rating '+Number(p.rating||0)+' · Coins '+Number(p.coins||0)+'</p><div class="v17-actions"><button data-v17="premium">'+(p.premium?"إلغاء Premium":"تفعيل Premium")+'</button><button data-v17="coins">إضافة Coins</button><button data-v17="organizer">'+(p.role==="organizer"?"إرجاع Player":"ترقية Organizer")+'</button><button data-v17="copy">نسخ Player Code</button></div>');
 m.querySelector('[data-v17="premium"]').onclick=async()=>{const r=await supabaseClient.rpc("owner_set_account",{p_target:id,p_action:"premium",p_value:!p.premium});if(r.error)return toast("ما قدرناش نبدلو Premium.");toast("تبدل Premium ✓");m.remove();await ownerRefresh()};
 m.querySelector('[data-v17="organizer"]').onclick=()=>{m.remove();window.openOrganizerAccessModal?.(id)};
 m.querySelector('[data-v17="coins"]').onclick=async()=>{const a=prompt("شحال من Coin؟","50");if(a===null)return;const n=Number(a);if(!Number.isInteger(n)||n===0)return toast("دخل رقم صحيح.");const r=await supabaseClient.rpc("owner_grant_coins",{p_target:id,p_amount:n,p_reason:"Owner reward",p_note:"من Owner Command Center"});if(r.error)return toast("وقع مشكل فـ Coins.");toast("تم تحديث Coins ✓");m.remove();await ownerRefresh()};
 m.querySelector('[data-v17="copy"]').onclick=async()=>{if(!p.player_code)return toast("هاد اللاعب ما عندوش Player Code.");await navigator.clipboard?.writeText(p.player_code);toast("تنسخ Player Code ✓")};
}
async function ownerRefresh(){
 const o=await ownerLoad();
 if(window.__chaouiOwner17Render){window.__chaouiOwner17Render(o)}
}
function ownerWire(){
 if(ownerBound||window.currentProfile?.role!=="owner")return;ownerBound=true;
 window.__chaouiOwner17Render=async o=>{
  const body=$("o15Body");if(!body)return;
  body.querySelectorAll("[data-player]").forEach(b=>b.onclick=()=>playerManager(b.dataset.player));
  body.querySelectorAll("[data-maint17]").forEach(b=>b.onclick=async()=>{const r=await supabaseClient.from("app_settings").update({maintenance:!o.settings?.maintenance}).eq("id",1);if(r.error)return toast("تعذر تغيير الصيانة.");toast(o.settings?.maintenance?"تم إلغاء الصيانة ✓":"تم تفعيل الصيانة ✓");await ownerRefresh()});
  body.querySelector("[data-save-global17]")?.addEventListener("click",async()=>{
   const r=await supabaseClient.from("app_settings").update({registration_enabled:$("v17Reg")?.checked||false,join_enabled:$("v17Join")?.checked||false,premium_enabled:$("v17Prem")?.checked||false}).eq("id",1);
   if(r.error)return toast("تعذر حفظ الإعدادات.");toast("تحفظات الإعدادات ✓");await ownerRefresh();
  });
  body.querySelector("[data-broadcast17]")?.addEventListener("click",async()=>{
   const msg=$("v17Broadcast")?.value.trim();if(!msg)return toast("كتب الإعلان أولا.");
   const rows=o.players.map(p=>({user_id:p.id,title:"إعلان من CHAoui",message:msg,read:false}));
   const r=await supabaseClient.from("notifications").insert(rows);if(r.error)return toast("تعذر إرسال الإعلان.");
   $("v17Broadcast").value="";toast("تبعث الإعلان ✓");
  });
 };
}
function ownerPatch(){
 if(window.currentProfile?.role!=="owner")return;
 const body=$("o15Body");if(!body)return;
 const tabText=$("o15Title")?.textContent||"";
 if(tabText.includes("اللاعبون")){
  body.querySelectorAll(".o15-row").forEach(row=>{
   const b=row.querySelector(".o15-btn");if(!b||row.dataset.v17)return;
   const txt=row.textContent||"";const p=(window.__chaouiOwner17?.players||[]).find(x=>txt.includes(x.display_name||"§§")||txt.includes(x.username||"@@"));
   if(p){row.dataset.v17="1";b.dataset.player=p.id;b.textContent="إدارة";}
  });
 }
}
async function ownerRenderExtras(){
 if(window.currentProfile?.role!=="owner")return;
 const o=window.__chaouiOwner17||await ownerLoad();ownerWire();
 const body=$("o15Body");if(!body)return;
 const title=$("o15Title")?.textContent||"";
 if(title.includes("اللاعبون")){
  body.innerHTML='<div class="o15-card"><h2>👥 اللاعبين</h2><div class="v17-player-list">'+o.players.map(p=>'<article class="v17-player-row"><div><b>'+esc(p.display_name||p.username||"Player")+'</b><small>@'+esc(p.username||"—")+' · '+esc(p.role||"player")+' · Rating '+Number(p.rating||0)+' · 🪙 '+Number(p.coins||0)+'</small></div><button class="o15-btn gold" data-player="'+esc(p.id)+'">إدارة</button></article>').join("")+'</div></div>';
  const note=document.createElement("div");note.className="v17-owner-note";note.innerHTML="إدارة مباشرة: <b>Premium</b> · <b>Coins</b> · <b>Organizer</b> · Player Code";body.prepend(note);
 } 
 if(title.includes("الصيانة")){
   const card=body.querySelector(".o15-card");if(card&&!body.querySelector("[data-maint17]")){const s=o.settings||{};card.innerHTML='<h2>🛠️ الصيانة</h2><div class="v17-maint"><b>'+(s.maintenance?"🔴 التطبيق فالصيانة":"🟢 التطبيق مفتوح")+'</b><button class="o15-btn red" data-maint17>'+(s.maintenance?"إلغاء الصيانة":"تفعيل الصيانة")+'</button></div>'}
 }
 if(title.includes("إعدادات البطولة")){
   body.innerHTML='<div class="o15-card"><h2>⚙️ إعدادات المنصة</h2><label class="v17-check"><input id="v17Reg" type="checkbox" '+(o.settings?.registration_enabled?"checked":"")+'> التسجيل مفتوح</label><label class="v17-check"><input id="v17Join" type="checkbox" '+(o.settings?.join_enabled?"checked":"")+'> الانضمام مفتوح</label><label class="v17-check"><input id="v17Prem" type="checkbox" '+(o.settings?.premium_enabled?"checked":"")+'> Premium مفعّل</label><button class="o15-btn gold" data-save-global17>حفظ الإعدادات</button></div>';
 }
 if(title.includes("الإعلانات")){
   body.innerHTML='<div class="o15-card"><h2>📢 إعلان للاعبين</h2><textarea id="v17Broadcast" placeholder="كتب الإعلان هنا..."></textarea><button class="o15-btn gold" data-broadcast17>إرسال للجميع</button></div>';
 }
 if(title.includes("آخر تحديث")){
   body.innerHTML='<div class="o15-card"><h2>🆕 آخر تحديث</h2><p class="v17-muted">V17 Functional Core — ربط واجهة Player وOwner بالبيانات والعمليات الموجودة فعلاً فـ Supabase.</p><p class="v17-muted">آخر مزامنة: '+new Date().toLocaleString("ar-MA")+'</p></div>';
 }
 if(title.includes("البدلاء")){
   body.querySelector(".o15-card")?.insertAdjacentHTML("beforeend",'<p class="v17-muted">الترقية لـ Organizer أو الرجوع لـ Player كتدار من إدارة اللاعب، مع أثر واضح فالصلاحيات.</p>');
 }
 ownerPatch();window.__chaouiOwner17Render(o);
}
async function loadPlayerTournaments(){
 if(!window.currentUser)return [];
 const r=await supabaseClient.from("tournament_players").select("tournament_id,status").eq("player_id",window.currentUser.id);
 if(r.error)return [];
 const ids=[...new Set((r.data||[]).map(x=>x.tournament_id).filter(Boolean))];if(!ids.length)return [];
 const t=await supabaseClient.from("tournaments").select("*").in("id",ids).order("created_at",{ascending:false});
 return (t.data||[]).map(x=>({...x,_membership:(r.data||[]).find(m=>m.tournament_id===x.id)}));
}
function renderTournamentPanel(type,data){
 const box=$("p15TournamentPanel");if(!box)return;
 const current=data.find(x=>["live","open"].includes(x.status))||data[0];
 if(type==="groups"){
  if(!current)return box.innerHTML='<h3>لا توجد بطولة</h3><p>سجل فبطولة باش تبان هنا المجموعة ديالك.</p>';
  box.innerHTML='<div class="v17-panel-head"><div><span>ACTIVE TOURNAMENT</span><h3>'+esc(current.name)+'</h3><p>'+esc(current.status||"—")+' · '+Number(current.current_players||0)+'/'+Number(current.capacity||0)+'</p></div><b>'+esc(current._membership?.status||"pending")+'</b></div><div class="v17-mini-grid"><div><span>الصيغة</span><b>'+esc(current.format||"—")+'</b></div><div><span>البداية</span><b>'+esc(current.start_at?new Date(current.start_at).toLocaleString("ar-MA"):"—")+'</b></div><div><span>اللعبة</span><b>'+esc(current.game||"eFootball")+'</b></div></div><button class="p15-action" data-page="tournaments">فتح البطولة كاملة</button>';
 }else if(type==="ranking"){
  const top=[...(window.__chaouiOwner17?.players||[])].sort((a,b)=>Number(b.rating||0)-Number(a.rating||0)).slice(0,8);
  const me=window.currentProfile;
  box.innerHTML='<h3>🏅 ترتيبك الحالي</h3><p>Rating '+Number(me?.rating||0)+' · Points '+Number(me?.points||0)+'</p><div class="v17-list">'+top.map((p,i)=>'<div><b>#'+(i+1)+' '+esc(p.display_name||p.username)+'</b><span>'+Number(p.rating||0)+'</span></div>').join("")+'</div>';
 }else if(type==="stats"){
  const p=window.currentProfile||{};const matches=Number(p.wins||0)+Number(p.losses||0)+Number(p.draws||0),wr=matches?Math.round(Number(p.wins||0)/matches*100):0;
  box.innerHTML='<h3>📊 إحصائياتك</h3><div class="v17-mini-grid"><div><span>المباريات</span><b>'+matches+'</b></div><div><span>الفوز</span><b>'+Number(p.wins||0)+'</b></div><div><span>الخسارة</span><b>'+Number(p.losses||0)+'</b></div><div><span>Win Rate</span><b>'+wr+'%</b></div><div><span>Rating</span><b>'+Number(p.rating||0)+'</b></div><div><span>Points</span><b>'+Number(p.points||0)+'</b></div></div>';
 }else if(type==="matches"){
  const id=window.currentUser?.id;if(!id)return;
  const [a,b]=await Promise.all([supabaseClient.from("matches").select("*").eq("player_a",id).order("scheduled_at",{ascending:false}).limit(20),supabaseClient.from("matches").select("*").eq("player_b",id).order("scheduled_at",{ascending:false}).limit(20)]);
  const ms=[...(a.data||[]),...(b.data||[])].sort((x,y)=>new Date(y.scheduled_at||0)-new Date(x.scheduled_at||0));
  box.innerHTML='<h3>⚔️ مبارياتي</h3><div class="v17-list">'+(ms.map(x=>'<div><b>'+esc(x.round||"Match")+'</b><span>'+esc(x.status||"—")+' · '+(x.score_a!=null?Number(x.score_a)+" : "+Number(x.score_b):"VS")+'</span></div>').join("")||'<p>مازال ما كايناش مباريات.</p>')+'</div>';
 }else if(type==="achievements"){
  box.innerHTML='<h3>🏆 إنجازاتي</h3><p>الإنجازات كتفتح من التقدم ديالك، مع الاحتفاظ بصفحة البطولة خفيفة.</p><button class="p15-action" data-page="progression">فتح الإنجازات</button>';
 }
 box.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>window.showPage?.(b.dataset.page));
}
async function playerEnhance(){
 if(playerBound||!window.currentProfile)return;playerBound=true;
 const data=await loadPlayerTournaments();
 window.__chaouiPlayerTournaments=data;
 const wrap=document.querySelector(".p15-tournament-wrap");
 if(wrap){
  wrap.querySelectorAll(".p15-subtabs button").forEach(b=>b.addEventListener("click",async()=>renderTournamentPanel(b.dataset.panel,data)));
  renderTournamentPanel("groups",data);
 }
 const privateData=window.currentPlayerPrivate||{};
 const account=document.querySelector(".p15-account");
 if(account&&!account.querySelector(".v17-account-extra")){
  const x=document.createElement("section");x.className="v17-account-extra";x.innerHTML='<div class="v17-account-line"><span>WhatsApp</span><b>'+esc(privateData.whatsapp||"غير مضاف")+'</b></div><div class="v17-account-line"><span>الحالة</span><b>Player Account</b></div><div class="v17-account-actions"><button data-page="settings">إعدادات الحساب</button><button data-page="security">الخصوصية والأمان</button><button data-page="complaints">الإبلاغ عن مشكلة</button></div>';account.append(x);x.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>window.showPage?.(b.dataset.page));
 }
}
function boot(){
 const old=window.showPage;
 if(old&&!window.__chaouiV17Wrapped){
  window.__chaouiV17Wrapped=true;
  window.showPage=function(page,...args){const r=old.apply(this,[page,...args]);setTimeout(async()=>{if(page==="organizer"||page==="king"){await ownerRenderExtras()}if(page==="tournaments"||page==="profile"){await playerEnhance()}},80);return r};
 }
 const tick=setInterval(()=>{if(window.currentProfile?.role==="owner"){ownerRenderExtras();clearInterval(tick)}else if(window.currentProfile&&window.currentUser){playerEnhance();clearInterval(tick)}},500);
}
boot();
})();