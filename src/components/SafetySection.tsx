
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, MapPin, Bell, Clock } from "lucide-react";

const SafetySection = () => {
  return (
    <section id="safety" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Su seguridad es nuestra prioridad</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Todos nuestros vehículos están equipados con tecnología avanzada para garantizar un viaje seguro y tranquilo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="vehicle-card">
            <CardHeader className="pb-2">
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Monitoreo en tiempo real</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Todos los vehículos equipados con GPS permitiendo seguimiento en tiempo real durante todo el trayecto.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="vehicle-card">
            <CardHeader className="pb-2">
              <MapPin className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Rutas optimizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Utilizamos algoritmos avanzados para calcular las rutas más eficientes y seguras para su viaje.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="vehicle-card">
            <CardHeader className="pb-2">
              <Bell className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Alertas de seguridad</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Sistema de alertas que notifica cualquier desviación de la ruta programada para mayor tranquilidad.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="vehicle-card">
            <CardHeader className="pb-2">
              <Clock className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Puntualidad garantizada</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
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
