
import React, { useState } from "react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { BookingWithDriver } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Calendar, Route } from "lucide-react";
import { Driver } from "@/types/driver";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { statusLabels } from "../utils/statusConfig";

interface BookingDetailsProps {
  booking: BookingWithDriver | null;
  onClose: () => void;
  onRefresh: () => void;
  drivers: Driver[];
}

const BookingDetails = ({ booking, onClose, onRefresh, drivers }: BookingDetailsProps) => {
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');

  // Function to format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Assign driver to booking
  const assignDriver = async () => {
    if (!booking || !selectedDriverId) {
      toast.error('Debe seleccionar un conductor');
      return;
    }
    
    try {
      // Get the driver details
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', selectedDriverId)
        .single();
      
      if (driverError) throw driverError;
      
      // Update booking with assigned driver
      const { error } = await supabase
        .from('bookings')
        .update({
          id_conductor: selectedDriverId,
          status: 'asignada'
        })
        .eq('id', booking.id);
        
      if (error) throw error;
      
      toast.success(`Conductor ${driverData.nombre} ${driverData.apellido} asignado correctamente`);
      
      // Close assignment dialog and refresh data
      setIsAssigningDriver(false);
      onRefresh();
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'Ocurrió un error al asignar el conductor'}`);
    }
  };

  // Update booking status
  const updateBookingStatus = async () => {
    if (!booking || !newStatus) {
      toast.error('Debe seleccionar un estado');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: newStatus
        })
        .eq('id', booking.id);
        
      if (error) throw error;
      
      toast.success(`Estado de la reserva actualizado a ${statusLabels[newStatus as keyof typeof statusLabels]}`);
      
      // Close status update dialog and refresh data
      setUpdatingStatus(false);
      onRefresh();
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'Ocurrió un error al actualizar el estado'}`);
    }
  };

  if (!booking) return null;

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900 text-white border border-slate-700 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-blue-400">Detalles de Reserva</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-blue-300 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Información del Cliente
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nombre:</span>
                  <span className="font-medium">
                    {booking.user_metadata?.first_name} {booking.user_metadata?.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-medium">{booking.user_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Teléfono:</span>
                  <span className="font-medium">{booking.user_metadata?.phone || 'No disponible'}</span>
                </div>
              </div>
              
              <h3 className="font-semibold text-lg text-blue-300 flex items-center pt-2">
                <Route className="w-5 h-5 mr-2" />
                Detalles de la Ruta
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Origen:</span>
                  <span className="font-medium max-w-[250px] text-right">{booking.origin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Destino:</span>
                  <span className="font-medium max-w-[250px] text-right">{booking.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Distancia:</span>
                  <span className="font-medium">{booking.distance} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duración estimada:</span>
                  <span className="font-medium">{booking.duration || 'No disponible'}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-blue-300 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Detalles del Viaje
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Fecha de salida:</span>
                  <span className="font-medium">{formatDate(booking.departure_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hora de salida:</span>
                  <span className="font-medium">{booking.departure_time}</span>
                </div>
                {booking.round_trip && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fecha de regreso:</span>
                      <span className="font-medium">{formatDate(booking.return_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hora de regreso:</span>
                      <span className="font-medium">{booking.return_time || 'No especificada'}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Tipo de vehículo:</span>
                  <span className="font-medium">{booking.vehicle_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Costo total:</span>
                  <span className="font-medium text-green-400">${booking.cost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estado:</span>
                  <span className="font-medium">{statusLabels[booking.status as keyof typeof statusLabels]}</span>
                </div>
              </div>
              
              {booking.driver && (
                <div className="mt-4 p-3 bg-blue-900/30 border border-blue-800/50 rounded-md">
                  <h4 className="font-medium text-blue-300 mb-2">Conductor Asignado</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nombre:</span>
                      <span className="font-medium text-white">
                        {booking.driver.nombre} {booking.driver.apellido}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contacto:</span>
                      <span className="font-medium text-white">{booking.driver.numero_celular}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vehículo:</span>
                      <span className="font-medium text-white">
                        {booking.driver.placa_vehiculo} {booking.driver.modelo_vehiculo && `(${booking.driver.modelo_vehiculo})`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2 pt-4">
                {!booking.driver && (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setIsAssigningDriver(true)}
                  >
                    Asignar Conductor
                  </Button>
                )}
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => setUpdatingStatus(true)}
                >
                  Cambiar Estado
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Driver Sheet */}
      <Sheet open={isAssigningDriver} onOpenChange={setIsAssigningDriver}>
        <SheetContent side="right" className="bg-slate-900 text-white border-l border-slate-700">
          <SheetHeader>
            <SheetTitle className="text-blue-400">Asignar Conductor</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="driver-select" className="text-slate-300">Seleccionar Conductor</Label>
              <Select onValueChange={(value) => setSelectedDriverId(value)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Seleccionar un conductor" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white">
                  {drivers
                    .filter(driver => driver.disponible)
                    .map((driver) => (
                      <SelectItem key={driver.id} value={driver.id!}>
                        {driver.nombre} {driver.apellido} - {driver.placa_vehiculo}
                      </SelectItem>
                    ))
                  }
                  {drivers.filter(driver => driver.disponible).length === 0 && (
                    <SelectItem value="no-available" disabled>
                      No hay conductores disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <SheetFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsAssigningDriver(false)}
              className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button 
              onClick={assignDriver}
              disabled={!selectedDriverId}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Asignar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Update Status Sheet */}
      <Sheet open={updatingStatus} onOpenChange={setUpdatingStatus}>
        <SheetContent side="right" className="bg-slate-900 text-white border-l border-slate-700">
          <SheetHeader>
            <SheetTitle className="text-blue-400">Cambiar Estado</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="status-select" className="text-slate-300">Seleccionar Nuevo Estado</Label>
              <Select onValueChange={(value) => setNewStatus(value)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Seleccionar un estado" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white">
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="asignada">Asignada</SelectItem>
                  <SelectItem value="en_curso">En curso</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <SheetFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setUpdatingStatus(false)}
              className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button 
              onClick={updateBookingStatus}
              disabled={!newStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Actualizar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default BookingDetails;
