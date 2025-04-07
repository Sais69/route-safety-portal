
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const VehiclesSection = () => {
  const vehicles = [
    {
      id: 1,
      name: "Furgoneta",
      description: "Ideal para grupos pequeños",
      capacity: 17,
      pricePerKm: 0.89,
      embedSrc: "https://sketchfab.com/models/e2c6fe369b5a4b0393a20d446bf3189c/embed"
    },
    {
      id: 2,
      name: "Microbús",
      description: "Perfecto para grupos medianos",
      capacity: 28,
      pricePerKm: 1.29,
      embedSrc: "https://sketchfab.com/models/e84d81d89c3746f399269c2b9103fad2/embed"
    },
    {
      id: 3,
      name: "Bus",
      description: "Ideal para grupos grandes",
      capacity: 40,
      pricePerKm: 1.69,
      embedSrc: "https://sketchfab.com/models/8361228fca134c7d9890ded9232cc03f/embed"
    }
  ];

  return (
    <section id="vehicles" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Nuestra flota de vehículos</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Disponemos de una amplia gama de vehículos para adaptarnos a sus necesidades específicas de transporte.
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl px-4">
          <Carousel className="w-full">
            <CarouselContent>
              {vehicles.map((vehicle) => (
                <CarouselItem key={vehicle.id} className="md:basis-full">
                  <div className="rounded-lg overflow-hidden bg-white shadow-lg p-4 h-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Modelo 3D */}
                      <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden border">
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
                        <Badge className="absolute top-4 right-4 text-lg py-1 px-3 bg-primary">{vehicle.name}</Badge>
                      </div>
                      
                      {/* Información del vehículo */}
                      <div className="flex flex-col justify-between p-4">
                        <div>
                          <h3 className="text-2xl font-bold mb-2">{vehicle.name}</h3>
                          <p className="text-gray-600 mb-4">{vehicle.description}</p>
                          
                          <div className="flex items-center mb-6">
                            <Users className="mr-2 h-5 w-5 text-primary" />
                            <span className="text-lg">Capacidad: <strong>{vehicle.capacity} pasajeros</strong></span>
                          </div>
                          
                          <div className="bg-gray-100 p-4 rounded-lg mb-6">
                            <h4 className="font-semibold mb-2">Características:</h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                              <li>Aire acondicionado</li>
                              <li>Asientos reclinables</li>
                              <li>Sistema de sonido</li>
                              <li>GPS en tiempo real</li>
                            </ul>
                          </div>
                        </div>

                        <Link to="/booking" className="w-full">
                          <Button className="w-full bg-primary text-white hover:bg-primary/90">
                            Reservar Ahora
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <div className="hidden md:block">
              <CarouselPrevious className="h-12 w-12 -left-16" />
              <CarouselNext className="h-12 w-12 -right-16" />
            </div>

            <div className="mt-8 flex justify-center gap-2 md:hidden">
              <Button 
                variant="outline" 
                size="icon"
                className="carousel-mobile-prev h-8 w-8 rounded-full"
                onClick={() => {
                  const prevButton = document.querySelector('.carousel-prev');
                  if (prevButton instanceof HTMLElement) {
                    prevButton.click();
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                className="carousel-mobile-next h-8 w-8 rounded-full"
                onClick={() => {
                  const nextButton = document.querySelector('.carousel-next');
                  if (nextButton instanceof HTMLElement) {
                    nextButton.click();
                  }
                }}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Carousel>

          {/* Large visible navigation buttons */}
          <div className="mt-8 flex justify-center space-x-4">
            <Button 
              variant="outline" 
              size="lg" 
              className="flex items-center gap-2"
              onClick={() => {
                const prevButton = document.querySelector('.carousel-prev');
                if (prevButton instanceof HTMLElement) {
                  prevButton.click();
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" /> Anterior
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="flex items-center gap-2"
              onClick={() => {
                const nextButton = document.querySelector('.carousel-next');
                if (nextButton instanceof HTMLElement) {
                  nextButton.click();
                }
              }}
            >
              Siguiente <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VehiclesSection;
