import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { Trip } from '../../domain/entities/Trip';

export const ACCOMPANIMENT_TEXT = '🛡 Te estamos acompañando';
export const DISCREET_INDICATOR = '🛡';

type AccompanimentBannerProps = {
  trip: Trip | null;
  /** E6-04 (RNF-16): durante una alerta solo queda el escudo pequeño. */
  discreet?: boolean;
};

/**
 * E4-04 (RF-15, RF-41): banda fija que el menor ve siempre que tiene un trayecto
 * EN_CURSO, es decir, mientras se comparte su ubicación. Sin trayecto no se muestra.
 * En el modo discreto de una alerta se reduce a un escudo sin texto (E6-04, RNF-16).
 */
export function AccompanimentBanner({ trip, discreet = false }: AccompanimentBannerProps) {
  if (discreet) {
    return (
      <View style={styles.discreet} accessibilityLabel="Acompañamiento activo">
        <Text style={styles.discreetText}>{DISCREET_INDICATOR}</Text>
      </View>
    );
  }
  if (trip?.status !== 'EN_CURSO') return null;
  return (
    <View
      style={styles.banner}
      accessibilityRole="alert"
      accessibilityLabel="Trayecto acompañado en curso"
    >
      <Text style={styles.text}>{ACCOMPANIMENT_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  discreet: { paddingVertical: 4, paddingHorizontal: 16, alignItems: 'flex-start' },
  discreetText: { fontSize: 14 },
});
