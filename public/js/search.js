export async function searchMovies(query) {
  if (query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

export function initializeSearch() {
  const searchInput = document.getElementById('search');
  
  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    
    if (query === '') {
      // Show default catalog when search is cleared
      window.dispatchEvent(new CustomEvent('show-default-catalog'));
      return;
    }
    
    debounceTimer = setTimeout(async () => {
      const results = await searchMovies(query);
      window.dispatchEvent(new CustomEvent('search-results', { detail: { results, query } }));
    }, 500);
  });
}
