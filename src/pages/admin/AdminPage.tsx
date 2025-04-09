
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
import { CalendarRange, Search, MapPin, User, Bus, Clock, AlertCircle, CheckCircle, XCircle, Route, ArrowLeft, ExternalLink, Calendar, Filter, Trash2 } from "lucide-react";
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

  // Check admin access and redirect if not authorized
  useEffect(() => {
    // Check if user is logged in and is admin
    if (user) {
      if (isAdmin) {
        fetchBookings();
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
          intermediate_stops: booking.intermediate_stops || []
        }));
      }

      // Also check localStorage for backward compatibility
      const storedBookings = localStorage.getItem('bookings');
      if (storedBookings) {
        try {
          const parsedBookings = JSON.parse(storedBookings);
          // Merge with any bookings that might be only in localStorage
          // This is for backwards compatibility
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
  
  // Filter bookings based on search term and filters
  const filteredBookings = bookings.filter(booking => {
    // Search term filter
    const matchesSearch = 
      booking.userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.userData.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.destination.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
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
        return 'bg-blue-900/30 text-blue-300 border border-blue-500/30';
      case 'en curso':
        return 'bg-purple-900/30 text-purple-300 border border-purple-500/30';
      case 'negada':
        return 'bg-red-900/30 text-red-300 border border-red-500/30';
      case 'realizada':
        return 'bg-green-900/30 text-green-300 border border-green-500/30';
      default:
        return 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/30';
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
            <TabsTrigger value="vehicles" className="data-[state=active]:bg-blue-800/30 data-[state=active]:text-white">Vehículos</TabsTrigger>
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
                          <SelectContent className="bg-slate-800 border-blue-500/30">
                            <SelectItem value="all">Todos</SelectItem>
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
                          <SelectContent className="bg-slate-800 border-blue-500/30 max-h-[200px]">
                            <SelectItem value="">Todos</SelectItem>
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
                  <div className="flex flex-col items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-300">Cargando reservas...</p>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <Table className="border-collapse">
                      <TableCaption className="text-gray-500">Lista de reservas activas</TableCaption>
                      <TableHeader>
                        <TableRow className="border-b border-blue-500/20">
                          <TableHead className="text-gray-300">Cliente</TableHead>
                          <TableHead className="text-gray-300">Ruta</TableHead>
                          <TableHead className="text-gray-300">Vehículo</TableHead>
                          <TableHead className="text-gray-300">Fecha</TableHead>
                          <TableHead className="text-gray-300">Estado</TableHead>
                          <TableHead className="text-gray-300">Precio</TableHead>
                          <TableHead className="text-right text-gray-300">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.length > 0 ? (
                          filteredBookings.map((booking) => (
                            <TableRow key={booking.id} className="border-b border-blue-500/10 hover:bg-blue-900/10">
                              <TableCell className="text-gray-200">
                                <div className="flex flex-col">
                                  <span className="font-medium">{booking.userData.name}</span>
                                  <span className="text-sm text-gray-400">{booking.userData.phone}</span>
                                  <span className="text-xs text-gray-500">{booking.userData.email}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-200">
                                <div className="flex flex-col">
                                  <span className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1 text-blue-400" /> {booking.origin}
                                  </span>
                                  <span className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1 text-blue-400" fill="currentColor" /> {booking.destination}
                                  </span>
                                  {booking.intermediate_stops && booking.intermediate_stops.length > 0 && (
                                    <div className="ml-4 mt-1">
                                      <span className="text-xs text-blue-300">Paradas intermedias:</span>
                                      <ul className="list-disc list-inside text-xs text-gray-400">
                                        {booking.intermediate_stops.map((stop, idx) => (
                                          <li key={stop.id || idx}>{stop.placeName}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {booking.duration && (
                                    <span className="text-xs text-gray-400 mt-1">
                                      <Clock className="h-3 w-3 inline mr-1" /> {booking.duration}
                                    </span>
                                  )}
                                  <a 
                                    href={generateRouteLink(booking.origin, booking.destination, booking.intermediate_stops)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs flex items-center mt-1 text-blue-400 hover:text-blue-300"
                                  >
                                    <ExternalLink size={12} className="mr-1" /> Ver en Google Maps
                                  </a>
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-200">
                                <div className="flex items-center gap-2">
                                  <Bus className="h-4 w-4 text-blue-400" />
                                  <span className="capitalize">{booking.vehicleType}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-200">
                                <div className="flex flex-col">
                                  <span className="flex items-center">
                                    <CalendarRange className="h-3 w-3 mr-1 text-gray-400" /> 
                                    {formatDate(booking.departureDate)}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1 text-gray-400" /> {booking.departureTime}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs flex items-center w-fit ${getStatusBadgeClass(booking.status)}`}>
                                  {getStatusIcon(booking.status)} {booking.status}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium text-gray-200">
                                ${typeof booking.cost === 'number' ? booking.cost.toFixed(2) : booking.cost}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end items-center space-x-2">
                                  <Select 
                                    value={booking.status}
                                    onValueChange={(value) => updateBookingStatus(
                                      booking.id, 
                                      value as 'pendiente' | 'designada' | 'en curso' | 'realizada' | 'negada'
                                    )}
                                  >
                                    <SelectTrigger className="w-[130px] bg-slate-800/60 border-blue-500/30 text-gray-200">
                                      <SelectValue placeholder="Cambiar estado" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-blue-500/30">
                                      <SelectItem value="pendiente" className="text-yellow-300">Pendiente</SelectItem>
                                      <SelectItem value="designada" className="text-blue-300">Designada</SelectItem>
                                      <SelectItem value="en curso" className="text-purple-300">En curso</SelectItem>
                                      <SelectItem value="realizada" className="text-green-300">Realizada</SelectItem>
                                      <SelectItem value="negada" className="text-red-300">Negada</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => confirmDelete(booking.id)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                              No se encontraron reservas
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="vehicles">
            <Card className="bg-slate-900/60 border border-blue-500/20 backdrop-blur-xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <CardHeader>
                <CardTitle className="text-gradient bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Gestión de Vehículos</CardTitle>
                <CardDescription className="text-gray-400">
                  Administre la flota de vehículos disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['Sedan', 'SUV', 'Van', 'Bus', 'Minibus'].map(vehicleType => (
                    <Card key={vehicleType} className="bg-slate-800/60 border border-blue-500/20">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl text-white">{vehicleType}</CardTitle>
                          <Bus className="h-6 w-6 text-blue-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-gray-300">
                          <div className="flex justify-between mb-1">
                            <span>Precio base:</span>
                            <span className="font-medium">${vehicleType === 'Bus' ? '50.00' : vehicleType === 'Van' ? '45.00' : vehicleType === 'SUV' ? '40.00' : vehicleType === 'Minibus' ? '55.00' : '35.00'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Capacidad:</span>
                            <span className="font-medium">{vehicleType === 'Bus' ? '35' : vehicleType === 'Van' ? '12' : vehicleType === 'SUV' ? '6' : vehicleType === 'Minibus' ? '20' : '4'} pasajeros</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="customers">
            <Card className="bg-slate-900/60 border border-blue-500/20 backdrop-blur-xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <CardHeader>
                <CardTitle className="text-gradient bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Gestión de Clientes</CardTitle>
                <CardDescription className="text-gray-400">
                  Clientes registrados en la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-blue-500/20">
                        <TableHead className="text-gray-300">Usuario</TableHead>
                        <TableHead className="text-gray-300">Email</TableHead>
                        <TableHead className="text-gray-300">Reservas</TableHead>
                        <TableHead className="text-gray-300">Total Gastado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uniqueUsers.length > 0 ? uniqueUsers.map((email) => {
                        const userBookings = bookings.filter(b => b.userData.email === email);
                        const userTotalSpent = userBookings
                          .filter(b => b.status === 'realizada')
                          .reduce((total, booking) => {
                            const cost = typeof booking.cost === 'number' ? booking.cost : parseFloat(booking.cost);
                            return total + (isNaN(cost) ? 0 : cost);
                          }, 0);
                        
                        return (
                          <TableRow key={email} className="border-b border-blue-500/10 hover:bg-blue-900/10">
                            <TableCell className="text-gray-200">{userBookings[0]?.userData.name || 'Usuario'}</TableCell>
                            <TableCell className="text-gray-200">{email}</TableCell>
                            <TableCell className="text-gray-200">{userBookings.length}</TableCell>
                            <TableCell className="text-gray-200">${userTotalSpent.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                            No hay clientes registrados
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card className="bg-slate-900/60 border border-blue-500/20 backdrop-blur-xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <CardHeader>
                <CardTitle className="text-gradient bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Informes y Estadísticas</CardTitle>
                <CardDescription className="text-gray-400">
                  Resumen de actividad y rendimiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Reservas por Estado</h3>
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-blue-500/20">
                      <div className="space-y-3">
                        {['pendiente', 'designada', 'en curso', 'realizada', 'negada'].map(status => {
                          const count = bookings.filter(b => b.status === status).length;
                          const percentage = totalBookings > 0 ? (count / totalBookings) * 100 : 0;
                          
                          return (
                            <div key={status} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm capitalize text-gray-300">{status}</span>
                                <span className="text-sm text-gray-400">{count} ({percentage.toFixed(1)}%)</span>
                              </div>
                              <div className="w-full bg-slate-700/50 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    status === 'realizada' ? 'bg-green-500/70' : 
                                    status === 'negada' ? 'bg-red-500/70' : 
                                    status === 'designada' ? 'bg-blue-500/70' : 
                                    status === 'en curso' ? 'bg-purple-500/70' : 
                                    'bg-yellow-500/70'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Vehículos más Usados</h3>
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-blue-500/20">
                      <div className="space-y-3">
                        {(() => {
                          // Count vehicle types
                          const vehicleCounts: Record<string, number> = {};
                          bookings.forEach(booking => {
                            if (!vehicleCounts[booking.vehicleType]) {
                              vehicleCounts[booking.vehicleType] = 0;
                            }
                            vehicleCounts[booking.vehicleType]++;
                          });
                          
                          // Convert to array and sort
                          const sortedVehicles = Object.entries(vehicleCounts)
                            .map(([type, count]) => ({ type, count }))
                            .sort((a, b) => b.count - a.count);
                          
                          if (sortedVehicles.length === 0) {
                            return (
                              <div className="text-center py-8 text-gray-400">
                                No hay datos disponibles
                              </div>
                            );
                          }
                          
                          return sortedVehicles.map(({ type, count }) => {
                            const percentage = totalBookings > 0 ? (count / totalBookings) * 100 : 0;
                            
                            return (
                              <div key={type} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm capitalize text-gray-300">{type}</span>
                                  <span className="text-sm text-gray-400">{count} ({percentage.toFixed(1)}%)</span>
                                </div>
                                <div className="w-full bg-slate-700/50 rounded-full h-2">
                                  <div 
                                    className="h-2 rounded-full bg-blue-500/70"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-center pt-4 border-t border-blue-500/20">
                <Button 
                  onClick={() => {
                    const csvContent = [
                      ["Usuario", "Email", "Origen", "Destino", "Vehículo", "Fecha", "Estado", "Costo"].join(","),
                      ...bookings.map(b => [
                        b.userData.name,
                        b.userData.email,
                        b.origin,
                        b.destination,
                        b.vehicleType,
                        formatDate(b.departureDate),
                        b.status,
                        b.cost
                      ].join(","))
                    ].join("\n");
                    
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement("a");
                    const url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", `reservas_${new Date().toLocaleDateString()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("Reporte descargado correctamente");
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-900/20 border border-blue-500/50"
                >
                  Descargar Reporte CSV
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-red-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar reserva?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Esta acción no se puede deshacer. La reserva será eliminada permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 text-white border-slate-500">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-900/70 hover:bg-red-800 text-white border border-red-500/50"
              onClick={() => {
                if (bookingToDelete) {
                  handleDeleteBooking(bookingToDelete);
                }
              }}
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
