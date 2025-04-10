
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { 
  loadGoogleMapsScript, 
  isGoogleMapsLoaded, 
  ensureMapElementReady,
  createOrGetMapInstance
} from '@/services/mapService';
import { GOOGLE_MAPS_API_KEY } from '@/constants';

export const useGoogleMaps = (mapRef: React.RefObject<HTMLDivElement>, isReloadingMap: boolean) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [mapInitError, setMapInitError] = useState<string | null>(null);
  const mapInitAttempts = useRef(0);
  const isInitializing = useRef(false);
  const mapInstanceId = useRef(`map-${Date.now()}`);

  // Initialize map and directions service with improved error handling
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
        await new Promise<void>(resolve => setTimeout(resolve, 300));
        
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
        setMap(newMap);
        console.log("Map instance created successfully");

        // Force resize events to ensure proper rendering
        [100, 300, 500, 1000].forEach(timeout => {
          setTimeout(() => {
            if (newMap) {
              window.google.maps.event.trigger(newMap, 'resize');
              newMap.setZoom(newMap.getZoom() || 11); // Force redraw
            }
          }, timeout);
        });

        // Monitor viewport changes to handle resize
        window.addEventListener('resize', () => {
          if (newMap) {
            window.google.maps.event.trigger(newMap, 'resize');
          }
        });

        // Create directions renderer
        if (newMap) {
          const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
            map: newMap,
            suppressMarkers: true, // Suppress default markers so we can use our own draggable ones
            polylineOptions: {
              strokeColor: '#3b82f6',
              strokeWeight: 5,
              strokeOpacity: 0.8
            }
          });
          
          setDirectionsRenderer(newDirectionsRenderer);
          console.log("Directions renderer created successfully");
          
          // Place a marker at the center to confirm map is working
          new google.maps.Marker({
            position: mapOptions.center,
            map: newMap,
            title: "Mapa cargado correctamente"
          });
        }
        
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
      
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
      
      if (map) {
        // Clean up any event listeners to prevent memory leaks
        window.google?.maps.event.clearInstanceListeners(map);
      }
    };
  }, [isReloadingMap, GOOGLE_MAPS_API_KEY]); // Add GOOGLE_MAPS_API_KEY as dependency

  // Calculate route with directions
  const calculateRouteWithDirections = (
    origin: google.maps.LatLngLiteral,
    destination: google.maps.LatLngLiteral,
    intermediateStops: Array<{
      id: string;
      placeName: string;
      location: google.maps.LatLngLiteral;
    }>,
    onSuccess: (distance: number, duration: string) => void,
    onError: () => void
  ) => {
    if (!window.google || !origin || !destination || !directionsRenderer || !map) {
      console.error("Cannot calculate route: missing required objects");
      onError();
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    // Prepare waypoints from intermediate stops
    const waypoints = intermediateStops.map((stop) => ({
      location: stop.location,
      stopover: true,
    }));

    // Make sure the map is properly sized before calculating the route
    window.google.maps.event.trigger(map, 'resize');

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        optimizeWaypoints: false,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);

          // Calculate total distance and duration
          let totalDistance = 0;
          let totalDurationValue = 0;
          let formattedDuration = "";
          
          const legs = result.routes[0].legs;
          for (let i = 0; i < legs.length; i++) {
            totalDistance += legs[i].distance.value;
            totalDurationValue += legs[i].duration.value;
          }
          
          // Format duration in hours and minutes
          const hours = Math.floor(totalDurationValue / 3600);
          const minutes = Math.floor((totalDurationValue % 3600) / 60);
          
          if (hours > 0) {
            formattedDuration = `${hours}h ${minutes}m`;
          } else {
            formattedDuration = `${minutes}m`;
          }
          
          // Convert meters to kilometers
          onSuccess(totalDistance / 1000, formattedDuration);
        } else {
          console.error('Directions request failed with status: ', status);
          onError();
        }
      }
    );
  };

  // Generate Google Maps route link with waypoints
  const generateRouteLink = (origin: string, destination: string, intermediateStops?: Array<{placeName: string}>) => {
    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    
    // Add waypoints if there are intermediate stops
    if (intermediateStops && intermediateStops.length > 0) {
      const waypoints = intermediateStops.map(stop => encodeURIComponent(stop.placeName)).join('|');
      url += `&waypoints=${waypoints}`;
    }
    
    return url;
  };

  return {
    map,
    directionsRenderer,
    mapInitError,
    setMapInitError,
    calculateRouteWithDirections,
    generateRouteLink,
    mapInitAttempts: mapInitAttempts.current
  };
};

export default useGoogleMaps;
