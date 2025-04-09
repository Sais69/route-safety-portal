
import { GOOGLE_MAPS_API_KEY } from "@/constants";

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
      if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.length < 20) {
        console.error("Google Maps API key invalid or not available. Key length:", GOOGLE_MAPS_API_KEY ? GOOGLE_MAPS_API_KEY.length : 0);
        throw new Error("Google Maps API key is invalid or not available");
      }

      // Check if we already have this map instance
      if (mapInstances[mapId] && mapRef.current) {
        const mapDiv = mapInstances[mapId].getDiv();
        // Only check contains if mapDiv exists
        if (mapDiv && mapRef.current.contains(mapDiv)) {
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
      }

      if (!mapRef.current) {
        console.error("Map container element not available");
        throw new Error("Map container element not available");
      }

      if (!window.google || !window.google.maps) {
        console.error("Google Maps API not loaded");
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
      
      // Create a new map with error handling
      try {
        // Create map instance (force standard option to avoid rendering issues)
        mapOptions.mapTypeId = google.maps.MapTypeId.ROADMAP;
        
        const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
        mapInstances[mapId] = newMap;
        
        // Monitor map loading
        const checkMapLoaded = () => {
          try {
            if (newMap && newMap.getDiv() && newMap.getDiv().offsetWidth > 0) {
              // Force map to render with a trigger
              google.maps.event.trigger(newMap, 'resize');
              
              console.log('Map instance created and rendered successfully with dimensions:', 
                newMap.getDiv().offsetWidth, 'x', newMap.getDiv().offsetHeight);
              
              // Add a listener to detect when map tiles are loaded
              google.maps.event.addListenerOnce(newMap, 'tilesloaded', () => {
                console.log('Map tiles loaded successfully');
              });
              
              resolve(newMap);
            } else {
              console.log('Waiting for map to render...');
              setTimeout(checkMapLoaded, 100);
            }
          } catch (e) {
            console.error("Error checking if map is loaded:", e);
            reject(e);
          }
        };
        
        checkMapLoaded();
      } catch (mapError) {
        console.error("Error creating Google Map instance:", mapError);
        reject(mapError);
      }
      
    } catch (error) {
      console.error('Error creating map instance:', error);
      reject(error);
    }
  });
};
