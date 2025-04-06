
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate registration - in a real app this would create an account
    toast.success("Registro exitoso");
    
    // Redirect to booking page after successful registration
    setTimeout(() => {
      navigate("/booking");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
      <Link to="/" className="absolute top-4 left-4 flex items-center text-gray-600 hover:text-primary">
        <ArrowLeft className="mr-2" size={16} />
        Volver al inicio
      </Link>
      
      <div className="flex items-center mb-8">
        <Bus className="h-8 w-8 text-primary mr-2" />
        <h1 className="text-2xl font-bold">RouteSafety</h1>
      </div>
      
      <Card className="w-full max-w-md slide-in">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Crear cuenta</CardTitle>
          <CardDescription className="text-center">
            Regístrese para comenzar a utilizar nuestros servicios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input id="firstName" type="text" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input id="lastName" type="text" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="ejemplo@correo.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" type="tel" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input id="confirmPassword" type="password" required />
            </div>
            <Button type="submit" className="w-full animated-button">
              Registrarse
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-center text-sm text-gray-600 mt-2">
            ¿Ya tiene una cuenta?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Iniciar sesión
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
