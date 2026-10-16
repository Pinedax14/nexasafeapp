import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { AlertSummary } from '../../../alerts/domain/entities/AlertSummary';
import { RespondToAlerts } from '../../../alerts/domain/useCases/RespondToAlerts';
import { useAlertListViewModel } from '../../../alerts/presentation/viewModels/useAlertListViewModel';
import { TrackTrips } from '../../../tracking/domain/useCases/TrackTrips';
import { tripSince } from '../../../tracking/presentation/tripMessages';
import { Protegido } from '../../domain/entities/Protegido';
import { ListMyProtegidos } from '../../domain/useCases/ListMyProtegidos';
import { STATUS_LABELS } from '../profileMessages';
import { useGuardianHomeViewModel } from '../viewModels/useGuardianHomeViewModel';

type GuardianHomeScreenProps = {
  listMyProtegidos: ListMyProtegidos;
  trackTrips?: TrackTrips;
  userName: string;
  onRegisterProtegido: () => void;
  onAssignPin: (protegido: Protegido) => void;
  onOpenRoutes: (protegido: Protegido) => void;
  onOpenNetwork?: (protegido: Protegido) => void;
  onOpenLive?: (protegido: Protegido) => void;
  /** W11: alertas activas de los menores del guardián. */
  respondToAlerts?: RespondToAlerts;
  onOpenAlert?: (alert: AlertSummary) => void;
  onSignOut: () => void;
};

export function GuardianHomeScreen({
  listMyProtegidos,
  trackTrips,
  userName,
  onRegisterProtegido,
  onAssignPin,
  onOpenRoutes,
  onOpenNetwork,
  onOpenLive,
  respondToAlerts,
  onOpenAlert,
  onSignOut,
}: GuardianHomeScreenProps) {
  const vm = useGuardianHomeViewModel(listMyProtegidos, trackTrips);
  const { alerts: activeAlerts } = useAlertListViewModel(respondToAlerts, true);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Hola, {userName}</Text>
      <Text style={styles.subtitle}>Los menores que acompañas con NexaSafe.</Text>

      <Pressable style={styles.button} onPress={onRegisterProtegido} accessibilityRole="button">
        <Text style={styles.buttonText}>Registrar menor</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Mis menores</Text>
      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
      {vm.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : vm.protegidos.length === 0 ? (
        <Text style={styles.empty}>Todavía no has registrado ningún menor.</Text>
      ) : (
        vm.protegidos.map((protegido) => (
          <View key={protegido.id} style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{protegido.name}</Text>
              <Text style={styles.rowSubtitle}>{STATUS_LABELS[protegido.status]}</Text>
              {!!vm.activeTrips[protegido.id] && (
                <Text style={local.trip}>
                  En trayecto · {tripSince(vm.activeTrips[protegido.id].startedAt).toLowerCase()}
                </Text>
              )}
              {activeAlerts
                .filter((alert) => alert.protegidoId === protegido.id)
                .map((alert) => (
                  <Pressable
                    key={alert.id}
                    onPress={() => onOpenAlert?.(alert)}
                    accessibilityRole="button"
                    accessibilityLabel={`Alerta activa de ${protegido.name}`}
                  >
                    <Text style={local.alert}>🚨 Alerta activa ›</Text>
                  </Pressable>
                ))}
              {!!vm.activeTrips[protegido.id] && onOpenLive && (
                <Pressable
                  onPress={() => onOpenLive(protegido)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver en vivo a ${protegido.name}`}
                >
                  <Text style={styles.linkText}>Ver en vivo ›</Text>
                </Pressable>
              )}
            </View>
            {protegido.status === 'ACTIVO' && (
              <View style={local.actions}>
                <Pressable
                  onPress={() => onOpenRoutes(protegido)}
                  accessibilityRole="button"
                  accessibilityLabel={`Rutas de ${protegido.name}`}
                >
                  <Text style={styles.linkText}>Rutas ›</Text>
                </Pressable>
                {onOpenNetwork && (
                  <Pressable
                    onPress={() => onOpenNetwork(protegido)}
                    accessibilityRole="button"
                    accessibilityLabel={`Red de apoyo de ${protegido.name}`}
                  >
                    <Text style={styles.linkText}>Red ›</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => onAssignPin(protegido)}
                  accessibilityRole="button"
                  accessibilityLabel={`Asignar PIN a ${protegido.name}`}
                >
                  <Text style={styles.linkText}>PIN ›</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))
      )}

      <Pressable style={styles.link} onPress={onSignOut} accessibilityRole="button">
        <Text style={styles.linkText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 16 },
  trip: { fontSize: 14, fontWeight: '600', color: colors.success },
  alert: { fontSize: 15, fontWeight: '700', color: colors.error },
});
