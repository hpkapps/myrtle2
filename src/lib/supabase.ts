import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase env vars. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type RunwayConfig = {
  id: string;
  week_start: string;
  landing_runway: "27L" | "27R" | "09L" | "09R";
  note: string | null;
  updated_at: string;
};

export type HeavyArrival = {
  id: string;
  callsign: string;
  airline: string;
  aircraft_type: string;
  origin: string | null;
  scheduled_time: string | null;
  days: string[];
  is_watched: boolean;
  notes: string | null;
  created_at: string;
};

export type SpotterLogEntry = {
  id: string;
  spotted_at: string;
  callsign: string;
  aircraft_type: string;
  airline: string | null;
  runway: string | null;
  note: string | null;
  created_at: string;
};

export type WeatherPayload = {
  location: string;
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
    cloud_cover: number;
    visibility: number;
    time: string;
  } | null;
  hourly: {
    time: string[];
    temperature_2m: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    weather_code: number[];
    cloud_cover: number[];
  } | null;
  timezone: string;
  utc_offset_seconds: number;
};
