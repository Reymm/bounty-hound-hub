
# Fix: Update Cloudflare Worker to Use Correct Supabase URL

## The Problem
Your Supabase project has a **custom domain** (`auth.bountybay.co`) as shown in your screenshot, but the Cloudflare Worker is still trying to call the old default Supabase URL (`lenyuvobgktgdearflim.supabase.co`). 

This is why:
- The edge function shows in your dashboard ✅
- But calling it returns 404 ❌

## The Solution

Update your Cloudflare Worker to call the **correct URL**:

**Old (broken):** `https://lenyuvobgktgdearflim.supabase.co/functions/v1/bounty-meta`
**New (correct):** `https://auth.bountybay.co/functions/v1/bounty-meta`

## Updated Cloudflare Worker Code

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const ua = (request.headers.get("user-agent") || "").toLowerCase();
    
    // Match /b/<uuid>
    const match = url.pathname.match(/^\/b\/([a-f0-9-]+)\/?$/i);
    const bountyId = match?.[1];
    
    // Manual test override
    const forceOg = url.searchParams.get("og") === "1";
    
    // Check if crawler or forced
    const crawlers = ["facebookexternalhit","facebot","twitterbot","linkedinbot","discordbot","slackbot","whatsapp","telegrambot"];
    const isCrawler = crawlers.some(c => ua.includes(c));
    
    if (bountyId && (forceOg || isCrawler)) {
      // Call YOUR CUSTOM DOMAIN - this is the fix!
      const metaUrl = `https://auth.bountybay.co/functions/v1/bounty-meta?id=${bountyId}`;
      
      const res = await fetch(metaUrl);
      
      if (res.ok) {
        return new Response(res.body, {
          headers: { "content-type": "text/html; charset=utf-8" }
        });
      }
    }
    
    // Regular traffic: proxy to the app
    return fetch(`https://bountybay.lovable.app${url.pathname}${url.search}`);
  }
}
```

## Steps to Implement

1. Go to **Cloudflare Dashboard** → **Workers & Pages** → **bounty-preview**
2. Click **Edit Code** (or Quick Edit)
3. Replace ALL code with the updated version above
4. Click **Save and Deploy**
5. Wait 1 minute

## Verify It Works

1. Test: `https://bounty-preview.yerttam.workers.dev/b/36b513a7-1e23-4e1b-a900-a612a6ccf4fc?og=1`
   - Should show white page with meta tags, then redirect
2. Test production: `https://bountybay.co/b/36b513a7-1e23-4e1b-a900-a612a6ccf4fc?og=1`
   - Same behavior
3. Facebook Debugger: Scrape again - should now show bounty preview!

## Why This Happened

When you set up a custom domain for Supabase (`auth.bountybay.co`), the edge functions moved to that domain. The old `.supabase.co` URL stopped working for functions. The Cloudflare Worker code was still using the old URL.
