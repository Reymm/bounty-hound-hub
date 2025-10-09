import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    id: 'cover',
    title: 'BountyBay',
    subtitle: 'The World\'s First Bounty-Based Marketplace',
    content: 'Where persistence finally pays off',
    gradient: true
  },
  {
    id: 'story',
    title: 'It Started With a Can of Axe',
    content: (
      <div className="space-y-6 text-lg leading-relaxed max-w-3xl mx-auto">
        <p className="text-2xl font-medium text-foreground">
          Back in 2008, I had a limited-edition can of Axe body spray called <span className="text-primary font-semibold">Relapse</span>.
        </p>
        <p className="text-muted-foreground">
          Years later, I tried to find it again — I checked eBay, Facebook Marketplace, Reddit forums, everything — but after a decade of searching I still couldn't find it.
        </p>
        <p className="text-foreground font-medium text-xl">
          I remember thinking I'd pay a thousand dollars if someone could track it down for me.
        </p>
        <p className="text-primary text-2xl font-semibold mt-8">
          That's when it clicked.
        </p>
      </div>
    )
  },
  {
    id: 'problem',
    title: 'The Problem',
    content: (
      <div className="space-y-6 max-w-4xl mx-auto">
        <p className="text-xl text-foreground leading-relaxed">
          People are <span className="font-semibold text-primary">already doing this every day</span> in scattered online spaces.
        </p>
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-muted/50 p-6 rounded-lg border border-border">
            <h3 className="font-semibold text-lg mb-3 text-foreground">Reddit Communities</h3>
            <p className="text-muted-foreground">r/helpmefind, r/findfashion — strangers searching for rare, lost, or sentimental items</p>
          </div>
          <div className="bg-muted/50 p-6 rounded-lg border border-border">
            <h3 className="font-semibold text-lg mb-3 text-foreground">Facebook Groups</h3>
            <p className="text-muted-foreground">Fragmented communities with no structure or reward system</p>
          </div>
        </div>
        <div className="mt-12 p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-xl font-semibold text-destructive">
            No structure. No escrow. No verification. No reliable reward system.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'solution',
    title: 'The Solution',
    content: (
      <div className="space-y-8 max-w-4xl mx-auto">
        <p className="text-2xl font-semibold text-primary">
          BountyBay organizes this behavior into a single secure platform.
        </p>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="text-center p-6 bg-card border border-border rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="font-semibold mb-2 text-foreground">Post a Bounty</h3>
            <p className="text-sm text-muted-foreground">Set your reward for what you're looking for</p>
          </div>
          <div className="text-center p-6 bg-card border border-border rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="font-semibold mb-2 text-foreground">Hunters Search</h3>
            <p className="text-sm text-muted-foreground">Community finds leads or delivers the item</p>
          </div>
          <div className="text-center p-6 bg-card border border-border rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="font-semibold mb-2 text-foreground">Secure Payment</h3>
            <p className="text-sm text-muted-foreground">Stripe escrow holds funds until verified</p>
          </div>
        </div>
        <div className="mt-8 p-6 bg-success/10 border border-success/20 rounded-lg">
          <p className="text-lg text-foreground">
            <span className="font-semibold text-success">Trust + Incentive + Community</span> = A marketplace built on human connection
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'market',
    title: 'Market Size',
    content: (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">$28B</div>
            <p className="text-muted-foreground">Collectibles Market (2024)</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">$64B</div>
            <p className="text-muted-foreground">Resale Market (2024)</p>
          </div>
        </div>
        <div className="space-y-4 mt-12">
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-2">Discontinued Goods</h4>
            <p className="text-sm text-muted-foreground">Products no longer in production but still in demand</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-2">Sentimental Items</h4>
            <p className="text-sm text-muted-foreground">Personal objects with emotional value</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-2">Rare & Limited Editions</h4>
            <p className="text-sm text-muted-foreground">Hard-to-find collectibles and exclusives</p>
          </div>
        </div>
        <div className="text-center mt-12">
          <p className="text-2xl font-bold text-foreground">Total Addressable Market:</p>
          <p className="text-5xl font-bold text-primary mt-2">$10B–$100B+</p>
        </div>
      </div>
    )
  },
  {
    id: 'product',
    title: 'Product Demo',
    content: (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-success/10 border border-success/20 rounded-lg p-6">
          <p className="text-xl font-semibold text-success mb-2">MVP Built & In Testing</p>
          <p className="text-muted-foreground">Full-stack platform built with modern, scalable technology</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Core Features</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Bounty posting with image uploads</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Stripe escrow integration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>KYC verification system</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>User ratings & reputation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Real-time messaging</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Technology Stack</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Supabase (auth, database, realtime)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Stripe (payments & escrow)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>React + TypeScript</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Built on Lovable platform</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'business',
    title: 'Business Model',
    content: (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xl text-muted-foreground mb-4">Revenue from</p>
          <p className="text-4xl font-bold text-primary">Platform Fees on Escrow Transactions</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">5-10%</div>
            <p className="text-sm text-muted-foreground">Platform fee per successful transaction</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">$50+</div>
            <p className="text-sm text-muted-foreground">Average bounty amount (estimated)</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">$2.50+</div>
            <p className="text-sm text-muted-foreground">Revenue per transaction</p>
          </div>
        </div>
        <div className="mt-12 space-y-4">
          <div className="p-6 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-2">Scalable & Capital Efficient</h4>
            <p className="text-sm text-muted-foreground">No inventory, no fulfillment — pure marketplace economics</p>
          </div>
          <div className="p-6 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-2">Network Effects</h4>
            <p className="text-sm text-muted-foreground">More posters attract more hunters, creating a self-reinforcing cycle</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'traction',
    title: 'Traction Plan',
    content: (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-primary">Phase 1: Community Seeding</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">1.</span>
                <span>Seed bounties in Reddit communities (r/helpmefind, r/findfashion)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">2.</span>
                <span>Engage Facebook groups for lost/rare items</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">3.</span>
                <span>Post real bounties to prove the concept</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-primary">Phase 2: Influencer Campaigns</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">1.</span>
                <span>Partner with nostalgia & collectible influencers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">2.</span>
                <span>Create viral "find my childhood" campaigns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">3.</span>
                <span>Showcase successful hunts as social proof</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 p-6 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-lg font-semibold text-foreground mb-2">Goal: First 1,000 Users</p>
          <p className="text-muted-foreground">Build critical mass through organic growth and word-of-mouth</p>
        </div>
      </div>
    )
  },
  {
    id: 'competition',
    title: 'Competitive Landscape',
    content: (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="font-semibold text-lg mb-3 text-foreground">Reddit</h3>
            <p className="text-sm text-muted-foreground mb-4">Fragmented communities, no payment system, no verification</p>
            <div className="text-xs text-destructive font-medium">Not a marketplace</div>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="font-semibold text-lg mb-3 text-foreground">eBay</h3>
            <p className="text-sm text-muted-foreground mb-4">Buy what exists, can't request what you want</p>
            <div className="text-xs text-destructive font-medium">No bounty system</div>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="font-semibold text-lg mb-3 text-foreground">Facebook Groups</h3>
            <p className="text-sm text-muted-foreground mb-4">No structure, no escrow, no trust layer</p>
            <div className="text-xs text-destructive font-medium">Not purpose-built</div>
          </div>
        </div>
        <div className="mt-12 p-8 bg-success/10 border-2 border-success/30 rounded-lg text-center">
          <p className="text-2xl font-bold text-success mb-4">BountyBay is the first unified solution</p>
          <p className="text-lg text-muted-foreground">
            Escrow + Verification + Community + Structure
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'team',
    title: 'Team',
    content: (
      <div className="space-y-8 max-w-3xl mx-auto text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-primary">👤</span>
        </div>
        <h3 className="text-3xl font-bold text-foreground">Solo Founder</h3>
        <div className="space-y-6 text-left max-w-2xl mx-auto">
          <div className="p-6 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-2">Background</h4>
            <p className="text-muted-foreground">Industrial electrician by trade</p>
          </div>
          <div className="p-6 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-2">Journey</h4>
            <p className="text-muted-foreground">Built MVP nights and weekends while working full-time</p>
          </div>
          <div className="p-6 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-2">Why This Matters</h4>
            <p className="text-muted-foreground">This isn't just a business idea — it's personal. Born from real frustration, built with real determination.</p>
          </div>
        </div>
        <div className="mt-12 p-6 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-lg font-semibold text-primary">
            "I'm solving a problem I've lived. This is my mission."
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'vision',
    title: 'The Vision',
    content: (
      <div className="space-y-8 max-w-4xl mx-auto text-center">
        <p className="text-3xl font-bold text-foreground leading-relaxed">
          Build the world's first bounty-based marketplace where <span className="text-primary">persistence finally pays off</span>
        </p>
        <div className="grid md:grid-cols-2 gap-6 mt-12 text-left">
          <div className="p-6 bg-card border border-border rounded-lg">
            <h4 className="font-semibold text-lg text-foreground mb-3">For Posters</h4>
            <p className="text-muted-foreground">Finally find what matters most — with trust and security built in</p>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg">
            <h4 className="font-semibold text-lg text-foreground mb-3">For Hunters</h4>
            <p className="text-muted-foreground">Turn your persistence and knowledge into real income</p>
          </div>
        </div>
        <div className="mt-16 p-8 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
          <p className="text-2xl font-bold text-primary mb-4">
            This is more than a marketplace.
          </p>
          <p className="text-xl text-foreground">
            It's a platform for human connection, persistence, and the things that truly matter.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'closing',
    title: 'Let\'s Talk',
    content: (
      <div className="space-y-12 max-w-3xl mx-auto text-center">
        <div>
          <h2 className="text-5xl font-bold text-foreground mb-6">BountyBay</h2>
          <p className="text-2xl text-primary font-semibold">Where persistence finally pays off</p>
        </div>
        <div className="space-y-4 text-muted-foreground">
          <p className="text-lg">Ready to help us build the future of finding</p>
          <p className="text-xl font-semibold text-foreground">contact@bountybay.com</p>
        </div>
      </div>
    ),
    gradient: true
  }
];

export default function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Slide Content */}
      <div 
        className={`h-full flex flex-col items-center justify-center p-8 md:p-16 transition-all duration-500 ${
          slide.gradient ? 'bg-gradient-to-br from-primary/5 via-background to-primary/10' : ''
        }`}
      >
        {/* Title */}
        <div className="w-full max-w-6xl mx-auto mb-12 text-center">
          <h1 className={`font-bold tracking-tight ${
            slide.id === 'cover' ? 'text-6xl md:text-8xl text-primary' : 'text-4xl md:text-5xl text-foreground'
          }`}>
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="text-2xl md:text-3xl text-muted-foreground mt-4 font-medium">
              {slide.subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="w-full max-w-6xl mx-auto flex-1 flex items-center justify-center overflow-auto">
          {typeof slide.content === 'string' ? (
            <p className="text-2xl md:text-3xl text-primary font-semibold text-center">
              {slide.content}
            </p>
          ) : (
            slide.content
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-6xl mx-auto mt-12">
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-primary flex-1' 
                    : 'bg-border w-12 hover:bg-muted-foreground'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>{currentSlide + 1} / {slides.length}</span>
            <span className="text-xs">Use arrow keys or space to navigate</span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-8 right-8 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="w-12 h-12"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="w-12 h-12"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Slide Counter - Mobile */}
      <div className="fixed top-8 right-8 md:hidden">
        <div className="bg-card border border-border rounded-full px-4 py-2 text-sm font-medium">
          {currentSlide + 1} / {slides.length}
        </div>
      </div>
    </div>
  );
}
