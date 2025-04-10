
// Helper function to safely get a map instance from the DOM element
export const getMapInstanceFromElement = (element: Element | null): google.maps.Map | null => {
  if (!element || !window.google?.maps?.Map) return null;
  
  try {
    // Use DOM traversal to find the map instance
    const maps = window.google.maps;
    
    // Access the instances array through the constructor
    // This es necesario para obtener la instancia del mapa desde el DOM
    const instances = (maps.Map as any).instances;
    
    if (!instances || !Array.isArray(instances)) {
      return null;
    }
    
    // Find the map instance associated with this element
    return instances.find(
      (map: google.maps.Map) => map.getDiv && map.getDiv() === element
    ) || null;
  } catch (e) {
    console.error("Error getting map instance:", e);
    return null;
  }
};

// Function to make sure the map element is ready before initializing the map
export function ensureMapElementReady(
  mapRef: React.RefObject<HTMLDivElement>
): Promise<HTMLDivElement> {
  return new Promise((resolve, reject) => {
    // Check if the element is already available
    if (mapRef.current) {
      resolve(mapRef.current);
      return;
    }
    
    // If not, set up a small polling mechanism to wait for it
    let attempts = 0;
    const maxAttempts = 10;
    const checkInterval = setInterval(() => {
      attempts++;
      if (mapRef.current) {
        clearInterval(checkInterval);
        resolve(mapRef.current);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.warn('Map element not ready after multiple attempts');
        reject(new Error('Map element not ready after multiple attempts'));
      }
    }, 200);
  });
}

// Function to create or get a map instance with improved error handling
export function createOrGetMapInstance(
  element: HTMLElement,
  options: google.maps.MapOptions,
  instanceId?: string
): google.maps.Map | null {
  try {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps not loaded');
      return null;
    }
    
    // Check if a map is already associated with this element
    const existingMap = getMapInstanceFromElement(element);
    if (existingMap) {
      console.log("Returning existing map instance", instanceId);
      
      // Ensure the map is properly sized and centered
      setTimeout(() => {
        window.google.maps.event.trigger(existingMap, 'resize');
        if (options.center) {
          existingMap.setCenter(options.center);
        }
      }, 100);
      
      return existingMap;
    }
    
    // Clean the element before creating a new map
    // This helps prevent issues with multiple maps in the same container
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    
    // Create a new map
    const newMap = new window.google.maps.Map(element, options);
    console.log("Created new map instance", instanceId);
    
    // Trigger resize events to ensure proper rendering
    const resizeTimes = [100, 300, 500, 1000];
    resizeTimes.forEach(time => {
      setTimeout(() => {
        if (newMap) {
          window.google.maps.event.trigger(newMap, 'resize');
        }
      }, time);
    });
    
    return newMap;
  } catch (error) {
    console.error('Error creating map:', error);
    return null;
  }
}
