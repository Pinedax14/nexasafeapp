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
      <Pressable onPress={onBack} accessibilityRole="button">
        <Text style={styles.linkText}>‹ Volver</Text>
      </Pressable>
      <Text style={styles.title}>{alertTitle(vm.alert.childName)}</Text>
      <Text style={styles.subtitle}>
        Enviada a las {formatTime(vm.alert.createdAt)} · {STATUS_LABELS[vm.alert.status]}
        {vm.alert.classification ? ` · ${CLASSIFICATION_LABELS[vm.alert.classification]}` : ''}
      </Text>

      {vm.alert.status !== 'CERRADA' && (
        <>
          <RouteMap points={[]} corridorMeters={50} editable={false} live={live} />
          <Text style={styles.empty}>
            {vm.secondsAgo === null ? NO_LIVE_POSITION : lastPositionText(vm.secondsAgo)}
          </Text>
        </>
      )}

      {vm.canRespond && (
        <Pressable
          style={[styles.button, vm.isSaving && styles.buttonDisabled]}
          onPress={vm.respond}
          disabled={vm.isSaving}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Voy en camino</Text>
        </Pressable>
      )}

      {vm.canClose && !vm.isClosing && (
        <Pressable style={styles.link} onPress={vm.startClosing} accessibilityRole="button">
          <Text style={styles.linkText}>Cerrar alerta</Text>
        </Pressable>
      )}

      {vm.isClosing && (
        <View style={local.closeCard}>
          <Text style={styles.sectionTitle}>{CLOSE_PROMPT}</Text>
          {CLASSIFICATIONS.map((option) => (
            <Pressable
              key={option}
              style={local.option}
              onPress={() => vm.setClassification(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected: vm.classification === option }}
            >
              <Text style={local.optionText}>
                {vm.classification === option ? '◉' : '○'} {CLASSIFICATION_LABELS[option]}
              </Text>
            </Pressable>
          ))}
          <TextInput
            style={styles.input}
            value={vm.note}
            onChangeText={vm.setNote}
            placeholder={NOTE_LABEL}
            maxLength={MAX_NOTE_LENGTH}
            multiline
            accessibilityLabel="Nota del cierre"
          />
          <Pressable
            style={[styles.button, vm.isSaving && styles.buttonDisabled]}
            onPress={vm.close}
            disabled={vm.isSaving}
            accessibilityRole="button"
            accessibilityLabel="Confirmar cierre"
          >
            {vm.isSaving ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Cerrar alerta</Text>
            )}
          </Pressable>
          <Pressable style={styles.link} onPress={vm.cancelClosing} accessibilityRole="button">
            <Text style={styles.linkText}>Volver a la alerta</Text>
          </Pressable>
        </View>
      )}

      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
      {!!vm.notice && <Text style={local.notice}>{vm.notice}</Text>}

      <Text style={styles.sectionTitle}>Bitácora</Text>
      {vm.events.map((event, index) => (
        <Text key={`${event.at}-${index}`} style={local.event}>
          {formatTime(event.at)} · {EVENT_LABELS[event.type]} · {event.actor}
          {detailText(event.detail)}
        </Text>
      ))}
    </ScrollView>
  );
}

const local = StyleSheet.create({
  closeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 12,
  },
  option: { paddingVertical: 10 },
  optionText: { fontSize: 16, color: colors.text },
  notice: { fontSize: 16, color: colors.success, marginVertical: 8 },
  event: { fontSize: 15, color: colors.text, marginBottom: 6 },
});
