

# Fix Social Media Previews - Complete Solution

## The Root Cause

Looking at your screenshot, you used the **iOS native share** feature (Share sheet), not the "Facebook" button in the dropdown. Here's what happens:

| Share Method | URL Sent to Facebook | Result |
|--------------|---------------------|--------|
| **"Share via..." (iOS native)** | `bountybay.co/b/xxx` | ❌ Homepage metadata (no SSR) |
| **"Facebook" dropdown button** | Supabase edge function URL | ✅ Bounty-specific metadata |

The native iOS share uses `bountybay.co/b/...` which is a client-side React app - Facebook's crawler can't read the JavaScript-rendered meta tags, so it falls back to homepage defaults.

---

## The Fix

We have two options:

### Option A: Update Native Share to Use Edge Function URL (Recommended)
Change the native share to also use the edge function URL, so ALL share methods work correctly.

**Current code (line 50-57):**
```typescript
await navigator.share({
  title: `$${amount} Bounty: ${title}`,
  text: shareText,
  url: bountyUrl,  // ← Uses bountybay.co/b/xxx
});
```

**New code:**
```typescript
await navigator.share({
  title: `$${amount} Bounty: ${title}`,
  text: shareText,
  url: edgeFunctionUrl,  // ← Uses Supabase edge function
});
```

**Trade-off:** When someone taps the shared link, they'll briefly see the Supabase domain in the URL bar before being redirected to `bountybay.co/b/xxx`.

### Option B: Keep Native Share, Educate Users
Keep native share using the clean URL, but inform users that for best previews on social media, they should tap the specific platform button (Facebook, Twitter, etc.) rather than "Share via..."

---

## What I'll Implement (Option A)

1. **Update ShareBountyButton.tsx** - Change the native share handler to use `edgeFunctionUrl` instead of `bountyUrl` so all sharing methods produce proper social previews

2. **Update the edge function format** - Ensure the deployed edge function matches your code (clean format without emoji/price prefix)

---

## Technical Details

### File Change: `src/components/bounty/ShareBountyButton.tsx`

```typescript
// Line 50-57: Change native share URL
const handleNativeShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `$${amount} Bounty: ${title}`,
        text: shareText,
        url: edgeFunctionUrl,  // Changed from bountyUrl
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  }
};
```

### Edge Function Status
- Already deployed and working at `https://lenyuvobgktgdearflim.supabase.co/functions/v1/bounty-meta`
- Returns proper OG metadata with bounty title, description, and image
- Redirects browsers to `bountybay.co/b/xxx` via JavaScript

---

## After Implementation

When you share a bounty (via any method), Facebook will show:
- **Title:** "Help me find: [Bounty Title] | BountyBay"
- **Description:** Bounty description (truncated to 160 chars)
- **Image:** The bounty's first image
- **Link shown:** `bountybay.co/b/xxx` (canonical URL)

