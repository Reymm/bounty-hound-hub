import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      .select("id, title, amount, description, status, images, requires_shipping")
      .eq("id", bountyId)
      .single();

    if (error || !bounty) {
      console.error("Bounty not found:", error);
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, "Location": "https://bountybay.co" },
      });
    }

    const truncatedTitle = bounty.title.length > 50 
      ? bounty.title.slice(0, 47) + '...' 
      : bounty.title;
    const title = `$${(bounty.amount || 0).toLocaleString()} Bounty: ${truncatedTitle} | BountyBay`;
    
    const bountyType = bounty.requires_shipping ? 'Find & Ship' : 'Lead Only';
    const rawDesc = bounty.description || '';
    const shortDesc = rawDesc.slice(0, 80);
    const description = `${bountyType} bounty. ${shortDesc}${rawDesc.length > 80 ? '...' : ''}`;
    const bountyUrl = `https://bountybay.co/b/${bounty.id}`;
    const crawlableUrl = `https://auth.bountybay.co/functions/v1/bounty-meta?id=${bounty.id}`;
    const ogImage = buildOgImageUrl(bounty);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="title" content="${escapeHtml(title)}">
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${crawlableUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="BountyBay">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${crawlableUrl}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ogImage}">
  <link rel="canonical" href="${bountyUrl}">
  <script>window.location.replace("${bountyUrl}");</script>
</head>
<body>
  <p>Redirecting to <a href="${bountyUrl}">${escapeHtml(bounty.title)}</a>...</p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (error) {
    console.error("Bounty meta generation error:", error);
    return new Response("Error generating meta", { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildOgImageUrl(bounty: { title: string; amount: number | null; images?: string[] | null }): string {
  const templateId = "aee1c4ac-33e0-4b6b-a30a-cad7f03d8ff2";
  const siteText = encodeURIComponent("BountyBay.co");
  const siteFontFamily = encodeURIComponent("Roboto");
  const siteColor = encodeURIComponent("rgba(255,255,255,1)");
  const siteBackgroundColor = encodeURIComponent("rgba(59,130,246,1)");
  const rawTitle = `Help Me Find: ${bounty.title}`;
  const titleText = encodeURIComponent(rawTitle.length > 60 ? rawTitle.slice(0, 57) + '...' : rawTitle);
  const titleFontFamily = encodeURIComponent("Roboto");
  const titleColor = encodeURIComponent("rgba(0,0,0,1)");
  const rawImageUrl = bounty.images?.[0] || 'https://bountybay.co/og-default.png';
  const imageUrl = encodeURIComponent(rawImageUrl);
  const imageObjectFit = encodeURIComponent("cover");
  const ctaText = encodeURIComponent(`View Bounty · $${(bounty.amount || 0).toLocaleString()}`);
  const ctaFontFamily = encodeURIComponent("Roboto");
  const ctaColor = encodeURIComponent("rgba(255,255,255,1)");
  const ctaBackgroundColor = encodeURIComponent("rgba(34,197,94,1)");
  
  return `https://ogcdn.net/${templateId}/v1/${siteText}/${siteFontFamily}/${siteColor}/${siteBackgroundColor}/${titleText}/${titleFontFamily}/${titleColor}/${imageUrl}/${imageObjectFit}/${ctaText}/${ctaFontFamily}/${ctaColor}/${ctaBackgroundColor}/og.png`;
}
