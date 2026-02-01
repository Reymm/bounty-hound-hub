

# Build Professional OG Image Generator (Like OpenGraph.xyz)

## What You Want

The screenshot shows a professional OG card from OpenGraph.xyz with:
- Light pink/lavender gradient background  
- Bounty photo on the LEFT in a clean white frame with shadow
- Domain badge (auth.bountybay.co)
- Title: "Help me find: $5 Bounty — Looking for a Lead on a Nixon Hoodie From... | BountyBay"
- Black "Read more" button
- Navigation arrows at bottom

## What I'll Build

A complete rewrite of `og-image/index.ts` using:
- **`og_edge` library** - Generates PNG images (not SVG) from React/JSX
- **Base64 image embedding** - Fetch bounty image and embed directly
- **WebP detection** - Convert or fallback gracefully
- **Your brand colors** - Blue (#3B82F6), not orange

## Design Spec (Matching Reference)

```text
+----------------------------------------------------------+
|                                                          |
|   +---------------+    auth.bountybay.co                 |
|   |               |                                      |
|   |   [BOUNTY     |    Help me find: $50 Bounty —        |
|   |    IMAGE]     |    Looking for a vintage...          |
|   |               |    | BountyBay                       |
|   |               |                                      |
|   +---------------+    [Read more]                       |
|                                                          |
+----------------------------------------------------------+

Background: Light gradient (lavender/pink like reference)
Image frame: White with subtle shadow
Typography: Clean system fonts
Button: Black rounded "Read more"
```

## Technical Implementation

### File: `supabase/functions/og-image/index.ts`

Complete rewrite:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import React from "https://esm.sh/react@18.2.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.6/mod.ts";

// Fetch image and convert to base64 data URI
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const contentType = response.headers.get("content-type") || "image/jpeg";
    
    // WebP not supported by satori - skip
    if (contentType.includes("webp")) {
      console.log("WebP detected, using placeholder");
      return null;
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => 
        data + String.fromCharCode(byte), ""
      )
    );
    
    return `data:${contentType};base64,${base64}`;
  } catch (e) {
    console.error("Image fetch failed:", e);
    return null;
  }
}

serve(async (req) => {
  // ... CORS handling, bounty fetch same as before ...

  // Fetch and convert bounty image
  let imageData: string | null = null;
  if (bounty.images?.[0]) {
    imageData = await fetchImageAsBase64(bounty.images[0]);
  }

  // Generate PNG using og_edge
  return new ImageResponse(
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      background: "linear-gradient(135deg, #fdf2f8 0%, #ede9fe 50%, #dbeafe 100%)",
      padding: "40px",
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Left: Image in white frame */}
      <div style={{
        width: "400px",
        height: "400px",
        background: "white",
        borderRadius: "16px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}>
        {imageData ? (
          <img 
            src={imageData} 
            width={360} 
            height={360} 
            style={{ objectFit: "contain", borderRadius: "8px" }} 
          />
        ) : (
          <div style={{ fontSize: "120px" }}>📦</div>
        )}
      </div>
      
      {/* Right: Content */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        paddingLeft: "50px",
      }}>
        {/* Domain badge */}
        <div style={{
          fontSize: "18px",
          color: "#6b7280",
          marginBottom: "16px",
        }}>
          bountybay.co
        </div>
        
        {/* Title */}
        <div style={{
          fontSize: "42px",
          fontWeight: "bold",
          color: "#1f2937",
          lineHeight: 1.2,
          marginBottom: "24px",
        }}>
          {title}
        </div>
        
        {/* Read more button */}
        <div style={{
          background: "#1f2937",
          color: "white",
          padding: "12px 28px",
          borderRadius: "24px",
          fontSize: "18px",
          fontWeight: "600",
          width: "fit-content",
        }}>
          Read more
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
});
```

### File: `supabase/functions/bounty-meta/index.ts`

Update line 67-69 to use the og-image generator:

```typescript
// Use dynamic OG image generator
const ogImage = `https://auth.bountybay.co/functions/v1/og-image?id=${bounty.id}`;
```

## Output

**PNG image** at 1200x630 that looks like the OpenGraph.xyz preview:
- Light gradient background (pink → lavender → blue)
- Bounty image in clean white frame with shadow
- Domain, title, and "Read more" button
- Works on Facebook, Twitter, iMessage, WhatsApp

## Files to Change

| File | Action |
|------|--------|
| `supabase/functions/og-image/index.ts` | Complete rewrite with og_edge + proper styling |
| `supabase/functions/bounty-meta/index.ts` | Update og:image URL to use generator |

