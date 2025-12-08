// DEBUG TEMPORANEO: mostra qualsiasi errore JS
window.addEventListener("error", function (e) {
  alert("JS ERROR: " + e.message);
});

document.addEventListener("DOMContentLoaded", () => {

  // Firebase handles (già inizializzato in index.html)
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

// Helper per il timestamp server di Firestore (versione compat)
const FieldValue = firebase.firestore.FieldValue;

  // Login anonimo automatico (se non ancora loggato)
auth.onAuthStateChanged(user => {
  if (!user) {
    auth.signInAnonymously().catch(err => {
      console.error("Auth error:", err);
    });
  } else {
    // Salva l'UID in window per il resto dell'app
    window.PLUTOO_UID = user.uid;

    // Primo test Firestore: salva/aggiorna documento utente
    db.collection("users").doc(user.uid).set({
      lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      userAgent: navigator.userAgent || null
    }, { merge: true }).catch(err => {
      console.error("Firestore user save error:", err);
    });
}
});

  // Disabilita PWA/Service Worker dentro l'app Android (WebView)
  const isAndroidWebView =
    navigator.userAgent.includes("Android") &&
    navigator.userAgent.includes("wv");

  if (isAndroidWebView) {
    // Stoppa eventuali service worker (evita doppia icona PWA)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then(regs => regs.forEach(reg => reg.unregister()))
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

  const CURRENT_USER_DOG_ID = "d1";

  // ============ Stato (caricato da localStorage dove possibile) ============
  const state = {
    // UX / navigazione
    entered: localStorage.getItem("entered") === "1",
    currentView: localStorage.getItem("currentView") || "nearby",
    viewHistory: [],
    processingSwipe: false,

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
        story.media = story.media.filter(m => (now - m.timestamp) < STORIES_CONFIG.STORY_LIFETIME);
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
        { userId:"d1", userName:"Luna", avatar:"dog1.jpg", verified:true,
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
 const msgTopTabs  = qa(".msg-top-tab");
 const msgLists    = qa(".messages-list");

  // Carica le liste messaggi da Firestore (solo quando apro la vista)
  async function loadMessagesLists() {
    try {
      // msgLists è già definito sopra come qa(".messages-list")
      if (!db || !msgLists || !msgLists.length) return;

      const selfUid = window.PLUTOO_UID || "anon";
      if (!selfUid) return;

      // Contenitori reali definiti in index.html
      const sentList = document.getElementById("tabSent");
      const matchesList = document.getElementById("tabMatches");
      if (!sentList || !matchesList) return;

      // Pulisco tutte le liste e nascondo gli empty state
      msgLists.forEach((list) => {
        list.querySelectorAll(".msg-item").forEach((el) => el.remove());
        const emptyEl = list.querySelector(".empty-state");
        if (emptyEl) {
          // di base li considero nascosti, poi li riaccendo se non ci sono chat
          emptyEl.classList.add("hidden-empty");
        }
      });

      // Legge le chat dove compare il mio UID
      const snap = await db
        .collection("chats")
        .where("members", "array-contains", selfUid)
        .get();

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
    lastMessageText: data.lastMessageText || "",
    lastMessageAt: lastAt,
    lastSenderUid: data.lastSenderUid || null,
    dogName: data.dogName || null,
    dogAvatar: data.dogAvatar || null,
  });
});

      // Se non ci sono chat → mostro i testi "vuoti" e mi fermo
      if (!chats.length) {
        msgLists.forEach((list) => {
          const emptyEl = list.querySelector(".empty-state");
          if (emptyEl) {
            emptyEl.classList.remove("hidden-empty");
          }
        });
        return;
      }

      // Ordino le chat per data ultimo messaggio (più recente in alto)
      chats.sort((a, b) => {
        if (!a.lastMessageAt && !b.lastMessageAt) return 0;
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return b.lastMessageAt - a.lastMessageAt;
      });

  // Popolo la lista "Inviati" e la lista "Match" con criteri diversi
chats.forEach((chat) => {
    const otherUid = chat.members.find((uid) => uid !== selfUid) || null;
    const dogId = chat.dogId || null;

    // Nome DOG
    const dogName =
        chat.dogName ||
        (state.lang === "en" ? "DOG" : "Dog");

    const text = chat.lastMessageText || "";
    const dateText = chat.lastMessageAt
        ? chat.lastMessageAt.toLocaleString()
        : "";

    const isSent = chat.lastSenderUid === selfUid;
    const hasMatch =
        !!chat.match || (dogId && !!state.matches[dogId]);

    // ---- TAB "Inviati": solo chat dove l'ultimo messaggio è mio ----
    if (isSent) {
        const row = document.createElement("div");
        row.className = "msg-item";
        row.innerHTML = `
            <div class="msg-main">
                <div class="msg-title">${dogName} - ${text}</div>
                <div class="msg-meta">${dateText}</div>
            </div>
        `;
        row.addEventListener("click", () => {
            openChat(chat.id, dogId, otherUid);
        });
        sentList.appendChild(row);
    }

    // ---- TAB "Match": lista dei DOG con cui ho un match ----
    if (hasMatch && dogId) {
        const matchRow = document.createElement("div");
        matchRow.className = "msg-item";
        matchRow.innerHTML = `
            <div class="msg-main">
                <div class="msg-title">${dogName}</div>
                <div class="msg-meta">${dateText}</div>
            </div>
        `;
        matchRow.addEventListener("click", () => {
            openChat(chat.id, dogId, otherUid);
        });
        matchesList.appendChild(matchRow);
    }
});

      // Aggiorno gli "empty state" in base alla presenza di msg-item
      msgLists.forEach((list) => {
        const items = list.querySelectorAll(".msg-item");
        const emptyEl = list.querySelector(".empty-state");
        if (!emptyEl) return;
        const hasItems = items.length > 0;
        // se ci sono item → nascondo il testo vuoto
        emptyEl.classList.toggle("hidden-empty", hasItems);
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

    [viewNearby, viewLove, viewPlay, viewMessages].forEach(v => {
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
      if (confirm(state.lang==="it" ? "Tornare alla Home?" : "Return to Home?")){
        localStorage.removeItem("entered");
        state.entered=false;
        appScreen.classList.add("hidden");
        homeScreen.classList.remove("hidden");
      }
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
    return `${n.toFixed(1)} km`;
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

    function handleSwipeComplete(direction){
      if(state.processingSwipe) return;
      state.processingSwipe = true;

    if (direction === "right"){
  const matchChance = Math.random();
  if (matchChance > -1){

  showMatchAnimation(d.name, nextMatchColor);

            // dogId unico per match/friendship
            const dogId = d.id || d.dogId || null;

            if (mode === "love") {
                if (dogId) {
                    state.matches[dogId] = true;
                    localStorage.setItem("matches", JSON.stringify(state.matches));
                }
            } else {
                if (dogId) {
                    state.friendships[dogId] = true;
                    localStorage.setItem("friendships", JSON.stringify(state.friendships));
                }
            }

            // Cuore del match: usa il colore corrente e prepara il prossimo
            showMatchAnimation(d.name, nextMatchColor);
            state.matchCount++;
            localStorage.setItem("matchCount", String(state.matchCount));
            nextMatchColor = ["💙","💚","💛","🧡","💜","💗","💝","💘","💖","❤️"][state.matchCount % 10];
  }
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

    // animazione
    card.classList.add("swipe-out-right");

    // like del cane
    state.matches[d.id] = true;
    localStorage.setItem("matches", JSON.stringify(state.matches));

    // verifica match reciproco
    const otherLikedYou = state.likesReceived?.[d.id] === true;

    if (otherLikedYou) {
      // MATCH!
      const nameForMatch = state.lang === "it" ? "Nuovo match" : "New match";
      showMatchAnimation(nameForMatch, nextMatchColor);
      state.matchCount++;
      localStorage.setItem("matchCount", String(state.matchCount));
      nextMatchColor = ["💙","💚","💛","🧡","💜","💗","💝","💖","💞","❤️"][state.matchCount % 10];
    }

    handleSwipeComplete("right");
  };
    }
    
    if(noBtn){
      noBtn.onclick = ()=>{
        if(state.processingSwipe) return;
        card.classList.add("swipe-out-left");
        handleSwipeComplete("left");
      };
    }

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
        onSwipe(direction);
      } else {
        resetCard(card);
      }

      currentX = 0;
    };

    card.addEventListener("touchstart", e => {
      const touch = e.touches[0];
      start(touch.clientX, touch.clientY);
    }, {passive: true});

    card.addEventListener("touchmove", e => {
      const touch = e.touches[0];
      move(touch.clientX);
    }, {passive: true});

    card.addEventListener("touchend", end, {passive: true});

    card.addEventListener("mousedown", e => { start(e.clientX, e.clientY); });

    const handleMouseMove = e => move(e.clientX);
    const handleMouseUp = () => end();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    card._cleanup = () => {
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
    const v = (breedInput.value||"").trim().toLowerCase();
    breedsList.innerHTML=""; breedsList.style.display="none";
    if (!v) return;
    const matches = state.breeds.filter(b=>b.toLowerCase().startsWith(v)).slice(0,16);
    if (!matches.length) return;
    breedsList.innerHTML = matches.map(b=>`<div class="item">${b}</div>`).join("");
    breedsList.style.display = "block";
    qa(".item",breedsList).forEach(it=>it.addEventListener("click",()=>{
      breedInput.value = it.textContent; breedsList.style.display="none";
    }));
  });
  document.addEventListener("click",(e)=>{
    if (e.target!==breedInput && !breedsList.contains(e.target)) breedsList.style.display="none";
  });

  onlyVerified?.addEventListener("change", ()=> state.filters.verified = !!onlyVerified.checked);
  sexFilter?.addEventListener("change", ()=> state.filters.sex = sexFilter.value || "");

  applyFilters?.addEventListener("click",(e)=>{
    e.preventDefault();
    state.filters.breed = (breedInput.value||"").trim();
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

  function followDog(targetDogId) {
    if (!targetDogId || targetDogId === CURRENT_USER_DOG_ID) return;

    if (!state.followersByDog[targetDogId]) state.followersByDog[targetDogId] = [];
    if (!state.followingByDog[CURRENT_USER_DOG_ID]) state.followingByDog[CURRENT_USER_DOG_ID] = [];

    const followers = state.followersByDog[targetDogId];
    const following = state.followingByDog[CURRENT_USER_DOG_ID];

    if (!followers.includes(CURRENT_USER_DOG_ID)) {
      followers.push(CURRENT_USER_DOG_ID);
    }
    if (!following.includes(targetDogId)) {
      following.push(targetDogId);
    }

    persistFollowState();
    updateFollowerUI(targetDogDogOrId(targetDogId));
  }

  function unfollowDog(targetDogId) {
    if (!targetDogId || targetDogId === CURRENT_USER_DOG_ID) return;

    const followers = state.followersByDog[targetDogId] || [];
    const following = state.followingByDog[CURRENT_USER_DOG_ID] || [];

    state.followersByDog[targetDogId] = followers.filter(id => id !== CURRENT_USER_DOG_ID);
    state.followingByDog[CURRENT_USER_DOG_ID] = following.filter(id => id !== targetDogId);

    persistFollowState();
    updateFollowerUI(targetDogDogOrId(targetDogId));
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

    const followers = getFollowers(dog.id);
    const following = getFollowing(dog.id);

    const followersCountEl = $("followersCount");
    const followingCountEl = $("followingCount");

    if (followersCountEl) {
      const count = followers.length;
      if (state.lang === "it") {
        followersCountEl.textContent = `${count} follower`;
      } else {
        followersCountEl.textContent = `${count} follower${count === 1 ? "" : "s"}`;
      }
      followersCountEl.dataset.dogId = dog.id;
    }

    if (followingCountEl) {
      const count = following.length;
      if (state.lang === "it") {
        followingCountEl.textContent = `${count} seguiti`;
      } else {
        followingCountEl.textContent = `${count} following`;
      }
      followingCountEl.dataset.dogId = dog.id;
    }
  }

  function openFollowersList(dogOrId) {
    const dog = targetDogDogOrId(dogOrId);
    if (!dog || !followersOverlay || !followersList) return;

    const followers = getFollowers(dog.id);

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

    const following = getFollowing(dog.id);

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
    if (isDogPhotoLiked(dogId)) {
      delete state.photoLikesByDog[dogId];
    } else {
      state.photoLikesByDog[dogId] = true;
    }
    persistPhotoLikes();
    updatePhotoLikeUI(dogId);
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
    if (isStoryLiked(mediaId)) {
      delete state.storyLikesByMedia[mediaId];
    } else {
      state.storyLikesByMedia[mediaId] = true;
    }
    persistStoryLikes();
    updateStoryLikeUI(mediaId);
  }

  // ============ Profilo DOG (con Stories + Social + Follow + Like foto) ============
  window.openProfilePage = (d)=>{
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

    profileContent.innerHTML = `
      <div class="pp-hero">
        <img src="${d.img}" alt="${d.name}" onerror="this.onerror=null;this.src='./plutoo-icon-192.png';">
      </div>
      <div class="pp-head">
        <h2 class="pp-name">
          <span class="pp-name-main">${d.name} ${d.verified?"✅":""}</span>
          <button type="button" id="followBtn" class="btn small pp-follow-btn">Segui 🐕🐾</button>
          <span class="pp-follow-stats">
            <button type="button" id="followersCount" class="pp-follow-count">0 follower</button>
            <span class="pp-follow-dot">·</span>
            <button type="button" id="followingCount" class="pp-follow-count">0 seguiti</button>
          </span>
        </h2>
        <div class="pp-badges">
          <span class="badge">${d.breed}</span>
          <span class="badge">${d.age} ${t("years")}</span>
          <span class="badge">${fmtKm(d.km)}</span>
          <span class="badge">${d.sex==="M"?(state.lang==="it"?"Maschio":"Male"):(state.lang==="it"?"Femmina":"Female")}</span>
        </div>
      </div>
      <div class="pp-meta soft">${d.bio||""}</div>

      ${storiesHTML}

      <h3 class="section-title">${state.lang==="it"?"Galleria":"Gallery"}</h3>
      <div class="gallery">
        <div class="ph"><img src="${d.img}" alt=""></div>
        <div class="ph"><img src="${d.img}" alt=""></div>
        <div class="ph"><img src="${d.img}" alt=""></div>
        <div class="ph"><button class="add-photo">+ ${state.lang==="it"?"Aggiungi":"Add"}</button></div>
      </div>

      <h3 class="section-title">Selfie</h3>
<div class="selfie ${selfieUnlocked?'unlocked':''}">
  <img class="img" src="${selfieSrc}" alt="Selfie">
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

      <div class="pp-actions">
        <button id="btnLikeDog" class="btn accent">💛 Like</button>
        <button id="btnOpenChat" class="btn primary">${state.lang==="it"?"Apri chat":"Open chat"}</button>
      </div>
    `;

  // === PULSANTE "MODIFICA SOCIAL" SOLO PER IL TUO DOG ===
if (d.id === CURRENT_USER_DOG_ID) {
  const btn = document.createElement("button");
  btn.id = "editSocialBtn";
  btn.className = "btn outline";
  btn.style.marginTop = "1rem";
  btn.textContent = "Modifica social";

  btn.addEventListener("click", () => {

    const dogId = d.id;
    const existing =
      (state.ownerSocialByDog && state.ownerSocialByDog[dogId]) || {};

    // Facebook
    let fb = prompt(
      state.lang === "it"
        ? "Inserisci il link Facebook del proprietario (lascia vuoto per nessun link):"
        : "Enter owner Facebook link (leave empty for none):",
      existing.facebook || ""
    );
    if (fb === null) fb = existing.facebook || "";
    fb = fb.trim();

    // Instagram
    let ig = prompt(
      state.lang === "it"
        ? "Inserisci il link Instagram del proprietario:"
        : "Enter owner Instagram link:",
      existing.instagram || ""
    );
    if (ig === null) ig = existing.instagram || "";
    ig = ig.trim();

    // TikTok
    let tt = prompt(
      state.lang === "it"
        ? "Inserisci il link TikTok del proprietario:"
        : "Enter owner TikTok link:",
      existing.tiktok || ""
    );
    if (tt === null) tt = existing.tiktok || "";
    tt = tt.trim();

    // 🔥 Se tutto vuoto → rimuovo social salvati
    if (!fb && !ig && !tt) {
      if (state.ownerSocialByDog && state.ownerSocialByDog[dogId]) {
        delete state.ownerSocialByDog[dogId];
      }
    } else {
      if (!state.ownerSocialByDog) state.ownerSocialByDog = {};
      state.ownerSocialByDog[dogId] = {
        facebook: fb || "",
        instagram: ig || "",
        tiktok: tt || ""
      };
    }

    // 🔄 Salvo su localStorage
    try {
      localStorage.setItem(
        "ownerSocialByDog",
        JSON.stringify(state.ownerSocialByDog || {})
      );
    } catch (e) {}

    // Messaggio
    const msg =
      state.lang === "it" ? "Social aggiornati!" : "Social updated!";

    if (typeof showToast === "function") {
      showToast(msg);
    } else {
      alert(msg);
    }

    // 🔄 Ricarica SOLO la sezione social nel profilo
    const updatedHTML = generateSocialSection(d);
    const socialSection = document.querySelector(".pp-social-section");
    if (socialSection && updatedHTML) {
      socialSection.outerHTML = updatedHTML;
    }

  });

  const contentEl = document.getElementById("profileContent");
  if (contentEl) {
    contentEl.appendChild(btn);
  }
}

// ==== GALLERIA PROFILO (max 5 foto, salvate in localStorage)
(function () {
  // Se per qualche motivo d non c'è, esco
  if (!d || !profileContent) return;

  const maxPhotos = 5;
  const dogId = d.id;
  const storageKey = `gallery_${dogId}`;

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
        const myFollowing = getFollowing(); // lista dei cani che SEGUE il mio DOG
        const isFollowing = myFollowing.includes(d.id);
        if (state.lang === "it") {
          followBtn.textContent = isFollowing ? "Seguito 🐕🐾" : "Segui 🐕🐾";
        } else {
          followBtn.textContent = isFollowing ? "Following 🐕🐾" : "Follow 🐕🐾";
        }
        followBtn.classList.toggle("is-following", isFollowing);
      };

      followBtn.onclick = () => {
        const myFollowing = getFollowing();
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

    followersCountEl?.addEventListener("click", () => openFollowersList(d.id));
    followingCountEl?.addEventListener("click", () => openFollowingList(d.id));

    if (profileLikeBtn) {
      profileLikeBtn.onclick = () => togglePhotoLike(d.id);
      updatePhotoLikeUI(d.id);
    }

    if(dogStories){
      qa(".pp-story-item", profileContent).forEach(item => {
        item.addEventListener("click", ()=>{
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
      item.addEventListener("click", ()=>{
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

    // Azioni nel profilo DOG (chat + like/match)
const openChatBtn = $("btnOpenChat");
if (openChatBtn) {
  openChatBtn.onclick = () => openChat(d);
}

const likeDogBtn = $("btnLikeDog");
if (likeDogBtn) {
  likeDogBtn.addEventListener("click", () => {
    if (!d || !d.id) return;

    // segno il match come nello swipe LOVE
    state.matches[d.id] = true;
    localStorage.setItem("matches", JSON.stringify(state.matches));
  
  // --- consolido il match da swipe in Firestore per la tab "Match" ---
try {
  const selfUid = window.PLUTOO_UID || "anonymous";
  const dogId = d.id;
  const dogName = d.name || "";
  const dogAvatar = d.photo || d.avatar || "";

  if (selfUid && dogId && window.db) {
    const chatId = `${selfUid}_${dogId}`;
    const chatRef = db.collection("chats").doc(chatId);

    const nowTs = firebase.firestore.FieldValue.serverTimestamp();

    const chatPayload = {
      members: [selfUid],
      dogId,
      dogName,
      dogAvatar,
      match: true,
      lastMessageText: "",
      lastMessageAt: nowTs,
      updatedAt: nowTs,
    };

    chatRef.set(chatPayload, { merge: true }).catch(err => {
      console.error("Errore set chat swipe match:", err);
    });
  }
} catch (err) {
  console.error("Errore generale swipe match Firestore:", err);
}

    const nameForMatch =
      d.name || (state.lang === "it" ? "Nuovo match" : "New match");

    showMatchAnimation(nameForMatch, nextMatchColor);
    state.matchCount++;
    localStorage.setItem("matchCount", String(state.matchCount));
    nextMatchColor = ["💛", "💚", "🩵","❤️"][state.matchCount % 4];
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

  // Carica i messaggi da Firestore per una chat specifica
async function loadChatHistory(chatId, dog) {
  if (!db || !chatList || !chatId) return;

  try {
    const selfUid = window.PLUTOO_UID || "anonymous";

    // Leggo tutti i messaggi di questa chat ordinati per data
    const snap = await db
      .collection("messages")
      .where("chatId", "==", chatId)
      .orderBy("createdAt", "asc")
      .get();

    const dogName =
      (dog && dog.name) ||
      (state.lang === "en" ? "DOG" : "Dog");

    // Nessun messaggio → tengo il comportamento "Ciao DOG! 🐾"
    if (snap.empty) {
      chatList.innerHTML = "";
      const hello = document.createElement("div");
      hello.className = "msg";
      hello.textContent =
        state.lang === "it"
          ? `Ciao ${dogName}! 🐾`
          : `Hi ${dogName}! 🐾`;
      chatList.appendChild(hello);
      return;
    }

    // Ci sono messaggi → ricostruisco la conversazione completa
    chatList.innerHTML = "";

    snap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const text = data.text || "";
      if (!text) return;

      const bubble = document.createElement("div");
      const senderUid = data.senderUid || "";
      const isMe = senderUid === selfUid;

      // Stesso stile usato da sendChatMessage
      bubble.className = isMe ? "msg me" : "msg";
      bubble.textContent = text;
      chatList.appendChild(bubble);
    });

    // Scroll in fondo
    chatList.scrollTop = chatList.scrollHeight;
  } catch (err) {
    console.error("Errore loadChatHistory:", err);
  }
}

  // =========== Chat ===========
function openChat(chatIdOrDog, maybeDogId, maybeOtherUid) {
  if (!chatPane || !chatList || !chatInput) return;

  chatList.innerHTML = "";

  const selfUid = window.PLUTOO_UID || "anonymous";

  let dog = null;
  let dogId = "";
  let otherUid = "";
  let chatId = "";

  // Caso 1: openChat(dog) dal profilo
  if (typeof chatIdOrDog === "object" && chatIdOrDog) {
    dog = chatIdOrDog;
    dogId = dog.id || dog.dogId || chatPane.dataset.dogId || "";
    otherUid =
      dog.uid ||
      dog.ownerUid ||
      maybeOtherUid ||
      state.currentChatUid ||
      "unknown";

    // chatId deterministico come in sendChatMessage
    const pair = [selfUid, otherUid].sort();
    chatId = `${pair[0]}_${pair[1]}_${dogId}`;
  } else {
    // Caso 2: openChat(chatId, dogId, otherUid) da lista Messaggi
    chatId = chatIdOrDog || "";
    dogId = maybeDogId || chatPane.dataset.dogId || "";
    otherUid = maybeOtherUid || state.currentChatUid || "unknown";
  }

  const dogName =
    (dog && dog.name) ||
    (state.lang === "en" ? "DOG" : "Dog");

  // Mostro il pannello chat
  chatPane.classList.remove("hidden");
  chatPane.classList.add("show");

  // Metadati correnti
  chatPane.dataset.dogId = dogId;
  state.currentChatUid = otherUid;
  state.currentDogId = dogId;
  state.currentChatId = chatId;

  // Carico la history da Firestore se ho un chatId
  if (chatId) {
    loadChatHistory(chatId, dog || { name: dogName });
  } else {
    // Nessun chatId ancora → messaggio di benvenuto
    chatList.innerHTML = "";
    const hello = document.createElement("div");
    hello.className = "msg";
    hello.textContent =
      state.lang === "it"
        ? `Ciao ${dogName}! 🐾`
        : `Hi ${dogName}! 🐾`;
    chatList.appendChild(hello);
  }

  // Regole input: dopo 1 messaggio senza match blocco (se non Plus)
  const hasMatch = state.matches[dogId] || false;
  const msgCount = state.chatMessagesSent[dogId] || 0;

  if (!state.plus && !hasMatch && msgCount >= 1) {
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
}

  function closeChatPane(){
    chatPane.classList.remove("show");
    setTimeout(()=>chatPane.classList.add("hidden"), 250);
  }
  closeChat?.addEventListener("click", closeChatPane);

  chatComposer?.addEventListener("submit", (e)=>{
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    const dogId = chatPane.dataset.dogId || "unknown";
    const hasMatch = state.matches[dogId] || false;
    const msgCount = state.chatMessagesSent[dogId] || 0;

    if (!state.plus){
      if (msgCount === 0){
        if (state.rewardOpen) return;
        state.rewardOpen = true;
        showRewardVideoMock("chat", ()=>{
          state.rewardOpen = false;
          sendChatMessage(text, dogId, hasMatch, msgCount);
        });
        return;
      } else if (!hasMatch && msgCount >= 1){
        alert(state.lang==="it" ? "Serve un match per continuare a chattare!" : "Match needed to continue chatting!");
        return;
      }
    }

    sendChatMessage(text, dogId, hasMatch, msgCount);
  });

 async function sendChatMessage(text, dogId, hasMatch, msgCount){
  // bolla nella UI
  const bubble = document.createElement("div");
  bubble.className = "msg me";
  bubble.textContent = text;
  chatList.appendChild(bubble);
  chatInput.value = "";
  chatList.scrollTop = chatList.scrollHeight;

  // --- Salvataggio messaggio su Firestore ---
  try {
    const selfUid    = window.PLUTOO_UID || "anonymous";
    const receiverUid = state.currentChatUid || "unknown";

    const safeDogId =
      dogId ||
      chatPane.dataset.dogId ||
      (state.currentDogProfile && state.currentDogProfile.id) ||
      state.currentDogId ||
      "unknown";

    let chatId = state.currentChatId;
    if (!chatId) {
      const pair = [selfUid, receiverUid].sort();
      chatId = `${pair[0]}_${pair[1]}_${safeDogId}`;
      state.currentChatId = chatId;
    }

    const dogProfile = state.currentDogProfile || {};
    const dogName   = dogProfile.name || null;
    const dogAvatar = dogProfile.img || dogProfile.photoUrl || null;

    await db.collection("messages").add({
      chatId,
      senderUid: selfUid,
      receiverUid,
      text,
      type: "text",
      createdAt: FieldValue.serverTimestamp(),
      isRead: false
    });

    await db.collection("chats").doc(chatId).set({
      members: [selfUid, receiverUid],
      dogId: safeDogId || null,
      dogName: dogName,
      dogAvatar: dogAvatar,
      lastMessageText: text,
      lastMessageAt: FieldValue.serverTimestamp(),
      lastSenderUid: selfUid,
      match: !!(state.matches[safeDogId] || hasMatch)
    }, { merge: true });

  } catch (err) {
    console.error("Errore Firestore sendChatMessage", err);
  }

  const safeDogIdForCounter = dogId || chatPane.dataset.dogId || state.currentDogId || "unknown";

  state.chatMessagesSent[safeDogIdForCounter] = (msgCount || 0) + 1;
  localStorage.setItem("chatMessagesSent", JSON.stringify(state.chatMessagesSent));

  if (!state.plus && !state.matches[safeDogIdForCounter] && state.chatMessagesSent[safeDogIdForCounter] >= 1){
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
  function init(){
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
  init();

  function getVisibleMediaList(story) {
    const hasMatch = !!state.matches[story.userId];
    const hasFriendship = !!state.friendships[story.userId];
    return story.media.filter(m => m.privacy !== "private" || hasMatch || hasFriendship);
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

  function showToast(msg) {
    let el = $("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(()=>el.classList.remove("show"), 2000);
  }

  window.handleAndroidBack = function() {
  const viewer = document.getElementById("storyViewer");

  // Se la storia è aperta, chiudila e segnala ad Android che è gestito
  if (viewer && !viewer.classList.contains("hidden")) {
    viewer.classList.add("hidden");
    return "HANDLED";
  }

  // Nessuna storia aperta → Android può gestire il back normalmente
  return "NOT_HANDLED";
};

  init();
});
