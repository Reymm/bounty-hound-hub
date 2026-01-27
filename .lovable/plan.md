

# Fix: Register bounty-meta Edge Function

## The Problem
The `bounty-meta` edge function code exists but isn't registered in `supabase/config.toml`. This means Supabase doesn't know about it and returns a 404 when your Cloudflare Worker tries to call it.

## The Solution
Add the `bounty-meta` function to the Supabase configuration so it gets deployed and becomes accessible.

## What I'll Do

### Step 1: Update supabase/config.toml
Add the following entry to register the function:

```toml
[functions.bounty-meta]
verify_jwt = false
```

This allows social media bots (Facebook, Twitter, LinkedIn) to access the function without authentication.

### Step 2: Verify Deployment
After the config is updated, the function will automatically deploy. I'll test it to confirm it returns the bounty metadata with the "OPEN" badge.

## After Implementation
Once deployed, your Cloudflare Worker will successfully call the `bounty-meta` function, and social media previews will show:
- **Title**: "🟢 OPEN | Help find: [Item] - $[Amount] Reward | BountyBay"
- **Description**: The bounty reward amount and description
- **Image**: The bounty's first image (or default OG image)

## Testing
After I make this change:
1. Go to [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fbountybay.co%2Fb%2F36b513a7-1e23-4e1b-a900-a612a6ccf4fc)
2. Click "Scrape Again"
3. You should see the dynamic bounty title with the 🟢 OPEN badge

