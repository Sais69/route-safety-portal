
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export const useGoogleMaps = (mapRef: React.RefObject<HTMLDivElement>, isReloadingMap: boolean) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [mapInitError, setMapInitError] = useState<string | null>(null);

  // Initialize map and directions service with error handling
  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    try {
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
      setMap(newMap);

      // Add error handling for map initialization
      newMap.addListener('idle', () => {
        console.log('Map is fully loaded and ready');
      });

      newMap.addListener('error', (e: any) => {
        console.error('Map load error:', e);
        setMapInitError('Error cargando el mapa. Intente recargar la página.');
      });

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
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
      setMapInitError("Error al inicializar el mapa. Por favor, recargue la página.");
      // Fixed toast error - Using just the text instead of object with title/description
      toast("Error al inicializar el mapa. Por favor, recargue la página.");
    }
    
    return () => {
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
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
    if (!window.google || !origin || !destination || !directionsRenderer) return;

    const directionsService = new window.google.maps.DirectionsService();

    // Prepare waypoints from intermediate stops
    const waypoints = intermediateStops.map((stop) => ({
      location: stop.location,
      stopover: true,
    }));

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
    generateRouteLink
  };
};

export default useGoogleMaps;
