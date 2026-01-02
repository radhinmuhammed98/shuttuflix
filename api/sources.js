// api/sources.js
export default async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const id = url.searchParams.get('id');
  const type = url.searchParams.get('type') || 'movie';

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    // Try to get direct sources
    const sources = await getDirectSources(id, type);
    res.status(200).json({ sources });
  } catch (error) {
    console.error('Source error:', error);
    res.status(500).json({ error: 'No sources available' });
  }
}

async function getDirectSources(tmdbId, type) {
  const sources = [];
  
  // Method 1: VidSrc direct (most reliable)
  try {
    const vidSrcSources = await getVidSrcSources(tmdbId, type);
    sources.push(...vidSrcSources);
  } catch (e) {
    console.log('VidSrc failed');
  }
  
  // Method 2: F2Movies (if you can get IMDb ID)
  // You'd need TMDB → IMDb conversion
  
  return sources;
}

async function getVidSrcSources(tmdbId, type) {
  // This is the actual Cineby-like approach
  const sources = [];
  
  // Step 1: Get the embed page
  const embedUrl = `https://vidsrc.to/embed/${type}/${tmdbId}`;
  const embedRes = await fetch(embedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  if (!embedRes.ok) return [];
  
  const embedHtml = await embedRes.text();
  
  // Step 2: Extract the real source ID
  const idMatch = embedHtml.match(/data-id="([^"]+)"/);
  if (!idMatch) return [];
  
  const realId = idMatch[1];
  
  // Step 3: Get direct sources
  const sourcesUrl = `https://vidsrc.to/ajax/embed/${type}/${realId}`;
  const sourcesRes = await fetch(sourcesUrl);
  const sourcesData = await sourcesRes.json();
  
  if (sourcesData && sourcesData.result && sourcesData.result.sources) {
    return sourcesData.result.sources
      .filter(s => s.file && (s.file.includes('.m3u8') || s.file.includes('.mp4')))
      .map(s => ({
        url: s.file,
        quality: s.label || 'auto',
        type: s.file.includes('.m3u8') ? 'hls' : 'mp4',
        provider: 'vidsrc'
      }));
  }
  
  return [];
}
