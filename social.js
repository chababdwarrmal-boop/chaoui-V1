/* CHAoui Social Layer */
(()=> {
const $=id=>document.getElementById(id);
const esc=v=>window.escapeHTML?escapeHTML(v??""):String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const av=p=>p?.avatar_url?'<div class="social-avatar"><img src="'+esc(p.avatar_url)+'"></div>':'<div class="social-avatar"><span>'+esc((p?.display_name||p?.username||"C")[0])+'</span></div>';
const toast=m=>window.showToast?showToast(m):alert(m);
function install(){
 const home=$("home"),profile=$("profile"),nav=$("bottomNav");
 if(home&&!$("socialHome")){
  [...home.children].forEach(x=>x.classList.add("social-legacy-home"));
  const d=document.createElement("div");d.id="socialHome";d.className="social-home";
  d.innerHTML='<div class="social-topbar"><b>CHAoui<span>+</span></b><div><button data-social-nav="notifications">♡</button><button data-social-nav="chat">✉</button></div></div><div id="socialStories" class="social-stories"></div><div class="social-feed-head"><div><small>COMMUNITY</small><h2>آخر النشاط</h2></div><button data-social-create>＋</button></div><div id="socialFeed" class="social-feed"></div>';
  home.prepend(d);
 }
 if(profile&&!$("socialProfile")){
  [...profile.children].forEach(x=>x.classList.add("social-legacy-profile"));
  const d=document.createElement("div");d.id="socialProfile";d.className="social-profile";
  d.innerHTML='<div class="social-profile-bar"><button data-social-back>←</button><b>Profile</b><button>⋮</button></div><div id="socialProfileBody"></div>';
  profile.prepend(d);
 }
 if(nav){
  const a=[...nav.querySelectorAll(".nav-item")];
  if(a.length>=8){
   [["home","⌂","الرئيسية"],["search","⌕","اكتشف"],["","＋","نشر"],["chat","✉","الرسائل"],["profile","◎","صفحتي"]].forEach((x,i)=>{a[i].dataset.page=x[0];a[i].querySelector("span").textContent=x[1];a[i].querySelector("small").textContent=x[2]});
   a[2].removeAttribute("data-page");a[2].dataset.socialCreate="";
   for(let i=5;i<a.length;i++)a[i].classList.add("social-nav-hidden");
  }
 }
}
async function stories(){
 const b=$("socialStories");if(!b)return;
 const {data}=await supabaseClient.from("profiles").select("id,username,display_name,avatar_url,online").order("online",{ascending:false}).limit(12);
 b.innerHTML='<button class="story-add" data-social-create><i>＋</i><small>نشر</small></button>'+(data||[]).map(p=>'<button class="story-item" data-player-id="'+p.id+'">'+av(p)+'<small>'+esc(p.username||p.display_name||"Player")+'</small></button>').join("");
}
async function feed(){
 const b=$("socialFeed");if(!b)return;b.innerHTML='<div class="social-loading">جاري تحميل Feed...</div>';
 let {data}=await supabaseClient.from("social_posts").select("id,author_id,body,media_url,post_type,created_at,profiles:author_id(id,username,display_name,avatar_url,profile_badge,level,rating)").order("created_at",{ascending:false}).limit(20);
 if(!data?.length){b.innerHTML='<div class="social-empty"><b>🔥 مازال ما كاين حتى Post</b><small>كون أول واحد ينشر.</small><button data-social-create>＋ أول Post</button></div>';return}
 const ids=data.map(x=>x.id), lr=await supabaseClient.from("social_post_likes").select("post_id,user_id").in("post_id",ids),mine=new Set((lr.data||[]).filter(x=>x.user_id===currentUser?.id).map(x=>x.post_id)),cnt={};
 (lr.data||[]).forEach(x=>cnt[x.post_id]=(cnt[x.post_id]||0)+1);
 b.innerHTML=data.map(x=>{const p=x.profiles||{};return '<article class="social-post"><div class="social-post-head">'+av(p)+'<div><b>'+esc(p.display_name||p.username||"CHAoui Player")+'</b><small>@'+esc(p.username||"player")+' · '+new Date(x.created_at).toLocaleDateString("ar-MA")+'</small></div><button>⋮</button></div><div class="social-post-body">'+esc(x.body||"")+'</div>'+(x.media_url?'<img class="social-post-media" src="'+esc(x.media_url)+'">':"")+'<div class="social-post-actions"><button data-like-post="'+x.id+'" class="'+(mine.has(x.id)?"liked":"")+'">'+(mine.has(x.id)?"♥":"♡")+' '+(cnt[x.id]||0)+'</button><button>💬 تعليق</button><button>↗ مشاركة</button><button>🔖</button></div></article>'}).join("");
}
async function profile(id=currentUser?.id){
 const b=$("socialProfileBody");if(!b)return;b.innerHTML='<div class="social-loading">جاري تحميل Profile...</div>';
 const r=await supabaseClient.from("profiles").select("*").eq("id",id).single();if(r.error)return;
 const p=r.data,f=await supabaseClient.from("profile_follows").select("follower_id",{count:"exact",head:true}).eq("following_id",id),g=await supabaseClient.from("profile_follows").select("following_id",{count:"exact",head:true}).eq("follower_id",id),posts=await supabaseClient.from("social_posts").select("id,body,post_type,created_at").eq("author_id",id).order("created_at",{ascending:false}).limit(12);
 let following=false;if(id!==currentUser?.id){const z=await supabaseClient.from("profile_follows").select("follower_id").eq("follower_id",currentUser.id).eq("following_id",id).maybeSingle();following=!!z.data}
 const m=Number(p.wins||0)+Number(p.losses||0)+Number(p.draws||0);
 b.innerHTML='<section class="ig-profile-card"><div class="ig-profile-main">'+av(p)+'<div class="ig-identity"><h1>'+esc(p.display_name||p.username||"CHAoui Player")+(p.premium?" 💎":"")+'</h1><small>@'+esc(p.username||"player")+'</small><p>'+esc(p.bio||"eFootball player • CHAoui community ⚡")+'</p><div class="ig-tags"><span>⚡ Power '+Number(p.rating||0)+'</span><span>LV.'+Number(p.level||1)+'</span><span>🔥 '+Number(p.current_streak||0)+' Streak</span></div></div></div><div class="ig-stats"><button data-followers="'+id+'"><b>'+Number(f.count||0)+'</b><small>Followers</small></button><button data-following="'+id+'"><b>'+Number(g.count||0)+'</b><small>Following</small></button><button><b>'+m+'</b><small>Matches</small></button><button><b>'+Number(p.wins||0)+'</b><small>Wins</small></button></div><div class="ig-profile-actions">'+(id===currentUser?.id?'<button class="ig-primary" data-edit-social>تعديل الملف</button><button data-social-share>↗ مشاركة</button>':'<button class="ig-primary '+(following?"following":"")+'" data-follow="'+id+'">'+(following?"Following":"Follow")+'</button><button data-social-message="'+id+'">💬 رسالة</button>')+'</div></section><div class="ig-tabs"><button class="active">▦ Posts</button><button>⚽ Matches</button><button>🃏 Card</button><button>🏆 Awards</button></div><div class="ig-post-grid">'+(posts.data||[]).map(x=>'<article><b>'+(x.post_type==="match"?"⚽":x.post_type==="achievement"?"🏆":x.post_type==="card"?"🃏":"✦")+'</b><p>'+esc(x.body||"")+'</p></article>').join("")+'</div>';
}
function create(){
 openModal('<div class="modal-head"><h2>＋ نشر فـCHAoui</h2><button onclick="closeModal()">×</button></div><div class="modal-body social-create-modal"><select id="spType" class="modal-input"><option value="post">📸 Post</option><option value="match">⚽ Match</option><option value="achievement">🏆 Achievement</option><option value="card">🃏 Player Card</option><option value="moment">🔥 Moment</option></select><textarea id="spBody" class="modal-input" rows="5" maxlength="1000" placeholder="شنو واقع معاك؟"></textarea><input id="spMedia" class="modal-input" placeholder="رابط صورة (اختياري)"><button class="primary-btn" id="spPublish">نشر الآن 🚀</button></div>');
 $("spPublish")?.addEventListener("click",async()=>{const body=$("spBody").value.trim();if(!body)return toast("كتب شي حاجة.");const {error}=await supabaseClient.from("social_posts").insert({author_id:currentUser.id,body,media_url:$("spMedia").value.trim()||null,post_type:$("spType").value});if(error)return toast("ما قدرناش ننشرو.");closeModal();toast("🚀 تنشر Post.");feed()});
}
function edit(){
 const p=currentProfile||{};openModal('<div class="modal-head"><h2>✏️ تعديل Profile</h2><button onclick="closeModal()">×</button></div><div class="modal-body social-edit-modal"><label>الاسم<input id="seName" class="modal-input" value="'+esc(p.display_name||"")+'"></label><label>Bio<textarea id="seBio" class="modal-input" rows="3" maxlength="180">'+esc(p.bio||"")+'</textarea></label><label>رابط صورة Profile<input id="seAvatar" class="modal-input" value="'+esc(p.avatar_url||"")+'" placeholder="https://..."></label><label>eFootball Name<input id="seEf" class="modal-input" value="'+esc(p.efootball_name||"")+'"></label><button class="primary-btn" id="seSave">حفظ</button></div>');
 $("seSave")?.addEventListener("click",async()=>{const {data,error}=await supabaseClient.rpc("update_social_profile",{p_display_name:$("seName").value.trim(),p_bio:$("seBio").value.trim(),p_avatar_url:$("seAvatar").value.trim(),p_efootball_name:$("seEf").value.trim()});if(error)return toast("ما قدرناش نحفظو.");currentProfile=data;closeModal();toast("✅ Profile تحدّث.");profile()});
}
async function follow(id){const r=await supabaseClient.rpc("toggle_profile_follow",{p_target:id});if(r.error)return toast("ما قدرناش نبدلو Follow.");profile(id)}
async function people(type,id){
 const col=type==="followers"?"following_id":"follower_id",wanted=type==="followers"?"follower_id":"following_id";
 const r=await supabaseClient.from("profile_follows").select(wanted+",profiles:"+wanted+"(id,username,display_name,avatar_url,rating)").eq(col,id);
 const rows=r.data||[];openModal('<div class="modal-head"><h2>'+(type==="followers"?"👥 Followers":"👤 Following")+'</h2><button onclick="closeModal()">×</button></div><div class="modal-body social-people-list">'+rows.map(x=>{const p=x.profiles||{};return '<button class="social-person" data-player-id="'+p.id+'">'+av(p)+'<span><b>'+esc(p.display_name||p.username)+'</b><small>@'+esc(p.username||"player")+' · ⚡ '+Number(p.rating||0)+'</small></span></button>'}).join("")+'</div>')
}
function render(){install();if(currentPageId==="home"){stories();feed()}if(currentPageId==="profile")profile()}
const old=window.showPage;if(old&&!window.__socialWrapped){window.__socialWrapped=true;window.showPage=(p,o)=>{old(p,o);if(p==="home"||p==="profile")render()}}
document.addEventListener("click",e=>{
 const c=e.target.closest("[data-social-create]");if(c){create();return}
 const n=e.target.closest("[data-social-nav]");if(n){showPage(n.dataset.socialNav);return}
 const f=e.target.closest("[data-follow]");if(f){follow(f.dataset.follow);return}
 const fr=e.target.closest("[data-followers]");if(fr){people("followers",fr.dataset.followers);return}
 const fg=e.target.closest("[data-following]");if(fg){people("following",fg.dataset.following);return}
 const l=e.target.closest("[data-like-post]");if(l){(async()=>{const r=await supabaseClient.rpc("toggle_social_like",{p_post:l.dataset.likePost});if(r.error)return toast("Like ما خدمش.");feed()})();return}
 const pl=e.target.closest("[data-player-id]");if(pl){showPage("profile");setTimeout(()=>profile(pl.dataset.playerId),50);return}
 const ed=e.target.closest("[data-edit-social]");if(ed){edit();return}
 const back=e.target.closest("[data-social-back]");if(back){showPage("home");return}
 const sh=e.target.closest("[data-social-share]");if(sh){navigator.clipboard?.writeText(location.href).then(()=>toast("🔗 تسنخ الرابط."));return}
 const msg=e.target.closest("[data-social-message]");if(msg){if(window.openNewChatModal)openNewChatModal(msg.dataset.socialMessage);else showPage("chat");return}
});
const boot=()=>setTimeout(render,100);if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();