import React, { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LocationSuggestion {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
}

interface LocationPickerProps {
  value?: string;
  onChange?: (location: string, coordinates?: [number, number]) => void;
  placeholder?: string;
  className?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value = '',
  onChange,
  placeholder = 'Search for a city, state or region...',
  className = ''
}) => {
  const [searchValue, setSearchValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTouchingDropdown, setIsTouchingDropdown] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [mapboxFailed, setMapboxFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const failureCountRef = useRef(0);

  // Get Mapbox token from Supabase edge function
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (!data?.token) throw new Error('No token returned');
        setMapboxToken(data.token);
        setFallbackMode(false);
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        // Enable fallback mode if we can't get token
        setFallbackMode(true);
        setMapboxFailed(true);
      }
    };
    fetchToken();
  }, []);

  // Update search value when value prop changes
  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const searchLocations = async (query: string) => {
    // In fallback mode, don't search - just let user type freely
    if (fallbackMode) {
      return;
    }

    if (!query.trim() || !mapboxToken || query.length < 3) {
      setSuggestions([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=5&types=place,locality,neighborhood,address,poi`
      );
      
      // Check for rate limiting or errors
      if (!response.ok) {
        failureCountRef.current++;
        if (failureCountRef.current >= 3) {
          console.warn('Mapbox API failing repeatedly, switching to fallback mode');
          setFallbackMode(true);
          setMapboxFailed(true);
        }
        setSuggestions([]);
        return;
      }

      const data = await response.json();
      
      // Reset failure count on success
      failureCountRef.current = 0;
      
      if (data.features && data.features.length > 0) {
        const locationSuggestions: LocationSuggestion[] = data.features.map((feature: any) => ({
          id: feature.id,
          place_name: feature.place_name,
          text: feature.text,
          center: feature.center
        }));
        setSuggestions(locationSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      failureCountRef.current++;
      if (failureCountRef.current >= 3) {
        console.warn('Mapbox API failing repeatedly, switching to fallback mode');
        setFallbackMode(true);
        setMapboxFailed(true);
      }
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    
    // In fallback mode, update parent immediately
    if (fallbackMode) {
      onChange?.(newValue);
      return;
    }
    
    // Debounce the search
    const timeoutId = setTimeout(() => {
      searchLocations(newValue);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    setSearchValue(suggestion.place_name);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsTouchingDropdown(false);
    onChange?.(suggestion.place_name, suggestion.center);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && !fallbackMode) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // In fallback mode, commit the value on blur
    if (fallbackMode && searchValue.trim()) {
      onChange?.(searchValue.trim());
    }
    
    // Don't hide if user is touching the dropdown
    if (isTouchingDropdown) {
      return;
    }
    // Small delay for desktop click to complete
    setTimeout(() => {
      if (!isTouchingDropdown) {
        setShowSuggestions(false);
      }
    }, 150);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In fallback mode, just submit the typed value
    if (fallbackMode) {
      if (searchValue.trim()) {
        onChange?.(searchValue.trim());
      }
      return;
    }
    
    // If there are suggestions, select the first one
    if (suggestions.length > 0) {
      handleSuggestionClick(suggestions[0]);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          value={searchValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={fallbackMode ? "Enter your city or region" : placeholder}
          className="pl-10"
          autoComplete="off"
        />
        {isLoading && !fallbackMode && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
      
      {/* Fallback mode indicator */}
      {mapboxFailed && (
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          <span>Type your location manually</span>
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && !fallbackMode && (
        <div 
          ref={suggestionsRef}
          className="absolute z-[200] w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
          onTouchStart={() => setIsTouchingDropdown(true)}
          onTouchEnd={() => {
            // Keep flag for a moment to let click complete
            setTimeout(() => setIsTouchingDropdown(false), 100);
          }}
          onMouseDown={() => setIsTouchingDropdown(true)}
          onMouseUp={() => {
            setTimeout(() => setIsTouchingDropdown(false), 100);
          }}
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-3 py-3 text-left hover:bg-muted focus:bg-muted focus:outline-none border-none bg-transparent cursor-pointer active:bg-muted touch-manipulation"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">{suggestion.text}</div>
                  <div className="text-xs text-muted-foreground">{suggestion.place_name}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </form>
  );
};
