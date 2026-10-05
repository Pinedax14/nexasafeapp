import { ActivityIndicator, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
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
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Cambia tu contraseña</Text>
      <Text style={styles.subtitle}>
        Hola, {userName}. Entraste con una contraseña temporal que te dio el administrador. Para
        proteger los datos de los menores, crea una contraseña nueva que solo tú conozcas.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nueva contraseña"
        accessibilityLabel="Nueva contraseña"
        value={vm.password}
        onChangeText={vm.updatePassword}
        secureTextEntry
        autoCapitalize="none"
        editable={!vm.isSaving}
      />
      {!!vm.fieldErrors.password && <Text style={styles.error}>{vm.fieldErrors.password}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Repite la nueva contraseña"
        accessibilityLabel="Confirmar contraseña"
        value={vm.confirmation}
        onChangeText={vm.updateConfirmation}
        secureTextEntry
        autoCapitalize="none"
        editable={!vm.isSaving}
      />
      {!!vm.fieldErrors.confirmation && (
        <Text style={styles.error}>{vm.fieldErrors.confirmation}</Text>
      )}
      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}

      <Pressable
        style={[styles.button, vm.isSaving && styles.buttonDisabled]}
        onPress={vm.save}
        disabled={vm.isSaving}
        accessibilityRole="button"
      >
        {vm.isSaving ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.buttonText}>Guardar contraseña</Text>
        )}
      </Pressable>

      <Pressable style={styles.link} onPress={onSignOut} accessibilityRole="button">
        <Text style={styles.linkText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}
