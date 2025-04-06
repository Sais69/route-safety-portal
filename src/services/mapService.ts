
// Google Maps API key
export const GOOGLE_MAPS_API_KEY = "AIzaSyDPQDyeNZRmcqO9t9FodKEZgN-_s1s5Hvg";

// Check if Google Maps API is loaded
export const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' && 
         window.google !== undefined && 
         window.google.maps !== undefined;
};

// Load Google Maps API script
export const loadGoogleMapsScript = () => {
  if (isGoogleMapsLoaded()) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps API'));
    document.head.appendChild(script);
  });
};

// Function to calculate the cost based on vehicle type and distance
export const calculateCost = (vehicleType: string, distanceInKm: number, roundTrip: boolean = false) => {
  let baseCost: number;

  switch (vehicleType) {
    case 'furgoneta':
      baseCost = 80 + (distanceInKm * 0.5);
      break;
    case 'microbus':
      baseCost = 120 + (distanceInKm * 0.7);
      break;
    case 'bus':
      baseCost = 160 + (distanceInKm * 0.9);
      break;
    default:
      baseCost = 80 + (distanceInKm * 0.5);
  }
  
  if (roundTrip) {
    baseCost *= 1.8; // 20% discount for round trips
  }

  return baseCost.toFixed(2);
};

// Helper function to format the date for display
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper function to format the time for display
export const formatTime = (date: Date): string => {
  return date.toTimeString().split(' ')[0].substring(0, 5);
};

// Get Ecuadorian default coordinates
export const getDefaultCoordinates = () => {
  return { lat: -0.1807, lng: -78.4678 }; // Quito, Ecuador
};
