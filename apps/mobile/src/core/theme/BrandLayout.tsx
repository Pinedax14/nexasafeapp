import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { BrandHeader } from './BrandHeader';
import { colors } from './colors';
import { formStyles } from './formStyles';

type BrandLayoutProps = {
  title: string;
  subtitle?: string;
  /** Contenido de la tarjeta blanca (formulario). */
  children: ReactNode;
  /** Botones o enlaces debajo de la tarjeta. */
  footer?: ReactNode;
};

/** Pantallas de ingreso: encabezado morado con el logo y una tarjeta encima. */
export function BrandLayout({ title, subtitle, children, footer }: BrandLayoutProps) {
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BrandHeader title={title} subtitle={subtitle} />
        <View style={[formStyles.card, styles.card]}>{children}</View>
        {!!footer && <View style={styles.footer}>{footer}</View>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingBottom: 32 },
  card: { marginTop: -32, marginHorizontal: 20 },
  footer: { marginTop: 16, marginHorizontal: 20 },
});
