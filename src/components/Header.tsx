
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Bus, MapPin, ShieldCheck } from "lucide-react";

const Header = () => {
  return (
    <header className="py-4 bg-white shadow-sm">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bus size={28} className="text-primary" />
          <h1 className="text-xl font-bold">RouteSafety</h1>
        </div>
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#vehicles" className="text-gray-600 hover:text-primary transition-colors">
            Vehículos
          </a>
          <a href="#safety" className="text-gray-600 hover:text-primary transition-colors">
            Seguridad
          </a>
          <a href="#about" className="text-gray-600 hover:text-primary transition-colors">
            Nosotros
          </a>
        </nav>
        <div className="flex items-center space-x-4">
          <Link to="/login">
            <Button variant="outline">Iniciar Sesión</Button>
          </Link>
          <Link to="/register" className="group">
            <Button className="animated-button">
              <span>Registrarse</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
