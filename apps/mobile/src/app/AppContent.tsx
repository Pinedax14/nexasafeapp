import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../core/api/supabaseClient';
import { colors } from '../core/theme/colors';
import { SupabaseAuthRepository } from '../features/auth/data/repositories/SupabaseAuthRepository';
import { User } from '../features/auth/domain/entities/User';
import { AuthenticateUser } from '../features/auth/domain/useCases/AuthenticateUser';
import { RegisterGuardian } from '../features/auth/domain/useCases/RegisterGuardian';
import { RestoreSession } from '../features/auth/domain/useCases/RestoreSession';
import { SignOut } from '../features/auth/domain/useCases/SignOut';
import { AuthScreen } from '../features/auth/presentation/screens/AuthScreen';
import { RegisterScreen } from '../features/auth/presentation/screens/RegisterScreen';
import { SplashScreen } from '../features/splash/presentation/screens/SplashScreen';

type AuthRoute = 'login' | 'register';

export function AppContent() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  const [authRoute, setAuthRoute] = useState<AuthRoute>('login');
  const [loggedUser, setLoggedUser] = useState<User | null>(null);

  // Raíz de composición: la única parte de la app que conoce la capa data.
  const useCases = useMemo(() => {
    const repository = new SupabaseAuthRepository(supabase.auth);
    return {
      authenticateUser: new AuthenticateUser(repository),
      registerGuardian: new RegisterGuardian(repository),
      restoreSession: new RestoreSession(repository),
      signOut: new SignOut(repository),
    };
  }, []);

  // E1-05: al abrir la app se recupera la sesión cifrada; si luego vence o se
  // revoca (refresh token rotativo), la app vuelve a la pantalla de ingreso.
  useEffect(() => {
    let isMounted = true;
    useCases.restoreSession.execute().then((user) => {
      if (!isMounted) return;
      setLoggedUser(user);
      setIsSessionRestored(true);
    });
    const stopObserving = useCases.restoreSession.observe((user) => {
      if (isMounted) setLoggedUser(user);
    });
    return () => {
      isMounted = false;
      stopObserving();
    };
  }, [useCases]);

  const handleSplashFinish = useCallback(() => setIsSplashVisible(false), []);
  const handleSignedIn = useCallback((user: User) => setLoggedUser(user), []);
  const goToLogin = useCallback(() => setAuthRoute('login'), []);
  const goToRegister = useCallback(() => setAuthRoute('register'), []);

  const handleSignOut = useCallback(async () => {
    await useCases.signOut.execute();
    setLoggedUser(null);
    setAuthRoute('login');
  }, [useCases]);

  if (isSplashVisible || !isSessionRestored) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (!loggedUser) {
    return authRoute === 'register' ? (
      <RegisterScreen
        registerGuardian={useCases.registerGuardian}
        onSignedIn={handleSignedIn}
        onGoToLogin={goToLogin}
      />
    ) : (
      <AuthScreen
        authenticateUser={useCases.authenticateUser}
        onLoginSuccess={handleSignedIn}
        onGoToRegister={goToRegister}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hola, {loggedUser.name}</Text>
      <Text style={styles.message}>Sesión iniciada.</Text>
      <Pressable style={styles.button} onPress={handleSignOut} accessibilityRole="button">
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: colors.text },
  message: { fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  button: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
