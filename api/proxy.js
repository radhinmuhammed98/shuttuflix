// api/proxy.js
export default async function (req, res) {
  // Handle CORS and OPTIONS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).end('Method not allowed');
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return res.status(400).end('Missing URL parameter');
  }

  try {
    // BLOCK AD REQUESTS - Brave-style filtering
    if (isAdRequest(targetUrl)) {
      res.status(200).end(''); // Return empty response for ads
      return;
    }

    // Set proper headers based on file type
    setContentTypeHeaders(targetUrl, res);

    // Fetch the content with proper headers
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': getAcceptHeader(targetUrl),
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.vidking.net/',
        'Origin': 'https://www.vidking.net'
      }
    });

    if (!response.ok) {
      // Handle 404/500 errors gracefully
      if (response.status === 404) {
        return res.status(404).end('Resource not found');
      }
      return res.status(response.status).end('Server error');
    }

    // Get response body
    const contentType = response.headers.get('content-type') || '';
    let body;

    if (contentType.includes('text/html') || contentType.includes('application/javascript')) {
      body = await response.text();
      
      // For HTML pages, rewrite URLs to go through our proxy
      if (contentType.includes('text/html')) {
        body = rewriteHtmlUrls(body);
      }
      
      // For JS files, remove ad-related code
      if (contentType.includes('application/javascript')) {
        body = removeAdCodeFromJS(body);
      }
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else if (contentType.includes('application/json')) {
      body = await response.json();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    } else {
      body = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
    }

    res.status(200).send(body);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).end('Proxy failed');
  }
}

// Brave-style ad blocking rules
function isAdRequest(url) {
  const adPatterns = [
    /ad[sx]?([0-9]*|server|manager|network)/i,
    /ads?\.([a-z0-9-]+\.)?(com|net|org|info|xyz|top|club|site|online|tech|space|bid|loan|win|party|science)$/i,
    /ad([0-9]*|server|manager|network)[a-z0-9-]*\.(com|net|org|info|xyz|top|club|site|online|tech|space|bid|loan|win|party|science)$/i,
    /track(ing)?([0-9]*|-server|-pixel)/i,
    /analytics?/i,
    /popup/i,
    /interstitial/i,
    /pre-roll/i,
    /mid-roll/i,
    /post-roll/i,
    /click(under|tracker)/i,
    /offer/i,
    /banner/i,
    /doubleclick/i,
    /googlesyndication/i,
    /googleadservices/i,
    /amazon-adsystem/i,
    /taboola/i,
    /outbrain/i,
    /popads/i,
    /propellerads/i,
    /exoclick/i,
    /adcolony/i,
    /unityads/i,
    /admob/i,
    /inmobi/i,
    /vungle/i,
    /chartboost/i,
    /applovin/i,
    /appnext/i,
    /startapp/i,
    /facebook\.com\/ads/i,
    /facebook\.com\/tr/i,
    /google\.com\/ads/i,
    /google\.com\/analytics/i,
    /googletagmanager\.com/i,
    /googlesyndication\.com/i,
    /googleadservices\.com/i,
    /amazon-adsystem\.com/i,
    /taboola\.com/i,
    /outbrain\.com/i,
    /popads\.net/i,
    /propellerads\.com/i,
    /exoclick\.com/i,
    /adcolony\.com/i,
    /unityads\.unity3d\.com/i,
    /admob\.com/i,
    /inmobi\.com/i,
    /vungle\.com/i,
    /chartboost\.com/i,
    /applovin\.com/i,
    /appnext\.com/i,
    /startapp\.com/i,
    /static\.ads-twitter\.com/i,
    /static\.adsafeprotected\.com/i,
    /ads\.vidking\.net/i,
    /adservice\.google\.com/i,
    /adservice\.google\.com\.ar/i,
    /adservice\.google\.com\.au/i,
    /adservice\.google\.com\.br/i,
    /adservice\.google\.com\.mx/i
  ];

  return adPatterns.some(pattern => pattern.test(url));
}

// Set proper content type headers
function setContentTypeHeaders(url, res) {
  const extension = url.split('.').pop().split('?')[0].toLowerCase();
  
  const contentTypes = {
    'js': 'application/javascript',
    'css': 'text/css',
    'html': 'text/html',
    'json': 'application/json',
    'm3u8': 'application/vnd.apple.mpegurl',
    'ts': 'video/MP2T',
    'mp4': 'video/mp4',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject'
  };

  if (contentTypes[extension]) {
    res.setHeader('Content-Type', `${contentTypes[extension]}; charset=utf-8`);
  }
}

// Get proper Accept header based on URL
function getAcceptHeader(url) {
  if (url.includes('.js') || url.includes('javascript')) {
    return 'application/javascript, */*;q=0.8';
  } else if (url.includes('.css') || url.includes('stylesheet')) {
    return 'text/css, */*;q=0.8';
  } else if (url.includes('.json') || url.includes('json')) {
    return 'application/json, */*;q=0.8';
  } else if (url.includes('.m3u8') || url.includes('manifest')) {
    return 'application/vnd.apple.mpegurl, */*;q=0.8';
  } else if (url.includes('.mp4') || url.includes('video')) {
    return 'video/mp4, */*;q=0.8';
  }
  return 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
}

// Rewrite HTML URLs to go through our proxy
function rewriteHtmlUrls(html) {
  // Rewrite script src attributes
  html = html.replace(/src="(https?:\/\/[^"]*\.js[^"]*)"/g, (match, url) => {
    return `src="/api/proxy?url=${encodeURIComponent(url)}"`;
  });
  
  // Rewrite link href attributes (for CSS)
  html = html.replace(/href="(https?:\/\/[^"]*\.css[^"]*)"/g, (match, url) => {
    return `href="/api/proxy?url=${encodeURIComponent(url)}"`;
  });
  
  // Rewrite iframe src attributes
  html = html.replace(/src="(https?:\/\/[^"]*\.html[^"]*)"/g, (match, url) => {
    return `src="/api/proxy?url=${encodeURIComponent(url)}"`;
  });
  
  // Rewrite image src attributes
  html = html.replace(/src="(https?:\/\/[^"]*\.(jpg|jpeg|png|gif|webp)[^"]*)"/g, (match, url) => {
    return `src="/api/proxy?url=${encodeURIComponent(url)}"`;
  });
  
  // Remove ad-related scripts and elements
  html = html.replace(/<script[^>]*>.*?ad.*?<\/script>/g, '');
  html = html.replace(/<script[^>]*>.*?pop.*?<\/script>/g, '');
  html = html.replace(/<script[^>]*>.*?click.*?<\/script>/g, '');
  html = html.replace(/<script[^>]*>.*?popup.*?<\/script>/g, '');
  html = html.replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>.*?<\/div>/g, '');
  html = html.replace(/<div[^>]*id="[^"]*ad[^"]*"[^>]*>.*?<\/div>/g, '');
  html = html.replace(/<div[^>]*class="[^"]*popup[^"]*"[^>]*>.*?<\/div>/g, '');
  html = html.replace(/onclick="[^"]*"/g, '');
  
  return html;
}

// Remove ad code from JavaScript files
function removeAdCodeFromJS(js) {
  // Remove ad-related function calls
  js = js.replace(/ad[sx]?\([^\)]*\)/g, '');
  js = js.replace(/showAd\([^\)]*\)/g, '');
  js = js.replace(/loadAd\([^\)]*\)/g, '');
  js = js.replace(/trackAd\([^\)]*\)/g, '');
  js = js.replace(/popup\([^\)]*\)/g, '');
  js = js.replace(/interstitial\([^\)]*\)/g, '');
  
  // Remove ad-related variables
  js = js.replace(/var\s+ad[sx]?[a-z0-9]*\s*=\s*[^;]*;/g, '');
  js = js.replace(/let\s+ad[sx]?[a-z0-9]*\s*=\s*[^;]*;/g, '');
  js = js.replace(/const\s+ad[sx]?[a-z0-9]*\s*=\s*[^;]*;/g, '');
  
  // Remove ad-related event listeners
  js = js.replace(/addEventListener\s*\(\s*['"]click['"][^,]*,\s*function\s*\([^)]*\)\s*\{[^}]*ad[^}]*\}/g, '');
  
  return js;
}
