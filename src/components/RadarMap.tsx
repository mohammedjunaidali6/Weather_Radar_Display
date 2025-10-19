import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Update this with your deployed backend URL
const BACKEND_URL = 'http://localhost:3001';

const RadarMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!mapContainer.current || !isTokenSet || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-95, 38],
      zoom: 4,
    });

    map.current.on('error', (e) => {
      console.error('Mapbox error:', e);
      if (e.error?.message?.includes('access token')) {
        setMapError('Invalid Mapbox token. Please enter a valid token from mapbox.com');
        toast({
          title: "Invalid Mapbox Token",
          description: "Please enter a valid token from mapbox.com/account/access-tokens",
          variant: "destructive",
        });
      }
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapError(null);
      fetchRadarData();
      // Auto-refresh every 2 minutes
      const interval = setInterval(fetchRadarData, 120000);
      return () => clearInterval(interval);
    });

    return () => {
      map.current?.remove();
    };
  }, [isTokenSet, mapboxToken]);

  const fetchRadarData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/radar/latest`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch radar data');
      }
      
      const data = await response.json();
      setLastUpdate(new Date());
      
      toast({
        title: "Radar data updated",
        description: `Latest: ${data.timestamp}`,
      });
      
      console.log('Radar data fetched:', data.filename);
      // Process GRIB2 data here - you would need a GRIB2 decoder library
      // For now, just logging the successful fetch
      
    } catch (error) {
      console.error('Failed to fetch MRMS data:', error);
      toast({
        title: "Error fetching radar data",
        description: "Make sure the backend is running and accessible",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenSubmit = () => {
    const token = mapboxToken.trim();
    if (!token) {
      toast({
        title: "Token Required",
        description: "Please enter your Mapbox access token",
        variant: "destructive",
      });
      return;
    }
    
    if (!token.startsWith('pk.')) {
      toast({
        title: "Invalid Token Format",
        description: "Mapbox public tokens should start with 'pk.'",
        variant: "destructive",
      });
      return;
    }
    
    setIsTokenSet(true);
  };

  if (!isTokenSet) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4 p-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Weather Radar Display</h2>
            <p className="text-muted-foreground">
              Enter your Mapbox public access token to continue
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-semibold">How to get your token:</p>
              <ol className="text-left space-y-1 list-decimal list-inside">
                <li>Create a free account at Mapbox</li>
                <li>Go to your account's access tokens page</li>
                <li>Copy your "Default public token" (starts with pk.)</li>
                <li>Paste it below</li>
              </ol>
              <a 
                href="https://account.mapbox.com/access-tokens/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-2 text-primary hover:underline font-semibold"
              >
                → Get your token at mapbox.com
              </a>
            </div>
          </div>
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="pk.eyJ1..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTokenSubmit()}
            />
            <Button onClick={handleTokenSubmit} className="w-full">
              Load Map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-background">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 max-w-md text-center">
            <h2 className="text-xl font-bold text-destructive mb-2">Map Error</h2>
            <p className="text-sm mb-4">{mapError}</p>
            <Button onClick={() => {
              setIsTokenSet(false);
              setMapError(null);
            }}>
              Enter New Token
            </Button>
          </div>
        </div>
      )}
      
      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border max-w-sm">
        <h1 className="text-xl font-bold mb-2">MRMS Weather Radar</h1>
        <div className="text-sm space-y-1 text-muted-foreground">
          <div>Data Source: RALA (Reflectivity at Lowest Altitude)</div>
          {lastUpdate && (
            <div>Last Update: {lastUpdate.toLocaleTimeString()}</div>
          )}
          {isLoading && (
            <div className="text-xs mt-2 text-primary">⟳ Loading radar data...</div>
          )}
          <div className="text-xs mt-2 space-y-1">
            <div>Backend: {BACKEND_URL}</div>
            <div className="text-amber-500">
              ⚠️ Update BACKEND_URL in RadarMap.tsx with your deployed backend
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
        <div className="text-xs font-semibold mb-2">Reflectivity (dBZ)</div>
        <div className="flex flex-col space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-3" style={{ backgroundColor: '#04e9e7' }}></div>
            <span>65+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3" style={{ backgroundColor: '#019ff4' }}></div>
            <span>55-65</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3" style={{ backgroundColor: '#0300f4' }}></div>
            <span>45-55</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3" style={{ backgroundColor: '#02fd02' }}></div>
            <span>35-45</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3" style={{ backgroundColor: '#01c501' }}></div>
            <span>25-35</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3" style={{ backgroundColor: '#008e00' }}></div>
            <span>15-25</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3" style={{ backgroundColor: '#fdf802' }}></div>
            <span>5-15</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadarMap;
