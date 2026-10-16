import { Platform, StatusBar, ViewStyle } from 'react-native';
import { colors } from './colors';

// Inter va incrustada en el APK con el plugin expo-font (app.json) y se carga con useFonts en la web.
// En Android una fuente propia no se combina con fontWeight: cada peso es su propia familia.
export const fonts = {
  regular: { fontFamily: 'Inter_400Regular' },
  medium: { fontFamily: 'Inter_500Medium' },
  semibold: { fontFamily: 'Inter_600SemiBold' },
  bold: { fontFamily: 'Inter_700Bold' },
  extrabold: { fontFamily: 'Inter_800ExtraBold' },
} as const;

/** Sombra suave para tarjetas y botones. */
export const shadow = (elevation = 3): ViewStyle =>
  Platform.select<ViewStyle>({
    android: { elevation, shadowColor: colors.primaryDark },
    default: {
      shadowColor: colors.primaryDark,
      shadowOpacity: 0.08 + elevation * 0.01,
      shadowRadius: elevation * 3,
      shadowOffset: { width: 0, height: elevation },
    },
  });

/** Área táctil mínima recomendada por Android. */
export const TOUCH_TARGET = 48;

/** Alto de la barra de estado: con edge-to-edge (app.json) la app se dibuja debajo de ella. */
export const TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
