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
    // Fetch the VidKing embed page
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

    // 🔥 REMOVE AD SCRIPTS AND POPUPS
    html = removeAdsFromHTML(html);

    // 🎯 EXTRACT ONLY THE VIDEO PLAYER
    html = extractCleanPlayer(html);

    // 📦 WRAP IN CLEAN CONTAINER
    const cleanHtml = createCleanContainer(html);

    res.status(200).send(cleanHtml);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).end('Proxy failed');
  }
}

function removeAdsFromHTML(html) {
  // Remove ad scripts
  html = html.replace(/<script[^>]*>.*?ad.*?<\/script>/g, '');
  html = html.replace(/<script[^>]*>.*?pop.*?<\/script>/g, '');
  html = html.replace(/<script[^>]*>.*?click.*?<\/script>/g, '');
  html = html.replace(/<script[^>]*>.*?popup.*?<\/script>/g, '');
  
  // Remove ad divs
  html = html.replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>.*?<\/div>/g, '');
  html = html.replace(/<div[^>]*id="[^"]*ad[^"]*"[^>]*>.*?<\/div>/g, '');
  html = html.replace(/<div[^>]*class="[^"]*popup[^"]*"[^>]*>.*?<\/div>/g, '');
  
  // Remove tracking pixels
  html = html.replace(/<img[^>]*src="[^"]*tracker[^"]*"[^>]*>/g, '');
  html = html.replace(/<img[^>]*src="[^"]*analytics[^"]*"[^>]*>/g, '');
  
  // Remove suspicious scripts
  html = html.replace(/<script[^>]*src="[^"]*\.js"[^>]*>[^<]*<\/script>/g, '');
  
  return html;
}

function extractCleanPlayer(html) {
  // Extract the main video container
  const playerMatch = html.match(/<div[^>]*class="[^"]*player-container[^"]*"[^>]*>[\s\S]*?<\/div>/);
  if (playerMatch) {
    return playerMatch[0];
  }
  
  // Fallback: extract video tag
  const videoMatch = html.match(/<video[^>]*>[\s\S]*?<\/video>/);
  if (videoMatch) {
    return videoMatch[0];
  }
  
  // Last resort: return body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
  return bodyMatch ? bodyMatch[1] : html;
}

function createCleanContainer(playerHtml) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body, html {
      margin: 0;
      padding: 0;
      background: #000;
      overflow: hidden;
    }
    .player-container {
      width: 100vw;
      height: 100vh;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  </style>
</head>
<body>
  ${playerHtml}
</body>
</html>
  `;
}
