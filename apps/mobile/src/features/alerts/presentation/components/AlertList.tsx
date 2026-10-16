import { Pressable, Text, View } from 'react-native';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { formatTime } from '../../../tracking/presentation/tripMessages';
import { AlertSummary } from '../../domain/entities/AlertSummary';
import { CLASSIFICATION_LABELS, STATUS_LABELS } from '../alertMessages';

type AlertListProps = {
  alerts: AlertSummary[];
  emptyText: string;
  onOpen: (alert: AlertSummary) => void;
};

/** Filas "Menor · 6:51 · Enviada ›" que abren la alerta (W11, W13). */
export function AlertList({ alerts, emptyText, onOpen }: AlertListProps) {
  if (alerts.length === 0) return <Text style={styles.empty}>{emptyText}</Text>;
  return (
    <View>
      {alerts.map((alert) => (
        <Pressable
          key={alert.id}
          style={styles.row}
          onPress={() => onOpen(alert)}
          accessibilityRole="button"
          accessibilityLabel={`Abrir alerta de ${alert.childName}`}
        >
          <View>
            <Text style={styles.rowTitle}>🚨 {alert.childName}</Text>
            <Text style={styles.rowSubtitle}>
              {formatTime(alert.createdAt)} · {STATUS_LABELS[alert.status]}
              {alert.classification ? ` · ${CLASSIFICATION_LABELS[alert.classification]}` : ''}
            </Text>
          </View>
          <Text style={styles.linkText}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}
