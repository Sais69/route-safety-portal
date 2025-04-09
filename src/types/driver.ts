
export interface Driver {
  id?: string;
  nombre: string;
  apellido: string;
  numero_celular: string;
  placa_vehiculo: string;
  modelo_vehiculo: string;
  disponible: boolean;
  created_at?: string;
}
