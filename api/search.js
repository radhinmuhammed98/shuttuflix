// api/search.js
export default async function (req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const query = url.searchParams.get('query');

  if (!query || query.length < 2) {
    res.status(400).json({ error: 'Query must be at least 2 characters' });
    return;
  }

  try {
    // Get TMDB API key from environment variables
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY not configured');
    }

    // Fetch data from TMDB API
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`
    );

    if (!tmdbRes.ok) {
      throw new Error(`TMDB API error: ${tmdbRes.status}`);
    }

    const tmdbData = await tmdbRes.json();
    
    // Transform TMDB response to our format
    const results = tmdbData.results
      .filter(item => 
        item.poster_path && 
        (item.media_type === 'movie' || item.media_type === 'tv')
      )
      .slice(0, 20) // Limit to 20 results
      .map(item => ({
        id: item.id,
        title: item.title || item.name,
        poster: `https://image.tmdb.org/t/p/w185${item.poster_path}`,
        mediaType: item.media_type,
        year: item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || '????',
        description: item.overview
      }));

    res.status(200).json({ results });
    
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
