import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { Route, ROUTE_DIRECTIONS, RouteDirection } from '../../domain/entities/Route';
import { ManageRoutes } from '../../domain/useCases/ManageRoutes';
import { DIRECTION_LABELS, ROUTE_NOT_DEFINED } from '../routeMessages';
import { useRoutesViewModel } from '../viewModels/useRoutesViewModel';

type RoutesScreenProps = {
  manageRoutes: ManageRoutes;
  protegidoId: string;
  protegidoName: string;
  onEditRoute: (direction: RouteDirection, route: Route | null) => void;
  onBack: () => void;
};

export const routeSummary = (route: Route) =>
  `Corredor ${route.corridorMeters} m · ${route.expectedMinutes} min`;

/** W1 · Rutas del menor (E3-01a, D12): hasta 2 rutas, ida y regreso. */
export function RoutesScreen({
  manageRoutes,
  protegidoId,
  protegidoName,
  onEditRoute,
  onBack,
}: RoutesScreenProps) {
  const vm = useRoutesViewModel(manageRoutes, protegidoId);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Pressable style={styles.link} onPress={onBack} accessibilityRole="button">
        <Text style={styles.linkText}>‹ Mis menores</Text>
      </Pressable>
      <Text style={styles.title}>Rutas de {protegidoName}</Text>
      <Text style={styles.subtitle}>Hasta 2 rutas: ida y regreso.</Text>

      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
      {vm.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        ROUTE_DIRECTIONS.map((direction) => {
          const route = vm.routes[direction] ?? null;
          return (
            <Pressable
              key={direction}
              style={styles.row}
              onPress={() => onEditRoute(direction, route)}
              accessibilityRole="button"
              accessibilityLabel={`Ruta ${DIRECTION_LABELS[direction]}`}
            >
              <View>
                <Text style={styles.rowTitle}>{DIRECTION_LABELS[direction]}</Text>
                <Text style={styles.rowSubtitle}>
                  {route ? routeSummary(route) : ROUTE_NOT_DEFINED}
                </Text>
              </View>
              <Text style={styles.linkText}>›</Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}
