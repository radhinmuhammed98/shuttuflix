let CURRENT_ID = null;
let CURRENT_MEDIA_TYPE = null;
const FAVORITES_KEY = 'shuttuflix-favorites';
let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');

export function openPlayer(id, mediaType) {
  CURRENT_ID = id;
  CURRENT_MEDIA_TYPE = mediaType;
  
  // Use VidSrc instead of VidKing for fewer ads
  let embedUrl;
  if (mediaType === 'movie') {
    embedUrl = `https://vidsrc.to/embed/movie/${id}?autostart=true`;
  } else {
    // Default to season 1, episode 1 for TV shows
    embedUrl = `https://vidsrc.to/embed/tv/${id}/1/1?autostart=true`;
  }
  
  document.getElementById('player').src = embedUrl;
  document.getElementById('modal').classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Update favorite button
  updateFavoriteButton();
}

export function closePlayer() {
  document.getElementById('modal').classList.remove('active');
  document.getElementById('player').src = '';
  document.body.style.overflow = 'auto';
}

export function toggleFavorite() {
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

function updateFavoriteButton() {
  const btn = document.querySelector('.favorites-btn');
  if (!btn) return;
  
  btn.textContent = favorites.includes(CURRENT_ID) ? '❤️' : '🤍';
}

export function initializePlayer() {
  const modal = document.getElementById('modal');
  const closeModal = document.getElementById('close-modal');
  const player = document.getElementById('player');
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closePlayer();
    }
  });
  
  // Close with ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closePlayer();
    }
  });
  
  // Favorites button
  const favoritesBtn = document.querySelector('.favorites-btn');
  if (favoritesBtn) {
    favoritesBtn.addEventListener('click', toggleFavorite);
  }
  
  // Progress bar
  window.addEventListener('scroll', updateProgressBar);
}

function updateProgressBar() {
  const scrollTop = document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (scrollTop / scrollHeight) * 100;
  
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    progressBar.style.width = `${scrolled}%`;
  }
}
