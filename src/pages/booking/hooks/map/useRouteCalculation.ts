
interface CalculateRouteProps {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  intermediateStops: Array<{
    id: string;
    placeName: string;
    location: google.maps.LatLngLiteral;
  }>;
  directionsRenderer: google.maps.DirectionsRenderer | null;
  onSuccess: (distance: number, duration: string) => void;
  onError: () => void;
}

export const calculateRouteWithDirections = ({
  origin,
  destination,
  intermediateStops,
  directionsRenderer,
  onSuccess,
  onError
}: CalculateRouteProps): void => {
  if (!window.google || !origin || !destination || !directionsRenderer) {
    console.error("Cannot calculate route: missing required objects");
    onError();
    return;
  }

  const directionsService = new window.google.maps.DirectionsService();

  // Prepare waypoints from intermediate stops
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
        directionsRenderer.setDirections(result);

        // Calculate total distance and duration
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
        
        // Convert meters to kilometers
        onSuccess(totalDistance / 1000, formattedDuration);
      } else {
        console.error('Directions request failed with status: ', status);
        onError();
      }
    }
  );
};

// Generate Google Maps route link with waypoints
export const generateRouteLink = (origin: string, destination: string, intermediateStops?: Array<{placeName: string}>) => {
  let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
  
  // Add waypoints if there are intermediate stops
  if (intermediateStops && intermediateStops.length > 0) {
    const waypoints = intermediateStops.map(stop => encodeURIComponent(stop.placeName)).join('|');
    url += `&waypoints=${waypoints}`;
  }
  
  return url;
};

export default { calculateRouteWithDirections, generateRouteLink };
