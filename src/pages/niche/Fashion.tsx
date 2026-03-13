import { Shirt, Search, ShieldCheck, Trophy } from 'lucide-react';
import { NicheLandingPage, NicheConfig } from './NicheLandingPage';
import { BountyCategory } from '@/lib/types';

const fashionConfig: NicheConfig = {
  slug: 'fashion',
  category: BountyCategory.FASHION,
  title: 'Track Down Fashion Pieces You Miss',
  subtitle: 'Find discontinued clothing, vintage designer items, and fashion pieces you regret letting go.',
  description: 'BountyBay helps you find discontinued clothing, vintage designer items, and fashion pieces you can not find anywhere else. Post a bounty with a reward, and let our hunters find it for you.',
  heroGradient: 'bg-gradient-to-br from-pink-500/10 via-background to-purple-500/5',
  icon: <Shirt className="h-10 w-10 text-pink-500" />,
  trustBadgeText: 'Verified hunters. Secure escrow. Authentic items.',
  ctaText: 'Post a Fashion Bounty',
  emptyMessage: 'No fashion bounties yet',
  emptyDescription: 'Be the first to post a bounty for that fashion piece you\'ve been searching for.',
  features: [
    {
      icon: <Search className="h-6 w-6 text-primary" />,
      title: 'Fashion-Savvy Hunters',
      description: 'Our community includes vintage shoppers, consignment experts, and fashion enthusiasts who know where to look.'
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
      title: 'Protected Transactions',
      description: 'Your card is saved securely and only charged when you accept a claim. No upfront payment required.'
    },
    {
      icon: <Trophy className="h-6 w-6 text-primary" />,
      title: 'Set Your Budget',
      description: 'Name your price based on the item\'s rarity and your desire. Attract hunters who specialize in fashion finds.'
    }
  ]
};

export default function Fashion() {
  return <NicheLandingPage config={fashionConfig} />;
}