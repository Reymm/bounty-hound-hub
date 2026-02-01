
# Implementation: Fix OG Image Generator for WebP Support

## Problem Identified
The current `og-image` edge function is failing because:
1. **WebP images are not supported** by the og_edge/satori library
2. **Image dimensions must be explicitly specified** when using embedded images

Error from logs:
```
Can't load image: Unsupported image type: image/webp
Image size cannot be determined. Please provide the width and height of the image.
```

## Solution

### File: `supabase/functions/og-image/index.ts`

**Changes needed:**

1. **Add image fetching helper function** - Fetch image bytes and convert to base64 data URI
2. **Handle WebP fallback** - If image is WebP (not supported), show placeholder emoji instead
3. **Specify explicit dimensions** - Add `width` and `height` props to the `<img>` element

**Key code changes:**

```typescript
// Add helper function to fetch and convert images
async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    const contentType = response.headers.get("content-type") || "image/jpeg";
    
    // WebP is not supported by satori - fall back to placeholder
    if (contentType.includes("webp")) {
      console.log("WebP detected, falling back to placeholder");
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
    
    const mimeType = contentType.includes("png") ? "image/png" : "image/jpeg";
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
}
```

```typescript
// In the main handler, try to fetch image
let imageDataUri: string | null = null;
if (bounty.images?.[0]) {
  imageDataUri = await fetchImageAsBase64(bounty.images[0]);
}

// In the image element, add explicit dimensions
React.createElement("img", {
  src: imageDataUri,
  width: 380,  // Explicit width
  height: 380, // Explicit height
  style: {
    width: "380px",
    height: "380px",
    objectFit: "cover",
  },
})
```

3. **Conditional rendering** - Show emoji placeholder when image is WebP or fails to load

---

## Current Status

The `bounty-meta` function is already correctly pointing to the og-image function:
```typescript
const ogImage = `https://auth.bountybay.co/functions/v1/og-image?id=${bounty.id}`;
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/og-image/index.ts` | Add WebP handling, explicit dimensions, base64 conversion |

---

## Expected Result

After this fix:
- PNG/JPEG bounty images will display in the OG card
- WebP images will gracefully fall back to a 💰 emoji placeholder
- Social platforms (Facebook, X, iMessage, WhatsApp) will show professional 1200x630 cards
