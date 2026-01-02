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
    // Get direct sources from public APIs
    const sources = await fetchDirectSources(id, type);
    res.status(200).json({ sources });
  } catch (error) {
    console.error('Source fetch error:', error);
    res.status(500).json({ error: 'No sources available' });
  }
}

async function fetchDirectSources(tmdbId, type) {
  const sources = [];
  
  // Method 1: Try vidsrc.to's direct API (no embed iframe)
  try {
    const vidsrcResponse = await fetch(
      `https://vidsrc.to/ajax/embed/${type}/${tmdbId}`
    );
    const vidsrcData = await vidsrcResponse.json();
    
    if (vidsrcData && vidsrcData.result && vidsrcData.result.sources) {
      vidsrcData.result.sources.forEach(source => {
        if (source.file && (source.file.includes('.m3u8') || source.file.includes('.mp4'))) {
          sources.push({
            url: source.file,
            quality: source.label || 'auto',
            type: source.file.includes('.m3u8') ? 'hls' : 'mp4',
            provider: 'vidsrc-direct'
          });
        }
      });
    }
  } catch (e) {
    console.log('VidSrc direct failed:', e);
  }

  // Method 2: Try fembed API
  try {
    const fembedResponse = await fetch(
      `https://fembed-hd.com/api/source/${tmdbId}`
    );
    const fembedData = await fembedResponse.json();
    
    if (fembedData && fembedData.success && fembedData.data) {
      fembedData.data.forEach(track => {
        if (track.file) {
          sources.push({
            url: track.file,
            quality: track.label || 'auto',
            type: 'mp4',
            provider: 'fembed'
          });
        }
      });
    }
  } catch (e) {
    console.log('Fembed failed:', e);
  }

  // Method 3: Try your own proxy to avoid CORS
  // (This requires deploying a simple proxy server)

  return sources.filter(source => source.url);
}
