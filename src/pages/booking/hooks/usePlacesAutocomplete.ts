import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/components/ui/use-toast";
import { Stop } from '../types/map';

interface UsePlacesAutocompleteProps {
  map: google.maps.Map | null;
  createOrUpdateMarker: (type: 'origin' | 'destination' | 'stop', position: google.maps.LatLngLiteral, title: string, stopId?: string) => google.maps.Marker | null;
  setOrigin: (location: google.maps.LatLngLiteral | null) => void;
  setDestination: (location: google.maps.LatLngLiteral | null) => void;
  setOriginPlace: (place: string) => void;
  setDestinationPlace: (place: string) => void;
  setIntermediateStops: React.Dispatch<React.SetStateAction<Stop[]>>;
}

export const usePlacesAutocomplete = ({
  map,
  createOrUpdateMarker,
  setOrigin,
  setDestination,
  setOriginPlace,
  setDestinationPlace,
  setIntermediateStops
}: UsePlacesAutocompleteProps) => {
  const [newStopName, setNewStopName] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast: uiToast } = useToast();

  // Setup place autocomplete for an input element
  const setupPlaceAutocomplete = (
    inputElement: HTMLInputElement, 
    callback: (place: google.maps.places.PlaceResult) => void
  ) => {
    if (!window.google || !map) return;
    
    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
        fields: ['geometry', 'formatted_address', 'name'],
      });
      
      autocomplete.bindTo('bounds', map);
      
      // Bias the autocomplete results towards current map's viewport.
      map.addListener('bounds_changed', () => {
        autocomplete.setBounds(map.getBounds() as google.maps.LatLngBounds);
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        callback(place);
      });
    } catch (error) {
      console.error("Error setting up place autocomplete:", error);
      uiToast({
        title: "Error",
        description: "Error al configurar la búsqueda de lugares",
      });
    }
  };
  
  // Handle input change for new stop field and fetch suggestions
  const handleNewStopInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewStopName(value);
    
    if (value.length > 2) {
      fetchPlaceSuggestions(value);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  // Add new stop
  const addNewStop = (placeName: string, location: google.maps.LatLngLiteral) => {
    const stopId = uuidv4();
    const newStop: Stop = {
      id: stopId,
      placeName,
      location,
    };
    
    setIntermediateStops(prev => [...prev, newStop]);
    setNewStopName('');
    
    // Create a marker for the new stop
    createOrUpdateMarker('stop', location, placeName, stopId);
  };

  // Add intermediate stop with geocoding
  const addIntermediateStop = () => {
    if (!map || !newStopName.trim() || !window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: newStopName }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const newStopLocation = results[0].geometry.location;
        const location = { 
          lat: newStopLocation.lat(), 
          lng: newStopLocation.lng() 
        };
        
        addNewStop(newStopName, location);
        setShowSuggestions(false);
      } else {
        console.error('Geocode was not successful for the following reason: ' + status);
        uiToast({
          title: "Error al agregar parada",
          description: "No se pudo encontrar la ubicación especificada.",
        });
      }
    });
  };
  
  // Fetch place suggestions based on input text
  const fetchPlaceSuggestions = (input: string) => {
    if (!window.google || !map) return;
    
    const service = new window.google.maps.places.AutocompleteService();
    
    service.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: 'ec' }, // Restrict to Ecuador
        types: ['geocode', 'establishment'], // Include both addresses and places
      },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          const placeSuggestions = predictions.map(prediction => prediction.description);
          setSuggestions(placeSuggestions);
        } else {
          setSuggestions([]);
        }
      }
    );
  };

  // Select a suggestion
  const selectSuggestion = (suggestion: string) => {
    setNewStopName(suggestion);
    setShowSuggestions(false);
    
    // Get details for the selected place
    if (map && window.google) {
      const placesService = new window.google.maps.places.PlacesService(map);
      
      placesService.findPlaceFromQuery(
        {
          query: suggestion,
          fields: ['geometry', 'formatted_address', 'name'],
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
            const place = results[0];
            if (place.geometry && place.geometry.location) {
              addNewStop(
                place.formatted_address || place.name || suggestion,
                {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                }
              );
            }
          }
        }
      );
    }
  };

  // Remove intermediate stop
  const removeIntermediateStop = (id: string, stopMarkers: google.maps.Marker[]) => {
    // Find the stop marker and remove it from the map
    const stopToRemove = stopMarkers.find(marker => 
      marker.getTitle() && marker.getTitle()?.includes(
        id
      )
    );
    
    if (stopToRemove) {
      stopToRemove.setMap(null);
    }
    
    // Remove the stop from the state
    setIntermediateStops(prev => prev.filter(stop => stop.id !== id));
  };

  return {
    newStopName,
    setNewStopName,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    setupPlaceAutocomplete,
    handleNewStopInputChange,
    addNewStop,
    addIntermediateStop,
    selectSuggestion,
    removeIntermediateStop
  };
};

export default usePlacesAutocomplete;
