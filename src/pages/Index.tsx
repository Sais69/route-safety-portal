
import React from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import VehiclesSection from "@/components/VehiclesSection";
import SafetySection from "@/components/SafetySection";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";

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
        
        {/* Sección 3D */}
        <section className="relative w-full h-[80vh] overflow-hidden my-12">
          <div className="absolute inset-0 z-10 bg-black/70"></div>
          <div className="relative z-20 container mx-auto px-4 h-full flex flex-col items-center justify-center text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Transporte Moderno para el Ecuador
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mb-8">
              Nuestros vehículos cuentan con tecnología de seguimiento GPS en tiempo real
              y conductores profesionales para garantizar su seguridad.
            </p>
            <Link to="/booking" className="group">
              <Button size="lg" className="animated-button pulse">
                <span>Reservar Ahora</span>
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
              <div className="flex justify-center space-x-4">
                <Link to="/register" className="group">
                  <Button size="lg" className="animated-button pulse">
                    <span>Registrarse</span>
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">Iniciar Sesión</Button>
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
