import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { colors } from '../../../../core/theme/colors';
import { GeoPoint } from '../../domain/entities/Route';
import { buildMapHtml, OSM_COPYRIGHT_URL } from './mapHtml';

/**
 * Origen de la página del mapa. OpenStreetMap pide identificar la app que usa
 * sus teselas, y el WebView envía este origen como Referer.
 */
export const MAP_BASE_URL = 'https://github.com/Pinedax14/nexasafeapp/';

export const MAP_WEB_FALLBACK = 'El mapa solo funciona en la app de Android.';

type RouteMapProps = {
  points: GeoPoint[];
  corridorMeters: number;
  editable: boolean;
  onAddPoint?: (point: GeoPoint) => void;
};

type MapMessage = { type?: unknown; latitude?: unknown; longitude?: unknown };

function parseMessage(data: string): MapMessage | null {
  try {
    const message: unknown = JSON.parse(data);
    return typeof message === 'object' && message !== null ? (message as MapMessage) : null;
  } catch {
    return null;
  }
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** D9: OpenStreetMap con Leaflet dentro de un WebView. */
export function RouteMap({ points, corridorMeters, editable, onAddPoint }: RouteMapProps) {
  const webView = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const html = useMemo(buildMapHtml, []);

  useEffect(() => {
    if (!isReady) return;
    const state = JSON.stringify({ points, corridorMeters, editable });
    webView.current?.injectJavaScript?.(`window.nexaRender(${state}); true;`);
  }, [isReady, points, corridorMeters, editable]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseMessage(event.nativeEvent.data);
      if (message?.type === 'ready') {
        setIsReady(true);
      } else if (
        message?.type === 'tap' &&
        isFiniteNumber(message.latitude) &&
        isFiniteNumber(message.longitude)
      ) {
        onAddPoint?.({ latitude: message.latitude, longitude: message.longitude });
      }
    },
    [onAddPoint],
  );

  // La página no navega a ningún lado; el enlace de atribución se abre en el navegador.
  const handleNavigation = useCallback(({ url }: { url: string }) => {
    if (url === MAP_BASE_URL || url === 'about:blank') return true;
    if (url.startsWith(OSM_COPYRIGHT_URL)) Linking.openURL(OSM_COPYRIGHT_URL);
    return false;
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.map, styles.fallback]}>
        <Text style={styles.fallbackText}>{MAP_WEB_FALLBACK}</Text>
      </View>
    );
  }

  return (
    <View style={styles.map}>
      <WebView
        ref={webView}
        testID="mapa-ruta"
        source={{ html, baseUrl: MAP_BASE_URL }}
        originWhitelist={['https://*']}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleNavigation}
        setSupportMultipleWindows={false}
        nestedScrollEnabled
        allowFileAccess={false}
        domStorageEnabled={false}
        javaScriptEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 320,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fallback: { justifyContent: 'center', alignItems: 'center', padding: 16 },
  fallbackText: { color: colors.textMuted, textAlign: 'center' },
});
