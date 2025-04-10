
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  loadGoogleMapsScript, 
  isGoogleMapsLoaded, 
  ensureMapElementReady,
  createOrGetMapInstance
} from '@/services/mapService';
import { GOOGLE_MAPS_API_KEY } from '@/constants';

interface UseMapInitializationProps {
  mapRef: React.RefObject<HTMLDivElement>;
  isReloadingMap: boolean;
}

export const useMapInitialization = ({ mapRef, isReloadingMap }: UseMapInitializationProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapInitError, setMapInitError] = useState<string | null>(null);
  const mapInitAttempts = useRef(0);
  const isInitializing = useRef(false);
  const mapInstanceId = useRef(`map-${Date.now()}`);

  // Initialize map with improved error handling
  useEffect(() => {
    // Prevent multiple initialization attempts running simultaneously
    if (isInitializing.current) {
      console.log("Map initialization already in progress, skipping");
      return;
    }
    
    // Function to initialize the map
    const initializeMap = async () => {
      isInitializing.current = true;
      setMapInitError(null);
      
      try {
        console.log("Starting map initialization");
        console.log("Current API key status:", GOOGLE_MAPS_API_KEY ? "Available" : "Not available");
        
        // Check if we have an API key
        if (!GOOGLE_MAPS_API_KEY) {
          throw new Error("Google Maps API key not available. Please check your configuration.");
        }
        
        // Step 1: Wait for document to be ready
        if (document.readyState !== 'complete') {
          console.log("Waiting for document to be ready...");
          await new Promise<void>((resolve) => {
            const checkReady = () => {
              if (document.readyState === 'complete') {
                resolve();
              } else {
                setTimeout(checkReady, 100);
              }
            };
            checkReady();
          });
        }
        
        // Step 2: Ensure Google Maps API is loaded
        if (!isGoogleMapsLoaded()) {
          console.log("Google Maps not loaded, loading script...");
          await loadGoogleMapsScript().catch((error) => {
            throw new Error(`Error loading Google Maps script: ${error.message}`);
          });
        }
        
        // Step 3: Wait a bit to ensure the scripts are fully initialized
        await new Promise<void>(resolve => setTimeout(resolve, 500));
        
        // Double check that maps is loaded
        if (!window.google || !window.google.maps) {
          throw new Error("Google Maps API failed to initialize properly");
        }
        
        // Step 4: Ensure the map container element is ready
        console.log("Waiting for map container element to be ready...");
        const mapElement = await ensureMapElementReady(mapRef);
        
        // Step 5: Initialize the map
        if (!mapElement) {
          throw new Error("Map container element not available");
        }
        
        console.log("Creating map instance");
        // Use a simpler map style to ensure proper rendering
        const mapOptions = {
          center: { lat: -0.1807, lng: -78.4678 }, // Quito, Ecuador
          zoom: 11, 
          mapTypeId: google.maps.MapTypeId.ROADMAP, // Force standard roadmap
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: false,
          // Use a much simpler style to avoid rendering issues
          styles: [
            {
              "featureType": "administrative",
              "elementType": "geometry",
              "stylers": [{"visibility": "on"}]
            },
            {
              "featureType": "poi",
              "stylers": [{"visibility": "simplified"}]
            },
            {
              "featureType": "road",
              "elementType": "labels.icon",
              "stylers": [{"visibility": "on"}]
            },
            {
              "featureType": "transit",
              "stylers": [{"visibility": "simplified"}]
            }
          ]
        };

        // Use our enhanced map creation function
        const newMap = createOrGetMapInstance(mapElement, mapOptions, mapInstanceId.current);
        if (!newMap) {
          throw new Error("Failed to create map instance");
        }
        
        setMap(newMap);
        console.log("Map instance created successfully");

        // Force resize events to ensure proper rendering
        [100, 300, 500, 1000, 2000].forEach(timeout => {
          setTimeout(() => {
            if (newMap) {
              window.google.maps.event.trigger(newMap, 'resize');
              newMap.setZoom(newMap.getZoom() || 11); // Force redraw
              
              // Add a marker to the center to confirm map is working
              new google.maps.Marker({
                position: newMap.getCenter() || { lat: -0.1807, lng: -78.4678 },
                map: newMap,
                title: "Mapa cargado correctamente"
              });
            }
          }, timeout);
        });

        // Monitor viewport changes to handle resize
        window.addEventListener('resize', () => {
          if (newMap) {
            window.google.maps.event.trigger(newMap, 'resize');
          }
        });
        
        // Reset error state and initialization flag
        setMapInitError(null);
        isInitializing.current = false;
        
      } catch (error) {
        // Handle initialization errors
        console.error("Error initializing Google Maps:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido al inicializar el mapa";
        setMapInitError(`Error: ${errorMessage}`);
        toast.error("Error al inicializar el mapa. Por favor, recargue la página o utilice otro navegador.");
        
        mapInitAttempts.current += 1;
        isInitializing.current = false;
      }
    };
    
    // Add a small delay before initialization to ensure DOM is ready
    const initTimeout = setTimeout(() => {
      initializeMap();
    }, 300);
    
    // Cleanup function
    return () => {
      clearTimeout(initTimeout);
      
      if (map) {
        // Clean up any event listeners to prevent memory leaks
        window.google?.maps.event.clearInstanceListeners(map);
      }
    };
  }, [isReloadingMap, GOOGLE_MAPS_API_KEY]); // Add GOOGLE_MAPS_API_KEY as dependency

  return {
    map,
    mapInitError,
    setMapInitError,
    mapInitAttempts: mapInitAttempts.current
  };
};

export default useMapInitialization;
