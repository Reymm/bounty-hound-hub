import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.6/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_IMAGE = "https://bountybay.co/og-default.png";

// Brand colors — matching the actual site
const BLUE = "#3b82f6";
const GREEN = "#16a34a";
const WHITE = "#ffffff";
const GRAY_100 = "#f3f4f6";
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
      bounty.title.length > 60
        ? bounty.title.slice(0, 57) + "..."
        : bounty.title;
    const amount = `$${(bounty.amount || 0).toLocaleString()}`;
    const bountyType = bounty.requires_shipping ? "Find & Ship" : "Lead Only";

    const bountyImageUrl = bounty.images && bounty.images.length > 0
      ? bounty.images[0]
      : null;

    // Left side: bounty image — contained (not cropped), slightly tilted, with shadow
    const imageSection = bountyImageUrl
      ? {
          type: "div",
          props: {
            style: {
              width: 440,
              height: 500,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: WHITE,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: 380,
                    height: 440,
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: WHITE,
                    transform: "rotate(-3deg)",
                  },
                  children: [
                    {
                      type: "img",
                      props: {
                        src: bountyImageUrl,
                        width: 380,
                        height: 440,
                        style: {
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        }
      : {
          type: "div",
          props: {
            style: {
              width: 440,
              height: 500,
              borderRadius: 16,
              background: `linear-gradient(135deg, #dbeafe, #bfdbfe)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.1)",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: 28,
                    fontWeight: 700,
                    color: BLUE,
                    letterSpacing: 1,
                  },
                  children: "BountyBay",
                },
              },
            ],
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
          background: `linear-gradient(160deg, ${WHITE} 0%, #f0f6ff 100%)`,
          fontFamily: "Inter, sans-serif",
          position: "relative",
        },
        children: [
          // Top accent bar
          {
            type: "div",
            props: {
              style: {
                width: "100%",
                height: 5,
                background: `linear-gradient(90deg, ${BLUE}, #60a5fa, ${BLUE})`,
              },
            },
          },
          // Main content
          {
            type: "div",
            props: {
              style: {
                flex: 1,
                display: "flex",
                flexDirection: "row",
                padding: "36px 52px 28px",
                gap: 52,
                alignItems: "center",
              },
              children: [
                // LEFT: Bounty photo
                imageSection,
                // RIGHT: All text content
                {
                  type: "div",
                  props: {
                    style: {
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 18,
                    },
                    children: [
                      // Small "bountybay.co" branding
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: 16,
                            fontWeight: 600,
                            color: GRAY_500,
                          },
                          children: "bountybay.co",
                        },
                      },
                      // Combined line: "Lead Only · $1,000 Bounty:"
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: 28,
                            fontWeight: 700,
                            color: GRAY_900,
                            lineHeight: 1.3,
                          },
                          children: `${bountyType} · ${amount} Bounty:`,
                        },
                      },
                      // Title — large and bold
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: 32,
                            fontWeight: 700,
                            color: GRAY_900,
                            lineHeight: 1.25,
                          },
                          children: title,
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
                                  borderRadius: 20,
                                  letterSpacing: 0.5,
                                  boxShadow: "0 4px 14px rgba(22, 163, 74, 0.35)",
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
          // Footer: domain
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "flex-end",
                padding: "0 52px 16px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 15,
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
