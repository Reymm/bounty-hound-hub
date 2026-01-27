

# All-in-One Cloudflare Worker for Social Sharing

## What This Does
Your Cloudflare Worker will handle EVERYTHING:
1. Detect when Facebook/Twitter/LinkedIn crawlers visit a bounty link
2. Fetch the bounty data directly from your Supabase database
3. Generate the HTML with all the meta tags (title, description, image, OPEN badge)
4. Redirect regular users to your app

**No edge function deployment needed. No terminal. No CLI.**

## How to Deploy

### Step 1: Go to Your Cloudflare Worker
1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages**
3. Click on your `bounty-preview` worker
4. Click **Edit Code** (or "Quick Edit")

### Step 2: Replace ALL the Code
Delete everything and paste this complete script:

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('User-Agent') || '';
    
    // Detect social media crawlers
    const isCrawler = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|Pinterest|Discordbot|Googlebot|bingbot/i.test(userAgent);
    
    // Check if this is a bounty page
    const bountyMatch = url.pathname.match(/^\/b\/([a-f0-9-]+)$/i);
    
    if (isCrawler && bountyMatch) {
      const bountyId = bountyMatch[1];
      
      try {
        // Fetch bounty data directly from Supabase REST API
        const supabaseUrl = 'https://lenyuvobgktgdearflim.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlbnl1dm9iZ2t0Z2RlYXJmbGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTI0OTcsImV4cCI6MjA3MDA4ODQ5N30.9Ax2mNDPCQoq0K9KCIQKk-qLFQoClxBhGNWsMrXMCx0';
        
        const apiUrl = `${supabaseUrl}/rest/v1/Bounties?id=eq.${bountyId}&select=id,title,amount,description,status,images,poster_id`;
        
        const response = await fetch(apiUrl, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch bounty');
        }
        
        const bounties = await response.json();
        
        if (!bounties || bounties.length === 0) {
          // Bounty not found, redirect to homepage
          return Response.redirect('https://bountybay.co', 302);
        }
        
        const bounty = bounties[0];
        
        // Build meta tags
        const statusBadge = bounty.status === 'open' ? '🟢 OPEN | ' : '';
        const title = `${statusBadge}Help find: ${escapeHtml(bounty.title)} - $${bounty.amount} Reward | BountyBay`;
        const description = `$${bounty.amount} bounty reward! ${escapeHtml((bounty.description || '').slice(0, 120))}${(bounty.description || '').length > 120 ? '...' : ''}`;
        const bountyUrl = `https://bountybay.co/b/${bounty.id}`;
        const ogImage = bounty.images?.[0] || 'https://bountybay.co/og-default.png';
        
        // Generate HTML with meta tags
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${title}</title>
  <meta name="title" content="${title}">
  <meta name="description" content="${description}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${bountyUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="BountyBay">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${bountyUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
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
            'Cache-Control': 'public, max-age=300, s-maxage=300'
          }
        });
        
      } catch (error) {
        console.error('Error fetching bounty:', error);
        // On error, just proxy to the main site
        return fetch(`https://bountybay.lovable.app${url.pathname}${url.search}`, {
          method: request.method,
          headers: request.headers
        });
      }
    }
    
    // For all other requests, proxy to the main site
    return fetch(`https://bountybay.lovable.app${url.pathname}${url.search}`, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
    });
  }
};

// Helper function to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### Step 3: Save and Deploy
Click **Save and Deploy** in Cloudflare

### Step 4: Test It
1. Go to [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fbountybay.co%2Fb%2F36b513a7-1e23-4e1b-a900-a612a6ccf4fc)
2. Click **Scrape Again**
3. You should see: **"🟢 OPEN | Help find: [Your Bounty Title] - $[Amount] Reward | BountyBay"**

## How It Works

```text
+------------------+     +---------------------+     +------------------+
|  Facebook/Twitter|     |  Cloudflare Worker  |     |    Supabase      |
|     Crawler      | --> |  (your new code)    | --> |    Database      |
+------------------+     +---------------------+     +------------------+
         |                        |                          |
         |   Request /b/abc123    |                          |
         |----------------------->|                          |
         |                        |   Fetch bounty data      |
         |                        |------------------------->|
         |                        |                          |
         |                        |   Return bounty JSON     |
         |                        |<-------------------------|
         |                        |                          |
         |   Return HTML with     |                          |
         |   og:title, og:image   |                          |
         |<-----------------------|                          |
```

## What You're Doing
1. Go to Cloudflare Dashboard
2. Open your `bounty-preview` Worker
3. Replace ALL the code with the script above
4. Click Save and Deploy
5. Test with Facebook Debugger

That's it! No terminal needed.

