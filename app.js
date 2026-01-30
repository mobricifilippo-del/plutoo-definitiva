/* ================= CRASH DEBUG SYSTEM (OBBLIGATORIO) ================= */

// 1️⃣ Errori JS globali (con STACK reale quando disponibile)
window.addEventListener("error", function (e) {
  try {
    const errObj = e && e.error ? e.error : null;

    // errori di risorse (script/img/css) spesso NON hanno filename/line
    const target = e && e.target ? e.target : null;
    const resUrl =
      target && (target.src || target.href)
        ? (target.src || target.href)
        : "";

    const msg = (e && e.message) ? e.message : "(no message)";
    const file = (e && e.filename) ? e.filename : (resUrl || "(no file)");
    const line = (e && typeof e.lineno === "number") ? e.lineno : "-";
    const col  = (e && typeof e.colno === "number") ? e.colno : "-";
    const stack = (errObj && errObj.stack) ? ("\n\nSTACK:\n" + errObj.stack) : "";

    alert(
      "❌ JS ERROR\n\n" +
      "Messaggio: " + msg + "\n" +
      "File: " + file + "\n" +
      "Linea: " + line + ":" + col +
      stack
    );
  } catch (_) {
    alert("❌ JS ERROR\n\n(Impossibile leggere dettagli errore)");
  }
}, true);

// 2️⃣ Errori Promise / Firebase (robusto: niente JSON.stringify che può crashare)
window.addEventListener("unhandledrejection", function (e) {
  try {
    const r = e && e.reason;

    let msg = "";
    if (r && typeof r === "object") {
      if (r.message) msg += "Messaggio: " + r.message + "\n";
      if (r.code) msg += "Code: " + r.code + "\n";
      if (r.name) msg += "Name: " + r.name + "\n";
      if (r.stack) msg += "\nSTACK:\n" + r.stack + "\n";
      if (!msg) msg = "Reason object (non leggibile)";
    } else {
      msg = String(r);
    }

    alert("❌ PROMISE ERROR\n\n" + msg);
  } catch (_) {
    alert("❌ PROMISE ERROR\n\n(Impossibile leggere e.reason)");
  }
});

// 3️⃣ Verifica Firestore sempre disponibile
function assertFirestore() {
  if (!window.db) {
    alert("❌ FIRESTORE NON INIZIALIZZATO (window.db è undefined)");
    return false;
  }
  return true;
}

// 4️⃣ Verifica UID sempre presente
function assertUID() {
  if (!window.PLUTOO_UID) {
    alert("❌ UTENTE NON AUTENTICATO (PLUTOO_UID mancante)");
    return false;
  }
  return true;
}

// 5️⃣ Wrapper sicuro per Firestore write
async function safeFirestoreWrite(label, fn) {
  if (!assertFirestore() || !assertUID()) {
    alert("❌ BLOCCO WRITE: " + label);
    return;
  }
  try {
    await fn();
  } catch (e) {
    const emsg = (e && e.message) ? e.message : String(e);
    const estack = (e && e.stack) ? ("\n\nSTACK:\n" + e.stack) : "";
    alert(
      "❌ FIRESTORE WRITE ERROR\n\n" +
      label + "\n\n" +
      emsg +
      estack
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const authSheet = document.getElementById("authSheet");
  const linkLogin = document.getElementById("linkLogin");
  const linkRegister = document.getElementById("linkRegister");
  const authClose = document.getElementById("authClose");
  const authGoLogin = document.getElementById("authGoLogin");
  const authGoRegister = document.getElementById("authGoRegister");
  const loginForm = document.getElementById("authLoginForm");
  const registerForm = document.getElementById("authRegisterForm");
  const authAlready = document.getElementById("authAlready");

  // ✅ NASCONDI DEFINITIVAMENTE "Vai a Login" / "Vai a Registrazione" + contenitore (sparisce anche il puntino)
  try {
    if (authGoLogin) authGoLogin.style.display = "none";
    if (authGoRegister) authGoRegister.style.display = "none";
    const navRow = (authGoLogin && authGoLogin.parentElement) ? authGoLogin.parentElement
                 : (authGoRegister && authGoRegister.parentElement) ? authGoRegister.parentElement
                 : null;
    if (navRow) navRow.style.display = "none";
  } catch (_) {}

  function openAuth(mode) {
    authSheet.classList.remove("hidden");
    loginForm.classList.add("hidden");
    registerForm.classList.add("hidden");
    authAlready.classList.add("hidden");

    if (mode === "login") loginForm.classList.remove("hidden");
    if (mode === "register") registerForm.classList.remove("hidden");
  }

  function closeAuth() {
    authSheet.classList.add("hidden");
  }

  linkLogin.addEventListener("click", (e) => {
    e.preventDefault();
    openAuth("login");
  });

  linkRegister.addEventListener("click", (e) => {
    e.preventDefault();
    openAuth("register");
  });

  authGoLogin?.addEventListener("click", () => openAuth("login"));
  authGoRegister?.addEventListener("click", () => openAuth("register"));
  authClose.addEventListener("click", closeAuth);

  // chiudi cliccando fuori (backdrop)
  authSheet.querySelector('[data-auth-close="1"]')?.addEventListener("click", closeAuth);

  // helper error box (rosso SOLO per errori, GOLD per successi ✅)
  function setAuthError(which, msg) {
    const box = document.getElementById(which === "login" ? "loginError" : "registerError");
    if (!box) return;

    if (!msg) {
      box.textContent = "";
      box.classList.add("hidden");
      box.removeAttribute("role");
      box.style.background = "";
      box.style.border = "";
      box.style.color = "";
      return;
    }

    const text = String(msg);
    const isSuccess = text.trim().startsWith("✅");

    box.textContent = text;
    box.classList.remove("hidden");
    box.setAttribute("role", "status");

    if (isSuccess) {
      // ✅ SUCCESSO: GOLD
      box.style.background = "rgba(205, 164, 52, 0.14)";
      box.style.border = "1px solid rgba(205, 164, 52, 0.35)";
      box.style.color = "#CDA434";
    } else {
      // ❌ ERRORE: rosso
      box.style.background = "rgba(180, 30, 30, 0.18)";
      box.style.border = "1px solid rgba(255, 90, 90, 0.35)";
      box.style.color = "#ffd1d1";
    }
  }

  // mostra stato già loggato (se serve)
  function showAlready() {
    const u = window.auth && window.auth.currentUser ? window.auth.currentUser : null;
    if (!u) return false;
    const emailEl = document.getElementById("authAlreadyEmail");
    if (emailEl) emailEl.textContent = u.email || "";
    loginForm.classList.add("hidden");
    registerForm.classList.add("hidden");
    authAlready.classList.remove("hidden");
    return true;
  }

  // override openAuth: se già loggato, mostra "già loggato"
  const _openAuth = openAuth;
  openAuth = function (mode) {
    authSheet.classList.remove("hidden");
    setAuthError("login", "");
    setAuthError("register", "");

    // se già loggato, mostro stato già loggato
    if (showAlready()) return;

    _openAuth(mode);
  };

  // ✅ ESPONGO IN GLOBALE (serve fuori da DOMContentLoaded: onAuthStateChanged / onclick)
  window.openAuth = openAuth;
  window.closeAuth = closeAuth;

  // SUBMIT LOGIN
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setAuthError("login", "");

  const email = (document.getElementById("loginEmail")?.value || "").trim();
  const pass = (document.getElementById("loginPass")?.value || "");

  if (!email || !pass) {
    setAuthError("login", "Email e password obbligatorie");
    return;
  }

  try {
    await window.auth.signInWithEmailAndPassword(email, pass);

    // ✅ feedback GOLD + chiusura
    setAuthError("login", "✅ Login effettuato");
    setTimeout(() => {
      closeAuth();
    }, 700);

  } catch (err) {
    const code = err && err.code ? String(err.code) : "";

    setAuthError("login", err?.message || "Errore login");
  }
});

// PASSWORD DIMENTICATA? -> invia email reset (Firebase)
document.getElementById("btnForgotPass")?.addEventListener("click", async () => {
  setAuthError("login", "");

  const email = (document.getElementById("loginEmail")?.value || "").trim();
  if (!email) {
    setAuthError("login", "❌ Inserisci prima l’email");
    return;
  }

  try {
    await window.auth.sendPasswordResetEmail(email);
    setAuthError("login", "✅ Email di recupero inviata");
  } catch (err) {
    setAuthError("login", err?.message || "Errore recupero password");
  }
});

  // SUBMIT REGISTRAZIONE
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAuthError("register", "");

    const email = (document.getElementById("regEmail")?.value || "").trim();
    const p1 = (document.getElementById("regPass")?.value || "");
    const p2 = (document.getElementById("regPass2")?.value || "");

    if (!email || !p1 || !p2) {
      setAuthError("register", "Compila tutti i campi");
      return;
    }
    if (p1 !== p2) {
      setAuthError("register", "Le password non coincidono");
      return;
    }

    try {
      await window.auth.createUserWithEmailAndPassword(email, p1);

      // ✅ feedback GOLD + chiusura
      setAuthError("register", "✅ Registrazione completata");
      setTimeout(() => {
        closeAuth();
      }, 900);
    } catch (err) {
      setAuthError("register", err?.message || "Errore registrazione");
    }
  });

  // LOGOUT (dentro pannello "già loggato")
  document.getElementById("btnLogout")?.addEventListener("click", async () => {
    try {
      await window.auth.signOut();
      closeAuth();
    } catch (_) {}
  });

  document.getElementById("btnAlreadyClose")?.addEventListener("click", closeAuth);

 // ENTRA: gate finale stile Facebook
const btnEnter = document.getElementById("btnEnter");

function updateEnterState() {
  if (!btnEnter) return;

  const logged = !!(window.auth && window.auth.currentUser);

  if (logged) {
    btnEnter.disabled = false;
    btnEnter.classList.remove("disabled");

    // ✨ FEEDBACK LOGIN: accendi ENTRA (oro) se non ancora cliccato
    btnEnter.classList.add("enter-glow");
  } else {
    btnEnter.disabled = true;
    btnEnter.classList.add("disabled");

    // reset glow se logout
    btnEnter.classList.remove("enter-glow");
  }
}

btnEnter?.addEventListener("click", async (e) => {
  e.preventDefault();
  e.stopPropagation();

  // sicurezza extra
  if (!window.auth || !window.auth.currentUser) {
    openAuth("login");
    return;
  }

  // ✨ rimuove il glow SOLO quando clicco ENTRA
  btnEnter.classList.remove("enter-glow");

  // ✅ DOG presence check (Firestore source of truth)
  try {
    const uid = window.auth.currentUser.uid; // = PLUTOO_UID
    if (!uid || !window.db) throw new Error("Missing PLUTOO_UID or Firestore (window.db)");

    const snap = await window.db
      .collection("dogs")
      .where("ownerUid", "==", uid)
      .limit(1)
      .get();

    const hasDog = !snap.empty && String(snap.docs[0]?.data()?.name || "").trim().length > 0;
    const dogId = (!snap.empty && String(snap.docs[0]?.data()?.name || "").trim().length > 0) ? (snap.docs[0]?.id || null) : null;

    // Stato globale (runtime)
    window.PLUTOO_HAS_DOG = hasDog;
    // UI: "Crea profilo DOG" vicino a Ricerca personalizzata
const inlineBtn = document.getElementById("btnCreateDogInline");
if (inlineBtn) {
  inlineBtn.style.display = (hasDog === true) ? "none" : "inline-flex";
}
    window.PLUTOO_DOG_ID = dogId;

    // ✅ VETRINA: se non hai DOG, app in sola lettura (blocca interazioni)
    window.PLUTOO_READONLY = !hasDog;

// =========================
// ✅ CREATE DOG: handler unico (Vicino a te + dentro profilo)
// =========================
(function bindCreateDogButtonsOnce() {
  try {
    if (window.__createDogBindDone) return;
    window.__createDogBindDone = true;

    // show/hide bottone "Crea profilo DOG" accanto a Ricerca personalizzata
const inlineBtn = document.getElementById("btnCreateDogInline");
if (inlineBtn) {
  inlineBtn.style.display = (window.PLUTOO_HAS_DOG === true) ? "none" : "inline-flex";
}

    const clickHandler = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      // se non loggato -> login
      if (!window.auth || !window.auth.currentUser) {
        if (typeof openAuth === "function") openAuth("login");
        return;
      }

      // se già ho DOG -> non deve succedere (bottone dovrebbe essere nascosto)
      if (window.PLUTOO_HAS_DOG === true) return;

      if (typeof window.openProfilePage === "function") {
        window.openProfilePage({
          id: "__create__",
          isCreate: true,
          name: "",
          img: "",
          breed: "",
          bio: "",
          age: "",
          km: 0,
          sex: ""
        });
      }
      return;
    }

    // Delegation: funziona anche quando i bottoni vengono creati via innerHTML
    document.addEventListener("click", (ev) => {
      const t = ev.target;
      if (!t) return;

      const btn = t.closest && t.closest("#btnCreateDogInline, #btnCreateDogFromProfile");
      if (!btn) return;

      clickHandler(ev);
    }, true);

  } catch (e) {
    console.error("bindCreateDogButtonsOnce error:", e);
  }
})();

    // Cache (non source of truth)
    try {
      localStorage.setItem("plutoo_has_dog", hasDog ? "1" : "0");
      if (dogId) localStorage.setItem("plutoo_dog_id", dogId);
      else localStorage.removeItem("plutoo_dog_id");
      localStorage.setItem("plutoo_readonly", window.PLUTOO_READONLY ? "1" : "0");
    } catch (_) {}
    
  } catch (err) {
    // fallback safe: segnala "DOG assente" e prosegue
    window.PLUTOO_HAS_DOG = false;
    window.PLUTOO_DOG_ID = null;
    window.PLUTOO_READONLY = true;
    try {
      localStorage.setItem("plutoo_has_dog", "0");
      localStorage.removeItem("plutoo_dog_id");
      localStorage.setItem("plutoo_readonly", "1");
    } catch (_) {}
  }

  // ✅ ENTRA definitivo (WOW)
  try { localStorage.setItem("entered", "1"); } catch (err) {}
  state.entered = true;

  const bark = document.getElementById("dogBark");
  if (bark) {
    bark.currentTime = 0;
    bark.volume = 0.5;
    const playPromise = bark.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise.catch(() => {
        // in produzione niente alert
      });
    }
  }

  if (heroLogo) {
    heroLogo.classList.remove("heartbeat-violet", "heartbeat-violet-wow");
    void heroLogo.offsetWidth;
    heroLogo.classList.add("heartbeat-violet-wow");
  }

  const flash = document.getElementById("whiteFlash");
  if (flash) {
    flash.classList.add("active");
  }

  const targetView = state.currentView || "nearby";

  setTimeout(() => {

    appScreen?.classList.remove("hidden");
    document.body.classList.remove("story-open");

    if (typeof initStories === "function") {
      initStories();
    }

    // vista normale
    try { state.currentView = targetView; } catch (_) {}
    setActiveView(targetView);

// =========================
// ✅ VETRINA: blocco interazioni (definitivo) — SOLO BLOCCO UPLOAD
// =========================
try {
  if (window.PLUTOO_READONLY) {
    document.body.classList.add("plutoo-readonly");

    const msg = state.lang === "it"
      ? "🔒 Crea il tuo profilo DOG per caricare foto o documenti"
      : "🔒 Create your DOG profile to upload photos or documents";
    if (typeof showToast === "function") showToast(msg);

    // ✅ disabilita SOLO azioni di UPLOAD (non chat/like/follow/tabs)
    const idsToDisable = [
      "uploadSelfie",
      "publishStory"
    ];
    idsToDisable.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = true;
    });

    // ✅ intercetta SOLO click su upload foto/documenti
    if (!window.__plutooReadonlyBound) {
      window.__plutooReadonlyBound = true;

      document.addEventListener("click", (ev) => {
        try {
          if (!window.PLUTOO_READONLY || state.currentDogProfile?.id === "__create__") return;

          const t = ev.target;
          if (!t) return;

          const node = (t.closest ? t.closest("button,a,label,input,div,span") : null) || t;
          const id = node && node.id ? String(node.id) : "";

          // blocca anche classi note (UI)
          const isAddPhoto = !!(node && node.classList && node.classList.contains("add-photo"));
          const isDocItem  = !!(node && node.classList && node.classList.contains("doc-item"));

          // blocca anche click su input file (se presente)
          const isFileInput = !!(node && node.tagName === "INPUT" && String(node.type).toLowerCase() === "file");

          const isBlocked =
            isAddPhoto ||
            isDocItem ||
            isFileInput ||
            id === "uploadSelfie" ||
            id === "publishStory";

          if (!isBlocked) return; // ✅ tutto il resto resta cliccabile

          ev.preventDefault();
          ev.stopPropagation();
          ev.stopImmediatePropagation();

          const msg2 = state.lang === "it"
            ? "🔒 Per caricare foto o documenti devi creare il profilo DOG"
            : "🔒 To upload photos or documents you must create your DOG profile";
          if (typeof showToast === "function") showToast(msg2);
          return false;
        } catch (_) {}
      }, true);
    }
  } else {
    document.body.classList.remove("plutoo-readonly");
  }
} catch (_) {}
  }, 500);

  setTimeout(() => {
    homeScreen?.classList.add("hidden");
    const flash2 = document.getElementById("whiteFlash");
    if (flash2) {
      flash2.classList.remove("active");
    }
    if (heroLogo) {
      heroLogo.style.transition = "opacity 1.5s ease-out";
      heroLogo.style.opacity = "0";
      showAdBanner();
    }
  }, 2000);

  setTimeout(() => {
    if (heroLogo) {
      heroLogo.classList.remove("heartbeat-violet-wow");
      heroLogo.style.opacity = "";
      heroLogo.style.transition = "";
    }
  }, 3500);
});

// iniziale + ogni cambio auth
updateEnterState();
firebase.auth().onAuthStateChanged(() => {
  updateEnterState();
});
}); // <-- CHIUDE

  // Firebase handles
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ✅ Espongo handle Firebase in globale (serve a funzioni fuori scope: follow/like ecc.)
window.auth = auth;
window.db = db;
window.storage = storage;

// ✅ Persistenza Auth su device (no reset dopo refresh)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((err) => {
  console.error("Auth persistence error:", err);
});

auth.onAuthStateChanged(async (user) => {
  try {
    const linkLogin = document.getElementById("linkLogin");
    const linkRegister = document.getElementById("linkRegister");

    if (!user) {
      // ===== NON LOGGATO =====
      window.PLUTOO_UID = null;
      window.__booted = false;

      if (linkLogin) {
        linkLogin.setAttribute("data-i18n", "login");
        linkLogin.textContent = "Login";
        linkLogin.onclick = (e) => {
          e.preventDefault();
          window.openAuth("login");
        };
      }

      if (linkRegister) {
        linkRegister.style.display = "";
      }

      return;
    }

    // ===== LOGGATO =====
    window.PLUTOO_UID = user.uid;

    if (linkLogin) {
      linkLogin.removeAttribute("data-i18n");
      linkLogin.textContent = "Logout";
      // ✅ NON fare logout qui: deve solo aprire la tendina account
      linkLogin.onclick = (e) => {
        e.preventDefault();
        window.openAuth("login"); // mostrerà "già loggato" grazie al tuo override
      };
    }

    if (linkRegister) {
      linkRegister.style.display = "none";
    }

    // 🔒 evita boot multipli sullo stesso UID
    if (window.__booted) return;
    window.__booted = true;

    // 🚀 avvio app
    if (typeof init === "function") init();

  } catch (e) {
    console.error("onAuthStateChanged error:", e);
  }
});

// Disabilita PWA/Service Worker dentro l'app Android (WebView)
const isAndroidWebView =
  navigator.userAgent.includes("Android") && navigator.userAgent.includes("wv");

if (isAndroidWebView) {
  // Stoppa eventuali service worker (evita doppia icona PWA)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((reg) => reg.unregister()))
      .catch(() => {});
  }

  // Blocca il prompt di installazione PWA
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
  });
}

  // ============ Helpers ============
  const $  = (id) => document.getElementById(id);
  const qs = (s, r=document) => r.querySelector(s);
  const qa = (s, r=document) => r ? Array.from(r.querySelectorAll(s)) : [];
  const $all = qa;

  function autodetectLang(){
    return (navigator.language||"it").toLowerCase().startsWith("en")?"en":"it";
  }

  let CURRENT_USER_DOG_ID = String(localStorage.getItem("currentDogId") || localStorage.getItem("dogId") || "d1");

  // ============ Stato (caricato da localStorage dove possibile) ============
  const state = {
    // UX / navigazione
    entered: localStorage.getItem("entered") === "1",
    currentView: localStorage.getItem("currentView") || "nearby",
    viewHistory: [],
    processingSwipe: false,

    // ===== Profile / Docs / Selfie (required for profile open) =====
ownerDocsUploaded: {},
dogDocsUploaded: {},
selfieUntilByDog: {},
ownerSocialByDog: {},

    // lingua
    lang: localStorage.getItem("lang") || autodetectLang(),

    // PLUS
    plus: localStorage.getItem("plutoo_plus") === "yes",
    plusPlan: localStorage.getItem("plusPlan") || "monthly",

    // Filtri
    filters: {
      breed:        localStorage.getItem("f_breed") || "",
      distKm:       parseInt(localStorage.getItem("f_distKm") || "50", 10),
      verified:     localStorage.getItem("f_verified") === "1",
      sex:          localStorage.getItem("f_sex") || "",
      ageMin:       localStorage.getItem("f_ageMin") || "",
      ageMax:       localStorage.getItem("f_ageMax") || "",
      weight:       localStorage.getItem("f_weight") || "",
      height:       localStorage.getItem("f_height") || "",
      pedigree:     localStorage.getItem("f_pedigree") || "",
      breeding:     localStorage.getItem("f_breeding") || "",
      size:         localStorage.getItem("f_size") || "",
    },

    // Swipe & rewards
    swipeCount: parseInt(localStorage.getItem("swipes") || "0", 10),
    nextRewardAt: parseInt(localStorage.getItem("nextRewardAt") || "10", 10),
    rewardOpen: false,

    // Match / amicizie / chat
    matches: JSON.parse(localStorage.getItem("matches") || "{}"),
    friendships: JSON.parse(localStorage.getItem("friendships") || "{}"),
    chatMessagesSent: JSON.parse(localStorage.getItem("chatMessagesSent") || "{}"),
    matchCount: Number(localStorage.getItem("matchCount") || "0"),

    // Selfie unlock (per DOG)
    selfieUntilByDog: JSON.parse(localStorage.getItem("selfieUntilByDog") || "{}"),

    // Rewards già visti per social
    socialRewardViewed: JSON.parse(localStorage.getItem("socialRewardViewed") || "{}"),

    // Dati caricati (docs)
    ownerDocsUploaded: JSON.parse(localStorage.getItem("ownerDocsUploaded") || "{}"),
    dogDocsUploaded: JSON.parse(localStorage.getItem("dogDocsUploaded") || "{}"),

    // Stories
    storyOpen: false,

    // Indici deck
    currentLoveIdx: 0,
    currentPlayIdx: 0,

    // Geo
    geo: null,

    // Razze
    breeds: [],

    // Profilo corrente
    currentDogProfile: null,
    previousViewForMessages: "nearby",

    // Follow / seguiti (mock locale)
    followersByDog: 
      JSON.parse(localStorage.getItem("followersByDog") || "{}"),
    followingByDog: 
      JSON.parse(localStorage.getItem("followingByDog") || "{}"),
    ownerSocialByDog: 
      JSON.parse(localStorage.getItem("ownerSocialByDog") || "{}"),

    // Like foto profilo
    photoLikesByDog: JSON.parse(localStorage.getItem("photoLikesByDog") || "{}"),

    // Like stories (per media id)
    storyLikesByMedia: JSON.parse(localStorage.getItem("storyLikesByMedia") || "{}"),
  };
 let nextMatchColor = ["🩵","🩷","💛","🧡","💚","💙","💜","💗","🫶","❤️"][state.matchCount % 10];

  // ============ DOM refs ============
  const homeScreen   = $("homeScreen");
  const appScreen    = $("appScreen");
  const heroLogo     = $("heroLogo");
  const btnEnter     = $("btnEnter");
  const sponsorLink  = $("sponsorLink");
  const sponsorLinkApp = $("sponsorLinkApp");
  const ethicsButton = $("ethicsButton");
  const btnMsgBack   = $("btnMsgBack");
  const btnPlus      = $("btnPlus");

  const mainTopbar   = $("mainTopbar");
  const btnBack      = $("btnBack");
  const btnBackLove  = $("btnBackLove");

  const tabNearby    = $("tabNearby");
  const tabLove      = $("tabLove");
  const tabPlay      = $("tabPlay"); // (anche se la tab Giochiamo è stata rimossa dal layout, teniamo il ref)
  const tabLuoghi    = $("tabLuoghi");
  const luoghiMenu   = $("luoghiMenu");

  const viewNearby   = $("viewNearby");
  const viewLove     = $("viewLove");
  const viewPlay     = $("viewPlay");
  const viewMessages = $("viewMessages");
  const nearGrid     = $("nearGrid");

  const loveCard     = $("loveCard");
  const loveImg      = $("loveImg");
  const loveTitleTxt = $("loveTitleTxt");
  const loveMeta     = $("loveMeta");
  const loveBio      = $("loveBio");
  const loveNo       = $("loveNo");
  const loveYes      = $("loveYes");

  const playCard     = $("playCard");
  const playImg      = $("playImg");
  const playTitleTxt = $("playTitleTxt");
  const playMeta     = $("playMeta");
  const playBio      = $("playBio");
  const playNo       = $("playNo");
  const playYes      = $("playYes");

  const btnSearchPanel = $("btnSearchPanel");
  const searchPanel = $("searchPanel");
  const closeSearch = $("closeSearch");
  const breedInput  = $("breedInput");
  const breedsList  = $("breedsList");
  const distRange   = $("distRange");
  const distLabel   = $("distLabel");
  const onlyVerified = $("onlyVerified");
  const sexFilter   = $("sexFilter");
  const ageMin      = $("ageMin");
  const ageMax      = $("ageMax");
  const weightInput = $("weightInput");
  const heightInput = $("heightInput");
  const pedigreeFilter = $("pedigreeFilter");
  const breedingFilter = $("breedingFilter");
  const sizeFilter  = $("sizeFilter");
  const applyFilters = $("applyFilters");
  const resetFilters = $("resetFilters");

  const plusModal = $("plusModal");
  const closePlus = $("closePlus");
  const cancelPlus = $("cancelPlus");
  const activatePlus = $("activatePlus");
  const planMonthly = $("planMonthly");
  const planYearly = $("planYearly");

  const chatPane   = $("chatPane");
  const closeChat  = $("closeChat");
  const chatList   = $("chatList");
  const chatComposer = $("chatComposer");
  const chatInput  = $("chatInput");

  const profilePage = $("profilePage");
  const profileBack = $("profileBack");
  const profileClose = $("profileClose");
  const profileContent = $("profileContent");
  const profileLikeBtn = $("profileLikeBtn");

  const followersOverlay = $("followersOverlay");
  const followingOverlay = $("followingOverlay");
  const followersList = $("followersList");
  const followingList = $("followingList");

  const storyLikeBtn = $("storyLikeBtn");

  const adBanner = $("adBanner");
  const matchOverlay = $("matchOverlay");

  
  // ============ STORIES – Config & State ============
  const STORIES_CONFIG = {
    PHOTO_DURATION: 15000,
    VIDEO_MAX_DURATION_FREE: 15,
    VIDEO_MAX_DURATION_PLUS: 90,
    MAX_PHOTO_SIZE: 10 * 1024 * 1024,
    MAX_VIDEO_SIZE: 50 * 1024 * 1024,
    STORY_LIFETIME: 24 * 60 * 60 * 1000,
    FREE_DAILY_LIMIT: 3,
    REWARD_VIDEO_DURATION: 15
  };

  const StoriesState = {
    stories: [],
    currentStoryUserId: null,
    currentMediaIndex: 0,
    progressInterval: null,
    uploadedFile: null,
    selectedFilter: "none",
    selectedMusic: "",
    openedFrom: null,

    loadStories() {
      const saved = localStorage.getItem("plutoo_stories");
      if (saved) {
        this.stories = JSON.parse(saved);
        this.cleanExpiredStories();
      } else {
        this.stories = this.generateMockStories();
        this.saveStories();
      }
    },
    saveStories() { localStorage.setItem("plutoo_stories", JSON.stringify(this.stories)); },
    cleanExpiredStories() {
  const now = Date.now();

  this.stories = this.stories.filter(story => {
    // ✅ LE DEMO RESTANO SEMPRE
    if (story.isDemo === true) return true;

    // ⏱️ pulizia media > 24h
    story.media = story.media.filter(m => {
      return (now - m.timestamp) < STORIES_CONFIG.STORY_LIFETIME;
    });

    return story.media.length > 0;
  });

  this.saveStories();
},
    getTodayStoriesCount() {
      const today = new Date().toDateString();
      const userStory = this.stories.find(s => s.userId === "currentUser");
      if (!userStory) return 0;
      return userStory.media.filter(m => new Date(m.timestamp).toDateString() === today).length;
    },
    canUploadStory() { return state.plus || this.getTodayStoriesCount() < STORIES_CONFIG.FREE_DAILY_LIMIT; },
    generateMockStories() {
      return [
       { userId:"d1", userName:"Luna", avatar:"dog1.jpg", verified:true, isDemo:true,
         media:[{id:"m1",type:"image",url:"dog1.jpg",timestamp:Date.now()-3600000,filter:"none",music:"",viewed:false,privacy:"public"}] },
        
        { userId:"d2", userName:"Rex", avatar:"dog2.jpg", verified:true,
          media:[
            {id:"m2",type:"image",url:"dog2.jpg",timestamp:Date.now()-7200000,filter:"warm",music:"happy",viewed:false,privacy:"public"},
            {id:"m3",type:"image",url:"dog3.jpg",timestamp:Date.now()-5400000,filter:"sepia",music:"",viewed:false,privacy:"private"}
          ]},
        
        { userId:"d3", userName:"Maya", avatar:"dog3.jpg", verified:false,
          media:[{id:"m4",type:"image",url:"dog4.jpg",timestamp:Date.now()-10800000,filter:"grayscale",music:"",viewed:false,privacy:"public"}] }
      ];
    }
  };
  
  window.StoriesState = StoriesState;

  // ============ HOME: ENTRA (con animazione WOW) ============
  btnEnter?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    try { localStorage.setItem("entered", "1"); } catch(err){}
    state.entered = true;

  const bark = document.getElementById("dogBark");
if (bark) {
  bark.currentTime = 0;
  bark.volume = 0.5;
  const playPromise = bark.play();
  if (playPromise && typeof playPromise.then === "function") {
    playPromise.catch(() => {
      // in produzione niente alert, al massimo in futuro un log silenzioso
    });
  }
}

    if (heroLogo) {
      heroLogo.classList.remove("heartbeat-violet", "heartbeat-violet-wow");
      void heroLogo.offsetWidth;
      heroLogo.classList.add("heartbeat-violet-wow");
    }

    const flash = document.getElementById("whiteFlash");
    if (flash) {
      flash.classList.add("active");
    }

    setTimeout(() => {
      appScreen?.classList.remove("hidden");
      document.body.classList.remove("story-open");

      if (typeof initStories === "function") {
        initStories();
      }
      setActiveView(state.currentView);
    }, 500);

    setTimeout(() => {
      homeScreen?.classList.add("hidden");
      const flash2 = document.getElementById("whiteFlash");
      if (flash2) {
        flash2.classList.remove("active");
      }
      if (heroLogo) {
        heroLogo.style.transition = "opacity 1.5s ease-out";
        heroLogo.style.opacity = "0";
        showAdBanner();
      }
    }, 2000);

    setTimeout(() => {
      if (heroLogo) {
        heroLogo.classList.remove("heartbeat-violet-wow");
        heroLogo.style.opacity = "";
        heroLogo.style.transition = "";
      }
    }, 3500);
  });

  if (state.entered) {
    homeScreen?.classList.add("hidden");
    appScreen?.classList.remove("hidden");
  }

  // ============ I18N ============
  const I18N = {
    it: {
      brand: "Plutoo",
      login: "Login",
      register: "Registrati",
      enter: "Entra",
      sponsorTitle: "Sponsor ufficiale",
      sponsorCopy: "Fido, il gelato per i nostri amici a quattro zampe",
      sponsorUrl: "https://www.fido.it/",
      ethicsLine1: "Non abbandonare mai i tuoi amici",
      ethicsLine2: "(canili nelle vicinanze)",
      terms: "Termini",
      privacy: "Privacy",
      nearby: "Vicino a te",
      love: "Accoppiamento",
      searchAdvanced: "Ricerca personalizzata",
      plusBtn: "PLUS",
      chat: "Chat",
      profile: "Profilo",
      typeMessage: "Scrivi un messaggio…",
      send: "Invia",
      freeFilters: "Filtri base",
      goldFilters: "Filtri Gold",
      sexFilter: "Sesso",
      sexAll: "Tutti",
      sexMale: "Maschio",
      sexFemale: "Femmina",
      distance: "Distanza",
      breed: "Razza",
      breedPh: "Cerca razza…",
      onlyVerified: "Solo con badge verificato ✅",
      ageMin: "Età minima (anni)",
      ageMax: "Età massima (anni)",
      weight: "Peso (kg)",
      height: "Altezza (cm)",
      pedigree: "Pedigree",
      breeding: "Disponibile per accoppiamento",
      size: "Taglia",
      indifferent: "Indifferente",
      yes: "Sì",
      no: "No",
      sizeSmall: "Piccola",
      sizeMedium: "Media",
      sizeLarge: "Grande",
      apply: "Applica",
      reset: "Reset",
      unlockHint: "Vuoi sbloccare i filtri Gold? Attiva Plutoo Plus 💎",
      plusTitle: "Plutoo Plus",
      plusSubtitle: "Sblocca tutte le funzionalità premium",
      plusFeature1: "Nessuna pubblicità",
      plusFeature2: "Swipe illimitati",
      plusFeature3: "Messaggi illimitati",
      plusFeature4: "Tutti i filtri Gold sbloccati",
      plusFeature5: "Supporto prioritario",
      plusFeature6: "Vedi tutte le Stories senza video",
      plusFeature7: "Stories video fino a 90 secondi",
      planMonthly: "Mensile",
      planYearly: "Annuale",
      planSave: "Risparmia €20!",
      plusPeriod: "/mese",
      activatePlus: "Attiva Plutoo Plus",
      cancel: "Annulla",
      mapsShelters: "canili nelle vicinanze",
      noProfiles: "Nessun profilo. Modifica i filtri.",
      years: "anni"
    },
    en: {
      brand: "Plutoo",
      login: "Login",
      register: "Sign up",
      enter: "Enter",
      sponsorTitle: "Official Sponsor",
      sponsorCopy: "Fido, ice cream for our four-legged friends",
      sponsorUrl: "https://www.fido.it/",
      ethicsLine1: "Never abandon your friends",
      ethicsLine2: "(animal shelters nearby)",
      terms: "Terms",
      privacy: "Privacy",
      nearby: "Nearby",
      love: "Breeding",
      searchAdvanced: "Advanced Search",
      plusBtn: "PLUS",
      chat: "Chat",
      profile: "Profile",
      typeMessage: "Type a message…",
      send: "Send",
      freeFilters: "Basic Filters",
      goldFilters: "Gold Filters",
      sexFilter: "Sex",
      sexAll: "All",
      sexMale: "Male",
      sexFemale: "Female",
      distance: "Distance",
      breed: "Breed",
      breedPh: "Search breed…",
      onlyVerified: "Only verified badges ✅",
      ageMin: "Min age (years)",
      ageMax: "Max age (years)",
      weight: "Weight (kg)",
      height: "Height (cm)",
      pedigree: "Pedigree",
      breeding: "Available for breeding",
      size: "Size",
      indifferent: "Any",
      yes: "Yes",
      no: "No",
      sizeSmall: "Small",
      sizeMedium: "Medium",
      sizeLarge: "Large",
      apply: "Apply",
      reset: "Reset",
      unlockHint: "Want to unlock Gold filters? Activate Plutoo Plus 💎",
      plusTitle: "Plutoo Plus",
      plusSubtitle: "Unlock all premium features",
      plusFeature1: "No ads",
      plusFeature2: "Unlimited swipes",
      plusFeature3: "Unlimited messages",
      plusFeature4: "All Gold filters unlocked",
      plusFeature5: "Priority support",
      plusFeature6: "View all Stories without videos",
      plusFeature7: "Video stories up to 90 seconds",
      planMonthly: "Monthly",
      planYearly: "Yearly",
      planSave: "Save €20!",
      plusPeriod: "/month",
      activatePlus: "Activate Plutoo Plus",
      cancel: "Cancel",
      mapsShelters: "animal shelters nearby",
      noProfiles: "No profiles. Adjust filters.",
      years: "yrs"
    }
  };

  const t = (k) => (I18N[state.lang] && I18N[state.lang][k]) || k;

  function applyTranslations(){
    qa("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (I18N[state.lang] && I18N[state.lang][key]) {
        el.textContent = I18N[state.lang][key];
      }
    });
    qa("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (I18N[state.lang] && I18N[state.lang][key]) {
        el.placeholder = I18N[state.lang][key];
      }
    });
  }

  $("langIT")?.addEventListener("click", ()=>{
    state.lang="it";
    localStorage.setItem("lang","it");
    applyTranslations();
    if(state.entered) renderNearby();
  });
  $("langEN")?.addEventListener("click", ()=>{
    state.lang="en";
    localStorage.setItem("lang","en");
    applyTranslations();
    if(state.entered) renderNearby();
  });

  // ============ Dati mock DOGS ============
const DOGS = [
  { id:"d1", name:"Luna", age:2, breed:"Golden Retriever", km:1.2, img:"dog1.jpg",
    bio:"Dolcissima e curiosa.", mode:"love", sex:"F", verified:true,
    weight:28, height:55, pedigree:true, breeding:false, size:"medium",
    social:{ facebook:{enabled:true,url:"https://facebook.com/"},
             instagram:{enabled:true,url:"https://instagram.com/"},
             tiktok:{enabled:false,url:""} } },
  { id:"d2", name:"Rex", age:4, breed:"Pastore Tedesco", km:3.4, img:"dog2.jpg",
    bio:"Fedele e giocherellone.", mode:"friendship", sex:"M", verified:true,
    weight:35, height:62, pedigree:true, breeding:true, size:"large",
    social:{ facebook:{enabled:false,url:""},
             instagram:{enabled:true,url:"https://instagram.com/"},
             tiktok:{enabled:true,url:"https://tiktok.com/"} } },
  { id:"d3", name:"Maya", age:3, breed:"Bulldog Francese", km:2.1, img:"dog3.jpg",
    bio:"Coccole e passeggiate.", mode:"love", sex:"F", verified:false,
    weight:12, height:30, pedigree:false, breeding:false, size:"small",
    social:{ facebook:{enabled:true,url:"https://facebook.com/"},
             instagram:{enabled:true,url:"https://instagram.com/"},
             tiktok:{enabled:false,url:""} } },
  { id:"d4", name:"Rocky", age:5, breed:"Beagle", km:4.0, img:"dog4.jpg",
    bio:"Sempre in movimento.", mode:"friendship", sex:"M", verified:true,
    weight:15, height:38, pedigree:true, breeding:false, size:"medium",
    social:{ facebook:{enabled:false,url:""},
             instagram:{enabled:true,url:"https://instagram.com/"},
             tiktok:{enabled:true,url:"https://tiktok.com/"} } },
  { id:"d5", name:"Chicco", age:1, breed:"Barboncino", km:0.8, img:"dog5.jpg",
    bio:"Piccolo fulmine.", mode:"love", sex:"M", verified:true,
    weight:8, height:28, pedigree:false, breeding:false, size:"small",
    social:{ facebook:{enabled:true,url:"https://facebook.com/"},
             instagram:{enabled:false,url:""},
             tiktok:{enabled:false,url:""} } },
  { id:"d6", name:"Kira", age:6, breed:"Labrador", km:5.1, img:"dog6.jpg",
    bio:"Acqua e palla.", mode:"friendship", sex:"F", verified:true,
    weight:30, height:58, pedigree:true, breeding:true, size:"large",
    social:{ facebook:{enabled:true,url:"https://facebook.com/"},
             instagram:{enabled:true,url:"https://instagram.com/"},
             tiktok:{enabled:true,url:"https://tiktok.com/"} } },
  { id:"d7", name:"Toby", age:2, breed:"Husky", km:2.8, img:"dog7.jpg",
    bio:"Energia pura.", mode:"love", sex:"M", verified:true,
    weight:25, height:54, pedigree:true, breeding:true, size:"medium",
    social:{ facebook:{enabled:false,url:""},
             instagram:{enabled:true,url:"https://instagram.com/"},
             tiktok:{enabled:false,url:""} } },
  { id:"d8", name:"Bella", age:4, breed:"Cocker Spaniel", km:1.5, img:"dog8.jpg",
    bio:"Dolce compagna.", mode:"friendship", sex:"F", verified:false,
    weight:14, height:40, pedigree:false, breeding:false, size:"medium",
    social:{ facebook:{enabled:true,url:"https://facebook.com/"},
             instagram:{enabled:true,url:"https://instagram.com/"},
             tiktok:{enabled:true,url:"https://tiktok.com/"} } },
];

  // ============ Razze ============
  fetch("breeds.json").then(r=>r.json()).then(arr=>{
    if (Array.isArray(arr)) state.breeds = arr.sort();
  }).catch(()=>{
    state.breeds = [
      "Barboncino","Bassotto","Beagle","Border Collie","Bulldog Francese",
      "Carlino","Chihuahua","Cocker Spaniel","Golden Retriever","Husky",
      "Jack Russell","Labrador","Maltese","Pastore Tedesco","Shih Tzu",
      "Meticcio",
    ].sort();
  });

  // ============ Geolocalizzazione ============
  if (navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      p=>{ state.geo = { lat:p.coords.latitude, lon:p.coords.longitude }; },
      ()=>{}, { enableHighAccuracy:true, timeout:5000, maximumAge:60000 }
    );
  }

  // =========== Restore in APP ===========
  if (state.entered) {
    homeScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");

    const viewToRestore = state.currentView || "nearby";

    if (viewToRestore === "profile") {
      const savedId = localStorage.getItem("currentProfileDogId");
      if (savedId) {
        const dog = DOGS.find(d => d.id == savedId);
        if (dog && window.openProfilePage) {
          window.openProfilePage(dog);
        } else {
          setActiveView("nearby");
        }
      } else {
        setActiveView("nearby");
      }
    } else {
      setActiveView(viewToRestore);
    }

    showAdBanner();
  }

  function openSponsor(){
  const url = "https://www.gelatofido.it/";

  // HOME o vista "Vicino a te": nessun reward, apertura diretta
  if (!state.entered || state.currentView === "nearby") {
    window.open(url, "_blank", "noopener");
    return;
  }

  // Utenti PLUS: mai reward
  if (state.plus){
    window.open(url, "_blank", "noopener");
    return;
  }

  // Altre viste senza Plus: reward prima dello sponsor
  if (state.rewardOpen) return;
  state.rewardOpen = true;

  showRewardVideoMock("sponsor", () => {
    state.rewardOpen = false;
    window.open(url, "_blank", "noopener");
  });
  }

  sponsorLink?.addEventListener("click",(e)=>{
    e.preventDefault();
    openSponsor();
  });
  sponsorLinkApp?.addEventListener("click",(e)=>{
    e.preventDefault();
    openSponsor();
  });

  ethicsButton?.addEventListener("click", ()=> openSheltersMaps() );

  // ============ PLUS ============
  btnPlus?.addEventListener("click", ()=> openPlusModal() );
  closePlus?.addEventListener("click", ()=> closePlusModal() );
  cancelPlus?.addEventListener("click", ()=> closePlusModal() );

  planMonthly?.addEventListener("click", ()=>{
    state.plusPlan = "monthly";
    updatePlanSelector();
  });
  planYearly?.addEventListener("click", ()=>{
    state.plusPlan = "yearly";
    updatePlanSelector();
  });

  function updatePlanSelector(){
    if(planMonthly && planYearly){
      planMonthly.classList.toggle("active", state.plusPlan === "monthly");
      planYearly.classList.toggle("active", state.plusPlan === "yearly");
    }
  }

  activatePlus?.addEventListener("click", ()=> {
    state.plus = true;
    localStorage.setItem("plutoo_plus", "yes");
    localStorage.setItem("plusPlan", state.plusPlan);
    closePlusModal();
    updatePlusUI();
    const price = state.plusPlan === "yearly" ? "€40/anno" : "€4.99/mese";
    alert(
      state.lang === "it"
        ? `Plutoo Plus attivato! 💎\nPiano scelto: ${price}`
        : `Plutoo Plus activated! 💎\nSelected plan: ${price}`
    );
  });

  function openPlusModal(){ plusModal?.classList.remove("hidden"); updatePlanSelector(); }
  function closePlusModal(){ plusModal?.classList.add("hidden"); }

  function updatePlusUI(){
    const goldInputs = [onlyVerified, ageMin, ageMax, weightInput, heightInput, pedigreeFilter, breedingFilter, sizeFilter];
    goldInputs.forEach(inp => { if (inp) inp.disabled = !state.plus; });
    if (adBanner) adBanner.style.display = state.plus ? "none" : "";
  }

  // ============ Tabs ============
  tabNearby?.addEventListener("click", ()=>setActiveView("nearby"));
  tabLove?.addEventListener("click",   ()=>setActiveView("love"));
  tabLuoghi?.addEventListener("click",(e)=>{
    e.stopPropagation();
    const wrap = tabLuoghi.parentElement;
    const expanded = wrap.classList.toggle("open");
    tabLuoghi.setAttribute("aria-expanded", expanded ? "true" : "false");
  });
  document.addEventListener("click",()=>tabLuoghi?.parentElement.classList.remove("open"));

  qa(".menu-item", luoghiMenu).forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const cat = btn.getAttribute("data-cat");
      tabLuoghi.parentElement.classList.remove("open");
      openMapsCategory(cat);
    });
  });

// ====== MESSAGGI - VISTA E TABS INTERN INTERNI ======
const btnMessages = $("btnMessages");

// 🔴 Badge numerico MESSAGGI (Firestore source of truth)
const msgBadge = $("msgBadge");
let __msgBadgeUnsub = null;

function __setMsgBadge(n) {
  if (!msgBadge) return;
  const c = Math.max(0, parseInt(n || 0, 10) || 0);
  msgBadge.textContent = String(c);
  msgBadge.classList.toggle("hidden", c === 0);
}

function initMessagesBadge() {
  // aspetta UID + db
  if (typeof db === "undefined" || !db || !window.PLUTOO_UID) {
    setTimeout(() => { try { initMessagesBadge(); } catch (_) {} }, 350);
    return;
  }

  // kill vecchio listener
  try { if (typeof __msgBadgeUnsub === "function") __msgBadgeUnsub(); } catch (_) {}
  __msgBadgeUnsub = null;

  // chatId prefix = "<UID>_" (come nei tuoi screenshot)
  const prefix = String(window.PLUTOO_UID) + "_";

  __msgBadgeUnsub = db
  .collection("messages")
  .orderBy("chatId")
  .startAt(prefix)
  .endAt(prefix + "\uf8ff")
  .onSnapshot((snap) => {
      let unread = 0;
    snap.forEach((d) => {
  const x = d.data() || {};
  const myUid = String(window.PLUTOO_UID || "");
  const sender = String(x.senderUid || "");

  // se manca senderUid, NON lo considero unread (evita badge falso)
  if (!sender) return;

  // unread = solo messaggi NON miei e NON letti
  if (sender !== myUid && x.isRead !== true) unread++;
});
      __setMsgBadge(unread);
    }, (e) => {
      alert("❌ MSG BADGE onSnapshot\n" + (e && e.message ? e.message : String(e)));
    });
}

// avvia subito
setTimeout(() => { try { initMessagesBadge(); } catch (_) {} }, 0);

// 🔔 Notifiche (Firestore source of truth)
const notifBtn = $("notifBtn");
const notifOverlay = $("notifOverlay");
const notifList = $("notifList");
const notifDot = $("notifDot");

let __notifUnsub = null;
let __notifLast = []; // cache render
let __notifInited = false;

function __fmtTime(ts) {
  try {
    if (!ts) return "";
    const d = (ts && typeof ts.toDate === "function") ? ts.toDate() : (ts instanceof Date ? ts : null);
    return d ? d.toLocaleString() : "";
  } catch (_) {
    return "";
  }
}

function __renderNotifs(items) {
  if (!notifList) return;

  notifList.innerHTML = "";

  if (!items || !items.length) {
    notifList.innerHTML = `<p class="sheet-empty">Nessuna notifica</p>`;
    return;
  }

  const frag = document.createDocumentFragment();

  items.forEach((n) => {
    const row = document.createElement("div");
    row.className = "notif-item" + (n.read ? "" : " unread");

    const main = (n.type === "follow")
      ? "Nuovo FOLLOW"
      : (n.type ? String(n.type) : "Notifica");

    const fromId = String(n.fromDogId || n.fromdogId || n.followerDogId || n.actorDogId || n.dogId || "").trim();
    const sub = (fromId ? `Da DOG: ${fromId}` : "");

    row.innerHTML = `
      <div class="notif-txt">
        <div class="notif-main">${main}</div>
        ${sub ? `<div class="notif-sub">${sub}</div>` : ``}
      </div>
      <div class="notif-time">${__fmtTime(n.createdAt)}</div>
    `;

 // FEEDBACK VISIVO (se non lo vedi, il click NON arriva)
row.addEventListener("click", function (e) {
  e.stopPropagation();

  row.style.outline = "2px solid #a855f7";
  row.style.background = "rgba(168,85,247,0.12)";
  if (navigator && navigator.vibrate) { try { navigator.vibrate(20); } catch (_) {} }

  try {
    var id = String(n.fromDogId || "");
    if (!id) return;

    if (typeof __openDogProfileById === "function") {
      Promise.resolve(__openDogProfileById(id))
        .then(function (opened) {
          if (opened) {
            var no = document.getElementById("notifOverlay");
            if (no) {
              no.classList.remove("show");
              no.setAttribute("aria-hidden", "true");
              setTimeout(function () { no.classList.add("hidden"); }, 200);
            }
          }
        })
        .catch(function () {});
    }
  } catch (_) {}
});
  
  frag.appendChild(row);
  });

  notifList.appendChild(frag);
}

// === Apri profilo DOG da id (usato dalle notifiche) ===
// Definitivo: 1) risolvi SEMPRE da DOGS (mock reale) 2) se esiste, arricchisci da Firestore dogs/{id}
async function __openDogProfileById(dogId) {
  try {
    dogId = (dogId != null) ? String(dogId) : "";
    dogId = dogId.trim();
    if (!dogId) return false;

    // openProfilePage (non la tocchiamo)
    var _openProfile =
      (typeof window.openProfilePage === "function") ? window.openProfilePage :
      ((typeof openProfilePage === "function") ? openProfilePage : null);
    if (!_openProfile) return false;

    // 1) SOURCE OF TRUTH PER ORA: DOGS del file (mock)
    // (Tu hai const DOGS = [...], quindi esiste qui nello scope)
    var base = null;
    try {
      if (typeof DOGS !== "undefined" && Array.isArray(DOGS)) {
        base = DOGS.find(d => d && String(d.id) === dogId) || null;
      }
    } catch (_) {}

    // fallback secondario: state.dogs o window.DOGS (se li usi altrove)
    if (!base) {
      try {
        if (typeof state !== "undefined" && state && Array.isArray(state.dogs)) {
          base = state.dogs.find(d => d && String(d.id) === dogId) || null;
        }
      } catch (_) {}
    }
    if (!base) {
      try {
        if (Array.isArray(window.DOGS)) {
          base = window.DOGS.find(d => d && String(d.id) === dogId) || null;
        }
      } catch (_) {}
    }

    // Se non esiste nemmeno nei mock, NON aprire profilo vuoto (evita nero)
    if (!base) return false;

    // Oggetto coerente con il TUO modello
    var dog = Object.assign({}, base);
    dog.id = String(dog.id || dogId);
    dog.name = (dog.name != null) ? String(dog.name) : "";
    dog.img = (dog.img != null) ? String(dog.img) : "";
    dog.breed = (dog.breed != null) ? String(dog.breed) : "";
    dog.bio = (dog.bio != null) ? String(dog.bio) : "";

    // 2) Firestore (source of truth quando ci saranno i profili reali)
    // Se esiste dogs/{dogId}, sovrascrive SOLO i campi presenti nel doc
    var _db = (window.db || (typeof db !== "undefined" ? db : null));
    if (_db && typeof _db.collection === "function") {
      try {
        var snap = await _db.collection("dogs").doc(dogId).get();
        if (snap && snap.exists) {
          var fd = snap.data() || {};
          // sovrascrivi SOLO campi noti del tuo modello (niente invenzioni)
          if (fd.id != null) dog.id = String(fd.id);
          if (fd.name != null) dog.name = String(fd.name);
          if (fd.img != null) dog.img = String(fd.img);
          if (fd.breed != null) dog.breed = String(fd.breed);
          if (fd.bio != null) dog.bio = String(fd.bio);
        }
      } catch (_) {}
    }

    _openProfile(dog);
    return true;

  } catch (e) {
    console.error("__openDogProfileById:", e);
    return false;
  }
}

async function __markAllNotifsRead(toDogId) {
  try {
    if (typeof db === "undefined" || !db || !window.PLUTOO_UID) return;
    if (!toDogId) return;

    const snap = await db
      .collection("notifications")
      .where("toDogId", "==", String(toDogId))
      .where("read", "==", false)
      .limit(40)
      .get();

    if (snap.empty) return;

    const batch = db.batch();
    snap.forEach((docSnap) => {
      batch.set(docSnap.ref, { read: true }, { merge: true });
    });
    await batch.commit();
  } catch (e) {
    console.error("markAllNotifsRead:", e);
  }
}

function initNotificationsFeed() {
  if (__notifInited) return;

  // dogId “verità” per le notifiche (stessa logica che usi nei follow)
  const toDogId = (typeof CURRENT_USER_DOG_ID !== "undefined" && CURRENT_USER_DOG_ID)
    ? String(CURRENT_USER_DOG_ID)
    : null;

  // se non ho dogId, non “blocco” l’init: esco pulito
  if (!toDogId) { __notifInited = false; return; }

  // aspetta Firebase db/uid: NON bloccare __notifInited finché non è pronto
  if (typeof db === "undefined" || !db || !window.PLUTOO_UID) {
    __notifInited = false;
    setTimeout(() => { try { initNotificationsFeed(); } catch (_) {} }, 350);
    return;
  }

  __notifInited = true;

  // kill eventuale vecchio listener
  try { if (typeof __notifUnsub === "function") __notifUnsub(); } catch (_) {}
  __notifUnsub = null;

  __notifUnsub = db
  .collection("notifications")
  .where("toDogId", "==", String(toDogId))
  .orderBy("createdAt", "desc")
  .limit(40)
  .onSnapshot((snap) => {
    
      const items = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() || {};
        items.push({
          id: docSnap.id,
          type: data.type || "",
          fromUid: data.fromUid || "",
          fromDogId: data.fromDogId || "",
          toDogId: data.toDogId || "",
          createdAt: data.createdAt || null,
          read: data.read === true
        });
      });

      // ordine lato client (robusto anche se qualche doc non ha createdAt)
      items.sort((a, b) => {
        const ta = a && a.createdAt && typeof a.createdAt.toDate === "function" ? a.createdAt.toDate().getTime() : 0;
        const tb = b && b.createdAt && typeof b.createdAt.toDate === "function" ? b.createdAt.toDate().getTime() : 0;
        return tb - ta;
      });

      __notifLast = items;

      const unreadCount = items.filter((x) => x && x.read !== true).length;
if (notifDot) {
  notifDot.textContent = unreadCount > 0 ? String(unreadCount) : "";
  notifDot.classList.toggle("hidden", unreadCount === 0);
}

      // se overlay aperto, aggiorna live
      if (notifOverlay && !notifOverlay.classList.contains("hidden")) {
        __renderNotifs(items);
      }
    }, (e) => {
      alert("❌ NOTIFS onSnapshot\n" + (e && e.code ? ("code: " + e.code + "\n") : "") + (e && e.message ? ("msg: " + e.message) : String(e)));
    });
}

setTimeout(() => { try { initNotificationsFeed(); } catch (_) {} }, 0);

// Apri overlay
if (notifBtn && notifOverlay) {
  notifBtn.addEventListener("click", async (e) => {
    
    // UI immediata: nascondi pallino subito (Firestore aggiorna poi lo stato reale)
    if (notifDot) notifDot.classList.remove("hidden"); // TEST MANUALE
if (notifDot) notifDot.classList.add("hidden");
    e.preventDefault();
    e.stopPropagation();

    // inizializza feed appena serve (robusto per publish)
    initNotificationsFeed();

    notifOverlay.classList.remove("hidden");
    requestAnimationFrame(() => notifOverlay.classList.add("show"));

    // render immediato da cache
    __renderNotifs(__notifLast);

    // segna lette (source of truth)
    const toDogId = (typeof CURRENT_USER_DOG_ID !== "undefined" && CURRENT_USER_DOG_ID)
      ? String(CURRENT_USER_DOG_ID)
      : null;
    if (toDogId) __markAllNotifsRead(toDogId);
  }, { passive: false });
  
  // Chiudi overlay (tasto X)
  const notifCloseBtn = notifOverlay.querySelector(".sheet-close");
  if (notifCloseBtn) {
    notifCloseBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      notifOverlay.classList.remove("show");
      notifOverlay.setAttribute("aria-hidden", "true");
      setTimeout(() => { notifOverlay.classList.add("hidden"); }, 200);
    }, { passive: false });
  }
}

const msgTopTabs  = qa(".msg-top-tab");
const msgLists    = qa(".messages-list");

async function loadMessagesLists() { 
  try { 
    if (!db || !msgLists || !msgLists.length) return;

    const selfUid = window.PLUTOO_UID;
    if (!selfUid) {
      if (!window.__retryLoadMessagesOnce) {
        window.__retryLoadMessagesOnce = true;
        setTimeout(() => {
          try { loadMessagesLists(); } catch (_) {}
        }, 250);
      }
      return;
    }

    // Contenitori reali definiti in index.html
    const inboxList    = document.getElementById("tabInbox");
    const matchesList  = document.getElementById("tabMatches");
    const requestsList = document.getElementById("tabRequests");
    const spamList     = document.getElementById("tabSpam");
    if (!inboxList || !matchesList || !requestsList || !spamList) return;

    // Pulisco tutte le liste e nascondo gli empty state
    msgLists.forEach((list) => {
      list.querySelectorAll(".msg-item").forEach((el) => el.remove());
      const emptyEl = list.querySelector(".empty-state");
      if (emptyEl) emptyEl.classList.add("hidden-empty");
    });

    // Legge le chat dove compare il mio UID (fallback su chatId se members non è affidabile)
const prefix = String(selfUid) + "_";

let snap = await db
  .collection("chats")
  .where("members", "array-contains", selfUid)
  .get();

// Fallback: se members non è presente/corretto, uso chatId (che nei tuoi doc esiste)
if (!snap || snap.empty) {
  snap = await db
    .collection("chats")
    .orderBy("chatId")
    .startAt(prefix)
    .endAt(prefix + "\uf8ff")
    .get();
}

    const chats = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() || {};

      let lastAt = data.lastMessageAt || null;
      if (lastAt && typeof lastAt.toDate === "function") {
        lastAt = lastAt.toDate();
      }

      chats.push({
        id: docSnap.id || null,
        dogId: data.dogId || null,
        members: Array.isArray(data.members) ? data.members : [],
        lastMessageText: (data.lastMessageText || ""),
        lastMessageAt: lastAt,
        lastSenderUid: data.lastSenderUid || null,
        dogName: data.dogName || null,
        dogAvatar: data.dogAvatar || null,
        match: data.match === true,

        // opzionali: se non esistono su Firestore -> null/false
        folder: data.folder || null,     // es: "requests" | "spam"
        spam: data.spam === true
      });
    });

    // Se non ci sono chat → mostro i testi "vuoti" e mi fermo
    if (!chats.length) {
      msgLists.forEach((list) => {
        const emptyEl = list.querySelector(".empty-state");
        if (emptyEl) emptyEl.classList.remove("hidden-empty");
      });
      return;
    }

    // Ordino per data ultimo messaggio (più recente in alto)
    chats.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return b.lastMessageAt - a.lastMessageAt;
    });

   const makeRow = (titleText, dateText, chatId, dogId, otherUid, sourceTab, dogAvatar) => {
  const row = document.createElement("div");
  row.className = "msg-item";

  // avatar: se c’è lo metto, se non c’è non mostro nulla (niente icona finta)
  const avatar = dogAvatar
    ? `<img src="${dogAvatar}" class="msg-avatar" alt="dog">`
    : ``;

  // separo "Nome - Messaggio" in modo robusto (se non c’è il trattino, preview vuota)
  let nameLine = (titleText || "").trim();
  let previewLine = "";
  const sep = " - ";
  if (nameLine.includes(sep)) {
    const parts = nameLine.split(sep);
    nameLine = (parts.shift() || "").trim();
    previewLine = parts.join(sep).trim();
  }

  row.innerHTML = `
    ${avatar}
    <div class="msg-main">
      <div class="msg-title">${nameLine}</div>
      ${previewLine ? `<div class="msg-preview">${previewLine}</div>` : ``}
      <div class="msg-meta">${dateText}</div>
    </div>
  `;

  row.addEventListener("click", () => {
    state._openChatFromTab = sourceTab || "";
    openChat(chatId, dogId, otherUid);
  });

  return row;
};

    chats.forEach((chat) => {
      const otherUid = chat.members.find((uid) => uid !== selfUid) || null;
      const dogId = chat.dogId || null;

      const dogName = chat.dogName || (state.lang === "en" ? "DOG" : "Dog");
      const text = (chat.lastMessageText || "").trim();
      const dateText = chat.lastMessageAt ? chat.lastMessageAt.toLocaleString() : "";

      const hasText = text !== "";

      // ✅ Spam: priorità assoluta (se c'è flag spam)
      const isSpam = chat.spam === true || chat.folder === "spam";

      // ✅ Match: verità = Firestore match, con fallback alla cache locale (se esiste)
      const hasMatch = (chat.match === true) || (state.matches && state.matches[dogId] === true);

      // ✅ Ricevuti: se NON è mio, ha testo, NON è spam, e ho match
      const isInbox =
      hasText &&
      !isSpam &&
      hasMatch;

      // ✅ Richieste: se NON è mio, ha testo, NON è spam, e NON ho match
      const isRequest =
        hasText &&
        !isSpam &&
        !hasMatch;

      if (isInbox) {
        inboxList.appendChild(makeRow(`${dogName} - ${text}`, dateText, chat.id, dogId, otherUid, "inbox", chat.dogAvatar)
        );
      }

      if (hasMatch && dogId) {
        matchesList.appendChild(makeRow(`${dogName}`, dateText, chat.id, dogId, otherUid, "matches", chat.dogAvatar)
        );
      }

      if (isRequest) {
      requestsList.appendChild(makeRow(`${dogName} - ${text}`, dateText, chat.id, dogId, otherUid, "requests", chat.dogAvatar)
        );
      }

      if (isSpam) {
        spamList.appendChild(makeRow(`${dogName} - ${text}`, dateText, chat.id, dogId, otherUid, "spam", chat.dogAvatar)
        );
      }
    });

    // Aggiorno gli "empty state" in base alla presenza di msg-item
    msgLists.forEach((list) => {
      const items = list.querySelectorAll(".msg-item");
      const emptyEl = list.querySelector(".empty-state");
      if (!emptyEl) return;
      emptyEl.classList.toggle("hidden-empty", items.length > 0);
    });

  } catch (err) { 
    console.error("Errore loadMessagesLists:", err); 
  } 
}
  
btnMessages?.addEventListener("click", () => {
  setActiveView("messages");
  loadMessagesLists();
});
  

// --- EMPTY STATES ---
msgLists.forEach((list) => {
  const items = list.querySelectorAll(".msg-item");
  const emptyEl = list.querySelector(".empty-state");

  if (!emptyEl) return;

  const hasItems = items.length > 0;
  // se non ci sono messaggi → mostro il testo
  emptyEl.classList.toggle("hidden-empty", hasItems);
});

  msgTopTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.tab;

    // 🔒 MEMORIZZA DA QUALE TAB ARRIVO (logica DEFINITIVA)
    switch (targetId) {
      case "tabInbox":
        state._openChatFromTab = "inbox";
        break;
      case "tabMatches":
        state._openChatFromTab = "matches";
        break;
      case "tabRequests":
        state._openChatFromTab = "requests";
        break;
      case "tabSpam":
        state._openChatFromTab = "spam";
        break;
      default:
        state._openChatFromTab = "";
    }

    // UI tabs
    msgTopTabs.forEach((b) => {
      b.classList.toggle("active", b === btn);
    });

    msgLists.forEach((list) => {
      list.classList.toggle("active", list.id === targetId);
    });
  });
});

  function setActiveView(name){
    localStorage.setItem("currentView", name);

    if (state.currentView !== name && state.currentView){
      state.viewHistory.push(state.currentView);
    }

    if (name === "messages" && state.currentView !== "messages"){
      state.previousViewForMessages = state.currentView || "nearby";
    }

    state.currentView = name;
    // 🔄 Mantieni allineato lo stato delle Stories
  try {
    StoriesState.loadStories();
  } catch (e) {}

  [viewNearby, viewLove, viewPlay, viewMessages, profilePage].forEach(v => {
  if (!v) return;
  v.classList.remove("active");
  v.classList.add("hidden");
  });

    if (name === "profile" || name === "messages") {
      mainTopbar?.classList.add("hidden");
    } else {
      mainTopbar?.classList.remove("hidden");
    }

    const storiesBar = $("storiesBar");
    if (storiesBar) {
      storiesBar.classList.toggle("hidden", name !== "nearby");
    }
    tabNearby.classList.remove("active");
  tabLove.classList.remove("active");
  if (tabPlay) tabPlay.classList.remove("active");
   
    if (name === "nearby") {
      if (viewNearby) {
        viewNearby.classList.remove("hidden");
        viewNearby.classList.add("active");
      }
      tabNearby.classList.add("active");
      renderNearby();
      renderStoriesBar();
      window.renderStories && window.renderStories();
      if (btnSearchPanel) btnSearchPanel.disabled = false;
    }

    if (name === "love") {
      if (viewLove) {
        viewLove.classList.remove("hidden");
        viewLove.classList.add("active");
      }
      tabLove.classList.add("active");
      renderSwipe("love");
    }

    if (name === "profile") {
  if (profilePage) {
    profilePage.classList.remove("hidden");
    profilePage.classList.add("active");
  }
    }

    if (name === "messages") {
      if (viewMessages) {
        viewMessages.classList.remove("hidden");
        viewMessages.classList.add("active");
      }
    }

    window.scrollTo({top:0, behavior:"smooth"});
  }

  btnBack?.addEventListener("click", ()=> goBack() );
  btnBackLove?.addEventListener("click", ()=> goBack() );
  btnMsgBack?.addEventListener("click", () => {
    const prev = state.previousViewForMessages || "nearby";
    setActiveView(prev);
  });

    function goBack(){
    // Se è aperta la lightbox della galleria profilo, chiudila
    const lb = document.querySelector(".lightbox");
    if (lb) {
      lb.remove();
      return;
    }
    const storyViewer = $("storyViewer");
    if (storyViewer && !storyViewer.classList.contains("hidden")){
      closeStoryViewer();
      return;
    }

    const uploadStoryModal = $("uploadStoryModal");
    if (uploadStoryModal && !uploadStoryModal.classList.contains("hidden")){
      closeUploadModal();
      return;
    }

    if (plusModal && !plusModal.classList.contains("hidden")){
      closePlusModal();
      return;
    }

    if (searchPanel && !searchPanel.classList.contains("hidden")){
      searchPanel.classList.add("hidden");
      searchPanel.style.display = "none";
      return;
    }

    if (chatPane && !chatPane.classList.contains("hidden") && chatPane.classList.contains("show")){
      closeChatPane();
      return;
    }

    if (state.currentView === "profile"){
      closeProfilePage();
      return;
    }

    if (state.currentView === "love" || state.currentView === "friendship"){
      setActiveView("nearby");
      return;
    }

    if (state.currentView === "nearby"){
        localStorage.removeItem("entered");
        state.entered=false;
        appScreen.classList.add("hidden");
        homeScreen.classList.remove("hidden");
      }
    }

  window.addEventListener("popstate", (e)=>{
    e.preventDefault();
    goBack();
  });

  if (state.entered){
    history.pushState({view: "app"}, "", "");
  }

  // ============ Nearby ============
  function renderNearby(){
    if(!nearGrid) return;

    const list = filteredDogs();
    if (!list.length){
      nearGrid.innerHTML = `<p class="soft" style="padding:.5rem">${t("noProfiles")}</p>`;
      return;
    }
    nearGrid.innerHTML = list.map(cardHTML).join("");

    setTimeout(()=>{
      qa(".dog-card").forEach(card=>{
        const id = card.getAttribute("data-id");
        const d  = DOGS.find(x=>x.id===id);
        if(!d) return;

        card.addEventListener("click", ()=>{
          card.classList.add("flash-violet");
          setTimeout(()=>{
            card.classList.remove("flash-violet");
            openProfilePage(d);
          }, 500);
        });
      });
    }, 10);
  }

  function cardHTML(d){
    return `
      <article class="card dog-card" data-id="${d.id}">
        <img
          src="./${d.img}"
          alt="${d.name}"
          class="card-img"
          decoding="async"
          onerror="this.onerror=null;this.src='./plutoo-icon-192.png';"
        />
        <div class="card-info">
          <h3>${d.name} ${d.verified?"✅":""}</h3>
          <p class="meta">${d.breed} · ${d.age} ${t("years")} · ${fmtKm(d.km)}</p>
          <p class="bio">${d.bio||""}</p>
        </div>
      </article>`;
  }

  function fmtKm(n){
  const num = (typeof n === "number") ? n : Number(String(n ?? "").replace(",", "."));
  if (!Number.isFinite(num)) return "— km";
  return `${num.toFixed(1)} km`;
  }

  function filteredDogs(){
    const f = state.filters;
    return DOGS
      .filter(d => !d.km || d.km <= (f.distKm || 999))
      .filter(d => (!f.verified || !state.plus) ? true : d.verified)
      .filter(d => (!f.sex) ? true : d.sex === f.sex)
      .filter(d => (!f.breed) ? true : d.breed.toLowerCase().startsWith(f.breed.toLowerCase()))
      .filter(d => { if (!state.plus || !f.ageMin) return true; return d.age >= parseInt(f.ageMin); })
      .filter(d => { if (!state.plus || !f.ageMax) return true; return d.age <= parseInt(f.ageMax); })
      .filter(d => { if (!state.plus || !f.weight) return true; return d.weight >= parseInt(f.weight); })
      .filter(d => { if (!state.plus || !f.height) return true; return d.height >= parseInt(f.height); })
      .filter(d => {
        if (!state.plus || !f.pedigree) return true;
        return f.pedigree === "yes" ? d.pedigree : true;
      })
      .filter(d => {
        if (!state.plus || !f.breeding) return true;
        return f.breeding === "yes" ? d.breeding : true;
      })
      .filter(d => {
        if (!state.plus || !f.size) return true;
        return d.size === f.size;
      });
  }

  // ============ Swipe ============
  function renderSwipe(mode){
  const deck = DOGS.filter(d=>d.mode===mode);
  if(!deck.length) return;

  const idx = (mode==="love"?state.currentLoveIdx:state.currentPlayIdx) % deck.length;
  const d = deck[idx];
  if(!d) return;

  const img   = mode==="love" ? loveImg : playImg;
  const title = mode==="love" ? loveTitleTxt : playTitleTxt;
  const meta  = mode==="love" ? loveMeta : playMeta;
  const bio   = mode==="love" ? loveBio : playBio;
  const card  = mode==="love" ? loveCard : playCard;
  const yesBtn = mode==="love" ? loveYes : playYes;
  const noBtn  = mode==="love" ? loveNo  : playNo;

  if(!img || !title || !meta || !bio || !card) return;

  img.src = d.img;
  title.textContent = `${d.name} ${d.verified?"✅":""}`;
  meta.textContent  = `${d.breed} · ${d.age} ${t("years")} · ${fmtKm(d.km)}`;
  bio.textContent   = d.bio || "";

  if(yesBtn) yesBtn.onclick = null;
  if(noBtn) noBtn.onclick = null;

  // ✅ FIX: Cleanup vecchi event listeners prima di riassegnarli
  if(card._cleanup) card._cleanup();

  async function handleSwipeComplete(direction){
    if(state.processingSwipe) return;
    state.processingSwipe = true;

    if (direction === "right"){
      const dogId = d.id;
      
      // Salva match locale
      if (mode === "love") {
        state.matches[dogId] = true;
        localStorage.setItem("matches", JSON.stringify(state.matches));
    // ✅ CONSOLIDA MATCH SU FIRESTORE (PRIMA di tutto)
if (typeof ensureChatForMatch === "function") {
  try {
    await ensureChatForMatch(d);
  } catch (e) {
    console.error("ensureChatForMatch FALLITA:", e);
  }
}
      } else {
        state.friendships[dogId] = true;
        localStorage.setItem("friendships", JSON.stringify(state.friendships));
      }

      // Animazione match
      showMatchAnimation(d.name, nextMatchColor);
      state.matchCount++;
      localStorage.setItem("matchCount", String(state.matchCount));
      nextMatchColor = ["💙","💚","💛","🧡","💜","💗","💝","💖","💞","❤️"][state.matchCount % 10];
    }

    if (mode==="love") state.currentLoveIdx++; else state.currentPlayIdx++;

    setTimeout(()=>{
      resetCard(card);

      state.swipeCount++;
      localStorage.setItem("swipes", String(state.swipeCount));

      if (!state.plus && state.swipeCount >= state.nextRewardAt && !state.rewardOpen){
        state.rewardOpen = true;
        showRewardVideoMock("swipe", ()=>{
          state.rewardOpen = false;
          state.nextRewardAt += 5;
          localStorage.setItem("nextRewardAt", String(state.nextRewardAt));

          state.processingSwipe = false;
          renderSwipe(mode);
        });
      } else {
        state.processingSwipe = false;
        renderSwipe(mode);
      }
    }, 600);
  }

  if (yesBtn) {
    yesBtn.onclick = () => {
      if (state.processingSwipe) return;
      card.classList.add("swipe-out-right");
    void handleSwipeComplete("right");
    };
  }
  
  if(noBtn){
    noBtn.onclick = ()=>{
      if(state.processingSwipe) return;
      card.classList.add("swipe-out-left");
      handleSwipeComplete("left");
    };
  }

  // ✅ FIX: Passa l'oggetto DOG CORRENTE, non una closure
  attachSwipeWithClick(card, d, handleSwipeComplete);
  }

function attachSwipeWithClick(card, dogData, onSwipe){
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let currentX = 0;
  let dragging = false;
  let hasMoved = false;

  const CLICK_THRESHOLD = 10;
  const CLICK_TIME_THRESHOLD = 300;

  const start = (x, y) => {
    if(state.processingSwipe) return;
    startX = x;
    startY = y;
    currentX = x;
    startTime = Date.now();
    dragging = true;
    hasMoved = false;
    card.style.transition = "none";
  };

  const move = (x) => {
    if(!dragging || state.processingSwipe) return;
    currentX = x;
    const dx = currentX - startX;

    if(Math.abs(dx) > CLICK_THRESHOLD){
      hasMoved = true;
    }

    const rot = dx / 18;
    card.style.transform = `translate3d(${dx}px,0,0) rotate(${rot}deg)`;
  };

  const end = () => {
    if(!dragging || state.processingSwipe) return;
    dragging = false;
    card.style.transition = "";

    const dx = currentX - startX;
    const elapsed = Date.now() - startTime;
    const th = 90;

    // ✅ Click: apri profilo DEL DOG corrente
    if(!hasMoved && elapsed < CLICK_TIME_THRESHOLD && Math.abs(dx) < CLICK_THRESHOLD){
      card.classList.add("flash-violet");
      setTimeout(()=>{
        card.classList.remove("flash-violet");
        openProfilePage(dogData);
      }, 500);
      resetCard(card);
      return;
    }

    if(Math.abs(dx) > th){
      const direction = dx > 0 ? "right" : "left";
      card.classList.add(dx > 0 ? "swipe-out-right" : "swipe-out-left");
      void onSwipe(direction);
    } else {
      resetCard(card);
    }

    currentX = 0;
  };

  // ✅ Handler nominati (necessari per removeEventListener)
  const onTouchStart = (e) => {
    const touch = e.touches[0];
    start(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e) => {
    const touch = e.touches[0];
    move(touch.clientX);
  };

  const onTouchEnd = () => end();

  const onMouseDown = (e) => start(e.clientX, e.clientY);
  const handleMouseMove = (e) => move(e.clientX);
  const handleMouseUp = () => end();

  // ✅ Aggancio listener
  card.addEventListener("touchstart", onTouchStart, {passive: true});
  card.addEventListener("touchmove", onTouchMove, {passive: true});
  card.addEventListener("touchend", onTouchEnd, {passive: true});

  card.addEventListener("mousedown", onMouseDown);

  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);

  // ✅ Cleanup COMPLETO (touch + mouse + window)
  card._cleanup = () => {
    card.removeEventListener("touchstart", onTouchStart);
    card.removeEventListener("touchmove", onTouchMove);
    card.removeEventListener("touchend", onTouchEnd);

    card.removeEventListener("mousedown", onMouseDown);

    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };
}

  function resetCard(card){
    card.classList.remove("swipe-out-right","swipe-out-left");
    card.style.transform="";
    if(card._cleanup) card._cleanup();
  }

function showMatchAnimation(dogName, color) {
  const overlay = document.getElementById("matchOverlay") || document.querySelector(".match-overlay");
  if (!overlay) return;

  const heartEl = overlay.querySelector(".match-hearts");
  const textBox = overlay.querySelector(".match-text");

  if (heartEl) {
  heartEl.style.fontSize = "190px";
  heartEl.textContent = color || "💛";
}

if (textBox) textBox.textContent = "MATCH!";

overlay.style.transition = "opacity 0.8s ease-out";
overlay.classList.add("active");

// fade-in iniziale
overlay.style.opacity = "1";

// dopo 0.9s inizia a sparire
setTimeout(() => {
  overlay.style.opacity = "0";
}, 900);

// dopo il fade-out nascondiamo tutto
setTimeout(() => {
  overlay.classList.remove("active");
  overlay.style.transition = "";
  overlay.style.opacity = "";
}, 1700);
}

  // ✅ NUOVA FUNZIONE: Consolida match su Firestore (swipe + profilo)
async function ensureChatForMatch(dog) {
  if (!dog || !dog.id) return;
  
  try {
    const selfUid = window.PLUTOO_UID || "anonymous";
    const dogId = dog.id;
    const dogName = dog.name || "";
    const dogAvatar = dog.img || dog.avatar || "";

    // chatId deterministico (stesso formato usato ovunque)
    const chatId = `${selfUid}_${dogId}`;

    const chatPayload = {
      members: [selfUid],
      dogId,
      dogName,
      dogAvatar,
      match: true,
      lastMessageText: "",
      lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("chats").doc(chatId).set(chatPayload, { merge: true });
  } catch (err) {
    console.error("Errore ensureChatForMatch:", err);
  }
}

  // ============ Ricerca ============
  if (btnSearchPanel) {
    btnSearchPanel.addEventListener("click", (e)=>{
      e.preventDefault();
      e.stopPropagation();
      if (searchPanel) {
        searchPanel.classList.remove("hidden");
        searchPanel.style.display = "flex";
      }
    });
  }
  closeSearch?.addEventListener("click", ()=>{
    if(searchPanel) {
      searchPanel.classList.add("hidden");
      searchPanel.style.display = "none";
    }
  });
  
  distRange?.addEventListener("input", ()=> distLabel.textContent = `${distRange.value} km`);

  breedInput?.addEventListener("input", ()=>{
  const raw = (breedInput.value||"").trim();
  const v = raw.toLowerCase();

  // reset UI
  breedsList.innerHTML=""; 
  breedsList.style.display="none";
  breedInput.dataset.canonical = "";

  if (!v) return;

  // ✅ ALIAS: mostra IT/EN ma salva sempre canonical (Mixed Breed)
const ALIAS = {
  "meticcio":   { label: "Meticcio",   canonical: "Mixed Breed" },
  "mix breed":  { label: "Mix Breed",  canonical: "Mixed Breed" },
  "mixed breed":{ label: "Mixed Breed",canonical: "Mixed Breed" }
};

const aliasHit = ALIAS[v] || null;

// query per cercare nella lista razze (che contiene "Mixed Breed")
const query = ((aliasHit ? aliasHit.canonical : raw) || "").toLowerCase();

let matches = state.breeds
  .filter(b => (b || "").toLowerCase().startsWith(query))
  .slice(0, 16);

// se è un alias ESATTO, forzo 1 risultato con la label giusta
if (aliasHit) matches = [aliasHit.canonical];

if (!matches.length) return;

breedsList.innerHTML = matches.map(b => {
  const canonical = b;
  const label = aliasHit ? aliasHit.label : b;
  return `<div class="item" data-label="${label}" data-canonical="${canonical}">${label}</div>`;
}).join("");

  breedsList.style.display = "block";

qa(".item",breedsList).forEach(it=>it.addEventListener("click",(e)=>{
  e.preventDefault();
  e.stopPropagation();

  breedInput.value = it.getAttribute("data-label") || it.textContent;
  breedInput.dataset.canonical = it.getAttribute("data-canonical") || it.textContent;

  // chiudi lista e togli focus così NON si riapre subito
  breedsList.style.display = "none";
  breedInput.blur();
}));
});
  
  document.addEventListener("click",(e)=>{
    if (e.target!==breedInput && !breedsList.contains(e.target)) breedsList.style.display="none";
  });

  onlyVerified?.addEventListener("change", ()=> state.filters.verified = !!onlyVerified.checked);
  sexFilter?.addEventListener("change", ()=> state.filters.sex = sexFilter.value || "");

  applyFilters?.addEventListener("click",(e)=>{
    e.preventDefault();
    state.filters.breed = (breedInput.dataset.canonical || breedInput.value || "").trim();
    state.filters.distKm = parseInt(distRange.value||"50");
    state.filters.sex = sexFilter.value || "";
    state.filters.verified = !!onlyVerified.checked;
    if (state.plus){
      state.filters.ageMin = (ageMin.value||"").trim();
      state.filters.ageMax = (ageMax.value||"").trim();
      state.filters.weight = (weightInput.value||"").trim();
      state.filters.height = (heightInput.value||"").trim();
      state.filters.pedigree = pedigreeFilter.value || "";
      state.filters.breeding = breedingFilter.value || "";
      state.filters.size = sizeFilter.value || "";
    }
    persistFilters();
    renderNearby();
    searchPanel.classList.add("hidden");
  });

  resetFilters?.addEventListener("click",()=>{
    breedInput.value=""; distRange.value=50; distLabel.textContent="50 km";
    onlyVerified.checked=false; sexFilter.value="";
    if (state.plus){
      ageMin.value=""; ageMax.value="";
      weightInput.value=""; heightInput.value="";
      pedigreeFilter.value=""; breedingFilter.value=""; sizeFilter.value="";
    }
    Object.assign(state.filters,{
      breed:"",distKm:50,verified:false,sex:"",
      ageMin:"",ageMax:"",weight:"",height:"",
      pedigree:"",breeding:"",size:""
    });
    persistFilters(); renderNearby();
  });

  function persistFilters(){
    localStorage.setItem("f_breed", state.filters.breed);
    localStorage.setItem("f_distKm", String(state.filters.distKm));
    localStorage.setItem("f_verified", state.filters.verified?"1":"0");
    localStorage.setItem("f_sex", state.filters.sex);
    localStorage.setItem("f_ageMin", state.filters.ageMin||"");
    localStorage.setItem("f_ageMax", state.filters.ageMax||"");
    localStorage.setItem("f_weight", state.filters.weight||"");
    localStorage.setItem("f_height", state.filters.height||"");
    localStorage.setItem("f_pedigree", state.filters.pedigree||"");
    localStorage.setItem("f_breeding", state.filters.breeding||"");
    localStorage.setItem("f_size", state.filters.size||"");
  }

  // ============ Sezione Social nel profilo ============
function generateSocialSection(d) {

  const saved = state.ownerSocialByDog?.[d.id] || {};

  const links = {
    facebook: saved.facebook && saved.facebook.trim() ? saved.facebook.trim() : null,
    instagram: saved.instagram && saved.instagram.trim() ? saved.instagram.trim() : null,
    tiktok: saved.tiktok && saved.tiktok.trim() ? saved.tiktok.trim() : null
  };

  // Nessun social → non mostrare niente
  if (!links.facebook && !links.instagram && !links.tiktok) {
    return `
      <div class="pp-social-section">
        <h4 class="section-title" style="margin-top:0;font-size:1rem">
          ${state.lang==="it" ? "📱 Social Proprietario" : "📱 Owner's Social"}
        </h4>
        <p style="color:var(--muted);font-size:.9rem;padding:1rem 0;text-align:center">
          ${state.lang==="it"?"Nessun social aggiunto":"No social added"}
        </p>
      </div>
    `;
  }

  return `
    <div class="pp-social-section">
      <h4 class="section-title" style="margin-top:0;font-size:1rem">
        ${state.lang==="it" ? "📱 Social Proprietario" : "📱 Owner's Social"}
      </h4>

      <div class="pp-social-grid">

        ${links.facebook ? `
          <a class="social-btn social-fb" href="${links.facebook}" target="_blank">
            <div class="social-icon">
              <svg class="social-svg" viewBox="0 0 24 24">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <span>Facebook</span>
          </a>
        ` : ""}

        ${links.instagram ? `
          <a class="social-btn social-ig" href="${links.instagram}" target="_blank">
            <div class="social-icon">
              <svg class="social-svg" viewBox="0 0 24 24">
                <path fill="#E4405F" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z"/>
              </svg>
            </div>
            <span>Instagram</span>
          </a>
        ` : ""}

        ${links.tiktok ? `
          <a class="social-btn social-tt" href="${links.tiktok}" target="_blank">
            <div class="social-icon">
              <svg class="social-svg" viewBox="0 0 24 24">
                <path fill="#FFFFFF" d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
            </div>
            <span>TikTok</span>
          </a>
        ` : ""}

      </div>
    </div>
  `;
}

  // ============ FOLLOW / SEGUI TI (mock locale) ============
  function persistFollowState() {
    localStorage.setItem("followersByDog", JSON.stringify(state.followersByDog || {}));
    localStorage.setItem("followingByDog", JSON.stringify(state.followingByDog || {}));
  }

  function getFollowers(dogId) {
    if (!dogId) return [];
    const map = state.followersByDog || {};
    const arr = map[dogId] || [];
    return Array.isArray(arr) ? arr : [];
  }

  function getFollowing(dogId) {
    const map = state.followingByDog || {};
    const key = dogId || CURRENT_USER_DOG_ID;
    const arr = map[key] || [];
    return Array.isArray(arr) ? arr : [];
  }

  function followDog(targetDogOrId) {
  // ✅ guard-rail: mappe sempre inizializzate (evita crash -> ENTRA morto / bottone morto)
  if (!state.followersByDog || typeof state.followersByDog !== "object") state.followersByDog = {};
  if (!state.followingByDog || typeof state.followingByDog !== "object") state.followingByDog = {};

  const targetDog = targetDogDogOrId(targetDogOrId);
  const targetDogId = (targetDog && typeof targetDog === "object" && targetDog.id) ? targetDog.id : targetDog;
  if (!targetDogId) return;

  // ✅ dogId “mio” coerente (robusto): se manca, non fare crash e non “sembra morto”
const selfDogId =
  (typeof CURRENT_USER_DOG_ID !== "undefined" && CURRENT_USER_DOG_ID)
    ? String(CURRENT_USER_DOG_ID)
    : "";

if (!selfDogId) {
  // production: feedback chiaro, niente crash silenzioso
  if (typeof showToast === "function") {
    showToast(state.lang === "it" ? "Seleziona prima il tuo DOG" : "Select your DOG first");
  }
  return;
}

  // followingByDog[currentDogId] = [dogId...]
  state.followingByDog[CURRENT_USER_DOG_ID] = getFollowing(CURRENT_USER_DOG_ID);
  if (!state.followingByDog[CURRENT_USER_DOG_ID].includes(targetDogId)) {
    state.followingByDog[CURRENT_USER_DOG_ID].push(targetDogId);
  }

  // followersByDog[targetDogId] = [currentDogId...]
  state.followersByDog[targetDogId] = getFollowers(targetDogId);
  if (!state.followersByDog[targetDogId].includes(CURRENT_USER_DOG_ID)) {
    state.followersByDog[targetDogId].push(CURRENT_USER_DOG_ID);
  }

  persistFollowState();
  updateFollowerUI(targetDogId);

  // ✅ Firestore (source of truth): salva follow
  try {
  const selfUid = window.PLUTOO_UID;
  const _db = (window.db || (typeof db !== "undefined" ? db : null));

if (!selfUid || !_db) {
  console.error("FOLLOW Firestore SKIP:", { selfUid, hasDb: !!_db });
  if (typeof showToast === "function") showToast("FOLLOW: Firestore SKIP (uid/db)");
  return;
}

const docId = `${String(selfDogId)}_${String(targetDogId)}`;

_db.collection("followers").doc(docId).set({
  followerUid: String(selfUid),
  followerDogId: String(selfDogId),
  targetDogId: String(targetDogId),
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
}, { merge: true })
.then(() => {
  console.log("FOLLOW Firestore OK:", docId);
  // ✅ NOTIFICA (source of truth): follow
const notifId = `follow_${String(selfDogId)}_${String(targetDogId)}`;
_db.collection("notifications").doc(notifId).set({
  type: "follow",
  fromUid: String(selfUid),
  fromDogId: String(selfDogId),
  toDogId: String(targetDogId),
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  read: false
}, { merge: true }).catch((e) => {
  console.error("followDog notification Firestore:", e);
});
  if (typeof showToast === "function") showToast("FOLLOW: salvato su Firestore ✅");
})
.catch((e) => {
  console.error("followDog Firestore:", e);
  if (typeof showToast === "function") showToast("FOLLOW: ERRORE Firestore ❌");
});
  } catch (e) {
    console.error("followDog Firestore:", e);
  }
}

function unfollowDog(targetDogOrId) {
  if (!state.followersByDog || typeof state.followersByDog !== "object") state.followersByDog = {};
  if (!state.followingByDog || typeof state.followingByDog !== "object") state.followingByDog = {};

  const targetDog = targetDogDogOrId(targetDogOrId);
  const targetDogId = (targetDog && typeof targetDog === "object" && targetDog.id) ? targetDog.id : targetDog;
  if (!targetDogId) return;

  const selfDogId =
  (typeof CURRENT_USER_DOG_ID !== "undefined" && CURRENT_USER_DOG_ID)
    ? String(CURRENT_USER_DOG_ID)
    : "";

if (!selfDogId) {
  if (typeof showToast === "function") {
    showToast(state.lang === "it" ? "Seleziona prima il tuo DOG" : "Select your DOG first");
  }
  return;
}

  state.followingByDog[CURRENT_USER_DOG_ID] =
    getFollowing(CURRENT_USER_DOG_ID).filter(id => id !== targetDogId);

  state.followersByDog[targetDogId] =
    getFollowers(targetDogId).filter(id => id !== CURRENT_USER_DOG_ID);

  persistFollowState();
  updateFollowerUI(targetDogId);

  // ✅ Firestore (source of truth): rimuove follow
  try {
    const selfUid = window.PLUTOO_UID;
    const _db = (window.db || (typeof db !== "undefined" ? db : null));
    if (!selfUid || !_db) {
  alert(
    "FIRESTORE BLOCCATO:\n" +
    "selfUid=" + selfUid + "\n" +
    "db=" + _db
  );
  return;
    }

    const docId = `${String(selfDogId)}_${String(targetDogId)}`;
    _db.collection("followers").doc(docId).delete().catch((e) => {
      // ✅ NOTIFICA: rimuovi follow
const notifId = `follow_${String(selfDogId)}_${String(targetDogId)}`;
_db.collection("notifications").doc(notifId).delete().catch((e) => {
  console.error("unfollowDog notification delete:", e);
});
      console.error("unfollowDog Firestore:", e);
    });
  } catch (e) {
    console.error("unfollowDog Firestore:", e);
  }
}

  function targetDogDogOrId(dogOrId) {
    if (!dogOrId) return state.currentDogProfile || null;
    if (typeof dogOrId === "string") {
      return DOGS.find(d => d.id === dogOrId) || state.currentDogProfile || null;
    }
    return dogOrId;
  }

  function updateFollowerUI(dogOrId) {
    const dog = targetDogDogOrId(dogOrId);
    if (!dog) return;

    const dogId = (typeof dog === "string") ? dog : dog.id;
    if (!dogId) return;

    const followers = getFollowers(dogId);
    const following = getFollowing(dogId);

    const followersCountEl = $("followersCount");
    const followingCountEl = $("followingCount");

    if (followersCountEl) {
      const count = followers.length;
      if (state.lang === "it") {
        followersCountEl.textContent = `${count} follower`;
      } else {
        followersCountEl.textContent = `${count} follower${count === 1 ? "" : "s"}`;
      }
      followersCountEl.dataset.dogId = dogId;
    }

    if (followingCountEl) {
      const count = following.length;
      if (state.lang === "it") {
        followingCountEl.textContent = `${count} seguiti`;
      } else {
        followingCountEl.textContent = `${count} following`;
      }
      followingCountEl.dataset.dogId = dogId;
    }
  }

  function openFollowersList(dogOrId) {
    const dog = targetDogDogOrId(dogOrId);
    if (!dog || !followersOverlay || !followersList) return;

    const dogId = (typeof dog === "string") ? dog : dog.id;
    if (!dogId) return;

    const followers = getFollowers(dogId);

    if (!followers.length) {
      followersList.innerHTML = `<p class="sheet-empty">${state.lang === "it" ? "Nessun follower" : "No followers yet"}</p>`;
    } else {
      followersList.innerHTML = followers.map(id => {
        const fDog = DOGS.find(x => x.id === id);
        if (!fDog) return "";
        return `
          <div class="sheet-item">
            <img class="sheet-avatar" src="${fDog.img}" alt="${fDog.name}" onerror="this.onerror=null;this.src='./plutoo-icon-192.png';">
            <div class="sheet-info">
              <div class="sheet-name">${fDog.name} ${fDog.verified ? "✅" : ""}</div>
              <div class="sheet-meta">${fDog.breed || ""}</div>
            </div>
          </div>
        `;
      }).join("");
    }

    followersOverlay.classList.remove("hidden");
    requestAnimationFrame(() => followersOverlay.classList.add("show"));
  }

  function openFollowingList(dogOrId) {
    const dog = targetDogDogOrId(dogOrId);
    if (!dog || !followingOverlay || !followingList) return;

    const dogId = (typeof dog === "string") ? dog : dog.id;
    if (!dogId) return;

    const following = getFollowing(dogId);

    if (!following.length) {
      followingList.innerHTML = `<p class="sheet-empty">${state.lang === "it" ? "Nessun DOG seguito" : "No following yet"}</p>`;
    } else {
      followingList.innerHTML = following.map(id => {
        const fDog = DOGS.find(x => x.id === id);
        if (!fDog) return "";
        return `
          <div class="sheet-item">
            <img class="sheet-avatar" src="${fDog.img}" alt="${fDog.name}" onerror="this.onerror=null;this.src='./plutoo-icon-192.png';">
            <div class="sheet-info">
              <div class="sheet-name">${fDog.name} ${fDog.verified ? "✅" : ""}</div>
              <div class="sheet-meta">${fDog.breed || ""}</div>
            </div>
          </div>
        `;
      }).join("");
    }

    followingOverlay.classList.remove("hidden");
    requestAnimationFrame(() => followingOverlay.classList.add("show"));
  }

  function closeFollowersOverlay() {
    if (!followersOverlay) return;
    followersOverlay.classList.remove("show");
    setTimeout(() => followersOverlay.classList.add("hidden"), 200);
  }

  function closeFollowingOverlay() {
    if (!followingOverlay) return;
    followingOverlay.classList.remove("show");
    setTimeout(() => followingOverlay.classList.add("hidden"), 200);
  }

  followersOverlay?.addEventListener("click", (e) => {
    if (e.target === followersOverlay || e.target.classList.contains("sheet-close")) {
      closeFollowersOverlay();
    }
  });

  followingOverlay?.addEventListener("click", (e) => {
    if (e.target === followingOverlay || e.target.classList.contains("sheet-close")) {
      closeFollowingOverlay();
    }
  });

  // ============ LIKE FOTO PROFILO ============
  function isDogPhotoLiked(dogId) {
    if (!dogId) return false;
    return !!(state.photoLikesByDog && state.photoLikesByDog[dogId]);
  }

  function persistPhotoLikes() {
    localStorage.setItem("photoLikesByDog", JSON.stringify(state.photoLikesByDog || {}));
  }

  function updatePhotoLikeUI(dogId) {
  if (!profileLikeBtn || !dogId) return;
  const liked = isDogPhotoLiked(dogId);
  const count = liked ? 1 : 0;  // 0 se non likato, 1 se likato

  profileLikeBtn.classList.toggle("liked", liked);

  profileLikeBtn.classList.remove("heart-anim");
  void profileLikeBtn.offsetWidth;
  profileLikeBtn.classList.add("heart-anim");

  profileLikeBtn.textContent = "❤️ " + count;
}

  function togglePhotoLike(dogId) {
    if (!dogId) return;
    if (!state.photoLikesByDog) state.photoLikesByDog = {};

    const wasLiked = isDogPhotoLiked(dogId);

    if (wasLiked) {
      delete state.photoLikesByDog[dogId];
    } else {
      state.photoLikesByDog[dogId] = true;
    }

    persistPhotoLikes();
    updatePhotoLikeUI(dogId);

    // ✅ FIRESTORE (PRODUCTION): salva like/unlike
    try {
      const uid = window.PLUTOO_UID;
      const _db = (window.db || (typeof db !== "undefined" ? db : null));
      if (!uid || !_db) return;

      const ref = _db.collection("dogs").doc(String(dogId))
        .collection("photoLikes").doc(String(uid));

      if (wasLiked) {
        ref.delete().catch(()=>{});
      } else {
        ref.set({
          uid: String(uid),
          dogId: String(dogId),
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(()=>{});
      }
    } catch (_) {}
  }

  // ============ LIKE STORIES ============
  function isStoryLiked(mediaId) {
    if (!mediaId) return false;
    return !!(state.storyLikesByMedia && state.storyLikesByMedia[mediaId]);
  }

  function persistStoryLikes() {
    localStorage.setItem("storyLikesByMedia", JSON.stringify(state.storyLikesByMedia || {}));
  }

  function updateStoryLikeUI(mediaId) {
  if (!storyLikeBtn || !mediaId) return;
  const liked = isStoryLiked(mediaId);
  storyLikeBtn.classList.toggle("liked", liked);
    storyLikeBtn.classList.remove("heart-anim");
void storyLikeBtn.offsetWidth;
storyLikeBtn.classList.add("heart-anim");
  storyLikeBtn.textContent = "❤️";
}

  function toggleStoryLike(mediaId) {
    if (!mediaId) return;
    if (!state.storyLikesByMedia) state.storyLikesByMedia = {};

    const wasLiked = isStoryLiked(mediaId);

    if (wasLiked) {
      delete state.storyLikesByMedia[mediaId];
    } else {
      state.storyLikesByMedia[mediaId] = true;
    }

    persistStoryLikes();
    updateStoryLikeUI(mediaId);

    // ✅ FIRESTORE (PRODUCTION): salva like/unlike
    try {
      const uid = window.PLUTOO_UID;
      const _db = (window.db || (typeof db !== "undefined" ? db : null));
      if (!uid || !_db) return;

      const ref = _db.collection("stories").doc(String(mediaId))
        .collection("likes").doc(String(uid));

      if (wasLiked) {
        ref.delete().catch(()=>{});
      } else {
        ref.set({
          uid: String(uid),
          mediaId: String(mediaId),
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(()=>{});
      }
    } catch (_) {}
  }

  // ============ Profilo DOG (con Stories + Social + Follow + Like foto) ============
window.openProfilePage = (d)=>{

// ✅ GUARD-RAIL (anti crash da notifiche/fallback)  
try {  
  if (!d || typeof d !== "object") d = {};  
  if (d.id == null && d.dogId != null) d.id = d.dogId;  
  d.id = (d.id != null) ? String(d.id) : "";  
   if (!d.id && d.id !== "__create__") return;

  // state maps sempre presenti (evita TypeError su state.ownerDocsUploaded[d.id])  
  if (!state.ownerDocsUploaded || typeof state.ownerDocsUploaded !== "object") state.ownerDocsUploaded = {};  
  if (!state.dogDocsUploaded   || typeof state.dogDocsUploaded   !== "object") state.dogDocsUploaded   = {};  
  if (!state.ownerDocsUploaded[d.id] || typeof state.ownerDocsUploaded[d.id] !== "object") state.ownerDocsUploaded[d.id] = {};  
  if (!state.dogDocsUploaded[d.id]   || typeof state.dogDocsUploaded[d.id]   !== "object") state.dogDocsUploaded[d.id]   = {};  

  // campi minimi safe (evita undefined in template)  
  d.name  = (d.name  != null) ? String(d.name)  : "";  
  d.img   = (d.img   != null) ? String(d.img)   : "";  
  d.breed = (d.breed != null) ? String(d.breed) : "";  
  d.bio   = (d.bio   != null) ? String(d.bio)   : "";  
} catch (e) {  
  console.error("openProfilePage guard-rail:", e);  
  return;  
}  
  
state.currentDogProfile = d;  
localStorage.setItem("currentProfileDogId", d.id);  
setActiveView("profile");  

history.pushState({view: "profile", dogId: d.id}, "", "");  

profilePage.classList.remove("hidden");

const selfieUnlocked = isSelfieUnlocked(d.id);
const ownerDocs = state.ownerDocsUploaded[d.id] || {};
const dogDocs = state.dogDocsUploaded[d.id] || {};
const selfieKey   = `selfieImage_${d.id}`;
const selfieStored = localStorage.getItem(selfieKey);
const selfieSrc    = selfieStored || d.img;

const dogStories =
window.StoriesState && Array.isArray(window.StoriesState.stories)
? window.StoriesState.stories.find(s => s.userId === d.id)
: null;
const storiesHTML = dogStories ? `
  <div class="pp-stories-section">
    <div class="pp-stories-header">
      <h4 class="section-title" style="margin:0">${state.lang==="it"?"Stories":"Stories"}</h4>
      <button id="uploadDogStory" class="btn accent small">📸 ${state.lang==="it"?"Carica Story":"Upload Story"}</button>
    </div>
    <div class="pp-stories-grid" id="dogStoriesGrid">
      ${dogStories.media.map((m, idx) => `
        <div class="pp-story-item" data-story-index="${idx}">
          <img src="${m.url}" alt="Story" />
          <span class="pp-story-time">${getTimeAgo(m.timestamp)}</span>
        </div>
      `).join('')}
    </div>
  </div>
` : `
  <div class="pp-stories-section">
    <div class="pp-stories-header">
      <h4 class="section-title" style="margin:0">${state.lang==="it"?"Stories":"Stories"}</h4>
      <button id="uploadDogStory" class="btn accent small">📸 ${state.lang==="it"?"Carica Story":"Upload Story"}</button>
    </div>
    <p style="color:var(--muted);font-size:.9rem;text-align:center;padding:1rem 0">${state.lang==="it"?"Nessuna story disponibile":"No stories available"}</p>
  </div>
`;

const isCreate = (d && d.isCreate === true) || (d && d.id === "__create__");
const heroImg = isCreate ? "" : (d.img || "./plutoo-icon-192.png");

profileContent.innerHTML = `
  <div class="pp-hero">
    ${
      isCreate
        ? `
            <div class="pp-create-hero" style="min-height:180px;"></div>
              </div>
            </div>
          </div>
        `
        : `
          <img src="${heroImg}" alt="${d.name}" onerror="this.onerror=null;this.src='./plutoo-icon-192.png';">
        `
    }
  </div>

  <div class="pp-head">
    <h2 class="pp-name">
      <span class="pp-name-main">
        ${isCreate ? (state.lang==="it"?"Nuovo profilo":"New profile") : `${d.name} ${d.verified?"✅":""}`}
      </span>

      ${isCreate ? `` : `<button type="button" id="followBtn" class="btn small pp-follow-btn">Segui 🐕🐾</button>`}

      ${isCreate ? `` : `
        <span class="pp-follow-stats">
          <button type="button" id="followersCount" class="pp-follow-count">0 follower</button>
          <span class="pp-follow-dot">·</span>
          <button type="button" id="followingCount" class="pp-follow-count">0 seguiti</button>
        </span>
      `}
    </h2>

  ${isCreate ? `
  <div class="pp-badges pp-create-inline">
    <span class="badge create-req" data-req="1" data-label="${state.lang==="it"?"Nome DOG":"DOG name"}" style="padding:.35rem .5rem">
      <input id="createDogName" type="text" value="" placeholder="${state.lang==="it"?"Nome DOG *":"DOG name *"}" style="background:transparent;border:0;outline:none;color:inherit;width:10rem;max-width:45vw">
    </span>

    <span class="badge create-req" data-req="1" data-label="${state.lang==="it"?"Razza":"Breed"}" style="padding:.35rem .5rem">
      <input id="createDogBreed" type="text" value="" placeholder="${state.lang==="it"?"Razza *":"Breed *"}" style="background:transparent;border:0;outline:none;color:inherit;width:10rem;max-width:45vw">
    </span>

    <span class="badge create-req" data-req="1" data-label="${state.lang==="it"?"Età":"Age"}" style="padding:.35rem .5rem">
      <input id="createDogAge" type="number" min="0" step="1" value="" placeholder="${state.lang==="it"?"Età *":"Age *"}" style="background:transparent;border:0;outline:none;color:inherit;width:5.5rem">
    </span>

    <span class="badge create-req" data-req="1" data-label="${state.lang==="it"?"Sesso":"Sex"}" style="padding:.35rem .5rem">
      <select id="createDogSex" style="background:transparent;border:0;outline:none;color:inherit">
        <option value="">${state.lang==="it"?"Sesso *":"Sex *"}</option>
        <option value="M">${state.lang==="it"?"Maschio":"Male"}</option>
        <option value="F">${state.lang==="it"?"Femmina":"Female"}</option>
      </select>
    </span>
  </div>

  <div id="createDogErrors"
       class="soft"
       style="display:none;margin-top:.6rem;padding:.6rem .8rem;border:1px solid rgba(255,80,80,.45);border-radius:14px;color:#ffb3b3;background:rgba(255,0,0,.06)">
  </div>
` : ` 

        <div class="pp-badges">
        <span class="badge">${d.breed}</span>
        <span class="badge">${d.age} ${t("years")}</span>
        <span class="badge">${fmtKm(d.km)}</span>
        <span class="badge">${d.sex==="M"?(state.lang==="it"?"Maschio":"Male"):(state.lang==="it"?"Femmina":"Female")}</span>
      </div>
    `}
  </div>

  <div class="pp-meta soft">
  ${isCreate ? `
    <textarea
      id="createDogBio"
      rows="3"
      placeholder="${state.lang==="it"?"Bio (opzionale)":"Bio (optional)"}"
      style="width:100%;background:transparent;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:.6rem;color:inherit"
    ></textarea>

    <div style="margin-top:.6rem;text-align:center">
      <button id="btnSaveDogDraft" class="btn primary">
        ${state.lang==="it"?"Salva profilo":"Save profile"}
      </button>
    </div>
  ` : (d.bio||"")}
</div>

  ${isCreate ? `` : storiesHTML}

  <h3 class="section-title">${state.lang==="it"?"Galleria":"Gallery"}</h3>
  <div class="gallery">
    ${isCreate ? `
      <div class="ph"><button class="add-photo">+ ${state.lang==="it"?"Aggiungi foto":"Add photo"}</button></div>
    ` : `
      <div class="ph"><img src="${d.img}" alt=""></div>
      <div class="ph"><img src="${d.img}" alt=""></div>
      <div class="ph"><img src="${d.img}" alt=""></div>
      <div class="ph"><button class="add-photo">+ ${state.lang==="it"?"Aggiungi":"Add"}</button></div>
    `}
  </div>

  <h3 class="section-title">Selfie</h3>

  <div class="selfie ${selfieUnlocked?'unlocked':''}">
    <img class="img" src="${isCreate ? "./plutoo-icon-192.png" : (selfieSrc || "./plutoo-icon-192.png")}" alt="Selfie">
    <input type="file" id="selfieFileInput" accept="image/*" style="display:none" />
    <div class="over">
      <button id="unlockSelfie" class="btn pill">${state.lang==="it"?"Sblocca selfie":"Unlock selfie"}</button>
      <button id="uploadSelfie" class="btn pill ghost">${state.lang==="it"?"Carica selfie":"Upload selfie"}</button>
    </div>
  </div>

  <h3 class="section-title">${state.lang==="it"?"Documenti":"Documents"}</h3>

  <div class="pp-docs-section">
    <h4 class="section-title" style="margin-top:0;font-size:1rem">${state.lang==="it"?"Documenti Proprietario DOG":"DOG Owner Documents"}</h4>
    <p style="font-size:.88rem;color:var(--muted);margin:.3rem 0 .6rem">${state.lang==="it"?"Obbligatorio per ottenere il badge verificato ✅":"Required to get verified badge ✅"}</p>
    <div class="pp-docs-grid">
      <div class="doc-item" data-doc="owner-identity" data-type="owner">
        <div class="doc-icon">🪪</div>
        <div class="doc-label">${state.lang==="it"?"Carta d'identità":"Identity Card"}</div>
        <div class="doc-status ${ownerDocs.identity?'uploaded':'pending'}">${ownerDocs.identity?(state.lang==="it"?"✓ Caricato":"✓ Uploaded"):(state.lang==="it"?"Da caricare":"Upload")}</div>
      </div>
    </div>
  </div>

  <div class="pp-docs-section" style="margin-top:1.2rem">
    <h4 class="section-title" style="margin-top:0;font-size:1rem">${state.lang==="it"?"Documenti DOG":"DOG Documents"}</h4>
    <p style="font-size:.88rem;color:var(--muted);margin:.3rem 0 .6rem">${state.lang==="it"?"Facoltativi (vaccini, pedigree, microchip)":"Optional (vaccines, pedigree, microchip)"}</p>
    <div class="pp-docs-grid">
      <div class="doc-item" data-doc="dog-vaccines" data-type="dog">
        <div class="doc-icon">💉</div>
        <div class="doc-label">${state.lang==="it"?"Vaccini":"Vaccines"}</div>
        <div class="doc-status ${dogDocs.vaccines?'uploaded':'pending'}">${dogDocs.vaccines?(state.lang==="it"?"✓ Caricato":"✓ Uploaded"):(state.lang==="it"?"Da caricare":"Upload")}</div>
      </div>
      <div class="doc-item" data-doc="dog-pedigree" data-type="dog">
        <div class="doc-icon">📜</div>
        <div class="doc-label">${state.lang==="it"?"Pedigree":"Pedigree"}</div>
        <div class="doc-status ${dogDocs.pedigree?'uploaded':'pending'}">${dogDocs.pedigree?(state.lang==="it"?"✓ Caricato":"✓ Uploaded"):(state.lang==="it"?"Da caricare":"Upload")}</div>
      </div>
      <div class="doc-item" data-doc="dog-microchip" data-type="dog">
        <div class="doc-icon">🔬</div>
        <div class="doc-label">${state.lang==="it"?"Microchip":"Microchip"}</div>
        <div class="doc-status ${dogDocs.microchip?'uploaded':'pending'}">${dogDocs.microchip?(state.lang==="it"?"✓ Caricato":"✓ Uploaded"):(state.lang==="it"?"Da caricare":"Upload")}</div>
      </div>
    </div>
  </div>

  ${generateSocialSection(d)}

  ${isCreate ? `` : `
    <div class="pp-actions">
      ${
        (typeof CURRENT_USER_DOG_ID === "string" && CURRENT_USER_DOG_ID && d.id === CURRENT_USER_DOG_ID)
          ? `
            <button id="btnProfileSettings" class="btn accent">
              ${state.lang==="it" ? "Impostazioni profilo" : "Profile settings"}
            </button>
            <button id="btnEditSocial" class="btn outline">
              ${state.lang==="it" ? "Modifica social" : "Edit socials"}
            </button>
          `
          : `
            <button id="btnLikeDog" class="btn accent">💛 Like</button>
            <button id="btnOpenChat" class="btn primary">
              ${state.lang==="it" ? "Invia messaggio" : "Send message"}
            </button>
          `
      }
    </div>
  `}
</div>
`;

  // =========================
// ✅ CREATE DOG: wiring (foto + validazione + feedback)
// =========================
try {
  if (isCreate) {
    const $ = (sel) => profileContent.querySelector(sel);

    const photoBtn = $("#btnPickCreateDogPhoto");
    const photoInput = $("#createDogPhotoInput");
    const photoPreview = $("#createDogPhotoPreview");
    const photoEmpty = $("#createDogPhotoEmpty");

    const nameEl = $("#createDogName");
    const breedEl = $("#createDogBreed");
    const ageEl = $("#createDogAge");
    const sexEl = $("#createDogSex");
    const bioEl = $("#createDogBio");
    const saveBtn = $("#btnSaveDogDraft");
    const errBox = $("#createDogErrors");

    const markBadge = (fieldId, isBad) => {
      const field = $("#" + fieldId);
      if (!field) return;
      const badge = field.closest && field.closest(".badge");
      if (!badge) return;
      badge.style.border = isBad ? "1px solid rgba(255,80,80,.75)" : "";
      badge.style.boxShadow = isBad ? "0 0 0 2px rgba(255,80,80,.15)" : "";
    };

    const clearErrors = () => {
      ["createDogName","createDogBreed","createDogAge","createDogSex"].forEach(id => markBadge(id, false));
      if (errBox) { errBox.style.display = "none"; errBox.textContent = ""; }
    };

    const validateCreate = () => {
      const missing = [];
      const name = (nameEl?.value || "").trim();
      const breed = (breedEl?.value || "").trim();
      const age = (ageEl?.value || "").trim();
      const sex = (sexEl?.value || "").trim();

      if (!name) missing.push(state.lang==="it" ? "Nome DOG" : "DOG name");
      if (!breed) missing.push(state.lang==="it" ? "Razza" : "Breed");
      if (!age) missing.push(state.lang==="it" ? "Età" : "Age");
      if (!sex) missing.push(state.lang==="it" ? "Sesso" : "Sex");

      markBadge("createDogName", !name);
      markBadge("createDogBreed", !breed);
      markBadge("createDogAge", !age);
      markBadge("createDogSex", !sex);

      if (missing.length) {
        if (errBox) {
          errBox.style.display = "block";
          errBox.innerHTML = (state.lang==="it"
            ? `Compila i campi obbligatori: <b>${missing.join(", ")}</b>.`
            : `Fill the required fields: <b>${missing.join(", ")}</b>.`
          );
        }
        return false;
      }
      if (errBox) { errBox.style.display = "none"; errBox.textContent = ""; }
      return true;
    };

    // Foto: apri picker
    if (photoBtn && photoInput) {
      photoBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        photoInput.click();
      });
    }

    // Foto: preview
    if (photoInput && photoPreview && photoEmpty) {
      photoInput.addEventListener("change", () => {
        const file = photoInput.files && photoInput.files[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        photoPreview.src = url;
        photoPreview.style.display = "block";
        photoEmpty.style.display = "none";

        // salviamo TEMP su state per lo step "salvataggio reale"
        state.__createDogPhotoFile = file;
        state.__createDogPhotoUrl = url;
      });
    }

    // Feedback live: togli errori mentre scrive
    [nameEl, breedEl, ageEl, sexEl].forEach(el => {
      if (!el) return;
      el.addEventListener("input", clearErrors);
      el.addEventListener("change", clearErrors);
    });

    // Salva: valida, poi lascia proseguire (qui NON inventiamo salvataggi)
    if (saveBtn) {
      saveBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearErrors();

        if (!validateCreate()) return;

        // Qui NON salvo io: tu hai già la logica altrove.
        // Setto solo un payload standard pronto per la tua funzione di save.
        state.__createDogDraft = {
          name: (nameEl?.value || "").trim(),
          breed: (breedEl?.value || "").trim(),
          age: (ageEl?.value || "").trim(),
          sex: (sexEl?.value || "").trim(),
          bio: (bioEl?.value || "").trim(),
          photoFile: state.__createDogPhotoFile || null,
          photoUrl: state.__createDogPhotoUrl || ""
        };

        // Se esiste una tua funzione di salvataggio, la chiamiamo (senza inventarla)
        if (typeof window.saveCreateDogProfile === "function") {
          window.saveCreateDogProfile(state.__createDogDraft);
        }
      }, true);
    }
  }
} catch (e) {
  console.error("CREATE DOG wiring error:", e);
}

  // ✅ PROFILO DOG REALE — PUBLISH MODE (Firestore source of truth)
// Questo blocco NON deve MAI bloccare chat/like/follow quando l'utente è loggato senza DOG.
// In modalità "solo mail" restano cliccabili i profili demo: si blocca SOLO upload (gestito altrove).
(function attachRealDogProfileControls() {
  try {
    // Se non sono loggato, non faccio nulla
    if (!window.auth || !window.auth.currentUser) return;

    // Se non ho un DOG reale, NON inietto note e NON disabilito bottoni.
    // (Upload già bloccato dal blocco READONLY SOLO UPLOAD che hai messo vicino a ENTRA.)
    if (!window.PLUTOO_HAS_DOG) return;

    // Se qui sotto in futuro vuoi controlli "solo per DOG reale",
    // devi farli

    // ==== GALLERIA PROFILO (max 5 foto, salvate in localStorage)
    (function () {
      // Se per qualche motivo d non c'è, esco
      if (!d || !profileContent) return;

      const maxPhotos = 5;
      const dogId = d.id;
      const storageKey = "gallery_" + dogId;

      // Prendo il contenitore .gallery e il bottone "+ Aggiungi"
      const galleryBlock = qs(".gallery", profileContent);
      if (!galleryBlock) return;

      const addGalleryPhotoBtn = galleryBlock.querySelector(".add-photo");
      if (!addGalleryPhotoBtn) return;

      // Lo slot che contiene il bottone "+ Aggiungi"
      const addSlot = addGalleryPhotoBtn.closest(".ph") || galleryBlock.lastElementChild;

      // Carico eventuali immagini salvate
      let images = [];
      try {
        const raw = localStorage.getItem(storageKey);
        images = raw ? JSON.parse(raw) : [];
      } catch (e) {
        images = [];
      }
      if (!Array.isArray(images)) images = [];

      // Input file nascosto
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;
      input.style.display = "none";
      document.body.appendChild(input);

      // Render delle foto caricate (prima dello slot "+ Aggiungi")
      const renderGallery = () => {
        // Rimuovo solo le foto caricate in precedenza (marcate con data-upload="1")
        Array.from(galleryBlock.querySelectorAll('.ph[data-upload="1"]')).forEach(ph => ph.remove());

        const limit = Math.min(images.length, maxPhotos);
        for (let i = 0; i < limit; i++) {
          const src = images[i];
          const ph = document.createElement("div");
          ph.className = "ph";
          ph.dataset.upload = "1";

          const img = document.createElement("img");
          img.src = src;
          img.className = "pp-gallery-img";
          img.onerror = () => {
            img.src = "./plutoo-icon-192.png";
          };

          ph.appendChild(img);
          galleryBlock.insertBefore(ph, addSlot);
        }

        // Se ho raggiunto il massimo, disabilito il bottone
        addGalleryPhotoBtn.disabled = images.length >= maxPhotos;
      };

      // Click su "+ Aggiungi" → apro il picker
      addGalleryPhotoBtn.addEventListener("click", () => {
        if (images.length >= maxPhotos) return;
        input.value = "";
        input.click();
      });

      // Quando scelgo i file, li salvo e aggiorno la griglia
      input.addEventListener("change", () => {
        const files = Array.from(input.files || []);
        if (!files.length) return;

        const remaining = maxPhotos - images.length;
        const toAdd = files.slice(0, remaining);
        if (!toAdd.length) return;

        let pending = toAdd.length;

        toAdd.forEach(file => {
          const reader = new FileReader();
          reader.onload = e => {
            images.push(e.target.result);
            pending--;
            if (pending === 0) {
              try {
                localStorage.setItem(storageKey, JSON.stringify(images));
              } catch (err) {
                // se localStorage è pieno, semplicemente non salvo
              }
              renderGallery();
            }
          };
          reader.readAsDataURL(file);
        });
      });

      // Primo render (mostra eventuali foto già salvate)
      renderGallery();
    })();

    updateFollowerUI(d);

    const followBtn = $("followBtn");
    if (followBtn) {
      const refreshFollowBtn = () => {
        // ✅ usa SEMPRE il mio dogId reale
        const myFollowing = (typeof CURRENT_USER_DOG_ID === "string" && CURRENT_USER_DOG_ID)
          ? getFollowing(CURRENT_USER_DOG_ID)
          : [];
        const isFollowing = myFollowing.includes(d.id);

        if (state.lang === "it") {
          followBtn.textContent = isFollowing ? "Seguito 🐕🐾" : "Segui 🐕🐾";
        } else {
          followBtn.textContent = isFollowing ? "Following 🐕🐾" : "Follow 🐕🐾";
        }
        followBtn.classList.toggle("is-following", isFollowing);

        // ✅ se non ho un dogId mio, il follow non può essere salvato
        followBtn.disabled = !(typeof CURRENT_USER_DOG_ID === "string" && CURRENT_USER_DOG_ID);
      };

      followBtn.onclick = () => {
        // ✅ blocca subito se manca il mio dogId (evita “sembra morto”)
        if (!(typeof CURRENT_USER_DOG_ID === "string" && CURRENT_USER_DOG_ID)) {
          console.error("FOLLOW blocked: CURRENT_USER_DOG_ID mancante");
          refreshFollowBtn();
          return;
        }

        const myFollowing = getFollowing(CURRENT_USER_DOG_ID);
        const isFollowing = myFollowing.includes(d.id);

        if (isFollowing) {
          unfollowDog(d.id);
        } else {
          followDog(d.id);
        }
        refreshFollowBtn();
      };

      refreshFollowBtn();
    }

    const followersCountEl = $("followersCount");
    const followingCountEl = $("followingCount");

    // ✅ evita accumulo listeners ogni volta che apri il profilo
    if (followersCountEl) followersCountEl.onclick = () => openFollowersList(d.id);
    if (followingCountEl) followingCountEl.onclick = () => openFollowingList(d.id);

    if (profileLikeBtn) {
      profileLikeBtn.onclick = () => togglePhotoLike(d.id);
      updatePhotoLikeUI(d.id);
    }

    if (dogStories) {
      qa(".pp-story-item", profileContent).forEach(item => {
        item.addEventListener("click", () => {
          const idx = parseInt(item.getAttribute("data-story-index"));
          openDogStoryViewer(d.id, idx);
        });
      });
    }

    $("uploadDogStory")?.addEventListener("click", ()=> { openUploadModal(); });

    qa(".gallery img", profileContent).forEach(img=>{
      img.addEventListener("click", ()=>{
        const lb = document.createElement("div");
        lb.className = "lightbox";
        lb.innerHTML = `
          <button class="close" aria-label="Chiudi">✕</button>
          <div class="lightbox-inner">
            <img src="${img.src}" alt="">
            <button class="story-like-btn lightbox-like-btn" type="button">❤️ 0</button>
          </div>`;
        document.body.appendChild(lb);

        const closeBtn = qs(".close", lb);
        if (closeBtn) closeBtn.onclick = ()=> lb.remove();
        lb.addEventListener("click", (e)=>{ if(e.target===lb) lb.remove(); });

        const likeBtn = qs(".lightbox-like-btn", lb);
        if (likeBtn) {
          const refresh = () => {
            const liked = isDogPhotoLiked(d.id);
            const count = liked ? 1 : 0;
            likeBtn.textContent = "❤️ " + count;
          };

          likeBtn.addEventListener("click", (ev)=>{
            ev.stopPropagation();
            togglePhotoLike(d.id);
            refresh();
            updatePhotoLikeUI(d.id);
          });

          refresh();
        }
      });
    });

    // --- DOCS: apertura file picker + salvataggio stato ---
    const docFileInput = document.createElement("input");
    docFileInput.type = "file";
    docFileInput.accept = "image/*,application/pdf";
    docFileInput.style.display = "none";
    profileContent.appendChild(docFileInput);

    qa(".doc-item", profileContent).forEach(item=>{
      item.addEventListener("click", (e)=>{
        // 🔒 VETRINA: blocco totale documenti
        if (window.PLUTOO_READONLY && d.id !== "__create__") {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          const msg = state.lang === "it"
            ? "🔒 Crea il profilo DOG per caricare i documenti"
            : "🔒 Create your DOG profile to upload documents";
          if (typeof showToast === "function") showToast(msg);
          return;
        }

        const docType = item.getAttribute("data-doc");
        const docCategory = item.getAttribute("data-type");

        // quando l'utente sceglie un file
        docFileInput.onchange = () => {
          const file = docFileInput.files && docFileInput.files[0];
          if (!file) return;

          if (docCategory === "owner"){
            if (!state.ownerDocsUploaded[d.id]) state.ownerDocsUploaded[d.id] = {};
            state.ownerDocsUploaded[d.id].identity = true;
            localStorage.setItem("ownerDocsUploaded", JSON.stringify(state.ownerDocsUploaded));

            if (!d.verified){
              d.verified = true;
              alert(state.lang==="it" ? "Badge verificato ottenuto! ✅" : "Verified badge obtained! ✅");
            }
          } else if (docCategory === "dog"){
            if (!state.dogDocsUploaded[d.id]) state.dogDocsUploaded[d.id] = {};
            const docName = docType.replace("dog-", "");
            state.dogDocsUploaded[d.id][docName] = true;
            localStorage.setItem("dogDocsUploaded", JSON.stringify(state.dogDocsUploaded));
          }

          // ricarico il profilo per aggiornare le etichette "Caricato"
          openProfilePage(d);
        };

        // apro il selettore file
        docFileInput.click();
      });
    });

    qa(".social-btn", profileContent).forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const baseUrl   = btn.getAttribute("data-url");
        const dogId     = btn.getAttribute("data-dog-id");
        const socialKey = btn.getAttribute("data-social"); // "social-fb" / "social-ig" / "social-tt"

        let finalUrl = baseUrl;

        // Se esistono URL personalizzati salvati per quel DOG, li usiamo al posto di quelli mock
        if (dogId && state.ownerSocialByDog && state.ownerSocialByDog[dogId]) {
          const ownerSocial = state.ownerSocialByDog[dogId];
          if (socialKey === "social-fb" && ownerSocial.facebook) {
            finalUrl = ownerSocial.facebook;
          } else if (socialKey === "social-ig" && ownerSocial.instagram) {
            finalUrl = ownerSocial.instagram;
          } else if (socialKey === "social-tt" && ownerSocial.tiktok) {
            finalUrl = ownerSocial.tiktok;
          }
        }

        if (!finalUrl) return;

        const rewardKey = `${dogId}_${socialKey}`;

        if (state.plus || state.socialRewardViewed[rewardKey]) {
          window.open(finalUrl, "_blank", "noopener");
          return;
        }
        if (state.rewardOpen) return;
        state.rewardOpen = true;

        showRewardVideoMock("social", ()=>{
          state.rewardOpen = false;
          state.socialRewardViewed[rewardKey] = true;
          localStorage.setItem("socialRewardViewed", JSON.stringify(state.socialRewardViewed));
          window.open(finalUrl, "_blank", "noopener");
        });
      });
    });

  } catch (e) {
    console.error("attachRealDogProfileControls error:", e);
  }
})();

    // Azioni nel profilo DOG (chat + like/match)
const openChatBtn = $("btnOpenChat");
if (openChatBtn) {
  openChatBtn.onclick = () => openChat(d);
}

  const likeDogBtn = $("btnLikeDog");
if (likeDogBtn) {
  likeDogBtn.addEventListener("click", async () => {
    if (!d || !d.id) return;

    // 1) Match locale (cache UI)
    state.matches[d.id] = true;
    localStorage.setItem("matches", JSON.stringify(state.matches));

    // 2) Match su Firestore (FONTE per la tab Match)
    if (typeof ensureChatForMatch === "function") {
      try {
        await ensureChatForMatch(d);
      } catch (e) {
        console.error("ensureChatForMatch PROFILO FALLITA:", e);
      }
    }

    // 3) Animazione
    const nameForMatch = d.name || (state.lang === "it" ? "Nuovo match" : "New match");
    showMatchAnimation(nameForMatch, nextMatchColor);

    state.matchCount++;
    localStorage.setItem("matchCount", String(state.matchCount));

    nextMatchColor = ["💙","💚","💛","🧡","💜","💗","💝","💖","💞","❤️"][state.matchCount % 10];
  });
}

    $("uploadSelfie").onclick = () => {
  const d = state.currentDogProfile;
  if (!d) return;

  const fileInput = $("selfieFileInput");
  if (!fileInput) return;

  // reset della selezione precedente
  fileInput.value = "";

  fileInput.onchange = () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl   = e.target.result;
      const selfieKey = `selfieImage_${d.id}`;

      // salva localmente
      localStorage.setItem(selfieKey, dataUrl);

      // aggiorna subito l’immagine in pagina
      const img = qs(".selfie .img", profileContent);
      if (img) img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  };

  fileInput.click();
};
    $("unlockSelfie").onclick = ()=>{
      if (!isSelfieUnlocked(d.id)){
        const unlock = ()=> {
          state.selfieUntilByDog[d.id] = Date.now() + 24*60*60*1000;
          localStorage.setItem("selfieUntilByDog", JSON.stringify(state.selfieUntilByDog));
          openProfilePage(d);
        };
        if (!state.plus){
          showRewardVideoMock("selfie", unlock);
        } else unlock();
      }
    };
  };

  profileBack?.addEventListener("click", ()=> closeProfilePage());
  profileClose?.addEventListener("click", ()=> closeProfilePage());

  window.closeProfilePage = ()=>{
    profilePage.classList.add("hidden");
    const previousView = state.viewHistory.pop() || "nearby";
    setActiveView(previousView);
    state.currentDogProfile = null;
  };

  function isSelfieUnlocked(id){ return Date.now() < (state.selfieUntilByDog[id]||0); }

  // Carica i messaggi da Firestore per una chat (ROBUSTO: ordina lato JS)
async function loadChatHistory(chatId, dogName) {
  if (!db || !chatList || !chatId) return;

  try {
    const selfUid = window.PLUTOO_UID || "anonymous";

    // 1) Prendo TUTTI i messaggi della chat (senza orderBy per non “perdere” doc)
    const snap = await db
      .collection("messages")
      .where("chatId", "==", chatId)
      .get();

    const msgs = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const text = (data.text || "").trim();
      if (!text) return;

      // createdAt può essere Timestamp, null, o mancante: lo normalizzo
      let t = 0;
      const ca = data.createdAt;
      if (ca && typeof ca.toDate === "function") {
        t = ca.toDate().getTime();
      }

      msgs.push({
        text,
        senderUid: data.senderUid || "",
        t,
        isRead: data.isRead === true
      });
    });

    // 2) Ordino per data crescente (chi non ha createdAt va in cima, ma resta visibile)
    msgs.sort((a, b) => (a.t || 0) - (b.t || 0));

    // 3) Render
    chatList.innerHTML = "";

    msgs.forEach((m) => {
      const isMe = (m.senderUid === selfUid);

      const bubble = document.createElement("div");
      bubble.className = isMe ? "msg me" : "msg";

      // testo
      const txt = document.createElement("div");
      txt.className = "msg-text";
      txt.textContent = m.text;
      bubble.appendChild(txt);

      // ✅ spunta SOLO sui miei messaggi (IG style base)
      if (isMe) {
        const st = document.createElement("div");
        st.className = "msg-status";
        st.textContent = m.isRead ? "✓✓" : "✓";
        bubble.appendChild(st);
      }

      chatList.appendChild(bubble);
    });

    chatList.scrollTop = chatList.scrollHeight;
  } catch (err) {
    console.error("Errore loadChatHistory:", err);
  }
}

  // =========== Chat ===========
function openChat(chatIdOrDog, maybeDogId, maybeOtherUid) {
  if (!chatPane || !chatList || !chatInput) return;

  const selfUid = window.PLUTOO_UID || "anonymous";

  let dog = null;
  let dogId = "";
  let chatId = "";

  // Caso 1: openChat(dog) dal profilo
  if (typeof chatIdOrDog === "object" && chatIdOrDog) {
    dog = chatIdOrDog;
    dogId = dog.id || "";
  } else {
    // Caso 2: openChat(chatId, dogId, otherUid) da lista Messaggi
    chatId = chatIdOrDog || "";
    dogId = maybeDogId || "";

    // Se dogId non arriva, ricavalo da chatId (formato: selfUid_dogId)
    if (!dogId && chatId && chatId.startsWith(selfUid + "_")) {
      dogId = chatId.slice((selfUid + "_").length);
    }
  }

  // ChatId UNICO e deterministico: sempre selfUid_dogId
  chatId = `${selfUid}_${dogId}`;

  // Trova DOG coerente (evita fallback strani)
  dog = dog || (DOGS.find(d => d.id === dogId) || null);
  const dogName = (dog && dog.name) || (state.lang === "en" ? "DOG" : "Dog");

  // Mostra pannello chat
  chatPane.classList.remove("hidden");
  chatPane.classList.add("show");

  // Salva metadati correnti
  chatPane.dataset.dogId = dogId;
  chatPane.dataset.chatId = chatId;
  chatPane.dataset.hasMatch = "0";
  state.currentDogId = dogId;
  state.currentChatId = chatId;

  chatList.innerHTML = "";

  // Carica history completa
  loadChatHistory(chatId, dogName);

  // ✅ LETTO quando apro la chat (serve per far scalare il badge)
  const openedFrom = state._openChatFromTab || "";
  state._openChatFromTab = ""; // reset

  // segna letto se apro la chat da QUALSIASI tab (inbox/requests/matches)
  // (così il numeretto scende appena entro davvero nella chat)
  const shouldMarkRead = true;

  if (shouldMarkRead && window.db && chatId) {
    // segna "letto" SOLO i messaggi ricevuti (non i miei), solo quelli non letti
    window.db.collection("messages")
      .where("chatId", "==", chatId)
      .where("isRead", "==", false)
      .get()
      .then((snap) => {
        snap.forEach((docSnap) => {
          const m = docSnap.data() || {};
          if (m.senderUid && m.senderUid !== selfUid) {
            docSnap.ref.update({
              isRead: true,
              readAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(() => {});
          }
        });
      })
      .catch((e) => console.error("mark read failed:", e));
  }

  // Funzione locale per applicare le regole input (UNA sola fonte: hasMatch vero/falso)
  const applyChatRules = (hasMatchValue) => {
    const msgCount = state.chatMessagesSent[dogId] || 0;

    if (!state.plus && !hasMatchValue && msgCount >= 1) {
      chatInput.disabled = true;
      chatInput.placeholder = state.lang === "it"
        ? "Match necessario per continuare"
        : "Match needed to continue";
    } else {
      chatInput.disabled = false;
      chatInput.placeholder = state.lang === "it"
        ? "Scrivi un messaggio…"
        : "Type a message…";
    }
  };

  // 1) Applica subito una regola “provvisoria” (cache locale, se esiste)
  const localHasMatch = !!(state.matches && state.matches[dogId]);
  applyChatRules(localHasMatch);

  // 2) Poi leggi la verità da Firestore e aggiorna input (questa è quella che conta)
  if (window.db && dogId) {
    window.db.collection("chats").doc(chatId).get()
      .then((doc) => {
        const data = doc && doc.exists ? (doc.data() || {}) : {};
        const fsHasMatch = data.match === true;

        chatPane.dataset.hasMatch = fsHasMatch ? "1" : "0";

        // opzionale: aggiorna cache locale senza decidere nulla
        if (state.matches) {
          if (fsHasMatch) state.matches[dogId] = true;
          localStorage.setItem("matches", JSON.stringify(state.matches));
        }

        applyChatRules(fsHasMatch);
      })
      .catch((err) => {
        console.error("openChat -> read match failed:", err);
        // se fallisce, restano valide le regole provvisorie
      });
  }
}

  function closeChatPane(){
    chatPane.classList.remove("show");
    setTimeout(()=>chatPane.classList.add("hidden"), 250);
  }
  closeChat?.addEventListener("click", closeChatPane);

  chatComposer?.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = chatInput.value.trim();
  if (!text) return;

  const dogId = chatPane.dataset.dogId || "";
  if (!dogId) return;

  const hasMatch = (chatPane.dataset.hasMatch === "1") || !!(state.matches && state.matches[dogId]);
  const msgCount = state.chatMessagesSent[dogId] || 0;

  if (!state.plus) {
    if (msgCount === 0) {
      if (state.rewardOpen) return;
      state.rewardOpen = true;
      showRewardVideoMock("chat", () => {
        state.rewardOpen = false;
        sendChatMessage(text, dogId, hasMatch, msgCount);
      });
      return;
    } else if (!hasMatch && msgCount >= 1) {
      alert(state.lang === "it"
        ? "Serve un match per continuare"
        : "Match required to continue");
      return;
    }
  }

  sendChatMessage(text, dogId, hasMatch, msgCount);
});

async function sendChatMessage(text, dogId, hasMatch, msgCount) {
  // UI subito (Instagram-style: testo + stato)
  const bubble = document.createElement("div");
  bubble.className = "msg me";
  bubble.innerHTML = `
    <div class="msg-text"></div>
    <div class="msg-status" data-status="sending">⏳</div>
  `;
  bubble.querySelector(".msg-text").textContent = text;
  chatList.appendChild(bubble);
  chatInput.value = "";
  chatList.scrollTop = chatList.scrollHeight;

  const statusEl = bubble.querySelector(".msg-status");

  try {
    const selfUid = window.PLUTOO_UID || "anonymous";

    const safeDogId =
      (chatPane && chatPane.dataset && chatPane.dataset.dogId)
        ? chatPane.dataset.dogId
        : (dogId || "");

    if (!safeDogId) {
      console.error("sendChatMessage: dogId mancante");
      statusEl.textContent = "⚠️";
      statusEl.dataset.status = "error";
      return;
    }

    const chatId =
      (chatPane && chatPane.dataset && chatPane.dataset.chatId)
        ? chatPane.dataset.chatId
        : `${selfUid}_${safeDogId}`;

    const dogProfile =
      state.currentDogProfile || DOGS.find(d => d.id === safeDogId) || {};

    const dogName = dogProfile.name || null;
    const dogAvatar =
      dogProfile.img || dogProfile.avatar || dogProfile.photoUrl || null;

    // 1) Messaggio (salvo ref per aggiornare ✓✓ quando diventa letto)
    const msgRef = await db.collection("messages").add({
      chatId,
      senderUid: selfUid,
      text,
      type: "text",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      isRead: false
    });

    // ✓ inviato
    statusEl.textContent = "✓";
    statusEl.dataset.status = "sent";

    // Listener: quando isRead diventa true -> ✓✓
    // (NB: lo diventerà true SOLO se l’altro apre da "Ricevuti", come hai deciso tu)
    msgRef.onSnapshot((doc) => {
      const m = doc && doc.exists ? (doc.data() || {}) : {};
      if (m.isRead === true) {
        statusEl.textContent = "✓✓";
        statusEl.dataset.status = "read";
      }
    }, () => {});

    // 2) Meta chat (NON tocchiamo match)
    await db.collection("chats").doc(chatId).set({
      // IMPORTANTISSIMO: non sovrascrivo più members (così non perdo l’altro UID)
      members: firebase.firestore.FieldValue.arrayUnion(selfUid),
      dogId: safeDogId,
      dogName,
      dogAvatar,
      lastMessageText: text,
      lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastSenderUid: selfUid
    }, { merge: true });

    if (typeof loadMessagesLists === "function") loadMessagesLists();

    // Contatore coerente
    state.chatMessagesSent[safeDogId] =
      (state.chatMessagesSent[safeDogId] || 0) + 1;

    localStorage.setItem(
      "chatMessagesSent",
      JSON.stringify(state.chatMessagesSent)
    );

    // Regole input
    if (!state.plus && !hasMatch && state.chatMessagesSent[safeDogId] >= 1) {
      chatInput.disabled = true;
      chatInput.placeholder =
        state.lang === "it"
          ? "Match necessario per continuare"
          : "Match needed to continue";
    } else {
      chatInput.disabled = false;
      chatInput.placeholder =
        state.lang === "it"
          ? "Scrivi un messaggio…"
          : "Type a message…";
    }

  } catch (err) {
    console.error("Errore Firestore sendChatMessage", err);
    // errore -> icona warning sulla bolla
    try {
      const statusEl = bubble.querySelector(".msg-status");
      statusEl.textContent = "⚠️";
      statusEl.dataset.status = "error";
    } catch (_) {}
  }
}

  // ============ Maps / servizi ============
  function openMapsCategory(cat){
    if (!state.plus && ["vets","groomers","shops"].includes(cat)){
      if (state.rewardOpen) return;
      state.rewardOpen = true;
      showRewardVideoMock("services", ()=>{
        state.rewardOpen = false;
        openMapsQueryAfterReward(cat);
      });
      return;
    }
    openMapsQueryAfterReward(cat);
  }

  function openMapsQueryAfterReward(cat){
    const map = {
      vets: state.lang==="it" ? "cliniche veterinarie vicino a me" : "veterinary clinics near me",
      groomers: state.lang==="it" ? "toelettature vicino a me" : "pet groomers near me",
      shops: state.lang==="it" ? "negozi per animali vicino a me" : "pet shops near me",
      trainers: state.lang==="it" ? "addestratori cani vicino a me" : "dog trainers near me",
      kennels: state.lang==="it" ? "pensioni per dogs vicino a me" : "dog kennels near me",
      parks: state.lang==="it" ? "parchi vicino a me" : "parks near me"
    };
    const q = map[cat] || (state.lang==="it" ? "servizi animali vicino a me" : "pet services near me");
    openMapsQuery(q);
  }

  function openSheltersMaps(){ openMapsQuery(t("mapsShelters")); }

  function openMapsQuery(q){
    if (state.geo){
      const url = `geo:${state.geo.lat},${state.geo.lon}?q=${encodeURIComponent(q)}`;
      window.open(url,"_blank","noopener");
    } else {
      window.open(`https://www.google.com/maps/search/${encodeURIComponent(q)}`,"_blank","noopener");
    }
  }

  // ============ Ads mock ============
  function showAdBanner(){
    if (!adBanner || state.plus) return;
    adBanner.textContent = "Banner Test AdMob • Bannerhome";
    adBanner.style.display = "";
  }

  function showRewardVideoMock(type, onClose){
    const msg = {
      it: {
        swipe: `🎬 Reward Video Mock\n\nSwipe: ${state.swipeCount}\nProssima soglia: ${state.nextRewardAt}\n\nTipo: Swipe Unlock`,
        selfie: "🎬 Reward Video Mock\n(prima di vedere selfie)\n\nTipo: Selfie Unlock",
        chat: "🎬 Reward Video Mock\n(primo messaggio)\n\nTipo: Chat Unlock",
        services: "🎬 Reward Video Mock\n(veterinari/toelettature/negozi)\n\nTipo: Services",
        social: "🎬 Reward Video Mock\n(apertura profilo social)\n\nTipo: Social Unlock",
        sponsor: "🎬 Reward Video Mock\n(Sponsor ufficiale)\n\nTipo: Sponsor"
      },
      en: {
        swipe: `🎬 Reward Video Mock\n\nSwipe: ${state.swipeCount}\nNext threshold: ${state.nextRewardAt}\n\nType: Swipe Unlock`,
        selfie: "🎬 Reward Video Mock\n(before viewing selfie)\n\nType: Selfie Unlock",
        chat: "🎬 Reward Video Mock\n(first message)\n\nType: Chat Unlock",
        services: "🎬 Reward Video Mock\n(vets/groomers/shops)\n\nType: Services",
        social: "🎬 Reward Video Mock\n(opening social profile)\n\nType: Social Unlock",
        sponsor: "🎬 Reward Video Mock\n(Official sponsor)\n\nType: Sponsor"
      }
    };
    const text = (msg[state.lang] && msg[state.lang][type]) || (msg.it && msg.it[type]) || "Ad";
    alert(text);
    if (onClose) onClose();
  }

  // ============ Init ============
async function init(){
  applyTranslations();

  ['dog1.jpg','dog2.jpg','dog3.jpg'].forEach(src=>{
    const im = new Image(); im.src = `./${src}`;
  });

  updatePlusUI();

  if(breedInput) breedInput.value = state.filters.breed;
  if(distRange) distRange.value  = state.filters.distKm;
  if(distLabel) distLabel.textContent = `${distRange.value} km`;
  if(onlyVerified) onlyVerified.checked = !!state.filters.verified;
  if(sexFilter) sexFilter.value  = state.filters.sex;

  if (state.plus){
    if (ageMin) ageMin.value = state.filters.ageMin;
    if (ageMax) ageMax.value = state.filters.ageMax;
    if (weightInput) weightInput.value = state.filters.weight;
    if (heightInput) heightInput.value = state.filters.height;
    if (pedigreeFilter) pedigreeFilter.value = state.filters.pedigree;
    if (breedingFilter) breedingFilter.value = state.filters.breeding;
    if (sizeFilter) sizeFilter.value = state.filters.size;
  }

  if (state.entered){
    // initStories parte dopo ENTRA per effetto WOW
  }
}

  function getVisibleMediaList(story) {
  const hasMatch = !!state.matches[story.userId];
  const hasFriendship = !!state.friendships[story.userId];

  const NOW = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  return story.media.filter(m => {
    // 🔒 privacy (regola esistente)
    const privacyOk =
      m.privacy !== "private" || hasMatch || hasFriendship;

    if (!privacyOk) return false;

    // 🟣 DEMO: non scadono mai
    if (story.isDemo === true) return true;

    // ⏱️ REALI: scadono dopo 24h
    if (!m.timestamp) return false;

    return (NOW - m.timestamp) <= DAY;
  });
  }

  function initStories() {
    StoriesState.loadStories();
    renderStoriesBar();
    setupStoriesEvents();
  }

  // ===== STORIES — eventi, bar, viewer, navigazione =====
  function setupStoriesEvents() {
    $("addStoryBtn")?.addEventListener("click", openUploadModal);

    const closeBtn = $("closeStoryViewer");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeStoryViewer();
      });
    }

    $("storyNavPrev")?.addEventListener("click", prevStoryMedia);
    $("storyNavNext")?.addEventListener("click", nextStoryMedia);

    const viewer = $("storyViewer");
    if (viewer) {
      viewer.addEventListener("click", (e) => {
        if (e.target === viewer) closeStoryViewer();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const v = $("storyViewer");
        if (v && !v.classList.contains("hidden")) {
          closeStoryViewer();
        }
      }
    });

    $("closeUploadStory")?.addEventListener("click", closeUploadModal);
    $("cancelUpload")?.addEventListener("click", closeUploadModal);
    $("storyFileInput")?.addEventListener("change", handleFileSelect);
    $("nextToCustomize")?.addEventListener("click", showCustomizeStep);
    $("backToUpload")?.addEventListener("click", showUploadStep);
    $("publishStory")?.addEventListener("click", publishStory);

    setupFiltersGrid();
  }

  function renderStoriesBar() {
    const container = $("storiesContainer");
    if (!container) return;

    container.innerHTML = "";

    StoriesState.stories.forEach((story) => {
      const visibleMedia = getVisibleMediaList(story);
      if (!visibleMedia.length) return;

      const allViewed = visibleMedia.every((m) => m.viewed);

      const circle = document.createElement("button");
      circle.className = `story-circle ${allViewed ? "viewed" : ""}`;
      circle.type = "button";
      circle.innerHTML = `
        <div class="story-avatar">
          <img src="${story.avatar}" alt="${story.userName}" />
        </div>
        <span class="story-name">${story.userName}</span>
      `;

      circle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openStoryViewerFromBar(story.userId);
      });

      container.appendChild(circle);
    });
  }

  function openDogStoryViewer(dogId, mediaIndex) {
    StoriesState.currentStoryUserId = dogId;
    StoriesState.currentMediaIndex = mediaIndex || 0;
    StoriesState.openedFrom = "profile";

    const storyViewer = $("storyViewer");
    if (storyViewer) {
      storyViewer.classList.remove("hidden");
    }
    document.body.classList.add("noscroll");
    document.body.classList.add("story-open");

    renderStoryViewer();
    startStoryProgress();
  }

  function openStoryViewerFromBar(userId) {
    StoriesState.currentStoryUserId = userId;
    StoriesState.currentMediaIndex = 0;
    StoriesState.openedFrom = "bar";

    $("storyViewer")?.classList.remove("hidden");
    document.body.classList.add("noscroll");
    document.body.classList.add("story-open");

    renderStoryViewer();
    startStoryProgress();
  }

  function renderStoryViewer() {
    const story = StoriesState.stories.find(
      (s) => s.userId === StoriesState.currentStoryUserId
    );
    if (!story) return;

    const visibleMedia = getVisibleMediaList(story);
    if (!visibleMedia.length) {
      closeStoryViewer();
      return;
    }

    const media = visibleMedia[StoriesState.currentMediaIndex];
    if (!media) return;

    $("storyUserAvatar").src = story.avatar;
    $("storyUserName").textContent = story.userName;
    $("storyTimestamp").textContent = getTimeAgo(media.timestamp);

    renderProgressBars(visibleMedia.length);
    renderStoryContent(media);

    media.viewed = true;
    StoriesState.saveStories();
  }

  function renderProgressBars(count) {
    const container = $("storyProgressBars");
    if (!container) return;

    container.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const bar = document.createElement("div");
      bar.className = "story-progress-bar";

      const fill = document.createElement("div");
      fill.className = "story-progress-fill";

      if (i < StoriesState.currentMediaIndex) {
        bar.classList.add("completed");
      }
      if (i === StoriesState.currentMediaIndex) {
        bar.classList.add("active");
      }

      bar.appendChild(fill);
      container.appendChild(bar);
    }
  }

  function renderStoryContent(media) {
    const content = $("storyContent");
    if (!content) return;
    content.innerHTML = "";

    if (media.type === "image") {
      const img = document.createElement("img");
      img.src = media.url;
      img.alt = "Story";
      img.className = `filter-${media.filter}`;
      content.appendChild(img);
    } else if (media.type === "video") {
      const video = document.createElement("video");
      video.src = media.url;
      video.autoplay = true;
      video.muted = false;
      video.className = `filter-${media.filter}`;
      video.addEventListener("ended", nextStoryMedia);
      content.appendChild(video);
    }

    if (storyLikeBtn && media.id) {
      storyLikeBtn.onclick = () => toggleStoryLike(media.id);
      updateStoryLikeUI(media.id);
    }

    if (media.music) playStoryMusic(media.music);
  }

  function startStoryProgress() {
    stopStoryProgress();

    const story = StoriesState.stories.find(
      (s) => s.userId === StoriesState.currentStoryUserId
    );
    if (!story) return;

    const visibleMedia = getVisibleMediaList(story);
    if (!visibleMedia.length) return;

    const media = visibleMedia[StoriesState.currentMediaIndex];
    if (!media) return;

    if (media.type === "image") {
      StoriesState.progressInterval = setTimeout(
        nextStoryMedia,
        STORIES_CONFIG.PHOTO_DURATION
      );
    }
  }

  function stopStoryProgress() {
    if (StoriesState.progressInterval) {
      clearTimeout(StoriesState.progressInterval);
      StoriesState.progressInterval = null;
    }
  }

  function nextStoryMedia() {
    stopStoryProgress();

    const story = StoriesState.stories.find(
      (s) => s.userId === StoriesState.currentStoryUserId
    );
    if (!story) {
      closeStoryViewer();
      return;
    }

    const visibleMedia = getVisibleMediaList(story);
    if (!visibleMedia.length) {
      closeStoryViewer();
      return;
    }

    if (StoriesState.currentMediaIndex < visibleMedia.length - 1) {
      StoriesState.currentMediaIndex++;
      renderStoryViewer();
      startStoryProgress();
    } else {
      const currentIndex = StoriesState.stories.findIndex(
        (s) => s.userId === StoriesState.currentStoryUserId
      );
      if (currentIndex < StoriesState.stories.length - 1) {
        StoriesState.currentStoryUserId = StoriesState.stories[currentIndex + 1].userId;
        StoriesState.currentMediaIndex = 0;
        renderStoryViewer();
        startStoryProgress();
      } else {
        closeStoryViewer();
      }
    }
  }

  function prevStoryMedia() {
    stopStoryProgress();

    if (StoriesState.currentMediaIndex > 0) {
      StoriesState.currentMediaIndex--;
      renderStoryViewer();
      startStoryProgress();
    }
  }

  function closeStoryViewer() {
    stopStoryProgress();
    const viewer = $("storyViewer");
    if (viewer) {
      viewer.classList.add("hidden");
    }
    document.body.classList.remove("noscroll");
    document.body.classList.remove("story-open");

    if (StoriesState?.openedFrom === "profile") {
      $("profilePage")?.classList.remove("hidden");
    }
    StoriesState.openedFrom = null;

    renderStoriesBar();
  }

  function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "ora";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m fa`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h fa`;
    return `${Math.floor(seconds / 86400)}g fa`;
  }

  function triggerFlash() {
    const el = document.getElementById("flashOverlay");
    if (!el) return;
    el.classList.add("active");
    setTimeout(() => el.classList.remove("active"), 900);
  }

  function playStoryMusic(musicId) {
    console.log("🎵 Playing music:", musicId);
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("#storiesBar")) return;
    const el = e.target.closest(".story-circle");
    if (!el || el.id === "addStoryBtn") return;
    const dogId = el.getAttribute("data-dog-id") || el.getAttribute("data-id");
    if (!dogId) return;
    openStoryViewerFromBar(dogId);
  });

  $("storiesBar")?.addEventListener("click", (e) => {
    const el = e.target.closest(".story-circle");
    if (el?.id === "addStoryBtn") return;
    if (!el) return;
    const dogId = el.getAttribute("data-dog-id") || el.getAttribute("data-id");
    if (!dogId) return;
    openStoryViewerFromBar(dogId);
  });

  // ===== STORIES — upload, filtri, pubblicazione =====
  function openUploadModal() {
    if (!StoriesState.canUploadStory()) {
      showToast(state.lang==="it"
        ? "Limite giornaliero Stories raggiunto"
        : "Daily stories limit reached");
      return;
    }
    $("uploadStoryModal")?.classList.remove("hidden");
    document.body.classList.add("noscroll");
  }

  function closeUploadModal() {
    $("uploadStoryModal")?.classList.add("hidden");
    document.body.classList.remove("noscroll");
    $("storyFileInput").value = "";
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const preview = $("storyPreview");
    if (!preview) return;

    preview.innerHTML = "";
    preview.dataset.type = "";
    preview.dataset.hasMedia = "false";

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      alert("Formato non supportato. Usa solo foto o video.");
      return;
    }

    if (isImage && file.size > STORIES_CONFIG.MAX_PHOTO_SIZE) {
      alert("Foto troppo grande. Riduci la dimensione e riprova.");
      return;
    }
    if (isVideo && file.size > STORIES_CONFIG.MAX_VIDEO_SIZE) {
      alert("Video troppo grande. Riduci la durata/dimensione e riprova.");
      return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
      const base64 = event.target.result;

      StoriesState.uploadedFile = {
        type: isImage ? "image" : "video",
        url: base64,
        mime: file.type,
        size: file.size
      };

      if (isImage) {
        preview.innerHTML = `<img src="${base64}" alt="Story" />`;
        preview.dataset.type = "image";
      } else {
        preview.innerHTML = `<video src="${base64}" controls playsinline muted></video>`;
        preview.dataset.type = "video";
      }

      preview.dataset.hasMedia = "true";
      $("nextToCustomize")?.classList.remove("hidden");
    };

    reader.onerror = function () {
      alert("Errore nel caricamento del file. Riprova.");
      StoriesState.uploadedFile = null;
      preview.innerHTML = "";
      $("nextToCustomize")?.classList.add("hidden");
    };

    reader.readAsDataURL(file);
  }

  function showCustomizeStep() {
    $("uploadStep").classList.add("hidden");
    $("customizeStep").classList.remove("hidden");
  }

  function showUploadStep() {
    $("customizeStep").classList.add("hidden");
    $("uploadStep").classList.remove("hidden");
  }

  function setupFiltersGrid() {
    const filterButtons = qa(".filter-chip", $("filtersGrid"));
    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        StoriesState.selectedFilter = btn.dataset.filter || "none";
      });
    });

    const musicButtons = qa(".music-chip", $("musicGrid"));
    musicButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        musicButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        StoriesState.selectedMusic = btn.dataset.music || "";
      });
    });
  }

  function publishStory() {
  // 🔒 VETRINA: blocca pubblicazione story
  if (window.PLUTOO_READONLY) {
    const msg = state.lang === "it"
      ? "🔒 Crea il profilo DOG per pubblicare una story"
      : "🔒 Create your DOG profile to publish a story";
    if (typeof showToast === "function") showToast(msg);
    else alert(msg);
    return;
  }
    
    const preview = $("storyPreview");
    if (!preview || preview.dataset.hasMedia !== "true" || !StoriesState.uploadedFile) {
      alert(state.lang==="it" ? "Seleziona prima una foto o un video" : "Select a photo or video first");
      return;
    }

    const userId = "currentUser";
    let userStory = StoriesState.stories.find(s => s.userId === userId);
    if (!userStory) {
      userStory = {
        userId,
        userName: "You",
        avatar: "plutoo-icon-192.png",
        verified: false,
        media: []
      };
      StoriesState.stories.unshift(userStory);
    }

    const newMedia = {
      id: `m_${Date.now()}`,
      type: StoriesState.uploadedFile.type,
      url: StoriesState.uploadedFile.url,
      timestamp: Date.now(),
      filter: StoriesState.selectedFilter || "none",
      music: StoriesState.selectedMusic || "",
      viewed: false,
      privacy: "public"
    };

    userStory.media.push(newMedia);
    StoriesState.saveStories();

    StoriesState.uploadedFile = null;
    StoriesState.selectedFilter = "none";
    StoriesState.selectedMusic = "";

    closeUploadModal();
    renderStoriesBar();

    showToast(state.lang==="it" ? "Story pubblicata!" : "Story published!");
  }

  function showToast(msg, type = "success") {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }

  // reset stato
  el.className = "toast";
  el.textContent = msg;

  // tipo feedback
  if (type === "error") {
    el.classList.add("toast-error");
  } else {
    el.classList.add("toast-success");
  }

  // mostra
  requestAnimationFrame(() => {
    el.classList.add("show");
  });

  // auto hide
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.classList.remove("show");
  }, 2200);
  }
