import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { fonts, shadow } from '../../../../core/theme/typography';
import { HOLD_TO_TRIGGER_MS } from '../../domain/useCases/PanicAlerts';
import { PANIC_HINT, PANIC_LABEL } from '../alertMessages';

type PanicButtonProps = {
  onTrigger: () => void;
  disabled?: boolean;
};

const SIZE = 184;

/**
 * W9 · Botón de pánico (E6-01, RF-20, RNF-14): se dispara al mantenerlo presionado 3 s;
 * si se suelta antes no pasa nada. El rojo oscuro sube desde abajo mientras se mantiene.
 */
export function PanicButton({ onTrigger, disabled = false }: PanicButtonProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const release = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    progress.stopAnimation();
    progress.setValue(0);
  };

  const press = () => {
    release();
    Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_TO_TRIGGER_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    timer.current = setTimeout(() => {
      timer.current = null;
      onTrigger();
    }, HOLD_TO_TRIGGER_MS);
  };

  // Al desmontar no queda un disparo pendiente.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const height = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={local.container}>
      <View style={local.haloOuter}>
        <View style={local.haloInner}>
          <Pressable
            style={[local.button, disabled && local.disabled]}
            onPressIn={press}
            onPressOut={release}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="Botón de ayuda"
            accessibilityHint={PANIC_HINT}
          >
            <Animated.View style={[local.fill, { height }]} />
            <Text style={local.label}>{PANIC_LABEL}</Text>
          </Pressable>
        </View>
      </View>
      <Text style={local.hint}>{PANIC_HINT}</Text>
    </View>
  );
}

const local = StyleSheet.create({
  container: { alignItems: 'center', marginTop: 28, marginBottom: 12 },
  haloOuter: {
    padding: 14,
    borderRadius: SIZE,
    backgroundColor: colors.errorSoft,
  },
  haloInner: {
    padding: 10,
    borderRadius: SIZE,
    backgroundColor: '#FDE2E2',
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...shadow(8),
    shadowColor: colors.error,
  },
  disabled: { opacity: 0.5 },
  fill: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.errorDark },
  label: { ...fonts.extrabold, color: colors.onPrimary, fontSize: 34, letterSpacing: 1 },
  hint: { ...fonts.medium, color: colors.textMuted, marginTop: 14, fontSize: 15 },
});
