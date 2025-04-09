
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bus, User, Phone, Mail, Calendar, Clock, Clipboard, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface BookingFormProps {
  vehicleType: string;
  setVehicleType: (type: string) => void;
  roundTrip: boolean;
  setRoundTrip: (roundTrip: boolean) => void;
  departureDate?: Date;
  setDepartureDate: (date: Date | undefined) => void;
  departureTime: string;
  setDepartureTime: (time: string) => void;
  returnDate?: Date;
  setReturnDate: (date: Date | undefined) => void;
  returnTime: string;
  setReturnTime: (time: string) => void;
  distance: number;
  totalCost: string;
  origin: google.maps.LatLngLiteral | null;
  destination: google.maps.LatLngLiteral | null;
  originPlace: string;
  destinationPlace: string;
  intermediateStops: any[];
  duration: string;
  returnDistance: number;
  returnDuration: string;
}

interface UserData {
  name: string;
  email: string;
  phone: string;
}

// Define the BookingInsert type without user_email to match supabase tables
interface BookingInsert {
  user_id: string;
  user_metadata: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  origin: string;
  destination: string;
  origin_coords: google.maps.LatLngLiteral | null;
  destination_coords: google.maps.LatLngLiteral | null;
  intermediate_stops: any[];
  departure_date: string;
  departure_time: string;
  return_date?: string | null;
  return_time?: string | null;
  round_trip: boolean;
  distance: number;
  duration?: string;
  vehicle_type: string;
  passenger_count: number;
  cost: number;
  status: string;
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
  duration,
  returnDistance,
  returnDuration
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    phone: ''
  });
  const [passengerCount, setPassengerCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedCost, setCalculatedCost] = useState(totalCost);
  const [isRouteSelected, setIsRouteSelected] = useState(false);
  
  useEffect(() => {
    // Check if route is selected
    setIsRouteSelected(!!origin && !!destination);
  }, [origin, destination]);
  
  useEffect(() => {
    setCalculatedCost(totalCost);
  }, [totalCost]);
  
  // Get user data from local storage or Supabase user metadata
  useEffect(() => {
    if (user) {
      const savedUserData = localStorage.getItem('user');
      if (savedUserData) {
        try {
          const parsedData = JSON.parse(savedUserData);
          setUserData(parsedData);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          
          // Use Supabase user metadata as fallback
          const firstName = user.user_metadata?.first_name || '';
          const lastName = user.user_metadata?.last_name || '';
          setUserData({
            name: `${firstName} ${lastName}`.trim(),
            email: user.email || '',
            phone: user.user_metadata?.phone || ''
          });
        }
      } else {
        // No saved data, use Supabase user data
        const firstName = user.user_metadata?.first_name || '';
        const lastName = user.user_metadata?.last_name || '';
        setUserData({
          name: `${firstName} ${lastName}`.trim(),
          email: user.email || '',
          phone: user.user_metadata?.phone || ''
        });
      }
    }
  }, [user]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isRouteSelected) {
      toast.error('Por favor seleccione una ruta en el mapa');
      return;
    }
    
    if (!departureDate) {
      toast.error('Por favor seleccione una fecha de salida');
      return;
    }
    
    if (roundTrip && !returnDate) {
      toast.error('Por favor seleccione una fecha de retorno');
      return;
    }
    
    if (!userData.name || !userData.email || !userData.phone) {
      toast.error('Por favor complete todos los datos de contacto');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Format the booking data for Supabase
      const bookingData: any = {
        user_id: user.id,
        user_metadata: {
          first_name: userData.name.split(' ')[0] || '',
          last_name: userData.name.split(' ').slice(1).join(' ') || '',
          phone: userData.phone
        },
        origin: originPlace,
        destination: destinationPlace,
        origin_coords: origin,
        destination_coords: destination,
        intermediate_stops: intermediateStops,
        departure_date: departureDate.toISOString(),
        departure_time: departureTime,
        return_date: roundTrip && returnDate ? returnDate.toISOString() : null,
        return_time: roundTrip && returnTime ? returnTime : null,
        round_trip: roundTrip,
        distance: distance,
        duration: duration,
        vehicle_type: vehicleType,
        passenger_count: passengerCount,
        cost: parseFloat(calculatedCost),
        status: 'pendiente'
      };

      // For TypeScript compatibility, add user_email separately
      if (user.email) {
        bookingData.user_email = user.email;
      }
      
      // Insert booking into Supabase
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success('¡Reserva creada con éxito!', {
        description: 'Redirigiendo a tus reservas...'
      });
      
      // Store user data in local storage for future bookings
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Redirect to my-bookings page
      setTimeout(() => {
        navigate('/my-bookings');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error al crear la reserva:', error);
      toast.error(`Error: ${error.message || 'No se pudo crear la reserva'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="glass-card bg-slate-900/50 p-6 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)]">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-semibold mb-1 text-white">Completar Reserva</CardTitle>
        <CardDescription className="text-gray-400">
          Complete los datos para finalizar su reserva
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-0 py-4">
        <form onSubmit={handleSubmit}>
          {/* User Information */}
          <div className="space-y-4 mb-6">
            <h3 className="font-medium text-blue-400 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Información personal
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm text-gray-300">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  id="name"
                  value={userData.name}
                  onChange={(e) => setUserData({...userData, name: e.target.value})}
                  placeholder="Nombre y apellido"
                  className="pl-10 bg-slate-800/70 border-blue-500/30 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  id="email"
                  value={userData.email}
                  onChange={(e) => setUserData({...userData, email: e.target.value})}
                  type="email"
                  placeholder="ejemplo@correo.com"
                  className="pl-10 bg-slate-800/70 border-blue-500/30 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm text-gray-300">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  id="phone"
                  value={userData.phone}
                  onChange={(e) => setUserData({...userData, phone: e.target.value})}
                  type="tel"
                  placeholder="(123) 456-7890"
                  className="pl-10 bg-slate-800/70 border-blue-500/30 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Route Summary */}
          <div className="space-y-4 mb-6">
            <h3 className="font-medium text-blue-400 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Resumen de ruta
            </h3>
            
            <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50 text-sm">
              <div className="mb-2">
                <span className="text-slate-400">Origen:</span>
                <span className="block text-white font-medium line-clamp-1">
                  {originPlace || 'No seleccionado'}
                </span>
              </div>
              <div className="mb-2">
                <span className="text-slate-400">Destino:</span>
                <span className="block text-white font-medium line-clamp-1">
                  {destinationPlace || 'No seleccionado'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4">
                <div>
                  <span className="text-slate-400">Distancia:</span>
                  <span className="block text-white font-medium">
                    {distance > 0 ? `${distance} km` : 'No calculado'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Duración:</span>
                  <span className="block text-white font-medium">
                    {duration || 'No calculado'}
                  </span>
                </div>
              </div>
              
              {roundTrip && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <div className="text-blue-400 mb-1 text-xs font-medium">Información de vuelta:</div>
                  <div className="grid grid-cols-2 gap-x-4">
                    <div>
                      <span className="text-slate-400">Distancia:</span>
                      <span className="block text-white font-medium">
                        {returnDistance > 0 ? `${returnDistance} km` : distance > 0 ? `${distance} km` : 'No calculado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Duración:</span>
                      <span className="block text-white font-medium">
                        {returnDuration || duration || 'No calculado'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {!isRouteSelected && (
              <div className="flex items-center text-yellow-400 text-sm">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Seleccione origen y destino en el mapa
              </div>
            )}
          </div>
          
          {/* Trip Details */}
          <div className="space-y-4 mb-6">
            <h3 className="font-medium text-blue-400 flex items-center">
              <Bus className="w-4 h-4 mr-2" />
              Detalles del viaje
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="vehicleType" className="text-sm text-gray-300">Tipo de vehículo</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger className="bg-slate-800/70 border-blue-500/30 text-white focus:border-blue-500">
                  <SelectValue placeholder="Seleccione un tipo de vehículo" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="furgoneta">Furgoneta (8 pasajeros)</SelectItem>
                  <SelectItem value="minibus">Minibus (15 pasajeros)</SelectItem>
                  <SelectItem value="bus">Bus (25+ pasajeros)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="passengerCount" className="text-sm text-gray-300">Número de pasajeros</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  id="passengerCount"
                  type="number"
                  min={1}
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
                  className="pl-10 bg-slate-800/70 border-blue-500/30 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Price Summary */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Precio base:</span>
              <span className="text-white">${calculatedCost}</span>
            </div>
            {roundTrip && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Tipo:</span>
                  <span className="text-blue-400">Ida y vuelta</span>
                </div>
              </>
            )}
            <div className="border-t border-slate-700 pt-2 mt-2 flex items-center justify-between">
              <span className="font-medium text-gray-300">Precio total:</span>
              <span className="font-bold text-lg text-blue-400">${calculatedCost}</span>
            </div>
          </div>
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all"
            disabled={isSubmitting || !isRouteSelected}
          >
            {isSubmitting ? (
              <>
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-blue-600">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                Procesando...
              </>
            ) : (
              <>
                <Clipboard className="mr-2 h-5 w-5" />
                Confirmar Reserva
              </>
            )}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="px-0 pt-4 pb-0">
        <p className="text-xs text-gray-400 text-center w-full">
          Al confirmar su reserva, acepta nuestros términos y condiciones de servicio.
        </p>
      </CardFooter>
    </Card>
  );
};

export default BookingForm;
