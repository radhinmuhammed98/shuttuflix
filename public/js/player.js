class ShuttuPlayer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.video = null;
    this.sources = [];
    this.currentSourceIndex = 0;
    this.hls = null;
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    this.initPlayer();
  }
  
  async initPlayer() {
    // Create video element
    this.video = document.createElement('video');
    this.video.controls = true;
    this.video.playsInline = true;
    this.video.style.width = '100%';
    this.video.style.height = '100%';
    this.video.style.backgroundColor = '#000';
    this.video.style.objectFit = 'contain';
    
    // Create loading overlay
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = 'player-loading';
    this.loadingOverlay.innerHTML = `
      <div class="spinner"></div>
      <p>Loading stream...</p>
      <div class="source-indicator">
        <span id="current-source">Source: Loading...</span>
        <button id="next-source" style="margin-left: 10px;">↻</button>
      </div>
    `;
    
    // Create error overlay
    this.errorOverlay = document.createElement('div');
    this.errorOverlay.className = 'player-error';
    this.errorOverlay.style.display = 'none';
    this.errorOverlay.innerHTML = `
      <div style="color: white; text-align: center; padding: 20px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
        <p>Stream unavailable</p>
        <button id="retry-stream" style="background: #ff0a26; border: none; padding: 8px 16px; border-radius: 4px; color: white; margin-top: 10px; cursor: pointer;">
          Try Next Source
        </button>
      </div>
    `;
    
    // Create quality selector
    this.qualitySelector = document.createElement('div');
    this.qualitySelector.className = 'quality-selector';
    this.qualitySelector.style.position = 'absolute';
    this.qualitySelector.style.bottom = '10px';
    this.qualitySelector.style.right = '10px';
    this.qualitySelector.style.background = 'rgba(0,0,0,0.7)';
    this.qualitySelector.style.color = 'white';
    this.qualitySelector.style.padding = '4px 8px';
    this.qualitySelector.style.borderRadius = '4px';
    this.qualitySelector.style.fontSize = '12px';
    
    // Assemble player
    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.appendChild(this.video);
    this.container.appendChild(this.loadingOverlay);
    this.container.appendChild(this.errorOverlay);
    this.container.appendChild(this.qualitySelector);
    
    // Setup event listeners
    document.getElementById('next-source').addEventListener('click', () => this.switchSource());
    document.getElementById('retry-stream').addEventListener('click', () => this.switchSource());
    
    // Hide loading after 3 seconds (fallback)
    setTimeout(() => {
      if (this.loadingOverlay.style.display !== 'none') {
        this.showLoading(false);
      }
    }, 3000);
  }
  
  async loadContent(id, type, title, imdbId = '') {
    this.showLoading(true);
    this.showError(false);
    
    try {
      // Get signed sources from our server
      const response = await fetch(`/api/sources?id=${id}&type=${type}&imdb_id=${imdbId}`);
      const data = await response.json();
      
      if (data.sources && data.sources.length > 0) {
        this.sources = data.sources;
        this.currentSourceIndex = 0;
        this.loadSource();
      } else {
        throw new Error('No sources available');
      }
    } catch (error) {
      console.error('Failed to load sources:', error);
      this.showError(true, 'No working sources available');
    }
  }
  
  async loadSource() {
    if (this.currentSourceIndex >= this.sources.length) {
      this.showError(true, 'All sources failed');
      return;
    }
    
    const source = this.sources[this.currentSourceIndex];
    document.getElementById('current-source').textContent = `Source: ${source.provider}`;
    
    try {
      if (source.type === 'hls') {
        await this.loadHLS(source.url);
      } else {
        await this.loadMP4(source.url);
      }
      
      // Hide loading after successful load
      this.showLoading(false);
      
    } catch (error) {
      console.error('Source failed:', error);
      this.currentSourceIndex++;
      if (this.currentSourceIndex < this.sources.length) {
        setTimeout(() => this.loadSource(), 1000);
      } else {
        this.showError(true, 'All sources failed');
      }
    }
  }
  
  async loadHLS(url) {
    if (Hls.isSupported()) {
      if (this.hls) {
        this.hls.destroy();
      }
      
      this.hls = new Hls({
        autoStartLoad: true,
        startPosition: -1,
        capLevelToPlayerSize: true,
        maxBufferLength: 30
      });
      
      return new Promise((resolve, reject) => {
        this.hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            reject(new Error('HLS fatal error'));
          }
        });
        
        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
          resolve();
        });
        
        this.hls.loadSource(url);
        this.hls.attachMedia(this.video);
      });
    } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      this.video.src = url;
      return new Promise((resolve) => {
        this.video.onloadedmetadata = resolve;
        this.video.onerror = reject;
      });
    } else {
      throw new Error('HLS not supported');
    }
  }
  
  async loadMP4(url) {
    // Use proxy for MP4 to avoid CORS issues
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    this.video.src = proxyUrl;
    
    return new Promise((resolve, reject) => {
      this.video.onloadedmetadata = resolve;
      this.video.onerror = reject;
    });
  }
  
  switchSource() {
    if (this.currentSourceIndex < this.sources.length - 1) {
      this.currentSourceIndex++;
      this.loadSource();
    } else {
      this.currentSourceIndex = 0;
      this.loadSource();
    }
  }
  
  showLoading(show) {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }
  }
  
  showError(show, message = '') {
    if (this.errorOverlay) {
      this.errorOverlay.style.display = show ? 'flex' : 'none';
      if (message) {
        this.errorOverlay.querySelector('p').textContent = message;
      }
    }
  }
  
  destroy() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    if (this.video) {
      this.video.pause();
      this.video.src = '';
      this.video = null;
    }
  }
}

// Initialize global player
let shuttuPlayer = null;

function initPlayer() {
  const container = document.getElementById('video-container');
  if (container && !shuttuPlayer) {
    shuttuPlayer = new ShuttuPlayer('video-container');
  }
}

function openPlayer(id, mediaType, title) {
  const modal = document.getElementById('player-modal');
  const modalTitle = document.getElementById('modal-title');
  
  if (modalTitle) modalTitle.textContent = title;
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  // Initialize player if not already done
  if (!shuttuPlayer) {
    initPlayer();
  }
  
  // Load content
  if (shuttuPlayer) {
    shuttuPlayer.loadContent(id, mediaType, title);
  }
}

function closePlayer() {
  const modal = document.getElementById('player-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
  
  if (shuttuPlayer) {
    shuttuPlayer.destroy();
    shuttuPlayer = null;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initPlayer);
