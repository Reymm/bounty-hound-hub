/**
 * BountyBay Cloudflare Worker - Dynamic Social Media Previews
 * 
 * This Worker detects social media crawlers and serves dynamic OG meta tags
 * for bounty pages. Regular users are proxied directly to the origin.
 * 
 * INSTALLATION:
 * 1. Go to Cloudflare Dashboard > Workers & Pages > bounty-preview
 * 2. Click "Edit Code" and paste this entire file
 * 3. Click "Deploy"
 * 4. Ensure the route bountybay.co/b/* is pointing to this worker
 */

// Social media crawler user agents
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'Slackbot',
  'TelegramBot',
  'Discordbot',
  'Googlebot',
  'bingbot',
  'Pinterestbot',
  'redditbot',
];

// Hardcoded Supabase credentials (these are public anon keys, safe to include)
const SUPABASE_URL = 'https://lenyuvobgktgdearflim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlbnl1dm9iZ2t0Z2RlYXJmbGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTI0OTcsImV4cCI6MjA3MDA4ODQ5N30.9Ax2mNDPCQoq0K9KCIQKk-qLFQoClxBhGNWsMrXMCx0';

function isCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(crawler => ua.includes(crawler.toLowerCase()));
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('User-Agent') || '';
    
    // Only intercept bounty detail pages for crawlers
    const bountyMatch = url.pathname.match(/^\/b\/([a-f0-9-]+)$/i);
    
    if (!bountyMatch || !isCrawler(userAgent)) {
      // Not a bounty page or not a crawler - proxy to origin
      const originUrl = new URL(request.url);
      originUrl.hostname = 'bountybay.lovable.app';
      return fetch(new Request(originUrl, request));
    }
    
    const bountyId = bountyMatch[1];
    
    try {
      // Fetch bounty from Supabase REST API
      const apiUrl = `${SUPABASE_URL}/rest/v1/Bounties?id=eq.${bountyId}&select=id,title,amount,description,status,images`;
      
      console.log('Fetching bounty:', bountyId);
      
      const bountyResponse = await fetch(apiUrl, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      
      if (!bountyResponse.ok) {
        console.error('Supabase API error:', bountyResponse.status, await bountyResponse.text());
        throw new Error(`Supabase API error: ${bountyResponse.status}`);
      }
      
      const bounties = await bountyResponse.json();
      console.log('Bounties found:', bounties.length);
      
      if (!bounties || bounties.length === 0) {
        // Bounty not found - redirect to homepage
        console.log('No bounty found, redirecting to homepage');
        return Response.redirect('https://bountybay.co', 302);
      }
      
      const bounty = bounties[0];
      console.log('Bounty data:', JSON.stringify(bounty));
      
      // Build dynamic meta content
      const statusBadge = bounty.status === 'open' ? '🟢 OPEN | ' : '';
      const title = `${statusBadge}Help find: ${bounty.title} - $${bounty.amount} Reward | BountyBay`;
      const description = `$${bounty.amount} bounty reward! ${(bounty.description || '').slice(0, 120)}${(bounty.description || '').length > 120 ? '...' : ''}`;
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
</head>
<body>
  <p>Redirecting to <a href="${bountyUrl}">${escapeHtml(bounty.title)}</a>...</p>
</body>
</html>`;

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      });
      
    } catch (error) {
      console.error('Worker error:', error.message);
      // On any error, proxy to origin
      const originUrl = new URL(request.url);
      originUrl.hostname = 'bountybay.lovable.app';
      return fetch(new Request(originUrl, request));
    }
  },
};
