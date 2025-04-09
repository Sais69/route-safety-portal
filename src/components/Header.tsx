
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bus, Menu, X, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 py-4 transition-all duration-300 ${
      isScrolled ? 'bg-background/80 backdrop-blur-lg shadow-lg' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2">
            <Bus size={28} className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.7)]" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Buker</h1>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {location.pathname === '/' && (
            <>
              <a href="#vehicles" className="text-gray-300 hover:text-blue-400 transition-colors">
                Vehículos
              </a>
              <a href="#safety" className="text-gray-300 hover:text-blue-400 transition-colors">
                Seguridad
              </a>
            </>
          )}
          {user && !isAdmin && (
            <>
              <Link to="/booking" className="text-gray-300 hover:text-blue-400 transition-colors">
                Nueva Reserva
              </Link>
              <Link to="/my-bookings" className="text-gray-300 hover:text-blue-400 transition-colors">
                Mis Reservas
              </Link>
            </>
          )}
          {location.pathname === '/' && (
            <a href="#about" className="text-gray-300 hover:text-blue-400 transition-colors">
              Nosotros
            </a>
          )}
          {user && isAdmin && (
            <Link 
              to="/admin" 
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <LayoutDashboard className="h-4 w-4" />
              Panel Admin
            </Link>
          )}
        </nav>
        
        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-gray-300">Hola, {user.user_metadata?.first_name || 'Usuario'}</span>
              <Button 
                variant="outline" 
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                onClick={handleSignOut}
              >
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link to="/register" className="group">
                <Button className="animated-button bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                  <span>Registrarse</span>
                </Button>
              </Link>
            </>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-gray-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-blue-900/30 py-4 shadow-lg">
          <nav className="container mx-auto px-4 flex flex-col space-y-4">
            {location.pathname === '/' && (
              <>
                <a 
                  href="#vehicles" 
                  className="text-gray-300 hover:text-blue-400 transition-colors py-2"
                >
                  Vehículos
                </a>
                <a 
                  href="#safety" 
                  className="text-gray-300 hover:text-blue-400 transition-colors py-2"
                >
                  Seguridad
                </a>
              </>
            )}
            {user && !isAdmin && (
              <>
                <Link 
                  to="/booking" 
                  className="text-gray-300 hover:text-blue-400 transition-colors py-2"
                >
                  Nueva Reserva
                </Link>
                <Link 
                  to="/my-bookings" 
                  className="text-gray-300 hover:text-blue-400 transition-colors py-2"
                >
                  Mis Reservas
                </Link>
              </>
            )}
            {location.pathname === '/' && (
              <a 
                href="#about" 
                className="text-gray-300 hover:text-blue-400 transition-colors py-2"
              >
                Nosotros
              </a>
            )}
            {user && isAdmin && (
              <Link 
                to="/admin" 
                className="text-blue-400 hover:text-blue-300 transition-colors py-2 flex items-center gap-1"
              >
                <LayoutDashboard className="h-4 w-4" />
                Panel Admin
              </Link>
            )}
            <div className="flex flex-col space-y-2 pt-2 border-t border-blue-900/30">
              {user ? (
                <>
                  <span className="text-gray-300 py-2">Hola, {user.user_metadata?.first_name || 'Usuario'}</span>
                  <Button 
                    variant="outline" 
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                      Registrarse
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
