// scripts/build-catalog.mjs
import fs from 'fs';
import path from 'path';

// Get TMDB key from Vercel env
const TMDB_KEY = process.env.TMDB_API_KEY;
if (!TMDB_KEY) {
  throw new Error("TMDB_API_KEY is required");
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (res.ok) return await res.json();
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function fetchCatalog() {
  console.log("🔍 Fetching TMDB catalog...");
  
  const movies = await Promise.all([
    // Trending movies
    fetchWithRetry(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}&page=1`),
    fetchWithRetry(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}&page=2`),
    // Top rated
    fetchWithRetry(`https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_KEY}&page=1`),
    // Popular
    fetchWithRetry(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&page=1`),
  ]);

  const tv = await Promise.all([
    fetchWithRetry(`https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}&page=1`),
    fetchWithRetry(`https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}&page=2`),
  ]);

  const allMovies = movies.flatMap(r => r.results).slice(0, 500);
  const allTV = tv.flatMap(r => r.results).slice(0, 300);

  const catalog = [
    ...allMovies.map(m => ({
      id: m.id,
      title: m.title,
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w185${m.poster_path}` : null,
      mediaType: 'movie',
      year: m.release_date?.split('-')[0] || '????'
    })),
    ...allTV.map(s => ({
      id: s.id,
      title: s.name,
      poster: s.poster_path ? `https://image.tmdb.org/t/p/w185${s.poster_path}` : null,
      mediaType: 'tv',
      year: s.first_air_date?.split('-')[0] || '????'
    }))
  ].filter(item => item.poster);

  await fs.promises.mkdir(path.resolve('./public/data'), { recursive: true });
  await fs.promises.writeFile(
    path.resolve('./public/data/catalog.json'),
    JSON.stringify(catalog, null, 2)
  );
  
  console.log(`✅ Catalog built! ${catalog.length} items`);
}

fetchCatalog().catch(console.error);
