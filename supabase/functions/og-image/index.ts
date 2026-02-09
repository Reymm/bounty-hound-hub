import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.6/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_IMAGE = "https://bountybay.co/og-default.png";
const OG_BUCKET = "og-images";

// Brand colors
const BLUE = "#3b82f6";
const GREEN = "#16a34a";
const WHITE = "#ffffff";
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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // --- CHECK CACHE FIRST ---
    const cachedPath = `${bountyId}.png`;
    const { data: cachedFile } = await supabase.storage
      .from(OG_BUCKET)
      .createSignedUrl(cachedPath, 60); // just checking existence

    if (cachedFile?.signedUrl) {
      // Serve the public URL directly
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${OG_BUCKET}/${cachedPath}`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: publicUrl,
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }

    // --- NO CACHE — GENERATE IMAGE ---
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

    // Strip "help me find" prefix if already present
    const rawTitle = bounty.title || "";
    const alreadyHasPrefix = /^help\s+(me\s+)?find[:\s]/i.test(rawTitle);
    const displayTitle = alreadyHasPrefix ? rawTitle : `Help me find: ${rawTitle}`;
    const title =
      displayTitle.length > 90
        ? displayTitle.slice(0, 87) + "..."
        : displayTitle;
    const amount = `$${(bounty.amount || 0).toLocaleString()}`;
    const bountyType = bounty.requires_shipping ? "Find & Ship" : "Lead Only";

    // Resolve bounty image — convert WebP to PNG for Satori compatibility
    const rawImageUrl = bounty.images && bounty.images.length > 0
      ? bounty.images[0]
      : null;

    let bountyImageUrl: string | null = rawImageUrl;
    if (rawImageUrl) {
      try {
        const probe = await fetch(rawImageUrl, { method: "HEAD" });
        const ct = probe.headers.get("content-type") || "";
        const isWebp = ct.includes("webp") || rawImageUrl.toLowerCase().endsWith(".webp");

        if (isWebp) {
          const transformUrl = rawImageUrl.replace(
            "/storage/v1/object/public/",
            "/storage/v1/render/image/public/",
          ) + "?width=380&height=440&resize=contain";

          const imgRes = await fetch(transformUrl);
          const imgCt = imgRes.headers.get("content-type") || "";

          if (imgRes.ok && !imgCt.includes("webp")) {
            const buf = await imgRes.arrayBuffer();
            const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
            bountyImageUrl = `data:${imgCt};base64,${b64}`;
          } else if (imgRes.ok) {
            const buf = await imgRes.arrayBuffer();
            const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
            bountyImageUrl = `data:image/png;base64,${b64}`;
          } else {
            bountyImageUrl = null;
          }
        }
      } catch (e) {
        console.error("Image probe/convert failed:", e);
        bountyImageUrl = null;
      }
    }

    // Build the OG image element tree
    const imageSection = buildImageSection(bountyImageUrl);
    const isOpen = bounty.status === "open";
    const element = buildOgElement(imageSection, title, amount, bountyType, isOpen);

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

    // Get PNG bytes and cache to storage
    const pngBytes = await response.arrayBuffer();

    // Upload to cache (fire-and-forget, don't block response)
    supabase.storage
      .from(OG_BUCKET)
      .upload(cachedPath, pngBytes, {
        contentType: "image/png",
        upsert: true,
      })
      .then(({ error: uploadErr }) => {
        if (uploadErr) console.error("OG cache upload failed:", uploadErr);
        else console.log("OG image cached:", cachedPath);
      });

    return new Response(pngBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("OG image generation failed:", error);
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: FALLBACK_IMAGE },
    });
  }
});

// --- Helper functions ---

function buildImageSection(bountyImageUrl: string | null) {
  if (bountyImageUrl) {
    return {
      type: "div",
      props: {
        style: {
          width: 440, height: 500, flexShrink: 0, display: "flex",
          alignItems: "center", justifyContent: "center", background: WHITE,
        },
        children: [{
          type: "div",
          props: {
            style: {
              width: 380, height: 440, borderRadius: 16, overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: WHITE, transform: "rotate(-3deg)",
            },
            children: [{
              type: "img",
              props: {
                src: bountyImageUrl, width: 380, height: 440,
                style: { width: "100%", height: "100%", objectFit: "contain" },
              },
            }],
          },
        }],
      },
    };
  }
  return {
    type: "div",
    props: {
      style: {
        width: 440, height: 500, borderRadius: 16,
        background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.1)",
      },
      children: [{
        type: "div",
        props: {
          style: { fontSize: 28, fontWeight: 700, color: BLUE, letterSpacing: 1 },
          children: "BountyBay",
        },
      }],
    },
  };
}

function buildOgElement(
  imageSection: Record<string, unknown>,
  title: string,
  amount: string,
  bountyType: string,
  isOpen: boolean,
) {
  return {
    type: "div",
    props: {
      style: {
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        background: `linear-gradient(160deg, ${WHITE} 0%, #f0f6ff 100%)`,
        fontFamily: "Inter, sans-serif", position: "relative", overflow: "hidden",
      },
      children: [
        // Dot texture overlay
        {
          type: "div",
          props: {
            style: {
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: "radial-gradient(circle, #cbd5e1 0.8px, transparent 0.8px)",
              backgroundSize: "24px 24px", opacity: 0.18,
            },
          },
        },
        // Main content row
        {
          type: "div",
          props: {
            style: {
              flex: 1, display: "flex", flexDirection: "row",
              padding: "36px 52px 20px", gap: 52,
              alignItems: "center", position: "relative",
            },
            children: [
              imageSection,
              // Right side: text content
              {
                type: "div",
                props: {
                  style: {
                    flex: 1, display: "flex", flexDirection: "column",
                    justifyContent: "center", gap: 14,
                  },
                  children: [
                    // BountyBay logo
                    { type: "div", props: { style: { fontSize: 38, fontWeight: 700, color: BLUE, letterSpacing: -0.5, lineHeight: 1, textShadow: "0 2px 8px rgba(59,130,246,0.3)" }, children: "BountyBay" } },
                    // Amount
                    { type: "div", props: { style: { fontSize: 42, fontWeight: 700, color: GRAY_900, lineHeight: 1.15, letterSpacing: -0.5, marginTop: 4, textShadow: "0 2px 8px rgba(17,24,39,0.2)" }, children: `${amount} Bounty:` } },
                    // Title
                    { type: "div", props: { style: { fontSize: 28, fontWeight: 700, color: GRAY_900, lineHeight: 1.3 }, children: title } },
                    // Badges
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", alignItems: "center", gap: 10, marginTop: 4 },
                        children: [
                          { type: "div", props: { style: { fontSize: 13, fontWeight: 700, color: BLUE, border: `2px solid ${BLUE}`, padding: "3px 12px", borderRadius: 12, letterSpacing: 1, textTransform: "uppercase", boxShadow: "0 2px 8px rgba(59,130,246,0.25)" }, children: bountyType.toUpperCase() } },
                          ...(isOpen ? [{ type: "div", props: { style: { fontSize: 13, fontWeight: 700, color: GREEN, border: `2px solid ${GREEN}`, padding: "3px 12px", borderRadius: 12, letterSpacing: 1, textTransform: "uppercase", boxShadow: "0 2px 8px rgba(22,163,74,0.25)" }, children: "OPEN" } }] : []),
                        ],
                      },
                    },
                    // CTA
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", alignItems: "center", marginTop: 6 },
                        children: [{ type: "div", props: { style: { fontSize: 16, fontWeight: 700, color: WHITE, background: GREEN, padding: "10px 28px", borderRadius: 20, letterSpacing: 0.5, boxShadow: "0 4px 14px rgba(22,163,74,0.35)" }, children: "View Now" } }],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // Footer
        {
          type: "div",
          props: {
            style: { display: "flex", justifyContent: "flex-end", padding: "0 52px 14px", position: "relative" },
            children: [{ type: "div", props: { style: { fontSize: 15, fontWeight: 600, color: GRAY_500 }, children: "bountybay.co" } }],
          },
        },
      ],
    },
  };
}
