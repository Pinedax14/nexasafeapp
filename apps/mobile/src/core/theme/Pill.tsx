import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconName } from './Button';
import { colors } from './colors';
import { fonts, TOUCH_TARGET } from './typography';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const TONES: Record<Tone, { background: string; text: string }> = {
  neutral: { background: '#F1EFF8', text: colors.textMuted },
  primary: { background: colors.primarySoft, text: colors.primaryDark },
  success: { background: colors.successBackground, text: colors.success },
  warning: { background: colors.warningSoft, text: colors.warning },
  danger: { background: colors.errorSoft, text: colors.error },
};

/** Etiqueta de estado, por ejemplo "Activo" o "Pendiente de validación". */
export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const palette = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.background }]}>
      <Text style={[styles.pillText, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

type ActionChipProps = {
  label: string;
  icon: IconName;
  onPress: () => void;
  accessibilityLabel?: string;
  tone?: Tone;
};

/** Acción secundaria con ícono dentro de una tarjeta ("Rutas", "Red", "PIN"). */
export function ActionChip({
  label,
  icon,
  onPress,
  accessibilityLabel,
  tone = 'primary',
}: ActionChipProps) {
  const palette = TONES[tone];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: palette.background },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={18} color={palette.text} />
      <Text style={[styles.chipText, { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

/** Círculo con las iniciales de una persona. */
export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
  return (
    <View
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 4,
  },
  pillText: { ...fonts.semibold, fontSize: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: TOUCH_TARGET - 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  chipText: { ...fonts.semibold, fontSize: 14 },
  pressed: { opacity: 0.8 },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  avatarText: { ...fonts.bold, color: colors.primaryDark },
});
