
import { Driver } from "@/types/driver";

// Custom type for bookings with optional driver info
export interface BookingWithDriver {
  id: string;
  user_id: string;
  user_email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  departure_date: string;
  departure_time: string;
  return_date: string | null;
  return_time: string | null;
  round_trip: boolean;
  origin: string;
  destination: string;
  distance: number;
  duration: string | null;
  cost: number;
  status: string;
  vehicle_type: string;
  created_at: string;
  updated_at: string;
  id_conductor?: string;
  driver?: Driver | null;
}

export interface FilterOptions {
  status: string;
  dateRange: string;
  searchQuery: string;
}
