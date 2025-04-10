
import { useRef } from 'react';
import useMapInitialization from './map/useMapInitialization';
import useDirectionsRenderer from './map/useDirectionsRenderer';
import { calculateRouteWithDirections, generateRouteLink } from './map/useRouteCalculation';

export const useGoogleMaps = (mapRef: React.RefObject<HTMLDivElement>, isReloadingMap: boolean) => {
  // Use the map initialization hook
  const {
    map,
    mapInitError,
    setMapInitError,
    mapInitAttempts
  } = useMapInitialization({ mapRef, isReloadingMap });

  // Use directions renderer hook
  const { directionsRenderer } = useDirectionsRenderer({ map });

  // Calculate route with directions
  const handleCalculateRoute = (
    origin: google.maps.LatLngLiteral,
    destination: google.maps.LatLngLiteral,
    intermediateStops: Array<{
      id: string;
      placeName: string;
      location: google.maps.LatLngLiteral;
    }>,
    onSuccess: (distance: number, duration: string) => void,
    onError: () => void
  ) => {
    // Make sure the map is properly sized before calculating the route
    if (map && window.google && window.google.maps) {
      window.google.maps.event.trigger(map, 'resize');
    }

    calculateRouteWithDirections({
      origin,
      destination,
      intermediateStops,
      directionsRenderer,
      onSuccess,
      onError
    });
  };

  return {
    map,
    directionsRenderer,
    mapInitError,
    setMapInitError,
    calculateRouteWithDirections: handleCalculateRoute,
    generateRouteLink,
    mapInitAttempts
  };
};

export default useGoogleMaps;
