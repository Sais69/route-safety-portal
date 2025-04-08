
import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, User } from 'lucide-react';

const BookingHeader: React.FC = () => {
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
          <Link to="/" className="flex items-center text-gray-300 hover:text-blue-400 transition-colors">
            <User size={18} className="mr-1" />
            <span>Mi Cuenta</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default BookingHeader;
