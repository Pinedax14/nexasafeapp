import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { IconName } from './Button';
import { colors } from './colors';
import { fonts, TOUCH_TARGET } from './typography';

type TextFieldProps = TextInputProps & {
  icon?: IconName;
  error?: string;
};

let edgeRevealIconHidden = false;

/** En Edge/IE los <input type="password"> traen su propio ícono de "mostrar", que
 * se duplica con el nuestro. Solo aplica en web; en Android/iOS no existe ese ícono. */
function hideEdgeNativeRevealIcon() {
  if (Platform.OS !== 'web' || edgeRevealIconHidden) return;
  edgeRevealIconHidden = true;
  const style = document.createElement('style');
  style.textContent = 'input[type="password"]::-ms-reveal { display: none; }';
  document.head.appendChild(style);
}

/** Campo con ícono, borde morado al enfocarlo y botón para ver la contraseña. */
export function TextField({ icon, error, secureTextEntry, style, ...props }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (secureTextEntry) hideEdgeNativeRevealIcon();
  }, [secureTextEntry]);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.field,
          focused && styles.focused,
          !!error && styles.invalid,
          props.editable === false && styles.disabled,
        ]}
      >
        {icon && (
          <Ionicons name={icon} size={20} color={focused ? colors.primary : colors.textMuted} />
        )}
        <TextInput
          placeholderTextColor={colors.textMuted}
          {...props}
          secureTextEntry={secureTextEntry && hidden}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          style={[styles.input, style]}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setHidden((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar' : 'Ocultar'}
            hitSlop={8}
            style={styles.eye}
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  focused: { borderColor: colors.primary },
  invalid: { borderColor: colors.error },
  disabled: { opacity: 0.6 },
  input: { ...fonts.regular, flex: 1, paddingVertical: 14, fontSize: 16, color: colors.text },
  eye: { minWidth: TOUCH_TARGET / 2, alignItems: 'center' },
  error: { ...fonts.medium, marginTop: 6, color: colors.error, fontSize: 14 },
});
