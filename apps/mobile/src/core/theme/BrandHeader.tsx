import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from './colors';
import { PinShape, ShieldShape } from './Logo';
import { fonts, TOP_INSET } from './typography';

type BrandHeaderProps = { title: string; subtitle?: string };

/** Encabezado morado con el logo para las pantallas de ingreso. */
export function BrandHeader({ title, subtitle }: BrandHeaderProps) {
  return (
    <LinearGradient
      colors={['#8B5CF6', colors.primary, colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.halo} />
      <View>
        <ShieldShape width={64} color={colors.onPrimary} />
        <View style={styles.pin}>
          <PinShape width={64} color={colors.primary} holeColor={colors.onPrimary} />
        </View>
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: TOP_INSET + 40,
    paddingBottom: 56,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  halo: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.onPrimary,
    opacity: 0.08,
  },
  pin: { position: 'absolute', top: 0, left: 0 },
  title: {
    ...fonts.extrabold,
    marginTop: 14,
    fontSize: 28,
    letterSpacing: -0.3,
    color: colors.onPrimary,
  },
  subtitle: {
    ...fonts.regular,
    marginTop: 6,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    color: colors.onPrimary,
    opacity: 0.9,
  },
});
