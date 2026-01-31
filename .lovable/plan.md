

## Fix Social Sharing Preview (Revert to Working Approach)

The Cloudflare Worker approach failed because Workers require Orange Cloud (proxied DNS), which breaks Lovable. We're reverting to the proven edge function approach.

---

### What Went Wrong

The Worker you deployed is never triggered because Grey Cloud DNS sends traffic directly to Lovable, bypassing Cloudflare entirely.

---

### The Fix

Use two different URLs:
1. **Social platforms** → `share.bountybay.co/functions/v1/bounty-meta?id=...` (serves OG metadata)
2. **Copy link / Native share** → `bountybay.co/b/...` (clean user-facing URL)

---

### File Changes

**`src/components/bounty/ShareBountyButton.tsx`**

Restore the dual-URL approach:

```typescript
// Clean URL for copy/native share (user-facing)
const bountyUrl = `https://bountybay.co/b/${bountyId}`;

// Edge function URL for social crawlers - serves OG metadata
const edgeFunctionUrl = `https://share.bountybay.co/functions/v1/bounty-meta?id=${bountyId}`;

const shareText = `Help find: "${title}" - $${amount.toLocaleString()} reward on BountyBay`;
const encodedEdgeUrl = encodeURIComponent(edgeFunctionUrl);
const encodedText = encodeURIComponent(shareText);

const shareLinks = {
  // Social platforms use edge function URL - it serves proper OG tags
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedEdgeUrl}`,
  twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedEdgeUrl}`,
  reddit: `https://reddit.com/submit?url=${encodedEdgeUrl}&title=${encodeURIComponent(`$${amount} Bounty: ${title}`)}`,
  linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedEdgeUrl}`,
  pinterest: `https://pinterest.com/pin/create/button/?url=${encodedEdgeUrl}&description=${encodedText}`,
};
```

Native share keeps using clean URL:
```typescript
await navigator.share({
  title: `$${amount} Bounty: ${title}`,
  text: shareText,
  url: bountyUrl,  // Clean URL for copy
});
```

Copy link keeps using clean URL (already correct).

---

### Cleanup Tasks (You Do Manually)

1. **Delete the Worker route** in Cloudflare (bountybay.co/b/*)
2. **Delete the bountybay-og Worker** (optional, it's not hurting anything)
3. **Verify share.bountybay.co exists** as a CNAME → lenyuvobgktgdearflim.supabase.co

---

### Result

| Feature | URL Used | Why |
|---------|----------|-----|
| Facebook/Twitter/etc share | share.bountybay.co/... | Social crawlers get proper OG metadata |
| Copy Link button | bountybay.co/b/... | Users see clean URL |
| Native mobile share | bountybay.co/b/... | Users see clean URL |

Social previews will show the bounty title, description, and image. Users who click through land on the clean bountybay.co URL.

---

### DNS Requirements

Ensure this CNAME exists (Grey Cloud is fine):
- `share` → `lenyuvobgktgdearflim.supabase.co`

