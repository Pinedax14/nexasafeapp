import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from './Button';
import { Avatar, StatusPill } from './Pill';
import { TextField } from './TextField';

describe('Componentes de la interfaz (#97)', () => {
  it('Button avisa el toque y no responde mientras carga', async () => {
    const onPress = jest.fn();
    const { rerender } = await render(<Button title="Guardar" onPress={onPress} />);

    await fireEvent.press(screen.getByText('Guardar'));
    expect(onPress).toHaveBeenCalledTimes(1);

    await rerender(<Button title="Guardar" onPress={onPress} loading />);
    expect(screen.queryByText('Guardar')).toBeNull();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('TextField muestra el error y deja ver la contraseña', async () => {
    await render(
      <TextField
        accessibilityLabel="Contraseña"
        value="secreta"
        secureTextEntry
        error="Muy corta."
      />,
    );

    expect(screen.getByText('Muy corta.')).toBeTruthy();
    expect(screen.getByLabelText('Contraseña').props.secureTextEntry).toBe(true);
    await fireEvent.press(screen.getByLabelText('Mostrar'));
    expect(screen.getByLabelText('Contraseña').props.secureTextEntry).toBe(false);
  });

  it('Avatar usa las iniciales y StatusPill el texto del estado', async () => {
    await render(
      <>
        <Avatar name="ana maría pérez" />
        <StatusPill label="Activo" tone="success" />
      </>,
    );

    expect(screen.getByText('AM', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('Activo')).toBeTruthy();
  });
});
