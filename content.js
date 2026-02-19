let scrollPositions = [];
let inactivityTimer = null;
let urlChanges = [];
let lastUrl = location.href;
let isInTrance = false;
let shortsCount = 0;
let lastShortChangeTime = 0;
let shortsResetTimer = null;
let muteInterval = null;
let replayCount = 0;
let lastVideoTime = 0;
let videoListenersAttached = new WeakSet();

let calmAudio = new Audio(chrome.runtime.getURL('calm.mp3'));
calmAudio.loop = true;
calmAudio.volume = 1.0;

let settings = {
  scrollLimit: 4000,
  shortsLimit: 4,
  videoSpeed: 0.5,
  level: 'medium'
};

chrome.storage.local.get(['breathLevel'], (result) => {
  updateSettings(result.breathLevel || 'medium');
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.breathLevel) {
    updateSettings(changes.breathLevel.newValue);
  }
});

function updateSettings(level) {
  settings.level = level;
  if (level === 'zen') {
    settings = { scrollLimit: 8000, shortsLimit: 8, videoSpeed: 0.8, level: 'zen' };
  } else if (level === 'medium') {
    settings = { scrollLimit: 4000, shortsLimit: 4, videoSpeed: 0.5, level: 'medium' };
  } else if (level === 'hard') {
    settings = { scrollLimit: 2000, shortsLimit: 2, videoSpeed: 0.2, level: 'hard' };
  }
}

function muteAllVideos() {
  const videos = document.querySelectorAll('video');
  videos.forEach(video => {
    try {
      if (!video.src.includes('calm.mp3') && video.id !== 'calm-audio-player') {
        video.muted = true;
        video.volume = 0;
        video.playbackRate = settings.level === 'hard' ? 0.1 : settings.videoSpeed;

        if (settings.level === 'hard') {
          video.pause();
          if (!video.paused) {
            video.pause();
          }
        }
      }
    } catch (e) { }
  });

  const ytPlayer = document.querySelector('#movie_player') ||
    document.querySelector('.html5-video-player') ||
    document.querySelector('#shorts-player');

  if (ytPlayer) {
    try {
      if (typeof ytPlayer.mute === 'function') ytPlayer.mute();
      if (typeof ytPlayer.setVolume === 'function') ytPlayer.setVolume(0);
      if (settings.level === 'hard' && typeof ytPlayer.pauseVideo === 'function') {
        ytPlayer.pauseVideo();
      }
    } catch (e) { }
  }
}

function activateTrance() {
  if (isInTrance) return;

  isInTrance = true;
  document.body.classList.add('breathing-active');

  if (settings.level === 'hard') {
    document.body.style.overflow = 'hidden';
  }

  calmAudio.play().catch(() => { });

  muteAllVideos();
  muteInterval = setInterval(muteAllVideos, 200);
}

function deactivateTrance() {
  if (!isInTrance) return;

  isInTrance = false;
  document.body.classList.remove('breathing-active');
  document.body.style.overflow = 'auto';

  if (muteInterval) {
    clearInterval(muteInterval);
    muteInterval = null;
  }

  document.querySelectorAll('video').forEach(video => {
    try {
      video.muted = false;
      video.volume = 1.0;
      video.playbackRate = 1.0;
      if (settings.level === 'hard') {
        video.play().catch(() => { });
      }
    } catch (e) { }
  });

  const ytPlayer = document.querySelector('#movie_player') ||
    document.querySelector('.html5-video-player') ||
    document.querySelector('#shorts-player');

  if (ytPlayer) {
    const forceRestore = () => {
      try {
        if (typeof ytPlayer.unMute === 'function') ytPlayer.unMute();
        if (typeof ytPlayer.setVolume === 'function') ytPlayer.setVolume(100);
        if (settings.level === 'hard' && typeof ytPlayer.playVideo === 'function') {
          ytPlayer.playVideo();
        }
      } catch (e) { }
    };

    forceRestore();
    setTimeout(forceRestore, 150);
  }

  calmAudio.pause();
  calmAudio.currentTime = 0;

  scrollPositions = [];
  urlChanges = [];
  replayCount = 0;
}

document.addEventListener('click', () => {
  if (isInTrance) {
    deactivateTrance();
  }
}, true);

function attachVideoListeners() {
  const videos = document.querySelectorAll('video');
  videos.forEach(video => {
    if (!videoListenersAttached.has(video)) {
      videoListenersAttached.add(video);

      video.addEventListener('timeupdate', () => {
        if (isInTrance) return;

        const currentTime = video.currentTime;
        const currentUrl = location.href;

        if (currentUrl === lastUrl && currentTime < lastVideoTime && (lastVideoTime - currentTime) > 2) {
          replayCount++;
          if (replayCount >= 5) {
            activateTrance();
          }
        }

        if (currentUrl !== lastUrl) {
          replayCount = 0;
          lastUrl = currentUrl;
        }

        lastVideoTime = currentTime;
      });
    }
  });
}

setInterval(attachVideoListeners, 500);

function handleShortChange() {
  const now = Date.now();
  if (lastShortChangeTime && (now - lastShortChangeTime < 30000)) {
    shortsCount++;
    if (shortsCount > settings.shortsLimit) activateTrance();
  } else {
    shortsCount = 1;
  }
  lastShortChangeTime = now;

  clearTimeout(shortsResetTimer);
  shortsResetTimer = setTimeout(() => {
    shortsCount = 0;
    lastShortChangeTime = 0;
  }, 30000);

  resetInactivityTimer();
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(deactivateTrance, 10000);
}

window.addEventListener('scroll', () => {
  const now = Date.now();
  const currentScroll = window.scrollY;

  scrollPositions.push({ y: currentScroll, time: now });
  scrollPositions = scrollPositions.filter(pos => now - pos.time <= 20000);

  if (scrollPositions.length > 1) {
    const oldest = scrollPositions[0];
    const scrollDiff = Math.abs(currentScroll - oldest.y);

    if (scrollDiff > settings.scrollLimit) {
      activateTrance();
    }
  }
  resetInactivityTimer();
}, { passive: true });

const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    const isShorts = location.href.includes('/shorts/');

    replayCount = 0;
    lastVideoTime = 0;
    lastUrl = location.href;

    if (isShorts) handleShortChange();

    if (isInTrance) {
      document.body.classList.add('breathing-active');
      muteAllVideos();
    }
  }

  attachVideoListeners();
});

observer.observe(document, { subtree: true, childList: true });