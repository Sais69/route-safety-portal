
import React from 'react';
import MapInput from './MapInput';
import IntermediateStopInput from './IntermediateStopInput';
import StopsList from './StopsList';

interface MapFormProps {
  originPlace: string;
  destinationPlace: string;
  setOriginPlace: (place: string) => void;
  setDestinationPlace: (place: string) => void;
  newStopName: string;
  onNewStopInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddStop: () => void;
  showSuggestions: boolean;
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  intermediateStops: Array<{
    id: string;
    placeName: string;
    location: google.maps.LatLngLiteral;
  }>;
  onRemoveStop: (id: string) => void;
  originInputRef: React.RefObject<HTMLInputElement>;
  destinationInputRef: React.RefObject<HTMLInputElement>;
  newStopInputRef: React.RefObject<HTMLInputElement>;
  setShowSuggestions: (show: boolean) => void;
}

const MapForm: React.FC<MapFormProps> = ({
  originPlace,
  destinationPlace,
  setOriginPlace,
  setDestinationPlace,
  newStopName,
  onNewStopInputChange,
  onAddStop,
  showSuggestions,
  suggestions,
  onSelectSuggestion,
  intermediateStops,
  onRemoveStop,
  originInputRef,
  destinationInputRef,
  newStopInputRef,
  setShowSuggestions
}) => {
  return (
    <div className="space-y-4">
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
        onChange={onNewStopInputChange}
        onAddStop={onAddStop}
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
        onSelectSuggestion={onSelectSuggestion}
      />

      <StopsList
        stops={intermediateStops}
        onRemoveStop={onRemoveStop}
      />
    </div>
  );
};

export default MapForm;
