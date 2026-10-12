import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { Route, RouteDirection } from '../../domain/entities/Route';
import {
  CORRIDOR_MAX_METERS,
  CORRIDOR_MIN_METERS,
  ManageRoutes,
} from '../../domain/useCases/ManageRoutes';
import { RouteMap } from '../map/RouteMap';
import { DIRECTION_LABELS } from '../routeMessages';
import { useRouteEditorViewModel } from '../viewModels/useRouteEditorViewModel';

type RouteEditorScreenProps = {
  manageRoutes: ManageRoutes;
  protegidoId: string;
  direction: RouteDirection;
  route: Route | null;
  onSaved: () => void;
  onBack: () => void;
};

/** W2 · Editor de ruta: E3-01a (mapa), E3-02 (corredor) y E3-03 (duración). */
export function RouteEditorScreen({
  manageRoutes,
  protegidoId,
  direction,
  route,
  onSaved,
  onBack,
}: RouteEditorScreenProps) {
  const vm = useRouteEditorViewModel(manageRoutes, protegidoId, direction, route, onSaved);

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.link} onPress={onBack} accessibilityRole="button">
        <Text style={styles.linkText}>‹ Rutas</Text>
      </Pressable>
      <Text style={[styles.title, local.title]}>{DIRECTION_LABELS[direction]}</Text>

      <RouteMap
        points={vm.points}
        corridorMeters={vm.corridorMeters}
        editable={!vm.isSaving}
        onAddPoint={vm.addPoint}
      />
      <View style={local.hintRow}>
        <Text style={local.hint}>Toca el mapa para agregar puntos.</Text>
        <Pressable
          onPress={vm.undo}
          disabled={vm.points.length === 0 || vm.isSaving}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>Deshacer</Text>
        </Pressable>
      </View>
      {!!vm.fieldErrors.points && <Text style={styles.error}>{vm.fieldErrors.points}</Text>}

      <Text style={local.label}>Corredor: {vm.corridorMeters} m</Text>
      <View style={local.stepper}>
        <Pressable
          style={local.stepButton}
          onPress={vm.narrowCorridor}
          disabled={vm.corridorMeters <= CORRIDOR_MIN_METERS}
          accessibilityRole="button"
          accessibilityLabel="Reducir corredor"
        >
          <Text style={local.stepText}>−</Text>
        </Pressable>
        <Text style={local.range}>
          {CORRIDOR_MIN_METERS}–{CORRIDOR_MAX_METERS} m
        </Text>
        <Pressable
          style={local.stepButton}
          onPress={vm.widenCorridor}
          disabled={vm.corridorMeters >= CORRIDOR_MAX_METERS}
          accessibilityRole="button"
          accessibilityLabel="Ampliar corredor"
        >
          <Text style={local.stepText}>+</Text>
        </Pressable>
      </View>
      {!!vm.fieldErrors.corridor && <Text style={styles.error}>{vm.fieldErrors.corridor}</Text>}

      <Text style={local.label}>Duración esperada (min)</Text>
      <TextInput
        style={styles.input}
        placeholder="Entre 5 y 120"
        accessibilityLabel="Duración esperada en minutos"
        value={vm.duration}
        onChangeText={vm.updateDuration}
        keyboardType="number-pad"
        maxLength={3}
        editable={!vm.isSaving}
      />
      {!!vm.fieldErrors.duration && <Text style={styles.error}>{vm.fieldErrors.duration}</Text>}
      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}

      <Pressable
        style={[styles.button, vm.isSaving && styles.buttonDisabled]}
        onPress={vm.save}
        disabled={vm.isSaving}
        accessibilityRole="button"
      >
        {vm.isSaving ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.buttonText}>Guardar ruta</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  title: { marginBottom: 12 },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  hint: { color: colors.textMuted, flexShrink: 1 },
  label: { marginTop: 12, marginBottom: 8, fontSize: 16, fontWeight: '600', color: colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepButton: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: { color: colors.primary, fontSize: 24, fontWeight: '700' },
  range: { color: colors.textMuted },
});
