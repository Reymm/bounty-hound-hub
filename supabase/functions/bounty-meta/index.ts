import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOT_PATTERN = /bot|facebookexternalhit|facebot|twitterbot|pinterest|googlebot|whatsapp|slackbot|discordbot|telegrambot|linkedinbot|skypeuripreview|redditbot/i;

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
        headers: { ...corsHeaders, "Location": "https://bountybay.co" },
      });
    }

    const userAgent = req.headers.get("user-agent") || "";
    const isBot = BOT_PATTERN.test(userAgent);
    const bountyUrl = `https://bountybay.co/b/${bountyId}`;

    // Humans get instant 302 redirect — no flash of HTML, no "garbage" page
    if (!isBot) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, "Location": bountyUrl },
      });
    }

    // Bots get HTML with OG tags
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: bounty, error } = await supabase
      .from("Bounties")
      .select("id, title, amount, description, status, images, requires_shipping")
      .eq("id", bountyId)
      .single();

    if (error || !bounty) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, "Location": bountyUrl },
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
    const ogImage = `${supabaseUrl}/functions/v1/og-image?id=${bounty.id}`;
    // Point og:url to THIS endpoint so bots stay here and read tags
    // (pointing to bountybay.co SPA causes bots to re-crawl and lose our tags)
    const metaUrl = `https://auth.bountybay.co/functions/v1/bounty-meta?id=${bounty.id}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${metaUrl}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="BountyBay">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${metaUrl}">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${ogImage}">
  <link rel="canonical" href="${bountyUrl}">
</head>
<body></body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (error) {
    console.error("Bounty meta error:", error);
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, "Location": "https://bountybay.co" },
    });
  }
});

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
