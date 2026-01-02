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

  const url = new URL(req.url, `https://${req.headers.host}`);
  const targetUrl = decodeURIComponent(url.searchParams.get('url') || '');

  if (!targetUrl) {
    return res.status(400).end('Missing URL');
  }

  // BLOCK ALL AD AND TRACKING DOMAINS (Brave-style)
  if (shouldBlockRequest(targetUrl)) {
    return res.status(200).end(''); // Empty response for blocked requests
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': getAcceptHeader(targetUrl),
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': getReferer(targetUrl),
        'Origin': getOrigin(targetUrl)
      }
    });

    if (!response.ok) {
      return res.status(response.status).end('Error');
    }

    const contentType = response.headers.get('content-type') || '';
    
    // Handle different content types
    if (contentType.includes('text/html')) {
      let html = await response.text();
      html = cleanHtml(html);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(html);
    } 
    else if (contentType.includes('application/javascript')) {
      let js = await response.text();
      js = cleanJavaScript(js);
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.status(200).send(js);
    }
    else if (contentType.includes('text/css')) {
      let css = await response.text();
      css = cleanCSS(css);
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
      res.status(200).send(css);
    }
    else {
      // Binary content (images, videos, etc.)
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.status(200).send(Buffer.from(buffer));
    }

  } catch (error) {
    console.error('Proxy error for:', targetUrl, error.message);
    res.status(500).end('Proxy error');
  }
}

// Comprehensive ad blocking rules
function shouldBlockRequest(url) {
  const blockedPatterns = [
    // Ad networks
    /doubleclick\.net/i,
    /googlesyndication\.com/i,
    /googleadservices\.com/i,
    /adservice\.google\./i,
    /amazon-adsystem\.com/i,
    /taboola\.com/i,
    /outbrain\.com/i,
    /popads\.net/i,
    /propellerads\.com/i,
    /exoclick\.com/i,
    /adcolony\.com/i,
    /unityads\.com/i,
    /inmobi\.com/i,
    /vungle\.com/i,
    /chartboost\.com/i,
    /applovin\.com/i,
    /startapp\.com/i,
    /facebook\.com\/ads/i,
    /facebook\.com\/tr/i,
    
    // Tracking/analytics
    /google-analytics\.com/i,
    /googletagmanager\.com/i,
    /analytics\.google\.com/i,
    /stats\.wordpress\.com/i,
    /pixel\.facebook\.com/i,
    /connect\.facebook\.net/i,
    
    // VidKing-specific ads
    /ads\.vidking\.net/i,
    /vidking\.net\/.*ad/i,
    /vidking\.net\/.*popup/i,
    /vidking\.net\/.*track/i,
    /vidking\.net\/.*analytics/i,
    
    // Cineby private APIs (block these to prevent 500 errors)
    /api\.videasy\.net/i,
    /videasy\.net/i,
    /myflixerzupcloud/i,
    
    // Generic ad patterns
    /.*ad[sx]?(\d*|server|manager|network).*\.(com|net|org|info|xyz|top|club|site|online|tech|space|bid|loan|win|party|science)$/i,
    /.*track(ing)?(\d*|-server|-pixel).*\.(com|net|org|info|xyz|top|club|site|online|tech|space|bid|loan|win|party|science)$/i,
    /.*popup.*\.(com|net|org|info|xyz|top|club|site|online|tech|space|bid|loan|win|party|science)$/i,
    /.*offer.*\.(com|net|org|info|xyz|top|club|site|online|tech|space|bid|loan|win|party|science)$/i
  ];

  return blockedPatterns.some(pattern => pattern.test(url));
}

function getAcceptHeader(url) {
  if (url.includes('.js') || url.includes('javascript')) {
    return 'application/javascript, */*;q=0.8';
  } else if (url.includes('.css')) {
    return 'text/css, */*;q=0.8';
  } else if (url.includes('.json')) {
    return 'application/json, */*;q=0.8';
  } else if (url.includes('.m3u8')) {
    return 'application/vnd.apple.mpegurl, */*;q=0.8';
  } else if (url.includes('.mp4') || url.includes('video')) {
    return 'video/mp4, */*;q=0.8';
  }
  return 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
}

function getReferer(url) {
  if (url.includes('vidking.net')) {
    return 'https://www.vidking.net/';
  }
  return 'https://www.vidking.net/';
}

function getOrigin(url) {
  if (url.includes('vidking.net')) {
    return 'https://www.vidking.net';
  }
  return 'https://www.vidking.net';
}

// Clean HTML content
function cleanHtml(html) {
  // Remove all script tags that contain ad-related content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, (match) => {
    const lowerMatch = match.toLowerCase();
    if (lowerMatch.includes('ad') || lowerMatch.includes('popup') || 
        lowerMatch.includes('track') || lowerMatch.includes('analytics') ||
        lowerMatch.includes('click') || lowerMatch.includes('offer')) {
      return ''; // Remove ad-related scripts
    }
    return match; // Keep other scripts
  });

  // Remove ad divs and elements
  html = html.replace(/<div[^>]*class="[^"]*(ad|popup|banner|track)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  html = html.replace(/<div[^>]*id="[^"]*(ad|popup|banner|track)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  
  // Remove onclick handlers
  html = html.replace(/onclick="[^"]*"/gi, '');
  html = html.replace(/onmousedown="[^"]*"/gi, '');
  html = html.replace(/onmouseup="[^"]*"/gi, '');
  
  // Remove tracking pixels
  html = html.replace(/<img[^>]*src="[^"]*(track|pixel|analytics)[^"]*"[^>]*>/gi, '');
  
  // Fix player container to be responsive
  html = html.replace(/<div id="player"[^>]*>/, '<div id="player" style="width:100%;height:100vh;">');
  
  return html;
}

// Clean JavaScript content
function cleanJavaScript(js) {
  // Remove ad-related function calls
  js = js.replace(/ad[sx]?\([^)]*\)/g, '');
  js = js.replace(/showAd\([^)]*\)/g, '');
  js = js.replace(/loadAd\([^)]*\)/g, '');
  js = js.replace(/track\([^)]*\)/g, '');
  js = js.replace(/popup\([^)]*\)/g, '');
  js = js.replace(/interstitial\([^)]*\)/g, '');
  js = js.replace(/preRoll\([^)]*\)/g, '');
  js = js.replace(/midRoll\([^)]*\)/g, '');
  js = js.replace(/postRoll\([^)]*\)/g, '');
  
  // Remove ad-related variables and functions
  js = js.replace(/var\s+ad[sx]?[a-zA-Z0-9_]*\s*=[^;]*;/g, '');
  js = js.replace(/let\s+ad[sx]?[a-zA-Z0-9_]*\s*=[^;]*;/g, '');
  js = js.replace(/const\s+ad[sx]?[a-zA-Z0-9_]*\s*=[^;]*;/g, '');
  js = js.replace(/function\s+ad[sx]?[a-zA-Z0-9_]*\s*\([^)]*\)\s*\{[^}]*\}/g, '');
  
  // Remove event listeners that trigger ads
  js = js.replace(/addEventListener\s*\(\s*['"]click['"][^,]*,\s*function\s*\([^)]*\)\s*\{[^}]*ad[^}]*\}/g, '');
  
  // Remove Cineby private API calls
  js = js.replace(/api\.videasy\.net/g, '');
  js = js.replace(/videasy\.net/g, '');
  
  // Fix player sizing
  js = js.replace(/player\.width\s*=\s*['"]\d+['"]/g, 'player.width = "100%"');
  js = js.replace(/player\.height\s*=\s*['"]\d+['"]/g, 'player.height = "100%"');
  
  return js;
}

// Clean CSS content
function cleanCSS(css) {
  // Remove ad-related styles
  css = css.replace(/\.ad[sx]?[a-zA-Z0-9_-]*\s*\{[^}]*\}/g, '');
  css = css.replace(/#ad[sx]?[a-zA-Z0-9_-]*\s*\{[^}]*\}/g, '');
  css = css.replace(/\.popup[a-zA-Z0-9_-]*\s*\{[^}]*\}/g, '');
  css = css.replace(/#popup[a-zA-Z0-9_-]*\s*\{[^}]*\}/g, '');
  
  return css;
}
