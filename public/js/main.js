import { initializeSearch } from './search.js';
import { openPlayer, closePlayer, initializePlayer } from './player.js';

let CATALOG = [];
const FAVORITES_KEY = 'shuttuflix-favorites';
const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');

// DOM elements
const gridContainer = document.getElementById('grid-container');
const loadingEl = document.getElementById('loading');
const noResultsEl = document.getElementById('no-results');
const searchInput = document.getElementById('search');
const modal = document.getElementById('modal');

// Load catalog on init
async function loadCatalog() {
  try {
    showLoading();
    
    const response = await fetch('/data/catalog.json');
    if (!response.ok) {
      throw new Error('Failed to load catalog');
    }
    
    CATALOG = await response.json();
    renderCatalog(CATALOG);
    
  } catch (error) {
    console.error('Error loading catalog:', error);
    showError('Failed to load movies. Please refresh the page.');
  } finally {
    hideLoading();
  }
}

function renderCatalog(items) {
  if (!items || items.length === 0) {
    showNoResults();
    return;
  }
  
  hideNoResults();
  gridContainer.innerHTML = items.slice(0, 100).map(item => `
    <div class="card" onclick="openPlayer(${item.id}, '${item.mediaType}')">
      <img class="poster" src="${item.poster}" alt="${item.title}">
      <div class="title" title="${item.title}">${item.title} (${item.year})</div>
    </div>
  `).join('');
}

function showLoading() {
  loadingEl.style.display = 'block';
  gridContainer.innerHTML = '';
  hideNoResults();
}

function hideLoading() {
  loadingEl.style.display = 'none';
}

function showNoResults() {
  noResultsEl.style.display = 'block';
  gridContainer.innerHTML = '';
}

function hideNoResults() {
  noResultsEl.style.display = 'none';
}

function showError(message) {
  noResultsEl.textContent = message;
  showNoResults();
}

// Event listeners
window.addEventListener('DOMContentLoaded', () => {
  // Initialize search functionality
  initializeSearch();
  
  // Initialize player
  initializePlayer();
  
  // Initial catalog load
  loadCatalog();
  
  // Handle search results
  window.addEventListener('search-results', (e) => {
    const { results, query } = e.detail;
    
    if (results.length === 0) {
      noResultsEl.textContent = `No results found for "${query}"`;
      showNoResults();
    } else {
      renderCatalog(results);
    }
    
    hideLoading();
  });
  
  // Show default catalog when search is cleared
  window.addEventListener('show-default-catalog', () => {
    renderCatalog(CATALOG);
  });
});

// Expose openPlayer to global scope for HTML onclick
window.openPlayer = openPlayer;
