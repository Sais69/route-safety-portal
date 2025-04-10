
import { useState, useEffect } from 'react';

interface UseDirectionsRendererProps {
  map: google.maps.Map | null;
}

export const useDirectionsRenderer = ({ map }: UseDirectionsRendererProps) => {
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  // Create directions renderer when map is available
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true, // Suppress default markers so we can use our own draggable ones
      polylineOptions: {
        strokeColor: '#3b82f6',
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });
    
    setDirectionsRenderer(newDirectionsRenderer);
    console.log("Directions renderer created successfully");
    
    // Place a marker at the center to confirm map is working
    new google.maps.Marker({
      position: map.getCenter() || { lat: -0.1807, lng: -78.4678 },
      map: map,
      title: "Mapa cargado correctamente"
    });
    
    // Cleanup function
    return () => {
      if (newDirectionsRenderer) {
        newDirectionsRenderer.setMap(null);
      }
    };
  }, [map]);

  return { directionsRenderer };
};

export default useDirectionsRenderer;
