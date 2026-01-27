/**
 * BountyBay Cloudflare Worker - Dynamic Social Media Previews
 * 
 * This Worker detects social media crawlers and serves dynamic OG meta tags
 * for bounty pages. Regular users are proxied directly to the origin.
 * 
 * INSTALLATION:
 * 1. Go to Cloudflare Dashboard > Workers & Pages > bounty-preview
 * 2. Click "Edit Code" and paste this entire file
 * 3. Deploy
 * 4. Set environment variables: SUPABASE_URL, SUPABASE_ANON_KEY
 * 5. Add routes: bountybay.co/b/* and www.bountybay.co/b/*
 * 
 * TESTING:
 * - Add ?og=1 to any bounty URL to force OG tag rendering
 * - curl -A "facebookexternalhit" https://bountybay.co/b/[uuid]
 * - Check response headers: x-bounty-worker, x-bounty-isCrawler, x-bounty-path
 */

// Social media crawler user agents (case-insensitive matching)
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'slackbot',
  'telegrambot',
  'discordbot',
  'googlebot',
  'bingbot',
  'pinterestbot',
  'redditbot',
  'applebot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'rogerbot',
  'vkshare',
  'w3c_validator',
];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(crawler => ua.includes(crawler));
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function addDebugHeaders(response, headers) {
  const newResponse = new Response(response.body, response);
  for (const [key, value] of Object.entries(headers)) {
    newResponse.headers.set(key, value);
  }
  return newResponse;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('User-Agent') || '';
    const pathname = url.pathname;
    
    // Debug headers to add to ALL responses
    const debugHeaders = {
      'x-bounty-worker': 'hit',
      'x-bounty-path': pathname,
    };
    
    // Match bounty paths: /b/[uuid] with optional trailing slash
    // UUID pattern: 8-4-4-4-12 hexadecimal characters
    const bountyMatch = pathname.match(/^\/b\/([a-f0-9-]{36})\/?$/i);
    
    if (!bountyMatch) {
      // Not a bounty page - proxy to origin
      debugHeaders['x-bounty-isCrawler'] = 'n/a';
      const originUrl = new URL(request.url);
      originUrl.hostname = 'bountybay.lovable.app';
      const response = await fetch(new Request(originUrl, request));
      return addDebugHeaders(response, debugHeaders);
    }
    
    const bountyId = bountyMatch[1];
    
    // Check for crawler OR manual override via ?og=1
    const forceOg = url.searchParams.get('og') === '1';
    const detectedCrawler = isCrawler(userAgent);
    const shouldServeOg = detectedCrawler || forceOg;
    
    debugHeaders['x-bounty-isCrawler'] = detectedCrawler.toString();
    debugHeaders['x-bounty-forceOg'] = forceOg.toString();
    debugHeaders['x-bounty-bountyId'] = bountyId;
    
    if (!shouldServeOg) {
      // Regular browser - proxy to origin
      const originUrl = new URL(request.url);
      originUrl.hostname = 'bountybay.lovable.app';
      const response = await fetch(new Request(originUrl, request));
      return addDebugHeaders(response, debugHeaders);
    }
    
    // Crawler detected or ?og=1 - serve dynamic OG tags
    try {
      // Get Supabase credentials from environment
      const supabaseUrl = env.SUPABASE_URL || 'https://lenyuvobgktgdearflim.supabase.co';
      const supabaseKey = env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlbnl1dm9iZ2t0Z2RlYXJmbGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTI0OTcsImV4cCI6MjA3MDA4ODQ5N30.9Ax2mNDPCQoq0K9KCIQKk-qLFQoClxBhGNWsMrXMCx0';
      
      // Fetch bounty from Supabase REST API
      const apiUrl = `${supabaseUrl}/rest/v1/Bounties?id=eq.${bountyId}&select=id,title,amount,description,status,images`;
      
      console.log(`[BountyWorker] Fetching bounty: ${bountyId}`);
      console.log(`[BountyWorker] User-Agent: ${userAgent}`);
      console.log(`[BountyWorker] isCrawler: ${detectedCrawler}, forceOg: ${forceOg}`);
      
      const bountyResponse = await fetch(apiUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/json',
        },
      });
      
      if (!bountyResponse.ok) {
        const errorText = await bountyResponse.text();
        console.error(`[BountyWorker] Supabase API error: ${bountyResponse.status}`, errorText);
        throw new Error(`Supabase API error: ${bountyResponse.status}`);
      }
      
      const bounties = await bountyResponse.json();
      console.log(`[BountyWorker] Bounties found: ${bounties.length}`);
      
      if (!bounties || bounties.length === 0) {
        // Bounty not found - redirect to homepage
        console.log('[BountyWorker] No bounty found, redirecting to homepage');
        return Response.redirect('https://bountybay.co', 302);
      }
      
      const bounty = bounties[0];
      console.log(`[BountyWorker] Bounty data: ${JSON.stringify(bounty)}`);
      
      // Build dynamic meta content
      const statusBadge = bounty.status === 'open' ? '🟢 OPEN | ' : '';
      const title = `${statusBadge}${bounty.title} - $${bounty.amount} Reward | BountyBay`;
      const description = `$${bounty.amount} bounty reward! ${(bounty.description || 'Help find this item on BountyBay.').slice(0, 150)}${(bounty.description || '').length > 150 ? '...' : ''}`;
      const bountyUrl = `https://bountybay.co/b/${bounty.id}`;
      const ogImage = bounty.images?.[0] || 'https://bountybay.co/og-default.png';
      
      // Return HTML with OG tags for crawlers
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${escapeHtml(title)}</title>
  <meta name="title" content="${escapeHtml(title)}">
  <meta name="description" content="${escapeHtml(description)}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${bountyUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="BountyBay">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${bountyUrl}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ogImage}">

  <!-- Canonical -->
  <link rel="canonical" href="${bountyUrl}">
  
  <!-- Redirect browsers (crawlers don't execute JS) -->
  <script>window.location.replace("${bountyUrl}");</script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${bountyUrl}">
  </noscript>
</head>
<body>
  <h1>${escapeHtml(bounty.title)}</h1>
  <p>$${bounty.amount} Reward</p>
  <p>${escapeHtml(bounty.description || '')}</p>
  <p>Redirecting to <a href="${bountyUrl}">BountyBay</a>...</p>
</body>
</html>`;

      debugHeaders['x-bounty-served'] = 'og-html';
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          ...debugHeaders,
        },
      });
      
    } catch (error) {
      console.error('[BountyWorker] Error:', error.message);
      debugHeaders['x-bounty-error'] = error.message;
      
      // On any error, proxy to origin
      const originUrl = new URL(request.url);
      originUrl.hostname = 'bountybay.lovable.app';
      const response = await fetch(new Request(originUrl, request));
      return addDebugHeaders(response, debugHeaders);
    }
  },
};
