
import React, { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CalendarRange, Search, MapPin, User, 
  Bus, Route, Calendar, Filter, Loader2 
} from "lucide-react";
import { BookingWithDriver } from "../types";
import { statusColors, statusLabels } from "../utils/statusConfig";

interface BookingsListProps {
  bookings: BookingWithDriver[];
  onViewDetails: (booking: BookingWithDriver) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const BookingsList = ({ bookings, onViewDetails, onRefresh, isLoading = false }: BookingsListProps) => {
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDriver[]>(bookings);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    searchQuery: '',
  });

  useEffect(() => {
    setFilteredBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    applyFilters();
  }, [filters, bookings]);

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

  return (
    <>
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
                
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center my-8">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-blue-500">Cargando reservas...</span>
        </div>
      )}
      
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
                      onClick={() => onViewDetails(booking)}
                    >
                      Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                  {isLoading ? 
                    'Cargando reservas...' : 
                    'No se encontraron reservas con los filtros seleccionados'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default BookingsList;
