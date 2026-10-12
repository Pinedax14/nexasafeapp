import { Pressable, ScrollView, Text } from 'react-native';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { NO_ALERTS_MESSAGE, SUPPORT_SCOPE_NOTICE } from '../networkMessages';

type SupportHomeScreenProps = {
  userName: string;
  onSignOut: () => void;
};

/** Inicio del contacto de apoyo (E2-01). Las alertas llegan en el Sprint 03 (E6, E7). */
export function SupportHomeScreen({ userName, onSignOut }: SupportHomeScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Hola, {userName}</Text>
      <Text style={styles.subtitle}>{SUPPORT_SCOPE_NOTICE}</Text>
      <Text style={styles.sectionTitle}>Alertas</Text>
      <Text style={styles.empty}>{NO_ALERTS_MESSAGE}</Text>
      <Pressable style={styles.link} onPress={onSignOut} accessibilityRole="button">
        <Text style={styles.linkText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}
