import { colors } from '../../../../core/theme/colors';
import { LEAFLET_CSS, LEAFLET_JS } from './leafletBundle.generated';

/** D9: teselas de OpenStreetMap, sin cuenta ni llave. */
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';
/** Bogotá, mientras la ruta no tenga puntos. */
const DEFAULT_CENTER = [4.65, -74.08];

// La página solo puede cargar teselas de OpenStreetMap; no hay otras conexiones.
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  'img-src https://tile.openstreetmap.org data:',
  "style-src 'unsafe-inline'",
  "script-src 'unsafe-inline'",
].join('; ');

const MAP_SCRIPT = `
(function () {
  var send = function (message) { window.ReactNativeWebView.postMessage(JSON.stringify(message)); };
  var map = L.map('map').setView(${JSON.stringify(DEFAULT_CENTER)}, 13);
  map.attributionControl.setPrefix(false);
  L.tileLayer(${JSON.stringify(TILE_URL)}, {
    maxZoom: 19,
    attribution: '&copy; <a href="${OSM_COPYRIGHT_URL}">OpenStreetMap</a>'
  }).addTo(map);

  var state = { points: [], corridorMeters: 50, editable: false };
  var corridor = L.polyline([], { color: '${colors.primary}', opacity: 0.25, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(map);
  var line = L.polyline([], { color: '${colors.primary}', weight: 4, interactive: false }).addTo(map);
  var markers = L.layerGroup().addTo(map);
  var centered = false;

  // El corredor se dibuja con el ancho en metros convertido a píxeles del zoom actual.
  function metersToPixels(meters) {
    var latitude = map.getCenter().lat * Math.PI / 180;
    var metersPerPixel = 40075016.686 * Math.abs(Math.cos(latitude)) / Math.pow(2, map.getZoom() + 8);
    return Math.max(2, (2 * meters) / metersPerPixel);
  }

  function draw() {
    var latLngs = state.points.map(function (p) { return [p.latitude, p.longitude]; });
    line.setLatLngs(latLngs);
    corridor.setLatLngs(latLngs);
    corridor.setStyle({ weight: metersToPixels(state.corridorMeters) });
    markers.clearLayers();
    latLngs.forEach(function (latLng, index) {
      L.circleMarker(latLng, {
        radius: 6, color: '${colors.primary}', weight: 2, fillOpacity: 1,
        fillColor: index === 0 ? '${colors.onPrimary}' : '${colors.primary}', interactive: false
      }).addTo(markers);
    });
    if (!centered && latLngs.length >= 2) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [24, 24] });
      centered = true;
    }
  }

  window.nexaRender = function (next) { state = next; draw(); };
  map.on('zoomend', draw);
  map.on('click', function (event) {
    if (state.editable) send({ type: 'tap', latitude: event.latlng.lat, longitude: event.latlng.lng });
  });
  send({ type: 'ready' });
})();
`;

/** Página del mapa con Leaflet empaquetado (sin CDN) y la lógica de dibujo. */
export function buildMapHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">
<style>${LEAFLET_CSS}</style>
<style>html, body, #map { height: 100%; margin: 0; }</style>
</head>
<body>
<div id="map"></div>
<script>${LEAFLET_JS}</script>
<script>${MAP_SCRIPT}</script>
</body>
</html>`;
}
