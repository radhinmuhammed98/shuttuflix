// scripts/build-catalog.mjs
import fs from 'fs/promises';
import path from 'path';

// 🔑 REPLACE WITH YOUR TMDB API KEY
const TMDB_API_KEY = '930f5673a91af78bd7537f37f0c62555';

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      if (res.status === 429) await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

async function fetchMovies() {
  const all = [];
  const pages = 15; // ~300 movies

  for (let page = 1; page <= pages; page++) {
    console.log(`📚 Fetching movies page ${page}...`);
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=${page}&vote_count.gte=100`;
    const data = await fetchWithRetry(url);
    all.push(...data.results);
    await new Promise(r => setTimeout(r, 300)); // rate limit
  }
  return all;
}

async function fetchTV() {
  const all = [];
  const pages = 10; // ~200 shows

  for (let page = 1; page <= pages; page++) {
    console.log(`📺 Fetching TV page ${page}...`);
    const url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=${page}&vote_count.gte=50`;
    const data = await fetchWithRetry(url);
    all.push(...data.results);
    await new Promise(r => setTimeout(r, 300));
  }
  return all;
}

async function buildCatalog() {
  console.log('🚀 Building ShuttuFlix catalog...');
  
  const movies = await fetchMovies();
  const tv = await fetchTV();

  const catalog = [
    ...movies.map(m => ({
      id: m.id,
      title: m.title,
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w185${m.poster_path}` : null,
      mediaType: 'movie',
      year: m.release_date?.split('-')[0] || '????'
    })),
    ...tv.map(s => ({
      id: s.id,
      title: s.name,
      poster: s.poster_path ? `https://image.tmdb.org/t/p/w185${s.poster_path}` : null,
      mediaType: 'tv',
      year: s.first_air_date?.split('-')[0] || '????'
    }))
  ].filter(item => item.poster && item.title);

  // Save to public/data
  await fs.mkdir(path.resolve('./public/data'), { recursive: true });
  await fs.writeFile(
    path.resolve('./public/data/catalog.json'),
    JSON.stringify(catalog, null, 2)
  );
  
  console.log(`✅ Catalog built! (${catalog.length} items)`);
}

buildCatalog().catch(console.error);
