<script>
// Global variables
let CATALOG = [];
let CURRENT_ID = null;
let CURRENT_MEDIA_TYPE = null;
let CURRENT_TITLE = null;
const FAVORITES_KEY = 'shuttuflix-favorites';
let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');

// PLAYER FUNCTIONS
function openPlayer(id, mediaType, title) {
  CURRENT_ID = id;
  CURRENT_MEDIA_TYPE = mediaType;
  CURRENT_TITLE = title;
  
  // Update modal UI
  document.getElementById('modal-title').textContent = title;
  document.getElementById('player-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Show loading state
  showVideoLoading();
  
  // Try to load sources
  loadSources(id, mediaType);
}

function loadSources(id, mediaType) {
  // For now, use VidSrc embed as fallback (since direct sources are complex)
  // But with ad-reducing parameters
  const embedUrl = mediaType === 'movie' 
    ? `https://vidsrc.to/embed/movie/${id}?ads=0&preroll=0&autostart=true`
    : `https://vidsrc.to/embed/tv/${id}/1/1?ads=0&preroll=0&autostart=true`;
  
  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = embedUrl;
  iframe.allowFullscreen = true;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.allow = 'autoplay';
  
  // Replace loading with iframe
  const container = document.getElementById('video-container');
  container.innerHTML = '';
  container.appendChild(iframe);
}

function showVideoLoading() {
  const container = document.getElementById('video-container');
  container.innerHTML = `
    <div class="loading-video">
      <div class="spinner"></div>
      <p>Loading video...</p>
    </div>
  `;
}

function closePlayer() {
  document.getElementById('player-modal').classList.remove('active');
  document.body.style.overflow = 'auto';
  // Clear video container
  const container = document.getElementById('video-container');
  if (container) {
    container.innerHTML = '';
  }
  CURRENT_ID = null;
  CURRENT_MEDIA_TYPE = null;
  CURRENT_TITLE = null;
}

// FAVORITES
function toggleFavorite() {
  if (!CURRENT_ID) return;
  
  const btn = document.querySelector('.favorites-btn');
  const isFavorite = favorites.includes(CURRENT_ID);
  
  if (isFavorite) {
    favorites = favorites.filter(id => id !== CURRENT_ID);
    btn.textContent = '🤍';
  } else {
    favorites.push(CURRENT_ID);
    btn.textContent = '❤️';
  }
  
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', function() {
  // Close modal button
  const closeModal = document.getElementById('close-modal');
  if (closeModal) {
    closeModal.addEventListener('click', closePlayer);
  }
  
  // Close on backdrop click
  const modal = document.getElementById('player-modal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closePlayer();
      }
    });
  }
  
  // Close on ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closePlayer();
    }
  });
  
  // Favorites button
  const favoritesBtn = document.querySelector('.favorites-btn');
  if (favoritesBtn) {
    favoritesBtn.addEventListener('click', toggleFavorite);
  }
});
</script>
