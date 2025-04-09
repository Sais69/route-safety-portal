
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
import { CalendarRange, Search, MapPin, User, Bus, Clock, AlertCircle, CheckCircle, XCircle, Route, ArrowLeft, ExternalLink } from "lucide-react";
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
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [completedBookings, setCompletedBookings] = useState(0);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        // Check if the user is an admin (email ends with @admin.com for this demo)
        // In a real app, you would check against admin roles in your database
        if (user.email && user.email.endsWith('@admin.com')) {
          setIsAdmin(true);
          await fetchBookings();
        } else {
          toast.error('No tiene permisos de administrador');
          navigate('/');
        }
      }
    };

    checkAdminStatus();
  }, [user, navigate]);

  // Load bookings from Supabase and localStorage
  const fetchBookings = async () => {
    try {
      // Try to get bookings from Supabase first
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings from Supabase:', error);
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
          createdAt: booking.created_at
        }));
      }

      // Also check localStorage for backward compatibility
      const storedBookings = localStorage.getItem('bookings');
      if (storedBookings) {
        try {
          const parsedBookings = JSON.parse(storedBookings);
          // Merge with any bookings that might be only in localStorage (for backward compatibility)
          const idSet = new Set(allBookings.map(b => b.id));
          const localOnlyBookings = parsedBookings.filter((b: any) => !idSet.has(b.id));
          allBookings = [...allBookings, ...localOnlyBookings];
        } catch (e) {
          console.error('Error parsing local bookings', e);
        }
      }

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
      
    } catch (e) {
      console.error('Error fetching bookings:', e);
      toast.error('Error al cargar las reservas');
    }
  };

  // Handle admin login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await signIn(username, password);
      // The useEffect will check if user is admin after login
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Credenciales incorrectas');
    }
  };
  
  // Filter bookings based on search term
  const filteredBookings = bookings.filter(booking => 
    booking.userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.userData.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update booking status
  const updateBookingStatus = (id: string, newStatus: 'pendiente' | 'designada' | 'en curso' | 'realizada' | 'negada') => {
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
  };

  // Generate route link for Google Maps
  const generateRouteLink = (origin: string, destination: string) => {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
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

  // If user is not authenticated or not admin, show login form
  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-slate-900">
        <div className="absolute inset-0 grid-lines opacity-20"></div>
        <Card className="w-full max-w-md mx-4 bg-slate-900/60 border border-blue-500/20 backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.2)]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-gradient bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Panel de Administrador</CardTitle>
            <CardDescription className="text-gray-400">Inicie sesión para acceder al panel de gestión de reservas</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-300">Correo electrónico</label>
                <Input 
                  id="username" 
                  type="email"
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required
                  className="bg-slate-800/60 border-blue-500/30 text-white"
                  placeholder="admin@admin.com"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-300">Contraseña</label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                  className="bg-slate-800/60 border-blue-500/30 text-white"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-500/50"
                >
                  Iniciar Sesión
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/')} 
                  className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300"
                >
                  Volver
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  <div className="relative w-full md:w-80 mt-4 md:mt-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar reservas..."
                      className="pl-8 bg-slate-800/60 border-blue-500/30 text-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
                      {filteredBookings.map((booking) => (
                        <TableRow key={booking.id} className="border-b border-blue-500/10 hover:bg-blue-900/10">
                          <TableCell className="text-gray-200">
                            <div className="flex flex-col">
                              <span className="font-medium">{booking.userData.name}</span>
                              <span className="text-sm text-gray-400">{booking.userData.phone}</span>
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
                              {booking.duration && (
                                <span className="text-xs text-gray-400 mt-1">
                                  <Clock className="h-3 w-3 inline mr-1" /> {booking.duration}
                                </span>
                              )}
                              <a 
                                href={generateRouteLink(booking.origin, booking.destination)} 
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
                                {booking.departureDate instanceof Date 
                                  ? booking.departureDate.toISOString().split('T')[0]
                                  : booking.departureDate}
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
                            <Select 
                              defaultValue={booking.status}
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
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredBookings.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                            No se encontraron reservas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
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
                <p className="text-gray-300">Esta sección está en desarrollo.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="customers">
            <Card className="bg-slate-900/60 border border-blue-500/20 backdrop-blur-xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <CardHeader>
                <CardTitle className="text-gradient bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Gestión de Clientes</CardTitle>
                <CardDescription className="text-gray-400">
                  Administre los clientes registrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Esta sección está en desarrollo.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card className="bg-slate-900/60 border border-blue-500/20 backdrop-blur-xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <CardHeader>
                <CardTitle className="text-gradient bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Informes y Estadísticas</CardTitle>
                <CardDescription className="text-gray-400">
                  Visualice estadísticas y genere informes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Esta sección está en desarrollo.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
