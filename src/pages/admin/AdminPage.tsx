
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Bell } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from "react-router-dom";
import { Driver } from "@/types/driver";
import { BookingWithDriver } from "./types";

// Component imports
import BookingsList from "./components/BookingsList";
import DriversManagement from "./components/DriversManagement";
import BookingDetails from "./components/BookingDetails";

const AdminPage = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState<BookingWithDriver[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDriver | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newBookingsCount, setNewBookingsCount] = useState(0);
  
  useEffect(() => {
    if (isAdmin) {
      fetchBookings();
      fetchDrivers();
      
      // Set up real-time listener for new bookings
      const channel = setupBookingsSubscription();
      
      // Cleanup function
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);
  
  // Setup realtime subscription for bookings
  const setupBookingsSubscription = () => {
    const channel = supabase
      .channel('admin-bookings-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'bookings' 
        }, 
        (payload) => {
          console.log('New booking received:', payload);
          // When a new booking is inserted, refresh the bookings list
          fetchBookings();
          setNewBookingsCount(prev => prev + 1);
          toast.info('Nueva reserva recibida', {
            description: `Se ha recibido una nueva reserva`,
            action: {
              label: "Ver",
              onClick: () => setActiveTab('bookings')
            }
          });
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'bookings' 
        }, 
        (payload) => {
          console.log('Booking updated:', payload);
          // When a booking is updated, refresh the bookings list
          fetchBookings();
        }
      )
      .subscribe();
      
    console.log('Subscribed to bookings changes');
    
    return channel;
  };
  
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
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
                return { ...booking, driver: driverData as Driver };
              }
            }
            return { ...booking, driver: null };
          })
        );
        
        setBookings(processedBookings);
        console.log("Loaded bookings:", processedBookings.length);
        setNewBookingsCount(0); // Reset counter when loading new bookings
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
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
  
  // View booking details
  const viewBookingDetails = (booking: BookingWithDriver) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset new bookings counter when switching to bookings tab
    if (value === 'bookings') {
      setNewBookingsCount(0);
    }
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
            onClick={() => {
              fetchBookings();
              fetchDrivers();
            }} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Actualizando...' : 'Actualizar Datos'}
          </Button>
        </div>
        
        <Card className="bg-slate-900/50 border border-slate-800 shadow-lg mb-8">
          <CardContent className="pt-6">
            <Tabs 
              defaultValue="bookings" 
              onValueChange={handleTabChange}
              value={activeTab}
            >
              <TabsList className="mb-6 bg-slate-800">
                <TabsTrigger 
                  value="bookings"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center"
                >
                  Reservas
                  {newBookingsCount > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white">
                      {newBookingsCount}
                      <Bell className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="drivers"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Conductores
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="bookings">
                <BookingsList 
                  bookings={bookings}
                  onViewDetails={viewBookingDetails}
                  onRefresh={fetchBookings}
                  isLoading={isLoading}
                />
              </TabsContent>
              
              <TabsContent value="drivers">
                <DriversManagement 
                  drivers={drivers}
                  onRefresh={fetchDrivers}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      
      {/* Booking Details Dialog */}
      {showDetails && (
        <BookingDetails
          booking={selectedBooking}
          onClose={() => setShowDetails(false)}
          onRefresh={fetchBookings}
          drivers={drivers}
        />
      )}
    </div>
  );
};

export default AdminPage;
