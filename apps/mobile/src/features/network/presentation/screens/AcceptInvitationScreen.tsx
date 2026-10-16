import { ScrollView, Text } from 'react-native';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { User } from '../../../auth/domain/entities/User';
import { MIN_PASSWORD_LENGTH } from '../../../auth/domain/useCases/RegisterGuardian';
import { SupportNetwork } from '../../domain/useCases/SupportNetwork';
import { SUPPORT_CONFIRMATION_MESSAGE, SUPPORT_SCOPE_NOTICE } from '../networkMessages';
import { useAcceptInvitationViewModel } from '../viewModels/useAcceptInvitationViewModel';
import { BackLink } from '../../../../core/theme/BackLink';
import { Button } from '../../../../core/theme/Button';
import { TextField } from '../../../../core/theme/TextField';

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
        <Button title="Ir a iniciar sesión" onPress={onBack} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <BackLink label="Volver" onPress={onBack} />

      {!vm.preview ? (
        <>
          <Text style={styles.title}>Tengo una invitación</Text>
          <Text style={styles.subtitle}>Pega el código o el enlace que te enviaron.</Text>
          <TextField
            icon="ticket-outline"
            placeholder="Código o enlace de invitación"
            accessibilityLabel="Código de invitación"
            value={vm.code}
            onChangeText={vm.setCode}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!vm.isBusy}
          />
          {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
          <Button title="Continuar" onPress={vm.check} loading={vm.isBusy} />
        </>
      ) : (
        <>
          <Text style={styles.title}>
            Te invitaron a la red de apoyo de {vm.preview.childFirstName}
          </Text>
          <Text style={styles.subtitle}>Invitación de {vm.preview.guardianName}.</Text>

          <TextField
            icon="person-outline"
            placeholder="Tu nombre"
            accessibilityLabel="Nombre completo"
            value={vm.name}
            onChangeText={vm.setName}
            editable={!vm.isBusy}
          />
          {!!vm.fieldErrors.name && <Text style={styles.error}>{vm.fieldErrors.name}</Text>}
          <TextField
            icon="mail-outline"
            placeholder="Correo"
            accessibilityLabel="Correo"
            value={vm.email}
            onChangeText={vm.setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!vm.isBusy}
          />
          {!!vm.fieldErrors.email && <Text style={styles.error}>{vm.fieldErrors.email}</Text>}
          <TextField
            icon="lock-closed-outline"
            placeholder={`Contraseña (mínimo ${MIN_PASSWORD_LENGTH} caracteres)`}
            accessibilityLabel="Contraseña"
            value={vm.password}
            onChangeText={vm.setPassword}
            secureTextEntry
            editable={!vm.isBusy}
          />
          {!!vm.fieldErrors.password && <Text style={styles.error}>{vm.fieldErrors.password}</Text>}
          {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}

          <Button title="Crear cuenta y aceptar" onPress={vm.register} loading={vm.isBusy} />
          <Text style={styles.empty}>{SUPPORT_SCOPE_NOTICE}</Text>
        </>
      )}
    </ScrollView>
  );
}
