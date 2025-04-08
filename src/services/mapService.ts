
// API key para Google Maps
const GOOGLE_MAPS_API_KEY = 'AIzaSyA5xkLLUtITRCM3ii84HL4YYbt2CQ3qGSk'; // Clave de API para desarrollo

// Declaración global para el callback de Google Maps
declare global {
  interface Window {
    initGoogleMapsCallback: () => void;
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
      resolve();
    };

    // Eliminar cualquier script de Google Maps que pudiera estar fallando
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Crear el script
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMapsCallback&v=weekly`;
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
      reject(new Error('Google Maps script load timeout'));
    }, 10000);

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
  
  // Si es un viaje de ida y vuelta, duplicar el costo
  if (roundTrip) {
    totalCost *= 2;
  }
  
  // Aplicar un descuento para distancias largas
  if (distance > 100) {
    totalCost *= 0.9; // 10% de descuento
  }
  
  // Añadir tarifa base
  totalCost += 5;
  
  // Retornar el costo total con 2 decimales y formato de moneda
  return totalCost.toFixed(2);
};
