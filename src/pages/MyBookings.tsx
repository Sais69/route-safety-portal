import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarRange, MapPin, Clock, Route, Car, AlertCircle, RefreshCw, ExternalLink, Users, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import RouteInfo from "./booking/components/RouteInfo";

interface BookingUser {
  name: string;
  email: string;
  phone: string;
}

// Define the type of the bookings table row
type BookingRow = Database['public']['Tables']['bookings']['Row'];

// Define the structure for intermediate stops
interface IntermediateStop {
  id?: string;
  placeName: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface Booking extends BookingRow {
  userData?: BookingUser;
  vehicleType?: string;
  passengerCount?: number;
  departureDate?: string | Date;
  departureTime?: string;
  returnDate?: string | Date | null;
  returnTime?: string | null;
  createdAt?: string;
  // Parse intermediate_stops as IntermediateStop[]
  parsedIntermediateStops?: IntermediateStop[];
  id_conductor?: string;
  nombre_conductor?: string;
  placa_vehiculo?: string;
  modelo_vehiculo?: string;
  numero_celular_conductor?: string;
}

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalDistance, setTotalDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      toast.error("Por favor inicia sesión para ver tus reservas");
      navigate('/login', { state: { from: { pathname: '/my-bookings' } } });
      return;
    }
    
    fetchBookings();
  }, [navigate, user]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      
      // Fetch bookings from Supabase
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user?.id || '')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Process bookings data
      if (data) {
        const processedBookings = data.map((booking: BookingRow) => {
          // Parse intermediate stops to the correct format
          let parsedIntermediateStops: IntermediateStop[] = [];
          
          if (booking.intermediate_stops && Array.isArray(booking.intermediate_stops)) {
            parsedIntermediateStops = booking.intermediate_stops.map((stop) => {
              // Handle different possible formats of stop data
              if (typeof stop === 'string') {
                return { placeName: stop };
              } else if (typeof stop === 'object' && stop !== null) {
                // Try to extract placeName from the object
                const stopObj = stop as Record<string, any>;
                return {
                  id: stopObj.id?.toString() || undefined,
                  placeName: stopObj.placeName?.toString() || "Parada sin nombre",
                  location: stopObj.location || undefined
                };
              }
              return { placeName: "Parada sin nombre" };
            });
          }
          
          return {
            ...booking,
            // Map fields for backward compatibility
            vehicleType: booking.vehicle_type,
            departureDate: booking.departure_date,
            departureTime: booking.departure_time,
            returnDate: booking.return_date,
            returnTime: booking.return_time,
            createdAt: booking.created_at,
            parsedIntermediateStops
          };
        });
        
        setBookings(processedBookings);
        
        // Calculate total distance of completed bookings
        const completedDistance = processedBookings
          .filter(booking => booking.status === 'realizada')
          .reduce((total, booking) => total + Number(booking.distance), 0);
          
        setTotalDistance(completedDistance);
      }
      
      // Also check localStorage for backward compatibility
      const storedBookings = localStorage.getItem('bookings');
      if (storedBookings) {
        try {
          const parsedBookings = JSON.parse(storedBookings);
          // Merge with any bookings that might be only in localStorage
          // This is for backwards compatibility
          // In a production app, we would migrate these to the database
          setBookings(prev => {
            const idSet = new Set(prev.map(b => b.id));
            const newBookings = parsedBookings.filter((b: any) => !idSet.has(b.id));
            return [...prev, ...newBookings];
          });
        } catch (e) {
          console.error('Error parsing local bookings', e);
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error("Error al cargar las reservas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
    toast.success("Reservas actualizadas");
  };

  // Generate Google Maps route link with waypoints
  const generateRouteLink = (origin: string, destination: string, intermediateStops?: IntermediateStop[]) => {
    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    
    // Add waypoints if there are intermediate stops
    if (intermediateStops && intermediateStops.length > 0) {
      const waypoints = intermediateStops.map(stop => encodeURIComponent(stop.placeName)).join('|');
      url += `&waypoints=${waypoints}`;
    }
    
    return url;
  };

  const pendingBookings = bookings.filter(booking => booking.status === 'pendiente' || booking.status === 'designada');
  const activeBookings = bookings.filter(booking => booking.status === 'en curso');
  const completedBookings = bookings.filter(booking => booking.status === 'realizada');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 12
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      <Header />
      <main className="flex-grow py-8 px-4 mt-16">
        <div className="container mx-auto max-w-6xl relative">
          {/* Decorative elements */}
          <div className="absolute top-20 -left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 -right-10 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/5 via-transparent to-transparent pointer-events-none"></div>
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="relative z-10"
          >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Mis Reservas</h1>
                <p className="text-gray-400">Gestione sus viajes y vea su historial de reservas</p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh} 
                  disabled={refreshing || isLoading}
                  className="flex items-center gap-2 border-blue-500/20 hover:bg-blue-900/20"
                >
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                  {refreshing ? "Actualizando..." : "Actualizar"}
                </Button>
                <div className="bg-gradient-to-r from-blue-500/20 to-indigo-600/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <p className="text-sm font-medium text-blue-300">Total recorrido</p>
                  <p className="text-2xl font-bold">{totalDistance.toFixed(2)} km</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Tabs defaultValue="all" className="space-y-6">
                <TabsList className="grid grid-cols-4 w-full max-w-md mb-8 bg-slate-800/50 border border-blue-500/20">
                  <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Todas</TabsTrigger>
                  <TabsTrigger value="pending" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Pendientes</TabsTrigger>
                  <TabsTrigger value="active" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">En curso</TabsTrigger>
                  <TabsTrigger value="completed" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Completadas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-6">
                  {isLoading ? (
                    <Card className="glass-card bg-slate-900/50 border-blue-500/20">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mb-4"></div>
                        <p>Cargando reservas...</p>
                      </CardContent>
                    </Card>
                  ) : bookings.length === 0 ? (
                    <Card className="glass-card bg-slate-900/50 border-blue-500/20">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Route size={48} className="text-blue-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No tiene reservas</h3>
                        <p className="text-gray-400 mb-4">Empiece reservando un nuevo viaje</p>
                        <Button 
                          onClick={() => navigate('/booking')}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-600/50 transition-all duration-300"
                        >
                          Reservar ahora
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    bookings.map((booking, index) => (
                      <motion.div 
                        key={booking.id} 
                        variants={itemVariants}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          transition: { delay: index * 0.1 } 
                        }}
                      >
                        <BookingCard booking={booking} />
                      </motion.div>
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="pending" className="space-y-6">
                  {pendingBookings.length === 0 ? (
                    <Card className="glass-card bg-slate-900/50 border-blue-500/20">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle size={48} className="text-blue-400 mb-4" />
                        <p className="text-gray-400">No hay reservas pendientes</p>
                      </CardContent>
                    </Card>
                  ) : (
                    pendingBookings.map((booking, index) => (
                      <motion.div 
                        key={booking.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          transition: { delay: index * 0.1 } 
                        }}
                      >
                        <BookingCard booking={booking} />
                      </motion.div>
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="active" className="space-y-6">
                  {activeBookings.length === 0 ? (
                    <Card className="glass-card bg-slate-900/50 border-blue-500/20">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle size={48} className="text-blue-400 mb-4" />
                        <p className="text-gray-400">No hay reservas en curso</p>
                      </CardContent>
                    </Card>
                  ) : (
                    activeBookings.map((booking, index) => (
                      <motion.div 
                        key={booking.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          transition: { delay: index * 0.1 } 
                        }}
                      >
                        <BookingCard booking={booking} />
                      </motion.div>
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="space-y-6">
                  {completedBookings.length === 0 ? (
                    <Card className="glass-card bg-slate-900/50 border-blue-500/20">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle size={48} className="text-blue-400 mb-4" />
                        <p className="text-gray-400">No hay reservas completadas</p>
                      </CardContent>
                    </Card>
                  ) : (
                    completedBookings.map((booking, index) => (
                      <motion.div 
                        key={booking.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          transition: { delay: index * 0.1 } 
                        }}
                      >
                        <BookingCard booking={booking} />
                      </motion.div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const BookingCard = ({ booking }: { booking: Booking }) => {
  // Generate Google Maps route link with waypoints
  const generateRouteLink = (origin: string, destination: string, intermediateStops?: IntermediateStop[]) => {
    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    
    // Add waypoints if there are intermediate stops
    if (intermediateStops && intermediateStops.length > 0) {
      const waypoints = intermediateStops.map(stop => encodeURIComponent(stop.placeName)).join('|');
      url += `&waypoints=${waypoints}`;
    }
    
    return url;
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'designada':
        return 'bg-blue-900/30 text-blue-300 border-blue-500/30';
      case 'en curso':
        return 'bg-purple-900/30 text-purple-300 border-purple-500/30';
      case 'realizada':
        return 'bg-green-900/30 text-green-300 border-green-500/30';
      case 'negada':
        return 'bg-red-900/30 text-red-300 border-red-500/30';
      default:
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendiente': return 'Pendiente';
      case 'designada': return 'Designada';
      case 'en curso': return 'En curso';
      case 'realizada': return 'Completada';
      case 'negada': return 'Cancelada';
      default: return status;
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'designada': return 'border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]';
      case 'en curso': return 'border-purple-500/30 shadow-[0_0_10px_rgba(139,92,246,0.3)]';
      case 'realizada': return 'border-green-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
      case 'negada': return 'border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
      default: return 'border-yellow-500/30 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  const destination = booking.destination.split(',')[0];
  const formattedDate = formatDate(booking.departure_date || (booking.departureDate as string));
  const departureTime = booking.departure_time || booking.departureTime;
  const vehicleType = booking.vehicle_type || booking.vehicleType;
  const intermediateStops = booking.parsedIntermediateStops || [];
  
  // Driver information
  const hasDriverAssigned = booking.id_conductor || booking.nombre_conductor;

  return (
    <Card className={`glass-card bg-slate-900/50 overflow-hidden border ${getBorderColor(booking.status)} backdrop-blur-sm hover:bg-slate-800/50 transition-colors`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-white">Viaje a {destination}</CardTitle>
            <CardDescription className="flex items-center mt-1 text-gray-400">
              <CalendarRange size={16} className="mr-1" />
              {formattedDate} • {departureTime}
            </CardDescription>
          </div>
          <Badge className={`${getStatusBadgeClass(booking.status)} text-xs py-1 px-3 rounded-full border`}>
            {getStatusText(booking.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-gray-400">Origen</span>
              <div className="flex items-start">
                <MapPin size={18} className="text-blue-400 mt-1 mr-1 flex-shrink-0" />
                <span className="font-medium text-sm text-gray-300">{booking.origin}</span>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-gray-400">Destino</span>
              <div className="flex items-start">
                <MapPin size={18} className="text-indigo-400 mt-1 mr-1 flex-shrink-0" fill="currentColor" />
                <span className="font-medium text-sm text-gray-300">{booking.destination}</span>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-gray-400">Vehículo</span>
              <div className="flex items-center">
                <Car size={18} className="text-blue-400 mr-1" />
                <span className="font-medium text-sm capitalize text-gray-300">{vehicleType}</span>
              </div>
            </div>
          </div>
          
          {/* Display intermediate stops if they exist */}
          {intermediateStops && intermediateStops.length > 0 && (
            <div className="mt-2 p-2 bg-slate-800/40 rounded-md border border-blue-500/10">
              <h4 className="text-sm font-medium text-blue-400 mb-1">Paradas intermedias:</h4>
              <ul className="list-disc list-inside">
                {intermediateStops.map((stop, idx) => (
                  <li key={idx} className="text-sm text-gray-300">{stop.placeName}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Driver information section */}
          <div className="mt-2 p-3 bg-slate-800/40 rounded-md border border-blue-500/10">
            <h4 className="text-sm font-medium text-blue-400 mb-2">Información del conductor:</h4>
            
            {hasDriverAssigned ? (
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-300">
                  <Users size={16} className="mr-2 text-blue-400" />
                  <span className="font-medium">Conductor:</span>
                  <span className="ml-2">{booking.nombre_conductor}</span>
                </div>
                
                {booking.numero_celular_conductor && (
                  <div className="flex items-center text-sm text-gray-300">
                    <Phone size={16} className="mr-2 text-blue-400" />
                    <span className="font-medium">Teléfono:</span>
                    <span className="ml-2">{booking.numero_celular_conductor}</span>
                  </div>
                )}
                
                {booking.modelo_vehiculo && (
                  <div className="flex items-center text-sm text-gray-300">
                    <Car size={16} className="mr-2 text-blue-400" />
                    <span className="font-medium">Vehículo:</span>
                    <span className="ml-2">{booking.modelo_vehiculo}</span>
                  </div>
                )}
                
                {booking.placa_vehiculo && (
                  <div className="flex items-center text-sm text-gray-300">
                    <div className="w-4 h-4 mr-2 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-400">P</span>
                    </div>
                    <span className="font-medium">Placa:</span>
                    <span className="ml-2">{booking.placa_vehiculo}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Conductor aún no asignado.</p>
            )}
          </div>

          {/* Route link for Google Maps */}
          <div className="mt-2">
            <a 
              href={generateRouteLink(booking.origin, booking.destination, intermediateStops)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink size={16} className="mr-1" /> Ver ruta en Google Maps
            </a>
          </div>

          {/* Replace the distance and duration card with the RouteInfo component */}
          <RouteInfo distance={booking.distance} duration={booking.duration || undefined} />
        </div>
      </CardContent>
    </Card>
  );
};

export default MyBookings;
