// Custom Player with Source Switching
let currentPlayer = null;
let currentSources = [];
let currentSourceIndex = 0;

function openPlayer(id, mediaType, title = 'Movie') {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal').classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Load sources for this content
  loadSources(id, mediaType);
}

async function loadSources(id, mediaType) {
  try {
    const response = await fetch(`/api/sources?id=${id}&type=${mediaType}`);
    const data = await response.json();
    
    if (data.sources && data.sources.length > 0) {
      currentSources = data.sources;
      currentSourceIndex = 0;
      switchSource(0);
    } else {
      showError('No sources available');
    }
  } catch (error) {
    console.error('Failed to load sources:', error);
    showError('Failed to load video sources');
  }
}

function switchSource(index) {
  if (index >= 0 && index < currentSources.length) {
    currentSourceIndex = index;
    const source = currentSources[index];
    
    // Create a clean iframe with ad-blocking parameters
    const iframe = document.getElementById('player');
    iframe.src = createCleanSourceUrl(source.url);
    
    // Update source indicator
    updateSourceIndicator();
  }
}

function createCleanSourceUrl(url) {
  // Add parameters to minimize ads
  const adBlockParams = [
    'ads=0',
    'preroll=0', 
    'midroll=0',
    'postroll=0',
    'autoplayAds=0',
    'autostart=true'
  ];
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${adBlockParams.join('&')}`;
}

function updateSourceIndicator() {
  const indicator = document.getElementById('source-indicator');
  if (indicator && currentSources.length > 1) {
    indicator.innerHTML = `
      <span>Source: ${currentSources[currentSourceIndex].name}</span>
      ${currentSources.length > 1 ? 
        `<button onclick="switchSource(${(currentSourceIndex + 1) % currentSources.length})">Next</button>` : 
        ''}
    `;
    indicator.style.display = 'block';
  }
}

function showError(message) {
  document.getElementById('player').src = '';
  document.getElementById('player').innerHTML = `
    <div style="color: white; text-align: center; padding: 40px;">
      <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
      <p>${message}</p>
      <button onclick="closePlayer()" style="margin-top: 20px; background: #fc81b5; border: none; padding: 10px 20px; border-radius: 24px; color: white; cursor: pointer;">
        Close
      </button>
    </div>
  `;
}

// Keep existing functions
function closePlayer() {
  document.getElementById('modal').classList.remove('active');
  document.getElementById('player').src = '';
  document.body.style.overflow = 'auto';
  currentPlayer = null;
  currentSources = [];
  currentSourceIndex = 0;
}

function toggleFavorite() {
  // Your existing favorite logic
}

function updateFavoriteButton() {
  // Your existing favorite button logic
}

function initializePlayer() {
  // Your existing player initialization
}
