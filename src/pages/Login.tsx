
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, ArrowLeft, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isLoading, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/booking";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!email || !password) {
      toast.error("Todos los campos son requeridos");
      return;
    }
    
    try {
      setFormSubmitting(true);
      await signIn(email, password);
      navigate("/booking");
    } catch (error) {
      // Error is handled in the signIn function
      console.error("Error en el inicio de sesión:", error);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 12,
      },
    },
  };

  // If authentication is still loading, show a loading state
  if (isLoading && !formSubmitting) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 p-4 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]"></div>
      
      {/* Glow effects */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/30 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-indigo-500/30 rounded-full blur-[100px]" />
      
      <Link to="/" className="absolute top-6 left-6 flex items-center text-gray-300 hover:text-blue-400 transition-colors z-10">
        <ArrowLeft className="mr-2" size={16} />
        <span className="text-sm">Volver al inicio</span>
      </Link>
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center mb-10 z-10"
      >
        <Bus className="h-8 w-8 text-blue-500 mr-2 animate-pulse" />
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
          RouteSafety
        </h1>
      </motion.div>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md z-10"
      >
        <Card className="backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 shadow-[0_0_25px_rgba(56,189,248,0.3)]">
          <CardHeader className="space-y-1 pb-2">
            <motion.div variants={itemVariants}>
              <CardTitle className="text-2xl text-center text-white mb-1">
                Iniciar sesión
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-center text-gray-400">
                Ingrese sus credenciales para acceder a su cuenta
              </CardDescription>
            </motion.div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email" className="text-blue-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="ejemplo@correo.com" 
                    required 
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-blue-400/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-blue-300">Contraseña</Label>
                  <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                    ¿Olvidó su contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white focus:border-blue-400 focus:ring-blue-400/20" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-600/50 transition-all duration-300"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando
                    </>
                  ) : (
                    "Iniciar sesión"
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col">
            <motion.div variants={itemVariants} className="text-center text-sm text-gray-400 mt-2">
              ¿No tiene una cuenta?{" "}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                Registrarse
              </Link>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
      
      {/* Bottom decoration */}
      <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
    </div>
  );
};

export default Login;
