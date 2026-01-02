// api/sources.js
export default async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const id = url.searchParams.get('id');
  const type = url.searchParams.get('type') || 'movie';
  const season = url.searchParams.get('season') || '1';
  const episode = url.searchParams.get('episode') || '1';

  if (!id) {
    res.status(400).json({ error: 'ID is required' });
    return;
  }

  try {
    // Get sources from multiple providers
    const sources = await getSources(id, type, season, episode);
    res.status(200).json({ sources });
  } catch (error) {
    console.error('Sources API error:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
}

async function getSources(id, type, season, episode) {
  const sources = [];
  
  // Try different source providers in order of preference
  const providers = [
    { name: 'vidsrc', url: buildVidSrcUrl(id, type, season, episode) },
    { name: '2embed', url: build2EmbedUrl(id) },
    { name: 'streamlare', url: buildStreamlareUrl(id) }
  ];
  
  // Add all providers to sources array
  for (const provider of providers) {
    if (provider.url) {
      sources.push({
        name: provider.name,
        url: provider.url,
        priority: getPriority(provider.name)
      });
    }
  }
  
  return sources.sort((a, b) => a.priority - b.priority);
}

function getPriority(provider) {
  const priorityMap = {
    'vidsrc': 1,
    '2embed': 2,
    'streamlare': 3
  };
  return priorityMap[provider] || 99;
}

function buildVidSrcUrl(id, type, season, episode) {
  try {
    if (type === 'movie') {
      return `https://vidsrc.to/embed/movie/${id}`;
    } else {
      return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`;
    }
  } catch {
    return null;
  }
}

function build2EmbedUrl(id) {
  try {
    // You'll need to convert TMDB ID to IMDb ID
    // For now, return null or implement conversion
    return null;
  } catch {
    return null;
  }
}

function buildStreamlareUrl(id) {
  try {
    // Streamlare uses different ID format
    return null;
  } catch {
    return null;
  }
}
