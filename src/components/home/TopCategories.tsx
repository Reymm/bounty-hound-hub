import { Car, Heart, Sparkles, Shirt, Disc3, Trophy, Gamepad2, BookOpen, Palette, Shield, Baby } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BountyCategory } from '@/lib/types';

interface TopCategoriesProps {
  onCategorySelect: (category: string) => void;
}

interface CategoryCard {
  id: BountyCategory;
  label: string;
  icon: React.ReactNode;
  description: string;
  gradient: string;
}

const topCategories: CategoryCard[] = [
  {
    id: BountyCategory.COLLECTIBLES,
    label: 'Collectibles',
    icon: <Sparkles className="h-6 w-6" />,
    description: 'Pokémon cards, sports cards, vintage toys, coins',
    gradient: 'from-amber-500/10 to-amber-600/5'
  },
  {
    id: BountyCategory.VEHICLES,
    label: 'Vehicles & Parts',
    icon: <Car className="h-6 w-6" />,
    description: 'Classic cars, rare parts, vintage motorcycles',
    gradient: 'from-blue-500/10 to-blue-600/5'
  },
  {
    id: BountyCategory.FASHION_APPAREL,
    label: 'Fashion & Sneakers',
    icon: <Shirt className="h-6 w-6" />,
    description: 'Rare sneakers, vintage clothing, designer items',
    gradient: 'from-pink-500/10 to-pink-600/5'
  },
  {
    id: BountyCategory.ELECTRONICS,
    label: 'Electronics & Gaming',
    icon: <Gamepad2 className="h-6 w-6" />,
    description: 'Retro consoles, rare games, vintage tech',
    gradient: 'from-purple-500/10 to-purple-600/5'
  },
  {
    id: BountyCategory.MUSIC_VINYL,
    label: 'Music & Vinyl',
    icon: <Disc3 className="h-6 w-6" />,
    description: 'Rare vinyl, signed albums, concert memorabilia',
    gradient: 'from-rose-500/10 to-rose-600/5'
  },
  {
    id: BountyCategory.SPORTS_OUTDOORS,
    label: 'Sports & Memorabilia',
    icon: <Trophy className="h-6 w-6" />,
    description: 'Signed jerseys, vintage gear, rare equipment',
    gradient: 'from-green-500/10 to-green-600/5'
  },
  {
    id: BountyCategory.RECONNECTIONS,
    label: 'Reconnections',
    icon: <Heart className="h-6 w-6" />,
    description: 'Lost family, old friends, missing pets',
    gradient: 'from-teal-500/10 to-teal-600/5'
  },
  {
    id: BountyCategory.BOOKS_MEDIA,
    label: 'Books & Rare Media',
    icon: <BookOpen className="h-6 w-6" />,
    description: 'First editions, out-of-print books, rare films',
    gradient: 'from-orange-500/10 to-orange-600/5'
  },
  {
    id: BountyCategory.CRAFTS_HOBBIES,
    label: 'Art & Crafts',
    icon: <Palette className="h-6 w-6" />,
    description: 'Original art, handmade items, craft supplies',
    gradient: 'from-indigo-500/10 to-indigo-600/5'
  },
  {
    id: BountyCategory.RECOVERY_REWARDS,
    label: 'Recovery Rewards',
    icon: <Shield className="h-6 w-6" />,
    description: 'Stolen vehicles, lost items, recovery tips',
    gradient: 'from-red-500/10 to-red-600/5'
  },
  {
    id: BountyCategory.TOYS_KIDS,
    label: 'Toys & Kids',
    icon: <Baby className="h-6 w-6" />,
    description: 'Discontinued toys, stuffed animals, baby gear',
    gradient: 'from-cyan-500/10 to-cyan-600/5'
  }
];

export const TopCategories = ({ onCategorySelect }: TopCategoriesProps) => {
  return (
    <section className="py-12 lg:py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Top Categories
          </h2>
          <p className="text-lg text-primary max-w-2xl">
            Browse popular bounty categories and start hunting
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topCategories.map((category) => (
            <Card
              key={category.id}
              className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 hover:border-primary/50"
              onClick={() => onCategorySelect(category.id)}
            >
              <CardContent className={`p-6 bg-gradient-to-br ${category.gradient}`}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-background rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <div className="text-primary">
                      {category.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {category.label}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              // Clear any category filter and scroll to bounties section
              onCategorySelect('');
              const browseSection = document.getElementById('browse');
              if (browseSection) {
                browseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="text-primary hover:text-primary-hover font-medium transition-colors inline-flex items-center gap-2 group"
          >
            View all categories
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>
    </section>
  );
};
