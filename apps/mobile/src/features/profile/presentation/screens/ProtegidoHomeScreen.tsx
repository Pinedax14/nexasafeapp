import { Pressable, ScrollView, Text } from 'react-native';
import { formStyles as styles } from '../../../../core/theme/formStyles';

type ProtegidoHomeScreenProps = {
  userName: string;
  onSignOut: () => void;
};

/** Inicio del protegido. Iniciar un trayecto acompañado llega en el Sprint 02 (E4-01). */
export function ProtegidoHomeScreen({ userName, onSignOut }: ProtegidoHomeScreenProps) {
  return (
    <ScrollView contentContainerStyle={[styles.screen, { justifyContent: 'center' }]}>
      <Text style={styles.title}>Hola, {userName}</Text>
      <Text style={styles.subtitle}>
        Ya tienes NexaSafe. Pronto podrás iniciar tus trayectos acompañados desde aquí.
      </Text>
      <Pressable style={styles.link} onPress={onSignOut} accessibilityRole="button">
        <Text style={styles.linkText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}
