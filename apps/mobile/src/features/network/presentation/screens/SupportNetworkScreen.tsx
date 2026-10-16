import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { formStyles as styles } from '../../../../core/theme/formStyles';
import { contactStatus } from '../../domain/entities/SupportContact';
import { SupportNetwork } from '../../domain/useCases/SupportNetwork';
import { contactLabel, contactStatusLabel, INVITE_NOTICE } from '../networkMessages';
import { ShareText, useSupportNetworkViewModel } from '../viewModels/useSupportNetworkViewModel';
import { BackLink } from '../../../../core/theme/BackLink';
import { Button } from '../../../../core/theme/Button';

type SupportNetworkScreenProps = {
  supportNetwork: SupportNetwork;
  protegidoId: string;
  protegidoName: string;
  guardianName: string;
  share: ShareText;
  now?: () => Date;
  onBack: () => void;
};

/** W5 · Red de apoyo del menor (E2-01, D8). */
export function SupportNetworkScreen({
  supportNetwork,
  protegidoId,
  protegidoName,
  guardianName,
  share,
  now = () => new Date(),
  onBack,
}: SupportNetworkScreenProps) {
  const vm = useSupportNetworkViewModel(supportNetwork, protegidoId, guardianName, share);
  const today = now();

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <BackLink label="Mis menores" onPress={onBack} />
      <Text style={styles.title}>Red de apoyo de {protegidoName}</Text>
      <Text style={styles.subtitle}>Recibirán las alertas del menor.</Text>

      <Button title="Invitar a un contacto" onPress={vm.invite} loading={vm.isInviting} />
      <Text style={styles.empty}>{INVITE_NOTICE}</Text>
      {!!vm.errorMessage && <Text style={styles.error}>{vm.errorMessage}</Text>}

      {vm.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : vm.contacts.length === 0 ? (
        <Text style={styles.empty}>Todavía no has invitado a nadie.</Text>
      ) : (
        vm.contacts.map((contact) => {
          const status = contactStatus(contact, today);
          return (
            <View key={contact.id} style={styles.row}>
              <Text style={styles.rowTitle}>{contactLabel(contact, status)}</Text>
              <Text style={styles.rowSubtitle}>{contactStatusLabel(contact, status)}</Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
