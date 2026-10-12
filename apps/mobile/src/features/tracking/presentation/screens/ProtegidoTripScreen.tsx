import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { ListMyProtegidos } from '../../../profile/domain/useCases/ListMyProtegidos';
import { ManageRoutes } from '../../../routes/domain/useCases/ManageRoutes';
import { DIRECTION_LABELS } from '../../../routes/presentation/routeMessages';
import { TrackTrips } from '../../domain/useCases/TrackTrips';
import { NO_ROUTES_MESSAGE, tripSince } from '../tripMessages';
import { useProtegidoTripViewModel } from '../viewModels/useProtegidoTripViewModel';

type ProtegidoTripScreenProps = {
  listMyProtegidos: ListMyProtegidos;
  manageRoutes: ManageRoutes;
  trackTrips: TrackTrips;
  userName: string;
  onSignOut: () => void;
};

/** W3 · Inicio del menor y W4 · Trayecto en curso (E4-01). */
export function ProtegidoTripScreen({
  listMyProtegidos,
  manageRoutes,
  trackTrips,
  userName,
  onSignOut,
}: ProtegidoTripScreenProps) {
  const vm = useProtegidoTripViewModel(listMyProtegidos, manageRoutes, trackTrips);
  const tripRoute = vm.trip ? vm.routes.find((route) => route.id === vm.trip?.routeId) : undefined;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Hola, {userName} 👋</Text>

      {vm.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : vm.trip ? (
        <View style={local.tripCard}>
          <Text style={styles.sectionTitle}>
            {tripRoute ? DIRECTION_LABELS[tripRoute.direction] : 'Trayecto en curso'}
          </Text>
          <Text style={local.tripText}>{tripSince(vm.trip.startedAt)}</Text>
          <Text style={local.tripText}>Tu acudiente sabe que vas en camino.</Text>
        </View>
      ) : vm.routes.length === 0 ? (
        !vm.routesFailed && <Text style={styles.empty}>{NO_ROUTES_MESSAGE}</Text>
      ) : (
        <>
          <Text style={styles.subtitle}>¿A dónde vas?</Text>
          {vm.routes.map((route) => (
            <Pressable
              key={route.id}
              style={[local.routeButton, vm.isStarting && styles.buttonDisabled]}
              onPress={() => vm.start(route)}
              disabled={vm.isStarting}
              accessibilityRole="button"
              accessibilityLabel={`Iniciar trayecto ${DIRECTION_LABELS[route.direction]}`}
            >
              <Text style={local.routeButtonText}>▶ {DIRECTION_LABELS[route.direction]}</Text>
            </Pressable>
          ))}
          <Text style={local.hint}>Un toque inicia el trayecto y tu acudiente te acompaña.</Text>
        </>
      )}

      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}

      <Pressable style={styles.link} onPress={onSignOut} accessibilityRole="button">
        <Text style={styles.linkText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  routeButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 72,
    marginBottom: 12,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  routeButtonText: { color: colors.onPrimary, fontSize: 20, fontWeight: '700' },
  hint: { color: colors.textMuted, marginTop: 4 },
  tripCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.successBackground,
    marginBottom: 16,
  },
  tripText: { fontSize: 16, color: colors.text, marginBottom: 4 },
});
