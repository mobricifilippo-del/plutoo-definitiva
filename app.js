/* =========================================================
   PLUTOO – app.js (Gold Edition, esteso)
   Palette: viola-notte + oro (niente rosa/blu)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  // ---------------- Helpers ----------------
  const $  = (id) => document.getElementById(id);
  const qs = (s, r=document) => r.querySelector(s);
  const qa = (s, r=document) => Array.from(r.querySelectorAll(s));

  // ---------------- DOM refs ----------------
  const homeScreen   = $("homeScreen");
  const appScreen    = $("appScreen");
  const heroLogo     = $("heroLogo");
  const btnEnter     = $("btnEnter");
  const sponsorLink  = $("sponsorLink");
  const ethicsButton = $("ethicsButton");
  const ethicsButtonApp = $("ethicsButtonApp");
  const btnBack      = $("btnBack");

  const tabNearby = $("tabNearby");
  const tabLove   = $("tabLove");
  const tabSocial = $("tabSocial");
  const tabLuoghi = $("tabLuoghi");
  const luoghiMenu = $("luoghiMenu");
  const tabPlus   = $("tabPlus");

  const viewNearby = $("viewNearby");
  const viewLove   = $("viewLove");
  const viewSocial = $("viewSocial");
  const nearGrid   = $("nearGrid");

  const loveCard = $("loveCard");
  const loveImg  = $("loveImg");
  const loveTitleTxt = $("loveTitleTxt");
  const loveMeta = $("loveMeta");
  const loveBio  = $("loveBio");
  const loveNo   = $("loveNo");
  const loveYes  = $("loveYes");

  const socialCard = $("socialCard");
  const socialImg  = $("socialImg");
  const socialTitleTxt = $("socialTitleTxt");
  const socialMeta  = $("socialMeta");
  const socialBio   = $("socialBio");
  const socialNo    = $("socialNo");
  const socialYes   = $("socialYes");

  const btnSearchPanel = $("btnSearchPanel");
  const searchPanel = $("searchPanel");
  const closeSearch = $("closeSearch");
  const breedInput  = $("breedInput");
  const breedsList  = $("breedsList");
  const distRange   = $("distRange");
  const distLabel   = $("distLabel");
  const onlyVerified = $("onlyVerified");
  const sexFilter   = $("sexFilter");
  const weightInput = $("weightInput");
  const heightInput = $("heightInput");
  const applyFilters = $("applyFilters");
  const resetFilters = $("resetFilters");

  const chatPane   = $("chatPane");
  const closeChat  = $("closeChat");
  const chatList   = $("chatList");
  const chatComposer = $("chatComposer");
  const chatInput  = $("chatInput");

  const profileSheet = $("profileSheet");
  const ppBody   = $("ppBody");

  // ---------------- Splash on load ----------------
  makeSplash();

  function makeSplash(){
    const wrap = document.createElement("div");
    wrap.id = "plutooSplash";
    wrap.style.cssText = "position:fixed;inset:0;background:#000;display:flex;align-items:center;justify-content:center;z-index:1000";
    wrap.innerHTML = `
      <div style="text-align:center">
        <img id="splashLogo" src="plutoo-icon-512.png" alt="Plutoo" style="width:120px;height:120px;opacity:0;transform:scale(.9);filter:drop-shadow(0 0 24px rgba(205,164,52,.35));transition:all .8s ease">
        <div id="splashText" style="margin-top:8px;color:#CDA434;font-weight:800;opacity:0;transition:opacity .8s ease">Plutoo</div>
      </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(()=>{
      $("splashLogo").style.opacity = "1";
      $("splashLogo").style.transform = "scale(1)";
      $("splashText").style.opacity = "1";
    });
    setTimeout(()=>wrap.remove(), 1400);
  }

  // ---------------- Stato ----------------
  const state = {
    lang: (localStorage.getItem("lang") || autodetectLang()),
    plus: localStorage.getItem("plutoo_plus")==="1",
    entered: localStorage.getItem("entered")==="1",
    swipeCount: parseInt(localStorage.getItem("swipes")||"0"),
    matches: parseInt(localStorage.getItem("matches")||"0"),
    firstMsgRewardByDog: JSON.parse(localStorage.getItem("firstMsgRewardByDog")||"{}"),
    selfieUntilByDog: JSON.parse(localStorage.getItem("selfieUntilByDog")||"{}"),
    currentLoveIdx: 0,
    currentSocialIdx: 0,
    filters: {
      breed: localStorage.getItem("f_breed") || "",
      distKm: parseInt(localStorage.getItem("f_distKm")||"5"),
      verified: localStorage.getItem("f_verified")==="1",
      sex: localStorage.getItem("f_sex") || "", // "", "M", "F"
      // Gold fields (disabilitati finché non Plus)
      weight: localStorage.getItem("f_weight") || "",
      height: localStorage.getItem("f_height") || ""
    },
    geo: null,
    breeds: []
  };

  // ---------------- I18N min ----------------
  const I18N = {
    it: { sponsorUrl:"https://example.com/fido-gelato", mapsShelters:"canili vicino a me", noProfiles:"Nessun profilo. Modifica i filtri."},
    en: { sponsorUrl:"https://example.com/fido-gelato", mapsShelters:"animal shelters near me", noProfiles:"No profiles. Adjust filters."}
  };
  const t = (k) => (I18N[state.lang] && I18N[state.lang][k]) || k;
  function autodetectLang(){ return (navigator.language||"it").toLowerCase().startsWith("en")?"en":"it"; }

  // ---------------- Dati mock ----------------
  const DOGS = [
    { id:"d1", name:"Luna",  age:2, breed:"Golden Retriever", km:1.2, img:"dog1.jpg", bio:"Dolcissima e curiosa.", mode:"love",   sex:"F", verified:true  },
    { id:"d2", name:"Rex",   age:4, breed:"Pastore Tedesco",  km:3.4, img:"dog2.jpg", bio:"Fedele e giocherellone.", mode:"social", sex:"M", verified:true  },
    { id:"d3", name:"Maya",  age:3, breed:"Bulldog Francese", km:2.1, img:"dog3.jpg", bio:"Coccole e passeggiate.",  mode:"love",   sex:"F", verified:false },
    { id:"d4", name:"Rocky", age:5, breed:"Beagle",           km:4.0, img:"dog4.jpg", bio:"Sempre in movimento.",    mode:"social", sex:"M", verified:true  },
    { id:"d5", name:"Chicco",age:1, breed:"Barboncino",       km:0.8, img:"dog1.jpg", bio:"Piccolo fulmine.",        mode:"love",   sex:"M", verified:true  },
    { id:"d6", name:"Kira",  age:6, breed:"Labrador",         km:5.1, img:"dog2.jpg", bio:"Acqua e palla.",          mode:"social", sex:"F", verified:true  },
  ];

  // Breeds (prefisso); se c’è breeds.json lo usiamo
  fetch("breeds.json").then(r=>r.json()).then(arr=>{
    if (Array.isArray(arr)) state.breeds = arr;
  }).catch(()=>{ state.breeds = [
    "Pastore Tedesco","Labrador","Golden Retriever","Jack Russell",
    "Bulldog Francese","Barboncino","Border Collie","Chihuahua",
    "Carlino","Beagle","Maltese","Shih Tzu","Husky","Bassotto","Cocker Spaniel"
  ];});

  // Geo (facoltativo)
  if ("geolocation" in navigator){
    navigator.geolocation.getCurrentPosition(
      p=>{ state.geo = { lat:p.coords.latitude, lon:p.coords.longitude }; },
      ()=>{}, { enableHighAccuracy:true, timeout:5000, maximumAge:60000 }
    );
  }

  // ---------------- HOME ↔ APP ----------------
  initHome();

  function initHome(){
    // mostra home o app in base allo stato
    if (state.entered){ homeScreen.classList.add("hidden"); appScreen.classList.remove("hidden"); }
    // Entra: pulse e passa ad app
    btnEnter?.addEventListener("click", ()=>{
      heroLogo.classList.add("pulse");
      setTimeout(()=>{
        heroLogo.classList.remove("pulse");
        state.entered=true; localStorage.setItem("entered","1");
        homeScreen.classList.add("hidden");
        appScreen.classList.remove("hidden");
        setActiveView("nearby");
      }, 900);
    });

    // Sponsor con reward
    sponsorLink?.addEventListener("click",(e)=>{
      e.preventDefault();
      reward("Video prima di aprire lo sponsor").then(()=>{
        window.open(t("sponsorUrl"), "_blank", "noopener");
      });
    });

    // Etico canili
    [ethicsButton, ethicsButtonApp].forEach(b=>{
      b?.addEventListener("click", async ()=>{
        await reward("Video prima di aprire Google Maps (canili)");
        openSheltersMaps();
      });
    });
  }

  // ---------------- Tabs & Views ----------------
  tabNearby?.addEventListener("click", ()=>setActiveView("nearby"));
  tabLove?.addEventListener("click",   ()=>setActiveView("love"));
  tabSocial?.addEventListener("click", ()=>setActiveView("social"));

  // Luoghi Pet menu (toggle)
  tabLuoghi?.addEventListener("click",(e)=>{
    e.stopPropagation();
    tabLuoghi.parentElement.classList.toggle("open");
  });
  document.addEventListener("click",()=>tabLuoghi?.parentElement.classList.remove("open"));

  qa(".menu-item", luoghiMenu).forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const cat = btn.getAttribute("data-cat");
      tabLuoghi.parentElement.classList.remove("open");
      await reward("Video prima di aprire Google Maps");
      openMapsCategory(cat);
    });
  });

  function setActiveView(name){
    [viewNearby, viewLove, viewSocial].forEach(v=>v?.classList.remove("active"));
    [tabNearby, tabLove, tabSocial].forEach(t=>t?.classList.remove("active"));

    if (name==="nearby"){ viewNearby.classList.add("active"); tabNearby.classList.add("active"); renderNearby(); btnSearchPanel.disabled=false; }
    if (name==="love"){   viewLove.classList.add("active");   tabLove.classList.add("active");   renderSwipe("love"); btnSearchPanel.disabled=true; }
    if (name==="social"){ viewSocial.classList.add("active"); tabSocial.classList.add("active"); renderSwipe("social"); btnSearchPanel.disabled=true; }

    window.scrollTo({top:0,behavior:"smooth"});
  }

  // Back
  btnBack?.addEventListener("click", ()=>{
    if (!viewNearby.classList.contains("active")) { setActiveView("nearby"); return; }
    if (confirm("Tornare alla Home?")){
      localStorage.removeItem("entered");
      state.entered=false;
      appScreen.classList.add("hidden");
      homeScreen.classList.remove("hidden");
    }
  });

  // ---------------- Monetizzazione mock ----------------
  function reward(msg="Guarda un breve video per continuare"){
    if (state.plus) return Promise.resolve(true);
    return new Promise(res=>{
      const panel = document.createElement("div");
      panel.className = "panel";
      panel.innerHTML = `
        <div class="panel-inner center" style="text-align:center">
          <h3 style="color:#CDA434">🎬 ${msg}</h3>
          <p class="soft">Mock demo: non vengono caricate pubblicità reali.</p>
          <button id="rwStart" class="btn primary">Guarda ora</button>
        </div>`;
      document.body.appendChild(panel);
      $("rwStart").onclick = ()=>{
        qs(".panel-inner",panel).innerHTML = `<h3 style="color:#CDA434">Video in riproduzione…</h3>`;
        setTimeout(()=>{ panel.remove(); res(true); }, 2200);
      };
    });
  }
  window.openPlusDialog = ()=>{
    const panel = document.createElement("div");
    panel.className="panel";
    panel.innerHTML = `
      <div class="panel-inner center" style="text-align:center">
        <h3 style="color:#CDA434">✨ Plutoo Plus</h3>
        <p class="soft">Niente video, filtri Gold sbloccati, selfie illimitati (mock).</p>
        <button id="plOn" class="btn primary">Attiva ora</button>
        <button id="plOff" class="btn ghost small" style="margin-top:.6rem">${state.plus?"Disattiva":"Chiudi"}</button>
      </div>`;
    document.body.appendChild(panel);
    $("plOn").onclick = ()=>{ state.plus=true; localStorage.setItem("plutoo_plus","1"); panel.remove(); alert("Plutoo Plus attivato!"); enableGoldInputs(); };
    $("plOff").onclick = ()=> panel.remove();
  };

  // ---------------- Nearby (grid 2×N) ----------------
  function renderNearby(){
    const list = filteredDogs();
    if (!list.length){ nearGrid.innerHTML = `<p class="soft" style="padding:.5rem">${t("noProfiles")}</p>`; return; }
    nearGrid.innerHTML = list.map(cardHTML).join("");
    qa(".dog-card").forEach(card=>{
      const id = card.getAttribute("data-id");
      const d  = DOGS.find(x=>x.id===id);
      const img = qs("img", card);
      img?.addEventListener("click", ()=>openProfile(d));
      qs(".open-profile", card)?.addEventListener("click", async ()=>{
        await reward("Video prima di aprire il profilo");
        openProfile(d);
      });
    });
  }
  function cardHTML(d){
    return `
      <article class="card dog-card" data-id="${d.id}">
        <img src="${d.img}" alt="${d.name}" class="card-img" />
        <div class="card-info">
          <h3>${d.name} ${d.verified?"✅":""}</h3>
          <p class="meta">${d.breed} · ${d.age} ${state.lang==="it"?"anni":"yrs"} · ${fmtKm(d.km)}</p>
          <p class="bio">${d.bio||""}</p>
        </div>
        <div class="card-actions">
          <button class="btn ghost small open-profile">Apri profilo</button>
        </div>
      </article>`;
  }
  const fmtKm = n => `${n.toFixed(1)} km`;

  function filteredDogs(){
    const f = state.filters;
    return DOGS
      .filter(d => d.km <= (f.distKm||999))
      .filter(d => (!f.verified ? true : d.verified))
      .filter(d => (!f.sex ? true : d.sex===f.sex))
      .filter(d => (!f.breed ? true : d.breed.toLowerCase().startsWith(f.breed.toLowerCase())))
      .filter(d => (!state.plus ? true : true)); // (peso/altezza reali in fase backend)
  }

  // ---------------- Swipe Decks ----------------
  function renderSwipe(mode){
    const deck = DOGS.filter(d=>d.mode===mode);
    const idx = (mode==="love"?state.currentLoveIdx:state.currentSocialIdx) % (deck.length||1);
    const d = deck[idx] || DOGS[0];

    const img   = mode==="love" ? loveImg : socialImg;
    const title = mode==="love" ? loveTitleTxt : socialTitleTxt;
    const meta  = mode==="love" ? loveMeta : socialMeta;
    const bio   = mode==="love" ? loveBio : socialBio;
    const card  = mode==="love" ? loveCard : socialCard;

    img.src = d.img;
    title.textContent = `${d.name} ${d.verified?"✅":""}`;
    meta.textContent  = `${d.breed} · ${d.age} ${state.lang==="it"?"anni":"yrs"} · ${fmtKm(d.km)}`;
    bio.textContent   = d.bio || "";
    img.onclick = ()=>openProfile(d);

    attachSwipe(card, dir=>{
      incSwipe();
      if (dir==="right") maybeMatch();
      if (mode==="love") state.currentLoveIdx++; else state.currentSocialIdx++;
      setTimeout(()=>renderSwipe(mode), 10);
    });

    (mode==="love"?loveYes:socialYes).onclick = ()=>simulateSwipe(card,"right");
    (mode==="love"?loveNo:socialNo).onclick   = ()=>simulateSwipe(card,"left");
  }

  function attachSwipe(card, cb){
    if (card._sw) return;
    card._sw = true;
    let sx=0, dx=0, dragging=false;
    const start=(x)=>{ sx=x; dragging=true; card.style.transition="none"; };
    const move =(x)=>{ if(!dragging) return; dx=x-sx; const rot=dx/18; card.style.transform=`translate3d(${dx}px,0,0) rotate(${rot}deg)`; };
    const end =()=>{ if(!dragging) return; dragging=false; card.style.transition=""; const th=90;
      if (dx>th){ card.classList.add("swipe-out-right"); setTimeout(()=>{ resetCard(card); cb("right"); }, 550); }
      else if (dx<-th){ card.classList.add("swipe-out-left"); setTimeout(()=>{ resetCard(card); cb("left"); }, 550); }
      else { resetCard(card); }
      dx=0;
    };
    card.addEventListener("touchstart", e=>start(e.touches[0].clientX), {passive:true});
    card.addEventListener("touchmove",  e=>move(e.touches[0].clientX),  {passive:true});
    card.addEventListener("touchend", end);
    card.addEventListener("mousedown", e=>start(e.clientX));
    window.addEventListener("mousemove", e=>move(e.clientX));
    window.addEventListener("mouseup", end);
  }
  function resetCard(card){ card.classList.remove("swipe-out-right","swipe-out-left"); card.style.transform=""; }
  function simulateSwipe(card, dir){
    card.classList.add(dir==="right"?"swipe-out-right":"swipe-out-left");
    setTimeout(()=>{ resetCard(card); card.dispatchEvent(new CustomEvent("swiped",{detail:{dir}})); }, 550);
  }
  function incSwipe(){
    state.swipeCount++; localStorage.setItem("swipes", String(state.swipeCount));
    if (!state.plus){
      if (state.swipeCount===10 || (state.swipeCount>10 && (state.swipeCount-10)%5===0)){
        reward("Video per continuare a fare swipe");
      }
    }
  }
  function maybeMatch(){
    // 55% chance match mock + burst gigante
    if (Math.random() < 0.55){
      state.matches++; localStorage.setItem("matches", String(state.matches));
      if (!state.plus && state.matches>=4){ reward("Video per sbloccare il nuovo match"); }
      const burst = document.createElement("div");
      burst.className = "match-burst";
      burst.textContent = "💛";
      document.body.appendChild(burst);
      setTimeout(()=>burst.remove(), 1200);
    }
  }

  // ---------------- Ricerca panel ----------------
  btnSearchPanel?.addEventListener("click", ()=>searchPanel.classList.remove("hidden"));
  closeSearch?.addEventListener("click", ()=>searchPanel.classList.add("hidden"));

  distRange?.addEventListener("input", ()=> distLabel.textContent = `${distRange.value} km`);

  breedInput?.addEventListener("input", ()=>{
    const v = (breedInput.value||"").trim().toLowerCase();
    breedsList.innerHTML=""; breedsList.style.display="none";
    if (!v) return;
    const matches = state.breeds.filter(b=>b.toLowerCase().startsWith(v)).sort().slice(0,16);
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
    state.filters.distKm = parseInt(distRange.value||"5");
    // Gold: weight/height solo se Plus
    if (state.plus){
      state.filters.weight = (weightInput.value||"").trim();
      state.filters.height = (heightInput.value||"").trim();
    }
    persistFilters();
    renderNearby();
    searchPanel.classList.add("hidden");
  });
  resetFilters?.addEventListener("click",()=>{
    breedInput.value=""; distRange.value=5; distLabel.textContent="5 km";
    onlyVerified.checked=false; sexFilter.value="";
    if (state.plus){ weightInput.value=""; heightInput.value=""; }
    Object.assign(state.filters,{breed:"",distKm:5,verified:false,sex:"",weight:"",height:""});
    persistFilters(); renderNearby();
  });

  function persistFilters(){
    localStorage.setItem("f_breed", state.filters.breed);
    localStorage.setItem("f_distKm", String(state.filters.distKm));
    localStorage.setItem("f_verified", state.filters.verified?"1":"0");
    localStorage.setItem("f_sex", state.filters.sex);
    localStorage.setItem("f_weight", state.filters.weight||"");
    localStorage.setItem("f_height", state.filters.height||"");
  }
  function enableGoldInputs(){
    weightInput?.removeAttribute("disabled");
    heightInput?.removeAttribute("disabled");
    qa(".f-lock").forEach(n=>n.style.opacity="1");
  }
  if (state.plus) enableGoldInputs();

  // ---------------- Profilo (sheet elegante) ----------------
  window.openProfile = (d)=>{
    profileSheet.classList.remove("hidden");
    setTimeout(()=>profileSheet.classList.add("show"), 10);

    const selfieUnlocked = isSelfieUnlocked(d.id);
    ppBody.innerHTML = `
      <div class="pp-hero"><img src="${d.img}" alt="${d.name}"></div>
      <div class="pp-head">
        <h2 class="pp-name">${d.name} ${d.verified?"✅":""}</h2>
        <div class="pp-badges">
          <span class="badge">${d.breed}</span>
          <span class="badge">${d.age} ${state.lang==="it"?"anni":"yrs"}</span>
          <span class="badge">${fmtKm(d.km)}</span>
        </div>
      </div>
      <div class="pp-meta soft">${d.bio||""}</div>

      <h3 class="section-title">Galleria</h3>
      <div class="gallery">
        <div class="ph"><img src="${d.img}" alt=""></div>
        <div class="ph"><img src="dog2.jpg" alt=""></div>
        <div class="ph"><img src="dog3.jpg" alt=""></div>
        <div class="ph"><button class="add-photo">+ Aggiungi</button></div>
      </div>

      <h3 class="section-title">Selfie</h3>
      <div class="selfie ${selfieUnlocked?'unlocked':''}">
        <img class="img" src="${d.img}" alt="Selfie">
        <div class="over">
          <button id="unlockSelfie" class="btn ghost small">${selfieUnlocked?"Sbloccato 24h":"Sblocca selfie"}</button>
          <button id="uploadSelfie" class="btn small">Carica selfie</button>
        </div>
      </div>

      <div class="separator"></div>
      <div class="pp-actions">
        <button id="btnDocsOwner" class="btn outline">Documenti proprietario</button>
        <button id="btnDocsDog"   class="btn outline">Documenti cane</button>
        <button id="btnOpenChat"  class="btn">Apri chat</button>
      </div>
    `;

    $("btnDocsOwner").onclick = ()=>{ alert("Upload documenti proprietario (mock)"); d.verified=true; renderNearby(); };
    $("btnDocsDog").onclick   = ()=>{ alert("Upload documenti cane (mock)"); d.verified=true; renderNearby(); };
    $("btnOpenChat").onclick  = ()=>{ closeProfilePage(); setTimeout(()=>openChat(d), 180); };

    $("uploadSelfie").onclick = ()=>alert("Upload selfie (mock)");
    $("unlockSelfie").onclick = async ()=>{
      if (!isSelfieUnlocked(d.id)){
        await reward("Video per sbloccare il selfie per 24h");
        state.selfieUntilByDog[d.id] = Date.now() + 24*60*60*1000;
        localStorage.setItem("selfieUntilByDog", JSON.stringify(state.selfieUntilByDog));
        openProfile(d);
      }
    };
  };
  window.closeProfilePage = ()=>{
    profileSheet.classList.remove("show");
    setTimeout(()=>profileSheet.classList.add("hidden"), 250);
  };
  function isSelfieUnlocked(id){ return Date.now() < (state.selfieUntilByDog[id]||0); }

  // ---------------- Chat (first message reward) ----------------
  function openChat(dog){
    chatPane.classList.remove("hidden");
    setTimeout(()=>chatPane.classList.add("show"), 10);
    chatPane.dataset.dogId = dog.id;
    chatList.innerHTML = `<div class="msg">Ciao ${dog.name}! 🐾</div>`;
    chatInput.value="";
  }
  function closeChatPane(){ chatPane.classList.remove("show"); setTimeout(()=>chatPane.classList.add("hidden"), 250); }
  closeChat?.addEventListener("click", closeChatPane);

  chatComposer?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const text = chatInput.value.trim(); if (!text) return;
    const dogId = chatPane.dataset.dogId || "unknown";
    if (!state.plus && !state.firstMsgRewardByDog[dogId]){
      await reward("Video per inviare il primo messaggio");
      state.firstMsgRewardByDog[dogId] = true;
      localStorage.setItem("firstMsgRewardByDog", JSON.stringify(state.firstMsgRewardByDog));
    }
    const bubble = document.createElement("div");
    bubble.className="msg me"; bubble.textContent=text;
    chatList.appendChild(bubble); chatInput.value="";
    chatList.scrollTop = chatList.scrollHeight;
  });

  // ---------------- Maps helpers ----------------
  function openMapsCategory(cat){
    const map = {
      vets:"veterinari per animali vicino a me",
      groomers:"toelettature per cani vicino a me",
      shops:"negozi animali vicino a me",
      parks:"parchi per cani vicino a me",
      trainers:"addestratori per cani vicino a me",
      shelters:"canili vicino a me"
    };
    const q = map[cat] || "servizi animali vicino a me";
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

  // ---------------- Init ----------------
  function init(){
    // preset filtri UI
    breedInput.value = state.filters.breed;
    distRange.value  = state.filters.distKm; distLabel.textContent = `${distRange.value} km`;
    onlyVerified.checked = !!state.filters.verified;
    sexFilter.value  = state.filters.sex;
    if (state.plus){ enableGoldInputs(); weightInput.value = state.filters.weight; heightInput.value = state.filters.height; }

    // primo rendering
    if (state.entered){ setActiveView("nearby"); }
  }
  init();

  // ---------------- Persist Lang toggle (se presente) ----------------
  $("langToggle")?.addEventListener("click", ()=>{
    state.lang = state.lang==="it"?"en":"it";
    localStorage.setItem("lang", state.lang);
  });
});
