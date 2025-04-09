
// API key para Google Maps
const GOOGLE_MAPS_API_KEY = 'AIzaSyDPQDyeNZRmcqO9t9FodKEZgN-_s1s5Hvg'; // Clave de API actualizada

// Declaración global para el callback de Google Maps
declare global {
  interface Window {
    initGoogleMapsCallback: () => void;
    googleMapsLoaded: boolean; // Flag to track loading status
    googleMapsInitialized: boolean; // Flag to track if the API is fully initialized
    googleMapsError: string | null; // Track any error that occurred
  }
}

// Función para verificar si Google Maps ya está cargado
export const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.google !== 'undefined' && 
         typeof window.google.maps !== 'undefined' &&
         window.googleMapsInitialized === true;
};

// Función para cargar el script de Google Maps con mejor manejo de errores
export const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Si ya está cargado, resuelve inmediatamente
    if (isGoogleMapsLoaded()) {
      console.log('Google Maps already loaded and initialized');
      resolve();
      return;
    }
    
    // Si el script ya está cargándose, espera el resultado
    if (document.getElementById('google-maps-script')) {
      console.log('Google Maps script is already loading, waiting for completion');
      
      // Comprueba cada 200ms si la API se ha cargado
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
      
      // Establecer un límite de tiempo para evitar esperar indefinidamente
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.googleMapsInitialized) {
          window.googleMapsError = 'Timeout while waiting for Google Maps to load';
          reject(new Error(window.googleMapsError));
        }
      }, 20000); // 20 segundos máximo de espera
      
      return;
    }

    // Inicializar flags de estado
    window.googleMapsLoaded = false;
    window.googleMapsInitialized = false;
    window.googleMapsError = null;

    // Crear el callback global con mejor gestión de errores
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

    // Crear el script con mejores opciones
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMapsCallback&v=quarterly&region=EC&language=es`;
    script.async = true;
    script.defer = true;
    
    // Manejar errores de carga del script
    script.onerror = (error) => {
      console.error('Error loading Google Maps script:', error);
      window.googleMapsError = 'Failed to load Google Maps script';
      reject(new Error('Google Maps script failed to load'));
    };

    // Añadir un timeout para detectar problemas de carga
    const timeoutId = setTimeout(() => {
      console.error('Google Maps script load timeout');
      window.googleMapsError = 'Google Maps script load timeout';
      
      // No intentamos recargar automáticamente, en su lugar mostraremos un error al usuario
      reject(new Error('Google Maps script load timeout after 20s'));
    }, 20000); // 20 segundos de timeout

    // Cuando se cargue exitosamente, limpiar el timeout
    script.onload = () => {
      console.log('Google Maps script tag loaded');
      clearTimeout(timeoutId);
      // La resolución se maneja en el callback global
    };

    // Añadir a la página
    document.head.appendChild(script);
  });
};

// Función para verificar el estado del DOM antes de interactuar con el mapa
export const ensureMapElementReady = (mapRef: React.RefObject<HTMLDivElement>): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (mapRef.current) {
      // Si el elemento ya existe, verificar que tenga dimensiones
      const rect = mapRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        resolve();
        return;
      }
    }
    
    // Si el elemento no existe o no tiene dimensiones, esperar un poco
    let attempts = 0;
    const checkElement = setInterval(() => {
      attempts++;
      
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          clearInterval(checkElement);
          resolve();
          return;
        }
      }
      
      // Dar por fallido después de varios intentos
      if (attempts >= 10) {
        clearInterval(checkElement);
        reject(new Error('Map container element not ready after multiple attempts'));
      }
    }, 200); // Comprobar cada 200ms
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
