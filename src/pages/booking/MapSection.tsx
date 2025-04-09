
import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Import sub-components
import MapDisplay from './components/MapDisplay';
import RouteInfo from './components/RouteInfo';
import MapForm from './components/MapForm';

// Import custom hooks
import useGoogleMaps from './hooks/useGoogleMaps';
import useMapMarkers from './hooks/useMapMarkers';
import usePlacesAutocomplete from './hooks/usePlacesAutocomplete';
import useMapSection from './hooks/useMapSection';

import { MapSectionProps, Stop } from './types/map';

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
  // Create refs for input elements and map container
  const mapRef = useRef<HTMLDivElement>(null);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const newStopInputRef = useRef<HTMLInputElement>(null);
  
  // State for handling map reloading
  const { isReloadingMap, handleReloadMap, checkApiKey } = useMapSection();

  // Initialize map on component mount
  useEffect(() => {
    // Check if we have a valid API key
    if (!checkApiKey()) {
      console.log("No valid API key found on initial load, attempting to load one");
      handleReloadMap();
    }
  }, []);

  // Use custom hooks
  const {
    map,
    mapInitError,
    setMapInitError,
    calculateRouteWithDirections,
    mapInitAttempts
  } = useGoogleMaps(mapRef, isReloadingMap);

  const {
    updateMarkersForEditing,
    createOrUpdateMarker,
    stopMarkers
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

  // Toggle marker edit mode
  const toggleMarkerEditMode = () => {
    setIsEditingMarkers(!isEditingMarkers);
    updateMarkersForEditing(!isEditingMarkers);
  };

  // Initialize place autocomplete with error handling
  React.useEffect(() => {
    if (!window.google || !map) return;

    try {
      // Setup autocomplete for origin and destination inputs
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
    }
  }, [map, setOrigin, setOriginPlace, setDestination, setDestinationPlace]);

  // Calculate route on origin or destination change with error handling
  React.useEffect(() => {
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
          console.error("Error calculating route");
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
        <MapForm
          originPlace={originPlace}
          destinationPlace={destinationPlace}
          setOriginPlace={setOriginPlace}
          setDestinationPlace={setDestinationPlace}
          newStopName={newStopName}
          onNewStopInputChange={handleNewStopInputChange}
          onAddStop={addIntermediateStop}
          showSuggestions={showSuggestions}
          suggestions={suggestions}
          onSelectSuggestion={selectSuggestion}
          intermediateStops={intermediateStops}
          onRemoveStop={(id) => removeIntermediateStop(id, stopMarkers)}
          originInputRef={originInputRef}
          destinationInputRef={destinationInputRef}
          newStopInputRef={newStopInputRef}
          setShowSuggestions={setShowSuggestions}
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
