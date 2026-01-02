// api/proxy.js
export default async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
  const sourceUrl = searchParams.get('url');
  const signature = searchParams.get('signature');
  const expires = searchParams.get('expires');

  if (!sourceUrl) {
    return res.status(400).end('Missing URL');
  }

  try {
    // Validate signed URL
    if (signature && expires && !validateSignedUrl(sourceUrl, signature, parseInt(expires))) {
      return res.status(403).end('Invalid signature');
    }

    // Server-side ad insertion (simplified)
    const adFreeUrl = insertServerSideAds(sourceUrl);
    
    // Fetch video content
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(adFreeUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Origin': 'https://vidsrc.to',
        'Referer': 'https://vidsrc.to/'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return res.status(response.status).end('Source error');
    }

    // Stream the response
    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    
    // Stream the video content
    const reader = response.body.getReader();
    const stream = new ReadableStream({
      start(controller) {
        function push() {
          reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            push();
          }).catch(error => {
            controller.error(error);
          });
        }
        push();
      }
    });
    
    stream.pipeTo(res.body);
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    // Fallback to placeholder content
    if (error.name === 'AbortError') {
      return res.status(408).end('Request timeout');
    }
    
    // Serve a clean error message
    res.status(500).end('Stream unavailable');
  }
}

// Server-side ad insertion (simplified)
function insertServerSideAds(videoUrl) {
  // In production: Insert ad segments into HLS manifest
  // For now: Return clean URL (we're avoiding client-side ads)
  return videoUrl;
}

// Simple signature validation
function validateSignedUrl(url, signature, expires) {
  const timestamp = Math.floor(Date.now() / 1000);
  if (expires < timestamp) return false;
  
  const expectedSig = btoa(`${url}|${expires}|${process.env.URL_SECRET || 'default_secret'}`).replace(/=/g, '');
  return signature === expectedSig;
}
