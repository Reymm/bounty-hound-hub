import { Link } from 'react-router-dom';
import { Bug } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-muted border-t border-border mt-auto safe-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Logo and Copyright */}
          <div className="text-center md:text-left">
            <div className="text-lg font-semibold text-primary mb-2">BountyBay</div>
            <p className="text-sm text-muted-foreground">
              © 2024 BountyBay. All rights reserved.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
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
            <a 
              href="mailto:contact@bountybay.com" 
              className="text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1 py-1"
              aria-label="Contact us via email"
            >
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}