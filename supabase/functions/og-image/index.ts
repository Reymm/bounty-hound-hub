import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.6/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_IMAGE = "https://bountybay.co/og-default.png";

// Brand colors
const BLUE = "#3b82f6";
const GREEN = "#22c55e";
const DARK_BG = "#0c1222";
const DARK_BG_2 = "#14203a";
const SLATE_50 = "#f8fafc";
const SLATE_200 = "#e2e8f0";
const SLATE_400 = "#94a3b8";
const SLATE_500 = "#64748b";
const SLATE_600 = "#475569";
const SLATE_700 = "#334155";
const SLATE_800 = "#1e293b";

// Pre-load fonts at module startup (cached across requests)
let fontRegular: ArrayBuffer | null = null;
let fontBold: ArrayBuffer | null = null;

try {
  const [reg, bold] = await Promise.all([
    fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff"),
    fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff"),
  ]);
  if (reg.ok) {
    fontRegular = await reg.arrayBuffer();
    if (fontRegular.byteLength === 0) fontRegular = null;
  }
  if (bold.ok) {
    fontBold = await bold.arrayBuffer();
    if (fontBold.byteLength === 0) fontBold = null;
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

    // Support both path-based (/og-image/{id}) and query-based (?id=...)
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const bountyId = (lastSegment && isUUID.test(lastSegment))
      ? lastSegment
      : url.searchParams.get("id");

    if (!bountyId) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: FALLBACK_IMAGE },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
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
      bounty.title.length > 50
        ? bounty.title.slice(0, 47) + "..."
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
          background: `linear-gradient(150deg, ${DARK_BG} 0%, ${DARK_BG_2} 50%, ${DARK_BG} 100%)`,
          fontFamily: "Inter, sans-serif",
          position: "relative",
          overflow: "hidden",
        },
        children: [
          // Decorative gradient orb (top-right)
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: -120,
                right: -80,
                width: 400,
                height: 400,
                borderRadius: 200,
                background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
              },
            },
          },
          // Top accent line — blue gradient
          {
            type: "div",
            props: {
              style: {
                width: "100%",
                height: 4,
                background: `linear-gradient(90deg, ${BLUE}, #60a5fa, ${BLUE})`,
              },
            },
          },
          // Main content wrapper
          {
            type: "div",
            props: {
              style: {
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "44px 56px 36px",
              },
              children: [
                // ─── Header: Logo + Bounty Type ───
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 32,
                    },
                    children: [
                      // Logo mark + wordmark
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          },
                          children: [
                            // Logo square
                            {
                              type: "div",
                              props: {
                                style: {
                                  width: 38,
                                  height: 38,
                                  borderRadius: 10,
                                  background: `linear-gradient(135deg, ${BLUE}, #2563eb)`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 20,
                                  fontWeight: 700,
                                  color: "white",
                                },
                                children: "B",
                              },
                            },
                            // Wordmark
                            {
                              type: "div",
                              props: {
                                style: {
                                  fontSize: 22,
                                  fontWeight: 700,
                                  color: SLATE_200,
                                  letterSpacing: 1.5,
                                },
                                children: "BOUNTYBAY",
                              },
                            },
                          ],
                        },
                      },
                      // Bounty type pill
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: 14,
                            fontWeight: 600,
                            color: SLATE_400,
                            padding: "8px 20px",
                            borderRadius: 20,
                            border: `1px solid ${SLATE_700}`,
                            letterSpacing: 0.5,
                          },
                          children: bountyType,
                        },
                      },
                    ],
                  },
                },
                // ─── Center Content: Amount + Title ───
                {
                  type: "div",
                  props: {
                    style: {
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 20,
                    },
                    children: [
                      // Reward amount row
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "baseline",
                            gap: 14,
                          },
                          children: [
                            {
                              type: "div",
                              props: {
                                style: {
                                  fontSize: 72,
                                  fontWeight: 700,
                                  color: GREEN,
                                  lineHeight: 1,
                                },
                                children: amount,
                              },
                            },
                            {
                              type: "div",
                              props: {
                                style: {
                                  fontSize: 18,
                                  fontWeight: 600,
                                  color: SLATE_500,
                                  letterSpacing: 3,
                                },
                                children: "BOUNTY",
                              },
                            },
                          ],
                        },
                      },
                      // Title
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: 38,
                            fontWeight: 700,
                            color: SLATE_50,
                            lineHeight: 1.25,
                          },
                          children: title,
                        },
                      },
                    ],
                  },
                },
                // ─── Footer: Status + Meta ───
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: `1px solid ${SLATE_800}`,
                      paddingTop: 20,
                    },
                    children: [
                      // Left: status + poster
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                          },
                          children: [
                            // Status indicator
                            {
                              type: "div",
                              props: {
                                style: {
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: isOpen ? GREEN : SLATE_400,
                                },
                                children: [
                                  // Dot
                                  {
                                    type: "div",
                                    props: {
                                      style: {
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: isOpen ? GREEN : SLATE_500,
                                      },
                                    },
                                  },
                                  isOpen ? "Open" : "Closed",
                                ],
                              },
                            },
                            // Divider
                            {
                              type: "div",
                              props: {
                                style: {
                                  width: 1,
                                  height: 16,
                                  backgroundColor: SLATE_700,
                                },
                              },
                            },
                            // Posted by
                            {
                              type: "div",
                              props: {
                                style: {
                                  fontSize: 14,
                                  color: SLATE_500,
                                },
                                children: `by @${posterName}`,
                              },
                            },
                          ],
                        },
                      },
                      // Right: domain
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: 15,
                            fontWeight: 600,
                            color: SLATE_600,
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

    const fonts: Array<Record<string, unknown>> = [];
    if (fontRegular) {
      fonts.push({ name: "Inter", data: fontRegular.slice(0), style: "normal", weight: 400 });
    }
    if (fontBold) {
      fonts.push({ name: "Inter", data: fontBold.slice(0), style: "normal", weight: 700 });
    }

    const options: Record<string, unknown> = { width: 1200, height: 630 };
    if (fonts.length > 0) {
      options.fonts = fonts;
    }

    const response = new ImageResponse(element, options);
    response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
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
