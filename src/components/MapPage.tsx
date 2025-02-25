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
import type {
  MapGeoJSONFeature,
  Map as MaplibreMap,
  FillExtrusionLayerSpecification,
} from "maplibre-gl";
import {
  faRadiation,
  faHandcuffs,
  faRoad,
  faCube,
  faLayerGroup,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { Card, Typography, Box, Switch, FormControlLabel } from "@mui/material";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CloseIcon from "@mui/icons-material/Close";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
library.add(faRadiation, faHandcuffs, faRoad, faCube, faLayerGroup, faXmark);

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
  const [showPoliceStations, setShowPoliceStations] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [showRoads, setShowRoads] = useState(false);

  const [showControls, setShowControls] = useState(false);
  const initialRouteSet = useRef(false);
  const routeInitialized = useRef(false);
  const styleDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add this utility function to handle 3D buildings
  const handle3DBuildings = useCallback((map: MaplibreMap, show: boolean) => {
    if (!map) return;

    // Check if we need to add the source
    if (show && !map.getSource("openmaptiles")) {
      map.addSource("openmaptiles", {
        url: `https://api.maptiler.com/tiles/v3/tiles.json?key=eE87Cs6ofbIAP2G5mFFy`,
        type: "vector",
      });
    }

    // Check if the layer exists
    const buildingLayer = map.getLayer("3d-buildings");

    if (show && !buildingLayer) {
      // Find the first symbol layer
      const layers = map.getStyle().layers || [];
      let labelLayerId: string | undefined;

      for (const layer of layers) {
        if (
          layer.type === "symbol" &&
          layer.layout &&
          "text-field" in layer.layout
        ) {
          labelLayerId = layer.id;
          break;
        }
      }

      const newBuildingLayer: FillExtrusionLayerSpecification = {
        id: "3d-buildings",
        type: "fill-extrusion",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 15,
        filter: ["!=", ["get", "hide_3d"], true],
        paint: {
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["get", "render_height"],
            0,
            "#141414",
            50,
            "#0d0900",
            400,
            "lightblue",
          ],
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            16,
            ["get", "render_height"],
          ],
          "fill-extrusion-base": [
            "case",
            [">=", ["get", "zoom"], 16],
            ["get", "render_min_height"],
            0,
          ],
          "fill-extrusion-opacity": 0.8,
        },
      };

      map.addLayer(newBuildingLayer, labelLayerId);
    } else if (buildingLayer) {
      map.setLayoutProperty(
        "3d-buildings",
        "visibility",
        show ? "visible" : "none"
      );
    }

    // Update map pitch and bearing
    if (show) {
      map.easeTo({
        pitch: 45,
        bearing: -17.6,
        duration: 1000,
      });
    } else {
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1000,
      });
    }
  }, []);

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
    if (userLocation && geoJSONData && map && !initialRouteSet.current) {
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

        // Calculate center point between user and shelter
        const centerLng = (userLocation[0] + coords[0]) / 2;
        const centerLat = (userLocation[1] + coords[1]) / 2;

        map.flyTo({
          center: [centerLng, centerLat],
          zoom: 14,
          duration: 2000,
          essential: true,
        });

        // Set the flag to prevent further initial route calculations
        initialRouteSet.current = true;
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

          getRoute(userLocation[0], userLocation[1], coords[0], coords[1]);
          // Fit bounds to show both points
          const bounds = new LngLatBounds().extend(userLocation).extend(coords);

          map.fitBounds(bounds, {
            padding: { top: 200, bottom: 200, left: 200, right: 200 },
            duration: 1200,
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

    const addOrUpdateRoute = () => {
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
            visibility: "visible",
          },
          paint: {
            "line-color": "#3887be",
            "line-width": 5,
            "line-opacity": 0.75,
          },
        });
        routeInitialized.current = true;
      }
    };

    // Add the route
    addOrUpdateRoute();

    // Set up a listener for style loading to re-add the route if needed
    const handleStyleData = () => {
      if (routeInitialized.current && !map.getSource("route")) {
        addOrUpdateRoute();
      }

      // Re-apply 3D mode if it's enabled
      if (is3DMode) {
        // Clear existing timeout
        if (styleDataTimeoutRef.current) {
          clearTimeout(styleDataTimeoutRef.current);
        }
        // Set new timeout
        styleDataTimeoutRef.current = setTimeout(() => {
          handle3DBuildings(map, true);
        }, 100);
      }
    };

    map.on("styledata", handleStyleData);

    return () => {
      if (styleDataTimeoutRef.current) {
        clearTimeout(styleDataTimeoutRef.current);
      }
      map.off("styledata", handleStyleData);
    };
  }, [routeData, mapLoaded, is3DMode, handle3DBuildings]);

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

  // Update the is3DMode effect to use the new handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    handle3DBuildings(map, is3DMode);
  }, [is3DMode, mapLoaded, handle3DBuildings]);

  // Add this effect to maintain 3D buildings when other style changes occur
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !is3DMode) return;

    // Short timeout to ensure the style has finished updating
    const timeoutId = setTimeout(() => {
      handle3DBuildings(map, true);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [showPoliceStations, showRoads, mapLoaded, handle3DBuildings, is3DMode]);

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
          longitude: 8.5,
          latitude: 61.5, 
          zoom: 5,
          pitch: is3DMode ? 45 : 0,
          bearing: 0,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={{
          version: 8,
          sources: {
            "vector-tiles": {
              type: "vector",
              url: "https://api.maptiler.com/tiles/v3/tiles.json?key=eE87Cs6ofbIAP2G5mFFy",
            },
            "roads-wms": {
              type: "raster",
              tiles: [
                "https://wms.geonorge.no/skwms1/wms.vegnett2?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&TRANSPARENT=true&LAYERS=Vegnett2&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&STYLES=&BBOX={bbox-epsg-3857}",
              ],
              tileSize: 256,
              attribution: "&copy; Geonorge - Vegnett",
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
              id: "background",
              type: "background",
              paint: {
                "background-color": "#1a1a1a",
              },
            },
            {
              id: "water",
              type: "fill",
              source: "vector-tiles",
              "source-layer": "water",
              paint: {
                "fill-color": "#222222",
              },
            },
            {
              id: "landcover",
              type: "fill",
              source: "vector-tiles",
              "source-layer": "landcover",
              paint: {
                "fill-color": "#2a2a2a",
              },
            },
            {
              id: "roads",
              type: "line",
              source: "vector-tiles",
              "source-layer": "transportation",
              paint: {
                "line-color": "#404040",
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  10,
                  1,
                  15,
                  2,
                  20,
                  4,
                ],
              },
            },
            {
              id: "roads-wms-layer",
              type: "raster",
              source: "roads-wms",
              paint: {
                "raster-opacity": showRoads ? 1 : 0,
              },
            },
            {
              id: "shelter-heatmap",
              type: "heatmap",
              source: "geojson-source",
              maxzoom: 11,
              paint: {
                // Increase weight based on population
                "heatmap-weight": [
                  "interpolate",
                  ["linear"],
                  ["get", "population"],
                  0,
                  0,
                  1000,
                  0.5,
                  5000,
                  1,
                ],
                // Increase intensity as zoom level increases
                "heatmap-intensity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0,
                  1,
                  11,
                  3,
                ],
                // Color gradient from cool to hot
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0,
                  "rgba(0, 0, 255, 0)",
                  0.2,
                  "rgba(0, 0, 255, 0.5)",
                  0.4,
                  "rgba(0, 255, 255, 0.7)",
                  0.6,
                  "rgba(255, 255, 0, 0.8)",
                  0.8,
                  "rgba(255, 128, 0, 0.9)",
                  1,
                  "rgba(255, 0, 0, 1)",
                ],
                // Larger radius for better cluster visualization
                "heatmap-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0,
                  4,
                  11,
                  30,
                ],
                // Smooth transition
                "heatmap-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  10,
                  1,
                  11,
                  0,
                ],
              },
            },
            {
              id: "geojson-layer-heat",
              type: "circle",
              source: "geojson-source",
              minzoom: 11,
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
              minzoom: 11,
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
              minzoom: 11,
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
              minzoom: 11,
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
              minzoom: 11,
              layout: {
                visibility: showPoliceStations ? "visible" : "none",
              },
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
              minzoom: 11,
              layout: {
                visibility: showPoliceStations ? "visible" : "none",
              },
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
              minzoom: 11,
              layout: {
                visibility: showPoliceStations ? "visible" : "none",
              },
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
              minzoom: 11,
              layout: {
                visibility: showPoliceStations ? "visible" : "none",
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
      <Card
        sx={{
          position: "absolute",
          left: "20px",
          top: "110px",
          zIndex: 2,
          backgroundColor: "rgba(38, 38, 38, 0.95)",
          color: "white",
          padding: "8px",
          borderRadius: "12px",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
          cursor: "pointer",
          transition: "all 0.3s ease",
          "&:hover": {
            backgroundColor: "rgba(58, 58, 58, 0.95)",
          },
        }}
        onClick={() => setShowControls(!showControls)}
      >
        <FontAwesomeIcon
          icon={showControls ? faXmark : faLayerGroup}
          style={{
            color: "#ffc400",
            fontSize: "1.2rem",
            transition: "transform 0.3s ease",
            marginTop: "4px",
          }}
        />
      </Card>

      {/* Controls container */}
      <Box
        sx={{
          position: "absolute",
          left: "20px",
          top: "160px",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          opacity: showControls ? 1 : 0,
          transform: showControls ? "translateX(0)" : "translateX(-20px)",
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        {/* Police stations toggle */}
        <Card
          sx={{
            backgroundColor: "rgba(38, 38, 38, 0.95)",
            color: "white",
            padding: "11px",
            borderRadius: "12px",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={showPoliceStations}
                onChange={(e) => setShowPoliceStations(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: "#0066ff",
                    "&:hover": {
                      backgroundColor: "rgba(0, 102, 255, 0.08)",
                    },
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#0066ff",
                  },
                }}
              />
            }
            label={
              <FontAwesomeIcon
                icon={faHandcuffs}
                style={{
                  color: showPoliceStations
                    ? "#0066ff"
                    : "rgba(255, 255, 255, 0.7)",
                  transition: "color 0.3s ease",
                  fontSize: "1.2rem",
                }}
              />
            }
          />
        </Card>

        {/* 3D Mode toggle */}
        <Card
          sx={{
            backgroundColor: "rgba(38, 38, 38, 0.95)",
            color: "white",
            padding: "11px",
            borderRadius: "12px",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={is3DMode}
                onChange={(e) => setIs3DMode(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: "#4caf50",
                    "&:hover": {
                      backgroundColor: "rgba(76, 175, 80, 0.08)",
                    },
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#4caf50",
                  },
                }}
              />
            }
            label={
              <FontAwesomeIcon
                icon={faCube}
                style={{
                  color: is3DMode ? "#4caf50" : "rgba(255, 255, 255, 0.7)",
                  transition: "color 0.3s ease",
                  fontSize: "1.2rem",
                }}
              />
            }
          />
        </Card>

        {/* Roads toggle */}
        <Card
          sx={{
            backgroundColor: "rgba(38, 38, 38, 0.95)",
            color: "white",
            padding: "11px",
            borderRadius: "12px",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={showRoads}
                onChange={(e) => setShowRoads(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: "#ff9800",
                    "&:hover": {
                      backgroundColor: "rgba(255, 152, 0, 0.08)",
                    },
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#ff9800",
                  },
                }}
              />
            }
            label={
              <FontAwesomeIcon
                icon={faRoad}
                style={{
                  color: showRoads ? "#ff9800" : "rgba(255, 255, 255, 0.7)",
                  transition: "color 0.3s ease",
                  fontSize: "1.2rem",
                }}
              />
            }
          />
        </Card>
      </Box>
    </div>
  );
}

export default MapPage;
