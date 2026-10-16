import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Button } from '../../../../core/theme/Button';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { fonts } from '../../../../core/theme/typography';
import { RouteMap } from '../../../routes/presentation/map/RouteMap';
import { WatchLive } from '../../../tracking/domain/useCases/WatchLive';
import { AlertSummary, DailyCountKey, DayTotals } from '../../domain/entities/AlertSummary';
import { RespondToAlerts } from '../../domain/useCases/RespondToAlerts';
import { CHART_TITLE, COUNT_LABELS, NO_ACTIVE_ALERTS } from '../alertMessages';
import { AlertList } from '../components/AlertList';
import { useControlRoomViewModel } from '../viewModels/useControlRoomViewModel';

type ControlRoomScreenProps = {
  respondToAlerts: RespondToAlerts;
  watchLive: WatchLive;
  userName: string;
  onOpenAlert: (alert: AlertSummary) => void;
  onOpenEnrollments: () => void;
  onSignOut: () => void;
};

export const COUNT_COLORS: Record<DailyCountKey, string> = {
  FALSA_ALARMA: '#F59E0B',
  SITUACION_RESUELTA: colors.success,
  REMITIDA_A_AUTORIDAD: colors.primary,
  SIN_CERRAR: colors.error,
};
const COUNT_ORDER: DailyCountKey[] = [
  'SIN_CERRAR',
  'FALSA_ALARMA',
  'SITUACION_RESUELTA',
  'REMITIDA_A_AUTORIDAD',
];

/** "15/10" a partir de "2026-10-15". */
export const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/** Texto del día tocado en el gráfico: "15/10: 2 Falsa alarma, 1 Sin cerrar". */
export function dayDetail(day: DayTotals): string {
  const parts = COUNT_ORDER.filter((key) => day.byClassification[key] > 0).map(
    (key) => `${day.byClassification[key]} ${COUNT_LABELS[key]}`,
  );
  return `${shortDay(day.day)}: ${parts.length > 0 ? parts.join(', ') : 'sin alertas'}`;
}

/** W13 · Puesto de control del colegio (E8-01, RF-29, D26). */
export function ControlRoomScreen({
  respondToAlerts,
  watchLive,
  userName,
  onOpenAlert,
  onOpenEnrollments,
  onSignOut,
}: ControlRoomScreenProps) {
  const vm = useControlRoomViewModel(respondToAlerts, watchLive);

  const stackData = vm.days.map((day, index) => ({
    label: shortDay(day.day),
    stacks: COUNT_ORDER.filter((key) => day.byClassification[key] > 0).map((key) => ({
      value: day.byClassification[key],
      color: COUNT_COLORS[key],
    })),
    onPress: () => vm.selectDay(index),
  }));

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Puesto de control</Text>
      <Text style={styles.subtitle}>Hola, {userName}</Text>
      <Button
        title="Matrículas pendientes ›"
        icon="document-text-outline"
        onPress={onOpenEnrollments}
        variant="secondary"
      />

      <Text style={styles.sectionTitle}>Alertas activas</Text>
      {vm.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <View style={[styles.card, local.mapCard]}>
            <RouteMap points={[]} corridorMeters={50} editable={false} alerts={vm.positions} />
          </View>
          <AlertList alerts={vm.alerts} emptyText={NO_ACTIVE_ALERTS} onOpen={onOpenAlert} />
        </>
      )}

      <Text style={styles.sectionTitle}>{CHART_TITLE}</Text>
      <View testID="grafico-alertas" style={[styles.card, local.chartCard]}>
        <BarChart
          stackData={stackData}
          barWidth={14}
          spacing={10}
          noOfSections={4}
          yAxisThickness={0}
          xAxisLabelTextStyle={local.axisLabel}
          isAnimated
        />
      </View>
      <View style={local.legend}>
        {COUNT_ORDER.map((key) => (
          <View key={key} style={local.legendItem}>
            <View style={[local.legendDot, { backgroundColor: COUNT_COLORS[key] }]} />
            <Text style={local.legendText}>{COUNT_LABELS[key]}</Text>
          </View>
        ))}
      </View>
      {vm.selectedDay && <Text style={local.detail}>{dayDetail(vm.selectedDay)}</Text>}

      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
      <Button title="Cerrar sesión" icon="log-out-outline" onPress={onSignOut} variant="ghost" />
    </ScrollView>
  );
}

const local = StyleSheet.create({
  mapCard: { padding: 8, marginBottom: 12 },
  chartCard: { paddingHorizontal: 8, overflow: 'hidden' },
  axisLabel: { ...fonts.regular, fontSize: 9, color: colors.textMuted },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...fonts.medium, fontSize: 13, color: colors.text },
  detail: {
    ...fonts.semibold,
    fontSize: 15,
    color: colors.primaryDark,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
  },
});
