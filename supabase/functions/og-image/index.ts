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
        poster_id
      `)
      .eq("id", bountyId)
      .single();

    if (error || !bounty) {
      console.error("Bounty not found:", error);
      return new Response("Bounty not found", { status: 404, headers: corsHeaders });
    }

    // Fetch poster profile separately
    const { data: posterProfile } = await supabase
      .from("profiles")
      .select("username, full_name")
      .eq("id", bounty.poster_id)
      .single();

    const posterName = posterProfile?.username || posterProfile?.full_name || "Someone";

    if (error || !bounty) {
      console.error("Bounty not found:", error);
      return new Response("Bounty not found", { status: 404, headers: corsHeaders });
    }

    const truncatedTitle = bounty.title.length > 50 
      ? bounty.title.substring(0, 47) + "..." 
      : bounty.title;
    const amount = bounty.amount?.toLocaleString() || "0";

    // Generate SVG-based OG image with BLUE brand theme
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0f172a"/>
            <stop offset="100%" style="stop-color:#1e293b"/>
          </linearGradient>
          <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#3b82f6"/>
            <stop offset="100%" style="stop-color:#2563eb"/>
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Decorative elements -->
        <circle cx="1100" cy="100" r="200" fill="#3b82f6" opacity="0.1"/>
        <circle cx="100" cy="530" r="150" fill="#3b82f6" opacity="0.08"/>
        
        <!-- Top bar with branding -->
        <rect x="0" y="0" width="1200" height="6" fill="url(#accent)"/>
        
        <!-- Logo/Brand area -->
        <text x="60" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold" fill="#3b82f6">
          🔍 BOUNTYBAY
        </text>
        
        <!-- BOUNTY badge -->
        <rect x="60" y="120" width="180" height="44" rx="22" fill="#3b82f6"/>
        <text x="150" y="150" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">
          BOUNTY
        </text>
        
        <!-- Main title area -->
        <text x="60" y="230" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="#94a3b8">
          Help find:
        </text>
        <text x="60" y="290" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="bold" fill="white">
          ${escapeXml(truncatedTitle)}
        </text>
        
        <!-- Reward amount -->
        <text x="60" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#94a3b8">
          REWARD
        </text>
        <text x="60" y="450" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="bold" fill="#22c55e">
          $${amount}
        </text>
        
        <!-- Posted by -->
        <text x="60" y="530" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#64748b">
          Posted by @${escapeXml(posterName)}
        </text>
        
        <!-- Status badge -->
        ${bounty.status === 'open' ? `
          <rect x="60" y="560" width="100" height="32" rx="16" fill="#22c55e" opacity="0.2"/>
          <text x="110" y="582" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#22c55e" text-anchor="middle">
            OPEN
          </text>
        ` : `
          <rect x="60" y="560" width="120" height="32" rx="16" fill="#64748b" opacity="0.2"/>
          <text x="120" y="582" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#64748b" text-anchor="middle">
            ${bounty.status?.toUpperCase() || 'CLOSED'}
          </text>
        `}
        
        <!-- Right side decorative element -->
        <rect x="900" y="180" width="240" height="270" rx="16" fill="#1e3a5f" stroke="#3b82f6" stroke-width="2"/>
        <text x="1020" y="330" font-family="system-ui, -apple-system, sans-serif" font-size="80" text-anchor="middle" fill="#3b82f6" opacity="0.4">
          💰
        </text>
        
        <!-- CTA text -->
        <text x="1020" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">
          Claim this bounty
        </text>
        
        <!-- Bottom URL bar -->
        <rect x="0" y="600" width="1200" height="30" fill="#0f172a" opacity="0.8"/>
        <text x="1140" y="622" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#64748b" text-anchor="end">
          bountybay.co
        </text>
      </svg>
    `;

    // Convert SVG to PNG using resvg-js via external service
    // For now, return SVG directly with proper content type
    // Social platforms support SVG in many cases, but for maximum compatibility
    // we return it as an image
    
    return new Response(svg, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("OG image generation error:", error);
    return new Response("Error generating image", { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
