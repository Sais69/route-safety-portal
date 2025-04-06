
// Google Maps API key
export const GOOGLE_MAPS_API_KEY = "AIzaSyDPQDyeNZRmcqO9t9FodKEZgN-_s1s5Hvg";

// Load Google Maps API script
export const loadGoogleMapsScript = () => {
  if (window.google && window.google.maps) {
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
  let ratePerKm = 0;

  switch (vehicleType) {
    case 'furgoneta':
      ratePerKm = 0.8;
      break;
    case 'microbus':
      ratePerKm = 1.1;
      break;
    case 'bus':
      ratePerKm = 1.5;
      break;
    default:
      ratePerKm = 0.8;
  }

  let cost = distanceInKm * ratePerKm;
  
  if (roundTrip) {
    cost *= 2;
  }

  return cost.toFixed(2);
};

// Helper function to format the date for display
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper function to format the time for display
export const formatTime = (date: Date): string => {
  return date.toTimeString().split(' ')[0].substring(0, 5);
};
