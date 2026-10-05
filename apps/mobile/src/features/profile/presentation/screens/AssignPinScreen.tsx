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
import { Protegido } from '../../domain/entities/Protegido';
import { AssignPin } from '../../domain/useCases/AssignPin';
import { useAssignPinViewModel } from '../viewModels/useAssignPinViewModel';

type AssignPinScreenProps = {
  assignPin: AssignPin;
  protegido: Protegido;
  onBack: () => void;
};

export function AssignPinScreen({ assignPin, protegido, onBack }: AssignPinScreenProps) {
  const vm = useAssignPinViewModel(assignPin, protegido.id);

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.link} onPress={onBack} accessibilityRole="button">
        <Text style={styles.linkText}>‹ Mis menores</Text>
      </Pressable>
      <Text style={styles.title}>PIN de {protegido.name}</Text>
      <Text style={styles.subtitle}>
        Con su número de documento y este PIN de 4 números, el menor entra a NexaSafe en su celular.
        Si ya tenía uno, se reemplaza.
      </Text>

      <Pressable
        style={[local.secondaryButton, vm.isSaving && styles.buttonDisabled]}
        onPress={vm.generate}
        disabled={vm.isSaving}
        accessibilityRole="button"
      >
        <Text style={local.secondaryButtonText}>Generar PIN aleatorio</Text>
      </Pressable>
      {!!vm.generatedPin && (
        <Text style={local.generatedPin} accessibilityLabel="PIN generado">
          {vm.generatedPin}
        </Text>
      )}

      <Text style={local.or}>o escribe uno tú mismo</Text>

      <TextInput
        style={[styles.input, local.pin]}
        placeholder="PIN"
        accessibilityLabel="Nuevo PIN"
        value={vm.pin}
        onChangeText={vm.updatePin}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        editable={!vm.isSaving}
      />
      {!!vm.fieldErrors.pin && <Text style={styles.error}>{vm.fieldErrors.pin}</Text>}

      <TextInput
        style={[styles.input, local.pin]}
        placeholder="Repite el PIN"
        accessibilityLabel="Confirmar PIN"
        value={vm.confirmation}
        onChangeText={vm.updateConfirmation}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        editable={!vm.isSaving}
      />
      {!!vm.fieldErrors.confirmation && (
        <Text style={styles.error}>{vm.fieldErrors.confirmation}</Text>
      )}
      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
      {!!vm.notice && <Text style={styles.notice}>{vm.notice}</Text>}

      <Pressable
        style={[styles.button, vm.isSaving && styles.buttonDisabled]}
        onPress={vm.save}
        disabled={vm.isSaving}
        accessibilityRole="button"
      >
        {vm.isSaving ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.buttonText}>Guardar PIN</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  pin: { fontSize: 24, letterSpacing: 12, textAlign: 'center' },
  secondaryButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 10,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  generatedPin: {
    marginTop: 16,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: 16,
    textAlign: 'center',
    color: colors.text,
  },
  or: { marginVertical: 16, textAlign: 'center', color: colors.textMuted },
});
