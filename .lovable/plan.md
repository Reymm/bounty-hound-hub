
# OpenGraph.xyz Integration Plan

## Overview
Update the `bounty-meta` edge function to generate dynamic OG images using OpenGraph.xyz's URL API instead of raw bounty images.

## Template Configuration

**Template ID:** `aee1c4ac-33e0-4b6b-a30a-cad7f03d8ff2`
**Version:** `1`

**URL Structure:**
```text
https://ogcdn.net/{templateId}/v{version}/{siteText}/{siteFontFamily}/{siteColor}/{siteBackgroundColor}/{titleText}/{titleFontFamily}/{titleColor}/{imageUrl}/{imageObjectFit}/{ctaText}/{ctaFontFamily}/{ctaColor}/{ctaBackgroundColor}/og.png
```

## Parameter Mapping

| Parameter | Static/Dynamic | Value |
|-----------|----------------|-------|
| siteText | Static | `BountyBay.co` |
| siteFontFamily | Static | `Roboto` |
| siteColor | Static | `rgba(255,255,255,1)` (white text) |
| siteBackgroundColor | Static | `rgba(59,130,246,1)` (blue background) |
| titleText | Dynamic | Bounty title (truncated to ~60 chars) |
| titleFontFamily | Static | `Roboto` |
| titleColor | Static | `rgba(0,0,0,1)` (black) |
| imageUrl | Dynamic | First bounty image or default fallback |
| imageObjectFit | Static | `cover` |
| ctaText | Dynamic | `$X Bounty` (formatted amount) |
| ctaFontFamily | Static | `Roboto` |
| ctaColor | Static | `rgba(255,255,255,1)` (white text) |
| ctaBackgroundColor | Static | `rgba(34,197,94,1)` (green) |

## Changes to bounty-meta/index.ts

1. **Add URL builder function** - Create a helper that constructs the ogcdn.net URL with all parameters properly encoded

2. **Replace static ogImage** - Change line 69 from using the raw bounty image to using the generated OpenGraph.xyz URL

3. **Add fallback handling** - If the bounty has no image, use the default OG image path as the imageUrl parameter

## Example Output

For a bounty with:
- Title: "Looking for vintage Nixon hoodie"
- Amount: $500
- Image: `https://storage.example.com/bounty.jpg`

Generated URL:
```text
https://ogcdn.net/aee1c4ac-33e0-4b6b-a30a-cad7f03d8ff2/v1/BountyBay.co/Roboto/rgba(255%2C255%2C255%2C1)/rgba(59%2C130%2C246%2C1)/Looking%20for%20vintage%20Nixon%20hoodie/Roboto/rgba(0%2C0%2C0%2C1)/https%3A%2F%2Fstorage.example.com%2Fbounty.jpg/cover/%24500%20Bounty/Roboto/rgba(255%2C255%2C255%2C1)/rgba(34%2C197%2C94%2C1)/og.png
```

## Technical Details

**File to modify:** `supabase/functions/bounty-meta/index.ts`

**New function to add:**
```typescript
function buildOgImageUrl(bounty: { title: string; amount: number; images?: string[] }): string {
  const templateId = "aee1c4ac-33e0-4b6b-a30a-cad7f03d8ff2";
  const version = "1";
  
  // Static branding params
  const siteText = encodeURIComponent("BountyBay.co");
  const siteFontFamily = encodeURIComponent("Roboto");
  const siteColor = encodeURIComponent("rgba(255,255,255,1)");
  const siteBackgroundColor = encodeURIComponent("rgba(59,130,246,1)");
  
  // Dynamic bounty params
  const titleText = encodeURIComponent(
    bounty.title.length > 60 ? bounty.title.slice(0, 57) + '...' : bounty.title
  );
  const titleFontFamily = encodeURIComponent("Roboto");
  const titleColor = encodeURIComponent("rgba(0,0,0,1)");
  
  // Image - use bounty image or default
  const rawImageUrl = bounty.images?.[0] || 'https://bountybay.co/og-default.png';
  const imageUrl = encodeURIComponent(rawImageUrl);
  const imageObjectFit = encodeURIComponent("cover");
  
  // CTA with bounty amount
  const ctaText = encodeURIComponent(`$${bounty.amount?.toLocaleString() || '0'} Bounty`);
  const ctaFontFamily = encodeURIComponent("Roboto");
  const ctaColor = encodeURIComponent("rgba(255,255,255,1)");
  const ctaBackgroundColor = encodeURIComponent("rgba(34,197,94,1)");
  
  return `https://ogcdn.net/${templateId}/v${version}/${siteText}/${siteFontFamily}/${siteColor}/${siteBackgroundColor}/${titleText}/${titleFontFamily}/${titleColor}/${imageUrl}/${imageObjectFit}/${ctaText}/${ctaFontFamily}/${ctaColor}/${ctaBackgroundColor}/og.png`;
}
```

**Line 69 change:**
```typescript
// Before
const ogImage = bounty.images?.[0] || 'https://bountybay.co/og-default.png';

// After
const ogImage = buildOgImageUrl(bounty);
```

## Fallback Strategy
If OpenGraph.xyz is down or rate-limited, the URL will still be valid but may return an error image. For resilience, we could add a try/catch with fallback to the raw image, but this is handled at the CDN level by ogcdn.net.
