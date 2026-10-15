import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { ALERT_ACTIVE_MESSAGE, ALERT_SENT_TITLE, CANCEL_PROMPT } from '../alertMessages';

type AlertPanelProps = {
  secondsLeft: number;
  canCancel: boolean;
  pin: string;
  onChangePin: (pin: string) => void;
  onCancel: () => void;
  isCancelling: boolean;
};

/** W9 · Alerta enviada con la cuenta regresiva para cancelarla con el PIN (E6-03, RF-22). */
export function AlertPanel({
  secondsLeft,
  canCancel,
  pin,
  onChangePin,
  onCancel,
  isCancelling,
}: AlertPanelProps) {
  return (
    <View style={local.card}>
      <Text style={local.title}>{ALERT_SENT_TITLE}</Text>
      {canCancel ? (
        <>
          <Text style={local.text}>{CANCEL_PROMPT}</Text>
          <Text
            style={local.countdown}
            accessibilityLabel={`${secondsLeft} segundos para cancelar`}
          >
            {secondsLeft} s
          </Text>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={onChangePin}
            placeholder="PIN"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            accessibilityLabel="PIN para cancelar"
          />
          <Pressable
            style={[styles.button, isCancelling && styles.buttonDisabled]}
            onPress={onCancel}
            disabled={isCancelling}
            accessibilityRole="button"
          >
            {isCancelling ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Cancelar</Text>
            )}
          </Pressable>
        </>
      ) : (
        <Text style={local.text}>{ALERT_ACTIVE_MESSAGE}</Text>
      )}
    </View>
  );
}

const local = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.error,
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.error, marginBottom: 8 },
  text: { fontSize: 16, color: colors.text, marginBottom: 8 },
  countdown: { fontSize: 40, fontWeight: '800', color: colors.error, textAlign: 'center' },
});
