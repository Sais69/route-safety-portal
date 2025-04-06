
import React, { useState } from 'react';
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
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { CalendarRange, Search, MapPin, User, Bus, Clock } from "lucide-react";

// Simulated booking data
const mockBookings = [
  {
    id: '1',
    user: {
      name: 'María García',
      email: 'maria@ejemplo.com',
      phone: '+34 600 123 456'
    },
    origin: 'Madrid, España',
    destination: 'Toledo, España',
    vehicleType: 'furgoneta',
    passengerCount: 12,
    departureDate: '2024-06-15',
    departureTime: '09:00',
    returnDate: '2024-06-15',
    returnTime: '18:00',
    status: 'confirmada',
    cost: 120.50,
    distance: 73.4
  },
  {
    id: '2',
    user: {
      name: 'Carlos Rodríguez',
      email: 'carlos@ejemplo.com',
      phone: '+34 600 789 012'
    },
    origin: 'Barcelona, España',
    destination: 'Girona, España',
    vehicleType: 'microbus',
    passengerCount: 24,
    departureDate: '2024-06-20',
    departureTime: '10:30',
    returnDate: null,
    returnTime: null,
    status: 'pendiente',
    cost: 185.75,
    distance: 98.6
  },
  {
    id: '3',
    user: {
      name: 'Laura Martínez',
      email: 'laura@ejemplo.com',
      phone: '+34 600 345 678'
    },
    origin: 'Sevilla, España',
    destination: 'Córdoba, España',
    vehicleType: 'bus',
    passengerCount: 36,
    departureDate: '2024-06-25',
    departureTime: '08:15',
    returnDate: '2024-06-27',
    returnTime: '19:00',
    status: 'confirmada',
    cost: 320.30,
    distance: 140.2
  }
];

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // In a real app, this would be connected to your authentication system
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Credenciales incorrectas');
    }
  };
  
  // Filter bookings based on search term
  const filteredBookings = mockBookings.filter(booking => 
    booking.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                              <span className="font-medium">{booking.user.name}</span>
                              <span className="text-sm text-gray-500">{booking.user.phone}</span>
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
                                <CalendarRange className="h-3 w-3 mr-1 text-gray-500" /> {booking.departureDate}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-gray-500" /> {booking.departureTime}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              booking.status === 'confirmada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {booking.status}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">${booking.cost.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">Ver detalles</Button>
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
