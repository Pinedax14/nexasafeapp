import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { School } from '../../domain/entities/School';
import { ManageSchools } from '../../domain/useCases/ManageSchools';
import { useAdminSchoolsViewModel } from '../viewModels/useAdminSchoolsViewModel';
import { Button } from '../../../../core/theme/Button';
import { TextField } from '../../../../core/theme/TextField';

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
      <View style={local.header}>
        <View style={local.headerText}>
          <Text style={styles.title}>Administración</Text>
          <Text style={styles.subtitle}>
            Hola, {userName}. Gestiona los colegios y su personal.
          </Text>
        </View>
        {/* El listado de colegios puede tener cientos de filas (catálogo real de Bogotá):
            cerrar sesión no puede depender de bajar hasta el final de la pantalla. */}
        <Button title="Cerrar sesión" icon="log-out-outline" onPress={onSignOut} variant="ghost" />
      </View>

      <Text style={styles.sectionTitle}>Nuevo colegio</Text>
      <TextField
        icon="business-outline"
        placeholder="Nombre del colegio"
        accessibilityLabel="Nombre del colegio"
        value={vm.values.name}
        onChangeText={(value) => vm.updateField('name', value)}
        editable={!vm.isSaving}
      />
      {!!vm.fieldErrors.name && <Text style={styles.error}>{vm.fieldErrors.name}</Text>}
      <TextField
        icon="barcode-outline"
        placeholder="NIT (ej. 900123456-7)"
        accessibilityLabel="NIT"
        value={vm.values.nit}
        onChangeText={(value) => vm.updateField('nit', value)}
        keyboardType="numbers-and-punctuation"
        editable={!vm.isSaving}
      />
      {!!vm.fieldErrors.nit && <Text style={styles.error}>{vm.fieldErrors.nit}</Text>}
      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
      <Button title="Crear colegio" onPress={vm.createSchool} loading={vm.isSaving} />

      <Text style={styles.sectionTitle}>Colegios</Text>
      {!vm.isLoading && vm.hasSchools && (
        <TextField
          icon="search-outline"
          placeholder="Buscar colegio por nombre"
          accessibilityLabel="Buscar colegio"
          value={vm.schoolQuery}
          onChangeText={vm.updateSchoolQuery}
        />
      )}
      {vm.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : !vm.hasSchools ? (
        <Text style={styles.empty}>Todavía no hay colegios.</Text>
      ) : vm.schools.length === 0 ? (
        <Text style={styles.empty}>{`Ningún colegio coincide con "${vm.schoolQuery}".`}</Text>
      ) : (
        vm.schools.map((school) => (
          <Pressable
            key={school.id}
            style={styles.row}
            onPress={() => onOpenSchool(school)}
            accessibilityRole="button"
            accessibilityLabel={`Ver personal de ${school.name}`}
          >
            <View style={local.info}>
              <Text style={styles.rowTitle}>{school.name}</Text>
              <Text style={styles.rowSubtitle}>NIT {school.nit}</Text>
            </View>
            <Text style={styles.linkText}>Personal ›</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const local = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerText: { flex: 1 },
  // Nombres de colegio largos (ej. catálogo real de Bogotá) deben partirse en
  // varias líneas en vez de empujar "Personal ›" fuera de la tarjeta.
  info: { flex: 1, marginRight: 12 },
});
