import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MessageCircle, User, Menu, X, LogOut, FolderOpen, Bug, ChevronDown, Sparkles, Car, ShieldCheck, HelpCircle, FileSearch, Heart, Shirt, Trash2 } from 'lucide-react';
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

const nichePages = [
  { title: 'Plushies & Blankets', description: 'Discontinued stuffed animals, baby blankets, comfort items', href: '/plushies-blankets', icon: Heart },
  { title: 'Lost Media', description: 'Deleted Reddit threads, YouTube videos & more', href: '/lost-media', icon: FileSearch },
  { title: 'Fashion & Accessories', description: 'Vintage clothing, designer pieces, sneakers', href: '/fashion', icon: Shirt },
  { title: 'Collectibles', description: 'Trading cards, coins, vinyl, memorabilia', href: '/collectibles', icon: Sparkles },
  { title: 'Vehicles & Parts', description: 'Classic cars, motorcycles, rare parts', href: '/vintage-cars', icon: Car },
];

interface TopNavProps {
  onSearch?: (query: string) => void;
}

export function TopNav({ onSearch }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  // Profile data for avatar display
  const [profileData, setProfileData] = useState<{ username: string | null; avatar_url: string | null }>({ username: null, avatar_url: null });

  // Verification status for mobile menu
  const [verificationStatus, setVerificationStatus] = useState<{
    identity: boolean;
    payout: boolean;
    loading: boolean;
  }>({ identity: false, payout: false, loading: true });

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

  const getUserInitials = () => {
    if (profileData.username) {
      return profileData.username.substring(0, 2).toUpperCase();
    }
    // Fallback: use first letter only to avoid exposing email prefix
    return (user?.email?.charAt(0) || 'U').toUpperCase();
  };

  // Fetch real unread message count with real-time updates
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      setVerificationStatus({ identity: false, payout: false, loading: false });
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

    // Fetch profile data (username + avatar)
    const fetchProfile = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();
        if (data) {
          setProfileData({ username: data.username, avatar_url: data.avatar_url });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    // Fetch verification status for mobile menu indicator
    const fetchVerificationStatus = async () => {
      try {
        const [identityRes, connectRes] = await Promise.all([
          supabase.functions.invoke('check-identity-status'),
          supabase.functions.invoke('check-connect-status')
        ]);
        
        setVerificationStatus({
          identity: identityRes.data?.verified === true,
          payout: connectRes.data?.onboarding_complete === true,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching verification status:', error);
        setVerificationStatus(prev => ({ ...prev, loading: false }));
      }
    };

    fetchUnreadCount();
    fetchProfile();
    fetchVerificationStatus();

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
    <nav className="sticky top-0 z-[100] bg-background border-b border-border shadow-sm safe-top" style={{ isolation: 'isolate' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16 py-2">
          {/* Logo and Explore Dropdown */}
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="block py-1 text-2xl leading-tight font-bold text-primary hover:text-primary-hover transition-colors"
              aria-label="BountyBay Home"
            >
              BountyBay
            </Link>

            {/* Explore Dropdown - Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden md:flex items-center gap-1 focus-ring">
                  Explore
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuItem asChild>
                  <Link to="/bounties" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span className="font-medium">Browse All Bounties</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {nichePages.map((page) => (
                  <DropdownMenuItem key={page.href} asChild>
                    <Link to={page.href} className="flex items-center gap-3">
                      <page.icon className="h-4 w-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="font-medium">{page.title}</span>
                        <span className="text-xs text-muted-foreground">{page.description}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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
                    <Sparkles className="h-4 w-4 mr-2" />
                    Post a Bounty
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
                        <AvatarImage src={profileData.avatar_url || ''} alt={profileData.username || user.email} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm">{profileData.username || user.email}</p>
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
                      <Link to="/how-it-works">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        How It Works
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
                    <DropdownMenuItem asChild>
                      <Link to="/me/settings" className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </Link>
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

          {/* Mobile: Show message indicator and notification bell for logged-in users */}
          {user && (
            <div className="md:hidden flex items-center gap-1">
              <Button asChild variant="ghost" size="icon" className="relative h-10 w-10">
                <Link to="/messages" aria-label={`Messages${unreadMessages > 0 ? ` (${unreadMessages} unread)` : ''}`}>
                  <MessageCircle className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                      aria-label={`${unreadMessages} unread messages`}
                    >
                      {unreadMessages}
                    </Badge>
                  )}
                </Link>
              </Button>
              <NotificationBell />
            </div>
          )}

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

        {/* Mobile Menu - Fixed scroll, simplified structure */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-3 pb-8 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch">
            {user ? (
              <div className="space-y-1">
                {/* Primary Actions */}
                <Button asChild className="w-full justify-start bg-primary hover:bg-primary-hover text-primary-foreground">
                  <Link to="/post" onClick={() => setIsMobileMenuOpen(false)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Post a Bounty
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

                {/* Verification */}
                <Button asChild variant="ghost" className="w-full justify-start h-auto py-2">
                  <Link to="/verification" onClick={() => setIsMobileMenuOpen(false)}>
                    <ShieldCheck className={`h-4 w-4 mr-2 flex-shrink-0 ${
                      !verificationStatus.loading && verificationStatus.identity && verificationStatus.payout 
                        ? 'text-green-600' 
                        : ''
                    }`} />
                    <div className="flex flex-col items-start flex-1">
                      <span className={
                        !verificationStatus.loading && verificationStatus.identity && verificationStatus.payout 
                          ? 'text-green-600 font-medium' 
                          : ''
                      }>Verification</span>
                      <span className="text-xs text-muted-foreground">(hunters only)</span>
                    </div>
                    {!verificationStatus.loading && (
                      verificationStatus.identity && verificationStatus.payout ? (
                        <span className="text-xs text-green-600 font-medium">✓</span>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium">Action needed</span>
                      )
                    )}
                  </Link>
                </Button>

                <div className="border-t border-border my-2" />

                {/* Browse */}
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link to="/bounties" onClick={() => setIsMobileMenuOpen(false)}>
                    <Search className="h-4 w-4 mr-2" />
                    Browse Bounties
                  </Link>
                </Button>

                {/* Niche Pages */}
                {nichePages.map((niche) => (
                  <Button key={niche.href} asChild variant="ghost" className="w-full justify-start pl-8 text-muted-foreground">
                    <Link to={niche.href} onClick={() => setIsMobileMenuOpen(false)}>
                      <niche.icon className="h-4 w-4 mr-2" />
                      {niche.title}
                    </Link>
                  </Button>
                ))}

                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link to="/me/bounties" onClick={() => setIsMobileMenuOpen(false)}>
                    <FolderOpen className="h-4 w-4 mr-2" />
                    My Bounties
                  </Link>
                </Button>

                <div className="border-t border-border my-2" />

                {/* Account */}
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link to="/me/profile" onClick={() => setIsMobileMenuOpen(false)}>
                    <User className="h-4 w-4 mr-2" />
                    Profile Settings
                  </Link>
                </Button>

                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link to="/support" onClick={() => setIsMobileMenuOpen(false)}>
                    <Bug className="h-4 w-4 mr-2" />
                    Support
                  </Link>
                </Button>

                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link to="/how-it-works" onClick={() => setIsMobileMenuOpen(false)}>
                    <HelpCircle className="h-4 w-4 mr-2" />
                    How It Works
                  </Link>
                </Button>

                <div className="border-t border-border my-2" />

                <Button asChild variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Link to="/me/settings" onClick={() => setIsMobileMenuOpen(false)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Link>
                </Button>

                <Button 
                  onClick={handleSignOut}
                  variant="ghost" 
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Auth buttons first for logged-out users */}
                <Button 
                  asChild 
                  className="w-full justify-start bg-primary hover:bg-primary-hover text-primary-foreground"
                >
                  <Link to="/auth?tab=signup" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign Up Free
                  </Link>
                </Button>
                <Button 
                  onClick={() => { navigate('/auth?tab=signin'); setIsMobileMenuOpen(false); }}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  Sign In
                </Button>
                
                <div className="border-t border-border my-2" />
                
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link to="/bounties" onClick={() => setIsMobileMenuOpen(false)}>
                    <Search className="h-4 w-4 mr-2" />
                    Browse Bounties
                  </Link>
                </Button>

                {nichePages.map((niche) => (
                  <Button key={niche.href} asChild variant="ghost" className="w-full justify-start pl-8 text-muted-foreground">
                    <Link to={niche.href} onClick={() => setIsMobileMenuOpen(false)}>
                      <niche.icon className="h-4 w-4 mr-2" />
                      {niche.title}
                    </Link>
                  </Button>
                ))}
                
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link to="/how-it-works" onClick={() => setIsMobileMenuOpen(false)}>
                    <HelpCircle className="h-4 w-4 mr-2" />
                    How It Works
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}