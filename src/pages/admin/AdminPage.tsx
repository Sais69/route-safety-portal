import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Database } from '@/integrations/supabase/types';

// Booking interface
interface BookingUser {
  name: string;
  email: string;
  phone: string;
}

interface Booking {
  id: string;
  userData: BookingUser;
  origin: string;
  destination: string;
  vehicleType: string;
  passengerCount?: number;
  departureDate: string | Date;
  departureTime: string;
  returnDate: string | Date | null;
  returnTime: string | null;
  status: 'pendiente' | 'designada' | 'en curso' | 'realizada' | 'negada';
  cost: number | string;
  distance: number;
  duration?: string;
  createdAt: string;
  intermediate_stops?: Array<{
    id: string;
    placeName: string;
    location: google.maps.LatLngLiteral;
  }>;
  // New driver fields
  id_conductor?: string;
  nombre_conductor?: string;
  placa_vehiculo?: string;
  modelo_vehiculo?: string;
  numero_celular_conductor?: string;
}

// Driver interface
interface Driver {
  id: string;
  nombre: string;
  apellido: string;
  numero_celular: string;
  placa_vehiculo: string;
  modelo_vehiculo: string;
  disponible: boolean;
  fecha_creacion: string;
}

// Define filter types
interface FilterOptions {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  status: string;
  userEmail: string;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [completedBookings, setCompletedBookings] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: { from: null, to: null },
    status: 'all',
    userEmail: '',
  });
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New state variables for driver management
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [isDriverDeleteDialogOpen, setIsDriverDeleteDialogOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [driverToDelete, setDriverToDelete] = useState<string | null>(null);
  const [isDriverAssignDialogOpen, setIsDriverAssignDialogOpen] = useState(false);
  const [bookingForDriverAssign, setBookingForDriverAssign] = useState<Booking | null>(null);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);

  // Check admin access and redirect if not authorized
  useEffect(() => {
    // Check if user is logged in and is admin
    if (user) {
      if (isAdmin) {
        fetchBookings();
        fetchDrivers();

        // Set up realtime subscription for bookings and drivers
        const bookingsChannel = supabase
          .channel('bookings-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
            fetchBookings();
          })
          .subscribe();
        
        const driversChannel = supabase
          .channel('drivers-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => {
            fetchDrivers();
          })
          .subscribe();

        return () => {
          supabase.removeChannel(bookingsChannel);
          supabase.removeChannel(driversChannel);
        };
      } else {
        toast.error('No tienes permisos de administrador');
        navigate('/');
      }
    } else {
      // Redirect to login if no user
      navigate('/login');
    }
  }, [user, isAdmin, navigate]);

  // Load bookings from Supabase
  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      // Try to get bookings from Supabase first
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings from Supabase:', error);
        throw error;
      }

      let allBookings: Booking[] = [];
      
      // Process Supabase bookings if available
      if (data && data.length > 0) {
        allBookings = data.map((booking: any) => ({
          id: booking.id,
          userData: {
            name: booking.user_metadata?.first_name + ' ' + booking.user_metadata?.last_name || 'Usuario',
            email: booking.user_email || '',
            phone: booking.user_metadata?.phone || '',
          },
          origin: booking.origin,
          destination: booking.destination,
          vehicleType: booking.vehicle_type,
          passengerCount: booking.passenger_count,
          departureDate: booking.departure_date,
          departureTime: booking.departure_time,
          returnDate: booking.return_date,
          returnTime: booking.return_time,
          status: booking.status,
          cost: booking.cost,
          distance: booking.distance,
          duration: booking.duration,
          createdAt: booking.created_at,
          intermediate_stops: booking.intermediate_stops || [],
          // New driver-related fields
          id_conductor: booking.id_conductor || null,
          nombre_conductor: booking.nombre_conductor || null,
          placa_vehiculo: booking.placa_vehiculo || null,
          modelo_vehiculo: booking.modelo_vehiculo || null,
          numero_celular_conductor: booking.numero_celular_conductor || null
        }));
      }

      // Also check localStorage for backward compatibility
      const storedBookings = localStorage.getItem('bookings');
      if (storedBookings) {
        try {
          const parsedBookings = JSON.parse(storedBookings);
          // Merge with any bookings that might be only in localStorage
          const idSet = new Set(allBookings.map(b => b.id));
          const localOnlyBookings = parsedBookings.filter((b: any) => !idSet.has(b.id));
          allBookings = [...allBookings, ...localOnlyBookings];
        } catch (e) {
          console.error('Error parsing local bookings', e);
        }
      }

      // Extract unique user emails for filtering
      const emails = Array.from(new Set(allBookings.map(b => b.userData.email))).filter(Boolean);
      setUniqueUsers(emails);

      // Update states
      setBookings(allBookings);
      setTotalBookings(allBookings.length);
      
      // Calculate stats
      const completed = allBookings.filter(b => b.status === 'realizada').length;
      setCompletedBookings(completed);
      
      const totalDist = allBookings
        .filter(booking => booking.status === 'realizada')
        .reduce((total, booking) => total + booking.distance, 0);
      setTotalDistance(totalDist);
      
      toast.success('Reservas cargadas correctamente');
    } catch (e) {
      console.error('Error fetching bookings:', e);
      toast.error('Error al cargar las reservas');
    } finally {
      setIsLoading(false);
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

  // Add or update a driver
  const saveDriver = async (driver: Partial<Driver>) => {
    try {
      if (driver.id) {
        // Update existing driver
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
        // Create new driver
        const { error } = await supabase
          .from('drivers')
          .insert({
            nombre: driver.nombre,
            apellido: driver.apellido,
            numero_celular: driver.numero_celular,
            placa_vehiculo: driver.placa_vehiculo,
            modelo_vehiculo: driver.modelo_vehiculo,
            disponible: driver.disponible || true
          });
          
        if (error) throw error;
        toast.success('Conductor creado correctamente');
      }
      
      setIsDriverDialogOpen(false);
      setCurrentDriver(null);
      await fetchDrivers();
      
    } catch (error) {
      console.error('Error saving driver:', error);
      toast.error('Error al guardar el conductor');
    }
  };

  // Delete a driver
  const handleDeleteDriver = async (id: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Conductor eliminado correctamente');
      setIsDriverDeleteDialogOpen(false);
      await fetchDrivers();
      
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast.error('Error al eliminar el conductor');
    }
  };

  // Assign a driver to a booking
  const assignDriverToBooking = async (bookingId: string, driverId: string) => {
    try {
      // First get the driver details
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single();
      
      if (driverError) throw driverError;
      
      if (!driverData) {
        toast.error('No se encontró el conductor');
        return;
      }
      
      // Update the booking with driver information
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          id_conductor: driverId,
          nombre_conductor: `${driverData.nombre} ${driverData.apellido}`,
          placa_vehiculo: driverData.placa_vehiculo,
          modelo_vehiculo: driverData.modelo_vehiculo,
          numero_celular_conductor: driverData.numero_celular
        })
        .eq('id', bookingId);
      
      if (bookingError) throw bookingError;
      
      toast.success('Conductor asignado correctamente');
      setIsDriverAssignDialogOpen(false);
      setBookingForDriverAssign(null);
      await fetchBookings();
      
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('Error al asignar el conductor');
    }
  };

  // Remove driver from a booking
  const removeDriverFromBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          id_conductor: null,
          nombre_conductor: null,
          placa_vehiculo: null,
          modelo_vehiculo: null,
          numero_celular_conductor: null
        })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      toast.success('Conductor removido correctamente');
      await fetchBookings();
      
    } catch (error) {
      console.error('Error removing driver:', error);
      toast.error('Error al remover el conductor');
    }
  };

  // Update booking status
  const updateBookingStatus = async (id: string, newStatus: 'pendiente' | 'designada' | 'en curso' | 'realizada' | 'negada') => {
    try {
      // Update in Supabase if available
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      const updatedBookings = bookings.map(booking => 
        booking.id === id ? { ...booking, status: newStatus } : booking
      );
      
      setBookings(updatedBookings);
      localStorage.setItem('bookings', JSON.stringify(updatedBookings));
      
      // Update statistics
      setCompletedBookings(updatedBookings.filter(b => b.status === 'realizada').length);
      const totalDist = updatedBookings
        .filter(booking => booking.status === 'realizada')
        .reduce((total, booking) => total + booking.distance, 0);
      setTotalDistance(totalDist);
      
      toast.success(`Estado de reserva actualizado a: ${newStatus}`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Error al actualizar el estado de la reserva');
    }
  };

  // Delete booking function
  const handleDeleteBooking = async (id: string) => {
    try {
      // Delete from Supabase if available
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      const updatedBookings = bookings.filter(booking => booking.id !== id);
      setBookings(updatedBookings);
      localStorage.setItem('bookings', JSON.stringify(updatedBookings));
      
      // Update statistics
      setTotalBookings(updatedBookings.length);
      setCompletedBookings(updatedBookings.filter(b => b.status === 'realizada').length);
      const totalDist = updatedBookings
        .filter(booking => booking.status === 'realizada')
        .reduce((total, booking) => total + booking.distance, 0);
      setTotalDistance(totalDist);
      
      toast.success('Reserva eliminada correctamente');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Error al eliminar la reserva');
    }
  };

  // Confirm delete dialog
  const confirmDelete = (id: string) => {
    setBookingToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      dateRange: { from: null, to: null },
      status: 'all',
      userEmail: '',
    });
    setShowFilters(false);
  };

  // Generate route link for Google Maps
  const generateRouteLink = (origin: string, destination: string, intermediateStops?: Array<{placeName: string}>) => {
    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    
    // Add waypoints if there are intermediate stops
    if (intermediateStops && intermediateStops.length > 0) {
      const waypoints = intermediateStops.map(stop => encodeURIComponent(stop.placeName)).join('|');
      url += `&waypoints=${waypoints}`;
    }
    
    return url;
  };

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return String(dateString);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'designada':
        return 'bg-blue-900/30 text-blue-300 border-blue-500/30';
      case 'en curso':
        return 'bg-purple-900/30 text-purple-300 border-purple-500/30';
      case 'negada':
        return 'bg-red-900/30 text-red-300 border-red-500/30';
      case 'realizada':
        return 'bg-green-900/30 text-green-300 border-green-500/30';
      default:
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'designada':
        return <AlertCircle className="h-3 w-3 mr-1" />;
      case 'en curso':
        return <Route className="h-3 w-3 mr-1" />;
      case 'negada':
        return <XCircle className="h-3 w-3 mr-1" />;
      case 'realizada':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      default:
        return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  // Filter bookings based on search term and filters
  const filteredBookings = bookings.filter(booking => {
    // Search term filter
    const matchesSearch = 
      booking.userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.userData.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.destination.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Unassigned filter
    if (showUnassignedOnly && booking.id_conductor) return false;
    
    // Status filter
    if (filters.status !== 'all' && booking.status !== filters.status) return false;
    
    // User email filter
    if (filters.userEmail && booking.userData.email !== filters.userEmail) return false;
    
    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const bookingDate = new Date(booking.departureDate);
      
      if (filters.dateRange.from && bookingDate < filters.dateRange.from) return false;
      if (filters.dateRange.to && bookingDate > filters.dateRange.to) return false;
    }
    
    return true;
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-slate-900 p-4 md:p-8">
      <div className="absolute inset-0 grid-lines opacity-20"></div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Panel de Administración</h1>
            <p className="text-gray-400">Gestión de reservas y vehículos</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')} 
            className="mt-4 md:mt-0 border-blue-500/30 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al sitio
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/60 border border-blue-500/20 backdrop-blur-xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Total Reservas</CardDescription>
              <CardTitle className="text-3xl text-white">{totalBookings}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-gray-500">
                Todas las reservas registradas
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/60 border border-blue-500/20 backdrop-blur-xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Reservas Completadas</CardDescription>
              <CardTitle className="text-3xl text-white">{completedBookings}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-gray-500">
                {completedBookings > 0 ? `${Math.round((completedBookings / totalBookings) * 100)}% del total` : '0% del total'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/60 border border-blue-500/20 backdrop-blur-xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Distancia Total</CardDescription>
              <CardTitle className="text-3xl text-white">{totalDistance.toFixed(2)} km</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-gray-500">
                Kilometraje total recorrido
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/60 border border-blue-500/20 backdrop-blur-xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Ingresos Estimados</CardDescription>
              <CardTitle className="text-3xl text-white">
                ${bookings
                  .filter(b => b.status === 'realizada')
                  .reduce((total, booking) => {
                    const cost = typeof booking.cost === 'number' ? booking.cost : parseFloat(booking.cost);
                    return total + (isNaN(cost) ? 0 : cost);
                  }, 0).toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-gray-500">
                Reservas completadas
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 md:w-[600px] bg-slate-800/60 border border-blue-500/20">
            <TabsTrigger value="bookings" className="data-[state=active]:bg-blue-800/30 data-[state=active]:text-white">Reservas</TabsTrigger>
            <TabsTrigger value="drivers" className="data-[state=active]:bg-blue-800/30 data-[state=active]:text-white">Conductores</TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-blue-800/30 data-[state=active]:text-white">Clientes</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-blue-800/30 data-[state=active]:text-white">Informes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bookings" className="space-y-4">
            <Card className="bg-slate-900/60 border border-blue-500/20 backdrop-blur-xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <CardTitle className="text-gradient bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Reservas</CardTitle>
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mt-4 md:mt-0 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Buscar reservas..."
                        className="pl-8 bg-slate-800/60 border-blue-500/30 text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-400">
                        <input
                          type="checkbox"
                          checked={showUnassignedOnly}
                          onChange={(e) => setShowUnassignedOnly(e.target.checked)}
                          className="mr-2"
                        />
                        Solo sin conductor
                      </label>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setShowFilters(!showFilters)}
                      className={`border-blue-500/30 ${showFilters ? 'bg-blue-900/30 text-blue-300' : 'text-blue-400'}`}
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={fetchBookings}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300"
                    >
                      Actualizar
                    </Button>
                  </div>
                </div>
                
                {/* Filters panel */}
                {showFilters && (
                  <div className="mt-4 p-4 bg-slate-800/50 rounded-md border border-blue-500/20">
                    <div className="font-medium text-blue-400 mb-3 flex items-center justify-between">
                      <span>Filtros avanzados</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={resetFilters}
                        className="text-xs text-gray-400 hover:text-gray-300"
                      >
                        Resetear filtros
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Date filter */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Fecha</label>
                        <Input
                          type="date"
                          className="bg-slate-800/60 border-blue-500/30 text-white"
                          onChange={(e) => setFilters({
                            ...filters,
                            dateRange: { 
                              ...filters.dateRange, 
                              from: e.target.value ? new Date(e.target.value) : null 
                            }
                          })}
                        />
                      </div>
                      
                      {/* Status filter */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Estado</label>
                        <Select 
                          value={filters.status}
                          onValueChange={(value) => setFilters({...filters, status: value})}
                        >
                          <SelectTrigger className="bg-slate-800/60 border-blue-500/30 text-white">
                            <SelectValue placeholder="Todos los estados" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-
