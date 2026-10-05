import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { ValidateEnrollment } from '../../domain/useCases/ValidateEnrollment';
import { useEnrollmentReviewViewModel } from '../viewModels/useEnrollmentReviewViewModel';

type EnrollmentReviewScreenProps = {
  validateEnrollment: ValidateEnrollment;
  protegidoId: string;
  onBack: () => void;
};

export function EnrollmentReviewScreen({
  validateEnrollment,
  protegidoId,
  onBack,
}: EnrollmentReviewScreenProps) {
  const vm = useEnrollmentReviewViewModel(validateEnrollment, protegidoId);
  const isPending = vm.detail?.status === 'PENDIENTE_VALIDACION';

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Pressable style={styles.link} onPress={onBack} accessibilityRole="button">
        <Text style={styles.linkText}>‹ Matrículas pendientes</Text>
      </Pressable>
      <Text style={styles.title}>Revisar matrícula</Text>
      <Text style={styles.subtitle}>
        Verifica que el menor esté matriculado en tu colegio antes de activarlo.
      </Text>

      {vm.isLoading && <ActivityIndicator color={colors.primary} />}
      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}

      {vm.detail && (
        <View>
          {vm.detail.photoUrl ? (
            <Image
              source={{ uri: vm.detail.photoUrl }}
              style={local.photo}
              accessibilityLabel={`Foto de ${vm.detail.name}`}
            />
          ) : (
            <Text style={styles.empty}>Foto no disponible.</Text>
          )}
          <Text style={styles.rowSubtitle}>Nombre</Text>
          <Text style={local.value}>{vm.detail.name}</Text>
          <Text style={styles.rowSubtitle}>Documento</Text>
          <Text style={local.value}>{vm.detail.document}</Text>

          {!!vm.notice && <Text style={styles.notice}>{vm.notice}</Text>}

          {isPending && (
            <Pressable
              style={[styles.button, vm.isValidating && styles.buttonDisabled]}
              onPress={vm.validate}
              disabled={vm.isValidating}
              accessibilityRole="button"
            >
              {vm.isValidating ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.buttonText}>Validar matrícula</Text>
              )}
            </Pressable>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const local = StyleSheet.create({
  photo: { width: 160, height: 160, borderRadius: 12, marginBottom: 16 },
  value: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 },
});
