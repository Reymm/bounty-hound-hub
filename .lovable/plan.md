

# Social Media Preview Fix: Supabase Edge Function Approach

## Problem Summary
Facebook's crawler isn't reaching the Cloudflare Worker, so bounty previews don't show dynamic OG tags. Despite correct DNS settings (proxied/orange cloud), Worker routes, and no WAF blocking, something in Cloudflare's edge is preventing crawler requests from reaching the Worker.

## Solution
Bypass Cloudflare Workers entirely by pointing social share URLs directly to the existing **Supabase Edge Function** (`bounty-meta`), which already serves the correct OG meta tags and redirects browsers to the actual bounty page.

## How It Works

```text
Current (broken):
User shares -> bountybay.co/b/[id] -> Cloudflare Worker (not reached) -> No OG tags

New (reliable):
User shares -> Supabase Edge Function URL -> OG tags served to crawlers
                                          -> Browser redirected to bountybay.co/b/[id]
```

## Changes Required

### 1. Update ShareBountyButton Component
**File:** `src/components/bounty/ShareBountyButton.tsx`

- Change the `shareUrl` from `https://bountybay.co/b/${bountyId}` to the Supabase edge function URL
- The edge function URL will be: `https://lenyuvobgktgdearflim.supabase.co/functions/v1/bounty-meta?id=${bountyId}`
- Keep the "Copy Link" feature pointing to the clean `bountybay.co/b/` URL (for when users paste in browsers)
- Only social platform share links (Facebook, Twitter, etc.) will use the edge function URL

### 2. Deploy the Edge Function
The `bounty-meta` edge function already exists and handles:
- Fetching bounty data from the database
- Serving HTML with proper OG meta tags for crawlers
- Redirecting browsers via JavaScript to the actual bounty page
- We just need to ensure it's deployed

## What Users Will Experience

1. **Sharing on social media**: Rich previews with bounty title, amount, description, and image will display correctly
2. **Clicking shared links**: Users are instantly redirected to the full bounty page at `bountybay.co/b/[id]`
3. **Copying link directly**: Still copies the clean `bountybay.co` URL for direct sharing

## Technical Details

The edge function already:
- Has `verify_jwt = false` in config (public access)
- Fetches bounty from database using service role key
- Returns HTML with all required OG tags (og:title, og:description, og:image, twitter:card, etc.)
- Includes JavaScript redirect for browsers
- Has 5-minute cache for performance

## Benefits of This Approach

1. **Reliable**: Supabase edge functions are directly accessible without proxy layers
2. **Debuggable**: Logs visible in Supabase dashboard
3. **Already built**: The `bounty-meta` function is ready to use
4. **Clean UX**: Users still see the nice `bountybay.co` URL when they land on the page
5. **Keep Cloudflare**: Your DNS and CDN setup remains intact for the main site

