import { StyleSheet, Text } from 'react-native';
import { BrandLayout } from '../../../../core/theme/BrandLayout';
import { Button } from '../../../../core/theme/Button';
import { colors } from '../../../../core/theme/colors';
import { formStyles } from '../../../../core/theme/formStyles';
import { TextField } from '../../../../core/theme/TextField';
import { fonts } from '../../../../core/theme/typography';
import { User } from '../../domain/entities/User';
import { AuthenticateUser } from '../../domain/useCases/AuthenticateUser';
import { useAuthViewModel } from '../viewModels/useAuthViewModel';

type AuthScreenProps = {
  authenticateUser: AuthenticateUser;
  onLoginSuccess: (user: User) => void;
  onGoToRegister: () => void;
  onGoToPinLogin: () => void;
  onGoToInvitation?: () => void;
};

export function AuthScreen({
  authenticateUser,
  onLoginSuccess,
  onGoToRegister,
  onGoToPinLogin,
  onGoToInvitation,
}: AuthScreenProps) {
  const vm = useAuthViewModel({ authenticateUser, onLoginSuccess });

  return (
    <BrandLayout
      title="NexaSafe"
      subtitle="Inicia sesión para acompañar a tus menores"
      footer={
        <>
          <Text style={styles.divider}>¿Eres menor o te invitaron?</Text>
          <Button
            title="Soy menor: entrar con documento y PIN"
            icon="happy-outline"
            onPress={onGoToPinLogin}
            disabled={vm.isLoading}
            variant="secondary"
            accessibilityRole="link"
          />
          {onGoToInvitation && (
            <Button
              title="Tengo una invitación"
              icon="people-outline"
              onPress={onGoToInvitation}
              disabled={vm.isLoading}
              variant="secondary"
              accessibilityRole="link"
            />
          )}
        </>
      }
    >
      <TextField
        icon="mail-outline"
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
      <TextField
        icon="lock-closed-outline"
        placeholder="Contraseña"
        accessibilityLabel="Contraseña"
        value={vm.password}
        onChangeText={vm.updatePassword}
        autoComplete="current-password"
        secureTextEntry
        editable={!vm.isLoading}
      />

      {!!vm.errorMessage && <Text style={formStyles.error}>{vm.errorMessage}</Text>}

      <Button title="Ingresar" onPress={vm.login} loading={vm.isLoading} />
      <Button
        title="¿No tienes cuenta? Regístrate"
        onPress={onGoToRegister}
        disabled={vm.isLoading}
        variant="ghost"
        accessibilityRole="link"
      />
    </BrandLayout>
  );
}

const styles = StyleSheet.create({
  divider: {
    ...fonts.medium,
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
    fontSize: 14,
    color: colors.textMuted,
  },
});
