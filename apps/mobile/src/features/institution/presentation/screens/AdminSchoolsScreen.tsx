import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { School } from '../../domain/entities/School';
import { ManageSchools } from '../../domain/useCases/ManageSchools';
import { useAdminSchoolsViewModel } from '../viewModels/useAdminSchoolsViewModel';

type AdminSchoolsScreenProps = {
  manageSchools: ManageSchools;
  userName: string;
  onOpenSchool: (school: School) => void;
  onSignOut: () => void;
};

export function AdminSchoolsScreen({
  manageSchools,
  userName,
  onOpenSchool,
  onSignOut,
}: AdminSchoolsScreenProps) {
  const vm = useAdminSchoolsViewModel(manageSchools);

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Administración</Text>
      <Text style={styles.subtitle}>Hola, {userName}. Gestiona los colegios y su personal.</Text>

      <Text style={styles.sectionTitle}>Nuevo colegio</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del colegio"
        accessibilityLabel="Nombre del colegio"
        value={vm.values.name}
        onChangeText={(value) => vm.updateField('name', value)}
        editable={!vm.isSaving}
      />
      {!!vm.fieldErrors.name && <Text style={styles.error}>{vm.fieldErrors.name}</Text>}
      <TextInput
        style={styles.input}
        placeholder="NIT (ej. 900123456-7)"
        accessibilityLabel="NIT"
        value={vm.values.nit}
        onChangeText={(value) => vm.updateField('nit', value)}
        keyboardType="numbers-and-punctuation"
        editable={!vm.isSaving}
      />
      {!!vm.fieldErrors.nit && <Text style={styles.error}>{vm.fieldErrors.nit}</Text>}
      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
      <Pressable
        style={[styles.button, vm.isSaving && styles.buttonDisabled]}
        onPress={vm.createSchool}
        disabled={vm.isSaving}
        accessibilityRole="button"
      >
        {vm.isSaving ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.buttonText}>Crear colegio</Text>
        )}
      </Pressable>

      <Text style={styles.sectionTitle}>Colegios</Text>
      {vm.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : vm.schools.length === 0 ? (
        <Text style={styles.empty}>Todavía no hay colegios.</Text>
      ) : (
        vm.schools.map((school) => (
          <Pressable
            key={school.id}
            style={styles.row}
            onPress={() => onOpenSchool(school)}
            accessibilityRole="button"
            accessibilityLabel={`Ver personal de ${school.name}`}
          >
            <View>
              <Text style={styles.rowTitle}>{school.name}</Text>
              <Text style={styles.rowSubtitle}>NIT {school.nit}</Text>
            </View>
            <Text style={styles.linkText}>Personal ›</Text>
          </Pressable>
        ))
      )}

      <Pressable style={styles.link} onPress={onSignOut} accessibilityRole="button">
        <Text style={styles.linkText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}
