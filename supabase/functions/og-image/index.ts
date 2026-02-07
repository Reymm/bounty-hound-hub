import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.6/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_IMAGE = "https://bountybay.co/og-default.png";

// Brand colors — LIGHT theme
const BLUE = "#3b82f6";
const BLUE_LIGHT = "#dbeafe";
const GREEN = "#22c55e";
const WHITE = "#ffffff";
const GRAY_50 = "#f9fafb";
const GRAY_100 = "#f3f4f6";
const GRAY_200 = "#e5e7eb";
const GRAY_500 = "#6b7280";
const GRAY_700 = "#374151";
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

    // Get the first bounty image URL if available
    const bountyImageUrl = bounty.images && bounty.images.length > 0
      ? bounty.images[0]
      : null;

    // Build the image element — actual bounty photo or placeholder
    const imageSection = bountyImageUrl
      ? {
          type: "img",
          props: {
            src: bountyImageUrl,
            width: 380,
            height: 380,
            style: {
              width: 380,
              height: 380,
              objectFit: "cover",
              borderRadius: 16,
              border: `1px solid ${GRAY_200}`,
            },
          },
        }
      : {
          // No image — show a blue placeholder box with "B"
          type: "div",
          props: {
            style: {
              width: 380,
              height: 380,
              borderRadius: 16,
              background: BLUE_LIGHT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 120,
              fontWeight: 700,
              color: BLUE,
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
          background: WHITE,
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
                background: BLUE,
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
                padding: "40px 50px 32px",
                gap: 44,
              },
              children: [
                // LEFT: Bounty photo
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
                      gap: 16,
                    },
                    children: [
                      // BountyBay wordmark
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: 20,
                            fontWeight: 700,
                            color: BLUE,
                            letterSpacing: 1,
                          },
                          children: "BOUNTYBAY",
                        },
                      },
                      // Bounty type pill
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
                                  padding: "5px 14px",
                                  borderRadius: 14,
                                  border: `1px solid ${GRAY_200}`,
                                  background: GRAY_50,
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
                            fontSize: 34,
                            fontWeight: 700,
                            color: GRAY_900,
                            lineHeight: 1.2,
                          },
                          children: title,
                        },
                      },
                      // Bounty amount
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "baseline",
                            gap: 10,
                          },
                          children: [
                            {
                              type: "div",
                              props: {
                                style: {
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: GRAY_500,
                                  letterSpacing: 1,
                                },
                                children: "BOUNTY",
                              },
                            },
                            {
                              type: "div",
                              props: {
                                style: {
                                  fontSize: 52,
                                  fontWeight: 700,
                                  color: BLUE,
                                  lineHeight: 1,
                                },
                                children: amount,
                              },
                            },
                          ],
                        },
                      },
                      // Green "View Now" pill
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
                                  padding: "10px 28px",
                                  borderRadius: 24,
                                  letterSpacing: 0.5,
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
          // Bottom bar — subtle gray line with domain
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                padding: "0 50px 16px",
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
