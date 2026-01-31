
## Fix Social Sharing - Bypass Cloudflare CNAME Restriction

### What's Happening

The `share.bountybay.co` subdomain is being blocked by Cloudflare's **"CNAME Cross-User Banned"** security feature. This happens when your domain (on your Cloudflare account) points to Supabase's domain (on Supabase's Cloudflare account). Cloudflare blocks this for security reasons.

---

### The Fix

Use the direct Supabase edge function URL instead of the `share.bountybay.co` subdomain:

**Before:** `https://share.bountybay.co/functions/v1/bounty-meta?id=...` ❌ Blocked

**After:** `https://lenyuvobgktgdearflim.supabase.co/functions/v1/bounty-meta?id=...` ✅ Works

---

### Why This Still Works For Users

1. **Social previews** will show correctly (title, description, image)
2. **The canonical URL** in the metadata points to `bountybay.co/b/...`
3. **When users click** the shared link, they get redirected to the clean `bountybay.co/b/...` URL
4. Social platforms don't prominently display the full shared URL anyway - they show the og:url which is the clean domain

---

### File Changes

**`src/components/bounty/ShareBountyButton.tsx`**

Change the edge function URL from:
```typescript
const edgeFunctionUrl = `https://share.bountybay.co/functions/v1/bounty-meta?id=${bountyId}`;
```

To:
```typescript
const edgeFunctionUrl = `https://lenyuvobgktgdearflim.supabase.co/functions/v1/bounty-meta?id=${bountyId}`;
```

---

### Cleanup (Optional)

You can delete the `share` CNAME record from Cloudflare since it's not being used anymore.

---

### After Publishing

1. **Test** by hitting the Facebook Sharing Debugger again with a bounty
2. Should see Response Code **200** (not 403)
3. Preview should show: "Help me find: [Title] | BountyBay" with the bounty image

---

### Result

| What | URL |
|------|-----|
| Facebook/Twitter share link | `supabase.co/functions/...` (serves OG tags) |
| og:url shown to users | `bountybay.co/b/...` (clean) |
| Copy Link button | `bountybay.co/b/...` (clean) |
| Where users land after clicking | `bountybay.co/b/...` (clean) |
