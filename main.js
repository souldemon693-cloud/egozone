document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Views
  const logoBtn = document.getElementById('logoBtn');
  const startReadingBtn = document.getElementById('startReadingBtn');
  const homeView = document.getElementById('homeView');
  const readerView = document.getElementById('readerView');
  const readerControls = document.getElementById('readerControls');
  
  // Auth DOM Elements
  const authView = document.getElementById('authView');
  const usernameInput = document.getElementById('usernameInput');
  const passwordInput = document.getElementById('passwordInput');
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const authError = document.getElementById('authError');
  const topNav = document.getElementById('topNav');
  
  // Home Actions
  const homeBtnTop = document.getElementById('homeBtnTop');
  const egoFileCard = document.getElementById('egoFileCard');
  const vsBattleCard = document.getElementById('vsBattleCard');

  // Facts Modal DOM
  const factModal = document.getElementById('factModal');
  const closeFactBtn = document.getElementById('closeFactBtn');
  const factModalTitle = document.getElementById('factModalTitle');
  const factModalText = document.getElementById('factModalText');

  // DOM Elements - Reader
  const pageContainer = document.getElementById('pageContainer');
  const pageFlipper = document.getElementById('pageFlipper');
  const chapterSelect = document.getElementById('chapterSelect');
  const mangaPageLeft = document.getElementById('mangaPageLeft');
  const mangaPageRight = document.getElementById('mangaPageRight');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageInfo = document.getElementById('pageInfo');
  const pageControls = document.querySelector('.page-controls');
  
  // Settings
  const toggleDirectionBtn = document.getElementById('toggleDirectionBtn');
  const toggleSpreadBtn = document.getElementById('toggleSpreadBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const prevChapterBtn = document.getElementById('prevChapterBtn');
  const nextChapterBtn = document.getElementById('nextChapterBtn');
  const toast = document.getElementById('toast');
  
  const MAX_CHAPTER = 354;
  
  // State
  let state = {
    chapter: 1,
    page: 1,
    isRTL: true, // Default to RTL for manga!
    isSpread: false,
    inReaderMode: false
  };
  let isLoading = false;
  let isEndOfChapter = false;
  let preloadedImages = {};

  // Load saved state
  const savedState = localStorage.getItem('egozoneState');
  if (savedState) {
    state = { ...state, ...JSON.parse(savedState) };
    if (state.chapter > 1 || state.page > 1) {
      const btnText = startReadingBtn.querySelector('.btn-text');
      if (btnText) {
        btnText.textContent = `[ RESUME CH. ${state.chapter} ]`;
      }
    }
  }

  // ---- Auth Logic ----
  let currentUser = localStorage.getItem('egozoneUser');
  let usersDB = JSON.parse(localStorage.getItem('egozoneUsersDB') || '{}');

  function showAuth() {
    authView.style.display = 'flex';
    homeView.style.display = 'none';
    readerView.style.display = 'none';
    topNav.style.display = 'none';
  }

  function hideAuth() {
    authView.style.display = 'none';
    topNav.style.display = 'flex';
    if (state.inReaderMode) {
      navigateToReader();
    } else {
      navigateToHome();
    }
  }

  signupBtn.addEventListener('click', () => {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();
    if (!user || !pass) {
      authError.textContent = 'Enter username and password.';
      return;
    }
    if (usersDB[user]) {
      authError.textContent = 'Username already taken.';
      return;
    }
    usersDB[user] = pass;
    localStorage.setItem('egozoneUsersDB', JSON.stringify(usersDB));
    currentUser = user;
    localStorage.setItem('egozoneUser', currentUser);
    hideAuth();
  });

  loginBtn.addEventListener('click', () => {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();
    if (!user || !pass) {
      authError.textContent = 'Enter username and password.';
      return;
    }
    if (usersDB[user] && usersDB[user] === pass) {
      currentUser = user;
      localStorage.setItem('egozoneUser', currentUser);
      hideAuth();
    } else {
      authError.textContent = 'Invalid credentials.';
    }
  });

  // ---- Dynamic Homepage Content ----
  const egoFiles = [
    { num: '041', title: 'Why Kaiser considers Isagi his rival', desc: 'Dive into the psychology of the Neo Egoist League\'s biggest rivalry.', full: 'Kaiser initially viewed Isagi as a mere stepping stone, a clown to elevate his own narrative as the Emperor. However, Isagi\'s terrifying ability to adapt, devour others\' plays, and acquire Meta Vision turned him into an existential threat. Kaiser\'s obsession shifted from ignoring Isagi to crushing him, fundamentally altering his own ego in the process.' },
    { num: '027', title: 'How Isagi evolved his Meta Vision', desc: 'A deep analysis of spatial awareness and adaptability.', full: 'Isagi Yoichi\'s awakening to Meta Vision didn\'t happen overnight. It was the culmination of his innate spatial awareness combined with the realization that he must constantly take in peripheral information on the pitch. By continuously updating his mental map of every player\'s position, he can predict the future of the field.' },
    { num: '015', title: 'The Monster Inside Bachira', desc: 'Understanding the origins of his creative dribbling.', full: 'Bachira Meguru grew up playing with an imaginary "Monster" inside him because nobody else could keep up with his wavelength. Blue Lock allowed him to shed his reliance on the monster and become his own monster, merging his elastic dribbling with his own true ego.' },
    { num: '058', title: 'Barou\'s Villain Philosophy', desc: 'Why the King refuses to pass the ball.', full: 'Shoei Barou believes that the pitch is a stage set specifically for him. His philosophy is simple: he is the King, and everyone else exists to serve his goals. By leaning into his role as the absolute "Villain" of the field, he steals the spotlight and creates unpredictable chaos.' }
  ];

  const battles = [
    { p1: 'ISAGI', p2: 'NAGI', desc: 'Who takes the crown in a 1v1? Cast your vote now.', full: 'In a pure 1v1 setting, Nagi\'s spontaneous trapping gives him an insane physical edge, but Isagi\'s Meta Vision and predictive ability could allow him to steal the ball before Nagi even reacts. Vote in the polls to decide!' },
    { p1: 'RIN', p2: 'KAISER', desc: 'The ultimate battle for the striker throne. Who wins?', full: 'Rin\'s destructive ego vs Kaiser\'s Emperor\'s ego. Both possess unparalleled shooting accuracy (Kaiser Impact vs Pinpoint Accuracy). A match between them would come down to who can manipulate the field better.' }
  ];

  let currentEgoData = null;
  let currentBattleData = null;

  function randomizeHomeContent() {
    currentEgoData = egoFiles[Math.floor(Math.random() * egoFiles.length)];
    document.getElementById('egoFileBadge').textContent = `EGO FILE #${currentEgoData.num}`;
    document.getElementById('egoFileTitle').textContent = currentEgoData.title;
    document.getElementById('egoFileDesc').textContent = currentEgoData.desc;

    currentBattleData = battles[Math.floor(Math.random() * battles.length)];
    document.getElementById('vsBattleTitle').textContent = `${currentBattleData.p1} 🆚 ${currentBattleData.p2}`;
    document.getElementById('vsBattleDesc').textContent = currentBattleData.desc;
  }

  // Populate dynamic data on load
  if (!state.inReaderMode) {
    randomizeHomeContent();
  }

  // Fact Modals logic
  function openFactModal(title, text) {
    factModalTitle.textContent = title;
    factModalText.textContent = text;
    factModal.classList.add('active');
  }
  closeFactBtn.addEventListener('click', () => {
    factModal.classList.remove('active');
  });
  
  egoFileCard.addEventListener('click', () => {
    if (currentEgoData) openFactModal(currentEgoData.title, currentEgoData.full);
  });
  vsBattleCard.addEventListener('click', () => {
    if (currentBattleData) openFactModal(`${currentBattleData.p1} vs ${currentBattleData.p2}`, currentBattleData.full);
  });

  // ---- Routing Logic ----
  function navigateToReader() {
    state.inReaderMode = true;
    homeView.style.display = 'none';
    readerView.style.display = 'flex';
    readerControls.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    saveState();
    loadPage();
  }

  function navigateToHome() {
    state.inReaderMode = false;
    homeView.style.display = 'flex';
    readerView.style.display = 'none';
    readerControls.style.display = 'none';
    document.body.style.overflow = 'auto';
    saveState();
  }

  logoBtn.addEventListener('click', navigateToHome);
  homeBtnTop.addEventListener('click', navigateToHome);
  startReadingBtn.addEventListener('click', navigateToReader);

  if (currentUser) {
    if (state.inReaderMode) {
      navigateToReader();
    } else {
      navigateToHome();
    }
  } else {
    showAuth();
  }

  // ---- Reader Logic ----

  // Initialize Chapters
  for (let i = 1; i <= MAX_CHAPTER; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `Chapter ${i}`;
    chapterSelect.appendChild(option);
  }
  chapterSelect.value = state.chapter;

  updateUIState();

  function saveState() {
    localStorage.setItem('egozoneState', JSON.stringify(state));
  }

  function updateUIState() {
    toggleDirectionBtn.textContent = state.isRTL ? 'RTL Mode' : 'LTR Mode';
    toggleDirectionBtn.classList.toggle('active', state.isRTL);
    
    toggleSpreadBtn.textContent = state.isSpread ? 'Double Page' : 'Single Page';
    toggleSpreadBtn.classList.toggle('active', state.isSpread);
    
    pageFlipper.classList.toggle('rtl', state.isRTL);

    if (state.isRTL) {
      pageControls.style.flexDirection = 'row-reverse';
      nextBtn.textContent = '← Next';
      prevBtn.textContent = 'Prev →';
    } else {
      pageControls.style.flexDirection = 'row';
      nextBtn.textContent = 'Next →';
      prevBtn.textContent = '← Prev';
    }
  }

  toggleDirectionBtn.addEventListener('click', () => {
    state.isRTL = !state.isRTL;
    updateUIState();
    saveState();
  });

  toggleSpreadBtn.addEventListener('click', () => {
    state.isSpread = !state.isSpread;
    if (state.isSpread && state.page % 2 === 0) {
      state.page -= 1; 
    }
    updateUIState();
    loadPage();
  });

  chapterSelect.addEventListener('change', (e) => {
    state.chapter = parseInt(e.target.value);
    state.page = 1;
    loadPage();
  });

  prevChapterBtn.addEventListener('click', () => {
    if (state.chapter > 1) {
      state.chapter--;
      chapterSelect.value = state.chapter;
      state.page = 1;
      loadPage();
    }
  });

  nextChapterBtn.addEventListener('click', () => {
    if (state.chapter < MAX_CHAPTER) {
      state.chapter++;
      chapterSelect.value = state.chapter;
      state.page = 1;
      loadPage();
    }
  });

  function getImageUrl(chapter, page) {
    const pageStr = String(page).padStart(3, '0');
    return `https://img.qubn.us/uploads/https-weebcentral-com-series-01j76xyd7e91k8qp6cy0y53900-blue-lock/${chapter}/https-weebcentral-com-series-01j76xyd7e91k8qp6cy0y53900-blue-lock-ch${chapter}-${pageStr}.webp`;
  }

  function preloadImage(chapter, page) {
    const key = `${chapter}-${page}`;
    if (!preloadedImages[key]) {
      const img = new Image();
      img.src = getImageUrl(chapter, page);
      preloadedImages[key] = img;
    }
  }

  function preloadAhead() {
    let pagesToPreload = state.isSpread ? 4 : 2;
    for (let i = 1; i <= pagesToPreload; i++) {
      preloadImage(state.chapter, state.page + (state.isSpread ? 1 : 0) + i);
    }
  }

  function applyAnimation(direction) {
    pageFlipper.classList.remove('anim-next', 'anim-prev');
    void pageFlipper.offsetWidth;
    pageFlipper.classList.add(direction === 'next' ? 'anim-next' : 'anim-prev');
  }

  function loadImagePromise(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject();
      img.src = url;
    });
  }

  async function loadPage(animationDir = null) {
    if (!state.inReaderMode || isLoading) return;
    isLoading = true;
    isEndOfChapter = false;
    saveState();
    
    if (animationDir) applyAnimation(animationDir);

    pageInfo.textContent = `Loading...`;
    prevBtn.disabled = true;
    nextBtn.disabled = true;

    if (state.isSpread) {
      const url1 = getImageUrl(state.chapter, state.page);
      const url2 = getImageUrl(state.chapter, state.page + 1);

      try {
        await loadImagePromise(url1);
        mangaPageLeft.src = url1;
        mangaPageLeft.classList.remove('hidden');
        mangaPageLeft.classList.add('spread');
        
        try {
          await loadImagePromise(url2);
          mangaPageRight.src = url2;
          mangaPageRight.classList.remove('hidden');
          mangaPageRight.classList.add('spread');
          pageInfo.textContent = `Ch ${state.chapter} | Pg ${state.page}-${state.page + 1}`;
        } catch {
          mangaPageRight.classList.add('hidden');
          pageInfo.textContent = `Ch ${state.chapter} | Pg ${state.page} (End)`;
        }
      } catch {
        handleImageError();
      }
    } else {
      mangaPageLeft.classList.add('hidden');
      mangaPageRight.classList.remove('spread');
      
      const url = getImageUrl(state.chapter, state.page);
      try {
        await loadImagePromise(url);
        mangaPageRight.src = url;
        mangaPageRight.classList.remove('hidden');
        mangaPageRight.style.display = '';
        pageInfo.textContent = `Ch ${state.chapter} | Pg ${state.page}`;
      } catch {
        handleImageError();
      }
    }

    isLoading = false;
    prevBtn.disabled = state.page === 1;
    nextBtn.disabled = false;
    preloadAhead();
  }

  function handleImageError() {
    if (state.page > 1) {
      handleEndOfChapter();
    } else {
      pageInfo.textContent = `Error: Cannot load Ch ${state.chapter}. Server may be down.`;
      mangaPageRight.style.display = 'none';
      mangaPageLeft.style.display = 'none';
    }
  }

  function handleEndOfChapter() {
    if (state.page > 1) {
      state.page -= state.isSpread ? 2 : 1;
      if (state.page < 1) state.page = 1;
      pageInfo.textContent = `Ch ${state.chapter} | Pg ${state.page} (End)`;
      isEndOfChapter = true;
    }
  }

  function goNext() {
    if (!isLoading) {
      if (isEndOfChapter) {
        if (state.chapter < MAX_CHAPTER) {
          if (confirm("this chapter is over, do you want to move to a next chapter?")) {
            state.chapter++;
            chapterSelect.value = state.chapter;
            state.page = 1;
            loadPage();
          }
        } else {
          showToast("You have reached the latest chapter.");
        }
        return;
      }
      state.page += state.isSpread ? 2 : 1;
      loadPage('next');
    }
  }

  function goPrev() {
    if (state.page > 1 && !isLoading) {
      state.page -= state.isSpread ? 2 : 1;
      if (state.page < 1) state.page = 1;
      loadPage('prev');
    }
  }

  nextBtn.addEventListener('click', () => goNext());
  prevBtn.addEventListener('click', () => goPrev());

  window.addEventListener('keydown', (e) => {
    if (!state.inReaderMode) return;
    if (e.key === 'ArrowRight') {
      state.isRTL ? goPrev() : goNext();
    } else if (e.key === 'ArrowLeft') {
      state.isRTL ? goNext() : goPrev();
    }
  });

  // ---- Fullscreen & Toast Logic ----
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      document.body.classList.add('fullscreen-mode');
      showToast('Use Left or Right arrow key to go to the next or previous page');
    } else {
      document.body.classList.remove('fullscreen-mode');
    }
  });

});
