import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { User } from '../../domain/entities/User';
import { useAuthViewModel } from '../viewModels/useAuthViewModel';

type AuthScreenProps = {
  onLoginSuccess: (user: User) => void;
};

export function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const vm = useAuthViewModel({ onLoginSuccess });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido</Text>
      <Text style={styles.subtitle}>Ingresa con tu usuario de prueba</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo"
        value={vm.email}
        onChangeText={vm.updateEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        editable={!vm.isLoading}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={vm.password}
        onChangeText={vm.updatePassword}
        secureTextEntry
        editable={!vm.isLoading}
      />

      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}

      <Pressable
        style={[styles.button, vm.isLoading && styles.buttonDisabled]}
        onPress={vm.login}
        disabled={vm.isLoading}
      >
        {vm.isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Ingresar</Text>}
      </Pressable>

      <Text style={styles.help}>Prueba: ana@ejemplo.com / admin</Text>
      <Text style={styles.help}>o casalass@sanmateo.edu.co / abc123</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FFFFFF' },
  title: { fontSize: 30, fontWeight: '700', color: '#1F2937' },
  subtitle: { marginTop: 8, marginBottom: 24, fontSize: 16, color: '#6B7280' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16 },
  error: { color: '#DC2626', marginBottom: 12 },
  button: { backgroundColor: '#6D28D9', borderRadius: 10, minHeight: 52, justifyContent: 'center', alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  help: { marginTop: 20, color: '#6B7280', fontSize: 13 },
});
