
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";

const VehiclesSection = () => {
  const vehicles = [
    {
      id: 1,
      name: "Furgoneta",
      description: "Ideal para grupos pequeños",
      capacity: 17,
      pricePerKm: 0.8,
      image: "https://images.unsplash.com/photo-1548705085-101177834f47?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8dmFufGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=600&q=60"
    },
    {
      id: 2,
      name: "Microbús",
      description: "Perfecto para grupos medianos",
      capacity: 28,
      pricePerKm: 1.1,
      image: "https://images.unsplash.com/photo-1543873088-c083e7f33c79?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTR8fG1pbmlidXN8ZW58MHx8MHx8&auto=format&fit=crop&w=600&q=60"
    },
    {
      id: 3,
      name: "Bus",
      description: "Ideal para grupos grandes",
      capacity: 40,
      pricePerKm: 1.5,
      image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8OXx8YnVzfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=600&q=60"
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="vehicle-card overflow-hidden">
              <div className="h-56 w-full relative overflow-hidden">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
                <Badge className="absolute top-4 right-4">${vehicle.pricePerKm}/km</Badge>
              </div>
              <CardHeader>
                <CardTitle>{vehicle.name}</CardTitle>
                <CardDescription>{vehicle.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  <span>Capacidad: {vehicle.capacity} pasajeros</span>
                </div>
              </CardContent>
              <CardFooter>
                <Link to="/register" className="w-full group">
                  <Button className="w-full animated-button">
                    <span>Reservar</span>
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VehiclesSection;
