import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { PhotoFile } from '../../domain/entities/Protegido';
import { RegisterProtegido } from '../../domain/useCases/RegisterProtegido';
import { POLICY_SECTIONS } from '../policyText';
import { useRegisterProtegidoViewModel } from '../viewModels/useRegisterProtegidoViewModel';

type RegisterProtegidoScreenProps = {
  registerProtegido: RegisterProtegido;
  guardianId: string;
  pickPhoto: () => Promise<PhotoFile | null>;
  onRegistered: () => void;
  onCancel: () => void;
};

export function RegisterProtegidoScreen({
  registerProtegido,
  guardianId,
  pickPhoto,
  onRegistered,
  onCancel,
}: RegisterProtegidoScreenProps) {
  const vm = useRegisterProtegidoViewModel({
    registerProtegido,
    guardianId,
    pickPhoto,
    onRegistered,
  });

  if (vm.isLoading) {
    return (
      <View style={local.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.link} onPress={onCancel} accessibilityRole="button">
        <Text style={styles.linkText}>‹ Volver</Text>
      </Pressable>
      <Text style={styles.title}>Registrar menor</Text>
      <Text style={styles.subtitle}>
        Quedará pendiente hasta que el colegio valide su matrícula.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo del menor"
        accessibilityLabel="Nombre del menor"
        value={vm.name}
        onChangeText={vm.updateName}
        editable={!vm.isSaving}
      />
      {!!vm.fieldErrors.name && <Text style={styles.error}>{vm.fieldErrors.name}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Número de documento"
        accessibilityLabel="Documento del menor"
        value={vm.document}
        onChangeText={vm.updateDocument}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!vm.isSaving}
      />
      {!!vm.fieldErrors.document && <Text style={styles.error}>{vm.fieldErrors.document}</Text>}

      <Text style={styles.sectionTitle}>Colegio</Text>
      {vm.schools.length === 0 ? (
        <Text style={styles.empty}>Aún no hay colegios registrados.</Text>
      ) : (
        vm.schools.map((school) => {
          const isSelected = vm.schoolId === school.id;
          return (
            <Pressable
              key={school.id}
              style={[local.option, isSelected && local.optionSelected]}
              onPress={() => vm.selectSchool(school.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <Text style={[local.optionText, isSelected && local.optionTextSelected]}>
                {isSelected ? '● ' : '○ '}
                {school.name}
              </Text>
            </Pressable>
          );
        })
      )}
      {!!vm.fieldErrors.school && <Text style={styles.error}>{vm.fieldErrors.school}</Text>}

      <Text style={styles.sectionTitle}>Foto</Text>
      {vm.photo && <Image source={{ uri: vm.photo.uri }} style={local.photo} />}
      <Pressable
        style={local.secondaryButton}
        onPress={vm.choosePhoto}
        disabled={vm.isSaving}
        accessibilityRole="button"
      >
        <Text style={styles.linkText}>{vm.photo ? 'Cambiar foto' : 'Elegir foto'}</Text>
      </Pressable>
      {!!vm.fieldErrors.photo && <Text style={styles.error}>{vm.fieldErrors.photo}</Text>}

      <Text style={styles.sectionTitle}>Tratamiento de datos</Text>
      <Pressable onPress={vm.togglePolicy} accessibilityRole="button" style={styles.link}>
        <Text style={styles.linkText}>
          {vm.isPolicyVisible ? 'Ocultar' : 'Leer'} la política de tratamiento (v
          {vm.policyVersion})
        </Text>
      </Pressable>
      {vm.isPolicyVisible &&
        POLICY_SECTIONS.map((section) => (
          <View key={section.title} style={local.policySection}>
            <Text style={styles.rowTitle}>{section.title}</Text>
            <Text style={styles.rowSubtitle}>{section.body}</Text>
          </View>
        ))}
      <Pressable
        style={local.checkboxRow}
        onPress={vm.toggleConsent}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: vm.consentAccepted }}
        accessibilityLabel="Acepto la política de tratamiento de datos"
      >
        <Text style={local.checkbox}>{vm.consentAccepted ? '☑' : '☐'}</Text>
        <Text style={local.checkboxText}>
          Como representante legal, autorizo el tratamiento de los datos del menor según la política
          de tratamiento v{vm.policyVersion}.
        </Text>
      </Pressable>
      {!!vm.fieldErrors.consent && <Text style={styles.error}>{vm.fieldErrors.consent}</Text>}

      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
      <Pressable
        style={[styles.button, vm.isSaving && styles.buttonDisabled]}
        onPress={vm.submit}
        disabled={vm.isSaving}
        accessibilityRole="button"
      >
        {vm.isSaving ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.buttonText}>Registrar menor</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', backgroundColor: colors.background },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  optionSelected: { borderColor: colors.primary },
  optionText: { fontSize: 16, color: colors.text },
  optionTextSelected: { color: colors.primary, fontWeight: '700' },
  photo: { width: 120, height: 120, borderRadius: 12, marginBottom: 8 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  policySection: { marginBottom: 10 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 12 },
  checkbox: { fontSize: 22, marginRight: 10, color: colors.primary },
  checkboxText: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 21 },
});
