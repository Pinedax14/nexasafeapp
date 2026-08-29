import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { User } from '../features/auth/domain/entities/User';
import { AuthScreen } from '../features/auth/presentation/screens/AuthScreen';
import { SplashScreen } from '../features/splash/presentation/screens/SplashScreen';

export function AppContent() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [loggedUser, setLoggedUser] = useState<User | null>(null);

  const handleSplashFinish = useCallback(() => {
    setIsSplashVisible(false);
  }, []);

  const handleLoginSuccess = useCallback((user: User) => {
    setLoggedUser(user);
  }, []);

  if (isSplashVisible) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (!loggedUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hola, {loggedUser.name}</Text>
      <Text style={styles.message}>
        En el siguiente taller mostraremos el catálogo.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFDF9',
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#3A2E2B' },
  message: { fontSize: 16, color: '#3A2E2B', textAlign: 'center' },
});