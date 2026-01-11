import { Car, Users, Package, Sparkles, Shirt, Gamepad2 } from 'lucide-react';
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
    description: 'Trading cards, sports cards, vintage toys',
    gradient: 'from-amber-500/10 to-amber-600/5'
  },
  {
    id: BountyCategory.VEHICLES,
    label: 'Vehicles',
    icon: <Car className="h-6 w-6" />,
    description: 'Classic cars, rare parts, vintage motorcycles',
    gradient: 'from-blue-500/10 to-blue-600/5'
  },
  {
    id: BountyCategory.FASHION_APPAREL,
    label: 'Fashion & Clothing',
    icon: <Shirt className="h-6 w-6" />,
    description: 'Vintage fashion, rare sneakers, designer items',
    gradient: 'from-pink-500/10 to-pink-600/5'
  },
  {
    id: BountyCategory.ELECTRONICS,
    label: 'Electronics',
    icon: <Package className="h-6 w-6" />,
    description: 'Retro gaming, vintage tech, rare devices',
    gradient: 'from-purple-500/10 to-purple-600/5'
  },
  {
    id: BountyCategory.SPORTS_OUTDOORS,
    label: 'Sports & Outdoors',
    icon: <Gamepad2 className="h-6 w-6" />,
    description: 'Vintage gear, rare equipment, memorabilia',
    gradient: 'from-green-500/10 to-green-600/5'
  },
  {
    id: BountyCategory.PEOPLE_FAMILY,
    label: 'People & Family',
    icon: <Users className="h-6 w-6" />,
    description: 'Biological parents, family members, old friends',
    gradient: 'from-teal-500/10 to-teal-600/5'
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
