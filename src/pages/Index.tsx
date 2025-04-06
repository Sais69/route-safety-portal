
import React from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import VehiclesSection from "@/components/VehiclesSection";
import SafetySection from "@/components/SafetySection";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
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
                <Link to="/register">
                  <Button size="lg" className="animated-button pulse">Registrarse</Button>
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
