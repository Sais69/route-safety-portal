
import React from 'react';
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
import { CalendarIcon, Clock } from 'lucide-react';

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
  intermediateStops
}) => {
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
  );
};

export default BookingForm;
