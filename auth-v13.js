/* CHAoui Auth / Registration V13
   Player registration first. Organizer login is isolated below it.
   Uses Supabase email/password auth; never grants organizer/owner role from the client.
*/
(()=>{"use strict";
let booted=false;
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

function css(){
 if($("authV13Style"))return;
 const s=document.createElement("style");s.id="authV13Style";
 s.textContent=`
#authScreen.auth-v13{background:radial-gradient(circle at 50% 8%,rgba(22,140,255,.13),transparent 34%),linear-gradient(180deg,#061321 0%,#030a12 100%);align-items:flex-start;overflow:auto;padding:28px 14px 42px}
.auth-v13 .auth-box{width:min(560px,100%);margin:auto;background:linear-gradient(145deg,rgba(9,25,41,.98),rgba(3,12,21,.98));border:1px solid rgba(54,199,255,.2);border-radius:28px;padding:28px;box-shadow:0 30px 100px rgba(0,0,0,.42);position:relative;overflow:hidden}
.auth-v13 .auth-box:before{content:"";position:absolute;inset:-80px -80px auto auto;width:220px;height:220px;background:radial-gradient(circle,rgba(22,140,255,.18),transparent 70%);pointer-events:none}
.auth-v13 .auth-brand{position:relative;text-align:center;margin-bottom:22px}
.auth-v13 .auth-logo{width:78px;height:78px;margin:0 auto 12px;border-radius:22px;background:#030b15;border:1px solid rgba(54,199,255,.45);box-shadow:0 0 30px rgba(22,140,255,.18);padding:6px}
.auth-v13 .auth-logo img{width:100%;height:100%;object-fit:contain;border-radius:17px}
.auth-v13 .auth-brand h1{font-size:29px;letter-spacing:3px;margin:0;color:#f4f8ff}
.auth-v13 .auth-brand p{margin:5px 0 0;color:#7f9bb5;font-size:11px}
.auth-v13 .auth-v13-kicker{display:inline-flex;gap:6px;align-items:center;color:#36c7ff;font-size:9px;font-weight:900;letter-spacing:1.4px;border:1px solid rgba(54,199,255,.18);background:rgba(22,140,255,.05);padding:7px 10px;border-radius:999px;margin-bottom:10px}
.auth-v13 .auth-title h2{margin:0;font-size:22px;color:#eef5ff}
.auth-v13 .auth-title p{margin:5px 0 16px;color:#7d93a9;font-size:11px}
.auth-v13 .auth-form label{display:block;color:#9fb1c3;font-size:10px;font-weight:800;margin:10px 0 5px}
.auth-v13 .auth-form input,.auth-v13 .auth-form select{width:100%;box-sizing:border-box;background:#040e18;border:1px solid #1b344c;color:#edf5ff;border-radius:12px;padding:12px 13px;outline:none;font:inherit;transition:.18s}
.auth-v13 .auth-form input:focus,.auth-v13 .auth-form select:focus{border-color:#168cff;box-shadow:0 0 0 3px rgba(22,140,255,.1)}
.auth-v13 .auth-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}
.auth-v13 .auth-choice{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px}
.auth-v13 .auth-choice button{border:1px solid #203a53;background:#081522;color:#a9bacb;border-radius:11px;padding:11px;font-weight:800;cursor:pointer}
.auth-v13 .auth-choice button.active{border-color:#168cff;background:rgba(22,140,255,.12);color:#fff;box-shadow:inset 0 0 0 1px rgba(54,199,255,.18)}
.auth-v13 .auth-check{display:flex!important;align-items:flex-start;gap:8px;line-height:1.5;margin:11px 0 0!important;color:#91a5b8!important}
.auth-v13 .auth-check input{width:16px!important;height:16px;flex:0 0 16px;margin-top:1px;accent-color:#168cff}
.auth-v13 .auth-main-btn{width:100%;margin-top:16px;border:0;border-radius:13px;padding:13px;background:linear-gradient(135deg,#168cff,#20c5ef);color:#03101c;font-weight:950;font-size:14px;box-shadow:0 12px 30px rgba(22,140,255,.2);cursor:pointer}
.auth-v13 .auth-main-btn:disabled{opacity:.55;cursor:wait}
.auth-v13 .auth-message{min-height:18px;margin-top:10px;text-align:center;font-size:11px}
.auth-v13 .auth-message.error{color:#ff7186}.auth-v13 .auth-message.success{color:#43df9a}
.auth-v13 .auth-switch-row{text-align:center;margin:14px 0 0;color:#72889e;font-size:11px}
.auth-v13 .auth-link{border:0;background:none;color:#36c7ff;font-weight:900;cursor:pointer;padding:0}
.auth-v13 .auth-divider{display:flex;align-items:center;gap:10px;color:#526a80;font-size:9px;margin:22px 0 12px}
.auth-v13 .auth-divider:before,.auth-v13 .auth-divider:after{content:"";height:1px;background:#183047;flex:1}
.auth-v13 .organizer-gate{border:1px solid rgba(245,196,81,.2);background:linear-gradient(145deg,rgba(245,196,81,.05),rgba(8,17,27,.9));border-radius:17px;padding:15px}
.auth-v13 .organizer-gate-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.auth-v13 .organizer-gate-head b{color:#f5c451;font-size:12px}.auth-v13 .organizer-gate-head span{font-size:9px;color:#778da2}
.auth-v13 .organizer-login{display:none;margin-top:10px}.auth-v13 .organizer-login.open{display:block}
.auth-v13 .organizer-login .auth-main-btn{background:linear-gradient(135deg,#f5c451,#ffdf78);box-shadow:0 10px 26px rgba(245,196,81,.14)}
.auth-v13 .auth-existing{display:none}
.auth-v13 .auth-existing.open{display:block}
.auth-v13 .auth-note{text-align:center;color:#647b91;font-size:9px;margin-top:13px;line-height:1.7}
@media(max-width:520px){#authScreen.auth-v13{padding:12px 8px 28px}.auth-v13 .auth-box{padding:20px 15px;border-radius:22px}.auth-v13 .auth-grid{grid-template-columns:1fr}.auth-v13 .auth-brand{margin-bottom:17px}.auth-v13 .auth-logo{width:68px;height:68px}.auth-v13 .auth-brand h1{font-size:25px}}
`;
 document.head.appendChild(s);
}

function msg(text,type="info"){
 const box=$("authMessage");if(!box)return;
 box.textContent=text;box.className="auth-message "+type;
}

function slug(v){
 const x=String(v||"player").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,18);
 return x||"chaoui_player";
}

function shell(){
 const box=document.querySelector("#authScreen .auth-box");if(!box)return;
 box.innerHTML=`
 <div class="auth-brand">
   <div class="auth-logo"><img src="logo.png" alt="CHAoui-Pro"></div>
   <div class="auth-v13-kicker">⚡ CHAoui PRO · eFootball</div>
   <h1>CHAOUI</h1><p>eFootball Tournament Platform</p>
 </div>
 <div id="playerRegistration" class="auth-form">
   <div class="auth-title"><h2>لائحة التسجيل 🏆</h2><p>عمر المعلومات ديالك، ومن بعد التسجيل غادي تدخل مباشرة لصفحة اللاعب ديالك.</p></div>
   <div class="auth-grid">
     <div><label>الاسم الكامل</label><input id="v13Name" placeholder="مثال: مبارك شعوي" autocomplete="name"></div>
     <div><label>اسم eFootball</label><input id="v13Efootball" placeholder="مثال: CHAoui" autocomplete="nickname"></div>
   </div>
   <div class="auth-grid">
     <div><label>WhatsApp</label><input id="v13Whatsapp" inputmode="tel" placeholder="06XXXXXXXX"></div>
     <div><label>نوع المشاركة</label><div class="auth-choice"><button type="button" data-type="free" class="active">🆓 Free</button><button type="button" data-type="premium">💎 Premium</button></div></div>
   </div>
   <div class="auth-grid">
     <div><label>الوقت المناسب</label><select id="v13Time"><option>20:00 - 22:00</option><option>22:00 - 00:00</option><option>18:00 - 20:00</option><option>مرن</option></select></div>
     <div><label>الكونيكسيون</label><select id="v13Conn"><option value="wifi">WiFi</option><option value="conix">Conix</option></select></div>
   </div>
   <label class="auth-check"><input id="v13Prior" type="checkbox"> <span>سبق ليا شاركت فبطولات ديال eFootball.</span></label>
   <label class="auth-check"><input id="v13Commit" type="checkbox"> <span>كنأكد باللي نقدر نلتازم بالمباريات ديالي.</span></label>
   <label class="auth-check"><input id="v13Rules" type="checkbox"> <span>قريت وقبلت قوانين CHAOUI.</span></label>
   <div class="auth-grid">
     <div><label>البريد الإلكتروني</label><input id="v13Email" type="email" placeholder="example@email.com" autocomplete="email"></div>
     <div><label>كلمة السر</label><input id="v13Password" type="password" placeholder="6 أحرف على الأقل" autocomplete="new-password"></div>
   </div>
   <button id="v13Register" class="auth-main-btn" type="button">تسجيل الدخول لـ CHAOUI 🚀</button>
   <div class="auth-switch-row">عندك حساب من قبل؟ <button id="v13PlayerLoginLink" class="auth-link" type="button">دخول اللاعب</button></div>
   <div id="v13PlayerLogin" class="auth-existing">
     <label>البريد الإلكتروني</label><input id="v13LoginEmail" type="email" placeholder="example@email.com" autocomplete="email">
     <label>كلمة السر</label><input id="v13LoginPassword" type="password" placeholder="كلمة السر" autocomplete="current-password">
     <button id="v13PlayerLoginBtn" class="auth-main-btn" type="button">دخول اللاعب</button>
     <button id="v13Reset" class="auth-link" type="button" style="display:block;margin:10px auto 0">نسيت كلمة السر؟</button>
   </div>
 </div>
 <div class="auth-divider"><span>صلاحية خاصة</span></div>
 <section class="organizer-gate">
   <div class="organizer-gate-head"><b>🛡️ دخول المنظم</b><span>Owner / Organizer</span><button id="v13OrgToggle" class="auth-link" type="button">فتح</button></div>
   <div id="v13OrgLogin" class="organizer-login">
     <label>البريد الإلكتروني</label><input id="v13OrgEmail" type="email" placeholder="organizer@email.com" autocomplete="username">
     <label>الكود / كلمة السر</label><input id="v13OrgPassword" type="password" placeholder="الكود ديالك" autocomplete="current-password">
     <button id="v13OrgLoginBtn" class="auth-main-btn" type="button">دخول لوحة المنظم 🏆</button>
   </div>
 </section>
 <div id="authMessage" class="auth-message"></div>
 <div class="auth-note">الدخول للمنظم ما كيعطيش الصلاحية لأي حساب عادي؛ الدور كيتحدد من بروفايل CHAoui.</div>
 `;
}

async function finishSignup(){
 const name=$("v13Name")?.value.trim(), ef=$("v13Efootball")?.value.trim(), wa=$("v13Whatsapp")?.value.trim();
 const email=$("v13Email")?.value.trim().toLowerCase(), pass=$("v13Password")?.value;
 const type=document.querySelector(".auth-choice button.active")?.dataset.type||"free";
 const time=$("v13Time")?.value, conn=$("v13Conn")?.value;
 if(!name||!ef||!wa||!email||!pass)return msg("عمر الاسم، eFootball، WhatsApp، الإيميل وكلمة السر.","error");
 if(!/^\S+@\S+\.\S+$/.test(email))return msg("دخل إيميل صحيح.","error");
 if(pass.length<6)return msg("كلمة السر خاصها تكون 6 أحرف على الأقل.","error");
 if(!$("v13Commit")?.checked||!$("v13Rules")?.checked)return msg("خاصك تأكد الالتزام وتقبل القوانين.","error");
 const btn=$("v13Register");btn.disabled=true;btn.textContent="جاري إنشاء الحساب...";
 const username=slug(ef)+"_"+Math.random().toString(36).slice(2,6);
 try{
   const meta={username,display_name:name,efootball_name:ef,whatsapp:wa,registration_type:type,preferred_time:time,connection_type:conn,prior_participation:$("v13Prior").checked,commitment_confirmed:true,rules_accepted:true};
   const {data,error}=await supabaseClient.auth.signUp({email,password:pass,options:{data:meta}});
   if(error)throw error;
   if(!data?.user)throw new Error("ما قدرناش ننشئو الحساب.");
   if(data.session){
     currentUser=data.user;
     await supabaseClient.from("profiles").update({display_name:name,efootball_name:ef,username}).eq("id",data.user.id);
     await supabaseClient.from("player_private").upsert({id:data.user.id,whatsapp:wa});
     await loadProfile();
     if(!currentProfile)throw new Error("الحساب تخلق ولكن البروفايل ما تحمّلش.");
     showApp();
     showPage("profile");
     showToast("مرحبا بك فـ CHAOUI 🔥");
   }else{
     msg("تسجل الحساب بنجاح ✅ أكد الإيميل ديالك، ومن بعد دخل بحسابك.","success");
     $("v13PlayerLogin")?.classList.add("open");
     $("v13LoginEmail").value=email;
     $("v13LoginPassword").value=pass;
   }
 }catch(e){
   console.error(e);
   const raw=String(e?.message||e||"");
   msg(raw.toLowerCase().includes("already")?"هاد الإيميل مستعمل من قبل. استعمل دخول اللاعب.":raw,"error");
 }finally{btn.disabled=false;btn.textContent="تسجيل الدخول لـ CHAOUI 🚀";}
}

async function doLogin(kind){
 const email=$(kind==="org"?"v13OrgEmail":"v13LoginEmail")?.value.trim().toLowerCase();
 const pass=$(kind==="org"?"v13OrgPassword":"v13LoginPassword")?.value;
 if(!email||!pass)return msg("دخل الإيميل وكلمة السر.","error");
 const btn=$(kind==="org"?"v13OrgLoginBtn":"v13PlayerLoginBtn");btn.disabled=true;btn.textContent="جاري الدخول...";
 try{
   const {data,error}=await supabaseClient.auth.signInWithPassword({email,password:pass});
   if(error)throw error;
   currentUser=data.user;
   const profile=await loadProfile();
   if(!profile)throw new Error("دخلتي للحساب ولكن البروفايل ما لقايناهش.");
   if(kind==="org"&&!["owner","organizer"].includes(profile.role)){
     await supabaseClient.auth.signOut();currentUser=null;currentProfile=null;
     throw new Error("هاد الحساب ما عندوش صلاحية Owner أو Organizer.");
   }
   showApp();
   if(kind==="org"){showPage("organizer");setTimeout(()=>window.renderOrganizerV11?.(),60)}
   else showPage("home");
   showToast(kind==="org"?"مرحبا بالمنظم 🏆":"مرحبا بك فـ CHAOUI 🔥");
 }catch(e){
   console.error(e);msg(String(e?.message||"تعذر تسجيل الدخول."),"error");
 }finally{btn.disabled=false;btn.textContent=kind==="org"?"دخول لوحة المنظم 🏆":"دخول اللاعب";}
}

function setup(){
 if(booted)return;
 if(!$("authScreen")||!$("authScreen").querySelector(".auth-box"))return;
 booted=true;css();$("authScreen").classList.add("auth-v13");shell();
 document.querySelectorAll(".auth-choice button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".auth-choice button").forEach(x=>x.classList.remove("active"));b.classList.add("active")});
 $("v13Register").onclick=finishSignup;
 $("v13PlayerLoginLink").onclick=()=>{$("v13PlayerLogin")?.classList.toggle("open")};
 $("v13OrgToggle").onclick=()=>{const x=$("v13OrgLogin");x.classList.toggle("open");$("v13OrgToggle").textContent=x.classList.contains("open")?"إغلاق":"فتح"};
 $("v13PlayerLoginBtn").onclick=()=>doLogin("player");
 $("v13OrgLoginBtn").onclick=()=>doLogin("org");
 $("v13Reset").onclick=async()=>{const email=$("v13LoginEmail")?.value.trim().toLowerCase();if(!email)return msg("دخل الإيميل ديالك الأول.","error");const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+window.location.pathname});msg(error?error.message:"تصيفط رابط تغيير كلمة السر للإيميل ديالك 📩",error?"error":"success")};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0),{once:true});else setTimeout(setup,0);
})();