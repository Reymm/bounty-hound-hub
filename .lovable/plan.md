

# Ready to Implement - OG Image Generator

## Status: APPROVED - Waiting for Mode Switch

The plan is approved but I'm currently in read-only mode. The system needs to switch me to default/implementation mode.

## What Will Be Built

Professional OG image generator matching the OpenGraph.xyz reference:
- Light pink/lavender gradient background
- Bounty image in white frame with shadow on the left
- Domain, title, and "Read more" button on the right
- PNG output at 1200x630

## Files to Create/Modify

### 1. `supabase/functions/og-image/index.ts` - Complete Rewrite

Uses `og_edge` library to generate PNG images with React components:
- `fetchImageAsBase64()` helper for embedding bounty images
- WebP detection and fallback to placeholder emoji
- Styled layout matching the reference image

### 2. `supabase/functions/bounty-meta/index.ts` - Line 65-67

Change:
```typescript
const ogImage = bounty.images?.[0] || 'https://bountybay.co/og-default.png';
```

To:
```typescript
const ogImage = `https://auth.bountybay.co/functions/v1/og-image?id=${bounty.id}`;
```

## Action Required

Click "Approve" again or send another message - the system should switch me to default mode where I can write the actual code and deploy the functions.

