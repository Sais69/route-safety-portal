
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, MapPin, Bell, Clock } from "lucide-react";

const SafetySection = () => {
  return (
    <section id="safety" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-background to-slate-900/50"></div>
      <div className="absolute inset-0 grid-lines opacity-20"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block py-1 px-3 bg-blue-900/30 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium mb-4 reveal-on-scroll">
            Seguridad Garantizada
          </span>
          <h2 className="text-3xl font-bold mb-4 text-white neon-text reveal-on-scroll" style={{transitionDelay: '100ms'}}>
            Su seguridad es nuestra prioridad
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto reveal-on-scroll" style={{transitionDelay: '200ms'}}>
            Todos nuestros vehículos están equipados con tecnología avanzada para garantizar un viaje seguro y tranquilo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="reveal-on-scroll glass-card bg-slate-900/50 border-blue-500/20" style={{transitionDelay: '300ms'}}>
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-lg bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <CardTitle className="text-white">Monitoreo en tiempo real</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Todos los vehículos equipados con GPS permitiendo seguimiento en tiempo real durante todo el trayecto.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="reveal-on-scroll glass-card bg-slate-900/50 border-blue-500/20" style={{transitionDelay: '400ms'}}>
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-lg bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-blue-400" />
              </div>
              <CardTitle className="text-white">Rutas optimizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Utilizamos algoritmos avanzados para calcular las rutas más eficientes y seguras para su viaje.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="reveal-on-scroll glass-card bg-slate-900/50 border-blue-500/20" style={{transitionDelay: '500ms'}}>
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-lg bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-blue-400" />
              </div>
              <CardTitle className="text-white">Alertas de seguridad</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Sistema de alertas que notifica cualquier desviación de la ruta programada para mayor tranquilidad.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="reveal-on-scroll glass-card bg-slate-900/50 border-blue-500/20" style={{transitionDelay: '600ms'}}>
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-lg bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <CardTitle className="text-white">Puntualidad garantizada</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Control preciso de tiempos de llegada y partida para cumplir con su itinerario planificado.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default SafetySection;
