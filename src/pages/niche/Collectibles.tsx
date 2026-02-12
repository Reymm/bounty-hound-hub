import { Gem, Search, ShieldCheck, Trophy } from 'lucide-react';
import { NicheLandingPage, NicheConfig } from './NicheLandingPage';
import { BountyCategory } from '@/lib/types';

const collectiblesConfig: NicheConfig = {
  slug: 'collectibles',
  category: BountyCategory.COLLECTIBLES,
  title: 'Find Rare Collectibles & Treasures',
  subtitle: 'The marketplace for impossible finds.',
  description: 'Searching for that rare trading card, limited edition figurine, coin, or antique piece? Post a bounty and let our community of collectors and hunters track it down for you.',
  heroGradient: 'bg-gradient-to-br from-amber-500/10 via-background to-orange-500/5',
  icon: <Gem className="h-10 w-10 text-amber-500" />,
  trustBadgeText: 'Verified hunters. Secure escrow. No scams.',
  ctaText: 'Post a Collectibles Bounty',
  emptyMessage: 'No collectible bounties yet',
  emptyDescription: 'Be the first to post a bounty for that rare item you\'ve been hunting.',
  features: [
    {
      icon: <Search className="h-6 w-6 text-primary" />,
      title: 'Expert Hunters',
      description: 'Our community includes seasoned collectors, estate sale pros, and people with deep knowledge of rare finds.'
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
      title: 'Protected Transactions',
      description: 'Your card is saved securely and only charged when you accept a claim. No upfront payment required.'
    },
    {
      icon: <Trophy className="h-6 w-6 text-primary" />,
      title: 'Name Your Price',
      description: 'Set a bounty that reflects the item\'s rarity and your urgency. Attract serious hunters.'
    }
  ]
};

export default function Collectibles() {
  return <NicheLandingPage config={collectiblesConfig} />;
}
