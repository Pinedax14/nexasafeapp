import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../../core/theme/Button';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { TextField } from '../../../../core/theme/TextField';
import { fonts } from '../../../../core/theme/typography';
import { RouteMap } from '../../../routes/presentation/map/RouteMap';
import { WatchLive } from '../../../tracking/domain/useCases/WatchLive';
import {
  formatTime,
  lastPositionText,
  NO_LIVE_POSITION,
} from '../../../tracking/presentation/tripMessages';
import {
  AlertSummary,
  CLASSIFICATIONS,
  Classification,
  ResponderRole,
} from '../../domain/entities/AlertSummary';
import { MAX_NOTE_LENGTH, RespondToAlerts } from '../../domain/useCases/RespondToAlerts';
import {
  alertTitle,
  CLASSIFICATION_LABELS,
  CLOSE_PROMPT,
  EVENT_LABELS,
  NOTE_LABEL,
  STATUS_LABELS,
} from '../alertMessages';
import { useAlertDetailViewModel } from '../viewModels/useAlertDetailViewModel';
import { BackLink } from '../../../../core/theme/BackLink';

type AlertDetailScreenProps = {
  respondToAlerts: RespondToAlerts;
  watchLive: WatchLive;
  alert: AlertSummary;
  role: ResponderRole;
  onBack: () => void;
};

const detailText = (detail: string | null) =>
  detail && detail in CLASSIFICATION_LABELS
    ? ` · ${CLASSIFICATION_LABELS[detail as Classification]}`
    : '';

/** W11 · Alerta recibida, W12 · Cierre clasificado y bitácora (E7-02, E9-01, E9-02). */
export function AlertDetailScreen({
  respondToAlerts,
  watchLive,
  alert,
  role,
  onBack,
}: AlertDetailScreenProps) {
  const vm = useAlertDetailViewModel(respondToAlerts, watchLive, alert, role);
  const live = vm.position
    ? { latitude: vm.position.latitude, longitude: vm.position.longitude }
    : null;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <BackLink label="Volver" onPress={onBack} />
      <Text style={styles.title}>{alertTitle(vm.alert.childName)}</Text>
      <Text style={styles.subtitle}>
        Enviada a las {formatTime(vm.alert.createdAt)} · {STATUS_LABELS[vm.alert.status]}
        {vm.alert.classification ? ` · ${CLASSIFICATION_LABELS[vm.alert.classification]}` : ''}
      </Text>

      {vm.alert.status !== 'CERRADA' && (
        <View style={[styles.card, local.mapCard]}>
          <RouteMap points={[]} corridorMeters={50} editable={false} live={live} />
          <View style={local.position}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <Text style={local.positionText}>
              {vm.secondsAgo === null ? NO_LIVE_POSITION : lastPositionText(vm.secondsAgo)}
            </Text>
          </View>
        </View>
      )}

      {vm.canRespond && (
        <Button title="Voy en camino" icon="navigate" onPress={vm.respond} loading={vm.isSaving} />
      )}

      {vm.canClose && !vm.isClosing && (
        <Button
          title="Cerrar alerta"
          icon="checkmark-done"
          onPress={vm.startClosing}
          variant="secondary"
        />
      )}

      {vm.isClosing && (
        <View style={[styles.card, local.closeCard]}>
          <Text style={local.closeTitle}>{CLOSE_PROMPT}</Text>
          {CLASSIFICATIONS.map((option) => {
            const selected = vm.classification === option;
            return (
              <Pressable
                key={option}
                style={[local.option, selected && local.optionSelected]}
                onPress={() => vm.setClassification(option)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={selected ? colors.primary : colors.textMuted}
                />
                <Text style={local.optionText}>{CLASSIFICATION_LABELS[option]}</Text>
              </Pressable>
            );
          })}
          <TextField
            style={local.note}
            value={vm.note}
            onChangeText={vm.setNote}
            placeholder={NOTE_LABEL}
            maxLength={MAX_NOTE_LENGTH}
            multiline
            accessibilityLabel="Nota del cierre"
          />
          <Button
            title="Cerrar alerta"
            onPress={vm.close}
            loading={vm.isSaving}
            accessibilityLabel="Confirmar cierre"
          />
          <Button title="Volver a la alerta" onPress={vm.cancelClosing} variant="ghost" />
        </View>
      )}

      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
      {!!vm.notice && <Text style={styles.notice}>{vm.notice}</Text>}

      <Text style={styles.sectionTitle}>Bitácora</Text>
      <View style={[styles.card, local.timeline]}>
        {vm.events.map((event, index) => (
          <View key={`${event.at}-${index}`} style={local.event}>
            <View style={local.rail}>
              <View style={local.dot} />
              {index < vm.events.length - 1 && <View style={local.line} />}
            </View>
            <Text style={local.eventText}>
              {formatTime(event.at)} · {EVENT_LABELS[event.type]} · {event.actor}
              {detailText(event.detail)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  mapCard: { padding: 8, marginBottom: 8 },
  position: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  positionText: { ...fonts.medium, fontSize: 14, color: colors.textMuted },
  closeCard: { marginVertical: 12 },
  closeTitle: { ...fonts.bold, fontSize: 18, color: colors.text, marginBottom: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionText: { ...fonts.medium, fontSize: 16, color: colors.text },
  note: { minHeight: 80, textAlignVertical: 'top' },
  timeline: { paddingVertical: 16 },
  event: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, backgroundColor: colors.primary },
  line: { flex: 1, width: 2, marginVertical: 2, backgroundColor: colors.border },
  eventText: {
    ...fonts.regular,
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
    paddingBottom: 14,
  },
});
