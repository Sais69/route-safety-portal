
import React, { useState } from "react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Phone, CarTaxiFront, UserCog, Trash2, UserPlus } from "lucide-react";
import { Driver } from "@/types/driver";
import DriverForm from "./DriverForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface DriversManagementProps {
  drivers: Driver[];
  onRefresh: () => void;
}

const DriversManagement = ({ drivers, onRefresh }: DriversManagementProps) => {
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<string | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  
  // Handler for selecting a driver to edit
  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setShowDriverForm(true);
  };

  // Function to reset the form
  const resetDriverForm = () => {
    setEditingDriver(null);
    setShowDriverForm(false);
  };

  // Delete driver
  const deleteDriver = async (id: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Conductor eliminado correctamente');
      onRefresh();
      setDriverToDelete(null);
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'Ocurrió un error al eliminar el conductor'}`);
    }
  };

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-blue-400">Conductores Disponibles</h2>
        <Button 
          onClick={() => {
            setEditingDriver(null);
            setShowDriverForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Agregar Conductor
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <Table className="w-full border-collapse">
          <TableHeader className="bg-slate-800/50">
            <TableRow className="border-b border-slate-700">
              <TableHead className="text-slate-300">Nombre</TableHead>
              <TableHead className="text-slate-300">Contacto</TableHead>
              <TableHead className="text-slate-300">Vehículo</TableHead>
              <TableHead className="text-slate-300">Estado</TableHead>
              <TableHead className="text-slate-300 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.length > 0 ? (
              drivers.map((driver) => (
                <TableRow 
                  key={driver.id} 
                  className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                >
                  <TableCell className="py-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-slate-400" />
                      <span className="font-medium text-white">
                        {driver.nombre} {driver.apellido}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-slate-400" />
                      <span>{driver.numero_celular}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-white">
                        <CarTaxiFront className="w-3 h-3 inline-block mr-1 text-slate-400" />
                        {driver.placa_vehiculo}
                      </span>
                      {driver.modelo_vehiculo && (
                        <span className="text-xs text-slate-400 mt-0.5">
                          Modelo: {driver.modelo_vehiculo}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={driver.disponible ? "bg-green-900/50 text-green-300 border border-green-500/30" : "bg-red-900/50 text-red-300 border border-red-500/30"}>
                      {driver.disponible ? "Disponible" : "No disponible"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                      onClick={() => handleEditDriver(driver)}
                    >
                      <UserCog className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                      onClick={() => setDriverToDelete(driver.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                  No hay conductores registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Driver Form */}
      {showDriverForm && (
        <DriverForm 
          driver={editingDriver}
          onClose={resetDriverForm}
          onSuccess={onRefresh}
        />
      )}

      {/* Delete Driver Dialog */}
      <AlertDialog open={!!driverToDelete} onOpenChange={() => setDriverToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              ¿Estás seguro de que deseas eliminar este conductor? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (driverToDelete) {
                  deleteDriver(driverToDelete);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DriversManagement;
