import { Database } from './supabase';

export type City = Database['public']['Tables']['cities']['Row'];
export type Operator = Database['public']['Tables']['operators']['Row'];
export type Bus = Database['public']['Tables']['buses']['Row'];
export type Route = Database['public']['Tables']['routes']['Row'];
export type Trip = Database['public']['Tables']['trips']['Row'];
export type Seat = Database['public']['Tables']['seats']['Row'];
export type SeatLock = Database['public']['Tables']['seat_locks']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];

export interface TripWithDetails extends Trip {
  operators: Operator;
  buses: Bus;
  routes: Route & {
    from_city: City;
    to_city: City;
  };
}

export interface SearchResult {
  trip: Trip;
  operator: Operator;
  bus: Bus;
  from_city: City;
  to_city: City;
  duration: string;
}

export interface SearchParams {
  from: string;
  to: string;
  date: string;
  seats: number;
  isForeigner: boolean;
}

export interface SeatWithLock extends Seat {
  lock?: SeatLock;
}

export interface CartItem {
  tripId: string;
  trip: TripWithDetails;
  seats: Seat[];
  isForeigner: boolean;
}

export interface BookingState {
  step: 'search' | 'results' | 'seats' | 'passenger' | 'payment' | 'confirmation';
  searchParams: SearchParams | null;
  selectedTrip: TripWithDetails | null;
  selectedSeats: Seat[];
  isForeigner: boolean;
}
