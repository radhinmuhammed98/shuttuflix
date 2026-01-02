// Global search function
function searchMovies(query) {
  return new Promise((resolve, reject) => {
    if (query.length < 2) {
      resolve([]);
      return;
    }

    fetch(`/api/search?query=${encodeURIComponent(query)}`)
      .then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            throw new Error(errorData.error || `Error ${response.status}`);
          });
        }
        return response.json();
      })
      .then(data => {
        resolve(data.results || []);
      })
      .catch(error => {
        console.error('Search failed:', error);
        resolve([]);
      });
  });
}

// Initialize search
function initializeSearch() {
  const searchInput = document.getElementById('search');
  let debounceTimer;
  
  searchInput.addEventListener('input', function(e) {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    
    if (query === '') {
      window.dispatchEvent(new CustomEvent('show-default-catalog'));
      return;
    }
    
    debounceTimer = setTimeout(function() {
      searchMovies(query).then(results => {
        window.dispatchEvent(new CustomEvent('search-results', { 
          detail: { results, query } 
        }));
      });
    }, 500);
  });
}
