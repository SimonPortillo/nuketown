import {Map, NavigationControl, GeolocateControl, FullscreenControl} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

function MapPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Map
        initialViewState={{
          longitude: 17.888237,
          latitude: 64.5783089,
          zoom: 4.5
        }}
        style={{width: '100%', height: '100%'}}
        mapStyle={{
          version: 8,
          sources: {
            'openstreetmap': {
              type: 'raster',
              tiles: ['https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'],
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
                'raster-opacity': 1
              }
            }
          ]
        }}
      >
        <FullscreenControl />
        <GeolocateControl />
        <NavigationControl />
      </Map>
    </div>
  );
}

export default MapPage;