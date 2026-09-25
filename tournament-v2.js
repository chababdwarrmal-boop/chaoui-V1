/* CHAoui Tournaments V2 — discovery-first tournament experience */
(() => {
  "use strict";

  let tv2Filter = "all";
  let tv2Query = "";

  const esc = (v) => window.escapeHTML ? window.escapeHTML(v ?? "") : String(v ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const labelStatus = (s) => ({draft:"مسودة",open:"مفتوحة",live:"مباشرة 🔴",paused:"متوقفة",done:"منتهية",cancelled:"ملغاة"}[s] || s || "");
  const labelFormat = (s) => ({direct:"إقصاء مباشر",groups:"مجموعات",groups_knockout:"مجموعات + إقصائيات"}[s] || s || "eFootball");
  const date = (v) => { try { return v ? new Date(v).toLocaleDateString("ar-MA",{day:"2-digit",month:"short",year:"numeric"}) : "الموعد غير محدد"; } catch { return "الموعد غير محدد"; } };
  const time = (v) => { try { return v ? new Date(v).toLocaleTimeString("ar-MA",{hour:"2-digit",minute:"2-digit"}) : ""; } catch { return ""; } };

  function ensureShell() {
    const page = document.getElementById("tournaments");
    const list = document.getElementById("tournamentsList");
    if (!page || !list || page.dataset.tv2Ready) return;
    page.dataset.tv2Ready = "1";

    const oldTabs = page.querySelector(".filter-tabs");
    if (oldTabs) oldTabs.outerHTML = `
      <div class="tv2-discover-head">
        <div class="tv2-tabs" id="tv2Tabs">
          <button class="active" data-tv2-filter="all">الكل</button>
          <button data-tv2-filter="open">🟢 مفتوحة</button>
          <button data-tv2-filter="live">🔴 مباشرة</button>
          <button data-tv2-filter="mine">👤 ديالي</button>
          <button data-tv2-filter="done">🏁 منتهية</button>
        </div>
        <div class="tv2-search-wrap"><span>⌕</span><input id="tv2Search" placeholder="قلب على بطولة..." autocomplete="off"></div>
      </div>
      <div class="tv2-stats" id="tv2Stats"></div>
      <div class="tv2-feature" id="tv2Feature"></div>
    `;

    list.classList.add("tv2-grid");
    page.querySelector("#tv2Tabs")?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tv2-filter]");
      if (!b) return;
      tv2Filter = b.dataset.tv2Filter;
      page.querySelectorAll("[data-tv2-filter]").forEach(x => x.classList.toggle("active", x === b));
      render();
    });
    page.querySelector("#tv2Search")?.addEventListener("input", (e) => { tv2Query = e.target.value.trim().toLowerCase(); render(); });
  }

  async function getMineIds() {
    if (!currentUser) return new Set();
    const { data } = await supabaseClient.from("tournament_players").select("tournament_id").eq("player_id", currentUser.id);
    return new Set((data || []).map(x => x.tournament_id));
  }

  function card(t, mine) {
    const used = Number(t.current_players || 0), cap = Number(t.capacity || 0);
    const left = Math.max(0, cap - used);
    const pct = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0;
    const full = cap > 0 && used >= cap;
    const canJoin = t.status === "open" && !mine && !full;
    return `
      <article class="tv2-card ${t.status === "live" ? "is-live" : ""}">
        <div class="tv2-card-top">
          <span class="tv2-status ${esc(t.status)}">${esc(labelStatus(t.status))}</span>
          <span class="tv2-entry">${t.entry_type === "premium" ? "💎 Premium" : "🆓 Free"}</span>
        </div>
        <div class="tv2-title-row"><div class="tv2-game-icon">🏆</div><div><h3>${esc(t.name)}</h3><p>${esc(t.description || "بطولة eFootball تنافسية")}</p></div></div>
        <div class="tv2-info-row">
          <span>🎮 ${esc(labelFormat(t.format))}</span>
          <span>📅 ${esc(date(t.start_at))}</span>
          <span>⏰ ${esc(time(t.start_at))}</span>
        </div>
        <div class="tv2-capacity">
          <div><span>المقاعد</span><strong>${used}/${cap || "∞"}</strong></div>
          <small>${full ? "البطولة عامرة" : left + " بلاصة باقية"}</small>
        </div>
        <div class="tv2-progress"><span style="width:${pct}%"></span></div>
        <div class="tv2-card-actions">
          <button class="secondary-btn" type="button" data-tv2-open="${esc(t.id)}">التفاصيل</button>
          ${mine ? '<span class="tv2-joined">✓ مسجل</span>' : canJoin ? '<button class="primary-small" type="button" data-tv2-join="' + esc(t.id) + '">دخل للبطولة 🔥</button>' : '<span class="tv2-locked">' + (full ? "مكتملة" : "التسجيل مسدود") + '</span>'}
        </div>
      </article>`;
  }

  async function render() {
    ensureShell();
    const list = document.getElementById("tournamentsList");
    if (!list) return;
    list.innerHTML = '<div class="loading-card">كنقلبو ليك على البطولات...</div>';
    const [rows, mine] = await Promise.all([fetchTournaments(), getMineIds()]);
    const visible = (rows || []).filter(t => {
      if (t.status === "cancelled" && tv2Filter !== "done") return false;
      if (tv2Filter === "mine" && !mine.has(t.id)) return false;
      if (tv2Filter !== "all" && tv2Filter !== "mine" && t.status !== tv2Filter) return false;
      if (tv2Query && !(String(t.name || "").toLowerCase().includes(tv2Query) || String(t.description || "").toLowerCase().includes(tv2Query) || String(labelFormat(t.format)).toLowerCase().includes(tv2Query))) return false;
      return true;
    });

    const stats = document.getElementById("tv2Stats");
    const active = (rows || []).filter(t => ["open","live"].includes(t.status));
    if (stats) stats.innerHTML = [
      ["🏆", rows.length, "بطولات"],
      ["🟢", rows.filter(t => t.status === "open").length, "مفتوحة"],
      ["🔴", rows.filter(t => t.status === "live").length, "مباشرة"],
      ["👤", mine.size, "مسجل فيها"]
    ].map(x => '<div><span>' + x[0] + '</span><strong>' + x[1] + '</strong><small>' + x[2] + '</small></div>').join("");

    const feature = document.getElementById("tv2Feature");
    const featured = active.sort((a,b) => {
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;
      return Number(b.current_players || 0) - Number(a.current_players || 0);
    })[0];
    if (feature && featured && !tv2Query && tv2Filter === "all") {
      const left = Math.max(0, Number(featured.capacity || 0) - Number(featured.current_players || 0));
      feature.innerHTML = '<div><span class="tv2-feature-kicker">⚡ FEATURED TOURNAMENT</span><h2>' + esc(featured.name) + '</h2><p>' + esc(featured.description || "الفرصة الجاية باش تدخل المنافسة.") + '</p><div class="tv2-feature-meta"><span>' + esc(labelStatus(featured.status)) + '</span><span>' + esc(labelFormat(featured.format)) + '</span><span>' + left + ' بلايص</span></div></div><button class="primary-btn" type="button" data-tv2-open="' + esc(featured.id) + '">شوف البطولة</button>';
    } else if (feature) feature.innerHTML = "";

    if (!visible.length) {
      list.innerHTML = '<div class="empty-card tv2-empty"><strong>ما لقيناش بطولة بهاد الاختيار.</strong><small>بدل الفلتر أو قلب باسم البطولة.</small></div>';
      return;
    }
    list.innerHTML = visible.map(t => card(t, mine.has(t.id))).join("");
  }

  async function openDetail(id) {
    const { data: t, error } = await supabaseClient.from("tournaments").select("*").eq("id", id).single();
    if (error || !t) return showToast("ما قدرناش نجيبو البطولة.");
    const { data: participants } = await supabaseClient.from("tournament_players").select("id,player_id,status,created_at,profiles:player_id(display_name,username)").eq("tournament_id", id).order("created_at",{ascending:true});
    const rows = participants || [];
    const mine = !!currentUser && rows.some(x => x.player_id === currentUser.id);
    const left = Math.max(0, Number(t.capacity || 0) - Number(t.current_players || rows.length));
    const pct = Number(t.capacity) ? Math.min(100, Math.round((Number(t.current_players || rows.length) / Number(t.capacity)) * 100)) : 0;
    const roster = rows.slice(0, 12).map((x,i) => '<div class="tv2-roster-row"><span>' + (i+1) + '</span><strong>' + esc(x.profiles?.display_name || x.profiles?.username || "Player") + '</strong><small>' + (x.status === "accepted" ? "مقبول" : "انتظار") + '</small></div>').join("");
    const joinable = t.status === "open" && !mine && left > 0;
    openModal(`
      <div class="tv2-detail">
        <div class="tv2-detail-hero"><button class="modal-close" onclick="closeModal()">×</button><span class="tv2-status ${esc(t.status)}">${esc(labelStatus(t.status))}</span><span class="tv2-entry">${t.entry_type === "premium" ? "💎 Premium" : "🆓 Free"}</span><h2>${esc(t.name)}</h2><p>${esc(t.description || "بطولة eFootball تنافسية.")}</p></div>
        <div class="tv2-detail-body">
          <div class="tv2-detail-stats"><div><strong>${Number(t.current_players || rows.length)}</strong><small>مسجلين</small></div><div><strong>${t.capacity || "∞"}</strong><small>السعة</small></div><div><strong>${left}</strong><small>باقي</small></div><div><strong>${esc(labelFormat(t.format))}</strong><small>النظام</small></div></div>
          <div class="tv2-detail-progress"><div><span style="width:${pct}%"></span></div><small>${Number(t.current_players || rows.length)} / ${t.capacity || "∞"} لاعب</small></div>
          <div class="tv2-detail-grid"><div><span>📅 البداية</span><strong>${esc(date(t.start_at))}</strong></div><div><span>⏰ الساعة</span><strong>${esc(time(t.start_at) || "غير محددة")}</strong></div><div><span>🎮 اللعبة</span><strong>${esc(t.game || "eFootball")}</strong></div><div><span>🏆 الحالة</span><strong>${esc(labelStatus(t.status))}</strong></div></div>
          <section class="tv2-roster"><div class="tv2-roster-head"><h3>👥 المشاركون</h3><span>${rows.length}</span></div>${roster || '<div class="tv2-roster-empty">مازال ما تسجل حتى لاعب.</div>'}</section>
          <div class="tv2-detail-actions">${mine ? '<div class="success-box">✅ نتا مسجل فهاد البطولة.</div>' : joinable ? '<button class="primary-btn" id="tv2JoinDetail">التسجيل فالبطولة 🔥</button>' : '<div class="empty-card">' + (t.status === "open" ? "البطولة عامرة." : "التسجيل ما مفتوحش دابا.") + '</div>'}</div>
        </div>
      </div>`);
    document.getElementById("tv2JoinDetail")?.addEventListener("click", () => joinTournament(id));
  }

  function boot() {
    ensureShell();
    document.addEventListener("click", (e) => {
      const open = e.target.closest("[data-tv2-open]");
      const join = e.target.closest("[data-tv2-join]");
      if (open) openDetail(open.dataset.tv2Open);
      if (join) joinTournament(join.dataset.tv2Join);
    });
    const original = window.renderTournaments;
    window.renderTournaments = render;
    window.openTournament = openDetail;
    setTimeout(() => {
      const page = document.getElementById("tournaments");
      if (page?.classList.contains("active-page")) render();
    }, 250);
  }

  boot();
})();