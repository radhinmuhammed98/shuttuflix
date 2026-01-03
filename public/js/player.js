// Optimized Player with Proper Sandboxing
function openPlayer(id, mediaType, title) {
  // Update modal title
  document.getElementById('modal-title').textContent = title;
  document.getElementById('player-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Create proper VidKing URL with ad-reducing parameters
  let vidkingUrl;
  if (mediaType === 'movie') {
    vidkingUrl = `https://www.vidking.net/embed/movie/${id}?autoPlay=true&color=ff0000&ads=0&preroll=0`;
  } else {
    // TV Shows with season/episode
    vidkingUrl = `https://www.vidking.net/embed/tv/${id}/1/1?autoPlay=true&color=ff0000&ads=0&preroll=0&nextEpisode=true&episodeSelector=true`;
  }
  
  // Set iframe source
  const iframe = document.getElementById('player-iframe');
  if (iframe) {
    iframe.src = vidkingUrl;
    
    // Add sandbox attributes programmatically for better security
    iframe.setAttribute('sandbox', 
      'allow-same-origin allow-scripts allow-popups allow-forms allow-modals ' +
      'allow-orientation-lock allow-pointer-lock allow-presentation ' +
      'allow-top-navigation-by-user-activation allow-downloads'
    );
  }
}

function closePlayer() {
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-iframe');
  
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
  
  if (iframe) {
    iframe.src = ''; // Stop video and clear ads
  }
  
  // Clean up any ad-related scripts
  cleanupAds();
}

// Aggressive ad cleanup function
function cleanupAds() {
  // Remove any ad elements that might have been injected
  const adSelectors = [
    '.ad-container', '.popup-overlay', '.ad-banner', 
    '.interstitial', '[id*="ad"]', '[class*="ad"]',
    'iframe[src*="ads"]', 'script[src*="ads"]'
  ];
  
  adSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  });
}

// Initialize player and event listeners
document.addEventListener('DOMContentLoaded', function() {
  const closeModal = document.getElementById('close-modal');
  const modal = document.getElementById('player-modal');
  
  if (closeModal) {
    closeModal.addEventListener('click', closePlayer);
  }
  
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closePlayer();
    });
  }
  
  // Close with ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closePlayer();
    }
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanupAds);
});
