import { ActivityIndicator, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { User } from '../../../auth/domain/entities/User';
import { MIN_PASSWORD_LENGTH } from '../../../auth/domain/useCases/RegisterGuardian';
import { SupportNetwork } from '../../domain/useCases/SupportNetwork';
import { SUPPORT_CONFIRMATION_MESSAGE, SUPPORT_SCOPE_NOTICE } from '../networkMessages';
import { useAcceptInvitationViewModel } from '../viewModels/useAcceptInvitationViewModel';

type AcceptInvitationScreenProps = {
  supportNetwork: SupportNetwork;
  /** Token que llega por el enlace nexasafe://invitacion/… (D14). */
  initialCode?: string;
  onSignedIn: (user: User) => void;
  onBack: () => void;
};

/** W6 · Aceptar la invitación a la red de apoyo (E2-01, D8, D14, D17). */
export function AcceptInvitationScreen({
  supportNetwork,
  initialCode = '',
  onSignedIn,
  onBack,
}: AcceptInvitationScreenProps) {
  const vm = useAcceptInvitationViewModel(supportNetwork, initialCode, onSignedIn);

  if (vm.confirmationPending) {
    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <Text style={styles.title}>Revisa tu correo</Text>
        <Text style={styles.notice}>{SUPPORT_CONFIRMATION_MESSAGE}</Text>
        <Pressable style={styles.button} onPress={onBack} accessibilityRole="button">
          <Text style={styles.buttonText}>Ir a iniciar sesión</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.link} onPress={onBack} accessibilityRole="button">
        <Text style={styles.linkText}>‹ Volver</Text>
      </Pressable>

      {!vm.preview ? (
        <>
          <Text style={styles.title}>Tengo una invitación</Text>
          <Text style={styles.subtitle}>Pega el código o el enlace que te enviaron.</Text>
          <TextInput
            style={styles.input}
            placeholder="Código o enlace de invitación"
            accessibilityLabel="Código de invitación"
            value={vm.code}
            onChangeText={vm.setCode}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!vm.isBusy}
          />
          {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
          <Pressable
            style={[styles.button, vm.isBusy && styles.buttonDisabled]}
            onPress={vm.check}
            disabled={vm.isBusy}
            accessibilityRole="button"
          >
            {vm.isBusy ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Continuar</Text>
            )}
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.title}>
            Te invitaron a la red de apoyo de {vm.preview.childFirstName}
          </Text>
          <Text style={styles.subtitle}>Invitación de {vm.preview.guardianName}.</Text>

          <TextInput
            style={styles.input}
            placeholder="Tu nombre"
            accessibilityLabel="Nombre completo"
            value={vm.name}
            onChangeText={vm.setName}
            editable={!vm.isBusy}
          />
          {!!vm.fieldErrors.name && <Text style={styles.error}>{vm.fieldErrors.name}</Text>}
          <TextInput
            style={styles.input}
            placeholder="Correo"
            accessibilityLabel="Correo"
            value={vm.email}
            onChangeText={vm.setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!vm.isBusy}
          />
          {!!vm.fieldErrors.email && <Text style={styles.error}>{vm.fieldErrors.email}</Text>}
          <TextInput
            style={styles.input}
            placeholder={`Contraseña (mínimo ${MIN_PASSWORD_LENGTH} caracteres)`}
            accessibilityLabel="Contraseña"
            value={vm.password}
            onChangeText={vm.setPassword}
            secureTextEntry
            editable={!vm.isBusy}
          />
          {!!vm.fieldErrors.password && <Text style={styles.error}>{vm.fieldErrors.password}</Text>}
          {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}

          <Pressable
            style={[styles.button, vm.isBusy && styles.buttonDisabled]}
            onPress={vm.register}
            disabled={vm.isBusy}
            accessibilityRole="button"
          >
            {vm.isBusy ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Crear cuenta y aceptar</Text>
            )}
          </Pressable>
          <Text style={styles.empty}>{SUPPORT_SCOPE_NOTICE}</Text>
        </>
      )}
    </ScrollView>
  );
}
