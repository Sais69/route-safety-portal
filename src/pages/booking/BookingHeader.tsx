
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BookingHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to home page after successful logout
      navigate('/', { replace: true });
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <header className="bg-slate-900/80 shadow-[0_0_15px_rgba(59,130,246,0.3)] backdrop-blur-lg py-4 border-b border-blue-500/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <Bus size={24} className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.7)]" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Buker</h1>
        </Link>
        <nav className="flex items-center space-x-4">
          <Link to="/my-bookings" className="text-gray-300 hover:text-blue-400 transition-colors">
            Mis Reservas
          </Link>
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">
                {user.user_metadata?.first_name || 'Usuario'}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                onClick={handleSignOut}
              >
                Cerrar Sesión
              </Button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center text-gray-300 hover:text-blue-400 transition-colors">
              <User size={18} className="mr-1" />
              <span>Mi Cuenta</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default BookingHeader;
