import { ActivityIndicator, ScrollView, Switch, Text, View } from 'react-native';
import { MIN_PASSWORD_LENGTH } from '../../../auth/domain/useCases/RegisterGuardian';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { School } from '../../domain/entities/School';
import { ManageStaff } from '../../domain/useCases/ManageStaff';
import { useSchoolStaffViewModel } from '../viewModels/useSchoolStaffViewModel';
import { BackLink } from '../../../../core/theme/BackLink';
import { Button } from '../../../../core/theme/Button';
import { TextField } from '../../../../core/theme/TextField';

type SchoolStaffScreenProps = {
  manageStaff: ManageStaff;
  school: School;
  onBack: () => void;
};

export function SchoolStaffScreen({ manageStaff, school, onBack }: SchoolStaffScreenProps) {
  const vm = useSchoolStaffViewModel(manageStaff, school.id);

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <BackLink label="Colegios" onPress={onBack} />
      <Text style={styles.title}>{school.name}</Text>
      <Text style={styles.subtitle}>Personal del puesto de control</Text>

      <Text style={styles.sectionTitle}>Registrar personal</Text>
      <TextField
        icon="person-outline"
        placeholder="Nombre completo"
        accessibilityLabel="Nombre completo"
        value={vm.values.name}
        onChangeText={(value) => vm.updateField('name', value)}
        editable={!vm.isSaving}
      />
      {!!vm.fieldErrors.name && <Text style={styles.error}>{vm.fieldErrors.name}</Text>}
      <TextField
        icon="briefcase-outline"
        placeholder="Cargo (opcional)"
        accessibilityLabel="Cargo"
        value={vm.values.position}
        onChangeText={(value) => vm.updateField('position', value)}
        editable={!vm.isSaving}
      />
      {!!vm.fieldErrors.position && <Text style={styles.error}>{vm.fieldErrors.position}</Text>}
      <TextField
        icon="mail-outline"
        placeholder="Correo"
        accessibilityLabel="Correo"
        value={vm.values.email}
        onChangeText={(value) => vm.updateField('email', value)}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        editable={!vm.isSaving}
      />
      {!!vm.fieldErrors.email && <Text style={styles.error}>{vm.fieldErrors.email}</Text>}
      <TextField
        icon="lock-closed-outline"
        placeholder={`Contraseña temporal (mínimo ${MIN_PASSWORD_LENGTH} caracteres)`}
        accessibilityLabel="Contraseña temporal"
        value={vm.values.temporaryPassword}
        onChangeText={(value) => vm.updateField('temporaryPassword', value)}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        editable={!vm.isSaving}
      />
      {!!vm.fieldErrors.temporaryPassword && (
        <Text style={styles.error}>{vm.fieldErrors.temporaryPassword}</Text>
      )}
      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}
      {!!vm.notice && <Text style={styles.notice}>{vm.notice}</Text>}
      <Button title="Registrar personal" onPress={vm.registerStaff} loading={vm.isSaving} />

      <Text style={styles.sectionTitle}>Personal registrado</Text>
      {vm.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : vm.staff.length === 0 ? (
        <Text style={styles.empty}>Este colegio todavía no tiene personal.</Text>
      ) : (
        vm.staff.map((member) => (
          <View key={member.id} style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{member.name}</Text>
              <Text style={styles.rowSubtitle}>
                {member.position ?? 'Sin cargo'} · {member.active ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
            <Switch
              value={member.active}
              onValueChange={() => vm.toggleActive(member)}
              accessibilityLabel={`${member.active ? 'Desactivar' : 'Activar'} a ${member.name}`}
            />
          </View>
        ))
      )}
    </ScrollView>
  );
}
