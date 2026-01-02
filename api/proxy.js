// api/proxy.js
export default async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'text/html');

  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const embedUrl = url.searchParams.get('url');

  if (!embedUrl || !embedUrl.includes('vidking.net/embed/')) {
    return res.status(400).end('Invalid URL');
  }

  try {
    const vidkingRes = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      }
    });

    if (!vidkingRes.ok) {
      return res.status(vidkingRes.status).end();
    }

    let html = await vidkingRes.text();
    
    // Remove ads and popups
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>.*?<\/div>/gi, '');
    html = html.replace(/<div[^>]*id="[^"]*popup[^"]*"[^>]*>.*?<\/div>/gi, '');
    html = html.replace(/onclick="[^"]*"/gi, '');
    
    // Extract only the player container
    const playerMatch = html.match(/<div[^>]*id="player"[^>]*>[\s\S]*?<\/div>/);
    const cleanPlayer = playerMatch ? playerMatch[0] : html;

    const cleanHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body, html { margin: 0; padding: 0; background: #000; overflow: hidden; }
    #player { width: 100vw; height: 100vh; }
    video { width: 100%; height: 100%; object-fit: contain; }
  </style>
</head>
<body>
  ${cleanPlayer}
</body>
</html>
    `;

    res.status(200).send(cleanHtml);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).end('Proxy failed');
  }
}
