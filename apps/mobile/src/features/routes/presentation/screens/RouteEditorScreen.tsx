import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { fonts, TOUCH_TARGET } from '../../../../core/theme/typography';
import { Route, RouteDirection } from '../../domain/entities/Route';
import {
  CORRIDOR_MAX_METERS,
  CORRIDOR_MIN_METERS,
  ManageRoutes,
} from '../../domain/useCases/ManageRoutes';
import { RouteMap } from '../map/RouteMap';
import { DIRECTION_LABELS, ROUTE_READ_ONLY_NOTICE } from '../routeMessages';
import { useRouteEditorViewModel } from '../viewModels/useRouteEditorViewModel';
import { BackLink } from '../../../../core/theme/BackLink';
import { Button } from '../../../../core/theme/Button';
import { TextField } from '../../../../core/theme/TextField';

type RouteEditorScreenProps = {
  manageRoutes: ManageRoutes;
  protegidoId: string;
  direction: RouteDirection;
  route: Route | null;
  /** E3-01b: sin conexión la ruta de la caché solo se puede ver. */
  readOnly?: boolean;
  onSaved: () => void;
  onBack: () => void;
};

/** W2 · Editor de ruta: E3-01a (mapa), E3-02 (corredor), E3-03 (duración) y E3-01b (lectura sin conexión). */
export function RouteEditorScreen({
  manageRoutes,
  protegidoId,
  direction,
  route,
  readOnly = false,
  onSaved,
  onBack,
}: RouteEditorScreenProps) {
  const vm = useRouteEditorViewModel(manageRoutes, protegidoId, direction, route, onSaved);
  const locked = readOnly || vm.isSaving;

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <BackLink label="Rutas" onPress={onBack} />
      <Text style={[styles.title, local.title]}>{DIRECTION_LABELS[direction]}</Text>

      <RouteMap
        points={vm.points}
        corridorMeters={vm.corridorMeters}
        editable={!locked}
        onAddPoint={vm.addPoint}
      />
      {readOnly ? (
        <Text style={styles.notice}>{ROUTE_READ_ONLY_NOTICE}</Text>
      ) : (
        <View style={local.hintRow}>
          <Text style={local.hint}>Toca el mapa para agregar puntos.</Text>
          <Pressable
            onPress={vm.undo}
            disabled={vm.points.length === 0 || vm.isSaving}
            accessibilityRole="button"
            accessibilityLabel="Deshacer"
            hitSlop={8}
            style={({ pressed }) => [local.undo, pressed && local.pressed]}
          >
            <Ionicons name="arrow-undo" size={18} color={colors.primary} />
            <Text style={styles.linkText}>Deshacer</Text>
          </Pressable>
        </View>
      )}
      {!!vm.fieldErrors.points && <Text style={styles.error}>{vm.fieldErrors.points}</Text>}

      <Text style={local.label}>Corredor: {vm.corridorMeters} m</Text>
      <View style={local.stepper}>
        <Pressable
          style={local.stepButton}
          onPress={vm.narrowCorridor}
          disabled={locked || vm.corridorMeters <= CORRIDOR_MIN_METERS}
          accessibilityRole="button"
          accessibilityLabel="Reducir corredor"
        >
          <Ionicons name="remove" size={26} color={colors.primary} />
        </Pressable>
        <Text style={local.range}>
          {CORRIDOR_MIN_METERS}–{CORRIDOR_MAX_METERS} m
        </Text>
        <Pressable
          style={local.stepButton}
          onPress={vm.widenCorridor}
          disabled={locked || vm.corridorMeters >= CORRIDOR_MAX_METERS}
          accessibilityRole="button"
          accessibilityLabel="Ampliar corredor"
        >
          <Ionicons name="add" size={26} color={colors.primary} />
        </Pressable>
      </View>
      {!!vm.fieldErrors.corridor && <Text style={styles.error}>{vm.fieldErrors.corridor}</Text>}

      <Text style={local.label}>Duración esperada (min)</Text>
      <TextField
        icon="time-outline"
        placeholder="Entre 5 y 120"
        accessibilityLabel="Duración esperada en minutos"
        value={vm.duration}
        onChangeText={vm.updateDuration}
        keyboardType="number-pad"
        maxLength={3}
        editable={!locked}
      />
      {!!vm.fieldErrors.duration && <Text style={styles.error}>{vm.fieldErrors.duration}</Text>}
      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}

      {!readOnly && <Button title="Guardar ruta" onPress={vm.save} loading={vm.isSaving} />}
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
  hint: { ...fonts.regular, color: colors.textMuted, flexShrink: 1 },
  // A4 (Sprint 02): área táctil de 48 dp para no fallar el toque.
  undo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: TOUCH_TARGET,
    minWidth: TOUCH_TARGET,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
  pressed: { opacity: 0.7 },
  label: { ...fonts.semibold, marginTop: 16, marginBottom: 8, fontSize: 16, color: colors.text },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  range: { ...fonts.medium, color: colors.textMuted },
});
