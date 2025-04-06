
import React, { useState, useCallback } from 'react';
import { calculateCost } from '@/services/mapService';
import BookingHeader from './BookingHeader';
import MapSection from './MapSection';
import BookingForm from './BookingForm';

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

  // Form related states
  const [vehicleType, setVehicleType] = useState('furgoneta');
  const [roundTrip, setRoundTrip] = useState(false);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(new Date());
  const [departureTime, setDepartureTime] = useState('08:00');
  const [returnDate, setReturnDate] = useState<Date | undefined>(new Date());
  const [returnTime, setReturnTime] = useState('18:00');
  const [totalCost, setTotalCost] = useState('0');

  // Calculate route using Google Directions API
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
          // The directions renderer will handle displaying the route
          // We just need to update the cost calculation
          updateCost(distance);
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
            />
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
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingPage;
