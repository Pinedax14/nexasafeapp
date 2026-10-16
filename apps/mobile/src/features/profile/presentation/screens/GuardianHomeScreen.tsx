import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../../core/theme/Button';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { ActionChip, Avatar, StatusPill } from '../../../../core/theme/Pill';
import { fonts, shadow } from '../../../../core/theme/typography';
import { AlertSummary } from '../../../alerts/domain/entities/AlertSummary';
import { RespondToAlerts } from '../../../alerts/domain/useCases/RespondToAlerts';
import { useAlertListViewModel } from '../../../alerts/presentation/viewModels/useAlertListViewModel';
import { TrackTrips } from '../../../tracking/domain/useCases/TrackTrips';
import { tripSince } from '../../../tracking/presentation/tripMessages';
import { Protegido } from '../../domain/entities/Protegido';
import { ListMyProtegidos } from '../../domain/useCases/ListMyProtegidos';
import { STATUS_LABELS } from '../profileMessages';
import { useGuardianHomeViewModel } from '../viewModels/useGuardianHomeViewModel';

const STATUS_TONES = {
  ACTIVO: 'success',
  PENDIENTE_VALIDACION: 'warning',
  INACTIVO: 'neutral',
} as const;

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
      <View style={local.header}>
        <View style={local.headerText}>
          <Text style={styles.title}>Hola, {userName}</Text>
          <Text style={[styles.subtitle, local.subtitle]}>
            Los menores que acompañas con NexaSafe.
          </Text>
        </View>
        <Avatar name={userName} />
      </View>

      <Button title="Registrar menor" icon="person-add-outline" onPress={onRegisterProtegido} />

      <Text style={styles.sectionTitle}>Mis menores</Text>
      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
      {vm.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : vm.protegidos.length === 0 ? (
        <View style={[styles.card, local.emptyCard]}>
          <Ionicons name="people-outline" size={40} color={colors.primary} />
          <Text style={styles.empty}>Todavía no has registrado ningún menor.</Text>
        </View>
      ) : (
        vm.protegidos.map((protegido) => {
          const trip = vm.activeTrips[protegido.id];
          return (
            <View key={protegido.id} style={[styles.card, local.card]}>
              <View style={local.cardHeader}>
                <Avatar name={protegido.name} size={52} />
                <View style={local.headerText}>
                  <Text style={local.name}>{protegido.name}</Text>
                  <StatusPill
                    label={STATUS_LABELS[protegido.status]}
                    tone={STATUS_TONES[protegido.status]}
                  />
                </View>
              </View>

              {activeAlerts
                .filter((alert) => alert.protegidoId === protegido.id)
                .map((alert) => (
                  <Pressable
                    key={alert.id}
                    style={local.alert}
                    onPress={() => onOpenAlert?.(alert)}
                    accessibilityRole="button"
                    accessibilityLabel={`Alerta activa de ${protegido.name}`}
                  >
                    <Ionicons name="warning" size={20} color={colors.onPrimary} />
                    <Text style={local.alertText}>🚨 Alerta activa ›</Text>
                  </Pressable>
                ))}

              {!!trip && (
                <View style={local.trip}>
                  <View style={local.dot} />
                  <Text style={local.tripText}>
                    En trayecto · {tripSince(trip.startedAt).toLowerCase()}
                  </Text>
                  {onOpenLive && (
                    <Pressable
                      onPress={() => onOpenLive(protegido)}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver en vivo a ${protegido.name}`}
                      style={local.live}
                    >
                      <Text style={local.liveText}>Ver en vivo ›</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {protegido.status === 'ACTIVO' && (
                <View style={local.actions}>
                  <ActionChip
                    label="Rutas"
                    icon="map-outline"
                    onPress={() => onOpenRoutes(protegido)}
                    accessibilityLabel={`Rutas de ${protegido.name}`}
                  />
                  {onOpenNetwork && (
                    <ActionChip
                      label="Red"
                      icon="people-outline"
                      onPress={() => onOpenNetwork(protegido)}
                      accessibilityLabel={`Red de apoyo de ${protegido.name}`}
                    />
                  )}
                  <ActionChip
                    label="PIN"
                    icon="keypad-outline"
                    onPress={() => onAssignPin(protegido)}
                    accessibilityLabel={`Asignar PIN a ${protegido.name}`}
                  />
                </View>
              )}
            </View>
          );
        })
      )}

      <Button title="Cerrar sesión" icon="log-out-outline" onPress={onSignOut} variant="ghost" />
    </ScrollView>
  );
}

const local = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  headerText: { flex: 1 },
  subtitle: { marginBottom: 12 },
  emptyCard: { alignItems: 'center', paddingVertical: 28 },
  card: { marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { ...fonts.bold, fontSize: 18, color: colors.text },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    marginTop: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.error,
    ...shadow(4),
    shadowColor: colors.error,
  },
  alertText: { ...fonts.bold, fontSize: 15, color: colors.onPrimary },
  trip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.successBackground,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  tripText: { ...fonts.semibold, flex: 1, fontSize: 14, color: colors.success },
  live: { minHeight: 36, justifyContent: 'center' },
  liveText: { ...fonts.bold, fontSize: 14, color: colors.primary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
});
