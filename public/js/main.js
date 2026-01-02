// Remove ES6 imports - use global functions instead

// Global variables
let CATALOG = [];
const FAVORITES_KEY = 'shuttuflix-favorites';
const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');

// DOM elements
const gridContainer = document.getElementById('grid-container');
const loadingEl = document.getElementById('loading');
const noResultsEl = document.getElementById('no-results');
const searchInput = document.getElementById('search');
const modal = document.getElementById('modal');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Load catalog
  loadCatalog();
  
  // Initialize search
  initializeSearch();
  
  // Initialize player
  initializePlayer();
  
  // Handle search results
  window.addEventListener('search-results', function(e) {
    const { results, query } = e.detail;
    
    if (results.length === 0) {
      noResultsEl.textContent = `No results found for "${query}"`;
      noResultsEl.style.display = 'block';
      gridContainer.innerHTML = '';
    } else {
      renderCatalog(results);
      noResultsEl.style.display = 'none';
    }
    
    loadingEl.style.display = 'none';
  });
  
  // Show default catalog when search is cleared
  window.addEventListener('show-default-catalog', function() {
    renderCatalog(CATALOG);
    noResultsEl.style.display = 'none';
  });
});

// Load catalog function
function loadCatalog() {
  showLoading();
  
  fetch('/data/catalog.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load catalog');
      }
      return response.json();
    })
    .then(data => {
      CATALOG = data;
      renderCatalog(CATALOG);
    })
    .catch(error => {
      console.error('Error loading catalog:', error);
      noResultsEl.textContent = 'Failed to load movies. Please refresh the page.';
      noResultsEl.style.display = 'block';
    })
    .finally(() => {
      loadingEl.style.display = 'none';
    });
}

// Render catalog function
function renderCatalog(items) {
  if (!items || items.length === 0) {
    noResultsEl.style.display = 'block';
    gridContainer.innerHTML = '';
    return;
  }
  
  noResultsEl.style.display = 'none';
  gridContainer.innerHTML = items.slice(0, 100).map(item => `
    <div class="card" onclick="openPlayer(${item.id}, '${item.mediaType}')">
      <img class="poster" src="${item.poster}" alt="${item.title}">
      <div class="title" title="${item.title}">${item.title} (${item.year})</div>
    </div>
  `).join('');
}

// Loading functions
function showLoading() {
  loadingEl.style.display = 'block';
  gridContainer.innerHTML = '';
  noResultsEl.style.display = 'none';
}

// Global functions for HTML onclick
window.openPlayer = openPlayer;
window.closePlayer = closePlayer;
window.toggleFavorite = toggleFavorite;
