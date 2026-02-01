# READY TO IMPLEMENT - User Approved

## Status: APPROVED - Switch to default mode to implement

The user has approved. Implementation requires switching to default mode.

## Files to Create/Modify:

### 1. supabase/functions/og-image/index.ts (Complete Rewrite)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import React from "https://esm.sh/react@18.2.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.6/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fetch image and convert to base64 data URI
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log("Failed to fetch image:", response.status);
      return null;
    }
    
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const bountyId = url.searchParams.get("id");

    if (!bountyId) {
      return new Response("Missing bounty ID", { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: bounty, error } = await supabase
      .from("Bounties")
      .select(`id, title, amount, description, status, images, requires_shipping`)
      .eq("id", bountyId)
      .single();

    if (error || !bounty) {
      console.error("Bounty not found:", error);
      return new Response("Bounty not found", { status: 404, headers: corsHeaders });
    }

    const truncatedTitle = bounty.title.length > 45 
      ? bounty.title.slice(0, 42) + '...' 
      : bounty.title;
    const title = `Help me find: $${(bounty.amount || 0).toLocaleString()} Bounty — ${truncatedTitle} | BountyBay`;

    let imageData: string | null = null;
    if (bounty.images?.[0]) {
      imageData = await fetchImageAsBase64(bounty.images[0]);
    }

    return new ImageResponse(
      React.createElement(
        "div",
        {
          style: {
            width: "100%",
            height: "100%",
            display: "flex",
            background: "linear-gradient(135deg, #fdf2f8 0%, #ede9fe 50%, #dbeafe 100%)",
            padding: "40px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              width: "400px",
              height: "400px",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              marginTop: "75px",
            },
          },
          imageData
            ? React.createElement("img", {
                src: imageData,
                width: 360,
                height: 360,
                style: { width: "360px", height: "360px", objectFit: "contain", borderRadius: "8px" },
              })
            : React.createElement("div", { style: { fontSize: "120px", display: "flex", alignItems: "center", justifyContent: "center" } }, "📦")
        ),
        React.createElement(
          "div",
          {
            style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: "50px" },
          },
          React.createElement("div", { style: { fontSize: "18px", color: "#6b7280", marginBottom: "16px" } }, "bountybay.co"),
          React.createElement("div", { style: { fontSize: "36px", fontWeight: "bold", color: "#1f2937", lineHeight: 1.3, marginBottom: "24px", maxWidth: "650px" } }, title),
          React.createElement("div", { style: { background: "#1f2937", color: "white", padding: "12px 28px", borderRadius: "24px", fontSize: "18px", fontWeight: "600", display: "flex", width: "140px" } }, "Read more")
        )
      ),
      { width: 1200, height: 630 }
    );
  } catch (error) {
    console.error("OG image generation error:", error);
    return new Response("Error generating image", { status: 500, headers: corsHeaders });
  }
});
```

### 2. supabase/functions/bounty-meta/index.ts (Line 67-69)

Change:
```typescript
const ogImage = bounty.images?.[0] || 'https://bountybay.co/og-default.png';
```

To:
```typescript
const ogImage = `https://auth.bountybay.co/functions/v1/og-image?id=${bounty.id}`;
```

## Expected Result

PNG image at 1200x630 matching OpenGraph.xyz style:
- Light pink/lavender gradient background
- Bounty image in white frame on left
- Title, domain, and "Read more" button on right
- Works on Facebook, Twitter, iMessage, WhatsApp
