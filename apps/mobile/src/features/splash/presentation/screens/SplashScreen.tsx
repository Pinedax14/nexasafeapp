import { ImageBackground, StyleSheet } from 'react-native';
import { useSplashViewModel } from '../viewModels/useSplashViewModel';

type SplashScreenProps = {
  onFinish: () => void;
};

export function SplashScreen({ onFinish }: SplashScreenProps) {
  useSplashViewModel({ onFinish });

  return (
    <ImageBackground
      source={require('../../../../../assets/images/splash-icon.png')}
      style={styles.container}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF9'
  }
});