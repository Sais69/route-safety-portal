
import { toast } from "sonner";

export const calculateDistance = (distance: number): number => {
  // Round to 2 decimal places
  return Math.round(distance * 100) / 100;
};

export const calculateCost = (vehicleType: string, distance: number, roundTrip: boolean): string => {
  try {
    // Base rates per kilometer in dollars - UPDATED VALUES
    const rates = {
      sedan: 0.50,
      suv: 0.65,
      furgoneta: 0.89,
      bus: 1.69,
      microbus: 1.29
    };
    
    // Get the rate for the vehicle type, default to sedan rate if not found
    const rate = rates[vehicleType as keyof typeof rates] || rates.sedan;
    
    // Calculate cost based on distance and vehicle type
    let cost = distance * rate;
    
    // Add 20% for round trip if selected
    if (roundTrip) {
      cost = cost * 1.2;
    }
    
    // Ensure minimum cost
    const minimumCost = 15;
    cost = Math.max(cost, minimumCost);
    
    // Format the cost to two decimal places
    return cost.toFixed(2);
  } catch (error) {
    console.error("Error calculating cost:", error);
    toast.error("Error al calcular el costo del viaje");
    return "0.00";
  }
};

export const calculateReturnRoute = async (
  origin: google.maps.LatLngLiteral, 
  destination: google.maps.LatLngLiteral,
  intermediateStops: Array<{
    id: string;
    placeName: string;
    location: google.maps.LatLngLiteral;
  }>
): Promise<{distance: number, duration: string}> => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.google || !window.google.maps) {
        reject(new Error("Google Maps no está cargado"));
        return;
      }

      const directionsService = new window.google.maps.DirectionsService();
      
      // Prepare waypoints from intermediate stops
      const waypoints = intermediateStops.map((stop) => ({
        location: new google.maps.LatLng(stop.location.lat, stop.location.lng),
        stopover: true,
      }));

      directionsService.route(
        {
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          waypoints: waypoints,
          optimizeWaypoints: false,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            // Calculate total distance
            let totalDistance = 0;
            let totalDuration = 0;

            const route = result.routes[0];
            if (route && route.legs.length > 0) {
              for (let i = 0; i < route.legs.length; i++) {
                totalDistance += route.legs[i].distance?.value || 0;
                totalDuration += route.legs[i].duration?.value || 0;
              }
              
              // Convert distance from meters to kilometers
              totalDistance = totalDistance / 1000;
              
              // Format duration
              const hours = Math.floor(totalDuration / 3600);
              const minutes = Math.floor((totalDuration % 3600) / 60);
              const durationString = `${hours}h ${minutes}m`;
              
              resolve({
                distance: totalDistance,
                duration: durationString
              });
            } else {
              reject(new Error("No se pudo calcular la ruta de retorno"));
            }
          } else {
            reject(new Error(`Error en la solicitud de direcciones: ${status}`));
          }
        }
      );
    } catch (error) {
      console.error("Error calculando ruta de retorno:", error);
      reject(error);
    }
  });
};
