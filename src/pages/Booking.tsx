
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Clock, MapPin, Plus, Minus, Edit2, Bus, Trash } from 'lucide-react';
import { loadGoogleMapsScript, calculateCost, GOOGLE_MAPS_API_KEY } from '@/services/mapService';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Add external dependency for drag and drop
<lov-add-dependency>react-beautiful-dnd@^13.1.1</lov-add-dependency>

interface Stop {
  id: string;
  placeName: string;
  location: google.maps.LatLngLiteral;
}

const Booking = () => {
  // Map related states
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const [origin, setOrigin] = useState<google.maps.LatLngLiteral | null>(null);
  const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null);
  const [originPlace, setOriginPlace] = useState('');
  const [destinationPlace, setDestinationPlace] = useState('');
  const [distance, setDistance] = useState<number>(0);
  const [isEditingMarkers, setIsEditingMarkers] = useState(false);
  const [intermediateStops, setIntermediateStops] = useState<Stop[]>([]);

  // Form related states
  const [vehicleType, setVehicleType] = useState('furgoneta');
  const [roundTrip, setRoundTrip] = useState(false);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(new Date());
  const [departureTime, setDepartureTime] = useState('08:00');
  const [returnDate, setReturnDate] = useState<Date | undefined>(new Date());
  const [returnTime, setReturnTime] = useState('18:00');
  const [totalCost, setTotalCost] = useState('0');

  // Load Google Maps API
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

  // Initialize map
  const initMap = () => {
    if (!mapRef.current || !window.google) return;

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

  // Initialize autocomplete for origin and destination inputs
  const initAutocomplete = () => {
    if (!window.google || !originInputRef.current || !destinationInputRef.current) return;

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

  // Update route when origin, destination, or intermediate stops change
  useEffect(() => {
    if (origin && destination) {
      calculateRoute();
    }
  }, [origin, destination, intermediateStops, isEditingMarkers]);

  // Update drag and drop behavior for marker editing
  useEffect(() => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setOptions({
        draggable: isEditingMarkers,
      });
    }
  }, [isEditingMarkers]);

  // Calculate route using Google Directions API
  const calculateRoute = useCallback(() => {
    if (!directionsServiceRef.current || !directionsRendererRef.current || !origin || !destination) return;

    // Prepare waypoints from intermediate stops
    const waypoints = intermediateStops.map((stop) => ({
      location: stop.location,
      stopover: true,
    }));

    directionsServiceRef.current.route(
      {
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        optimizeWaypoints: false,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRendererRef.current?.setDirections(result);
          updateRouteDetails(result);
        } else {
          toast.error('No se pudo calcular la ruta. Por favor, verifique los puntos de origen y destino.');
        }
      }
    );
  }, [origin, destination, intermediateStops]);

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
    
    // Calculate cost based on vehicle type and distance
    const cost = calculateCost(vehicleType, distanceInKm, roundTrip);
    setTotalCost(cost);
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
    if (input && window.google) {
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

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!origin || !destination) {
      toast.error('Por favor, seleccione un origen y destino válidos');
      return;
    }
    
    if (!departureDate || !departureTime) {
      toast.error('Por favor, seleccione una fecha y hora de salida');
      return;
    }
    
    if (roundTrip && (!returnDate || !returnTime)) {
      toast.error('Por favor, seleccione una fecha y hora de retorno');
      return;
    }
    
    // Simulate booking submission
    toast.success('¡Reserva realizada con éxito!');
    
    // Log booking details
    console.log({
      origin: originPlace,
      destination: destinationPlace,
      intermediateStops,
      vehicleType,
      roundTrip,
      departureDate,
      departureTime,
      returnDate: roundTrip ? returnDate : null,
      returnTime: roundTrip ? returnTime : null,
      distance,
      totalCost
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation header */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Bus size={24} className="text-primary" />
            <h1 className="text-xl font-bold">RouteSafety</h1>
          </Link>
          <nav>
            <Link to="/" className="text-gray-600 hover:text-primary">
              Cerrar sesión
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Reservar un viaje</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map and route section */}
          <div className="lg:col-span-2 space-y-6">
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
                <div className="map-container" ref={mapRef}></div>
                
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">Distancia total:</span> {distance.toFixed(1)} km
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Booking form section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la reserva</CardTitle>
                <CardDescription>
                  Complete la información necesaria para su viaje
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Vehicle selection */}
                  <div className="space-y-3">
                    <Label>Tipo de vehículo</Label>
                    <RadioGroup 
                      value={vehicleType} 
                      onValueChange={setVehicleType} 
                      className="grid grid-cols-1 gap-3"
                    >
                      <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="furgoneta" id="furgoneta" />
                        <Label htmlFor="furgoneta" className="flex-1 cursor-pointer">
                          <div>Furgoneta</div>
                          <div className="text-sm text-gray-500">17 pasajeros - $0.8/km</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="microbus" id="microbus" />
                        <Label htmlFor="microbus" className="flex-1 cursor-pointer">
                          <div>Microbús</div>
                          <div className="text-sm text-gray-500">28 pasajeros - $1.1/km</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="bus" id="bus" />
                        <Label htmlFor="bus" className="flex-1 cursor-pointer">
                          <div>Bus</div>
                          <div className="text-sm text-gray-500">40 pasajeros - $1.5/km</div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Round trip toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="roundtrip">Ida y vuelta</Label>
                    <Switch 
                      id="roundtrip" 
                      checked={roundTrip}
                      onCheckedChange={setRoundTrip}
                    />
                  </div>
                  
                  <Separator />
                  
                  {/* Date and time selection */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Fecha y hora</h3>
                    
                    <div className="space-y-3">
                      <Label>Fecha de salida</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {departureDate ? format(departureDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={departureDate}
                            onSelect={setDepartureDate}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>

                      <div className="space-y-2">
                        <Label htmlFor="departureTime">Hora de salida</Label>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-gray-500" />
                          <Input
                            id="departureTime"
                            type="time"
                            value={departureTime}
                            onChange={(e) => setDepartureTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {roundTrip && (
                      <div className="space-y-3 fade-in">
                        <Label>Fecha de retorno</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {returnDate ? format(returnDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={returnDate}
                              onSelect={setReturnDate}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>

                        <div className="space-y-2">
                          <Label htmlFor="returnTime">Hora de retorno</Label>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-gray-500" />
                            <Input
                              id="returnTime"
                              type="time"
                              value={returnTime}
                              onChange={(e) => setReturnTime(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Cost summary */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Distancia:</span>
                      <span>{distance.toFixed(1)} km</span>
                    </div>
                    {roundTrip && (
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Ida y vuelta:</span>
                        <span>x2</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-medium text-lg">
                      <span>Costo total:</span>
                      <span>${totalCost}</span>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full animated-button">
                    Confirmar reserva
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Booking;
