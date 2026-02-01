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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const bountyId = url.searchParams.get("id");

    if (!bountyId) {
      return new Response("Missing bounty ID", { status: 400, headers: corsHeaders });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch bounty details
    const { data: bounty, error } = await supabase
      .from("Bounties")
      .select(`
        id,
        title,
        amount,
        status,
        images,
        requires_shipping
      `)
      .eq("id", bountyId)
      .single();

    if (error || !bounty) {
      console.error("Bounty not found:", error);
      return new Response("Bounty not found", { status: 404, headers: corsHeaders });
    }

    // Prepare title
    const truncatedTitle = bounty.title.length > 45 
      ? bounty.title.slice(0, 42) + "..." 
      : bounty.title;
    const title = `Help me find: $${(bounty.amount || 0).toLocaleString()} Bounty — ${truncatedTitle}`;
    
    // Fetch and convert bounty image to base64
    let imageData: string | null = null;
    if (bounty.images?.[0]) {
      imageData = await fetchImageAsBase64(bounty.images[0]);
    }

    // Generate PNG using og_edge with React.createElement
    const response = new ImageResponse(
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
        // Left: Image in white frame
        React.createElement(
          "div",
          {
            style: {
              width: "380px",
              height: "380px",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              flexShrink: 0,
              marginTop: "45px",
            },
          },
          imageData
            ? React.createElement("img", {
                src: imageData,
                width: 340,
                height: 340,
                style: { objectFit: "contain", borderRadius: "8px" },
              })
            : React.createElement(
                "div",
                {
                  style: {
                    fontSize: "120px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                },
                "📦"
              )
        ),
        // Right: Content
        React.createElement(
          "div",
          {
            style: {
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: "50px",
              paddingRight: "20px",
            },
          },
          // Domain badge
          React.createElement(
            "div",
            {
              style: {
                fontSize: "18px",
                color: "#6b7280",
                marginBottom: "16px",
              },
            },
            "bountybay.co"
          ),
          // Title
          React.createElement(
            "div",
            {
              style: {
                fontSize: "38px",
                fontWeight: "bold",
                color: "#1f2937",
                lineHeight: 1.3,
                marginBottom: "32px",
              },
            },
            title
          ),
          // Read more button
          React.createElement(
            "div",
            {
              style: {
                background: "#1f2937",
                color: "white",
                padding: "14px 32px",
                borderRadius: "24px",
                fontSize: "18px",
                fontWeight: "600",
                display: "flex",
                width: "140px",
                justifyContent: "center",
              },
            },
            "Read more"
          )
        )
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    // Add caching headers
    response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
    
    return response;
  } catch (error) {
    console.error("OG image generation error:", error);
    return new Response("Error generating image", { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
