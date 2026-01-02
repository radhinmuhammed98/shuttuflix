// Clean HTML5 Player - No Ads!
let currentVideo = null;
let currentSources = [];

function openPlayer(id, mediaType, title = 'Movie') {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal').classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Load direct sources
  loadDirectSources(id, mediaType);
}

async function loadDirectSources(id, mediaType) {
  try {
    const response = await fetch(`/api/sources?id=${id}&type=${mediaType}`);
    const data = await response.json();
    
    if (data.sources && data.sources.length > 0) {
      currentSources = data.sources;
      playSource(0);
    } else {
      showError('No ad-free sources available');
    }
  } catch (error) {
    console.error('Source loading failed:', error);
    showError('Failed to load video');
  }
}

function playSource(index) {
  if (index >= currentSources.length) {
    showError('All sources failed. Try again later.');
    return;
  }
  
  const source = currentSources[index];
  const videoContainer = document.getElementById('video-container');
  videoContainer.innerHTML = '';
  
  if (source.type === 'hls') {
    // HLS streaming (for .m3u8 files)
    loadHLSPlayer(source.url, index);
  } else {
    // Direct MP4 playback
    loadMP4Player(source.url, index);
  }
}

function loadHLSPlayer(url, sourceIndex) {
  // Load HLS.js for .m3u8 support
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
  script.onload = () => {
    const video = document.createElement('video');
    video.controls = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.backgroundColor = '#000';
    
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        if (sourceIndex + 1 < currentSources.length) {
          // Try next source
          playSource(sourceIndex + 1);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari support
      video.src = url;
      video.addEventListener('error', () => {
        if (sourceIndex + 1 < currentSources.length) {
          playSource(sourceIndex + 1);
        }
      });
    }
    
    document.getElementById('video-container').appendChild(video);
    currentVideo = video;
  };
  document.head.appendChild(script);
}

function loadMP4Player(url, sourceIndex) {
  const video = document.createElement('video');
  video.controls = true;
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.backgroundColor = '#000';
  
  const sourceEl = document.createElement('source');
  sourceEl.src = url;
  sourceEl.type = 'video/mp4';
  video.appendChild(sourceEl);
  
  video.addEventListener('error', () => {
    if (sourceIndex + 1 < currentSources.length) {
      playSource(sourceIndex + 1);
    }
  });
  
  document.getElementById('video-container').appendChild(video);
  currentVideo = video;
}

function showError(message) {
  const container = document.getElementById('video-container');
  container.innerHTML = `
    <div style="color: white; text-align: center; padding: 40px; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px; color: #fc81b5;"></i>
      <p style="font-size: 1.2rem; margin-bottom: 20px;">${message}</p>
      <button onclick="closePlayer()" style="background: #fc81b5; border: none; padding: 12px 24px; border-radius: 24px; color: white; font-weight: 600; cursor: pointer; font-size: 1rem;">
        Close Player
      </button>
    </div>
  `;
}

function closePlayer() {
  document.getElementById('modal').classList.remove('active');
  document.body.style.overflow = 'auto';
  if (currentVideo) {
    currentVideo.pause();
    currentVideo = null;
  }
  currentSources = [];
}

// Keep your existing favorite functions
function toggleFavorite() { /* your code */ }
function updateFavoriteButton() { /* your code */ }
function initializePlayer() { /* your code */ }
