import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface LocationPickerProps {
  value?: string;
  onChange?: (location: string, coordinates?: [number, number]) => void;
  placeholder?: string;
  className?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value = '',
  onChange,
  placeholder = 'Search for a location...',
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [searchValue, setSearchValue] = useState(value);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get Mapbox token from Supabase edge function
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        // Fallback - you'll need to add your actual token here
        setMapboxToken('YOUR_MAPBOX_TOKEN_HERE');
      }
    };
    fetchToken();
  }, []);

  const initializeMap = () => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 3,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add click handler for map
    map.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      
      // Reverse geocoding to get address
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`
        );
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const place = data.features[0];
          const locationName = place.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          
          // Update marker position
          if (marker.current) {
            marker.current.setLngLat([lng, lat]);
          } else {
            marker.current = new mapboxgl.Marker()
              .setLngLat([lng, lat])
              .addTo(map.current!);
          }
          
          setSearchValue(locationName);
          onChange?.(locationName, [lng, lat]);
        }
      } catch (error) {
        console.error('Error with reverse geocoding:', error);
        const locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setSearchValue(locationName);
        onChange?.(locationName, [lng, lat]);
      }
    });
  };

  const searchLocation = async (query: string) => {
    if (!query.trim() || !mapboxToken) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        const [lng, lat] = place.center;
        
        if (map.current) {
          map.current.flyTo({
            center: [lng, lat],
            zoom: 12,
            duration: 1000
          });
          
          // Update marker
          if (marker.current) {
            marker.current.setLngLat([lng, lat]);
          } else {
            marker.current = new mapboxgl.Marker()
              .setLngLat([lng, lat])
              .addTo(map.current);
          }
        }
        
        onChange?.(place.place_name, [lng, lat]);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchLocation(searchValue);
  };

  const toggleMap = () => {
    setShowMap(!showMap);
    if (!showMap && !map.current) {
      setTimeout(initializeMap, 100); // Allow DOM to update
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
        <Button 
          type="submit" 
          variant="outline" 
          disabled={isLoading}
          className="px-3"
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={toggleMap}
          variant="outline"
          className="whitespace-nowrap"
        >
          {showMap ? 'Hide Map' : 'Show Map'}
        </Button>
      </form>
      
      {showMap && (
        <Card className="p-4">
          <div className="mb-2">
            <p className="text-sm text-muted-foreground">
              Click on the map to select a location, or search above
            </p>
          </div>
          <div 
            ref={mapContainer} 
            className="w-full h-64 rounded-lg border"
            style={{ minHeight: '256px' }}
          />
        </Card>
      )}
    </div>
  );
};