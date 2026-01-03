// api/sources.js
export default async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
  const id = searchParams.get('id');
  const type = searchParams.get('type') || 'movie';

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    // Try VidSrc first (cleanest sources)
    const sources = await getVidSrcSources(id, type);
    if (sources.length > 0) {
      return res.status(200).json({ sources });
    }
    
    // Fallback to other sources
    const fallbackSources = await getFallbackSources(id, type);
    res.status(200).json({ sources: fallbackSources });
    
  } catch (error) {
    console.error('Sources API error:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
}

async function getVidSrcSources(id, type) {
  try {
    // Get embed page to extract data-id
    const embedRes = await fetch(`https://vidsrc.to/embed/${type}/${id}`);
    const embedHtml = await embedRes.text();
    
    const idMatch = embedHtml.match(/data-id="([^"]+)"/);
    if (!idMatch) return [];
    
    // Get direct sources
    const sourcesRes = await fetch(`https://vidsrc.to/ajax/embed/${type}/${idMatch[1]}`);
    const sourcesData = await sourcesRes.json();
    
    if (sourcesData.result?.sources) {
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
  } catch (error) {
    console.log('VidSrc failed:', error.message);
    return [];
  }
}

async function getFallbackSources(id, type) {
  // Add other source providers here if needed
  return [];
}
