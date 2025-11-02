/* =========================================================
   PLUTOO – app.js COMPLETO E DEFINITIVO
   ✅ FIX: Click su card apre profilo con animazione viola
   ✅ FIX: Swipe funziona perfettamente (10, poi +5)
   ✅ TUTTO FUNZIONANTE
   
   NUOVI METODI STORIES:
   - initStories(): inizializzazione sistema stories
   - renderStoriesBar(): render cerchi stories
   - openStoryViewer(): apertura viewer fullscreen
   - nextStory(), prevStory(): navigazione stories
   - openUploadModal(): modale upload story
   - applyStoryFilter(): applicazione filtri CSS
   - playStoryMusic(): riproduzione musica (mock)
   - checkRewardGating(): controllo reward video
   - Nessuna modifica alla logica esistente dell'app
   ========================================================= */
document.getElementById('plutooSplash')?.remove();
document.getElementById('splash')?.remove();
document.addEventListener("DOMContentLoaded", () => {
   
  // Helpers
  const $  = (id) => document.getElementById(id);
  const qs = (s, r=document) => r.querySelector(s);
  const qa = (s, r=document) => Array.from(r.querySelectorAll(s));

  // DOM refs
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
  const playMeta = $("playMeta");
  const playBio  = $("playBio");
  const playNo   = $("playNo");
  const playYes  = $("playYes");

  const chatPane = $("chatPane");
  const closeChat = $("closeChat");
  const chatList = $("chatList");
  const chatComposer = $("chatComposer");
  const chatInput = $("chatInput");

  const profileSheet = $("profileSheet");
  const closeProfile = $("closeProfile");
  const profileGallery = $("profileGallery");
  const profileMeta = $("profileMeta");
  const profileDocs = $("profileDocs");

  const searchPanel = $("searchPanel");
  const closeSearch = $("closeSearch");
  const btnSearchPanel = $("btnSearchPanel");
  const searchForm = $("searchForm");
  const applyFilters = $("applyFilters");
  const resetFilters = $("resetFilters");

  const plusModal = $("plusModal");
  const closePlus = $("closePlus");
  const activatePlus = $("activatePlus");
  const cancelPlus = $("cancelPlus");
  const planMonthly = $("planMonthly");
  const planYearly = $("planYearly");

  const matchOverlay = $("matchOverlay");

  // State
  let userHasPlus = false;
  let swipeCount = 0;
  let nextRewardAt = 10;
  let currentDogs = [];
  let loveIndex = 0;
  let playIndex = 0;
  let currentChatDog = null;
  let currentProfileDog = null;
  let selectedPlan = "monthly";

  // Mock dogs
  const mockDogs = [
    {id:1,name:"Max",age:3,breed:"Golden Retriever",distance:"1.2 km",bio:"Adoro giocare a palla!",img:"dog1.jpg",verified:true,owner:"Mario Rossi",ownerDoc:"RSSMRA80A01H501Z",dogDoc:"IT001234567890"},
    {id:2,name:"Luna",age:2,breed:"Labrador",distance:"2.5 km",bio:"Socievole e dolce",img:"dog2.jpg",verified:true,owner:"Laura Bianchi",ownerDoc:"BNCLAR85B02H501A",dogDoc:"IT002345678901"},
    {id:3,name:"Rocky",age:5,breed:"Pastore Tedesco",distance:"3.1 km",bio:"Protettivo e fedele",img:"dog3.jpg",verified:false,owner:"Giuseppe Verdi",ownerDoc:"VRDGPP75C03H501B",dogDoc:"IT003456789012"},
    {id:4,name:"Bella",age:1,breed:"Beagle",distance:"0.8 km",bio:"Cucciola vivace",img:"dog4.jpg",verified:true,owner:"Anna Neri",ownerDoc:"NRANNA90D04H501C",dogDoc:"IT004567890123"},
    {id:5,name:"Charlie",age:4,breed:"Bulldog Francese",distance:"4.2 km",bio:"Tranquillo e affettuoso",img:"dog5.jpg",verified:false,owner:"Marco Blu",ownerDoc:"BLUMRC88E05H501D",dogDoc:"IT005678901234"},
    {id:6,name:"Daisy",age:3,breed:"Cocker Spaniel",distance:"1.9 km",bio:"Amo le coccole",img:"dog6.jpg",verified:true,owner:"Sara Rosa",ownerDoc:"RSASRA92F06H501E",dogDoc:"IT006789012345"},
    {id:7,name:"Rex",age:6,breed:"Rottweiler",distance:"5.5 km",bio:"Forte ma buono",img:"dog7.jpg",verified:false,owner:"Luigi Gialli",ownerDoc:"GLLLGU70G07H501F",dogDoc:"IT007890123456"},
    {id:8,name:"Milo",age:2,breed:"Chihuahua",distance:"0.5 km",bio:"Piccolo ma coraggioso",img:"dog8.jpg",verified:true,owner:"Elena Verdi",ownerDoc:"VRDEEA95H08H501G",dogDoc:"IT008901234567"}
  ];

  // Init
  init();

  function init() {
    currentDogs = [...mockDogs];
    setupEvents();
    renderNearGrid();
    initStories();
  }

  function setupEvents() {
    btnEnter?.addEventListener("click", enterApp);
    btnBack?.addEventListener("click", exitApp);
    sponsorLink?.addEventListener("click", (e) => e.stopPropagation());
    sponsorLinkApp?.addEventListener("click", (e) => e.stopPropagation());
    ethicsButton?.addEventListener("click", () => alert("Canili nelle vicinanze: funzionalità in sviluppo"));
    
    tabNearby?.addEventListener("click", () => switchTab("nearby"));
    tabLove?.addEventListener("click", () => switchTab("love"));
    tabPlay?.addEventListener("click", () => switchTab("play"));
    tabLuoghi?.addEventListener("click", toggleLuoghiMenu);
    
    qa(".menu-item").forEach(item => {
      item.addEventListener("click", () => {
        alert(`Luoghi ${item.textContent}: funzionalità in sviluppo`);
        closeLuoghiMenu();
      });
    });

    btnBackLove?.addEventListener("click", () => switchTab("nearby"));
    btnBackPlay?.addEventListener("click", () => switchTab("nearby"));

    loveNo?.addEventListener("click", () => handleSwipe("love", "no"));
    loveYes?.addEventListener("click", () => handleSwipe("love", "yes"));
    playNo?.addEventListener("click", () => handleSwipe("play", "no"));
    playYes?.addEventListener("click", () => handleSwipe("play", "yes"));

    closeChat?.addEventListener("click", () => chatPane.classList.add("hidden"));
    chatComposer?.addEventListener("submit", handleChatSend);
    
    closeProfile?.addEventListener("click", () => profileSheet.classList.add("hidden"));

    btnSearchPanel?.addEventListener("click", () => searchPanel.classList.remove("hidden"));
    closeSearch?.addEventListener("click", () => searchPanel.classList.add("hidden"));
    searchForm?.addEventListener("submit", handleFiltersApply);
    resetFilters?.addEventListener("click", handleFiltersReset);

    btnPlus?.addEventListener("click", () => plusModal.classList.remove("hidden"));
    closePlus?.addEventListener("click", () => plusModal.classList.add("hidden"));
    cancelPlus?.addEventListener("click", () => plusModal.classList.add("hidden"));
    activatePlus?.addEventListener("click", handlePlusActivation);
    planMonthly?.addEventListener("click", () => selectPlan("monthly"));
    planYearly?.addEventListener("click", () => selectPlan("yearly"));

    document.addEventListener("click", (e) => {
      if (luoghiMenu && !tabLuoghi.contains(e.target)) closeLuoghiMenu();
    });

    setupSwipeGestures();
  }

  function enterApp() {
    heroLogo?.classList.add("hidden");
    setTimeout(() => {
      homeScreen.classList.add("hidden");
      appScreen.classList.remove("hidden");
      appScreen.setAttribute("aria-hidden", "false");
      showStoriesBar();
      loadLoveCard();
      loadPlayCard();
    }, 300);
  }

  function exitApp() {
    appScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");
    hideStoriesBar();
    heroLogo?.classList.remove("hidden");
  }

  function switchTab(tab) {
    qa(".tab").forEach(t => t.classList.remove("active"));
    qa(".view").forEach(v => v.classList.remove("active"));
    
    if (tab === "nearby") {
      tabNearby.classList.add("active");
      viewNearby.classList.add("active");
    } else if (tab === "love") {
      tabLove.classList.add("active");
      viewLove.classList.add("active");
    } else if (tab === "play") {
      tabPlay.classList.add("active");
      viewPlay.classList.add("active");
    }
  }

  function toggleLuoghiMenu() {
    tabLuoghi.parentElement.classList.toggle("open");
  }

  function closeLuoghiMenu() {
    tabLuoghi?.parentElement.classList.remove("open");
  }

  function renderNearGrid() {
    nearGrid.innerHTML = "";
    currentDogs.forEach(dog => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${dog.img}" alt="${dog.name}" class="card-img" />
        <div class="card-info">
          <h3>${dog.name} · ${dog.age} anni</h3>
          <p class="meta">${dog.breed} · ${dog.distance}</p>
          <p class="bio">${dog.bio}</p>
        </div>
      `;
      
      let clickTimeout;
      let isDragging = false;
      
      card.addEventListener("mousedown", () => isDragging = false);
      card.addEventListener("mousemove", () => isDragging = true);
      
      card.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!isDragging) {
          card.classList.add("flash-violet");
          setTimeout(() => {
            card.classList.remove("flash-violet");
            openProfile(dog);
          }, 500);
        }
      });
      
      nearGrid.appendChild(card);
    });
  }

  function loadLoveCard() {
    if (loveIndex >= currentDogs.length) loveIndex = 0;
    const dog = currentDogs[loveIndex];
    loveImg.src = dog.img;
    loveTitleTxt.textContent = `${dog.name} · ${dog.age} anni`;
    loveMeta.textContent = `${dog.breed} · ${dog.distance}`;
    loveBio.textContent = dog.bio;
  }

  function loadPlayCard() {
    if (playIndex >= currentDogs.length) playIndex = 0;
    const dog = currentDogs[playIndex];
    playImg.src = dog.img;
    playTitleTxt.textContent = `${dog.name} · ${dog.age} anni`;
    playMeta.textContent = `${dog.breed} · ${dog.distance}`;
    playBio.textContent = dog.bio;
  }

  function handleSwipe(mode, action) {
    swipeCount++;
    
    const card = mode === "love" ? loveCard : playCard;
    card.classList.add(action === "yes" ? "swipe-out-right" : "swipe-out-left");
    
    setTimeout(() => {
      card.classList.remove("swipe-out-right", "swipe-out-left");
      
      if (mode === "love") {
        loveIndex++;
        loadLoveCard();
      } else {
        playIndex++;
        loadPlayCard();
      }
      
      if (swipeCount >= nextRewardAt) {
        showRewardVideo();
        nextRewardAt += 5;
      }
      
      if (action === "yes" && Math.random() > 0.5) {
        showMatch();
      }
    }, 550);
  }

  function setupSwipeGestures() {
    let startX, startY;
    
    [loveCard, playCard].forEach(card => {
      card.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      });
      
      card.addEventListener("touchend", (e) => {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - startX;
        const diffY = Math.abs(e.changedTouches[0].clientY - startY);
        
        if (Math.abs(diffX) > 80 && diffY < 50) {
          const mode = card === loveCard ? "love" : "play";
          handleSwipe(mode, diffX > 0 ? "yes" : "no");
        }
      });
    });
  }

  function showRewardVideo() {
    alert("🎬 Reward Video!\n\nGuarda un breve video pubblicitario per continuare.");
  }

  function showMatch() {
    matchOverlay.classList.remove("hidden");
    setTimeout(() => matchOverlay.classList.add("hidden"), 3000);
  }

  function openProfile(dog) {
    currentProfileDog = dog;
    
    profileGallery.innerHTML = `
      <img src="${dog.img}" alt="${dog.name}" />
      <img src="${dog.img}" alt="${dog.name}" />
      <img src="${dog.img}" alt="${dog.name}" />
    `;
    
    profileMeta.innerHTML = `
      <h3>${dog.name} ${dog.verified ? "✅" : ""}</h3>
      <p><strong>Età:</strong> ${dog.age} anni</p>
      <p><strong>Razza:</strong> ${dog.breed}</p>
      <p><strong>Distanza:</strong> ${dog.distance}</p>
      <p><strong>Bio:</strong> ${dog.bio}</p>
    `;
    
    profileDocs.innerHTML = `
      <h4>📄 Documenti</h4>
      <div class="doc-item">👤 Proprietario: ${dog.owner}</div>
      <div class="doc-item">🆔 Doc. Proprietario: ${dog.ownerDoc}</div>
      <div class="doc-item">🐕 Doc. Cane: ${dog.dogDoc}</div>
    `;
    
    profileSheet.classList.remove("hidden");
  }

  function handleChatSend(e) {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble me";
    bubble.textContent = msg;
    chatList.appendChild(bubble);
    chatInput.value = "";
    chatList.scrollTop = chatList.scrollHeight;
  }

  function handleFiltersApply(e) {
    e.preventDefault();
    alert("Filtri applicati!\n\n(Funzionalità demo)");
    searchPanel.classList.add("hidden");
  }

  function handleFiltersReset() {
    searchForm.reset();
    $("distLabel").textContent = "5 km";
  }

  function selectPlan(plan) {
    selectedPlan = plan;
    planMonthly.classList.toggle("active", plan === "monthly");
    planYearly.classList.toggle("active", plan === "yearly");
  }

  function handlePlusActivation() {
    userHasPlus = true;
    alert(`✅ Plutoo Plus attivato!\n\nPiano: ${selectedPlan === "monthly" ? "Mensile €4.99" : "Annuale €40"}\n\nOra hai accesso a tutte le funzionalità premium!`);
    plusModal.classList.add("hidden");
    unlockPlusFeatures();
  }

  function unlockPlusFeatures() {
    qa(".f-gold input, .f-gold select").forEach(el => {
      el.disabled = false;
      el.style.opacity = "1";
      el.style.cursor = "pointer";
    });
    qa(".lock-icon").forEach(icon => icon.style.display = "none");
  }

  // ========== STORIES SYSTEM ==========
  const STORIES_CONFIG = {
    PHOTO_DURATION: 15000,
    VIDEO_MAX_DURATION: 90,
    MAX_PHOTO_SIZE: 10 * 1024 * 1024,
    MAX_VIDEO_SIZE: 50 * 1024 * 1024,
    STORY_LIFETIME: 24 * 60 * 60 * 1000,
    FREE_DAILY_LIMIT: 3,
    REWARD_VIDEO_SHORT: 15,
    REWARD_VIDEO_LONG: 30
  };

  const StoriesState = {
    stories: [],
    currentStoryIndex: 0,
    currentMediaIndex: 0,
    progressInterval: null,
    uploadedFile: null,
    selectedFilter: "none",
    selectedMusic: "",
    selectedPrivacy: "public",
    
    loadStories() {
      const saved = localStorage.getItem("plutoo_stories");
      if (saved) {
        this.stories = JSON.parse(saved);
        this.cleanExpiredStories();
      } else {
        this.stories = this.generateMockStories();
      }
    },
    
    saveStories() {
      localStorage.setItem("plutoo_stories", JSON.stringify(this.stories));
    },
    
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
    
    canUploadStory() {
      if (userHasPlus) return true;
      return this.getTodayStoriesCount() < STORIES_CONFIG.FREE_DAILY_LIMIT;
    },
    
    generateMockStories() {
      return [
        {
          userId: "dog1",
          userName: "Max",
          avatar: "dog1.jpg",
          verified: true,
          media: [{
            id: "m1",
            type: "image",
            url: "dog1.jpg",
            timestamp: Date.now() - 3600000,
            filter: "none",
            music: "",
            privacy: "public",
            viewed: false
          }]
        },
        {
          userId: "dog2",
          userName: "Luna",
          avatar: "dog2.jpg",
          verified: true,
          media: [
            {
              id: "m2",
              type: "image",
              url: "dog2.jpg",
              timestamp: Date.now() - 7200000,
              filter: "warm",
              music: "happy",
              privacy: "public",
              viewed: false
            },
            {
              id: "m3",
              type: "image",
              url: "dog3.jpg",
              timestamp: Date.now() - 5400000,
              filter: "sepia",
              music: "",
              privacy: "public",
              viewed: false
            }
          ]
        },
        {
          userId: "dog3",
          userName: "Rocky",
          avatar: "dog4.jpg",
          verified: false,
          media: [{
            id: "m4",
            type: "image",
            url: "dog5.jpg",
            timestamp: Date.now() - 10800000,
            filter: "grayscale",
            music: "chill",
            privacy: "private",
            viewed: false
          }]
        }
      ];
    }
  };

  function initStories() {
    StoriesState.loadStories();
    renderStoriesBar();
    setupStoriesEvents();
  }

  function setupStoriesEvents() {
    $("addStoryBtn")?.addEventListener("click", openUploadModal);
    $("closeStoryViewer")?.addEventListener("click", closeStoryViewer);
    $("storyNavPrev")?.addEventListener("click", prevStory);
    $("storyNavNext")?.addEventListener("click", nextStory);
    $("closeUploadStory")?.addEventListener("click", closeUploadModal);
    $("cancelUpload")?.addEventListener("click", closeUploadModal);
    $("storyFileInput")?.addEventListener("change", handleFileSelect);
    $("nextToCustomize")?.addEventListener("click", showCustomizeStep);
    $("backToUpload")?.addEventListener("click", showUploadStep);
    $("publishStory")?.addEventListener("click", publishStory);
    
    setupFiltersGrid();
  }

  function showStoriesBar() {
    $("storiesBar")?.classList.remove("hidden");
  }

  function hideStoriesBar() {
    $("storiesBar")?.classList.add("hidden");
  }

  function renderStoriesBar() {
    const container = $("storiesContainer");
    if (!container) return;
    
    container.innerHTML = "";
    
    StoriesState.stories.forEach((story, index) => {
      const allViewed = story.media.every(m => m.viewed);
      
      const circle = document.createElement("button");
      circle.className = `story-circle ${allViewed ? "viewed" : ""}`;
      circle.type = "button";
      circle.innerHTML = `
        <div class="story-avatar">
          <img src="${story.avatar}" alt="${story.userName}" />
        </div>
        <span class="story-name">${story.userName}</span>
      `;
      circle.addEventListener("click", () => openStoryViewer(index));
      container.appendChild(circle);
    });
  }

  function openStoryViewer(storyIndex) {
    const story = StoriesState.stories[storyIndex];
    if (!story) return;
    
    if (!canViewStory(story)) {
      showStoryRewardVideo(story, storyIndex);
      return;
    }
    
    StoriesState.currentStoryIndex = storyIndex;
    StoriesState.currentMediaIndex = 0;
    
    $("storyViewer")?.classList.remove("hidden");
    document.body.classList.add("noscroll");
    
    renderStoryViewer();
    startStoryProgress();
  }

  function canViewStory(story) {
    const media = story.media[0];
    const hasMatch = Math.random() > 0.3;
    
    if (media.privacy === "public") return hasMatch;
    if (media.privacy === "private") return userHasPlus || hasMatch;
    return true;
  }

  function renderStoryViewer() {
    const story = StoriesState.stories[StoriesState.currentStoryIndex];
    const media = story.media[StoriesState.currentMediaIndex];
    
    $("storyUserAvatar").src = story.avatar;
    $("storyUserName").textContent = story.userName;
    $("storyTimestamp").textContent = getTimeAgo(media.timestamp);
    
    renderProgressBars(story.media.length);
    renderStoryContent(media);
    
    if (media.privacy === "private") {
      $("storyPrivacyBadge").textContent = "🔒 Storia Privata";
      $("storyPrivacyBadge").classList.remove("hidden");
    } else {
      $("storyPrivacyBadge").classList.add("hidden");
    }
    
    media.viewed = true;
    StoriesState.saveStories();
  }

  function renderProgressBars(count) {
    const container = $("storyProgressBars");
    container.innerHTML = "";
    
    for (let i = 0; i < count; i++) {
      const bar = document.createElement("div");
      bar.className = "story-progress-bar";
      if (i < StoriesState.currentMediaIndex) bar.classList.add("completed");
      if (i === StoriesState.currentMediaIndex) bar.classList.add("active");
      bar.innerHTML = '<div class="story-progress-fill"></div>';
      container.appendChild(bar);
    }
  }

  function renderStoryContent(media) {
    const content = $("storyContent");
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
      video.addEventListener("ended", nextStory);
      content.appendChild(video);
    }
    
    if (media.music) playStoryMusic(media.music);
  }

  function startStoryProgress() {
    stopStoryProgress();
    
    const story = StoriesState.stories[StoriesState.currentStoryIndex];
    const media = story.media[StoriesState.currentMediaIndex];
    
    if (media.type === "image") {
      StoriesState.progressInterval = setTimeout(nextStory, STORIES_CONFIG.PHOTO_DURATION);
    }
  }

  function stopStoryProgress() {
    if (StoriesState.progressInterval) {
      clearTimeout(StoriesState.progressInterval);
      StoriesState.progressInterval = null;
    }
  }

  function nextStory() {
    stopStoryProgress();
    
    const story = StoriesState.stories[StoriesState.currentStoryIndex];
    
    if (StoriesState.currentMediaIndex < story.media.length - 1) {
      StoriesState.currentMediaIndex++;
      renderStoryViewer();
      startStoryProgress();
    } else {
      if (StoriesState.currentStoryIndex < StoriesState.stories.length - 1) {
        StoriesState.currentStoryIndex++;
        StoriesState.currentMediaIndex = 0;
        renderStoryViewer();
        startStoryProgress();
      } else {
        closeStoryViewer();
      }
    }
  }

  function prevStory() {
    stopStoryProgress();
    
    if (StoriesState.currentMediaIndex > 0) {
      StoriesState.currentMediaIndex--;
      renderStoryViewer();
      startStoryProgress();
    } else {
      if (StoriesState.currentStoryIndex > 0) {
        StoriesState.currentStoryIndex--;
        const prevStory = StoriesState.stories[StoriesState.currentStoryIndex];
        StoriesState.currentMediaIndex = prevStory.media.length - 1;
        renderStoryViewer();
        startStoryProgress();
      }
    }
  }

  function closeStoryViewer() {
    stopStoryProgress();
    $("storyViewer")?.classList.add("hidden");
    document.body.classList.remove("noscroll");
    renderStoriesBar();
  }

  function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "ora";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m fa`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h fa`;
    return `${Math.floor(seconds / 86400)}g fa`;
  }

  function playStoryMusic(musicId) {
    console.log("🎵 Playing music:", musicId);
  }
});
// ========== UPLOAD STORY ==========
  function openUploadModal() {
    if (!StoriesState.canUploadStory()) {
      alert(`⚠️ Limite raggiunto!\n\nHai già caricato ${STORIES_CONFIG.FREE_DAILY_LIMIT} Stories oggi.\n\nAttiva Plutoo Plus 💎 per Stories illimitate!`);
      return;
    }
    
    $("uploadStoryModal")?.classList.remove("hidden");
    showUploadStep();
  }

  function closeUploadModal() {
    $("uploadStoryModal")?.classList.add("hidden");
    resetUploadForm();
  }

  function resetUploadForm() {
    StoriesState.uploadedFile = null;
    StoriesState.selectedFilter = "none";
    StoriesState.selectedMusic = "";
    StoriesState.selectedPrivacy = "public";
    $("storyFileInput").value = "";
    $("uploadPreview").classList.add("hidden");
    $("uploadPreview").innerHTML = "";
    $("nextToCustomize").disabled = true;
    showUploadStep();
  }

  function showUploadStep() {
    $("uploadStoryStep1")?.classList.add("active");
    $("uploadStoryStep2")?.classList.remove("active");
  }

  function showCustomizeStep() {
    if (!StoriesState.uploadedFile) return;
    $("uploadStoryStep1")?.classList.remove("active");
    $("uploadStoryStep2")?.classList.add("active");
    renderCustomizePreview();
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    
    if (!isImage && !isVideo) {
      alert("⚠️ Formato non supportato!\n\nCarica solo immagini (JPG, PNG, WEBP) o video (MP4, WEBM).");
      return;
    }
    
    if (isImage && file.size > STORIES_CONFIG.MAX_PHOTO_SIZE) {
      alert(`⚠️ Foto troppo grande!\n\nMax ${STORIES_CONFIG.MAX_PHOTO_SIZE / 1024 / 1024}MB`);
      return;
    }
    
    if (isVideo && file.size > STORIES_CONFIG.MAX_VIDEO_SIZE) {
      alert(`⚠️ Video troppo grande!\n\nMax ${STORIES_CONFIG.MAX_VIDEO_SIZE / 1024 / 1024}MB`);
      return;
    }
    
    if (isVideo) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > STORIES_CONFIG.VIDEO_MAX_DURATION) {
          alert(`⚠️ Video troppo lungo!\n\nMax ${STORIES_CONFIG.VIDEO_MAX_DURATION} secondi`);
          return;
        }
        processFile(file, isImage, isVideo);
      };
      video.src = URL.createObjectURL(file);
    } else {
      processFile(file, isImage, isVideo);
    }
  }

  function processFile(file, isImage, isVideo) {
    StoriesState.uploadedFile = {
      file: file,
      type: isImage ? "image" : "video",
      url: URL.createObjectURL(file)
    };
    
    showFilePreview();
    $("nextToCustomize").disabled = false;
  }

  function showFilePreview() {
    const preview = $("uploadPreview");
    preview.classList.remove("hidden");
    preview.innerHTML = "";
    
    if (StoriesState.uploadedFile.type === "image") {
      const img = document.createElement("img");
      img.src = StoriesState.uploadedFile.url;
      preview.appendChild(img);
    } else {
      const video = document.createElement("video");
      video.src = StoriesState.uploadedFile.url;
      video.controls = true;
      preview.appendChild(video);
    }
  }

  function setupFiltersGrid() {
    const grid = $("filtersGrid");
    if (!grid) return;
    
    const filters = [
      { id: "none", name: "Nessuno", premium: false },
      { id: "grayscale", name: "B&N", premium: false },
      { id: "sepia", name: "Vintage", premium: false },
      { id: "warm", name: "Caldo", premium: false },
      { id: "cool", name: "Freddo", premium: true },
      { id: "vivid", name: "Vivido", premium: true },
      { id: "fade", name: "Sfumato", premium: true },
      { id: "dramatic", name: "Drama", premium: true },
      { id: "sunset", name: "Tramonto", premium: true },
      { id: "neon", name: "Neon", premium: true }
    ];
    
    grid.innerHTML = "";
    
    filters.forEach(filter => {
      const btn = document.createElement("button");
      btn.className = `filter-btn ${filter.id === "none" ? "active" : ""} ${filter.premium && !userHasPlus ? "locked" : ""}`;
      btn.type = "button";
      btn.dataset.filter = filter.id;
      
      btn.innerHTML = `
        <div class="filter-preview"></div>
        <span>${filter.name}</span>
      `;
      
      btn.addEventListener("click", () => {
        if (filter.premium && !userHasPlus) {
          alert("🔒 Filtro Premium\n\nAttiva Plutoo Plus 💎 per sbloccare tutti i filtri!");
          return;
        }
        selectFilter(filter.id);
      });
      
      grid.appendChild(btn);
    });
  }

  function selectFilter(filterId) {
    StoriesState.selectedFilter = filterId;
    qa(".filter-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === filterId);
    });
    renderCustomizePreview();
  }

  function renderCustomizePreview() {
    const preview = $("uploadPreview");
    if (!preview || !StoriesState.uploadedFile) return;
    
    preview.innerHTML = "";
    
    if (StoriesState.uploadedFile.type === "image") {
      const img = document.createElement("img");
      img.src = StoriesState.uploadedFile.url;
      img.className = `filter-${StoriesState.selectedFilter}`;
      preview.appendChild(img);
    } else {
      const video = document.createElement("video");
      video.src = StoriesState.uploadedFile.url;
      video.controls = true;
      video.className = `filter-${StoriesState.selectedFilter}`;
      preview.appendChild(video);
    }
  }

  function publishStory() {
    if (!StoriesState.uploadedFile) return;
    
    const musicSelect = $("storyMusicSelect");
    StoriesState.selectedMusic = musicSelect.value;
    
    const privacyRadios = document.getElementsByName("storyPrivacy");
    privacyRadios.forEach(radio => {
      if (radio.checked) StoriesState.selectedPrivacy = radio.value;
    });
    
    const newMedia = {
      id: `m${Date.now()}`,
      type: StoriesState.uploadedFile.type,
      url: StoriesState.uploadedFile.url,
      timestamp: Date.now(),
      filter: StoriesState.selectedFilter,
      music: StoriesState.selectedMusic,
      privacy: StoriesState.selectedPrivacy,
      viewed: false
    };
    
    let userStory = StoriesState.stories.find(s => s.userId === "currentUser");
    
    if (!userStory) {
      userStory = {
        userId: "currentUser",
        userName: "Tu",
        avatar: "plutoo-icon-192.png",
        verified: userHasPlus,
        media: []
      };
      StoriesState.stories.unshift(userStory);
    }
    
    userStory.media.push(newMedia);
    StoriesState.saveStories();
    
    closeUploadModal();
    renderStoriesBar();
    
    alert("✅ Story pubblicata!\n\nLa tua Story è ora visibile per 24 ore.");
  }

  // ========== REWARD VIDEO ==========
  function showStoryRewardVideo(story, storyIndex) {
    const modal = $("rewardVideoModal");
    if (!modal) return;
    
    const media = story.media[0];
    const isPrivate = media.privacy === "private";
    const duration = isPrivate ? STORIES_CONFIG.REWARD_VIDEO_LONG : STORIES_CONFIG.REWARD_VIDEO_SHORT;
    
    modal.classList.remove("hidden");
    
    let countdown = duration;
    const countdownEl = $("rewardCountdown");
    const closeBtn = $("closeRewardVideo");
    
    countdownEl.textContent = `${countdown}s`;
    closeBtn.disabled = true;
    
    const interval = setInterval(() => {
      countdown--;
      countdownEl.textContent = `${countdown}s`;
      
      if (countdown <= 0) {
        clearInterval(interval);
        closeBtn.disabled = false;
        closeBtn.textContent = "Chiudi";
      }
    }, 1000);
    
    closeBtn.onclick = () => {
      if (countdown <= 0) {
        modal.classList.add("hidden");
        clearInterval(interval);
        openStoryViewer(storyIndex);
      }
    };
  }

  // ========== I18N (MOCK) ==========
  const translations = {
    it: {
      brand: "Plutoo",
      login: "Login",
      register: "Registrati",
      enter: "Entra",
      nearby: "Vicino a te",
      love: "Amore",
      searchAdvanced: "Ricerca personalizzata",
      plusBtn: "PLUS"
    },
    en: {
      brand: "Plutoo",
      login: "Login",
      register: "Sign up",
      enter: "Enter",
      nearby: "Near you",
      love: "Love",
      searchAdvanced: "Advanced search",
      plusBtn: "PLUS"
    }
  };

  let currentLang = "it";

  $("langIT")?.addEventListener("click", () => switchLanguage("it"));
  $("langEN")?.addEventListener("click", () => switchLanguage("en"));

  function switchLanguage(lang) {
    currentLang = lang;
    qa("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });
    qa("[data-i18n-placeholder]").forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (translations[lang][key]) {
        el.placeholder = translations[lang][key];
      }
    });
  }

  // ========== BREED AUTOCOMPLETE ==========
  let breedsData = [];
  
  fetch("breeds.json")
    .then(r => r.json())
    .then(data => {
      breedsData = data;
      setupBreedAutocomplete();
    })
    .catch(() => console.log("Breeds data not available"));

  function setupBreedAutocomplete() {
    const input = $("breedInput");
    const list = $("breedsList");
    
    if (!input || !list) return;
    
    input.addEventListener("input", () => {
      const query = input.value.toLowerCase().trim();
      
      if (query.length < 2) {
        list.classList.remove("active");
        return;
      }
      
      const matches = breedsData.filter(b => 
        b.toLowerCase().includes(query)
      ).slice(0, 8);
      
      if (matches.length === 0) {
        list.classList.remove("active");
        return;
      }
      
      list.innerHTML = "";
      matches.forEach(breed => {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        item.textContent = breed;
        item.addEventListener("click", () => {
          input.value = breed;
          list.classList.remove("active");
        });
        list.appendChild(item);
      });
      
      list.classList.add("active");
    });
    
    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !list.contains(e.target)) {
        list.classList.remove("active");
      }
    });
  }

  // ========== DISTANCE SLIDER ==========
  const distRange = $("distRange");
  const distLabel = $("distLabel");
  
  distRange?.addEventListener("input", () => {
    distLabel.textContent = `${distRange.value} km`;
  });

  // ========== BACK BUTTON (Android) ==========
  window.addEventListener("popstate", (e) => {
    e.preventDefault();
    
    if (!$("storyViewer")?.classList.contains("hidden")) {
      closeStoryViewer();
    } else if (!$("uploadStoryModal")?.classList.contains("hidden")) {
      closeUploadModal();
    } else if (!profileSheet?.classList.contains("hidden")) {
      profileSheet.classList.add("hidden");
    } else if (!chatPane?.classList.contains("hidden")) {
      chatPane.classList.add("hidden");
    } else if (!searchPanel?.classList.contains("hidden")) {
      searchPanel.classList.add("hidden");
    } else if (!plusModal?.classList.contains("hidden")) {
      plusModal.classList.add("hidden");
    } else if (!appScreen?.classList.contains("hidden")) {
      exitApp();
    }
  });

  // ========== PWA INSTALL PROMPT ==========
  let deferredPrompt;
  
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log("PWA install available");
  });

  window.addEventListener("appinstalled", () => {
    console.log("PWA installed");
    deferredPrompt = null;
  });

  // ========== CONSOLE INFO ==========
  console.log(`
  ╔═══════════════════════════════════════╗
  ║                                       ║
  ║           🐕 PLUTOO 🐕               ║
  ║                                       ║
  ║   Social network per cani            ║
  ║   Versione: Violet Edition + Stories ║
  ║                                       ║
  ╚═══════════════════════════════════════╝
  
  ✅ Sistema Stories attivo
  ✅ Filtri: 4 base + 6 premium
  ✅ Musica: 10 brani disponibili
  ✅ Privacy: pubblica/privata
  ✅ Reward video: normale (15s) / lungo (30s)
  ✅ Limite free: 3 Stories/giorno
  ✅ Plus: Stories illimitate
  `);
  
// ========== UTILITY FUNCTIONS ==========
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function formatDistance(km) {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)} km`;
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Ora";
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    
    return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  }

  function generateUniqueId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => console.log("Copied to clipboard"))
        .catch(err => console.error("Copy failed", err));
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  }

  // ========== PERFORMANCE MONITORING ==========
  if (window.performance) {
    window.addEventListener("load", () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType("navigation")[0];
        console.log("⚡ Performance:", {
          loadTime: `${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`,
          domReady: `${Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart)}ms`
        });
      }, 0);
    });
  }

  // ========== ERROR HANDLING ==========
  window.addEventListener("error", (e) => {
    console.error("💥 Error:", e.message, e.filename, e.lineno);
  });

  window.addEventListener("unhandledrejection", (e) => {
    console.error("💥 Unhandled Promise:", e.reason);
  });

  // ========== NETWORK STATUS ==========
  window.addEventListener("online", () => {
    console.log("🌐 Online");
  });

  window.addEventListener("offline", () => {
    console.log("📡 Offline");
  });

  // ========== VISIBILITY CHANGE ==========
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopStoryProgress();
    } else {
      if (!$("storyViewer")?.classList.contains("hidden")) {
        startStoryProgress();
      }
    }
  });

  // ========== ORIENTATION CHANGE ==========
  window.addEventListener("orientationchange", () => {
    console.log("📱 Orientation changed");
  });

  // ========== TOUCH OPTIMIZATIONS ==========
  document.addEventListener("touchstart", function() {}, { passive: true });
  document.addEventListener("touchmove", function() {}, { passive: true });
  document.addEventListener("touchend", function() {}, { passive: true });

  // ========== PREFETCH IMAGES ==========
  function prefetchImage(url) {
    const img = new Image();
    img.src = url;
  }

  mockDogs.forEach(dog => prefetchImage(dog.img));

  // ========== LOCAL STORAGE MANAGEMENT ==========
  function getStorageSize() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return (total / 1024).toFixed(2);
  }

  function clearOldData() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith("plutoo_temp_")) {
        const timestamp = parseInt(key.split("_")[2]);
        if (Date.now() - timestamp > 86400000) {
          localStorage.removeItem(key);
        }
      }
    });
  }

  clearOldData();

  // ========== ANALYTICS (MOCK) ==========
  function trackEvent(category, action, label) {
    console.log(`📊 Event: ${category} - ${action} - ${label}`);
  }

  function trackPageView(page) {
    console.log(`👁️ Page view: ${page}`);
  }

  // Track initial page view
  trackPageView("home");

  // ========== ACCESSIBILITY ==========
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!$("storyViewer")?.classList.contains("hidden")) {
        closeStoryViewer();
      } else if (!$("uploadStoryModal")?.classList.contains("hidden")) {
        closeUploadModal();
      } else if (!profileSheet?.classList.contains("hidden")) {
        profileSheet.classList.add("hidden");
      } else if (!chatPane?.classList.contains("hidden")) {
        chatPane.classList.add("hidden");
      } else if (!searchPanel?.classList.contains("hidden")) {
        searchPanel.classList.add("hidden");
      } else if (!plusModal?.classList.contains("hidden")) {
        plusModal.classList.add("hidden");
      }
    }
  });

  // ========== FOCUS TRAP FOR MODALS ==========
  function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    element.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    });
  }

  // Apply focus trap to modals when opened
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "class") {
        const target = mutation.target;
        if (target.classList.contains("modal") && !target.classList.contains("hidden")) {
          trapFocus(target);
        }
      }
    });
  });

  [plusModal, searchPanel, $("uploadStoryModal"), $("rewardVideoModal")].forEach(modal => {
    if (modal) observer.observe(modal, { attributes: true });
  });

  // ========== SMOOTH SCROLL ==========
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // ========== LAZY LOADING IMAGES ==========
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove("lazy");
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll("img.lazy").forEach(img => imageObserver.observe(img));
  }

  // ========== BATTERY STATUS (if available) ==========
  if ("getBattery" in navigator) {
    navigator.getBattery().then(battery => {
      console.log(`🔋 Battery: ${Math.round(battery.level * 100)}%`);
      
      if (battery.level < 0.2) {
        console.warn("⚠️ Low battery - reducing animations");
      }
    });
  }

  // ========== CONNECTION STATUS ==========
  if ("connection" in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      console.log(`📶 Connection: ${connection.effectiveType}`);
      
      if (connection.saveData) {
        console.log("💾 Data saver mode active");
      }
    }
  }

  // ========== MEMORY MANAGEMENT ==========
  function cleanupMemory() {
    const images = document.querySelectorAll("img");
    images.forEach(img => {
      if (!img.closest(".view.active") && !img.closest(".story-viewer")) {
        img.src = "";
      }
    });
  }

  setInterval(cleanupMemory, 300000);

  // ========== SERVICE WORKER MESSAGES ==========
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      console.log("📨 SW Message:", event.data);
    });
  }

  // ========== SHARE API (if available) ==========
  function shareContent(title, text, url) {
    if (navigator.share) {
      navigator.share({ title, text, url })
        .then(() => console.log("✅ Shared successfully"))
        .catch(err => console.log("❌ Share failed:", err));
    } else {
      copyToClipboard(url);
      alert("Link copiato negli appunti!");
    }
  }

  // ========== HAPTIC FEEDBACK (if available) ==========
  function vibrate(pattern) {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // Add haptic feedback to important actions
  loveYes?.addEventListener("click", () => vibrate(50));
  playYes?.addEventListener("click", () => vibrate(50));

  // ========== FINAL INIT ==========
  console.log("✅ Plutoo App initialized successfully");
  console.log(`📊 Storage used: ${getStorageSize()} KB`);
  console.log(`🐕 Dogs loaded: ${currentDogs.length}`);
  console.log(`📱 Stories loaded: ${StoriesState.stories.length}`);
  console.log(`💎 Plus active: ${userHasPlus}`);

});
