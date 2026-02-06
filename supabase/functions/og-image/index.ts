import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.6/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_IMAGE = "https://bountybay.co/og-default.png";

// Pre-load font at module startup (cached across requests)
let fontData: ArrayBuffer | null = null;
try {
  const res = await fetch(
    "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff"
  );
  if (res.ok) {
    fontData = await res.arrayBuffer();
    if (fontData.byteLength === 0) fontData = null;
  }
} catch (e) {
  console.error("Font load failed:", e);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const bountyId = url.searchParams.get("id");

    if (!bountyId) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: FALLBACK_IMAGE },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: bounty, error } = await supabase
      .from("Bounties")
      .select("id, title, amount, status, requires_shipping, poster_id")
      .eq("id", bountyId)
      .single();

    if (error || !bounty) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: FALLBACK_IMAGE },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, full_name")
      .eq("id", bounty.poster_id)
      .single();

    const posterName = profile?.username || profile?.full_name || "Someone";
    const title =
      bounty.title.length > 45
        ? bounty.title.slice(0, 42) + "..."
        : bounty.title;
    const amount = `$${(bounty.amount || 0).toLocaleString()}`;
    const bountyType = bounty.requires_shipping ? "Find & Ship" : "Lead Only";
    const isOpen = bounty.status === "open";

    const element = {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "60px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "white",
          fontFamily: "Inter, sans-serif",
        },
        children: [
          // Top bar
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: { fontSize: 28, fontWeight: 700, color: "#3b82f6" },
                    children: "🔍 BOUNTYBAY",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 16,
                      fontWeight: 600,
                      backgroundColor:
                        bountyType === "Find & Ship" ? "#ea580c" : "#3b82f6",
                      color: "white",
                      padding: "8px 20px",
                      borderRadius: 20,
                    },
                    children: bountyType,
                  },
                },
              ],
            },
          },
          // Middle: title
          {
            type: "div",
            props: {
              style: {
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: { fontSize: 22, color: "#94a3b8", marginBottom: 8 },
                    children: "Help find:",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 42,
                      fontWeight: 700,
                      color: "white",
                      lineHeight: 1.2,
                    },
                    children: title,
                  },
                },
              ],
            },
          },
          // Bottom: reward + meta
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                borderTop: "1px solid #334155",
                paddingTop: 24,
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: { display: "flex", flexDirection: "column" },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: 16,
                            color: "#94a3b8",
                            marginBottom: 4,
                            letterSpacing: 2,
                          },
                          children: "REWARD",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: 64,
                            fontWeight: 700,
                            color: "#22c55e",
                          },
                          children: amount,
                        },
                      },
                    ],
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: 13,
                            fontWeight: 600,
                            backgroundColor: isOpen
                              ? "rgba(34, 197, 94, 0.15)"
                              : "rgba(100, 116, 139, 0.15)",
                            color: isOpen ? "#22c55e" : "#94a3b8",
                            padding: "6px 16px",
                            borderRadius: 16,
                            marginBottom: 12,
                          },
                          children: isOpen ? "OPEN" : "CLOSED",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: { fontSize: 16, color: "#64748b" },
                          children: `Posted by @${posterName}`,
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: 16,
                            color: "#475569",
                            marginTop: 4,
                          },
                          children: "bountybay.co",
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    };

    const options: Record<string, unknown> = { width: 1200, height: 630 };
    if (fontData) {
      options.fonts = [
        {
          name: "Inter",
          data: fontData.slice(0),
          style: "normal",
          weight: 400,
        },
      ];
    }

    const response = new ImageResponse(element, options);
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, s-maxage=3600"
    );
    response.headers.set("X-Content-Type-Options", "nosniff");

    return response;
  } catch (error) {
    console.error("OG image generation failed:", error);
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: FALLBACK_IMAGE },
    });
  }
});
