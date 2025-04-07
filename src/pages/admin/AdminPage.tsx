
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
import { CalendarRange, Search, MapPin, User, Bus, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

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
  status: 'pendiente' | 'designada' | 'negada' | 'realizada';
  cost: number | string;
  distance: number;
  duration?: string;
  createdAt: string;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Load bookings from localStorage
  useEffect(() => {
    if (isAuthenticated) {
      const storedBookings = localStorage.getItem('bookings');
      if (storedBookings) {
        try {
          setBookings(JSON.parse(storedBookings));
        } catch (e) {
          console.error('Error parsing bookings', e);
        }
      }
    }
  }, [isAuthenticated]);

  // In a real app, this would be connected to your authentication system
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
    } else {
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
  const updateBookingStatus = (id: string, newStatus: 'pendiente' | 'designada' | 'negada' | 'realizada') => {
    const updatedBookings = bookings.map(booking => 
      booking.id === id ? { ...booking, status: newStatus } : booking
    );
    
    setBookings(updatedBookings);
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));
    
    toast.success(`Estado de reserva actualizado a: ${newStatus}`);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'designada':
        return 'bg-blue-100 text-blue-800';
      case 'negada':
        return 'bg-red-100 text-red-800';
      case 'realizada':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'designada':
        return <AlertCircle className="h-3 w-3 mr-1" />;
      case 'negada':
        return <XCircle className="h-3 w-3 mr-1" />;
      case 'realizada':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      default:
        return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Panel de Administrador</CardTitle>
            <CardDescription>Inicie sesión para acceder al panel de gestión de reservas</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">Usuario</label>
                <Input 
                  id="username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="w-full">Iniciar Sesión</Button>
                <Button type="button" variant="outline" onClick={() => navigate('/')} className="w-full">Volver</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Panel de Administración</h1>
            <p className="text-gray-500">Gestión de reservas y vehículos</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')} 
            className="mt-4 md:mt-0"
          >
            Volver al sitio
          </Button>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 md:w-[600px]">
            <TabsTrigger value="bookings">Reservas</TabsTrigger>
            <TabsTrigger value="vehicles">Vehículos</TabsTrigger>
            <TabsTrigger value="customers">Clientes</TabsTrigger>
            <TabsTrigger value="reports">Informes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <CardTitle>Reservas</CardTitle>
                  <div className="relative w-full md:w-80 mt-4 md:mt-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar reservas..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <Table>
                    <TableCaption>Lista de reservas activas</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Ruta</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{booking.userData.name}</span>
                              <span className="text-sm text-gray-500">{booking.userData.phone}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1 text-gray-500" /> {booking.origin}
                              </span>
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1 text-gray-500" fill="currentColor" /> {booking.destination}
                              </span>
                              {booking.duration && (
                                <span className="text-xs text-gray-500 mt-1">
                                  <Clock className="h-3 w-3 inline mr-1" /> {booking.duration}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Bus className="h-4 w-4 text-primary" />
                              <span className="capitalize">{booking.vehicleType}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="flex items-center">
                                <CalendarRange className="h-3 w-3 mr-1 text-gray-500" /> 
                                {booking.departureDate instanceof Date 
                                  ? booking.departureDate.toISOString().split('T')[0]
                                  : booking.departureDate}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-gray-500" /> {booking.departureTime}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs flex items-center w-fit ${getStatusBadgeClass(booking.status)}`}>
                              {getStatusIcon(booking.status)} {booking.status}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">
                            ${typeof booking.cost === 'number' ? booking.cost.toFixed(2) : booking.cost}
                          </TableCell>
                          <TableCell className="text-right">
                            <Select 
                              defaultValue={booking.status}
                              onValueChange={(value) => updateBookingStatus(
                                booking.id, 
                                value as 'pendiente' | 'designada' | 'negada' | 'realizada'
                              )}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Cambiar estado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pendiente">Pendiente</SelectItem>
                                <SelectItem value="designada">Designada</SelectItem>
                                <SelectItem value="negada">Negada</SelectItem>
                                <SelectItem value="realizada">Realizada</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredBookings.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Vehículos</CardTitle>
                <CardDescription>
                  Administre la flota de vehículos disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Esta sección está en desarrollo.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Clientes</CardTitle>
                <CardDescription>
                  Administre los clientes registrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Esta sección está en desarrollo.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Informes y Estadísticas</CardTitle>
                <CardDescription>
                  Visualice estadísticas y genere informes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Esta sección está en desarrollo.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
