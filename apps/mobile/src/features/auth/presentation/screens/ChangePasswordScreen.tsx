import { Text } from 'react-native';
import { BrandLayout } from '../../../../core/theme/BrandLayout';
import { Button } from '../../../../core/theme/Button';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { TextField } from '../../../../core/theme/TextField';
import { User } from '../../domain/entities/User';
import { ChangePassword } from '../../domain/useCases/ChangePassword';
import { useChangePasswordViewModel } from '../viewModels/useChangePasswordViewModel';

type ChangePasswordScreenProps = {
  changePassword: ChangePassword;
  userName: string;
  onChanged: (user: User) => void;
  onSignOut: () => void;
};

export function ChangePasswordScreen({
  changePassword,
  userName,
  onChanged,
  onSignOut,
}: ChangePasswordScreenProps) {
  const vm = useChangePasswordViewModel({ changePassword, onChanged });

  return (
    <BrandLayout
      title="Cambia tu contraseña"
      footer={<Button title="Cerrar sesión" onPress={onSignOut} variant="ghost" />}
    >
      <Text style={styles.subtitle}>
        Hola, {userName}. Entraste con una contraseña temporal que te dio el administrador. Para
        proteger los datos de los menores, crea una contraseña nueva que solo tú conozcas.
      </Text>

      <TextField
        icon="lock-closed-outline"
        placeholder="Nueva contraseña"
        accessibilityLabel="Nueva contraseña"
        value={vm.password}
        onChangeText={vm.updatePassword}
        secureTextEntry
        autoCapitalize="none"
        editable={!vm.isSaving}
        error={vm.fieldErrors.password}
      />
      <TextField
        icon="lock-closed-outline"
        placeholder="Repite la nueva contraseña"
        accessibilityLabel="Confirmar contraseña"
        value={vm.confirmation}
        onChangeText={vm.updateConfirmation}
        secureTextEntry
        autoCapitalize="none"
        editable={!vm.isSaving}
        error={vm.fieldErrors.confirmation}
      />
      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}

      <Button title="Guardar contraseña" onPress={vm.save} loading={vm.isSaving} />
    </BrandLayout>
  );
}
