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
import { useMap } from "@/contexts/MapContext";
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

interface BookingFormProps {
  distanceInKm: number;
  durationText: string;
  totalCost: number;
  originCoords: { lat: number | null, lng: number | null } | null;
  destinationCoords: { lat: number | null, lng: number | null } | null;
  intermediateStops: { address: string, coords: { lat: number | null, lng: number | null } | null }[];
}

export function BookingForm({
  distanceInKm,
  durationText,
  totalCost,
  originCoords,
  destinationCoords,
  intermediateStops
}: BookingFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [departureDate, setDepartureDate] = React.useState<Date | undefined>(new Date());
  const [returnDate, setReturnDate] = React.useState<Date | undefined>(new Date());

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      origin: "",
      destination: "",
      departureDate: new Date(),
      departureTime: "08:00",
      returnDate: new Date(),
      returnTime: "18:00",
      roundTrip: false,
      vehicleType: "taxi",
      passengerCount: "1",
      comments: "",
    },
  });

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
          departure_date: departureDate.toISOString(),
          departure_time: values.departureTime,
          return_date: values.roundTrip && returnDate ? returnDate.toISOString() : null,
          return_time: values.roundTrip && values.returnTime ? values.returnTime : null,
          round_trip: values.roundTrip,
          distance: distanceInKm,
          duration: durationText,
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <FormField
              control={form.control}
              name="origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origen</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingresa tu origen" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destino</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingresa tu destino" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
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
                            "w-[240px] pl-3 text-left font-normal",
                            !departureDate && "text-muted-foreground"
                          )}
                        >
                          {departureDate ? (
                            format(departureDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={departureDate}
                        onSelect={setDepartureDate}
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
                    <Input type="time" defaultValue="08:00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="roundTrip"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Viaje de Ida y Vuelta</FormLabel>
                <FormDescription>
                  Selecciona si necesitas un viaje de ida y vuelta.
                </FormDescription>
              </div>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch("roundTrip") && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                              "w-[240px] pl-3 text-left font-normal",
                              !returnDate && "text-muted-foreground"
                            )}
                          >
                            {returnDate ? (
                              format(returnDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={returnDate}
                          onSelect={setReturnDate}
                          disabled={(date) =>
                            date < new Date() || (departureDate && date < departureDate)
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
                      <Input type="time" defaultValue="18:00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Vehículo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo de vehículo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="taxi">Taxi</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
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
        </div>

        <div>
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

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Cargando..." : "Crear Reserva"}
        </Button>
      </form>
    </Form>
  );
}
