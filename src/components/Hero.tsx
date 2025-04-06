
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShieldCheck, Bus, MapPin } from "lucide-react";

const Hero = () => {
  return (
    <div className="relative bg-gradient-to-r from-blue-50 to-blue-100 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-gray-900">
            Transporte seguro y confiable para sus necesidades
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Ofrecemos servicios de transporte con vehículos equipados con la última tecnología 
            de seguridad, incluyendo monitoreo GPS en tiempo real.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/register">
              <Button size="lg" className="animated-button">
                Reservar Ahora
              </Button>
            </Link>
            <a href="#vehicles">
              <Button size="lg" variant="outline">
                Ver Vehículos
              </Button>
            </a>
          </div>
          <div className="flex items-center space-x-6 mt-12">
            <div className="flex items-center">
              <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
              <span className="text-gray-700">100% Seguro</span>
            </div>
            <div className="flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-primary" />
              <span className="text-gray-700">Monitoreo GPS</span>
            </div>
            <div className="flex items-center">
              <Bus className="mr-2 h-5 w-5 text-primary" />
              <span className="text-gray-700">Flota Moderna</span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 w-1/2 h-full hidden lg:block">
        <div 
          className="absolute inset-0 bg-contain bg-right-bottom bg-no-repeat opacity-80"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8YnVzfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=600&q=60')",
            backgroundSize: "contain",
            backgroundPosition: "right bottom"
          }}
        />
      </div>
    </div>
  );
};

export default Hero;
