import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { User } from '../../domain/entities/User';
import { MIN_PASSWORD_LENGTH, RegisterGuardian } from '../../domain/useCases/RegisterGuardian';
import { CONFIRMATION_MESSAGE, useRegisterViewModel } from '../viewModels/useRegisterViewModel';

type RegisterScreenProps = {
  registerGuardian: RegisterGuardian;
  onSignedIn: (user: User) => void;
  onGoToLogin: () => void;
};

export function RegisterScreen({ registerGuardian, onSignedIn, onGoToLogin }: RegisterScreenProps) {
  const vm = useRegisterViewModel({ registerGuardian, onSignedIn });

  if (vm.isConfirmationPending) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Revisa tu correo</Text>
        <Text style={styles.notice}>{CONFIRMATION_MESSAGE}</Text>
        <Pressable style={styles.button} onPress={onGoToLogin} accessibilityRole="button">
          <Text style={styles.buttonText}>Ir a iniciar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Crea tu cuenta</Text>
        <Text style={styles.subtitle}>Regístrate como acudiente</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          accessibilityLabel="Nombre completo"
          value={vm.values.name}
          onChangeText={(value) => vm.updateField('name', value)}
          autoComplete="name"
          editable={!vm.isLoading}
        />
        {!!vm.fieldErrors.name && <Text style={styles.error}>{vm.fieldErrors.name}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Correo"
          accessibilityLabel="Correo"
          value={vm.values.email}
          onChangeText={(value) => vm.updateField('email', value)}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          editable={!vm.isLoading}
        />
        {!!vm.fieldErrors.email && <Text style={styles.error}>{vm.fieldErrors.email}</Text>}

        <TextInput
          style={styles.input}
          placeholder={`Contraseña (mínimo ${MIN_PASSWORD_LENGTH} caracteres)`}
          accessibilityLabel="Contraseña"
          value={vm.values.password}
          onChangeText={(value) => vm.updateField('password', value)}
          autoComplete="new-password"
          secureTextEntry
          editable={!vm.isLoading}
        />
        {!!vm.fieldErrors.password && <Text style={styles.error}>{vm.fieldErrors.password}</Text>}

        {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}

        <Pressable
          style={[styles.button, vm.isLoading && styles.buttonDisabled]}
          onPress={vm.register}
          disabled={vm.isLoading}
          accessibilityRole="button"
        >
          {vm.isLoading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Crear cuenta</Text>
          )}
        </Pressable>

        <Pressable
          onPress={onGoToLogin}
          disabled={vm.isLoading}
          accessibilityRole="link"
          style={styles.link}
        >
          <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  title: { fontSize: 30, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 8, marginBottom: 24, fontSize: 16, color: colors.textMuted },
  notice: {
    marginVertical: 24,
    padding: 16,
    borderRadius: 10,
    backgroundColor: colors.successBackground,
    color: colors.success,
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    fontSize: 16,
  },
  error: { color: colors.error, marginBottom: 12 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 52,
    marginTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  link: { marginTop: 20, alignItems: 'center', padding: 8 },
  linkText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});
