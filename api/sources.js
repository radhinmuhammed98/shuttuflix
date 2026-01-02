// api/sources.js
const SOURCES = [
  { 
    name: 'vidsrc', 
    domains: ['https://vidsrc.to', 'https://vidsrc.xyz', 'https://vidsrc.pro'],
    tokenRotation: ['tkn1_vidsrc', 'tkn2_vidsrc', 'tkn3_vidsrc'],
    endpoint: '/ajax/embed/{type}/{id}'
  },
  { 
    name: 'f2movies', 
    domains: ['https://f2movies.to', 'https://f2movies.is', 'https://f2movies.app'],
    tokenRotation: ['tkn1_f2m', 'tkn2_f2m', 'tkn3_f2m'],
    endpoint: '/player/{type}/{id}?source=1'
  },
  { 
    name: '2embed', 
    domains: ['https://www.2embed.cc', 'https://2embed.ru', 'https://2embed.to'],
    tokenRotation: ['tkn1_2e', 'tkn2_2e', 'tkn3_2e'],
    endpoint: '/embed/{imdb_id}'
  }
];

// Simple "encryption" for signed URLs (in production, use proper crypto)
function generateSignedUrl(url, expires = 3600) {
  const timestamp = Math.floor(Date.now() / 1000);
  const expiry = timestamp + expires;
  const signature = btoa(`${url}|${expiry}|${process.env.URL_SECRET || 'default_secret'}`).replace(/=/g, '');
  return `${url}?expires=${expiry}&signature=${signature}`;
}

// Validate signed URL
function validateSignedUrl(url, signature, expires) {
  const expectedSig = btoa(`${url}|${expires}|${process.env.URL_SECRET || 'default_secret'}`).replace(/=/g, '');
  return signature === expectedSig && expires > Math.floor(Date.now() / 1000);
}

export default async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
  const imdbId = searchParams.get('imdb_id') || '';

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    const sources = await getWorkingSources(id, type, imdbId);
    res.status(200).json({ sources });
  } catch (error) {
    console.error('Source error:', error);
    res.status(500).json({ error: 'No working sources available' });
  }
}

async function getWorkingSources(id, type, imdbId) {
  const results = [];
  const now = Date.now();
  
  // Try each source provider
  for (const source of SOURCES) {
    try {
      // Domain rotation (use different domain each hour)
      const domainIndex = Math.floor(now / (60 * 60 * 1000)) % source.domains.length;
      const domain = source.domains[domainIndex];
      
      // Token rotation (rotate every 30 minutes)
      const tokenIndex = Math.floor(now / (30 * 60 * 1000)) % source.tokenRotation.length;
      const token = source.tokenRotation[tokenIndex];
      
      // Build URL based on source type
      let url;
      if (source.name === '2embed' && imdbId) {
        url = `${domain}${source.endpoint.replace('{imdb_id}', imdbId)}`;
      } else {
        url = `${domain}${source.endpoint.replace('{type}', type).replace('{id}', id)}`;
      }
      
      // Generate signed URL for this request
      const signedUrl = generateSignedUrl(url);
      
      // Test if source works (with timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(signedUrl, {
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': domain
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        // Extract actual video sources
        if (source.name === 'vidsrc' && data.result && data.result.sources) {
          data.result.sources.forEach(src => {
            if (src.file && (src.file.includes('.m3u8') || src.file.includes('.mp4'))) {
              results.push({
                url: generateSignedUrl(src.file, 300), // 5-minute expiry
                quality: src.label || 'auto',
                type: src.file.includes('.m3u8') ? 'hls' : 'mp4',
                provider: source.name,
                domain: domain
              });
            }
          });
        }
        // Add other source parsing logic here
        
        if (results.length > 0) {
          break; // Stop at first working source
        }
      }
    } catch (error) {
      console.log(`Source ${source.name} failed:`, error.message);
      continue;
    }
  }
  
  return results;
}
