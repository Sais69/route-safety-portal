import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [autocompleteOrigin, setAutocompleteOrigin] = useState<google.maps.places.Autocomplete | null>(null);
  const [autocompleteDestination, setAutocompleteDestination] = useState<google.maps.places.Autocomplete | null>(null);
  const [newStopName, setNewStopName] = useState('');
  const { toast } = useToast();

  // Initialize map and autocomplete services
  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    const newMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: -0.1807, lng: -78.4678 }, // Quito, Ecuador
      zoom: 12,
      mapId: 'YOUR_MAP_ID',
    });

    const originInput = document.getElementById('origin-input') as HTMLInputElement;
    const destinationInput = document.getElementById('destination-input') as HTMLInputElement;

    const newAutocompleteOrigin = new window.google.maps.places.Autocomplete(originInput);
    const newAutocompleteDestination = new window.google.maps.places.Autocomplete(destinationInput);

    newAutocompleteOrigin.bindTo('bounds', newMap);
    newAutocompleteDestination.bindTo('bounds', newMap);

    // Bias the Autocomplete object to the user's geographical location,
    // as supplied by the browser's 'navigator.geolocation' object.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geolocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          const circle = new window.google.maps.Circle({
            center: geolocation,
            radius: position.coords.accuracy,
          });
          newAutocompleteOrigin.setBounds(circle.getBounds() || undefined);
          newAutocompleteDestination.setBounds(circle.getBounds() || undefined);
        },
      );
    }

    newAutocompleteOrigin.addListener('place_changed', () => {
      const place = newAutocompleteOrigin.getPlace();
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

    newAutocompleteDestination.addListener('place_changed', () => {
      const place = newAutocompleteDestination.getPlace();
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

    setMap(newMap);
    setAutocompleteOrigin(newAutocompleteOrigin);
    setAutocompleteDestination(newAutocompleteDestination);

    const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({ map: newMap });
    setDirectionsRenderer(newDirectionsRenderer);
  }, []);

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

  // Add intermediate stop
  const addIntermediateStop = () => {
    if (!map || !newStopName) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: newStopName }, (results, status) => {
      if (status === 'OK' && results) {
        const newStopLocation = results[0].geometry.location;
        const newStop: Stop = {
          id: uuidv4(),
          placeName: newStopName,
          location: { lat: newStopLocation.lat(), lng: newStopLocation.lng() },
        };
        setIntermediateStops([...intermediateStops, newStop]);
        setNewStopName(''); // Clear the input field
        calculateRouteWithDirections(origin!, destination!, [...intermediateStops, newStop]);
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
    const updatedStops = intermediateStops.filter((stop) => stop.id !== id);
    setIntermediateStops(updatedStops);
    calculateRouteWithDirections(origin!, destination!, updatedStops);
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
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-stop">Parada Intermedia</Label>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              id="new-stop"
              placeholder="Añadir parada intermedia"
              value={newStopName}
              onChange={(e) => setNewStopName(e.target.value)}
            />
            <Button type="button" size="sm" onClick={addIntermediateStop}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir
            </Button>
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
