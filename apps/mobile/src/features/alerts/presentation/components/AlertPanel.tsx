import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../../core/theme/Button';
import { colors } from '../../../../core/theme/colors';
import { TextField } from '../../../../core/theme/TextField';
import { fonts, shadow } from '../../../../core/theme/typography';
import { ALERT_SENT_TITLE, CANCEL_PROMPT } from '../alertMessages';

type AlertPanelProps = {
  secondsLeft: number;
  pin: string;
  onChangePin: (pin: string) => void;
  onCancel: () => void;
  isCancelling: boolean;
};

/**
 * W9 · Alerta enviada con la cuenta regresiva para cancelarla con el PIN (E6-03, RF-22).
 * Pasada la ventana la pantalla entra en modo discreto (E6-04) y este panel ya no se muestra.
 */
export function AlertPanel({
  secondsLeft,
  pin,
  onChangePin,
  onCancel,
  isCancelling,
}: AlertPanelProps) {
  return (
    <View style={local.card}>
      <View style={local.header}>
        <Ionicons name="warning" size={26} color={colors.error} />
        <Text style={local.title}>{ALERT_SENT_TITLE}</Text>
      </View>
      <Text style={local.text}>{CANCEL_PROMPT}</Text>
      <View style={local.countdownCircle}>
        <Text style={local.countdown} accessibilityLabel={`${secondsLeft} segundos para cancelar`}>
          {secondsLeft} s
        </Text>
      </View>
      <TextField
        icon="keypad-outline"
        style={local.pin}
        value={pin}
        onChangeText={onChangePin}
        placeholder="PIN"
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        accessibilityLabel="PIN para cancelar"
      />
      <Button title="Cancelar" variant="danger" onPress={onCancel} loading={isCancelling} />
    </View>
  );
}

const local = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: colors.surface,
    marginBottom: 16,
    ...shadow(4),
    shadowColor: colors.error,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { ...fonts.extrabold, fontSize: 22, color: colors.error },
  text: { ...fonts.regular, fontSize: 16, lineHeight: 22, color: colors.text, marginBottom: 12 },
  countdownCircle: {
    alignSelf: 'center',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: colors.error,
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  countdown: { ...fonts.extrabold, fontSize: 32, color: colors.error },
  pin: { ...fonts.bold, fontSize: 22, letterSpacing: 12 },
});
