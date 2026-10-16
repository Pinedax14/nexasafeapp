import { ActivityIndicator, ScrollView, Text } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { AlertSummary } from '../../../alerts/domain/entities/AlertSummary';
import { RespondToAlerts } from '../../../alerts/domain/useCases/RespondToAlerts';
import { AlertList } from '../../../alerts/presentation/components/AlertList';
import { useAlertListViewModel } from '../../../alerts/presentation/viewModels/useAlertListViewModel';
import { NO_ALERTS_MESSAGE, SUPPORT_SCOPE_NOTICE } from '../networkMessages';
import { Button } from '../../../../core/theme/Button';

type SupportHomeScreenProps = {
  respondToAlerts: RespondToAlerts;
  userName: string;
  onOpenAlert: (alert: AlertSummary) => void;
  onSignOut: () => void;
};

/** Inicio del contacto de apoyo (E2-01): solo ve las alertas del menor (D8), W11. */
export function SupportHomeScreen({
  respondToAlerts,
  userName,
  onOpenAlert,
  onSignOut,
}: SupportHomeScreenProps) {
  const vm = useAlertListViewModel(respondToAlerts, false);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Hola, {userName}</Text>
      <Text style={styles.subtitle}>{SUPPORT_SCOPE_NOTICE}</Text>
      <Text style={styles.sectionTitle}>Alertas</Text>
      {vm.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <AlertList alerts={vm.alerts} emptyText={NO_ALERTS_MESSAGE} onOpen={onOpenAlert} />
      )}
      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
      <Button title="Cerrar sesión" onPress={onSignOut} variant="ghost" icon="log-out-outline" />
    </ScrollView>
  );
}
