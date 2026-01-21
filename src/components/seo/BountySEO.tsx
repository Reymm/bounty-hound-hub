import { Helmet } from 'react-helmet';
import { Bounty } from '@/lib/types';

interface BountySEOProps {
  bounty: Bounty;
}

export function BountySEO({ bounty }: BountySEOProps) {
  const title = `${bounty.title} - $${bounty.bountyAmount} Bounty | BountyBay`;
  const description = bounty.description.slice(0, 155) + (bounty.description.length > 155 ? '...' : '');
  const url = `${window.location.origin}/b/${bounty.id}`;
  const image = bounty.images?.[0] || 'https://bountybay.lovable.app/og-default.png';

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
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="BountyBay" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": bounty.title,
          "description": description,
          "image": image,
          "offers": {
            "@type": "Offer",
            "price": bounty.bountyAmount,
            "priceCurrency": "CAD",
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
