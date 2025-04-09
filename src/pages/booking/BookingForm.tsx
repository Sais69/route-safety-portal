
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from 'date-fns';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, MapPin, User, Bus, Route } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const FormSchema = z.object({
  origin: z.string().min(2, {
    message: "El origen debe tener al menos 2 caracteres.",
  }),
  destination: z.string().min(2, {
    message: "El destino debe tener al menos 2 caracteres.",
  }),
  departureDate: z.date({
    required_error: "Se requiere una fecha de salida.",
  }),
  departureTime: z.string().min(1, {
    message: "Se requiere una hora de salida.",
  }),
  returnDate: z.date().optional(),
  returnTime: z.string().optional(),
  roundTrip: z.boolean().default(false),
  vehicleType: z.string().min(1, {
    message: "Se requiere un tipo de vehículo.",
  }),
  passengerCount: z.string().min(1, {
    message: "Se requiere un número de pasajeros.",
  }),
  comments: z.string().optional(),
});

export interface BookingFormProps {
  vehicleType: string;
  setVehicleType: React.Dispatch<React.SetStateAction<string>>;
  roundTrip: boolean;
  setRoundTrip: React.Dispatch<React.SetStateAction<boolean>>;
  departureDate: Date | undefined;
  setDepartureDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  departureTime: string;
  setDepartureTime: React.Dispatch<React.SetStateAction<string>>;
  returnDate: Date | undefined;
  setReturnDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  returnTime: string;
  setReturnTime: React.Dispatch<React.SetStateAction<string>>;
  distance: number;
  totalCost: number;
  origin: string;
  destination: string;
  originCoords: google.maps.LatLngLiteral | null;
  destinationCoords: google.maps.LatLngLiteral | null;
  intermediateStops: { address: string, coords: { lat: number, lng: number } }[];
  duration: string;
  returnDistance: number;
  returnDuration: string;
}

export function BookingForm({
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
  originCoords,
  destinationCoords,
  intermediateStops,
  duration,
  returnDistance,
  returnDuration
}: BookingFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [departureDateState, setDepartureDateState] = React.useState<Date | undefined>(departureDate);
  const [returnDateState, setReturnDateState] = React.useState<Date | undefined>(returnDate);

  // Asegurar que los estados locales se actualicen cuando cambien las props
  React.useEffect(() => {
    setDepartureDateState(departureDate);
  }, [departureDate]);

  React.useEffect(() => {
    setReturnDateState(returnDate);
  }, [returnDate]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      origin: origin || "",
      destination: destination || "",
      departureDate: departureDate || new Date(),
      departureTime: departureTime || "08:00",
      returnDate: returnDate || new Date(),
      returnTime: returnTime || "18:00",
      roundTrip: roundTrip || false,
      vehicleType: vehicleType || "furgoneta",
      passengerCount: "1",
      comments: "",
    },
  });

  // Actualizar el formulario cuando cambian las props
  React.useEffect(() => {
    form.setValue("origin", origin || "");
    form.setValue("destination", destination || "");
  }, [form, origin, destination]);

  async function handleSubmit(values: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    try {
      if (!user) {
        toast({
          title: "No has iniciado sesión.",
          description: "Por favor, inicia sesión para continuar con la reserva.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user?.id as string,
          origin: values.origin,
          destination: values.destination,
          origin_coords: { lat: originCoords?.lat, lng: originCoords?.lng },
          destination_coords: { lat: destinationCoords?.lat, lng: destinationCoords?.lng },
          intermediate_stops: intermediateStops.length > 0 ? 
            intermediateStops.map(stop => ({ 
              address: stop.address, 
              coords: { lat: stop.coords?.lat, lng: stop.coords?.lng } 
            })) : [],
          departure_date: departureDateState?.toISOString() || new Date().toISOString(),
          departure_time: values.departureTime,
          return_date: values.roundTrip && returnDateState ? returnDateState.toISOString() : null,
          return_time: values.roundTrip && values.returnTime ? values.returnTime : null,
          round_trip: values.roundTrip,
          distance: distance,
          duration: duration,
          vehicle_type: values.vehicleType,
          passenger_count: parseInt(values.passengerCount),
          cost: totalCost
        });

      if (error) {
        console.error("Error creating booking:", error);
        toast({
          title: "Error al crear la reserva.",
          description: "Por favor, inténtalo de nuevo.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reserva creada con éxito.",
          description: "Te hemos enviado un correo electrónico con los detalles de tu reserva.",
        });
        navigate("/my-bookings");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error inesperado.",
        description: "Por favor, inténtalo de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Sección de costos e información del viaje */}
        <div className="glass-card bg-slate-900/50 p-6 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Información del Viaje</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Distancia</p>
                <p className="text-lg font-medium text-white">{distance.toFixed(2)} km</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Duración</p>
                <p className="text-lg font-medium text-white">{duration}</p>
              </div>
            </div>
            
            {roundTrip && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-blue-500/20">
                <div>
                  <p className="text-sm text-gray-400">Distancia de vuelta</p>
                  <p className="text-lg font-medium text-white">{returnDistance.toFixed(2)} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Duración de vuelta</p>
                  <p className="text-lg font-medium text-white">{returnDuration}</p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-blue-500/20">
              <p className="text-sm text-gray-400">Tipo de vehículo</p>
              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setVehicleType(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecciona un tipo de vehículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="furgoneta">Furgoneta (17 pasajeros)</SelectItem>
                        <SelectItem value="microbus">Microbús (28 pasajeros)</SelectItem>
                        <SelectItem value="bus">Bus (40 pasajeros)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-blue-500/20">
              <FormField
                control={form.control}
                name="roundTrip"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setRoundTrip(!!checked);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="text-white cursor-pointer">Ida y vuelta</FormLabel>
                  </FormItem>
                )}
              />
              <div>
                <p className="text-sm text-gray-400">Costo total</p>
                <p className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fechas y Horarios */}
        <div className="glass-card bg-slate-900/50 p-6 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] mb-4">
          <h2 className="text-xl font-semibold mb-4 text-white">Fecha y Hora</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="departureDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Salida</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !departureDateState && "text-muted-foreground"
                            )}
                          >
                            {departureDateState ? (
                              format(departureDateState, "PPP")
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={departureDateState}
                          onSelect={(date) => {
                            setDepartureDateState(date);
                            if (date) setDepartureDate(date);
                          }}
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <FormField
                control={form.control}
                name="departureTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Salida</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        defaultValue="08:00" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          setDepartureTime(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {form.watch("roundTrip") && (
            <div className="grid grid-cols-2 gap-6 mt-4 pt-4 border-t border-blue-500/20">
              <div>
                <FormField
                  control={form.control}
                  name="returnDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Regreso</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !returnDateState && "text-muted-foreground"
                              )}
                            >
                              {returnDateState ? (
                                format(returnDateState, "PPP")
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={returnDateState}
                            onSelect={(date) => {
                              setReturnDateState(date);
                              if (date) setReturnDate(date);
                            }}
                            disabled={(date) =>
                              date < new Date() || (departureDateState && date < departureDateState)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  control={form.control}
                  name="returnTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Regreso</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          defaultValue="18:00" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setReturnTime(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* Información de pasajeros */}
        <div className="glass-card bg-slate-900/50 p-6 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] mb-4">
          <h2 className="text-xl font-semibold mb-4 text-white">Detalles del Viaje</h2>

          <div>
            <FormField
              control={form.control}
              name="passengerCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Pasajeros</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el número de pasajeros" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 40 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4">
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentarios Adicionales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="¿Algún comentario adicional?"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Cargando..." : "Crear Reserva"}
        </Button>
      </form>
    </Form>
  );
}
