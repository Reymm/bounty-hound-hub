import { FileSearch, Search, ShieldCheck, Video } from 'lucide-react';
import { NicheLandingPage, NicheConfig } from './NicheLandingPage';
import { BountyCategory } from '@/lib/types';

const lostMediaConfig: NicheConfig = {
  slug: 'lost-media',
  category: BountyCategory.LOST_MEDIA,
  title: 'Find Lost Reddit Threads, YouTube Videos & More',
  subtitle: 'Track down deleted posts, lost videos, and forgotten internet content.',
  description: 'BountyBay helps you find deleted Reddit threads, lost YouTube videos, and forgotten internet content. Post a bounty with a reward, and let our hunters dig it up for you.',
  heroGradient: 'bg-gradient-to-br from-violet-500/10 via-background to-indigo-500/5',
  icon: <FileSearch className="h-10 w-10 text-violet-500" />,
  trustBadgeText: 'Community-powered internet archaeology.',
  ctaText: 'Post a Lost Media Bounty',
  emptyMessage: 'No lost media bounties yet',
  emptyDescription: 'Be the first to post a bounty for that deleted post or missing video you\'ve been looking for.',
  features: [
    {
      icon: <Search className="h-6 w-6 text-primary" />,
      title: 'Internet Detectives',
      description: 'Our hunters are skilled at using Wayback Machine, cached pages, archive tools, and deep search techniques to find what\'s been lost.'
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
      title: 'Verify Before You Pay',
      description: 'Review proof that the content was found before your card is charged. Links, screenshots, or archived copies.'
    },
    {
      icon: <Video className="h-6 w-6 text-primary" />,
      title: 'Any Platform, Any Era',
      description: 'Reddit threads, YouTube videos, deleted tweets, old forum posts, Tumblr blogs, news articles — if it was online, we can try to find it.'
    }
  ]
};

export default function LostMedia() {
  return <NicheLandingPage config={lostMediaConfig} />;
}