import { useState, useEffect } from 'react';
import { Filter, X, DollarSign, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { BountyCategory, SearchFilters as SearchFiltersType, CATEGORY_STRUCTURE } from '@/lib/types';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  onClearFilters: () => void;
}

export function SearchFilters({ filters, onFiltersChange, onClearFilters }: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<SearchFiltersType>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof SearchFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value || undefined };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    setLocalFilters({});
    onClearFilters();
    setIsOpen(false);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          size="lg"
          className="relative focus-ring bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
          aria-label={`Filters${activeFiltersCount > 0 ? ` (${activeFiltersCount} active)` : ''}`}
        >
          <Filter className="h-5 w-5 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-6 w-6 p-0 flex items-center justify-center text-xs bg-white/20 text-white border-white/30"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filter Bounties</SheetTitle>
          <SheetDescription>
            Refine your search to find the perfect bounties.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Category Filter */}
          <div className="space-y-2">
            <Label htmlFor="category-filter">Category</Label>
            <Select 
              value={localFilters.category || ''} 
              onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
            >
              <SelectTrigger id="category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_STRUCTURE).map(([key, categoryData]) => (
                  <SelectItem key={key} value={key}>
                    {categoryData.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory Filter - Only show if category is selected */}
          {localFilters.category && (
            <div className="space-y-2">
              <Label htmlFor="subcategory-filter">Subcategory</Label>
              <Select 
                value={localFilters.subcategory || ''} 
                onValueChange={(value) => handleFilterChange('subcategory', value === 'all' ? undefined : value)}
              >
                <SelectTrigger id="subcategory-filter">
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {Object.entries(CATEGORY_STRUCTURE[localFilters.category]?.subcategories || {}).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Bounty Amount Range */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Bounty Amount
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="min-bounty" className="text-xs text-muted-foreground">
                  Min ($)
                </Label>
                <Input
                  id="min-bounty"
                  type="number"
                  placeholder="0"
                  min="0"
                  value={localFilters.minBounty || ''}
                  onChange={(e) => handleFilterChange('minBounty', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="max-bounty" className="text-xs text-muted-foreground">
                  Max ($)
                </Label>
                <Input
                  id="max-bounty"
                  type="number"
                  placeholder="10000"
                  min="0"
                  value={localFilters.maxBounty || ''}
                  onChange={(e) => handleFilterChange('maxBounty', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <Label htmlFor="location-filter" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location-filter"
              placeholder="City, State or Region"
              value={localFilters.location || ''}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>

          {/* Deadline Filter */}
          <div className="space-y-2">
            <Label htmlFor="deadline-filter" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Deadline
            </Label>
            <Select 
              value={localFilters.deadline || ''} 
              onValueChange={(value) => handleFilterChange('deadline', value === 'all' ? undefined : value)}
            >
              <SelectTrigger id="deadline-filter">
                <SelectValue placeholder="Any deadline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any deadline</SelectItem>
                <SelectItem value="soonest">Ending soonest</SelectItem>
                <SelectItem value="week">Within a week</SelectItem>
                <SelectItem value="month">Within a month</SelectItem>
              </SelectContent>
            </Select>
          </div>

              {/* Active Filters Summary */}
              {activeFiltersCount > 0 && (
                <div className="space-y-2 pt-4 border-t border-border">
                  <Label className="text-sm font-medium">Active Filters</Label>
                  <div className="flex flex-wrap gap-2">
                    {filters.category && (
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORY_STRUCTURE[filters.category]?.label || filters.category}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1 hover:bg-transparent"
                          onClick={() => {
                            handleFilterChange('category', undefined);
                            handleFilterChange('subcategory', undefined); // Clear subcategory when category is cleared
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {filters.subcategory && (
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORY_STRUCTURE[filters.category!]?.subcategories[filters.subcategory] || filters.subcategory}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1 hover:bg-transparent"
                          onClick={() => handleFilterChange('subcategory', undefined)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                {(filters.minBounty || filters.maxBounty) && (
                  <Badge variant="secondary" className="text-xs">
                    ${filters.minBounty || 0} - ${filters.maxBounty || '∞'}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => {
                        handleFilterChange('minBounty', undefined);
                        handleFilterChange('maxBounty', undefined);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filters.location && (
                  <Badge variant="secondary" className="text-xs">
                    {filters.location}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => handleFilterChange('location', undefined)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filters.deadline && (
                  <Badge variant="secondary" className="text-xs">
                    {filters.deadline}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => handleFilterChange('deadline', undefined)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-6">
            <Button onClick={applyFilters} className="flex-1">
              Apply Filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}