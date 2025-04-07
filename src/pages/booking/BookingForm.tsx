
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Clock, MapPin } from 'lucide-react';

interface BookingFormProps {
  vehicleType: string;
  setVehicleType: (type: string) => void;
  roundTrip: boolean;
  setRoundTrip: (roundTrip: boolean) => void;
  departureDate: Date | undefined;
  setDepartureDate: (date: Date | undefined) => void;
  departureTime: string;
  setDepartureTime: (time: string) => void;
  returnDate: Date | undefined;
  setReturnDate: (date: Date | undefined) => void;
  returnTime: string;
  setReturnTime: (time: string) => void;
  distance: number;
  totalCost: string;
  origin: google.maps.LatLngLiteral | null;
  destination: google.maps.LatLngLiteral | null;
  originPlace: string;
  destinationPlace: string;
  intermediateStops: Array<{
    id: string;
    placeName: string;
    location: google.maps.LatLngLiteral;
  }>;
  duration: string;
}

interface UserData {
  name: string;
  email: string;
  phone: string;
}

const BookingForm: React.FC<BookingFormProps> = ({
  vehicleType,
  setVehicleType,
  roundTrip,
  setRoundTrip,
  departureDate,
  setDepartureDate,
  departureTime,
  setDepartureTime,
  returnDate,
  setReturnDate,
  returnTime,
  setReturnTime,
  distance,
  totalCost,
  origin,
  destination,
  originPlace,
  destinationPlace,
  intermediateStops,
  duration
}) => {
  // User data state - would normally be fetched from authentication context
  const [userData, setUserData] = useState<UserData>({
    name: "Usuario Ejemplo",
    email: "usuario@ejemplo.com",
    phone: ""
  });

  // Simulating fetching user data from login
  useEffect(() => {
    // In a real application, this would fetch user data from a context or API
    // For now, we'll simulate having user data from login
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser) {
      try {
        setUserData(JSON.parse(loggedInUser));
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }
  }, []);

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

    if (!userData.phone) {
      toast.error('Por favor, ingrese un número de teléfono');
      return;
    }
    
    // Simulate booking submission
    toast.success('¡Reserva realizada con éxito!');
    
    // Log booking details
    const bookingData = {
      userData,
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
      duration,
      totalCost,
      status: 'pendiente'
    };
    
    console.log(bookingData);
    
    // Store in localStorage for admin panel
    const existingBookings = localStorage.getItem('bookings');
    let bookings = existingBookings ? JSON.parse(existingBookings) : [];
    
    // Add a unique ID and timestamp to the booking
    const newBooking = {
      ...bookingData,
      id: `booking-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    bookings.push(newBooking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles de la reserva</CardTitle>
        <CardDescription>
          Complete la información necesaria para su viaje
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User information */}
          <div className="space-y-4">
            <h3 className="font-medium">Información personal</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input 
                id="name" 
                value={userData.name} 
                onChange={(e) => setUserData({...userData, name: e.target.value})} 
                readOnly 
                className="bg-gray-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={userData.email} 
                onChange={(e) => setUserData({...userData, email: e.target.value})} 
                readOnly 
                className="bg-gray-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center">
                Teléfono <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input 
                id="phone" 
                type="tel" 
                value={userData.phone} 
                onChange={(e) => setUserData({...userData, phone: e.target.value})} 
                required
                placeholder="Ej: +34 600 000 000"
              />
              <p className="text-xs text-gray-500">Campo obligatorio</p>
            </div>
          </div>
          
          <Separator />
          
          {/* Route summary */}
          <div className="space-y-3">
            <h3 className="font-medium">Resumen de la ruta</h3>
            <div className="space-y-2 bg-gray-50 p-3 rounded-md">
              <div className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Origen</p>
                  <p className="font-medium">{originPlace || "No seleccionado"}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-primary mt-0.5" fill="currentColor" />
                <div>
                  <p className="text-sm text-gray-500">Destino</p>
                  <p className="font-medium">{destinationPlace || "No seleccionado"}</p>
                </div>
              </div>
              {intermediateStops.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Paradas intermedias</p>
                  {intermediateStops.map(stop => (
                    <p key={stop.id} className="text-sm">{stop.placeName}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
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
                  <div className="text-sm text-gray-500">17 pasajeros - $0.89/km</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="microbus" id="microbus" />
                <Label htmlFor="microbus" className="flex-1 cursor-pointer">
                  <div>Microbús</div>
                  <div className="text-sm text-gray-500">28 pasajeros - $1.29/km</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="bus" id="bus" />
                <Label htmlFor="bus" className="flex-1 cursor-pointer">
                  <div>Bus</div>
                  <div className="text-sm text-gray-500">40 pasajeros - $1.69/km</div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <Separator />
          
          {/* Cost summary */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Distancia:</span>
              <span>{distance.toFixed(1)} km</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-2" /> Tiempo estimado:
              </span>
              <span>{duration || "Calculando..."}</span>
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
          
          <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90">
            Reservar Ahora
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookingForm;
