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
    // Get direct sources from VidSrc (no iframe needed)
    const sources = await getVidSrcDirectSources(id, type);
    res.status(200).json({ sources });
  } catch (error) {
    console.error('Source error:', error);
    res.status(500).json({ error: 'No sources available' });
  }
}

async function getVidSrcDirectSources(id, type) {
  // Step 1: Get the embed ID from VidSrc
  const embedRes = await fetch(`https://vidsrc.to/embed/${type}/${id}`);
  const embedHtml = await embedRes.text();
  
  // Extract data-id from the page
  const idMatch = embedHtml.match(/data-id="([^"]+)"/);
  if (!idMatch) throw new Error('No embed ID found');
  
  // Step 2: Get direct sources using the embed ID
  const sourcesRes = await fetch(`https://vidsrc.to/ajax/embed/${type}/${idMatch[1]}`);
  const sourcesData = await sourcesRes.json();
  
  // Return only .m3u8 sources (HLS streams)
  if (sourcesData.result?.sources) {
    return sourcesData.result.sources
      .filter(s => s.file && s.file.includes('.m3u8'))
      .map(s => ({
        url: s.file,
        quality: s.label || 'auto',
        type: 'hls',
        provider: 'vidsrc'
      }));
  }
  
  return [];
}
