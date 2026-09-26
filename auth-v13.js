/* CHAoui Auth V14 — HappySeeds-inspired public tournament entry.
   Visual direction: black/gold, tournament-first, registration card, separate organizer gate.
   Existing Supabase auth/role checks are preserved.
*/
(()=>{"use strict";
let booted=false;
const $=id=>document.getElementById(id);

function css(){
 if($("authV20Style"))return;
 const s=document.createElement("style");s.id="authV20Style";
 s.textContent=`
#authScreen.auth-v14{position:fixed;inset:0;z-index:9999;display:block;overflow:auto;background:#050505;color:#eee}
#authScreen.auth-v14 .auth-box{width:100%;min-height:100%;margin:0;padding:0;background:#050505;border:0;overflow:visible}
.auth-v14 .v20-wrap{min-height:100dvh;display:flex;flex-direction:column}
.auth-v14 .v20-top{height:62px;padding:0 18px;border-bottom:1px solid rgba(245,196,81,.18);display:flex;align-items:center;justify-content:space-between;background:#080808}
.auth-v14 .v20-brand{display:flex;align-items:center;gap:9px}.auth-v14 .v20-brand img{width:38px;height:38px;object-fit:contain}.auth-v14 .v20-brand b{color:#f5c451;font-size:14px}.auth-v14 .v20-brand small{display:block;color:#777;font-size:8px}
.auth-v14 .v20-content{width:min(940px,100%);margin:auto;padding:30px 16px 45px}
.auth-v14 .v20-hero{text-align:center;margin-bottom:24px}.auth-v14 .v20-logo{width:76px;height:76px;margin:0 auto 12px;border:1px solid #6b511d;border-radius:22px;padding:7px;background:#0c0a07}.auth-v14 .v20-logo img{width:100%;height:100%;object-fit:contain}
.auth-v14 .v20-hero h1{font-size:27px;margin:0}.auth-v14 .v20-hero h1 span{color:#f5c451}.auth-v14 .v20-hero p{color:#8e867c;font-size:11px;margin:7px 0}
.auth-v14 .v20-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:650px;margin:auto}
.auth-v14 .v20-card{border:1px solid #352b1d;background:linear-gradient(145deg,#100e0b,#090909);border-radius:18px;padding:20px;text-align:right;color:#fff;cursor:pointer;min-height:145px;transition:.18s}
.auth-v14 .v20-card:hover{border-color:#b38a31;transform:translateY(-2px)}.auth-v14 .v20-card .ico{font-size:27px;margin-bottom:12px}.auth-v14 .v20-card b{display:block;font-size:15px}.auth-v14 .v20-card small{display:block;color:#888078;font-size:10px;margin-top:6px;line-height:1.6}.auth-v14 .v20-card.gold{border-color:#72581f}.auth-v14 .v20-card.gold b{color:#f5c451}
.auth-v14 .v20-panel{display:none;max-width:520px;margin:18px auto 0;border:1px solid #40321e;background:#0c0a08;border-radius:18px;padding:18px}.auth-v14 .v20-panel.open{display:block}
.auth-v14 .v20-panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:13px}.auth-v14 .v20-panel-head h2{margin:0;font-size:17px}.auth-v14 .v20-close{border:1px solid #3a3022;background:#111;color:#aaa;border-radius:9px;padding:7px 10px;cursor:pointer}
.auth-v14 .v20-label{display:block;color:#ddd;font-size:10px;font-weight:900;margin:11px 0 5px}.auth-v14 .v20-input{width:100%;box-sizing:border-box;background:#070707;border:1px solid #30281d;color:#fff;border-radius:10px;padding:12px;font:inherit}.auth-v14 .v20-input:focus{border-color:#f5c451;outline:none}
.auth-v14 .v20-submit{width:100%;border:0;background:#f5c451;color:#080604;border-radius:11px;padding:13px;font-weight:950;margin-top:13px;cursor:pointer}.auth-v14 .v20-link{width:100%;border:1px solid #5c471d;background:transparent;color:#f5c451;border-radius:10px;padding:11px;margin-top:8px;cursor:pointer;font-weight:900}
.auth-v14 .v20-register{display:none}.auth-v14 .v20-register.open{display:block}.auth-v14 .v20-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:12px}.auth-v14 .v20-steps b{font-size:9px;color:#857b70;text-align:center;padding:7px;border:1px solid #28231c;border-radius:8px}.auth-v14 .v20-steps b.active{background:#f5c451;color:#080604;border-color:#f5c451}
.auth-v14 .v20-msg{text-align:center;min-height:18px;color:#ff737b;font-size:10px;margin-top:10px}
.auth-v14 .v20-footer{text-align:center;color:#665f57;font-size:9px;padding:15px;border-top:1px solid #171411}
@media(max-width:650px){.auth-v14 .v20-content{padding:24px 12px 30px}.auth-v14 .v20-actions{grid-template-columns:1fr}.auth-v14 .v20-card{min-height:0;padding:17px}.auth-v14 .v20-hero h1{font-size:24px}}
`;
 document.head.appendChild(s);
}
function msg(t,type="info"){const x=$("authMessage");if(x){x.textContent=t;x.className="hs-message "+type}}
function slug(v){return String(v||"player").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,18)||"chaoui_player"}
function shell(){
 const box=document.querySelector("#authScreen .auth-box");if(!box)return;
 box.innerHTML=`
 <div class="v20-wrap">
  <header class="v20-top"><div class="v20-brand"><img src="logo.png"><div><b>CHAoui PRO</b><small>eFootball 1VS1</small></div></div><span style="color:#6e675f;font-size:9px">TOURNAMENT PLATFORM</span></header>
  <main class="v20-content">
   <section class="v20-hero"><div class="v20-logo"><img src="logo.png"></div><h1>CHAoui <span>PRO</span></h1><p>اختار كيفاش بغيتي تدخل للمنصة.</p></section>
   <section class="v20-actions">
    <button class="v20-card" id="v20PlayerLogin" type="button"><div class="ico">👤</div><b>دخول اللاعب</b><small>دخل للحساب ديالك وتابع البطولات، المباريات والترتيب.</small></button>
    <button class="v20-card gold" id="v20PlayerRegister" type="button"><div class="ico">🏆</div><b>إنشاء حساب / التسجيل</b><small>جديد هنا؟ أنشئ حسابك وسجل مشاركتك فالبطولة.</small></button>
    <button class="v20-card gold" id="v20OrganizerLogin" type="button"><div class="ico">🛡️</div><b>دخول المنظم / Owner</b><small>لوحة خاصة بصاحب المنصة والمنظمين المصرح لهم فقط.</small></button>
    <button class="v20-card" id="v20Forgot" type="button"><div class="ico">🔐</div><b>نسيت كلمة السر؟</b><small>استرجع الوصول للحساب ديالك بالإيميل.</small></button>
   </section>
   <section class="v20-panel" id="v20PlayerPanel">
    <div class="v20-panel-head"><h2>👤 دخول اللاعب</h2><button class="v20-close" data-close="v20PlayerPanel">رجوع</button></div>
    <label class="v20-label">البريد الإلكتروني</label><input id="v13LoginEmail" class="v20-input" type="email" placeholder="example@email.com">
    <label class="v20-label">كلمة السر</label><input id="v13LoginPassword" class="v20-input" type="password" placeholder="كلمة السر">
    <button id="v13PlayerLoginBtn" class="v20-submit" type="button">دخول اللاعب</button>
    <button id="v20GoRegister" class="v20-link" type="button">ما عنديش حساب — إنشاء حساب</button>
   </section>
   <section class="v20-panel" id="v20OrgPanel">
    <div class="v20-panel-head"><h2>🛡️ دخول المنظم / Owner</h2><button class="v20-close" data-close="v20OrgPanel">رجوع</button></div>
    <label class="v20-label">البريد الإلكتروني</label><input id="v13OrgEmail" class="v20-input" type="email" placeholder="chaoui@gmail.com">
    <label class="v20-label">الكود / كلمة السر</label><input id="v13OrgPassword" class="v20-input" type="password" placeholder="الكود ديالك">
    <button id="v13OrgLoginBtn" class="v20-submit" type="button">دخول لوحة المنظم 🏆</button>
   </section>
   <section class="v20-panel" id="v20RegisterPanel">
    <div class="v20-panel-head"><h2>🏆 إنشاء حساب</h2><button class="v20-close" data-close="v20RegisterPanel">رجوع</button></div>
    <div class="v20-steps"><b class="active">1 المعلومات</b><b>2 المشاركة</b><b>3 القوانين</b><b>4 الحساب</b></div>
    <div class="v20-register" id="v20RegisterFields">
     <label class="v20-label">الاسم الكامل</label><input id="v13Name" class="v20-input" placeholder="الاسم واللقب">
     <label class="v20-label">اسم اللاعب داخل eFootball</label><input id="v13Efootball" class="v20-input" placeholder="اسمك داخل اللعبة">
     <label class="v20-label">رقم WhatsApp</label><input id="v13Whatsapp" class="v20-input" inputmode="tel" placeholder="06XXXXXXXX">
     <label class="v20-label">الوقت المناسب</label><select id="v13Time" class="v20-input"><option>20:00 - 22:00</option><option>22:00 - 00:00</option><option>18:00 - 20:00</option><option>مرن</option></select>
     <label class="v20-label">نوع المشاركة</label><select id="v20Type" class="v20-input"><option value="free">FREE — مجانية</option><option value="premium">PREMIUM — DH 10</option></select>
     <label class="v20-label">الاتصال</label><select id="v20Conn" class="v20-input"><option value="wifi">WIFI</option><option value="conix">CONIX</option></select>
     <label class="v20-label"><input id="v13Prior" type="checkbox"> سبق لي المشاركة</label>
     <label class="v20-label"><input id="v13Commit" type="checkbox"> ملتزم بموعد المباراة</label>
     <label class="v20-label"><input id="v13Rules" type="checkbox"> أوافق على قوانين البطولة</label>
     <label class="v20-label">البريد الإلكتروني</label><input id="v13Email" class="v20-input" type="email" placeholder="example@email.com">
     <label class="v20-label">كلمة السر</label><input id="v13Password" class="v20-input" type="password" placeholder="6 أحرف على الأقل">
     <button id="v13Register" class="v20-submit" type="button">إنشاء الحساب والتسجيل 🏆</button>
    </div>
   </section>
   <div id="authMessage" class="v20-msg"></div>
  </main>
  <footer class="v20-footer">CHAoui PRO · eFootball 1VS1</footer>
 </div>`;
}
async function finishSignup(){
 const name=$("v13Name")?.value.trim(),ef=$("v13Efootball")?.value.trim(),wa=$("v13Whatsapp")?.value.trim(),email=$("v13Email")?.value.trim().toLowerCase(),pass=$("v13Password")?.value;
 const type=$("v20Type")?.value||"free",time=$("v13Time")?.value,conn=$("v20Conn")?.value||"wifi";
 if(!name||!ef||!wa||!email||!pass)return msg("عمر المعلومات المطلوبة كاملة.","error");
 if(pass.length<6)return msg("كلمة السر خاصها 6 أحرف على الأقل.","error");
 if(!$("v13Commit")?.checked||!$("v13Rules")?.checked)return msg("خاصك تأكد الالتزام وتقبل القوانين.","error");
 const b=$("v13Register");b.disabled=true;b.textContent="جاري إنشاء الحساب...";
 try{const username=slug(ef)+"_"+Math.random().toString(36).slice(2,6);const meta={username,display_name:name,efootball_name:ef,whatsapp:wa,registration_type:type,preferred_time:time,connection_type:conn,prior_participation:$("v13Prior").checked,commitment_confirmed:true,rules_accepted:true};const {data,error}=await supabaseClient.auth.signUp({email,password:pass,options:{data:meta}});if(error)throw error;if(!data?.user)throw new Error("ما قدرناش ننشئو الحساب.");currentUser=data.user;
 if(data.session){await supabaseClient.from("profiles").update({display_name:name,efootball_name:ef,username}).eq("id",data.user.id);await supabaseClient.from("player_private").upsert({id:data.user.id,whatsapp:wa});await loadProfile();if(!currentProfile)throw new Error("البروفايل ما تحمّلش.");showApp();showPage("home");showToast("مرحبا بك فـ CHAOUI 🔥")}
 else msg("الحساب تخلق بنجاح ✅ أكد الإيميل ديالك، ومن بعد دخل من «دخول اللاعب».","success");
 }catch(e){console.error(e);msg(String(e?.message||e||"تعذر التسجيل."),"error")}finally{b.disabled=false;b.textContent="إنشاء الحساب والتسجيل 🏆"}
}
async function doLogin(kind){
 const email=$(kind==="org"?"v13OrgEmail":"v13LoginEmail")?.value.trim().toLowerCase(),pass=$(kind==="org"?"v13OrgPassword":"v13LoginPassword")?.value;
 if(!email||!pass)return msg("دخل الإيميل والكود/كلمة السر.","error");
 const b=$(kind==="org"?"v13OrgLoginBtn":"v13PlayerLoginBtn");b.disabled=true;b.textContent="جاري الدخول...";
 try{const {data,error}=await supabaseClient.auth.signInWithPassword({email,password:pass});if(error)throw error;currentUser=data.user;const profile=await loadProfile();if(!profile)throw new Error("البروفايل ما لقايناهش.");
 if(kind==="org"&&!["owner","organizer"].includes(profile.role)){await supabaseClient.auth.signOut();currentUser=null;currentProfile=null;throw new Error("هاد الحساب ما عندوش صلاحية Owner أو Organizer.")}
 showApp();if(kind==="org"){showPage("organizer");setTimeout(()=>window.renderOrganizerV11?.(),60)}else showPage("home");showToast(kind==="org"?"مرحبا بالمنظم 🏆":"مرحبا بك فـ CHAOUI 🔥")
 }catch(e){console.error(e);msg(String(e?.message||"تعذر تسجيل الدخول."),"error")}finally{b.disabled=false;b.textContent=kind==="org"?"دخول لوحة المنظم 🏆":"دخول اللاعب"}
}
function setup(){
 if(booted)return;if(!$("authScreen")||!$("authScreen").querySelector(".auth-box"))return;booted=true;css();$("authScreen").classList.add("auth-v14");shell();
 const closeAll=()=>document.querySelectorAll(".v20-panel").forEach(x=>x.classList.remove("open"));
 const open=id=>{closeAll();$(id)?.classList.add("open");$(id)?.scrollIntoView({behavior:"smooth",block:"center"});};
 $("v20PlayerLogin").onclick=()=>open("v20PlayerPanel");$("v20OrganizerLogin").onclick=()=>open("v20OrgPanel");$("v20PlayerRegister").onclick=()=>open("v20RegisterPanel");$("v20Forgot").onclick=async()=>{const email=prompt("دخل الإيميل ديالك:");if(!email)return;const {error}=await supabaseClient.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:window.location.origin+window.location.pathname});msg(error?error.message:"تصيفط رابط تغيير كلمة السر للإيميل ديالك 📩",error?"error":"success")};
 $("v20GoRegister").onclick=()=>open("v20RegisterPanel");document.querySelectorAll("[data-close]").forEach(b=>b.onclick=closeAll);
 $("v13Register").onclick=finishSignup;$("v13PlayerLoginBtn").onclick=()=>doLogin("player");$("v13OrgLoginBtn").onclick=()=>doLogin("org");
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0),{once:true});else setTimeout(setup,0);
})();