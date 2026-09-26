/* CHAoui Auth V14 — HappySeeds-inspired public tournament entry.
   Visual direction: black/gold, tournament-first, registration card, separate organizer gate.
   Existing Supabase auth/role checks are preserved.
*/
(()=>{"use strict";
let booted=false;
const $=id=>document.getElementById(id);

function css(){
 if($("authV14Style"))return;
 const s=document.createElement("style");s.id="authV14Style";
 s.textContent=`
#authScreen.auth-v14{position:fixed;inset:0;z-index:9999;display:block;overflow:auto;background:#070503;color:#eee;font-family:inherit}
#authScreen.auth-v14 .auth-box{width:100%;max-width:none;min-height:100%;margin:0;padding:0;background:#070503;border:0;border-radius:0;box-shadow:none;overflow:visible}
.auth-v14 .hs-top{height:72px;background:#090807;border-bottom:1px solid rgba(245,196,81,.18);display:flex;align-items:center;justify-content:space-between;padding:0 clamp(14px,4vw,70px);position:sticky;top:0;z-index:5}
.auth-v14 .hs-brand{display:flex;align-items:center;gap:11px}.auth-v14 .hs-brand img{width:42px;height:42px;object-fit:contain;border-radius:12px}.auth-v14 .hs-brand b{font-size:15px;color:#f5c451}.auth-v14 .hs-brand small{display:block;color:#8e8375;font-size:9px;margin-top:2px}
.auth-v14 .hs-nav{display:flex;align-items:center;gap:7px}.auth-v14 .hs-nav button{border:1px solid transparent;background:transparent;color:#b9b0a5;border-radius:999px;padding:9px 13px;font:inherit;font-size:11px;cursor:pointer}.auth-v14 .hs-nav button.active{background:rgba(245,196,81,.1);border-color:rgba(245,196,81,.35);color:#f5c451}
.auth-v14 .hs-organizer-top{border:1px solid #8e6b17;background:#0e0b06;color:#f5c451;border-radius:999px;padding:9px 14px;font-weight:900;font-size:10px;cursor:pointer}
.auth-v14 .hs-hero{max-width:900px;margin:0 auto;text-align:center;padding:42px 18px 30px}
.auth-v14 .hs-kicker{display:inline-flex;border:1px solid rgba(245,196,81,.35);background:rgba(245,196,81,.05);color:#f5c451;border-radius:999px;padding:7px 12px;font-size:9px;font-weight:900}
.auth-v14 .hs-hero-logo{width:118px;height:118px;margin:20px auto 14px;border:1px solid rgba(245,196,81,.45);border-radius:28px;padding:8px;background:#0a0805;box-shadow:0 0 55px rgba(245,196,81,.09)}.auth-v14 .hs-hero-logo img{width:100%;height:100%;object-fit:contain;border-radius:21px}
.auth-v14 .hs-hero h1{font-size:34px;margin:0;color:#fff;font-weight:950}.auth-v14 .hs-hero h1 span{color:#f5c451}.auth-v14 .hs-hero p{color:#9d9286;margin:9px 0 16px;font-size:13px}
.auth-v14 .hs-pills{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.auth-v14 .hs-pill{border:1px solid #3b2d17;background:#0d0a06;color:#cfc5b8;padding:9px 13px;border-radius:999px;font-size:10px}.auth-v14 .hs-pill b{color:#f5c451}
.auth-v14 .hs-section{max-width:900px;margin:0 auto;padding:0 18px 45px}.auth-v14 .hs-section-title{text-align:center;margin:10px 0 18px}.auth-v14 .hs-section-title h2{font-size:22px;margin:0;color:#fff}.auth-v14 .hs-section-title p{font-size:10px;color:#84796d;margin:5px 0}
.auth-v14 .hs-register{max-width:510px;margin:auto;background:#100c08;border:1px solid #4b3819;border-radius:22px;padding:24px;box-shadow:0 18px 55px rgba(0,0,0,.3)}
.auth-v14 .hs-register .hs-recheck{border:1px solid #3a2b17;background:#0b0906;color:#c4b8a8;border-radius:12px;padding:10px 12px;font-size:10px;margin-bottom:14px}
.auth-v14 .hs-label{display:block;color:#eee2d3;font-size:11px;font-weight:900;margin:14px 0 6px}.auth-v14 .hs-label:after{content:" *";color:#f5c451}
.auth-v14 .hs-input,.auth-v14 .hs-select{width:100%;box-sizing:border-box;background:#0b0906;border:1px solid #33271a;color:#f4eee6;border-radius:12px;padding:13px;outline:none;font:inherit}.auth-v14 .hs-input:focus,.auth-v14 .hs-select:focus{border-color:#f5c451;box-shadow:0 0 0 3px rgba(245,196,81,.08)}
.auth-v14 .hs-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.auth-v14 .hs-choice{display:grid;grid-template-columns:1fr 1fr;gap:9px}.auth-v14 .hs-choice button{border:1px solid #352918;background:#0b0906;color:#9d9184;border-radius:12px;padding:15px 8px;cursor:pointer;font-weight:900}.auth-v14 .hs-choice button.active{border-color:#f5c451;background:rgba(245,196,81,.12);color:#fff;box-shadow:inset 0 0 0 1px rgba(245,196,81,.18)}
.auth-v14 .hs-row-choice{display:grid;grid-template-columns:1fr 1fr;gap:9px}.auth-v14 .hs-row-choice button{border:1px solid #352918;background:#0b0906;color:#a89d90;border-radius:12px;padding:13px;cursor:pointer}.auth-v14 .hs-row-choice button.active{border-color:#f5c451;color:#fff;background:rgba(245,196,81,.12)}
.auth-v14 .hs-check{display:flex;gap:9px;align-items:flex-start;color:#b4a99c;font-size:10px;line-height:1.6;margin:13px 0}.auth-v14 .hs-check input{width:16px;height:16px;accent-color:#f5c451;flex:0 0 16px;margin:0}
.auth-v14 .hs-submit{width:100%;border:0;border-radius:13px;background:#ffc431;color:#100b04;padding:15px;font-weight:950;font-size:14px;cursor:pointer;box-shadow:0 10px 28px rgba(245,196,81,.13);margin-top:6px}.auth-v14 .hs-submit:disabled{opacity:.55;cursor:wait}
.auth-v14 .hs-login-link{width:100%;margin-top:12px;border:1px solid #8e6b17;background:#151006;color:#f5c451;border-radius:13px;padding:13px;font-weight:900;cursor:pointer}
.auth-v14 .hs-existing{display:none;border-top:1px solid #2c2115;margin-top:15px;padding-top:15px}.auth-v14 .hs-existing.open{display:block}
.auth-v14 .hs-organizer{max-width:510px;margin:22px auto 0;border:1px solid #4b3819;background:#0d0a06;border-radius:18px;padding:15px}.auth-v14 .hs-org-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.auth-v14 .hs-org-head b{color:#f5c451;font-size:12px}.auth-v14 .hs-org-head span{color:#766b60;font-size:9px}.auth-v14 .hs-org-toggle{border:1px solid #765914;background:transparent;color:#f5c451;border-radius:999px;padding:7px 11px;cursor:pointer;font-weight:900}.auth-v14 .hs-org-login{display:none;margin-top:12px}.auth-v14 .hs-org-login.open{display:block}
.auth-v14 .hs-message{text-align:center;min-height:20px;margin:10px 0;font-size:11px}.auth-v14 .hs-message.error{color:#ff6d75}.auth-v14 .hs-message.success{color:#4ee0a0}
.auth-v14 .hs-footer{border-top:1px solid rgba(245,196,81,.14);text-align:center;padding:26px 18px 45px;color:#756b60;font-size:10px}.auth-v14 .hs-footer b{color:#f5c451}.auth-v14 .hs-footer button{display:block;margin:12px auto 0;border:1px solid #f5c451;background:transparent;color:#f5c451;border-radius:999px;padding:10px 18px;font-weight:900;cursor:pointer}
@media(max-width:650px){.auth-v14 .hs-nav{display:none}.auth-v14 .hs-top{height:62px}.auth-v14 .hs-hero{padding-top:28px}.auth-v14 .hs-hero-logo{width:92px;height:92px;border-radius:22px}.auth-v14 .hs-hero h1{font-size:28px}.auth-v14 .hs-register{padding:18px}.auth-v14 .hs-two{grid-template-columns:1fr}.auth-v14 .hs-footer{padding-bottom:90px}}
`;
 document.head.appendChild(s);
}
function msg(t,type="info"){const x=$("authMessage");if(x){x.textContent=t;x.className="hs-message "+type}}
function slug(v){return String(v||"player").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,18)||"chaoui_player"}
function shell(){
 const box=document.querySelector("#authScreen .auth-box");if(!box)return;
 box.innerHTML=`
 <header class="hs-top">
  <div class="hs-brand"><img src="logo.png"><div><b>CHAoui PRO</b><small>eFootball 1VS1</small></div></div>
  <nav class="hs-nav"><button class="active" type="button">الرئيسية</button><button type="button" onclick="document.getElementById('hsRegistration').scrollIntoView({behavior:'smooth'})">البطولة</button><button type="button" onclick="document.getElementById('hsRegistration').scrollIntoView({behavior:'smooth'})">التسجيل</button><button type="button">المباريات</button></nav>
  <button id="v14OrgTop" class="hs-organizer-top" type="button">🛡️ لوحة المنظم</button>
 </header>
 <section class="hs-hero">
  <span class="hs-kicker">🔥 CHAOUI · eFootball Tournament</span>
  <div class="hs-hero-logo"><img src="logo.png"></div>
  <h1>بطولة <span>eFootball 1VS1</span></h1>
  <p>سجل مشاركتك بسهولة، ومن بعد تابع البطولة والمباريات من حسابك.</p>
  <div class="hs-pills"><span class="hs-pill"><b>⚡</b> تسجيل اللاعبين مفتوح</span><span class="hs-pill"><b>🏆</b> Free / Premium</span></div>
 </section>
 <section id="hsRegistration" class="hs-section">
  <div class="hs-section-title"><h2>سجل في البطولة</h2><p>عمر المعلومات المطلوبة باش نسجلوك فالقائمة.</p></div>
  <div class="hs-register">
   <div class="hs-recheck">هل سجلت سابقاً؟ <button id="v14PlayerLoginLink" class="hs-org-toggle" type="button">دخول صفحتي</button></div>
   <label class="hs-label">الاسم الكامل</label><input id="v13Name" class="hs-input" placeholder="الاسم واللقب">
   <label class="hs-label">اسم اللاعب داخل eFootball</label><input id="v13Efootball" class="hs-input" placeholder="اسمك داخل اللعبة">
   <label class="hs-label">رقم WhatsApp</label><input id="v13Whatsapp" class="hs-input" inputmode="tel" placeholder="06XXXXXXXX">
   <label class="hs-label">نوع المشاركة</label>
   <div class="hs-choice"><button type="button" data-type="free" class="active">🆓<br>FREE<br><small>مشاركة مجانية</small></button><button type="button" data-type="premium">💎<br>PREMIUM<br><small>DH 10</small></button></div>
   <div class="hs-two">
    <div><label class="hs-label">الوقت المناسب</label><select id="v13Time" class="hs-select"><option>20:00 - 22:00</option><option>22:00 - 00:00</option><option>18:00 - 20:00</option><option>مرن</option></select></div>
    <div><label class="hs-label">واش كتعلب ب</label><div class="hs-row-choice"><button type="button" data-conn="wifi" class="active">WIFI</button><button type="button" data-conn="conix">CONIX</button></div></div>
   </div>
   <label class="hs-check"><input id="v13Prior" type="checkbox"><span>هل سبق لك المشاركة في بطولاتنا؟</span></label>
   <label class="hs-check"><input id="v13Commit" type="checkbox"><span>هل يمكنك الالتزام بموعد المباراة المحدد؟</span></label>
   <label class="hs-check"><input id="v13Rules" type="checkbox"><span>أوافق على قوانين البطولة</span></label>
   <div style="border-top:1px solid #2c2115;margin-top:15px;padding-top:3px">
    <label class="hs-label">البريد الإلكتروني للحساب</label><input id="v13Email" class="hs-input" type="email" placeholder="example@email.com">
    <label class="hs-label">كلمة السر للحساب</label><input id="v13Password" class="hs-input" type="password" placeholder="6 أحرف على الأقل">
   </div>
   <button id="v13Register" class="hs-submit" type="button">سجل مشاركتي 🏆</button>
   <button id="v14PlayerLoginOpen" class="hs-login-link" type="button">👤 دخول صفحتي</button>
   <div id="v13PlayerLogin" class="hs-existing">
    <label class="hs-label">البريد الإلكتروني</label><input id="v13LoginEmail" class="hs-input" type="email" placeholder="example@email.com">
    <label class="hs-label">كلمة السر</label><input id="v13LoginPassword" class="hs-input" type="password" placeholder="كلمة السر">
    <button id="v13PlayerLoginBtn" class="hs-submit" type="button">دخول اللاعب</button>
    <button id="v13Reset" class="hs-org-toggle" type="button" style="margin-top:10px">نسيت كلمة السر؟</button>
   </div>
  </div>
  <div class="hs-organizer">
   <div class="hs-org-head"><b>🛡️ دخول المنظم</b><span>Owner / Organizer فقط</span><button id="v13OrgToggle" class="hs-org-toggle" type="button">دخول</button></div>
   <div id="v13OrgLogin" class="hs-org-login">
    <label class="hs-label">البريد الإلكتروني</label><input id="v13OrgEmail" class="hs-input" type="email" placeholder="chaoui@gmail.com">
    <label class="hs-label">الكود / كلمة السر</label><input id="v13OrgPassword" class="hs-input" type="password" placeholder="الكود ديالك">
    <button id="v13OrgLoginBtn" class="hs-submit" type="button">دخول لوحة المنظم 🏆</button>
   </div>
  </div>
  <div id="authMessage" class="hs-message"></div>
 </section>
 <footer class="hs-footer">بطولة eFootball 1VS1 · <b>CHAoui PRO</b><button id="v14OrgFooter" type="button">دخول لوحة المنظم 🛡️</button></footer>`;
}
async function finishSignup(){
 const name=$("v13Name")?.value.trim(),ef=$("v13Efootball")?.value.trim(),wa=$("v13Whatsapp")?.value.trim(),email=$("v13Email")?.value.trim().toLowerCase(),pass=$("v13Password")?.value;
 const type=document.querySelector(".hs-choice button.active")?.dataset.type||"free",time=$("v13Time")?.value,conn=document.querySelector(".hs-row-choice button.active")?.dataset.conn||"wifi";
 if(!name||!ef||!wa||!email||!pass)return msg("عمر الاسم، اسم eFootball، WhatsApp، الإيميل وكلمة السر.","error");
 if(pass.length<6)return msg("كلمة السر خاصها 6 أحرف على الأقل.","error");
 if(!$("v13Commit")?.checked||!$("v13Rules")?.checked)return msg("خاصك تأكد الالتزام وتقبل قوانين البطولة.","error");
 const b=$("v13Register");b.disabled=true;b.textContent="جاري التسجيل...";
 try{
  const username=slug(ef)+"_"+Math.random().toString(36).slice(2,6);
  const meta={username,display_name:name,efootball_name:ef,whatsapp:wa,registration_type:type,preferred_time:time,connection_type:conn,prior_participation:$("v13Prior").checked,commitment_confirmed:true,rules_accepted:true};
  const {data,error}=await supabaseClient.auth.signUp({email,password:pass,options:{data:meta}});if(error)throw error;if(!data?.user)throw new Error("ما قدرناش ننشئو الحساب.");
  currentUser=data.user;
  if(data.session){await supabaseClient.from("profiles").update({display_name:name,efootball_name:ef,username}).eq("id",data.user.id);await supabaseClient.from("player_private").upsert({id:data.user.id,whatsapp:wa});await loadProfile();if(!currentProfile)throw new Error("الحساب تخلق ولكن البروفايل ما تحمّلش.");showApp();showPage("profile");showToast("مرحبا بك فـ CHAOUI 🔥")}
  else{msg("تسجل الحساب بنجاح ✅ أكد الإيميل ديالك، ومن بعد دخل من «دخول صفحتي».","success");$("v13PlayerLogin")?.classList.add("open");$("v13LoginEmail").value=email;$("v13LoginPassword").value=pass}
 }catch(e){console.error(e);msg(String(e?.message||e||"تعذر التسجيل."),"error")}finally{b.disabled=false;b.textContent="سجل مشاركتي 🏆"}
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
 document.querySelectorAll(".hs-choice button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".hs-choice button").forEach(x=>x.classList.remove("active"));b.classList.add("active")});
 document.querySelectorAll(".hs-row-choice button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".hs-row-choice button").forEach(x=>x.classList.remove("active"));b.classList.add("active")});
 const open=()=>{$("v13PlayerLogin")?.classList.toggle("open")};
 $("v14PlayerLoginLink").onclick=open;$("v14PlayerLoginOpen").onclick=open;
 const org=()=>{$("v13OrgLogin")?.classList.toggle("open")};$("v13OrgToggle").onclick=org;$("v14OrgTop").onclick=org;$("v14OrgFooter").onclick=org;
 $("v13Register").onclick=finishSignup;$("v13PlayerLoginBtn").onclick=()=>doLogin("player");$("v13OrgLoginBtn").onclick=()=>doLogin("org");
 $("v13Reset").onclick=async()=>{const email=$("v13LoginEmail")?.value.trim().toLowerCase();if(!email)return msg("دخل الإيميل ديالك الأول.","error");const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+window.location.pathname});msg(error?error.message:"تصيفط رابط تغيير كلمة السر للإيميل ديالك 📩",error?"error":"success")}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0),{once:true});else setTimeout(setup,0);
})();