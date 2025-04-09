
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import AdminPage from "./pages/admin/AdminPage";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Create a client
const queryClient = new QueryClient();

// Protected Route Component for Regular Users
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mb-4"></div>
        <p className="text-white">Cargando...</p>
      </div>
    );
  }
  
  if (!user) {
    // Save the attempted URL for redirection after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

// Admin Route Component with fixed logic
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();
  
  console.log("AdminRoute check - isAdmin:", isAdmin, "user:", user?.email);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mb-4"></div>
        <p className="text-white">Cargando...</p>
      </div>
    );
  }
  
  // Check if user is logged in and is admin
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (!isAdmin) {
    console.log("User is not admin, redirecting to home");
    toast.error("No tienes permisos para acceder a esta página");
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Add this import at the top
import { toast } from "sonner";

function AppRoutes() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  // Debug log user state on route changes
  useEffect(() => {
    console.log("Route changed. User:", user?.email, "isAdmin:", isAdmin);
  }, [location.pathname, user, isAdmin]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route 
        path="/booking" 
        element={
          <ProtectedRoute>
            <Booking />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-bookings" 
        element={
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
