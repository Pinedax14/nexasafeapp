import { StyleSheet, Text } from 'react-native';
import { BrandLayout } from '../../../../core/theme/BrandLayout';
import { Button } from '../../../../core/theme/Button';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { TextField } from '../../../../core/theme/TextField';
import { fonts } from '../../../../core/theme/typography';
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
    <BrandLayout
      title="Hola 👋"
      subtitle="Entra con tu documento y tu PIN de 4 números."
      footer={
        <Button
          title="Soy acudiente o del colegio"
          icon="arrow-back"
          onPress={onBack}
          variant="ghost"
          accessibilityRole="button"
        />
      }
    >
      <TextField
        icon="card-outline"
        placeholder="Número de documento"
        accessibilityLabel="Número de documento"
        value={vm.document}
        onChangeText={vm.updateDocument}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!vm.isLoading}
        error={vm.fieldErrors.document}
      />
      <TextField
        icon="keypad-outline"
        style={local.pin}
        placeholder="PIN"
        accessibilityLabel="PIN"
        value={vm.pin}
        onChangeText={vm.updatePin}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        editable={!vm.isLoading}
        error={vm.fieldErrors.pin}
      />
      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}

      <Button title="Entrar" icon="arrow-forward" onPress={vm.login} loading={vm.isLoading} />
    </BrandLayout>
  );
}

const local = StyleSheet.create({
  pin: { ...fonts.bold, fontSize: 22, letterSpacing: 12 },
});
