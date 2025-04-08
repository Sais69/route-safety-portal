
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Clock, MapPin, ArrowRight, RotateCw, CalendarRange } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

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

type BookingInsert = Database['public']['Tables']['bookings']['Insert'];

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
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData>({
    name: "",
    email: "",
    phone: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returnDuration, setReturnDuration] = useState<string>("");
  const [vehiclePrices, setVehiclePrices] = useState({
    furgoneta: 0.89,
    microbus: 1.29,
    bus: 1.69
  });
  const [calculatedCost, setCalculatedCost] = useState(totalCost);

  // Get user data from Supabase auth
  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata;
      const fullName = metadata?.full_name || `${metadata?.first_name || ''} ${metadata?.last_name || ''}`.trim();
      
      setUserData({
        name: fullName || "Usuario",
        email: user.email || "",
        phone: metadata?.phone || ""
      });
    } else {
      // Fallback to localStorage for backward compatibility
      const loggedInUser = localStorage.getItem("user");
      if (loggedInUser) {
        try {
          setUserData(JSON.parse(loggedInUser));
        } catch (e) {
          console.error("Error parsing user data", e);
        }
      }
    }
  }, [user]);

  // Set default vehicle type to furgoneta if not set
  useEffect(() => {
    if (!vehicleType) {
      setVehicleType("furgoneta");
    }
  }, [vehicleType, setVehicleType]);

  // Calculate return duration based on current duration
  useEffect(() => {
    if (duration) {
      // Simple calculation, assuming return would take the same time
      setReturnDuration(duration);
    }
  }, [duration]);

  // Recalculate price when vehicle type changes
  useEffect(() => {
    if (distance > 0) {
      const pricePerKm = vehiclePrices[vehicleType as keyof typeof vehiclePrices] || vehiclePrices.furgoneta;
      const baseCost = Math.round(distance * pricePerKm * 100) / 100;
      const finalCost = roundTrip ? baseCost * 1.8 : baseCost; // Round trip gets a 10% discount on return route
      setCalculatedCost(finalCost.toFixed(2));
    }
  }, [distance, vehicleType, roundTrip, vehiclePrices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Debe iniciar sesión para realizar una reserva');
      return;
    }
    
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
    
    try {
      setIsSubmitting(true);
      
      // Format the booking data for Supabase
      const bookingData: BookingInsert = {
        user_id: user.id,
        origin: originPlace,
        destination: destinationPlace,
        origin_coords: origin as any,
        destination_coords: destination as any,
        intermediate_stops: intermediateStops.map(stop => ({ 
          id: stop.id, 
          placeName: stop.placeName, 
          location: stop.location 
        })) as any,
        vehicle_type: vehicleType,
        departure_date: departureDate?.toISOString() || '',
        departure_time: departureTime,
        return_date: roundTrip ? returnDate?.toISOString() || null : null,
        return_time: roundTrip ? returnTime : null,
        round_trip: roundTrip,
        distance: parseFloat(distance.toFixed(2)),
        duration: duration,
        cost: parseFloat(calculatedCost),
        status: 'pendiente'
      };
      
      // Insert booking into Supabase
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select('id')
        .single();
        
      if (error) {
        throw error;
      }
      
      toast.success('¡Reserva realizada con éxito!');
      
      // Also save to localStorage for backward compatibility
      const existingBookings = localStorage.getItem('bookings');
      let bookings = existingBookings ? JSON.parse(existingBookings) : [];
      
      // Add a unique ID and timestamp to the booking
      const newBooking = {
        ...bookingData,
        id: data?.id || `booking-${Date.now()}`,
        createdAt: new Date().toISOString(),
        userData
      };
      
      bookings.push(newBooking);
      localStorage.setItem('bookings', JSON.stringify(bookings));
      
    } catch (error: any) {
      console.error('Error al guardar la reserva:', error);
      toast.error(`Error al realizar la reserva: ${error.message || 'Inténtelo de nuevo más tarde'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-slate-900/60 border border-blue-500/20 backdrop-blur-xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
      <CardHeader>
        <CardTitle className="text-gradient bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Detalles de la reserva</CardTitle>
        <CardDescription className="text-gray-400">
          Complete la información necesaria para su viaje
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User information */}
          <div className="space-y-4">
            <h3 className="font-medium text-white">Información personal</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">Nombre</Label>
              <Input 
                id="name" 
                value={userData.name} 
                onChange={(e) => setUserData({...userData, name: e.target.value})} 
                readOnly 
                className="bg-slate-800/70 text-white border-blue-500/30"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={userData.email} 
                onChange={(e) => setUserData({...userData, email: e.target.value})} 
                readOnly 
                className="bg-slate-800/70 text-white border-blue-500/30"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center text-gray-300">
                Teléfono <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input 
                id="phone" 
                type="tel" 
                value={userData.phone} 
                onChange={(e) => setUserData({...userData, phone: e.target.value})} 
                required
                placeholder="Ej: +34 600 000 000"
                className="bg-slate-800/70 text-white border-blue-500/30"
              />
              <p className="text-xs text-gray-500">Campo obligatorio</p>
            </div>
          </div>
          
          <Separator className="bg-blue-500/20" />
          
          {/* Route summary */}
          <div className="space-y-3">
            <h3 className="font-medium text-white">Resumen de la ruta</h3>
            <div className="space-y-2 bg-slate-800/70 p-3 rounded-md border border-blue-500/20">
              <div className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-400">Origen</p>
                  <p className="font-medium text-white">{originPlace || "No seleccionado"}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" />
                <div>
                  <p className="text-sm text-gray-400">Destino</p>
                  <p className="font-medium text-white">{destinationPlace || "No seleccionado"}</p>
                </div>
              </div>
              {intermediateStops.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="text-sm text-gray-400 mb-1">Paradas intermedias</p>
                  {intermediateStops.map(stop => (
                    <p key={stop.id} className="text-sm text-white">{stop.placeName}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-blue-500/20" />
          
          {/* Trip times */}
          <div className="space-y-3">
            <h3 className="font-medium text-white">Tiempos de viaje</h3>
            
            <div className="bg-slate-800/70 p-3 rounded-md border border-blue-500/20 space-y-3">
              <div>
                <div className="flex items-center mb-1">
                  <CalendarRange className="h-4 w-4 mr-2 text-blue-400" />
                  <p className="text-sm text-blue-400">Viaje de ida</p>
                </div>
                <div className="flex items-center ml-6 text-white">
                  <p>{departureDate?.toLocaleDateString() || "Fecha no seleccionada"} - {departureTime || "Hora no seleccionada"}</p>
                </div>
                {duration && (
                  <div className="flex items-center ml-6 text-gray-400 text-sm mt-1">
                    <Clock className="h-4 w-4 mr-1" /> Duración estimada: {duration}
                  </div>
                )}
              </div>
              
              {roundTrip && (
                <div>
                  <div className="flex items-center mb-1">
                    <RotateCw className="h-4 w-4 mr-2 text-blue-400" />
                    <p className="text-sm text-blue-400">Viaje de regreso</p>
                  </div>
                  <div className="flex items-center ml-6 text-white">
                    <p>{returnDate?.toLocaleDateString() || "Fecha no seleccionada"} - {returnTime || "Hora no seleccionada"}</p>
                  </div>
                  {returnDuration && (
                    <div className="flex items-center ml-6 text-gray-400 text-sm mt-1">
                      <Clock className="h-4 w-4 mr-1" /> Duración estimada: {returnDuration}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <Separator className="bg-blue-500/20" />
          
          {/* Vehicle selection */}
          <div className="space-y-3">
            <Label className="text-white">Tipo de vehículo</Label>
            <RadioGroup 
              value={vehicleType} 
              onValueChange={setVehicleType} 
              className="grid grid-cols-1 gap-3"
            >
              <div className="flex items-center space-x-2 border border-blue-500/20 rounded-md p-3 hover:bg-slate-800/50 cursor-pointer">
                <RadioGroupItem value="furgoneta" id="furgoneta" />
                <Label htmlFor="furgoneta" className="flex-1 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white">Furgoneta</div>
                      <div className="text-sm text-gray-400">17 pasajeros</div>
                    </div>
                    <div className="text-blue-400 font-medium">${vehiclePrices.furgoneta}/km</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border border-blue-500/20 rounded-md p-3 hover:bg-slate-800/50 cursor-pointer">
                <RadioGroupItem value="microbus" id="microbus" />
                <Label htmlFor="microbus" className="flex-1 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white">Microbús</div>
                      <div className="text-sm text-gray-400">28 pasajeros</div>
                    </div>
                    <div className="text-blue-400 font-medium">${vehiclePrices.microbus}/km</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border border-blue-500/20 rounded-md p-3 hover:bg-slate-800/50 cursor-pointer">
                <RadioGroupItem value="bus" id="bus" />
                <Label htmlFor="bus" className="flex-1 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white">Bus</div>
                      <div className="text-sm text-gray-400">40 pasajeros</div>
                    </div>
                    <div className="text-blue-400 font-medium">${vehiclePrices.bus}/km</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <Separator className="bg-blue-500/20" />
          
          {/* Cost summary */}
          <div className="space-y-4 bg-slate-800/70 p-4 rounded-lg border border-blue-500/20">
            <h3 className="font-medium text-white mb-3">Resumen de costos</h3>
            <div className="flex justify-between items-center text-white">
              <span>Distancia:</span>
              <span>{distance.toFixed(1)} km</span>
            </div>
            <div className="flex justify-between items-center text-white">
              <span>Tarifa por km ({vehicleType}):</span>
              <span>${vehiclePrices[vehicleType as keyof typeof vehiclePrices] || vehiclePrices.furgoneta}/km</span>
            </div>
            {roundTrip && (
              <div className="flex justify-between items-center text-white">
                <span>Ida y vuelta:</span>
                <span>Descuento del 10% en regreso</span>
              </div>
            )}
            <Separator className="bg-blue-500/20" />
            <div className="flex justify-between items-center font-medium text-lg text-white">
              <span>Costo total:</span>
              <span>${calculatedCost}</span>
            </div>
            
            <div className="text-xs text-gray-400">
              <p>El precio incluye:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Conductor profesional</li>
                <li>Combustible</li>
                <li>Seguro de viaje</li>
                <li>Monitoreo GPS en tiempo real</li>
                {roundTrip && <li>Servicio de ida y vuelta con 10% de descuento en el retorno</li>}
              </ul>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-600/50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Procesando...' : 'Reservar Ahora'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookingForm;
