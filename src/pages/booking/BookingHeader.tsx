
import React from 'react';
import { Link } from 'react-router-dom';
import { Bus } from 'lucide-react';

const BookingHeader: React.FC = () => {
  return (
    <header className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <Bus size={24} className="text-primary" />
          <h1 className="text-xl font-bold">RouteSafety</h1>
        </Link>
        <nav>
          <Link to="/" className="text-gray-600 hover:text-primary">
            Cerrar sesión
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default BookingHeader;
