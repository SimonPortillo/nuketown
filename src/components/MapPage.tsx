import { useEffect, useState, useRef } from "react";
import { Map, NavigationControl, GeolocateControl, FullscreenControl, Popup, ScaleControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createClient } from "@supabase/supabase-js";
import proj4 from 'proj4';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import type { Map as MaplibreMap } from 'maplibre-gl';

const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_REACT_APP_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define coordinate systems
proj4.defs("EPSG:25833", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
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
  const { data, error } = await supabase
    .rpc('get_shelters_geojson_with_info');

  if (error) {
    console.error("Error fetching data:", error);
    return null;
  }

  // Convert data to GeoJSON format with coordinate transformation
  const geoJSON = {
    type: "FeatureCollection",
    features: (data as ShelterData[]).map((item) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: transformCoordinates([
          item.geom.coordinates[0],
          item.geom.coordinates[1]
        ])
      },
      properties: { 
        id: item.shelter_id,
        address: item.adresse,
        capacity: item.plasser
      }
    }))
  };

  return geoJSON;
};

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
      if (!map.getSource('geojson-source')) {
        map.addSource('geojson-source', {
          type: 'geojson',
          data: geoJSONData
        });
      } else {
        (map.getSource('geojson-source') as maplibregl.GeoJSONSource).setData(geoJSONData);
      }

      // Add event listeners
      map.on('click', 'geojson-layer', (e: { features?: MapGeoJSONFeature[] }) => {
        if (e.features?.[0]) {
          const feature = e.features[0];
          const coords = (feature.geometry as { type: 'Point', coordinates: [number, number] }).coordinates;
          setSelectedPoint({
            longitude: coords[0],
            latitude: coords[1],
            address: feature.properties?.address as string,
            capacity: feature.properties?.capacity as number
          });
        }
      });

      map.on('mouseenter', 'geojson-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'geojson-layer', () => {
        map.getCanvas().style.cursor = '';
      });

    } catch (error) {
      console.error('Error setting up map:', error);
    }
  }, [geoJSONData, mapLoaded]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Map
        ref={(ref) => {
          mapRef.current = ref?.getMap() ?? null;
        }}
        initialViewState={{
          longitude: 10.7522, // Adjusted to center of Norway
          latitude: 59.9139,
          zoom: 5
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={{
          version: 8,
          sources: {
            'openstreetmap': {
              type: 'raster',
              tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '&copy; openstreetmap'
            },
            'roads-wms': {
              type: 'raster',
              tiles: [
                'https://wms.geonorge.no/skwms1/wms.vegnett2?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&TRANSPARENT=true&LAYERS=Vegnett2&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&STYLES=&BBOX={bbox-epsg-3857}'
              ],
              tileSize: 256,
              attribution: '&copy; Geonorge - Norwegian Road Network'
            },
            'dsb-wms': {
              type: 'raster',
              tiles: [
                'https://ogc.dsb.no/wms.ashx?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&TRANSPARENT=true&LAYERS=layer_340&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&STYLES=&BBOX={bbox-epsg-3857}'
              ],
              tileSize: 256,
              attribution: '&copy; Norwegian Directorate for Civil Protection (DSB)'
            },
            'geojson-source': {
              type: 'geojson',
              data: geoJSONData || { type: 'FeatureCollection', features: [] }
            }
          },
          layers: [
            {
              id: 'openstreetmap-layer',
              type: 'raster',
              source: 'openstreetmap',
              minzoom: 0,
              maxzoom: 20
            },
            {
              id: 'roads-layer',
              type: 'raster',
              source: 'roads-wms',
              paint: {
                'raster-opacity': 1
              }
            },
            {
              id: 'dsb-layer',
              type: 'raster',
              source: 'dsb-wms',
              paint: {
                'raster-opacity': 0 // blir bare brukt for å sjekke om punkter samsvaret mellom datasettene, sett til 1 for å se tilfluktsrom
              }
            },
            {
              id: 'geojson-layer-heat',
              type: 'circle',
              source: 'geojson-source',
              paint: {
                'circle-radius': [
                  'interpolate',
                  ['exponential', 1.75],
                  ['zoom'],
                  5, 20,
                  10, 40,
                  15, 60
                ],
                'circle-color': '#FF0000',
                'circle-opacity': 0.15,
                'circle-blur': 1
              }
            },
            {
              id: 'geojson-layer-glow',
              type: 'circle',
              source: 'geojson-source',
              paint: {
                'circle-radius': [
                  'interpolate',
                  ['exponential', 1.75],
                  ['zoom'],
                  5, 15,
                  10, 30,
                  15, 45
                ],
                'circle-color': '#FF4444',
                'circle-opacity': 0.3,
                'circle-blur': 0.8
              }
            },
            {
              id: 'geojson-layer',
              type: 'circle',
              source: 'geojson-source',
              paint: {
                'circle-radius': [
                  'interpolate',
                  ['exponential', 1.75],
                  ['zoom'],
                  5, 6,
                  10, 8 ,
                  15, 8
                ],
                'circle-color': '#FF0000',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#FFFFFF',
                'circle-opacity': 1
              }
            }
          ]
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
            <div style={{ padding: '10px' }}>
              <h3>Tilfluktsrom informasjon</h3>
              <p><strong>Addresse:</strong> {selectedPoint.address}</p>
              <p><strong>Kapasitet:</strong> {selectedPoint.capacity} plasser</p>
            </div>
          </Popup>
        )}
        <FullscreenControl />
        <GeolocateControl />
        <NavigationControl />
        <ScaleControl />
      </Map>
    </div>
  );
}

export default MapPage;