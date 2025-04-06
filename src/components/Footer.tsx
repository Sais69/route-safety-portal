
import React from "react";
import { Bus, Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Bus size={24} className="text-primary" />
              <h3 className="text-xl font-bold text-white">RouteSafety</h3>
            </div>
            <p className="mb-4">
              Ofrecemos servicios de transporte seguros y confiables para todos sus desplazamientos.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-primary transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Enlaces rápidos</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-primary transition-colors">Inicio</a>
              </li>
              <li>
                <a href="#vehicles" className="hover:text-primary transition-colors">Vehículos</a>
              </li>
              <li>
                <a href="#safety" className="hover:text-primary transition-colors">Seguridad</a>
              </li>
              <li>
                <a href="#about" className="hover:text-primary transition-colors">Nosotros</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contacto</h4>
            <address className="not-italic">
              <p className="mb-2">Calle Principal 123</p>
              <p className="mb-2">Ciudad, CP 12345</p>
              <p className="mb-2">Email: info@routesafety.com</p>
              <p>Teléfono: +1 234 567 890</p>
            </address>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-6 text-center">
          <p>&copy; {new Date().getFullYear()} RouteSafety. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
