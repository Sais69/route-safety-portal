
import React from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import VehiclesSection from "@/components/VehiclesSection";
import SafetySection from "@/components/SafetySection";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { ChevronRight, Map, Shield, Clock } from "lucide-react";

// Imágenes para el fondo 3D
const images = [
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8YnVzfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8dHJhbnNwb3J0fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1608826273828-0876edd09e39?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8OHx8dHJhbnNwb3J0fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8YnVzfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1524486361537-8ad15938e1a3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fGJ1c3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1551820230-a5589397b464?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8bWFwfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1502920514313-52581002a659?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8Ynx8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60",
  "https://images.unsplash.com/photo-1530064114668-b0dc38c5f341?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8bHV4dXJ5JTIwdHJhbnNwb3J0fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60",
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        
        {/* Sección 3D Mejorada */}
        <section className="relative w-full h-[90vh] overflow-hidden my-12">
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-black/70 to-black/80"></div>
          <div className="relative z-20 container mx-auto px-4 h-full flex flex-col items-center justify-center text-center">
            <span className="bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-1 rounded-full text-sm font-semibold text-white mb-4">Buker - Tu transporte seguro</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Transporte Moderno para el Ecuador
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mb-10">
              Nuestros vehículos cuentan con tecnología de seguimiento GPS en tiempo real
              y conductores profesionales para garantizar su seguridad.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 flex items-start border border-white/20 w-[280px]">
                <Map className="text-blue-400 mr-3 mt-1" size={22} />
                <div className="text-left">
                  <h3 className="text-white font-medium text-lg">Seguimiento GPS</h3>
                  <p className="text-white/70 text-sm">Monitoree su viaje en tiempo real desde su dispositivo</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 flex items-start border border-white/20 w-[280px]">
                <Shield className="text-blue-400 mr-3 mt-1" size={22} />
                <div className="text-left">
                  <h3 className="text-white font-medium text-lg">Seguridad Garantizada</h3>
                  <p className="text-white/70 text-sm">Conductores profesionales y verificados</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 flex items-start border border-white/20 w-[280px]">
                <Clock className="text-blue-400 mr-3 mt-1" size={22} />
                <div className="text-left">
                  <h3 className="text-white font-medium text-lg">Puntualidad</h3>
                  <p className="text-white/70 text-sm">Llegamos a tiempo, siempre</p>
                </div>
              </div>
            </div>
            <Link to="/booking">
              <Button size="lg" className="animated-button group relative overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all">
                <span className="relative z-10 flex items-center group-hover:translate-x-2 transition-transform">
                  Reservar Ahora <ChevronRight className="ml-2 h-5 w-5" />
                </span>
              </Button>
            </Link>
          </div>
          <ThreeDMarquee 
            className="absolute inset-0 w-full h-full" 
            images={images}
          />
        </section>
        
        <VehiclesSection />
        <SafetySection />
        
        <section id="about" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">¿Listo para reservar?</h2>
              <p className="text-lg text-gray-600 mb-8">
                Regístrese ahora para comenzar a reservar nuestros servicios de transporte
                y disfrutar de viajes seguros con monitoreo GPS en tiempo real.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all">
                    Registrarse
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="px-8 py-3 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-all">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
