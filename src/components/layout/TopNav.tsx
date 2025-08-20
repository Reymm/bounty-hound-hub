import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, MessageCircle, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface TopNavProps {
  onSearch?: (query: string) => void;
}

export function TopNav({ onSearch }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const unreadMessages = 2; // TODO: Get from actual message state

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm safe-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-2xl font-bold text-primary hover:text-primary-hover transition-colors"
            aria-label="BountyBay Home"
          >
            BountyBay
          </Link>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="search"
                placeholder="Search bounties, categories, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 w-full focus-ring"
                aria-label="Search bounties"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              asChild 
              className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium focus-ring"
            >
              <Link to="/post" aria-label="Post a new bounty">
                <Plus className="h-4 w-4 mr-2" />
                Post Bounty
              </Link>
            </Button>

            <Button asChild variant="ghost" size="sm" className="relative focus-ring">
              <Link to="/messages" aria-label={`Messages${unreadMessages > 0 ? ` (${unreadMessages} unread)` : ''}`}>
                <MessageCircle className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    aria-label={`${unreadMessages} unread messages`}
                  >
                    {unreadMessages}
                  </Badge>
                )}
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="focus-ring" aria-label="Profile menu">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/me/profile">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/me/bounties">My Bounties</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/legal/terms">Terms of Service</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/legal/privacy">Privacy Policy</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden focus-ring"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Search Bar */}
        <form onSubmit={handleSearch} className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="search"
              placeholder="Search bounties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 w-full focus-ring"
              aria-label="Search bounties"
            />
          </div>
        </form>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-4">
            <Button asChild className="w-full justify-start bg-primary hover:bg-primary-hover text-primary-foreground">
              <Link to="/post" onClick={() => setIsMobileMenuOpen(false)}>
                <Plus className="h-4 w-4 mr-2" />
                Post Bounty
              </Link>
            </Button>

            <Button asChild variant="ghost" className="w-full justify-start relative">
              <Link to="/messages" onClick={() => setIsMobileMenuOpen(false)}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Messages
                {unreadMessages > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {unreadMessages}
                  </Badge>
                )}
              </Link>
            </Button>

            <div className="space-y-2 pt-2 border-t border-border">
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link to="/me/profile" onClick={() => setIsMobileMenuOpen(false)}>
                  Profile Settings
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link to="/me/bounties" onClick={() => setIsMobileMenuOpen(false)}>
                  My Bounties
                </Link>
              </Button>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <Button asChild variant="ghost" className="w-full justify-start text-sm">
                <Link to="/legal/terms" onClick={() => setIsMobileMenuOpen(false)}>
                  Terms of Service
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start text-sm">
                <Link to="/legal/privacy" onClick={() => setIsMobileMenuOpen(false)}>
                  Privacy Policy
                </Link>
              </Button>
            </div>

            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}