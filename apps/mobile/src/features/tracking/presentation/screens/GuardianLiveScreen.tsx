import { ActivityIndicator, ScrollView, Text } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { ManageRoutes } from '../../../routes/domain/useCases/ManageRoutes';
import { RouteMap } from '../../../routes/presentation/map/RouteMap';
import { DIRECTION_LABELS } from '../../../routes/presentation/routeMessages';
import { TrackTrips } from '../../domain/useCases/TrackTrips';
import { WatchLive } from '../../domain/useCases/WatchLive';
import { arrivedAtText, lastPositionText, NO_LIVE_POSITION, tripSince } from '../tripMessages';
import { useGuardianLiveViewModel } from '../viewModels/useGuardianLiveViewModel';
import { BackLink } from '../../../../core/theme/BackLink';

type GuardianLiveScreenProps = {
  watchLive: WatchLive;
  trackTrips: TrackTrips;
  manageRoutes: ManageRoutes;
  protegidoId: string;
  protegidoName: string;
  onBack: () => void;
};

/** W7 · El guardián sigue el trayecto en vivo (E4-02) y ve cuando llega (E4-03). */
export function GuardianLiveScreen({
  watchLive,
  trackTrips,
  manageRoutes,
  protegidoId,
  protegidoName,
  onBack,
}: GuardianLiveScreenProps) {
  const vm = useGuardianLiveViewModel(watchLive, trackTrips, manageRoutes, protegidoId);
  const live = vm.position
    ? { latitude: vm.position.latitude, longitude: vm.position.longitude }
    : null;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <BackLink label="Mis menores" onPress={onBack} />
      <Text style={styles.title}>
        {protegidoName}
        {vm.route ? ` · ${DIRECTION_LABELS[vm.route.direction]}` : ''}
      </Text>

      {vm.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          {vm.arrivedAt ? (
            <Text style={styles.subtitle}>{arrivedAtText(vm.arrivedAt)}</Text>
          ) : (
            vm.trip && <Text style={styles.subtitle}>{tripSince(vm.trip.startedAt)}</Text>
          )}
          <RouteMap
            points={vm.route?.points ?? []}
            corridorMeters={vm.route?.corridorMeters ?? 50}
            editable={false}
            live={live}
          />
          <Text style={styles.empty}>
            {vm.secondsAgo === null ? NO_LIVE_POSITION : lastPositionText(vm.secondsAgo)}
          </Text>
        </>
      )}
      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
    </ScrollView>
  );
}
