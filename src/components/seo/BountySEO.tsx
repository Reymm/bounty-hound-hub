import { Helmet } from 'react-helmet';
import { Bounty } from '@/lib/types';

interface BountySEOProps {
  bounty: Bounty;
}

export function BountySEO({ bounty }: BountySEOProps) {
  // Match edge function format for consistency
  const title = `Help me find: $${bounty.bountyAmount} Bounty — ${bounty.title} | BountyBay`;
  const description = `$${bounty.bountyAmount} reward to find this item! ${bounty.description.slice(0, 120)}${bounty.description.length > 120 ? '...' : ''}`;
  const url = `https://bountybay.co/b/${bounty.id}`;
  
  // Use the bounty's actual first image — reliable and fast
  const ogImage = bounty.images?.[0] || 'https://bountybay.co/og-default.png';

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="BountyBay" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": `Help me find: ${bounty.title}`,
          "description": description,
          "image": bounty.images?.[0] || 'https://bountybay.co/og-default.png',
          "offers": {
            "@type": "Offer",
            "price": bounty.bountyAmount,
            "priceCurrency": "USD",
            "availability": bounty.status === 'open' 
              ? "https://schema.org/InStock" 
              : "https://schema.org/SoldOut"
          },
          "brand": {
            "@type": "Organization",
            "name": "BountyBay"
          }
        })}
      </script>
    </Helmet>
  );
}
