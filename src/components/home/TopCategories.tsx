import { Car, Users, Heart, Package, Sparkles, Wrench } from 'lucide-react';
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
    id: BountyCategory.VEHICLES,
    label: 'Vehicles',
    icon: <Car className="h-6 w-6" />,
    description: 'Lost cars, family heirlooms, classic vehicles',
    gradient: 'from-blue-500/10 to-blue-600/5'
  },
  {
    id: BountyCategory.PEOPLE_FAMILY,
    label: 'People & Family',
    icon: <Users className="h-6 w-6" />,
    description: 'Biological parents, family members, old friends',
    gradient: 'from-pink-500/10 to-pink-600/5'
  },
  {
    id: BountyCategory.PETS,
    label: 'Lost Pets',
    icon: <Heart className="h-6 w-6" />,
    description: 'Dogs, cats, and other beloved companions',
    gradient: 'from-rose-500/10 to-rose-600/5'
  },
  {
    id: BountyCategory.COLLECTIBLES,
    label: 'Collectibles',
    icon: <Sparkles className="h-6 w-6" />,
    description: 'Rare coins, vintage toys, sports memorabilia',
    gradient: 'from-amber-500/10 to-amber-600/5'
  },
  {
    id: BountyCategory.ELECTRONICS,
    label: 'Electronics',
    icon: <Package className="h-6 w-6" />,
    description: 'Computers, phones, gaming consoles',
    gradient: 'from-purple-500/10 to-purple-600/5'
  },
  {
    id: BountyCategory.AUTOMOTIVE,
    label: 'Auto Parts',
    icon: <Wrench className="h-6 w-6" />,
    description: 'Car parts, motorcycle parts, tools',
    gradient: 'from-green-500/10 to-green-600/5'
  }
];

export const TopCategories = ({ onCategorySelect }: TopCategoriesProps) => {
  return (
    <section className="py-12 lg:py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Top Categories
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
            onClick={() => onCategorySelect('')}
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
