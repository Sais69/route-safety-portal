
import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import BookingPage from './pages/booking/BookingPage';
import NotFound from './pages/NotFound';
import MyBookings from './pages/MyBookings';
import AdminPage from './pages/admin/AdminPage';
import { initializeApiKeys } from './constants';
import { AuthProvider } from './contexts/AuthContext';
import { toast } from 'sonner';
import './App.css';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize API keys when the app loads
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      try {
        // Try to initialize API keys
        const success = await initializeApiKeys();
        if (!success) {
          console.warn('Failed to initialize API keys. Some features may not work correctly.');
          toast.error('Error al cargar recursos. Algunas funciones pueden no estar disponibles.');
        } else {
          toast.success('Recursos cargados correctamente');
        }
      } catch (error) {
        console.error('Unexpected error initializing API keys:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    init();
  }, []);

  // Show a minimal loading indicator while initializing
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando recursos...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
