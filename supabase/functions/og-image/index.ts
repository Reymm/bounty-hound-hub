import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.6/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_IMAGE = "https://bountybay.co/og-default.png";

// Brand colors — LIGHT theme, matching site
const BLUE = "#3b82f6";
const BLUE_LIGHT = "#dbeafe";
const GREEN = "#16a34a";
const WHITE = "#ffffff";
const GRAY_50 = "#f9fafb";
const GRAY_200 = "#e5e7eb";
const GRAY_500 = "#6b7280";
const GRAY_900 = "#111827";

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: bounty, error } = await supabase
      .from("Bounties")
      .select("id, title, amount, status, requires_shipping, poster_id, images")
      .eq("id", bountyId)
      .single();

    if (error || !bounty) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: FALLBACK_IMAGE },
      });
    }

    const title =
      bounty.title.length > 55
        ? bounty.title.slice(0, 52) + "..."
        : bounty.title;
    const amount = `$${(bounty.amount || 0).toLocaleString()}`;
    const bountyType = bounty.requires_shipping ? "Find & Ship" : "Lead Only";

    const bountyImageUrl = bounty.images && bounty.images.length > 0
      ? bounty.images[0]
      : null;

    // Image section — fitted with shadow container
    const imageSection = bountyImageUrl
      ? {
          type: "div",
          props: {
            style: {
              width: 340,
              height: 340,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)",
              flexShrink: 0,
              display: "flex",
            },
            children: [
              {
                type: "img",
                props: {
                  src: bountyImageUrl,
                  width: 340,
                  height: 340,
                  style: {
                    width: 340,
                    height: 340,
                    objectFit: "cover",
                  },
                },
              },
            ],
          },
        }
      : {
          type: "div",
          props: {
            style: {
              width: 340,
              height: 340,
              borderRadius: 20,
              background: BLUE_LIGHT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 100,
              fontWeight: 700,
              color: BLUE,
              flexShrink: 0,
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)",
            },
            children: "B",
          },
        };

    const element = {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${WHITE} 0%, #f0f7ff 100%)`,
          fontFamily: "Inter, sans-serif",
          position: "relative",
        },
        children: [
          // Top accent bar — blue
          {
            type: "div",
            props: {
              style: {
                width: "100%",
                height: 5,
                background: `linear-gradient(90deg, ${BLUE}, #60a5fa)`,
              },
            },
          },
          // Main content area
          {
            type: "div",
            props: {
              style: {
                flex: 1,
                display: "flex",
                flexDirection: "row",
                padding: "44px 56px 24px",
                gap: 48,
                alignItems: "center",
              },
              children: [
                // LEFT: Bounty photo with shadow
                imageSection,
                // RIGHT: Text content
                {
                  type: "div",
                  props: {
                    style: {
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 14,
                    },
                    children: [
                      // Logo: Blue square + BOUNTYBAY
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          },
                          children: [
                            {
                              type: "div",
                              props: {
                                style: {
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: `linear-gradient(135deg, ${BLUE}, #2563eb)`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 18,
                                  fontWeight: 700,
                                  color: WHITE,
                                },
                                children: "B",
                              },
                            },
                            {
                              type: "div",
                              props: {
                                style: {
                                  fontSize: 20,
                                  fontWeight: 700,
                                  color: BLUE,
                                  letterSpacing: 1.5,
                                },
                                children: "BOUNTYBAY",
                              },
                            },
                          ],
                        },
                      },
                      // Bounty type pill with shadow
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                          },
                          children: [
                            {
                              type: "div",
                              props: {
                                style: {
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: GRAY_500,
                                  padding: "6px 16px",
                                  borderRadius: 14,
                                  background: WHITE,
                                  border: `1px solid ${GRAY_200}`,
                                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
                                },
                                children: bountyType,
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
                            fontSize: 32,
                            fontWeight: 700,
                            color: GRAY_900,
                            lineHeight: 1.2,
                          },
                          children: title,
                        },
                      },
                      // Bounty amount row
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "baseline",
                            gap: 12,
                            marginTop: 4,
                          },
                          children: [
                            {
                              type: "div",
                              props: {
                                style: {
                                  fontSize: 20,
                                  fontWeight: 700,
                                  color: GRAY_500,
                                  letterSpacing: 2,
                                },
                                children: "BOUNTY",
                              },
                            },
                            {
                              type: "div",
                              props: {
                                style: {
                                  fontSize: 54,
                                  fontWeight: 700,
                                  color: GRAY_900,
                                  lineHeight: 1,
                                },
                                children: amount,
                              },
                            },
                          ],
                        },
                      },
                      // Green "View Now" pill with shadow
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            marginTop: 8,
                          },
                          children: [
                            {
                              type: "div",
                              props: {
                                style: {
                                  fontSize: 16,
                                  fontWeight: 700,
                                  color: WHITE,
                                  background: GREEN,
                                  padding: "12px 32px",
                                  borderRadius: 24,
                                  letterSpacing: 0.5,
                                  boxShadow: "0 4px 14px rgba(22, 163, 74, 0.3), 0 2px 6px rgba(22, 163, 74, 0.15)",
                                },
                                children: "View Now",
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
          },
          // Bottom: domain
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                padding: "0 56px 18px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 14,
                      fontWeight: 600,
                      color: GRAY_500,
                    },
                    children: "bountybay.co",
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
