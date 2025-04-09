
import React, { useState } from "react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Driver } from "@/types/driver";

interface DriverFormProps {
  driver: Driver | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DriverForm = ({ driver, onClose, onSuccess }: DriverFormProps) => {
  const [newDriver, setNewDriver] = useState<Driver>({
    nombre: driver?.nombre || '',
    apellido: driver?.apellido || '',
    numero_celular: driver?.numero_celular || '',
    placa_vehiculo: driver?.placa_vehiculo || '',
    modelo_vehiculo: driver?.modelo_vehiculo || '',
    disponible: driver?.disponible !== undefined ? driver.disponible : true,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewDriver({ ...newDriver, [name]: value });
  };

  const handleSwitchChange = (checked: boolean) => {
    setNewDriver({ ...newDriver, disponible: checked });
  };

  const saveDriver = async () => {
    try {
      setIsSubmitting(true);
      
      if (!newDriver.nombre || !newDriver.apellido || !newDriver.numero_celular || !newDriver.placa_vehiculo) {
        toast.error('Todos los campos son obligatorios');
        setIsSubmitting(false);
        return;
      }
      
      if (driver && driver.id) {
        // Update existing driver
        const { error } = await supabase
          .from('drivers')
          .update({
            nombre: newDriver.nombre,
            apellido: newDriver.apellido,
            numero_celular: newDriver.numero_celular,
            placa_vehiculo: newDriver.placa_vehiculo,
            modelo_vehiculo: newDriver.modelo_vehiculo,
            disponible: newDriver.disponible
          })
          .eq('id', driver.id);
          
        if (error) throw error;
        toast.success('Conductor actualizado correctamente');
      } else {
        // Insert new driver
        const { error } = await supabase
          .from('drivers')
          .insert({
            nombre: newDriver.nombre,
            apellido: newDriver.apellido,
            numero_celular: newDriver.numero_celular,
            placa_vehiculo: newDriver.placa_vehiculo,
            modelo_vehiculo: newDriver.modelo_vehiculo,
            disponible: newDriver.disponible
          });
          
        if (error) throw error;
        toast.success('Conductor creado correctamente');
      }
      
      onSuccess();
      onClose();
      
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'Ocurrió un error al guardar el conductor'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-400">
            {driver ? 'Editar Conductor' : 'Nuevo Conductor'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                className="bg-slate-800 border-slate-700 text-white"
                value={newDriver.nombre}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                name="apellido"
                className="bg-slate-800 border-slate-700 text-white"
                value={newDriver.apellido}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="numero_celular">Número de Teléfono</Label>
            <Input
              id="numero_celular"
              name="numero_celular"
              className="bg-slate-800 border-slate-700 text-white"
              value={newDriver.numero_celular}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="placa_vehiculo">Placa del Vehículo</Label>
              <Input
                id="placa_vehiculo"
                name="placa_vehiculo"
                className="bg-slate-800 border-slate-700 text-white"
                value={newDriver.placa_vehiculo}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo_vehiculo">Modelo del Vehículo</Label>
              <Input
                id="modelo_vehiculo"
                name="modelo_vehiculo"
                className="bg-slate-800 border-slate-700 text-white"
                value={newDriver.modelo_vehiculo}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="disponible" 
              checked={newDriver.disponible}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="disponible">Conductor Disponible</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Cancelar
          </Button>
          <Button 
            onClick={saveDriver}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Conductor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DriverForm;
