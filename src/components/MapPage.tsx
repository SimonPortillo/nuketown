import { useEffect, useState, useRef } from "react";
import {
  Map,
  NavigationControl,
  GeolocateControl,
  FullscreenControl,
  Popup,
  ScaleControl,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { createClient } from "@supabase/supabase-js";
import proj4 from "proj4";
import type { MapGeoJSONFeature } from "maplibre-gl";
import type { Map as MaplibreMap } from "maplibre-gl";
import { faRadiation } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";

const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_REACT_APP_SUPABASE_KEY;

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

interface ShelterData {
  shelter_id: number;
  geom: {
    type: string;
    coordinates: number[];
  };
  adresse: string;
  plasser: number;
}

const fetchGeoJSONData = async () => {
  const { data, error } = await supabase.rpc("get_shelters_geojson_with_info");

  if (error) {
    console.error("Error fetching data:", error);
    return null;
  }

  // Add random offset to each point for pulsing animation
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
      },
    })),
  };

  return geoJSON;
};

// Add icon to library
library.add(faRadiation);

function MapPage() {
  const [geoJSONData, setGeoJSONData] = useState<any | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<{
    longitude: number;
    latitude: number;
    address: string;
    capacity: number;
  } | null>(null);
  const geolocateRef = useRef<maplibregl.GeolocateControl | undefined>(
    undefined
  );

  // Fetch data effect
  useEffect(() => {
    const getData = async () => {
      const data = await fetchGeoJSONData();
      setGeoJSONData(data);
    };
    getData();
  }, []);

  // Map setup effect
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geoJSONData || !mapLoaded) return;

    try {
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

        // Add event listeners after layer is created
        map.on(
          "click",
          "geojson-layer-symbols",
          (e: { features?: MapGeoJSONFeature[] }) => {
            if (e.features?.[0]) {
              const feature = e.features[0];
              const coords = (
                feature.geometry as {
                  type: "Point";
                  coordinates: [number, number];
                }
              ).coordinates;
              setSelectedPoint({
                longitude: coords[0],
                latitude: coords[1],
                address: feature.properties?.address as string,
                capacity: feature.properties?.capacity as number,
              });
            }
          }
        );

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
    } catch (error) {
      console.error("Error setting up map:", error);
    }
  }, [geoJSONData, mapLoaded]);

  // Add effect to trigger geolocation
  useEffect(() => {
    if (mapLoaded && geolocateRef.current) {
      // Small delay to ensure map is fully ready
      setTimeout(() => {
        geolocateRef.current?.trigger();
      }, 1000);
    }
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
              attribution: "&copy; Geonorge - Norwegian Road Network",
            },
            "dsb-wms": {
              type: "raster",
              tiles: [
                "https://ogc.dsb.no/wms.ashx?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&TRANSPARENT=true&LAYERS=layer_340&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&STYLES=&BBOX={bbox-epsg-3857}",
              ],
              tileSize: 256,
              attribution:
                "&copy; Norwegian Directorate for Civil Protection (DSB)",
            },
            "geojson-source": {
              type: "geojson",
              data: geoJSONData || { type: "FeatureCollection", features: [] },
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
                "raster-opacity": 1,
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
          ],
        }}
        onLoad={() => {
          console.log("Map loaded");
          setMapLoaded(true);
        }}
        onError={(e) => {
          console.error("Map error:", e);
        }}
      >
        {selectedPoint && (
          <Popup
            longitude={selectedPoint.longitude}
            latitude={selectedPoint.latitude}
            anchor="bottom"
            onClose={() => setSelectedPoint(null)}
          >
            <div style={{ padding: "10px" }}>
              <h3>
                <strong>{selectedPoint.address}</strong>
              </h3>
              <p>
                <strong>Kapasitet:</strong> {selectedPoint.capacity} plasser
              </p>
              <h3>
                <strong>Koordinater:</strong>
              </h3>
              <p>
                <strong>Latitude:</strong> {selectedPoint.latitude}
              </p>
              <p>
                <strong>Longitude:</strong> {selectedPoint.longitude}
              </p>
            </div>
          </Popup>
        )}
        <FullscreenControl />
        <GeolocateControl
          ref={geolocateRef as any}
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
          showUserLocation={true}
        />
        <NavigationControl />
        <ScaleControl />
      </Map>
    </div>
  );
}

export default MapPage;
