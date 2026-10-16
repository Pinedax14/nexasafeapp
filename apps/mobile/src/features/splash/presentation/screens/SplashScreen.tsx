import { StatusBar } from 'expo-status-bar';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { LOGO_RATIO, PinShape, ShieldShape } from '../../../../core/theme/Logo';
import { LOGO_SHIFT, useSplashAnimation } from '../viewModels/useSplashAnimation';
import { useSplashViewModel } from '../viewModels/useSplashViewModel';

type SplashScreenProps = {
  onFinish: () => void;
};

// Mismo tamaño que el logo del splash nativo (app.json: imageWidth 200, el escudo ocupa el 77,5 %),
// para que el paso del splash nativo a esta pantalla no se note.
export const SPLASH_LOGO_WIDTH = 155;
const LOGO_HEIGHT = SPLASH_LOGO_WIDTH * LOGO_RATIO;
const RING_SIZE = 240;

export const SPLASH_TAGLINE = 'Te acompañamos en cada trayecto';

export function SplashScreen({ onFinish }: SplashScreenProps) {
  useSplashViewModel({ onFinish });
  const { shieldScale, pinLift, logoShift, textOpacity, textShift, rings } = useSplashAnimation();

  return (
    <View style={styles.container} testID="splash">
      <StatusBar style="light" />
      <Animated.View style={[styles.stage, { transform: [{ translateY: logoShift }] }]}>
        {rings.map((ring, index) => (
          <Animated.View
            key={index}
            style={[
              styles.ring,
              {
                opacity: ring.interpolate({ inputRange: [0, 0.05, 1], outputRange: [0, 0.35, 0] }),
                transform: [
                  { scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.9] }) },
                ],
              },
            ]}
          />
        ))}
        <Animated.View style={{ transform: [{ scale: shieldScale }] }}>
          <ShieldShape width={SPLASH_LOGO_WIDTH} color={colors.onPrimary} />
          <Animated.View style={[styles.pin, { transform: [{ translateY: pinLift }] }]}>
            <PinShape
              width={SPLASH_LOGO_WIDTH}
              color={colors.primary}
              holeColor={colors.onPrimary}
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>

      <Animated.View
        testID="splash-textos"
        style={[styles.texts, { opacity: textOpacity, transform: [{ translateY: textShift }] }]}
      >
        <Animated.Text style={styles.name} accessibilityRole="header">
          NexaSafe
        </Animated.Text>
        <Animated.Text style={styles.tagline}>{SPLASH_TAGLINE}</Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  stage: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: colors.onPrimary,
  },
  pin: { position: 'absolute', top: 0, left: 0, width: SPLASH_LOGO_WIDTH, height: LOGO_HEIGHT },
  texts: {
    position: 'absolute',
    top: '50%',
    marginTop: LOGO_HEIGHT / 2 - LOGO_SHIFT + 24,
    alignItems: 'center',
  },
  name: { color: colors.onPrimary, fontSize: 34, fontWeight: '800', letterSpacing: 0.5 },
  tagline: { color: colors.onPrimary, opacity: 0.85, fontSize: 15, marginTop: 6 },
});
