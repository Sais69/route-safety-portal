
// API key para Google Maps
const GOOGLE_MAPS_API_KEY = 'AIzaSyDPQDyeNZRmcqO9t9FodKEZgN-_s1s5Hvg'; // Clave de API actualizada

// Declaración global para el callback de Google Maps
declare global {
  interface Window {
    initGoogleMapsCallback: () => void;
    googleMapsLoaded: boolean; // Flag to track loading status
  }
}

// Función para verificar si Google Maps ya está cargado
export const isGoogleMapsLoaded = (): boolean => {
  return typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined';
};

// Función para cargar el script de Google Maps
export const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Si ya está cargado, resuelve inmediatamente
    if (isGoogleMapsLoaded()) {
      console.log('Google Maps already loaded');
      resolve();
      return;
    }

    // Crear el callback global
    window.initGoogleMapsCallback = () => {
      console.log('Google Maps API initialized');
      window.googleMapsLoaded = true;
      resolve();
    };

    // Eliminar cualquier script de Google Maps que pudiera estar fallando
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Evitar que haya múltiples instancias del callback
    if (window.google && window.google.maps) {
      console.log('Google Maps API already loaded, resolving immediately');
      resolve();
      return;
    }

    // Crear el script con opciones específicas
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMapsCallback&v=quarterly&region=EC&language=es`;
    script.async = true;
    script.defer = true;
    
    // Manejar errores
    script.onerror = (error) => {
      console.error('Error loading Google Maps:', error);
      reject(new Error('Google Maps script failed to load'));
    };

    // Añadir un timeout para detectar problemas de carga
    const timeoutId = setTimeout(() => {
      console.error('Google Maps script load timeout');
      
      // Try loading again with different approach
      const retryScript = document.createElement('script');
      retryScript.id = 'google-maps-script-retry';
      retryScript.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMapsCallback&v=quarterly&region=EC&language=es`;
      retryScript.async = true;
      retryScript.defer = true;
      document.head.appendChild(retryScript);
      
      // Set another timeout for the retry
      setTimeout(() => {
        if (!window.googleMapsLoaded) {
          reject(new Error('Google Maps script load retry failed'));
        }
      }, 10000);
    }, 20000); // Aumentamos el timeout a 20 segundos

    // Cuando se cargue exitosamente, limpiar el timeout
    script.onload = () => {
      clearTimeout(timeoutId);
      // La resolución real se maneja en el callback global
    };

    // Añadir a la página
    document.head.appendChild(script);
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
