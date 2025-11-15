// DEBUG TEMPORANEO: mostra qualsiasi errore JS
window.addEventListener("error", function (e) {
  alert("JS ERROR: " + e.message);
});

document.addEventListener("DOMContentLoaded", () => {

  // ============ Helpers ============
  const $  = (id) => document.getElementById(id);
  const qs = (s, r=document) => r.querySelector(s);
  const qa = (s, r=document) => Array.from(r.querySelectorAll(s));

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
  };

  // ============ DOM refs ============
  const homeScreen   = $("homeScreen");
  const appScreen    = $("appScreen");
  const heroLogo     = $("heroLogo");
  const btnEnter     = $("btnEnter");
  const sponsorLink  = $("sponsorLink");
  const sponsorLinkApp = $("sponsorLinkApp");
  const ethicsButton = $("ethicsButton");
  const btnBack      = $("btnBack");
  const btnPlus      = $("btnPlus");

  const mainTopbar = $("mainTopbar");
  const btnBackLove = $("btnBackLove");
  const btnBackPlay = $("btnBackPlay");

  const tabNearby = $("tabNearby");
  const tabLove   = $("tabLove");
  const tabPlay   = $("tabPlay");
  const tabLuoghi = $("tabLuoghi");
  const luoghiMenu = $("luoghiMenu");

  const viewNearby = $("viewNearby");
  const viewLove   = $("viewLove");
  const viewPlay   = $("viewPlay");
  const nearGrid   = $("nearGrid");

  const loveCard = $("loveCard");
  const loveImg  = $("loveImg");
  const loveTitleTxt = $("loveTitleTxt");
  const loveMeta = $("loveMeta");
  const loveBio  = $("loveBio");
  const loveNo   = $("loveNo");
  const loveYes  = $("loveYes");

  const playCard = $("playCard");
  const playImg  = $("playImg");
  const playTitleTxt = $("playTitleTxt");
  const playMeta  = $("playMeta");
  const playBio   = $("playBio");
  const playNo    = $("playNo");
  const playYes   = $("playYes");

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

  const adBanner = $("adBanner");
  const matchOverlay = $("matchOverlay");

  // ============ HOME: ENTRA (con animazione WOW) ============
  btnEnter?.addEventListener("click", () => {
    try { localStorage.setItem("entered", "1"); } catch(e){}
    state.entered = true;

    // reset & avvio animazione wow violet
    heroLogo?.classList.remove("heartbeat-violet", "heartbeat-violet-wow");
    void heroLogo?.offsetWidth;
    heroLogo?.classList.add("heartbeat-violet-wow");

    setTimeout(() => {
      homeScreen?.classList.add("hidden");
      appScreen?.classList.remove("hidden");
      document.body.classList.remove("story-open");
      initStories();             // stories dopo ingresso
      setActiveView("nearby");
      showAdBanner();
    }, 900);
  });

  // Auto-restore nel caso fosse già entrato
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
      love: "Amore",
      friendship: "Amicizia",
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
      // 🔹 tolto <strong> dal testo
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
      love: "Love",
      friendship: "Friendship",
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
      // 🔹 tolto <strong> anche qui
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
  function autodetectLang(){ return (navigator.language||"it").toLowerCase().startsWith("en")?"en":"it"; }

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
      social:{ facebook:{enabled:true,url:"https://facebook.com/luna.owner"},
               instagram:{enabled:true,url:"https://instagram.com/luna_golden"},
               tiktok:{enabled:false,url:""} } },
    { id:"d2", name:"Rex", age:4, breed:"Pastore Tedesco", km:3.4, img:"dog2.jpg",
      bio:"Fedele e giocherellone.", mode:"friendship", sex:"M", verified:true,
      weight:35, height:62, pedigree:true, breeding:true, size:"large",
      social:{ facebook:{enabled:false,url:""},
               instagram:{enabled:true,url:"https://instagram.com/rex_pastore"},
               tiktok:{enabled:true,url:"https://tiktok.com/@rexdog"} } },
    { id:"d3", name:"Maya", age:3, breed:"Bulldog Francese", km:2.1, img:"dog3.jpg",
      bio:"Coccole e passeggiate.", mode:"love", sex:"F", verified:false,
      weight:12, height:30, pedigree:false, breeding:false, size:"small",
      social:{ facebook:{enabled:true,url:"https://facebook.com/maya.owner"},
               instagram:{enabled:true,url:"https://instagram.com/maya_frenchie"},
               tiktok:{enabled:false,url:""} } },
    { id:"d4", name:"Rocky", age:5, breed:"Beagle", km:4.0, img:"dog4.jpg",
      bio:"Sempre in movimento.", mode:"friendship", sex:"M", verified:true,
      weight:15, height:38, pedigree:true, breeding:false, size:"medium",
      social:{ facebook:{enabled:false,url:""},
               instagram:{enabled:true,url:"https://instagram.com/rocky_beagle"},
               tiktok:{enabled:true,url:"https://tiktok.com/@rockybeagle"} } },
    { id:"d5", name:"Chicco", age:1, breed:"Barboncino", km:0.8, img:"dog5.jpg",
      bio:"Piccolo fulmine.", mode:"love", sex:"M", verified:true,
      weight:8, height:28, pedigree:false, breeding:false, size:"small",
      social:{ facebook:{enabled:true,url:"https://facebook.com/chicco.owner"},
               instagram:{enabled:false,url:""},
               tiktok:{enabled:false,url:""} } },
    { id:"d6", name:"Kira", age:6, breed:"Labrador", km:5.1, img:"dog6.jpg",
      bio:"Acqua e palla.", mode:"friendship", sex:"F", verified:true,
      weight:30, height:58, pedigree:true, breeding:true, size:"large",
      social:{ facebook:{enabled:true,url:"https://facebook.com/kira.owner"},
               instagram:{enabled:true,url:"https://instagram.com/kira_labrador"},
               tiktok:{enabled:true,url:"https://tiktok.com/@kiralab"} } },
    { id:"d7", name:"Toby", age:2, breed:"Husky", km:2.8, img:"dog7.jpg",
      bio:"Energia pura.", mode:"love", sex:"M", verified:true,
      weight:25, height:54, pedigree:true, breeding:true, size:"medium",
      social:{ facebook:{enabled:false,url:""},
               instagram:{enabled:true,url:"https://instagram.com/toby_husky"},
               tiktok:{enabled:false,url:""} } },
    { id:"d8", name:"Bella", age:4, breed:"Cocker Spaniel", km:1.5, img:"dog8.jpg",
      bio:"Dolce compagna.", mode:"friendship", sex:"F", verified:false,
      weight:14, height:40, pedigree:false, breeding:false, size:"medium",
      social:{ facebook:{enabled:true,url:"https://facebook.com/bella.owner"},
               instagram:{enabled:true,url:"https://instagram.com/bella_cocker"},
               tiktok:{enabled:true,url:"https://tiktok.com/@bellacocker"} } },
  ];

  // ============ Razze ============
  fetch("breeds.json").then(r=>r.json()).then(arr=>{
    if (Array.isArray(arr)) state.breeds = arr.sort();
  }).catch(()=>{ state.breeds = [
    "Barboncino","Bassotto","Beagle","Border Collie","Bulldog Francese",
    "Carlino","Chihuahua","Cocker Spaniel","Golden Retriever","Husky",
    "Jack Russell","Labrador","Maltese","Pastore Tedesco","Shih Tzu"
  ].sort(); });

  // ============ Geolocalizzazione ============
  if (navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      p=>{ state.geo = { lat:p.coords.latitude, lon:p.coords.longitude }; },
      ()=>{}, { enableHighAccuracy:true, timeout:5000, maximumAge:60000 }
    );
  }

  // ============ Restore in APP ============
  if (state.entered) {
    homeScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    setActiveView("nearby");
    showAdBanner();
  }

  // ============ Sponsor Ufficiale ============
function openSponsor(){
  const url = "https://www.gelatofido.it/";

  // Se hai Plus → niente reward
  if (state.plus){
    window.open(url, "_blank", "noopener");
    return;
  }

  // Evita doppio click
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
    alert(state.lang==="it" ? `Plutoo Plus attivato! 💎\nPiano: ${price}` : `Plutoo Plus activated! 💎\nPlan: ${price}`);
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
  tabPlay?.addEventListener("click",   ()=>setActiveView("friendship"));

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

  function setActiveView(name){
    localStorage.setItem("lastView", name);
    if (state.currentView !== name && state.currentView !== "profile"){
      state.viewHistory.push(state.currentView);
    }
    state.currentView = name;

    [viewNearby, viewLove, viewPlay].forEach(v=>v?.classList.remove("active"));
    [tabNearby, tabLove, tabPlay].forEach(t=>t?.classList.remove("active"));

    if (name === "profile"){ mainTopbar?.classList.add("hidden"); }
    else { mainTopbar?.classList.remove("hidden"); }

    const storiesBar = $("storiesBar");
    if(storiesBar){
      if(name === "nearby"){ storiesBar.classList.remove("hidden"); }
      else { storiesBar.classList.add("hidden"); }
    }

    if (name==="nearby"){
      viewNearby.classList.add("active");
      tabNearby.classList.add("active");
      renderNearby();
      if(btnSearchPanel) btnSearchPanel.disabled=false;
    }
    if (name==="love"){
      viewLove.classList.add("active");
      tabLove.classList.add("active");
      renderSwipe("love");
      if(btnSearchPanel) btnSearchPanel.disabled=true;
    }
    if (name==="friendship"){
      viewPlay.classList.add("active");
      tabPlay.classList.add("active");
      renderSwipe("friendship");
      if(btnSearchPanel) btnSearchPanel.disabled=true;
    }

    window.scrollTo({top:0,behavior:"smooth"});
  }

  btnBack?.addEventListener("click", ()=> goBack() );
  btnBackLove?.addEventListener("click", ()=> goBack() );
  btnBackPlay?.addEventListener("click", ()=> goBack() );

  function goBack(){
    // 1) Viewer Stories overlay?
    const storyViewer = $("storyViewer");
    if (storyViewer && !storyViewer.classList.contains("hidden")){
      closeStoryViewer();
      return;
    }

    // 2) Modale Upload Story?
    const uploadStoryModal = $("uploadStoryModal");
    if (uploadStoryModal && !uploadStoryModal.classList.contains("hidden")){
      closeUploadModal();
      return;
    }

    // 3) Modale Plus?
    if (plusModal && !plusModal.classList.contains("hidden")){
      closePlusModal();
      return;
    }

    // 4) Pannello Ricerca?
    if (searchPanel && !searchPanel.classList.contains("hidden")){
      searchPanel.classList.add("hidden");
      searchPanel.style.display = "none";
      return;
    }

    // 5) Chat aperta?
    if (chatPane && !chatPane.classList.contains("hidden") && chatPane.classList.contains("show")){
      closeChatPane();
      return;
    }

    // 6) Pagina profilo?
    if (state.currentView === "profile"){
      closeProfilePage();
      return;
    }

    // 7) Deck → Nearby
    if (state.currentView === "love" || state.currentView === "friendship"){
      setActiveView("nearby");
      return;
    }

    // 8) Sei in Nearby → conferma ritorno Home
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
    // distanza: se d.km non esiste, il DOG è comunque incluso
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
        if (matchChance > 0.5){
          if(mode === "love"){
            state.matches[d.id] = true;
            localStorage.setItem("matches", JSON.stringify(state.matches));
          } else {
            state.friendships[d.id] = true;
            localStorage.setItem("friendships", JSON.stringify(state.friendships));
          }
          showMatchAnimation();
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

    if(yesBtn){
      yesBtn.onclick = ()=>{
        if(state.processingSwipe) return;
        card.classList.add("swipe-out-right");
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

  function showMatchAnimation(){
    if (!matchOverlay) return;
    matchOverlay.classList.remove("hidden");
    setTimeout(()=>{ matchOverlay.classList.add("hidden"); }, 1200);
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
  function generateSocialSection(dog) {
    if (!dog.social) return "";
    const enabled = [];

    // Facebook
    if (dog.social.facebook?.enabled && dog.social.facebook.url) {
      enabled.push({
        name: "Facebook",
        url: dog.social.facebook.url,
        class: "social-fb",
        icon: `<svg class="social-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`
      });
    }

    // Instagram
    if (dog.social.instagram?.enabled && dog.social.instagram.url) {
      enabled.push({
        name: "Instagram",
        url: dog.social.instagram.url,
        class: "social-ig",
        icon: `<svg class="social-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#E4405F" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.59-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`
      });
    }

    // TikTok
    if (dog.social.tiktok?.enabled && dog.social.tiktok.url) {
      enabled.push({
        name: "TikTok",
        url: dog.social.tiktok.url,
        class: "social-tt",
        icon: `<svg class="social-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#FFFFFF" d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>`
      });
    }

    if (!enabled.length) return "";

    return `
      <div class="pp-docs-section" style="margin-top:1.2rem">
        <h4 class="section-title" style="margin-top:0;font-size:1rem">
          ${state.lang === "it" ? "📱 Social Proprietario" : "📱 Owner's Social"}
        </h4>
        <div class="pp-social-grid">
          ${enabled.map(s => `
            <button class="social-btn ${s.class}" data-url="${s.url}" data-dog-id="${dog.id}" data-social="${s.class}">
              <div class="social-icon">${s.icon}</div>
              <div class="social-label">${s.name}</div>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  // ============ Profilo DOG (con Stories + Social) ============
  window.openProfilePage = (d)=>{
    state.currentDogProfile = d;
    setActiveView("profile");

    history.pushState({view: "profile", dogId: d.id}, "", "");

    profilePage.classList.remove("hidden");

    const selfieUnlocked = isSelfieUnlocked(d.id);
    const hasMatch = state.matches[d.id] || false;
    const hasFriendship = state.friendships[d.id] || false;
    const ownerDocs = state.ownerDocsUploaded[d.id] || {};
    const dogDocs = state.dogDocsUploaded[d.id] || {};

    const dogStories = StoriesState.stories.find(s => s.userId === d.id);
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
      <div class="pp-hero"><img src="${d.img}" alt="${d.name}"></div>
      <div class="pp-head">
        <h2 class="pp-name">${d.name} ${d.verified?"✅":""}</h2>
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
        <img class="img" src="${d.img}" alt="Selfie">
        <div class="over">
          <button id="unlockSelfie" class="btn accent small">${selfieUnlocked?(state.lang==="it"?"Sbloccato 24h":"Unlocked 24h"):(state.lang==="it"?"Sblocca selfie":"Unlock selfie")}</button>
          <button id="uploadSelfie" class="btn accent small">${state.lang==="it"?"Carica selfie":"Upload selfie"}</button>
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
        <button id="btnDislikeDog" class="btn outline">🥲 ${state.lang==="it"?"Passa":"Pass"}</button>
        <button id="btnOpenChat" class="btn primary">${state.lang==="it"?"Apri chat":"Open chat"}</button>
        <button id="btnFriendship" class="btn accent">🐕 ${t("friendship")}</button>
      </div>
    `;

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
        lb.innerHTML = `<button class="close" aria-label="Chiudi">✕</button><img src="${img.src}" alt="">`;
        document.body.appendChild(lb);
        qs(".close", lb).onclick = ()=> lb.remove();
        lb.addEventListener("click", (e)=>{ if(e.target===lb) lb.remove(); });
      });
    });

    qa(".doc-item", profileContent).forEach(item=>{
      item.addEventListener("click", ()=>{
        const docType = item.getAttribute("data-doc");
        const docCategory = item.getAttribute("data-type");

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

        openProfilePage(d);
      });
    });

    qa(".social-btn", profileContent).forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const url = btn.getAttribute("data-url");
        const dogId = btn.getAttribute("data-dog-id");
        const socialType = btn.getAttribute("data-social");
        if (!url) return;

        const rewardKey = `${dogId}_${socialType}`;

        if (state.plus || state.socialRewardViewed[rewardKey]) {
          window.open(url, "_blank", "noopener");
          return;
        }
        if (state.rewardOpen) return;
        state.rewardOpen = true;

        showRewardVideoMock("social", ()=>{
          state.rewardOpen = false;
          state.socialRewardViewed[rewardKey] = true;
          localStorage.setItem("socialRewardViewed", JSON.stringify(state.socialRewardViewed));
          window.open(url, "_blank", "noopener");
        });
      });
    });

    // Chat / amicizia / selfie
    $("btnOpenChat").onclick = ()=> { openChat(d); };
    $("btnFriendship").onclick = ()=>{
      state.friendships[d.id] = true;
      localStorage.setItem("friendships", JSON.stringify(state.friendships));
      alert(state.lang==="it" ? "Richiesta di amicizia inviata! 🐕" : "Friendship request sent! 🐕");
    };
    $("uploadSelfie").onclick = ()=> alert(state.lang==="it" ? "Upload selfie (mock)" : "Upload selfie (mock)");
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

  // ============ Chat ============
  function openChat(dog){
    const hasMatch = state.matches[dog.id] || false;
    const msgCount = state.chatMessagesSent[dog.id] || 0;

    chatPane.classList.remove("hidden");
    chatPane.classList.add("show");
    chatPane.dataset.dogId = dog.id;
    chatList.innerHTML = `<div class="msg">${state.lang==="it"?"Ciao":"Hi"} ${dog.name}! 🐾</div>`;
    chatInput.value="";

    if (!state.plus){
      if (!hasMatch && msgCount >= 1){
        chatInput.disabled = true;
        chatInput.placeholder = state.lang==="it" ? "Match necessario per continuare" : "Match needed to continue";
      } else {
        chatInput.disabled = false;
        chatInput.placeholder = state.lang==="it" ? "Scrivi un messaggio…" : "Type a message…";
      }
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

  function sendChatMessage(text, dogId, hasMatch, msgCount){
    const bubble = document.createElement("div");
    bubble.className="msg me";
    bubble.textContent=text;
    chatList.appendChild(bubble);
    chatInput.value="";
    chatList.scrollTop = chatList.scrollHeight;

    state.chatMessagesSent[dogId] = (msgCount || 0) + 1;
    localStorage.setItem("chatMessagesSent", JSON.stringify(state.chatMessagesSent));

    if (!state.plus && !hasMatch && state.chatMessagesSent[dogId] >= 1){
      chatInput.disabled = true;
      chatInput.placeholder = state.lang==="it" ? "Match necessario per continuare" : "Match needed to continue";
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
        social: "🎬 Reward Video Mock\n(apertura profilo social)\n\nTipo: Social Unlock"
      },
      en: {
        swipe: `🎬 Reward Video Mock\n\nSwipe: ${state.swipeCount}\nNext threshold: ${state.nextRewardAt}\n\nType: Swipe Unlock`,
        selfie: "🎬 Reward Video Mock\n(before viewing selfie)\n\nType: Selfie Unlock",
        chat: "🎬 Reward Video Mock\n(first message)\n\nType: Chat Unlock",
        services: "🎬 Reward Video Mock\n(vets/groomers/shops)\n\nType: Services",
        social: "🎬 Reward Video Mock\n(opening social profile)\n\nType: Social Unlock"
      }
    };
    const text = msg[state.lang][type] || msg.it[type];
    alert(text);
    if (onClose) onClose();
  }

  // ============ Init ============
  function init(){
    applyTranslations();

    // Preload immagini
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
  // initStories() parte dopo ENTRA per effetto WOW
}
  }
  init();

  // ============ STORIES – Config & State (inizio) ============
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

  // 🔹 helper privacy: quali media sono visibili a questo utente per quello userId
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

    // Chiudi story cliccando sullo sfondo scuro
    const viewer = $("storyViewer");
    if (viewer) {
      viewer.addEventListener("click", (e) => {
        if (e.target === viewer) closeStoryViewer();
      });
    }

    // ESC per chiudere
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const viewer = $("storyViewer");
        if (viewer && !viewer.classList.contains("hidden")) {
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
      if (!visibleMedia.length) return; // tutte private e niente match/amicizia → non mostrare cerchio

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

  function openStoryViewerFromBar(userId) {
    const story = StoriesState.stories.find((s) => s.userId === userId);
    if (!story) return;

    const visibleMedia = getVisibleMediaList(story);
    if (!visibleMedia.length) {
      showToast(state.lang==="it" ? "🔒 Story privata: serve un match o amicizia" : "🔒 Private story: match or friendship required");
      return;
    }

    // Nessun reward video: entra subito
    openStoryViewerDirect(userId);
  }

  function openStoryViewerDirect(userId) {
    StoriesState.currentStoryUserId = userId;
    StoriesState.currentMediaIndex = 0;
    StoriesState.openedFrom = "bar";

    $("storyViewer")?.classList.remove("hidden");
    document.body.classList.add("noscroll");
    document.body.classList.add("story-open");

    renderStoryViewer();
    startStoryProgress();
  }

  function openDogStoryViewer(userId, mediaIndex = 0) {
    const story = StoriesState.stories.find((s) => s.userId === userId);
    if (!story) return;

    const visibleMedia = getVisibleMediaList(story);
    if (!visibleMedia.length) {
      showToast(state.lang==="it" ? "🔒 Story privata: serve un match o amicizia" : "🔒 Private story: match or friendship required");
      return;
    }

    StoriesState.currentStoryUserId = userId;
    StoriesState.currentMediaIndex = Math.min(mediaIndex, visibleMedia.length - 1);
    StoriesState.openedFrom = "profile";

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
      closeStoryViewer();
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

    // Se la story era stata aperta dal profilo, resta nel profilo
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

  // Flash ingresso bianco (facoltativo)
  function triggerFlash() {
    const el = document.getElementById("flashOverlay");
    if (!el) return;
    el.classList.add("active");
    setTimeout(() => el.classList.remove("active"), 900);
  }

  function playStoryMusic(musicId) {
    // Hook per player musicale in futuro
    console.log("🎵 Playing music:", musicId);
  }

  // Deleghe aggiuntive per cerchi story in qualunque sezione
  document.addEventListener("click", (e) => {
    if (e.target.closest("#storiesBar")) return; // la home ha già il suo listener
    const el = e.target.closest(".story-circle");
    if (!el || el.id === "addStoryBtn") return;
    const dogId = el.getAttribute("data-dog-id") || el.getAttribute("data-id");
    if (!dogId) return;
    openStoryViewerFromBar(dogId);
  });

  // Click su bar principale (se la struttura HTML usa id="storiesBar")
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

  // pulizia iniziale
  preview.innerHTML = "";
  preview.dataset.type = "";
  preview.dataset.hasMedia = "false";

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    alert("Formato non supportato. Usa solo foto o video.");
    return;
  }

  // limiti dimensione (usiamo la config già esistente)
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
    const base64 = event.target.result; // data:image/...;base64,...

    // salviamo in stato in modo persistente
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

  // avvia lettura → Base64
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
    const filters = ["none", "warm", "cool", "bw", "vintage"];
    const grid = $("filtersGrid");
    if (!grid) return;
    grid.innerHTML = "";
    filters.forEach(f => {
      const btn = document.createElement("button");
      btn.className = `filter-btn ${f}`;
      btn.textContent = f;
      btn.addEventListener("click", () => {
        $("storyPreview").dataset.filter = f;
        $("storyPreview").className = f;
      });
      grid.appendChild(btn);
    });
  }

  function publishStory() {
    const preview = $("storyPreview");
    if (!preview) return;

    const mediaType = preview.dataset.type || "image";
    const filter = preview.dataset.filter || "none";
    const el = preview.querySelector("img, video");
    if (!el) return;

    // 🔹 privacy: prende valore da select se esiste, altrimenti public
    const privacy = $("storyPrivacySelect") ? $("storyPrivacySelect").value : "public";

    const media = {
      type: mediaType,
      url: el.src,
      timestamp: Date.now(),
      filter,
      viewed: false,
      music: "",
      privacy
    };

    const myId = "me";
    const existing = StoriesState.stories.find(s => s.userId === myId);
    if (existing) {
      existing.media.unshift(media);
    } else {
      StoriesState.stories.unshift({
        userId: myId,
        userName: "Me",
        avatar: "assets/avatar_me.png",
        media: [media]
      });
    }

    StoriesState.saveStories();
    closeUploadModal();
    renderStoriesBar();
    showToast("Story pubblicata!");
  }

  function showToast(msg) {
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2300);
  }

}); // EOF
