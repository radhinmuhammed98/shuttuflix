// scripts/build-catalog.mjs
import fs from 'fs/promises';
import path from 'path';
import { config } from 'dotenv';

config(); // Load .env.local

const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY is not set in .env.local');
}

const MAX_RETRIES = 3;

async function fetchWithRetry(url) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        console.log(`Rate limited. Waiting before retry ${attempt}...`);
        await new Promise(r => setTimeout(r, 2000 * attempt));
        continue;
      }
      return await res.json();
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      console.log(`Attempt ${attempt} failed. Retrying...`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function fetchMovies() {
  const allMovies = [];
  const pages = 15; // ~300 movies

  for (let page = 1; page <= pages; page++) {
    console.log(`📚 Fetching movies page ${page}...`);
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=${page}&vote_count.gte=100`;
    const data = await fetchWithRetry(url);
    allMovies.push(...data.results);
    await new Promise(r => setTimeout(r, 500)); // Rate limiting
  }
  return allMovies;
}

async function fetchTV() {
  const allTV = [];
  const pages = 10; // ~200 shows

  for (let page = 1; page <= pages; page++) {
    console.log(`📺 Fetching TV page ${page}...`);
    const url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=${page}&vote_count.gte=50`;
    const data = await fetchWithRetry(url);
    allTV.push(...data.results);
    await new Promise(r => setTimeout(r, 500)); // Rate limiting
  }
  return allTV;
}

async function buildCatalog() {
  console.log('🚀 Building ShuttuFlix catalog...');
  
  try {
    const [movies, tv] = await Promise.all([fetchMovies(), fetchTV()]);

    const catalog = [
      ...movies.map(m => ({
        id: m.id,
        title: m.title,
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w185${m.poster_path}` : null,
        mediaType: 'movie',
        year: m.release_date?.split('-')[0] || '????',
        description: m.overview
      })),
      ...tv.map(s => ({
        id: s.id,
        title: s.name,
        poster: s.poster_path ? `https://image.tmdb.org/t/p/w185${s.poster_path}` : null,
        mediaType: 'tv',
        year: s.first_air_date?.split('-')[0] || '????',
        description: s.overview
      }))
    ].filter(item => item.poster && item.title);

    await fs.mkdir(path.resolve('./public/data'), { recursive: true });
    await fs.writeFile(
      path.resolve('./public/data/catalog.json'),
      JSON.stringify(catalog, null, 2)
    );
    
    console.log(`✅ Catalog built! ${catalog.length} items`);
  } catch (error) {
    console.error('❌ Failed to build catalog:', error.message);
    process.exit(1);
  }
}

buildCatalog();
