/* ================= CRASH DEBUG SYSTEM (PARAFULMINE UNICO) ================= */
(function () {
  // evita doppio attach
  if (window.__PLUTOO_CRASH_SHIELD__) return;
  window.__PLUTOO_CRASH_SHIELD__ = true;

  // traccia ultimo input utente (click/tap) per capire "dove" eri
  window.__LAST_UI_ACTION__ = { t: 0, text: "", id: "", cls: "", tag: "" };

  function pickElInfo(el) {
    try {
      if (!el) return { text: "", id: "", cls: "", tag: "" };
      const tag = (el.tagName || "").toLowerCase();
      const id = el.id ? String(el.id) : "";
      const cls = el.className ? String(el.className) : "";
      const text = (el.innerText || el.textContent || "").trim().slice(0, 80);
      return { text, id, cls, tag };
    } catch (_) {
      return { text: "", id: "", cls: "", tag: "" };
    }
  }

  document.addEventListener("click", function (ev) {
    try {
      const target = ev && ev.target ? ev.target : null;
      const node = target && target.closest ? target.closest("button,a,label,div,span,input") : target;
      const info = pickElInfo(node || target);
      window.__LAST_UI_ACTION__ = { t: Date.now(), ...info };
    } catch (_) {}
  }, true);

  // helper: alert unico "cazzuto" ma non infinito
  function hardAlert(title, payload) {
    try {
      const last = window.__LAST_UI_ACTION__ || {};
      const when = last.t ? new Date(last.t).toLocaleString() : "-";
      const ui =
        "ULTIMO CLICK:\n" +
        "Quando: " + when + "\n" +
        "Tag: " + (last.tag || "-") + "\n" +
        "ID: " + (last.id || "-") + "\n" +
        "Class: " + (last.cls || "-") + "\n" +
        "Testo: " + (last.text || "-") + "\n";

      const msg =
        "⛔ PLUTOO CRASH SHIELD\n\n" +
        title + "\n\n" +
        ui + "\n" +
        payload;

      // evita loop se alert stesso genera errori
      if (window.__PLUTOO_ALERTING__) return;
      window.__PLUTOO_ALERTING__ = true;
      alert(msg);
      window.__PLUTOO_ALERTING__ = false;
    } catch (_) {
      alert("⛔ PLUTOO CRASH SHIELD\n\n" + title);
    }
  }

  // filtra errori risorsa (img/css/script) = rumore
  function isResourceErrorEvent(e) {
    try {
      return !!(e && e.target && !e.error);
    } catch (_) {
      return false;
    }
  }

  // 1) errori JS globali
  window.addEventListener("error", function (e) {
    try {
      // ignora errori risorsa (img/css) -> console only
      if (isResourceErrorEvent(e)) {
        try {
          const t = e.target;
          const u = t && (t.src || t.href) ? (t.src || t.href) : "";
          console.warn("RESOURCE ERROR:", u || t);
        } catch (_) {}
        return;
      }

    const errObj = e && e.error ? e.error : null;

// 1) prova a prendere il messaggio reale in ogni modo
const msg =
  (errObj && errObj.message) ? String(errObj.message) :
  (e && e.message) ? String(e.message) :
  "(no message)";

// 2) se GitHub Pages non valorizza filename/line/col, prova a estrarli dallo stack
let file = (e && e.filename) ? String(e.filename) : "";
let line = (e && typeof e.lineno === "number") ? e.lineno : "";
let col  = (e && typeof e.colno === "number") ? e.colno : "";

const stack = (errObj && errObj.stack) ? String(errObj.stack) : "";

if ((!file || !line) && stack) {
  const m = stack.match(/(https?:\/\/[^\s)]+):(\d+):(\d+)/);
  if (m) {
    file = file || m[1];
    line = line || m[2];
    col  = col  || m[3];
  }
}

file = file || "(no file)";
line = line || "-";
col  = col  || "-";

      const payload =
        "MESSAGGIO: " + msg + "\n" +
        "FILE: " + file + "\n" +
        "LINEA: " + line + ":" + col + "\n\n" +
        (stack ? ("STACK:\n" + stack) : "STACK: (non disponibile)");

      hardAlert("JS ERROR", payload);
    } catch (ex) {
      hardAlert("JS ERROR", "Dettagli non leggibili.\n" + String(ex));
    }
  }, true);

  // 2) promise rejection (Firebase ecc.)
  window.addEventListener("unhandledrejection", function (e) {
    try {
      const r = e && e.reason ? e.reason : null;

      let msg = "";
      let stack = "";
      let code = "";
      let name = "";

      if (r && typeof r === "object") {
        if (r.message) msg = String(r.message);
        if (r.stack) stack = String(r.stack);
        if (r.code) code = String(r.code);
        if (r.name) name = String(r.name);
      } else {
        msg = String(r);
      }

      const payload =
        "REASON: " + (msg || "(no message)") + "\n" +
        (code ? ("CODE: " + code + "\n") : "") +
        (name ? ("NAME: " + name + "\n") : "") + "\n" +
        (stack ? ("STACK:\n" + stack) : "STACK: (non disponibile)");

      hardAlert("PROMISE REJECTION", payload);
    } catch (ex) {
      hardAlert("PROMISE REJECTION", "Dettagli non leggibili.\n" + String(ex));
    }
  });

})();

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

  // ✅ traduci errori Firebase in IT/EN (niente più inglese a schermo)
  function translateAuthError(err) {
    const code = (err && err.code) ? String(err.code) : "";
    const it = (state && state.lang === "it");

    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return it ? "Email o password non corretti." : "Email or password incorrect.";

      case "auth/user-not-found":
        return it ? "Account non trovato." : "Account not found.";

      case "auth/too-many-requests":
        return it ? "Troppi tentativi. Riprova più tardi." : "Too many attempts. Try again later.";

      case "auth/network-request-failed":
        return it ? "Problema di connessione." : "Network error.";

      case "auth/email-already-in-use":
        return it ? "Questa email è già registrata." : "This email is already registered.";

      case "auth/weak-password":
        return it ? "Password troppo debole (minimo 6 caratteri)." : "Weak password (minimum 6 characters).";

      case "auth/invalid-email":
        return it ? "Email non valida." : "Invalid email.";

      case "auth/requires-recent-login":
        return it
          ? "Per eliminare l’account serve un login recente. Fai login e riprova."
          : "Deleting the account requires a recent login. Log in again and retry.";

      default:
        return it ? "Errore di accesso." : "Login error.";
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

    setAuthError("login", translateAuthError(err));
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
  } catch (_) {}

  // ✅ RESET UI + DOG SOLO su logout esplicito
  try {
    window.PLUTOO_UID = null;
    window.__booted = false;

    window.PLUTOO_HAS_DOG = false;
    window.PLUTOO_READONLY = false;
    window.PLUTOO_DOG_ID = "";
    window.PLUTOO_DOG_NAME = "";
    window.CURRENT_USER_DOG_ID = "";
    try { CURRENT_USER_DOG_ID = ""; } catch (_) {}
  } catch (_) {}

  // ✅ torna Home al prossimo avvio
  try {
    localStorage.setItem("currentView", "home");
    localStorage.setItem("entered", "0");
  } catch (_) {}

  try { closeAuth(); } catch (_) {}
});

  document.getElementById("btnAlreadyClose")?.addEventListener("click", closeAuth);

 // ENTRA: gate finale stile Facebook
const btnEnter = document.getElementById("btnEnter");

function updateEnterState() {
  alert("UPDATE ENTER STATE CALLED");
  const enterBtn = document.getElementById("btnEnter");
  if (!enterBtn) return;

  const logged = !!(window.auth && window.auth.currentUser);

  if (logged) {
    enterBtn.disabled = false;
    enterBtn.classList.remove("disabled");

    // ✨ FEEDBACK LOGIN: accendi ENTRA (oro) se non ancora cliccato
    enterBtn.classList.remove("enter-glow");
enterBtn.style.animation = "none";
void enterBtn.offsetWidth;
enterBtn.style.animation = "";
enterBtn.classList.add("enter-glow");
  } else {
    enterBtn.disabled = true;
    enterBtn.classList.add("disabled");

    // reset glow se logout
    enterBtn.classList.remove("enter-glow");
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
    setActiveView(targetView);
    try { state.currentView = targetView; } catch (_) {}

// =========================
// ✅ VETRINA: blocco interazioni (definitivo) — SOLO BLOCCO UPLOAD
// =========================
try {
  if (
  window.PLUTOO_READONLY &&
  state.currentDogProfile?.id !== "__create__"
) {
    document.body.classList.add("plutoo-readonly");

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
}); // <-- CHIUDE

// =========================
// ✅ CREATE DOG: handler unico (Vicino a te + dentro profilo)
// CTA NON deve mai sparire: cambia solo testo + azione
// =========================
(function bindCreateDogButtonsOnce() {
try {
if (window.__createDogBindDone) return;
window.__createDogBindDone = true;

// ✅ helper unico: aggiorna CTA in base allo stato (mai hide definitivo)  
window.refreshCreateDogCTA = function () {  
  const inlineBtn = document.getElementById("btnCreateDogInline");  
  if (!inlineBtn) return;  

  const hasDog = (window.PLUTOO_HAS_DOG === true);  
  const dogId = window.PLUTOO_DOG_ID ? String(window.PLUTOO_DOG_ID) : "";  
  const dogName = (window.PLUTOO_DOG_NAME ? String(window.PLUTOO_DOG_NAME) : "").trim();  

  inlineBtn.style.display = "inline-flex";  

  if (hasDog && dogId) {  
    inlineBtn.dataset.mode = "my";  
    if (dogName) {  
      inlineBtn.textContent = `🐶 ${dogName}`;  
    } else {  
      inlineBtn.textContent = (window.state && window.state.lang === "it") ? "Il mio profilo" : "My profile";  
    }  
  } else {  
    inlineBtn.dataset.mode = "create";  
    inlineBtn.textContent = (window.state && window.state.lang === "it") ? "Crea profilo DOG" : "Create DOG profile";  
  }  
};  

// prima passata (stato corrente)  
window.refreshCreateDogCTA();  

const clickHandler = async (ev) => {  
  ev.preventDefault();  
  ev.stopPropagation();  

  // login richiesto  
  if (!window.auth || !window.auth.currentUser) {  
    if (typeof openAuth === "function") openAuth("login");  
    return;  
  }  

  // ✅ se hai già un DOG: apri "Il mio profilo"  
  if (window.PLUTOO_HAS_DOG === true && window.PLUTOO_DOG_ID) {  
    const myId = String(window.PLUTOO_DOG_ID);  

    // 1) prova da state/local  
    let dogs = [];  
    try { dogs = (window.state && Array.isArray(window.state.dogs)) ? window.state.dogs : []; } catch (_) {}  
    if (!dogs.length) {  
      try { dogs = JSON.parse(localStorage.getItem("dogs") || "[]"); } catch (_) { dogs = []; }  
    }  
    let myDog = (Array.isArray(dogs) ? dogs : []).find(x => x && String(x.id) === myId) || null;  

    // 2) fallback Firestore se manca  
    if (!myDog && window.db) {  
      try {  
        const doc = await window.db.collection("dogs").doc(myId).get();  
        if (doc && doc.exists) {  
          const data = doc.data() || {};  
          myDog = {  
            id: doc.id,  
            name: (data.name || ""),  
            breed: (data.breed || ""),  
            age: (data.age || ""),  
            sex: (data.sex || ""),  
            bio: (data.bio || ""),  
            km: (data.km || 0),  
            img: (data.img || data.photoUrl || "./plutoo-icon-192.png"),  
            verified: !!data.verified  
          };  
          // memorizza nome per CTA  
          try { window.PLUTOO_DOG_NAME = (myDog.name || "").trim(); } catch (_) {}  
        }  
      } catch (_) {}  
    }  

    if (typeof window.openProfilePage === "function") {  
      window.openProfilePage(myDog || { id: myId });  
    }  

    // riallineo CTA (sicurezza)  
    if (typeof window.refreshCreateDogCTA === "function") window.refreshCreateDogCTA();  
    return;  
  }  

  // ✅ se NON hai un DOG: apri create
  localStorage.setItem("currentView", "profile");
localStorage.setItem("currentProfileDogId", "__create__");
  
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

  // CTA resta visibile  
  if (typeof window.refreshCreateDogCTA === "function") window.refreshCreateDogCTA();  
  return;  
};  

document.addEventListener("click", (ev) => {  
  const t = ev.target;  
  if (!t) return;  
  const btn = t.closest && t.closest("#btnCreateDogInline, #btnCreateDogFromProfile");  
  if (!btn) return;  
  clickHandler(ev);  
}, true);  

// ✅ quando qualcuno aggiorna lo stato DOG altrove, può forzare refresh chiamando questo evento  
window.addEventListener("plutoo:dog-changed", () => {  
  if (typeof window.refreshCreateDogCTA === "function") window.refreshCreateDogCTA();  
});

} catch (e) {
console.error("bindCreateDogButtonsOnce error:", e);
}
})();

// ✅ DOG presence check (Firestore source of truth)
// (wrappato in IIFE async per evitare await fuori contesto)
window.plutooDogPresenceCheck = async function plutooDogPresenceCheck() {
try {

// ✅ BOOTSTRAP SEMPRE da cache (prima di Firestore)  
// Così al refresh NON perdi "🐶 Nome" per timing auth/db.  
try {  
  const cHas  = localStorage.getItem("plutoo_has_dog") === "1";  
  const cId   = localStorage.getItem("plutoo_dog_id") || "";  
  const cName = localStorage.getItem("plutoo_dog_name") || "";  
  const cRO   = localStorage.getItem("plutoo_readonly") === "1";  

  if (cId) {  
    window.PLUTOO_HAS_DOG = true;  
    window.PLUTOO_DOG_ID = cId;  
    window.PLUTOO_DOG_NAME = cName;  
    window.PLUTOO_READONLY = false;  
  }  

  if (typeof window.refreshCreateDogCTA === "function") window.refreshCreateDogCTA();  
} catch (_) {}  

const uid = window.auth.currentUser.uid; // = PLUTOO_UID  
if (!uid || !window.db) return;  

 const doc = await window.db.collection("dogs").doc(String(uid)).get();
const data = (doc && doc.exists) ? (doc.data() || {}) : null;

const hasDog = !!(data && String(data.name || "").trim().length > 0);
const dogId = hasDog ? String(uid) : null;
const dogName = hasDog ? String(data.name || "").trim() : "";  

// Stato globale (runtime)  
window.PLUTOO_HAS_DOG = hasDog;  
window.PLUTOO_DOG_ID = dogId;  
window.PLUTOO_DOG_NAME = dogName;  

// ✅ VETRINA: se non hai DOG, app in sola lettura (blocca interazioni)  
window.PLUTOO_READONLY = !hasDog;  

// UI CTA aggiornata (mai sparire)  
if (typeof window.refreshCreateDogCTA === "function") window.refreshCreateDogCTA();  

// Cache (non source of truth)  
try {  
  localStorage.setItem("plutoo_has_dog", hasDog ? "1" : "0");  
  if (dogId) localStorage.setItem("plutoo_dog_id", dogId);  
  else localStorage.removeItem("plutoo_dog_id");  
  localStorage.setItem("plutoo_readonly", window.PLUTOO_READONLY ? "1" : "0");  
  if (dogName) localStorage.setItem("plutoo_dog_name", dogName);  
  else localStorage.removeItem("plutoo_dog_name");  
} catch (_) {}

} catch (err) {
// (FIX) fallback safe: NON forzo "DOG assente" e NON tocco cache/stato.
// Se auth/db non sono pronti al refresh, mantengo lo stato/cached e aggiorno solo UI.
if (typeof window.refreshCreateDogCTA === "function") window.refreshCreateDogCTA();
}
};

// Firebase handles
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ✅ Espongo handle Firebase in globale (serve a funzioni fuori scope: follow/like ecc.)
window.auth = auth;
window.db = db;
window.storage = storage;

// ✅ run subito al load (ma SOLO quando la funzione esiste davvero)
(function runPresenceWhenReady(){
  try {
    if (typeof window.plutooDogPresenceCheck === "function") {
      window.plutooDogPresenceCheck();
      return;
    }
  } catch (_) {}
  setTimeout(runPresenceWhenReady, 200);
})();

// ✅ Persistenza Auth su device (no reset dopo refresh)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((err) => {
  console.error("Auth persistence error:", err);
});

 auth.onAuthStateChanged(async (user) => {
  const runPresenceAfterAuth = () => {
  try {
  const enterBtn = document.getElementById("btnEnter");
  const logged = !!user;

  if (enterBtn) {
    if (logged) {
      enterBtn.disabled = false;
      enterBtn.classList.remove("disabled");
      enterBtn.classList.remove("enter-glow");
      void enterBtn.offsetWidth;
      enterBtn.classList.add("enter-glow");
    } else {
      enterBtn.disabled = true;
      enterBtn.classList.add("disabled");
      enterBtn.classList.remove("enter-glow");
    }
  }
} catch (_) {}

  try {
    if (typeof window.plutooDogPresenceCheck === "function") {
      window.plutooDogPresenceCheck();
    }
  } catch (_) {}
};

  try {
    const linkLogin = document.getElementById("linkLogin");
    const linkRegister = document.getElementById("linkRegister");

    if (!user) {
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

      runPresenceAfterAuth();
      return;
    }

    window.PLUTOO_UID = user.uid;

    if (linkLogin) {
      linkLogin.removeAttribute("data-i18n");
      linkLogin.textContent = "Logout";
      linkLogin.onclick = (e) => {
        e.preventDefault();
        window.openAuth("login");
      };
    }

    if (linkRegister) {
      linkRegister.style.display = "none";
    }

    try {
      if (db && window.PLUTOO_UID) {
        const uid = String(window.PLUTOO_UID);
        const ref = db.collection("users").doc(uid);
        const snap = await ref.get();

        const base = {
          email: (user && user.email) ? String(user.email) : "",
          userAgent: (navigator && navigator.userAgent) ? String(navigator.userAgent) : "",
          lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!snap.exists) {
          base.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }

        await ref.set(base, { merge: true });
      }
    } catch (e) {
      console.error("users/{uid} upsert error:", e);
    }

    runPresenceAfterAuth();

    if (!window.__booted) {
      window.__booted = true;
      if (typeof init === "function") init();
    }

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

  // lingua
  lang: localStorage.getItem("lang") || "it",

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
  followersByDog: JSON.parse(localStorage.getItem("followersByDog") || "{}"),
  followingByDog: JSON.parse(localStorage.getItem("followingByDog") || "{}"),
  ownerSocialByDog: JSON.parse(localStorage.getItem("ownerSocialByDog") || "{}"),

  // Like foto profilo
  photoLikesByDog: JSON.parse(localStorage.getItem("photoLikesByDog") || "{}"),

  // Like stories (per media id)
  storyLikesByMedia: JSON.parse(localStorage.getItem("storyLikesByMedia") || "{}"),
};

// ✅ FIX DEFINITIVO: una sola sorgente di verità per la lingua e per tutte le funzioni che usano window.state
  window.state = state;

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
    canUploadStory() { 
  return !!state.plus; 
    },
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

  // ✅ rende disponibile sempre la lingua anche alle funzioni che leggono window.state.lang
  try { window.state = state; } catch (_) {}

  applyTranslations();

  // ✅ riallinea subito CTA lingua/testo
  try { if (typeof window.refreshCreateDogCTA === "function") window.refreshCreateDogCTA(); } catch (_) {}

  if(state.entered) renderNearby();
});

$("langEN")?.addEventListener("click", ()=>{
  state.lang="en";
  localStorage.setItem("lang","en");

  // ✅ rende disponibile sempre la lingua anche alle funzioni che leggono window.state.lang
  try { window.state = state; } catch (_) {}

  applyTranslations();

  // ✅ riallinea subito CTA lingua/testo
  try { if (typeof window.refreshCreateDogCTA === "function") window.refreshCreateDogCTA(); } catch (_) {}

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

  const viewToRestore = localStorage.getItem("currentView") || state.currentView || "nearby";

  if (viewToRestore === "profile") {
    setActiveView("profile");

    const savedId = localStorage.getItem("currentProfileDogId");

    if (savedId) {

      // 🔥 CREATE MODE: se ero in "__create__", riapro create
      if (String(savedId) === "__create__" && typeof window.openProfilePage === "function") {

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

      } else {

        const dog = DOGS.find(d => d.id == savedId);

        if (dog && window.openProfilePage) {

          window.openProfilePage(dog);

        } else {

          // ✅ se NON è un DOG demo, provo cache locale e poi Firestore
          let myDog = null;

          // 1) prova state/local
          try {
            const dogsLocal = (window.state && Array.isArray(window.state.dogs)) ? window.state.dogs : [];
            myDog = dogsLocal.find(x => x && String(x.id) === String(savedId)) || null;
          } catch (_) {}

          // 2) fallback localStorage "dogs"
          if (!myDog) {
            try {
              const dogsLS = JSON.parse(localStorage.getItem("dogs") || "[]");
              myDog = (Array.isArray(dogsLS) ? dogsLS : []).find(x => x && String(x.id) === String(savedId)) || null;
            } catch (_) { myDog = null; }
          }

          // 3) se ho già dati → apro profilo
          if (myDog && window.openProfilePage) {

            window.openProfilePage(myDog);

          } else if (window.db) {

            // 4) Firestore (no await)
            try {
              window.db.collection("dogs").doc(String(savedId)).get()
                .then((doc) => {
                  if (doc && doc.exists && window.openProfilePage) {
                    const data = doc.data() || {};
                    window.openProfilePage({
                      id: doc.id,
                      name: (data.name || ""),
                      breed: (data.breed || ""),
                      age: (data.age || ""),
                      sex: (data.sex || ""),
                      bio: (data.bio || ""),
                      km: (data.km || 0),
                      img: (data.img || data.photoUrl || "./plutoo-icon-192.png"),
                      verified: !!data.verified
                    });
                  } else {
                    setActiveView("nearby");
                  }
                })
                .catch(() => {
                  setActiveView("nearby");
                });
            } catch (_) {
              setActiveView("nearby");
            }

          } else {
            setActiveView("nearby");
          }
        }
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
    // ✅ GUARD: se arriva una view sconosciuta (es. "notifications"), non lasciare schermo nero
    try {
      const allowed = { nearby:1, love:1, play:1, profile:1, messages:1 };
      if (!allowed[String(name || "")]) name = "nearby";
    } catch (_) {
      name = "nearby";
    }

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
  loading="eager"
  fetchpriority="high"
  decoding="sync"
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
    const count = liked ? 1 : 0; // 0 se non likato, 1 se likato

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

    // ✅ FIRESTORE (PRODUCTION): salva like/unlike (robusto, non silenzioso)
    try {
      const uid = window.PLUTOO_UID;
      const _db = (window.db || (typeof db !== "undefined" ? db : null));
      if (!uid || !_db) return;

      const hasFirebase =
        (typeof firebase !== "undefined" && firebase && firebase.firestore && firebase.firestore.FieldValue);

      const ts =
        (hasFirebase && typeof firebase.firestore.FieldValue.serverTimestamp === "function")
          ? firebase.firestore.FieldValue.serverTimestamp()
          : new Date();

      const ref = _db
        .collection("dogs")
        .doc(String(dogId))
        .collection("photoLikes")
        .doc(String(uid));

      if (wasLiked) {
        ref.delete().catch((e) => console.error("photoLike delete error:", e));
      } else {
        ref.set(
          {
            uid: String(uid),
            dogId: String(dogId),
            createdAt: ts
          },
          { merge: true }
        ).catch((e) => console.error("photoLike set error:", e));
      }
    } catch (e) {
      console.error("photoLike write fatal error:", e);
    }
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

    // ✅ FIRESTORE (PRODUCTION): salva like/unlike (robusto, non silenzioso)
    try {
      const uid = window.PLUTOO_UID;
      const _db = (window.db || (typeof db !== "undefined" ? db : null));
      if (!uid || !_db) return;

      const hasFirebase =
        (typeof firebase !== "undefined" && firebase && firebase.firestore && firebase.firestore.FieldValue);

      const ts =
        (hasFirebase && typeof firebase.firestore.FieldValue.serverTimestamp === "function")
          ? firebase.firestore.FieldValue.serverTimestamp()
          : new Date();

      const ref = _db
        .collection("stories")
        .doc(String(mediaId))
        .collection("likes")
        .doc(String(uid));

      if (wasLiked) {
        ref.delete().catch((e) => console.error("storyLike delete error:", e));
      } else {
        ref.set(
          {
            uid: String(uid),
            mediaId: String(mediaId),
            createdAt: ts
          },
          { merge: true }
        ).catch((e) => console.error("storyLike set error:", e));
      }
    } catch (e) {
      console.error("storyLike write fatal error:", e);
    }
  }

  // ========== Profilo DOG (con Stories + Social + Follow + Like foto) ============
window.openProfilePage = (d) => {

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

  history.pushState({ view: "profile", dogId: d.id }, "", "");
  profilePage.classList.remove("hidden");

  const selfieUnlocked = isSelfieUnlocked(d.id);
  if (!state.selfieUntilByDog || typeof state.selfieUntilByDog !== "object") state.selfieUntilByDog = {};
  const ownerDocs = state.ownerDocsUploaded[d.id] || {};
  const dogDocs = state.dogDocsUploaded[d.id] || {};

  const selfieKey = `selfieImage_${d.id}`;
  const selfieStored = localStorage.getItem(selfieKey);
  const selfieSrc = selfieStored || "./plutoo-icon-192.png";

  const dogStories =
    (window.StoriesState && Array.isArray(window.StoriesState.stories))
      ? window.StoriesState.stories.find(s => s.userId === d.id)
      : null;

  const storiesHTML = dogStories
    ? `
      <div class="pp-stories-section">
        <div class="pp-stories-header">
          <h4 class="section-title" style="margin:0">${state.lang === "it" ? "Stories" : "Stories"}</h4>
          <button id="uploadDogStory" class="btn accent small">📸 ${state.lang === "it" ? "Carica Story" : "Upload Story"}</button>
        </div>
        <div class="pp-stories-grid" id="dogStoriesGrid">
          ${dogStories.media.map((m, idx) => `
  <div class="pp-story-item" data-story-index="${idx}">
    <img src="${m.url}" alt="Story" onerror="this.onerror=null;this.src='./plutoo-icon-192.png';" />
    <span class="pp-story-time">${getTimeAgo(m.timestamp)}</span>
  </div>
`).join("")}
        </div>
      </div>
    `
    : `
      <div class="pp-stories-section">
        <div class="pp-stories-header">
          <h4 class="section-title" style="margin:0">${state.lang === "it" ? "Stories" : "Stories"}</h4>
          <button id="uploadDogStory" class="btn accent small">📸 ${state.lang === "it" ? "Carica Story" : "Upload Story"}</button>
        </div>
        <p style="color:var(--muted);font-size:.9rem;text-align:center;padding:1rem 0">${state.lang === "it" ? "Nessuna story disponibile" : "No stories available"}</p>
      </div>
    `;

  const isCreate = (d && d.isCreate === true) || (d && d.id === "__create__");
  const heroImg = isCreate ? "" : (d.img || "./plutoo-icon-192.png");

 profileContent.innerHTML = `

  <div class="pp-hero">
    ${
      isCreate
        ? `
        <img
          id="createDogPhotoPreview"
          alt=""
          style="width:100%;height:100%;object-fit:cover;object-position:center;background:#0b0b0f;display:none;cursor:pointer;"
        />

        <div id="createDogPhotoEmpty" style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:1.2rem">
          <div style="font-weight:900;font-size:1.05rem;margin-bottom:.35rem">
            ${state.lang === "it" ? "Carica la foto del tuo DOG" : "Upload your DOG photo"}
          </div>

          <button id="btnPickCreateDogPhoto" type="button" class="btn accent" style="width:100%;justify-content:center">
            ${state.lang === "it" ? "📸 Carica foto profilo" : "📸 Upload profile photo"}
          </button>

          <button id="btnRemoveCreateDogPhoto" type="button" class="btn ghost" style="width:100%;justify-content:center;margin-top:.6rem;display:none">
            🗑️ ${state.lang === "it" ? "Rimuovi foto profilo" : "Remove profile photo"}
          </button>

          <input type="file" id="createDogPhotoInput" accept="image/*" style="display:none" />

          <div style="font-size:.9rem;opacity:.7;margin-top:.35rem">
            ${state.lang === "it" ? "Solo foto DOG. No persone." : "Only dog photos. No people."}
          </div>

          <div id="createDogPhotoFeedback" style="display:none;margin-top:.35rem;font-size:.9rem;color:var(--gold,#CDA434);font-weight:800;">
            ${state.lang === "it" ? "Foto caricata ✅" : "Photo uploaded ✅"}
          </div>
        </div>
        `
        : `
        <img src="${heroImg}" alt="${d.name}" loading="eager" fetchpriority="high" decoding="sync" onerror="this.onerror=null;this.src='./plutoo-icon-192.png';" style="width:100%;height:100%;object-fit:cover;object-position:center;display:block;cursor:pointer;">
        `
    }
  </div>
  
  <div style="display:flex;align-items:center;justify-content:space-between;gap:.6rem;margin-top:.8rem">
    <div style="font-weight:900;font-size:1.15rem;line-height:1.2">
      ${
        isCreate
          ? (state.lang === "it" ? "Nuovo profilo" : "New profile")
          : `${d.name} ${d.verified ? "✅" : ""}`
      }
    </div>${
  isCreate
    ? ``
    : `
      <span class="pp-follow-stats">
        <button type="button" id="followersCount" class="pp-follow-count">0 follower</button>
        <span class="pp-follow-dot">·</span>
        <button type="button" id="followingCount" class="pp-follow-count">0 seguiti</button>
      </span>
    `
}

  </div>${ isCreate ? ` <div class="pp-badges pp-create-inline" style="margin-top:.75rem"> <span class="badge create-req" data-req="1" data-label="${state.lang === "it" ? "Nome DOG" : "DOG name"}" style="padding:.45rem .55rem;flex:1;min-width:42%"> <input id="createDogName" type="text" value="" placeholder="${state.lang === "it" ? "Nome DOG *" : "DOG name *"}" style="background:transparent;border:0;outline:none;color:inherit;width:100%"> </span>

<span class="badge create-req" data-req="1" data-label="${state.lang === "it" ? "Razza" : "Breed"}" style="padding:.45rem .55rem;flex:1;min-width:42%">
        <input id="createDogBreed" type="text" value="" placeholder="${state.lang === "it" ? "Razza *" : "Breed *"}" style="background:transparent;border:0;outline:none;color:inherit;width:100%">
      </span>

      <span class="badge create-req" data-req="1" data-label="${state.lang === "it" ? "Età" : "Age"}" style="padding:.45rem .55rem;flex:1;min-width:42%">
        <input id="createDogAge" type="number" min="0" step="1" value="" placeholder="${state.lang === "it" ? "Età *" : "Age *"}" style="background:transparent;border:0;outline:none;color:inherit;width:100%">
      </span>

      <span class="badge create-req" data-req="1" data-label="${state.lang === "it" ? "Sesso" : "Sex"}" style="padding:.45rem .55rem;flex:1;min-width:42%">
        <select id="createDogSex" style="background:transparent;border:0;outline:none;color:inherit;width:100%">
          <option value="">${state.lang === "it" ? "Sesso *" : "Sex *"}</option>
          <option value="M">${state.lang === "it" ? "Maschio" : "Male"}</option>
          <option value="F">${state.lang === "it" ? "Femmina" : "Female"}</option>
        </select>
      </span>
    </div>

    <div id="createDogErrors" class="soft"
      style="display:none;margin-top:.7rem;padding:.7rem .85rem;border:1px solid rgba(255,80,80,.45);border-radius:14px;color:#ffb3b3;background:rgba(255,0,0,.06)">
    </div>

    <textarea
      id="createDogBio"
      rows="3"
      placeholder="${state.lang === "it" ? "Bio (opzionale)" : "Bio (optional)"}"
      style="width:100%;margin-top:.75rem;background:transparent;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:.7rem;color:inherit">
    </textarea>

    <div style="margin-top:.85rem;text-align:center">
      <button id="btnSaveDogDraft" class="btn primary" style="min-width:72%">
        ${state.lang === "it" ? "Salva profilo" : "Save profile"}
      </button>
    </div>
  `
  : `
    <div class="pp-badges" style="margin-top:.75rem">
      <span class="badge">${d.breed}</span>
      <span class="badge">${d.age} ${t("years")}</span>
      <span class="badge">${fmtKm(d.km)}</span>
      <span class="badge">${d.sex === "M" ? (state.lang === "it" ? "Maschio" : "Male") : (state.lang === "it" ? "Femmina" : "Female")}</span>
    </div>

    ${d.bio || ""}

    ${""}

    <h3 class="section-title">${state.lang === "it" ? "Galleria" : "Gallery"}</h3>
    <div class="gallery" id="dogGallery"></div>

    <h3 class="section-title">Selfie</h3>
    <div class="selfie ${selfieUnlocked ? "unlocked" : ""}">
      <img class="img" src="${selfieSrc || "./plutoo-icon-192.png"}" alt="Selfie" style="cursor:pointer;">
      <input type="file" id="selfieFileInput" accept="image/*" style="display:none" />
      <div class="over">
        <button id="unlockSelfie" class="btn pill">${state.lang === "it" ? "Sblocca selfie" : "Unlock selfie"}</button>
        <button id="uploadSelfie" class="btn pill ghost">${state.lang === "it" ? "Carica selfie" : "Upload selfie"}</button>
      </div>
    </div>

    <h3 class="section-title">${state.lang === "it" ? "Documenti" : "Documents"}</h3>

    <div class="pp-docs-section">
      <h4 class="section-title" style="margin-top:0;font-size:1rem">${state.lang === "it" ? "Documenti Proprietario DOG" : "DOG Owner Documents"}</h4>
      <p style="font-size:.88rem;color:var(--muted);margin:.3rem 0 .6rem">${state.lang === "it" ? "Obbligatorio per ottenere il badge verificato ✅" : "Required to get verified badge ✅"}</p>
      <div class="pp-docs-grid">
        <div class="doc-item" data-doc="owner-identity" data-type="owner">
          <div class="doc-icon">🪪</div>
          <div class="doc-label">${state.lang === "it" ? "Carta d'identità" : "Identity Card"}</div>
          <div class="doc-status ${ownerDocs.identity ? "uploaded" : "pending"}">${ownerDocs.identity ? (state.lang === "it" ? "✓ Caricato" : "✓ Uploaded") : (state.lang === "it" ? "Da caricare" : "Upload")}</div>
        </div>
      </div>
    </div>

    <div class="pp-docs-section" style="margin-top:1.2rem">
      <h4 class="section-title" style="margin-top:0;font-size:1rem">${state.lang === "it" ? "Documenti DOG" : "DOG Documents"}</h4>
      <p style="font-size:.88rem;color:var(--muted);margin:.3rem 0 .6rem">${state.lang === "it" ? "Facoltativi (vaccini, pedigree, microchip)" : "Optional (vaccines, pedigree, microchip)"}</p>
      <div class="pp-docs-grid">
        <div class="doc-item" data-doc="dog-vaccines" data-type="dog">
          <div class="doc-icon">💉</div>
          <div class="doc-label">${state.lang === "it" ? "Vaccini" : "Vaccines"}</div>
          <div class="doc-status ${dogDocs.vaccines ? "uploaded" : "pending"}">${dogDocs.vaccines ? (state.lang === "it" ? "✓ Caricato" : "✓ Uploaded") : (state.lang === "it" ? "Da caricare" : "Upload")}</div>
        </div>

        <div class="doc-item" data-doc="dog-pedigree" data-type="dog">
          <div class="doc-icon">📜</div>
          <div class="doc-label">${state.lang === "it" ? "Pedigree" : "Pedigree"}</div>
          <div class="doc-status ${dogDocs.pedigree ? "uploaded" : "pending"}">${dogDocs.pedigree ? (state.lang === "it" ? "✓ Caricato" : "✓ Uploaded") : (state.lang === "it" ? "Da caricare" : "Upload")}</div>
        </div>

        <div class="doc-item" data-doc="dog-microchip" data-type="dog">
          <div class="doc-icon">🔬</div>
          <div class="doc-label">${state.lang === "it" ? "Microchip" : "Microchip"}</div>
          <div class="doc-status ${dogDocs.microchip ? "uploaded" : "pending"}">${dogDocs.microchip ? (state.lang === "it" ? "✓ Caricato" : "✓ Uploaded") : (state.lang === "it" ? "Da caricare" : "Upload")}</div>
        </div>
      </div>
    </div>

          ${generateSocialSection(d)}

          <div class="pp-actions">
  ${
    ((window.PLUTOO_HAS_DOG === true || localStorage.getItem("plutoo_has_dog") === "1") && (window.PLUTOO_DOG_ID || localStorage.getItem("plutoo_dog_id")) === d.id)
      ? `
        <button id="btnProfileSettings" class="btn accent" style="position:relative;z-index:50;">
          ${state.lang === "it" ? "Impostazioni profilo" : "Profile settings"}
        </button>
        <button id="btnEditSocial" class="btn outline" style="position:relative;z-index:50;">
          ${state.lang === "it" ? "Modifica social" : "Edit socials"}
        </button>
        <button id="btnDeleteAccount" class="btn ghost" style="position:relative;z-index:50;">
          ${state.lang === "it" ? "Elimina account" : "Delete account"}
        </button>
      `
      : `
        <button id="btnLikeDog" class="btn accent">💛 Like</button>
        <button id="btnOpenChat" class="btn primary">
          ${state.lang === "it" ? "Invia messaggio" : "Send message"}
        </button>
      `
  }
</div>
        `
    }
  `;

  // ✅ ATTACH LOGICA CARICAMENTO FOTO PROFILO (solo in modalità CREATE)
if (isCreate) {
  const btnPickCreateDogPhoto = document.getElementById("btnPickCreateDogPhoto");
  const btnRemoveCreateDogPhoto = document.getElementById("btnRemoveCreateDogPhoto");
  const createDogPhotoInput = document.getElementById("createDogPhotoInput");
  const createDogPhotoFeedback = document.getElementById("createDogPhotoFeedback");
  const previewImg = document.getElementById("createDogPhotoPreview");
  const emptyBox = document.getElementById("createDogPhotoEmpty");

  // ✅ FIX: metto il tasto Rimuovi dentro la hero (non dentro emptyBox che copre la foto)
  try {
    const heroEl = profileContent.querySelector(".pp-hero");
    if (heroEl && btnRemoveCreateDogPhoto) {
      heroEl.style.position = "relative";

      // ✅ sposta SEMPRE il bottone nella hero
      // (così non sparisce quando #createDogPhotoEmpty viene nascosto)
      heroEl.appendChild(btnRemoveCreateDogPhoto);

      btnRemoveCreateDogPhoto.style.position = "absolute";
      btnRemoveCreateDogPhoto.style.left = "12px";
      btnRemoveCreateDogPhoto.style.bottom = "12px";
      btnRemoveCreateDogPhoto.style.width = "auto";
      btnRemoveCreateDogPhoto.style.marginTop = "0";
      btnRemoveCreateDogPhoto.style.zIndex = "60";
    }
  } catch (_) {}

  // Stato iniziale (se esiste già una bozza con foto)
  const existing = state.createDogDraft && state.createDogDraft.photoDataUrl;
  if (existing && previewImg) {
    previewImg.src = existing;
    previewImg.style.display = "block";
    if (emptyBox) emptyBox.style.display = "none"; // ✅ FIX: non deve coprire la foto
    if (createDogPhotoFeedback) createDogPhotoFeedback.style.display = "block";
    if (btnRemoveCreateDogPhoto) btnRemoveCreateDogPhoto.style.display = "inline-flex";
  } else {
    if (previewImg) previewImg.style.display = "none";
    if (emptyBox) emptyBox.style.display = "flex";
    if (createDogPhotoFeedback) createDogPhotoFeedback.style.display = "none";
    if (btnRemoveCreateDogPhoto) btnRemoveCreateDogPhoto.style.display = "none";
  }

  // Click bottone -> picker
  if (btnPickCreateDogPhoto && createDogPhotoInput) {
    btnPickCreateDogPhoto.addEventListener("click", () => {
      createDogPhotoInput.click();
    });
  }

  // Click foto preview -> picker (sostituzione)
  if (previewImg && createDogPhotoInput) {
    previewImg.addEventListener("click", () => {
      createDogPhotoInput.click();
    });
  }

  // Change file
  if (createDogPhotoInput) {
    createDogPhotoInput.addEventListener("change", () => {
      const file = createDogPhotoInput.files && createDogPhotoInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;

        if (!state.createDogDraft) state.createDogDraft = {};
        state.createDogDraft.photoDataUrl = dataUrl;

        if (previewImg) {
          previewImg.src = dataUrl;
          previewImg.style.display = "block";
        }
        if (emptyBox) emptyBox.style.display = "none"; // ✅ FIX: non coprire la foto
        if (createDogPhotoFeedback) createDogPhotoFeedback.style.display = "block";
        if (btnRemoveCreateDogPhoto) btnRemoveCreateDogPhoto.style.display = "inline-flex";
      };

      reader.readAsDataURL(file);
    });
  }

  // Remove foto
  if (btnRemoveCreateDogPhoto) {
    btnRemoveCreateDogPhoto.addEventListener("click", () => {
      if (!state.createDogDraft) state.createDogDraft = {};

      // invece di mettere stringa vuota: pulisco davvero
      if ("photoDataUrl" in state.createDogDraft) delete state.createDogDraft.photoDataUrl;

      if (previewImg) {
        previewImg.removeAttribute("src");
        previewImg.style.display = "none";
      }

      // torna al box
      if (emptyBox) emptyBox.style.display = "flex";

      if (createDogPhotoFeedback) createDogPhotoFeedback.style.display = "none";
      btnRemoveCreateDogPhoto.style.display = "none";
      if (createDogPhotoInput) createDogPhotoInput.value = "";
    });
  }
}

// ✅ VIEWER IMMAGINI (sempre con chiusura)
(function () {
  function openPlutooImageViewer(src) {
    if (!src) return;

    // se esiste già, rimuovi
    const old = document.getElementById("plutooImageViewer");
    if (old && old.parentNode) old.parentNode.removeChild(old);

    const wrap = document.createElement("div");
    wrap.id = "plutooImageViewer";
    wrap.style.position = "fixed";
    wrap.style.left = "0";
    wrap.style.top = "0";
    wrap.style.right = "0";
    wrap.style.bottom = "0";
    wrap.style.background = "rgba(0,0,0,.82)";
    wrap.style.zIndex = "99999";
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.justifyContent = "center";
    wrap.style.padding = "18px";

    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.style.maxWidth = "100%";
    img.style.maxHeight = "100%";
    img.style.objectFit = "contain";
    img.style.borderRadius = "16px";
    img.style.background = "#0b0b0f";

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "✕";
    close.style.position = "fixed";
    close.style.top = "14px";
    close.style.left = "14px";
    close.style.zIndex = "100000";
    close.style.border = "0";
    close.style.borderRadius = "999px";
    close.style.padding = "10px 14px";
    close.style.fontSize = "18px";
    close.style.fontWeight = "900";
    close.style.background = "rgba(20,20,20,.8)";
    close.style.color = "#fff";

    close.addEventListener("click", () => {
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
    });

    wrap.addEventListener("click", (e) => {
      if (e.target === wrap) {
        if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      }
    });

    wrap.appendChild(img);
    document.body.appendChild(wrap);
    document.body.appendChild(close);

    // chiudendo rimuovo anche il bottone
    wrap.addEventListener("remove", () => {
      if (close && close.parentNode) close.parentNode.removeChild(close);
    });
    close.addEventListener("click", () => {
      if (close && close.parentNode) close.parentNode.removeChild(close);
    });
  }

   // CREATE: preview cliccabile apre viewer (oltre al picker già esistente)
  if (isCreate) {
    const p = document.getElementById("createDogPhotoPreview");
    if (p) {
      p.addEventListener("click", () => {
        if (p.getAttribute("src")) openPlutooImageViewer(p.getAttribute("src"));
      });
    }
  } else {
    
    // PROFILO: hero img / gallery / selfie cliccabili
const heroImgEl = profileContent.querySelector(".pp-hero img");
if (heroImgEl) {
heroImgEl.addEventListener("click", () => {
openPlutooImageViewer(heroImgEl.getAttribute("src"));
});
}

const selfieEl = profileContent.querySelector(".selfie .img");  
if (selfieEl) {  
  selfieEl.addEventListener("click", () => {  
    openPlutooImageViewer(selfieEl.getAttribute("src"));  
  });  
}  

// Elimina account (locale)  
const btnDel = document.getElementById("btnDeleteAccount");  
if (btnDel) {  
  btnDel.addEventListener("click", () => {  
    const ok = confirm(state.lang === "it"  
      ? "Eliminare l'account? (Cancella profilo e dati da Firebase + TUTTI i dati Plutoo su questo dispositivo)"  
      : "Delete account? (Deletes profile/data from Firebase + ALL Plutoo data on this device)");  
    if (!ok) return;  

    try {  
      // ✅ 1) Cancellazione Firebase (NO await: solo Promise chain)  
      const uid = window.PLUTOO_UID || (window.auth && window.auth.currentUser ? window.auth.currentUser.uid : "");  
      const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;  
      const db = window.db || null;  

      const deleteFromFirebase = () => {  
        // Se non ho auth/db, salto (non blocco mai l'app)  
        if (!uid || !user || !db) return Promise.resolve();  

        // a) elimina dogs dell'ownerUid  
        const delDogs = db.collection("dogs").where("ownerUid", "==", uid).get()  
          .then((snap) => {  
            const jobs = [];  
            snap.forEach((doc) => {  
              jobs.push(doc.ref.delete().catch(() => {}));  
            });  
            return Promise.all(jobs);  
          })  
          .catch(() => {});  

        // b) elimina users/{uid}  
        const delUserDoc = db.collection("users").doc(uid).delete().catch(() => {});  

        // c) elimina Auth user (può richiedere recent login)  
        const delAuth = user.delete();  

        return Promise.all([delDogs, delUserDoc, delAuth]).then(() => {}).catch((err) => { throw err; });  
      };  

      deleteFromFirebase()  
        .then(() => {  
          // ✅ wipe mirato: rimuovo tutte le chiavi Plutoo + per-dog (gallery_, selfieImage_, docs, stories, ecc.)  
          const keys = [];  
          for (let i = 0; i < localStorage.length; i++) {  
            const k = localStorage.key(i);  
            if (k) keys.push(k);  
          }  

          keys.forEach((k) => {  
            // tutto ciò che è chiaramente Plutoo / per-dog  
            if (  
              k === "dogs" ||  
              k === "matches" ||  
              k === "matchCount" ||  
              k === "currentProfileDogId" ||  
              k === "ownerDocsUploaded" ||  
              k === "dogDocsUploaded" ||  
              k === "socialRewardViewed" ||  
              k === "selfieUntilByDog" ||  
              k === "plutoo_plus" ||  
              k === "plutoo_has_dog" ||  
              k === "plutoo_dog_id" ||  
              k === "plutoo_readonly" ||  
              k.startsWith("plutoo_") ||  
              k.startsWith("gallery_") ||  
              k.startsWith("selfieImage_") ||  
              k.startsWith("galleryBound_") ||  
              k.startsWith("ownerSocialByDog_") ||  
              k.startsWith("story_") ||  
              k.startsWith("stories_") ||  
              k.startsWith("StoriesState_") ||  
              k.startsWith("notifications_") ||  
              k.startsWith("follow_") ||  
              k.startsWith("photo_")  
            ) {  
              localStorage.removeItem(k);  
            }  
          });  

          // ✅ RESET runtime (QUESTO È IL FIX)  
          try {  
            window.PLUTOO_HAS_DOG = false;  
            window.PLUTOO_READONLY = false;  
            window.PLUTOO_DOG_ID = "";  
            window.CURRENT_USER_DOG_ID = "";  
            try { CURRENT_USER_DOG_ID = ""; } catch (_) {}  
          } catch (_) {}  

          // ✅ reset state in RAM (evita UI incoerente prima del reload)  
          try {  
            if (state) {  
              state.dogs = [];  
              state.matches = {};  
              state.matchCount = 0;  
              state.ownerDocsUploaded = {};  
              state.dogDocsUploaded = {};  
              state.selfieUntilByDog = {};  
              state.socialRewardViewed = {};  
              state.createDogDraft = {};  
              state.currentDogProfile = null;  
            }  
          } catch (_) {}  

          // (opzionale ma pulito) session storage  
          try { sessionStorage.clear(); } catch (_) {}  

          // ✅ signOut (se possibile) — poi reload  
          try {  
            if (window.auth) {  
              return window.auth.signOut().catch(() => {});  
            }  
          } catch (_) {}  
          return Promise.resolve();  
        })  
        .then(() => {  
          // ✅ forza ritorno HOME al reload (anche nel SUCCESS, non solo nel catch)
          try {
            localStorage.removeItem("entered");
            localStorage.removeItem("currentView");
            localStorage.setItem("entered", "0");
            localStorage.setItem("currentView", "home");
          } catch (_) {}

          location.reload();  
        })  
        .catch((err) => {  
            
      // ✅ non blocco mai l'app

const code = (err && err.code) ? err.code : "";
if (code === "auth/requires-recent-login") {
alert("Per eliminare l’account serve un login recente. Ti disconnetto: rientra e riprova.");

// ✅ forza ritorno HOME al reload
try {
localStorage.removeItem("entered");
localStorage.removeItem("currentView");
localStorage.setItem("entered", "0");
localStorage.setItem("currentView", "home");
} catch (_) {}

try { if (window.auth) window.auth.signOut().catch(() => {}); } catch (_) {}
location.reload();
return;
}

alert("Errore eliminazione account. Ti riporto alla Home senza bloccare l'app.");

// ✅ forza ritorno HOME al reload
try {
localStorage.removeItem("entered");
localStorage.removeItem("currentView");
localStorage.setItem("entered", "0");
localStorage.setItem("currentView", "home");
} catch (_) {}

try { if (window.auth) window.auth.signOut().catch(() => {}); } catch (_) {}
location.reload();
});

} catch (_) {}  

  });  
}

}
})();

      const btnSaveDogDraft0 = document.getElementById("btnSaveDogDraft");
if (btnSaveDogDraft0 && isCreate) {
  const btnSaveDogDraft = btnSaveDogDraft0.cloneNode(true);
  btnSaveDogDraft0.parentNode.replaceChild(btnSaveDogDraft, btnSaveDogDraft0);

  btnSaveDogDraft.addEventListener("click", async () => {
    const nameInput = document.getElementById("createDogName");
    const breedInput = document.getElementById("createDogBreed");
    const ageInput = document.getElementById("createDogAge");
    const sexSelect = document.getElementById("createDogSex");
    const bioInput = document.getElementById("createDogBio");
    const errorDiv = document.getElementById("createDogErrors");

    const name = nameInput ? nameInput.value.trim() : "";
    const breed = breedInput ? breedInput.value.trim() : "";
    const age = ageInput ? ageInput.value : "";
    const sex = sexSelect ? sexSelect.value : "";
    const bio = bioInput ? bioInput.value.trim() : "";

    const errors = [];
    if (!name) errors.push(state.lang === "it" ? "Nome DOG mancante" : "DOG name missing");
    if (!breed) errors.push(state.lang === "it" ? "Razza mancante" : "Breed missing");
    if (!age) errors.push(state.lang === "it" ? "Età mancante" : "Age missing");
    if (!sex) errors.push(state.lang === "it" ? "Sesso mancante" : "Sex missing");
    if (!state.createDogDraft || !state.createDogDraft.photoDataUrl) {
      errors.push(state.lang === "it" ? "Foto profilo mancante" : "Profile photo missing");
    }

    if (errors.length > 0) {
      if (errorDiv) {
        errorDiv.textContent = errors.join(", ");
        errorDiv.style.display = "block";
      }
      return;
    }

    // =========================
    // ✅ FIREBASE (PRODUCTION): Storage + Firestore (source of truth)
    // =========================
    const uid = (window.PLUTOO_UID) || (window.auth && window.auth.currentUser ? window.auth.currentUser.uid : "");
    if (!uid || !window.db || !window.storage) {
      if (errorDiv) {
        errorDiv.textContent = state.lang === "it"
          ? "❌ Login richiesto (Firebase non pronto)"
          : "❌ Login required (Firebase not ready)";
        errorDiv.style.display = "block";
      }
      return;
    }

    // helper: dataURL -> Blob
    const dataUrlToBlob = (dataUrl) => {
      const parts = String(dataUrl || "").split(",");
      const meta = parts[0] || "";
      const b64 = parts[1] || "";
      const mimeMatch = meta.match(/data:([^;]+);base64/i);
      const mime = (mimeMatch && mimeMatch[1]) ? mimeMatch[1] : "image/jpeg";
      const bin = atob(b64);
      const len = bin.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    };

    // id definitivo Firestore (1 utente = 1 DOG)
const dogRef = window.db.collection("dogs").doc(String(uid));
const newDogId = dogRef.id;

    // upload foto profilo su Storage
    let photoUrl = "";
    try {
      const blob = dataUrlToBlob(state.createDogDraft.photoDataUrl);
      const ext = (blob.type && blob.type.includes("png")) ? "png" : "jpg";
      const storageRef = window.storage.ref().child(`dogs/${uid}/${newDogId}/profile.${ext}`);

      // feedback inline "salvataggio..."
      if (errorDiv) {
        errorDiv.textContent = state.lang === "it" ? "Salvataggio in corso..." : "Saving...";
        errorDiv.style.display = "block";
        errorDiv.style.border = "1px solid rgba(205, 164, 52, 0.35)";
        errorDiv.style.background = "rgba(205, 164, 52, 0.10)";
        errorDiv.style.color = "#CDA434";
      }

      await storageRef.put(blob, { contentType: blob.type || "image/jpeg" });
      photoUrl = await storageRef.getDownloadURL();

      } catch (e) {
  try { console.error("Storage upload error:", e); } catch (_) {}

  const code = (e && e.code) ? String(e.code) : "";
  const msg  = (e && e.message) ? String(e.message) : "";

  if (errorDiv) {
    errorDiv.textContent = state.lang === "it"
      ? `❌ Errore upload foto (Storage) ${code ? "— " + code : ""}${msg ? " — " + msg : ""}`
      : `❌ Photo upload error (Storage) ${code ? "— " + code : ""}${msg ? " — " + msg : ""}`;
    errorDiv.style.display = "block";
  }
  return;
    }

    // write su Firestore (dogs/{dogId})
    try {
      const createdAt = (firebase && firebase.firestore && firebase.firestore.FieldValue && firebase.firestore.FieldValue.serverTimestamp)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date();

      await dogRef.set({
        ownerUid: uid,
        name: name,
        breed: breed,
        age: parseInt(age, 10),
        sex: sex,
        bio: bio || "",
        km: 0,
        verified: false,
        photoUrl: photoUrl,
        createdAt: createdAt,
        updatedAt: createdAt
      }, { merge: true });
    } catch (e) {
      if (errorDiv) {
        errorDiv.textContent = state.lang === "it"
          ? "❌ Errore salvataggio profilo (Firestore)"
          : "❌ Profile save error (Firestore)";
        errorDiv.style.display = "block";
      }
      return;
    }

    const newDog = {
      id: newDogId,
      name: name,
      breed: breed,
      age: parseInt(age, 10),
      sex: sex,
      img: photoUrl,
      verified: false,
      bio: bio || "",
      km: 0
    };

    // cache locale (solo UI/velocità; source of truth = Firestore)
    if (!state.dogs) state.dogs = [];
    state.dogs.push(newDog);
    localStorage.setItem("dogs", JSON.stringify(state.dogs));

    state.createDogDraft = {};

    // =========================
    // ✅ FIX STATO: da ORA "hai un DOG" (runtime + cache)
    // =========================
    try {
      window.PLUTOO_HAS_DOG = true;
      window.PLUTOO_READONLY = false;
      window.PLUTOO_DOG_ID = newDogId;
      window.PLUTOO_DOG_NAME = name;

      // se nel codice esiste CURRENT_USER_DOG_ID, lo allinei qui
      window.CURRENT_USER_DOG_ID = newDogId;
      try { CURRENT_USER_DOG_ID = newDogId; } catch (_) {}

      // cache coerente
      localStorage.setItem("plutoo_has_dog", "1");
      localStorage.setItem("plutoo_dog_id", newDogId);
      localStorage.setItem("plutoo_readonly", "0");
      localStorage.setItem("plutoo_dog_name", name);

      // spegni classe readonly (se era stata attivata)
      document.body.classList.remove("plutoo-readonly");

      // aggiorna CTA Vicino a te → diventa "Il mio profilo"
      if (typeof window.refreshCreateDogCTA === "function") {
        window.refreshCreateDogCTA();
      }

      // segnala cambio stato (se qualcuno ascolta)
      try { window.dispatchEvent(new Event("plutoo:dog-changed")); } catch (_) {}
    } catch (_) {}

    // feedback inline
    if (errorDiv) {
      errorDiv.textContent = state.lang === "it" ? "✅ Profilo salvato" : "✅ Profile saved";
      errorDiv.style.display = "block";
      errorDiv.style.border = "1px solid rgba(60,200,120,.45)";
      errorDiv.style.background = "rgba(60,200,120,.08)";
      errorDiv.style.color = "#bff7d6";
    }

    // vai al profilo
    if (typeof openProfilePage === "function") {
      openProfilePage(newDog);
    } else if (typeof setActiveView === "function") {
      setActiveView("profile");
    }
  });
}

  // ✅ PROFILO DOG REALE — PUBLISH MODE (Firestore source of truth)
  // Questo blocco NON deve MAI bloccare chat/like/follow quando l'utente è loggato senza DOG.
  // In modalità "solo mail" restano cliccabili i profili demo: si blocca SOLO upload (gestito altrove).
  (function attachRealDogProfileControls() {
    try {
      // ✅ in create mode non aggancio nulla (evita roba inutile e rischi)
      if (isCreate) return;

      // Se non sono loggato, non faccio nulla
      if (!window.auth || !window.auth.currentUser) return;

      // Se non ho un DOG reale, NON inietto note e NON disabilito bottoni.
      if (!window.PLUTOO_HAS_DOG) return;

      // ==== GALLERIA PROFILO (max 5 foto, salvate in localStorage)
      (function () {
        if (!d || !profileContent) return;

        const galleryBlock = qs("#dogGallery", profileContent) || qs(".gallery", profileContent);
        if (!galleryBlock) return;

        // ✅ bind-once: se già agganciata per questo dogId, basta
        const bindKey = `galleryBound_${d.id}`;
        if (galleryBlock.dataset && galleryBlock.dataset[bindKey] === "1") return;
        if (galleryBlock.dataset) galleryBlock.dataset[bindKey] = "1";

        const maxPhotos = 5;
        const dogId = d.id;
        const storageKey = "gallery_" + dogId;

        let images = [];
        try {
          const raw = localStorage.getItem(storageKey);
          images = raw ? JSON.parse(raw) : [];
        } catch (e) {
          images = [];
        }
        if (!Array.isArray(images)) images = [];

        // input unico
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.multiple = true;
        input.style.display = "none";
        document.body.appendChild(input);

        // ===== UI: pannello "Pubblica" (creato via JS, non tocchiamo HTML)
        let pendingFiles = [];
        let publishBar = null;

        const ensurePublishBar = () => {
          if (publishBar && publishBar.parentNode) return;

          publishBar = document.createElement("div");
          publishBar.id = "plutooGalleryPublishBar";
          publishBar.style.margin = ".55rem 0 .15rem";
          publishBar.style.padding = ".65rem .75rem";
          publishBar.style.border = "1px solid rgba(205,164,52,.35)";
          publishBar.style.borderRadius = "14px";
          publishBar.style.background = "rgba(205,164,52,.08)";
          publishBar.style.display = "none";
          publishBar.style.gap = ".55rem";
          publishBar.style.alignItems = "center";
          publishBar.style.justifyContent = "space-between";

          publishBar.innerHTML = `
            <div style="font-weight:900;">
              ${state.lang === "it" ? "Foto pronte ✅" : "Photos ready ✅"}
              <span id="plutooGalleryPendingCount" style="opacity:.8;font-weight:800;"></span>
            </div>
            <div style="display:flex;gap:.5rem;">
              <button type="button" id="plutooGalleryPublishBtn" class="btn accent small">
                ${state.lang === "it" ? "Pubblica" : "Publish"}
              </button>
              <button type="button" id="plutooGalleryCancelBtn" class="btn ghost small">
                ${state.lang === "it" ? "Annulla" : "Cancel"}
              </button>
            </div>
          `;

          // metto la bar prima della galleria
          galleryBlock.parentNode.insertBefore(publishBar, galleryBlock);

          const pubBtn = document.getElementById("plutooGalleryPublishBtn");
          const cancelBtn = document.getElementById("plutooGalleryCancelBtn");

          if (cancelBtn) {
            cancelBtn.onclick = () => {
              pendingFiles = [];
              const c = document.getElementById("plutooGalleryPendingCount");
              if (c) c.textContent = "";
              publishBar.style.display = "none";
            };
          }

          if (pubBtn) {
            pubBtn.onclick = () => {
              if (!pendingFiles.length) return;

              const remaining = maxPhotos - images.length;
              const toAdd = pendingFiles.slice(0, remaining);
              if (!toAdd.length) {
                pendingFiles = [];
                const c = document.getElementById("plutooGalleryPendingCount");
                if (c) c.textContent = "";
                publishBar.style.display = "none";
                return;
              }

              let pending = toAdd.length;

              toAdd.forEach(file => {
                const reader = new FileReader();
                reader.onload = e => {
                  images.push(e.target.result);
                  pending--;
                  if (pending === 0) {
                    try { localStorage.setItem(storageKey, JSON.stringify(images)); } catch (err) {}
                    pendingFiles = [];
                    const c = document.getElementById("plutooGalleryPendingCount");
                    if (c) c.textContent = "";
                    publishBar.style.display = "none";
                    renderGallery();
                  }
                };
                reader.readAsDataURL(file);
              });
            };
          }
        };

        const showPublishBar = () => {
          ensurePublishBar();
          const c = document.getElementById("plutooGalleryPendingCount");
          if (c) c.textContent = `(${pendingFiles.length}/${maxPhotos - images.length})`;
          publishBar.style.display = "flex";
        };

        // ===== Lightbox semplice (solo foto + X + tap fuori)
        const openLightbox = (src) => {
          if (!src) return;

          const old = document.querySelector(".lightbox");
          if (old && old.parentNode) old.parentNode.removeChild(old);

          const lb = document.createElement("div");
          lb.className = "lightbox";
          lb.innerHTML = `
            <button type="button" class="close" aria-label="Close">✕</button>
            <img class="lightbox-img" src="${src}" alt="">
          `;
          document.body.appendChild(lb);

          const closeBtn = qs(".close", lb);
          if (closeBtn) closeBtn.onclick = () => lb.remove();
          lb.addEventListener("click", (e) => { if (e.target === lb) lb.remove(); });
        };

        const renderGallery = () => {
          // pulisco tutto
          galleryBlock.innerHTML = "";

          // render immagini
          const limit = Math.min(images.length, maxPhotos);
          for (let i = 0; i < limit; i++) {
            const src = images[i];

            const ph = document.createElement("div");
            ph.className = "ph";
            ph.dataset.upload = "1";
            ph.style.position = "relative";

            const img = document.createElement("img");
            img.src = src;
            img.className = "pp-gallery-img";
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            img.style.objectPosition = "center";
            img.style.display = "block";
            img.style.cursor = "pointer";
            img.onerror = () => { img.src = "./plutoo-icon-192.png"; };

            // ✅ click apre lightbox (sempre)
            img.onclick = (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              openLightbox(img.getAttribute("src"));
            };

            // ✅ rimuovi (🗑️) per singola foto
            const del = document.createElement("button");
            del.type = "button";
            del.textContent = "🗑️";
            del.setAttribute("aria-label", "Remove photo");
            del.style.position = "absolute";
            del.style.right = "10px";
            del.style.bottom = "10px";
            del.style.zIndex = "5";
            del.style.border = "0";
            del.style.borderRadius = "999px";
            del.style.padding = "8px 10px";
            del.style.background = "rgba(0,0,0,.55)";
            del.style.color = "#fff";

            del.onclick = (ev) => {
              ev.preventDefault();
              ev.stopPropagation();

              images.splice(i, 1);
              try { localStorage.setItem(storageKey, JSON.stringify(images)); } catch (err) {}
              renderGallery();
            };

            ph.appendChild(img);
            ph.appendChild(del);
            galleryBlock.appendChild(ph);
          }

          // slot ADD (sempre ultimo)
          const addPh = document.createElement("div");
          addPh.className = "ph";

          const addBtn = document.createElement("button");
          addBtn.type = "button";
          addBtn.className = "add-photo";
          addBtn.textContent = "+ " + (state.lang === "it" ? "Aggiungi" : "Add");

          addBtn.disabled = images.length >= maxPhotos;

          // ✅ evita duplicazioni: onclick (sostituisce)
          addBtn.onclick = () => {
            if (images.length >= maxPhotos) return;
            input.value = "";
            input.click();
          };

          addPh.appendChild(addBtn);
          galleryBlock.appendChild(addPh);
        };

        input.onchange = () => {
          const files = Array.from(input.files || []);
          if (!files.length) return;

          const remaining = maxPhotos - images.length;
          const toQueue = files.slice(0, remaining);
          if (!toQueue.length) return;

          pendingFiles = toQueue;
          showPublishBar();
        };

        renderGallery();
      })();

      // ✅ safe: update follower UI
      if (typeof updateFollowerUI === "function") updateFollowerUI(d);

      const followBtn = $("followBtn");
      if (followBtn) {
        const refreshFollowBtn = () => {
          const myFollowing =
            (typeof CURRENT_USER_DOG_ID === "string" && CURRENT_USER_DOG_ID)
              ? getFollowing(CURRENT_USER_DOG_ID)
              : [];
          const isFollowing = myFollowing.includes(d.id);

          if (state.lang === "it") {
            followBtn.textContent = isFollowing ? "Seguito 🐕🐾" : "Segui 🐕🐾";
          } else {
            followBtn.textContent = isFollowing ? "Following 🐕🐾" : "Follow 🐕🐾";
          }
          followBtn.classList.toggle("is-following", isFollowing);
          followBtn.disabled = !(typeof CURRENT_USER_DOG_ID === "string" && CURRENT_USER_DOG_ID);
        };

        followBtn.onclick = () => {
          if (!(typeof CURRENT_USER_DOG_ID === "string" && CURRENT_USER_DOG_ID)) {
            console.error("FOLLOW blocked: CURRENT_USER_DOG_ID mancante");
            refreshFollowBtn();
            return;
          }

          const myFollowing = getFollowing(CURRENT_USER_DOG_ID);
          const isFollowing = myFollowing.includes(d.id);

          if (isFollowing) unfollowDog(d.id);
          else followDog(d.id);

          refreshFollowBtn();
        };

        refreshFollowBtn();
      }

      const followersCountEl = $("followersCount");
      const followingCountEl = $("followingCount");
      if (followersCountEl) followersCountEl.onclick = () => openFollowersList(d.id);
      if (followingCountEl) followingCountEl.onclick = () => openFollowingList(d.id);

      // ✅ FIX: nessun ReferenceError (se non esiste, è null e basta)
      const profileLikeBtn = $("profileLikeBtn");
      if (profileLikeBtn) {
        profileLikeBtn.onclick = () => togglePhotoLike(d.id);
        updatePhotoLikeUI(d.id);
      }

      if (dogStories) {
        qa(".pp-story-item", profileContent).forEach(item => {
          item.onclick = () => {
            const idx = parseInt(item.getAttribute("data-story-index"));
            openDogStoryViewer(d.id, idx);
          };
        });
      }

      const uploadDogStoryBtn = $("uploadDogStory");
      if (uploadDogStoryBtn) uploadDogStoryBtn.onclick = () => { openUploadModal(); };

      qa(".gallery img", profileContent).forEach(img => {
        // ✅ bind-once per img
        if (img.dataset && img.dataset.lbBound === "1") return;
        if (img.dataset) img.dataset.lbBound = "1";

        img.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();

          const src = img.getAttribute("src");
          if (!src) return;

          // evita overlay doppi
          const old = document.querySelector(".lightbox");
          if (old && old.parentNode) old.parentNode.removeChild(old);

          const lb = document.createElement("div");
          lb.className = "lightbox";
          lb.innerHTML = `
            <button type="button" class="close" aria-label="Close">✕</button>
            <img class="lightbox-img" src="${src}" alt="">
          `;
          document.body.appendChild(lb);

          const closeBtn = qs(".close", lb);
          if (closeBtn) closeBtn.onclick = () => lb.remove();
          lb.addEventListener("click", (e) => { if (e.target === lb) lb.remove(); });
        });
      });

      // ===============================
// ✅ OWNER-ONLY: Profile Settings + Edit Socials (BIND) — STABILE
// ===============================
(function bindOwnerOnlyProfileButtons() {
  try {
    if (!d || !d.id) return;

    const myDogId = String(window.PLUTOO_DOG_ID || localStorage.getItem("plutoo_dog_id") || "");
    const hasDog  = (window.PLUTOO_HAS_DOG === true || localStorage.getItem("plutoo_has_dog") === "1");
    const isOwnerViewing = hasDog && myDogId && String(d.id) === myDogId;
    if (!isOwnerViewing) return;

    if (!state || typeof state !== "object") return;
    if (!state.ownerSocialByDog || typeof state.ownerSocialByDog !== "object") state.ownerSocialByDog = {};

    const closeExisting = (id) => {
      const old = document.getElementById(id);
      if (old && old.parentNode) old.parentNode.removeChild(old);
    };

    const normalizeUrl = (u) => {
      const s = String(u || "").trim();
      if (!s) return "";
      if (/^https?:\/\//i.test(s)) return s;
      return "https://" + s.replace(/^\/+/, "");
    };

    // =========================
    // 1) IMPOSTAZIONI PROFILO (full screen stabile, no router)
    // =========================
    const btnSettings0 = document.getElementById("btnProfileSettings");
    if (btnSettings0) {
      const btnSettings = btnSettings0.cloneNode(true);
      btnSettings0.parentNode.replaceChild(btnSettings, btnSettings0);

      btnSettings.addEventListener("click", () => {
        closeExisting("plutooProfileSettingsView");

        const wrap = document.createElement("div");
        wrap.id = "plutooProfileSettingsView";
        wrap.style.position = "fixed";
        wrap.style.left = "0";
        wrap.style.top = "0";
        wrap.style.right = "0";
        wrap.style.bottom = "0";
        wrap.style.zIndex = "99999";
        wrap.style.background = "rgba(0,0,0,.86)";
        wrap.style.display = "flex";
        wrap.style.flexDirection = "column";

        const card = document.createElement("div");
        card.style.margin = "12px";
        card.style.borderRadius = "18px";
        card.style.border = "1px solid rgba(255,255,255,.10)";
        card.style.background = "#121218";
        card.style.padding = "14px";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.gap = "10px";
        card.style.flex = "1";
        card.style.overflow = "auto";

        const title = document.createElement("div");
        title.style.fontWeight = "900";
        title.style.fontSize = "1.05rem";
        title.textContent = (state.lang === "it") ? "Impostazioni profilo" : "Profile settings";

        const bioLabel = document.createElement("div");
        bioLabel.style.opacity = ".85";
        bioLabel.style.fontWeight = "800";
        bioLabel.textContent = (state.lang === "it") ? "Bio del DOG" : "DOG bio";

        const bio = document.createElement("textarea");
        bio.rows = 5;
        bio.value = String(d.bio || "");
        bio.placeholder = (state.lang === "it")
          ? "Scrivi una breve descrizione del tuo DOG…"
          : "Write a short description of your DOG…";
        bio.style.width = "100%";
        bio.style.background = "transparent";
        bio.style.border = "1px solid rgba(255,255,255,.12)";
        bio.style.borderRadius = "14px";
        bio.style.padding = "10px 12px";
        bio.style.color = "inherit";
        bio.style.resize = "vertical";
        bio.style.minHeight = "120px";

        const feedback = document.createElement("div");
        feedback.style.display = "none";
        feedback.style.padding = ".65rem .8rem";
        feedback.style.borderRadius = "14px";
        feedback.style.fontWeight = "900";

        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.gap = ".6rem";
        row.style.marginTop = "8px";

        const btnBack = document.createElement("button");
        btnBack.type = "button";
        btnBack.className = "btn ghost";
        btnBack.style.flex = "1";
        btnBack.textContent = (state.lang === "it") ? "← Indietro" : "← Back";

        const btnSave = document.createElement("button");
        btnSave.type = "button";
        btnSave.className = "btn accent";
        btnSave.style.flex = "1";
        btnSave.textContent = (state.lang === "it") ? "Salva" : "Save";

        btnBack.addEventListener("click", () => closeExisting("plutooProfileSettingsView"));
        wrap.addEventListener("click", (e) => { if (e.target === wrap) closeExisting("plutooProfileSettingsView"); });

        btnSave.addEventListener("click", async () => {
          const newBio = String(bio.value || "").trim();

          feedback.style.display = "block";
          feedback.style.border = "1px solid rgba(205,164,52,.35)";
          feedback.style.background = "rgba(205,164,52,.10)";
          feedback.style.color = "#CDA434";
          feedback.textContent = (state.lang === "it") ? "Salvataggio in corso..." : "Saving...";

          try {
            const db = window.db || null;

            // dogs/{uid} => docId = d.id (owner viewing)
            if (db) {
              const dogRef = db.collection("dogs").doc(String(d.id));
              const ts = (window.firebase && firebase.firestore && firebase.firestore.FieldValue && firebase.firestore.FieldValue.serverTimestamp)
                ? firebase.firestore.FieldValue.serverTimestamp()
                : new Date();
              await dogRef.set({ bio: newBio, updatedAt: ts }, { merge: true });
            }

            d.bio = newBio;

            try {
              if (Array.isArray(state.dogs)) {
                const idx = state.dogs.findIndex(x => String(x && x.id) === String(d.id));
                if (idx >= 0) {
                  state.dogs[idx].bio = newBio;
                  localStorage.setItem("dogs", JSON.stringify(state.dogs));
                }
              }
            } catch (_) {}

            feedback.style.border = "1px solid rgba(60,200,120,.45)";
            feedback.style.background = "rgba(60,200,120,.10)";
            feedback.style.color = "#bff7d6";
            feedback.textContent = (state.lang === "it") ? "✅ Bio salvata" : "✅ Bio saved";

            setTimeout(() => {
              closeExisting("plutooProfileSettingsView");
              if (typeof window.openProfilePage === "function") window.openProfilePage(d);
            }, 450);

          } catch (e) {
            try { console.error("Profile bio save error:", e); } catch (_) {}
            feedback.style.border = "1px solid rgba(255,80,80,.45)";
            feedback.style.background = "rgba(255,0,0,.08)";
            feedback.style.color = "#ffb3b3";
            feedback.textContent = (state.lang === "it") ? "❌ Errore salvataggio bio" : "❌ Bio save error";
          }
        });

        row.appendChild(btnBack);
        row.appendChild(btnSave);

        card.appendChild(title);
        card.appendChild(bioLabel);
        card.appendChild(bio);
        card.appendChild(feedback);
        card.appendChild(row);

        wrap.appendChild(card);
        document.body.appendChild(wrap);
      });
    }

    // =========================
    // 2) MODIFICA SOCIAL (sheet leggero stabile)
    // =========================
    const btnSocial0 = document.getElementById("btnEditSocial");
    if (btnSocial0) {
      const btnSocial = btnSocial0.cloneNode(true);
      btnSocial0.parentNode.replaceChild(btnSocial, btnSocial0);

      btnSocial.addEventListener("click", () => {
        closeExisting("plutooEditSocialSheet");

        const saved = (state.ownerSocialByDog && state.ownerSocialByDog[d.id]) ? state.ownerSocialByDog[d.id] : {};

        const wrap = document.createElement("div");
        wrap.id = "plutooEditSocialSheet";
        wrap.style.position = "fixed";
        wrap.style.left = "0";
        wrap.style.top = "0";
        wrap.style.right = "0";
        wrap.style.bottom = "0";
        wrap.style.zIndex = "99999";
        wrap.style.background = "rgba(0,0,0,.70)";
        wrap.style.display = "flex";
        wrap.style.alignItems = "flex-end";

        const sheet = document.createElement("div");
        sheet.style.width = "100%";
        sheet.style.borderTopLeftRadius = "20px";
        sheet.style.borderTopRightRadius = "20px";
        sheet.style.border = "1px solid rgba(255,255,255,.10)";
        sheet.style.background = "#121218";
        sheet.style.padding = "14px";
        sheet.style.boxSizing = "border-box";

        sheet.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <div style="font-weight:900;font-size:1.05rem;">
              ${state.lang === "it" ? "Modifica social" : "Edit socials"}
            </div>
            <button type="button" id="plutooCloseSocialSheet" class="btn ghost" style="padding:.45rem .7rem;">✕</button>
          </div>

          <div style="margin-top:10px;display:flex;flex-direction:column;gap:10px;">
            <input id="plutooSocialInstagram" type="text" value="${String(saved.instagram || "")}"
              placeholder="Instagram URL"
              style="width:100%;background:transparent;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:10px 12px;color:inherit;outline:none" />

            <input id="plutooSocialFacebook" type="text" value="${String(saved.facebook || "")}"
              placeholder="Facebook URL"
              style="width:100%;background:transparent;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:10px 12px;color:inherit;outline:none" />

            <input id="plutooSocialTiktok" type="text" value="${String(saved.tiktok || "")}"
              placeholder="TikTok URL"
              style="width:100%;background:transparent;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:10px 12px;color:inherit;outline:none" />

            <div id="plutooSocialSaveFeedback" style="display:none;padding:.65rem .8rem;border-radius:14px;font-weight:900;"></div>

            <button type="button" id="plutooSaveSocialSheet" class="btn accent" style="width:100%;justify-content:center;">
              ${state.lang === "it" ? "Salva" : "Save"}
            </button>
          </div>
        `;

        wrap.addEventListener("click", (e) => { if (e.target === wrap) closeExisting("plutooEditSocialSheet"); });

        document.body.appendChild(wrap);
        wrap.appendChild(sheet);

        const closeBtn = document.getElementById("plutooCloseSocialSheet");
        if (closeBtn) closeBtn.onclick = () => closeExisting("plutooEditSocialSheet");

        const saveBtn = document.getElementById("plutooSaveSocialSheet");
        const fbEl = document.getElementById("plutooSocialFacebook");
        const igEl = document.getElementById("plutooSocialInstagram");
        const ttEl = document.getElementById("plutooSocialTiktok");
        const fbk = document.getElementById("plutooSocialSaveFeedback");

        if (saveBtn) {
          saveBtn.onclick = () => {
            const next = {
              instagram: normalizeUrl(igEl ? igEl.value : ""),
              facebook:  normalizeUrl(fbEl ? fbEl.value : ""),
              tiktok:    normalizeUrl(ttEl ? ttEl.value : "")
            };

            state.ownerSocialByDog[d.id] = next;
            try { localStorage.setItem("ownerSocialByDog", JSON.stringify(state.ownerSocialByDog)); } catch (_) {}

            if (fbk) {
              fbk.style.display = "block";
              fbk.style.border = "1px solid rgba(60,200,120,.45)";
              fbk.style.background = "rgba(60,200,120,.10)";
              fbk.style.color = "#bff7d6";
              fbk.textContent = (state.lang === "it") ? "✅ Social salvati" : "✅ Social saved";
            }

            setTimeout(() => {
              closeExisting("plutooEditSocialSheet");
              if (typeof window.openProfilePage === "function") window.openProfilePage(d);
            }, 450);
          };
        }
      });
    }

  } catch (e) {
    console.error("bindOwnerOnlyProfileButtons error:", e);
  }
})();

      // --- DOCS: apertura file picker + salvataggio stato ---
      // ✅ bind-once per docs: se già presente input nel profilo, non crearne altri
      let docFileInput = qs('input[data-doc-picker="1"]', profileContent);
      if (!docFileInput) {
        docFileInput = document.createElement("input");
        docFileInput.type = "file";
        docFileInput.accept = "image/*,application/pdf";
        docFileInput.style.display = "none";
        docFileInput.dataset.docPicker = "1";
        profileContent.appendChild(docFileInput);
      }

      qa(".doc-item", profileContent).forEach(item => {
        // ✅ bind-once per item
        if (item.dataset && item.dataset.docBound === "1") return;
        if (item.dataset) item.dataset.docBound = "1";

        item.addEventListener("click", (e) => {
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

          docFileInput.onchange = () => {
            const file = docFileInput.files && docFileInput.files[0];
            if (!file) return;

            if (docCategory === "owner") {
              if (!state.ownerDocsUploaded[d.id]) state.ownerDocsUploaded[d.id] = {};
              state.ownerDocsUploaded[d.id].identity = true;
              localStorage.setItem("ownerDocsUploaded", JSON.stringify(state.ownerDocsUploaded));

              if (!d.verified) {
                d.verified = true;
                alert(state.lang === "it" ? "Badge verificato ottenuto! ✅" : "Verified badge obtained! ✅");
              }
            } else if (docCategory === "dog") {
              if (!state.dogDocsUploaded[d.id]) state.dogDocsUploaded[d.id] = {};
              const docName = docType.replace("dog-", "");
              state.dogDocsUploaded[d.id][docName] = true;
              localStorage.setItem("dogDocsUploaded", JSON.stringify(state.dogDocsUploaded));
            }

            openProfilePage(d);
          };

          docFileInput.click();
        });
      });

      qa(".social-btn", profileContent).forEach(btn => {
        // ✅ bind-once per btn
        if (btn.dataset && btn.dataset.socialBound === "1") return;
        if (btn.dataset) btn.dataset.socialBound = "1";

        btn.addEventListener("click", () => {
          const baseUrl   = btn.getAttribute("data-url");
          const dogId     = btn.getAttribute("data-dog-id");
          const socialKey = btn.getAttribute("data-social");

          let finalUrl = baseUrl;

          if (dogId && state.ownerSocialByDog && state.ownerSocialByDog[dogId]) {
            const ownerSocial = state.ownerSocialByDog[dogId];
            if (socialKey === "social-fb" && ownerSocial.facebook) finalUrl = ownerSocial.facebook;
            else if (socialKey === "social-ig" && ownerSocial.instagram) finalUrl = ownerSocial.instagram;
            else if (socialKey === "social-tt" && ownerSocial.tiktok) finalUrl = ownerSocial.tiktok;
          }

          if (!finalUrl) return;

          const rewardKey = `${dogId}_${socialKey}`;
          if (state.plus || state.socialRewardViewed[rewardKey]) {
            window.open(finalUrl, "_blank", "noopener");
            return;
          }
          if (state.rewardOpen) return;
          state.rewardOpen = true;

          showRewardVideoMock("social", () => {
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
    // ✅ evita accumulo: onclick invece di addEventListener
    likeDogBtn.onclick = async () => {
      if (!d || !d.id) return;

      state.matches[d.id] = true;
      localStorage.setItem("matches", JSON.stringify(state.matches));

      if (typeof ensureChatForMatch === "function") {
        try {
          await ensureChatForMatch(d);
        } catch (e) {
          console.error("ensureChatForMatch PROFILO FALLITA:", e);
        }
      }

      const nameForMatch = d.name || (state.lang === "it" ? "Nuovo match" : "New match");
      showMatchAnimation(nameForMatch, nextMatchColor);

      state.matchCount++;
      localStorage.setItem("matchCount", String(state.matchCount));

      nextMatchColor = ["💙","💚","💛","🧡","💜","💗","💝","💖","💞","❤️"][state.matchCount % 10];
    };
  }

  // ✅ FIX CRASH: in create mode uploadSelfie/unlockSelfie non esistono
  const uploadSelfieBtn = $("uploadSelfie");
  if (uploadSelfieBtn) uploadSelfieBtn.onclick = () => {
    const d = state.currentDogProfile;
    if (!d) return;

    const fileInput = $("selfieFileInput");
    if (!fileInput) return;

    fileInput.value = "";
    fileInput.onchange = () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl   = e.target.result;
        const selfieKey = `selfieImage_${d.id}`;

        localStorage.setItem(selfieKey, dataUrl);

        const img = qs(".selfie .img", profileContent);
        if (img) img.src = dataUrl;
      };

      reader.readAsDataURL(file);
    };

    fileInput.click();
  };

  const unlockSelfieBtn = $("unlockSelfie");
  if (unlockSelfieBtn) unlockSelfieBtn.onclick = () => {
    if (!isSelfieUnlocked(d.id)) {
      const unlock = () => {
        state.selfieUntilByDog[d.id] = Date.now() + 24 * 60 * 60 * 1000;
        localStorage.setItem("selfieUntilByDog", JSON.stringify(state.selfieUntilByDog));
        openProfilePage(d);
      };
      if (!state.plus) showRewardVideoMock("selfie", unlock);
      else unlock();
    }
  };

  // ✅ evita accumulo: onclick (sostituisce)
  if (profileBack)  profileBack.onclick  = () => closeProfilePage();
  if (profileClose) profileClose.onclick = () => closeProfilePage();

  window.closeProfilePage = () => {
    profilePage.classList.add("hidden");
    const previousView = state.viewHistory.pop() || "nearby";
    setActiveView(previousView);
    state.currentDogProfile = null;
  };

  function isSelfieUnlocked(id) {
    return Date.now() < (state.selfieUntilByDog[id] || 0);
  }
};

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

  // ✅ mostra "Elimina" solo sui tuoi aggiornamenti
  const deleteBtn = $("deleteStoryBtn");
  if (deleteBtn) {
    if (story.userId === "currentUser") {
      deleteBtn.classList.remove("hidden");
      deleteBtn.onclick = deleteCurrentStoryMedia;
    } else {
      deleteBtn.classList.add("hidden");
      deleteBtn.onclick = null;
    }
  }

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
      
      // ===== TEXT OVERLAY =====
if (media.text && media.text.trim() !== "") {
  const text = document.createElement("div");
  text.className = "story-text-overlay";
  text.innerText = media.text;

  text.style.position = "absolute";
  text.style.left = (media.textX * 100) + "%";
  text.style.top = (media.textY * 100) + "%";
  text.style.transform = "translate(-50%, -50%)";
  text.style.color = media.textColor || "#ffffff";
  text.style.fontSize = "22px";
  text.style.fontWeight = "600";
  text.style.textAlign = "center";
  text.style.textShadow = "0 2px 8px rgba(0,0,0,.9)";

  content.appendChild(text);
}
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

function deleteCurrentStoryMedia() {
  const story = StoriesState.stories.find(
    (s) => s.userId === StoriesState.currentStoryUserId
  );
  if (!story) return;

  const visibleMedia = getVisibleMediaList(story);
  const currentMedia = visibleMedia[StoriesState.currentMediaIndex];
  if (!currentMedia) return;

  const ok = confirm(
    state.lang === "it"
      ? "Vuoi eliminare questo aggiornamento?"
      : "Do you want to delete this update?"
  );
  if (!ok) return;

  // rimuove il media corrente usando l'id
  story.media = (story.media || []).filter(m => m && m.id !== currentMedia.id);

  // se non resta nulla, rimuove tutta la story dell'utente
  if (!story.media.length) {
    StoriesState.stories = StoriesState.stories.filter(
      s => s.userId !== StoriesState.currentStoryUserId
    );
    StoriesState.saveStories();
    closeStoryViewer();
    renderStoriesBar();
    return;
  }

  // se l'indice attuale supera il nuovo totale, torna all'ultimo valido
  const newVisible = getVisibleMediaList(story);
  if (StoriesState.currentMediaIndex >= newVisible.length) {
    StoriesState.currentMediaIndex = Math.max(0, newVisible.length - 1);
  }

  StoriesState.saveStories();
  renderStoryViewer();
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
function pruneStories24h() {
  try {
    if (!window.StoriesState || !Array.isArray(StoriesState.stories)) return;
    const now = Date.now();
    let changed = false;

    StoriesState.stories.forEach(s => {
      if (!s || !Array.isArray(s.media)) return;
      const before = s.media.length;
      s.media = s.media.filter(m => {
        if (!m) return false;
        const exp = typeof m.expiresAt === "number"
          ? m.expiresAt
          : (typeof m.timestamp === "number" ? (m.timestamp + 24 * 60 * 60 * 1000) : 0);
        return exp > now;
      });
      if (s.media.length !== before) changed = true;
    });

    const beforeStories = StoriesState.stories.length;
    StoriesState.stories = StoriesState.stories.filter(s => s && Array.isArray(s.media) && s.media.length > 0);
    if (StoriesState.stories.length !== beforeStories) changed = true;

    if (changed && typeof StoriesState.saveStories === "function") StoriesState.saveStories();
  } catch (e) {}
}

function resetUploadModalUI() {
  const step1 = $("uploadStoryStep1");
  const step2 = $("uploadStoryStep2");
  if (step1) step1.classList.add("active");
  if (step2) step2.classList.remove("active");

  // ripristina upload zone (se era stata nascosta dopo selezione)
  try {
    const zone = step1 ? qs(".upload-zone", step1) : null;
    if (zone) zone.style.display = "";
  } catch (_) {}

  const preview = $("uploadPreview");
  if (preview) {
    preview.innerHTML = "";
    preview.classList.add("hidden");
    preview.dataset.type = "";
    preview.dataset.hasMedia = "false";
    preview.dataset.mediaUrl = "";
    preview.dataset.mediaMime = "";
  }

  // preview nello step 2 (div .upload-preview senza id)
  try {
    const step2Preview = $("uploadStoryStep2") ? qs(".upload-preview", $("uploadStoryStep2")) : null;
    if (step2Preview) step2Preview.innerHTML = "";
  } catch (_) {}

  const nextBtn = $("nextToCustomize");
  if (nextBtn) nextBtn.disabled = true;

  const fileInput = $("storyFileInput");
  if (fileInput) fileInput.value = "";

  if (window.StoriesState) {
    StoriesState.uploadedFile = null;
    StoriesState.selectedFilter = StoriesState.selectedFilter || "none";
    StoriesState.selectedMusic = StoriesState.selectedMusic || "";
    StoriesState.__publishing = false;
  }
}

function openUploadModal() {
  pruneStories24h();

  // ✅ SOLO PLUS può pubblicare (messaggio definitivo)
  if (!StoriesState.canUploadStory()) {
    const msg = state.lang === "it"
      ? "Gli Aggiornamenti DOG sono disponibili con Plutoo Plus.\nAttiva Plus per pubblicare aggiornamenti del tuo DOG."
      : "DOG Updates are available with Plutoo Plus.\nActivate Plus to publish updates of your DOG.";
    if (typeof showToast === "function") showToast(msg, "error");
    else alert(msg);
    return;
  }

  resetUploadModalUI();
  $("uploadStoryModal")?.classList.remove("hidden");
  document.body.classList.add("noscroll");
}

function closeUploadModal() {
  $("uploadStoryModal")?.classList.add("hidden");
  document.body.classList.remove("noscroll");
  resetUploadModalUI();
}

function handleFileSelect(e) {
  const file = e && e.target ? e.target.files[0] : null;
  if (!file) return;

  const preview = $("uploadPreview");
  if (!preview) return;

  preview.innerHTML = "";
  preview.classList.remove("hidden");
  preview.dataset.type = "";
  preview.dataset.hasMedia = "false";
  preview.dataset.mediaUrl = "";
  preview.dataset.mediaMime = "";

  const isImage = file.type && file.type.startsWith("image/");
  const isVideo = file.type && file.type.startsWith("video/");

  // ✅ MODELLO DEFINITIVO: solo immagini (Aggiornamenti DOG)
  if (!isImage) {
    alert(state.lang === "it" ? "Formato non supportato. Usa solo una FOTO." : "Unsupported format. Use PHOTO only.");
    return;
  }

  if (file.size > STORIES_CONFIG.MAX_PHOTO_SIZE) {
    alert(state.lang === "it" ? "Foto troppo grande. Riduci la dimensione e riprova." : "Photo too large. Reduce size and retry.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (event) {
    const dataUrl = event && event.target ? event.target.result : "";
    if (!dataUrl) {
      alert(state.lang === "it" ? "Errore nel caricamento del file. Riprova." : "File load error. Retry.");
      return;
    }

    // ✅ salva in stato + anche su dataset (anti-perdita tra step)
    StoriesState.uploadedFile = {
      type: "image",
      url: dataUrl,
      mime: file.type,
      size: file.size
    };

    preview.innerHTML = `<img src="${dataUrl}" alt="Aggiornamento" />`;
    preview.dataset.type = "image";
    preview.dataset.hasMedia = "true";
    preview.dataset.mediaUrl = dataUrl;
    preview.dataset.mediaMime = file.type || "image/*";

    // ✅ dopo selezione: sparisce box upload, resta solo foto
    try {
      const step1 = $("uploadStoryStep1");
      const zone = step1 ? qs(".upload-zone", step1) : null;
      if (zone) zone.style.display = "none";
    } catch (_) {}

    const nextBtn = $("nextToCustomize");
    if (nextBtn) nextBtn.disabled = false;
  };

  reader.onerror = function () {
    alert(state.lang === "it" ? "Errore nel caricamento del file. Riprova." : "File load error. Retry.");
    StoriesState.uploadedFile = null;

    preview.innerHTML = "";
    preview.classList.add("hidden");
    preview.dataset.type = "";
    preview.dataset.hasMedia = "false";
    preview.dataset.mediaUrl = "";
    preview.dataset.mediaMime = "";

    const nextBtn = $("nextToCustomize");
    if (nextBtn) nextBtn.disabled = true;
  };

  reader.readAsDataURL(file);
}

function showCustomizeStep() {
  const step1 = $("uploadStoryStep1");
  const step2 = $("uploadStoryStep2");
  if (!step1 || !step2) return;

  // ✅ copia la stessa foto nello step2 (evita “pagina 2 vuota / box sopra”)
  try {
    const preview = $("uploadPreview");
    const step2Preview = qs(".upload-preview", step2);
    if (step2Preview) {
      const dataUrl = preview && preview.dataset ? (preview.dataset.mediaUrl || "") : "";
      if (dataUrl) step2Preview.innerHTML = `<img src="${dataUrl}" alt="Aggiornamento" />`;
      else step2Preview.innerHTML = "";

      // ====== ✅ EDITOR TESTO OVERLAY (Instagram-like) ======
      try {
        // assicura container posizionato
        step2Preview.style.position = "relative";

        // ✅ FIX: evita scroll/gesture che bloccano il drag verticale in WebView
        step2Preview.style.touchAction = "none";

        // textarea esistente (lo usiamo come storage, anche se non lo vuoi vedere)
        const ta = document.getElementById("storyTextInput");
        if (ta) {
          ta.style.opacity = "0";
          ta.style.pointerEvents = "none";
          ta.style.position = "absolute";
          ta.style.left = "-9999px";
        }

        // crea/riusa overlay
        let overlay = step2Preview.querySelector(".story-text-overlay-editor");
        if (!overlay) {
          overlay = document.createElement("div");
          overlay.className = "story-text-overlay-editor";
          overlay.setAttribute("contenteditable", "true");
          overlay.setAttribute("spellcheck", "false");

          overlay.style.position = "absolute";
          overlay.style.left = "50%";
          overlay.style.top = "75%";
          overlay.style.transform = "translate(-50%, -50%)";
          overlay.style.padding = "6px 10px";
          overlay.style.borderRadius = "14px";
          overlay.style.maxWidth = "92%";
          overlay.style.minWidth = "40px";
          overlay.style.outline = "none";
          overlay.style.textAlign = "center";
          overlay.style.fontSize = "22px";
          overlay.style.fontWeight = "700";
          overlay.style.lineHeight = "1.15";
          overlay.style.color = "#ffffff";
          overlay.style.textShadow = "0 2px 10px rgba(0,0,0,.85)";
          overlay.style.background = "rgba(0,0,0,.10)";

          // ✅ FIX DRAG ANDROID/WEBVIEW
          overlay.style.touchAction = "none";

          step2Preview.appendChild(overlay);

          // tap sulla foto → focus testo (tastiera)
          const imgEl = step2Preview.querySelector("img");
          if (imgEl) {
            imgEl.style.display = "block";
            imgEl.style.width = "100%";
            imgEl.style.height = "100%";
            imgEl.style.objectFit = "cover";
            imgEl.addEventListener("click", () => {
              overlay.focus();
            });
          }

          // ✅ ENTER/INVIO: conferma testo (no a-capo) + chiudi tastiera
          overlay.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              overlay.blur();
            }
          });

          // ✅ tap fuori dal testo: chiudi tastiera
          step2Preview.addEventListener("pointerdown", (ev) => {
            const inside = ev.target && ev.target.closest ? ev.target.closest(".story-text-overlay-editor") : null;
            if (!inside) {
              try { overlay.blur(); } catch (_) {}
            }
          });

          // sync testo su textarea (per publishStory già esistente)
          overlay.addEventListener("input", () => {
            if (ta) ta.value = overlay.innerText || "";
          });

          // doppio tap/click → toggle colore (bianco/nero)
          overlay.addEventListener("dblclick", (ev) => {
            ev.preventDefault();
            const cur = (overlay.dataset && overlay.dataset.color) ? overlay.dataset.color : "white";
            const next = (cur === "white") ? "black" : "white";
            if (overlay.dataset) overlay.dataset.color = next;

            if (next === "black") {
              overlay.style.color = "#111111";
              overlay.style.textShadow = "0 2px 10px rgba(255,255,255,.55)";
              overlay.style.background = "rgba(255,255,255,.14)";
            } else {
              overlay.style.color = "#ffffff";
              overlay.style.textShadow = "0 2px 10px rgba(0,0,0,.85)";
              overlay.style.background = "rgba(0,0,0,.10)";
            }
          });

          // drag con dito (pointer)
          let dragging = false;
          let startX = 0, startY = 0;
          let startLeft = 0, startTop = 0;

          overlay.addEventListener("pointerdown", (ev) => {
            dragging = true;

            // ✅ FIX: durante drag non selezionare testo
            overlay.style.userSelect = "none";
            overlay.style.webkitUserSelect = "none";

            overlay.setPointerCapture(ev.pointerId);
            const rect = step2Preview.getBoundingClientRect();
            const orect = overlay.getBoundingClientRect();

            startX = ev.clientX;
            startY = ev.clientY;

            startLeft = (orect.left - rect.left) + (orect.width / 2);
            startTop  = (orect.top - rect.top) + (orect.height / 2);

            ev.preventDefault();
          });

          overlay.addEventListener("pointermove", (ev) => {
            if (!dragging) return;

            // ✅ FIX: blocca gesture/scroll che spezzano Y in WebView
            ev.preventDefault();

            const rect = step2Preview.getBoundingClientRect();

            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;

            let cx = startLeft + dx;
            let cy = startTop + dy;

            // clamp
            if (cx < 20) cx = 20;
            if (cy < 20) cy = 20;
            if (cx > rect.width - 20) cx = rect.width - 20;
            if (cy > rect.height - 20) cy = rect.height - 20;

            overlay.style.left = (cx / rect.width * 100) + "%";
            overlay.style.top  = (cy / rect.height * 100) + "%";

            // salva su textarea dataset
            if (ta && ta.dataset) {
              ta.dataset.textX = String(cx / rect.width);
              ta.dataset.textY = String(cy / rect.height);
              ta.dataset.textColor = (overlay.dataset && overlay.dataset.color === "black") ? "#111111" : "#ffffff";
            }
          });

          overlay.addEventListener("pointerup", (ev) => {
            dragging = false;

            // ✅ ripristina selezione testo
            overlay.style.userSelect = "";
            overlay.style.webkitUserSelect = "";

            try { overlay.releasePointerCapture(ev.pointerId); } catch (_) {}
          });

          overlay.addEventListener("pointercancel", (ev) => {
            dragging = false;

            // ✅ ripristina selezione testo
            overlay.style.userSelect = "";
            overlay.style.webkitUserSelect = "";

            try { overlay.releasePointerCapture(ev.pointerId); } catch (_) {}
          });
        }

        // se già c’era testo salvato, rimettilo dentro overlay
        if (ta && (ta.value || "").trim() !== "") {
          overlay.innerText = ta.value;
        }
      } catch (_) {}
      // ====== /EDITOR TESTO OVERLAY ======
    }
  } catch (_) {}

  step1.classList.remove("active");
  step2.classList.add("active");
              }

function showUploadStep() {
  const step1 = $("uploadStoryStep1");
  const step2 = $("uploadStoryStep2");
  if (!step1 || !step2) return;

  step2.classList.remove("active");
  step1.classList.add("active");
}

function setupFiltersGrid() {
  // ✅ Rimane la chiamata (stessa struttura), ma non attiviamo nulla nel modello definitivo
  // (Filtri/Musica verranno tolti dal markup quando decidi tu, in uno step dedicato)
  const musicSelect = $("storyMusicSelect");
  if (musicSelect) {
    musicSelect.onchange = () => {
      StoriesState.selectedMusic = musicSelect.value || "";
    };
  }
}

async function publishStory() {
  // 🔒 VETRINA: blocca pubblicazione story
  if (window.PLUTOO_READONLY) {
    const msg = state.lang === "it"
      ? "🔒 Crea il profilo DOG per pubblicare un aggiornamento"
      : "🔒 Create your DOG profile to publish an update";
    if (typeof showToast === "function") showToast(msg, "error");
    else alert(msg);
    return;
  }

  // ✅ anti multi-click / doppio binding
  if (StoriesState.__publishing === true) return;
  StoriesState.__publishing = true;

  try {
    pruneStories24h();

    const preview = $("uploadPreview");

    // fallback se uploadedFile perso
    if (!StoriesState.uploadedFile && preview && preview.dataset && preview.dataset.mediaUrl) {
      StoriesState.uploadedFile = {
        type: "image",
        url: preview.dataset.mediaUrl,
        mime: preview.dataset.mediaMime || "image/*",
        size: 0
      };
    }

    // blocco se davvero non esiste media
    if (!StoriesState.uploadedFile) {
      alert(state.lang === "it" ? "Seleziona prima una foto" : "Select a photo first");
      StoriesState.__publishing = false;
      return;
    }

    // solo immagini
    if (StoriesState.uploadedFile.type !== "image") {
      alert(state.lang === "it" ? "Formato non supportato. Usa solo una FOTO." : "Unsupported format. Use PHOTO only.");
      StoriesState.__publishing = false;
      return;
    }

    // ✅ Firebase pronto obbligatorio
    if (!window.auth || !window.db || !window.storage) {
      const msg = state.lang === "it"
        ? "Firebase non pronto. Riprova tra un attimo."
        : "Firebase not ready. Please retry in a moment.";
      if (typeof showToast === "function") showToast(msg, "error");
      else alert(msg);
      StoriesState.__publishing = false;
      return;
    }

    const currentUser = window.auth.currentUser;
    const uid = currentUser && currentUser.uid ? currentUser.uid : (window.PLUTOO_UID || "");
    if (!uid) {
      const msg = state.lang === "it"
        ? "Devi essere autenticato per pubblicare un aggiornamento."
        : "You must be logged in to publish an update.";
      if (typeof showToast === "function") showToast(msg, "error");
      else alert(msg);
      StoriesState.__publishing = false;
      return;
    }

    const now = Date.now();

    const storyTextEl = document.getElementById("storyTextInput");
    const storyText = (storyTextEl && typeof storyTextEl.value === "string")
      ? storyTextEl.value.trim()
      : "";

    const textColor = (storyTextEl && storyTextEl.dataset && storyTextEl.dataset.textColor)
      ? storyTextEl.dataset.textColor
      : "#ffffff";

    const textX = (storyTextEl && storyTextEl.dataset && storyTextEl.dataset.textX !== undefined)
      ? Number(storyTextEl.dataset.textX)
      : 0.5;

    const textY = (storyTextEl && storyTextEl.dataset && storyTextEl.dataset.textY !== undefined)
      ? Number(storyTextEl.dataset.textY)
      : 0.8;

    const storyId = `story_${uid}_${now}`;
    const storagePath = `stories/${uid}/${storyId}.jpg`;
    const storageRef = window.storage.ref().child(storagePath);

    // ✅ upload Base64/dataUrl su Firebase Storage
    await storageRef.putString(
      StoriesState.uploadedFile.url,
      "data_url",
      {
        contentType: StoriesState.uploadedFile.mime || "image/jpeg",
        customMetadata: {
          ownerUid: uid,
          storyId: storyId,
          kind: "story"
        }
      }
    );

    const downloadURL = await storageRef.getDownloadURL();

    const dogId = window.PLUTOO_DOG_ID || uid;
    const dogName =
      window.PLUTOO_DOG_NAME ||
      localStorage.getItem("plutoo_dog_name") ||
      "DOG";

    const dogAvatar =
      window.PLUTOO_DOG_AVATAR ||
      localStorage.getItem("plutoo_dog_avatar") ||
      "plutoo-icon-192.png";

    const storyDoc = {
      id: storyId,
      storyId: storyId,
      ownerUid: uid,
      dogId: dogId,
      dogName: dogName,
      dogAvatar: dogAvatar,
      verified: false,

      type: "image",
      url: downloadURL,
      storagePath: storagePath,
      mime: StoriesState.uploadedFile.mime || "image/jpeg",
      size: StoriesState.uploadedFile.size || 0,

      timestamp: now,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      expiresAt: now + 24 * 60 * 60 * 1000,

      text: storyText,
      textColor: textColor,
      textX: Number.isFinite(textX) ? textX : 0.5,
      textY: Number.isFinite(textY) ? textY : 0.8,

      filter: "none",
      music: "",
      viewed: false,
      privacy: "public",
      active: true
    };

    // ✅ save su Firestore
    await window.db.collection("stories").doc(storyId).set(storyDoc);

    // ✅ mantengo anche sync locale per non rompere la UI attuale
    let userStory = StoriesState.stories.find(s => s.userId === uid);

    if (!userStory) {
      userStory = {
        userId: uid,
        userName: dogName,
        avatar: dogAvatar,
        verified: false,
        media: []
      };
      StoriesState.stories.unshift(userStory);
    }

    try {
      const realMedia = Array.isArray(userStory.media) ? userStory.media.slice() : [];
      realMedia.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      while (realMedia.length > 2) realMedia.shift();
      userStory.media = realMedia;
    } catch (_) {}

    const newMedia = {
      id: storyId,
      type: "image",
      url: downloadURL,
      storagePath: storagePath,
      timestamp: now,
      expiresAt: now + 24 * 60 * 60 * 1000,

      text: storyText,
      textColor: textColor,
      textX: Number.isFinite(textX) ? textX : 0.5,
      textY: Number.isFinite(textY) ? textY : 0.8,

      filter: "none",
      music: "",
      viewed: false,
      privacy: "public"
    };

    userStory.media.push(newMedia);

    if (typeof StoriesState.saveStories === "function")
      StoriesState.saveStories();

    StoriesState.uploadedFile = null;
    StoriesState.selectedFilter = "none";
    StoriesState.selectedMusic = "";

    if (storyTextEl) {
      storyTextEl.value = "";
      if (storyTextEl.dataset) {
        delete storyTextEl.dataset.textX;
        delete storyTextEl.dataset.textY;
        delete storyTextEl.dataset.textColor;
      }
    }

    closeUploadModal();
    if (typeof renderStoriesBar === "function")
      renderStoriesBar();

    if (typeof showToast === "function") {
      showToast(state.lang === "it" ? "Aggiornamento pubblicato ✓" : "Update published ✓");
    } else {
      alert(state.lang === "it" ? "Aggiornamento pubblicato ✓" : "Update published ✓");
    }

  } catch (err) {
    console.error("publishStory Firebase error:", err);

    const msg = state.lang === "it"
      ? "Errore nella pubblicazione dell'aggiornamento. Riprova."
      : "Update publish error. Please retry.";

    if (typeof showToast === "function") showToast(msg, "error");
    else alert(msg);

  } finally {
    StoriesState.__publishing = false;
  }
}

function showToast(message, type = "success") {
  let toast = document.getElementById("plutoo-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "plutoo-toast";

    toast.style.position = "fixed";
    toast.style.top = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "#6c4df6";
    toast.style.color = "#fff";
    toast.style.padding = "12px 18px";
    toast.style.borderRadius = "14px";
    toast.style.fontWeight = "600";
    toast.style.fontSize = "14px";
    toast.style.zIndex = "999999";
    toast.style.boxShadow = "0 8px 25px rgba(0,0,0,0.25)";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.25s ease";

    document.body.appendChild(toast);
  }

  if (type === "error") {
    toast.style.background = "#e54848";
  } else {
    toast.style.background = "#6c4df6";
  }

  toast.textContent = message;

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  clearTimeout(toast._hideTimer);

  toast._hideTimer = setTimeout(() => {
    toast.style.opacity = "0";
  }, 2500);
}
      
