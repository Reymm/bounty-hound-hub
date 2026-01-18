import { Search, Users, ShieldCheck, DollarSign } from 'lucide-react';
import { NicheLandingPage, NicheConfig } from './NicheLandingPage';
import { BountyCategory } from '@/lib/types';

const helpMeFindConfig: NicheConfig = {
  slug: 'helpmefind',
  category: BountyCategory.MISCELLANEOUS,
  title: 'Find What You\'re Looking For',
  subtitle: 'Crowdsourced searching, but with real rewards.',
  description: 'You know how it goes — you post asking for help finding something, someone finds it, and then... nothing. No safe way to pay them. BountyBay fixes that with secure escrow and verified hunters.',
  heroGradient: 'bg-gradient-to-br from-orange-500/10 via-background to-red-500/5',
  icon: <Search className="h-10 w-10 text-orange-500" />,
  trustBadgeText: 'ID-verified hunters. Escrow protection. No more getting scammed.',
  ctaText: 'Post a Bounty',
  emptyMessage: 'No bounties yet',
  emptyDescription: 'Be the first to post a bounty and experience safe, rewarded searching.',
  features: [
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: 'Same Community, Better System',
      description: 'People already want to help you find things. Now they have a real incentive and you have protection.'
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
      title: 'No More Scams',
      description: 'Every hunter is ID-verified. Funds are held in escrow until you confirm success. Safe transactions, always.'
    },
    {
      icon: <DollarSign className="h-6 w-6 text-primary" />,
      title: 'Fair Rewards',
      description: 'Set a bounty that makes sense. Only pay when someone actually helps you find what you need.'
    }
  ]
};

export default function HelpMeFind() {
  return <NicheLandingPage config={helpMeFindConfig} />;
}
