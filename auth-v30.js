/* CHAoui V30 — registration-first entry */
(()=>{"use strict";
let ready=false;
const $=id=>document.getElementById(id);
const LOGO="chaoui-mark.svg";
const esc=v=>window.escapeHTML?window.escapeHTML(v??""):String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const slug=v=>String(v||"player").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,18)||"chaoui_player";

function note(text,type="error"){
 const el=$("c30AuthNote");if(el){el.textContent=text;el.className="c30-note "+type}
}
function selected(){
 return {
  tournamentId:$("c30TournamentId")?.value||"",
  name:$("c30Name")?.value.trim()||"",
  ef:$("c30Efootball")?.value.trim()||"",
  wa:$("c30Whatsapp")?.value.trim()||"",
  type:$("c30Type")?.value||"free",
  time:$("c30Time")?.value||"20:00 - 22:00",
  conn:$("c30Conn")?.value||"wifi",
  prior:$("c30Prior")?.value==="true",
  commit:!!$("c30Commit")?.checked,
  rules:!!$("c30Rules")?.checked
 };
}
async function loadOpenTournaments(){
 const box=$("c30Tours");if(!box||!window.supabaseClient)return;
 const r=await supabaseClient.from("tournaments").select("id,name,status,format,game,current_players,capacity,start_at,entry_type").eq("status","open").order("created_at",{ascending:false}).limit(10);
 const ts=r.data||[];
 box.innerHTML=ts.length?ts.map((t,i)=>'<button type="button" class="c30-tour '+(i===0?"active":"")+'" data-tid="'+esc(t.id)+'"><span><b>'+esc(t.name)+'</b><small>'+esc(t.game||"eFootball")+' · '+esc(t.format||"1VS1")+' · '+Number(t.current_players||0)+'/'+Number(t.capacity||0)+'</small></span><strong>'+(t.entry_type==="premium"?"PREMIUM":"FREE")+'</strong></button>').join(""):'<div class="c30-tour"><span><b>ما كايناش بطولة مفتوحة دابا</b><small>المنظم يقدر يفتح بطولة جديدة من بعد.</small></span></div>';
 box.querySelectorAll("[data-tid]").forEach(b=>b.onclick=()=>{box.querySelectorAll("[data-tid]").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("c30TournamentId").value=b.dataset.tid;});
 if(ts[0])$("c30TournamentId").value=ts[0].id;
}
function showPanel(which){
 $("c30PlayerLogin")?.classList.toggle("open",which==="player");
 $("c30AdminLogin")?.classList.toggle("open",which==="admin");
 $("c30Recovery")?.classList.toggle("open",which==="recovery");
 if(which)setTimeout(()=>{const e=which==="player"?$("c30PlayerLogin"):which==="admin"?$("c30AdminLogin"):$("c30Recovery");e?.scrollIntoView({behavior:"smooth",block:"center"})},0);
}
async function rpcJoin(d){
 const r=await supabaseClient.rpc("join_tournament_with_registration",{
  p_tournament_id:d.tournamentId,
  p_registration_name:d.name,
  p_registration_whatsapp:d.wa,
  p_registration_efootball_name:d.ef,
  p_registration_type:d.type,
  p_preferred_time:d.time,
  p_connection_type:d.conn,
  p_prior_participation:d.prior,
  p_commitment_confirmed:d.commit,
  p_rules_accepted:d.rules,
  p_registration_note:null
 });
 if(r.error)throw r.error;return r.data;
}
async function register(){
 const d=selected(),email=$("c30Email")?.value.trim().toLowerCase(),pass=$("c30Password")?.value||"";
 if(!d.tournamentId)return note("اختار بطولة من اللائحة قبل التسجيل.");
 if(!d.name||!d.ef||!d.wa||!email||!pass)return note("عمر المعلومات المطلوبة كاملة.");
 if(pass.length<6)return note("كلمة السر خاصها تكون 6 أحرف على الأقل.");
 if(!d.commit||!d.rules)return note("أكد الالتزام بالقوانين قبل إرسال التسجيل.");
 const gate=await supabaseClient.from("app_settings").select("registration_enabled,maintenance").eq("id",1).maybeSingle();
 if(gate.data&&(!gate.data.registration_enabled||gate.data.maintenance))return note("التسجيل مسدود دابا من طرف الإدارة.");
 const btn=$("c30Register");btn.disabled=true;btn.textContent="جاري إنشاء الحساب...";
 try{
  const username=slug(d.ef)+"_"+Math.random().toString(36).slice(2,6);
  const {data,error}=await supabaseClient.auth.signUp({email,password:pass,options:{data:{username,display_name:d.name,efootball_name:d.ef,whatsapp:d.wa}}});
  if(error)throw error;if(!data?.user)throw new Error("تعذر إنشاء الحساب.");
  window.currentUser=data.user;
  if(data.session){
   await supabaseClient.from("profiles").update({display_name:d.name,username,efootball_name:d.ef}).eq("id",data.user.id);
   await supabaseClient.from("player_private").upsert({id:data.user.id,whatsapp:d.wa});
   const status=await rpcJoin(d);
   await window.loadProfile?.();
   window.showApp?.();
   window.showPage?.("home",{fromBack:true});
   note(status==="pending"?"تسجل الحساب ✅ وبعثنا طلبك للمنظم للمراجعة.":"تم التسجيل بنجاح ✅","success");
  }else{
   note("الحساب تخلق ✅. أكد الإيميل ديالك، ومن بعد استعمل «دخول صفحتي».","success");
  }
 }catch(e){console.error(e);note(String(e?.message||"تعذر التسجيل."))}
 finally{btn.disabled=false;btn.textContent="إنشاء الحساب والتسجيل 🏆"}
}
async function login(kind){
 const email=$(kind==="admin"?"c30AdminEmail":"c30LoginEmail")?.value.trim().toLowerCase(),pass=$(kind==="admin"?"c30AdminPassword":"c30LoginPassword")?.value||"";
 if(!email||!pass)return note("دخل الإيميل وكلمة السر.");
 const btn=$(kind==="admin"?"c30AdminLoginBtn":"c30PlayerLoginBtn");btn.disabled=true;btn.textContent="جاري الدخول...";
 try{
  const {data,error}=await supabaseClient.auth.signInWithPassword({email,password:pass});if(error)throw error;
  window.currentUser=data.user;const prof=await window.loadProfile?.();if(!prof)throw new Error("البروفايل ما تحمّلش.");
  if(kind==="admin"&&!["owner","organizer"].includes(prof.role)){await supabaseClient.auth.signOut();throw new Error("هاد الحساب ماعندوش صلاحية الإدارة.")}
  window.showApp?.();window.showPage?.(kind==="admin"?"organizer":"home",{fromBack:true});
 }catch(e){console.error(e);note(String(e?.message||"تعذر الدخول."))}
 finally{btn.disabled=false;btn.textContent=kind==="admin"?"دخول الإدارة":"دخول صفحتي"}
}
function shell(){
 const box=document.querySelector("#authScreen .auth-box");if(!box)return;
 box.innerHTML='<div class="c30-auth"><header class="c30-topbar"><div class="c30-brand"><img src="'+LOGO+'" alt="CHAoui"><div><b>CHAoui PRO</b><span>eFootball Tournament Platform</span></div></div><button class="c30-owner-entry" id="c30AdminOpen" type="button">🛡️ دخول Admin</button></header><main class="c30-main"><section class="c30-intro"><span class="c30-kicker">⚡ TOURNAMENT FIRST</span><h1>سجل فـ <span>البطولة</span><br>وابدأ المنافسة.</h1><p>اختار البطولة، عمر معلوماتك، ومن بعد كمل المسار ديالك: تسجيل → مراجعة → مباراة → نتيجة → ترتيب.</p><div class="c30-proof"><div><b>🏆 بطولات</b><small>اختيار واضح وسريع</small></div><div><b>⚔️ مباريات</b><small>Match Room منظم</small></div><div><b>📈 ترتيب</b><small>Rating وPoints</small></div></div></section><section class="c30-card"><div class="c30-card-head"><div><h2>📝 لائحة التسجيل</h2><p>اختار البطولة وكمّل الطلب ديالك.</p></div><span class="c30-step">STEP 01</span></div><div id="c30Tours" class="c30-tours"></div><input id="c30TournamentId" type="hidden"><div class="c30-form"><div class="c30-field"><label>الاسم الكامل</label><input id="c30Name" placeholder="الاسم واللقب" autocomplete="name"></div><div class="c30-field"><label>eFootball name</label><input id="c30Efootball" placeholder="Chaoui_Pro"></div><div class="c30-field"><label>WhatsApp</label><input id="c30Whatsapp" placeholder="06XXXXXXXX" inputmode="tel"></div><div class="c30-field"><label>نوع التسجيل</label><select id="c30Type"><option value="free">Free</option><option value="premium">Premium</option></select></div><div class="c30-field"><label>الوقت المناسب</label><select id="c30Time"><option>20:00 - 22:00</option><option>22:00 - 00:00</option><option>18:00 - 20:00</option><option>مرن</option></select></div><div class="c30-field"><label>الاتصال</label><select id="c30Conn"><option value="wifi">WIFI</option><option value="conix">CONIX</option></select></div><div class="c30-field"><label>سبق شاركتي؟</label><select id="c30Prior"><option value="false">لا</option><option value="true">نعم</option></select></div><div class="c30-field"><label>الإيميل</label><input id="c30Email" type="email" placeholder="example@email.com"></div><div class="c30-field"><label>كلمة السر</label><input id="c30Password" type="password" placeholder="6 أحرف على الأقل" autocomplete="new-password"></div><label class="c30-check"><input id="c30Commit" type="checkbox"><span>كنأكد باللي نقدر نلتزم بالمواعيد ديال المباريات.</span></label><label class="c30-check"><input id="c30Rules" type="checkbox"><span>قريت قوانين البطولة وكنوافق عليها.</span></label></div><button id="c30Register" class="c30-primary" type="button">إنشاء الحساب والتسجيل 🏆</button><div id="c30AuthNote" class="c30-note"></div><div class="c30-entry"><button id="c30PlayerOpen" type="button">👤 دخول صفحتي</button><button id="c30AdminOpen2" class="gold" type="button">🛡️ دخول Admin</button></div><div id="c30PlayerLogin" class="c30-panel"><button class="c30-back" data-close="x" type="button">← رجوع</button><div class="c30-form"><div class="c30-field full"><label>الإيميل</label><input id="c30LoginEmail" type="email" autocomplete="email"></div><div class="c30-field full"><label>كلمة السر</label><input id="c30LoginPassword" type="password" autocomplete="current-password"></div></div><button id="c30PlayerLoginBtn" class="c30-primary" type="button">دخول صفحتي</button></div><div id="c30AdminLogin" class="c30-panel"><button class="c30-back" data-close="x" type="button">← رجوع</button><div class="c30-form"><div class="c30-field full"><label>إيميل Owner / Organizer</label><input id="c30AdminEmail" type="email" placeholder="chaoui@gmail.com"></div><div class="c30-field full"><label>كلمة السر</label><input id="c30AdminPassword" type="password" autocomplete="current-password"></div></div><button id="c30AdminLoginBtn" class="c30-primary" type="button">دخول Admin</button></div><div id="c30Recovery" class="c30-panel"><button class="c30-back" data-close="x" type="button">← رجوع</button><div class="c30-form"><div class="c30-field full"><label>إيميل الحساب</label><input id="c30RecoveryEmail" type="email"></div></div><button id="c30RecoveryBtn" class="c30-primary" type="button">إرسال رابط الاسترجاع</button></div></section></main><footer class="c30-footer">CHAoui PRO · eFootball Tournament Platform</footer></div>';
 loadOpenTournaments();
}
async function forgot(){
 const email=$("c30RecoveryEmail")?.value.trim().toLowerCase();if(!email)return note("دخل الإيميل ديالك.");
 const r=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+window.location.pathname});
 note(r.error?r.error.message:"تصيفط رابط الاسترجاع للإيميل ديالك ✅","success");
}
function setup(){
 if(ready||!$("authScreen"))return;ready=true;$("authScreen").classList.add("c30-auth-screen");shell();
 $("c30AdminOpen").onclick=()=>showPanel("admin");
 $("c30AdminOpen2").onclick=()=>showPanel("admin");
 $("c30PlayerOpen").onclick=()=>showPanel("player");
 $("c30Register").onclick=register;
 $("c30PlayerLoginBtn").onclick=()=>login("player");
 $("c30AdminLoginBtn").onclick=()=>login("admin");
 $("c30RecoveryBtn").onclick=forgot;
 document.querySelectorAll(".c30-back").forEach(b=>b.onclick=()=>showPanel(null));
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();