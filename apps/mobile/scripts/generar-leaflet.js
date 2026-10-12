// D9: Leaflet va empaquetado dentro de la app; el mapa no lo descarga de un CDN.
// Este script copia el JS y el CSS de node_modules/leaflet a un módulo de
// TypeScript. Uso: `npm run map:leaflet` (genera) o `npm run map:leaflet -- --check`.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LEAFLET_DIR = path.join(ROOT, 'node_modules', 'leaflet');
const OUTPUT = path.join(
  ROOT,
  'src',
  'features',
  'routes',
  'presentation',
  'map',
  'leafletBundle.generated.ts',
);

// Evita que el código cierre la etiqueta <script> del HTML del mapa.
const asLiteral = (text) => JSON.stringify(text).replace(/<\//g, '<\\/');

function buildBundle() {
  const { version } = JSON.parse(fs.readFileSync(path.join(LEAFLET_DIR, 'package.json'), 'utf8'));
  const js = fs.readFileSync(path.join(LEAFLET_DIR, 'dist', 'leaflet.js'), 'utf8');
  const css = fs.readFileSync(path.join(LEAFLET_DIR, 'dist', 'leaflet.css'), 'utf8');
  return [
    '// Archivo generado por scripts/generar-leaflet.js a partir de leaflet (BSD-2-Clause).',
    '// No se edita a mano: se regenera con `npm run map:leaflet`.',
    `export const LEAFLET_VERSION = ${asLiteral(version)};`,
    `export const LEAFLET_JS = ${asLiteral(js)};`,
    `export const LEAFLET_CSS = ${asLiteral(css)};`,
    '',
  ].join('\n');
}

// Git en Windows puede convertir los saltos de línea a CRLF.
function readGenerated() {
  return fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8').replace(/\r\n/g, '\n') : '';
}

if (require.main === module) {
  const bundle = buildBundle();
  if (process.argv.includes('--check')) {
    if (readGenerated() !== bundle) {
      process.stderr.write('leafletBundle.generated.ts no coincide con node_modules/leaflet.\n');
      process.exit(1);
    }
  } else {
    fs.writeFileSync(OUTPUT, bundle);
  }
}

module.exports = { buildBundle, readGenerated };
