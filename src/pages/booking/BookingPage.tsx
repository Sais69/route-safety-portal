import React, { useState, useCallback, useEffect } from 'react';
import { 
  calculateCost, 
  loadGoogleMapsScript, 
  isGoogleMapsLoaded,
  calculateReturnRoute
} from '@/services/mapService';
import BookingHeader from './BookingHeader';
import MapSection from './MapSection';
// Fix the import to use named import instead of default import
import { BookingForm } from './BookingForm';
import { toast } from 'sonner';

// Use direct import for Google Maps types
// The .d.ts file provides types without needing an import

interface Stop {
  id: string;
  placeName: string;
  location: google.maps.LatLngLiteral;
}

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
  const [totalCost, setTotalCost] = useState('0');

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
    const cost = calculateCost(vehicleType, distance, roundTrip);
    setTotalCost(cost);
  };

  // Update cost when relevant factors change
  React.useEffect(() => {
    updateCost(distance);
  }, [vehicleType, distance, roundTrip]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-slate-900">
      {/* Navigation header */}
      <BookingHeader />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-white neon-text">Reservar un viaje</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map and route section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date and Time Selection Moved to Top */}
            <div className="glass-card bg-slate-900/50 p-6 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] mb-4">
              <h2 className="text-xl font-semibold mb-4 text-white">Fecha y Hora del Viaje</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="font-medium text-sm text-blue-400">Ida</div>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-400">Fecha</label>
                      <input 
                        type="date"
                        className="w-full bg-slate-800/70 border border-blue-500/30 rounded p-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        value={departureDate ? departureDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => setDepartureDate(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm text-gray-400">Hora</label>
                      <input 
                        type="time"
                        className="w-full bg-slate-800/70 border border-blue-500/30 rounded p-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                {roundTrip && (
                  <div className="space-y-2 fade-in">
                    <div className="font-medium text-sm text-blue-400">Vuelta</div>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <label className="text-sm text-gray-400">Fecha</label>
                        <input 
                          type="date"
                          className="w-full bg-slate-800/70 border border-blue-500/30 rounded p-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          value={returnDate ? returnDate.toISOString().split('T')[0] : ''}
                          onChange={(e) => setReturnDate(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm text-gray-400">Hora</label>
                        <input 
                          type="time"
                          className="w-full bg-slate-800/70 border border-blue-500/30 rounded p-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          value={returnTime}
                          onChange={(e) => setReturnTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex items-center">
                <div className="flex items-center">
                  <input 
                    id="roundtrip-checkbox" 
                    type="checkbox" 
                    className="h-4 w-4 text-blue-500 border-blue-500/30 rounded focus:ring-blue-500"
                    checked={roundTrip}
                    onChange={(e) => setRoundTrip(e.target.checked)}
                  />
                  <label htmlFor="roundtrip-checkbox" className="ml-2 block text-sm text-gray-300">
                    Ida y Vuelta
                  </label>
                </div>
              </div>
            </div>
            
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
              origin={origin}
              destination={destination}
              originPlace={originPlace}
              destinationPlace={destinationPlace}
              intermediateStops={intermediateStops}
              duration={duration}
              returnDistance={returnDistance}
              returnDuration={returnDuration}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingPage;
