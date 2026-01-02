// api/search.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ results });
    
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
