
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, ArrowLeft, User, Lock, Mail, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { signUp, isLoading, user } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/booking", { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (Object.values(formData).some(field => !field)) {
      toast.error("Todos los campos son requeridos");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    try {
      setFormSubmitting(true);
      
      // Prepare user metadata
      const userData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        full_name: `${formData.firstName} ${formData.lastName}`
      };
      
      await signUp(formData.email, formData.password, userData);
      
      // Store user data in localStorage for the booking form
      localStorage.setItem('user', JSON.stringify({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone
      }));
      
      navigate("/booking");
    } catch (error) {
      // Error is handled in the signUp function
      console.error("Error en el registro:", error);
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
                Crear cuenta
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-center text-gray-400">
                Regístrese para comenzar a utilizar nuestros servicios
              </CardDescription>
            </motion.div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-blue-300">Nombre</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <Input 
                      id="firstName" 
                      type="text" 
                      required 
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white focus:border-blue-400 focus:ring-blue-400/20"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-blue-300">Apellido</Label>
                  <Input 
                    id="lastName" 
                    type="text" 
                    required 
                    className="bg-slate-800/50 border-slate-700 text-white focus:border-blue-400 focus:ring-blue-400/20"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </motion.div>
              
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
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="phone" className="text-blue-300">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input 
                    id="phone" 
                    type="tel" 
                    required 
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white focus:border-blue-400 focus:ring-blue-400/20"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="password" className="text-blue-300">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white focus:border-blue-400 focus:ring-blue-400/20"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-blue-300">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    required 
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white focus:border-blue-400 focus:ring-blue-400/20"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-600/50 transition-all duration-300"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando
                    </>
                  ) : (
                    "Registrarse"
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col">
            <motion.div variants={itemVariants} className="text-center text-sm text-gray-400 mt-2">
              ¿Ya tiene una cuenta?{" "}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                Iniciar sesión
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

export default Register;
