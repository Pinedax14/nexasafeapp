import { Text } from 'react-native';
import { BrandLayout } from '../../../../core/theme/BrandLayout';
import { Button } from '../../../../core/theme/Button';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { TextField } from '../../../../core/theme/TextField';
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
      <BrandLayout title="Revisa tu correo">
        <Text style={styles.notice}>{CONFIRMATION_MESSAGE}</Text>
        <Button title="Ir a iniciar sesión" icon="log-in-outline" onPress={onGoToLogin} />
      </BrandLayout>
    );
  }

  return (
    <BrandLayout
      title="Crea tu cuenta"
      subtitle="Regístrate como acudiente"
      footer={
        <Button
          title="¿Ya tienes cuenta? Inicia sesión"
          onPress={onGoToLogin}
          disabled={vm.isLoading}
          variant="ghost"
          accessibilityRole="link"
        />
      }
    >
      <TextField
        icon="person-outline"
        placeholder="Nombre completo"
        accessibilityLabel="Nombre completo"
        value={vm.values.name}
        onChangeText={(value) => vm.updateField('name', value)}
        autoComplete="name"
        editable={!vm.isLoading}
        error={vm.fieldErrors.name}
      />
      <TextField
        icon="mail-outline"
        placeholder="Correo"
        accessibilityLabel="Correo"
        value={vm.values.email}
        onChangeText={(value) => vm.updateField('email', value)}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        editable={!vm.isLoading}
        error={vm.fieldErrors.email}
      />
      <TextField
        icon="lock-closed-outline"
        placeholder={`Contraseña (mínimo ${MIN_PASSWORD_LENGTH} caracteres)`}
        accessibilityLabel="Contraseña"
        value={vm.values.password}
        onChangeText={(value) => vm.updateField('password', value)}
        autoComplete="new-password"
        secureTextEntry
        editable={!vm.isLoading}
        error={vm.fieldErrors.password}
      />

      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}

      <Button title="Crear cuenta" onPress={vm.register} loading={vm.isLoading} />
    </BrandLayout>
  );
}
