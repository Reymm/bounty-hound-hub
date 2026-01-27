/**
 * Cloudflare Worker: Dynamic OG previews for /b/[uuid]
 * - Crawlers get server-rendered OG HTML from Supabase + JS redirect
 * - Browsers are proxied to the SPA origin (bountybay.lovable.app)
 * 
 * Configure Worker vars (Settings -> Variables):
 *   SUPABASE_URL = https://lenyuvobgktgdearflim.supabase.co
 *   SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlbnl1dm9iZ2t0Z2RlYXJmbGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTI0OTcsImV4cCI6MjA3MDA4ODQ5N30.9Ax2mNDPCQoq0K9KCIQKk-qLFQoClxBhGNWsMrXMCx0
 */

const CRAWLER_USER_AGENTS = [
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "discordbot",
  "telegrambot",
  "whatsapp",
  "pinterest",
  "skypeuripreview",
  "googlebot",
  "bingbot"
];

const ORIGIN_HOST = "bountybay.lovable.app";

// Fallback image if bounty has none
const FALLBACK_OG_IMAGE = "https://bountybay.co/og-default.png";

function isCrawlerRequest(userAgent) {
  const ua = (userAgent || "").toLowerCase();
  return CRAWLER_USER_AGENTS.some(c => ua.includes(c));
}

function withDebugHeaders(resp, debug) {
  const out = new Response(resp.body, resp);
  out.headers.set("x-bounty-worker", "hit");
  out.headers.set("x-bounty-isCrawler", String(debug.isCrawler));
  out.headers.set("x-bounty-path", debug.path);
  out.headers.set("x-bounty-bountyId", debug.bountyId || "");
  out.headers.set("x-bounty-branch", debug.branch);
  return out;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function absoluteUrl(requestUrl, path) {
  const u = new URL(requestUrl);
  u.pathname = path;
  u.search = "";
  u.hash = "";
  return u.toString();
}

async function fetchBountyFromSupabase(env, bountyId) {
  // Use env vars if set, otherwise use hardcoded defaults
  const base = env.SUPABASE_URL || "https://lenyuvobgktgdearflim.supabase.co";
  const key = env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlbnl1dm9iZ2t0Z2RlYXJmbGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTI0OTcsImV4cCI6MjA3MDA4ODQ5N30.9Ax2mNDPCQoq0K9KCIQKk-qLFQoClxBhGNWsMrXMCx0";

  // Supabase REST endpoint
  const url =
    `${base}/rest/v1/Bounties` +
    `?id=eq.${encodeURIComponent(bountyId)}` +
    `&select=id,title,amount,description,images,status` +
    `&limit=1`;

  const res = await fetch(url, {
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      accept: "application/json"
    }
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase error ${res.status}: ${txt}`);
  }

  const data = await res.json();
  return Array.isArray(data) && data.length ? data[0] : null;
}

function pickOgImage(bounty) {
  const imgs = bounty?.images;
  if (!imgs) return FALLBACK_OG_IMAGE;

  // images might be an array, a JSON string, or a single string URL
  if (Array.isArray(imgs)) return imgs[0] || FALLBACK_OG_IMAGE;

  if (typeof imgs === "string") {
    try {
      const parsed = JSON.parse(imgs);
      if (Array.isArray(parsed)) return parsed[0] || FALLBACK_OG_IMAGE;
    } catch (_) {
      return imgs || FALLBACK_OG_IMAGE;
    }
  }

  return FALLBACK_OG_IMAGE;
}

function ogHtml({ canonicalUrl, title, description, imageUrl }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const img = escapeHtml(imageUrl);
  const canon = escapeHtml(canonicalUrl);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${t}</title>

  <link rel="canonical" href="${canon}" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canon}" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:image" content="${img}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${img}" />

  <meta name="robots" content="noindex,nofollow" />
</head>
<body>
  <noscript>
    <p>${t}</p>
    <p><a href="${canon}">Open bounty</a></p>
  </noscript>

  <script>
    window.location.replace(${JSON.stringify(canonicalUrl)});
  </script>
</body>
</html>`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const ua = request.headers.get("user-agent") || "";

    // Match /b/<uuid> with optional trailing slash
    const m = url.pathname.match(/^\/b\/([a-f0-9-]+)\/?$/i);
    const bountyId = m?.[1] || null;

    // Manual override for testing: ?og=1
    const forceOg = url.searchParams.get("og") === "1";

    const isCrawler = forceOg || (bountyId && isCrawlerRequest(ua));

    // If not a bounty path OR not a crawler, proxy to the SPA origin
    if (!bountyId || !isCrawler) {
      const originUrl = new URL(request.url);
      originUrl.hostname = ORIGIN_HOST;

      const proxyReq = new Request(originUrl.toString(), request);
      const resp = await fetch(proxyReq);

      return withDebugHeaders(resp, {
        isCrawler,
        path: url.pathname,
        bountyId: bountyId || "",
        branch: "proxy"
      });
    }

    // Crawler path: fetch bounty + serve OG HTML
    try {
      const bounty = await fetchBountyFromSupabase(env, bountyId);

      const canonical = absoluteUrl(request.url, `/b/${bountyId}`);

      if (!bounty) {
        const html = ogHtml({
          canonicalUrl: canonical,
          title: "BountyBay: Bounty not found",
          description: "This bounty may have been removed or is unavailable.",
          imageUrl: FALLBACK_OG_IMAGE
        });

        const resp = new Response(html, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=UTF-8",
            "cache-control": "no-store"
          }
        });

        return withDebugHeaders(resp, {
          isCrawler,
          path: url.pathname,
          bountyId,
          branch: "og-notfound"
        });
      }

      const title = bounty.title || "BountyBay Bounty";
      const amount = bounty.amount != null ? ` ($${bounty.amount})` : "";
      const descRaw = bounty.description || "Help find this item. Even a lead helps.";
      const description = `${descRaw}`.slice(0, 280);
      const imageUrl = pickOgImage(bounty);

      const html = ogHtml({
        canonicalUrl: canonical,
        title: `${title}${amount}`,
        description,
        imageUrl
      });

      const resp = new Response(html, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "cache-control": "no-store"
        }
      });

      return withDebugHeaders(resp, {
        isCrawler,
        path: url.pathname,
        bountyId,
        branch: "og"
      });
    } catch (err) {
      const canonical = absoluteUrl(request.url, `/b/${bountyId}`);
      const html = ogHtml({
        canonicalUrl: canonical,
        title: "BountyBay: Preview unavailable",
        description: "We couldn't load this bounty preview right now.",
        imageUrl: FALLBACK_OG_IMAGE
      });

      const resp = new Response(html, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "cache-control": "no-store"
        }
      });

      return withDebugHeaders(resp, {
        isCrawler,
        path: url.pathname,
        bountyId,
        branch: "og-error"
      });
    }
  }
};
