let currentVideo = null;
let currentSources = [];
let currentSourceIndex = 0;

function openPlayer(id, mediaType, title) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('player-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
  
  showVideoLoading();
  loadSources(id, mediaType);
}

async function loadSources(id, mediaType) {
  try {
    const response = await fetch(`/api/sources?id=${id}&type=${mediaType}`);
    const data = await response.json();
    
    if (data.sources && data.sources.length > 0) {
      currentSources = data.sources;
      playSource(0);
    } else {
      // Fallback to iframe if direct sources fail
      loadEmbedFallback(id, mediaType);
    }
  } catch (error) {
    console.error('Sources failed:', error);
    loadEmbedFallback(id, mediaType);
  }
}

function playSource(index) {
  if (index >= currentSources.length) {
    loadEmbedFallback(CURRENT_ID, CURRENT_MEDIA_TYPE);
    return;
  }
  
  const source = currentSources[index];
  const container = document.getElementById('video-container');
  container.innerHTML = '';
  
  const video = document.createElement('video');
  video.controls = true;
  video.style.width = '100%';
  video.style.height = 'auto';
  video.style.maxHeight = '70vh';
  video.style.backgroundColor = '#000';
  
  if (source.type === 'hls') {
    // Load HLS.js for .m3u8 support
    loadHLSPlayer(video, source.url, index);
  } else {
    // Direct MP4
    const sourceEl = document.createElement('source');
    sourceEl.src = source.url;
    sourceEl.type = 'video/mp4';
    video.appendChild(sourceEl);
    video.addEventListener('error', () => playSource(index + 1));
    container.appendChild(video);
  }
  
  currentVideo = video;
}

function loadHLSPlayer(video, url, sourceIndex) {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
  script.onload = () => {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, () => playSource(sourceIndex + 1));
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('error', () => playSource(sourceIndex + 1));
    }
    document.getElementById('video-container').appendChild(video);
  };
  document.head.appendChild(script);
}

function loadEmbedFallback(id, mediaType) {
  // Last resort: VidSrc embed with ad parameters
  const embedUrl = mediaType === 'movie' 
    ? `https://vidsrc.to/embed/movie/${id}?ads=0&preroll=0&autostart=true`
    : `https://vidsrc.to/embed/tv/${id}/1/1?ads=0&preroll=0&autostart=true`;
  
  const iframe = document.createElement('iframe');
  iframe.src = embedUrl;
  iframe.allowFullscreen = true;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  
  document.getElementById('video-container').innerHTML = '';
  document.getElementById('video-container').appendChild(iframe);
}

function showVideoLoading() {
  document.getElementById('video-container').innerHTML = `
    <div class="loading-video">
      <div class="spinner"></div>
      <p>Loading ad-free video...</p>
    </div>
  `;
}

function closePlayer() {
  document.getElementById('player-modal').classList.remove('active');
  document.body.style.overflow = 'auto';
  if (currentVideo) {
    currentVideo.pause();
    currentVideo = null;
  }
  currentSources = [];
  currentSourceIndex = 0;
}

// Rest of your functions (favorites, etc.)let currentVideo = null;
let currentSources = [];
let currentSourceIndex = 0;

function openPlayer(id, mediaType, title) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('player-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
  
  showVideoLoading();
  loadSources(id, mediaType);
}

async function loadSources(id, mediaType) {
  try {
    const response = await fetch(`/api/sources?id=${id}&type=${mediaType}`);
    const data = await response.json();
    
    if (data.sources && data.sources.length > 0) {
      currentSources = data.sources;
      playSource(0);
    } else {
      // Fallback to iframe if direct sources fail
      loadEmbedFallback(id, mediaType);
    }
  } catch (error) {
    console.error('Sources failed:', error);
    loadEmbedFallback(id, mediaType);
  }
}

function playSource(index) {
  if (index >= currentSources.length) {
    loadEmbedFallback(CURRENT_ID, CURRENT_MEDIA_TYPE);
    return;
  }
  
  const source = currentSources[index];
  const container = document.getElementById('video-container');
  container.innerHTML = '';
  
  const video = document.createElement('video');
  video.controls = true;
  video.style.width = '100%';
  video.style.height = 'auto';
  video.style.maxHeight = '70vh';
  video.style.backgroundColor = '#000';
  
  if (source.type === 'hls') {
    // Load HLS.js for .m3u8 support
    loadHLSPlayer(video, source.url, index);
  } else {
    // Direct MP4
    const sourceEl = document.createElement('source');
    sourceEl.src = source.url;
    sourceEl.type = 'video/mp4';
    video.appendChild(sourceEl);
    video.addEventListener('error', () => playSource(index + 1));
    container.appendChild(video);
  }
  
  currentVideo = video;
}

function loadHLSPlayer(video, url, sourceIndex) {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
  script.onload = () => {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, () => playSource(sourceIndex + 1));
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('error', () => playSource(sourceIndex + 1));
    }
    document.getElementById('video-container').appendChild(video);
  };
  document.head.appendChild(script);
}

function loadEmbedFallback(id, mediaType) {
  // Last resort: VidSrc embed with ad parameters
  const embedUrl = mediaType === 'movie' 
    ? `https://vidsrc.to/embed/movie/${id}?ads=0&preroll=0&autostart=true`
    : `https://vidsrc.to/embed/tv/${id}/1/1?ads=0&preroll=0&autostart=true`;
  
  const iframe = document.createElement('iframe');
  iframe.src = embedUrl;
  iframe.allowFullscreen = true;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  
  document.getElementById('video-container').innerHTML = '';
  document.getElementById('video-container').appendChild(iframe);
}

function showVideoLoading() {
  document.getElementById('video-container').innerHTML = `
    <div class="loading-video">
      <div class="spinner"></div>
      <p>Loading ad-free video...</p>
    </div>
  `;
}

function closePlayer() {
  document.getElementById('player-modal').classList.remove('active');
  document.body.style.overflow = 'auto';
  if (currentVideo) {
    currentVideo.pause();
    currentVideo = null;
  }
  currentSources = [];
  currentSourceIndex = 0;
}

// Rest of your functions (favorites, etc.)let currentVideo = null;
let currentSources = [];
let currentSourceIndex = 0;

function openPlayer(id, mediaType, title) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('player-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
  
  showVideoLoading();
  loadSources(id, mediaType);
}

async function loadSources(id, mediaType) {
  try {
    const response = await fetch(`/api/sources?id=${id}&type=${mediaType}`);
    const data = await response.json();
    
    if (data.sources && data.sources.length > 0) {
      currentSources = data.sources;
      playSource(0);
    } else {
      // Fallback to iframe if direct sources fail
      loadEmbedFallback(id, mediaType);
    }
  } catch (error) {
    console.error('Sources failed:', error);
    loadEmbedFallback(id, mediaType);
  }
}

function playSource(index) {
  if (index >= currentSources.length) {
    loadEmbedFallback(CURRENT_ID, CURRENT_MEDIA_TYPE);
    return;
  }
  
  const source = currentSources[index];
  const container = document.getElementById('video-container');
  container.innerHTML = '';
  
  const video = document.createElement('video');
  video.controls = true;
  video.style.width = '100%';
  video.style.height = 'auto';
  video.style.maxHeight = '70vh';
  video.style.backgroundColor = '#000';
  
  if (source.type === 'hls') {
    // Load HLS.js for .m3u8 support
    loadHLSPlayer(video, source.url, index);
  } else {
    // Direct MP4
    const sourceEl = document.createElement('source');
    sourceEl.src = source.url;
    sourceEl.type = 'video/mp4';
    video.appendChild(sourceEl);
    video.addEventListener('error', () => playSource(index + 1));
    container.appendChild(video);
  }
  
  currentVideo = video;
}

function loadHLSPlayer(video, url, sourceIndex) {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
  script.onload = () => {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, () => playSource(sourceIndex + 1));
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('error', () => playSource(sourceIndex + 1));
    }
    document.getElementById('video-container').appendChild(video);
  };
  document.head.appendChild(script);
}

function loadEmbedFallback(id, mediaType) {
  // Last resort: VidSrc embed with ad parameters
  const embedUrl = mediaType === 'movie' 
    ? `https://vidsrc.to/embed/movie/${id}?ads=0&preroll=0&autostart=true`
    : `https://vidsrc.to/embed/tv/${id}/1/1?ads=0&preroll=0&autostart=true`;
  
  const iframe = document.createElement('iframe');
  iframe.src = embedUrl;
  iframe.allowFullscreen = true;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  
  document.getElementById('video-container').innerHTML = '';
  document.getElementById('video-container').appendChild(iframe);
}

function showVideoLoading() {
  document.getElementById('video-container').innerHTML = `
    <div class="loading-video">
      <div class="spinner"></div>
      <p>Loading ad-free video...</p>
    </div>
  `;
}

function closePlayer() {
  document.getElementById('player-modal').classList.remove('active');
  document.body.style.overflow = 'auto';
  if (currentVideo) {
    currentVideo.pause();
    currentVideo = null;
  }
  currentSources = [];
  currentSourceIndex = 0;
}

// Rest of your functions (favorites, etc.)
