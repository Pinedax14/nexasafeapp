import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

/** Cuánto sube el logo para dejar espacio al nombre. */
export const LOGO_SHIFT = 44;
const RING_MS = 1800;

/**
 * Animación del splash: el escudo late, el pin salta y cae, el logo sube, aparece el nombre y
 * dos ondas salen del escudo como una señal de ubicación. Con "Quitar animaciones" de Android
 * activado se muestra directamente el estado final.
 */
export function useSplashAnimation() {
  const shieldScale = useRef(new Animated.Value(1)).current;
  const pinLift = useRef(new Animated.Value(0)).current;
  const logoShift = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textShift = useRef(new Animated.Value(16)).current;
  const rings = useRef([new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    let cancelled = false;
    let running: Animated.CompositeAnimation | null = null;
    const driver = { useNativeDriver: true };

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (cancelled) return;
        if (reduceMotion) {
          logoShift.setValue(-LOGO_SHIFT);
          textOpacity.setValue(1);
          textShift.setValue(0);
          return;
        }

        const intro = Animated.sequence([
          Animated.parallel([
            Animated.sequence([
              Animated.timing(shieldScale, { toValue: 0.9, duration: 160, ...driver }),
              Animated.spring(shieldScale, { toValue: 1, friction: 4, tension: 120, ...driver }),
            ]),
            Animated.sequence([
              Animated.timing(pinLift, {
                toValue: -30,
                duration: 220,
                easing: Easing.out(Easing.quad),
                ...driver,
              }),
              Animated.spring(pinLift, { toValue: 0, friction: 3.5, tension: 140, ...driver }),
            ]),
          ]),
          Animated.parallel([
            Animated.timing(logoShift, {
              toValue: -LOGO_SHIFT,
              duration: 420,
              easing: Easing.out(Easing.cubic),
              ...driver,
            }),
            Animated.timing(textOpacity, { toValue: 1, duration: 420, delay: 120, ...driver }),
            Animated.timing(textShift, {
              toValue: 0,
              duration: 420,
              delay: 120,
              easing: Easing.out(Easing.cubic),
              ...driver,
            }),
          ]),
        ]);

        const pulse = (ring: Animated.Value, delay: number) =>
          Animated.sequence([
            Animated.delay(delay),
            Animated.loop(
              Animated.timing(ring, {
                toValue: 1,
                duration: RING_MS,
                easing: Easing.out(Easing.ease),
                ...driver,
              }),
            ),
          ]);

        running = Animated.parallel([
          intro,
          pulse(rings[0], 350),
          pulse(rings[1], 350 + RING_MS / 2),
        ]);
        running.start();
      });

    return () => {
      cancelled = true;
      running?.stop();
    };
  }, [logoShift, pinLift, rings, shieldScale, textOpacity, textShift]);

  return { shieldScale, pinLift, logoShift, textOpacity, textShift, rings };
}
