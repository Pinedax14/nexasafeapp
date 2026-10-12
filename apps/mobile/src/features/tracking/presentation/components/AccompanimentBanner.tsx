import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { Trip } from '../../domain/entities/Trip';

export const ACCOMPANIMENT_TEXT = '🛡 Te estamos acompañando';

type AccompanimentBannerProps = {
  trip: Trip | null;
};

/**
 * E4-04 (RF-15, RF-41): banda fija que el menor ve siempre que tiene un trayecto
 * EN_CURSO, es decir, mientras se comparte su ubicación. Sin trayecto no se muestra.
 */
export function AccompanimentBanner({ trip }: AccompanimentBannerProps) {
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
});
