import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { User } from '../../domain/entities/User';
import { AuthenticateUser } from '../../domain/useCases/AuthenticateUser';
import { useAuthViewModel } from '../viewModels/useAuthViewModel';

type AuthScreenProps = {
  authenticateUser: AuthenticateUser;
  onLoginSuccess: (user: User) => void;
  onGoToRegister: () => void;
  onGoToPinLogin: () => void;
};

export function AuthScreen({
  authenticateUser,
  onLoginSuccess,
  onGoToRegister,
  onGoToPinLogin,
}: AuthScreenProps) {
  const vm = useAuthViewModel({ authenticateUser, onLoginSuccess });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NexaSafe</Text>
      <Text style={styles.subtitle}>Inicia sesión para acompañar a tus menores</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo"
        accessibilityLabel="Correo"
        value={vm.email}
        onChangeText={vm.updateEmail}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        editable={!vm.isLoading}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        accessibilityLabel="Contraseña"
        value={vm.password}
        onChangeText={vm.updatePassword}
        autoComplete="current-password"
        secureTextEntry
        editable={!vm.isLoading}
      />

      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}

      <Pressable
        style={[styles.button, vm.isLoading && styles.buttonDisabled]}
        onPress={vm.login}
        disabled={vm.isLoading}
        accessibilityRole="button"
      >
        {vm.isLoading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.buttonText}>Ingresar</Text>
        )}
      </Pressable>

      <Pressable
        onPress={onGoToRegister}
        disabled={vm.isLoading}
        accessibilityRole="link"
        style={styles.link}
      >
        <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
      </Pressable>

      <Pressable
        onPress={onGoToPinLogin}
        disabled={vm.isLoading}
        accessibilityRole="link"
        style={styles.link}
      >
        <Text style={styles.linkText}>Soy menor: entrar con documento y PIN</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  title: { fontSize: 30, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 8, marginBottom: 24, fontSize: 16, color: colors.textMuted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  error: { color: colors.error, marginBottom: 12 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  link: { marginTop: 20, alignItems: 'center', padding: 8 },
  linkText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});
