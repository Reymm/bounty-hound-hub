

# Fix Social Media Previews - Immediate Solution

## Problem Identified
The `bounty-meta` edge function exists in code but is not deploying to Supabase. The Cloudflare Worker needs this function to generate dynamic previews for Facebook/Twitter crawlers.

## Solution
Deploy the edge function properly and ensure the Cloudflare Worker is configured to route crawler traffic to it.

## Step-by-Step Implementation

### Step 1: Fix the Edge Function Deployment
The `bounty-meta` function may have a deployment sync issue. I will:
- Verify the function syntax is correct
- Ensure it matches the pattern of working functions
- Force a proper deployment

### Step 2: Test the Edge Function
After deployment, verify the function responds correctly by calling it directly with a bounty ID.

### Step 3: Verify Cloudflare Worker Configuration
The Cloudflare Worker in your dashboard should:
1. Detect social media crawlers (Facebook, Twitter, LinkedIn, etc.)
2. For bounty URLs (`/b/[id]`), fetch the bounty data and return HTML with proper og: tags
3. For regular users, proxy directly to your app

You already have the Worker code in `.lovable/plan.md`. The Worker fetches bounty data directly from Supabase REST API, so it doesn't need the edge function at all.

### Step 4: Verify Everything Works
- Test with Facebook Sharing Debugger
- Confirm you see: "Help find: [Title] - $[Amount] Reward | BountyBay"
- Confirm the bounty image shows instead of generic BB logo

## Technical Details

### Why the Edge Function Wasn't Deploying
The deployment tool reported success but the function never appeared in Supabase. This can happen when:
- There's a lockfile incompatibility
- The function was never triggered to actually deploy
- There's a silent error during deployment

### The Cloudflare Worker Already Has Everything It Needs
Looking at your plan.md, the Worker code directly calls Supabase REST API:
```javascript
const apiUrl = `${supabaseUrl}/rest/v1/Bounties?id=eq.${bountyId}&select=...`;
```
This means it doesn't need the edge function at all - it generates the HTML directly.

### Files That May Need Updates
1. **Cloudflare Worker** (in your Cloudflare dashboard) - verify it has the correct code
2. **supabase/functions/bounty-meta/index.ts** - ensure proper deployment
3. Verify no code changes needed in your app

## Expected Outcome
After this fix:
- Share any bounty link to Facebook
- Facebook shows dynamic preview with title, amount, image
- Users click and land on your app
- No more generic BB logo

## Time Estimate
5-10 minutes once in build mode

