import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, MessageCircle, User, Menu, X, LogOut, FolderOpen, Bug } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from './NotificationBell';

interface TopNavProps {
  onSearch?: (query: string) => void;
}

export function TopNav({ onSearch }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Debounced auto-search
  useEffect(() => {
    if (!searchQuery.trim()) return;
    
    const timer = setTimeout(() => {
      onSearch?.(searchQuery.trim());
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  // Fetch real unread message count with real-time updates
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false);

        if (!error) {
          setUnreadMessages(count || 0);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Set up real-time subscription
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
              <button
                type="submit"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
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
            {user ? (
              <>
                <Button 
                  asChild 
                  className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium focus-ring"
                >
                  <Link to="/post" aria-label="Post a bounty">
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

                <NotificationBell />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 focus-ring">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={user.email} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(user.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm">{user.email}</p>
                        <p className="w-[200px] truncate text-xs text-muted-foreground">
                          Welcome to BountyBay
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/me/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/me/bounties">
                        <FolderOpen className="mr-2 h-4 w-4" />
                        My Bounties
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/support">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Support
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/support">
                        <Bug className="mr-2 h-4 w-4" />
                        Report Bug
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/legal/terms">Terms of Service</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/legal/privacy">Privacy Policy</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/auth?tab=signin')}
                  className="focus-ring"
                >
                  Sign In
                </Button>
                <Button 
                  asChild 
                  className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium focus-ring"
                >
                  <Link to="/auth?tab=signup" aria-label="Sign up for free">
                    Sign Up Free
                  </Link>
                </Button>
              </>
            )}
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
            <button
              type="submit"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
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
            {user ? (
              <>
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
                      <User className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full justify-start">
                    <Link to="/me/bounties" onClick={() => setIsMobileMenuOpen(false)}>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      My Bounties
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full justify-start">
                    <Link to="/support" onClick={() => setIsMobileMenuOpen(false)}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Support
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full justify-start">
                    <Link to="/support" onClick={() => setIsMobileMenuOpen(false)}>
                      <Bug className="h-4 w-4 mr-2" />
                      Report Bug
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
                  onClick={handleSignOut}
                  variant="ghost" 
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => { navigate('/auth?tab=signin'); setIsMobileMenuOpen(false); }}
                  variant="ghost" 
                  className="w-full justify-start"
                >
                  Sign In
                </Button>
                <Button 
                  asChild 
                  className="w-full justify-start bg-primary hover:bg-primary-hover text-primary-foreground"
                >
                  <Link to="/auth?tab=signup" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign Up Free
                  </Link>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}