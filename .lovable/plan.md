
# Plan: Update ShareBountyButton to Use Clean URLs

## Summary

After you deploy the Cloudflare Worker and enable Orange Cloud, I'll update the share button to use clean `bountybay.co/b/{id}` URLs instead of the long `share.bountybay.co/functions/v1/bounty-meta?id=...` URLs.

---

## Changes to Make

**File: `src/components/bounty/ShareBountyButton.tsx`**

### 1. Remove the edge function URL variable (lines 35-37)
```typescript
// DELETE these lines:
// Branded subdomain for social crawlers - CNAME to Supabase, serves OG metadata
// DNS: share CNAME → lenyuvobgktgdearflim.supabase.co (gray cloud/DNS only)
const edgeFunctionUrl = `https://share.bountybay.co/functions/v1/bounty-meta?id=${bountyId}`;
```

### 2. Update encoded URL variable (line 40)
```typescript
// BEFORE:
const encodedEdgeUrl = encodeURIComponent(edgeFunctionUrl);

// AFTER:
const encodedUrl = encodeURIComponent(bountyUrl);
```

### 3. Update all share links to use clean URL (lines 43-50)
```typescript
const shareLinks = {
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
  reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(`$${amount} Bounty: ${title}`)}`,
  linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`,
};
```

### 4. Update native share to use clean URL (line 58)
```typescript
// BEFORE:
url: edgeFunctionUrl,

// AFTER:
url: bountyUrl,
```

---

## Result

| Before | After |
|--------|-------|
| Social cards show: `share.bountybay.co/functions/v1/bounty-meta?id=...` | Social cards show: `bountybay.co` |
| Rich previews work (via edge function) | Rich previews work (via Cloudflare Worker) |
| Ugly long URL at bottom of preview | Clean domain at bottom of preview |

---

## Prerequisites (Your Manual Steps)

Before I make these code changes, you need to complete:

1. Create Cloudflare Worker with the fixed code (bypasses /auth paths)
2. Add Worker Route: `bountybay.co/*`
3. Enable Orange Cloud on `bountybay.co` DNS record
4. Test Google OAuth still works
5. Test `bountybay.co/b/{bounty-id}?og=1` shows OG HTML

Once you confirm those steps are done, approve this plan and I'll make the code changes.
