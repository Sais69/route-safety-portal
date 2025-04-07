
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, MapPin, Plus, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from 'uuid';

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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [newStopName, setNewStopName] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const newStopInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize map and directions service
  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    const newMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: -0.1807, lng: -78.4678 }, // Quito, Ecuador
      zoom: 12,
      mapId: 'YOUR_MAP_ID',
    });

    setMap(newMap);

    const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({ map: newMap });
    setDirectionsRenderer(newDirectionsRenderer);
    
    return () => {
      newDirectionsRenderer.setMap(null);
    };
  }, []);

  // Initialize place autocomplete
  useEffect(() => {
    if (!window.google || !map) return;

    // Setup autocomplete for origin, destination, and new stop input fields
    if (originInputRef.current) {
      setupPlaceAutocomplete(originInputRef.current, (place) => {
        if (!place.geometry) {
          console.log("Returned place contains no geometry");
          return;
        }
        setOrigin({
          lat: place.geometry.location!.lat(),
          lng: place.geometry.location!.lng(),
        });
        setOriginPlace(place.formatted_address || '');
      });
    }

    if (destinationInputRef.current) {
      setupPlaceAutocomplete(destinationInputRef.current, (place) => {
        if (!place.geometry) {
          console.log("Returned place contains no geometry");
          return;
        }
        setDestination({
          lat: place.geometry.location!.lat(),
          lng: place.geometry.location!.lng(),
        });
        setDestinationPlace(place.formatted_address || '');
      });
    }
    
    if (newStopInputRef.current) {
      setupPlaceAutocomplete(newStopInputRef.current, (place) => {
        if (!place.geometry) return;
        
        // Add the selected place as a stop
        addNewStop(
          place.formatted_address || place.name || '',
          {
            lat: place.geometry.location!.lat(),
            lng: place.geometry.location!.lng(),
          }
        );
        setNewStopName('');
      });
    }
    
  }, [map]);

  // Setup place autocomplete for an input element
  const setupPlaceAutocomplete = (
    inputElement: HTMLInputElement, 
    callback: (place: google.maps.places.PlaceResult) => void
  ) => {
    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
        fields: ['geometry', 'formatted_address', 'name'],
      });
      
      if (map) {
        autocomplete.bindTo('bounds', map);
      }
      
      // Bias the autocomplete results towards current map's viewport.
      map?.addListener('bounds_changed', () => {
        autocomplete.setBounds(map.getBounds() as google.maps.LatLngBounds);
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        callback(place);
      });
    } catch (error) {
      console.error("Error setting up place autocomplete:", error);
    }
  };

  // Calculate route on origin or destination change
  useEffect(() => {
    if (origin && destination) {
      calculateRouteWithDirections(origin, destination, intermediateStops);
    }
  }, [origin, destination, intermediateStops]);

  const calculateRouteWithDirections = (
    origin: google.maps.LatLngLiteral,
    destination: google.maps.LatLngLiteral,
    intermediateStops: Array<{
      id: string;
      placeName: string;
      location: google.maps.LatLngLiteral;
    }>
  ) => {
    if (!window.google || !origin || !destination) return;

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
          directionsRenderer?.setDirections(result);

          // Calculate total distance
          let totalDistance = 0;
          const legs = result.routes[0].legs;
          for (let i = 0; i < legs.length; i++) {
            totalDistance += legs[i].distance.value;
          }
          // Convert meters to kilometers
          setDistance(totalDistance / 1000);
          calculateRoute();
        } else {
          console.error('Directions request failed with status: ', status);
          toast({
            title: "Error al calcular la ruta",
            description: "No se pudo encontrar una ruta con los puntos especificados.",
            duration: 3000,
          });
        }
      }
    );
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
    if (map) {
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
              setNewStopName('');
            }
          }
        }
      );
    }
  };

  // Add new stop
  const addNewStop = (placeName: string, location: google.maps.LatLngLiteral) => {
    const newStop: Stop = {
      id: uuidv4(),
      placeName,
      location,
    };
    
    setIntermediateStops(prev => [...prev, newStop]);
    setNewStopName('');
  };

  // Add intermediate stop with geocoding
  const addIntermediateStop = () => {
    if (!map || !newStopName.trim()) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: newStopName }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const newStopLocation = results[0].geometry.location;
        const newStop: Stop = {
          id: uuidv4(),
          placeName: newStopName,
          location: { lat: newStopLocation.lat(), lng: newStopLocation.lng() },
        };
        setIntermediateStops(prev => [...prev, newStop]);
        setNewStopName('');
        setShowSuggestions(false);
      } else {
        console.error('Geocode was not successful for the following reason: ' + status);
        toast({
          title: "Error al agregar parada",
          description: "No se pudo encontrar la ubicación especificada.",
          duration: 3000,
        });
      }
    });
  };

  // Remove intermediate stop
  const removeIntermediateStop = (id: string) => {
    setIntermediateStops(prev => prev.filter(stop => stop.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seleccione su ruta</CardTitle>
        <CardDescription>
          Indique el origen, destino y paradas intermedias de su viaje
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              id="origin-input"
              placeholder="Origen"
              value={originPlace}
              onChange={(e) => setOriginPlace(e.target.value)}
              className="pl-8"
              ref={originInputRef}
            />
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              id="destination-input"
              placeholder="Destino"
              value={destinationPlace}
              onChange={(e) => setDestinationPlace(e.target.value)}
              className="pl-8"
              ref={destinationInputRef}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-stop">Parada Intermedia</Label>
          <div className="relative">
            <Input
              type="text"
              id="new-stop"
              placeholder="Añadir parada intermedia"
              value={newStopName}
              onChange={handleNewStopInputChange}
              ref={newStopInputRef}
              onBlur={() => {
                // Delay hiding suggestions to allow click events on the suggestions
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              onFocus={() => {
                if (newStopName.length > 2) {
                  setShowSuggestions(true);
                }
              }}
            />
            
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-2">
              <Button type="button" size="sm" onClick={addIntermediateStop}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir
              </Button>
            </div>
          </div>
        </div>

        {intermediateStops.length > 0 && (
          <div className="space-y-2">
            <Label>Paradas Intermedias:</Label>
            <ul className="list-none space-y-1">
              {intermediateStops.map((stop) => (
                <li key={stop.id} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                  <span>{stop.placeName}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeIntermediateStop(stop.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="h-[400px] rounded-md" ref={mapRef} />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            <span>Distancia: {distance.toFixed(1)} km</span>
          </div>
          {duration && (
            <div className="flex items-center">
              <span>Duración: {duration}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MapSection;
