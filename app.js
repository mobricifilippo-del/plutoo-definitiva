// DEBUG TEMPORANEO: mostra qualsiasi errore JS
window.addEventListener("error", function (e) {
  alert("JS ERROR: " + e.message);
});

document.addEventListener("DOMContentLoaded", () => {

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
  let nextMatchColor = ["💛","❤️","💜","💚"][state.matchCount % 4];

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
    bio:"Dolce compagna.", mode:"friendship", sex:"F", v
