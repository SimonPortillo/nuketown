// MapPage.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Map,
  NavigationControl,
  GeolocateControl,
  FullscreenControl,
  ScaleControl,
} from "react-map-gl/maplibre";
import { LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MaplibreMap } from "maplibre-gl";
import {
  faRadiation,
  faHandcuffs,
  faRoad,
  faCube,
  faLayerGroup,
  faXmark,
  faHospital,
} from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import "./MapPage.css";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";

// Import components
import PoliceStationPopup from "./popups/PoliceStationPopup";
import HospitalPopup from "./popups/HospitalPopup";
import ShelterPopup from "./popups/ShelterPopup";
import MapControls from "./controls/MapControls";
import DistanceInfoCard from "./cards/DistanceInfoCard";
import MapLayerToggle from "./buttons/MapLayerToggle";

// Import services
import { PoliceStation, Hospital } from "../services/MapDataService";

// Import hooks
import { useMapData } from "../hooks/useMapData";

// Import utilities
import { createMapIcon } from "../utils/mapIcons";
import {
  calculateDistance,
  calculateWalkTime,
  findClosestShelter,
  getRouteData,
} from "../utils/mapCalculations";
import { handle3DBuildings } from "../utils/map3DBuildings";
import { createMapStyle } from "../utils/mapStyleConfig";
import {
  setupShelterClickHandler,
  setupPoliceStationClickHandler,
  setupHospitalClickHandler,
  addOrUpdateRouteLayer,
} from "../utils/mapEventHandlers";

const MapBoxToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Add icon to library
library.add(faRadiation, faHandcuffs, faRoad, faCube, faLayerGroup, faXmark);

function MapPage() {
  // Use the custom hook for data loading
  const { geoJSONData, policeStations, hospitals, isLoading, error } =
    useMapData();

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

  const [showHospitals, setShowHospitals] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(
    null
  );

  // Function to fetch route data from MapBox API
  const getRoute = useCallback(
    async (
      startLon: number,
      startLat: number,
      endLon: number,
      endLat: number
    ) => {
      const routeGeometry = await getRouteData(
        startLon,
        startLat,
        endLon,
        endLat,
        MapBoxToken
      );
      if (routeGeometry) {
        setRouteData(routeGeometry);
      }
    },
    []
  );

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

        const walkTimeMinutes = calculateWalkTime(distance);
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

  // Setup map event handlers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geoJSONData || !mapLoaded) return;

    try {
      // Load map icons
      Promise.all([
        createMapIcon(map, "biohazard-icon", {
          icon: faRadiation,
          fillColor: "#000000",
          scale: 0.8,
          translateX: 51.2,
          translateY: 51.2,
        }),
        createMapIcon(map, "handcuffs-icon", {
          icon: faHandcuffs,
          fillColor: "#FFFFFF",
        }),
        createMapIcon(map, "hospital-icon", {
          icon: faHospital,
          fillColor: "#FFFFFF",
        }),
      ]).then(() => {
        // Add source and layer after images are loaded
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

        // Add shelter layer if needed
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

        // Setup shelter click handlers
        setupShelterClickHandler(map, "geojson-layer-symbols", {
          onSelect: (point) => setSelectedPoint(point),
          onClearSelections: () => {
            setSelectedPoliceStation(null);
            setSelectedHospital(null);
          },
          userLocation,
          onDistanceCalculated: (distance) => setDistanceToShelter(distance),
          onWalkTimeCalculated: (time) => setWalkTime(time),
          onGetRoute: getRoute,
        });

        // Setup police station click handlers
        setupPoliceStationClickHandler(map, "police-layer-symbols", {
          onSelect: (station) => setSelectedPoliceStation(station),
          onClearSelections: () => {
            setSelectedPoint(null);
            setSelectedHospital(null);
          },
        });

        // Setup hospital click handlers
        setupHospitalClickHandler(map, "hospital-layer-symbols", {
          onSelect: (hospital) => setSelectedHospital(hospital),
          onClearSelections: () => {
            setSelectedPoint(null);
            setSelectedPoliceStation(null);
          },
        });
      });
    } catch (error) {
      console.error("Error setting up map:", error);
    }
  }, [geoJSONData, mapLoaded, userLocation, getRoute]);

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

    // Use the new utility function
    const initialized = addOrUpdateRouteLayer(map, routeData);

    if (initialized) {
      routeInitialized.current = true;
    }

    // Set up a listener for style loading to re-add the route if needed
    const handleStyleData = () => {
      if (routeInitialized.current && !map.getSource("route")) {
        addOrUpdateRouteLayer(map, routeData);
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
  }, [routeData, mapLoaded, is3DMode]);

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

  // Add this function inside MapPage component
  const handleGetRoute = useCallback(
    (lon: number, lat: number) => {
      if (!userLocation) {
        return; // Early return if no user location
      }

      const bounds = new LngLatBounds().extend(userLocation).extend([lon, lat]);

      mapRef.current?.fitBounds(bounds, {
        padding: { top: 200, bottom: 200, left: 200, right: 200 },
        duration: 1200,
      });

      getRoute(userLocation[0], userLocation[1], lon, lat);

      // Clear all selected points when getting directions
      setSelectedPoint(null);
      setSelectedPoliceStation(null);
      setSelectedHospital(null);
    },
    [userLocation, getRoute]
  );

  // Error handling for data loading
  if (error) {
    return (
      <div className="map-error">
        <h2>Error loading map data</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

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
      {isLoading ? (
        <div className="map-loading">Loading map data...</div>
      ) : (
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
          mapStyle={
            createMapStyle({
              geoJSONData,
              policeStations,
              hospitals,
              showPoliceStations,
              showHospitals,
              showRoads,
            }) as maplibregl.StyleSpecification
          }
          onLoad={() => {
            if (mapLoadedRef.current) return;
            console.log("Map loaded");
            setMapLoaded(true);
            mapLoadedRef.current = true;
          }}
          onError={(e) => {
            console.error("Map error:", e);
          }}
        >
          {selectedPoint && (
            <ShelterPopup
              shelter={selectedPoint}
              onClose={() => setSelectedPoint(null)}
              distanceToShelter={distanceToShelter}
              walkTime={walkTime}
            />
          )}

          {selectedPoliceStation && (
            <PoliceStationPopup
              policeStation={selectedPoliceStation}
              onClose={() => setSelectedPoliceStation(null)}
              userLocation={userLocation ?? undefined}
              onGetRoute={handleGetRoute}
            />
          )}

          {selectedHospital && (
            <HospitalPopup
              hospital={selectedHospital}
              onClose={() => setSelectedHospital(null)}
              userLocation={userLocation ?? undefined}
              onGetRoute={handleGetRoute}
            />
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
      )}

      <DistanceInfoCard distanceToShelter={distanceToShelter} />

      <MapLayerToggle
        showControls={showControls}
        toggleControls={() => setShowControls(!showControls)}
      />

      <MapControls
        showControls={showControls}
        showPoliceStations={showPoliceStations}
        setShowPoliceStations={setShowPoliceStations}
        is3DMode={is3DMode}
        setIs3DMode={setIs3DMode}
        showRoads={showRoads}
        setShowRoads={setShowRoads}
        showHospitals={showHospitals}
        setShowHospitals={setShowHospitals}
      />
    </div>
  );
}

export default MapPage;
