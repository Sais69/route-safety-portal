
import React from "react";
import { Bus, Facebook, Instagram, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative bg-slate-900 text-gray-300 overflow-hidden">
      <div className="absolute inset-0 grid-lines opacity-10"></div>
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Bus size={24} className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.7)]" />
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                Buker
              </h3>
            </div>
            <p className="mb-4 text-gray-400">
              Ofrecemos servicios de transporte seguros y confiables para todos sus desplazamientos.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-9 h-9 rounded-full flex items-center justify-center border border-blue-500/30 bg-blue-900/20 text-blue-400 hover:bg-blue-800/30 hover:text-blue-300 transition-all">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full flex items-center justify-center border border-blue-500/30 bg-blue-900/20 text-blue-400 hover:bg-blue-800/30 hover:text-blue-300 transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full flex items-center justify-center border border-blue-500/30 bg-blue-900/20 text-blue-400 hover:bg-blue-800/30 hover:text-blue-300 transition-all">
                <Instagram size={18} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Enlaces rápidos</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                  Inicio
                </Link>
              </li>
              <li>
                <a href="#vehicles" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                  Vehículos
                </a>
              </li>
              <li>
                <a href="#safety" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                  Seguridad
                </a>
              </li>
              <li>
                <Link to="/my-bookings" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                  Mis Reservas
                </Link>
              </li>
              <li>
                <a href="#about" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                  Nosotros
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contacto</h4>
            <address className="not-italic space-y-3 text-gray-400">
              <p className="flex items-center">
                <span className="w-5 h-5 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                </span>
                Calle Principal 123
              </p>
              <p className="flex items-center">
                <span className="w-5 h-5 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                </span>
                Ciudad, CP 12345
              </p>
              <p className="flex items-center">
                <span className="w-5 h-5 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                </span>
                info@buker.com
              </p>
              <p className="flex items-center">
                <span className="w-5 h-5 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                </span>
                +1 234 567 890
              </p>
            </address>
          </div>
        </div>
        
        <div className="border-t border-blue-900/30 mt-12 pt-6 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Buker. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
