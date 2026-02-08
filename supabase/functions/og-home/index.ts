import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.6/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BLUE = "#3b82f6";
const GRAY_900 = "#111827";
const WHITE = "#ffffff";

// Pre-load Inter fonts at module startup (cached across requests)
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
    const element = {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: WHITE,
          fontFamily: "Inter, sans-serif",
        },
        children: [
          // "BountyBay" logo text in blue with shadow
          {
            type: "div",
            props: {
              style: {
                fontSize: 72,
                fontWeight: 700,
                color: BLUE,
                letterSpacing: -1,
                lineHeight: 1,
                textShadow: "0 4px 16px rgba(59, 130, 246, 0.35)",
              },
              children: "BountyBay",
            },
          },
          // "Find The Unfindable." tagline in black
          {
            type: "div",
            props: {
              style: {
                fontSize: 28,
                fontWeight: 400,
                color: GRAY_900,
                marginTop: 16,
                letterSpacing: 0.5,
              },
              children: "Find The Unfindable.",
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
    // Cache aggressively since homepage OG never changes
    response.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
    response.headers.set("X-Content-Type-Options", "nosniff");

    return response;
  } catch (error) {
    console.error("OG home image generation failed:", error);
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: "https://bountybay.co/og-default.png" },
    });
  }
});
