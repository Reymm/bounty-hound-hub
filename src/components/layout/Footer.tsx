import { Link } from 'react-router-dom';
import { Bug } from 'lucide-react';
import { PartnerApplicationDialog } from '@/components/partner/PartnerApplicationDialog';
import { StripeBadge } from '@/components/ui/stripe-badge';

export function Footer() {
  return (
    <footer className="bg-muted border-t border-border mt-auto safe-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Logo and Copyright */}
          <div className="text-center md:text-left">
            <div className="text-lg font-semibold text-primary mb-2">BountyBay</div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BountyBay. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center md:justify-start gap-1">
              All prices are in USD
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="h-3 w-4 inline-block">
                <path fill="#bf0a30" d="M0 0h640v37H0zm0 74h640v37H0zm0 74h640v37H0zm0 74h640v37H0zm0 74h640v37H0zm0 74h640v37H0zm0 74h640v37H0z"/>
                <path fill="#fff" d="M0 37h640v37H0zm0 74h640v37H0zm0 74h640v37H0zm0 74h640v37H0zm0 74h640v37H0zm0 74h640v37H0z"/>
                <path fill="#002868" d="M0 0h256v259H0z"/>
                <g fill="#fff"><g id="s18"><g id="s9"><g id="s5"><g id="s4"><path id="s" d="m128 11.7 3.9 12h12.6l-10.2 7.4 3.9 12-10.2-7.4-10.2 7.4 3.9-12-10.2-7.4h12.6z"/><use href="#s" y="42"/></g><use href="#s4" y="84"/></g><use href="#s5" y="42"/></g><use href="#s9" x="64"/></g><use href="#s18" x="128"/><use href="#s9" x="192"/></g>
              </svg>
            </p>
            <StripeBadge className="mt-2 justify-center md:justify-start" />
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link 
              to="/how-it-works" 
              className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1 py-1"
              aria-label="How It Works"
            >
              How It Works
            </Link>
            <Link 
              to="/faq" 
              className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1 py-1"
              aria-label="Frequently Asked Questions"
            >
              FAQ
            </Link>
            <Link 
              to="/support" 
              className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1 py-1 flex items-center gap-1.5"
              aria-label="Report a bug or give feedback"
            >
              <Bug className="h-4 w-4" />
              Report Bug
            </Link>
            <Link 
              to="/legal/terms" 
              className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1 py-1"
              aria-label="Terms of Service"
            >
              Terms
            </Link>
            <Link 
              to="/legal/privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1 py-1"
              aria-label="Privacy Policy"
            >
              Privacy
            </Link>
            <Link 
              to="/support" 
              className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1 py-1"
              aria-label="Contact us"
            >
              Contact
            </Link>
            <PartnerApplicationDialog />
          </nav>
        </div>
      </div>
    </footer>
  );
}