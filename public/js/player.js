<script>
// Global variables
let CURRENT_ID = null;
let CURRENT_MEDIA_TYPE = null;
let CURRENT_TITLE = null;
const FAVORITES_KEY = 'shuttuflix-favorites';
let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');

// PLAYER FUNCTIONS
function openPlayer(id, mediaType, title) {
  // Store current info
  CURRENT_ID = id;
  CURRENT_MEDIA_TYPE = mediaType;
  CURRENT_TITLE = title;
  
  // Update modal title
  const modalTitle = document.getElementById('modal-title');
  if (modalTitle) {
    modalTitle.textContent = title;
  }
  
  // Show modal
  const modal = document.getElementById('player-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  // Create and load iframe
  createPlayerIframe(id, mediaType);
}

function createPlayerIframe(id, mediaType) {
  // Create clean VidKing URL
  let vidkingUrl;
  if (mediaType === 'movie') {
    vidkingUrl = `https://www.vidking.net/embed/movie/${id}?autoPlay=true&color=ff0000`;
  } else {
    vidkingUrl = `https://www.vidking.net/embed/tv/${id}/1/1?autoPlay=true&color=ff0000&nextEpisode=true&episodeSelector=true`;
  }
  
  // Create iframe element
  const iframe = document.createElement('iframe');
  iframe.src = vidkingUrl;
  iframe.allowFullscreen = true;
  iframe.allow = 'autoplay; fullscreen';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  
  // Find video container and insert iframe
  const container = document.getElementById('video-container');
  if (container) {
    container.innerHTML = '';
    container.appendChild(iframe);
  }
}

function closePlayer() {
  const modal = document.getElementById('player-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
  
  // Clear video container
  const container = document.getElementById('video-container');
  if (container) {
    container.innerHTML = '';
  }
  
  // Reset current info
  CURRENT_ID = null;
  CURRENT_MEDIA_TYPE = null;
  CURRENT_TITLE = null;
}

// FAVORITES
function toggleFavorite() {
  if (!CURRENT_ID) return;
  
  const btn = document.querySelector('.favorites-btn');
  if (!btn) return;
  
  const isFavorite = favorites.includes(CURRENT_ID);
  
  if (isFavorite) {
    favorites = favorites.filter(itemId => itemId !== CURRENT_ID);
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
  
  // Close modal when clicking outside
  const modal = document.getElementById('player-modal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closePlayer();
      }
    });
  }
  
  // Close with ESC key
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

// Make functions globally accessible for HTML onclick
window.openPlayer = openPlayer;
window.closePlayer = closePlayer;
window.toggleFavorite = toggleFavorite;
</script>
