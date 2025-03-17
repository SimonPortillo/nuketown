import type { Map as MaplibreMap, FillExtrusionLayerSpecification } from "maplibre-gl";

/**
 * Handles the 3D building layer on the map
 * @param map The MapLibre map instance
 * @param show Whether to show or hide 3D buildings
 * @param options Configuration options for 3D buildings
 */
export const handle3DBuildings = (
  map: MaplibreMap, 
  show: boolean,
  options: {
    sourceUrl?: string;
    buildingColors?: [number, string][];
    animationDuration?: number;
    pitch?: number;
    bearing?: number;
  } = {}
) => {
  if (!map) return;

  const {
    sourceUrl = "https://api.maptiler.com/tiles/v3/tiles.json?key=eE87Cs6ofbIAP2G5mFFy",
    buildingColors = [[0, "#141414"], [50, "#0d0900"], [400, "lightblue"]],
    animationDuration = 1000,
    pitch = 45,
    bearing = -17.6
  } = options;

  // Check if we need to add the source
  if (show && !map.getSource("openmaptiles")) {
    map.addSource("openmaptiles", {
      url: sourceUrl,
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

    // Create colors interpolation array for the extrusion color
    const colorStops = buildingColors.flatMap(([height, color]) => [height, color]);

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
          ...colorStops
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
      pitch,
      bearing,
      duration: animationDuration,
    });
  } else {
    map.easeTo({
      pitch: 0,
      bearing: 0,
      duration: animationDuration,
    });
  }
};
