import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { PanicAlerts } from '../../../alerts/domain/useCases/PanicAlerts';
import { AlertPanel } from '../../../alerts/presentation/components/AlertPanel';
import { PanicButton } from '../../../alerts/presentation/components/PanicButton';
import { usePanicViewModel } from '../../../alerts/presentation/viewModels/usePanicViewModel';
import { ListMyProtegidos } from '../../../profile/domain/useCases/ListMyProtegidos';
import { ManageRoutes } from '../../../routes/domain/useCases/ManageRoutes';
import { DIRECTION_LABELS } from '../../../routes/presentation/routeMessages';
import { ShareLocation } from '../../domain/useCases/ShareLocation';
import { TrackTrips } from '../../domain/useCases/TrackTrips';
import { AccompanimentBanner } from '../components/AccompanimentBanner';
import {
  LOCATION_PERMISSION_TEXT,
  LOCATION_PERMISSION_TITLE,
  NO_ROUTES_MESSAGE,
  tripSince,
} from '../tripMessages';
import { useProtegidoTripViewModel } from '../viewModels/useProtegidoTripViewModel';

type ProtegidoTripScreenProps = {
  listMyProtegidos: ListMyProtegidos;
  manageRoutes: ManageRoutes;
  trackTrips: TrackTrips;
  panicAlerts: PanicAlerts;
  shareLocation: ShareLocation;
  userName: string;
  onSignOut: () => void;
};

/**
 * W3 · Inicio del menor y W4 · Trayecto en curso (E4-01) con la banda de acompañamiento (E4-04).
 * W9 · Botón de pánico siempre visible, con o sin trayecto (E6-01, E6-03).
 * La ubicación se comparte solo con trayecto o alerta activos (E4-02, E6-05, RF-41).
 */
export function ProtegidoTripScreen({
  listMyProtegidos,
  manageRoutes,
  trackTrips,
  panicAlerts,
  shareLocation,
  userName,
  onSignOut,
}: ProtegidoTripScreenProps) {
  const vm = useProtegidoTripViewModel(listMyProtegidos, manageRoutes, trackTrips, shareLocation);
  const panic = usePanicViewModel(panicAlerts);
  const tripActive = vm.trip?.status === 'EN_CURSO';
  const alertActive = !!panic.alert;
  const { isLoading, reload } = vm;

  useEffect(() => {
    if (!isLoading) shareLocation.sync(tripActive, alertActive);
  }, [alertActive, isLoading, shareLocation, tripActive]);

  // E4-03: cuando el servidor cierra el trayecto al llegar, la pantalla se actualiza.
  useEffect(
    () =>
      shareLocation.onReport((report) => {
        if (report.tripClosed) reload();
      }),
    [reload, shareLocation],
  );
  const tripRoute = vm.trip ? vm.routes.find((route) => route.id === vm.trip?.routeId) : undefined;

  return (
    <View style={local.container}>
      <AccompanimentBanner trip={vm.trip} />
      <ScrollView contentContainerStyle={styles.screen}>
        <Text style={styles.title}>Hola, {userName} 👋</Text>

        {panic.alert && (
          <AlertPanel
            secondsLeft={panic.secondsLeft}
            canCancel={panic.canCancel}
            pin={panic.pin}
            onChangePin={panic.setPin}
            onCancel={panic.cancel}
            isCancelling={panic.isCancelling}
          />
        )}
        {!!panic.errorMessage && <Text style={styles.error}>{panic.errorMessage}</Text>}
        {!!panic.notice && <Text style={local.notice}>{panic.notice}</Text>}

        {vm.needsPermission && (
          <View style={local.permissionCard}>
            <Text style={styles.sectionTitle}>{LOCATION_PERMISSION_TITLE}</Text>
            <Text style={local.tripText}>{LOCATION_PERMISSION_TEXT}</Text>
            <Pressable
              style={styles.button}
              onPress={vm.confirmPermission}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Continuar</Text>
            </Pressable>
          </View>
        )}

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

        {!panic.alert && <PanicButton onTrigger={panic.trigger} disabled={panic.isSending} />}

        <Pressable style={styles.link} onPress={onSignOut} accessibilityRole="button">
          <Text style={styles.linkText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const local = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  notice: { fontSize: 16, color: colors.success, marginBottom: 8 },
  permissionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
});
