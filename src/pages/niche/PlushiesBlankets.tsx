import { Heart, Search, ShieldCheck, Baby } from 'lucide-react';
import { NicheLandingPage, NicheConfig } from './NicheLandingPage';
import { BountyCategory } from '@/lib/types';

const plushiesBlankets: NicheConfig = {
  slug: 'plushies-blankets',
  category: BountyCategory.TOYS_KIDS,
  title: 'Find That Favorite Plushie or Blanket',
  subtitle: 'Because some things can\'t be replaced — until now.',
  description: 'Whether it\'s a discontinued stuffed animal, a worn out baby blanket, or a comfort item your child can\'t sleep without — post a bounty and let our hunters track it down.',
  heroGradient: 'bg-gradient-to-br from-pink-400/10 via-background to-purple-400/5',
  icon: <Heart className="h-10 w-10 text-pink-500" />,
  trustBadgeText: 'ID-verified hunters. Secure escrow. You only pay when found.',
  ctaText: 'Post a Bounty for a Plushie or Blanket',
  emptyMessage: 'No plushie or blanket bounties yet',
  emptyDescription: 'Be the first to post — describe what you\'re looking for and set a reward.',
  features: [
    {
      icon: <Search className="h-6 w-6 text-primary" />,
      title: 'Hunters Who Get It',
      description: 'Our community includes parents, thrift store regulars, and collectors who know exactly where to look for discontinued comfort items.'
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
      title: 'No Risk, No Upfront Cost',
      description: 'Your card is saved securely and only charged when you accept a find. If nobody finds it, you pay nothing.'
    },
    {
      icon: <Baby className="h-6 w-6 text-primary" />,
      title: 'Every Detail Matters',
      description: 'Upload photos, describe the texture, the tag, the year — the more detail you share, the faster our hunters can find it.'
    }
  ]
};

export default function PlushiesBlankets() {
  return <NicheLandingPage config={plushiesBlankets} />;
}
