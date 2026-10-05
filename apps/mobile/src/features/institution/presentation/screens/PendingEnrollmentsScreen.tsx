import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { PendingEnrollment } from '../../domain/entities/EnrollmentReview';
import { ValidateEnrollment } from '../../domain/useCases/ValidateEnrollment';
import { usePendingEnrollmentsViewModel } from '../viewModels/usePendingEnrollmentsViewModel';

type PendingEnrollmentsScreenProps = {
  validateEnrollment: ValidateEnrollment;
  userName: string;
  onReview: (enrollment: PendingEnrollment) => void;
  onSignOut: () => void;
};

export function PendingEnrollmentsScreen({
  validateEnrollment,
  userName,
  onReview,
  onSignOut,
}: PendingEnrollmentsScreenProps) {
  const vm = usePendingEnrollmentsViewModel(validateEnrollment);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Puesto de control</Text>
      <Text style={styles.subtitle}>Hola, {userName}. Valida las matrículas de tu colegio.</Text>

      <View style={styles.row}>
        <Text style={styles.sectionTitle}>Matrículas pendientes</Text>
        <Pressable onPress={vm.reload} accessibilityRole="button">
          <Text style={styles.linkText}>Actualizar</Text>
        </Pressable>
      </View>

      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
      {vm.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : vm.pending.length === 0 ? (
        <Text style={styles.empty}>No hay matrículas pendientes.</Text>
      ) : (
        vm.pending.map((enrollment) => (
          <Pressable
            key={enrollment.id}
            style={styles.row}
            onPress={() => onReview(enrollment)}
            accessibilityRole="button"
            accessibilityLabel={`Revisar a ${enrollment.name}`}
          >
            <View>
              <Text style={styles.rowTitle}>{enrollment.name}</Text>
              <Text style={styles.rowSubtitle}>
                Registrado el {new Date(enrollment.registeredAt).toLocaleDateString('es-CO')}
              </Text>
            </View>
            <Text style={styles.linkText}>Revisar ›</Text>
          </Pressable>
        ))
      )}

      <Pressable style={styles.link} onPress={onSignOut} accessibilityRole="button">
        <Text style={styles.linkText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}
