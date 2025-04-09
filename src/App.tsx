
import { useEffect } from 'react';
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
import './App.css';

function App() {
  // Initialize API keys when the app loads
  useEffect(() => {
    // Try to initialize API keys
    initializeApiKeys().then(success => {
      if (!success) {
        console.warn('Failed to initialize API keys. Some features may not work correctly.');
      }
    });
  }, []);

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
