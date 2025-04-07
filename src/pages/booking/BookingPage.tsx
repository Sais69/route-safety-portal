
import React, { useState, useCallback, useEffect } from 'react';
import { calculateCost, loadGoogleMapsScript, isGoogleMapsLoaded } from '@/services/mapService';
import BookingHeader from './BookingHeader';
import MapSection from './MapSection';
import BookingForm from './BookingForm';
import { toast } from 'sonner';

// Use direct import for Google Maps types
// The .d.ts file provides types without needing an import
// Removing the import that was causing the error

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

  // Form related states
  const [vehicleType, setVehicleType] = useState('furgoneta');
  const [roundTrip, setRoundTrip] = useState(false);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(new Date());
  const [departureTime, setDepartureTime] = useState('08:00');
  const [returnDate, setReturnDate] = useState<Date | undefined>(new Date());
  const [returnTime, setReturnTime] = useState('18:00');
  const [totalCost, setTotalCost] = useState('0');

  // Load Google Maps when the component mounts
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
        toast.error('Error al cargar Google Maps. Por favor, recargue la página.');
      }
    };
    
    loadMap();
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation header */}
      <BookingHeader />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Reservar un viaje</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map and route section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date and Time Selection Moved to Top */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-4">
              <h2 className="text-xl font-semibold mb-4">Fecha y Hora del Viaje</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="font-medium text-sm">Ida</div>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500">Fecha</label>
                      <input 
                        type="date"
                        className="w-full border rounded p-2"
                        value={departureDate ? departureDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => setDepartureDate(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm text-gray-500">Hora</label>
                      <input 
                        type="time"
                        className="w-full border rounded p-2"
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                {roundTrip && (
                  <div className="space-y-2">
                    <div className="font-medium text-sm">Vuelta</div>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <label className="text-sm text-gray-500">Fecha</label>
                        <input 
                          type="date"
                          className="w-full border rounded p-2"
                          value={returnDate ? returnDate.toISOString().split('T')[0] : ''}
                          onChange={(e) => setReturnDate(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm text-gray-500">Hora</label>
                        <input 
                          type="time"
                          className="w-full border rounded p-2"
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
                    className="h-4 w-4 text-primary border-gray-300 rounded"
                    checked={roundTrip}
                    onChange={(e) => setRoundTrip(e.target.checked)}
                  />
                  <label htmlFor="roundtrip-checkbox" className="ml-2 block text-sm text-gray-700">
                    Ida y Vuelta
                  </label>
                </div>
              </div>
            </div>
            
            {!isMapLoaded ? (
              <div className="flex items-center justify-center h-[400px] bg-white rounded-lg shadow-md">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Cargando mapa...</p>
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
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingPage;
