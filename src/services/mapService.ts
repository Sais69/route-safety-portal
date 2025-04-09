// API key para Google Maps
const GOOGLE_MAPS_API_KEY = 'AIzaSyDPQDyeNZRmcqO9t9FodKEZgN-_s1s5Hvg'; // Clave de API actualizada

// Declaración global para el callback de Google Maps
declare global {
  interface Window {
    initGoogleMapsCallback: () => void;
    googleMapsLoaded: boolean; // Flag to track loading status
    googleMapsInitialized: boolean; // Flag to track if the API is fully initialized
    googleMapsError: string | null; // Track any error that occurred
    mapInstances: Map<string, google.maps.Map>; // Track map instances by container ID
  }
}

// Function to check if Google Maps is already loaded
export const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.google !== 'undefined' && 
         typeof window.google.maps !== 'undefined' &&
         window.googleMapsInitialized === true;
};

// Function to load the Google Maps script with better error handling
export const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (isGoogleMapsLoaded()) {
      console.log('Google Maps already loaded and initialized');
      resolve();
      return;
    }
    
    // If the script is already loading, wait for the result
    if (document.getElementById('google-maps-script')) {
      console.log('Google Maps script is already loading, waiting for completion');
      
      // Check every 200ms if the API has loaded
      const checkInterval = setInterval(() => {
        if (window.googleMapsInitialized) {
          clearInterval(checkInterval);
          console.log('Google Maps finished loading while waiting');
          resolve();
        }
        
        if (window.googleMapsError) {
          clearInterval(checkInterval);
          reject(new Error(window.googleMapsError));
        }
      }, 200);
      
      // Set a timeout to avoid waiting indefinitely
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.googleMapsInitialized) {
          window.googleMapsError = 'Timeout while waiting for Google Maps to load';
          reject(new Error(window.googleMapsError));
        }
      }, 20000); // 20 seconds maximum wait
      
      return;
    }

    // Initialize state flags
    window.googleMapsLoaded = false;
    window.googleMapsInitialized = false;
    window.googleMapsError = null;
    
    // Initialize map instances tracking if it doesn't exist
    if (!window.mapInstances) {
      window.mapInstances = new Map();
    }

    // Create the global callback with better error handling
    window.initGoogleMapsCallback = () => {
      console.log('Google Maps API callback executed');
      
      try {
        if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined') {
          throw new Error('Google Maps failed to initialize properly');
        }
        
        window.googleMapsLoaded = true;
        window.googleMapsInitialized = true;
        console.log('Google Maps API successfully initialized');
        resolve();
      } catch (error) {
        console.error('Error in Google Maps initialization:', error);
        window.googleMapsError = error instanceof Error ? error.message : 'Unknown error during Maps initialization';
        reject(new Error(window.googleMapsError));
      }
    };

    // Create the script with better options
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMapsCallback&v=quarterly&region=EC&language=es`;
    script.async = true;
    script.defer = true;
    
    // Handle script loading errors
    script.onerror = (error) => {
      console.error('Error loading Google Maps script:', error);
      window.googleMapsError = 'Failed to load Google Maps script';
      reject(new Error('Google Maps script failed to load'));
    };

    // Add a timeout to detect loading problems
    const timeoutId = setTimeout(() => {
      console.error('Google Maps script load timeout');
      window.googleMapsError = 'Google Maps script load timeout';
      
      // Don't try to reload automatically, instead we'll show an error to the user
      reject(new Error('Google Maps script load timeout after 20s'));
    }, 20000); // 20 seconds timeout

    // When successfully loaded, clear the timeout
    script.onload = () => {
      console.log('Google Maps script tag loaded');
      clearTimeout(timeoutId);
      // Resolution is handled in the global callback
    };

    // Add to the page
    document.head.appendChild(script);
  });
};

// Function to check DOM element status before interacting with the map
export const ensureMapElementReady = (mapRef: React.RefObject<HTMLDivElement>): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (mapRef.current) {
      // If the element already exists, verify it has dimensions
      const rect = mapRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        resolve();
        return;
      }
    }
    
    // If the element doesn't exist or has no dimensions, wait a bit
    let attempts = 0;
    const maxAttempts = 20; // Increase from 10 to 20 attempts
    const checkElement = setInterval(() => {
      attempts++;
      
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          clearInterval(checkElement);
          console.log(`Map container element is ready after ${attempts} attempts`);
          resolve();
          return;
        }
      }
      
      // Give up after several attempts
      if (attempts >= maxAttempts) {
        clearInterval(checkElement);
        reject(new Error('Map container element not ready after multiple attempts'));
      }
    }, 200); // Check every 200ms
  });
};

// Function to properly register and initialize a map instance
export const createOrGetMapInstance = (
  mapRef: React.RefObject<HTMLDivElement>, 
  options: google.maps.MapOptions,
  instanceId: string = 'default'
): Promise<google.maps.Map> => {
  return new Promise((resolve, reject) => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      reject(new Error('Map container or Google Maps API not available'));
      return;
    }
    
    // Check if we already have this map instance
    if (window.mapInstances && window.mapInstances.has(instanceId)) {
      const existingMap = window.mapInstances.get(instanceId);
      if (existingMap) {
        // Force resize to ensure proper rendering
        setTimeout(() => {
          window.google.maps.event.trigger(existingMap, 'resize');
          resolve(existingMap);
        }, 100);
        return;
      }
    }
    
    try {
      // Create new map instance
      const map = new window.google.maps.Map(mapRef.current, options);
      
      // Store the instance
      if (!window.mapInstances) window.mapInstances = new Map();
      window.mapInstances.set(instanceId, map);
      
      // Add event listener for when map is fully loaded
      window.google.maps.event.addListenerOnce(map, 'idle', () => {
        console.log(`Map ${instanceId} is fully loaded and ready`);
        resolve(map);
      });
      
      // Safety timeout in case 'idle' event doesn't fire
      setTimeout(() => {
        if (!window.mapInstances.has(instanceId)) {
          reject(new Error('Map initialization timeout'));
        }
      }, 10000);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Función para calcular el costo del viaje
export const calculateCost = (vehicleType: string, distance: number, roundTrip: boolean): string => {
  // Establecer tarifas por kilómetro según tipo de vehículo - solo para cálculo interno
  const ratePerKm = {
    furgoneta: 0.89,
    microbus: 1.29,
    bus: 1.69
  };

  // Obtener la tarifa por kilómetro para el tipo de vehículo seleccionado
  const rate = ratePerKm[vehicleType as keyof typeof ratePerKm] || 1.00;
  
  // Calcular el costo total
  let totalCost = rate * distance;
  
  // Si es un viaje de ida y vuelta, duplicar el costo y aplicar descuento
  if (roundTrip) {
    totalCost *= 2;
    totalCost *= 0.9; // 10% de descuento para ida y vuelta
  }
  
  // Añadir tarifa base
  totalCost += 5;
  
  // Retornar el costo total con 2 decimales y formato de moneda
  return totalCost.toFixed(2);
};

// Función para calcular la ruta de vuelta (desde destino a origen)
export const calculateReturnRoute = async (
  destination: google.maps.LatLngLiteral,
  origin: google.maps.LatLngLiteral,
  intermediateStops: Array<{
    id: string;
    placeName: string;
    location: google.maps.LatLngLiteral;
  }> = []
): Promise<{
  distance: number;
  duration: string;
}> => {
  return new Promise((resolve, reject) => {
    if (!window.google || !destination || !origin) {
      reject(new Error('Google Maps no está disponible o faltan punto de origen/destino'));
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    // Para la vuelta, invertimos el orden de las paradas intermedias
    const reverseStops = [...intermediateStops].reverse();
    const waypoints = reverseStops.map((stop) => ({
      location: stop.location,
      stopover: true,
    }));

    directionsService.route(
      {
        origin: destination, // El destino original es ahora el origen
        destination: origin, // El origen original es ahora el destino
        waypoints: waypoints,
        optimizeWaypoints: false,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          // Calcular distancia total
          let totalDistance = 0;
          let totalDuration = 0;
          const legs = result.routes[0].legs;
          
          for (let i = 0; i < legs.length; i++) {
            totalDistance += legs[i].distance.value;
            totalDuration += legs[i].duration?.value || 0;
          }
          
          // Formatear duración
          const hours = Math.floor(totalDuration / 3600);
          const minutes = Math.floor((totalDuration % 3600) / 60);
          const formattedDuration = `${hours}h ${minutes}m`;
          
          // Convertir metros a kilómetros
          const distanceInKm = totalDistance / 1000;
          
          resolve({
            distance: distanceInKm,
            duration: formattedDuration
          });
        } else {
          reject(new Error(`Error al calcular la ruta de retorno: ${status}`));
        }
      }
    );
  });
};
