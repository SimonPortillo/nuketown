// MapPage.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Map,
  NavigationControl,
  GeolocateControl,
  FullscreenControl,
  Popup,
  ScaleControl,
} from "react-map-gl/maplibre";
import { LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createClient } from "@supabase/supabase-js";
import proj4 from "proj4";
import type { MapGeoJSONFeature } from "maplibre-gl";
import type { Map as MaplibreMap } from "maplibre-gl";
import { faRadiation, faHandcuffs } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { Card, Typography, Box } from "@mui/material";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CloseIcon from "@mui/icons-material/Close";
import "./MapPage.css"; // Add this import at the top
import type {
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
  Point,
} from "geojson";

const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_REACT_APP_SUPABASE_KEY;
const MapBoxToken = import.meta.env.VITE_MAPBOX_TOKEN;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define coordinate systems
proj4.defs(
  "EPSG:25833",
  "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
);
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

const transformCoordinates = (coords: number[]): number[] => {
  return proj4("EPSG:25833", "EPSG:4326", coords);
};

interface PoliceStation {
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
const fetchPoliceStations = async () => {
  const { data, error } = await supabase.from("politi_stasjoner").select("*");
  if (error) {
    console.error("Error fetching police stations:", error);
    return [];
  }
  return data;
};

const fetchGeoJSONData = async () => {
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

// Add icon to library
library.add(faRadiation, faHandcuffs);

function MapPage() {
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [geoJSONData, setGeoJSONData] = useState<any | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<{
    longitude: number;
    latitude: number;
    address: string;
    capacity: number;
    population?: number;
    coverage_ratio?: number;
  } | null>(null);
  const geolocateRef = useRef<maplibregl.GeolocateControl | undefined>(
    undefined
  );
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [routeData, setRouteData] = useState<any>(null);
  const [distanceToShelter, setDistanceToShelter] = useState<number | null>(
    null
  );
  const [walkTime, setWalkTime] = useState<string | null>(null);
  const mapLoadedRef = useRef(false);
  const [selectedPoliceStation, setSelectedPoliceStation] =
    useState<PoliceStation | null>(null);

  // Fetch data effect
  useEffect(() => {
    const getData = async () => {
      const data = await fetchGeoJSONData();
      const policeData = await fetchPoliceStations();
      setGeoJSONData(data);
      setPoliceStations(policeData);
    };
    getData();
  }, []);

  // Function to calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371;
      const toRadians = (angle: number) => (angle * Math.PI) / 180;
      const dLat = toRadians(lat2 - lat1);
      const dLon = toRadians(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
          Math.cos(toRadians(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance;
    },
    []
  );
  // Function to find the closest shelter
  const findClosestShelter = (
    userLat: number,
    userLon: number,
    shelters: any
  ) => {
    if (!shelters?.features) return null;

    let closestShelter: any = null;
    let minDistance = Infinity;

    shelters.features.forEach((shelter: any) => {
      const shelterCoords = shelter.geometry.coordinates;
      const distance = calculateDistance(
        userLat,
        userLon,
        shelterCoords[1],
        shelterCoords[0]
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestShelter = shelter;
      }
    });

    return closestShelter;
  };

  // Function to fetch route data from MapBox API
  const getRoute = useCallback(
    async (
      startLon: number,
      startLat: number,
      endLon: number,
      endLat: number
    ) => {
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${startLon},${startLat};${endLon},${endLat}?steps=true&geometries=geojson&access_token=${MapBoxToken}`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          setRouteData(data.routes[0].geometry);
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    },
    []
  );

  // Use effect to handle user location changes
  useEffect(() => {
    if (!geolocateRef.current) return;

    const geolocateControl = geolocateRef.current;

    const handleGeolocate = (event: GeolocationPosition) => {
      const { latitude, longitude } = event.coords;
      setUserLocation((prevLocation) => {
        if (
          prevLocation &&
          prevLocation[0] === longitude &&
          prevLocation[1] === latitude
        ) {
          return prevLocation;
        }
        return [longitude, latitude];
      });
    };

    const handleTrackEnd = () => {
      setUserLocation(null);
    };

    geolocateControl.off("geolocate", handleGeolocate);
    geolocateControl.off("trackuserlocationend", handleTrackEnd);

    geolocateControl.on("geolocate", handleGeolocate);
    geolocateControl.on("trackuserlocationend", handleTrackEnd);

    return () => {
      geolocateControl.off("geolocate", handleGeolocate);
      geolocateControl.off("trackuserlocationend", handleTrackEnd);
    };
  }, [mapLoaded]);

  // Use effect to find closest shelter and get route
  useEffect(() => {
    const map = mapRef.current;
    if (userLocation && geoJSONData && map) {
      // Find the closest shelter
      const closestShelter = findClosestShelter(
        userLocation[1],
        userLocation[0],
        geoJSONData
      );

      if (closestShelter) {
        const coords = closestShelter.geometry.coordinates;

        // Calculate the distance to the closest shelter
        const distance = calculateDistance(
          userLocation[1],
          userLocation[0],
          coords[1],
          coords[0]
        );
        setDistanceToShelter(distance);

        const walkTimeMinutes = (distance / 5) * 60;
        setWalkTime(`${Math.round(walkTimeMinutes)}`);

        // Update this part to include population and coverage data
        setSelectedPoint({
          longitude: coords[0],
          latitude: coords[1],
          address: closestShelter.properties.address,
          capacity: closestShelter.properties.capacity,
          population: closestShelter.properties.population,
          coverage_ratio: closestShelter.properties.coverage_ratio,
        });

        // Get the route
        getRoute(userLocation[0], userLocation[1], coords[0], coords[1]);

        // Fit bounds to show both points
        const bounds = new LngLatBounds().extend(userLocation).extend(coords);

        map.fitBounds(bounds, {
          padding: { top: 150, bottom: 150, left: 150, right: 150 },
          duration: 1000,
        });
      } else {
        setDistanceToShelter(null);
      }
    }
  }, [userLocation, geoJSONData, mapRef]);

  // Map setup effect
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geoJSONData || !mapLoaded) return;

    try {
      // Remove existing click handlers to prevent duplicates
      map.off("click", "geojson-layer-symbols", () => {});

      // Setup click handler
      const handleClick = (e: { features?: MapGeoJSONFeature[] }) => {
        if (!e.features?.[0]) return;

        const feature = e.features[0];
        const coords = (
          feature.geometry as {
            type: "Point";
            coordinates: [number, number];
          }
        ).coordinates;

        // Clear any selected police station
        setSelectedPoliceStation(null);

        // Set selected shelter point
        setSelectedPoint({
          longitude: coords[0],
          latitude: coords[1],
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
            coords[1],
            coords[0]
          );

          console.log("Distance calculated:", distance);
          setDistanceToShelter(distance);

          const walkTimeMinutes = (distance / 5) * 60;
          setWalkTime(`${Math.round(walkTimeMinutes)}`);
          console.log("Walk time:", walkTimeMinutes);

          // Get route
          getRoute(userLocation[0], userLocation[1], coords[0], coords[1]);

          // Fit bounds to show both points
          const bounds = new LngLatBounds().extend(userLocation).extend(coords);

          map.fitBounds(bounds, {
            padding: { top: 150, bottom: 150, left: 150, right: 150 },
            duration: 1000,
          });
        } else {
          console.log("No user location available");
        }
      };

      // Add click handler
      map.on("click", "geojson-layer-symbols", handleClick);

      // Create and load the icon properly
      const img = new Image();
      img.onload = () => {
        if (map.hasImage("biohazard-icon")) return;
        map.addImage("biohazard-icon", img);

        // Add source and layer after image is loaded
        if (!map.getSource("geojson-source")) {
          map.addSource("geojson-source", {
            type: "geojson",
            data: geoJSONData,
          });
        } else {
          (map.getSource("geojson-source") as maplibregl.GeoJSONSource).setData(
            geoJSONData
          );
        }

        if (!map.getLayer("geojson-layer-symbols")) {
          map.addLayer({
            id: "geojson-layer-symbols",
            type: "symbol",
            source: "geojson-source",
            layout: {
              "icon-image": "biohazard-icon",
              "icon-size": [
                "interpolate",
                ["linear"],
                ["zoom"],
                5,
                0.4,
                10,
                0.5,
                15,
                0.6,
              ],
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "icon-anchor": "center",
              "icon-offset": [0, 0],
            },
            paint: {
              "icon-opacity": 1,
            },
          });
        }

        map.on("mouseenter", "geojson-layer-symbols", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "geojson-layer-symbols", () => {
          map.getCanvas().style.cursor = "";
        });
      };

      // Create SVG data URL with larger viewBox and centered path
      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 512 512">
          <path fill="#000000" d="${faRadiation.icon[4]}" transform="scale(0.8) translate(51.2, 51.2)"/>
        </svg>
      `;
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      img.src = URL.createObjectURL(blob);

      // Add this after the biohazard icon setup
      const handcuffsImg = new Image();
      handcuffsImg.onload = () => {
        if (map.hasImage("handcuffs-icon")) return;
        map.addImage("handcuffs-icon", handcuffsImg);
      };

      const handcuffsSvgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 512 512">
          <path fill="#FFFFFF" d="${faHandcuffs.icon[4]}" transform="scale(0.65) translate(150, 150)"/>
        </svg>
      `;
      const handcuffsBlob = new Blob([handcuffsSvgString], {
        type: "image/svg+xml",
      });
      handcuffsImg.src = URL.createObjectURL(handcuffsBlob);

      return () => {
        // Cleanup
        map.off("click", "geojson-layer-symbols", handleClick);
      };
    } catch (error) {
      console.error("Error setting up map:", error);
    }
  }, [
    geoJSONData,
    mapLoaded,
    userLocation,
    getRoute,
    calculateDistance,
    walkTime,
  ]);

  // Add effect to trigger geolocation
  useEffect(() => {
    if (mapLoaded && geolocateRef.current) {
      let alreadyTriggered = false;

      const timeoutId = setTimeout(() => {
        if (!alreadyTriggered && !userLocation) {
          console.log("Triggering geolocation on map load...");
          geolocateRef.current?.trigger(); // ✅ Now it only runs once
          alreadyTriggered = true;
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [mapLoaded]); // ✅ No more double triggering

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const policeSource = map.getSource(
      "police-source"
    ) as maplibregl.GeoJSONSource;
    if (policeSource) {
      const policeData: FeatureCollection<Geometry, GeoJsonProperties> = {
        type: "FeatureCollection",
        features: policeStations.map((station) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [station.lon, station.lat],
          },
          properties: {
            id: station.id,
            name: station.name,
            phone: station.phone,
          },
        })),
      };

      policeSource.setData(policeData);
    }
  }, [policeStations, mapLoaded]);
  // Add route layer to the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !routeData || !mapLoaded) return;

    if (map.getSource("route")) {
      (map.getSource("route") as maplibregl.GeoJSONSource).setData({
        type: "Feature",
        properties: {},
        geometry: routeData,
      });
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
        },
        paint: {
          "line-color": "#3887be",
          "line-width": 5,
          "line-opacity": 0.75,
        },
      });
    }
  }, [routeData, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Add click handler for police stations
    map.on("click", "police-layer-symbols", (e) => {
      if (e.features && e.features[0]) {
        const properties = e.features[0].properties;
        const geometry = e.features[0].geometry as Point;
        const coords = geometry.coordinates;

        // Clear any selected shelter point
        setSelectedPoint(null);

        setSelectedPoliceStation({
          id: properties.id,
          name: properties.name,
          phone: properties.phone,
          lon: coords[0],
          lat: coords[1],
        });
      }
    });

    // Add hover effects for police stations
    map.on("mouseenter", "police-layer-symbols", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "police-layer-symbols", () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      map.off("click", "police-layer-symbols", () => {});
    };
  }, [mapLoaded]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Map
        ref={(ref) => {
          mapRef.current = ref?.getMap() ?? null;
        }}
        initialViewState={{
          longitude: 10.7522, // Adjusted to center of Norway
          latitude: 59.9139,
          zoom: 5,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={{
          version: 8,
          sources: {
            openstreetmap: {
              type: "raster",
              tiles: [
                "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: "&copy; openstreetmap",
            },
            "roads-wms": {
              type: "raster",
              tiles: [
                "https://wms.geonorge.no/skwms1/wms.vegnett2?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&TRANSPARENT=true&LAYERS=Vegnett2&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&STYLES=&BBOX={bbox-epsg-3857}",
              ],
              tileSize: 256,
              attribution: "&copy; Geonorge - Vegnett",
            },
            "dsb-wms": {
              type: "raster",
              tiles: [
                "https://ogc.dsb.no/wms.ashx?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&TRANSPARENT=true&LAYERS=layer_340&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&STYLES=&BBOX={bbox-epsg-3857}",
              ],
              tileSize: 256,
              attribution:
                "&copy; DSB - Direktoratet for samfunnssikkerhet og beredskap",
            },
            "geojson-source": {
              type: "geojson",
              data: geoJSONData || { type: "FeatureCollection", features: [] },
            },
            "police-source": {
              type: "geojson",
              data:
                policeStations && policeStations.length > 0
                  ? {
                      type: "FeatureCollection",
                      features: policeStations.map((station) => ({
                        type: "Feature",
                        geometry: {
                          type: "Point",
                          coordinates: [station.lon, station.lat],
                        },
                        properties: {
                          id: station.id,
                          name: station.name,
                          phone: station.phone,
                        },
                      })),
                    }
                  : { type: "FeatureCollection", features: [] },
            },
          },
          layers: [
            {
              id: "openstreetmap-layer",
              type: "raster",
              source: "openstreetmap",
              minzoom: 0,
              maxzoom: 20,
            },
            {
              id: "roads-layer",
              type: "raster",
              source: "roads-wms",
              paint: {
                "raster-opacity": 0,
              },
            },
            {
              id: "dsb-layer",
              type: "raster",
              source: "dsb-wms",
              paint: {
                "raster-opacity": 0, // blir bare brukt for å sjekke om punkter samsvaret mellom datasettene, sett til 1 for å se tilfluktsrom
              },
            },
            {
              id: "geojson-layer-heat",
              type: "circle",
              source: "geojson-source",
              paint: {
                "circle-radius": [
                  "interpolate",
                  ["exponential", 1.75],
                  ["zoom"],
                  12,
                  30, // Larger heat effect at high zoom
                  14,
                  45,
                  16,
                  60,
                ],
                "circle-color": "#ffc400",
                "circle-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  12,
                  0.2,
                  14,
                  0.15,
                  15,
                  0.1,
                ],
                "circle-blur": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  12,
                  1,
                  14,
                  0.8,
                  16,
                  0.6,
                ],
              },
            },
            {
              id: "geojson-layer-glow",
              type: "circle",
              source: "geojson-source",
              paint: {
                "circle-radius": [
                  "interpolate",
                  ["exponential", 1.75],
                  ["zoom"],
                  12,
                  20, // Medium glow at high zoom
                  14,
                  30,
                  16,
                  40,
                ],
                "circle-color": "#ffcd38",
                "circle-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  12,
                  0.4,
                  14,
                  0.3,
                  15,
                  0.2,
                ],
                "circle-blur": 1,
              },
            },
            {
              id: "geojson-layer",
              type: "circle",
              source: "geojson-source",
              paint: {
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  12,
                  6, // Smaller base circle at high zoom
                  14,
                  12,
                  16,
                  14,
                ],
                "circle-color": "#ffc400",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#FFFFFF",
                "circle-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  12,
                  0.9,
                  14,
                  1,
                ],
              },
            },
            {
              id: "geojson-layer-symbols",
              type: "symbol",
              source: "geojson-source",
              layout: {
                "icon-image": "biohazard-icon",
                "icon-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  12,
                  0,
                  13,
                  0.4,
                  14,
                  0.5,
                  16,
                  0.6,
                ],
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
                "icon-anchor": "center",
                "icon-offset": [0, 0],
              },
              paint: {
                "icon-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  12,
                  0,
                  13,
                  0.7,
                  14,
                  1,
                ],
              },
            },
            {
              id: "police-layer-heat",
              type: "circle",
              source: "police-source",
              paint: {
                "circle-radius": [
                  "interpolate",
                  ["exponential", 1.75],
                  ["zoom"],
                  12,
                  30,
                  14,
                  45,
                  16,
                  60,
                ],
                "circle-color": "#0066ff",
                "circle-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  12,
                  0.2,
                  14,
                  0.15,
                  15,
                  0.1,
                ],
                "circle-blur": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  12,
                  1,
                  14,
                  0.8,
                  16,
                  0.6,
                ],
              },
            },
            {
              id: "police-layer-glow",
              type: "circle",
              source: "police-source",
              paint: {
                "circle-radius": [
                  "interpolate",
                  ["exponential", 1.75],
                  ["zoom"],
                  12,
                  20,
                  14,
                  30,
                  16,
                  40,
                ],
                "circle-color": "#3884ff",
                "circle-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  12,
                  0.4,
                  14,
                  0.3,
                  15,
                  0.2,
                ],
                "circle-blur": 1,
              },
            },
            {
              id: "police-layer",
              type: "circle",
              source: "police-source",
              paint: {
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  12,
                  6,
                  14,
                  12,
                  16,
                  14,
                ],
                "circle-color": "#0066ff",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#FFFFFF",
                "circle-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  12,
                  0.9,
                  14,
                  1,
                ],
              },
            },
            {
              id: "police-layer-symbols",
              type: "symbol",
              source: "police-source",
              layout: {
                "icon-image": "handcuffs-icon",
                "icon-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  12,
                  0,
                  13,
                  0.4,
                  14,
                  0.5,
                  16,
                  0.6,
                ],
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
                "icon-anchor": "center",
                "icon-offset": [-3, -2],
              },
              paint: {
                "icon-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  12,
                  0,
                  13,
                  0.7,
                  14,
                  1,
                ],
              },
            },
          ],
        }}
        onLoad={() => {
          if (mapLoadedRef.current) return; // Hopp over hvis kartet allerede er lastet
          console.log("Map loaded");
          setMapLoaded(true);
          mapLoadedRef.current = true; // Marker at kartet er lastet
        }}
        onError={(e) => {
          console.error("Map error:", e);
        }}
      >
        {selectedPoint && (
          <Popup
            key={`${selectedPoint.longitude}-${selectedPoint.latitude}`}
            longitude={selectedPoint.longitude}
            latitude={selectedPoint.latitude}
            anchor="bottom"
            onClose={() => setSelectedPoint(null)}
            closeOnClick={false}
            className="custom-popup" // Add this class
          >
            <Card
              sx={{
                backgroundColor: "rgba(38, 38, 38, 0.95)",
                color: "white",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                minWidth: "250px",
                position: "relative", // Add this
              }}
            >
              <Box
                onClick={() => setSelectedPoint(null)}
                sx={{
                  position: "absolute",
                  right: "8px",
                  top: "8px",
                  cursor: "pointer",
                  color: "rgba(255, 255, 255, 0.7)",
                  "&:hover": {
                    color: "#ffc400",
                  },
                  zIndex: 1,
                }}
              >
                <CloseIcon />
              </Box>
              <Box sx={{ p: 2 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <HomeIcon sx={{ color: "#ffc400", fontSize: 24 }} />
                  <Typography variant="h6" sx={{ color: "white" }}>
                    {selectedPoint.address}
                  </Typography>
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <PeopleIcon sx={{ color: "#ffc400", fontSize: 24 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      color="rgba(255, 255, 255, 0.7)"
                    >
                      Kapasitet
                    </Typography>
                    <Typography variant="body1" sx={{ color: "#ffc400" }}>
                      {selectedPoint.capacity} plasser
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <PeopleIcon sx={{ color: "#ffc400", fontSize: 24 }} />
                  <Box sx={{ width: "100%" }}>
                    <Typography
                      variant="body2"
                      color="rgba(255, 255, 255, 0.7)"
                    >
                      Områdedekning
                    </Typography>
                    {selectedPoint.population ? (
                      <>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="body1" sx={{ color: "#ffc400" }}>
                            {selectedPoint.coverage_ratio?.toFixed(1)}% dekning
                          </Typography>
                          <Typography
                            variant="body2"
                            color="rgba(255, 255, 255, 0.7)"
                          >
                            {selectedPoint.population.toLocaleString()} personer
                            i området
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: "100%",
                            bgcolor: "rgba(255, 255, 255, 0.1)",
                            borderRadius: 1,
                          }}
                        >
                          <Box
                            sx={{
                              width: `${Math.min(
                                selectedPoint.coverage_ratio ?? 0,
                                100
                              )}%`,
                              height: 8,
                              borderRadius: 1,
                              bgcolor:
                                (selectedPoint.coverage_ratio ?? 0) >= 100
                                  ? "#4caf50"
                                  : (selectedPoint.coverage_ratio ?? 0) >= 50
                                  ? "#ffc400"
                                  : "#f44336",
                              transition: "width 0.5s ease-in-out",
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              (selectedPoint.coverage_ratio ?? 0) >= 100
                                ? "#4caf50"
                                : (selectedPoint.coverage_ratio ?? 0) >= 50
                                ? "#ffc400"
                                : "#f44336",
                            mt: 0.5,
                          }}
                        >
                          {(selectedPoint.coverage_ratio ?? 0) >= 100
                            ? "God dekning"
                            : (selectedPoint.coverage_ratio ?? 0) >= 50
                            ? "Begrenset dekning"
                            : "Kritisk underdekning"}
                        </Typography>
                      </>
                    ) : (
                      <Typography
                        variant="body2"
                        color="rgba(255, 255, 255, 0.7)"
                      >
                        Ingen befolkningsdata tilgjengelig
                      </Typography>
                    )}
                  </Box>
                </Box>

                {distanceToShelter && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <DirectionsWalkIcon
                      sx={{ color: "#ffc400", fontSize: 24 }}
                    />
                    <Box>
                      <Typography
                        variant="body2"
                        color="rgba(255, 255, 255, 0.7)"
                      >
                        Avstand
                      </Typography>
                      <Typography variant="body1" sx={{ color: "#ffc400" }}>
                        {distanceToShelter.toFixed(2)} km
                      </Typography>
                      <Typography variant="body1" sx={{ color: "#ffc400" }}>
                        Estimert gange: {walkTime} min
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <LocationOnIcon sx={{ color: "#ffc400", fontSize: 24 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      color="rgba(255, 255, 255, 0.7)"
                    >
                      Koordinater
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#ffc400" }}>
                      {selectedPoint.latitude.toFixed(6)},{" "}
                      {selectedPoint.longitude.toFixed(6)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Popup>
        )}
        {selectedPoliceStation && (
          <Popup
            longitude={selectedPoliceStation.lon}
            latitude={selectedPoliceStation.lat}
            anchor="bottom"
            onClose={() => setSelectedPoliceStation(null)}
            closeOnClick={false}
            className="custom-popup"
          >
            <Card
              sx={{
                backgroundColor: "rgba(38, 38, 38, 0.95)",
                color: "white",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                minWidth: "250px",
                position: "relative",
              }}
            >
              <Box
                onClick={() => setSelectedPoliceStation(null)}
                sx={{
                  position: "absolute",
                  right: "8px",
                  top: "8px",
                  cursor: "pointer",
                  color: "rgba(255, 255, 255, 0.7)",
                  "&:hover": {
                    color: "#0066ff",
                  },
                  zIndex: 1,
                }}
              >
                <CloseIcon />
              </Box>
              <Box sx={{ p: 2 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <PeopleIcon sx={{ color: "#0066ff", fontSize: 24 }} />
                  <Typography variant="h6" sx={{ color: "white" }}>
                    {selectedPoliceStation.name}
                  </Typography>
                </Box>

                {selectedPoliceStation.phone && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        color="rgba(255, 255, 255, 0.7)"
                      >
                        Telefon
                      </Typography>
                      <Typography variant="body1" sx={{ color: "#0066ff" }}>
                        {selectedPoliceStation.phone}
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <LocationOnIcon sx={{ color: "#0066ff", fontSize: 24 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      color="rgba(255, 255, 255, 0.7)"
                    >
                      Koordinater
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#0066ff" }}>
                      {selectedPoliceStation.lat.toFixed(6)},{" "}
                      {selectedPoliceStation.lon.toFixed(6)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Popup>
        )}
        <FullscreenControl />
        <GeolocateControl
          ref={geolocateRef as any}
          positionOptions={{ enableHighAccuracy: false }}
          trackUserLocation={true}
          showUserLocation={true}
        />
        <NavigationControl />
        <ScaleControl />
      </Map>
      <Card
        sx={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 1,
          backgroundColor: "rgba(38, 38, 38, 0.95)",
          color: "white",
          padding: "16px",
          borderRadius: "12px",
          minWidth: "200px",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        {distanceToShelter !== null ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <DirectionsWalkIcon sx={{ color: "#ffc400", fontSize: 24 }} />
            <Box>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                Avstand til tilfluktsrom
              </Typography>
              <Typography variant="h6" sx={{ color: "#ffc400" }}>
                {distanceToShelter.toFixed(2)} km
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <MyLocationIcon sx={{ color: "#ffc400", fontSize: 24 }} />
            <Typography variant="body1">Finner din posisjon...</Typography>
          </Box>
        )}
      </Card>
    </div>
  );
}

export default MapPage;
