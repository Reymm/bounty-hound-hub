
# Fix Social Media Previews with share.bountybay.co Subdomain

## The Problem
The Cloudflare Worker approach has failed repeatedly. Traffic to `bountybay.co/b/*` is not being intercepted by the Worker, so social platforms see the homepage instead of bounty metadata.

## The Solution
Create a dedicated subdomain `share.bountybay.co` that points directly to your Supabase project. Social share links will use this subdomain to serve proper OG tags.

---

## How It Will Work

```text
User clicks "Share to Facebook"
         |
         v
Facebook loads: share.bountybay.co/functions/v1/bounty-meta?id=xxx
         |
         v
Supabase Edge Function returns HTML with:
  - og:title = "Help me find: Vintage Camera | BountyBay"
  - og:image = [bounty's first image]
  - og:url = https://bountybay.co/b/xxx (canonical)
         |
         v
Facebook displays rich preview with bounty details
         |
         v
User clicks the link -> JavaScript redirects to bountybay.co/b/xxx
```

---

## Your Steps (DNS Setup)

### Step 1: Add DNS Record in Your Domain Registrar

Create a **CNAME record**:
- **Name/Host**: `share`
- **Target/Points to**: `lenyuvobgktgdearflim.supabase.co`
- **TTL**: Auto or 300

This makes `share.bountybay.co` route directly to your Supabase project.

---

## My Steps (Code Changes)

### 1. Update ShareBountyButton.tsx

Change line 36 from:
```typescript
const edgeFunctionUrl = `https://lenyuvobgktgdearflim.supabase.co/functions/v1/bounty-meta?id=${bountyId}`;
```

To:
```typescript
const edgeFunctionUrl = `https://share.bountybay.co/functions/v1/bounty-meta?id=${bountyId}`;
```

This is the only code change needed. The edge function already exists and works.

---

## What Users Will See

| Where | URL Shown |
|-------|-----------|
| Shared link on Facebook/Twitter | `share.bountybay.co/...` (briefly, in address bar) |
| OG preview og:url | `bountybay.co/b/xxx` |
| Where user lands | `bountybay.co/b/xxx` |

The preview will show `bountybay.co` as the canonical URL. Users land on the main domain.

---

## Why This Works (When Worker Didn't)

- **No interception needed**: The subdomain points directly to Supabase
- **No Worker configuration**: DNS does all the routing
- **Edge function already works**: We verified it returns correct metadata
- **Simple**: One DNS record + one line of code

---

## After You Add the DNS Record

1. Wait 5-10 minutes for DNS propagation
2. I'll update the ShareBountyButton code
3. Test by sharing a bounty to Facebook
4. Use Facebook Debugger to verify the preview

---

## Summary

| Task | Who |
|------|-----|
| Add CNAME record `share` → `lenyuvobgktgdearflim.supabase.co` | You |
| Update ShareBountyButton.tsx to use `share.bountybay.co` | Me |
| Republish the app | Automatic |

