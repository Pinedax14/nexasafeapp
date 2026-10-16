import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../../core/theme/Button';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { fonts, shadow, TOP_INSET } from '../../../../core/theme/typography';
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
  const refreshAlert = panic.refresh;

  useEffect(() => {
    if (!isLoading) shareLocation.sync(tripActive, alertActive);
  }, [alertActive, isLoading, shareLocation, tripActive]);

  // E4-03: cuando el servidor cierra el trayecto al llegar, la pantalla se actualiza.
  useEffect(
    () =>
      shareLocation.onReport((report) => {
        if (report.tripClosed) reload();
        // E11-04: si cerraron la alerta, la app deja de capturar y sale del modo discreto.
        if (!report.alertActive) refreshAlert();
      }),
    [refreshAlert, reload, shareLocation],
  );
  const tripRoute = vm.trip ? vm.routes.find((route) => route.id === vm.trip?.routeId) : undefined;

  return (
    <View style={local.container}>
      <AccompanimentBanner trip={vm.trip} discreet={panic.discreet} />
      <ScrollView contentContainerStyle={[styles.screen, local.content]}>
        <Text style={styles.title}>Hola, {userName} 👋</Text>

        {/* E6-04 (D30): en modo discreto no se ve nada que delate la alerta. */}
        {!panic.discreet && (
          <>
            {panic.alert && (
              <AlertPanel
                secondsLeft={panic.secondsLeft}
                pin={panic.pin}
                onChangePin={panic.setPin}
                onCancel={panic.cancel}
                isCancelling={panic.isCancelling}
              />
            )}
            {!!panic.errorMessage && <Text style={styles.error}>{panic.errorMessage}</Text>}
            {!!panic.notice && <Text style={styles.notice}>{panic.notice}</Text>}

            {vm.needsPermission && (
              <View style={[styles.card, local.block]}>
                <View style={local.iconBubble}>
                  <Ionicons name="location" size={26} color={colors.primary} />
                </View>
                <Text style={local.cardTitle}>{LOCATION_PERMISSION_TITLE}</Text>
                <Text style={local.cardText}>{LOCATION_PERMISSION_TEXT}</Text>
                <Button title="Continuar" onPress={vm.confirmPermission} />
              </View>
            )}

            {vm.isLoading ? (
              <ActivityIndicator color={colors.primary} style={local.block} />
            ) : vm.trip ? (
              <View style={[local.tripCard, local.block]}>
                <View style={local.tripHeader}>
                  <Ionicons name="navigate-circle" size={30} color={colors.success} />
                  <Text style={local.cardTitle}>
                    {tripRoute ? DIRECTION_LABELS[tripRoute.direction] : 'Trayecto en curso'}
                  </Text>
                </View>
                <Text style={local.cardText}>{tripSince(vm.trip.startedAt)}</Text>
                <Text style={local.cardText}>Tu acudiente sabe que vas en camino.</Text>
              </View>
            ) : vm.routes.length === 0 ? (
              !vm.routesFailed && <Text style={styles.empty}>{NO_ROUTES_MESSAGE}</Text>
            ) : (
              <View style={local.block}>
                <Text style={styles.sectionTitle}>¿A dónde vas?</Text>
                {vm.routes.map((route) => (
                  <Pressable
                    key={route.id}
                    style={({ pressed }) => [
                      local.routeButton,
                      pressed && local.pressed,
                      vm.isStarting && styles.buttonDisabled,
                    ]}
                    onPress={() => vm.start(route)}
                    disabled={vm.isStarting}
                    accessibilityRole="button"
                    accessibilityLabel={`Iniciar trayecto ${DIRECTION_LABELS[route.direction]}`}
                  >
                    <View style={local.routeIcon}>
                      <Ionicons
                        name={route.direction === 'CASA_COLEGIO' ? 'school' : 'home'}
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={local.routeButtonText}>{DIRECTION_LABELS[route.direction]}</Text>
                    <Ionicons name="play-circle" size={32} color={colors.onPrimary} />
                  </Pressable>
                ))}
                <Text style={local.hint}>
                  Un toque inicia el trayecto y tu acudiente te acompaña.
                </Text>
              </View>
            )}

            {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}

            {!panic.alert && <PanicButton onTrigger={panic.trigger} disabled={panic.isSending} />}
          </>
        )}

        <Button title="Cerrar sesión" icon="log-out-outline" onPress={onSignOut} variant="ghost" />
      </ScrollView>
    </View>
  );
}

const local = StyleSheet.create({
  container: { flex: 1, paddingTop: TOP_INSET, backgroundColor: colors.background },
  content: { paddingTop: 20 },
  block: { marginTop: 16 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 76,
    marginBottom: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.primary,
    ...shadow(5),
  },
  routeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onPrimary,
  },
  routeButtonText: { ...fonts.bold, flex: 1, color: colors.onPrimary, fontSize: 19 },
  hint: { ...fonts.regular, color: colors.textMuted, marginTop: 2, fontSize: 14 },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: 12,
  },
  tripCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: colors.successBackground,
  },
  tripHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cardTitle: { ...fonts.bold, fontSize: 18, color: colors.text, marginBottom: 4 },
  cardText: { ...fonts.regular, fontSize: 16, lineHeight: 22, color: colors.text, marginBottom: 4 },
});
