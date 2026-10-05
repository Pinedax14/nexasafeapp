import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { User } from '../../domain/entities/User';
import { LoginWithPin } from '../../domain/useCases/LoginWithPin';
import { usePinLoginViewModel } from '../viewModels/usePinLoginViewModel';

type PinLoginScreenProps = {
  loginWithPin: LoginWithPin;
  onLoginSuccess: (user: User) => void;
  onBack: () => void;
};

export function PinLoginScreen({ loginWithPin, onLoginSuccess, onBack }: PinLoginScreenProps) {
  const vm = usePinLoginViewModel({ loginWithPin, onLoginSuccess });

  return (
    <ScrollView
      contentContainerStyle={[styles.screen, local.centered]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Hola 👋</Text>
      <Text style={styles.subtitle}>Entra con tu documento y tu PIN de 4 números.</Text>

      <TextInput
        style={styles.input}
        placeholder="Número de documento"
        accessibilityLabel="Número de documento"
        value={vm.document}
        onChangeText={vm.updateDocument}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!vm.isLoading}
      />
      {!!vm.fieldErrors.document && <Text style={styles.error}>{vm.fieldErrors.document}</Text>}

      <TextInput
        style={[styles.input, local.pin]}
        placeholder="PIN"
        accessibilityLabel="PIN"
        value={vm.pin}
        onChangeText={vm.updatePin}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        editable={!vm.isLoading}
      />
      {!!vm.fieldErrors.pin && <Text style={styles.error}>{vm.fieldErrors.pin}</Text>}
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
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </Pressable>

      <Pressable style={styles.link} onPress={onBack} accessibilityRole="button">
        <Text style={styles.linkText}>‹ Soy acudiente o del colegio</Text>
      </Pressable>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  centered: { justifyContent: 'center' },
  pin: { fontSize: 24, letterSpacing: 12, textAlign: 'center' },
});
