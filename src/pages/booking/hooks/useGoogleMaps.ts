
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { loadGoogleMapsScript, isGoogleMapsLoaded, ensureMapElementReady } from '@/services/mapService';

export const useGoogleMaps = (mapRef: React.RefObject<HTMLDivElement>, isReloadingMap: boolean) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [mapInitError, setMapInitError] = useState<string | null>(null);
  const mapInitAttempts = useRef(0);
  const isInitializing = useRef(false);

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
        
        // Step 1: Ensure Google Maps API is loaded
        if (!isGoogleMapsLoaded()) {
          console.log("Google Maps not loaded, loading script...");
          await loadGoogleMapsScript();
        }
        
        // Step 2: Ensure the map container element is ready
        console.log("Waiting for map container element to be ready...");
        await ensureMapElementReady(mapRef);
        
        // Step 3: Initialize the map
        if (!mapRef.current || !window.google) {
          throw new Error("Map container element not available or Google Maps not loaded");
        }
        
        console.log("Creating map instance");
        // Use a more lightweight map style and reduce the initial zoom level
        const mapOptions = {
          center: { lat: -0.1807, lng: -78.4678 }, // Quito, Ecuador
          zoom: 11, // Reduced from 12 to 11
          disableDefaultUI: true, // Simplify UI for better performance
          zoomControl: true, // But keep zoom controls
          styles: [
            {
              "featureType": "all",
              "elementType": "labels.text.fill",
              "stylers": [{"color": "#ffffff"}]
            },
            {
              "featureType": "all",
              "elementType": "labels.text.stroke",
              "stylers": [{"color": "#000000"}, {"lightness": 13}]
            },
            {
              "featureType": "administrative",
              "elementType": "geometry.fill",
              "stylers": [{"color": "#000000"}]
            },
            {
              "featureType": "administrative",
              "elementType": "geometry.stroke",
              "stylers": [{"color": "#144b53"}, {"lightness": 14}, {"weight": 1.4}]
            },
            {
              "featureType": "landscape",
              "elementType": "all",
              "stylers": [{"color": "#08304b"}]
            },
            {
              "featureType": "poi",
              "elementType": "geometry",
              "stylers": [{"color": "#0c4152"}, {"lightness": 5}]
            },
            {
              "featureType": "road.highway",
              "elementType": "geometry.fill",
              "stylers": [{"color": "#000000"}]
            },
            {
              "featureType": "road.highway",
              "elementType": "geometry.stroke",
              "stylers": [{"color": "#0b434f"}, {"lightness": 25}]
            },
            {
              "featureType": "road.arterial",
              "elementType": "geometry.fill",
              "stylers": [{"color": "#000000"}]
            },
            {
              "featureType": "road.arterial",
              "elementType": "geometry.stroke",
              "stylers": [{"color": "#0b3d51"}, {"lightness": 16}]
            },
            {
              "featureType": "road.local",
              "elementType": "geometry",
              "stylers": [{"color": "#000000"}]
            },
            {
              "featureType": "transit",
              "elementType": "all",
              "stylers": [{"color": "#146474"}]
            },
            {
              "featureType": "water",
              "elementType": "all",
              "stylers": [{"color": "#021019"}]
            }
          ]
        };

        const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
        
        // Force a resize after map creation to ensure proper rendering
        setTimeout(() => {
          window.google.maps.event.trigger(newMap, 'resize');
        }, 100);
        
        setMap(newMap);
        console.log("Map instance created successfully");

        // Add listeners for map initialization events
        window.google.maps.event.addListenerOnce(newMap, 'idle', () => {
          console.log('Map is fully loaded and ready');
        });

        window.google.maps.event.addListener(newMap, 'bounds_changed', () => {
          // Trigger a resize when bounds change to ensure the map renders properly
          setTimeout(() => {
            window.google.maps.event.trigger(newMap, 'resize');
          }, 100);
        });

        // Create directions renderer
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
    
    // Start initialization process
    initializeMap();
    
    // Cleanup function
    return () => {
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
      
      if (map) {
        // Clean up any event listeners to prevent memory leaks
        window.google?.maps.event.clearInstanceListeners(map);
      }
    };
  }, [isReloadingMap]); 

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
