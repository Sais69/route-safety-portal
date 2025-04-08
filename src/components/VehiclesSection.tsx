import React, { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Users, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const VehiclesSection = () => {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const carouselContentRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const vehicles = [
    {
      id: 1,
      name: "Furgoneta",
      description: "Ideal para grupos pequeños",
      capacity: 17,
      pricePerKm: 0.89,
      embedSrc: "https://sketchfab.com/models/e2c6fe369b5a4b0393a20d446bf3189c/embed",
      features: [
        "Aire acondicionado",
        "Asientos reclinables",
        "Sistema de sonido",
        "GPS en tiempo real",
        "WiFi a bordo",
      ]
    },
    {
      id: 2,
      name: "Microbús",
      description: "Perfecto para grupos medianos",
      capacity: 28,
      pricePerKm: 1.29,
      embedSrc: "https://sketchfab.com/models/e84d81d89c3746f399269c2b9103fad2/embed",
      features: [
        "Aire acondicionado",
        "Asientos reclinables",
        "Sistema de sonido premium",
        "GPS en tiempo real",
        "WiFi a bordo",
        "Espacio para equipaje"
      ]
    },
    {
      id: 3,
      name: "Bus",
      description: "Ideal para grupos grandes",
      capacity: 40,
      pricePerKm: 1.69,
      embedSrc: "https://sketchfab.com/models/8361228fca134c7d9890ded9232cc03f/embed",
      features: [
        "Aire acondicionado",
        "Asientos reclinables premium",
        "Sistema de sonido envolvente",
        "GPS en tiempo real",
        "WiFi de alta velocidad",
        "Amplio espacio para equipaje",
        "Baño a bordo"
      ]
    }
  ];

  React.useEffect(() => {
    if (!api) {
      return;
    }

    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", handleSelect);
    api.on("reInit", handleSelect);

    return () => {
      api.off("select", handleSelect);
      api.off("reInit", handleSelect);
    };
  }, [api]);

  const handlePrev = () => {
    if (api) {
      api.scrollPrev();
    }
  };

  const handleNext = () => {
    if (api) {
      api.scrollNext();
    }
  };

  return (
    <section id="vehicles" className="py-20 bg-gradient-to-b from-slate-900/70 to-slate-950/90">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            Nuestra flota de vehículos
          </h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Disponemos de una amplia gama de vehículos para adaptarnos a sus necesidades específicas de transporte.
          </motion.p>
        </div>

        <div className="relative mx-auto max-w-5xl px-4">
          <Carousel 
            setApi={setApi} 
            className="w-full"
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent ref={carouselContentRef}>
              {vehicles.map((vehicle, index) => (
                <CarouselItem key={vehicle.id} className="md:basis-full">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="glass-card bg-slate-900/50 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)] rounded-lg overflow-hidden p-4 h-full backdrop-blur-md"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Modelo 3D */}
                      <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden border border-blue-500/30">
                        <div className="sketchfab-embed-wrapper h-full">
                          <iframe 
                            title={vehicle.name}
                            frameBorder="0"
                            allowFullScreen={true}
                            allow="autoplay; fullscreen; xr-spatial-tracking"
                            src={vehicle.embedSrc}
                            className="w-full h-full"
                          />
                        </div>
                        <Badge className="absolute top-4 right-4 text-lg py-1 px-3 bg-blue-500/80 shadow-[0_0_10px_rgba(59,130,246,0.7)] border border-blue-400/50">
                          {vehicle.name}
                        </Badge>
                      </div>
                      
                      {/* Información del vehículo */}
                      <div className="flex flex-col justify-between p-4">
                        <div>
                          <h3 className="text-2xl font-bold mb-2 text-white">{vehicle.name}</h3>
                          <p className="text-gray-300 mb-4">{vehicle.description}</p>
                          
                          <div className="flex items-center mb-6 bg-slate-800/50 p-3 rounded-lg border border-blue-500/20">
                            <Users className="mr-2 h-5 w-5 text-blue-400" />
                            <span className="text-lg text-gray-200">Capacidad: <strong className="text-white">{vehicle.capacity} pasajeros</strong></span>
                          </div>
                          
                          <div className="bg-slate-800/50 p-4 rounded-lg mb-6 border border-blue-500/20">
                            <h4 className="font-semibold mb-2 text-blue-400">Características:</h4>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-300">
                              {vehicle.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center">
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <Link to={user ? "/booking" : "/login"} className="w-full">
                          <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-[0_0_10px_rgba(59,130,246,0.5)] border border-blue-500/50 transition-all duration-300">
                            Reservar Ahora
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <div className="hidden md:block">
              <CarouselPrevious className="h-12 w-12 -left-16 border border-blue-500/30 bg-slate-800/70 text-blue-400 hover:bg-slate-700/80 hover:text-blue-300" />
              <CarouselNext className="h-12 w-12 -right-16 border border-blue-500/30 bg-slate-800/70 text-blue-400 hover:bg-slate-700/80 hover:text-blue-300" />
            </div>

            <div className="mt-8 flex justify-center gap-2">
              {vehicles.map((_, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="icon"
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    "h-3 w-3 rounded-full p-0 border border-blue-500/30", 
                    current === index 
                      ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.7)]" 
                      : "bg-slate-700/70 hover:bg-slate-600/70"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Botones de navegación visibles */}
            <div className="mt-8 flex justify-center space-x-4">
              <Button 
                variant="outline" 
                size="lg" 
                className="flex items-center gap-2 bg-slate-800/70 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 border border-blue-500/30"
                onClick={handlePrev}
              >
                <ArrowLeft className="h-5 w-5" /> Anterior
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="flex items-center gap-2 bg-slate-800/70 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 border border-blue-500/30"
                onClick={handleNext}
              >
                Siguiente <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default VehiclesSection;
