import { useState, useEffect } from 'react';
import { 
  fetchGeoJSONData,
  fetchPoliceStations, 
  fetchHospitals,
  PoliceStation,
  Hospital
} from '../services/MapDataService';

/**
 * Custom hook for fetching and managing map data
 */
export const useMapData = () => {
  const [geoJSONData, setGeoJSONData] = useState<any | null>(null);
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [shelterData, policeData, hospitalData] = await Promise.all([
          fetchGeoJSONData(),
          fetchPoliceStations(),
          fetchHospitals()
        ]);
        
        // Only update state if component is still mounted
        if (isMounted) {
          setGeoJSONData(shelterData);
          setPoliceStations(policeData);
          setHospitals(hospitalData);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading map data:', err);
          setError(err instanceof Error ? err : new Error('Unknown error loading map data'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    geoJSONData,
    policeStations,
    hospitals,
    isLoading,
    error
  };
};
