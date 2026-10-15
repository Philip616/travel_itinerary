export type CategoryType = 'ATTRACTION' | 'FOOD' | 'SHOPPING' | 'TRANSPORT' | 'OTHER';

export interface Trip {
  id: string;
  slug: string;
  title: string;
  start_date: string;
  end_date: string;
  pin_hash: string;
  created_at: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  nickname: string;
  device_id: string;
  created_at: string;
}

export interface ItineraryDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  theme?: string;
  created_at: string;
}

export interface SpotVote {
  id: string;
  spot_id: string;
  member_name: string;
  vote_type: 'UP' | 'DOWN';
  created_at: string;
}

export interface SpotComment {
  id: string;
  spot_id: string;
  member_name: string;
  content: string;
  created_at: string;
}

export interface SpotItem {
  id: string;
  day_id: string;
  title: string;
  time_slot?: string;
  category: CategoryType;
  address?: string;
  google_map_url?: string;
  cost_estimate?: string;
  sort_order: number;
  created_by?: string;
  created_at: string;
  votes?: SpotVote[];
  comments?: SpotComment[];
}

export interface Accommodation {
  id: string;
  trip_id: string;
  name: string;
  check_in: string;
  check_out: string;
  address?: string;
  google_map_url?: string;
  booking_ref?: string;
  phone?: string;
  note?: string;
  created_at: string;
}

export interface Flight {
  id: string;
  trip_id: string;
  member_name: string;
  flight_type: 'DEPARTURE' | 'RETURN';
  flight_number?: string;
  departure_airport?: string;
  arrival_airport?: string;
  departure_time?: string;
  arrival_time?: string;
  terminal?: string;
  note?: string;
  created_at: string;
}

export interface FullTripData {
  trip: Trip;
  members: TripMember[];
  days: (ItineraryDay & { spots: SpotItem[] })[];
  accommodations: Accommodation[];
  flights: Flight[];
}
