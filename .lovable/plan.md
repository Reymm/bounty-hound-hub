

# Dynamic OG Image Generator

## Overview
Upgrade the `og-image` edge function to generate proper **1200x630 PNG images** with the bounty photo embedded, amount displayed prominently in green, and BountyBay branding. This will make every shared bounty link look professional across Facebook, X, iMessage, WhatsApp, etc.

## What You'll Get
A card-style image for every bounty that includes:
- The actual bounty item photo (properly scaled/cropped to fit)
- Bounty amount in large green text
- Item title
- "OPEN" status badge
- BountyBay branding
- Clean dark theme background

## Architecture

```text
+-------------------+     +------------------+     +------------------+
|   bounty-meta     | --> |    og-image      | --> |   Social Card    |
|   (serves HTML    |     |   (generates     |     |   (1200x630 PNG) |
|   with og:image)  |     |   PNG from JSX)  |     |                  |
+-------------------+     +------------------+     +------------------+
```

---

## Technical Implementation

### Step 1: Upgrade og-image Edge Function

Replace the current SVG-based approach with **Satori + resvg-wasm**:

- **Satori**: Converts React-like JSX to SVG (by Vercel, battle-tested)
- **resvg-wasm**: Converts SVG to PNG (WebAssembly, runs in Deno)

The function will:
1. Fetch bounty data (title, amount, status, images)
2. Fetch the bounty's first image and convert it to base64 (for embedding)
3. Generate a JSX template with the embedded photo
4. Convert JSX to SVG via Satori
5. Convert SVG to PNG via resvg-wasm
6. Return the PNG with proper caching headers

### Step 2: Update bounty-meta to Use Dynamic Image

Change line 69 in `bounty-meta/index.ts` from:
```typescript
const ogImage = bounty.images?.[0] || 'https://bountybay.co/og-default.png';
```

To point to the og-image function:
```typescript
const ogImage = `https://auth.bountybay.co/functions/v1/og-image?id=${bounty.id}`;
```

### Step 3: Template Design (Card Style)

```text
+------------------------------------------------------------------+
|  BOUNTYBAY                                          [OPEN] badge |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------+    REWARD                                  |
|  |                  |                                            |
|  |   [ITEM PHOTO]   |    $500                                    |
|  |   (400x400 area) |    (large green text)                      |
|  |                  |                                            |
|  +------------------+    Help find:                              |
|                         Vintage Rolex Submariner 1680            |
|                         (title in white)                         |
|                                                                  |
+------------------------------------------------------------------+
|                                          bountybay.co            |
+------------------------------------------------------------------+
```

---

## Dependencies (Deno-compatible)

```typescript
import satori from "https://esm.sh/satori@0.10.14";
import { Resvg } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";
import { initWasm } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";
```

---

## Handling the Bounty Photo

1. Fetch the image URL from the bounty record
2. Fetch the actual image bytes
3. Convert to base64 data URI
4. Embed directly in the JSX template
5. Apply CSS `object-fit: cover` to handle any aspect ratio

If the image fetch fails or bounty has no image, fall back to a placeholder icon.

---

## Caching Strategy

- Cache generated PNGs for 1 hour (`Cache-Control: public, max-age=3600`)
- When a bounty is updated, the cache will naturally expire
- Consider adding a cache-busting param based on `updated_at` if needed

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/og-image/index.ts` | Complete rewrite with Satori + resvg-wasm |
| `supabase/functions/bounty-meta/index.ts` | Update `ogImage` URL to point to og-image function |

---

## Risk Mitigation

- **Cold start latency**: First request may take 1-2 seconds due to WASM initialization. Subsequent requests will be faster.
- **Image fetch failures**: Graceful fallback to emoji/placeholder if bounty image can't be fetched.
- **Font loading**: Use system fonts via Satori's built-in font loading, or embed a simple font file.

---

## Expected Result

When someone shares `https://auth.bountybay.co/functions/v1/bounty-meta?id=xxx`:

- Facebook, X, LinkedIn, iMessage, WhatsApp will all show a professional 1200x630 card
- The card will include the actual item photo
- The bounty amount will be prominent in green
- BountyBay branding will be consistent

