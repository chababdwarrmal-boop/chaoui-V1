/* CHAoui Universe Expansion — v1 */
(function(){
  const $ = id => document.getElementById(id);
  const esc = v => (window.escapeHTML ? escapeHTML(v) : String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])));
  const toast = m => window.showToast ? showToast(m) : alert(m);

  function ensurePage(){
    if($('universe')) return;
    const app=$('app'); if(!app) return;
    const s=document.createElement('section');
    s.id='universe'; s.className='page';
    s.innerHTML=`
      <div class="page-title"><div><span>CHAoui UNIVERSE</span><h1>⚡ عالم المنافسة</h1></div></div>
      <div class="universe-hero"><div><span class="u-kicker">POWER SYSTEM 2026</span><h2>كل مباراة كتبدل القصة ديالك.</h2><p>Power • Evolution • Rivalry • Records • Seasons</p></div><div class="u-power-orb"><b id="uPower">--</b><small>POWER</small></div></div>
      <div class="u-tabs">
        <button class="active" data-u-tab="power">⚡ Power</button>
        <button data-u-tab="live">🔴 Live Center</button>
        <button data-u-tab="champions">🏆 Champions League</button>
        <button data-u-tab="evolution">🧬 Evolution</button>
        <button data-u-tab="records">👑 Hall of Fame</button>
        <button data-u-tab="streak">🪙 Coin Streak</button>
        <button data-u-tab="mystery">🎁 Mystery Evolution</button>
      </div>
      <div id="uPanel"></div>`;
    const nav=$('bottomNav');
    const more=$('more');
    const btn=document.createElement('button'); btn.dataset.page='universe'; btn.innerHTML='⚡<span>Universe</span>';
    if(more?.querySelector('.more-grid')) more.querySelector('.more-grid').prepend(btn);
    app.insertBefore(s, $('modal'));
    document.addEventListener('click',e=>{const b=e.target.closest('[data-u-tab]');if(b){document.querySelectorAll('[data-u-tab]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderTab(b.dataset.uTab)}});
    window.CHAOUI_UNIVERSE_READY=true;
  }

  async function getPower(){
    if(!window.supabaseClient || !window.currentUser) return null;
    const {data,error}=await supabaseClient.rpc('refresh_player_power',{p_player:currentUser.id});
    if(error){console.warn('power',error);return null}
    return data;
  }

  async function renderTab(tab){
    const p=$('uPanel'); if(!p) return;
    p.innerHTML='<div class="u-loading">جاري تحميل البيانات…</div>';
    if(tab==='power'){
      const card=await getPower();
      if(card){$('uPower').textContent=card.power_score;p.innerHTML=`
        <div class="u-grid">
          <article class="u-card u-power-card"><span>⚡ POWER SCORE</span><strong>${card.power_score}</strong><small>${card.rarity.toUpperCase()} • Evolution Lv.${card.evolution_level}</small></article>
          <article class="u-card"><span>🎯 ATTACK</span><strong>${card.attack_score}</strong><small>الأهداف + النتائج</small></article>
          <article class="u-card"><span>🧠 CONSISTENCY</span><strong>${card.consistency_score}</strong><small>Form + Streak</small></article>
          <article class="u-card"><span>🏆 TOURNAMENT</span><strong>${card.tournament_score}</strong><small>أداء المنافسات</small></article>
        </div>
        <div class="u-card"><h3>📈 كيفاش كيتحسب Power؟</h3><p>النتائج، ELO، نسبة الفوز، الـStreak، الأهداف وقوة الأداء كيتجمعو فـPower ديناميكي.</p></div>`}
      else p.innerHTML='<div class="u-card"><h3>Power System</h3><p>خاصك تكون داخل للحساب باش يتحسب Power ديالك.</p></div>';
    }
    if(tab==='live'){
      const {data}=await supabaseClient.from('matches').select('id,status,home_player_id,away_player_id,home_score,away_score,scheduled_at').in('status',['scheduled','upcoming','result_submitted']).order('scheduled_at',{ascending:true}).limit(12);
      const ids=[...(data||[]).flatMap(m=>[m.home_player_id,m.away_player_id]).filter(Boolean)];
      let names={}; if(ids.length){const r=await supabaseClient.from('profiles').select('id,display_name,username').in('id',ids);(r.data||[]).forEach(x=>names[x.id]=x.display_name||x.username)}
      p.innerHTML=`<div class="u-card"><div class="u-section-title"><h3>🔴 LIVE MATCH CENTER</h3><span>تتبع آخر المواجهات</span></div>${(data||[]).map(m=>`<div class="u-match"><div><b>${esc(names[m.home_player_id]||'Player')}</b><span> vs </span><b>${esc(names[m.away_player_id]||'Player')}</b></div><strong>${m.home_score??'-'} : ${m.away_score??'-'}</strong><small>${m.status==='result_submitted'?'RESULT SUBMITTED':'SCHEDULED'}</small></div>`).join('')||'<div class="u-empty">ما كايناش مباريات فهاد اللحظة.</div>'}</div>`;
    }
    if(tab==='champions'){
      const {data}=await supabaseClient.from('champions_league_seasons').select('*').order('created_at',{ascending:false}).limit(5);
      p.innerHTML=`<div class="u-card u-champions"><div class="u-section-title"><h3>🏆 CHAoui Champions League</h3><span>Season → Groups → Knockout → Final</span></div>
      <div class="u-stages"><span>QUALIFIERS</span><i>→</i><span>GROUPS</span><i>→</i><span>ROUND OF 16</span><i>→</i><span>FINAL</span></div>
      ${(data||[]).map(s=>`<div class="u-season-row"><b>${esc(s.name)}</b><span>${esc(s.status)}</span><small>${s.champion_id?'🏆 Champion selected':'Registration / competition'}</small></div>`).join('')||'<div class="u-empty">مازال ما تخلق حتى Season. Owner يقدر يطلق أول نسخة.</div>'}</div>`;
    }
    if(tab==='evolution'){
      const card=await getPower(); const r=card?.rarity||'bronze'; const lv=card?.evolution_level||1;
      const stages=[['bronze',1,'🥉'],['silver',10,'🥈'],['gold',20,'🥇'],['epic',35,'💜'],['legend',50,'👑']];
      p.innerHTML=`<div class="u-card"><div class="u-section-title"><h3>🧬 Player Evolution</h3><span>الكارت ديالك كتتطور معاك</span></div><div class="evo-track">${stages.map(x=>`<div class="${stages.findIndex(y=>y[0]===r)>=stages.findIndex(y=>y[0]===x[0])?'done':''}"><span>${x[2]}</span><b>${x[0].toUpperCase()}</b><small>Lv.${x[1]}</small></div>`).join('')}</div><div class="evo-current">الحالة الحالية: <b>${r.toUpperCase()}</b> • Evolution Level ${lv}</div></div>`;
    }
    if(tab==='records'){
      const {data}=await supabaseClient.from('hall_of_fame').select('*,profiles:player_id(display_name,username)').order('created_at',{ascending:false}).limit(30);
      p.innerHTML=`<div class="u-card"><div class="u-section-title"><h3>👑 Hall of Fame</h3><span>السجل التاريخي ديال CHAoui</span></div><div class="u-records">${(data||[]).map(x=>`<div><span>${esc(x.category)}</span><b>${esc(x.profiles?.display_name||x.profiles?.username||'Legend')}</b><strong>${esc(x.value_text)}</strong></div>`).join('')||'<div class="u-empty">السجل غادي يعمر مع المواسم والبطولات.</div>'}</div></div>`;
    }
    if(tab==='streak'){
      const {data}=await supabaseClient.from('coin_streaks').select('*').eq('player_id',currentUser.id).maybeSingle();
      const days=data?.current_days||0,best=data?.best_days||0;
      p.innerHTML=`<div class="u-card streak-card"><div class="streak-big">🔥 ${days}</div><h3>Coin Streak</h3><p>أفضل سلسلة: <b>${best} أيام</b></p><button id="claimUStreak" class="primary-btn">🪙 خذ Bonus اليوم</button></div>`;
      $('claimUStreak').onclick=async()=>{const r=await supabaseClient.rpc('claim_coin_streak');if(r.error)toast(r.error.message);else{toast(r.data.claimed?('+'+r.data.bonus+' Coins 🔥'): 'خديتي Bonus اليوم من قبل');renderTab('streak');if(window.loadProfile)await loadProfile()}};
    }
    if(tab==='mystery'){
      p.innerHTML=`<div class="u-card mystery-evo-card"><h3>🎁 Mystery Box Evolution</h3><p>Bronze → Silver → Gold → Epic → Elite → Legendary</p><div class="mystery-ladder"><span>🥉</span><i>→</i><span>🥈</span><i>→</i><span>🥇</span><i>→</i><span>💜</span><i>→</i><span>💎</span><i>→</i><span>👑</span></div><p class="muted">كل مستوى يقدر يفتح rewards أكثر ندرة، jackpots، effects وcollections.</p><button class="primary-btn" onclick="showToast('سير لصفحة Coins باش تفتح Mystery Boxes 🎁')">فتح الصناديق</button></div>`;
    }
  }

  function boot(){
    ensurePage();
    const originalShow=window.showApp;
    // App is already visible when this script loads; initialize once.
    const tryInit=()=>{if(window.currentUser){renderTab('power')}else setTimeout(tryInit,1000)};
    tryInit();
  }
  boot();
})();