
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
import { CalendarRange, MapPin, Clock, Route, Car } from "lucide-react";

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

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalDistance, setTotalDistance] = useState(0);

  useEffect(() => {
    // En un caso real, esto sería una llamada a API autenticada
    const fetchBookings = () => {
      setIsLoading(true);
      const storedBookings = localStorage.getItem('bookings');
      
      if (storedBookings) {
        try {
          // Filtrar solo las reservas del usuario activo (simulado)
          const parsedBookings = JSON.parse(storedBookings);
          // En un sistema real, filtrarías por usuario autenticado
          setBookings(parsedBookings);
          
          // Calcular distancia total de los viajes realizados
          const completedDistance = parsedBookings
            .filter(booking => booking.status === 'realizada')
            .reduce((total, booking) => total + booking.distance, 0);
            
          setTotalDistance(completedDistance);
        } catch (e) {
          console.error('Error parsing bookings', e);
        }
      }
      
      setIsLoading(false);
    };

    fetchBookings();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'designada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en curso':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'realizada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const pendingBookings = bookings.filter(booking => booking.status === 'pendiente' || booking.status === 'designada');
  const activeBookings = bookings.filter(booking => booking.status === 'en curso');
  const completedBookings = bookings.filter(booking => booking.status === 'realizada');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Mis Reservas</h1>
              <p className="text-gray-600">Gestione sus viajes y vea su historial de reservas</p>
            </div>
            <div className="mt-4 md:mt-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-md">
              <p className="text-sm font-medium">Total recorrido</p>
              <p className="text-2xl font-bold">{totalDistance.toFixed(2)} km</p>
            </div>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-md mb-8">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="active">En curso</TabsTrigger>
              <TabsTrigger value="completed">Completadas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-6">
              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Route size={48} className="text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tiene reservas</h3>
                    <p className="text-gray-500 mb-4">Empiece reservando un nuevo viaje</p>
                    <Button onClick={() => navigate('/booking')}>Reservar ahora</Button>
                  </CardContent>
                </Card>
              ) : (
                bookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="pending" className="space-y-6">
              {pendingBookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-500">No hay reservas pendientes</p>
                  </CardContent>
                </Card>
              ) : (
                pendingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="active" className="space-y-6">
              {activeBookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-500">No hay reservas en curso</p>
                  </CardContent>
                </Card>
              ) : (
                activeBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-6">
              {completedBookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-500">No hay reservas completadas</p>
                  </CardContent>
                </Card>
              ) : (
                completedBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const BookingCard = ({ booking }: { booking: Booking }) => {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'designada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en curso':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'realizada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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

  return (
    <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: booking.status === 'realizada' ? '#4ade80' : booking.status === 'en curso' ? '#a855f7' : '#3b82f6' }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Viaje a {booking.destination.split(',')[0]}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <CalendarRange size={16} className="mr-1" />
              {typeof booking.departureDate === 'string' ? booking.departureDate : booking.departureDate.toISOString().split('T')[0]} • {booking.departureTime}
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
              <span className="text-sm text-gray-500">Origen</span>
              <div className="flex items-start">
                <MapPin size={18} className="text-gray-400 mt-1 mr-1 flex-shrink-0" />
                <span className="font-medium text-sm">{booking.origin}</span>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-gray-500">Destino</span>
              <div className="flex items-start">
                <MapPin size={18} className="text-gray-400 mt-1 mr-1 flex-shrink-0" fill="currentColor" />
                <span className="font-medium text-sm">{booking.destination}</span>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-gray-500">Vehículo</span>
              <div className="flex items-center">
                <Car size={18} className="text-gray-400 mr-1" />
                <span className="font-medium text-sm capitalize">{booking.vehicleType}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center">
              <Clock size={16} className="text-gray-500 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Duración</p>
                <p className="font-medium text-sm">{booking.duration || 'No disponible'}</p>
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center">
              <Route size={16} className="text-gray-500 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Distancia</p>
                <p className="font-medium text-sm">{booking.distance} km</p>
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center">
              <div>
                <p className="text-xs text-gray-500">Costo</p>
                <p className="font-medium text-sm">
                  ${typeof booking.cost === 'number' ? booking.cost.toFixed(2) : booking.cost}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyBookings;
