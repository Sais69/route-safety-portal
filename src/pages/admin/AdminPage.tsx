
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, Search, MapPin, User, Bus, Clock, AlertCircle, CheckCircle, XCircle, Route, ArrowLeft, ExternalLink, Calendar, Filter, Trash2, Users, UserPlus, UserCog, CarTaxiFront, Phone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from "react-router-dom";
import { Driver } from "@/types/driver";

// Custom type for bookings with optional driver info
interface BookingWithDriver {
  id: string;
  user_id: string;
  user_email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  departure_date: string;
  departure_time: string;
  return_date: string | null;
  return_time: string | null;
  round_trip: boolean;
  origin: string;
  destination: string;
  distance: number;
  duration: string | null;
  cost: number;
  status: string;
  vehicle_type: string;
  created_at: string;
  updated_at: string;
  id_conductor?: string;
  driver?: Driver | null;
}

interface FilterOptions {
  status: string;
  dateRange: string;
  searchQuery: string;
}

const AdminPage = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState<BookingWithDriver[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDriver[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    dateRange: 'all',
    searchQuery: '',
  });
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDriver | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  
  // Driver management states
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<string | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [newDriver, setNewDriver] = useState<Driver>({
    nombre: '',
    apellido: '',
    numero_celular: '',
    placa_vehiculo: '',
    modelo_vehiculo: '',
    disponible: true,
  });
  
  // Update booking status states
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  
  const statusColors = {
    pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
    asignada: "bg-blue-100 text-blue-800 border-blue-300",
    en_curso: "bg-purple-100 text-purple-800 border-purple-300",
    completada: "bg-green-100 text-green-800 border-green-300",
    cancelada: "bg-red-100 text-red-800 border-red-300",
  };
  
  const statusLabels = {
    pendiente: "Pendiente",
    asignada: "Asignada",
    en_curso: "En curso",
    completada: "Completada",
    cancelada: "Cancelada",
  };
  
  useEffect(() => {
    if (isAdmin) {
      fetchBookings();
      fetchDrivers();
    }
  }, [isAdmin]);
  
  useEffect(() => {
    applyFilters();
  }, [filters, bookings]);
  
  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        // Process the bookings to fetch driver info if assigned
        const processedBookings: BookingWithDriver[] = await Promise.all(
          data.map(async (booking: any) => {
            if (booking.id_conductor) {
              const { data: driverData, error: driverError } = await supabase
                .from('drivers')
                .select('*')
                .eq('id', booking.id_conductor)
                .single();
              
              if (!driverError && driverData) {
                return { ...booking, driver: driverData };
              }
            }
            return { ...booking, driver: null };
          })
        );
        
        setBookings(processedBookings);
        console.log("Loaded bookings:", processedBookings.length);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Error al cargar las reservas');
    }
  };
  
  // Fetch drivers from Supabase
  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setDrivers(data as Driver[]);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Error al cargar los conductores');
    }
  };
  
  // Save or update driver
  const saveDriver = async () => {
    try {
      if (!newDriver.nombre || !newDriver.apellido || !newDriver.numero_celular || !newDriver.placa_vehiculo) {
        toast.error('Todos los campos son obligatorios');
        return;
      }
      
      if (editingDriver) {
        // Update existing driver
        const driver = { ...newDriver, id: editingDriver.id };
        
        const { error } = await supabase
          .from('drivers')
          .update({
            nombre: driver.nombre,
            apellido: driver.apellido,
            numero_celular: driver.numero_celular,
            placa_vehiculo: driver.placa_vehiculo,
            modelo_vehiculo: driver.modelo_vehiculo,
            disponible: driver.disponible
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
            disponible: newDriver.disponible || true
          });
          
        if (error) throw error;
        toast.success('Conductor creado correctamente');
      }
      
      // Reset form and fetch updated list
      resetDriverForm();
      fetchDrivers();
      
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'Ocurrió un error al guardar el conductor'}`);
    }
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
      fetchDrivers();
      setDriverToDelete(null);
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'Ocurrió un error al eliminar el conductor'}`);
    }
  };
  
  // Handler for selecting a driver to edit
  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setNewDriver({
      nombre: driver.nombre,
      apellido: driver.apellido,
      numero_celular: driver.numero_celular,
      placa_vehiculo: driver.placa_vehiculo,
      modelo_vehiculo: driver.modelo_vehiculo || '',
      disponible: driver.disponible
    });
    setShowDriverForm(true);
  };
  
  // Reset driver form
  const resetDriverForm = () => {
    setNewDriver({
      nombre: '',
      apellido: '',
      numero_celular: '',
      placa_vehiculo: '',
      modelo_vehiculo: '',
      disponible: true,
    });
    setEditingDriver(null);
    setShowDriverForm(false);
  };
  
  // Assign driver to booking
  const assignDriver = async () => {
    if (!selectedBooking || !selectedDriverId) {
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
        .eq('id', selectedBooking.id);
        
      if (error) throw error;
      
      toast.success(`Conductor ${driverData.nombre} ${driverData.apellido} asignado correctamente`);
      
      // Update local state
      setSelectedBooking({
        ...selectedBooking,
        id_conductor: selectedDriverId,
        status: 'asignada',
        driver: driverData as Driver
      });
      
      // Refresh bookings list
      fetchBookings();
      
      // Close assignment dialog
      setIsAssigningDriver(false);
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'Ocurrió un error al asignar el conductor'}`);
    }
  };
  
  // Update booking status
  const updateBookingStatus = async () => {
    if (!selectedBooking || !newStatus) {
      toast.error('Debe seleccionar un estado');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: newStatus
        })
        .eq('id', selectedBooking.id);
        
      if (error) throw error;
      
      toast.success(`Estado de la reserva actualizado a ${statusLabels[newStatus as keyof typeof statusLabels]}`);
      
      // Update local state
      setSelectedBooking({
        ...selectedBooking,
        status: newStatus
      });
      
      // Refresh bookings list
      fetchBookings();
      
      // Close status update dialog
      setUpdatingStatus(false);
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'Ocurrió un error al actualizar el estado'}`);
    }
  };
  
  // Handle filter changes
  const applyFilters = () => {
    let filtered = [...bookings];
    
    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }
    
    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          const today = now.toISOString().split('T')[0];
          filtered = filtered.filter(booking => booking.departure_date.split('T')[0] === today);
          break;
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          filtered = filtered.filter(booking => new Date(booking.departure_date) >= weekAgo);
          break;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(booking => new Date(booking.departure_date) >= monthAgo);
          break;
      }
    }
    
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(booking => 
        (booking.origin && booking.origin.toLowerCase().includes(query)) ||
        (booking.destination && booking.destination.toLowerCase().includes(query)) ||
        (booking.user_email && booking.user_email.toLowerCase().includes(query)) ||
        (booking.user_metadata?.first_name && booking.user_metadata.first_name.toLowerCase().includes(query)) ||
        (booking.user_metadata?.last_name && booking.user_metadata.last_name.toLowerCase().includes(query)) ||
        (booking.user_metadata?.phone && booking.user_metadata.phone.toLowerCase().includes(query))
      );
    }
    
    setFilteredBookings(filtered);
  };
  
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
  
  // View booking details
  const viewBookingDetails = (booking: BookingWithDriver) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-slate-900/70 to-slate-950 text-white">
      {/* Header with back button */}
      <header className="bg-slate-900/90 shadow-lg border-b border-blue-500/20 sticky top-0 z-40 py-3">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-slate-300 hover:text-blue-400 transition-colors flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>Volver al inicio</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
              <Users className="w-3 h-3 mr-1" />
              Admin
            </Badge>
            <span className="text-sm text-slate-300">
              {user?.email}
            </span>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            Panel de Administración
          </h1>
          <Button 
            onClick={() => fetchBookings()} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Actualizar Datos
          </Button>
        </div>
        
        <Card className="bg-slate-900/50 border border-slate-800 shadow-lg mb-8">
          <CardContent className="pt-6">
            <Tabs 
              defaultValue="bookings" 
              onValueChange={(value) => setActiveTab(value)}
              value={activeTab}
            >
              <TabsList className="mb-6 bg-slate-800">
                <TabsTrigger 
                  value="bookings"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <Bus className="w-4 h-4 mr-2" />
                  Reservas
                </TabsTrigger>
                <TabsTrigger 
                  value="drivers"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <User className="w-4 h-4 mr-2" />
                  Conductores
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="bookings">
                {/* Bookings filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por origen, destino, email..."
                      className="pl-10 bg-slate-800 border-slate-700 text-white"
                      value={filters.searchQuery}
                      onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                    />
                  </div>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger className="w-full md:w-52 bg-slate-800 border-slate-700 text-white">
                      <Filter className="w-4 h-4 mr-2 text-slate-400" />
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="asignada">Asignada</SelectItem>
                      <SelectItem value="en_curso">En curso</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
                  >
                    <SelectTrigger className="w-full md:w-52 bg-slate-800 border-slate-700 text-white">
                      <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                      <SelectValue placeholder="Filtrar por fecha" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="all">Todas las fechas</SelectItem>
                      <SelectItem value="today">Hoy</SelectItem>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Bookings table */}
                <div className="overflow-x-auto">
                  <Table className="w-full border-collapse">
                    <TableHeader className="bg-slate-800/50">
                      <TableRow className="border-b border-slate-700">
                        <TableHead className="text-slate-300 py-3">Estado</TableHead>
                        <TableHead className="text-slate-300">Cliente</TableHead>
                        <TableHead className="text-slate-300">Origen</TableHead>
                        <TableHead className="text-slate-300">Destino</TableHead>
                        <TableHead className="text-slate-300">Fecha</TableHead>
                        <TableHead className="text-slate-300">Tipo</TableHead>
                        <TableHead className="text-slate-300">Monto</TableHead>
                        <TableHead className="text-slate-300">Conductor</TableHead>
                        <TableHead className="text-slate-300 text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                          <TableRow 
                            key={booking.id} 
                            className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                          >
                            <TableCell className="py-4">
                              <Badge className={`${statusColors[booking.status as keyof typeof statusColors]} border`}>
                                {statusLabels[booking.status as keyof typeof statusLabels]}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[180px] truncate">
                              <div className="flex flex-col">
                                <span className="font-medium text-white">
                                  {booking.user_metadata?.first_name} {booking.user_metadata?.last_name}
                                </span>
                                <span className="text-xs text-slate-400">{booking.user_email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[140px] truncate">
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1.5 text-slate-400 flex-shrink-0" />
                                <span>{booking.origin}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[140px] truncate">
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1.5 text-slate-400 flex-shrink-0" />
                                <span>{booking.destination}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <CalendarRange className="w-3 h-3 mr-1.5 text-slate-400 flex-shrink-0" />
                                <span>{formatDate(booking.departure_date)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-slate-700 text-slate-200">
                                <Bus className="w-3 h-3 mr-1" />
                                {booking.vehicle_type}
                              </Badge>
                              {booking.round_trip && (
                                <Badge className="bg-indigo-900 text-indigo-100 ml-1">
                                  <Route className="w-3 h-3 mr-1" />
                                  Ida y vuelta
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-green-400">
                                ${booking.cost}
                              </span>
                            </TableCell>
                            <TableCell>
                              {booking.driver ? (
                                <div className="flex items-center">
                                  <User className="w-3 h-3 mr-1.5 text-blue-400" />
                                  <span className="text-blue-300">
                                    {booking.driver.nombre} {booking.driver.apellido}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm italic">No asignado</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                                onClick={() => viewBookingDetails(booking)}
                              >
                                Detalles
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                            No se encontraron reservas con los filtros seleccionados
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="drivers">
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-blue-400">Conductores Disponibles</h2>
                  <Button 
                    onClick={() => {
                      setEditingDriver(null);
                      setNewDriver({
                        nombre: '',
                        apellido: '',
                        numero_celular: '',
                        placa_vehiculo: '',
                        modelo_vehiculo: '',
                        disponible: true,
                      });
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      
      {/* Booking Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-slate-900 text-white border border-slate-700 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-blue-400">Detalles de Reserva</DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
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
                      {selectedBooking.user_metadata?.first_name} {selectedBooking.user_metadata?.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-medium">{selectedBooking.user_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Teléfono:</span>
                    <span className="font-medium">{selectedBooking.user_metadata?.phone || 'No disponible'}</span>
                  </div>
                </div>
                
                <h3 className="font-semibold text-lg text-blue-300 flex items-center pt-2">
                  <Route className="w-5 h-5 mr-2" />
                  Detalles de la Ruta
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Origen:</span>
                    <span className="font-medium max-w-[250px] text-right">{selectedBooking.origin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Destino:</span>
                    <span className="font-medium max-w-[250px] text-right">{selectedBooking.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Distancia:</span>
                    <span className="font-medium">{selectedBooking.distance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duración estimada:</span>
                    <span className="font-medium">{selectedBooking.duration || 'No disponible'}</span>
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
                    <span className="font-medium">{formatDate(selectedBooking.departure_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hora de salida:</span>
                    <span className="font-medium">{selectedBooking.departure_time}</span>
                  </div>
                  {selectedBooking.round_trip && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fecha de retorno:</span>
                        <span className="font-medium">{formatDate(selectedBooking.return_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Hora de retorno:</span>
                        <span className="font-medium">{selectedBooking.return_time || 'No disponible'}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tipo de vehículo:</span>
                    <span className="font-medium capitalize">{selectedBooking.vehicle_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tipo de viaje:</span>
                    <span className="font-medium">{selectedBooking.round_trip ? 'Ida y vuelta' : 'Solo ida'}</span>
                  </div>
                </div>
                
                <h3 className="font-semibold text-lg text-blue-300 flex items-center pt-2">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Estado y Pago
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estado:</span>
                    <Badge className={`${statusColors[selectedBooking.status as keyof typeof statusColors]} border`}>
                      {statusLabels[selectedBooking.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Costo total:</span>
                    <span className="font-medium text-green-400">${selectedBooking.cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fecha de reserva:</span>
                    <span className="font-medium">{formatDate(selectedBooking.created_at)}</span>
                  </div>
                </div>
                
                <h3 className="font-semibold text-lg text-blue-300 flex items-center pt-2">
                  <User className="w-5 h-5 mr-2" />
                  Conductor Asignado
                </h3>
                {selectedBooking.driver ? (
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Nombre:</span>
                      <span className="font-medium">{selectedBooking.driver.nombre} {selectedBooking.driver.apellido}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Vehículo:</span>
                      <span className="font-medium">{selectedBooking.driver.placa_vehiculo}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Modelo:</span>
                      <span className="font-medium">{selectedBooking.driver.modelo_vehiculo}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Teléfono:</span>
                      <span className="font-medium">{selectedBooking.driver.numero_celular}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-center">No hay conductor asignado</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {selectedBooking && (
              <>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    setIsAssigningDriver(true);
                    setShowDetails(false);
                  }}
                >
                  <UserCog className="w-4 h-4 mr-2" />
                  {selectedBooking.driver ? 'Cambiar Conductor' : 'Asignar Conductor'}
                </Button>
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => {
                    setUpdatingStatus(true);
                    setNewStatus(selectedBooking.status);
                    setShowDetails(false);
                  }}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Cambiar Estado
                </Button>
              </>
            )}
            <Button 
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => setShowDetails(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assign Driver Dialog */}
      <Dialog open={isAssigningDriver} onOpenChange={setIsAssigningDriver}>
        <DialogContent className="bg-slate-900 text-white border border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-400">Asignar Conductor</DialogTitle>
            <DialogDescription className="text-slate-400">
              Seleccione un conductor para asignar a la reserva
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select
              value={selectedDriverId || ''}
              onValueChange={(value) => setSelectedDriverId(value)}
            >
              <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Seleccionar un conductor" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-[300px]">
                {drivers.filter(d => d.disponible).map((driver) => (
                  <SelectItem key={driver.id} value={driver.id || ''}>
                    {driver.nombre} {driver.apellido} - {driver.placa_vehiculo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={assignDriver}
            >
              Asignar Conductor
            </Button>
            <Button 
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => setIsAssigningDriver(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Update Status Dialog */}
      <Dialog open={updatingStatus} onOpenChange={setUpdatingStatus}>
        <DialogContent className="bg-slate-900 text-white border border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-400">Actualizar Estado</DialogTitle>
            <DialogDescription className="text-slate-400">
              Seleccione el nuevo estado para la reserva
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select
              value={newStatus}
              onValueChange={(value) => setNewStatus(value)}
            >
              <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="asignada">Asignada</SelectItem>
                <SelectItem value="en_curso">En curso</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={updateBookingStatus}
            >
              Actualizar Estado
            </Button>
            <Button 
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => setUpdatingStatus(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Driver Form Dialog */}
      <Dialog open={showDriverForm} onOpenChange={setShowDriverForm}>
        <DialogContent className="bg-slate-900 text-white border border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-400">
              {editingDriver ? 'Editar Conductor' : 'Agregar Conductor'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input 
                  id="nombre"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={newDriver.nombre}
                  onChange={(e) => setNewDriver({...newDriver, nombre: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input 
                  id="apellido"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={newDriver.apellido}
                  onChange={(e) => setNewDriver({...newDriver, apellido: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numero_celular">Número de Celular</Label>
              <Input 
                id="numero_celular"
                className="bg-slate-800 border-slate-700 text-white"
                value={newDriver.numero_celular}
                onChange={(e) => setNewDriver({...newDriver, numero_celular: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="placa_vehiculo">Placa del Vehículo</Label>
              <Input 
                id="placa_vehiculo"
                className="bg-slate-800 border-slate-700 text-white"
                value={newDriver.placa_vehiculo}
                onChange={(e) => setNewDriver({...newDriver, placa_vehiculo: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modelo_vehiculo">Modelo del Vehículo</Label>
              <Input 
                id="modelo_vehiculo"
                className="bg-slate-800 border-slate-700 text-white"
                value={newDriver.modelo_vehiculo}
                onChange={(e) => setNewDriver({...newDriver, modelo_vehiculo: e.target.value})}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                id="disponible"
                type="checkbox"
                className="h-4 w-4"
                checked={newDriver.disponible}
                onChange={(e) => setNewDriver({...newDriver, disponible: e.target.checked})}
              />
              <Label htmlFor="disponible">Conductor disponible</Label>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={saveDriver}
            >
              {editingDriver ? 'Actualizar' : 'Agregar'}
            </Button>
            <Button 
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={resetDriverForm}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Driver Confirmation */}
      <AlertDialog open={!!driverToDelete} onOpenChange={() => setDriverToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 text-white border border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Eliminar Conductor</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              ¿Está seguro que desea eliminar este conductor? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="border-slate-700 text-slate-300 hover:bg-slate-800 mt-0">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => driverToDelete && deleteDriver(driverToDelete)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Alert Dialog (for important messages) */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent className="bg-slate-900 text-white border border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-400">Información</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPage;
