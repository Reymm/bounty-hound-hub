import { Car, Search, ShieldCheck, Wrench } from 'lucide-react';
import { NicheLandingPage, NicheConfig } from './NicheLandingPage';
import { BountyCategory } from '@/lib/types';

const vintageCarsConfig: NicheConfig = {
  slug: 'vintage-cars',
  category: BountyCategory.VEHICLES,
  title: 'Find the Car You Let Go',
  subtitle: 'Track down the car you sold, traded, or lost years ago.',
  description: 'Remember that car you never should have sold? A classic you traded away or a ride that got lost over the years? Post a bounty and let our network of car enthusiasts, mechanics, and collectors help you track it down.',
  heroGradient: 'bg-gradient-to-br from-blue-500/10 via-background to-slate-500/5',
  icon: <Car className="h-10 w-10 text-blue-500" />,
  trustBadgeText: 'Verified hunters. Safe transactions. Real results.',
  ctaText: 'Post a Vehicle Bounty',
  emptyMessage: 'No vehicle bounties yet',
  emptyDescription: 'Post the first bounty and let our community help you find that car again.',
  features: [
    {
      icon: <Search className="h-6 w-6 text-primary" />,
      title: 'Nationwide Network',
      description: 'Hunters across the country keeping an eye out at auctions, estate sales, barns, and private collections.'
    },
    {
      icon: <Wrench className="h-6 w-6 text-primary" />,
      title: 'Enthusiast Community',
      description: 'People who know cars — mechanics, collectors, and hobbyists who understand what makes a find special.'
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
      title: 'Secure Payment',
      description: 'Your card is saved securely and only charged when you accept a claim that meets your requirements.'
    }
  ]
};

export default function VintageCars() {
  return <NicheLandingPage config={vintageCarsConfig} />;
}
