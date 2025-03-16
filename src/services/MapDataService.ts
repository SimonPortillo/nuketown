import { createClient } from "@supabase/supabase-js";
import proj4 from "proj4";

// Set up coordinate systems
proj4.defs(
  "EPSG:25833",
  "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
);
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

const transformCoordinates = (coords: number[]): number[] => {
  return proj4("EPSG:25833", "EPSG:4326", coords);
};

// Types
export interface PoliceStation {
  id: number;
  name: string;
  phone?: string;
  lon: number;
  lat: number;
}

export interface Hospital {
  id: number;
  name: string;
  phone?: string;
  lon: number;
  lat: number;
}

interface ShelterData {
  shelter_id: number;
  geom: {
    type: string;
    coordinates: number[];
  };
  adresse: string;
  plasser: number;
  population: number;
  coverage_ratio: number;
}

// Initialize Supabase
const getSupabaseClient = () => {
  const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_REACT_APP_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseKey);
};

export const fetchPoliceStations = async (): Promise<PoliceStation[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("politi_stasjoner").select("*");
  
  if (error) {
    console.error("Error fetching police stations:", error);
    return [];
  }
  
  return data || [];
};

export const fetchHospitals = async (): Promise<Hospital[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("hospitals").select("*");
  
  if (error) {
    console.error("Error fetching hospitals:", error);
    return [];
  }
  
  return data || [];
};

export const fetchGeoJSONData = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("get_shelters_with_population");

  if (error) {
    console.error("Error fetching data:", error);
    return null;
  }

  const geoJSON = {
    type: "FeatureCollection",
    features: (data as ShelterData[]).map((item) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: transformCoordinates([
          item.geom.coordinates[0],
          item.geom.coordinates[1],
        ]),
      },
      properties: {
        id: item.shelter_id,
        address: item.adresse,
        capacity: item.plasser,
        population: item.population,
        coverage_ratio: item.coverage_ratio,
      },
    })),
  };

  return geoJSON;
};
