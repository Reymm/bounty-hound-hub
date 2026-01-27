import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';

interface BountyData {
  id: string;
  title: string;
  amount: number | null;
  description: string | null;
  status: string;
  images: string[] | null;
}

export default function ShareBounty() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bounty, setBounty] = useState<BountyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBounty() {
      if (!id) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('Bounties')
        .select('id, title, amount, description, status, images')
        .eq('id', id)
        .single();

      if (error || !data) {
        // Redirect to homepage if bounty not found
        navigate('/');
        return;
      }

      setBounty(data);
      setLoading(false);

      // Redirect browsers to the main bounty page after a short delay
      // This gives crawlers time to read the meta tags
      setTimeout(() => {
        navigate(`/b/${id}`, { replace: true });
      }, 100);
    }

    fetchBounty();
  }, [id, navigate]);

  if (loading || !bounty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const statusBadge = bounty.status === 'open' ? '🟢 OPEN | ' : '';
  const title = `${statusBadge}Help find: ${bounty.title} - $${bounty.amount || 0} Reward | BountyBay`;
  const description = `$${bounty.amount || 0} bounty reward! ${(bounty.description || '').slice(0, 120)}${(bounty.description || '').length > 120 ? '...' : ''}`;
  const bountyUrl = `https://bountybay.co/b/${bounty.id}`;
  const ogImage = bounty.images?.[0] || 'https://bountybay.co/og-default.png';

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{title}</title>
        <meta name="title" content={title} />
        <meta name="description" content={description} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={bountyUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="BountyBay" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={bountyUrl} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />

        {/* Canonical */}
        <link rel="canonical" href={bountyUrl} />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to bounty...</p>
          <a href={bountyUrl} className="text-primary hover:underline">
            {bounty.title}
          </a>
        </div>
      </div>
    </>
  );
}
