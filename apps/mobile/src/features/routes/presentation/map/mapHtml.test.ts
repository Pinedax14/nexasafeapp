import { buildMapHtml, TILE_URL } from './mapHtml';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildBundle, readGenerated } = require('../../../../../scripts/generar-leaflet');

describe('Mapa de la ruta (D9)', () => {
  it('Leaflet empaquetado coincide con la versión instalada (npm run map:leaflet)', () => {
    expect(readGenerated()).toBe(buildBundle());
  });

  it('la página no carga scripts ni estilos de un CDN', () => {
    const html = buildMapHtml();
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toMatch(/<link[^>]+href=/);
    expect(html).toContain("default-src 'none'");
  });

  it('usa las teselas de OpenStreetMap con su atribución', () => {
    const html = buildMapHtml();
    expect(html).toContain(TILE_URL);
    expect(html).toContain('OpenStreetMap');
  });

  it('el código de Leaflet no cierra la etiqueta script antes de tiempo', () => {
    const html = buildMapHtml();
    expect(html.match(/<\/script>/g)).toHaveLength(2);
  });
});
