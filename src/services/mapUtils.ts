// Helper function to safely get a map instance from the DOM element
export const getMapInstanceFromElement = (element: Element | null): google.maps.Map | null => {
  if (!element || !window.google?.maps?.Map) return null;
  
  try {
    // Use DOM traversal to find the map instance
    const maps = window.google.maps;
    
    // Access the instances array through the constructor
    // This is a bit hacky but necessary to get the map instance from the DOM
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
    if (mapRef.current) {
      resolve(mapRef.current);
    } else {
      console.warn('Map element not ready');
      reject(new Error('Map element not ready'));
    }
  });
}

// Function to create or get a map instance
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
      return existingMap;
    }
    
    // Otherwise create a new map
    const newMap = new window.google.maps.Map(element, options);
    console.log("Created new map instance", instanceId);
    
    // Trigger resize events to ensure proper rendering
    setTimeout(() => {
      window.google.maps.event.trigger(newMap, 'resize');
    }, 100);
    
    return newMap;
  } catch (error) {
    console.error('Error creating map:', error);
    return null;
  }
}
