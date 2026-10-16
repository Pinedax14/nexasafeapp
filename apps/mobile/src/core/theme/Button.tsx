import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from './colors';
import { fonts, shadow } from './typography';

export type IconName = ComponentProps<typeof Ionicons>['name'];
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link';
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

const PALETTE: Record<Variant, { background: string; text: string; border: string }> = {
  primary: { background: colors.primary, text: colors.onPrimary, border: colors.primary },
  secondary: { background: colors.surface, text: colors.primary, border: colors.borderStrong },
  ghost: { background: 'transparent', text: colors.primary, border: 'transparent' },
  danger: { background: colors.error, text: colors.onPrimary, border: colors.error },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  testID,
  style,
}: ButtonProps) {
  const palette = PALETTE[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive, busy: loading }}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.background, borderColor: palette.border },
        (variant === 'primary' || variant === 'danger') && shadow(4),
        pressed && styles.pressed,
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color={palette.text} />}
          <Text style={[styles.text, { color: palette.text }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 20,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  inactive: { opacity: 0.6 },
  text: { ...fonts.semibold, fontSize: 16 },
});
