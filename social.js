/* CHAoui Social v3 — Instagram-like social layer for the eFootball community */
(()=> {
"use strict";
const $=id=>document.getElementById(id);
const esc=v=>window.escapeHTML?window.escapeHTML(v??""):String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const toast=m=>window.showToast?window.showToast(m):alert(m);
const avatar=p=>p?.avatar_url?'<div class="social-avatar"><img src="'+esc(p.avatar_url)+'" alt=""></div>':'<div class="social-avatar"><span>'+esc((p?.display_name||p?.username||"C")[0])+'</span></div>';
const date=v=>{try{return new Date(v).toLocaleDateString("ar-MA",{day:"2-digit",month:"short"})}catch{return""}};
const timeAgo=v=>{try{const d=Math.max(1,Math.floor((Date.now()-new Date(v).getTime())/60000));return d<60?d+"د":d<1440?Math.floor(d/60)+"س":Math.floor(d/1440)+"ي"}catch{return""}};
let viewedProfileId=null;
let socialInstalled=false;

function install(){
 const home=$("home"), profile=$("profile"), nav=$("bottomNav");
 if(home&&!$("socialHome")){
  [...home.children].forEach(x=>x.classList.add("social-legacy-home"));
  const d=document.createElement("div");d.id="socialHome";d.className="social-home";
  d.innerHTML='<div class="social-topbar"><button class="social-brand" data-social-home>CHAoui<span>+</span></button><div class="social-top-actions"><button data-social-nav="notifications" aria-label="Notifications">♡<i class="social-badge" id="socialNotifBadge"></i></button><button data-social-nav="chat" aria-label="Messages">✉</button></div></div><div class="social-section-label"><b>Stories</b><small>24h</small></div><div id="socialStories" class="social-stories"></div><div class="social-feed-head"><div><small>CHAoui COMMUNITY</small><h2>آخر النشاط</h2></div><button data-social-create>＋</button></div><div id="socialFeed" class="social-feed"></div>';
  home.prepend(d);
 }
 if(profile&&!$("socialProfile")){
  [...profile.children].forEach(x=>x.classList.add("social-legacy-profile"));
  const d=document.createElement("div");d.id="socialProfile";d.className="social-profile";
  d.innerHTML='<div class="social-profile-bar"><button data-social-back>←</button><b>Profile</b><button data-social-nav="notifications">♡</button></div><div id="socialProfileBody"></div>';
  profile.prepend(d);
 }
 if(nav){
  const a=[...nav.querySelectorAll(".nav-item")];
  if(a.length>=5){
   const labels=[["home","⌂","الرئيسية"],["search","⌕","اكتشف"],["","＋","نشر"],["chat","✉","الرسائل"],["profile","◎","صفحتي"]];
   labels.forEach((x,i)=>{if(!a[i])return;a[i].dataset.page=x[0];const s=a[i].querySelector("span"),sm=a[i].querySelector("small");if(s)s.textContent=x[1];if(sm)sm.textContent=x[2]});
   a[2].removeAttribute("data-page");a[2].dataset.socialCreate="";a[2].classList.add("social-create-nav");
   for(let i=5;i<a.length;i++)a[i].classList.add("social-nav-hidden");
   nav.classList.add("social-nav");
  }
 }
 socialInstalled=true;
}

async function updateNotifBadge(){
 const b=$("socialNotifBadge");if(!b||!currentUser)return;
 const r=await supabaseClient.from("social_notifications").select("id",{count:"exact",head:true}).eq("user_id",currentUser.id).is("read_at",null);
 const n=Number(r.count||0);b.textContent=n>9?"9+":n||"";b.classList.toggle("show",n>0);
}

async function stories(){
 const b=$("socialStories");if(!b||!currentUser)return;
 const r=await supabaseClient.from("social_stories").select("id,user_id,body,media_url,created_at,expires_at,profiles:user_id(id,username,display_name,avatar_url,online,premium)").gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false}).limit(80);
 const groups=new Map();
 (r.data||[]).forEach(s=>{if(!groups.has(s.user_id))groups.set(s.user_id,{profile:s.profiles||{},stories:[]});groups.get(s.user_id).stories.push(s)});
 const me=groups.get(currentUser.id);
 let html='<button class="story-add" data-social-story-create><i>＋</i><small>قصتي</small></button>';
 if(me)groups.delete(currentUser.id);
 html+=(me?'<button class="story-item story-has-mine" data-story-user="'+currentUser.id+'">'+avatar(me.profile)+'<small>قصتي</small></button>':"");
 [...groups.values()].slice(0,14).forEach(g=>{html+='<button class="story-item story-ring" data-story-user="'+g.profile.id+'">'+avatar(g.profile)+'<small>'+esc(g.profile.username||g.profile.display_name||"Player")+'</small></button>'});
 if(!groups.size&&!me)html+='<button class="story-item story-empty-user" data-social-story-create><i>＋</i><small>أول Story</small></button>';
 b.innerHTML=html;
}

async function openStory(userId){
 const r=await supabaseClient.from("social_stories").select("id,user_id,body,media_url,created_at,expires_at,profiles:user_id(id,username,display_name,avatar_url,premium)").eq("user_id",userId).gt("expires_at",new Date().toISOString()).order("created_at",{ascending:true});
 const rows=r.data||[];if(!rows.length)return toast("هاد Story سالات.");
 let idx=0;
 const render=()=>{const s=rows[idx],p=s.profiles||{};return '<div class="social-story-viewer"><div class="social-story-progress">'+rows.map((_,i)=>'<i class="'+(i<=idx?"done":"")+'"></i>').join("")+'</div><div class="social-story-head">'+avatar(p)+'<span><b>'+esc(p.display_name||p.username||"Player")+'</b><small>@'+esc(p.username||"player")+' · '+timeAgo(s.created_at)+'</small></span><button onclick="closeModal()">×</button></div>'+(s.media_url?'<img class="social-story-media" src="'+esc(s.media_url)+'" alt="">':'<div class="social-story-text">'+esc(s.body||"")+'</div>')+(s.body&&s.media_url?'<p class="social-story-caption">'+esc(s.body)+'</p>':"")+'<div class="social-story-controls"><button id="storyPrev">‹</button><button id="storyNext">›</button></div></div>'};
 const mark=async()=>{await supabaseClient.from("social_story_views").upsert({story_id:rows[idx].id,user_id:currentUser.id},{onConflict:"story_id,user_id"})};
 openModal(render());await mark();
 const mount=()=>{$("storyPrev")?.addEventListener("click",()=>{if(idx>0){idx--;openModal(render());mount();mark()}});$("storyNext")?.addEventListener("click",()=>{if(idx<rows.length-1){idx++;openModal(render());mount();mark()}else closeModal()})};mount();
}

function createStory(){
 openModal('<div class="modal-head"><h2>＋ Story / Moment</h2><button onclick="closeModal()">×</button></div><div class="modal-body social-story-create"><p class="social-muted">الـStory كتبقى 24 ساعة ومن بعد كتختفي أوتوماتيكياً.</p><textarea id="sstBody" class="modal-input" rows="5" maxlength="500" placeholder="شنو بغيتي تشارك اليوم؟"></textarea><input id="sstMedia" class="modal-input" placeholder="رابط صورة (اختياري)"><button class="primary-btn" id="sstPublish">نشر Story 🚀</button></div>');
 $("sstPublish")?.addEventListener("click",async()=>{const body=$("sstBody").value.trim(),media=$("sstMedia").value.trim()||null;if(!body&&!media)return toast("كتب شي حاجة أو حط صورة.");const z=await supabaseClient.from("social_stories").insert({user_id:currentUser.id,body:body||null,media_url:media});if(z.error)return toast("ما قدرناش ننشرو Story.");closeModal();toast("🔥 Story تنشرات لمدة 24 ساعة.");stories()});
}

async function feed(){
 const b=$("socialFeed");if(!b||!currentUser)return;
 b.innerHTML='<div class="social-loading">جاري تحميل Feed...</div>';
 const r=await supabaseClient.from("social_posts").select("id,author_id,body,media_url,post_type,match_id,created_at,profiles:author_id(id,username,display_name,avatar_url,profile_badge,level,rating,premium)").order("created_at",{ascending:false}).limit(40);
 if(r.error){b.innerHTML='<div class="social-empty">تعذر تحميل Feed.</div>';return}
 if(!r.data?.length){b.innerHTML='<div class="social-empty"><b>🔥 مازال ما كاين حتى Post</b><small>كون أول واحد ينشر.</small><button data-social-create>＋ أول Post</button></div>';return}
 const ids=r.data.map(x=>x.id);
 const [lr,sr,cr]=await Promise.all([
  supabaseClient.from("social_post_likes").select("post_id,user_id").in("post_id",ids),
  supabaseClient.from("social_post_saves").select("post_id,user_id").in("post_id",ids).eq("user_id",currentUser.id),
  supabaseClient.from("social_post_comments").select("post_id").in("post_id",ids)
 ]);
 const mine=new Set((lr.data||[]).filter(x=>x.user_id===currentUser.id).map(x=>x.post_id));
 const saved=new Set((sr.data||[]).map(x=>x.post_id));
 const cnt={},cc={};(lr.data||[]).forEach(x=>cnt[x.post_id]=(cnt[x.post_id]||0)+1);(cr.data||[]).forEach(x=>cc[x.post_id]=(cc[x.post_id]||0)+1);
 b.innerHTML=r.data.map(x=>postHTML(x,mine.has(x.id),cnt[x.id]||0,saved.has(x.id),cc[x.id]||0)).join("");
}

function postHTML(x,liked,count,saved,commentsCount){
 const p=x.profiles||{},kind={match:"⚽ MATCH",achievement:"🏆 ACHIEVEMENT",card:"🃏 CARD",moment:"🔥 MOMENT",post:"POST"}[x.post_type]||"POST";
 return '<article class="social-post" data-post-card="'+x.id+'"><div class="social-post-head">'+avatar(p)+'<button class="social-author" data-player-id="'+p.id+'"><span><b>'+esc(p.display_name||p.username||"CHAoui Player")+(p.premium?" 💎":"")+'</b><small>@'+esc(p.username||"player")+' · '+timeAgo(x.created_at)+'</small></span></button><button class="social-more">⋮</button></div><div class="social-kind">'+kind+'</div><div class="social-post-body">'+esc(x.body||"")+'</div>'+(x.media_url?'<img class="social-post-media" src="'+esc(x.media_url)+'" alt="">':"")+'<div class="social-post-actions"><button data-like-post="'+x.id+'" class="'+(liked?"liked":"")+'">'+(liked?"♥":"♡")+' <b>'+count+'</b></button><button data-comments="'+x.id+'">💬 <b>'+commentsCount+'</b></button><button data-share-post="'+x.id+'">↗ <b>مشاركة</b></button><button data-save-post="'+x.id+'" class="'+(saved?"saved":"")+'">'+(saved?"🔖":"🔖")+'</button></div></article>';
}

async function comments(postId){
 const r=await supabaseClient.from("social_post_comments").select("id,body,user_id,created_at,profiles:user_id(id,username,display_name,avatar_url)").eq("post_id",postId).order("created_at",{ascending:true}).limit(100);
 const rows=r.data||[];
 openModal('<div class="modal-head"><h2>💬 التعليقات</h2><button onclick="closeModal()">×</button></div><div class="modal-body"><div class="social-comments">'+(rows.length?rows.map(c=>'<div class="social-comment">'+avatar(c.profiles)+'<div><b>'+esc(c.profiles?.display_name||c.profiles?.username||"Player")+'</b><p>'+esc(c.body)+'</p><small>'+timeAgo(c.created_at)+'</small></div></div>').join(""):'<div class="social-empty">مازال حتى تعليق.</div>')+'</div><div class="social-comment-compose"><input id="scBody" class="modal-input" maxlength="500" placeholder="كتب تعليق..."><button id="scSend" class="primary-small">نشر</button></div></div>');
 $("scSend")?.addEventListener("click",async()=>{const body=$("scBody").value.trim();if(!body)return;const z=await supabaseClient.from("social_post_comments").insert({post_id:postId,user_id:currentUser.id,body});if(z.error)return toast("ما قدرناش نضيفو التعليق.");$("scBody").value="";comments(postId)});
}

async function discover(){
 openModal('<div class="modal-head"><h2>🔎 اكتشف لاعبين</h2><button onclick="closeModal()">×</button></div><div class="modal-body"><div class="social-discover-box"><input id="sdQ" class="modal-input" placeholder="username / eFootball Name / الاسم"><button id="sdGo" class="primary-btn">بحث 🔎</button></div><div id="sdResults" class="social-people-list"><div class="social-empty">قلب على لاعب من CHAoui.</div></div></div>');
 const run=async()=>{const term=$("sdQ")?.value.trim();if(!term)return;const p=await supabaseClient.from("profiles").select("id,username,display_name,efootball_name,avatar_url,rating,level,premium").or("username.ilike.%"+term+"%,display_name.ilike.%"+term+"%,efootball_name.ilike.%"+term+"%").limit(30);const rows=p.data||[];$("sdResults").innerHTML=rows.length?rows.map(x=>'<button class="social-person" data-player-id="'+x.id+'">'+avatar(x)+'<span><b>'+esc(x.display_name||x.username||"Player")+(x.premium?" 💎":"")+'</b><small>@'+esc(x.username||"player")+' · '+esc(x.efootball_name||"eFootball")+' · ⚡ '+Number(x.rating||0)+' · LV.'+Number(x.level||1)+'</small></span></button>').join(""):'<div class="social-empty">ما لقيناش هاد اللاعب.</div>'};
 $("sdGo")?.addEventListener("click",run);$("sdQ")?.addEventListener("keydown",e=>{if(e.key==="Enter")run()});setTimeout(()=>$("sdQ")?.focus(),50);
}

async function notifications(){
 const r=await supabaseClient.from("social_notifications").select("id,kind,message,created_at,read_at,actor_id,post_id,profiles:actor_id(id,username,display_name,avatar_url)").order("created_at",{ascending:false}).limit(60);
 const rows=r.data||[];
 openModal('<div class="modal-head"><h2>♡ Notifications</h2><button onclick="closeModal()">×</button></div><div class="modal-body"><div class="social-notifications">'+(rows.length?rows.map(n=>'<button class="social-notification '+(!n.read_at?"unread":"")+'" data-player-id="'+(n.actor_id||"")+'">'+avatar(n.profiles||{})+'<span><b>'+esc(n.message)+'</b><small>'+timeAgo(n.created_at)+'</small></span></button>').join(""):'<div class="social-empty">ما عندك حتى إشعار جديد.</div>')+'</div></div>');
 await supabaseClient.from("social_notifications").update({read_at:new Date().toISOString()}).eq("user_id",currentUser.id).is("read_at",null);updateNotifBadge();
}

function create(){
 openModal('<div class="modal-head"><h2>＋ نشر فـCHAoui</h2><button onclick="closeModal()">×</button></div><div class="modal-body social-create-modal"><div class="social-type-grid"><button data-stype="post">📸<small>Post</small></button><button data-stype="match">⚽<small>Match</small></button><button data-stype="achievement">🏆<small>Achievement</small></button><button data-stype="card">🃏<small>Card</small></button><button data-stype="moment">🔥<small>Moment</small></button></div><input type="hidden" id="spType" value="post"><textarea id="spBody" class="modal-input" rows="6" maxlength="1000" placeholder="شنو واقع معاك؟"></textarea><input id="spMedia" class="modal-input" placeholder="رابط صورة (اختياري)"><button class="primary-btn" id="spPublish">نشر الآن 🚀</button></div>');
 document.querySelectorAll("[data-stype]").forEach(x=>x.addEventListener("click",()=>{document.querySelectorAll("[data-stype]").forEach(y=>y.classList.remove("active"));x.classList.add("active");$("spType").value=x.dataset.stype}));document.querySelector("[data-stype=post]")?.classList.add("active");
 $("spPublish")?.addEventListener("click",async()=>{const body=$("spBody").value.trim();if(!body&&!$("spMedia").value.trim())return toast("كتب شي حاجة أو حط صورة.");const z=await supabaseClient.from("social_posts").insert({author_id:currentUser.id,body:body||null,media_url:$("spMedia").value.trim()||null,post_type:$("spType").value});if(z.error)return toast("ما قدرناش ننشرو.");closeModal();toast("🚀 Post تنشر.");feed()});
}

function edit(){
 const p=currentProfile||{};openModal('<div class="modal-head"><h2>✏️ تعديل Profile</h2><button onclick="closeModal()">×</button></div><div class="modal-body social-edit-modal"><label>الاسم<input id="seName" class="modal-input" value="'+esc(p.display_name||"")+'"></label><label>Bio<textarea id="seBio" class="modal-input" rows="3" maxlength="180">'+esc(p.bio||"")+'</textarea></label><label>رابط صورة Profile<input id="seAvatar" class="modal-input" value="'+esc(p.avatar_url||"")+'" placeholder="https://..."></label><label>eFootball Name<input id="seEf" class="modal-input" value="'+esc(p.efootball_name||"")+'"></label><button class="primary-btn" id="seSave">حفظ التعديلات</button></div>');
 $("seSave")?.addEventListener("click",async()=>{const z=await supabaseClient.rpc("update_social_profile",{p_display_name:$("seName").value.trim(),p_bio:$("seBio").value.trim(),p_avatar_url:$("seAvatar").value.trim(),p_efootball_name:$("seEf").value.trim()});if(z.error)return toast("ما قدرناش نحفظو.");currentProfile=z.data;closeModal();toast("✅ Profile تحدّث.");profile(currentUser.id)});
}

async function profile(id=currentUser?.id){
 const b=$("socialProfileBody");if(!b)return;b.innerHTML='<div class="social-loading">جاري تحميل Profile...</div>';viewedProfileId=id;
 const r=await supabaseClient.from("profiles").select("*").eq("id",id).single();if(r.error)return;
 const p=r.data;if(id===currentUser?.id)currentProfile=p;
 const [f,g,posts]=await Promise.all([
  supabaseClient.from("profile_follows").select("follower_id",{count:"exact",head:true}).eq("following_id",id),
  supabaseClient.from("profile_follows").select("following_id",{count:"exact",head:true}).eq("follower_id",id),
  supabaseClient.from("social_posts").select("id,body,post_type,media_url,created_at").eq("author_id",id).order("created_at",{ascending:false}).limit(24)
 ]);
 let following=false;if(id!==currentUser?.id){const z=await supabaseClient.from("profile_follows").select("follower_id").eq("follower_id",currentUser.id).eq("following_id",id).maybeSingle();following=!!z.data}
 const matches=Number(p.wins||0)+Number(p.losses||0)+Number(p.draws||0);
 b.innerHTML='<section class="ig-profile-card"><div class="ig-profile-main">'+avatar(p)+'<div class="ig-identity"><h1>'+esc(p.display_name||p.username||"CHAoui Player")+(p.premium?" 💎":"")+'</h1><small>@'+esc(p.username||"player")+'</small><p>'+esc(p.bio||"eFootball player • CHAoui community ⚡")+'</p><div class="ig-tags"><span>⚡ '+Number(p.rating||0)+' ELO</span><span>LV.'+Number(p.level||1)+'</span><span>🔥 '+Number(p.current_streak||0)+'</span></div></div></div><div class="ig-stats"><button data-followers="'+id+'"><b>'+Number(f.count||0)+'</b><small>Followers</small></button><button data-following="'+id+'"><b>'+Number(g.count||0)+'</b><small>Following</small></button><button><b>'+matches+'</b><small>Matches</small></button><button><b>'+Number(p.wins||0)+'</b><small>Wins</small></button></div><div class="ig-profile-actions">'+(id===currentUser?.id?'<button class="ig-primary" data-edit-social>تعديل الملف</button><button data-social-share>↗ مشاركة</button>':'<button class="ig-primary '+(following?"following":"")+'" data-follow="'+id+'">'+(following?"Following":"Follow")+'</button><button data-social-message="'+id+'">💬 رسالة</button>')+'</div></section><div class="ig-tabs"><button class="active">▦ Posts</button><button data-page="matches">⚽ Matches</button><button data-page="ranking">📊 Ranking</button><button>🏆 Awards</button></div><div class="ig-post-grid">'+((posts.data||[]).map(x=>'<article data-comments="'+x.id+'">'+(x.media_url?'<img src="'+esc(x.media_url)+'" alt="">':"")+'<b>'+(x.post_type==="match"?"⚽":x.post_type==="achievement"?"🏆":x.post_type==="card"?"🃏":x.post_type==="moment"?"🔥":"✦")+'</b><p>'+esc(x.body||"")+'</p><small>'+timeAgo(x.created_at)+'</small></article>').join("")||'<div class="social-empty">مازال ما نشر حتى Post.</div>')+'</div>';
}

async function follow(id){const r=await supabaseClient.rpc("toggle_profile_follow",{p_target:id});if(r.error)return toast("Follow ما خدمش.");profile(id);updateNotifBadge()}
async function people(type,id){
 const col=type==="followers"?"following_id":"follower_id",wanted=type==="followers"?"follower_id":"following_id";
 const r=await supabaseClient.from("profile_follows").select(wanted+",profiles:"+wanted+"(id,username,display_name,avatar_url,rating,level,premium)").eq(col,id);
 const rows=r.data||[];
 openModal('<div class="modal-head"><h2>'+(type==="followers"?"👥 Followers":"👤 Following")+'</h2><button onclick="closeModal()">×</button></div><div class="modal-body social-people-list">'+(rows.length?rows.map(x=>{const p=x.profiles||{};return '<button class="social-person" data-player-id="'+p.id+'">'+avatar(p)+'<span><b>'+esc(p.display_name||p.username||"Player")+(p.premium?" 💎":"")+'</b><small>@'+esc(p.username||"player")+' · ⚡ '+Number(p.rating||0)+' · LV.'+Number(p.level||1)+'</small></span></button>'}).join(""):'<div class="social-empty">ما كاين حتى واحد هنا.</div>')+'</div>');
}
async function sharePost(id){
 const url=location.origin+location.pathname+"#post-"+id;
 try{if(navigator.share){await navigator.share({title:"CHAoui Post",url});toast("↗ تْشاركا Post.");return}await navigator.clipboard.writeText(url);toast("🔗 رابط Post تنسخ.");}catch{toast("🔗 رابط Post: "+url)}
}
async function savePost(id){
 const existing=await supabaseClient.from("social_post_saves").select("post_id").eq("post_id",id).eq("user_id",currentUser.id).maybeSingle();
 if(existing.data){const z=await supabaseClient.from("social_post_saves").delete().eq("post_id",id).eq("user_id",currentUser.id);if(z.error)return toast("ما قدرناش نحيدو من المحفوظات.");toast("🔖 تحيد من المحفوظات.");}
 else{const z=await supabaseClient.from("social_post_saves").insert({post_id:id,user_id:currentUser.id});if(z.error)return toast("ما قدرناش نحفظو.");toast("🔖 تزاد للمحفوظات.");}
 feed();
}
async function startDirectChat(id){
 const r=await supabaseClient.rpc("start_direct_chat",{p_other:id});
 if(r.error)return toast("ما قدرناش نفتحو الرسائل.");
 closeModal();showPage("chat");
 setTimeout(()=>{if(window.openConversation)window.openConversation(r.data);else if(window.openNewChatModal)window.openNewChatModal(id)},120);
}
function render(){install();if(!currentUser)return;if(currentPageId==="home"){stories();feed();updateNotifBadge()}if(currentPageId==="profile")profile(viewedProfileId||currentUser.id);}

window.CHAOUI_SOCIAL_BOOT=()=>{if(!currentUser)return;install();render()};
const old=window.showPage;
if(old&&!window.__socialWrapped){window.__socialWrapped=true;window.showPage=(p,o)=>{old(p,o);if(p==="home"||p==="profile")setTimeout(render,60)}}

document.addEventListener("click",e=>{
 const c=e.target.closest("[data-social-create]");if(c){create();return}
 const sc=e.target.closest("[data-social-story-create]");if(sc){createStory();return}
 const su=e.target.closest("[data-story-user]");if(su){openStory(su.dataset.storyUser);return}
 const n=e.target.closest("[data-social-nav]");if(n){const v=n.dataset.socialNav;if(v==="notifications")notifications();else if(v==="chat")showPage("chat");else if(v==="search")discover();return}
 if(e.target.closest("[data-social-home]")){showPage("home");return}
 const f=e.target.closest("[data-follow]");if(f){follow(f.dataset.follow);return}
 const fr=e.target.closest("[data-followers]");if(fr){people("followers",fr.dataset.followers);return}
 const fg=e.target.closest("[data-following]");if(fg){people("following",fg.dataset.following);return}
 const l=e.target.closest("[data-like-post]");if(l){(async()=>{const r=await supabaseClient.rpc("toggle_social_like",{p_post:l.dataset.likePost});if(r.error)return toast("Like ما خدمش.");feed();updateNotifBadge()})();return}
 const cm=e.target.closest("[data-comments]");if(cm){comments(cm.dataset.comments);return}
 const sh=e.target.closest("[data-share-post]");if(sh){sharePost(sh.dataset.sharePost);return}
 const sv=e.target.closest("[data-save-post]");if(sv){savePost(sv.dataset.savePost);return}
 const pl=e.target.closest("[data-player-id]");if(pl){if(!pl.dataset.playerId)return;closeModal();showPage("profile");setTimeout(()=>profile(pl.dataset.playerId),80);return}
 const ed=e.target.closest("[data-edit-social]");if(ed){edit();return}
 const back=e.target.closest("[data-social-back]");if(back){viewedProfileId=null;showPage("home");return}
 const sp=e.target.closest("[data-social-share]");if(sp){const url=location.origin+location.pathname+"#profile-"+(viewedProfileId||currentUser.id);if(navigator.share)navigator.share({title:"CHAoui Profile",url});else navigator.clipboard?.writeText(url).then(()=>toast("🔗 رابط Profile تنسخ."));return}
 const msg=e.target.closest("[data-social-message]");if(msg){startDirectChat(msg.dataset.socialMessage);return}
 const pg=e.target.closest("[data-page]");if(pg&&pg.closest(".ig-tabs")){showPage(pg.dataset.page);return}
});
const boot=()=>setTimeout(()=>{install();if(currentUser)render()},150);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();