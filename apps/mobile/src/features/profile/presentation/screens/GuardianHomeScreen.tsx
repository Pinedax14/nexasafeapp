import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { Protegido } from '../../domain/entities/Protegido';
import { ListMyProtegidos } from '../../domain/useCases/ListMyProtegidos';
import { STATUS_LABELS } from '../profileMessages';
import { useGuardianHomeViewModel } from '../viewModels/useGuardianHomeViewModel';

type GuardianHomeScreenProps = {
  listMyProtegidos: ListMyProtegidos;
  userName: string;
  onRegisterProtegido: () => void;
  onAssignPin: (protegido: Protegido) => void;
  onOpenRoutes: (protegido: Protegido) => void;
  onSignOut: () => void;
};

export function GuardianHomeScreen({
  listMyProtegidos,
  userName,
  onRegisterProtegido,
  onAssignPin,
  onOpenRoutes,
  onSignOut,
}: GuardianHomeScreenProps) {
  const vm = useGuardianHomeViewModel(listMyProtegidos);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Hola, {userName}</Text>
      <Text style={styles.subtitle}>Los menores que acompañas con NexaSafe.</Text>

      <Pressable style={styles.button} onPress={onRegisterProtegido} accessibilityRole="button">
        <Text style={styles.buttonText}>Registrar menor</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Mis menores</Text>
      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
      {vm.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : vm.protegidos.length === 0 ? (
        <Text style={styles.empty}>Todavía no has registrado ningún menor.</Text>
      ) : (
        vm.protegidos.map((protegido) => (
          <View key={protegido.id} style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{protegido.name}</Text>
              <Text style={styles.rowSubtitle}>{STATUS_LABELS[protegido.status]}</Text>
            </View>
            {protegido.status === 'ACTIVO' && (
              <View style={local.actions}>
                <Pressable
                  onPress={() => onOpenRoutes(protegido)}
                  accessibilityRole="button"
                  accessibilityLabel={`Rutas de ${protegido.name}`}
                >
                  <Text style={styles.linkText}>Rutas ›</Text>
                </Pressable>
                <Pressable
                  onPress={() => onAssignPin(protegido)}
                  accessibilityRole="button"
                  accessibilityLabel={`Asignar PIN a ${protegido.name}`}
                >
                  <Text style={styles.linkText}>PIN ›</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))
      )}

      <Pressable style={styles.link} onPress={onSignOut} accessibilityRole="button">
        <Text style={styles.linkText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 16 },
});
