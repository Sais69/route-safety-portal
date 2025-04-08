import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, MapPin, Plus, X, RefreshCw } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

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
  const { toast: uiToast } = useToast();
  const [mapInitError, setMapInitError] = useState<string | null>(null);
  const [isReloadingMap, setIsReloadingMap] = useState(false);

  // Initialize map and directions service with error handling
  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    try {
      const mapOptions = {
        center: { lat: -0.1807, lng: -78.4678 }, // Quito, Ecuador
        zoom: 12,
        // Remove mapId to avoid conflicts with styles
        styles: [
          {
            "featureType": "all",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#ffffff"}]
          },
          {
            "featureType": "all",
            "elementType": "labels.text.stroke",
            "stylers": [{"color": "#000000"}, {"lightness": 13}]
          },
          {
            "featureType": "administrative",
            "elementType": "geometry.fill",
            "stylers": [{"color": "#000000"}]
          },
          {
            "featureType": "administrative",
            "elementType": "geometry.stroke",
            "stylers": [{"color": "#144b53"}, {"lightness": 14}, {"weight": 1.4}]
          },
          {
            "featureType": "landscape",
            "elementType": "all",
            "stylers": [{"color": "#08304b"}]
          },
          {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [{"color": "#0c4152"}, {"lightness": 5}]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry.fill",
            "stylers": [{"color": "#000000"}]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [{"color": "#0b434f"}, {"lightness": 25}]
          },
          {
            "featureType": "road.arterial",
            "elementType": "geometry.fill",
            "stylers": [{"color": "#000000"}]
          },
          {
            "featureType": "road.arterial",
            "elementType": "geometry.stroke",
            "stylers": [{"color": "#0b3d51"}, {"lightness": 16}]
          },
          {
            "featureType": "road.local",
            "elementType": "geometry",
            "stylers": [{"color": "#000000"}]
          },
          {
            "featureType": "transit",
            "elementType": "all",
            "stylers": [{"color": "#146474"}]
          },
          {
            "featureType": "water",
            "elementType": "all",
            "stylers": [{"color": "#021019"}]
          }
        ]
      };

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);

      // Add error handling for map initialization
      newMap.addListener('idle', () => {
        console.log('Map is fully loaded and ready');
      });

      newMap.addListener('error', (e: any) => {
        console.error('Map load error:', e);
        setMapInitError('Error cargando el mapa. Intente recargar la página.');
      });

      const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
        map: newMap,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#3b82f6',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });
      
      setDirectionsRenderer(newDirectionsRenderer);
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
      setMapInitError("Error al inicializar el mapa. Por favor, recargue la página.");
      // Fixed toast error - Using just the text instead of object with title/description
      toast("Error al inicializar el mapa. Por favor, recargue la página.");
    }
    
    return () => {
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
    };
  }, [isReloadingMap]); // Add isReloadingMap dependency to allow map reloading

  // Function to reload the map if there are issues
  const handleReloadMap = () => {
    setIsReloadingMap(true);
    setMapInitError(null);
    
    // Remove previous map instance
    if (directionsRenderer) {
      directionsRenderer.setMap(null);
      setDirectionsRenderer(null);
    }
    
    if (map) {
      // @ts-ignore - force clear map
      map.set(null);
      setMap(null);
    }
    
    // Short timeout to ensure cleanup before recreating
    setTimeout(() => {
      setIsReloadingMap(false);
      // Fixed toast error - Using just the text instead of object with title/description
      toast("Recargando mapa. Por favor espere...");
    }, 500);
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
    } catch (error) {
      console.error("Error setting up place autocomplete:", error);
      uiToast({
        title: "Error",
        description: "Error al configurar la búsqueda de lugares",
      });
    }
  }, [map, setOrigin, setOriginPlace, setDestination, setDestinationPlace]);

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

  // Calculate route on origin or destination change with error handling
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
          if (directionsRenderer) {
            directionsRenderer.setDirections(result);
          } else {
            console.error('DirectionsRenderer is not initialized');
            handleReloadMap();
            return;
          }

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
          uiToast({
            title: "Error al calcular la ruta",
            description: "No se pudo encontrar una ruta con los puntos especificados.",
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
        uiToast({
          title: "Error al agregar parada",
          description: "No se pudo encontrar la ubicación especificada.",
        });
      }
    });
  };

  // Remove intermediate stop
  const removeIntermediateStop = (id: string) => {
    setIntermediateStops(prev => prev.filter(stop => stop.id !== id));
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
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-400" />
            <Input
              type="text"
              id="origin-input"
              placeholder="Origen"
              value={originPlace}
              onChange={(e) => setOriginPlace(e.target.value)}
              className="pl-8 bg-slate-800/70 border border-blue-500/30 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              ref={originInputRef}
            />
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-400" />
            <Input
              type="text"
              id="destination-input"
              placeholder="Destino"
              value={destinationPlace}
              onChange={(e) => setDestinationPlace(e.target.value)}
              className="pl-8 bg-slate-800/70 border border-blue-500/30 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              ref={destinationInputRef}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-stop" className="text-blue-400">Parada Intermedia</Label>
          <div className="relative">
            <Input
              type="text"
              id="new-stop"
              placeholder="Añadir parada intermedia"
              value={newStopName}
              onChange={handleNewStopInputChange}
              ref={newStopInputRef}
              className="bg-slate-800/70 border border-blue-500/30 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-800 py-1 shadow-lg ring-1 ring-blue-500 border border-blue-500/30">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className="cursor-pointer px-4 py-2 text-sm hover:bg-blue-900/30 text-gray-300"
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-2">
              <Button 
                type="button" 
                size="sm" 
                onClick={addIntermediateStop}
                className="bg-blue-900/30 text-blue-400 border border-blue-500/30 hover:bg-blue-800/50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir
              </Button>
            </div>
          </div>
        </div>

        {intermediateStops.length > 0 && (
          <div className="space-y-2">
            <Label className="text-blue-400">Paradas Intermedias:</Label>
            <ul className="list-none space-y-1">
              {intermediateStops.map((stop) => (
                <li key={stop.id} className="flex items-center justify-between p-2 bg-slate-800/50 border border-blue-500/20 rounded-md">
                  <span className="text-gray-300 break-words flex-1 mr-2">{stop.placeName}</span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeIntermediateStop(stop.id)}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="h-[400px] rounded-md overflow-hidden border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] relative">
          {mapInitError ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-800/70">
              <div className="text-center p-4">
                <div className="text-red-400 mb-2">{mapInitError}</div>
                <Button 
                  onClick={handleReloadMap}
                  variant="outline"
                  className="border-blue-500/30 text-blue-400"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div ref={mapRef} className="w-full h-full" />
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute top-2 right-2 bg-slate-800/80 border-blue-500/30 text-blue-400 z-10 hover:bg-slate-700"
                onClick={handleReloadMap}
                title="Recargar mapa"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-blue-500/20 rounded-md">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-blue-400" />
            <span className="text-gray-300">Distancia: <strong className="text-white">{distance.toFixed(1)} km</strong></span>
          </div>
          {duration && (
            <div className="flex items-center">
              <span className="text-gray-300">Duración: <strong className="text-white">{duration}</strong></span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MapSection;
