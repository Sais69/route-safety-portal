
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { MapPin } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  // Log error for tracking/debugging
  React.useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]"></div>
      
      <div className="text-center z-10 max-w-md">
        <div className="inline-block p-3 bg-slate-800/50 border border-blue-500/20 rounded-full mb-6">
          <MapPin className="h-10 w-10 text-blue-400" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-gray-300 mb-6">Esta ruta no está en nuestro mapa</p>
        <p className="text-gray-400 mb-8">Lo sentimos, la página que buscas no existe o ha sido movida.</p>
        <Link to="/">
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_20px_rgba(59,130,246,0.7)] transition-all">
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
