

# Fix Social Media Previews - The Real Solution

## The Core Problem

**React Helmet doesn't work for social media crawlers.** Facebook, Twitter, LinkedIn etc. do NOT execute JavaScript. They read the raw HTML from the server, which in a React SPA contains only the default meta tags from `index.html`, not the dynamic ones.

This is why the `/share/:id` route I created doesn't work - it's fundamentally the wrong approach for a client-side rendered app.

## What Actually Works

Social media previews require **server-side HTML generation**. There are two options:

### Option 1: Cloudflare Worker (Your Domain)
You already have the code in `.lovable/cloudflare-worker.js`. This needs to be deployed to YOUR Cloudflare account for `bountybay.co`.

**Steps:**
1. Log into your Cloudflare account (the one managing `bountybay.co`)
2. Go to Workers & Pages → Create Application → Create Worker
3. Name it `bounty-preview`
4. Copy the code from `.lovable/cloudflare-worker.js` into the editor
5. Deploy
6. Add a route: `bountybay.co/b/*` → `bounty-preview`

### Option 2: Supabase Edge Function (External Hosting)
The `bounty-meta` function that was working before needs to be re-deployed.

**Steps:**
1. Recover your Supabase account access
2. Deploy the edge function via CLI or Dashboard
3. Update `ShareBountyButton.tsx` to use the edge function URL

## My Recommendation: Cloudflare Worker

Since you're having trouble with Supabase access, the Cloudflare Worker is the better path because:
- It works directly with your `bountybay.co` domain
- No need for a special share URL - the main `/b/:id` URL works for sharing
- The worker code is already written and ready

## Implementation Plan

### Step 1: Remove the Non-Working Share Route
- Delete `src/pages/ShareBounty.tsx` (React Helmet approach doesn't work)
- Remove the `/share/:id` route from `App.tsx`

### Step 2: Update Share Button to Use Main URL
- Change `ShareBountyButton.tsx` to use `https://bountybay.co/b/${bountyId}` for all social sharing
- The Cloudflare Worker will intercept crawler requests at this URL

### Step 3: Deploy Cloudflare Worker (Manual - On Your End)
1. Log into Cloudflare Dashboard
2. Go to Workers & Pages
3. Create new Worker named `bounty-preview`
4. Paste the code from `.lovable/cloudflare-worker.js`
5. Deploy and add route `bountybay.co/b/*`

### Step 4: Verify DNS Settings
Ensure `bountybay.co` is set to **Proxied (Orange Cloud)** in Cloudflare DNS so the Worker can intercept requests.

## Technical Details

```text
How it works:
+------------------+     +------------------+     +------------------+
| Social Crawler   | --> | Cloudflare       | --> | Serve Static    |
| (Facebook, etc)  |     | Worker           |     | HTML with OG    |
+------------------+     +------------------+     | Tags            |
                                                  +------------------+
                         
+------------------+     +------------------+     +------------------+
| Regular Browser  | --> | Cloudflare       | --> | Proxy to        |
|                  |     | Worker           |     | Lovable App     |
+------------------+     +------------------+     +------------------+
```

## What I'll Change in Code

1. **`ShareBountyButton.tsx`**: Change `socialShareUrl` from `bountybay.lovable.app/share/...` back to `bountybay.co/b/...`
2. **`App.tsx`**: Remove the `/share/:id` route (optional cleanup)
3. **`ShareBounty.tsx`**: Remove this file (optional cleanup)

## What You Need to Do

Deploy the Cloudflare Worker using the code already in `.lovable/cloudflare-worker.js`. This is a one-time setup that will make social previews work permanently.

