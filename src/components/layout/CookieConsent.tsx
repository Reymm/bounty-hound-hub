import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

const COOKIE_CONSENT_KEY = 'bountybay-cookie-consent';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Never show cookie consent in native app (App Store guideline 5.1.2)
    if (Capacitor.isNativePlatform()) return;

    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      analytics: true,
      functional: true,
    }));
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      accepted: false,
      timestamp: new Date().toISOString(),
      analytics: false,
      functional: true, // Essential cookies always enabled
    }));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe animate-in slide-in-from-bottom-5 duration-300">
      <Card className="max-w-2xl mx-auto shadow-lg border-2">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="p-2 rounded-full bg-primary/10 shrink-0">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-sm sm:text-base">We use cookies</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We use cookies to improve your experience, analyze site traffic, and personalize content. 
                  By clicking "Accept", you consent to our use of cookies. See our{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>{' '}
                  for more information.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleAccept} size="sm">
                  Accept All
                </Button>
                <Button onClick={handleDecline} variant="outline" size="sm">
                  Essential Only
                </Button>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 h-8 w-8 absolute top-2 right-2 sm:relative sm:top-0 sm:right-0"
              onClick={handleDecline}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
