
import React, { useEffect, useRef } from "react";
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
  const observerRef = useRef(null);

  // Setup intersection observer for reveal-on-scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => {
      elements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-slate-900">
      <Header />
      <main className="flex-grow pt-16">
        <Hero />
        
        {/* Sección 3D Mejorada */}
        <section className="relative w-full h-[90vh] overflow-hidden my-12">
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-black/70 to-black/80"></div>
          <div className="absolute inset-0 z-5 grid-lines opacity-20"></div>
          <div className="relative z-20 container mx-auto px-4 h-full flex flex-col items-center justify-center text-center">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 rounded-full text-sm font-semibold text-white mb-4 shadow-[0_0_10px_rgba(59,130,246,0.5)] reveal-on-scroll">Buker - Tu transporte seguro</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight neon-text reveal-on-scroll" style={{transitionDelay: '100ms'}}>
              Transporte Moderno para el Ecuador
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mb-10 reveal-on-scroll" style={{transitionDelay: '200ms'}}>
              Nuestros vehículos cuentan con tecnología de seguimiento GPS en tiempo real
              y conductores profesionales para garantizar su seguridad.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <div className="glass-card rounded-lg p-5 flex items-start border border-blue-500/20 w-[280px] reveal-on-scroll" style={{transitionDelay: '300ms'}}>
                <Map className="text-blue-400 mr-3 mt-1" size={22} />
                <div className="text-left">
                  <h3 className="text-white font-medium text-lg">Seguimiento GPS</h3>
                  <p className="text-white/70 text-sm">Monitoree su viaje en tiempo real desde su dispositivo</p>
                </div>
              </div>
              <div className="glass-card rounded-lg p-5 flex items-start border border-blue-500/20 w-[280px] reveal-on-scroll" style={{transitionDelay: '400ms'}}>
                <Shield className="text-blue-400 mr-3 mt-1" size={22} />
                <div className="text-left">
                  <h3 className="text-white font-medium text-lg">Seguridad Garantizada</h3>
                  <p className="text-white/70 text-sm">Conductores profesionales y verificados</p>
                </div>
              </div>
              <div className="glass-card rounded-lg p-5 flex items-start border border-blue-500/20 w-[280px] reveal-on-scroll" style={{transitionDelay: '500ms'}}>
                <Clock className="text-blue-400 mr-3 mt-1" size={22} />
                <div className="text-left">
                  <h3 className="text-white font-medium text-lg">Puntualidad</h3>
                  <p className="text-white/70 text-sm">Llegamos a tiempo, siempre</p>
                </div>
              </div>
            </div>
            <Link to="/booking" className="reveal-on-scroll" style={{transitionDelay: '600ms'}}>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_20px_rgba(59,130,246,0.7)] transition-all">
                <span className="relative z-10 flex items-center group-hover:translate-x-2 transition-transform">
                  Reservar Ahora <ChevronRight className="ml-2 h-5 w-5" />
                </span>
              </Button>
            </Link>
          </div>
          <ThreeDMarquee 
            className="absolute inset-0 w-full h-full opacity-70" 
            images={images}
          />
        </section>
        
        <VehiclesSection />
        <SafetySection />
        
        <section id="about" className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900 to-background"></div>
          <div className="absolute inset-0 grid-lines opacity-20"></div>
          <div className="halo-glow container relative z-10 mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6 text-white neon-text reveal-on-scroll">¿Listo para reservar?</h2>
              <p className="text-lg text-gray-300 mb-8 reveal-on-scroll" style={{transitionDelay: '100ms'}}>
                Regístrese ahora para comenzar a reservar nuestros servicios de transporte
                y disfrutar de viajes seguros con monitoreo GPS en tiempo real.
              </p>
              <div className="flex flex-wrap justify-center gap-4 reveal-on-scroll" style={{transitionDelay: '200ms'}}>
                <Link to="/register">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_20px_rgba(59,130,246,0.7)] transition-all">
                    Registrarse
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="px-8 py-3 rounded-full border-2 border-blue-500/30 text-blue-400 hover:border-blue-400 hover:bg-blue-500/10 transition-all">
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
