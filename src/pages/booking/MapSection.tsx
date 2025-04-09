
import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { toast } from 'sonner';

// Import sub-components
import MapInput from './components/MapInput';
import IntermediateStopInput from './components/IntermediateStopInput';
import StopsList from './components/StopsList';
import MapDisplay from './components/MapDisplay';
import RouteInfo from './components/RouteInfo';

// Import custom hooks
import useGoogleMaps from './hooks/useGoogleMaps';
import useMapMarkers from './hooks/useMapMarkers';
import usePlacesAutocomplete from './hooks/usePlacesAutocomplete';

interface MapSectionProps {
  origin: google.maps.LatLngLiteral | null;
  destination: google.maps.LatLngLiteral | null;
  setOrigin: (origin: google.maps.LatLngLiteral | null) => void;
  setDestination: (destination: google.maps.LatLngLiteral | null) => void;
  originPlace: string;
  destinationPlace: string;
  setOriginPlace: (place: string) => void;
  setDestinationPlace: (place: string) => void;
  intermediateStops: Array<{
    id: string;
    placeName: string;
    location: google.maps.LatLngLiteral;
  }>;
  setIntermediateStops: React.Dispatch<React.SetStateAction<Stop[]>>;
  distance: number;
  setDistance: (distance: number) => void;
  isEditingMarkers: boolean;
  setIsEditingMarkers: (isEditing: boolean) => void;
  calculateRoute: () => void;
  duration?: string;
}

interface Stop {
  id: string;
  placeName: string;
  location: google.maps.LatLngLiteral;
}

const MapSection: React.FC<MapSectionProps> = ({
  origin,
  destination,
  setOrigin,
  setDestination,
  originPlace,
  destinationPlace,
  setOriginPlace,
  setDestinationPlace,
  intermediateStops,
  setIntermediateStops,
  distance,
  setDistance,
  isEditingMarkers,
  setIsEditingMarkers,
  calculateRoute,
  duration
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const newStopInputRef = useRef<HTMLInputElement>(null);
  const { toast: uiToast } = useToast();
  const [isReloadingMap, setIsReloadingMap] = useState(false);

  // Use custom hooks
  const {
    map,
    mapInitError,
    setMapInitError,
    calculateRouteWithDirections,
    mapInitAttempts
  } = useGoogleMaps(mapRef, isReloadingMap);

  const {
    originMarker,
    destinationMarker,
    stopMarkers,
    setStopMarkers,
    updateMarkersForEditing,
    createOrUpdateMarker
  } = useMapMarkers({
    map,
    isEditingMarkers,
    setOrigin,
    setDestination,
    setOriginPlace,
    setDestinationPlace,
    setIntermediateStops
  });

  const {
    newStopName,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    setupPlaceAutocomplete,
    handleNewStopInputChange,
    addIntermediateStop,
    selectSuggestion,
    removeIntermediateStop
  } = usePlacesAutocomplete({
    map,
    createOrUpdateMarker,
    setOrigin,
    setDestination,
    setOriginPlace,
    setDestinationPlace,
    setIntermediateStops
  });

  // Function to reload the map if there are issues
  const handleReloadMap = () => {
    setIsReloadingMap(true);
    setMapInitError(null);
    
    // Clean up markers
    if (originMarker) originMarker.setMap(null);
    if (destinationMarker) destinationMarker.setMap(null);
    stopMarkers.forEach(marker => marker.setMap(null));
    
    // Short timeout to ensure cleanup before recreating
    setTimeout(() => {
      setIsReloadingMap(false);
      toast("Recargando mapa. Por favor espere...");
    }, 500);
  };

  // Toggle marker edit mode
  const toggleMarkerEditMode = () => {
    setIsEditingMarkers(!isEditingMarkers);
    if (!isEditingMarkers) {
      toast("Modo de edición activado. Puedes arrastrar los marcadores para ajustar las ubicaciones.");
      updateMarkersForEditing(true);
    } else {
      updateMarkersForEditing(false);
      toast("Modo de edición desactivado.");
    }
  };

  // Initialize place autocomplete with error handling
  useEffect(() => {
    if (!window.google || !map) return;

    try {
      // Setup autocomplete for origin, destination, and new stop input fields
      if (originInputRef.current) {
        setupPlaceAutocomplete(originInputRef.current, (place) => {
          if (!place.geometry) {
            console.log("Returned place contains no geometry");
            return;
          }
          const location = {
            lat: place.geometry.location!.lat(),
            lng: place.geometry.location!.lng(),
          };
          setOrigin(location);
          setOriginPlace(place.formatted_address || '');
          
          // Create or update origin marker
          createOrUpdateMarker('origin', location, place.formatted_address || 'Origen');
        });
      }

      if (destinationInputRef.current) {
        setupPlaceAutocomplete(destinationInputRef.current, (place) => {
          if (!place.geometry) {
            console.log("Returned place contains no geometry");
            return;
          }
          const location = {
            lat: place.geometry.location!.lat(),
            lng: place.geometry.location!.lng(),
          };
          setDestination(location);
          setDestinationPlace(place.formatted_address || '');
          
          // Create or update destination marker
          createOrUpdateMarker('destination', location, place.formatted_address || 'Destino');
        });
      }
    } catch (error) {
      console.error("Error setting up place autocomplete:", error);
      uiToast({
        title: "Error",
        description: "Error al configurar la búsqueda de lugares",
      });
    }
  }, [map, setOrigin, setOriginPlace, setDestination, setDestinationPlace]);

  // Calculate route on origin or destination change with error handling
  useEffect(() => {
    if (!origin || !destination) return;
    
    // Don't recalculate if map isn't loaded yet, we'll handle this elsewhere
    if (!map) {
      console.log("Map not ready, skipping route calculation");
      return;
    }
    
    // Make sure the map is visible and properly sized before calculating the route
    if (window.google && map) {
      window.google.maps.event.trigger(map, 'resize');
    }
    
    // Slight delay to ensure the map is ready
    const calculateTimer = setTimeout(() => {
      calculateRouteWithDirections(
        origin, 
        destination, 
        intermediateStops,
        (newDistance) => {
          setDistance(newDistance);
          calculateRoute();
          updateMarkers();
        },
        () => {
          uiToast({
            title: "Error al calcular la ruta",
            description: "No se pudo encontrar una ruta con los puntos especificados.",
          });
        }
      );
    }, 200);
    
    return () => clearTimeout(calculateTimer);
  }, [origin, destination, intermediateStops, map]);

  // Update markers after route is calculated
  const updateMarkers = () => {
    // Make sure origin marker exists and is correctly positioned
    if (origin && map) {
      createOrUpdateMarker('origin', origin, originPlace || 'Origen');
    }
    
    // Make sure destination marker exists and is correctly positioned
    if (destination && map) {
      createOrUpdateMarker('destination', destination, destinationPlace || 'Destino');
    }
    
    // Update intermediate stop markers
    if (map) {
      // Clean up old stop markers
      stopMarkers.forEach(marker => marker.setMap(null));
      setStopMarkers([]);
      
      // Create new markers for each stop
      intermediateStops.forEach(stop => {
        createOrUpdateMarker('stop', stop.location, stop.placeName, stop.id);
      });
    }
  };

  return (
    <Card className="glass-card bg-slate-900/50 border-blue-500/20">
      <CardHeader className="border-b border-blue-900/30">
        <CardTitle className="text-white">Seleccione su ruta</CardTitle>
        <CardDescription className="text-gray-400">
          Indique el origen, destino y paradas intermedias de su viaje
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="grid gap-4">
          <MapInput
            id="origin-input"
            placeholder="Origen"
            value={originPlace}
            onChange={setOriginPlace}
            inputRef={originInputRef}
          />
          <MapInput
            id="destination-input"
            placeholder="Destino"
            value={destinationPlace}
            onChange={setDestinationPlace}
            inputRef={destinationInputRef}
          />
        </div>

        <IntermediateStopInput
          value={newStopName}
          onChange={handleNewStopInputChange}
          onAddStop={addIntermediateStop}
          inputRef={newStopInputRef}
          onBlur={() => {
            // Delay hiding suggestions to allow click events on the suggestions
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onFocus={() => {
            if (newStopName.length > 2) {
              setShowSuggestions(true);
            }
          }}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          onSelectSuggestion={selectSuggestion}
        />

        <StopsList
          stops={intermediateStops}
          onRemoveStop={(id) => removeIntermediateStop(id, stopMarkers)}
        />

        <MapDisplay
          mapRef={mapRef}
          isEditingMarkers={isEditingMarkers}
          mapInitError={mapInitError}
          onReloadMap={handleReloadMap}
          onToggleEditMode={toggleMarkerEditMode}
          mapInitAttempts={mapInitAttempts}
        />

        <RouteInfo distance={distance} duration={duration} />
      </CardContent>
    </Card>
  );
};

export default MapSection;
