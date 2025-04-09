import { GOOGLE_MAPS_API_KEY } from "@/constants";

// Function to load the Google Maps script
export const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps API already loaded');
      resolve();
      return;
    }

    // Create a div to track script loading status
    const mapTrackingDiv = document.createElement('div');
    mapTrackingDiv.id = 'google-maps-loading-status';
    document.body.appendChild(mapTrackingDiv);

    // Check if we have a valid API key
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.length < 10) {
      console.error('No valid Google Maps API key available');
      reject(new Error('Google Maps API key not available or invalid'));
      return;
    }

    console.log('Attempting to load Google Maps with API key (length: ' + GOOGLE_MAPS_API_KEY.length + ')');

    try {
      // Remove any existing script tags to prevent duplicates
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      existingScripts.forEach(script => script.remove());

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;

      // Setup global callback that the API will call when loaded
      window.initMap = () => {
        console.log('Google Maps API loaded via callback');
        if (document.body.contains(mapTrackingDiv)) {
          document.body.removeChild(mapTrackingDiv);
        }
        resolve();
      };

      // Setup event handlers for success and failure
      script.onload = () => {
        console.log('Google Maps script tag loaded (onload event)');
        // Note: We don't resolve here, we wait for the callback
      };

      script.onerror = (error) => {
        console.error('Failed to load Google Maps API:', error);
        if (document.body.contains(mapTrackingDiv)) {
          document.body.removeChild(mapTrackingDiv);
        }
        reject(new Error('Failed to load Google Maps API - Network Error'));
      };

      // Add the script to the document
      document.head.appendChild(script);
      
      // Set a timeout to catch cases where the script loads but doesn't initialize properly
      setTimeout(() => {
        if (!window.google || !window.google.maps) {
          console.error('Google Maps API failed to initialize within timeout period');
          if (document.body.contains(mapTrackingDiv)) {
            document.body.removeChild(mapTrackingDiv);
          }
          reject(new Error('Google Maps API initialization timed out'));
        }
      }, 20000); // 20 seconds timeout
    } catch (error) {
      console.error('Error setting up Google Maps script:', error);
      if (document.body.contains(mapTrackingDiv)) {
        document.body.removeChild(mapTrackingDiv);
      }
      reject(error);
    }
  });
};

// Function to check if Google Maps is loaded
export const isGoogleMapsLoaded = (): boolean => {
  return !!(window.google && window.google.maps);
};

// Function to calculate the distance between two points
export const calculateDistance = (origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral): number => {
  const R = 6371; // Radius of the earth in km
  const lat1 = origin.lat * Math.PI / 180;
  const lon1 = origin.lng * Math.PI / 180;
  const lat2 = destination.lat * Math.PI / 180;
  const lon2 = destination.lng * Math.PI / 180;

  const dlon = lon2 - lon1;
  const dlat = lat2 - lat1;

  const a = Math.sin(dlat / 2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance;
};

// Function to calculate the cost of the trip
export const calculateCost = (vehicleType: string, distance: number, roundTrip: boolean = false): string => {
  const pricePerKm = {
    furgoneta: 0.89,
    microbus: 1.29,
    bus: 1.69,
    taxi: 0.60
  };

  const ratePerKm = pricePerKm[vehicleType as keyof typeof pricePerKm] || 0.89;
  const totalDistance = roundTrip ? distance * 2 : distance;
  const cost = totalDistance * ratePerKm;

  return cost.toFixed(2);
};

// Function to calculate return route using Google Maps Directions API
export const calculateReturnRoute = (
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  intermediateStops: Array<{
    id: string;
    placeName: string;
    location: google.maps.LatLngLiteral;
  }>
): Promise<{ distance: number; duration: string }> => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      reject(new Error('Google Maps API not loaded'));
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
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

          resolve({
            distance: totalDistance / 1000, // Convert meters to kilometers
            duration: formattedDuration,
          });
        } else {
          reject(new Error('Directions request failed with status: ' + status));
        }
      }
    );
  });
};

// Function to ensure the map element is ready
export const ensureMapElementReady = (mapRef: React.RefObject<HTMLDivElement>): Promise<void> => {
  return new Promise((resolve) => {
    const checkElement = () => {
      if (mapRef.current) {
        // Check if the element has dimensions
        const rect = mapRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          console.log('Map container element is ready with dimensions:', rect.width, 'x', rect.height);
          resolve();
          return;
        }
        console.log('Map container element found but has no dimensions yet, waiting...');
      } else {
        console.log('Map container element not found yet, waiting...');
      }
      setTimeout(checkElement, 50);
    };
    checkElement();
  });
};

// Function to create or get a map instance with better error handling
const mapInstances: { [key: string]: google.maps.Map } = {};

export const createOrGetMapInstance = async (
  mapRef: React.RefObject<HTMLDivElement>,
  mapOptions: google.maps.MapOptions,
  mapId: string
): Promise<google.maps.Map> => {
  return new Promise((resolve, reject) => {
    try {
      // Check if we have a valid API key first
      if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.length < 10) {
        throw new Error("Google Maps API key is invalid or not available");
      }

      // Check if we already have this map instance
      if (mapInstances[mapId] && mapRef.current?.contains(mapInstances[mapId].getDiv())) {
        console.log(`Reusing existing map instance with ID: ${mapId}`);
        
        // Ensure map is properly sized
        if (window.google && window.google.maps) {
          setTimeout(() => {
            window.google.maps.event.trigger(mapInstances[mapId], 'resize');
          }, 100);
        }
        
        resolve(mapInstances[mapId]);
        return;
      }

      if (!mapRef.current) {
        throw new Error("Map container element not available");
      }

      if (!window.google || !window.google.maps) {
        throw new Error("Google Maps API not loaded");
      }

      console.log('Creating new map instance in element:', mapRef.current);
      
      // Delete any existing map instance with this ID if it exists but is not valid
      if (mapInstances[mapId]) {
        try {
          delete mapInstances[mapId];
        } catch (e) {
          console.warn("Error cleaning up old map instance:", e);
        }
      }
      
      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      mapInstances[mapId] = newMap;
      
      // Monitor map loading
      const checkMapLoaded = () => {
        if (newMap.getDiv() && newMap.getDiv().offsetWidth > 0) {
          console.log('Map instance created and rendered successfully with dimensions:', 
            newMap.getDiv().offsetWidth, 'x', newMap.getDiv().offsetHeight);
          resolve(newMap);
        } else {
          console.log('Waiting for map to render...');
          setTimeout(checkMapLoaded, 100);
        }
      };
      
      checkMapLoaded();
      
    } catch (error) {
      console.error('Error creating map instance:', error);
      reject(error);
    }
  });
};

// Add global initMap type to window
declare global {
  interface Window {
    initMap: () => void;
  }
}
