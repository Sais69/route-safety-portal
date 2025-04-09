
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
import { Label } from "@/components/ui/label";
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
      // Use the get_all_bookings function to retrieve all bookings
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
        console.log('Fetched bookings:', data.length);
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
      // Use type casting to tell TypeScript this is valid
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('nombre', { ascending: true }) as { data: Driver[] | null; error: any };
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setDrivers(data);
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
          .eq('id', driver.id) as { error: any };
          
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
          }) as { error: any };
          
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
        .eq('id', id) as { error: any };
        
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
        .single() as { data: Driver | null; error: any };
      
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
                          <SelectContent className="bg-slate-800 border-blue-500/30 text-white">
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="designada">Designada</SelectItem>
                            <SelectItem value="en curso">En curso</SelectItem>
                            <SelectItem value="realizada">Realizada</SelectItem>
                            <SelectItem value="negada">Negada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* User filter */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Usuario</label>
                        <Select 
                          value={filters.userEmail}
                          onValueChange={(value) => setFilters({...filters, userEmail: value})}
                        >
                          <SelectTrigger className="bg-slate-800/60 border-blue-500/30 text-white">
                            <SelectValue placeholder="Todos los usuarios" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-blue-500/30 text-white">
                            <SelectItem value="">Todos los usuarios</SelectItem>
                            {uniqueUsers.map(email => (
                              <SelectItem key={email} value={email}>{email}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <p className="text-gray-400">Cargando reservas...</p>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-gray-400">No hay reservas que coincidan con los filtros</p>
                    <Button 
                      variant="link"
                      onClick={() => {
                        setSearchTerm('');
                        setShowUnassignedOnly(false);
                        resetFilters();
                      }}
                      className="mt-2 text-blue-400"
                    >
                      Borrar filtros
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-800/60">
                      <TableRow className="hover:bg-slate-700/50 border-blue-500/20">
                        <TableHead className="text-blue-200">Usuario</TableHead>
                        <TableHead className="text-blue-200">Ruta</TableHead>
                        <TableHead className="text-blue-200 hidden md:table-cell">Fecha</TableHead>
                        <TableHead className="text-blue-200 hidden md:table-cell">Estado</TableHead>
                        <TableHead className="text-blue-200 hidden md:table-cell">Conductor</TableHead>
                        <TableHead className="text-blue-200">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow key={booking.id} className="hover:bg-slate-800/60 border-blue-500/10">
                          <TableCell className="align-top">
                            <div>
                              <p className="font-medium text-white">{booking.userData.name}</p>
                              <p className="text-sm text-gray-400">{booking.userData.email}</p>
                              <p className="text-xs text-gray-400">{booking.userData.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div>
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 text-blue-400 mr-1" /> 
                                <p className="text-sm text-gray-300">{booking.origin}</p>
                              </div>
                              <div className="flex items-center mt-1">
                                <MapPin className="h-3 w-3 text-red-400 mr-1" fill="currentColor" /> 
                                <p className="text-sm text-gray-300">{booking.destination}</p>
                              </div>
                              <div className="mt-1 flex items-center space-x-1">
                                <Badge variant="outline" className="text-xs text-white border-blue-500/20 bg-blue-900/20">{booking.vehicleType}</Badge>
                                <Badge variant="outline" className="text-xs text-white border-blue-500/20 bg-blue-900/20">{booking.distance.toFixed(1)} km</Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top hidden md:table-cell">
                            <div>
                              <p className="text-sm text-gray-300">{formatDate(booking.departureDate)}</p>
                              <p className="text-xs text-gray-400">{booking.departureTime}</p>
                              {booking.returnDate && (
                                <div className="mt-1 border-t border-gray-800 pt-1">
                                  <p className="text-xs text-gray-400">Retorno:</p>
                                  <p className="text-sm text-gray-300">{formatDate(booking.returnDate)}</p>
                                  <p className="text-xs text-gray-400">{booking.returnTime}</p>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-top hidden md:table-cell">
                            <Badge className={`flex items-center ${getStatusBadgeClass(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-top hidden md:table-cell">
                            {booking.id_conductor ? (
                              <div className="space-y-1">
                                <p className="text-sm text-white">{booking.nombre_conductor}</p>
                                <div className="flex items-center text-xs text-gray-400">
                                  <CarTaxiFront className="h-3 w-3 mr-1" />
                                  {booking.placa_vehiculo} - {booking.modelo_vehiculo}
                                </div>
                                <div className="flex items-center text-xs text-gray-400">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {booking.numero_celular_conductor}
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="outline" 
                                size="sm"
                                className="text-xs border-blue-500/30 text-blue-400 hover:bg-blue-900/30"
                                onClick={() => {
                                  setBookingForDriverAssign(booking);
                                  setIsDriverAssignDialogOpen(true);
                                }}
                              >
                                <UserPlus className="h-3 w-3 mr-1" />
                                Asignar conductor
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="flex flex-col space-y-2">
                              {/* Status Update Dropdown */}
                              <Select 
                                value={booking.status}
                                onValueChange={(value) => 
                                  updateBookingStatus(booking.id, value as 'pendiente' | 'designada' | 'en curso' | 'realizada' | 'negada')
                                }
                              >
                                <SelectTrigger className="w-32 h-8 text-xs bg-slate-800/60 border-blue-500/30">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-blue-500/30 text-white">
                                  <SelectItem value="pendiente">Pendiente</SelectItem>
                                  <SelectItem value="designada">Designada</SelectItem>
                                  <SelectItem value="en curso">En curso</SelectItem>
                                  <SelectItem value="realizada">Realizada</SelectItem>
                                  <SelectItem value="negada">Negada</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {/* Driver button (only shown on mobile) */}
                              <div className="block md:hidden">
                                {booking.id_conductor ? (
                                  <Button
                                    variant="outline" 
                                    size="sm"
                                    className="w-32 h-8 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-900/30"
                                    onClick={() => {
                                      setBookingForDriverAssign(booking);
                                      setIsDriverAssignDialogOpen(true);
                                    }}
                                  >
                                    <UserCog className="h-3 w-3 mr-1" />
                                    Ver conductor
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline" 
                                    size="sm"
                                    className="w-32 h-8 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-900/30"
                                    onClick={() => {
                                      setBookingForDriverAssign(booking);
                                      setIsDriverAssignDialogOpen(true);
                                    }}
                                  >
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    Asignar conductor
                                  </Button>
                                )}
                              </div>
                              
                              {/* Action buttons */}
                              <div className="flex space-x-1">
                                <a 
                                  href={generateRouteLink(booking.origin, booking.destination, booking.intermediate_stops)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 bg-slate-800/60 border border-blue-500/30 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                                
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  className="h-8 w-8 border-red-500/30 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                                  onClick={() => confirmDelete(booking.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="drivers" className="space-y-4">
            <Card className="bg-slate-900/60 border border-blue-500/20 backdrop-blur-xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <CardTitle className="text-gradient bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Conductores</CardTitle>
                  <Button 
                    onClick={() => {
                      setCurrentDriver(null);
                      setIsDriverDialogOpen(true);
                    }} 
                    className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" /> Agregar conductor
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {drivers.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <p className="text-gray-400">No hay conductores registrados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-800/60">
                      <TableRow className="hover:bg-slate-700/50 border-blue-500/20">
                        <TableHead className="text-blue-200">Nombre</TableHead>
                        <TableHead className="text-blue-200">Contacto</TableHead>
                        <TableHead className="text-blue-200">Vehículo</TableHead>
                        <TableHead className="text-blue-200">Disponible</TableHead>
                        <TableHead className="text-blue-200">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drivers.map((driver) => (
                        <TableRow key={driver.id} className="hover:bg-slate-800/60 border-blue-500/10">
                          <TableCell>
                            <div>
                              <p className="font-medium text-white">{driver.nombre} {driver.apellido}</p>
                              <p className="text-xs text-gray-400">ID: {driver.id.substring(0, 8)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 text-blue-400 mr-2" /> 
                              <p className="text-sm text-gray-300">{driver.numero_celular}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm text-gray-300">{driver.modelo_vehiculo}</p>
                              <p className="text-xs text-gray-400">Placa: {driver.placa_vehiculo}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={driver.disponible 
                              ? 'bg-green-900/30 text-green-300 border-green-500/30' 
                              : 'bg-red-900/30 text-red-300 border-red-500/30'}>
                              {driver.disponible ? 'Disponible' : 'No disponible'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                variant="outline" 
                                size="icon"
                                className="h-8 w-8 border-blue-500/30 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300"
                                onClick={() => {
                                  setCurrentDriver(driver);
                                  setIsDriverDialogOpen(true);
                                }}
                              >
                                <UserCog className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-8 w-8 border-red-500/30 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                                onClick={() => {
                                  setDriverToDelete(driver.id);
                                  setIsDriverDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="customers" className="space-y-4">
            <Card className="bg-slate-900/60 border border-blue-500/20 backdrop-blur-xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <CardHeader>
                <CardTitle className="text-gradient bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-8">
                  <p className="text-gray-400">Función en desarrollo</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports" className="space-y-4">
            <Card className="bg-slate-900/60 border border-blue-500/20 backdrop-blur-xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <CardHeader>
                <CardTitle className="text-gradient bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Informes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-8">
                  <p className="text-gray-400">Función en desarrollo</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Driver form dialog */}
      <Dialog open={isDriverDialogOpen} onOpenChange={setIsDriverDialogOpen}>
        <DialogContent className="bg-slate-900 border border-blue-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{currentDriver ? 'Editar conductor' : 'Agregar nuevo conductor'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {currentDriver 
                ? 'Actualice la información del conductor' 
                : 'Complete los datos para registrar un nuevo conductor'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input 
                  id="nombre" 
                  className="bg-slate-800 border-blue-500/30"
                  defaultValue={currentDriver?.nombre || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input 
                  id="apellido" 
                  className="bg-slate-800 border-blue-500/30"
                  defaultValue={currentDriver?.apellido || ''}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="celular">Número de celular</Label>
              <Input 
                id="celular" 
                className="bg-slate-800 border-blue-500/30"
                defaultValue={currentDriver?.numero_celular || ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo de vehículo</Label>
              <Input 
                id="modelo" 
                className="bg-slate-800 border-blue-500/30"
                defaultValue={currentDriver?.modelo_vehiculo || ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="placa">Placa de vehículo</Label>
              <Input 
                id="placa" 
                className="bg-slate-800 border-blue-500/30"
                defaultValue={currentDriver?.placa_vehiculo || ''}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="disponible"
                defaultChecked={currentDriver?.disponible !== false}
                className="rounded border-gray-300"
              />
              <Label htmlFor="disponible">Disponible para asignar</Label>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-blue-500/30 text-blue-400">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              onClick={() => {
                const nombre = (document.getElementById('nombre') as HTMLInputElement).value;
                const apellido = (document.getElementById('apellido') as HTMLInputElement).value;
                const celular = (document.getElementById('celular') as HTMLInputElement).value;
                const modelo = (document.getElementById('modelo') as HTMLInputElement).value;
                const placa = (document.getElementById('placa') as HTMLInputElement).value;
                const disponible = (document.getElementById('disponible') as HTMLInputElement).checked;
                
                if (!nombre || !apellido || !celular || !modelo || !placa) {
                  toast.error('Todos los campos son obligatorios');
                  return;
                }
                
                saveDriver({
                  id: currentDriver?.id,
                  nombre,
                  apellido,
                  numero_celular: celular,
                  modelo_vehiculo: modelo,
                  placa_vehiculo: placa,
                  disponible
                });
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
            >
              {currentDriver ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Driver assignment dialog */}
      <Dialog open={isDriverAssignDialogOpen} onOpenChange={setIsDriverAssignDialogOpen}>
        <DialogContent className="bg-slate-900 border border-blue-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bookingForDriverAssign?.id_conductor 
                ? 'Información del conductor asignado'
                : 'Asignar conductor'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {bookingForDriverAssign?.id_conductor
                ? 'El conductor ya ha sido asignado a esta reserva'
                : 'Seleccione un conductor para asignar a la reserva'}
            </DialogDescription>
          </DialogHeader>
          
          {bookingForDriverAssign?.id_conductor ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white">{bookingForDriverAssign.nombre_conductor}</h3>
                <p className="text-sm text-gray-400">{bookingForDriverAssign.numero_celular_conductor}</p>
              </div>
              
              <div className="border-t border-gray-800 pt-3">
                <h4 className="text-sm font-medium text-gray-300">Información del vehículo</h4>
                <p className="text-gray-400">{bookingForDriverAssign.modelo_vehiculo}</p>
                <p className="text-gray-400">Placa: {bookingForDriverAssign.placa_vehiculo}</p>
              </div>
              
              <Button
                onClick={() => removeDriverFromBooking(bookingForDriverAssign.id)}
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-900/30 hover:text-red-300"
              >
                Remover asignación
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-60 overflow-auto pr-2">
                {drivers
                  .filter(driver => driver.disponible)
                  .length === 0 ? (
                  <div className="flex justify-center py-8">
                    <p className="text-gray-400">No hay conductores disponibles</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {drivers
                      .filter(driver => driver.disponible)
                      .map(driver => (
                      <div 
                        key={driver.id} 
                        className="p-3 border border-blue-500/20 rounded-md hover:bg-slate-800/60 cursor-pointer"
                        onClick={() => {
                          if (bookingForDriverAssign) {
                            assignDriverToBooking(bookingForDriverAssign.id, driver.id);
                          }
                        }}
                      >
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium text-white">{driver.nombre} {driver.apellido}</p>
                            <p className="text-sm text-gray-400">{driver.numero_celular}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-300">{driver.modelo_vehiculo}</p>
                            <p className="text-xs text-gray-400">{driver.placa_vehiculo}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-blue-500/30 text-blue-400">
                Cerrar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border border-red-500/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta reserva?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta acción no se puede deshacer y eliminará permanentemente la reserva.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-400">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bookingToDelete && handleDeleteBooking(bookingToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Driver delete confirmation dialog */}
      <AlertDialog open={isDriverDeleteDialogOpen} onOpenChange={setIsDriverDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border border-red-500/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este conductor?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta acción no se puede deshacer y eliminará permanentemente el conductor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-400">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => driverToDelete && handleDeleteDriver(driverToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPage;
