

# Fix Social Media Preview - Final Solution

## Root Cause Identified

After thorough investigation:
- **Database**: Working correctly. RLS policy allows anon to read open bounties.
- **Bounty Data**: All fields accessible (title, amount, description, images)
- **Worker Code**: Logic is correct in the repository

**The problem: Facebook's crawler requests are NOT hitting your Cloudflare Worker at all.** The empty logs prove this - when Facebook scrapes, the Worker should log "Fetching bounty: ..." but nothing appears.

---

## Why Requests Bypass the Worker

There are only 3 possible causes:

1. **Route pattern mismatch** - The route `bountybay.co/b/*` may not be matching correctly
2. **Multiple conflicting routes** - Another route is catching requests first  
3. **Worker not deployed to the route** - The code in Cloudflare doesn't match the repository

---

## The Fix (5 Minutes)

### Step 1: Delete ALL existing routes and recreate ONE clean route

1. Go to **Cloudflare Dashboard → Websites → bountybay.co → Workers Routes**
2. **Delete every route you see** (click the X or delete button on each)
3. Click **Add Route**
4. Enter exactly:
   - **Route**: `bountybay.co/b/*`
   - **Worker**: `bounty-preview`
5. Save

### Step 2: Verify Worker Code Has Debug Logging

Go to **Cloudflare Dashboard → Workers & Pages → bounty-preview → Edit Code**

Replace the ENTIRE contents with this updated code that has better logging:

```text
/**
 * BountyBay Cloudflare Worker - Dynamic Social Media Previews
 * Updated with aggressive logging for debugging
 */

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
    
    // LOG EVERY REQUEST
    console.log('=== WORKER HIT ===');
    console.log('URL:', url.href);
    console.log('Path:', url.pathname);
    console.log('User-Agent:', userAgent);
    console.log('Is Crawler:', isCrawler(userAgent));
    
    const bountyMatch = url.pathname.match(/^\/b\/([a-f0-9-]+)$/i);
    console.log('Bounty Match:', bountyMatch ? bountyMatch[1] : 'NO MATCH');
    
    if (!bountyMatch || !isCrawler(userAgent)) {
      console.log('Proxying to origin - not a crawler or not /b/ route');
      const originUrl = new URL(request.url);
      originUrl.hostname = 'bountybay.lovable.app';
      return fetch(new Request(originUrl, request));
    }
    
    const bountyId = bountyMatch[1];
    console.log('Processing bounty for crawler:', bountyId);
    
    try {
      const apiUrl = `${SUPABASE_URL}/rest/v1/Bounties?id=eq.${bountyId}&select=id,title,amount,description,status,images`;
      console.log('Fetching from:', apiUrl);
      
      const bountyResponse = await fetch(apiUrl, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      
      console.log('Supabase response status:', bountyResponse.status);
      
      if (!bountyResponse.ok) {
        const errorText = await bountyResponse.text();
        console.error('Supabase API error:', bountyResponse.status, errorText);
        throw new Error(`Supabase API error: ${bountyResponse.status}`);
      }
      
      const bounties = await bountyResponse.json();
      console.log('Bounties found:', bounties.length);
      
      if (!bounties || bounties.length === 0) {
        console.log('No bounty found, redirecting to homepage');
        return Response.redirect('https://bountybay.co', 302);
      }
      
      const bounty = bounties[0];
      console.log('SUCCESS - Returning OG tags for:', bounty.title);
      
      const statusBadge = bounty.status === 'open' ? '🟢 OPEN | ' : '';
      const title = `${statusBadge}Help find: ${bounty.title} - $${bounty.amount} Reward | BountyBay`;
      const description = `$${bounty.amount} bounty reward! ${(bounty.description || '').slice(0, 120)}${(bounty.description || '').length > 120 ? '...' : ''}`;
      const bountyUrl = `https://bountybay.co/b/${bounty.id}`;
      const ogImage = bounty.images?.[0] || 'https://bountybay.co/og-default.png';
      
      console.log('OG Image:', ogImage);
      console.log('OG Title:', title);
      
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="title" content="${escapeHtml(title)}">
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${bountyUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="BountyBay">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${bountyUrl}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ogImage}">
  <link rel="canonical" href="${bountyUrl}">
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
      const originUrl = new URL(request.url);
      originUrl.hostname = 'bountybay.lovable.app';
      return fetch(new Request(originUrl, request));
    }
  },
};
```

### Step 3: Deploy and Test

1. Click **Save and Deploy** in Cloudflare
2. Go to **Workers & Pages → bounty-preview → Logs**
3. Click **Begin log stream** (or Start Debugging)
4. In a new tab, go to **Facebook Sharing Debugger**
5. Paste: `https://bountybay.co/b/36b513a7-1e23-4e1b-a900-a612a6ccf4fc`
6. Click **Scrape Again**

**You should now see logs appear** with "=== WORKER HIT ===" and all the debug info.

---

## If Logs Still Don't Appear

If you click Scrape Again and STILL see no logs, the issue is that Facebook is bypassing Cloudflare entirely. This can happen if:

1. **DNS propagation** - Your domain's nameservers might not be fully pointed to Cloudflare
2. **SSL/TLS mode** - Should be set to "Full (Strict)" in Cloudflare SSL settings

Go to **Cloudflare Dashboard → bountybay.co → DNS** and confirm:
- Nameservers are Cloudflare's (not your registrar's)
- The A record for `bountybay.co` shows the orange cloud (Proxied)

---

## Expected Result

After fixing the route, when Facebook scrapes the bounty URL:

| Field | Value |
|-------|-------|
| Title | 🟢 OPEN - Help find: Looking for a Lead on a Nixon Hoodie... - $5 Reward - BountyBay |
| Description | $5 bounty reward! I had this Nixon hoodie around 2012... |
| Image | The actual hoodie photo from your bounty |

---

## Summary

No code changes needed in Lovable. The fix is 100% in Cloudflare configuration:

1. Delete all routes, create fresh `bountybay.co/b/*` → `bounty-preview`
2. Deploy the updated Worker code with logging
3. Test with Facebook Debugger while watching logs

