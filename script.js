/* =========================================================
   CHAOUI 🔥
   SUPABASE APP — V4
   FIXED AUTH + PROFILE LOADING
   Owner / Organizer / Player
   ========================================================= */

const SUPABASE_URL = "https://zgbepqqrqcnuhonsdujv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_QyqKhwv1nEFX8ltm0bbAqQ_4LOs7GAY";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;
let currentProfile = null;
let currentPlayerPrivate = null;

let selectedRole = "player";
let currentTournamentFilter = "all";
let currentRankingType = "rating";

let currentPageId = "home";
let pageHistory = [];

let kingPlayersCache = [];

let authLoading = false;
let currentChatId = null;
let chatRealtimeChannel = null;


/* =========================================================
   FEATURE / LEVEL CONFIG
   ========================================================= */

const LEVEL_FEATURES = {
  2: ["player_search"], 3: ["advanced_stats"], 4: ["custom_badge"], 5: ["priority_registration"],
  6: ["streak_shield"], 7: ["reward_shop"], 8: ["title_customization"], 10: ["tournament_analytics"], 12: ["player_card_studio"], 15: ["private_match_rooms"]
};


const FEATURE_LABELS = {

  player_search: {
    icon: "🔍",
    label: "البحث على لاعبين آخرين"
  },

  advanced_stats: {
    icon: "📊",
    label: "إحصائيات متقدمة"
  },

  custom_badge: {
    icon: "🎖️",
    label: "شارة وإطار خاص"
  },

  priority_registration: { icon: "⭐", label: "أولوية فالتسجيل بالبطولات" },
  streak_shield: { icon: "🛡️", label: "Streak Shield — حماية السلسلة مرة واحدة" },
  reward_shop: { icon: "🛍️", label: "Reward Shop — متجر المكافآت" },
  title_customization: { icon: "🏷️", label: "تخصيص اللقب والهوية" },
  tournament_analytics: { icon: "📈", label: "تحليلات البطولات المتقدمة" },
  player_card_studio: { icon: "🎨", label: "Player Card Studio" },
  private_match_rooms: { icon: "🔐", label: "غرف مباريات خاصة" }

};


const ALL_OWNER_FEATURES = [
  "advanced_brackets","advanced_stats","broadcast_announcements","champion_badge",
  "coin_booster","custom_badge","daily_missions","elite_card_effects","match_insights",
  "moderation_center","organizer_analytics","player_card_studio","player_search",
  "priority_registration","private_match_rooms","profile_showcase","report_export",
  "reward_shop","season_rankings","smart_scheduling","staff_roles","streak_shield",
  "title_customization","tournament_analytics","tournament_branding"
];


const PREMIUM_FEATURES = [

  {
    icon: "🕐",
    label: "تغيير موعد المباراة بحرية"
  },

  {
    icon: "📊",
    label: "إحصائيات متقدمة كاملة"
  },

  {
    icon: "💎",
    label: "شارة Premium مميزة"
  },

  {
    icon: "⭐",
    label: "أولوية فالتسجيل بالبطولات"
  },

  {
    icon: "🎧",
    label: "دعم مباشر وسريع من Owner"
  }

];


/* =========================================================
   FEATURES
   ========================================================= */

function getUnlockedFeatures(profile) {

  if (!profile) return [];

  const unlocked = new Set();

  // Owner has full feature access regardless of level.
  if (profile.role === "owner") {
    ALL_OWNER_FEATURES.forEach(feature => unlocked.add(feature));
    Object.keys(FEATURE_LABELS).forEach(feature => unlocked.add(feature));
    return Array.from(unlocked);
  }

  const level = Number(profile.level) || 1;

  Object.keys(LEVEL_FEATURES).forEach(lvl => {

    if (level >= Number(lvl)) {

      LEVEL_FEATURES[lvl].forEach(feature => {
        unlocked.add(feature);
      });

    }

  });

  (profile.feature_overrides || []).forEach(feature => {
    unlocked.add(feature);
  });

  return Array.from(unlocked);
}


function hasFeature(profile, key) {

  return getUnlockedFeatures(profile).includes(key);

}


function isOrganizerActive(profile) {

  if (!profile) return false;

  if (profile.role === "owner") {
    return true;
  }

  return !!(
    profile.role === "organizer" &&
    profile.organizer_expires_at &&
    new Date(profile.organizer_expires_at) > new Date()
  );

}


/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {

  return document.getElementById(id);

}


function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function showMessage(message, type = "info") {

  const box = $("authMessage");

  if (!box) return;

  box.textContent = message;
  box.className = `auth-message ${type}`;

  setTimeout(() => {

    if (box) {

      box.textContent = "";
      box.className = "auth-message";

    }

  }, 5000);

}


function showToast(message) {

  let toast = document.querySelector(".chaoui-toast");

  if (!toast) {

    toast = document.createElement("div");

    toast.className = "chaoui-toast";

    document.body.appendChild(toast);

  }

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toast._timer);

  toast._timer = setTimeout(() => {

    toast.classList.remove("show");

  }, 2800);

}


function formatDate(date) {

  if (!date) {
    return "غير محدد";
  }

  try {

    return new Date(date).toLocaleString("ar-MA", {
      dateStyle: "medium",
      timeStyle: "short"
    });

  } catch {

    return new Date(date).toLocaleString();

  }

}


function getInitials(name = "C") {

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(x => x[0])
    .join("")
    .toUpperCase() || "C";

}


function levelBadgeClass(level) {

  const lvl = Number(level) || 1;

  if (lvl >= 5) return "level-5";
  if (lvl === 4) return "level-4";
  if (lvl === 3) return "level-3";
  if (lvl === 2) return "level-2";

  return "level-1";

}


/* =========================================================
   MODAL
   ========================================================= */

function openModal(html) {

  const modal = $("modal");
  const content = $("modalContent");

  if (!modal || !content) return;

  content.innerHTML = html;

  modal.classList.add("show");

}


function closeModal() {

  const modal = $("modal");

  if (modal) {
    modal.classList.remove("show");
  }

}


document.addEventListener("click", event => {

  if (event.target === $("modal")) {
    closeModal();
  }

});


document.addEventListener("keydown", event => {

  if (event.key === "Escape") {
    closeModal();
  }

});


/* =========================================================
   SPLASH
   ========================================================= */

function initSplash() {

  const splash = $("splash");
  const progress = $("splashProgress");
  const skip = $("skipSplash");

  if (!splash) return;

  const TOTAL_DURATION = 4200;
  const SKIP_AFTER = 1200;

  const startedAt = Date.now();

  let finished = false;

  const message = $("splashMessage");
  const messages = [
    "هنا كتبدأ المنافسة الحقيقية.",
    "واجه، ربح، طلع فـRanking. 🔥",
    "كل ماتش كيزيدك خطوة.",
    "CHAOUI PRO — لعبتك، ترتيبك، قصتك."
  ];
  let messageIndex = 0;
  if (message) {
    message.textContent = messages[0];
    const messageTimer = setInterval(() => {
      if (finished) {
        clearInterval(messageTimer);
        return;
      }
      messageIndex = (messageIndex + 1) % messages.length;
      message.animate(
        [{opacity:.25, transform:"translateY(4px)"},{opacity:1, transform:"translateY(0)"}],
        {duration:280, easing:"ease-out"}
      );
      message.textContent = messages[messageIndex];
    }, 900);
  }

  function enterApp() {

    if (finished) return;

    finished = true;

    splash.classList.remove("show");

    setTimeout(() => {

      splash.style.display = "none";

    }, 700);

  }

  const timer = setInterval(() => {

    const elapsed = Date.now() - startedAt;

    const percent =
      Math.min(100, (elapsed / TOTAL_DURATION) * 100);

    if (progress) {
      progress.style.width = `${percent}%`;
    }

    if (elapsed >= SKIP_AFTER && skip) {
      skip.style.display = "block";
    }

    if (elapsed >= TOTAL_DURATION) {

      clearInterval(timer);

      enterApp();

    }

  }, 50);


  if (skip) {
    skip.addEventListener("click", enterApp);
  }

}


/* =========================================================
   AUTH UI
   ========================================================= */

function showLoginForm() {

  const login = $("loginBox");
  const register = $("registerBox");

  if (login) {
    login.style.display = "block";
  }

  if (register) {
    register.style.display = "none";
  }

}


async function resetPassword() {
  const email = $("loginEmail")?.value.trim().toLowerCase();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    showMessage("دخل الإيميل ديالك الأول.", "error");
    return;
  }

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });

    if (error) throw error;

    showMessage(
      "تصيفط رابط تغيير كلمة السر للإيميل ديالك. شوف Inbox وSpam 📩",
      "success"
    );
  } catch (error) {
    console.error("PASSWORD RESET ERROR:", error);
    const raw = String(error?.message || error || "");
    showMessage(
      raw.includes("redirect") || raw.includes("not allowed")
        ? "رابط الاسترجاع مازال ما مضافش فـ Supabase. خاصنا نضيفو فـ Auth URL Configuration."
        : raw,
      "error"
    );
  }
}

async function handlePasswordRecovery() {
  const password = window.prompt("دخل كلمة السر الجديدة (6 أحرف على الأقل):");
  if (!password) return;
  if (password.length < 6) {
    showMessage("كلمة السر خاصها تكون 6 أحرف على الأقل.", "error");
    return;
  }

  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) {
    showMessage(error.message || "ما قدرناش نبدلو كلمة السر.", "error");
    return;
  }

  showMessage("تبدلات كلمة السر بنجاح ✅ دابا دخل بها.", "success");
  await supabaseClient.auth.signOut();
  showLoginForm();
}

function showRegisterForm() {

  const login = $("loginBox");
  const register = $("registerBox");

  if (login) {
    login.style.display = "none";
  }

  if (register) {
    register.style.display = "block";
  }

}


/* =========================================================
   REGISTER
   ========================================================= */

async function registerUser() {

  const username =
    $("registerUsername")?.value.trim();

  const displayName =
    $("registerDisplayName")?.value.trim();

  const email =
    $("registerEmail")?.value.trim().toLowerCase();

  const password =
    $("registerPassword")?.value;


  if (!username) {

    showMessage(
      "دخل اسم المستخدم.",
      "error"
    );

    return;

  }


  if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(username)) {

    showMessage(
      "اسم المستخدم خاصو يكون بين 3 و24 حرف/رقم وبدون مسافات.",
      "error"
    );

    return;

  }


  if (!displayName) {

    showMessage(
      "دخل الاسم الظاهر ديالك.",
      "error"
    );

    return;

  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {

    showMessage(
      "دخل بريد إلكتروني صحيح.",
      "error"
    );

    return;

  }


  if (!password || password.length < 6) {

    showMessage(
      "كلمة السر خاصها تكون 6 أحرف على الأقل.",
      "error"
    );

    return;

  }


  const button = $("registerBtn");

  if (button) {

    button.disabled = true;
    button.textContent = "جاري إنشاء الحساب...";

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signUp({

        email,

        password,

        options: {

          data: {
            username,
            display_name: displayName
          }

        }

      });


    if (error) {
      throw error;
    }


    if (!data.user) {

      throw new Error(
        "ما قدرناش ننشئو الحساب."
      );

    }


    /*
       IMPORTANT:
       We do not create owner from the frontend.
       Every normal registration starts as player.
    */

    /*
       If email confirmation is disabled,
       Supabase may already give us a session.
    */

    if (data.session) {

      currentUser = data.user;

      await loadProfile();

      if (!currentProfile) {

        showMessage(
          "الحساب تخلق ولكن البروفايل ما تحمّلش. راجع Supabase RLS.",
          "error"
        );

        return;

      }

      showApp();

      showToast(
        "مرحبا بك فـ CHAOUI 🔥"
      );

      return;

    }


    /*
       If email confirmation is enabled,
       tell the user clearly instead of pretending
       that the account is a guest.
    */

    showMessage(
      "الحساب تخلق بنجاح ✅ إلا كان تأكيد البريد مفعّل فـ Supabase خاص الحساب يتأكد أولاً.",
      "success"
    );

    showLoginForm();

    const loginEmail =
      $("loginEmail");

    const loginPassword =
      $("loginPassword");

    if (loginEmail) {
      loginEmail.value = email;
    }

    if (loginPassword) {
      loginPassword.value = password;
    }


  } catch (error) {

    console.error(error);

    let message =
      error.message ||
      "وقع خطأ.";


    if (
      message
        .toLowerCase()
        .includes("already registered") ||
      message
        .toLowerCase()
        .includes("already exists")
    ) {

      message =
        "اسم المستخدم هادا مستعمل من قبل.";

    }


    if (
      message
        .toLowerCase()
        .includes("rate limit")
    ) {

      message =
        "وصلنا للحد الأقصى ديال المحاولات، تسنى شوية وعاود.";

    }


    showMessage(
      message,
      "error"
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "إنشاء الحساب";

    }

  }

}


/* =========================================================
   LOGIN
   ========================================================= */

async function loginUser() {

  if (authLoading) {
    return;
  }

  const email =
    $("loginEmail")?.value.trim().toLowerCase();

  const password =
    $("loginPassword")?.value;


  if (!email || !password) {

    showMessage(
      "دخل البريد الإلكتروني وكلمة السر.",
      "error"
    );

    return;

  }


  const button = $("loginBtn");


  if (button) {

    button.disabled = true;

    button.textContent =
      "جاري الدخول...";

  }


  authLoading = true;


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithPassword({

        email,

        password

      });


    if (error) {
      throw error;
    }


    if (!data?.user) {

      throw new Error(
        "الحساب ما رجعش من Supabase."
      );

    }


    currentUser = data.user;


    /*
       VERY IMPORTANT:
       Load the real profile BEFORE showApp().
    */

    const profile =
      await loadProfile();


    /*
       If profile does not exist,
       DO NOT turn the user into guest.
    */

    if (!profile) {

      console.error(
        "LOGIN SUCCESS BUT PROFILE IS MISSING."
      );

      showMessage(
        "دخلتي للحساب ولكن البروفايل ديالك ما لقايناهش. خاص إصلاح جدول profiles أو RLS فـ Supabase.",
        "error"
      );

      return;

    }


    /*
       Now we know who the user really is:
       owner / organizer / player
    */

    showApp();


    showToast(
      `مرحبا ${profile.display_name || profile.username} 🔥`
    );


  } catch (error) {

    console.error("LOGIN ERROR:", error);

    const raw = String(error?.message || error || "").toLowerCase();
    let message = "تعذر تسجيل الدخول.";

    if (raw.includes("invalid login credentials")) {
      message = "البريد الإلكتروني أو كلمة السر غير صحيحة.";
    } else if (raw.includes("email not confirmed")) {
      message = "خاصك تأكد البريد الإلكتروني ديالك قبل الدخول.";
    } else if (raw.includes("too many requests") || raw.includes("rate limit")) {
      message = "كاينين محاولات كثيرة. تسنى شوية وعاود.";
    } else if (raw.includes("network") || raw.includes("fetch")) {
      message = "كاين مشكل فالاتصال بـ Supabase. تأكد من الإنترنت وعاود.";
    } else if (error?.message) {
      message = error.message;
    }

    showMessage(message, "error");


  } finally {

    authLoading = false;

    if (button) {

      button.disabled = false;

      button.textContent =
        "دخول";

    }

  }

}


/* =========================================================
   LOAD PROFILE
   ========================================================= */

async function loadProfile() {
  if (!currentUser) {
    currentProfile = null;
    return null;
  }

  try {
    // Backend-owned profile resolution. This works for PLAYER and OWNER
    // without trusting frontend role values or relying on an INSERT from the browser.
    const { data: ensured, error: ensureError } =
      await supabaseClient.rpc("ensure_my_profile");

    if (!ensureError && ensured) {
      currentProfile = ensured;
      await loadPlayerPrivate();
      return currentProfile;
    }

    if (ensureError) {
      console.error("ENSURE PROFILE ERROR:", ensureError);
    }

    // Safe read fallback for an already-existing profile.
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.error("PROFILE ERROR:", error);
      currentProfile = null;
      return null;
    }

    if (data) {
      currentProfile = data;
      await loadPlayerPrivate();
      return currentProfile;
    }

    currentProfile = null;
    return null;
  } catch (error) {
    console.error("LOAD PROFILE CRASH:", error);
    currentProfile = null;
    return null;
  }
}

/* =========================================================
   PLAYER PRIVATE
   ========================================================= */

async function loadPlayerPrivate() {

  if (!currentUser) {

    currentPlayerPrivate = null;

    return null;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("player_private")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();


  if (error) {

    console.error(
      "PRIVATE ERROR:",
      error
    );

    currentPlayerPrivate = null;

    return null;

  }


  currentPlayerPrivate =
    data || null;


  return currentPlayerPrivate;

}


/* =========================================================
   SHOW APP
   ========================================================= */

function showApp() {

  const auth =
    $("authScreen");

  const app =
    $("app");


  if (auth) {
    auth.style.display = "none";
  }


  if (app) {
    app.style.display = "block";
  }


  renderCurrentUser();

  updateRoleAccess();


  pageHistory = [];

  currentPageId =
    "home";


  showPage(
    "home",
    {
      fromBack: true
    }
  );


  renderHomeTournaments();
  renderHomeDashboard();

  renderTournaments();

  renderMatches();

  renderRanking();

  renderProfile();

  renderNotifications();

  renderPremium();

  renderComplaints();

  renderHall();

  renderOrganizer();

  renderKing();

}


/* =========================================================
   USER UI
   ========================================================= */

function renderCurrentUser() {

  const profile =
    currentProfile;


  /*
     ONLY show زائر when there is genuinely
     no logged-in user.
  */

  if (!currentUser) {

    if ($("headerName")) {
      $("headerName").textContent =
        "زائر";
    }

    if ($("headerRole")) {
      $("headerRole").textContent =
        "زائر";
    }

    if ($("homeName")) {
      $("homeName").textContent =
        "زائر 👀";
    }

    return;

  }


  /*
     Logged-in user but profile missing.
     Never call him guest.
  */

  if (!profile) {

    if ($("headerName")) {
      $("headerName").textContent =
        currentUser.email?.split("@")[0] ||
        "Player";
    }

    if ($("headerRole")) {
      $("headerRole").textContent =
        "👤 لاعب";
    }

    if ($("homeName")) {
      $("homeName").textContent =
        "Player";
    }

    return;

  }


  const name =
    profile.display_name ||
    profile.username ||
    "CHAOUI Player";


  if ($("headerName")) {

    $("headerName").textContent =
      name;

  }


  if ($("headerRole")) {

    $("headerRole").textContent =
      getRoleLabel(profile.role);

  }


  if ($("headerAvatar")) {

    $("headerAvatar").textContent =
      getInitials(name);

  }


  if ($("homeName")) {

    $("homeName").textContent =
      name;

  }

}


/* =========================================================
   ROLE LABEL
   ========================================================= */

function getRoleLabel(role) {

  if (role === "owner") {
    return "المالك";
  }

  if (role === "organizer") {
    return "منظم";
  }

  return "لاعب";

}


/* =========================================================
   ROLE ACCESS
   ========================================================= */

function updateRoleAccess() {

  const organizerShortcut =
    $("organizerShortcut");

  const kingShortcut =
    $("kingShortcut");


  if (organizerShortcut) {

    organizerShortcut.style.display =
      isOrganizerActive(currentProfile)
        ? "block"
        : "none";

  }


  if (kingShortcut) {

    kingShortcut.style.display =
      currentProfile?.role === "owner"
        ? "block"
        : "none";

  }

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function showPage(pageId, opts = {}) {

  const fromBack =
    opts.fromBack === true;


  if (
    !fromBack &&
    pageId !== currentPageId
  ) {

    pageHistory.push(
      currentPageId
    );

  }


  currentPageId =
    pageId;


  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.remove(
        "active-page"
      );

    });


  const page =
    $(pageId);


  if (!page) {
    return;
  }


  page.classList.add(
    "active-page"
  );


  document
    .querySelectorAll(".nav-item")
    .forEach(item => {

      item.classList.toggle(
        "active",
        item.dataset.page === pageId
      );

    });


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  updateHeaderNav();


  if (pageId === "home") {
    renderHomeTournaments();
    renderHomeDashboard();
  }

  if (pageId === "tournaments") {
    renderTournaments();
  }

  if (pageId === "matches") {
    renderMatches();
  }

  if (pageId === "ranking") {
    renderRanking();
  }

  if (pageId === "profile") {
    renderProfile();
  }

  if (pageId === "notifications") {
    renderNotifications();
  }

  if (pageId === "complaints") {
    renderComplaints();
  }

  if (pageId === "hall") {
    renderHall();
  }

  if (pageId === "progression") {
    renderProgression();
  }

  if (pageId === "search") {
    renderPlayerSearch();
  }

  if (pageId === "organizer") {
    renderOrganizer();
  }

  if (pageId === "king") {
    renderKing();
  }

  if (pageId === "wallet") {
    renderWallet();
  }

  if (pageId === "chat") {
    renderConversations();
  }

  if (pageId === "clubs") {
    renderClubs();
  }

  if (pageId === "season") {
    renderSeason();
  }

  if (pageId === "feed") {
    renderActivityFeed();
  }

  if (pageId === "assistant") {
    initAssistant();
  }

}


function goBack() {

  const prev =
    pageHistory.pop();


  if (prev) {

    showPage(
      prev,
      {
        fromBack: true
      }
    );

  } else {

    showPage(
      "home",
      {
        fromBack: true
      }
    );

  }

}


function updateHeaderNav() {

  const backBtn =
    $("headerBackBtn");


  if (backBtn) {

    backBtn.style.visibility =
      (
        pageHistory.length &&
        currentPageId !== "home"
      )
        ? "visible"
        : "hidden";

  }

}


/* =========================================================
   TOURNAMENTS
   ========================================================= */

async function fetchTournaments() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("tournaments")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    return [];

  }


  return data || [];

}


function tournamentStatusLabel(status) {

  const labels = {

    draft: "مسودة",

    open: "مفتوحة",

    live: "مباشرة 🔴",

    paused: "متوقفة",

    done: "منتهية",

    cancelled: "ملغاة"

  };


  return labels[status] ||
    status ||
    "";

}


function tournamentFormatLabel(format) {

  const labels = {

    direct: "إقصاء مباشر",

    groups: "مجموعات",

    groups_knockout:
      "مجموعات + إقصائيات"

  };


  return labels[format] ||
    format;

}


async function renderHomeTournaments() {

  const box =
    $("homeTournaments");


  if (!box) {
    return;
  }


  box.innerHTML =
    `<div class="loading-card">جاري تحميل البطولات...</div>`;


  const tournaments =
    await fetchTournaments();


  const visible =
    tournaments
      .filter(t => t.status !== "cancelled")
      .slice(0, 3);


  if (!visible.length) {

    box.innerHTML =
      `<div class="empty-card">ما كايناش بطولات دابا.</div>`;

    return;

  }


  box.innerHTML =
    visible
      .map(tournamentCardHTML)
      .join("");

}



async function renderHomeDashboard() {
  const p = currentProfile;
  const level = Number(p?.level || 1);
  const xp = Number(p?.xp || 0);
  const levelBase = 100;
  const xpInto = xp % levelBase;
  const xpPct = Math.min(100, Math.round((xpInto / levelBase) * 100));
  const set = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  set("homeLevelValue", `LV.${level}`);
  set("homeXPText", `${xpInto} / ${levelBase} XP`);
  const xpBar = $("homeXPBar"); if (xpBar) xpBar.style.width = `${xpPct}%`;
  set("homeWinsValue", Number(p?.wins || 0));
  set("homePointsValue", Number(p?.points || 0));
  set("homeCoinsValue", Number(p?.coins || 0));

  const featureBox = $("homeFeatureGrid");
  if (featureBox) {
    const featureRows = [
      [2, "🔎", "Player Search", "قلب على اللاعبين"],
      [3, "📈", "Advanced Stats", "إحصائيات أعمق"],
      [4, "🎖️", "Custom Badge", "شارة خاصة"],
      [7, "🛍️", "Reward Shop", "متجر المكافآت"],
      [10, "📊", "Tournament Analytics", "تحليلات البطولات"],
      [12, "🎨", "Player Card Studio", "كارت لاعب احترافي"],
      [15, "🔐", "Private Match Rooms", "غرف خاصة"],
      [18, "👑", "Champion Badge", "شارة الأبطال"]
    ];
    featureBox.innerHTML = featureRows.slice(0, 6).map(([req, icon, title, desc]) => {
      const unlocked = level >= req;
      return `<article class="home-feature ${unlocked ? "unlocked" : ""}"><span class="icon">${icon}</span><strong>${title}</strong><small>${unlocked ? "مفتوحة دابا ✅" : `كتتحل فـ Level ${req}`}</small></article>`;
    }).join("");
  }

  const organizerPanel = $("homeOrganizerPanel");
  const organizerContent = $("homeOrganizerContent");
  if (organizerPanel && organizerContent) {
    const active = isOrganizerActive(p);
    organizerPanel.style.display = active ? "block" : "none";
    if (active) {
      const { data: ts } = await supabaseClient.from("tournaments").select("id,status,current_players,capacity").eq("organizer_id", currentUser.id);
      const tournaments = ts || [];
      const live = tournaments.filter(t => t.status === "live").length;
      const open = tournaments.filter(t => t.status === "open").length;
      const players = tournaments.reduce((sum, t) => sum + Number(t.current_players || 0), 0);
      organizerContent.innerHTML = [
        ["🏆", tournaments.length, "البطولات"],
        ["🔴", live, "مباشرة"],
        ["🟢", open, "مفتوحة"],
        ["👥", players, "تسجيلات"]
      ].map(x => `<article class="org-home-action"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></article>`).join("");
    }
  }

  const feed = $("homeRecentMatches");
  if (!feed) return;
  if (!currentUser) {
    feed.innerHTML = `<div class="empty-card">دخل للحساب باش تبان ليك آخر المباريات.</div>`;
    return;
  }
  const { data: matches, error } = await supabaseClient.from("matches").select("id,player_a,player_b,status,scheduled_at,round,winner_id").or(`player_a.eq.${currentUser.id},player_b.eq.${currentUser.id}`).order("scheduled_at", { ascending: false }).limit(4);
  if (error || !matches?.length) {
    feed.innerHTML = `<div class="empty-card">مازال ما عندك حتى مباراة فالسجل.</div>`;
    return;
  }
  const ids = [...new Set(matches.flatMap(m => [m.player_a, m.player_b]).filter(Boolean))];
  const { data: players } = await supabaseClient.from("profiles").select("id,username,display_name").in("id", ids);
  const map = new Map((players || []).map(x => [x.id, x]));
  feed.innerHTML = matches.map(m => {
    const oppId = m.player_a === currentUser.id ? m.player_b : m.player_a;
    const opp = map.get(oppId);
    const name = opp?.display_name || opp?.username || "المنافس";
    const finished = m.status === "finished";
    const won = finished && m.winner_id === currentUser.id;
    const icon = finished ? (won ? "🏆" : "⚔️") : "⏱️";
    const state = finished ? (won ? "فوز" : "مباراة منتهية") : "قريباً";
    return `<article class="home-feed-item"><div class="home-feed-icon">${icon}</div><div><strong>${escapeHTML(name)}</strong><small>${escapeHTML(m.round || "Match")} · ${escapeHTML(state)} · ${escapeHTML(formatDate(m.scheduled_at))}</small></div><span class="home-feed-score">${finished ? (won ? "+" : "—") : ""}</span></article>`;
  }).join("");
}

function tournamentCardHTML(t) {

  const premium =
    t.entry_type === "premium";


  return `

    <article
      class="tournament-card"
      data-id="${escapeHTML(t.id)}"
    >

      <div class="tournament-top">

        <span
          class="status-badge ${escapeHTML(t.status)}"
        >
          ${escapeHTML(
            tournamentStatusLabel(t.status)
          )}
        </span>

        <span class="entry-badge">
          ${premium ? "💎 Premium" : "🆓 Free"}
        </span>

      </div>


      <h3>
        ${escapeHTML(t.name)}
      </h3>


      <p>
        ${escapeHTML(
          t.description ||
          "بطولة eFootball 1VS1"
        )}
      </p>


      <div class="tournament-meta">

        <span>
          👥 ${t.current_players || 0}/${t.capacity}
        </span>

        <span>
          🎮 eFootball
        </span>

        <span>
          ${escapeHTML(
            tournamentFormatLabel(t.format)
          )}
        </span>

      </div>


      <button
        class="secondary-btn tournament-open-btn"
        data-tournament="${escapeHTML(t.id)}"
        type="button"
      >
        التفاصيل
      </button>

    </article>

  `;

}


async function renderTournaments() {

  const box =
    $("tournamentsList");


  if (!box) {
    return;
  }


  box.innerHTML =
    `<div class="loading-card">جاري تحميل البطولات...</div>`;


  const tournaments =
    await fetchTournaments();


  const filtered =
    currentTournamentFilter === "all"

      ? tournaments

      : tournaments.filter(
          t =>
            t.status ===
            currentTournamentFilter
        );


  if (!filtered.length) {

    box.innerHTML =
      `<div class="empty-card">ما كاين حتى بطولة فهاد القسم.</div>`;

    return;

  }


  box.innerHTML =
    filtered
      .map(tournamentCardHTML)
      .join("");

}


/* =========================================================
   TOURNAMENT DETAILS
   ========================================================= */

async function openTournament(id) {

  const {
    data: tournament,
    error
  } =
    await supabaseClient
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .single();


  if (error || !tournament) {

    showToast(
      "ما قدرناش نجيبو البطولة."
    );

    return;

  }


  let registered = false;


  if (currentUser) {

    const {
      data: registration
    } =
      await supabaseClient
        .from("tournament_players")
        .select("id,status")
        .eq(
          "tournament_id",
          id
        )
        .eq(
          "player_id",
          currentUser.id
        )
        .maybeSingle();


    registered =
      !!registration;

  }


  let organizerControls = "";
  if (isOrganizerActive(currentProfile) && tournament.organizer_id === currentUser?.id) {
    const { data: participants } = await supabaseClient
      .from("tournament_players")
      .select("id,status,player_id,created_at,profiles(username,display_name)")
      .eq("tournament_id", id)
      .order("created_at");
    const participantRows = (participants || []).map((row, index) => {
      const player = row.profiles || {};
      return `<div class="tournament-participant"><span>${index + 1}</span><strong>${escapeHTML(player.display_name || player.username || "Player")}</strong><small>${row.status === "accepted" ? "مقبول ✅" : "انتظار ⏳"}</small></div>`;
    }).join("");
    organizerControls = `<div class="tournament-organizer-tools"><button class="primary-btn" type="button" onclick="startTournamentFromDetail('${escapeHTML(id)}')">🚀 ${tournament.status === "open" ? "بدء البطولة" : "البطولة بدات"}</button><div class="tournament-participants"><h4>👥 المشاركون</h4>${participantRows || "<small>مازال ما تسجل حتى لاعب.</small>"}</div></div>`;
  }

  let organizerContact = "";
  if (tournament.organizer_id && tournament.organizer_id !== currentUser?.id) {
    const { data: organizer } = await supabaseClient.from("profiles").select("id,display_name,username,player_code,profile_badge").eq("id", tournament.organizer_id).maybeSingle();
    if (organizer) organizerContact = `<button class="secondary-btn" type="button" onclick="startChatFromProfile('${escapeHTML(organizer.id)}')">💬 تواصل مع المنظم · ${escapeHTML(organizer.display_name || organizer.username)}</button>`;
  }

  openModal(`

    <div class="modal-head">

      <button
        class="modal-close"
        onclick="closeModal()"
      >
        ×
      </button>

      <span>
        ${
          tournament.entry_type === "premium"
            ? "💎 Premium"
            : "🆓 Free"
        }
      </span>

      <h2>
        ${escapeHTML(tournament.name)}
      </h2>

    </div>


    <div class="modal-body">

      <p>
        ${escapeHTML(
          tournament.description ||
          "بطولة eFootball"
        )}
      </p>


      <div class="modal-info-grid">

        <div>
          <strong>
            ${tournament.current_players || 0}
          </strong>
          <small>
            المشاركين
          </small>
        </div>


        <div>
          <strong>
            ${tournament.capacity}
          </strong>
          <small>
            السعة
          </small>
        </div>


        <div>
          <strong>
            ${escapeHTML(
              tournamentFormatLabel(
                tournament.format
              )
            )}
          </strong>

          <small>
            النظام
          </small>
        </div>

      </div>


      <div class="modal-info">

        <p>
          الحالة:
          <strong>
            ${escapeHTML(
              tournamentStatusLabel(
                tournament.status
              )
            )}
          </strong>
        </p>


        <p>
          البداية:
          <strong>
            ${escapeHTML(
              formatDate(
                tournament.start_at
              )
            )}
          </strong>
        </p>

      </div>


      ${
        registered

          ? `
            <div class="success-box">
              ✅ نتا مسجل فهاد البطولة.
            </div>
          `

          : `
            <button
              class="primary-btn tournament-join-btn"
              onclick="joinTournament('${escapeHTML(id)}')"
              type="button"
            >
              التسجيل فالبطولة 🔥
            </button>
          `
      }

      ${organizerControls}
      ${organizerContact}

      <div class="tournament-detail-note">
        <span>👥 ${Number(tournament.current_players || 0)} / ${Number(tournament.capacity || 0)}</span>
        <span>🎮 ${escapeHTML(tournament.game || "eFootball")}</span>
      </div>

    </div>

  `);

}


async function startTournamentFromDetail(tournamentId) {
  if (!currentUser || !isOrganizerActive(currentProfile)) return showToast("هاد العملية خاصة بالمنظم.");
  const { data, error } = await supabaseClient.rpc("start_tournament", { p_tournament_id: tournamentId });
  if (error) {
    console.error(error);
    const message = error.message || "";
    if (message.includes("NEED_TWO_PLAYERS")) return showToast("خاص البطولة يكون فيها جوج لاعبين على الأقل.");
    if (message.includes("DIRECT_NEEDS_POWER_OF_TWO")) return showToast("الإقصاء المباشر خاصو 2 أو 4 أو 8 أو 16... لاعبين.");
    if (message.includes("TOURNAMENT_ALREADY_STARTED")) return showToast("البطولة بدات من قبل.");
    return showToast("ما قدرناش نبداو البطولة.");
  }
  closeModal();
  showToast(`🔥 البطولة بدات بـ ${Number(data || 0)} مباريات`);
  await renderHomeTournaments();
  await renderTournaments();
  await renderOrganizer();
  await renderMatches();
  await openTournament(tournamentId);
}


/* =========================================================
   JOIN TOURNAMENT
   ========================================================= */

async function joinTournament(tournamentId) {

  if (!currentUser) {

    closeModal();

    showToast(
      "خاصك تدخل للحساب باش تسجل."
    );

    showLoginForm();

    return;

  }


  const {
    data: tournament
  } =
    await supabaseClient
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single();


  if (!tournament) {

    showToast(
      "البطولة ما لقايناش."
    );

    return;

  }


  if (tournament.status !== "open") {

    showToast(
      "التسجيل مسدود دابا."
    );

    return;

  }


  const { data: status, error } = await supabaseClient.rpc("join_tournament", {
    p_tournament_id: tournamentId
  });

  if (error) {
    console.error(error);
    const message = error.message || "";
    if (message.includes("PREMIUM_REQUIRED")) return showToast("هاد البطولة خاصة بـ Premium 💎");
    if (message.includes("JOIN_DISABLED")) return showToast("الانضمام للبطولات موقف مؤقتاً.");
    if (message.includes("REGISTRATION_CLOSED")) return showToast("التسجيل تسد دابا.");
    if (message.includes("NOT_AUTHENTICATED")) return showToast("خاصك تدخل للحساب أولاً.");
    return showToast("وقع مشكل فالتسجيل. عاود المحاولة.");
  }

  closeModal();
  showToast(status === "waitlist" ? "دخلتي للـ Waitlist ⏳" : "تسجلتي مباشرة فالبطولة ✅");
  await renderHomeTournaments();
  await renderTournaments();
  await openTournament(tournamentId);

}


/* =========================================================
   MATCHES
   ========================================================= */

async function renderMatches() {

  const box =
    $("matchesList");


  if (!box) {
    return;
  }


  if (!currentUser) {

    box.innerHTML =
      `<div class="empty-card">دخل للحساب باش تشوف مبارياتك.</div>`;

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("matches")
      .select("*")
      .or(
        `player_a.eq.${currentUser.id},player_b.eq.${currentUser.id}`
      )
      .order(
        "scheduled_at",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(error);

    box.innerHTML =
      `<div class="empty-card">وقع مشكل فتحميل المباريات.</div>`;

    return;

  }


  const matches = data || [];

  const opponentIds = [...new Set(matches.flatMap(m => [m.player_a, m.player_b]).filter(Boolean))];
  const { data: matchPlayers } = opponentIds.length
    ? await supabaseClient.from("profiles").select("id,username,display_name").in("id", opponentIds)
    : { data: [] };
  const playerMap = new Map((matchPlayers || []).map(p => [p.id, p]));
  const matchIds = matches.map(m => m.id);
  const { data: resultRows } = matchIds.length ? await supabaseClient.from("match_results").select("match_id,submitted_by,status").in("match_id", matchIds) : { data: [] };
  const resultMap = new Map((resultRows || []).map(r => [r.match_id, r]));

  const wins =
    matches.filter(
      m =>
        m.winner_id ===
        currentUser.id
    ).length;


  const finished =
    matches.filter(
      m =>
        m.status === "finished"
    ).length;


  const losses =
    Math.max(
      0,
      finished - wins
    );


  const winrate =
    finished > 0
      ? Math.round(
          (wins / finished) * 100
        )
      : 0;


  if ($("matchWins")) {
    $("matchWins").textContent =
      wins;
  }


  if ($("matchLosses")) {
    $("matchLosses").textContent =
      losses;
  }


  if ($("matchWinrate")) {
    $("matchWinrate").textContent =
      `${winrate}%`;
  }


  if (!matches.length) {

    box.innerHTML =
      `<div class="empty-card">ما عندك حتى مباراة دابا.</div>`;

    return;

  }


  box.innerHTML =
    matches.map(match => `

      <article class="match-card">

        <div>

          <span class="match-status">
            ${escapeHTML(match.status === "scheduled" ? "مجدولة" : match.status === "result_submitted" ? "في انتظار التأكيد" : match.status === "finished" ? "منتهية" : match.status)}
          </span>

          <h3>
            ${escapeHTML((playerMap.get(match.player_a === currentUser.id ? match.player_b : match.player_a)?.display_name || playerMap.get(match.player_a === currentUser.id ? match.player_b : match.player_a)?.username || "المنافس"))}
          </h3>
          <small>🏆 ${escapeHTML(match.round || "Match")} · ${escapeHTML(playerMap.get(match.player_a)?.display_name || playerMap.get(match.player_a)?.username || "Player")} × ${escapeHTML(playerMap.get(match.player_b)?.display_name || playerMap.get(match.player_b)?.username || "Player")}</small>

          <small>
            ${escapeHTML(
              formatDate(
                match.scheduled_at
              )
            )}
          </small>

        </div>


        <div class="match-score">

          ${
            match.score_a !== null &&
            match.score_a !== undefined

              ? `${match.score_a} - ${match.score_b}`

              : "VS"
          }

        </div>

        <div class="match-actions">
          ${
            match.status === "scheduled"
              ? `<button class="primary-small" type="button" onclick="openSubmitResult('${escapeHTML(match.id)}')">إدخال النتيجة</button>`
              : match.status === "result_submitted" && resultMap.get(match.id)?.submitted_by !== currentUser.id
                ? `<button class="primary-small" type="button" onclick="confirmSubmittedResult('${escapeHTML(match.id)}')">تأكيد النتيجة</button><button class="secondary-small" type="button" onclick="openMatchDispute('${escapeHTML(match.id)}')">اعتراض</button>`
                : `<small>النتيجة: ${escapeHTML(match.status)}</small>`
          }
          <button class="secondary-small" type="button" onclick="openMatchRoom('${escapeHTML(match.id)}')">💬 Room</button>
        </div>

      </article>

    `).join("");

}


/* =========================================================
   RANKING
   ========================================================= */

async function renderRanking() {
  const box = $("rankingList");
  if (!box) return;
  const { data, error } = await supabaseClient.from("profiles").select("id, username, display_name, avatar_url, rating, wins, losses, draws, points, level, title");
  if (error) { console.error(error); box.innerHTML = '<div class="empty-card">وقع مشكل فتحميل الترتيب.</div>'; return; }
  const players = data || [];
  players.sort((a, b) => {
    if (currentRankingType === "points") return (b.points || 0) - (a.points || 0);
    if (currentRankingType === "wins") return (b.wins || 0) - (a.wins || 0);
    return (b.rating || 0) - (a.rating || 0);
  });
  box.innerHTML = players.slice(0, 50).map((player, index) => {
    const isMe = currentUser?.id === player.id;
    const played = Number(player.wins || 0) + Number(player.losses || 0) + Number(player.draws || 0);
    const winrate = played ? Math.round(Number(player.wins || 0) * 100 / played) : 0;
    const value = currentRankingType === "points"
      ? `${player.points || 0} P`
      : currentRankingType === "wins"
        ? `${player.wins || 0} W`
        : `${player.rating || 0} ELO`;
    return `
      <article class="ranking-row">
        <div class="ranking-position">#${index + 1}</div>
        <div class="ranking-avatar">${escapeHTML(getInitials(player.display_name || player.username))}</div>
        <div class="ranking-player">
          <strong>${escapeHTML(player.display_name || player.username)}</strong>
          <small>@${escapeHTML(player.username || "")} · LV.${Number(player.level || 1)}</small>
        </div>
        <div class="ranking-value">${value}</div>
        <div class="ranking-extra">
          <small>${player.wins || 0}W · ${player.losses || 0}L · ${player.draws || 0}D</small>
          <small>${winrate}% WR</small>
          ${isMe ? '<button class="secondary-btn rating-history-btn" onclick="openRatingHistory()">📈 تاريخ ELO</button>' : ""}
        </div>
      </article>
    `;
  }).join("") || '<div class="empty-card">مازال ما كاين حتى لاعب فالترتيب.</div>';
}

async function openRatingHistory() {
  if (!currentUser) return showToast("دخل للحساب باش تشوف تاريخ ELO.");
  const { data, error } = await supabaseClient
    .from("rating_history")
    .select("id, match_id, opponent_id, result, rating_before, rating_after, rating_delta, opponent_rating_before, created_at")
    .eq("player_id", currentUser.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error(error);
    return showToast("تعذر تحميل تاريخ ELO.");
  }

  const rows = data || [];
  if (!rows.length) {
    return openModal(`
      <div class="modal-head"><h2>📈 تاريخ ELO</h2><button onclick="closeModal()">×</button></div>
      <div class="modal-body"><div class="empty-card">مازال ما تسجل حتى تغيير فـ ELO.</div></div>
    `);
  }

  const deltaClass = d => Number(d) > 0 ? "positive" : Number(d) < 0 ? "negative" : "";
  const html = rows.map((r, i) => `
    <article class="rating-history-row">
      <div><strong>#${rows.length - i}</strong><span>${escapeHTML(r.result || "match")}</span></div>
      <div><small>${formatDate(r.created_at)}</small><small>قبل: ${Number(r.rating_before)} → بعد: ${Number(r.rating_after)}</small></div>
      <strong class="${deltaClass(r.rating_delta)}">${Number(r.rating_delta) > 0 ? "+" : ""}${Number(r.rating_delta)}</strong>
    </article>
  `).join("");

  openModal(`
    <div class="modal-head"><h2>📈 تاريخ ELO ديالك</h2><button onclick="closeModal()">×</button></div>
    <div class="modal-body rating-history-list">
      <p>آخر 30 تغيير فالتقييم. التحديث كيوقع أوتوماتيكياً منين كتتأكد نتيجة الماتش.</p>
      ${html}
    </div>
  `);
}

/* =========================================================
   PROFILE
   ========================================================= */

async function renderProfile() {

  if (!currentProfile) {

    if ($("profileName")) {

      $("profileName").textContent =
        currentUser
          ? "Player"
          : "زائر";

    }


    const th =
      $("profileTournamentHistory");

    const mh =
      $("profileMatchHistory");

    const fb =
      $("profileFeatures");


    if (th) {

      th.innerHTML =
        `<div class="empty-card">دخل للحساب باش تشوف السجل.</div>`;

    }


    if (mh) {
      mh.innerHTML = "";
    }


    if (fb) {
      fb.innerHTML = "";
    }


    return;

  }


  const p =
    currentProfile;


  const name =
    p.display_name ||
    p.username ||
    "CHAOUI Player";


  if ($("profileAvatar")) {

    $("profileAvatar").textContent =
      getInitials(name);

  }


  if ($("profileName")) {

    $("profileName").textContent =
      name;

  }


  if ($("profileUsername")) {

    $("profileUsername").textContent =
      `@${p.username}`;

  }


  if ($("profileTitle")) {

    $("profileTitle").textContent =
      p.title || "مخضرم";

    $("profileTitle").className =
      `profile-title ${levelBadgeClass(p.level)}`;

  }


  if ($("profileWins")) {

    $("profileWins").textContent =
      p.wins || 0;

  }


  if ($("profileLosses")) {

    $("profileLosses").textContent =
      p.losses || 0;

  }


  if ($("profilePoints")) {
    $("profilePoints").textContent = p.points || 0;
  }

  const wins = Number(p.wins || 0);
  const losses = Number(p.losses || 0);
  const draws = Number(p.draws || 0);
  const played = wins + losses + draws;
  const xp = Number(p.xp || 0);
  const level = Number(p.level || 1);
  const levelBase = 100;
  const xpIntoLevel = xp % levelBase;
  const xpPct = Math.min(100, Math.round((xpIntoLevel / levelBase) * 100));
  if ($("profileLevelBadge")) $("profileLevelBadge").textContent = `LV.${level}`;
  if ($("profileXPText")) $("profileXPText").textContent = `${xpIntoLevel} / ${levelBase} XP`;
  if ($("profileXPBar")) $("profileXPBar").style.width = `${xpPct}%`;
  if ($("profileDraws")) $("profileDraws").textContent = draws;
  if ($("profileGoals")) $("profileGoals").textContent = Number(p.goals_for || 0);
  if ($("profileWinrate")) $("profileWinrate").textContent = `${played ? Math.round(wins * 100 / played) : 0}%`;
  if ($("profileEfootball")) $("profileEfootball").textContent = `${p.profile_badge || "🔥"} ${p.efootball_name || "eFootball Player"}`;
  if ($("profileStreak")) $("profileStreak").textContent = `🔥 ${Number(p.current_streak || 0)} Streak · ${escapeHTML(p.profile_frame || "default")}`;
  if ($("profilePlayerCode")) $("profilePlayerCode").textContent = p.player_code || "CH-XXXXXXXX";
  if ($("profileCoinsValue")) $("profileCoinsValue").textContent = Number(p.coins || 0);


  const whatsapp =
    currentPlayerPrivate?.whatsapp;


  if ($("profileDetails")) {

    $("profileDetails").innerHTML = `

      <div class="detail-row">

        <span>Rating</span>

        <strong>
          ${p.rating || 0}
        </strong>

      </div>


      <div class="detail-row">

        <span>المستوى</span>

        <strong>
          ${p.level || 1}
        </strong>

      </div>


      <div class="detail-row">

        <span>نوع الحساب</span>

        <strong>
          ${escapeHTML(
            getRoleLabel(p.role)
          )}
        </strong>

      </div>


      <div class="detail-row">

        <span>Premium</span>

        <strong>
          ${
            p.premium
              ? "💎 مفعل"
              : "غير مفعل"
          }
        </strong>

      </div>


      <div class="detail-row">

        <span>WhatsApp</span>

        <strong>
          ${
            whatsapp
              ? escapeHTML(whatsapp)
              : "غير محدد"
          }
        </strong>

      </div>

    `;

  }


  renderProfileFeatures(p);

  renderProfileHistory();

}


/* =========================================================
   PROFILE FEATURES
   ========================================================= */

function renderProfileFeatures(profile) {

  const box =
    $("profileFeatures");


  if (!box) {
    return;
  }


  const unlocked =
    getUnlockedFeatures(profile);


  const rows =
    Object.keys(FEATURE_LABELS)
      .map(key => {

        const info =
          FEATURE_LABELS[key];


        const isUnlocked =
          unlocked.includes(key);


        return `

          <div
            class="feature-row ${
              isUnlocked
                ? ""
                : "locked"
            }"
          >

            <span>
              ${info.icon}
            </span>

            <span>
              ${escapeHTML(
                info.label
              )}
            </span>

            <small>
              ${
                isUnlocked
                  ? "مفتوحة ✅"
                  : "مقفلة 🔒"
              }
            </small>

          </div>

        `;

      });


  box.innerHTML =
    rows.join("");

}


/* =========================================================
   PROFILE HISTORY
   ========================================================= */

async function renderProfileHistory() {

  const tournamentsBox =
    $("profileTournamentHistory");

  const matchesBox =
    $("profileMatchHistory");


  if (!currentUser) {

    if (tournamentsBox) {

      tournamentsBox.innerHTML =
        `<div class="empty-card">دخل للحساب باش تشوف السجل.</div>`;

    }


    if (matchesBox) {
      matchesBox.innerHTML = "";
    }


    return;

  }


  if (tournamentsBox) {

    tournamentsBox.innerHTML =
      `<div class="loading-card">جاري التحميل...</div>`;

  }


  const {
    data: registrations,
    error: regError
  } =
    await supabaseClient
      .from("tournament_players")
      .select(
        "status, tournaments(id, name, status, format)"
      )
      .eq(
        "player_id",
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (regError) {

    console.error(regError);

    if (tournamentsBox) {

      tournamentsBox.innerHTML =
        `<div class="empty-card">وقع مشكل فتحميل سجل البطولات.</div>`;

    }

  } else if (tournamentsBox) {

    const list =
      registrations || [];


    if (!list.length) {

      tournamentsBox.innerHTML =
        `<div class="empty-card">ما شاركتيش فحتى بطولة بعد.</div>`;

    } else {

      const statusLabels = {

        pending:
          "قيد الانتظار ⏳",

        accepted:
          "مقبول ✅",

        rejected:
          "مرفوض ❌",

        waitlist:
          "Waitlist ⏳"

      };


      tournamentsBox.innerHTML =
        list.map(r => {

          const tour =
            r.tournaments;


          if (!tour) {

            return `
              <article class="tournament-card">
                <h3>
                  بطولة محذوفة
                </h3>
              </article>
            `;

          }


          return `

            <article class="tournament-card">

              <div class="tournament-top">

                <span class="status-badge ${escapeHTML(tour.status)}">

                  ${escapeHTML(
                    tournamentStatusLabel(
                      tour.status
                    )
                  )}

                </span>


                <span class="entry-badge">

                  ${escapeHTML(
                    statusLabels[r.status] ||
                    r.status
                  )}

                </span>

              </div>


              <h3>
                ${escapeHTML(tour.name)}
              </h3>


              <div class="tournament-meta">

                <span>
                  ${escapeHTML(
                    tournamentFormatLabel(
                      tour.format
                    )
                  )}
                </span>

              </div>

            </article>

          `;

        }).join("");

    }

  }


  if (matchesBox) {

    matchesBox.innerHTML =
      `<div class="loading-card">جاري التحميل...</div>`;

  }


  const {
    data: history,
    error: matchError
  } =
    await supabaseClient
      .from("matches")
      .select("*")
      .or(
        `player_a.eq.${currentUser.id},player_b.eq.${currentUser.id}`
      )
      .eq(
        "status",
        "finished"
      )
      .order(
        "scheduled_at",
        {
          ascending: false
        }
      );


  if (matchError) {

    console.error(matchError);

    if (matchesBox) {

      matchesBox.innerHTML =
        `<div class="empty-card">وقع مشكل فتحميل سجل المباريات.</div>`;

    }

    return;

  }


  const finished =
    history || [];


  if (!matchesBox) {
    return;
  }


  if (!finished.length) {

    matchesBox.innerHTML =
      `<div class="empty-card">ما عندك حتى مباراة منتهية بعد.</div>`;

    return;

  }


  matchesBox.innerHTML =
    finished.map(m => {

      const won =
        m.winner_id ===
        currentUser.id;


      return `

        <article class="match-card">

          <div>

            <span class="match-status">

              ${
                won
                  ? "✅ فوز"
                  : "❌ خسارة"
              }

            </span>


            <h3>
              ${escapeHTML(
                m.round ||
                "مباراة"
              )}
            </h3>


            <small>
              ${escapeHTML(
                formatDate(
                  m.scheduled_at
                )
              )}
            </small>

          </div>


          <div class="match-score">

            ${m.score_a ?? "-"}
            -
            ${m.score_b ?? "-"}

          </div>

        </article>

      `;

    }).join("");

}


/* =========================================================
   EDIT PROFILE
   ========================================================= */

function openEditProfile() {

  if (!currentProfile) {

    showToast(
      "دخل للحساب أولاً."
    );

    return;

  }


  openModal(`

    <div class="modal-head">

      <button
        class="modal-close"
        onclick="closeModal()"
      >
        ×
      </button>

      <h2>
        تعديل الملف
      </h2>

    </div>


    <div class="modal-body">

      <label>
        الاسم الظاهر
      </label>


      <input
        id="editDisplayName"
        class="modal-input"
        value="${escapeHTML(
          currentProfile.display_name || ""
        )}"
      >


      <label>
        اسم eFootball 🎮
      </label>
      <input id="editEfootballName" class="modal-input" maxlength="40" placeholder="مثال: Mbark10" value="${escapeHTML(currentProfile.efootball_name || "")}">

      <label>
        رقم WhatsApp
      </label>


      <input
        id="editWhatsapp"
        class="modal-input"
        placeholder="مثال: 06XXXXXXXX"
        value="${escapeHTML(
          currentPlayerPrivate?.whatsapp || ""
        )}"
      >


      <label>
        الشارة 🎖️
      </label>
      <select id="editBadge" class="modal-input">
        ${["🔥","⚡","👑","💎","🏆","🎯","🦁","☠️"].map(v => `<option value="${v}" ${currentProfile.profile_badge === v ? "selected" : ""}>${v}</option>`).join("")}
      </select>

      <label>
        الإطار 🎨
      </label>
      <select id="editFrame" class="modal-input">
        ${["default","neon","fire","gold","elite"].map(v => `<option value="${v}" ${currentProfile.profile_frame === v ? "selected" : ""}>${v}</option>`).join("")}
      </select>

      <button
        class="primary-btn"
        onclick="saveProfile()"
        type="button"
      >
        حفظ التغييرات
      </button>

    </div>

  `);

}


/* =========================================================
   SAVE PROFILE
   ========================================================= */

async function saveProfile() {

  const displayName =
    $("editDisplayName")?.value.trim();

  const whatsapp =
    $("editWhatsapp")?.value.trim();

  const efootballName = $("editEfootballName")?.value.trim() || null;

  const badge = $("editBadge")?.value || currentProfile.profile_badge || "🔥";
  const frame = $("editFrame")?.value || currentProfile.profile_frame || "default";


  if (!displayName) {

    showToast(
      "دخل الاسم."
    );

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .update({
        display_name: displayName,
        efootball_name: efootballName
      })
      .eq(
        "id",
        currentUser.id
      )
      .select()
      .single();


  if (error) {

    console.error(error);

    showToast(
      "وقع مشكل فالحفظ."
    );

    return;

  }


  currentProfile = data;

  const { error: identityError } = await supabaseClient.rpc("update_player_identity", {
    p_title: currentProfile.title || "مخضرم",
    p_badge: badge,
    p_frame: frame
  });
  if (identityError) {
    console.error(identityError);
    showToast("تحفظ الاسم، ولكن بعض خيارات الهوية مقفولة حتى تطلع Level أكثر.");
  }
  await loadProfile();

  if (whatsapp) {

    const {
      data: privateData,
      error: privateError
    } =
      await supabaseClient
        .from("player_private")
        .upsert({

          id:
            currentUser.id,

          whatsapp

        })
        .select()
        .single();


    if (privateError) {

      console.error(
        privateError
      );

      showToast(
        "تحفظ الاسم، لكن وقع مشكل فحفظ WhatsApp."
      );

    } else {

      currentPlayerPrivate =
        privateData;

    }

  }


  renderCurrentUser();

  renderProfile();

  closeModal();


  showToast(
    "تم تحديث الملف ✅"
  );

}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

async function renderNotifications() {

  const box =
    $("notificationsList");


  if (!box) {
    return;
  }


  if (!currentUser) {

    box.innerHTML =
      `<div class="empty-card">سجل الدخول باش تشوف الإشعارات.</div>`;

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("notifications")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    return;

  }


  if (!data?.length) {

    box.innerHTML =
      `<div class="empty-card">ما عندك حتى إشعار 🔕</div>`;

    return;

  }


  box.innerHTML =
    data.map(n => `

      <article class="notification-item">

        <div>

          <strong>
            ${escapeHTML(n.title)}
          </strong>

          <p>
            ${escapeHTML(n.message)}
          </p>

          <small>
            ${escapeHTML(
              formatDate(
                n.created_at
              )
            )}
          </small>

        </div>

      </article>

    `).join("");

}


/* =========================================================
   PREMIUM
   ========================================================= */

function renderPremium() {

  const box =
    $("premiumContent");


  if (!box) {
    return;
  }


  const active =
    currentProfile?.premium === true ||
    currentProfile?.role === "owner";


  const featuresHtml =
    PREMIUM_FEATURES
      .map(f => `

        <div class="feature-row">

          <span>
            ${f.icon}
          </span>

          <span>
            ${escapeHTML(
              f.label
            )}
          </span>

        </div>

      `)
      .join("");


  box.innerHTML = `

    <div class="premium-status">

      ${
        active

          ? `
            <div class="success-box">
              💎 Premium ديالك مفعّل.
            </div>
          `

          : `

            <div class="premium-price">
              10 DH
            </div>

            <p>
              راسل الـ Owner باش تخلص وتفعّل Premium يدوياً.
            </p>

          `
      }

    </div>


    <div class="feature-list">

      ${featuresHtml}

    </div>

  `;

}


/* =========================================================
   COMPLAINTS
   ========================================================= */

async function renderComplaints() {

  const box =
    $("complaintsList");


  if (!box) {
    return;
  }


  if (!currentUser) {

    box.innerHTML =
      `<div class="empty-card">خاصك تدخل للحساب باش تشوف الشكايات.</div>`;

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("complaints")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    box.innerHTML =
      `<div class="empty-card">وقع مشكل.</div>`;

    return;

  }


  if (!data?.length) {

    box.innerHTML =
      `<div class="empty-card">ما عندك حتى Ticket دابا 🎫</div>`;

    return;

  }


  box.innerHTML =
    data.map(ticket => `

      <article class="ticket-card">

        <div class="ticket-top">

          <strong>
            ${escapeHTML(
              ticket.ticket_code
            )}
          </strong>

          <span>
            ${escapeHTML(
              ticket.status
            )}
          </span>

        </div>


        <h3>
          ${escapeHTML(
            ticket.subject
          )}
        </h3>


        <p>
          ${escapeHTML(
            ticket.message
          )}
        </p>


        <small>
          ${escapeHTML(
            formatDate(
              ticket.created_at
            )
          )}
        </small>

      </article>

    `).join("");

}


function openNewComplaint() {

  if (!currentUser) {

    showToast(
      "دخل للحساب أولاً."
    );

    return;

  }


  openModal(`

    <div class="modal-head">

      <button
        class="modal-close"
        onclick="closeModal()"
      >
        ×
      </button>

      <h2>
        شكاية جديدة 🎫
      </h2>

    </div>


    <div class="modal-body">

      <label>
        النوع
      </label>


      <select
        id="complaintType"
        class="modal-input"
      >

        <option value="match">
          مباراة
        </option>

        <option value="technical">
          مشكل تقني
        </option>

        <option value="organizer">
          المنظم
        </option>

        <option value="player">
          لاعب
        </option>

        <option value="other">
          أخرى
        </option>

      </select>


      <label>
        الموضوع
      </label>


      <input
        id="complaintSubject"
        class="modal-input"
        placeholder="موضوع الشكاية"
      >


      <label>
        التفاصيل
      </label>


      <textarea
        id="complaintMessage"
        class="modal-input"
        rows="5"
        placeholder="شرح المشكل..."
      ></textarea>


      <button
        class="primary-btn"
        onclick="submitComplaint()"
        type="button"
      >
        إرسال الشكاية
      </button>

    </div>

  `);

}


async function submitComplaint() {

  const type =
    $("complaintType")?.value ||
    "other";


  const subject =
    $("complaintSubject")?.value.trim();


  const message =
    $("complaintMessage")?.value.trim();


  if (!subject || !message) {

    showToast(
      "عمر الموضوع والتفاصيل."
    );

    return;

  }


  const code =
    `CH-${Date.now()
      .toString()
      .slice(-8)}`;


  const {
    error
  } =
    await supabaseClient
      .from("complaints")
      .insert({

        ticket_code:
          code,

        user_id:
          currentUser.id,

        type,

        subject,

        message

      });


  if (error) {

    console.error(error);

    showToast(
      "وقع مشكل فإرسال الشكاية."
    );

    return;

  }


  closeModal();


  showToast(
    "الشكاية تسيفطات بنجاح 🎫"
  );


  renderComplaints();

}


/* =========================================================
   HALL OF FAME
   ========================================================= */

async function renderHall() {

  const box =
    $("hallList");


  if (!box) {
    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("hall_of_fame")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    return;

  }


  if (!data?.length) {

    box.innerHTML =
      `<div class="empty-card">Hall of Fame غادي يتعمر مع الأبطال 👑</div>`;

    return;

  }


  box.innerHTML =
    data.map(item => `

      <article class="hall-card">

        <div class="hall-crown">
          👑
        </div>

        <h3>
          ${escapeHTML(
            item.tournament_name
          )}
        </h3>

        <strong>
          Champion
        </strong>

        <small>
          ${escapeHTML(
            item.season || ""
          )}
        </small>

      </article>

    `).join("");

}


/* =========================================================
   ORGANIZER
   ========================================================= */

async function renderOrganizer() {

  const stats =
    $("organizerStats");

  const listBox =
    $("organizerTournamentsList");


  if (!stats) {
    return;
  }


  if (
    !isOrganizerActive(
      currentProfile
    )
  ) {

    stats.innerHTML =
      `<div class="empty-card">هاد الصفحة خاصة بالمنظمين. تواصل مع Owner باش تفعّل الصلاحية.</div>`;

    if (listBox) {
      listBox.innerHTML = "";
    }

    return;

  }


  const planBox = $("organizerPlanCard");
  if (planBox) {
    const plan = currentProfile?.organizer_plan_code || "Organizer";
    const days = Number(currentProfile?.organizer_plan_days || 0);
    const expires = currentProfile?.organizer_expires_at ? formatDate(currentProfile.organizer_expires_at) : "غير محدد";
    planBox.innerHTML = `<div><span>ORGANIZER ACCESS</span><strong>${escapeHTML(String(plan).toUpperCase())}</strong><small>${days ? `${days} يوم` : "صلاحية نشطة"} · حتى ${escapeHTML(expires)}</small></div><div class="plan-pulse">● ACTIVE</div>`;
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from("tournaments")
      .select("*")
      .eq(
        "organizer_id",
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    return;

  }


  const tournaments =
    data || [];


  const live =
    tournaments.filter(
      t =>
        t.status === "live"
    ).length;


  const open =
    tournaments.filter(
      t =>
        t.status === "open"
    ).length;


  stats.innerHTML = `

    <div class="dashboard-stat">

      <strong>
        ${tournaments.length}
      </strong>

      <span>
        البطولات
      </span>

    </div>


    <div class="dashboard-stat">

      <strong>
        ${open}
      </strong>

      <span>
        مفتوحة
      </span>

    </div>


    <div class="dashboard-stat">

      <strong>
        ${live}
      </strong>

      <span>
        مباشرة
      </span>

    </div>

  `;


  if (!listBox) {
    return;
  }


  if (!tournaments.length) {

    listBox.innerHTML =
      `<div class="empty-card">ما عندك حتى بطولة دابا.</div>`;

    return;

  }


  const ids =
    tournaments.map(
      t => t.id
    );


  const {
    data: pendingRows,
    error: pendingError
  } =
    await supabaseClient
      .from("tournament_players")
      .select("tournament_id,status")
      .in(
        "tournament_id",
        ids
      )
      .in(
        "status",
        ["accepted", "waitlist"]
      );


  if (pendingError) {
    console.error(
      pendingError
    );
  }


  const pendingCounts = {};
  const waitlistCounts = {};

  (pendingRows || []).forEach(r => {
    const key = r.tournament_id;
    if (r.status === "waitlist") waitlistCounts[key] = (waitlistCounts[key] || 0) + 1;
    else pendingCounts[key] = (pendingCounts[key] || 0) + 1;
  });


  const isOwner =
    currentProfile.role ===
    "owner";


  listBox.innerHTML =
    tournaments
      .map(t => `

        <article
          class="tournament-card"
          data-id="${escapeHTML(t.id)}"
        >

          <div class="tournament-top">

            <span
              class="status-badge ${escapeHTML(t.status)}"
            >

              ${escapeHTML(
                tournamentStatusLabel(
                  t.status
                )
              )}

            </span>


            ${pendingCounts[t.id] ? `<span class="entry-badge">👥 ${pendingCounts[t.id]} مسجل</span>` : ""}
            ${waitlistCounts[t.id] ? `<span class="entry-badge">⏳ ${waitlistCounts[t.id]} انتظار</span>` : ""}

          </div>


          <h3>
            ${escapeHTML(t.name)}
          </h3>


          <div class="tournament-meta">

            <span>
              👥 ${t.current_players || 0}/${t.capacity}
            </span>

            <span>
              ${escapeHTML(
                tournamentFormatLabel(
                  t.format
                )
              )}
            </span>

          </div>


          <div class="org-tournament-actions">

            <button
              class="secondary-btn org-edit-btn"
              data-tournament="${escapeHTML(t.id)}"
              type="button"
            >
              تعديل
            </button>


            ${
              t.status === "open"
                ? `
                  <button
                    class="secondary-btn org-close-btn"
                    data-tournament="${escapeHTML(t.id)}"
                    type="button"
                  >
                    🚀 بدء البطولة
                  </button>
                `
                : t.status === "live"
                  ? `<span class="entry-badge">🔴 البطولة خدامة</span>`
                  : ""
            }


            ${
              isOwner

                ? `
                  <button
                    class="secondary-btn org-delete-btn"
                    data-tournament="${escapeHTML(t.id)}"
                    type="button"
                  >
                    حذف
                  </button>
                `

                : ""
            }

          </div>

        </article>

      `)
      .join("");

}


/* =========================================================
   EDIT TOURNAMENT
   ========================================================= */

async function editTournamentFetchAndOpen(id) {

  const {
    data: t,
    error
  } =
    await supabaseClient
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .single();


  if (error || !t) {

    showToast(
      "ما قدرناش نجيبو البطولة."
    );

    return;

  }


  openModal(`

    <div class="modal-head">

      <button
        class="modal-close"
        onclick="closeModal()"
      >
        ×
      </button>

      <h2>
        تعديل البطولة
      </h2>

    </div>


    <div class="modal-body">

      <label>
        اسم البطولة
      </label>


      <input
        id="editTournamentName"
        class="modal-input"
        value="${escapeHTML(t.name)}"
      >


      <label>
        الوصف
      </label>


      <textarea
        id="editTournamentDescription"
        class="modal-input"
        rows="3"
      >${escapeHTML(
        t.description || ""
      )}</textarea>


      <label>
        الحالة
      </label>


      <select
        id="editTournamentStatus"
        class="modal-input"
      >

        <option
          value="draft"
          ${t.status === "draft" ? "selected" : ""}
        >
          مسودة
        </option>

        <option
          value="open"
          ${t.status === "open" ? "selected" : ""}
        >
          مفتوحة
        </option>

        <option
          value="live"
          ${t.status === "live" ? "selected" : ""}
        >
          مباشرة
        </option>

        <option
          value="paused"
          ${t.status === "paused" ? "selected" : ""}
        >
          متوقفة
        </option>

        <option
          value="done"
          ${t.status === "done" ? "selected" : ""}
        >
          منتهية
        </option>

        <option
          value="cancelled"
          ${t.status === "cancelled" ? "selected" : ""}
        >
          ملغاة
        </option>

      </select>


      <button
        class="primary-btn"
        onclick="saveTournamentEdit('${escapeHTML(id)}')"
        type="button"
      >
        حفظ التغييرات
      </button>

    </div>

  `);

}


async function saveTournamentEdit(id) {

  const name =
    $("editTournamentName")?.value.trim();

  const description =
    $("editTournamentDescription")?.value.trim();

  const status =
    $("editTournamentStatus")?.value;


  if (!name) {

    showToast(
      "دخل اسم البطولة."
    );

    return;

  }


  const {
    error
  } =
    await supabaseClient
      .from("tournaments")
      .update({
        name,
        description,
        status
      })
      .eq("id", id);


  if (error) {

    console.error(error);

    showToast(
      "وقع مشكل فالتعديل."
    );

    return;

  }


  closeModal();


  showToast(
    "تم تحديث البطولة ✅"
  );


  renderHomeTournaments();

  renderTournaments();

  renderOrganizer();

  renderKing();

}


/* =========================================================
   CLOSE TOURNAMENT
   ========================================================= */

async function closeTournamentRegistration(id) {
  if (!currentUser || !isOrganizerActive(currentProfile)) {
    return showToast("هاد العملية خاصة بالمنظم.");
  }

  const { data, error } = await supabaseClient.rpc("start_tournament", {
    p_tournament_id: id
  });

  if (error) {
    console.error(error);
    const message = error.message || "";
    if (message.includes("NEED_TWO_PLAYERS")) return showToast("خاص البطولة يكون فيها جوج لاعبين على الأقل.");
    if (message.includes("DIRECT_NEEDS_POWER_OF_TWO")) return showToast("الإقصاء المباشر خاصو 2 أو 4 أو 8 أو 16... لاعبين مقبولين.");
    if (message.includes("TOURNAMENT_ALREADY_STARTED")) return showToast("البطولة بدات من قبل.");
    return showToast("ما قدرناش نبداو البطولة. تأكد من المشاركين.");
  }

  showToast(`🔥 بدات البطولة! تخلقو ${Number(data || 0)} مباريات.`);
  await renderHomeTournaments();
  await renderTournaments();
  await renderOrganizer();
  await renderMatches();
}


/* =========================================================
   DELETE TOURNAMENT
   ========================================================= */

async function deleteTournamentConfirmed(id) {

  const {
    error
  } =
    await supabaseClient
      .from("tournaments")
      .delete()
      .eq("id", id);


  if (error) {

    console.error(error);

    showToast(
      "وقع مشكل فالحذف (تأكد أنك Owner)."
    );

    return;

  }


  showToast(
    "تحذفات البطولة 🗑️"
  );


  renderHomeTournaments();

  renderTournaments();

  renderOrganizer();

  renderKing();

}


/* =========================================================
   KING PANEL
   ========================================================= */

async function renderKing() {

  const box =
    $("kingContent");


  if (!box) {
    return;
  }


  if (
    !currentProfile ||
    currentProfile.role !== "owner"
  ) {

    box.innerHTML =
      `<div class="empty-card">🔒 هاد القسم خاص بالمالك.</div>`;


    const playersBox =
      $("kingPlayersList");


    if (playersBox) {
      playersBox.innerHTML = "";
    }


    return;

  }


  const tournaments =
    await fetchTournaments();


  box.innerHTML = `

    <div class="king-card">

      <span>
        👑
      </span>

      <strong>
        KING ACCESS
      </strong>

      <small>
        صلاحيات المالك مفعلة.
      </small>

    </div>


    <div class="king-card">

      <span>
        🏆
      </span>

      <strong>
        ${tournaments.length}
      </strong>

      <small>
        البطولات
      </small>

    </div>


    <button
      class="king-action"
      id="kingCreateTournament"
      type="button"
    >
      ➕ إنشاء بطولة
    </button>


    <button
      class="king-action"
      id="kingMaintenance"
      type="button"
    >
      🛠️ إعدادات المنصة
    </button>

  `;


  $("kingCreateTournament")
    ?.addEventListener(
      "click",
      openCreateTournament
    );


  $("kingMaintenance")
    ?.addEventListener(
      "click",
      openMaintenanceSettings
    );

  $("kingEconomySettings")
    ?.addEventListener("click", openCoinSettingsModal);
  $("kingShopManager")?.addEventListener("click", openOwnerShopManager);
  $("kingBoxManager")?.addEventListener("click", openOwnerBoxManager);


  renderKingPlayers();

}


/* =========================================================
   KING PLAYERS
   ========================================================= */

async function renderKingPlayers(searchTerm = "") {

  const box =
    $("kingPlayersList");


  if (!box) {
    return;
  }


  if (
    !currentProfile ||
    currentProfile.role !== "owner"
  ) {
    return;
  }


  box.innerHTML =
    `<div class="loading-card">جاري التحميل...</div>`;


  let query =
    supabaseClient
      .from("profiles")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(50);


  if (searchTerm) {

    query =
      query.ilike(
        "username",
        `%${searchTerm}%`
      );

  }


  const {
    data,
    error
  } =
    await query;


  if (error) {

    console.error(error);

    box.innerHTML =
      `<div class="empty-card">وقع مشكل فتحميل اللاعبين.</div>`;

    return;

  }


  kingPlayersCache =
    data || [];


  if (!kingPlayersCache.length) {

    box.innerHTML =
      `<div class="empty-card">ما لقيتش لاعبين.</div>`;

    return;

  }


  const ids =
    kingPlayersCache.map(
      p => p.id
    );


  const {
    data: privateRows
  } =
    await supabaseClient
      .from("player_private")
      .select("*")
      .in(
        "id",
        ids
      );


  const privateMap = {};


  (privateRows || [])
    .forEach(r => {

      privateMap[r.id] =
        r.whatsapp;

    });


  box.innerHTML =
    kingPlayersCache.map(p => {

      const whatsapp =
        privateMap[p.id];


      const organizerActive =
        isOrganizerActive(p);


      return `

        <article
          class="king-player-card"
          data-id="${escapeHTML(p.id)}"
        >

          <div class="tournament-top">

            <strong>
              ${escapeHTML(
                p.display_name ||
                p.username
              )}
            </strong>


            <span class="entry-badge">

              ${escapeHTML(
                getRoleLabel(
                  p.role
                )
              )}

            </span>

          </div>


          <small>

            @${escapeHTML(
              p.username
            )}

            —

            Level ${p.level || 1}

            —

            ${p.points || 0} pts

          </small>


          <div class="king-player-actions">


            ${
              whatsapp

                ? `

                  <button
                    class="whatsapp-btn king-copy-wa"
                    data-wa="${escapeHTML(whatsapp)}"
                    type="button"
                  >
                    📋 نسخ
                  </button>


                  <button
                    class="whatsapp-btn king-open-wa"
                    data-wa="${escapeHTML(whatsapp)}"
                    type="button"
                  >
                    💬 فتح
                  </button>

                `

                : `

                  <button
                    disabled
                    type="button"
                  >
                    بلا WhatsApp
                  </button>

                `
            }


            <button class="coin-grant-btn" data-id="${escapeHTML(p.id)}" type="button">🪙 Coins</button>

            <button
              class="premium-btn ${
                p.premium
                  ? "active"
                  : ""
              } king-toggle-premium"
              data-id="${escapeHTML(p.id)}"
              data-value="${
                p.premium
                  ? "0"
                  : "1"
              }"
              type="button"
            >

              ${
                p.premium
                  ? "💎 إلغاء Premium"
                  : "💎 تفعيل Premium"
              }

            </button>


            <button
              class="organizer-btn ${
                organizerActive
                  ? "active"
                  : ""
              } king-organizer-menu"
              data-id="${escapeHTML(p.id)}"
              type="button"
            >

              ${
                organizerActive
                  ? "🏆 منظم مفعّل"
                  : "🏆 منح صلاحية منظم"
              }

            </button>


          </div>

        </article>

      `;

    }).join("");

}


/* =========================================================
   KING PREMIUM
   ========================================================= */

async function toggleKingPremium(
  id,
  value
) {

  const { error } = await supabaseClient.rpc("owner_set_account", {
    p_target: id, p_action: "premium", p_value: value
  });


  if (error) {

    console.error(error);

    showToast(
      "وقع مشكل."
    );

    return;

  }


  showToast(
    value
      ? "تفعّل Premium ✅"
      : "تلغى Premium."
  );


  renderKingPlayers(
    $("kingPlayerSearch")
      ?.value.trim() || ""
  );

}


/* =========================================================
   ORGANIZER ACCESS MODAL
   ========================================================= */

function openOrganizerAccessModal(id) {

  const player =
    kingPlayersCache.find(
      p =>
        p.id === id
    );


  if (!player) {
    return;
  }


  openModal(`

    <div class="modal-head">

      <button
        class="modal-close"
        onclick="closeModal()"
      >
        ×
      </button>


      <h2>
        صلاحية المنظم —
        ${escapeHTML(
          player.display_name ||
          player.username
        )}
      </h2>

    </div>


    <div class="modal-body">

      <p>
        اختار المدة اللي بغيتي تعطيها ليه صلاحية "منظم":
      </p>


      <button
        class="secondary-btn"
        onclick="grantOrganizerAccess('${escapeHTML(id)}', 1)"
        type="button"
      >
        يوم واحد
      </button>


      <button
        class="secondary-btn"
        onclick="grantOrganizerAccess('${escapeHTML(id)}', 7)"
        type="button"
      >
        سيمانة
      </button>


      <button
        class="secondary-btn"
        onclick="grantOrganizerAccess('${escapeHTML(id)}', 30)"
        type="button"
      >
        شهر
      </button>


      <button
        class="secondary-btn"
        onclick="grantOrganizerAccess('${escapeHTML(id)}', 3650)"
        type="button"
      >
        دائم
      </button>


      <button
        class="primary-btn"
        style="background:linear-gradient(135deg,#ff4d5f,#c62828)"
        onclick="revokeOrganizerAccess('${escapeHTML(id)}')"
        type="button"
      >
        سحب الصلاحية
      </button>

    </div>

  `);

}


/* =========================================================
   GRANT ORGANIZER
   ========================================================= */

async function grantOrganizerAccess(
  id,
  days
) {

  const { error } = await supabaseClient.rpc("owner_set_account", {
    p_target: id, p_action: "activate_organizer", p_days: days
  });


  if (error) {

    console.error(error);

    showToast(
      "وقع مشكل."
    );

    return;

  }


  closeModal();


  showToast(
    "تعطات صلاحية المنظم ✅"
  );


  renderKingPlayers(
    $("kingPlayerSearch")
      ?.value.trim() || ""
  );

}


/* =========================================================
   REVOKE ORGANIZER
   ========================================================= */

async function revokeOrganizerAccess(
  id
) {

  const { error } = await supabaseClient.rpc("owner_set_account", {
    p_target: id, p_action: "deactivate_organizer"
  });


  if (error) {

    console.error(error);

    showToast(
      "وقع مشكل."
    );

    return;

  }


  closeModal();


  showToast(
    "تسحبات الصلاحية."
  );


  renderKingPlayers(
    $("kingPlayerSearch")
      ?.value.trim() || ""
  );

}


/* =========================================================
   MAINTENANCE SETTINGS
   ========================================================= */

async function openMaintenanceSettings() {

  const {
    data: settings,
    error
  } =
    await supabaseClient
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .single();


  if (error || !settings) {

    showToast(
      "ما قدرناش نجيبو الإعدادات."
    );

    return;

  }


  openModal(`

    <div class="modal-head">

      <button
        class="modal-close"
        onclick="closeModal()"
      >
        ×
      </button>

      <h2>
        إعدادات المنصة
      </h2>

    </div>


    <div class="modal-body">

      <label>

        <input
          type="checkbox"
          id="settingRegistration"
          ${
            settings.registration_enabled
              ? "checked"
              : ""
          }
        >

        التسجيل مفتوح

      </label>


      <label>

        <input
          type="checkbox"
          id="settingJoin"
          ${
            settings.join_enabled
              ? "checked"
              : ""
          }
        >

        الانضمام للبطولات مفتوح

      </label>


      <label>

        <input
          type="checkbox"
          id="settingPremium"
          ${
            settings.premium_enabled
              ? "checked"
              : ""
          }
        >

        Premium مفعّل

      </label>


      <label>

        <input
          type="checkbox"
          id="settingMaintenance"
          ${
            settings.maintenance
              ? "checked"
              : ""
          }
        >

        وضع الصيانة

      </label>


      <button
        class="primary-btn"
        onclick="saveMaintenanceSettings()"
        type="button"
      >
        حفظ الإعدادات
      </button>

    </div>

  `);

}


/* =========================================================
   SAVE MAINTENANCE
   ========================================================= */

async function saveMaintenanceSettings() {

  const registration_enabled =
    $("settingRegistration")
      ?.checked || false;


  const join_enabled =
    $("settingJoin")
      ?.checked || false;


  const premium_enabled =
    $("settingPremium")
      ?.checked || false;


  const maintenance =
    $("settingMaintenance")
      ?.checked || false;


  const {
    error
  } =
    await supabaseClient
      .from("app_settings")
      .update({

        registration_enabled,

        join_enabled,

        premium_enabled,

        maintenance

      })
      .eq(
        "id",
        1
      );


  if (error) {

    console.error(error);

    showToast(
      "وقع مشكل فحفظ الإعدادات."
    );

    return;

  }


  closeModal();


  showToast(
    "تم تحديث الإعدادات ✅"
  );

}


/* =========================================================
   CREATE TOURNAMENT
   ========================================================= */

function openCreateTournament() {

  if (!currentUser) {

    showToast(
      "خاصك تدخل للحساب."
    );

    return;

  }


  if (
    !isOrganizerActive(
      currentProfile
    )
  ) {

    showToast(
      "إنشاء البطولات خاص بالمنظم."
    );

    return;

  }


  openModal(`

    <div class="modal-head">

      <button
        class="modal-close"
        onclick="closeModal()"
      >
        ×
      </button>

      <h2>
        إنشاء بطولة 🏆
      </h2>

    </div>


    <div class="modal-body">

      <label>
        اسم البطولة
      </label>


      <input
        id="createTournamentName"
        class="modal-input"
        placeholder="CHAOUI CUP 🔥"
      >


      <label>
        الوصف
      </label>


      <textarea
        id="createTournamentDescription"
        class="modal-input"
        rows="3"
        placeholder="وصف البطولة"
      ></textarea>


      <label>
        النظام
      </label>


      <select
        id="createTournamentFormat"
        class="modal-input"
      >

        <option value="direct">
          إقصاء مباشر
        </option>

        <option value="groups">
          مجموعات
        </option>

        <option value="groups_knockout">
          مجموعات + إقصائيات
        </option>

      </select>


      <label>
        السعة
      </label>


      <select
        id="createTournamentCapacity"
        class="modal-input"
      >

        <option value="4">
          4
        </option>

        <option
          value="8"
          selected
        >
          8
        </option>

        <option value="16">
          16
        </option>

        <option value="32">
          32
        </option>

        <option value="64">
          64
        </option>

      </select>


      <label>
        موعد البداية (اختياري)
      </label>

      <input
        id="createTournamentStartAt"
        class="modal-input"
        type="datetime-local"
      >

      <label>
        نوع الدخول
      </label>


      <select
        id="createTournamentEntry"
        class="modal-input"
      >

        <option value="free">
          Free
        </option>

        <option value="premium">
          Premium
        </option>

      </select>


      <button
        class="primary-btn"
        onclick="createTournament()"
        type="button"
      >
        إنشاء البطولة
      </button>

    </div>

  `);

}


/* =========================================================
   CREATE TOURNAMENT
   ========================================================= */

async function createTournament() {

  const name = $("createTournamentName")?.value.trim();
  const description = $("createTournamentDescription")?.value.trim() || null;
  const format = $("createTournamentFormat")?.value || "direct";
  const capacity = Number($("createTournamentCapacity")?.value || 8);
  const entryType = $("createTournamentEntry")?.value || "free";
  const startAtValue = $("createTournamentStartAt")?.value || "";
  const startAt = startAtValue ? new Date(startAtValue).toISOString() : null;

  if (!name) {
    showToast("دخل اسم البطولة.");
    return;
  }

  if (![4, 8, 16, 32, 64].includes(capacity)) {
    showToast("اختار سعة صحيحة: 4 / 8 / 16 / 32 / 64.");
    return;
  }

  const { data, error } = await supabaseClient.rpc("create_tournament", {
    p_name: name,
    p_description: description,
    p_format: format,
    p_capacity: capacity,
    p_entry_type: entryType,
    p_start_at: startAt
  });

  if (error) {
    console.error("CREATE TOURNAMENT ERROR:", error);
    const msg = String(error.message || "");
    if (msg.includes("ORGANIZER_REQUIRED")) {
      showToast("خاصك تكون Organizer باش تنشئ بطولة.");
    } else if (msg.includes("ORGANIZER_EXPIRED")) {
      showToast("اشتراك Organizer سالا. جدد الاشتراك باش تنشئ بطولة.");
    } else if (msg.includes("NAME_TOO_SHORT")) {
      showToast("اسم البطولة خاصو يكون 3 حروف على الأقل.");
    } else if (msg.includes("INVALID_CAPACITY")) {
      showToast("السعة خاصها تكون 4 أو 8 أو 16 أو 32 أو 64.");
    } else {
      showToast("وقع مشكل فـ إنشاء البطولة: " + (msg || "خطأ غير معروف"));
    }
    return;
  }

  closeModal();
  showToast("البطولة تخلقات بنجاح 🔥");
  renderHomeTournaments();
  renderTournaments();
  renderOrganizer();
  renderKing();
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutUser() {

  try {

    await supabaseClient.auth.signOut();

  } catch (error) {

    console.error(error);

  }


  currentUser = null;

  currentProfile = null;

  currentPlayerPrivate = null;


  const app =
    $("app");

  const auth =
    $("authScreen");


  if (app) {
    app.style.display = "none";
  }


  if (auth) {
    auth.style.display = "flex";
  }


  showLoginForm();


  showToast(
    "خرجتي من الحساب."
  );

}


/* =========================================================
   SESSION CHECK
   ========================================================= */

async function checkSession() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {

      console.error(
        "SESSION ERROR:",
        error
      );

      return;

    }


    const session =
      data?.session;


    if (session?.user) {

      currentUser =
        session.user;


      /*
         Load profile BEFORE showing app.
      */

      const profile =
        await loadProfile();


      if (!profile) {

        console.error(
          "SESSION USER EXISTS BUT PROFILE FAILED."
        );


        /*
           Do NOT silently show guest.
           Keep the user logged in but show
           a clear error.
        */

        const auth =
          $("authScreen");

        const app =
          $("app");


        if (auth) {
          auth.style.display = "flex";
        }


        if (app) {
          app.style.display = "none";
        }


        showMessage(
          "الحساب مسجل ولكن البروفايل ما قدرناش نحملوه. خاص إصلاح RLS ديال profiles فـ Supabase.",
          "error"
        );


        return;

      }


      showApp();


    } else {

      const auth =
        $("authScreen");

      const app =
        $("app");


      if (auth) {
        auth.style.display = "flex";
      }


      if (app) {
        app.style.display = "none";
      }

    }


  } catch (error) {

    console.error(
      "CHECK SESSION CRASH:",
      error
    );

  }

}


/* =========================================================
   AUTH STATE LISTENER
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    console.log(
      "AUTH:",
      event
    );

    if (event === "PASSWORD_RECOVERY") {
      await handlePasswordRecovery();
      return;
    }


    if (
      event === "SIGNED_OUT"
    ) {

      currentUser = null;

      currentProfile = null;

      currentPlayerPrivate = null;

      return;

    }


    /*
       Do not duplicate the login flow here.
       checkSession/loginUser handle the profile loading.
    */

    if (
      event === "TOKEN_REFRESHED" &&
      session?.user
    ) {

      currentUser =
        session.user;

    }

  }
);

async function openMatchRoom(matchId){
  if(!currentUser)return showToast("دخل للحساب أولاً.");
  const {data,error}=await supabaseClient.rpc("start_match_chat",{p_match_id:matchId});
  if(error)return showToast("ما قدرناش نفتحو Match Room.");
  showPage("chat"); setTimeout(()=>openChatConversation(data),100);
}

/* =========================================================
   VERIFIED RESULT WORKFLOW — database RPC, never client stats
   ========================================================= */

async function openSubmitResult(matchId) {
  if (!currentUser) return showToast("خاصك تسجل الدخول أولاً.");

  openModal(`
    <div class="modal-head"><h2>إدخال نتيجة المباراة ⚽</h2><button type="button" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <p>أدخل النتيجة الحقيقية. لا تُحتسب النقاط حتى يؤكدها الخصم.</p>
      <label>أهدافك</label><input id="resultMyScore" class="modal-input" type="number" min="0" inputmode="numeric">
      <label>أهداف الخصم</label><input id="resultOpponentScore" class="modal-input" type="number" min="0" inputmode="numeric">
      <label>Screenshot كدليل (اختياري أو حسب قواعد البطولة)</label><input id="resultEvidence" class="modal-input" type="file" accept="image/png,image/jpeg,image/webp">
      <button class="primary-btn" type="button" onclick="submitMatchResult('${escapeHTML(matchId)}')">إرسال للتأكيد</button>
    </div>`);
}

async function submitMatchResult(matchId) {
  const myScore = Number($("resultMyScore")?.value);
  const opponentScore = Number($("resultOpponentScore")?.value);
  if (!Number.isInteger(myScore) || !Number.isInteger(opponentScore) || myScore < 0 || opponentScore < 0) {
    return showToast("دخل نتيجة صحيحة (0 أو أكثر).");
  }
  const { error } = await supabaseClient.rpc("submit_match_result", {
    p_match_id: matchId, p_my_score: myScore, p_opponent_score: opponentScore
  });
  if (error) { console.error(error); return showToast("تعذر إرسال النتيجة. تأكد من صلاحيتك وحالة المباراة."); }
  const evidence = $("resultEvidence")?.files?.[0];
  if (evidence) {
    if (evidence.size > 5 * 1024 * 1024) return showToast("حجم الصورة خاصو يكون أقل من 5MB.");
    const extension = evidence.name.split(".").pop().toLowerCase();
    const path = `${currentUser.id}/${matchId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabaseClient.storage.from("chaoui-evidence").upload(path, evidence, { contentType: evidence.type, upsert: false });
    if (uploadError) { console.error(uploadError); return showToast("تسجلات النتيجة ولكن تعذر رفع الدليل."); }
    const { data: result, error: resultError } = await supabaseClient.from("match_results").select("id").eq("match_id", matchId).single();
    if (resultError) { console.error(resultError); return showToast("تسجلات النتيجة ولكن تعذر ربط الدليل."); }
    const { error: evidenceError } = await supabaseClient.from("match_evidence").insert({ result_id: result.id, storage_path: path, submitted_by: currentUser.id });
    if (evidenceError) { console.error(evidenceError); return showToast("تسجلات النتيجة ولكن تعذر حفظ بيانات الدليل."); }
  }
  closeModal(); showToast("تم إرسال النتيجة للخصم ✅"); renderMatches();
}

async function confirmSubmittedResult(matchId) {
  const { error } = await supabaseClient.rpc("confirm_match_result", { p_match_id: matchId });
  if (error) { console.error(error); return showToast("تعذر تأكيد النتيجة."); }
  showToast("تم تأكيد النتيجة وتحديث الإحصائيات 🏆"); renderMatches(); renderProfile(); renderRanking();
}

function openMatchDispute(matchId) {
  openModal(`
    <div class="modal-head"><h2>اعتراض على النتيجة</h2><button type="button" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <label>سبب الاعتراض</label>
      <select id="disputeType" class="modal-input"><option value="wrong_result">نتيجة خاطئة</option><option value="no_show">غياب الخصم</option><option value="connection_issue">مشكلة اتصال</option><option value="cheating">اشتباه غش</option><option value="other">آخر</option></select>
      <label>التفاصيل</label><textarea id="disputeDescription" class="modal-input" rows="4" maxlength="2000"></textarea>
      <button class="primary-btn" type="button" onclick="submitMatchDispute('${escapeHTML(matchId)}')">فتح الاعتراض</button>
    </div>`);
}

async function submitMatchDispute(matchId) {
  const description = $("disputeDescription")?.value.trim();
  const type = $("disputeType")?.value;
  if (!description || description.length < 5) return showToast("اشرح الاعتراض بخمسة أحرف على الأقل.");
  const { error } = await supabaseClient.rpc("open_match_dispute", { p_match_id: matchId, p_type: type, p_description: description });
  if (error) { console.error(error); return showToast("تعذر فتح الاعتراض."); }
  closeModal(); showToast("تم فتح الاعتراض. سيتابعه المنظم."); renderMatches();
}

async function renderProgression() {
  const summary=$("progressionSummary"), achievementsBox=$("achievementsList"), challengesBox=$("challengesList");
  if(!summary||!achievementsBox||!challengesBox)return;
  if(!currentUser||!currentProfile){summary.innerHTML="";achievementsBox.innerHTML=`<div class="empty-card">سجل الدخول باش تشوف تقدمك.</div>`;challengesBox.innerHTML="";return;}
  const level=Number(currentProfile.level||1),xp=Number(currentProfile.xp||0),coins=Number(currentProfile.coins||0),nextXp=100,pct=Math.min(100,Math.round(((xp%nextXp)/nextXp)*100));
  summary.innerHTML=`<div><strong>${level}</strong><span>Level</span></div><div><strong>${xp}</strong><span>XP</span></div><div><strong>${coins}</strong><span>CHAoui Coins</span></div><div><strong>${pct}%</strong><span>للمستوى التالي</span></div><button class="daily-claim-btn" type="button" onclick="claimDailyCoins()">📅 Daily Coins</button>`;
  const [a,u,c,pc,r,pr]=await Promise.all([
    supabaseClient.from("achievements").select("*").eq("active",true).order("created_at"),
    supabaseClient.from("player_achievements").select("achievement_id,unlocked_at").eq("player_id",currentUser.id),
    supabaseClient.from("challenges").select("*").eq("active",true).order("created_at"),
    supabaseClient.from("player_challenges").select("challenge_id,progress,completed_at").eq("player_id",currentUser.id),
    supabaseClient.from("rewards").select("*").eq("active",true).order("level_required"),
    supabaseClient.from("player_rewards").select("reward_id").eq("player_id",currentUser.id)
  ]);
  if([a,u,c,pc,r,pr].some(x=>x.error)){console.error(a.error||u.error||c.error||pc.error||r.error||pr.error);return;}
  const unlocked=new Map((u.data||[]).map(x=>[x.achievement_id,x]));
  achievementsBox.innerHTML=(a.data||[]).map(x=>{const z=unlocked.get(x.id);return `<article class="info-card progression-card ${z?"is-unlocked":"is-locked"}"><h3>${escapeHTML(x.icon||"🏆")} ${escapeHTML(x.name)}</h3><p>${escapeHTML(x.description)}</p><small>${z?"مفتوح":"🔒 لم يُفتح بعد"} · +${Number(x.xp_reward||0)} XP · +${Number(x.coin_reward||0)} Coins</small></article>`}).join("")||`<div class="empty-card">مازال ما كاين حتى إنجاز.</div>`;
  const pm=new Map((pc.data||[]).map(x=>[x.challenge_id,x]));
  challengesBox.innerHTML=(c.data||[]).map(x=>{const z=pm.get(x.id),target=Number(x.condition?.value||x.condition?.target||0);return `<article class="info-card progression-card"><h3>🎯 ${escapeHTML(x.title)}</h3><p>${escapeHTML(x.description)}</p><small>${z?.completed_at?"✅ مكتمل":`${Number(z?.progress||0)} / ${target||"?"}`} · +${Number(x.xp_reward||0)} XP · +${Number(x.coins_reward||0)} Coins</small></article>`}).join("")||`<div class="empty-card">ما كايناش تحديات حالياً.</div>`;
  const featureRows=Object.entries(LEVEL_FEATURES).flatMap(([req,keys])=>keys.map(key=>{const info=FEATURE_LABELS[key];if(!info)return"";const open=currentProfile?.role==="owner" || level>=Number(req);return `<article class="info-card progression-card ${open?"is-unlocked":"is-locked"}"><h3>${info.icon} ${escapeHTML(info.label)}</h3><p>${open?"متاحة ليك دابا ✅":`🔒 كتتحل فـ Level ${req}`}</p></article>`})).join("");
  const redeemed=new Set((pr.data||[]).map(x=>x.reward_id));
  const rewardCards=(r.data||[]).map(x=>{const ok=level>=Number(x.level_required)&&coins>=Number(x.cost)&&!redeemed.has(x.id);return `<article class="info-card progression-card ${ok?"is-unlocked":"is-locked"}"><h3>${escapeHTML(x.icon||"🎁")} ${escapeHTML(x.name)}</h3><p>${escapeHTML(x.description)}</p><small>Level ${Number(x.level_required)} · ${Number(x.cost)} Coins · ${redeemed.has(x.id)?"✅ مستلمة":level<Number(x.level_required)?"🔒 Level غير كافي":coins<Number(x.cost)?"🪙 Coins غير كافية":"جاهزة"}</small><button class="secondary-btn" type="button" ${ok?`onclick="redeemReward('${x.id}')"`:"disabled"}>${redeemed.has(x.id)?"مستلمة":"استبدال"}</button></article>`}).join("");
  const extra=document.createElement("div");extra.id="progressionExtras";extra.innerHTML=`<div class="section-head"><h2>🔓 مزايا المستويات</h2></div><div class="cards-grid">${featureRows}</div><div class="section-head"><h2>🎁 متجر المكافآت</h2></div><div class="cards-grid">${rewardCards||"<div class='empty-card'>المتجر خالي حالياً.</div>"}</div>`;
  $("progressionExtras")?.remove();achievementsBox.parentElement?.appendChild(extra);
}

async function claimDailyCoins() {
  if (!currentUser) return showToast("دخل للحساب أولاً.");
  const { data, error } = await supabaseClient.rpc("claim_daily_coins");
  if (error) {
    console.error(error);
    if ((error.message || "").includes("ALREADY_CLAIMED")) return showToast("خديتي Daily Coins ديال اليوم من قبل ✅");
    return showToast("ما قدرناش ناخدو المكافأة اليومية.");
  }
  await loadProfile();
  renderCurrentUser();
  renderProfile();
  renderProgression();
  showToast(`🎁 +${Number(data?.coins || 0)} Coins اليوم!`);
}

async function redeemReward(rewardId){
  if(!currentUser)return;const {error}=await supabaseClient.rpc("redeem_reward",{p_reward_id:rewardId});
  if(error){alert(error.message.includes("INSUFFICIENT_COINS")?"ما عندكش Coins كافية.":error.message.includes("LEVEL_REQUIRED")?"خاصك تطلع Level أكثر.":"ما قدرناش نستبدلو المكافأة دابا.");return;}
  await loadProfile();renderProfile();await renderProgression();alert("🎁 تمت عملية استبدال المكافأة بنجاح!");
}

async function renderPlayerSearch(term = "") {
  const box = $("playerSearchResults"); if (!box) return;
  const clean = term.trim();
  if (!clean) { box.innerHTML = `<div class="empty-card">ابحث بـUsername أو الاسم الظاهر أو اسم eFootball.</div>`; return; }
  const safeTerm = clean.replace(/[,%()]/g, " ");
  const { data, error } = await supabaseClient.from("profiles").select("id,username,display_name,efootball_name,avatar_url,level,points,xp,wins,losses,title").or(`username.ilike.%${safeTerm}%,display_name.ilike.%${safeTerm}%,efootball_name.ilike.%${safeTerm}%`).limit(30);
  if (error) { console.error(error); box.innerHTML = `<div class="empty-card">تعذر البحث عن اللاعبين.</div>`; return; }
  box.innerHTML = data?.length ? data.map(player => `<button type="button" class="info-card player-result" onclick="openPublicProfile('${escapeHTML(player.id)}')"><strong>${escapeHTML(player.display_name || player.username)}</strong><small>@${escapeHTML(player.username)} · Lv.${Number(player.level || 1)} · ${Number(player.points || 0)} Points</small></button>`).join("") : `<div class="empty-card">لم نجد أي لاعب.</div>`;
}

async function openPublicProfile(playerId) {
  const { data: player, error } = await supabaseClient.from("profiles").select("id,username,display_name,efootball_name,avatar_url,player_code,level,xp,points,wins,losses,draws,goals_for,goals_against,best_streak,title,profile_badge,profile_frame").eq("id", playerId).single();
  if (error || !player) return showToast("تعذر فتح ملف اللاعب.");
  const played = Number(player.wins || 0) + Number(player.losses || 0) + Number(player.draws || 0);
  const rate = played ? Math.round(Number(player.wins || 0) * 100 / played) : 0;
  openModal(`<div class="modal-head"><h2>CHAOUI Player Card</h2><button type="button" onclick="closeModal()">×</button></div><div class="modal-body public-profile public-player-card"><div class="public-player-hero"><div class="public-player-avatar">${escapeHTML(getInitials(player.display_name || player.username))}</div><div><h2>${escapeHTML(player.display_name || player.username)}</h2><p>@${escapeHTML(player.username)} · ${escapeHTML(player.player_code || "CH-XXXXXXXX")}</p><span>${escapeHTML(player.title || "Rookie")} · LV.${Number(player.level || 1)}</span></div></div><div class="modal-info-grid"><div><strong>${Number(player.points || 0)}</strong><small>Points</small></div><div><strong>${Number(player.xp || 0)}</strong><small>XP</small></div><div><strong>${Number(player.wins || 0)}</strong><small>Wins</small></div><div><strong>${Number(player.losses || 0)}</strong><small>Losses</small></div><div><strong>${rate}%</strong><small>Win Rate</small></div><div><strong>${Number(player.best_streak || 0)} 🔥</strong><small>Best Streak</small></div></div><div class="public-card-actions"><button class="secondary-btn" type="button" onclick="startChatFromProfile('${escapeHTML(player.id)}')">💬 راسلو</button><button class="secondary-btn" type="button" onclick="sharePlayerCard('${escapeHTML(player.id)}')">مشاركة Player Card</button></div></div>`);
}

async function sharePlayerCard(playerId) {
  const url = `${location.origin}${location.pathname}#profile/${playerId}`;
  try { if (navigator.share) await navigator.share({ title: "CHAOUI Player Card", url }); else { await navigator.clipboard.writeText(url); showToast("تم نسخ رابط Player Card."); } } catch (_) {}
}

document.addEventListener("input", event => { if (event.target?.id === "playerSearchInput") renderPlayerSearch(event.target.value); });


/* =========================================================
   TOURNAMENT FILTERS
   ========================================================= */

function initTournamentFilters() {

  document
    .querySelectorAll(
      "[data-filter]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              "[data-filter]"
            )
            .forEach(x =>
              x.classList.remove(
                "active"
              )
            );


          button.classList.add(
            "active"
          );


          currentTournamentFilter =
            button.dataset.filter ||
            "all";


          renderTournaments();

        }
      );

    });

}


/* =========================================================
   RANKING TABS
   ========================================================= */

function initRankingTabs() {

  document
    .querySelectorAll(
      "[data-ranking]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              "[data-ranking]"
            )
            .forEach(x =>
              x.classList.remove(
                "active"
              )
            );


          button.classList.add(
            "active"
          );


          currentRankingType =
            button.dataset.ranking ||
            "rating";


          renderRanking();

        }
      );

    });

}



/* =========================================================
   CHAoui V5 — Economy / Chat / Clubs / Season / Feed / Assistant
   ========================================================= */

async function renderWallet() {
  const hero = $("walletHero"), ledger = $("coinLedgerList"), shop = $("walletShop"), boxes = $("mysteryBoxes");
  if (!hero || !currentUser) return;
  const [{data: wallet}, {data: ledgerRows}, {data: rewards}, {data: redeemed}, {data: boxRows}] = await Promise.all([
    supabaseClient.rpc("get_coin_wallet"),
    supabaseClient.from("coin_ledger").select("amount,balance_after,reason,source_type,created_at").eq("player_id",currentUser.id).order("created_at",{ascending:false}).limit(20),
    supabaseClient.from("rewards").select("*").eq("active",true).order("level_required"),
    supabaseClient.from("player_rewards").select("reward_id").eq("player_id",currentUser.id),
    supabaseClient.from("mystery_boxes").select("*").eq("active",true).order("cost")
  ]);
  const w=wallet||{coins:Number(currentProfile?.coins||0),earned:0,spent:0};
  hero.innerHTML=`<div class="wallet-balance"><span>CHAoui Coins</span><strong>🪙 ${Number(w.coins||0)}</strong><small>ربحتي ${Number(w.earned||0)} · صرفتي ${Number(w.spent||0)}</small></div><div class="wallet-actions"><button class="primary-btn" type="button" onclick="claimDailyCoins()">🎁 Daily + Coins</button><button class="secondary-btn" type="button" onclick="renderWallet()">↻ تحديث</button></div>`;
  ledger.innerHTML=(ledgerRows||[]).map(x=>`<article class="home-feed-item coin-ledger-row"><div class="home-feed-icon">${Number(x.amount)>=0?'🟢':'🔴'}</div><div><strong>${escapeHTML(x.reason)}</strong><small>${escapeHTML(formatDate(x.created_at))} · ${escapeHTML(x.source_type||'system')}</small></div><span class="ledger-amount ${Number(x.amount)>=0?'positive':'negative'}">${Number(x.amount)>=0?'+':''}${Number(x.amount)}</span></article>`).join("")||`<div class="empty-card">مازال ما كايناش عمليات.</div>`;
  const red=new Set((redeemed||[]).map(x=>x.reward_id));
  shop.innerHTML=(rewards||[]).map(r=>{const owner= currentProfile?.role === "owner";
  const ok=(owner || Number(currentProfile?.level||1)>=Number(r.level_required||1))&&Number(currentProfile?.coins||0)>=Number(r.cost||0)&&!red.has(r.id);return `<article class="shop-card ${ok?'ready':''}"><div class="shop-icon">${escapeHTML(r.icon||'🎁')}</div><div><h3>${escapeHTML(r.name)}</h3><p>${escapeHTML(r.description||'مكافأة CHAoui')}</p><small>Level ${Number(r.level_required)} · 🪙 ${Number(r.cost)}</small></div><button class="secondary-btn" ${ok?`onclick="redeemReward('${r.id}')"`:"disabled"}>${red.has(r.id)?'مستلمة':(!owner && Number(currentProfile?.level||1)<Number(r.level_required))?'🔒 Level':Number(currentProfile?.coins||0)<Number(r.cost)?'🪙 ناقص':'شراء'}</button></article>`}).join("")||`<div class="empty-card">المتجر خالي.</div>`;
  boxes.innerHTML=(boxRows||[]).map(b=>{const lvl=Number(currentProfile?.level||1),coins=Number(currentProfile?.coins||0),ok=lvl>=Number(b.level_required)&&coins>=Number(b.cost);return `<article class="mystery-box-card ${ok?'ready':''}"><div class="mystery-glow">${escapeHTML(b.icon||'🎁')}</div><div><h3>${escapeHTML(b.name)}</h3><p>${escapeHTML(b.description||'')}</p><small>🔒 Level ${Number(b.level_required)} · 🪙 ${Number(b.cost)}</small></div><button class="primary-small" ${ok?`onclick="openMysteryBox('${b.id}')"`:"disabled"}>${ok?'فتح الصندوق':'مغلق'}</button></article>`}).join("")||`<div class="empty-card">ما كايناش Boxes.</div>`;
}

async function openMysteryBox(id){
  if(!currentUser)return showToast('دخل للحساب أولاً.');
  const {data,error}=await supabaseClient.rpc('open_mystery_box',{p_box_id:id});
  if(error){const m=error.message||'';return showToast(m.includes('INSUFFICIENT_COINS')?'Coins ما كافياش.':m.includes('LEVEL_REQUIRED')?'خاصك Level أعلى.':'ما قدرناش نفتح الصندوق.');}
  await loadProfile(); renderCurrentUser(); renderProfile(); renderHomeDashboard(); renderWallet();
  const reward = data?.reward_type==='coins'?`+${data.amount} Coins`:data?.reward_type==='xp'?`+${data.amount} XP`:data?.reward_value||'جائزة';
  openModal(`<div class="mystery-result"><div class="mystery-win-icon">🎁</div><span>فتحت ${escapeHTML(data?.box||'Mystery Box')}</span><h2>${escapeHTML(reward)}</h2><p>الرصيد الجديد: 🪙 ${Number(data?.coins||0)}</p><button class="primary-btn" onclick="closeModal()">وااااعر 🔥</button></div>`);
}

async function renderConversations(){
  const list=$("conversationList"); if(!list||!currentUser)return;
  const {data: memberships,error}=await supabaseClient.from('conversation_members').select('conversation_id,last_read_at').eq('user_id',currentUser.id).order('joined_at',{ascending:false});
  if(error){list.innerHTML='<div class="empty-card">تعذر تحميل الرسائل.</div>';return;}
  const ids=(memberships||[]).map(x=>x.conversation_id);
  if(!ids.length){list.innerHTML='<div class="empty-card">مازال ما عندك حتى شات.<br>ضغط + شات وبدا.</div>';return;}
  const {data: convs}=await supabaseClient.from('conversations').select('id,kind,title,created_at').in('id',ids).order('created_at',{ascending:false});
  const {data: members}=await supabaseClient.from('conversation_members').select('conversation_id,user_id').in('conversation_id',ids);
  const otherIds=[...new Set((members||[]).filter(m=>m.user_id!==currentUser.id).map(m=>m.user_id))];
  const {data: players}=otherIds.length?await supabaseClient.from('profiles').select('id,username,display_name,player_code,profile_badge,online').in('id',otherIds):{data:[]};
  const pm=new Map((players||[]).map(x=>[x.id,x]));
  list.innerHTML=(convs||[]).map(c=>{const other=(members||[]).find(m=>m.conversation_id===c.id&&m.user_id!==currentUser.id);const p=pm.get(other?.user_id);const title=c.kind==='direct'?(p?.display_name||p?.username||'لاعب'):c.title||'CHAoui Chat';return `<button class="conversation-item ${currentChatId===c.id?'active':''}" type="button" onclick="openChatConversation('${c.id}')"><span class="chat-avatar">${escapeHTML(p?.profile_badge||'💬')}</span><span><strong>${escapeHTML(title)}</strong><small>${escapeHTML(p?.player_code||c.kind)}</small></span><i>${p?.online?'●':'○'}</i></button>`}).join('');
  if(!currentChatId&&convs?.[0]) openChatConversation(convs[0].id);
}

async function openNewChatModal(){
  if(!currentUser)return showToast('دخل للحساب أولاً.');
  openModal(`<div class="modal-head"><h2>💬 شات جديد</h2><button onclick="closeModal()">×</button></div><div class="modal-body"><input id="newChatSearch" class="modal-input" placeholder="قلب بالـUsername أو CHAoui ID"><div id="newChatResults" class="cards-grid" style="margin-top:12px"></div></div>`);
  const input=$("newChatSearch"); input?.addEventListener('input',()=>searchChatPlayers(input.value)); input?.focus();
}
async function searchChatPlayers(term){
  const box=$("newChatResults"); if(!box)return; const q=term.trim(); if(!q){box.innerHTML='<div class="empty-card">كتب Username أو Player ID.</div>';return;}
  const {data,error}=await supabaseClient.from('profiles').select('id,username,display_name,player_code,level,profile_badge').neq('id',currentUser.id).or(`username.ilike.%${q.replace(/[,%()]/g,'')}%,display_name.ilike.%${q.replace(/[,%()]/g,'')}%,player_code.ilike.%${q.replace(/[,%()]/g,'')}%`).limit(12);
  if(error){box.innerHTML='<div class="empty-card">تعذر البحث.</div>';return;}
  box.innerHTML=(data||[]).map(p=>`<button class="info-card chat-player-result" type="button" onclick="startChatFromProfile('${p.id}')"><span>${escapeHTML(p.profile_badge||'👤')}</span><strong>${escapeHTML(p.display_name||p.username)}</strong><small>@${escapeHTML(p.username)} · ${escapeHTML(p.player_code||'')}</small></button>`).join('')||'<div class="empty-card">ما لقيتش.</div>';
}
async function startChatFromProfile(id){
  const {data,error}=await supabaseClient.rpc('start_direct_chat',{p_other:id});
  if(error)return showToast('ما قدرناش نبداو الشات.');
  closeModal(); showPage('chat'); setTimeout(()=>openChatConversation(data),100);
}
async function openChatConversation(id){
  currentChatId=id;
  const header=$("chatRoomHeader"), messages=$("chatMessages");
  if(!header||!messages)return;
  const {data: members}=await supabaseClient.from('conversation_members').select('user_id').eq('conversation_id',id);
  const otherId=(members||[]).map(x=>x.user_id).find(x=>x!==currentUser.id);
  const {data:p}=otherId?await supabaseClient.from('profiles').select('display_name,username,player_code,profile_badge,online').eq('id',otherId).single():{data:null};
  header.innerHTML=`<div class="chat-header-avatar">${escapeHTML(p?.profile_badge||'💬')}</div><div><strong>${escapeHTML(p?.display_name||'CHAoui Chat')}</strong><small>${escapeHTML(p?.player_code||'')} ${p?.online?'· متصل 🟢':''}</small></div><button class="secondary-btn" type="button" onclick="renderConversations()">↻</button>`;
  const {data: rows}=await supabaseClient.from('messages').select('id,sender_id,body,created_at').eq('conversation_id',id).order('created_at',{ascending:true}).limit(200);
  const senderIds=[...new Set((rows||[]).map(x=>x.sender_id))]; const {data: ps}=senderIds.length?await supabaseClient.from('profiles').select('id,display_name,username,profile_badge').in('id',senderIds):{data:[]}; const map=new Map((ps||[]).map(x=>[x.id,x]));
  messages.innerHTML=(rows||[]).map(m=>`<div class="chat-bubble-row ${m.sender_id===currentUser.id?'mine':''}"><span class="chat-badge">${escapeHTML(map.get(m.sender_id)?.profile_badge||'👤')}</span><div class="chat-bubble"><p>${escapeHTML(m.body)}</p><small>${escapeHTML(formatDate(m.created_at))}</small></div></div>`).join('')||'<div class="empty-card">بدا أول رسالة 👋</div>';
  messages.scrollTop=messages.scrollHeight;
  if(chatRealtimeChannel){try{await supabaseClient.removeChannel(chatRealtimeChannel)}catch(_){} }
  chatRealtimeChannel=supabaseClient.channel(`chat-${id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`conversation_id=eq.${id}`},()=>openChatConversation(id)).subscribe();
}
async function sendChatMessage(){
  const input=$("chatMessageInput"); const body=input?.value.trim(); if(!currentChatId||!body)return;
  const {error}=await supabaseClient.rpc('send_chat_message',{p_conversation_id:currentChatId,p_body:body}); if(error)return showToast('ما قدرناش نصيفطو الرسالة.'); input.value=''; openChatConversation(currentChatId);
}

async function renderClubs(){
  const list=$("clubsList"), mine=$("myClubCard"); if(!list||!currentUser)return;
  const {data: clubs}=await supabaseClient.from('clubs').select('*').order('club_points',{ascending:false}).limit(30);
  const {data: mineRows}=await supabaseClient.from('club_members').select('club_id,role').eq('player_id',currentUser.id);
  const myId=mineRows?.[0]?.club_id; const myClub=(clubs||[]).find(c=>c.id===myId);
  mine.innerHTML=myClub?`<div class="club-hero"><div class="club-logo">${escapeHTML(myClub.logo||'🛡️')}</div><div><span>ناديك</span><h2>${escapeHTML(myClub.name)}</h2><p>[${escapeHTML(myClub.tag)}] · Level ${Number(myClub.level)}</p></div><strong>${Number(myClub.club_points)} pts</strong></div>`:`<div class="empty-card">مازال ما عندكش نادي. صايب واحد أو دخل لشي نادي.</div>`;
  const counts={}; for(const c of clubs||[]){const {count}=await supabaseClient.from('club_members').select('*',{count:'exact',head:true}).eq('club_id',c.id);counts[c.id]=count||0;}
  list.innerHTML=(clubs||[]).map(c=>`<article class="club-card"><div class="club-logo">${escapeHTML(c.logo||'🛡️')}</div><div><h3>${escapeHTML(c.name)}</h3><small>[${escapeHTML(c.tag)}] · Level ${Number(c.level)} · ${Number(counts[c.id]||0)} أعضاء</small></div><strong>${Number(c.club_points)} pts</strong>${c.id===myId?'<span class="entry-badge">منخرط</span>':`<button class="secondary-btn" onclick="joinClub('${c.id}')">انضمام</button>`}</article>`).join('')||'<div class="empty-card">مازال ما كاين حتى نادي.</div>';
}
function openCreateClubModal(){openModal(`<div class="modal-head"><h2>🏟️ إنشاء نادي</h2><button onclick="closeModal()">×</button></div><div class="modal-body"><label>اسم النادي</label><input id="clubName" class="modal-input" maxlength="40"><label>Tag</label><input id="clubTag" class="modal-input" maxlength="8"><label>شعار</label><input id="clubLogo" class="modal-input" maxlength="4" value="🛡️"><button class="primary-btn" onclick="createClub()">إنشاء النادي</button></div>`)}
async function createClub(){const n=$("clubName")?.value.trim(),t=$("clubTag")?.value.trim(),l=$("clubLogo")?.value.trim();const {error}=await supabaseClient.rpc('create_club',{p_name:n,p_tag:t,p_logo:l});if(error)return showToast('ما قدرناش نصايبو النادي.');closeModal();showToast('🏟️ تصايب النادي!');renderClubs();}
async function joinClub(id){const {error}=await supabaseClient.rpc('join_club',{p_club_id:id});if(error)return showToast((error.message||'').includes('ALREADY_IN_CLUB')?'راك منخرط فشي نادي.':'ما قدرناش تنضم.');showToast('دخلتي للنادي 🏟️');renderClubs();}

async function renderSeason(){
  const hero=$("seasonHero"), box=$("missionsList"); if(!hero||!currentUser)return;
  await supabaseClient.rpc("refresh_my_missions");
  const {data:s}=await supabaseClient.from('seasons').select('*').eq('active',true).order('starts_at',{ascending:false}).limit(1).maybeSingle(); if(!s){hero.innerHTML='<div class="empty-card">ما كاين حتى Season دابا.</div>';box.innerHTML='';return;}
  const {data:m}=await supabaseClient.from('missions').select('*').eq('season_id',s.id).eq('active',true); const {data:pm}=await supabaseClient.from('player_missions').select('*').eq('player_id',currentUser.id).in('mission_id',(m||[]).map(x=>x.id)); const map=new Map((pm||[]).map(x=>[x.mission_id,x]));
  hero.innerHTML=`<div class="season-hero-inner"><span>⚡ ${escapeHTML(s.code)}</span><h2>${escapeHTML(s.name)}</h2><p>${escapeHTML(formatDate(s.starts_at))} → ${escapeHTML(formatDate(s.ends_at))}</p></div>`;
  box.innerHTML=(m||[]).map(x=>{const z=map.get(x.id),prog=Math.min(Number(x.target),Number(z?.progress||0)),pct=Math.round(prog*100/Number(x.target));return `<article class="mission-card"><div class="mission-icon">🎯</div><div><h3>${escapeHTML(x.title)}</h3><p>${escapeHTML(x.description)}</p><div class="mission-track"><span style="width:${pct}%"></span></div><small>${prog}/${Number(x.target)} · +${Number(x.xp_reward)} XP · +${Number(x.coins_reward)} 🪙</small></div><strong>${z?.completed_at?'✅':'+'+pct+'%'}</strong></article>`}).join('')||'<div class="empty-card">ما كايناش Missions.</div>';
}

async function renderActivityFeed(){
  const box=$("activityFeedList");if(!box||!currentUser)return; const {data:rows,error}=await supabaseClient.from('activity_feed').select('id,player_id,type,title,body,metadata,created_at').order('created_at',{ascending:false}).limit(50); if(error){box.innerHTML='<div class="empty-card">تعذر تحميل النشاط.</div>';return;} const ids=[...new Set((rows||[]).map(x=>x.player_id).filter(Boolean))];const {data:ps}=ids.length?await supabaseClient.from('profiles').select('id,display_name,username,player_code,profile_badge,level').in('id',ids):{data:[]};const map=new Map((ps||[]).map(x=>[x.id,x]));box.innerHTML=(rows||[]).map(x=>{const p=map.get(x.player_id);return `<article class="activity-card"><div class="activity-avatar">${escapeHTML(p?.profile_badge||'⚡')}</div><div><strong>${escapeHTML(p?.display_name||'CHAoui')}</strong><span>${escapeHTML(x.title)}</span><p>${escapeHTML(x.body||'')}</p><small>${escapeHTML(formatDate(x.created_at))}</small></div></article>`}).join('')||'<div class="empty-card">مازال ما كاين حتى نشاط.</div>';
}

function initAssistant(){const box=$("assistantMessages");if(!box||box.dataset.ready)return;box.dataset.ready='1';box.innerHTML='<div class="assistant-bubble bot">سلام 👋 أنا CHAoui Assistant. سولني على الماتشات، الـCoins، الـLevel، البطولات أو الـMissions.</div>';$("assistantForm")?.addEventListener('submit',e=>{e.preventDefault();const input=$("assistantInput");const q=input.value.trim();if(q){input.value='';askChaoui(q);}})}
async function askChaoui(q){
  const box=$("assistantMessages");if(!box)return;box.insertAdjacentHTML('beforeend',`<div class="assistant-bubble user">${escapeHTML(q)}</div>`);
  const p=currentProfile||{};let answer='';const level=Number(p.level||1),xp=Number(p.xp||0),coins=Number(p.coins||0),base=100,next=base-(xp%base);
  if(/coin|فلوس|نقود|نشري|shop/i.test(q)) answer=`عندك دابا 🪙 ${coins} Coins. تقدر تشوف المتجر والـMystery Boxes من صفحة Coins & Shop.`;
  else if(/level|ليفيل|مستوى/i.test(q)) answer=`نتا فـLevel ${level} وعندك ${xp} XP. تقريباً باقي ${next} XP باش تكمل الشريط الحالي.`;
  else if(/اليوم|today|match|مباراة/i.test(q)){const {data}=await supabaseClient.from('matches').select('id,status,scheduled_at,round').or(`player_a.eq.${currentUser?.id},player_b.eq.${currentUser?.id}`).order('scheduled_at',{ascending:true}).limit(3);answer=data?.length?`عندك ${data.length} مباريات قريبة/مسجلة. دخل لـ«مبارياتي» باش تشوف التفاصيل.`:'ما لقيتش ليك مباراة مسجلة دابا.';}
  else if(/mission|challenge|تحدي/i.test(q)) answer='دخل لـSeason باش تشوف Missions ديال الموسم والتقدم ديالك.';
  else if(/tournament|بطولة/i.test(q)) answer='دخل للبطولات باش تشوف المفتوحة، وتقدر تتواصل مع المنظم مباشرة من صفحة البطولة ملي يكون الشات متاح.';
  else answer='نقدر نعاونك فـCoins، Level، Missions، Matches والبطولات. جرب سؤال قصير ومحدد.';
  box.insertAdjacentHTML('beforeend',`<div class="assistant-bubble bot">${escapeHTML(answer)}</div>`);box.scrollTop=box.scrollHeight;
}

function openCoinGrantModal(id){
  if(currentProfile?.role!=='owner')return showToast('Owner فقط.');const p=kingPlayersCache.find(x=>x.id===id);if(!p)return;
  openModal(`<div class="modal-head"><h2>🪙 إعطاء Coins</h2><button onclick="closeModal()">×</button></div><div class="modal-body"><p><strong>${escapeHTML(p.display_name||p.username)}</strong> · ${escapeHTML(p.player_code||'')}</p><label>عدد Coins</label><input id="grantCoinsAmount" class="modal-input" type="number" min="1" max="1000000" value="100"><label>السبب</label><input id="grantCoinsReason" class="modal-input" maxlength="120" value="دفع / مكافأة من Owner"><label>ملاحظة</label><textarea id="grantCoinsNote" class="modal-input" rows="3" maxlength="500"></textarea><button class="primary-btn" onclick="grantCoinsToPlayer('${id}')">🪙 إعطاء Coins</button></div>`);
}
async function grantCoinsToPlayer(id){const amount=Number($("grantCoinsAmount")?.value);const reason=$("grantCoinsReason")?.value.trim()||'دفعة من Owner';const note=$("grantCoinsNote")?.value.trim()||null;const {error}=await supabaseClient.rpc('owner_grant_coins',{p_target:id,p_amount:amount,p_reason:reason,p_note:note});if(error)return showToast((error.message||'').includes('INVALID_COIN_AMOUNT')?'عدد Coins غير صالح.':'ما قدرناش نضيفو Coins.');closeModal();showToast(`🪙 تزادو ${amount} Coins بنجاح.`);renderKingPlayers($("kingPlayerSearch")?.value.trim()||'');}
function openCoinSettingsModal(){
  if(currentProfile?.role!=='owner')return showToast('Owner فقط.');supabaseClient.from('coin_settings').select('*').eq('id',1).single().then(({data,error})=>{if(error||!data)return showToast('تعذر تحميل إعدادات Coins.');openModal(`<div class="modal-head"><h2>⚙️ اقتصاد Coins</h2><button onclick="closeModal()">×</button></div><div class="modal-body coin-settings-grid"><label>Daily Base<input id="csDaily" class="modal-input" type="number" value="${data.daily_base}"></label><label>Win Reward<input id="csWin" class="modal-input" type="number" value="${data.win_reward}"></label><label>Draw Reward<input id="csDraw" class="modal-input" type="number" value="${data.draw_reward}"></label><label>Loss Reward<input id="csLoss" class="modal-input" type="number" value="${data.loss_reward}"></label><label>Streak 3 Bonus<input id="csS3" class="modal-input" type="number" value="${data.streak_bonus_3}"></label><label>Streak 5 Bonus<input id="csS5" class="modal-input" type="number" value="${data.streak_bonus_5}"></label><label>Tournament Win<input id="csTour" class="modal-input" type="number" value="${data.tournament_win_reward}"></label><label>Note<input id="csNote" class="modal-input" value="${escapeHTML(data.owner_note||'')}"></label><button class="primary-btn" onclick="saveCoinSettings()">حفظ اقتصاد Coins</button></div>`);});
}
async function saveCoinSettings(){const n=id=>Number($(id)?.value);const {error}=await supabaseClient.rpc('owner_update_coin_settings',{p_daily_base:n('csDaily'),p_win_reward:n('csWin'),p_draw_reward:n('csDraw'),p_loss_reward:n('csLoss'),p_streak_bonus_3:n('csS3'),p_streak_bonus_5:n('csS5'),p_tournament_win_reward:n('csTour'),p_note:$("csNote")?.value.trim()||null});if(error)return showToast('ما قدرناش نحفظو إعدادات Coins.');closeModal();showToast('⚙️ تحدّث اقتصاد Coins.');}


async function openOwnerShopManager(){
  if(currentProfile?.role!=='owner')return showToast('Owner فقط.');
  const {data,error}=await supabaseClient.from('rewards').select('id,name,cost,level_required,active,icon').order('cost');
  if(error)return showToast('تعذر تحميل المتجر.');
  const rows=(data||[]).map(r=>`<div class="owner-edit-row"><span>${escapeHTML(r.icon||'🎁')} ${escapeHTML(r.name)}</span><input id="rcost_${r.id}" type="number" min="0" class="modal-input" value="${Number(r.cost)}"><input id="rlvl_${r.id}" type="number" min="1" class="modal-input" value="${Number(r.level_required)}"><label><input id="ract_${r.id}" type="checkbox" ${r.active?'checked':''}> active</label><button class="secondary-btn" onclick="saveOwnerReward('${r.id}')">حفظ</button></div>`).join('');
  openModal(`<div class="modal-head"><h2>🛒 إدارة المتجر</h2><button onclick="closeModal()">×</button></div><div class="modal-body owner-manager-list"><p>Owner يقدر يحدد ثمن كل item وLevel اللي كتتحل فيه.</p>${rows||'<div class="empty-card">المتجر خالي.</div>'}</div>`);
}
async function saveOwnerReward(id){const cost=Number($("rcost_"+id)?.value),lvl=Number($("rlvl_"+id)?.value),active=$("ract_"+id)?.checked;const {error}=await supabaseClient.rpc('owner_update_reward',{p_reward_id:id,p_cost:cost,p_level:lvl,p_active:active});if(error)return showToast('ما قدرناش نحدثو item.');showToast('تحدّث item ✅');}
async function openOwnerBoxManager(){
  if(currentProfile?.role!=='owner')return showToast('Owner فقط.');
  const [{data:boxes},{data:rewards}]=await Promise.all([supabaseClient.from('mystery_boxes').select('id,name,cost,level_required,active,icon').order('cost'),supabaseClient.from('mystery_box_rewards').select('id,box_id,reward_type,reward_value,amount,weight,active').order('weight',{ascending:false})]);
  const rewardMap=new Map();(rewards||[]).forEach(r=>{if(!rewardMap.has(r.box_id))rewardMap.set(r.box_id,[]);rewardMap.get(r.box_id).push(r)});
  const rows=(boxes||[]).map(b=>`<article class="owner-box-manager"><div class="owner-edit-row"><strong>${escapeHTML(b.icon||'🎁')} ${escapeHTML(b.name)}</strong><input id="bcost_${b.id}" type="number" min="0" class="modal-input" value="${Number(b.cost)}"><input id="blvl_${b.id}" type="number" min="1" class="modal-input" value="${Number(b.level_required)}"><label><input id="bact_${b.id}" type="checkbox" ${b.active?'checked':''}> active</label><button class="secondary-btn" onclick="saveOwnerBox('${b.id}')">حفظ</button></div><div class="box-reward-editor">${(rewardMap.get(b.id)||[]).map(r=>`<div class="owner-edit-row mini"><span>${escapeHTML(r.reward_value)}</span><input id="ramt_${r.id}" type="number" min="0" class="modal-input" value="${Number(r.amount)}"><input id="rweight_${r.id}" type="number" min="1" class="modal-input" value="${Number(r.weight)}"><label><input id="rra_${r.id}" type="checkbox" ${r.active?'checked':''}> active</label><button class="secondary-btn" onclick="saveOwnerBoxReward('${r.id}')">حفظ</button></div>`).join('')}</div></article>`).join('');
  openModal(`<div class="modal-head"><h2>🎁 Mystery Boxes</h2><button onclick="closeModal()">×</button></div><div class="modal-body owner-manager-list"><p>بدل ثمن الصندوق، Level، والكمية والاحتمال ديال الجوائز.</p>${rows||'<div class="empty-card">ما كايناش Boxes.</div>'}</div>`);
}
async function saveOwnerBox(id){const cost=Number($("bcost_"+id)?.value),lvl=Number($("blvl_"+id)?.value),active=$("bact_"+id)?.checked;const {error}=await supabaseClient.rpc('owner_update_mystery_box',{p_box_id:id,p_cost:cost,p_level:lvl,p_active:active});if(error)return showToast('ما قدرناش نحدثو الصندوق.');showToast('تحدّث الصندوق ✅');}
async function saveOwnerBoxReward(id){const amount=Number($("ramt_"+id)?.value),weight=Number($("rweight_"+id)?.value),active=$("rra_"+id)?.checked;const {error}=await supabaseClient.rpc('owner_update_mystery_reward',{p_reward_id:id,p_amount:amount,p_weight:weight,p_active:active});if(error)return showToast('ما قدرناش نحدثو الجائزة.');showToast('تحدّثات الجائزة ✅');}

/* =========================================================
   GLOBAL CLICK EVENTS
   ========================================================= */

document.addEventListener(
  "click",
  event => {


    const pageButton =
      event.target.closest(
        "[data-page]"
      );


    if (pageButton) {

      const page =
        pageButton.dataset.page;


      if (page) {
        showPage(page);
      }


      return;

    }


    const tournamentButton =
      event.target.closest(
        ".tournament-open-btn"
      );


    if (tournamentButton) {

      const id =
        tournamentButton.dataset
          .tournament;


      if (id) {
        openTournament(id);
      }


      return;

    }


    const orgEditButton =
      event.target.closest(
        ".org-edit-btn"
      );


    if (orgEditButton) {

      const id =
        orgEditButton.dataset
          .tournament;


      if (id) {
        editTournamentFetchAndOpen(id);
      }


      return;

    }


    const orgCloseButton =
      event.target.closest(
        ".org-close-btn"
      );


    if (orgCloseButton) {

      const id =
        orgCloseButton.dataset
          .tournament;


      if (id) {
        closeTournamentRegistration(id);
      }


      return;

    }


    const orgDeleteButton =
      event.target.closest(
        ".org-delete-btn"
      );


    if (orgDeleteButton) {

      const id =
        orgDeleteButton.dataset
          .tournament;


      if (
        id &&
        confirm(
          "متأكد بغيتي تحذف هاد البطولة؟ هاد الإجراء ما يترجعش."
        )
      ) {

        deleteTournamentConfirmed(id);

      }


      return;

    }


    const copyWaBtn =
      event.target.closest(
        ".king-copy-wa"
      );


    if (copyWaBtn) {

      const wa =
        copyWaBtn.dataset.wa;


      if (navigator.clipboard) {

        navigator.clipboard
          .writeText(wa)

          .then(() => {

            showToast(
              "تم نسخ الرقم 📋"
            );

          })

          .catch(() => {

            showToast(
              "ما قدرناش ننسخو."
            );

          });

      }


      return;

    }


    const openWaBtn =
      event.target.closest(
        ".king-open-wa"
      );


    if (openWaBtn) {

      const wa =
        (
          openWaBtn.dataset.wa ||
          ""
        ).replace(
          /\D/g,
          ""
        );


      if (wa) {

        window.open(
          `https://wa.me/${wa}`,
          "_blank"
        );

      }


      return;

    }


    const coinGrantBtn = event.target.closest(".coin-grant-btn");
    if (coinGrantBtn) { openCoinGrantModal(coinGrantBtn.dataset.id); return; }

    const togglePremiumBtn =
      event.target.closest(
        ".king-toggle-premium"
      );


    if (togglePremiumBtn) {

      const id =
        togglePremiumBtn.dataset.id;


      const value =
        togglePremiumBtn.dataset.value ===
        "1";


      if (id) {

        toggleKingPremium(
          id,
          value
        );

      }


      return;

    }


    const organizerMenuBtn =
      event.target.closest(
        ".king-organizer-menu"
      );


    if (organizerMenuBtn) {

      const id =
        organizerMenuBtn.dataset.id;


      if (id) {

        openOrganizerAccessModal(
          id
        );

      }


      return;

    }

  }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function startCHAouiApp() {

    console.log(
      "CHAOUI 🔥 starting..."
    );


    initSplash();


    $("showRegister")
      ?.addEventListener(
        "click",
        showRegisterForm
      );


    $("showLogin")
      ?.addEventListener(
        "click",
        showLoginForm
      );


    $("loginBtn")
      ?.addEventListener(
        "click",
        loginUser
      );

    $("resetPasswordBtn")
      ?.addEventListener(
        "click",
        resetPassword
      );


    $("registerBtn")
      ?.addEventListener(
        "click",
        registerUser
      );



    document
      .querySelectorAll(
        ".nav-item"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () =>
            showPage(
              button.dataset.page
            )
        );

      });


    initTournamentFilters();

    initRankingTabs();


    $("editProfileBtn")
      ?.addEventListener(
        "click",
        openEditProfile
      );


    $("newComplaintBtn")
      ?.addEventListener(
        "click",
        openNewComplaint
      );

    $("homeDailyClaim")
      ?.addEventListener("click", claimDailyCoins);


    $("chatComposer")?.addEventListener("submit", event => { event.preventDefault(); sendChatMessage(); });

    $("logoutBtn")
      ?.addEventListener(
        "click",
        logoutUser
      );


    $("headerBackBtn")
      ?.addEventListener(
        "click",
        goBack
      );


    $("headerHomeBtn")
      ?.addEventListener(
        "click",
        () => {

          pageHistory = [];

          showPage(
            "home",
            {
              fromBack: true
            }
          );

        }
      );


    $("headerLogoutBtn")
      ?.addEventListener(
        "click",
        logoutUser
      );


    $("openOrganizerPanel")
      ?.addEventListener(
        "click",
        () => {

          if (
            isOrganizerActive(
              currentProfile
            )
          ) {

            showPage(
              "organizer"
            );

          } else {

            showToast(
              "هاد الصفحة خاصة بالمنظم. تواصل مع Owner."
            );

          }

        }
      );


    $("organizerCreate")
      ?.addEventListener(
        "click",
        openCreateTournament
      );


    $("organizerTournaments")
      ?.addEventListener(
        "click",
        () =>
          showPage(
            "tournaments"
          )
      );


    $("organizerMatches")
      ?.addEventListener(
        "click",
        () =>
          showPage(
            "matches"
          )
      );


    $("organizerComplaints")
      ?.addEventListener(
        "click",
        () =>
          showPage(
            "complaints"
          )
      );


    $("createTournamentBtn")
      ?.addEventListener(
        "click",
        openCreateTournament
      );


    $("openKingPanel")
      ?.addEventListener(
        "click",
        () => {

          if (
            currentProfile?.role ===
            "owner"
          ) {

            showPage(
              "king"
            );

          } else {

            showToast(
              "🔒 Access denied."
            );

          }

        }
      );


    $("kingPlayerSearch")
      ?.addEventListener(
        "input",
        event => {

          clearTimeout(
            window._kingSearchTimer
          );


          window._kingSearchTimer =
            setTimeout(
              () => {

                renderKingPlayers(
                  event.target.value.trim()
                );

              },
              300
            );

        }
      );


    $("onlineToggleBtn")
      ?.addEventListener(
        "click",
        async () => {

          if (
            !currentUser ||
            !currentProfile
          ) {
            return;
          }


          const next =
            !currentProfile.online;


          const {
            data,
            error
          } =
            await supabaseClient
              .from("profiles")
              .update({
                online: next
              })
              .eq(
                "id",
                currentUser.id
              )
              .select()
              .single();


          if (error) {

            console.error(error);

            showToast(
              "وقع مشكل."
            );

            return;

          }


          currentProfile =
            data;


          if ($("onlineStatus")) {

            $("onlineStatus").textContent =
              next
                ? "Online"
                : "Offline";

          }

        }
      );


    /*
       FINAL SESSION CHECK
    */

    await checkSession();


    console.log(
      "CHAOUI 🔥 ready."
    );

}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startCHAouiApp, { once: true });
} else {
  startCHAouiApp();
}
