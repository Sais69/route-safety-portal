
import React, { useState, useCallback, useEffect } from 'react';
import { 
  calculateCost, 
  loadGoogleMapsScript, 
  isGoogleMapsLoaded,
  calculateReturnRoute
} from '@/services/mapService';
import BookingHeader from './BookingHeader';
import MapSection from './MapSection';
import { BookingForm } from './BookingForm';
import { toast } from 'sonner';
import { Stop } from './types/map';
import { supabase } from '@/integrations/supabase/client';

const BookingPage: React.FC = () => {
  // Map related states
  const [origin, setOrigin] = useState<google.maps.LatLngLiteral | null>(null);
  const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null);
  const [originPlace, setOriginPlace] = useState('');
  const [destinationPlace, setDestinationPlace] = useState('');
  const [distance, setDistance] = useState<number>(0);
  const [isEditingMarkers, setIsEditingMarkers] = useState(false);
  const [intermediateStops, setIntermediateStops] = useState<Stop[]>([]);
  const [duration, setDuration] = useState<string>('');
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState<number>(0);
  
  // Return trip calculation states
  const [returnDistance, setReturnDistance] = useState<number>(0);
  const [returnDuration, setReturnDuration] = useState<string>('');

  // Form related states
  const [vehicleType, setVehicleType] = useState('furgoneta');
  const [roundTrip, setRoundTrip] = useState(false);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(new Date());
  const [departureTime, setDepartureTime] = useState('08:00');
  const [returnDate, setReturnDate] = useState<Date | undefined>(new Date());
  const [returnTime, setReturnTime] = useState('18:00');
  const [totalCost, setTotalCost] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Google Maps when the component mounts with retry mechanism
  useEffect(() => {
    const loadMap = async () => {
      try {
        if (!isGoogleMapsLoaded()) {
          await loadGoogleMapsScript();
        }
        setIsMapLoaded(true);
        console.log('Google Maps API loaded successfully');
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setMapLoadError('Error al cargar Google Maps. Por favor, recargue la página.');
        toast.error('Error al cargar Google Maps. Por favor, recargue la página.');
        
        // Increment loading attempts count
        setLoadAttempts(prev => prev + 1);
      }
    };
    
    loadMap();

    // Add multiple retries with increasing timeouts
    if (loadAttempts < 3) {
      const retryTimeout = setTimeout(() => {
        if (!isGoogleMapsLoaded() && !isMapLoaded) {
          console.log(`Retrying Google Maps load... Attempt ${loadAttempts + 1}`);
          loadMap();
        }
      }, 5000 + (loadAttempts * 2000)); // Increasing timeout with each attempt

      return () => {
        clearTimeout(retryTimeout);
      };
    }
  }, [loadAttempts, isMapLoaded]);

  // Calculate return route when roundTrip is enabled and we have valid origin and destination
  useEffect(() => {
    const getReturnRoute = async () => {
      if (roundTrip && origin && destination && isGoogleMapsLoaded()) {
        try {
          const returnRouteInfo = await calculateReturnRoute(destination, origin, intermediateStops);
          setReturnDistance(returnRouteInfo.distance);
          setReturnDuration(returnRouteInfo.duration);
        } catch (error) {
          console.error('Error calculating return route:', error);
          // Use the outbound route data as fallback
          setReturnDistance(distance);
          setReturnDuration(duration);
        }
      }
    };

    getReturnRoute();
  }, [roundTrip, origin, destination, intermediateStops, distance, duration]);

  // Calculate route using Google Directions API with directionsRenderer
  const calculateRoute = useCallback(() => {
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
          // Get duration and set it
          const route = result.routes[0];
          if (route && route.legs.length > 0) {
            let totalDuration = 0;
            for (let i = 0; i < route.legs.length; i++) {
              totalDuration += route.legs[i].duration?.value || 0;
            }
            // Format duration
            const hours = Math.floor(totalDuration / 3600);
            const minutes = Math.floor((totalDuration % 3600) / 60);
            setDuration(`${hours}h ${minutes}m`);
          }
          
          updateCost(distance);
        } else {
          console.error('Directions request failed with status: ', status);
          toast.error('Error al calcular la ruta. Por favor, inténtelo de nuevo.');
        }
      }
    );
  }, [origin, destination, intermediateStops, distance]);

  // Update cost based on vehicle type and distance
  const updateCost = (distance: number) => {
    const costString = calculateCost(vehicleType, distance, roundTrip);
    setTotalCost(Number(costString));
  };

  // Update cost when relevant factors change
  React.useEffect(() => {
    updateCost(distance);
  }, [vehicleType, distance, roundTrip]);

  // Handle form submission and save to database
  const handleBookingSubmit = async (userData: any) => {
    if (!origin || !destination) {
      toast.error('Por favor seleccione origen y destino');
      return;
    }
    
    if (distance <= 0) {
      toast.error('Error al calcular la distancia del viaje');
      return;
    }
    
    // Disable submit to prevent multiple submissions
    setIsSubmitting(true);

    // Prepare booking data
    const bookingData = {
      origin: originPlace,
      destination: destinationPlace,
      origin_coords: origin,
      destination_coords: destination,
      intermediate_stops: intermediateStops.map(stop => ({
        id: stop.id,
        placeName: stop.placeName,
        location: stop.location
      })),
      departure_date: departureDate?.toISOString(),
      departure_time: departureTime,
      return_date: roundTrip ? returnDate?.toISOString() : null,
      return_time: roundTrip ? returnTime : null,
      vehicle_type: vehicleType,
      round_trip: roundTrip,
      distance: distance,
      cost: totalCost,
      duration: duration,
      user_id: userData.userId,
      status: 'pendiente',
      passenger_count: userData.passengerCount || 1
    };

    try {
      // Insert into bookings table
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select();
      
      if (error) {
        throw error;
      }
      
      toast.success('¡Reserva creada con éxito!', {
        description: 'Hemos recibido su solicitud de viaje.',
      });
      
      // Reset form after successful submission
      setTimeout(() => {
        setOrigin(null);
        setDestination(null);
        setOriginPlace('');
        setDestinationPlace('');
        setIntermediateStops([]);
        setDistance(0);
        setDuration('');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error al guardar la reserva:', error);
      toast.error('Error al guardar la reserva', {
        description: error.message || 'Por favor intente de nuevo más tarde',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-slate-900">
      {/* Navigation header */}
      <BookingHeader />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-white neon-text">Reservar un viaje</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map and route section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map Section Component */}
            {!isMapLoaded ? (
              <div className="flex items-center justify-center h-[400px] glass-card bg-slate-900/50 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-white">{mapLoadError || 'Cargando mapa...'}</p>
                  {loadAttempts > 0 && (
                    <button 
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      onClick={() => {
                        setMapLoadError(null);
                        setLoadAttempts(0);
                        window.location.reload();
                      }}
                    >
                      Reintentar carga
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <MapSection 
                origin={origin}
                destination={destination}
                setOrigin={setOrigin}
                setDestination={setDestination}
                originPlace={originPlace}
                destinationPlace={destinationPlace}
                setOriginPlace={setOriginPlace}
                setDestinationPlace={setDestinationPlace}
                intermediateStops={intermediateStops}
                setIntermediateStops={setIntermediateStops}
                distance={distance}
                setDistance={setDistance}
                isEditingMarkers={isEditingMarkers}
                setIsEditingMarkers={setIsEditingMarkers}
                calculateRoute={calculateRoute}
                duration={duration}
              />
            )}
          </div>
          
          {/* Booking form section */}
          <div className="space-y-6">
            <BookingForm 
              vehicleType={vehicleType}
              setVehicleType={setVehicleType}
              roundTrip={roundTrip}
              setRoundTrip={setRoundTrip}
              departureDate={departureDate}
              setDepartureDate={setDepartureDate}
              departureTime={departureTime}
              setDepartureTime={setDepartureTime}
              returnDate={returnDate}
              setReturnDate={setReturnDate}
              returnTime={returnTime}
              setReturnTime={setReturnTime}
              distance={distance}
              totalCost={totalCost}
              origin={originPlace}
              destination={destinationPlace}
              originCoords={origin}
              destinationCoords={destination}
              intermediateStops={intermediateStops.map(stop => ({
                address: stop.placeName,
                coords: {
                  lat: stop.location.lat,
                  lng: stop.location.lng
                }
              }))}
              duration={duration}
              returnDistance={returnDistance}
              returnDuration={returnDuration}
              onSubmit={handleBookingSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingPage;
