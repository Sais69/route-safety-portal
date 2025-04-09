
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShieldCheck, Bus, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const Hero = () => {
  const { user } = useAuth();

  return (
    <div className="relative pt-24 pb-20 overflow-hidden">
      {/* Background grid lines */}
      <div className="absolute inset-0 grid-lines opacity-20"></div>
      
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="space-y-6">
              <motion.span 
                className="inline-block py-1 px-3 bg-blue-900/30 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Transporte Seguro
              </motion.span>
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                Viaja seguro con{" "}
                <span className="relative">
                  Buker
                  <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></span>
                </span>
              </motion.h1>
              <motion.p 
                className="text-xl text-gray-300 max-w-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                Ofrecemos servicios de transporte con vehículos equipados con la última tecnología 
                de seguridad, incluyendo monitoreo GPS en tiempo real.
              </motion.p>
            </div>
            
            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Link to={user ? "/booking" : "/login"}>
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_20px_rgba(59,130,246,0.7)] transition-all">
                  Reservar Ahora
                </Button>
              </Link>
              <a href="#vehicles">
                <Button size="lg" variant="outline" className="px-8 py-6 rounded-full border-2 border-blue-500/30 text-blue-400 hover:border-blue-400 hover:bg-blue-500/10 transition-all">
                  Ver Vehículos
                </Button>
              </a>
            </motion.div>
            
            <motion.div 
              className="flex flex-wrap items-center gap-6 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.8 }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mr-3">
                  <ShieldCheck className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-gray-300">100% Seguro</span>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mr-3">
                  <MapPin className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-gray-300">GPS en tiempo real</span>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mr-3">
                  <Bus className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-gray-300">Flota Moderna</span>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="hidden md:block relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 1, 
              type: "spring",
              stiffness: 100,
              delay: 0.3 
            }}
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full filter blur-3xl"></div>
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-indigo-500/20 rounded-full filter blur-3xl"></div>
            
            <div className="relative z-10 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-white/10 backdrop-blur-sm">
              <div 
                className="aspect-[4/3] bg-cover bg-center"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8YnVzfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60')",
                }}
              >
                <div className="w-full h-full bg-gradient-to-tr from-background/80 to-transparent flex items-end p-6">
                  <div className="glass-card p-4 rounded-lg w-full">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-400">Transporte</p>
                        <p className="text-lg font-semibold text-white">Buker Premium</p>
                      </div>
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-md p-2">
                        <Bus className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
