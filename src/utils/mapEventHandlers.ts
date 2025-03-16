import { Map as MaplibreMap, LngLatBounds } from "maplibre-gl";
import type { MapGeoJSONFeature } from "maplibre-gl";
import { PoliceStation, Hospital } from "../services/MapDataService";
import { calculateDistance, calculateWalkTime } from "./mapCalculations";

// Shelter click handler
export const setupShelterClickHandler = (
  map: MaplibreMap,
  layerId: string,
  options: {
    onSelect: (point: {
      longitude: number;
      latitude: number;
      address: string;
      capacity: number;
      population?: number;
      coverage_ratio?: number;
    }) => void;
    onClearSelections: () => void;
    userLocation: [number, number] | null;
    onDistanceCalculated: (distance: number) => void;
    onWalkTimeCalculated: (time: string) => void;
    onGetRoute: (startLon: number, startLat: number, endLon: number, endLat: number) => void;
  }
) => {
  const {
    onSelect,
    onClearSelections,
    userLocation,
    onDistanceCalculated,
    onWalkTimeCalculated,
    onGetRoute
  } = options;

  // Remove existing handlers if any
  map.off("click", layerId, undefined as any);

  // Setup click handler
  const handleClick = (e: { features?: MapGeoJSONFeature[] }) => {
    if (!e.features?.[0]) return;

    const feature = e.features[0];
    // Check if geometry is of type Point and extract coordinates
    if (feature.geometry.type !== 'Point') {
      console.error('Expected Point geometry but got', feature.geometry.type);
      return;
    }
    const coordinates = feature.geometry.coordinates as [number, number];

    // Clear other selections
    onClearSelections();

    // Set selected shelter point
    onSelect({
      longitude: coordinates[0],
      latitude: coordinates[1],
      address: feature.properties?.address as string,
      capacity: feature.properties?.capacity as number,
      population: feature.properties?.population as number,
      coverage_ratio: feature.properties?.coverage_ratio as number,
    });

    // Handle route and distance if we have user location
    if (userLocation) {
      console.log("User location available, calculating route");

      const distance = calculateDistance(
        userLocation[1],
        userLocation[0],
        coordinates[1],
        coordinates[0]
      );

      console.log("Distance calculated:", distance);
      onDistanceCalculated(distance);

      const walkTimeMinutes = calculateWalkTime(distance);
      onWalkTimeCalculated(`${Math.round(walkTimeMinutes)}`);
      console.log("Walk time:", walkTimeMinutes);

      onGetRoute(userLocation[0], userLocation[1], coordinates[0], coordinates[1]);
      
      // Fit bounds to show both points
      const bounds = new LngLatBounds().extend(userLocation).extend(coordinates);

      map.fitBounds(bounds, {
        padding: { top: 200, bottom: 200, left: 200, right: 200 },
        duration: 1200,
      });
    } else {
      console.log("No user location available");
    }
  };

  // Store the hover handlers for proper cleanup
  const handleMouseEnter = () => {
    map.getCanvas().style.cursor = "pointer";
  };

  const handleMouseLeave = () => {
    map.getCanvas().style.cursor = "";
  };

  // Add click handler
  map.on("click", layerId, handleClick);

  // Add hover effects
  map.on("mouseenter", layerId, handleMouseEnter);
  map.on("mouseleave", layerId, handleMouseLeave);

  // Return cleanup function
  return () => {
    map.off("click", layerId, handleClick);
    map.off("mouseenter", layerId, handleMouseEnter);
    map.off("mouseleave", layerId, handleMouseLeave);
  };
};

// Police station click handler
export const setupPoliceStationClickHandler = (
  map: MaplibreMap,
  layerId: string,
  options: {
    onSelect: (policeStation: PoliceStation) => void;
    onClearSelections: () => void;
  }
) => {
  const { onSelect, onClearSelections } = options;

  const handleClick = (e: { features?: MapGeoJSONFeature[] }) => {
    if (e.features && e.features[0]) {
      const properties = e.features[0].properties;
      
      // Check if geometry is of type Point and extract coordinates
      if (e.features[0].geometry.type !== 'Point') {
        console.error('Expected Point geometry but got', e.features[0].geometry.type);
        return;
      }
      const coordinates = e.features[0].geometry.coordinates as [number, number];

      // Clear other selections
      onClearSelections();

      onSelect({
        id: properties.id,
        name: properties.name,
        phone: properties.phone,
        lon: coordinates[0],
        lat: coordinates[1],
      });
    }
  };

  const handleMouseEnter = () => {
    map.getCanvas().style.cursor = "pointer";
  };

  const handleMouseLeave = () => {
    map.getCanvas().style.cursor = "";
  };

  map.on("click", layerId, handleClick);
  map.on("mouseenter", layerId, handleMouseEnter);
  map.on("mouseleave", layerId, handleMouseLeave);

  return () => {
    map.off("click", layerId, handleClick);
    map.off("mouseenter", layerId, handleMouseEnter);
    map.off("mouseleave", layerId, handleMouseLeave);
  };
};

// Hospital click handler
export const setupHospitalClickHandler = (
  map: MaplibreMap,
  layerId: string,
  options: {
    onSelect: (hospital: Hospital) => void;
    onClearSelections: () => void;
  }
) => {
  const { onSelect, onClearSelections } = options;

  const handleClick = (e: { features?: MapGeoJSONFeature[] }) => {
    if (e.features && e.features[0]) {
      const properties = e.features[0].properties;
      
      // Check if geometry is of type Point and extract coordinates
      if (e.features[0].geometry.type !== 'Point') {
        console.error('Expected Point geometry but got', e.features[0].geometry.type);
        return;
      }
      const coordinates = e.features[0].geometry.coordinates as [number, number];

      onClearSelections();
      
      onSelect({
        id: properties.id,
        name: properties.name,
        phone: properties.phone,
        lon: coordinates[0],
        lat: coordinates[1],
      });
    }
  };

  const handleMouseEnter = () => {
    map.getCanvas().style.cursor = "pointer";
  };

  const handleMouseLeave = () => {
    map.getCanvas().style.cursor = "";
  };

  map.on("click", layerId, handleClick);
  map.on("mouseenter", layerId, handleMouseEnter);
  map.on("mouseleave", layerId, handleMouseLeave);

  return () => {
    map.off("click", layerId, handleClick);
    map.off("mouseenter", layerId, handleMouseEnter);
    map.off("mouseleave", layerId, handleMouseLeave);
  };
};

// Route management functions
export const addOrUpdateRouteLayer = (
  map: MaplibreMap, 
  routeData: any, 
  options: {
    routeColor?: string;
    routeWidth?: number;
    routeOpacity?: number;
  } = {}
): boolean => {
  const {
    routeColor = "#3887be",
    routeWidth = 5,
    routeOpacity = 0.75
  } = options;
  
  if (map.getSource("route")) {
    (map.getSource("route") as maplibregl.GeoJSONSource).setData({
      type: "Feature",
      properties: {},
      geometry: routeData,
    });
    return false; // Route was updated
  } else {
    map.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: routeData,
      },
    });

    map.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
        visibility: "visible",
      },
      paint: {
        "line-color": routeColor,
        "line-width": routeWidth,
        "line-opacity": routeOpacity,
      },
    });
    
    return true; // Route was initialized
  }
};
