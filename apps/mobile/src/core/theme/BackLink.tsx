import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from './colors';
import { fonts, TOUCH_TARGET } from './typography';

/** Enlace para volver a la pantalla anterior, con flecha. */
export function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
    >
      <Ionicons name="chevron-back" size={20} color={colors.primary} />
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    minHeight: TOUCH_TARGET,
    marginBottom: 4,
    marginLeft: -4,
  },
  pressed: { opacity: 0.6 },
  text: { ...fonts.semibold, fontSize: 15, color: colors.primary },
});
