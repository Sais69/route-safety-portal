
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Edit2, MapPin, Plus, Trash } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { loadGoogleMapsScript, isGoogleMapsLoaded } from '@/services/mapService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// Removing the import that was causing the error
// The types are globally available from the types/google-maps.d.ts file

interface Stop {
  id: string;
  placeName: string;
  location: google.maps.LatLngLiteral;
}

interface MapSectionProps {
  origin: google.maps.LatLngLiteral | null;
  destination: google.maps.LatLngLiteral | null;
  setOrigin: (origin: google.maps.LatLngLiteral) => void;
  setDestination: (destination: google.maps.LatLngLiteral) => void;
  originPlace: string;
  destinationPlace: string;
  setOriginPlace: (place: string) => void;
  setDestinationPlace: (place: string) => void;
  intermediateStops: Stop[];
  setIntermediateStops: (stops: Stop[]) => void;
  distance: number;
  setDistance: (distance: number) => void;
  isEditingMarkers: boolean;
  setIsEditingMarkers: (isEditing: boolean) => void;
  calculateRoute: () => void;
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
  calculateRoute
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);

  // Initialize map
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        initMap();
      })
      .catch((error) => {
        console.error('Error loading Google Maps API:', error);
        toast.error('Error al cargar el mapa. Por favor, inténtelo de nuevo más tarde.');
      });
  }, []);

  // Update route when origin, destination, or intermediate stops change
  useEffect(() => {
    if (origin && destination) {
      calculateRoute();
    }
  }, [origin, destination, intermediateStops, isEditingMarkers, calculateRoute]);

  // Update drag and drop behavior for marker editing
  useEffect(() => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setOptions({
        draggable: isEditingMarkers,
      });
    }
  }, [isEditingMarkers]);

  const initMap = () => {
    if (!mapRef.current || !isGoogleMapsLoaded()) return;

    // Create map instance
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: 40.4167, lng: -3.7033 }, // Madrid, Spain as default center
      zoom: 13,
      mapTypeControl: false,
    });
    mapInstanceRef.current = mapInstance;

    // Create directions service and renderer
    const directionsService = new window.google.maps.DirectionsService();
    directionsServiceRef.current = directionsService;

    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      draggable: isEditingMarkers,
      map: mapInstance,
    });
    directionsRendererRef.current = directionsRenderer;

    directionsRenderer.addListener('directions_changed', () => {
      if (directionsRendererRef.current) {
        const result = directionsRendererRef.current.getDirections();
        if (result) {
          updateRouteDetails(result);
        }
      }
    });

    // Initialize autocomplete for origin and destination inputs
    initAutocomplete();
  };

  const initAutocomplete = () => {
    if (!isGoogleMapsLoaded() || !originInputRef.current || !destinationInputRef.current) return;

    const originAutocomplete = new window.google.maps.places.Autocomplete(originInputRef.current);
    originAutocomplete.addListener('place_changed', () => {
      const place = originAutocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        setOrigin({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
        setOriginPlace(place.formatted_address || '');
      }
    });

    const destinationAutocomplete = new window.google.maps.places.Autocomplete(destinationInputRef.current);
    destinationAutocomplete.addListener('place_changed', () => {
      const place = destinationAutocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        setDestination({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
        setDestinationPlace(place.formatted_address || '');
      }
    });
  };

  // Update route details after directions are calculated
  const updateRouteDetails = (result: google.maps.DirectionsResult) => {
    let totalDistance = 0;

    // Calculate total distance
    if (result.routes.length > 0) {
      const route = result.routes[0];
      if (route.legs.length > 0) {
        route.legs.forEach((leg) => {
          totalDistance += leg.distance?.value || 0;
        });
      }
    }

    // Convert meters to kilometers
    const distanceInKm = totalDistance / 1000;
    setDistance(distanceInKm);
  };

  // Add intermediate stop
  const addIntermediateStop = () => {
    if (intermediateStops.length >= 5) {
      toast.warning('Ya ha añadido el máximo de paradas intermedias (5)');
      return;
    }

    setIntermediateStops([
      ...intermediateStops,
      { 
        id: `stop-${Date.now()}`, 
        placeName: `Parada ${intermediateStops.length + 1}`,
        location: {
          lat: origin ? origin.lat + (Math.random() * 0.01) : 40.4167,
          lng: origin ? origin.lng + (Math.random() * 0.01) : -3.7033
        }
      }
    ]);
  };

  // Remove intermediate stop
  const removeIntermediateStop = (id: string) => {
    setIntermediateStops(intermediateStops.filter((stop) => stop.id !== id));
  };

  // Handle stop input change
  const handleStopChange = (id: string, placeName: string, index: number) => {
    setIntermediateStops(
      intermediateStops.map((stop) =>
        stop.id === id ? { ...stop, placeName } : stop
      )
    );

    // Create an autocomplete instance for this input
    const input = document.getElementById(`stop-${id}`) as HTMLInputElement;
    if (input && isGoogleMapsLoaded()) {
      const autocomplete = new window.google.maps.places.Autocomplete(input);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          setIntermediateStops(
            intermediateStops.map((stop) =>
              stop.id === id
                ? {
                    ...stop,
                    placeName: place.formatted_address || placeName,
                    location: {
                      lat: place.geometry.location.lat(),
                      lng: place.geometry.location.lng(),
                    },
                  }
                : stop
            )
          );
        }
      });
    }
  };

  // Handle reordering of stops via drag and drop
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(intermediateStops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setIntermediateStops(items);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Configurar ruta</span>
          <Button 
            variant={isEditingMarkers ? "default" : "outline"} 
            size="sm" 
            onClick={() => setIsEditingMarkers(!isEditingMarkers)}
            className="flex items-center space-x-2"
          >
            <Edit2 size={16} />
            <span>{isEditingMarkers ? 'Terminar edición' : 'Editar marcadores'}</span>
          </Button>
        </CardTitle>
        <CardDescription>
          Seleccione los puntos de origen y destino, y añada paradas intermedias si lo desea
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="origin" className="flex items-center">
              <MapPin size={16} className="mr-2 text-primary" />
              Origen
            </Label>
            <Input 
              id="origin" 
              placeholder="Ingrese punto de origen" 
              ref={originInputRef}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination" className="flex items-center">
              <MapPin size={16} className="mr-2 text-primary" />
              Destino
            </Label>
            <Input 
              id="destination" 
              placeholder="Ingrese punto de destino"
              ref={destinationInputRef}
            />
          </div>
        </div>
        
        {/* Intermediate stops */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <Label className="flex items-center">
              <MapPin size={16} className="mr-2 text-primary" />
              Paradas intermedias
            </Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addIntermediateStop}
              className="flex items-center"
              disabled={intermediateStops.length >= 5}
            >
              <Plus size={16} className="mr-1" />
              Añadir parada
            </Button>
          </div>
          
          {intermediateStops.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="stops">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {intermediateStops.map((stop, index) => (
                      <Draggable key={stop.id} draggableId={stop.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center space-x-2"
                          >
                            <div className="stop-badge">{index + 1}</div>
                            <Input
                              id={`stop-${stop.id}`}
                              value={stop.placeName}
                              onChange={(e) => handleStopChange(stop.id, e.target.value, index)}
                              placeholder={`Parada ${index + 1}`}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeIntermediateStop(stop.id)}
                              className="text-destructive"
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <p className="text-sm text-gray-500 italic">No hay paradas intermedias</p>
          )}
        </div>
        
        {/* Map */}
        <div 
          className="map-container w-full h-[400px] border rounded-lg overflow-hidden shadow"
          ref={mapRef}
        ></div>
        
        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="font-medium">Distancia total:</span> {distance.toFixed(1)} km
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapSection;
