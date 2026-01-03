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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
  const id = searchParams.get('id');
  const type = searchParams.get('type') || 'movie';

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    // Get direct .m3u8 sources from VidSrc
    const sources = await getVidSrcSources(id, type);
    res.status(200).json({ sources });
  } catch (error) {
    console.error('Source error:', error.message);
    // Fallback to VidKing embed URL (no direct sources)
    res.status(200).json({ 
      sources: [{ url: getVidKingEmbedUrl(id, type), type: 'embed' }] 
    });
  }
}

async function getVidSrcSources(id, type) {
  // Step 1: Get the embed page to extract data-id
  const embedRes = await fetch(`https://vidsrc.to/embed/${type}/${id}`);
  const embedHtml = await embedRes.text();
  
  // Extract data-id from the page
  const idMatch = embedHtml.match(/data-id="([^"]+)"/);
  if (!idMatch) throw new Error('No data-id found');
  
  // Step 2: Get sources using the data-id
  const sourcesRes = await fetch(`https://vidsrc.to/ajax/embed/${type}/${idMatch[1]}`);
  const sourcesData = await sourcesRes.json();
  
  // Return only .m3u8 sources
  if (sourcesData.result?.sources) {
    const m3u8Sources = sourcesData.result.sources
      .filter(s => s.file && s.file.includes('.m3u8'))
      .map(s => ({ url: s.file, type: 'hls' }));
    
    if (m3u8Sources.length > 0) {
      return m3u8Sources;
    }
  }
  
  throw new Error('No .m3u8 sources found');
}

function getVidKingEmbedUrl(id, type) {
  return type === 'movie' 
    ? `https://www.vidking.net/embed/movie/${id}?autoPlay=true&color=ff0000&ads=0&preroll=0`
    : `https://www.vidking.net/embed/tv/${id}/1/1?autoPlay=true&color=ff0000&ads=0&preroll=0&nextEpisode=true&episodeSelector=true`;
}
