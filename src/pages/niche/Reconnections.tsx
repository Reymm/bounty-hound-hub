import { Heart, Users, ShieldCheck, Search } from 'lucide-react';
import { NicheLandingPage, NicheConfig } from './NicheLandingPage';
import { BountyCategory } from '@/lib/types';

const reconnectionsConfig: NicheConfig = {
  slug: 'reconnections',
  category: BountyCategory.RECONNECTIONS,
  title: 'Reunite with Lost Loved Ones',
  subtitle: 'Family reconnections made safe and possible.',
  description: 'Whether you\'re searching for biological parents, long-lost family members, childhood friends, or loved ones you\'ve lost contact with — our community of verified hunters can help you find them.',
  heroGradient: 'bg-gradient-to-br from-rose-500/10 via-background to-pink-500/5',
  icon: <Heart className="h-10 w-10 text-rose-500" />,
  trustBadgeText: 'Every hunter is ID-verified. Your search is handled with care and discretion.',
  ctaText: 'Post a Reconnection Bounty',
  emptyMessage: 'No reconnection bounties yet',
  emptyDescription: 'Be the first to post a bounty and let our community help you find who you\'re looking for.',
  features: [
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: 'Community-Powered Search',
      description: 'Tap into a network of skilled researchers, genealogists, and people who genuinely want to help reunite families.'
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
      title: 'Safe & Discreet',
      description: 'All hunters are ID-verified. Your personal information stays protected, and transactions are handled through secure escrow.'
    },
    {
      icon: <Search className="h-6 w-6 text-primary" />,
      title: 'Set Your Own Reward',
      description: 'You decide what the search is worth to you. Only pay when you\'re satisfied with the results.'
    }
  ]
};

export default function Reconnections() {
  return <NicheLandingPage config={reconnectionsConfig} />;
}
